/**
 * A {@link RoomTransport} backed by the Firebase Realtime Database, generic in
 * the game.
 *
 * @module
 * @remarks
 * Layout under `rooms/{gameId}-{code}` (the game prefix keeps the games apart
 * within one database without a rule change):
 * - `members/{seatId}` - who is present; removed automatically on disconnect.
 * - `shared` - the authoritative room, hands redacted, written by the host.
 * - `hands/{seatId}` - one player's real cards, written by the host, read only
 *   by that player.
 * - `intents/{pushId}` - a guest's requested move; the host consumes and
 *   removes it.
 * - `chat/{pushId}` - a chat line; kept so a joiner sees the history.
 * - `host` - the current host's seat id, claimed atomically on failover.
 *
 * Every value is stored as a JSON string on purpose. The Realtime Database
 * drops `null`s and empty arrays and turns sparse arrays into objects, which
 * would quietly corrupt a game state (a `null` winner, an empty pile).
 * Stringifying keeps the data exactly as the engine wrote it.
 */
import {
  get,
  onChildAdded,
  onDisconnect,
  onValue,
  push,
  ref,
  remove,
  runTransaction,
  set,
  update,
  type Database,
} from "firebase/database";
import type { RoomState, Seat, SeatId } from "./adapter";
import type {
  ChatMessage,
  MoveIntent,
  RoomTransport,
  WireGuards,
} from "./transport";

/** A present member as stored: the seat plus when it joined, for turn order. */
type StoredMember = Seat & { readonly joinedAt: number };

/**
 * Creates a Firebase-backed transport for one room.
 *
 * @param database - the Realtime Database handle
 * @param gameId - namespaces the room within the shared database
 * @param code - the room code
 * @param guards - the untrusted-value guards for this game
 * @returns a transport wired to that room
 */
export function createFirebaseTransport<G, M, H>(
  database: Database,
  gameId: string,
  code: string,
  guards: WireGuards<G, M, H>,
): RoomTransport<G, M, H> {
  const roomPath = `rooms/${gameId}-${code}`;
  const membersPath = `${roomPath}/members`;
  const sharedPath = `${roomPath}/shared`;
  const handsPath = `${roomPath}/hands`;
  const intentsPath = `${roomPath}/intents`;
  const chatPath = `${roomPath}/chat`;
  const hostPath = `${roomPath}/host`;

  // Every listener's unsubscribe, plus a cleanup for the presence node.
  const unsubscribes: Array<() => void> = [];
  let ownMemberPath: string | null = null;

  const join = async (seat: Seat): Promise<void> => {
    ownMemberPath = `${membersPath}/${seat.id}`;
    const memberRef = ref(database, ownMemberPath);
    const member: StoredMember = { ...seat, joinedAt: Date.now() };
    // Remove the presence the moment this tab drops off the network.
    await onDisconnect(memberRef).remove();
    await set(memberRef, JSON.stringify(member));
  };

  const onMembers = (
    onChange: (members: readonly Seat[]) => void,
  ): (() => void) => {
    const stop = onValue(ref(database, membersPath), (snapshot) => {
      onChange(readMembers(snapshot.val()));
    });
    unsubscribes.push(stop);
    return stop;
  };

  const publish = async (
    shared: RoomState<G>,
    hands: ReadonlyMap<SeatId, H>,
  ): Promise<void> => {
    // One atomic write: the shared room and every private hand together.
    const payload: Record<string, string> = {
      shared: JSON.stringify(shared),
    };
    for (const [seatId, hand] of hands) {
      payload[`hands/${seatId}`] = JSON.stringify(hand);
    }
    await update(ref(database, roomPath), payload);
  };

  const onShared = (onRoom: (shared: RoomState<G>) => void): (() => void) => {
    const stop = onValue(ref(database, sharedPath), (snapshot) => {
      const room = parseJson(snapshot.val(), guards.isRoomState);
      if (room !== null) {
        onRoom(room);
      }
    });
    unsubscribes.push(stop);
    return stop;
  };

  const onHand = (seatId: SeatId, onCards: (hand: H) => void): (() => void) => {
    const stop = onValue(
      ref(database, `${handsPath}/${seatId}`),
      (snapshot) => {
        const hand = parseJson(snapshot.val(), guards.isHand);
        if (hand !== null) {
          onCards(hand);
        }
      },
    );
    unsubscribes.push(stop);
    return stop;
  };

  const sendIntent = async (intent: MoveIntent<M>): Promise<void> => {
    await push(ref(database, intentsPath), JSON.stringify(intent));
  };

  const onIntents = (
    onIntent: (intent: MoveIntent<M>) => void,
  ): (() => void) => {
    const stop = onChildAdded(ref(database, intentsPath), (snapshot) => {
      const intent = parseJson(snapshot.val(), guards.isMoveIntent);
      if (intent !== null) {
        onIntent(intent);
      }
      // Consume it, whether it was valid or junk, so it is handled just once.
      void remove(snapshot.ref);
    });
    unsubscribes.push(stop);
    return stop;
  };

  const sendChat = async (message: Omit<ChatMessage, "id">): Promise<void> => {
    await push(ref(database, chatPath), JSON.stringify(message));
  };

  const onChat = (onMessage: (message: ChatMessage) => void): (() => void) => {
    // Chat lines are kept, not consumed, so a new joiner sees the history.
    const stop = onChildAdded(ref(database, chatPath), (snapshot) => {
      const payload = parseJson(snapshot.val(), guards.isChatPayload);
      if (payload !== null && snapshot.key !== null) {
        onMessage({ id: snapshot.key, ...payload });
      }
    });
    unsubscribes.push(stop);
    return stop;
  };

  const markHost = async (seatId: SeatId): Promise<void> => {
    await set(ref(database, hostPath), seatId);
  };

  const claimHost = async (
    seatId: SeatId,
    previousHostId: SeatId,
  ): Promise<boolean> => {
    // Only the first claimer wins: the transaction takes the slot only while it
    // still holds the previous host, so a second racer sees the new id and aborts.
    const result = await runTransaction(ref(database, hostPath), (current) =>
      current === null || current === previousHostId ? seatId : undefined,
    );
    return result.committed && result.snapshot.val() === seatId;
  };

  const readHands = async (): Promise<ReadonlyMap<SeatId, H>> => {
    const snapshot = await get(ref(database, handsPath));
    const hands = new Map<SeatId, H>();
    const value = snapshot.val();
    if (value !== null && typeof value === "object") {
      for (const [seatId, raw] of Object.entries(
        value as Record<string, unknown>,
      )) {
        const hand = parseJson(raw, guards.isHand);
        if (hand !== null) {
          hands.set(seatId, hand);
        }
      }
    }
    return hands;
  };

  const disconnect = async (): Promise<void> => {
    for (const stop of unsubscribes) {
      stop();
    }
    unsubscribes.length = 0;
    if (ownMemberPath !== null) {
      const path = ownMemberPath;
      ownMemberPath = null;
      await onDisconnect(ref(database, path)).cancel();
      await remove(ref(database, path));
    }
  };

  return {
    join,
    onMembers,
    publish,
    onShared,
    onHand,
    sendIntent,
    onIntents,
    sendChat,
    onChat,
    markHost,
    claimHost,
    readHands,
    disconnect,
  };
}

