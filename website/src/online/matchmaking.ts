/**
 * Automatic matchmaking: players who do not want a private room are put
 * together into a shared public room, honouring a wished table configuration.
 *
 * @module
 * @remarks
 * Open public rooms waiting for players are listed under
 * `rooms/{gameId}-__match/open/{code}`, each tagged with its wished config
 * (player count, expansion, defence). A searcher first looks for an open room
 * that exactly matches their wish and joins it; if none matches, they open one
 * with their own wish and wait. While waiting alone they relax over time: first
 * they still only merge into an exactly matching room, then - after a grace -
 * into any open room. Merging is deterministic (only the "junior", higher-coded
 * host moves) so two waiting hosts never swap past each other. A host clears its
 * entry once the game starts; a crashed host's entry goes stale after
 * {@link MATCH_TTL_MS} and is ignored.
 *
 * The list lives under `rooms/` so the existing per-room security rules cover it
 * with no rule change; the double-underscore key never collides with a real
 * four-letter room code. The decisions are pure functions ({@link isOpenRoom},
 * {@link parseOpenRooms}, {@link roomMatchesWish}, {@link pickRoom}) so they are
 * tested without a network.
 */
import { get, ref, remove, set, type Database } from "firebase/database";
import { generateRoomCode } from "./room-code";

/** How long an open room's entry stays valid without a heartbeat. */
export const MATCH_TTL_MS = 30_000;

/** The table a player wants when searching automatically. */
export type Wish = {
  /** Preferred number of players at the table. */
  readonly count: number;
  /** Whether the Sauschoen expansion is wanted. */
  readonly expansion: boolean;
  /** Whether the defence cards are wanted. */
  readonly defense: boolean;
};

/** One open public room waiting for players, as stored. */
export type OpenRoom = Wish & {
  /** The room's code. */
  readonly code: string;
  /** When the entry was last written, for staleness. */
  readonly ts: number;
};

/** Where to find the player, and whether they must host or join. */
export type Match = {
  readonly code: string;
  readonly mode: "host" | "guest";
};

/** How the relaxed pick may narrow which rooms are eligible. */
type PickOptions = {
  /** Accept any open room, not only ones matching the wish. */
  readonly allowAny: boolean;
  /** Skip this room (the searcher's own). */
  readonly excludeCode?: string;
  /** Only rooms whose code sorts before this one (seniority), for merging. */
  readonly seniorTo?: string;
};

/** The list of open rooms for one game. */
function openPath(gameId: string): string {
  return `rooms/${gameId}-__match/open`;
}

/**
 * Whether a stored value has the shape of an open room.
 *
 * @param value - the stored value, straight from the database
 * @returns true if every field is well formed
 */
export function isOpenRoom(value: unknown): value is OpenRoom {
  const room = value as OpenRoom;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof room.code === "string" &&
    room.code.length > 0 &&
    typeof room.count === "number" &&
    typeof room.expansion === "boolean" &&
    typeof room.defense === "boolean" &&
    typeof room.ts === "number"
  );
}

/**
 * Reads the open-room list from the stored map.
 *
 * @param value - the map straight from the database
 * @returns the well-formed open rooms it holds
 */
export function parseOpenRooms(value: unknown): OpenRoom[] {
  if (value === null || typeof value !== "object") {
    return [];
  }
  return Object.values(value as Record<string, unknown>).filter(isOpenRoom);
}

/**
 * Whether an open room's config is exactly what the searcher wished for.
 *
 * @param room - the open room
 * @param wish - the searcher's wish
 * @returns true if count, expansion and defence all match
 */
export function roomMatchesWish(room: OpenRoom, wish: Wish): boolean {
  return (
    room.count === wish.count &&
    room.expansion === wish.expansion &&
    room.defense === wish.defense
  );
}

