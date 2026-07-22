/**
 * Drives online co-op Panzerkiste from React, on top of the Firebase transport.
 *
 * @module
 * @remarks
 * Panzerkiste is real-time, so it does not use the turn-based online core. This
 * hook runs a small host-authoritative net loop instead:
 *
 * - The host owns the simulation. Each animation frame it advances the world
 *   with its own input as player one and the guest's streamed input as player
 *   two, and a few times a second it publishes a {@link NetSnapshot}.
 * - The guest is a thin client. It streams its raw input to the host and draws
 *   the newest snapshot it has received; it never runs the simulation itself.
 *
 * Only two seats play (co-op), so the host is player one ("player") and the
 * guest is player two ("player2"). There is no host failover: if the host
 * leaves, the round ends.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  advance,
  enemiesLeft,
  IDLE_INPUT,
  minesLeft,
  restart,
  step,
} from "@/games/panzerkiste/engine/engine";
import { createGame } from "@/games/panzerkiste/engine/setup";
import type { GameState, Input, Phase } from "@/games/panzerkiste/engine/types";
import { draw } from "@/games/panzerkiste/components/render";
import {
  createTouchControls,
  drawTouchControls,
} from "@/games/panzerkiste/components/touch-controls";
import { createSmoke, stepSmoke } from "@/games/panzerkiste/components/smoke";
import { detectSounds } from "@/games/panzerkiste/audio/events";
import { createSoundPlayer } from "@/games/panzerkiste/audio/sounds";
import {
  canvasHeight,
  canvasWidth,
  unprojectFloor,
} from "@/games/panzerkiste/components/projection";
import {
  fromSnapshot,
  makeSeat,
  PANZERKISTE_GAME_ID,
  PANZERKISTE_GUARDS,
  toSnapshot,
  type NetSnapshot,
  type PanzerMove,
} from "@/games/panzerkiste/multiplayer/net";
import { database, signIn } from "@/online/firebase-app";
import { createFirebaseTransport } from "@/online/firebase-transport";
import type { RoomPhase, RoomState, Seat, SeatId } from "@/online/adapter";
import type { ChatMessage, RoomTransport } from "@/online/transport";

/** Milliseconds in a second, for turning frame timestamps into seconds. */
const MS_PER_SECOND = 1000;

/** How often the host publishes a snapshot, in seconds (about 20 per second). */
const PUBLISH_INTERVAL = 0.05;

/** How often the guest streams its input, in seconds (about 20 per second). */
const INPUT_INTERVAL = 0.05;

/** How long a cleared level stays on screen before the host moves on, seconds. */
const CLEARED_PAUSE = 1.5;

/** The two co-op seats: the host plus one guest. */
const COOP_PLAYERS = 2;

/** The name used when a player left theirs blank. */
const FALLBACK_NAME = "Spieler";

/** No per-seat private data changes hands in Panzerkiste. */
const EMPTY_HANDS: ReadonlyMap<SeatId, null> = new Map<SeatId, null>();

/** Keys that count as "move up/left/down/right". */
const UP_KEYS = new Set(["w", "arrowup"]);
const LEFT_KEYS = new Set(["a", "arrowleft"]);
const DOWN_KEYS = new Set(["s", "arrowdown"]);
const RIGHT_KEYS = new Set(["d", "arrowright"]);

/** Where the online flow currently is. */
export type OnlineStatus = "connecting" | "lobby" | "playing" | "error";

/** How a player enters a room. */
export type OnlineSession = {
  readonly mode: "host" | "guest";
  readonly code: string;
  readonly name: string;
};

/** The heads-up facts the online screen shows around the canvas. */
export type OnlineHud = {
  readonly phase: Phase;
  readonly level: number;
  readonly lives: number;
  readonly enemies: number;
  readonly mines: number;
};

