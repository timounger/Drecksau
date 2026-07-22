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
 * the departed host's seat to the computer, and hosts on. All the network lives
 * behind a {@link RoomTransport} and everything game-specific behind an
 * {@link OnlineAdapter}; this hook is the glue, so both stay pure and tested.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { database, signIn } from "@/online/firebase-app";
import type { OnlineAdapter, RoomState, Seat, SeatId } from "./adapter";
import { createFirebaseTransport } from "./firebase-transport";
import { createWireGuards } from "./online-state";
import {
  applySeatMove,
  createRoom,
  isBotSeat,
  markSeatsAsBots,
  returnToLobby,
  seatOnTurn,
  startGame,
} from "./room";
import type { ChatMessage, RoomTransport } from "./transport";

/** What the player wants to do: host a new room or join one by code. */
export type OnlineSession = {
  readonly mode: "host" | "guest";
  /** The room code, shared to invite others. */
  readonly code: string;
  /** The player's display name. */
  readonly name: string;
};

/** The choices the host makes when starting: the game options plus auto-play. */
export type StartChoices<O> = O & {
  /** Auto-play timeout in milliseconds, or null to let players take their time. */
  readonly autoPlayMs: number | null;
};

/** Where the connection stands. */
export type OnlineStatus =
  "idle" | "connecting" | "lobby" | "playing" | "finished" | "error";

/** What the hook exposes to the online UI. */
export type OnlineRoom<G, M, O> = {
  readonly status: OnlineStatus;
  /** This player's seat id, once signed in. */
  readonly seatId: SeatId | null;
  readonly isHost: boolean;
  /** The room to render - a guest's own hand is already merged in. */
  readonly room: RoomState<G> | null;
  /** A human-readable error, when {@link status} is "error". */
  readonly error: string | null;
  /** Host only: deal the cards and begin. */
  readonly start: (choices: StartChoices<O>) => void;
  /** Host only: send a finished game back to the lobby for a rematch. */
  readonly newRound: () => void;
  /** Play a move - applied directly by the host, sent as an intent by a guest. */
  readonly sendMove: (move: M) => void;
  /** Chat lines so far, oldest first. */
  readonly messages: readonly ChatMessage[];
  /** Sends a chat line to everyone in the room. */
  readonly sendChat: (text: string) => void;
};

/** Fallback name for a player who left the field empty. */
const DEFAULT_PLAYER_NAME = "Spieler";

/** Hands-map key for the host-only vault (see {@link OnlineAdapter.vault}). */
const VAULT_KEY = "__vault";

/** How long a guest waits for the room before giving up. */
const JOIN_TIMEOUT_MS = 12_000;

/** Pause before the computer plays a taken-over seat, so it stays watchable. */
const BOT_MOVE_DELAY_MS = 900;

/** Longest chat line accepted, in characters. */
const MAX_CHAT_LENGTH = 300;

/** How many chat lines are kept in memory. */
const MAX_CHAT_MESSAGES = 100;

/** The actions the async setup wires up, reached through a ref to stay fresh. */
type RoomActions<M, O> = {
  start: (choices: StartChoices<O>) => void;
  newRound: () => void;
  sendMove: (move: M) => void;
  sendChat: (text: string) => void;
};

/**
 * Connects to a room and drives it.
 *
 * @param adapter - the game's online adapter
 * @param session - what to do, or null to stay idle until the player chooses
 * @returns the room state and the actions the UI needs
 */
