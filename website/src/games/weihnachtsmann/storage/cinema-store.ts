/**
 * What the cinema remembers between visits, apart from the game's save: the
 * episode watched last, where each episode was left off, and which were
 * watched to the end.
 *
 * @module
 */
import { EPISODES, SHOW_LENGTH } from "@/games/weihnachtsmann/engine/cinema";
import { readStored, storageKey, writeStored } from "@/lib/storage/local-store";

/** Schema version: 2 knows positions and finished episodes. */
const CINEMA_VERSION = 2;

/** The version from before the positions: only the episode watched last. */
const LAST_ONLY_VERSION = 1;

/** Where it lives. */
const CINEMA_KEY = storageKey("weihnachtsmann", "cinema");

/** Closer to the end than this counts as watched to the end, seconds. */
const END_SLACK = 2;

/** Less than this into an episode is no place to come back to, seconds. */
const MIN_POSITION = 1;

/** What the cinema remembers. */
export type CinemaMemory = {
  /** The number of the episode started last, or null. */
  readonly last: number | null;
  /**
   * Where each episode was left off, by its number: seconds into the part
   * shown (0 is 1:04 of the video).
   */
  readonly positions: Readonly<Record<string, number>>;
  /** The numbers of the episodes watched to the end. */
  readonly seen: readonly number[];
};

/** Nothing remembered yet. */
export const NO_MEMORY: CinemaMemory = { last: null, positions: {}, seen: [] };

/** What version 1 kept. */
type LastOnly = { readonly last: number };

/**
 * Reads what the cinema remembers; a version 1 entry keeps its episode.
 *
 * @returns the memory, empty when there is none
 */
export function loadCinema(): CinemaMemory {
  const old = readStored(CINEMA_KEY, LAST_ONLY_VERSION, isLastOnly);
  return (
    readStored(CINEMA_KEY, CINEMA_VERSION, isCinemaMemory) ??
    (old === null ? NO_MEMORY : { ...NO_MEMORY, last: old.last })
  );
}

/**
 * Keeps what the cinema remembers.
 *
 * @param memory - the memory
 */
export function saveCinema(memory: CinemaMemory): void {
  writeStored(CINEMA_KEY, CINEMA_VERSION, memory);
}

/**
 * Notes where an episode was left off. Watched to the end, it is marked seen
 * and starts from the beginning again next time.
 *
 * @param memory - what was remembered so far
 * @param episode - the episode's number
 * @param shown - seconds into the part shown
 * @param finished - whether it was watched to the end
 * @returns the memory with the new place
 */
export function rememberPosition(
  memory: CinemaMemory,
  episode: number,
  shown: number,
  finished: boolean,
): CinemaMemory {
  const key = String(episode);
  const done = finished || shown >= SHOW_LENGTH - END_SLACK;
  const positions = Object.fromEntries(
    Object.entries(memory.positions).filter(([other]) => other !== key),
  );
  if (!done && shown >= MIN_POSITION) {
    positions[key] = Math.min(Math.max(shown, 0), SHOW_LENGTH);
  }
  const seen =
    done && !memory.seen.includes(episode)
      ? [...memory.seen, episode].sort((a, b) => a - b)
      : memory.seen;
  return { last: episode, positions, seen };
}

/**
 * Where an episode was left off.
 *
 * @param memory - the memory
 * @param episode - the episode's number
 * @returns seconds into the part shown, 0 for the beginning
 */
export function positionOf(memory: CinemaMemory, episode: number): number {
  return memory.positions[String(episode)] ?? 0;
}

/** Whether a number is one of the episodes. */
function isEpisode(value: unknown): value is number {
  return (
    typeof value === "number" &&
    EPISODES.some((episode) => episode.number === value)
  );
}

/** Whether a stored value looks like what version 1 kept. */
function isLastOnly(value: unknown): value is LastOnly {
  return (
    typeof value === "object" &&
    value !== null &&
    "last" in value &&
    isEpisode(value.last)
  );
}

/** Whether a stored value looks like what the cinema remembers. */
function isCinemaMemory(value: unknown): value is CinemaMemory {
  const data =
    typeof value === "object" && value !== null
      ? (value as Partial<Record<keyof CinemaMemory, unknown>>)
      : null;
  const positions = data?.positions;
  return (
    data !== null &&
    (data.last === null || isEpisode(data.last)) &&
    typeof positions === "object" &&
    positions !== null &&
    Object.entries(positions).every(
      ([key, at]) =>
        isEpisode(Number(key)) && typeof at === "number" && Number.isFinite(at),
    ) &&
    Array.isArray(data.seen) &&
    data.seen.every(isEpisode)
  );
}
