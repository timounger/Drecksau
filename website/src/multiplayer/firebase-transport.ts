/**
 * A {@link RoomTransport} backed by the Firebase Realtime Database.
 *
 * @module
 * @remarks
 * Layout under `rooms/{code}`:
 * - `members/{seatId}` - who is present; removed automatically on disconnect.
 * - `shared` - the authoritative room, hands redacted, written by the host.
 * - `hands/{seatId}` - one player's real cards, written by the host, read only
 *   by that player.
 * - `intents/{pushId}` - a guest's requested move; the host consumes and
 *   removes it.
 * - `chat/{pushId}` - a chat line; kept so a joiner sees the history.
 *
 * Every value is stored as a JSON string on purpose. The Realtime Database
 * drops `null`s and empty arrays and turns sparse arrays into objects, which
 * would quietly corrupt a {@link GameState} (a `null` winner, an empty discard
 * pile). Stringifying keeps the data exactly as the engine wrote it.
 */
import {
  onChildAdded,
  onDisconnect,
  onValue,
  push,
  ref,
  remove,
  set,
  update,
  type Database,
} from "firebase/database";
import type { Card } from "@/game/cards";
import {
  isChatPayload,
  isHand,
  isMoveIntent,
  isRoomState,
} from "./online-state";
import type { RoomState, Seat, SeatId } from "./room";
import type { ChatMessage, MoveIntent, RoomTransport } from "./transport";

/** A present member as stored: the seat plus when it joined, for turn order. */
type StoredMember = Seat & { readonly joinedAt: number };

/**
 * Creates a Firebase-backed transport for one room.
 *
 * @param database - the Realtime Database handle
 * @param code - the room code, i.e. the path segment under `rooms`
 * @returns a transport wired to that room
 */
export function createFirebaseTransport(
  database: Database,
  code: string,
): RoomTransport {
  const roomPath = `rooms/${code}`;
  const membersPath = `${roomPath}/members`;
  const sharedPath = `${roomPath}/shared`;
  const handsPath = `${roomPath}/hands`;
  const intentsPath = `${roomPath}/intents`;
  const chatPath = `${roomPath}/chat`;

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
    shared: RoomState,
    hands: ReadonlyMap<SeatId, readonly Card[]>,
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

  const onShared = (onRoom: (shared: RoomState) => void): (() => void) => {
    const stop = onValue(ref(database, sharedPath), (snapshot) => {
      const room = parseJson(snapshot.val(), isRoomState);
      if (room !== null) {
        onRoom(room);
      }
    });
    unsubscribes.push(stop);
    return stop;
  };

  const onHand = (
    seatId: SeatId,
    onCards: (hand: readonly Card[]) => void,
  ): (() => void) => {
    const stop = onValue(
      ref(database, `${handsPath}/${seatId}`),
      (snapshot) => {
        const hand = parseJson(snapshot.val(), isHand);
        if (hand !== null) {
          onCards(hand);
        }
      },
    );
    unsubscribes.push(stop);
    return stop;
  };

  const sendIntent = async (intent: MoveIntent): Promise<void> => {
    await push(ref(database, intentsPath), JSON.stringify(intent));
  };

  const onIntents = (onIntent: (intent: MoveIntent) => void): (() => void) => {
    const stop = onChildAdded(ref(database, intentsPath), (snapshot) => {
      const intent = parseJson(snapshot.val(), isMoveIntent);
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
      const payload = parseJson(snapshot.val(), isChatPayload);
      if (payload !== null && snapshot.key !== null) {
        onMessage({ id: snapshot.key, ...payload });
      }
    });
    unsubscribes.push(stop);
    return stop;
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