export function useOnlineRoom<G, M, H, O>(
  adapter: OnlineAdapter<G, M, H, O>,
  session: OnlineSession | null,
): OnlineRoom<G, M, O> {
  const [status, setStatus] = useState<OnlineStatus>("idle");
  const [room, setRoom] = useState<RoomState<G> | null>(null);
  const [seatId, setSeatId] = useState<SeatId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<readonly ChatMessage[]>([]);
  // Not derived from the session: a guest can become the host on failover.
  const [isHost, setIsHost] = useState(false);

  const actionsRef = useRef<RoomActions<M, O> | null>(null);

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
    let transport: RoomTransport<G, M, H> | null = null;
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

    void connect(adapter, session, (t) => (transport = t), fail, {
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
  }, [adapter, session, addMessage]);

  const start = useCallback((choices: StartChoices<O>) => {
    actionsRef.current?.start(choices);
  }, []);

  const newRound = useCallback(() => {
    actionsRef.current?.newRound();
  }, []);

  const sendMove = useCallback((move: M) => {
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
type Sinks<G, M, O> = {
  cancelled: () => boolean;
  setStatus: (status: OnlineStatus) => void;
  setRoom: (room: RoomState<G>) => void;
  setSeatId: (seatId: SeatId) => void;
  setIsHost: (isHost: boolean) => void;
  addMessage: (message: ChatMessage) => void;
  actionsRef: { current: RoomActions<M, O> | null };
};

/** Cleans a chat line before sending: trims and caps its length. */
function cleanChat(text: string): string {
  return text.trim().slice(0, MAX_CHAT_LENGTH);
}

/** Sends a chat line from a seat, unless it is empty after cleaning. */
function sendChatFrom<G, M, H>(
  transport: RoomTransport<G, M, H>,
  seat: Seat,
  text: string,
): void {
  const clean = cleanChat(text);
  if (clean.length > 0) {
    void transport.sendChat({ seatId: seat.id, name: seat.name, text: clean });
  }
}

/** Signs in, opens the transport, and wires up host or guest handling. */
async function connect<G, M, H, O>(
  adapter: OnlineAdapter<G, M, H, O>,
  session: OnlineSession,
  keepTransport: (transport: RoomTransport<G, M, H>) => void,
  fail: (message: string) => void,
  sinks: Sinks<G, M, O>,
): Promise<void> {
  try {
    const uid = await signIn();
    if (sinks.cancelled()) {
      return;
    }
    sinks.setSeatId(uid);

    const transport = createFirebaseTransport(
      database(),
      adapter.gameId,
      session.code,
      createWireGuards(adapter),
    );
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
      await installHost(
        adapter,
        transport,
        seat,
        createRoom<G>(session.code, seat),
        sinks,
      );
    } else {
      await runGuest(adapter, transport, seat, uid, sinks);
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
 * @param adapter - the game's online adapter
 * @param transport - the room transport
 * @param seat - this player's seat
 * @param initialRoom - the room to start hosting from (a fresh lobby for the
 *   original host, or the rebuilt game for a guest taking over on failover)
 * @param sinks - the React state to drive
 */
async function installHost<G, M, H, O>(
  adapter: OnlineAdapter<G, M, H, O>,
  transport: RoomTransport<G, M, H>,
  seat: Seat,
  initialRoom: RoomState<G>,
  sinks: Sinks<G, M, O>,
): Promise<void> {
  sinks.setIsHost(true);
  let authoritative = initialRoom;
  let aiTimer: ReturnType<typeof setTimeout> | undefined;

  /** Stores, publishes and shows a new authoritative room. */
  const commit = (next: RoomState<G>) => {
    authoritative = next;
    void publishRoom(adapter, transport, next);
    if (!sinks.cancelled()) {
      sinks.setRoom(next);
      sinks.setStatus(next.phase);
    }
    // Any change restarts the clock for whoever is now on turn.
    scheduleAiTurn();
  };

  /** Referees a move and, if it produced an event, stamps it for animation. */
  const refereeApply = (moverId: SeatId, move: M) => {
    const seatIndex = authoritative.seats.findIndex((s) => s.id === moverId);
    const next = applySeatMove(authoritative, adapter, moverId, move);
    // Unchanged means the referee rejected it - nothing to publish or animate.
    if (next !== authoritative) {
      commit(stampEffect(adapter, authoritative, next, seatIndex, move));
    }
  };

  /** Plays a move for the seat on turn, at the game's chosen difficulty. */
  const playAiTurn = () => {
    const onTurn = seatOnTurn(authoritative, adapter);
    // Do nothing once the room has been left, so no stray write goes out.
    if (!sinks.cancelled() && onTurn !== null && authoritative.game !== null) {
      const move = adapter.aiMove(authoritative.game);
      if (move !== null) {
        refereeApply(onTurn.id, move);
      }
    }
  };

  /**
   * Arms the computer to take a turn. A seat a player left is played right
   * away (after a short, watchable pause); a present player is only played for
   * once the auto-play timeout runs out, and only if the host turned that on.
   */
  const scheduleAiTurn = () => {
    clearTimeout(aiTimer);
    const onTurn = seatOnTurn(authoritative, adapter);
    const game = authoritative.game;
    if (authoritative.phase !== "playing" || onTurn === null || game === null) {
      return;
    }
    if (isBotSeat(authoritative, onTurn.id)) {
      aiTimer = setTimeout(playAiTurn, BOT_MOVE_DELAY_MS);
    } else {
      // The game may vary the timeout by phase; else the host's value is used.
      const configured = authoritative.autoPlayMs ?? null;
      const timeout = adapter.turnTimeoutMs
        ? adapter.turnTimeoutMs(game, configured)
        : configured;
      if (typeof timeout === "number" && timeout > 0) {
        aiTimer = setTimeout(playAiTurn, timeout);
      }
    }
  };

  sinks.actionsRef.current = {
    start: (choices) => {
      if (authoritative.phase === "lobby") {
        const { autoPlayMs, ...options } = choices;
        commit(
          startGame(
            authoritative,
            adapter,
            freshSeed(),
            options as unknown as O,
            autoPlayMs,
          ),
        );
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
        seats: members.slice(0, adapter.maxPlayers),
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
 * Stamps a public event onto the new room so every client can animate it.
 *
 * @param adapter - the game's online adapter
 * @param pre - the room before the move, where the mover still holds the card
 * @param next - the room after the move
 * @param seatIndex - the seat that moved
 * @param move - the move that was applied
 * @returns the new room, with {@link RoomState.lastEffect} set for an event
 */
function stampEffect<G, M, H, O>(
  adapter: OnlineAdapter<G, M, H, O>,
  pre: RoomState<G>,
  next: RoomState<G>,
  seatIndex: number,
  move: M,
): RoomState<G> {
  let stamped = next;
  if (pre.game !== null && seatIndex >= 0) {
    const effect = adapter.effectFor(pre.game, seatIndex, move);
    if (effect !== null) {
      stamped = {
        ...next,
        lastEffect: { type: effect.type, id: next.version },
      };
    }
  }
  return stamped;
}

/** Runs a guest: sends intents, renders the host's snapshots with its own hand. */
async function runGuest<G, M, H, O>(
  adapter: OnlineAdapter<G, M, H, O>,
  transport: RoomTransport<G, M, H>,
  seat: Seat,
  uid: SeatId,
  sinks: Sinks<G, M, O>,
): Promise<void> {
  let shared: RoomState<G> | null = null;
  let ownHand: H | null = null;
  // Once this guest takes over as host, the guest listeners fall silent.
  let promoted = false;

  const render = () => {
    if (promoted || shared === null || sinks.cancelled()) {
      return;
    }
    const view = mergeGuestView(adapter, shared, uid, ownHand);
    sinks.setRoom(view);
    sinks.setStatus(view.phase);
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

    // Rebuild the full game: the last shared snapshot has the real public state
    // and the private hands come from the transport. The seat whose player left
    // is handed to the computer.
    const hands = await transport.readHands().catch(() => new Map<SeatId, H>());
    const base = shared;
    const handsInOrder = base.seats.map((s) => hands.get(s.id));
    const vault = hands.get(VAULT_KEY) ?? null;
    let game: G | null = null;
    if (base.game !== null) {
      // Restore the table secret first, then each seat's own hand.
      const withVault =
        vault !== null && adapter.applyVault !== undefined
          ? adapter.applyVault(base.game, vault)
          : base.game;
      game = adapter.withAllHands(withVault, handsInOrder);
    }
    const rebuilt = markSeatsAsBots({ ...base, game, hostId: uid }, [
      previousHostId,
    ]);
    await installHost(adapter, transport, seat, rebuilt, sinks);
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
    ownHand = hand;
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
function publishRoom<G, M, H, O>(
  adapter: OnlineAdapter<G, M, H, O>,
  transport: RoomTransport<G, M, H>,
  room: RoomState<G>,
): Promise<void> {
  const shared: RoomState<G> = {
    ...room,
    game: room.game === null ? null : adapter.redact(room.game),
  };

  const hands = new Map<SeatId, H>();
  if (room.game !== null) {
    const seatHands = adapter.privateHands(room.game);
    room.seats.forEach((seat, index) => {
      const hand = seatHands[index];
      if (hand !== undefined) {
        hands.set(seat.id, hand);
      }
    });
    // Stash any table secret (e.g. the face-down Dabb) for a taking-over host.
    const vault = adapter.vault?.(room.game) ?? null;
    if (vault !== null) {
      hands.set(VAULT_KEY, vault);
    }
  }

  return transport.publish(shared, hands);
}

/** Merges a guest's own hand back into the shared, redacted room. */
function mergeGuestView<G, M, H, O>(
  adapter: OnlineAdapter<G, M, H, O>,
  shared: RoomState<G>,
  uid: SeatId,
  ownHand: H | null,
): RoomState<G> {
  let view = shared;
  if (shared.game !== null && ownHand !== null) {
    const index = shared.seats.findIndex((seat) => seat.id === uid);
    if (index >= 0) {
      view = {
        ...shared,
        game: adapter.withOwnHand(shared.game, index, ownHand),
      };
    }
  }
  return view;
}

/** A fresh, unpredictable seed for a new game. */
function freshSeed(): number {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}
