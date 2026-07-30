/**
 * Drives online Krakel Orakel from React, on top of the Firebase transport.
 *
 * @module
 * @remarks
 * Krakel Orakel is real-time, so it runs a small host-authoritative net loop
 * rather than the turn-based online core:
 *
 * - The host owns the {@link KrakelGame}. Each animation frame it advances the
 *   clock ({@link tick}) and a few times a second publishes a
 *   {@link NetSnapshot}. It applies every client's move: strokes while the round
 *   is drawn, and struck words from whoever is on turn afterwards.
 * - A guest is a thin client. It renders the newest snapshot and streams its own
 *   strokes and picks to the host.
 * - Each player's term rides only in their own private hand, so no client ever
 *   receives another player's word before the reveal.
 *
 * The one thing a client keeps for itself is its own drawing: while the round is
 * being drawn the snapshot carries no strokes at all (they are still secret), so
 * every client renders its own board from a local copy and only sees the others
 * once the boards are laid open.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  addStroke,
  clearStrokes,
  createGame,
  excludeWord,
  readyUp,
  restartGame,
  tick,
  undoStroke,
  type KrakelGame,
} from "@/games/krakel/engine/game";
import {
  DECOY_COUNT,
  PALETTE,
  PEN_WIDTHS,
  SNAP_MAX_JUMP,
  SNAP_TOLERANCE,
  type KrakelPhase,
  type Point,
  type Stroke,
} from "@/games/krakel/engine/types";
import { maxScore } from "@/games/krakel/engine/scoring";
import {
  BOARD_ASPECT,
  krakelBoard,
  snapToBoard,
} from "@/games/krakel/engine/boards";
import { drawBoard } from "@/games/krakel/components/krakel-canvas";
import {
  KRAKEL_GAME_ID,
  KRAKEL_GUARDS,
  makeSeat,
  toHands,
  toSnapshot,
  type BoardLine,
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

/** The shortest gap between two published snapshots, in seconds. */
const PUBLISH_INTERVAL = 0.09;

/** Fixed drawing resolution; CSS scales it to the container. The height
 * follows the printed board's shape, so the dot pattern is never stretched. */
const CANVAS_W = 960;
const CANVAS_H = Math.round(CANVAS_W / BOARD_ASPECT);

/** Smallest move (normalised) that adds a new point, to thin dense input. */
const MIN_POINT_DIST = 0.004;

/** The name used when a player left theirs blank. */
const FALLBACK_NAME = "Spieler";

/** A synthetic sender for the game's own announcements in chat. */
const ORACLE_SEAT = "orakel";
const ORACLE_NAME = "Orakel";

/**
 * The attribute an open board's canvas names its seat with.
 *
 * @remarks
 * One stable ref callback serves every board; it reads the seat from the
 * element instead of the hook having to build a callback per seat while
 * rendering. {@link BOARD_SEAT_DATA} is the same name as `dataset` spells it.
 */
export const BOARD_SEAT_ATTR = "data-krakel-seat";
const BOARD_SEAT_DATA = "krakelSeat";

/** Where the online flow currently is. */
export type OnlineStatus = "connecting" | "lobby" | "playing" | "error";

/** How a player enters a room. */
export type OnlineSession = {
  readonly mode: "host" | "guest";
  readonly code: string;
  readonly name: string;
};

/** One player's board, as the screen shows it. */
export type KrakelBoardView = {
  readonly seatId: SeatId;
  readonly name: string;
  readonly isMe: boolean;
  /** Whether this player has declared their drawing finished. */
  readonly ready: boolean;
  /** The term this board pictured, once the round reveals; else null. */
  readonly term: string | null;
};

/** One word on the round's list. */
export type KrakelWordView = {
  readonly word: string;
  readonly struck: boolean;
  /** Once struck: whether nobody had really drawn it. */
  readonly wasDecoy: boolean | null;
  /** Once struck: who struck it. */
  readonly byName: string | null;
  /** True for the word I drew myself - only ever set in my own view. */
  readonly isMine: boolean;
};