/**
 * Picks the open room to join, or null if none is eligible.
 *
 * @param rooms - the open rooms
 * @param wish - the searcher's wish
 * @param now - the current time in milliseconds
 * @param options - how far to relax and which rooms to skip
 * @returns the code of the room to join, or null
 * @remarks
 * Considers only fresh rooms, drops the searcher's own and (when merging) any
 * room not senior to it, then keeps the wished ones unless {@link
 * PickOptions.allowAny} widens it. The oldest eligible room wins, so players
 * pile into one table rather than splitting across several; the code breaks ties.
 */
export function pickRoom(
  rooms: readonly OpenRoom[],
  wish: Wish,
  now: number,
  options: PickOptions,
): string | null {
  const eligible = rooms
    .filter((room) => now - room.ts < MATCH_TTL_MS)
    .filter((room) => room.code !== options.excludeCode)
    .filter(
      (room) => options.seniorTo === undefined || room.code < options.seniorTo,
    )
    .filter((room) => options.allowAny || roomMatchesWish(room, wish));

  const best = eligible.reduce<OpenRoom | null>((chosen, room) => {
    if (chosen === null) {
      return room;
    }
    if (room.ts !== chosen.ts) {
      return room.ts < chosen.ts ? room : chosen;
    }
    return room.code < chosen.code ? room : chosen;
  }, null);

  return best === null ? null : best.code;
}

/**
 * Finds a matching open room to join, or opens a new one to host.
 *
 * @param database - the Realtime Database handle
 * @param gameId - which game to match in
 * @param wish - the table the player wants
 * @param now - the current time in milliseconds
 * @returns the room code and whether this player hosts or joins it
 */
export async function findMatch(
  database: Database,
  gameId: string,
  wish: Wish,
  now: number,
): Promise<Match> {
  const rooms = parseOpenRooms(
    (await get(ref(database, openPath(gameId)))).val(),
  );
  const join = pickRoom(rooms, wish, now, { allowAny: false });
  if (join !== null) {
    return { code: join, mode: "guest" };
  }
  const code = generateRoomCode();
  await hostEntry(database, gameId, code, wish, now);
  return { code, mode: "host" };
}

/**
 * Looks for a room to merge into while waiting alone. Host only.
 *
 * @param database - the Realtime Database handle
 * @param gameId - which game
 * @param wish - the host's own wish
 * @param code - the host's own open room code
 * @param now - the current time in milliseconds
 * @param allowAny - true once the grace has passed, to accept any table
 * @returns the code of a senior room to move into, or null to keep waiting
 * @remarks
 * Only a room senior to (lower-coded than) the host is returned, so of two
 * waiting hosts exactly one moves and they never swap past each other.
 */
export async function relaxMatch(
  database: Database,
  gameId: string,
  wish: Wish,
  code: string,
  now: number,
  allowAny: boolean,
): Promise<string | null> {
  const rooms = parseOpenRooms(
    (await get(ref(database, openPath(gameId)))).val(),
  );
  return pickRoom(rooms, wish, now, {
    allowAny,
    excludeCode: code,
    seniorTo: code,
  });
}

/**
 * Writes or refreshes the host's own open-room entry, to keep it alive.
 *
 * @param database - the Realtime Database handle
 * @param gameId - which game
 * @param code - the host's room code
 * @param wish - the wished config to advertise
 * @param now - the current time in milliseconds
 */
export async function hostEntry(
  database: Database,
  gameId: string,
  code: string,
  wish: Wish,
  now: number,
): Promise<void> {
  const entry: OpenRoom = { code, ...wish, ts: now };
  await set(ref(database, `${openPath(gameId)}/${code}`), entry);
}

/**
 * Removes the host's own open-room entry - on start, cancel or merge. Host only.
 *
 * @param database - the Realtime Database handle
 * @param gameId - which game
 * @param code - the host's room code
 */
export async function clearMatch(
  database: Database,
  gameId: string,
  code: string,
): Promise<void> {
  await remove(ref(database, `${openPath(gameId)}/${code}`));
}
