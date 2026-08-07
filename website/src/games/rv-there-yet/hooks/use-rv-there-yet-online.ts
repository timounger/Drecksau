/**
 * Drives online co-op "RV There Yet?" from React, on top of the Firebase
 * transport.
 *
 * @module
 * @remarks
 * The drive is real-time, so it does not use the turn-based online core. This
 * hook runs a small host-authoritative net loop instead:
 *
 * - The host owns the world. Each animation frame it advances it with its own
 *   input as person one and the guest's streamed input as person two, and about
 *   twenty times a second it publishes a {@link NetSnapshot}.
 * - The guest is a thin client. It streams its raw input to the host and draws
 *   the newest snapshot it has received; it never runs the engine itself.
 *
 * Both people share one motorhome, and the engine decides which of them is at
 * the wheel: whoever got in first. That rule lives in the engine rather than
 * here, so it holds for the solo game, for the host and for the guest without
 * being written down three times.
 *
 * There is no host failover: if the host leaves, the drive ends.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  reachableAnchor,
  ropeCandidate,
  step,
} from "@/games/rv-there-yet/engine/engine";
import { startAt, theMap } from "@/games/rv-there-yet/engine/setup";
import { draw } from "@/games/rv-there-yet/components/render";
import {
  createControls,
  type TouchButton,
} from "@/games/rv-there-yet/hooks/controls";
import { hudOf, sameHud, type Hud } from "@/games/rv-there-yet/hooks/hud";
import {
  loadSection,
  saveSection,
} from "@/games/rv-there-yet/settings/progress";
import {
  COOP_PLAYERS,
  fromSnapshot,
  hasPress,
  makeSeat,
  RV_GAME_ID,
  RV_GUARDS,
  toSnapshot,
  withoutPresses,
  type NetSnapshot,
  type RvMove,
} from "@/games/rv-there-yet/multiplayer/net";
import { IDLE_INPUT, type GameState } from "@/games/rv-there-yet/engine/types";
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

/** Where a brand-new drive begins. */
const FIRST_SECTION = 0;

/** The name used when a player left theirs blank. */
const FALLBACK_NAME = "Spieler";

/** Nobody holds anything privately on this drive. */
const EMPTY_HANDS: ReadonlyMap<SeatId, null> = new Map<SeatId, null>();

/** Where the online flow currently is. */
export type OnlineStatus = "connecting" | "lobby" | "playing" | "error";

/** How a player enters a room. */
export type OnlineSession = {
  readonly mode: "host" | "guest";
  readonly code: string;
  readonly name: string;
};

/** What the online screen needs from the hook. */
export type RvThereYetOnline = {
  readonly status: OnlineStatus;
  readonly seatId: SeatId | null;
  readonly isHost: boolean;
  /** The players present in the room, host first. */
  readonly seats: readonly Seat[];
  readonly hud: Hud;
  /** Attach to the game `<canvas>` while playing. */
  readonly canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** Host only: begin the drive at the host's own last section. */
  readonly start: () => void;
  /** Host only: start the current section over. */
  readonly again: () => void;
  /** Host only: start the whole map over at the first section. */
  readonly newGame: () => void;
  /** Presses or releases one of the on-screen buttons. */
  readonly touch: (button: TouchButton, down: boolean) => void;
  /** Puts a gear in, as the gear buttons do. */
  readonly shift: (gear: number) => void;
  /** Takes the thing in that bag slot into the hand. */
  readonly pick: (slot: number) => void;
  readonly messages: readonly ChatMessage[];
  readonly sendChat: (text: string) => void;
};

/**
 * Runs one online co-op drive.
 *
 * @param session - how to enter the room, or null before a room is chosen
 * @returns the room status, the canvas ref, the heads-up facts and the actions
 */