/** What the online screen needs from the hook. */
export type PanzerkisteOnline = {
  readonly status: OnlineStatus;
  readonly seatId: SeatId | null;
  readonly isHost: boolean;
  /** The players present in the room, host first. */
  readonly seats: readonly Seat[];
  readonly hud: OnlineHud;
  /** Attach to the game `<canvas>` while playing. */
  readonly canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** Host only: deal the first level and begin the mission. */
  readonly start: () => void;
  /** Host only: start the mission over after it was won or lost. */
  readonly newMission: () => void;
  readonly messages: readonly ChatMessage[];
  readonly sendChat: (text: string) => void;
};

/**
 * Runs one online co-op Panzerkiste session.
 *
 * @param session - how to enter the room, or null before a room is chosen
 * @returns the room status, the canvas ref, the HUD and the room actions
 */
export function usePanzerkisteOnline(
  session: OnlineSession | null,
): PanzerkisteOnline {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [status, setStatus] = useState<OnlineStatus>("connecting");
  const [seatId, setSeatId] = useState<SeatId | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [seats, setSeats] = useState<readonly Seat[]>([]);
  const [messages, setMessages] = useState<readonly ChatMessage[]>([]);
  const [hud, setHud] = useState<OnlineHud>(EMPTY_HUD);

  // The networking and simulation live in refs so the tight loop never waits on
  // React and stale closures never read an old game state.
  const transportRef = useRef<RoomTransport<
    NetSnapshot,
    PanzerMove,
    null
  > | null>(null);
  const roleRef = useRef<"host" | "guest">("host");
  const seatIdRef = useRef<SeatId | null>(null);
  const codeRef = useRef("");
  const seatsRef = useRef<readonly Seat[]>([]);
  const nameRef = useRef(FALLBACK_NAME);
  const roomPhaseRef = useRef<RoomPhase>("lobby");
  const versionRef = useRef(0);
  const lastVersionRef = useRef(0);

  // Host: the authoritative world and the guest's latest input.
  const authRef = useRef<GameState | null>(null);
  const guestInputRef = useRef<PanzerMove>(IDLE_INPUT);
  const runningRef = useRef(false);
  const clearedForRef = useRef(0);
  // Guest: the newest snapshot and the state rebuilt from it (rebuilt only when
  // a fresh snapshot arrives, not every frame).
  const snapshotRef = useRef<NetSnapshot | null>(null);
  const renderedRef = useRef<{ snap: NetSnapshot; state: GameState } | null>(
    null,
  );

  // Local input, exactly as the single-player game reads it.
  const keys = useRef(new Set<string>());
  const mouse = useRef({ x: 0, y: 0 });
  const mouseInside = useRef(false);
  const firePending = useRef(false);
  const minePending = useRef(false);

  const hudRef = useRef(hud);
  const syncHud = useCallback((state: GameState) => {
    const next = hudOf(state);
    if (!sameHud(next, hudRef.current)) {
      hudRef.current = next;
      setHud(next);
    }
  }, []);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) =>
      prev.some((m) => m.id === message.id) ? prev : [...prev, message],
    );
  }, []);

  /** Publishes the host's authoritative world as the newest room snapshot. */
  const publishNow = useCallback(() => {
    const state = authRef.current;
    const transport = transportRef.current;
    const host = seatIdRef.current;
    if (state === null || transport === null || host === null) {
      return;
    }
    versionRef.current += 1;
    const room: RoomState<NetSnapshot> = {
      code: codeRef.current,
      hostId: host,
      seats: seatsRef.current,
      phase: roomPhaseRef.current,
      game: toSnapshot(state),
      version: versionRef.current,
    };
    void transport.publish(room, EMPTY_HANDS);
  }, []);

  const start = useCallback(() => {
    if (roleRef.current !== "host") {
      return;
    }
    authRef.current = createGame(freshSeed(), COOP_PLAYERS);
    clearedForRef.current = 0;
    runningRef.current = true;
    roomPhaseRef.current = "playing";
    syncHud(authRef.current);
    publishNow();
    setStatus("playing");
  }, [publishNow, syncHud]);

  const newMission = useCallback(() => {
    if (roleRef.current !== "host" || authRef.current === null) {
      return;
    }
    authRef.current = restart(authRef.current);
    clearedForRef.current = 0;
    runningRef.current = true;
    roomPhaseRef.current = "playing";
    syncHud(authRef.current);
    publishNow();
  }, [publishNow, syncHud]);

  const sendChat = useCallback((text: string) => {
    const transport = transportRef.current;
    const host = seatIdRef.current;
    const trimmed = text.trim();
    if (transport === null || host === null || trimmed.length === 0) {
      return;
    }
    void transport.sendChat({
      seatId: host,
      name: nameRef.current,
      text: trimmed,
    });
  }, []);

  // Connect to the room: sign in, wire the transport, and take a role.
  useEffect(() => {
    if (session === null) {
      return;
    }
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset to connecting on a new session
    setStatus("connecting");
    lastVersionRef.current = 0;
    versionRef.current = 0;
    snapshotRef.current = null;
    renderedRef.current = null;
    authRef.current = null;
    runningRef.current = false;
    nameRef.current = session.name.trim() || FALLBACK_NAME;
    codeRef.current = session.code;

    const connect = async (): Promise<void> => {
      const uid = await signIn();
      if (cancelled) {
        return;
      }
      seatIdRef.current = uid;
      setSeatId(uid);
      const asHost = session.mode === "host";
      roleRef.current = asHost ? "host" : "guest";
      setIsHost(asHost);
      roomPhaseRef.current = "lobby";

      const transport = createFirebaseTransport<NetSnapshot, PanzerMove, null>(
        database(),
        PANZERKISTE_GAME_ID,
        session.code,
        PANZERKISTE_GUARDS,
      );
      transportRef.current = transport;

      transport.onChat(addMessage);
      transport.onMembers((members) => {
        seatsRef.current = members;
        setSeats(members);
      });

      if (asHost) {
        transport.onIntents((intent) => {
          // The one co-op guest always drives player two.
          guestInputRef.current = intent.move;
        });
        await transport.markHost(uid);
      } else {
        transport.onShared((room) => {
          if (room.version <= lastVersionRef.current) {
            return;
          }
          lastVersionRef.current = room.version;
          seatsRef.current = room.seats;
          setSeats(room.seats);
          if (room.game !== null) {
            snapshotRef.current = room.game;
          }
          if (room.phase === "playing") {
            setStatus("playing");
          }
        });
      }

      await transport.join(makeSeat(uid, nameRef.current, asHost));
      if (!cancelled) {
        setStatus((current) => (current === "connecting" ? "lobby" : current));
      }
    };

    connect().catch(() => {
      if (!cancelled) {
        setStatus("error");
      }
    });

    return () => {
      cancelled = true;
      void transportRef.current?.disconnect();
      transportRef.current = null;
      runningRef.current = false;
    };
  }, [session, addMessage]);

  // The render/input loop, active only while a round is on screen.
  const playing = status === "playing";
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d") ?? null;
    if (!playing || canvas === null || ctx === null) {
      return;
    }

    const aimAt = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const cx = ((event.clientX - rect.left) / rect.width) * canvas.width;
      const cy = ((event.clientY - rect.top) / rect.height) * canvas.height;
      mouse.current = unprojectFloor(cx, cy);
      mouseInside.current = true;
    };
    const onLeave = () => {
      mouseInside.current = false;
    };
    const onDown = (event: MouseEvent) => {
      event.preventDefault();
      aimAt(event);
      firePending.current = true;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (isGameKey(key)) {
        event.preventDefault();
      }
      if (key === " " && !keys.current.has(" ")) {
        minePending.current = true;
      }
      keys.current.add(key);
    };
    const onKeyUp = (event: KeyboardEvent) =>
      keys.current.delete(event.key.toLowerCase());
    const onBlur = () => keys.current.clear();

    // Twin-stick touch controls for phones; idle (never engaged) on desktop.
    const touch = createTouchControls(canvas);

    canvas.addEventListener("mousemove", aimAt);
    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("contextmenu", (event) => event.preventDefault());
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    const readInput = (): Input => {
      const held = keys.current;
      const axis = (positive: Set<string>, negative: Set<string>) =>
        (anyHeld(held, positive) ? 1 : 0) - (anyHeld(held, negative) ? 1 : 0);
      const finger = touch.sample();
      const fireEdge = touch.consumeFire();
      const mineEdge = touch.consumeMine();
      let move = {
        x: axis(RIGHT_KEYS, LEFT_KEYS),
        y: axis(DOWN_KEYS, UP_KEYS),
      };
      let aim = mouse.current;
      if (finger.engaged) {
        // The left stick drives; a right tap aims at that floor spot (the same
        // world point for host and guest) and fires, a long press lays a mine.
        move = finger.move;
        aim = finger.aim;
      }
      const fire = firePending.current || fireEdge;
      const layMine = minePending.current || mineEdge;
      firePending.current = false;
      minePending.current = false;
      return { move, aim, fire, layMine };
    };

    // View-only dust/smoke trailing the shells.
    const smoke = createSmoke();
    // Sound effects, driven by comparing successive states this client sees.
    const sound = createSoundPlayer();
    let soundPrev: GameState | null = null;
    let announcedStart = false;
    const emitSounds = (cur: GameState, isPlaying: boolean): void => {
      if (isPlaying && !announcedStart) {
        announcedStart = true;
        sound.play("roundStart");
      }
      if (soundPrev !== null) {
        for (const event of detectSounds(soundPrev, cur)) {
          sound.play(event);
        }
      }
      soundPrev = cur;
    };
    // Whether this client is driving its own tank right now (own input only).
    const moveNow = (): boolean => {
      const held = keys.current;
      const finger = touch.sample();
      const kx =
        (anyHeld(held, RIGHT_KEYS) ? 1 : 0) -
        (anyHeld(held, LEFT_KEYS) ? 1 : 0);
      const ky =
        (anyHeld(held, DOWN_KEYS) ? 1 : 0) - (anyHeld(held, UP_KEYS) ? 1 : 0);
      const move = finger.engaged ? finger.move : { x: kx, y: ky };
      return move.x !== 0 || move.y !== 0;
    };

    let raf = 0;
    let last = performance.now();
    let sincePublish = 0;
    let sinceInput = 0;
    const frame = (now: number) => {
      const dt = (now - last) / MS_PER_SECOND;
      last = now;
      const pointer = mouseInside.current ? mouse.current : null;

      if (roleRef.current === "host") {
        stepHost(dt);
        sincePublish += dt;
        if (sincePublish >= PUBLISH_INTERVAL) {
          sincePublish = 0;
          publishNow();
        }
        const state = authRef.current;
        if (state !== null) {
          resizeTo(canvas, state);
          stepSmoke(smoke, state.bullets, dt);
          draw(ctx, state, pointer, smoke);
          drawTouchControls(ctx, touch.sample());
          syncHud(state);
          emitSounds(state, roomPhaseRef.current === "playing");
          sound.setMoving(state.phase === "playing" && moveNow());
        }
      } else {
        sinceInput += dt;
        if (sinceInput >= INPUT_INTERVAL) {
          sinceInput = 0;
          const host = seatIdRef.current;
          if (host !== null) {
            void transportRef.current?.sendIntent({
              seatId: host,
              move: readInput(),
            });
          }
        }
        const state = guestState(snapshotRef.current, renderedRef);
        if (state !== null) {
          resizeTo(canvas, state);
          stepSmoke(smoke, state.bullets, dt);
          draw(ctx, state, pointer, smoke);
          drawTouchControls(ctx, touch.sample());
          syncHud(state);
          emitSounds(state, state.phase === "playing");
          sound.setMoving(state.phase === "playing" && moveNow());
        }
      }
      raf = window.requestAnimationFrame(frame);
    };

    // Advances the host world: auto-move on past a cleared level, else simulate.
    const stepHost = (dt: number) => {
      const state = authRef.current;
      if (state === null || !runningRef.current) {
        return;
      }
      if (state.phase === "cleared") {
        clearedForRef.current += dt;
        if (clearedForRef.current >= CLEARED_PAUSE) {
          clearedForRef.current = 0;
          authRef.current = advance(state);
        }
      } else {
        clearedForRef.current = 0;
        authRef.current = step(state, readInput(), dt, guestInputRef.current);
      }
    };

    raf = window.requestAnimationFrame(frame);
    return () => {
      window.cancelAnimationFrame(raf);
      sound.dispose();
      touch.dispose();
      canvas.removeEventListener("mousemove", aimAt);
      canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [playing, publishNow, syncHud]);

  return {
    status,
    seatId,
    isHost,
    seats,
    hud,
    canvasRef,
    start,
    newMission,
    messages,
    sendChat,
  };
}