/** Reads and orders the present members: host first, then by join time. */
function readMembers(value: unknown): Seat[] {
  const entries = value === null || typeof value !== "object" ? {} : value;
  const members: StoredMember[] = [];

  for (const raw of Object.values(entries as Record<string, unknown>)) {
    const member = parseJson(raw, isStoredMember);
    if (member !== null) {
      members.push(member);
    }
  }

  members.sort(byHostThenJoin);
  return members.map(({ id, name, isHost }) => ({ id, name, isHost }));
}

/** Orders the host first, then earlier joiners, then by id for a stable tie. */
function byHostThenJoin(a: StoredMember, b: StoredMember): number {
  let order: number;
  if (a.isHost !== b.isHost) {
    order = a.isHost ? -1 : 1;
  } else if (a.joinedAt !== b.joinedAt) {
    order = a.joinedAt - b.joinedAt;
  } else {
    order = a.id.localeCompare(b.id);
  }
  return order;
}

/** Checks a stored member entry. */
function isStoredMember(value: unknown): value is StoredMember {
  const member = value as StoredMember;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof member.id === "string" &&
    member.id.length > 0 &&
    typeof member.name === "string" &&
    member.name.length > 0 &&
    typeof member.isHost === "boolean" &&
    typeof member.joinedAt === "number"
  );
}

/**
 * Parses a JSON string from the database and checks its shape.
 *
 * @param raw - the stored value, expected to be a JSON string
 * @param guard - the shape check the parsed value must pass
 * @returns the parsed value, or null if it is missing, unparseable or malformed
 */
function parseJson<T>(
  raw: unknown,
  guard: (value: unknown) => value is T,
): T | null {
  let result: T | null = null;
  if (typeof raw === "string") {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (guard(parsed)) {
        result = parsed;
      }
    } catch {
      result = null;
    }
  }
  return result;
}
