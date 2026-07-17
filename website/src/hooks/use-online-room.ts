/**
 * Drives one online room from React: connects, seats players, runs the referee.
 *
 * @module
 * @remarks
 * The host holds the authoritative room and is the only one that changes it -
 * on a guest's intent, on its own move, or when the lobby's membership changes.
 * A guest only sends intents and renders what the host publishes, its own hand
 * merged back in. All the network lives behind a {@link RoomTransport}; this
 * hook is the glue, so the referee itself ({@link ./multiplayer/room}) stays
 * pure and tested.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Card } from "@/game/cards";
import type { Move } from "@/game/state";
import { MAX_PLAYERS } from "@/game/setup";
import { database, signIn } from "@/multiplayer/firebase-app";
import { createFirebaseTransport } from "@/multiplayer/firebase-transport";
import { redactHands, withOwnHand } from "@/multiplayer/online-state";
import {
  applySeatMove,
  createRoom,
  startGame,
  type RoomState,
  type Seat,
  type SeatId,
} from "@/multiplayer/room";
import type { RoomTransport } from "@/multiplayer/transport";

/** What the player wants to do: host a new room or join one by code. */
export type OnlineSession = {
  readonly mode: "host" | "guest";
  /** The room code, shared to invite others. */
  readonly code: string;
  /** The player's display name. */
  readonly name: string;
};

/** Deck choices for the game the host is about to start. */
export type StartChoices = {
  readonly withExpansion: boolean;
  readonly withDefense: boolean;
};

/** Where the connection stands. */
export type OnlineStatus =
  "idle" | "connecting" | "lobby" | "playing" | "finished" | "error";

/** What the hook exposes to the online UI. */
export type OnlineRoom = {
  readonly status: OnlineStatus;
  /** This player's seat id, once signed in. */
  readonly seatId: SeatId | null;
  readonly isHost: boolean;
  /** The room to render - a guest's own hand is already merged in. */
  readonly room: RoomState | null;
  /** A human-readable error, when {@link status} is "error". */
  readonly error: string | null;
  /** Host only: deal the cards and begin. */
  readonly start: (choices: StartChoices) => void;
  /** Play a move - applied directly by the host, sent as an intent by a guest. */
  readonly sendMove: (move: Move) => void;
};

/** Fallback name for a player who left the field empty. */
const DEFAULT_PLAYER_NAME = "Spieler";

/** How long a guest waits for the room before giving up. */
const JOIN_TIMEOUT_MS = 12_000;

/** The actions the async setup wires up, reached through a ref to stay fresh. */
type RoomActions = {
  start: (choices: StartChoices) => void;
  sendMove: (move: Move) => void;
};

/**
 * Connects to a room and drives it.
 *
 * @param session - what to do, or null to stay idle until the player chooses
 * @returns the room state and the actions the UI needs
 */
export function useOnlineRoom(session: OnlineSession | null): OnlineRoom {
  const [status, setStatus] = useState<OnlineStatus>("idle");
  const [room, setRoom] = useState<RoomState | null>(null);
  const [seatId, setSeatId] = useState<SeatId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const actionsRef = useRef<RoomActions | null>(null);

  useEffect(() => {
    if (session === null) {
      return;
    }

    let cancelled = false;
    let transport: RoomTransport | null = null;
    // A new session starts fresh; the async connect below drives it from here.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset on new session
    setStatus("connecting");
    setError(null);

    /** Reports a fatal problem, unless the effect was already torn down. */
    const fail = (message: string) => {
      if (!cancelled) {
        setError(message);
        setStatus("error");
      }
    };

    connect(session, (t) => (transport = t), fail, {
      cancelled: () => cancelled,
      setStatus,
      setRoom,
      setSeatId,
      actionsRef,
    });

    return () => {
      cancelled = true;
      actionsRef.current = null;
      void transport?.disconnect();
    };
  }, [session]);

  const start = useCallback((choices: StartChoices) => {
    actionsRef.current?.start(choices);
  }, []);

  const sendMove = useCallback((move: Move) => {
    actionsRef.current?.sendMove(move);
  }, []);

  return {
    status,
    seatId,
    isHost: session?.mode === "host",
    room,
    error,
    start,
    sendMove,
  };
}

/** The bits of React state the async setup is allowed to touch. */
type Sinks = {
  cancelled: () => boolean;
  setStatus: (status: OnlineStatus) => void;
  setRoom: (room: RoomState) => void;
  setSeatId: (seatId: SeatId) => void;
  actionsRef: { current: RoomActions | null };
};