/**
 * The guest's renderable state for the newest snapshot.
 *
 * @param snap - the newest snapshot received, or null before the first one
 * @param cache - a ref holding the last snapshot and the state built from it
 * @returns the state to draw, or null if no snapshot has arrived yet
 * @remarks
 * Rebuilding a state from a snapshot reloads the level grid, so it is done once
 * per snapshot (about twenty times a second) and reused for the frames in
 * between, not on every animation frame.
 */
function guestState(
  snap: NetSnapshot | null,
  cache: React.RefObject<{ snap: NetSnapshot; state: GameState } | null>,
): GameState | null {
  let result: GameState | null = null;
  if (snap !== null) {
    const cached = cache.current;
    if (cached !== null && cached.snap === snap) {
      result = cached.state;
    } else {
      result = fromSnapshot(snap);
      cache.current = { snap, state: result };
    }
  }
  return result;
}

/** The HUD shown before any state exists. */
const EMPTY_HUD: OnlineHud = {
  phase: "playing",
  level: 0,
  lives: 0,
  enemies: 0,
  mines: 0,
};

/** The HUD snapshot for a state. */
function hudOf(state: GameState): OnlineHud {
  return {
    phase: state.phase,
    level: state.level,
    lives: state.lives,
    enemies: enemiesLeft(state),
    mines: minesLeft(state),
  };
}

/** Whether two HUD snapshots show the same thing. */
function sameHud(a: OnlineHud, b: OnlineHud): boolean {
  return (
    a.phase === b.phase &&
    a.level === b.level &&
    a.lives === b.lives &&
    a.enemies === b.enemies &&
    a.mines === b.mines
  );
}

/** Sizes the canvas to the tilted arena the state needs. */
function resizeTo(canvas: HTMLCanvasElement, state: GameState): void {
  const width = Math.round(canvasWidth(state.cols));
  const height = Math.round(canvasHeight(state.rows));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

/** A varied seed for a fresh mission, from the wall clock. */
function freshSeed(): number {
  return Date.now();
}

/** Whether any of the given keys is currently held. */
function anyHeld(held: Set<string>, keys: Set<string>): boolean {
  let found = false;
  for (const key of keys) {
    if (held.has(key)) {
      found = true;
    }
  }
  return found;
}

/** Whether a key is one the game consumes, so the page should not scroll. */
function isGameKey(key: string): boolean {
  return (
    key === " " ||
    UP_KEYS.has(key) ||
    LEFT_KEYS.has(key) ||
    DOWN_KEYS.has(key) ||
    RIGHT_KEYS.has(key)
  );
}