/** Everything the board shows around the canvases. */
export type KrakelView = {
  readonly phase: KrakelPhase;
  readonly round: number;
  readonly totalRounds: number;
  /** Milliseconds since the epoch at which the current phase ends. */
  readonly deadline: number;
  /** My own secret term, from my private hand. */
  readonly myWord: string | null;
  readonly iAmReady: boolean;
  readonly readyCount: number;
  readonly boards: readonly KrakelBoardView[];
  readonly words: readonly KrakelWordView[];
  /** Whose turn it is to strike a word, or null outside that phase. */
  readonly pickerName: string | null;
  readonly iAmPicker: boolean;
  /** The team's running score. */
  readonly score: number;
  /** What the team scored in the current round. */
  readonly roundScore: number;
  /** How many words are struck, and how many have to go in all. */
  readonly struckCount: number;
  readonly toStrike: number;
  /** The best score the team could reach over the whole game. */
  readonly bestPossible: number;
};

/** The pointer handlers to spread onto my own drawing canvas. */
export type KrakelPen = {
  readonly onPointerDown: (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => void;
  readonly onPointerMove: (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => void;
  readonly onPointerUp: () => void;
  readonly onPointerCancel: () => void;
};

/** A player's pen tools. */
export type KrakelTools = {
  readonly color: string;
  readonly width: number;
  readonly setColor: (color: string) => void;
  readonly setWidth: (width: number) => void;
  readonly clear: () => void;
  readonly undo: () => void;
  /** Declares my drawing finished, so the round can move on early. */
  readonly ready: () => void;
};

/** What the online screen needs from the hook. */
export type KrakelOnline = {
  readonly status: OnlineStatus;
  readonly seatId: SeatId | null;
  readonly isHost: boolean;
  readonly seats: readonly Seat[];
  /** The board view while playing, or null before the game starts. */
  readonly view: KrakelView | null;
  /** Attach to my own `<canvas>` while I draw. */
  readonly drawCanvasRef: (element: HTMLCanvasElement | null) => () => void;
  /**
   * Attach to every open board's `<canvas>`, together with a
   * {@link BOARD_SEAT_ATTR} attribute naming the seat it shows.
   */
  readonly boardCanvasRef: (
    element: HTMLCanvasElement | null,
  ) => (() => void) | undefined;
  /** Spread onto my own `<canvas>` so the pen follows the pointer. */
  readonly pen: KrakelPen;
  readonly tools: KrakelTools;
  readonly messages: readonly ChatMessage[];
  /** Strikes a word off the round's list, on my turn. */
  readonly exclude: (word: string) => void;
  /** Sends a chat line. */
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
 * @returns the room status, the board view, the canvas refs and the actions
 */
export function useKrakelOnline(session: OnlineSession | null): KrakelOnline {
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
  // My own term this round, from my private hand.
  const myTermRef = useRef<string | null>(null);
  // My own strokes, kept locally: they are secret until the boards open, so the
  // snapshot cannot carry them back to me while I draw.
  const myStrokesRef = useRef<Stroke[]>([]);
  const lastRoundRef = useRef(0);

  // Live drawing input.
  const drawCanvasElRef = useRef<HTMLCanvasElement | null>(null);
  const boardCanvasesRef = useRef(new Map<SeatId, HTMLCanvasElement>());
  const colorRef = useRef(color);
  const widthRef = useRef(width);
  const localStrokeRef = useRef<Stroke | null>(null);
  const drawingRef = useRef(false);
  // My board's dots, looked up again when I am dealt a different board.
  const dotsRef = useRef<{ boardId: number; dots: readonly Point[] }>({
    boardId: Number.NaN,
    dots: [],
  });

  const viewSigRef = useRef("");
  // The key of the newest published snapshot, so the host only writes on change.
  const publishedKeyRef = useRef("");
  const messageIdsRef = useRef(new Set<string>());

  const drawCanvasRef = useCallback((element: HTMLCanvasElement | null) => {
    drawCanvasElRef.current = element;
    return () => {
      drawCanvasElRef.current = null;
    };
  }, []);

  // One stable callback for every open board; each canvas names its seat in a
  // data attribute, so no per-seat callback has to be built while rendering.
  const boardCanvasRef = useCallback((element: HTMLCanvasElement | null) => {
    const id = element?.dataset[BOARD_SEAT_DATA];
    let cleanup: (() => void) | undefined;
    if (element !== null && id !== undefined) {
      boardCanvasesRef.current.set(id, element);
      cleanup = () => {
        boardCanvasesRef.current.delete(id);
      };
    }
    return cleanup;
  }, []);

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

  /** Publishes the host's authoritative game as the newest room snapshot. */
  const publishNow = useCallback(() => {
    const game = gameRef.current;
    const transport = transportRef.current;
    const host = seatIdRef.current;
    if (game === null || transport === null || host === null) {
      return;
    }
    const snapshot = toSnapshot(game);
    // Remember what went out, so the loop does not send the same state twice.
    publishedKeyRef.current = snapshotKey(snapshot);
    versionRef.current += 1;
    const room: RoomState<NetSnapshot> = {
      code: codeRef.current,
      hostId: host,
      seats: seatsRef.current,
      phase: "playing",
      game: snapshot,
      version: versionRef.current,
    };
    void transport.publish(room, toHands(game));
  }, []);

  /** Host: strikes a word for a player and announces how it went. */
  const resolveExclude = useCallback(
    (from: SeatId, word: string) => {
      const game = gameRef.current;
      if (game === null) {
        return;
      }
      const outcome = excludeWord(game, from, word, Date.now());
      if (outcome.result === "excluded") {
        gameRef.current = outcome.game;
        publishNow();
        const entry = outcome.game.excluded[outcome.game.excluded.length - 1];
        const name = nameFor(seatsRef.current, from);
        const verdict = entry.wasDecoy
          ? `${"✅"} ${name} streicht "${word}" - das hat niemand gemalt!`
          : `${"❌"} ${name} streicht "${word}" - das war gemalt!`;
        void transportRef.current?.sendChat({
          seatId: ORACLE_SEAT,
          name: ORACLE_NAME,
          text: verdict,
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
      if (move.kind === "exclude") {
        resolveExclude(from, move.word);
      } else {
        gameRef.current = applyDrawing(game, from, move);
      }
    },
    [resolveExclude],
  );

  /** Dispatches a local drawing action: apply it as host, or send it as guest. */
  const dispatchDraw = useCallback((move: KrakelMove) => {
    const me = seatIdRef.current;
    if (me === null) {
      return;
    }
    if (roleRef.current === "host") {
      const game = gameRef.current;
      if (game !== null) {
        gameRef.current = applyDrawing(game, me, move);
      }
    } else {
      void transportRef.current?.sendIntent({ seatId: me, move });
    }
  }, []);

  const exclude = useCallback(
    (word: string) => {
      const me = seatIdRef.current;
      if (me === null) {
        return;
      }
      if (roleRef.current === "host") {
        resolveExclude(me, word);
      } else {
        void transportRef.current?.sendIntent({
          seatId: me,
          move: { kind: "exclude", word },
        });
      }
    },
    [resolveExclude],
  );

  const sendMessage = useCallback((text: string) => {
    const transport = transportRef.current;
    const me = seatIdRef.current;
    const trimmed = text.trim();
    if (transport !== null && me !== null && trimmed.length > 0) {
      void transport.sendChat({
        seatId: me,
        name: nameRef.current,
        text: trimmed,
      });
    }
  }, []);

  const start = useCallback(() => {
    if (roleRef.current !== "host") {
      return;
    }
    const order = seatsRef.current.map((seat) => seat.id);
    gameRef.current = createGame(order, freshSeed(), Date.now());
    runningRef.current = true;
    myStrokesRef.current = [];
    lastRoundRef.current = 1;
    publishNow();
    setStatus("playing");
  }, [publishNow]);

  const newGame = useCallback(() => {
    const game = gameRef.current;
    if (roleRef.current !== "host" || game === null) {
      return;
    }
    gameRef.current = restartGame(game, freshSeed(), Date.now());
    myStrokesRef.current = [];
    lastRoundRef.current = 1;
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

  /** Whether I may still put ink on my board right now. */
  const canDraw = useCallback((): boolean => {
    const snap = currentSnapshot(roleRef.current, gameRef, snapRef);
    const mine = myBoard(snap, seatIdRef.current);
    return snap !== null && snap.phase === "drawing" && mine?.ready === false;
  }, []);

  /**
   * Snaps a raw pointer point onto my template, or null if it is off the lines.
   * The template is (re)built lazily when my krakel seed changes.
   */
  const snapPoint = useCallback((raw: Point): Point | null => {
    const snap = currentSnapshot(roleRef.current, gameRef, snapRef);
    const mine = myBoard(snap, seatIdRef.current);
    let point: Point | null = null;
    if (mine !== null) {
      if (dotsRef.current.boardId !== mine.boardId) {
        dotsRef.current = {
          boardId: mine.boardId,
          dots: krakelBoard(mine.boardId),
        };
      }
      point = snapToBoard(dotsRef.current.dots, raw, SNAP_TOLERANCE);
    }
    return point;
  }, []);

  /** Starts a fresh stroke at a snapped point. */
  const beginLocal = useCallback((point: Point) => {
    localStrokeRef.current = {
      color: colorRef.current,
      width: widthRef.current,
      points: [point],
    };
  }, []);

  /** Commits the in-progress stroke (a pen lift), if it has anything on it. */
  const commitLocal = useCallback(() => {
    const stroke = localStrokeRef.current;
    if (stroke !== null) {
      localStrokeRef.current = null;
      myStrokesRef.current = [...myStrokesRef.current, stroke];
      dispatchDraw({ kind: "stroke", stroke });
    }
  }, [dispatchDraw]);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!canDraw()) {
        return;
      }
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      drawingRef.current = true;
      localStrokeRef.current = null;
      const point = snapPoint(normalizePointer(event));
      if (point !== null) {
        beginLocal(point);
      }
    },
    [canDraw, snapPoint, beginLocal],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drawingRef.current) {
        return;
      }
      const point = snapPoint(normalizePointer(event));
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
    },
    [snapPoint, beginLocal, commitLocal],
  );

  const onPointerUp = useCallback(() => {
    if (drawingRef.current) {
      drawingRef.current = false;
      commitLocal();
    }
  }, [commitLocal]);

  // The net/render loop, active while a round is on screen.
  const playing = status === "playing";
  useEffect(() => {
    if (!playing) {
      return;
    }

    /** Drops my local drawing cache when a new round starts. */
    const resetOnNewRound = (snap: NetSnapshot) => {
      if (snap.round !== lastRoundRef.current) {
        lastRoundRef.current = snap.round;
        myStrokesRef.current = [];
        localStrokeRef.current = null;
        drawingRef.current = false;
      }
    };

    /** Paints my own board, from my local strokes so the pen never lags. */
    const renderMine = (snap: NetSnapshot) => {
      const canvas = drawCanvasElRef.current;
      const context = canvas?.getContext("2d") ?? null;
      const mine = myBoard(snap, seatIdRef.current);
      if (canvas !== null && context !== null && mine !== null) {
        sizeCanvas(canvas);
        drawBoard(context, {
          boardId: mine.boardId,
          strokes: myStrokesRef.current,
          live: localStrokeRef.current,
          width: CANVAS_W,
          height: CANVAS_H,
        });
      }
    };

    /** Paints every open board from the snapshot. */
    const renderBoards = (snap: NetSnapshot) => {
      for (const [id, canvas] of boardCanvasesRef.current) {
        const line = snap.boards.find((board) => board.seatId === id);
        const context = canvas.getContext("2d");
        if (line !== undefined && context !== null) {
          sizeCanvas(canvas);
          // My own board is only authoritative once it has been published.
          const own = id === seatIdRef.current && snap.phase === "drawing";
          drawBoard(context, {
            boardId: line.boardId,
            strokes: own ? myStrokesRef.current : line.strokes,
            live: own ? localStrokeRef.current : null,
            width: CANVAS_W,
            height: CANVAS_H,
          });
        }
      }
    };

    const syncView = (snap: NetSnapshot) => {
      // The host deals the terms, so it reads its own straight off the game
      // instead of waiting for the hand it just published to come back.
      const me = seatIdRef.current;
      const myTerm =
        roleRef.current === "host" && me !== null
          ? (gameRef.current?.terms[me] ?? null)
          : myTermRef.current;
      const next = viewOf(snap, seatsRef.current, seatIdRef.current, myTerm);
      const signature = viewSignature(next);
      if (signature !== viewSigRef.current) {
        viewSigRef.current = signature;
        setView(next);
      }
    };

    let sincePublish = 0;
    /**
     * Publishes the host's game, but only when a client would see a difference.
     *
     * @remarks
     * Nothing streams continuously any more: while the round is drawn every
     * board goes out empty, and once they are open they never change again. So
     * the snapshot only moves on a phase change, a finished drawing or a struck
     * word - and republishing six full drawings every frame would be pure
     * waste. The interval is only a floor on how fast two changes may follow
     * each other.
     */
    const publishIfChanged = (dt: number, snap: NetSnapshot) => {
      sincePublish += dt;
      if (sincePublish >= PUBLISH_INTERVAL) {
        sincePublish = 0;
        if (snapshotKey(snap) !== publishedKeyRef.current) {
          publishNow();
        }
      }
    };

    let raf = 0;
    let last = performance.now();
    const frame = (nowMs: number) => {
      const dt = (nowMs - last) / MS_PER_SECOND;
      last = nowMs;
      const now = Date.now();

      const host = roleRef.current === "host" && runningRef.current;
      if (host && gameRef.current !== null) {
        gameRef.current = tick(gameRef.current, now);
      }

      const snap = currentSnapshot(roleRef.current, gameRef, snapRef);
      if (snap !== null) {
        if (host) {
          publishIfChanged(dt, snap);
        }
        resetOnNewRound(snap);
        renderMine(snap);
        renderBoards(snap);
        syncView(snap);
      }
      raf = window.requestAnimationFrame(frame);
    };

    raf = window.requestAnimationFrame(frame);
    return () => window.cancelAnimationFrame(raf);
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
    ready: useCallback(() => {
      localStrokeRef.current = null;
      drawingRef.current = false;
      dispatchDraw({ kind: "ready" });
    }, [dispatchDraw]),
  };

  return {
    status,
    seatId,
    isHost,
    seats,
    view,
    drawCanvasRef,
    boardCanvasRef,
    pen: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
    tools,
    messages,
    exclude,
    sendMessage,
    start,
    newGame,
  };
}

/** Applies a drawing action (not an exclusion) to one player's board. */
function applyDrawing(
  game: KrakelGame,
  id: string,
  move: KrakelMove,
): KrakelGame {
  let result = game;
  if (move.kind === "stroke") {
    result = addStroke(game, id, move.stroke);
  } else if (move.kind === "clear") {
    result = clearStrokes(game, id);
  } else if (move.kind === "undo") {
    result = undoStroke(game, id);
  } else if (move.kind === "ready") {
    result = readyUp(game, id);
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

/** My own board line in a snapshot, or null before I have one. */
function myBoard(
  snap: NetSnapshot | null,
  mySeatId: SeatId | null,
): BoardLine | null {
  return snap?.boards.find((board) => board.seatId === mySeatId) ?? null;
}

/** Builds the board view from a snapshot. */
function viewOf(
  snap: NetSnapshot,
  seats: readonly Seat[],
  mySeatId: SeatId | null,
  myTerm: string | null,
): KrakelView {
  const mine = myBoard(snap, mySeatId);
  const struck = new Map(snap.excluded.map((entry) => [entry.word, entry]));
  return {
    phase: snap.phase,
    round: snap.round,
    totalRounds: snap.totalRounds,
    deadline: snap.deadline,
    // I always know my own word - I drew it - even while it is still secret
    // from the others.
    myWord: myTerm ?? mine?.term ?? null,
    iAmReady: mine?.ready ?? false,
    readyCount: snap.boards.filter((board) => board.ready).length,
    boards: snap.boards.map((board) => ({
      seatId: board.seatId,
      name: nameFor(seats, board.seatId),
      isMe: board.seatId === mySeatId,
      ready: board.ready,
      term: board.term,
    })),
    words: snap.candidates.map((word) => {
      const entry = struck.get(word);
      return {
        word,
        struck: entry !== undefined,
        wasDecoy: entry?.wasDecoy ?? null,
        byName: entry === undefined ? null : nameFor(seats, entry.seatId),
        isMine: myTerm !== null && word === myTerm,
      };
    }),
    pickerName: snap.pickerId === null ? null : nameFor(seats, snap.pickerId),
    iAmPicker: snap.pickerId !== null && snap.pickerId === mySeatId,
    score: snap.score,
    roundScore: snap.roundScore,
    struckCount: snap.excluded.length,
    toStrike: DECOY_COUNT,
    bestPossible: maxScore(),
  };
}

/**
 * A short key of everything a client renders from a snapshot.
 *
 * @param snap - the snapshot about to be published
 * @returns a string that changes exactly when the snapshot's meaning does
 * @remarks
 * Covers each board by its stroke count rather than its strokes: a board only
 * ever grows while its own player draws, and the moment it is published it is
 * finished, so the count moves whenever the drawing does.
 */
function snapshotKey(snap: NetSnapshot): string {
  return [
    snap.phase,
    snap.round,
    snap.deadline,
    snap.score,
    snap.roundScore,
    snap.pickerId ?? "",
    snap.candidates.join(","),
    snap.excluded.map((entry) => `${entry.word}:${entry.wasDecoy}`).join(","),
    snap.boards
      .map(
        (board) =>
          `${board.seatId}:${board.ready}:${board.strokes.length}:${board.term ?? ""}`,
      )
      .join(","),
  ].join("|");
}

/** A short signature of the view, so it only re-renders on a real change. */
function viewSignature(view: KrakelView): string {
  return [
    view.phase,
    view.round,
    view.deadline,
    view.myWord ?? "",
    view.iAmReady,
    view.readyCount,
    view.iAmPicker,
    view.score,
    view.struckCount,
    view.boards.map((board) => `${board.seatId}:${board.term ?? ""}`).join(","),
    view.words.map((word) => `${word.word}:${word.wasDecoy ?? ""}`).join(","),
  ].join("|");
}

/** The name of a seat, or a fallback if it has left. */
function nameFor(seats: readonly Seat[], seatId: SeatId): string {
  return seats.find((seat) => seat.id === seatId)?.name ?? FALLBACK_NAME;
}

/** Where a pointer event landed, on the normalised 0..1 canvas. */
function normalizePointer(event: React.PointerEvent<HTMLCanvasElement>): Point {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;
  return { x: clamp01(x), y: clamp01(y) };
}

/** Gives a canvas the fixed drawing resolution, once; CSS scales it from there. */
function sizeCanvas(canvas: HTMLCanvasElement): void {
  if (canvas.width !== CANVAS_W) {
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
  }
}

/** Clamps a coordinate into [0, 1]. */
function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/** A varied seed for a fresh game, from the wall clock. */
function freshSeed(): number {
  return Date.now() >>> 0;
}