export function useRvThereYetOnline(
  session: OnlineSession | null,
): RvThereYetOnline {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [status, setStatus] = useState<OnlineStatus>("connecting");
  const [seatId, setSeatId] = useState<SeatId | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [seats, setSeats] = useState<readonly Seat[]>([]);
  const [messages, setMessages] = useState<readonly ChatMessage[]>([]);
  const [hud, setHud] = useState<Hud>(() => emptyHud());

  // The networking and the world live in refs so the tight loop never waits on
  // React and stale closures never read an old state.
  const transportRef = useRef<RoomTransport<NetSnapshot, RvMove, null> | null>(
    null,
  );
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
  const guestInputRef = useRef<RvMove>(IDLE_INPUT);
  const runningRef = useRef(false);
  // Guest: the newest snapshot the host sent.
  const snapshotRef = useRef<NetSnapshot | null>(null);

  /**
   * The guest's input for this frame, with its presses used up.
   *
   * @returns what the guest is doing right now
   * @remarks
   * A guest's input arrives twenty times a second and is held until the next
   * one comes, so the host sees the same input for two or three frames running.
   * That is right for a held pedal and wrong for a press: applied three times
   * over, one tap on the door would open it, shut it and open it again. So the
   * presses are taken out of the stored input the moment they are handed on.
   */
  const takeGuestInput = useCallback((): RvMove => {
    const said = guestInputRef.current;
    if (hasPress(said)) {
      guestInputRef.current = withoutPresses(said);
    }
    return said;
  }, []);

  const controlsRef = useRef(createControls());

  const hudRef = useRef(hud);
  const syncHud = useCallback(
    (state: GameState, ready: number, candidate: number, me: number) => {
      const next = hudOf(state, {
        ready,
        candidate,
        running: runningRef.current,
        me,
      });
      if (!sameHud(next, hudRef.current)) {
        hudRef.current = next;
        setHud(next);
      }
    },
    [],
  );

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

  /** Host only: deals a fresh world at a section and starts the drive. */
  const dealAt = useCallback(
    (section: number) => {
      if (roleRef.current !== "host") {
        return;
      }
      authRef.current = startAt(section, COOP_PLAYERS);
      runningRef.current = true;
      roomPhaseRef.current = "playing";
      publishNow();
      setStatus("playing");
    },
    [publishNow],
  );

  const start = useCallback(() => {
    // The host's own saved progress decides where the two of them set off -
    // somebody has to choose, and it is their room.
    dealAt(loadSection());
  }, [dealAt]);

  const again = useCallback(() => {
    dealAt(authRef.current?.section ?? loadSection());
  }, [dealAt]);

  const newGame = useCallback(() => {
    dealAt(FIRST_SECTION);
  }, [dealAt]);

  const sendChat = useCallback((text: string) => {
    const transport = transportRef.current;
    const me = seatIdRef.current;
    const trimmed = text.trim();
    if (transport === null || me === null || trimmed.length === 0) {
      return;
    }
    void transport.sendChat({
      seatId: me,
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

      const transport = createFirebaseTransport<NetSnapshot, RvMove, null>(
        database(),
        RV_GAME_ID,
        session.code,
        RV_GUARDS,
      );
      transportRef.current = transport;

      transport.onChat(addMessage);
      transport.onMembers((members) => {
        seatsRef.current = members;
        setSeats(members);
      });

      if (asHost) {
        transport.onIntents((intent) => {
          // The one co-op guest is always person two.
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
            runningRef.current = true;
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

  // The render/input loop, active only while a drive is on screen.
  const playing = status === "playing";
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d") ?? null;
    if (!playing || canvas === null || ctx === null) {
      return;
    }
    const controls = controlsRef.current;
    const stopListening = controls.listen(window);
    // Person zero is the host's, person one the guest's - for the whole drive.
    const me = roleRef.current === "host" ? 0 : 1;
    /** The section already written to storage, so it is saved on change. */
    let savedSection = loadSection();

    let raf = 0;
    let last = performance.now();
    let sincePublish = 0;
    let sinceInput = 0;

    const frame = (now: number) => {
      const dt = (now - last) / MS_PER_SECOND;
      last = now;
      const route = theMap();
      const shown =
        roleRef.current === "host" ? authRef.current : snapshotRef.current;
      const mine = shown?.people[me] ?? shown?.people[0] ?? null;
      const inside = mine?.inside ?? false;

      if (roleRef.current === "host") {
        const state = authRef.current;
        if (state !== null && runningRef.current && state.phase === "driving") {
          authRef.current = step(
            state,
            route,
            [controls.read(inside), takeGuestInput()],
            dt,
          );
        }
        sincePublish += dt;
        if (sincePublish >= PUBLISH_INTERVAL) {
          sincePublish = 0;
          publishNow();
        }
      } else {
        // Only read when about to send. A press - a door, a gear, the rope - is
        // an edge that the first read swallows, so reading sixty times a second
        // and sending twenty would throw two out of three of them away.
        sinceInput += dt;
        if (sinceInput >= INPUT_INTERVAL) {
          sinceInput = 0;
          const seat = seatIdRef.current;
          if (seat !== null) {
            void transportRef.current?.sendIntent({
              seatId: seat,
              move: controls.read(inside),
            });
          }
        }
      }

      const world =
        roleRef.current === "host"
          ? authRef.current
          : snapshotRef.current === null
            ? null
            : fromSnapshot(snapshotRef.current);
      if (world !== null) {
        const person = world.people[me] ?? world.people[0];
        const ready = reachableAnchor(person, world, route);
        const candidate = ropeCandidate(world, route);
        syncHud(world, ready, candidate, me);
        draw(
          ctx,
          world,
          route,
          candidate,
          ready,
          Math.min(me, world.people.length - 1),
        );
        // Both of them get to keep the progress they drove to together.
        if (world.section !== savedSection) {
          savedSection = world.section;
          saveSection(savedSection);
        }
      }
      raf = window.requestAnimationFrame(frame);
    };

    raf = window.requestAnimationFrame(frame);
    return () => {
      window.cancelAnimationFrame(raf);
      stopListening();
    };
  }, [playing, publishNow, syncHud, takeGuestInput]);

  return {
    status,
    seatId,
    isHost,
    seats,
    hud,
    canvasRef,
    start,
    again,
    newGame,
    shift: (gear: number) => controlsRef.current.shift(gear),
    pick: (slot: number) => controlsRef.current.pick(slot),
    touch: (button, down) => controlsRef.current.press(button, down),
    messages,
    sendChat,
  };
}

/** The heads-up facts before any world exists. */
function emptyHud(): Hud {
  return hudOf(startAt(0, COOP_PLAYERS), {
    ready: -1,
    candidate: -1,
    running: false,
    me: 0,
  });
}
