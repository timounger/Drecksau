/**
 * Automatic matchmaking: players who do not want a private room are put
 * together into a shared public room.
 *
 * @module
 * @remarks
 * A single slot per game, `rooms/{gameId}-__match/waiting`, holds the code of an
 * open public room, or is absent. The first player to look finds it empty and
 * opens a new room as host; later players find the code and join it as guests.
 * The host keeps the slot fresh with a heartbeat and clears it once the game
 * starts, so the next wave of players opens a fresh room. A crashed host leaves
 * a slot that goes stale after {@link MATCH_TTL_MS} and is then replaced.
 *
 * The slot lives under `rooms/` so the existing per-room security rules cover it
 * with no rule change; the double-underscore key never collides with a real
 * four-letter room code. The tricky decisions are pure functions ({@link
 * nextWaiting}, {@link isFreshWaiting}, {@link resolveMatch}) so they are tested
 * without a network.
 */
import { runTransaction, ref, type Database } from "firebase/database";
import { generateRoomCode } from "./room-code";

/** How long an open room's slot stays valid without a heartbeat. */
export const MATCH_TTL_MS = 30_000;

/** The open public room waiting for players. */
export type Waiting = {
  /** The public room's code. */
  readonly code: string;
  /** When the slot was last written, for staleness. */
  readonly ts: number;
};

/** Where to find the player, and whether they must host or join. */
export type Match = {
  readonly code: string;
  readonly mode: "host" | "guest";
};

/** The matchmaking slot for one game. */
function matchPath(gameId: string): string {
  return `rooms/${gameId}-__match/waiting`;
}

/**
 * Whether a stored slot still names a joinable open room.
 *
 * @param value - the stored slot, straight from the database
 * @param now - the current time in milliseconds
 * @returns true if it is a fresh, well-formed waiting slot
 */
export function isFreshWaiting(value: unknown, now: number): value is Waiting {
  const waiting = value as Waiting;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof waiting.code === "string" &&
    waiting.code.length > 0 &&
    typeof waiting.ts === "number" &&
    now - waiting.ts < MATCH_TTL_MS
  );
}

/**
 * The transaction update that opens a room, or steps aside to join one.
 *
 * @param current - the slot's current value
 * @param candidate - the code to open if none is waiting
 * @param now - the current time in milliseconds
 * @returns the new slot to host with, or undefined to abort and join the fresh
 *   room already there
 */
export function nextWaiting(
  current: unknown,
  candidate: string,
  now: number,
): Waiting | undefined {
  // A fresh slot is left untouched (abort) - this player joins it as a guest.
  // Anything else (absent or stale) is claimed by opening a new room.
  return isFreshWaiting(current, now)
    ? undefined
    : { code: candidate, ts: now };
}

/**
 * Reads the outcome of the matchmaking transaction.
 *
 * @param value - the slot's value after the transaction
 * @param candidate - the code this player offered
 * @returns the room to go to and whether to host or join it
 */
export function resolveMatch(value: unknown, candidate: string): Match {
  const waiting = value as Waiting | null;
  const code =
    waiting !== null &&
    typeof waiting === "object" &&
    typeof waiting.code === "string"
      ? waiting.code
      : candidate;
  return { code, mode: code === candidate ? "host" : "guest" };
}

/**
 * Finds an open public room to join, or opens a new one to host.
 *
 * @param database - the Realtime Database handle
 * @param gameId - which game to match in
 * @param now - the current time in milliseconds
 * @returns the room code and whether this player hosts or joins it
 */
export async function findMatch(
  database: Database,
  gameId: string,
  now: number,
): Promise<Match> {
  const candidate = generateRoomCode();
  const result = await runTransaction(ref(database, matchPath(gameId)), (v) =>
    nextWaiting(v, candidate, now),
  );
  return resolveMatch(result.snapshot.val(), candidate);
}

/**
 * Keeps the open room's slot alive while it waits for players. Host only.
 *
 * @param database - the Realtime Database handle
 * @param gameId - which game
 * @param code - the host's own open room code
 * @param now - the current time in milliseconds
 */
export async function refreshMatch(
  database: Database,
  gameId: string,
  code: string,
  now: number,
): Promise<void> {
  await runTransaction(ref(database, matchPath(gameId)), (v) => {
    const waiting = v as Waiting | null;
    // Only bump the slot while it is still ours; if someone else took over
    // (ours went stale and was replaced), leave it alone.
    return waiting !== null && waiting.code === code
      ? { code, ts: now }
      : undefined;
  });
}

/**
 * Clears the open room's slot, so the next player opens a fresh room. Host only.
 *
 * @param database - the Realtime Database handle
 * @param gameId - which game
 * @param code - the host's own open room code
 */
export async function clearMatch(
  database: Database,
  gameId: string,
  code: string,
): Promise<void> {
  await runTransaction(ref(database, matchPath(gameId)), (v) => {
    const waiting = v as Waiting | null;
    // Delete only if it is still our slot; otherwise abort without a write.
    return waiting !== null && waiting.code === code ? null : undefined;
  });
}
