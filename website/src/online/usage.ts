/**
 * How much the collection is used, counted across everybody.
 *
 * @module
 * @remarks
 * **Three numbers, and they answer three different questions.** How often a
 * page was *opened* says what people come looking for; how often a game was
 * *started* says what they then actually played; how long it was played for
 * says whether it held them. The third one already existed - it is what the
 * "Beliebt" shelf is built on, see ./popularity - and this module adds the
 * other two and reads all three back for the dashboard.
 *
 * **Nothing about anybody is stored.** Every write is an atomic increment on a
 * counter per game and UTC day: `rooms/__visits/{gameId}/{YYYY-MM-DD}` and
 * `rooms/__starts/{gameId}/{YYYY-MM-DD}`. There is no visitor id, no address,
 * no session, no device - the database holds numbers and nothing that could be
 * traced back to a person, which is also why this needs no consent banner. The
 * one thing kept in the browser is a note in `sessionStorage` saying which
 * pages this tab has already counted, so that going back and forth does not
 * count five visits; it lives and dies with the tab.
 *
 * **Under `rooms/`** for the reason everything shared lives there: the
 * security rules cover that subtree and nothing else. A double underscore in
 * front, like the other shared nodes, so a room code can never collide with
 * one of them.
 *
 * **Days rather than one total**, for the same reason as the popularity node:
 * a single number can never forget, and "lately" is the question a dashboard
 * is actually asked. The dates are written out (`2026-09-27`) rather than
 * counted from an epoch, because a database that sees small integer keys turns
 * the object into a sparse array.
 */
import type { GameId } from "@/games/registry";
import { dayKey, windowDays } from "@/online/popularity";

/** Where the page opens are counted. */
const VISITS_PATH = "rooms/__visits";

/** And where the games begun are. */
const STARTS_PATH = "rooms/__starts";

/** And where the time played already was - see ./popularity. */
const PLAYED_PATH = "rooms/__played";

/** And where the sort of machine people come with is counted. */
const DEVICES_PATH = "rooms/__devices";

/** What a page that is not a game is filed under. */
export const SITE_KEY = "__site";

/** One game's days: how much happened on each. */
export type Days = Readonly<Record<string, number>>;

/** What the database holds for one of the three numbers. */
export type ByGame = Readonly<Record<string, Days>>;

/** All four, as the dashboard reads them. */
export type Usage = {
  readonly visits: ByGame;
  readonly starts: ByGame;
  readonly played: ByGame;
  /** Keyed by {@link Platform} rather than by game. */
  readonly devices: ByGame;
};

/** Nothing at all, for before the answer arrives. */
export const NO_USAGE: Usage = {
  visits: {},
  starts: {},
  played: {},
  devices: {},
};

/**
 * The sorts of machine this counts, and the only ones.
 *
 * @remarks
 * **Coarse on purpose.** What is worth knowing is whether the site is being
 * used on a phone or at a desk and which shop the browser came from - that is
 * what decides where a layout has to work. A version number would be a
 * fingerprint, which is exactly what this statistic is built not to collect.
 */
export type Platform =
  "windows" | "android" | "ios" | "mac" | "linux" | "chromeos" | "other";

/**
 * Counts one page as opened, once per tab.
 *
 * @param key - the game the page belongs to, or {@link SITE_KEY}
 * @remarks
 * **Once per tab and page**, not once per render: React mounts a component
 * more than once in development, the router brings a page back when one
 * navigates away and returns, and neither of those is somebody arriving. What
 * is counted is therefore closer to "a visit" than to "a paint".
 */
export function reportVisit(key: string): void {
  if (typeof window === "undefined" || seen(key)) {
    return;
  }
  void bump(VISITS_PATH, key);
}

/**
 * Counts one game as begun.
 *
 * @param gameId - which game
 * @remarks
 * Every time, unlike a visit: starting a second game is a second game, and
 * that is exactly the difference between this number and the one above.
 */
export function reportStart(gameId: GameId): void {
  if (typeof window !== "undefined") {
    void bump(STARTS_PATH, gameId);
  }
}

/**
 * Counts the sort of machine this is, once per tab.
 *
 * @remarks
 * **One bucket, once, and nothing else.** Not the browser, not its version,
 * not the screen: a handful of those together are a fingerprint, and the whole
 * point of this statistic is that there is nothing in it to trace. Which of
 * the seven buckets it is gets decided here in the browser - the database
 * never sees a user agent.
 */
export function reportDevice(): void {
  if (typeof window === "undefined" || seen(DEVICE_SEEN)) {
    return;
  }
  const data = (
    navigator as Navigator & { userAgentData?: { platform?: string } }
  ).userAgentData;
  void bump(DEVICES_PATH, platformOf(navigator.userAgent, data?.platform));
}

/**
 * Which sort of machine a user agent belongs to.
 *
 * @param agent - the user agent line
 * @param hint - what `navigator.userAgentData` says, where there is such a thing
 * @returns one of the seven buckets
 * @remarks
 * **The order of the tests is the whole of it.** Android says "Linux" in its
 * user agent and an iPhone says "like Mac OS X", so the specific ones have to
 * be asked first or every phone in the world ends up filed as a desktop. The
 * hint from `userAgentData` is asked alongside the line because that is where
 * Chrome is putting the answer now that the line itself is being frozen.
 */
