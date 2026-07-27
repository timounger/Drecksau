/**
 * Drives online Krakel Orakel from React, on top of the Firebase transport.
 *
 * @module
 * @remarks
 * Krakel Orakel is real-time, so it runs a small host-authoritative net loop
 * rather than the turn-based online core:
 *
 * - The host owns the {@link KrakelGame}. Each animation frame it advances the
 *   clock ({@link tick}) and a few times a second publishes a {@link NetSnapshot}.
 *   It applies every client's move: drawing actions from the round's drawer, and
 *   guesses from the others (scoring them and announcing correct ones in chat).
 * - A guest is a thin client. It renders the newest snapshot; when it is the
 *   drawer it streams its strokes to the host, and it streams its guesses too.
 * - The secret term rides only in the drawer's private hand, so a guesser's
 *   client never receives it.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  addStroke,
  clearStrokes,
  createGame,
  drawerId,
  restartGame,
  setLive,
  submitGuess,
  tick,
  undoStroke,
  type KrakelGame,
} from "@/games/krakel/engine/game";
import {
  PALETTE,
  PEN_WIDTHS,
  SNAP_MAX_JUMP,
  SNAP_TOLERANCE,
  type KrakelPhase,
  type Point,
  type Stroke,
} from "@/games/krakel/engine/types";
import {
  krakelTemplate,
  snapToTemplate,
  templatePoints,
} from "@/games/krakel/engine/krakel-path";
import { drawBoard } from "@/games/krakel/components/krakel-canvas";
import {
  KRAKEL_GAME_ID,
  KRAKEL_GUARDS,
  makeSeat,
  toSnapshot,
  type KrakelHand,
  type KrakelMove,
  type NetSnapshot,
} from "@/games/krakel/multiplayer/net";
import { database, signIn } from "@/online/firebase-app";
import { createFirebaseTransport } from "@/online/firebase-transport";
import type { RoomState, Seat, SeatId } from "@/online/adapter";
import type { ChatMessage, RoomTransport } from "@/online/transport";

/** Milliseconds in a second, for turning frame timestamps into seconds. */
const MS_PER_SECOND = 1000;

/** How often the host publishes a snapshot, in seconds. */
const PUBLISH_INTERVAL = 0.09;

/** How often a drawer streams its in-progress stroke, in seconds. */
const LIVE_INTERVAL = 0.05;

/** Fixed drawing resolution; CSS scales it to the container. */
const CANVAS_W = 960;
const CANVAS_H = 600;

/** Smallest move (normalised) that adds a new point, to thin dense input. */
const MIN_POINT_DIST = 0.004;

/** The name used when a player left theirs blank. */
const FALLBACK_NAME = "Spieler";

/** A synthetic sender for the game's own announcements in chat. */
const ORACLE_SEAT = "orakel";
const ORACLE_NAME = "Orakel";

/** Where the online flow currently is. */
export type OnlineStatus = "connecting" | "lobby" | "playing" | "error";

/** How a player enters a room. */
export type OnlineSession = {
  readonly mode: "host" | "guest";
  readonly code: string;
  readonly name: string;
};

/** One player's line on the board's scoreboard. */
export type KrakelPlayer = {
  readonly seatId: SeatId;
  readonly name: string;
  readonly score: number;
  readonly isDrawer: boolean;
  readonly hasGuessed: boolean;
  readonly isMe: boolean;
};

/** Everything the board shows around the canvas. */
export type KrakelView = {
  readonly phase: KrakelPhase;
  readonly round: number;
  readonly totalRounds: number;
  readonly drawerName: string;
  readonly iAmDrawer: boolean;
  readonly canGuess: boolean;
  /** The word to show me: my term while I draw, or the answer once revealed. */
  readonly word: string | null;
  readonly termLength: number;
  /** Milliseconds since the epoch at which the current phase ends. */
  readonly deadline: number;
  readonly players: readonly KrakelPlayer[];
  readonly guessedCount: number;
  readonly guessersTotal: number;
};

/** The drawer's pen tools. */
export type KrakelTools = {
  readonly color: string;
  readonly width: number;
  readonly setColor: (color: string) => void;
  readonly setWidth: (width: number) => void;
  readonly clear: () => void;
  readonly undo: () => void;
};

