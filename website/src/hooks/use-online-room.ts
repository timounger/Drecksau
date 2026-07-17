/**
 * Drives one online room from React: connects, seats players, runs the referee.
 *
 * @module
 * @remarks
 * The host holds the authoritative room and is the only one that changes it -
 * on a guest's intent, on its own move, or when the lobby's membership changes.
 * A guest only sends intents and renders what the host publishes, its own hand
 * merged back in. If the host leaves, the first remaining player takes over -
 * it rebuilds the game from the last snapshot plus the per-seat hands, hands
 * the departed host's seat to the computer, and hosts on. All the network
 * lives behind a {@link RoomTransport}; this hook is the glue, so the referee
 * itself ({@link ./multiplayer/room}) stays pure and tested.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { chooseAiMove } from "@/game/ai";
import type { Card } from "@/game/cards";
import type { Move } from "@/game/state";
import { MAX_PLAYERS } from "@/game/setup";
import { loadSettings } from "@/lib/settings/app-settings";
import { database, signIn } from "@/multiplayer/firebase-app";
import { createFirebaseTransport } from "@/multiplayer/firebase-transport";
import {
  redactHands,
  withAllHands,
  withOwnHand,
} from "@/multiplayer/online-state";
import {
  applySeatMove,
  createRoom,
  isBotSeat,
  markSeatsAsBots,
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

/** Pause before the computer plays a taken-over seat, so it stays watchable. */
const BOT_MOVE_DELAY_MS = 900;

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
  // Not derived from the session: a guest can become the host on failover.
  const [isHost, setIsHost] = useState(false);

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
    setIsHost(session.mode === "host");

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
      setIsHost,
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
    isHost,
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
  setIsHost: (isHost: boolean) => void;
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
      await transport.markHost(uid);
      await installHost(transport, seat, createRoom(session.code, seat), sinks);
    } else {
      await runGuest(transport, seat, uid, sinks);
    }
  } catch {
    fail(
      "Verbindung fehlgeschlagen. Ist die Firebase-Einrichtung abgeschlossen?",
    );
  }
}

/**
 * Takes on the host role: referees moves, runs the computer, publishes changes.
 *
 * @param transport - the room transport
 * @param seat - this player's seat
 * @param initialRoom - the room to start hosting from (a fresh lobby for the
 *   original host, or the rebuilt game for a guest taking over on failover)
 * @param sinks - the React state to drive
 */
async function installHost(
  transport: RoomTransport,
  seat: Seat,
  initialRoom: RoomState,
  sinks: Sinks,
): Promise<void> {
  sinks.setIsHost(true);
  let authoritative = initialRoom;
  let aiTimer: ReturnType<typeof setTimeout> | undefined;

  /** Stores, publishes and shows a new authoritative room. */
  const commit = (next: RoomState) => {
    authoritative = next;
    void publishRoom(transport, next);
    if (!sinks.cancelled()) {
      sinks.setRoom(next);
      sinks.setStatus(phaseToStatus(next.phase));
    }
    // Any change restarts the clock for whoever is now on turn.
    scheduleAiTurn();
  };

  /** Referees a move and, if it was a play, stamps it for the animation. */
  const refereeApply = (seatId: SeatId, move: Move) => {
    const next = applySeatMove(authoritative, seatId, move);
    // Unchanged means the referee rejected it - nothing to publish or animate.
    if (next !== authoritative) {
      commit(stampEffect(authoritative, next, move));
    }
  };

  /** Plays a move for the seat on turn, at the host's chosen difficulty. */
  const playAiTurn = () => {
    const onTurn = seatOnTurn(authoritative);
    // Do nothing once the room has been left, so no stray write goes out.
    if (!sinks.cancelled() && onTurn !== null && authoritative.game !== null) {
      refereeApply(
        onTurn.id,
        chooseAiMove(authoritative.game, loadSettings().difficulty),
      );
    }
  };

  /**
   * Arms the computer to take a turn. A seat a player left is played right
   * away (after a short, watchable pause); a present player is only played for
   * once the auto-play timeout runs out, and only if the host turned that on.
   */
  const scheduleAiTurn = () => {
    clearTimeout(aiTimer);
    const onTurn = seatOnTurn(authoritative);
    if (authoritative.phase !== "playing" || onTurn === null) {
      return;
    }
    if (isBotSeat(authoritative, onTurn.id)) {
      aiTimer = setTimeout(playAiTurn, BOT_MOVE_DELAY_MS);
    } else {
      const timeout = authoritative.autoPlayMs;
      if (typeof timeout === "number" && timeout > 0) {
        aiTimer = setTimeout(playAiTurn, timeout);
      }
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
  // Instead, a seat whose player left is handed to the computer, so the game
  // keeps going.
  transport.onMembers((members) => {
    if (authoritative.phase === "lobby") {
      commit({
        ...authoritative,
        seats: members.slice(0, MAX_PLAYERS),
        version: authoritative.version + 1,
      });
    } else {
      const present = new Set(members.map((member) => member.id));
      const gone = authoritative.seats
        .filter((s) => !present.has(s.id))
        .map((s) => s.id);
      const next = markSeatsAsBots(authoritative, gone);
      if (next !== authoritative) {
        commit(next);
      }
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
  // Once this guest takes over as host, the guest listeners fall silent.
  let promoted = false;

  const render = () => {
    if (promoted || shared === null || sinks.cancelled()) {
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

  /**
   * Takes over as host if the current host has left. The first present seat in
   * seat order is elected; the atomic claim makes sure only one guest wins.
   */
  const maybeTakeOverHost = async (members: readonly Seat[]): Promise<void> => {
    if (promoted || shared === null || sinks.cancelled()) {
      return;
    }
    const present = new Set(members.map((member) => member.id));
    if (present.has(shared.hostId)) {
      return; // The host is still here.
    }
    const elected = shared.seats.find((s) => present.has(s.id));
    if (elected === undefined || elected.id !== uid) {
      return; // Someone else is first in line.
    }

    promoted = true; // Stop rendering as a guest; revert if the claim fails.
    const previousHostId = shared.hostId;
    const claimed = await transport
      .claimHost(uid, previousHostId)
      .catch(() => false);
    if (!claimed || sinks.cancelled()) {
      promoted = false;
      return;
    }

    // Rebuild the full game: the last shared snapshot has the real pigs and
    // piles, and the private hands come from the transport. The seat whose
    // player left is handed to the computer.
    const hands = await transport
      .readHands()
      .catch(() => new Map<SeatId, readonly Card[]>());
    const base = shared;
    const game =
      base.game === null ? null : withAllHands(base.game, base.seats, hands);
    const rebuilt = markSeatsAsBots({ ...base, game, hostId: uid }, [
      previousHostId,
    ]);
    await installHost(transport, seat, rebuilt, sinks);
  };

  await transport.join(seat);

  transport.onShared((next) => {
    if (promoted) {
      return;
    }
    shared = next;
    render();
  });
  transport.onHand(uid, (hand) => {
    if (promoted) {
      return;
    }
    ownHand = [...hand];
    render();
  });
  transport.onMembers((members) => {
    void maybeTakeOverHost(members);
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
