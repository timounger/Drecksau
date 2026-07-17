/**
 * The seam between the room logic and the network.
 *
 * @module
 * @remarks
 * The room reducer ({@link ./room}) is pure and knows nothing about Firebase.
 * A transport carries four kinds of traffic between the players; Firebase
 * implements it first, but a peer-to-peer or self-hosted transport could
 * implement the same interface later without touching the game.
 *
 * Host-authoritative flow:
 * 1. Everyone {@link RoomTransport.join}s to announce their presence.
 * 2. The host watches {@link RoomTransport.onMembers}, seats the players, and
 *    {@link RoomTransport.publish}es the shared room plus each player's private
 *    hand. Opponents' hands are redacted in the shared room, so no client ever
 *    receives another player's cards.
 * 3. Everyone renders from {@link RoomTransport.onShared} merged with their own
 *    hand from {@link RoomTransport.onHand}.
 * 4. Guests ask to move with {@link RoomTransport.sendIntent}; the host applies
 *    each {@link RoomTransport.onIntents} through the referee and publishes.
 */
import type { Card } from "@/game/cards";
import type { Move } from "@/game/state";
import type { RoomState, Seat, SeatId } from "./room";

/** A move a guest asks the host to make on their behalf. */
export type MoveIntent = {
  /** Who wants to move - the host checks it is really their turn. */
  readonly seatId: SeatId;
  readonly move: Move;
};

/** One line of chat between the players. */
export type ChatMessage = {
  /** Stable id, so the list can key on it and drop duplicates. */
  readonly id: string;
  /** Who wrote it. */
  readonly seatId: SeatId;
  /** Their display name at the time. */
  readonly name: string;
  readonly text: string;
};

/** Carries room snapshots, private hands and move intents between the players. */
export type RoomTransport = {
  /**
   * Announces this player's presence in the lobby.
   *
   * @param seat - the joining player's seat
   * @remarks
   * The presence is removed automatically when the tab disconnects, so the
   * host sees players come and go without an explicit "leave" message.
   */
  join(seat: Seat): Promise<void>;

  /**
   * Subscribes to who is currently present. Host uses this to seat players.
   *
   * @param onMembers - called with the present seats whenever they change
   * @returns an unsubscribe function
   */
  onMembers(onMembers: (members: readonly Seat[]) => void): () => void;

  /**
   * Publishes the authoritative room and every player's private hand. Host only.
   *
   * @param shared - the room with all hands redacted to their size
   * @param hands - each seat's real cards, delivered only to that seat
   */
  publish(
    shared: RoomState,
    hands: ReadonlyMap<SeatId, readonly Card[]>,
  ): Promise<void>;

  /**
   * Subscribes to the shared room. Newest snapshot wins by version.
   *
   * @param onShared - called with each published room
   * @returns an unsubscribe function
   */
  onShared(onShared: (shared: RoomState) => void): () => void;

  /**
   * Subscribes to this player's own private hand.
   *
   * @param seatId - the player's seat
   * @param onHand - called with the player's real cards whenever they change
   * @returns an unsubscribe function
   */
  onHand(seatId: SeatId, onHand: (hand: readonly Card[]) => void): () => void;

  /**
   * Sends a move intent to the host. Guests use this.
   *
   * @param intent - the move a seat wants to make
   */
  sendIntent(intent: MoveIntent): Promise<void>;

  /**
   * Subscribes to incoming intents. Host only.
   *
   * @param onIntent - called with each intent a guest sends
   * @returns an unsubscribe function
   */
  onIntents(onIntent: (intent: MoveIntent) => void): () => void;

  /**
   * Sends a chat line. Everyone writes directly; the host does not mediate.
   *
   * @param message - the line to send, without its id
   */
  sendChat(message: Omit<ChatMessage, "id">): Promise<void>;

  /**
   * Subscribes to chat lines, including any already in the room.
   *
   * @param onMessage - called with each line, oldest first on first attach
   * @returns an unsubscribe function
   */
  onChat(onMessage: (message: ChatMessage) => void): () => void;

  /**
   * Records who the current host is, in a slot separate from the room.
   *
   * @param seatId - the host's seat
   * @remarks
   * Used for host failover: if the host leaves, a guest can atomically claim
   * this slot with {@link RoomTransport.claimHost} and take over.
   */
  markHost(seatId: SeatId): Promise<void>;

  /**
   * Atomically claims the host role from a specific previous host.
   *
   * @param seatId - the seat claiming to be the new host
   * @param previousHostId - the host being replaced
   * @returns true if this player is now the host; false if someone else claimed
   *   it first
   */
  claimHost(seatId: SeatId, previousHostId: SeatId): Promise<boolean>;

  /**
   * Reads every seat's real hand, to rebuild the game when taking over.
   *
   * @returns each seat's private cards, by seat id
   */
  readHands(): Promise<ReadonlyMap<SeatId, readonly Card[]>>;

  /** Leaves the room and releases every listener and the connection. */
  disconnect(): Promise<void>;
};