/** What the online screen needs from the hook. */
export type KrakelOnline = {
  readonly status: OnlineStatus;
  readonly seatId: SeatId | null;
  readonly isHost: boolean;
  readonly seats: readonly Seat[];
  /** The board view while playing, or null before the game starts. */
  readonly view: KrakelView | null;
  /** Attach to the board `<canvas>` while playing. */
  readonly canvasRef: React.RefObject<HTMLCanvasElement | null>;
  readonly tools: KrakelTools;
  readonly messages: readonly ChatMessage[];
  /** Sends a guess (while guessing) or a chat line (otherwise). */
  readonly sendMessage: (text: string) => void;
  /** Host only: deal the first round and begin. */
  readonly start: () => void;
  /** Host only: start a fresh game after the last round. */
  readonly newGame: () => void;
};

/**
 * Runs one online Krakel Orakel session.
 *
 * @param session - how to enter the room, or null before a room is chosen
 * @returns the room status, the board view, the canvas ref and the actions
 */
export function useKrakelOnline(session: OnlineSession | null): KrakelOnline {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [status, setStatus] = useState<OnlineStatus>("connecting");
  const [seatId, setSeatId] = useState<SeatId | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [seats, setSeats] = useState<readonly Seat[]>([]);
  const [messages, setMessages] = useState<readonly ChatMessage[]>([]);
  const [view, setView] = useState<KrakelView | null>(null);
  const [color, setColorState] = useState<string>(PALETTE[0]);
  const [width, setWidthState] = useState<number>(PEN_WIDTHS[1]);

  // Networking and simulation live in refs so the loop never waits on React.
  const transportRef = useRef<RoomTransport<
    NetSnapshot,
    KrakelMove,
    KrakelHand
  > | null>(null);
  const roleRef = useRef<"host" | "guest">("host");
  const seatIdRef = useRef<SeatId | null>(null);
  const codeRef = useRef("");
  const seatsRef = useRef<readonly Seat[]>([]);
  const nameRef = useRef(FALLBACK_NAME);
  const versionRef = useRef(0);
  const lastVersionRef = useRef(0);
  const runningRef = useRef(false);

  // Host: the authoritative game. Guest: the newest snapshot.
  const gameRef = useRef<KrakelGame | null>(null);
  const snapRef = useRef<NetSnapshot | null>(null);
  // A guest's own term (when it is the drawer), from its private hand.
  const myTermRef = useRef<string | null>(null);
  // A guest-drawer's own strokes, rendered locally for a lag-free pen.
  const myStrokesRef = useRef<Stroke[]>([]);
  const lastRoundRef = useRef(0);

  // Live drawing input.
  const colorRef = useRef(color);
  const widthRef = useRef(width);
  const localStrokeRef = useRef<Stroke | null>(null);
  const drawingRef = useRef(false);
  const lastLiveSentRef = useRef(0);
  // The current round's template points, rebuilt when the krakel seed changes.
  const templateRef = useRef<{ seed: number; points: readonly Point[] }>({
    seed: Number.NaN,
    points: [],
  });

  const viewSigRef = useRef("");
  const messageIdsRef = useRef(new Set<string>());

  const setColor = useCallback((next: string) => {
    colorRef.current = next;
    setColorState(next);
  }, []);
  const setWidth = useCallback((next: number) => {
    widthRef.current = next;
    setWidthState(next);
  }, []);

  const addMessage = useCallback((message: ChatMessage) => {
    if (!messageIdsRef.current.has(message.id)) {
      messageIdsRef.current.add(message.id);
      setMessages((prev) => [...prev, message]);
    }
  }, []);

  /** Sends a plain chat line as this player. */
  const sendChatLine = useCallback((text: string) => {
    const transport = transportRef.current;
    const id = seatIdRef.current;
    const trimmed = text.trim();
    if (transport !== null && id !== null && trimmed.length > 0) {
      void transport.sendChat({
        seatId: id,
        name: nameRef.current,
        text: trimmed,
      });
    }
  }, []);

  /** Publishes the host's authoritative game as the newest room snapshot. */
  const publishNow = useCallback(() => {
    const game = gameRef.current;
    const transport = transportRef.current;
    const host = seatIdRef.current;
    if (game === null || transport === null || host === null) {
      return;
    }
    versionRef.current += 1;
    const room: RoomState<NetSnapshot> = {
      code: codeRef.current,
      hostId: host,
      seats: seatsRef.current,
      phase: "playing",
      game: toSnapshot(game),
      version: versionRef.current,
    };
    const hands = new Map<SeatId, KrakelHand>([
      [drawerId(game), { term: game.term }],
    ]);
    void transport.publish(room, hands);
  }, []);

  /** Host: resolves a guess, scoring correct ones and echoing the rest to chat. */
  const resolveGuess = useCallback(
    (from: SeatId, text: string) => {
      const game = gameRef.current;
      if (game === null) {
        return;
      }
      const outcome = submitGuess(game, from, text);
      gameRef.current = outcome.game;
      const name = nameFor(seatsRef.current, from);
      if (outcome.result === "correct") {
        publishNow();
        void transportRef.current?.sendChat({
          seatId: ORACLE_SEAT,
          name: ORACLE_NAME,
          text: `${"✅"} ${name} hat den Begriff erraten!`,
        });
      } else if (outcome.result === "wrong") {
        void transportRef.current?.sendChat({
          seatId: from,
          name,
          text: text.trim(),
        });
      }
    },
    [publishNow],
  );

  /** Host: applies one client's move to the authoritative game. */
  const applyIntent = useCallback(
    (from: SeatId, move: KrakelMove) => {
      const game = gameRef.current;
      if (game === null) {
        return;
      }
      if (move.kind === "guess") {
        resolveGuess(from, move.text);
      } else if (from === drawerId(game) && game.phase === "drawing") {
        gameRef.current = applyDrawing(game, move);
      }
    },
    [resolveGuess],
  );

  /** Dispatches a local drawing action: apply it as host, or send it as guest. */
  const dispatchDraw = useCallback((move: KrakelMove) => {
    if (roleRef.current === "host") {
      const game = gameRef.current;
      const me = seatIdRef.current;
      if (game !== null && me !== null && me === drawerId(game)) {
        gameRef.current = applyDrawing(game, move);
      }
    } else {
      const me = seatIdRef.current;
      if (me !== null) {
        void transportRef.current?.sendIntent({ seatId: me, move });
      }
    }
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (trimmed.length === 0) {
        return;
      }
      const current = view;
      const me = seatIdRef.current;
      if (current !== null && current.canGuess && me !== null) {
        if (roleRef.current === "host") {
          resolveGuess(me, trimmed);
        } else {
          void transportRef.current?.sendIntent({
            seatId: me,
            move: { kind: "guess", text: trimmed },
          });
        }
      } else {
        sendChatLine(trimmed);
      }
    },
    [view, resolveGuess, sendChatLine],
  );

  const start = useCallback(() => {
    if (roleRef.current !== "host") {
      return;
    }
    const order = seatsRef.current.map((seat) => seat.id);
    gameRef.current = createGame(order, freshSeed(), Date.now());
    runningRef.current = true;
    publishNow();
    setStatus("playing");
  }, [publishNow]);

  const newGame = useCallback(() => {
    const game = gameRef.current;
    if (roleRef.current !== "host" || game === null) {
      return;
    }
    gameRef.current = restartGame(game, freshSeed(), Date.now());
    publishNow();
  }, [publishNow]);

  // Connect to the room: sign in, wire the transport, take a role.
  useEffect(() => {
    if (session === null) {
      return;
    }
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset on a new session
    setStatus("connecting");
    lastVersionRef.current = 0;
    versionRef.current = 0;
    snapRef.current = null;
    gameRef.current = null;
    runningRef.current = false;
    myStrokesRef.current = [];
    myTermRef.current = null;
    lastRoundRef.current = 0;
    messageIdsRef.current = new Set<string>();
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

      const transport = createFirebaseTransport<
        NetSnapshot,
        KrakelMove,
        KrakelHand
      >(database(), KRAKEL_GAME_ID, session.code, KRAKEL_GUARDS);
      transportRef.current = transport;

      transport.onChat(addMessage);
      transport.onMembers((members) => {
        seatsRef.current = members;
        setSeats(members);
      });
      transport.onHand(uid, (hand) => {
        myTermRef.current = hand.term;
      });

      if (asHost) {
        transport.onIntents((intent) =>
          applyIntent(intent.seatId, intent.move),
        );
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
            snapRef.current = room.game;
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
  }, [session, addMessage, applyIntent]);

  // The render/input loop, active only while a round is on screen.
  const playing = status === "playing";
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d") ?? null;
    if (!playing || canvas === null || ctx === null) {
      return;
    }
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;

    const norm = (event: PointerEvent): Point => {
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      return { x: clamp01(x), y: clamp01(y) };
    };
    const iAmDrawer = (): boolean => {
      const snap = currentSnapshot(roleRef.current, gameRef, snapRef);
      return snap !== null && snap.drawerId === seatIdRef.current;
    };
    const canDraw = (): boolean => {
      const snap = currentSnapshot(roleRef.current, gameRef, snapRef);
      return snap !== null && snap.phase === "drawing" && iAmDrawer();
    };
    // Snaps a raw pointer point onto the round's template, or null if off the
    // lines. The template is (re)built lazily when the krakel seed changes.
    const snapPoint = (raw: Point): Point | null => {
      const snapshot = currentSnapshot(roleRef.current, gameRef, snapRef);
      if (snapshot === null) {
        return null;
      }
      if (templateRef.current.seed !== snapshot.krakelSeed) {
        templateRef.current = {
          seed: snapshot.krakelSeed,
          points: templatePoints(krakelTemplate(snapshot.krakelSeed)),
        };
      }
      return snapToTemplate(templateRef.current.points, raw, SNAP_TOLERANCE);
    };
    // Starts a fresh stroke at a snapped point.
    const beginLocal = (point: Point) => {
      localStrokeRef.current = {
        color: colorRef.current,
        width: widthRef.current,
        points: [point],
      };
    };
    // Commits the in-progress stroke (a pen lift), if it has anything on it.
    const commitLocal = () => {
      const stroke = localStrokeRef.current;
      if (stroke !== null) {
        localStrokeRef.current = null;
        myStrokesRef.current = [...myStrokesRef.current, stroke];
        dispatchDraw({ kind: "stroke", stroke });
      }
    };

    const onDown = (event: PointerEvent) => {
      if (!canDraw()) {
        return;
      }
      event.preventDefault();
      canvas.setPointerCapture(event.pointerId);
      drawingRef.current = true;
      localStrokeRef.current = null;
      lastLiveSentRef.current = 0;
      const point = snapPoint(norm(event));
      if (point !== null) {
        beginLocal(point);
      }
    };
    const onMove = (event: PointerEvent) => {
      if (!drawingRef.current) {
        return;
      }
      const point = snapPoint(norm(event));
      if (point === null) {
        // Off the lines: the pen lifts, ending any current stroke.
        commitLocal();
        return;
      }
      const stroke = localStrokeRef.current;
      if (stroke === null) {
        beginLocal(point);
        return;
      }
      const last = stroke.points[stroke.points.length - 1];
      const gap = Math.hypot(point.x - last.x, point.y - last.y);
      if (gap > SNAP_MAX_JUMP) {
        // The snap jumped to a far line: lift and start fresh, never bridge it.
        commitLocal();
        beginLocal(point);
      } else if (gap >= MIN_POINT_DIST) {
        localStrokeRef.current = {
          ...stroke,
          points: [...stroke.points, point],
        };
      }
    };
    const onUp = () => {
      if (!drawingRef.current) {
        return;
      }
      drawingRef.current = false;
      commitLocal();
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    /** Streams the guest-drawer's in-progress stroke, throttled. */
    const streamLive = (dt: number) => {
      if (!drawingRef.current || localStrokeRef.current === null) {
        return;
      }
      lastLiveSentRef.current += dt;
      if (roleRef.current === "host") {
        const game = gameRef.current;
        if (game !== null) {
          gameRef.current = setLive(game, localStrokeRef.current);
        }
      } else if (lastLiveSentRef.current >= LIVE_INTERVAL) {
        lastLiveSentRef.current = 0;
        dispatchDraw({ kind: "live", stroke: localStrokeRef.current });
      }
    };

    /** A guest clears its own drawing cache when a new round starts. */
    const resetOnNewRound = () => {
      const snap = snapRef.current;
      if (
        roleRef.current === "guest" &&
        snap !== null &&
        snap.round !== lastRoundRef.current
      ) {
        lastRoundRef.current = snap.round;
        myStrokesRef.current = [];
        localStrokeRef.current = null;
        drawingRef.current = false;
        myTermRef.current = null;
      }
    };

    const renderScene = (context: CanvasRenderingContext2D) => {
      const snap = currentSnapshot(roleRef.current, gameRef, snapRef);
      if (snap === null) {
        return;
      }
      const mine = iAmDrawer();
      const strokes =
        roleRef.current === "guest" && mine
          ? myStrokesRef.current
          : snap.strokes;
      const live =
        mine && localStrokeRef.current !== null
          ? localStrokeRef.current
          : snap.live;
      drawBoard(context, {
        krakelSeed: snap.krakelSeed,
        strokes,
        live,
        width: CANVAS_W,
        height: CANVAS_H,
      });
    };

    const syncView = () => {
      const snap = currentSnapshot(roleRef.current, gameRef, snapRef);
      if (snap === null) {
        return;
      }
      const myTerm =
        roleRef.current === "host"
          ? (gameRef.current?.term ?? null)
          : myTermRef.current;
      const next = viewOf(snap, seatsRef.current, seatIdRef.current, myTerm);
      const signature = viewSignature(next);
      if (signature !== viewSigRef.current) {
        viewSigRef.current = signature;
        setView(next);
      }
    };

    let raf = 0;
    let last = performance.now();
    let sincePublish = 0;
    const frame = (nowMs: number) => {
      const dt = (nowMs - last) / MS_PER_SECOND;
      last = nowMs;
      const now = Date.now();

      if (roleRef.current === "host" && runningRef.current && gameRef.current) {
        gameRef.current = tick(gameRef.current, now);
        sincePublish += dt;
        if (sincePublish >= PUBLISH_INTERVAL) {
          sincePublish = 0;
          publishNow();
        }
      }

      streamLive(dt);
      resetOnNewRound();
      renderScene(ctx);
      syncView();
      raf = window.requestAnimationFrame(frame);
    };

    raf = window.requestAnimationFrame(frame);
    return () => {
      window.cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, [playing, publishNow, dispatchDraw]);

  const tools: KrakelTools = {
    color,
    width,
    setColor,
    setWidth,
    clear: useCallback(() => {
      myStrokesRef.current = [];
      dispatchDraw({ kind: "clear" });
    }, [dispatchDraw]),
    undo: useCallback(() => {
      myStrokesRef.current = myStrokesRef.current.slice(0, -1);
      dispatchDraw({ kind: "undo" });
    }, [dispatchDraw]),
  };

  return {
    status,
    seatId,
    isHost,
    seats,
    view,
    canvasRef,
    tools,
    messages,
    sendMessage,
    start,
    newGame,
  };
}

/** Applies a drawing action (not a guess) to the game. */
function applyDrawing(game: KrakelGame, move: KrakelMove): KrakelGame {
  let result = game;
  if (move.kind === "stroke") {
    result = addStroke(setLive(game, null), move.stroke);
  } else if (move.kind === "live") {
    result = setLive(game, move.stroke);
  } else if (move.kind === "clear") {
    result = clearStrokes(game);
  } else if (move.kind === "undo") {
    result = undoStroke(game);
  }
  return result;
}

/** The snapshot to render/read from: the host's game or the guest's snapshot. */
function currentSnapshot(
  role: "host" | "guest",
  gameRef: React.RefObject<KrakelGame | null>,
  snapRef: React.RefObject<NetSnapshot | null>,
): NetSnapshot | null {
  return role === "host"
    ? gameRef.current === null
      ? null
      : toSnapshot(gameRef.current)
    : snapRef.current;
}

/** Builds the board view from a snapshot. */
function viewOf(
  snap: NetSnapshot,
  seats: readonly Seat[],
  mySeatId: SeatId | null,
  myTerm: string | null,
): KrakelView {
  const iAmDrawer = snap.drawerId === mySeatId;
  const iGuessed = mySeatId !== null && snap.guessed.includes(mySeatId);
  const players = snap.scores
    .map((line) => ({
      seatId: line.seatId,
      name: nameFor(seats, line.seatId),
      score: line.score,
      isDrawer: line.seatId === snap.drawerId,
      hasGuessed: snap.guessed.includes(line.seatId),
      isMe: line.seatId === mySeatId,
    }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return {
    phase: snap.phase,
    round: snap.round,
    totalRounds: snap.totalRounds,
    drawerName: nameFor(seats, snap.drawerId),
    iAmDrawer,
    canGuess: snap.phase === "drawing" && !iAmDrawer && !iGuessed,
    word: iAmDrawer ? myTerm : snap.revealTerm,
    termLength: snap.termLength,
    deadline: snap.deadline,
    players,
    guessedCount: snap.guessed.length,
    guessersTotal: Math.max(0, snap.scores.length - 1),
  };
}

/** A short signature of the view, so it only re-renders on a real change. */
function viewSignature(view: KrakelView): string {
  return [
    view.phase,
    view.round,
    view.deadline,
    view.word ?? "",
    view.iAmDrawer,
    view.canGuess,
    view.guessedCount,
    view.players.map((p) => `${p.seatId}:${p.score}:${p.hasGuessed}`).join(","),
  ].join("|");
}

/** The name of a seat, or a fallback if it has left. */
function nameFor(seats: readonly Seat[], seatId: SeatId): string {
  return seats.find((seat) => seat.id === seatId)?.name ?? FALLBACK_NAME;
}

/** Clamps a coordinate into [0, 1]. */
function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/** A varied seed for a fresh game, from the wall clock. */
function freshSeed(): number {
  return Date.now() >>> 0;
}
