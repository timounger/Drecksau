/**
 * How much a game has been played lately, counted across everybody.
 *
 * @module
 * @remarks
 * "Beliebt" has to mean something a single browser cannot know, so this is the
 * one number on the start page that comes from the shared database rather than
 * from local storage. What it counts is **time spent playing**, not games
 * started: starting a game says somebody clicked it once, and a shelf built on
 * that rewards a curious click over an evening well spent.
 *
 * Stored as one running total per game and UTC day under
 * `rooms/__played/{gameId}/{YYYY-MM-DD}`, added to with an atomic increment so
 * two players finishing at the same moment cannot overwrite each other. Under
 * `rooms/` for the reason everything shared lives there: the security rules
 * cover that subtree and nothing else.
 *
 * A day key rather than one entry per session, for two reasons. A session list
 * would grow without limit and would have to be read whole to be summed; and a
 * bare total could never forget, so a game popular last spring would sit at the
 * top forever. Days can be windowed, and that is what makes "lately" possible.
 *
 * The dates are written out (`2026-08-21`) rather than counted in days since
 * the epoch, because the database turns an object whose keys are small integers
 * into an array - and a sparse array of a few hundred thousand nulls is not
 * what anybody wants to read back.
 */
import type { GameId } from "@/games/registry";

/** Where the shared totals live. */
const PLAYED_PATH = "rooms/__played";

/** How far back "beliebt" looks. */
export const POPULAR_DAYS = 7;

/** Milliseconds in a day. */
const DAY_MS = 86_400_000;

/**
 * How long play time is collected before it is sent.
 *
 * @remarks
 * The recorder is called after every move, which for one evening is thousands
 * of calls. Batching them into one write every half minute keeps a game of
 * cards from behaving like a chat client - and costs at most half a minute of
 * play time if the tab is closed at the wrong moment.
 */
const FLUSH_EVERY_MS = 30_000;

/** Play time seen since the last write, by game. */
const pending = new Map<string, number>();

/** Set while a write is waiting to happen. */
let flushTimer: ReturnType<typeof setTimeout> | null = null;

/** Whether the leaving-the-page handler is already installed. */
let leaveWatched = false;

/**
 * The day a moment belongs to, in UTC.
 *
 * @param at - the moment, in epoch milliseconds
 * @returns the day as `YYYY-MM-DD`
 * @remarks
 * UTC rather than local time so that everybody adds to the same bucket. A
 * window of days does not care which side of midnight a player was on.
 */
export function dayKey(at: number): string {
  return new Date(at).toISOString().slice(0, "YYYY-MM-DD".length);
}

/**
 * The days a window covers, today first.
 *
 * @param now - the moment the window ends, in epoch milliseconds
 * @param days - how many days it spans, today included
 * @returns the day keys
 */
export function windowDays(now: number, days: number): readonly string[] {
  return Array.from({ length: Math.max(0, days) }, (unused, index) =>
    dayKey(now - index * DAY_MS),
  );
}

/**
 * Adds up one game's buckets inside the window.
 *
 * @param buckets - what the database holds for that game, or nothing
 * @param days - the day keys that count
 * @returns the milliseconds played in those days
 * @remarks
 * Anything that is not a finite number is skipped rather than trusted: this is
 * a node any player can write to, and one bad value must not decide the shelf.
 */
export function playedIn(buckets: unknown, days: readonly string[]): number {
  const byDay = (buckets ?? {}) as Record<string, unknown>;
  let total = 0;
  for (const day of days) {
    const value = byDay[day];
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      total += value;
    }
  }
  return total;
}

/**
 * The play time of every game in the window.
 *
 * @param all - the whole `rooms/__played` node, or nothing
 * @param now - the moment the window ends
 * @returns milliseconds played per game id, only for games with any
 */
export function playTimes(
  all: unknown,
  now: number,
): ReadonlyMap<string, number> {
  const games = (all ?? {}) as Record<string, unknown>;
  const days = windowDays(now, POPULAR_DAYS);
  const times = new Map<string, number>();
  for (const [gameId, buckets] of Object.entries(games)) {
    const played = playedIn(buckets, days);
    if (played > 0) {
      times.set(gameId, played);
    }
  }
  return times;
}

/**
 * Counts a span of play time towards this game's shared total.
 *
 * @param gameId - which game
 * @param elapsedMs - the span that was played
 * @remarks
 * Collected here and written in batches; see {@link FLUSH_EVERY_MS}. Nothing
 * about the player is sent, only that the time happened - the node holds one
 * number per game and day and no trace of who added to it.
 */
export function reportPlayTime(gameId: GameId, elapsedMs: number): void {
  if (elapsedMs > 0 && typeof window !== "undefined") {
    pending.set(gameId, (pending.get(gameId) ?? 0) + elapsedMs);
    watchLeaving();
    flushTimer ??= setTimeout(() => void flush(), FLUSH_EVERY_MS);
  }
}

/**
 * Reads how long every game has been played lately.
 *
 * @returns milliseconds per game id over the last {@link POPULAR_DAYS} days
 * @remarks
 * One read for the whole collection rather than one per game: the start page
 * is the first thing anybody sees, and seventeen round trips to decorate it
 * would be seventeen too many.
 */
export async function loadPlayTimes(): Promise<ReadonlyMap<string, number>> {
  const { database, signIn } = await import("@/online/firebase-app");
  const { get, ref } = await import("firebase/database");
  await signIn();
  const snapshot = await get(ref(database(), PLAYED_PATH));
  return playTimes(snapshot.val(), Date.now());
}

/** Sends what has been collected, and forgets it either way. */
async function flush(): Promise<void> {
  flushTimer = null;
  const batch = [...pending.entries()];
  pending.clear();
  if (batch.length > 0) {
    try {
      const { database, signIn } = await import("@/online/firebase-app");
      const { increment, ref, update } = await import("firebase/database");
      await signIn();
      const day = dayKey(Date.now());
      const db = database();
      await Promise.all(
        batch.map(([gameId, elapsed]) =>
          update(ref(db, `${PLAYED_PATH}/${gameId}`), {
            [day]: increment(Math.round(elapsed)),
          }),
        ),
      );
    } catch {
      // Offline, blocked, or signed out. The span is dropped rather than kept
      // for later: a queue that never drains would grow for as long as the tab
      // is open, and a shelf of popular games is not worth that.
    }
  }
}

/** Writes what is left when the page goes away, once per page. */
function watchLeaving(): void {
  if (!leaveWatched) {
    leaveWatched = true;
    // "pagehide" rather than "unload": it is the one that fires when a phone
    // browser puts the page away, which is how most tabs actually end.
    window.addEventListener("pagehide", () => void flush());
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        void flush();
      }
    });
  }
}