/** Signs in, opens the transport, and wires up host or guest handling. */
async function connect(
  session: OnlineSession,
  keepTransport: (transport: RoomTransport) => void,
  fail: (message: string) => void,
  sinks: Sinks,
): Promise<void> {
  try {
    const uid = await signIn();
    if (sinks.cancelled()) {
      return;
    }
    sinks.setSeatId(uid);

    const transport = createFirebaseTransport(database(), session.code);
    keepTransport(transport);

    const seat: Seat = {
      id: uid,
      name: session.name.trim() || DEFAULT_PLAYER_NAME,
      isHost: session.mode === "host",
    };

    if (session.mode === "host") {
      await runHost(transport, seat, session.code, sinks);
    } else {
      await runGuest(transport, seat, uid, sinks);
    }
  } catch {
    fail(
      "Verbindung fehlgeschlagen. Ist die Firebase-Einrichtung abgeschlossen?",
    );
  }
}

/** Runs the host: seats players, refereess moves, publishes every change. */
async function runHost(
  transport: RoomTransport,
  seat: Seat,
  code: string,
  sinks: Sinks,
): Promise<void> {
  let authoritative = createRoom(code, seat);

  /** Stores, publishes and shows a new authoritative room. */
  const commit = (next: RoomState) => {
    authoritative = next;
    void publishRoom(transport, next);
    if (!sinks.cancelled()) {
      sinks.setRoom(next);
      sinks.setStatus(phaseToStatus(next.phase));
    }
  };

  sinks.actionsRef.current = {
    start: (choices) => {
      if (authoritative.phase === "lobby") {
        commit(startGame(authoritative, { seed: freshSeed(), ...choices }));
      }
    },
    sendMove: (move) => {
      commit(applySeatMove(authoritative, seat.id, move));
    },
  };

  await transport.join(seat);

  // In the lobby the seat list follows who is present. Once the game is on,
  // the seats are frozen - a mid-game presence change must not renumber them.
  transport.onMembers((members) => {
    if (authoritative.phase === "lobby") {
      commit({
        ...authoritative,
        seats: members.slice(0, MAX_PLAYERS),
        version: authoritative.version + 1,
      });
    }
  });

  transport.onIntents((intent) => {
    commit(applySeatMove(authoritative, intent.seatId, intent.move));
  });

  commit(authoritative);
}

/** Runs a guest: sends intents, renders the host's snapshots with its own hand. */
async function runGuest(
  transport: RoomTransport,
  seat: Seat,
  uid: SeatId,
  sinks: Sinks,
): Promise<void> {
  let shared: RoomState | null = null;
  let ownHand: readonly Card[] = [];

  const render = () => {
    if (shared === null || sinks.cancelled()) {
      return;
    }
    const view = mergeGuestView(shared, uid, ownHand);
    sinks.setRoom(view);
    sinks.setStatus(phaseToStatus(view.phase));
  };

  sinks.actionsRef.current = {
    start: () => {
      // Only the host may start; ignore if a guest's UI ever calls this.
    },
    sendMove: (move) => {
      void transport.sendIntent({ seatId: uid, move });
    },
  };

  await transport.join(seat);

  transport.onShared((next) => {
    shared = next;
    render();
  });
  transport.onHand(uid, (hand) => {
    ownHand = [...hand];
    render();
  });

  // A wrong code means no host ever publishes here - do not spin forever.
  window.setTimeout(() => {
    if (shared === null && !sinks.cancelled()) {
      sinks.setStatus("error");
    }
  }, JOIN_TIMEOUT_MS);
}

/** Publishes a room with hands redacted, and each seat's real hand privately. */
function publishRoom(transport: RoomTransport, room: RoomState): Promise<void> {
  const shared: RoomState = {
    ...room,
    game: room.game === null ? null : redactHands(room.game),
  };

  const hands = new Map<SeatId, readonly Card[]>();
  if (room.game !== null) {
    room.game.players.forEach((player, index) => {
      const seat = room.seats[index];
      if (seat !== undefined) {
        hands.set(seat.id, player.hand);
      }
    });
  }

  return transport.publish(shared, hands);
}

/** Merges a guest's own hand back into the shared, redacted room. */
function mergeGuestView(
  shared: RoomState,
  uid: SeatId,
  ownHand: readonly Card[],
): RoomState {
  let view = shared;
  if (shared.game !== null) {
    const index = shared.seats.findIndex((seat) => seat.id === uid);
    if (index >= 0) {
      view = { ...shared, game: withOwnHand(shared.game, index, ownHand) };
    }
  }
  return view;
}

/** Maps a room phase to the matching connection status. */
function phaseToStatus(phase: RoomState["phase"]): OnlineStatus {
  return phase;
}

/** A fresh, unpredictable seed for a new game. */
function freshSeed(): number {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}