export function platformOf(agent: string, hint?: string): Platform {
  const line = `${hint ?? ""} ${agent}`.toLowerCase();
  if (line.includes("android")) {
    return "android";
  }
  if (/iphone|ipad|ipod|ios/u.test(line)) {
    return "ios";
  }
  if (/windows|win32|win64/u.test(line)) {
    return "windows";
  }
  if (/cros|chrome os/u.test(line)) {
    return "chromeos";
  }
  if (/mac ?os|macintosh/u.test(line)) {
    return "mac";
  }
  if (/linux|x11|ubuntu|fedora/u.test(line)) {
    return "linux";
  }
  return "other";
}

/**
 * Reads everything the dashboard shows.
 *
 * @returns the three nodes, empty where nothing has been counted
 * @remarks
 * Three reads in parallel rather than three pages: the whole thing is a few
 * hundred numbers, and a dashboard that arrives in one go is a dashboard one
 * can read.
 */
export async function loadUsage(): Promise<Usage> {
  const { database, signIn } = await import("@/online/firebase-app");
  const { get, ref } = await import("firebase/database");
  await signIn();
  const db = database();
  const [visits, starts, played, devices] = await Promise.all([
    get(ref(db, VISITS_PATH)),
    get(ref(db, STARTS_PATH)),
    get(ref(db, PLAYED_PATH)),
    get(ref(db, DEVICES_PATH)),
  ]);
  return {
    visits: clean(visits.val()),
    starts: clean(starts.val()),
    played: clean(played.val()),
    devices: clean(devices.val()),
  };
}

/**
 * What one game did on the given days.
 *
 * @param days - the days of that game, as the database holds them
 * @param which - the day keys that count, or nothing for all of them
 * @returns the sum
 * @remarks
 * Anything that is not a finite positive number is skipped rather than
 * trusted: this is a node every visitor may write to, and one bad value must
 * not decide what the dashboard says.
 */
export function sumDays(
  days: Days | undefined,
  which?: readonly string[],
): number {
  if (days === undefined) {
    return 0;
  }
  const keys = which ?? Object.keys(days);
  let total = 0;
  for (const key of keys) {
    const value = days[key];
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      total += value;
    }
  }
  return total;
}

/**
 * The same over every game at once.
 *
 * @param all - one of the three nodes
 * @param which - the day keys that count, or nothing for all of them
 * @param skip - a key to leave out, e.g. the site itself
 * @returns the sum over every game
 */
export function sumAll(
  all: ByGame,
  which?: readonly string[],
  skip?: string,
): number {
  return Object.entries(all)
    .filter(([key]) => key !== skip)
    .reduce((total, [, days]) => total + sumDays(days, which), 0);
}

/**
 * One line per day, newest last, for the bar chart.
 *
 * @param all - one of the three nodes
 * @param now - the moment the window ends
 * @param days - how many days it spans
 * @param skip - a key to leave out
 * @returns the day and its total, oldest first
 */
export function byDay(
  all: ByGame,
  now: number,
  days: number,
  skip?: string,
): readonly { readonly day: string; readonly count: number }[] {
  return [...windowDays(now, days)].reverse().map((day) => ({
    day,
    count: sumAll(all, [day], skip),
  }));
}

/**
 * The last day anything at all happened for a game.
 *
 * @param days - that game's days
 * @returns the day key, or null where there is nothing
 */
export function lastDay(days: Days | undefined): string | null {
  const keys = Object.entries(days ?? {})
    .filter(([, count]) => typeof count === "number" && count > 0)
    .map(([day]) => day)
    .sort();
  return keys.at(-1) ?? null;
}

/** The day a moment belongs to, in UTC - the same key the writes use. */
export { dayKey, windowDays };

/** Adds one to today's counter under the given node. */
async function bump(path: string, key: string): Promise<void> {
  try {
    const { database, signIn } = await import("@/online/firebase-app");
    const { increment, ref, update } = await import("firebase/database");
    await signIn();
    await update(ref(database(), `${path}/${key}`), {
      [dayKey(Date.now())]: increment(1),
    });
  } catch {
    // Offline, blocked or signed out. A counter is not worth an error on the
    // page it counts: the visit is simply not counted.
  }
}

/**
 * Whether this tab has already counted that page.
 *
 * @param key - the page in question
 * @returns true if it has, and notes it if it has not
 */
function seen(key: string): boolean {
  try {
    const note = `${SEEN_KEY}:${key}`;
    if (window.sessionStorage.getItem(note) !== null) {
      return true;
    }
    window.sessionStorage.setItem(note, "1");
    return false;
  } catch {
    // A browser that refuses storage counts every visit rather than none.
    return false;
  }
}

/** Where the note lives, for as long as the tab does. */
const SEEN_KEY = "drecksau-app/usage/seen";

/** The one note that is not about a page: the machine, counted once a tab. */
const DEVICE_SEEN = "__device";

/** Whatever came back from the database, with only the numbers left in it. */
function clean(value: unknown): ByGame {
  if (typeof value !== "object" || value === null) {
    return {};
  }
  const out: Record<string, Days> = {};
  for (const [key, days] of Object.entries(value as Record<string, unknown>)) {
    if (typeof days === "object" && days !== null) {
      out[key] = days as Days;
    }
  }
  return out;
}
