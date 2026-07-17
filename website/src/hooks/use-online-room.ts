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
import { chooseAiMove } from "@/game/ai";
import type { Card } from "@/game/cards";
import type { Move } from "@/game/state";
import { MAX_PLAYERS } from "@/game/setup";
import { database, signIn } from "@/multiplayer/firebase-app";
import { createFirebaseTransport } from "@/multiplayer/firebase-transport";
import { redactHands, withOwnHand } from "@/multiplayer/online-state";
import {
  applySeatMove,
  createRoom,
  returnToLobby,
  seatOnTurn,
  startGame,
  type RoomState,
  type Seat,
  type SeatId,
} from "@/multiplayer/room";
import type { ChatMessage, RoomTransport } from "@/multiplayer/transport";

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
  /** Auto-play timeout in milliseconds, or null to let players take their time. */
  readonly autoPlayMs: number | null;
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
  /** Host only: send a finished game back to the lobby for a rematch. */
  readonly newRound: () => void;
  /** Play a move - applied directly by the host, sent as an intent by a guest. */
  readonly sendMove: (move: Move) => void;
  /** Chat lines so far, oldest first. */
  readonly messages: readonly ChatMessage[];
  /** Sends a chat line to everyone in the room. */
  readonly sendChat: (text: string) => void;
};

/** Fallback name for a player who left the field empty. */
const DEFAULT_PLAYER_NAME = "Spieler";

/** How long a guest waits for the room before giving up. */
const JOIN_TIMEOUT_MS = 12_000;

/** Longest chat line accepted, in characters. */
const MAX_CHAT_LENGTH = 300;

/** How many chat lines are kept in memory. */
const MAX_CHAT_MESSAGES = 100;

/** The actions the async setup wires up, reached through a ref to stay fresh. */
type RoomActions = {
  start: (choices: StartChoices) => void;
  newRound: () => void;
  sendMove: (move: Move) => void;
  sendChat: (text: string) => void;
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
  const [messages, setMessages] = useState<readonly ChatMessage[]>([]);

  const actionsRef = useRef<RoomActions | null>(null);

  /** Appends a chat line, ignoring duplicates and capping the history. */
  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) =>
      prev.some((existing) => existing.id === message.id)
        ? prev
        : [...prev, message].slice(-MAX_CHAT_MESSAGES),
    );
  }, []);

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
    setMessages([]);

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
      addMessage,
      actionsRef,
    });

    return () => {
      cancelled = true;
      actionsRef.current = null;
      void transport?.disconnect();
    };
  }, [session, addMessage]);

  const start = useCallback((choices: StartChoices) => {
    actionsRef.current?.start(choices);
  }, []);

  const newRound = useCallback(() => {
    actionsRef.current?.newRound();
  }, []);

  const sendMove = useCallback((move: Move) => {
    actionsRef.current?.sendMove(move);
  }, []);

  const sendChat = useCallback((text: string) => {
    actionsRef.current?.sendChat(text);
  }, []);

  return {
    status,
    seatId,
    isHost: session?.mode === "host",
    room,
    error,
    start,
    newRound,
    sendMove,
    messages,
    sendChat,
  };
}

/** The bits of React state the async setup is allowed to touch. */
type Sinks = {
  cancelled: () => boolean;
  setStatus: (status: OnlineStatus) => void;
  setRoom: (room: RoomState) => void;
  setSeatId: (seatId: SeatId) => void;
  addMessage: (message: ChatMessage) => void;
  actionsRef: { current: RoomActions | null };
};

/** Cleans a chat line before sending: trims and caps its length. */
function cleanChat(text: string): string {
  return text.trim().slice(0, MAX_CHAT_LENGTH);
}

/** Sends a chat line from a seat, unless it is empty after cleaning. */
function sendChatFrom(
  transport: RoomTransport,
  seat: Seat,
  text: string,
): void {
  const clean = cleanChat(text);
  if (clean.length > 0) {
    void transport.sendChat({ seatId: seat.id, name: seat.name, text: clean });
  }
}

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

    // Chat is peer to peer: everyone writes and reads it directly, host or not.
    transport.onChat((message) => {
      if (!sinks.cancelled()) {
        sinks.addMessage(message);
      }
    });

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
  let autoTimer: ReturnType<typeof setTimeout> | undefined;

  /** Stores, publishes and shows a new authoritative room. */
  const commit = (next: RoomState) => {
    authoritative = next;
    void publishRoom(transport, next);
    if (!sinks.cancelled()) {
      sinks.setRoom(next);
      sinks.setStatus(phaseToStatus(next.phase));
    }
    // Any change restarts the auto-play clock for whoever is now on turn.
    scheduleAutoPlay();
  };

  /** Referees a move and, if it was a play, stamps it for the animation. */
  const refereeApply = (seatId: SeatId, move: Move) => {
    const next = applySeatMove(authoritative, seatId, move);
    // Unchanged means the referee rejected it - nothing to publish or animate.
    if (next !== authoritative) {
      commit(stampEffect(authoritative, next, move));
    }
  };

  /**
   * Arms the auto-play timer, if the host turned it on. When it fires, the
   * computer makes a move for whoever is on turn - the same referee path as a
   * real move, so nothing special happens to the rest of the game.
   */
  const scheduleAutoPlay = () => {
    clearTimeout(autoTimer);
    const timeout = authoritative.autoPlayMs;
    if (
      authoritative.phase === "playing" &&
      typeof timeout === "number" &&
      timeout > 0
    ) {
      autoTimer = setTimeout(() => {
        const onTurn = seatOnTurn(authoritative);
        // Do nothing once the room has been left, so no stray write goes out.
        if (
          !sinks.cancelled() &&
          onTurn !== null &&
          authoritative.game !== null
        ) {
          refereeApply(onTurn.id, chooseAiMove(authoritative.game));
        }
      }, timeout);
    }
  };

  sinks.actionsRef.current = {
    start: (choices) => {
      if (authoritative.phase === "lobby") {
        commit(startGame(authoritative, { seed: freshSeed(), ...choices }));
      }
    },
    newRound: () => {
      if (authoritative.phase !== "lobby") {
        commit(returnToLobby(authoritative));
      }
    },
    sendMove: (move) => {
      refereeApply(seat.id, move);
    },
    sendChat: (text) => sendChatFrom(transport, seat, text),
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
    refereeApply(intent.seatId, intent.move);
  });

  commit(authoritative);
}

/**
 * Stamps a played card onto the new room so every client can animate it.
 *
 * @param pre - the room before the move, where the mover still holds the card
 * @param next - the room after the move
 * @param move - the move that was applied
 * @returns the new room, with {@link RoomState.lastEffect} set for a play
 * @remarks
 * Only a played card animates; a discard or hand swap has no effect to show and
 * simply carries the previous stamp, whose id the clients have already seen.
 */
function stampEffect(pre: RoomState, next: RoomState, move: Move): RoomState {
  let stamped = next;
  if (move.kind === "playCard" && pre.game !== null) {
    const mover = pre.game.players[pre.game.currentPlayerIndex];
    const card = mover?.hand.find((candidate) => candidate.id === move.cardId);
    if (card !== undefined) {
      stamped = { ...next, lastEffect: { type: card.type, id: next.version } };
    }
  }
  return stamped;
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
    newRound: () => {
      // Only the host may open a rematch; a guest's UI never offers it.
    },
    sendMove: (move) => {
      void transport.sendIntent({ seatId: uid, move });
    },
    sendChat: (text) => sendChatFrom(transport, seat, text),
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
