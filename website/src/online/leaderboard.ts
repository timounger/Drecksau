/**
 * The board of the best results, shared by everybody who plays.
 *
 * @module
 * @remarks
 * One list per game, kept in the same database the online rooms use, so a run
 * finished alone on the sofa and one finished in co-op end up on the same
 * board. Anybody who reaches a place may put a name to it.
 *
 * What counts as "best" is not the same in every game - a drive is better the
 * shorter it took, an arena run the further it got - so a board says which way
 * round it reads and under which key its number is stored. The key is part of
 * the board rather than fixed, because a game's entries outlive this code: the
 * drives already on the board were written with `ms` and have to keep counting.
 *
 * The entries live under `rooms/{gameId}-__best` for the same reason the
 * matchmaking list does: the security rules cover `rooms/` and nothing else,
 * and a key with a double underscore in it can never collide with a real
 * four-letter room code.
 *
 * Everything that decides anything - which ten count, whether a result is good
 * enough - is a pure function down here, so the ranking is tested without a
 * network.
 */
import { get, push, ref } from "firebase/database";
import { database, signIn } from "./firebase-app";

/** One finished run, as it is shown. */
export type Score = {
  /** What the player calls themselves. */
  readonly name: string;
  /** What they achieved: a duration, a wave, whatever the board ranks. */
  readonly value: number;
  /** When it was finished, in epoch milliseconds. */
  readonly at: number;
};

/** One game's board: where it lives and how it reads. */
export type Board = {
  /** Which game, as used in the database path. */
  readonly gameId: string;
  /** Under which key the ranked number is stored. */
  readonly field: string;
  /** True where a smaller number is the better result. */
  readonly less: boolean;
};

/** How many places the board has. */
export const TOP_COUNT = 10;

/** How long a name may be, so one entry cannot push the others off the page. */
export const NAME_LIMIT = 18;

/**
 * Whether one result beats another on this board.
 *
 * @param board - which board, for the direction
 * @param value - the result in question
 * @param than - the result it is held against
 * @returns true if `value` is the better of the two
 */
export function beats(board: Board, value: number, than: number): boolean {
  return board.less ? value < than : value > than;
}

/**
 * The places of the board, best first.
 *
 * @param board - which board, for the direction
 * @param scores - every entry there is, in any order
 * @param count - how many places to fill
 * @returns the entries that hold a place
 * @remarks
 * One place per name, holding their best run: without that a single strong
 * player takes the whole board and there is nothing left to play for. Names
 * are matched ignoring case and outer spaces, because "Timo" and "timo " are
 * the same person to everybody except a computer.
 *
 * Ties are broken by **when**: whoever got there first keeps the higher place,
 * which is the reading everybody expects and, unlike sorting by name, does not
 * change when somebody else finishes.
 */
export function bestOf(
  board: Board,
  scores: readonly Score[],
  count = TOP_COUNT,
): readonly Score[] {
  const best = new Map<string, Score>();
  for (const score of scores) {
    const key = score.name.trim().toLowerCase();
    const kept = best.get(key);
    if (kept === undefined || beats(board, score.value, kept.value)) {
      best.set(key, score);
    }
  }
  return [...best.values()]
    .sort(
      (one, other) =>
        (board.less ? one.value - other.value : other.value - one.value) ||
        one.at - other.at,
    )
    .slice(0, count);
}

/**
 * Whether a result is good enough to go on the board.
 *
 * @param board - which board, for the direction
 * @param scores - every entry there is
 * @param value - the result just achieved
 * @param count - how many places the board has
 * @returns true if that result takes a place
 * @remarks
 * An empty place counts as beatable, so the first ten finishers are all asked
 * for a name however badly they did.
 */
export function makesTheBoard(
  board: Board,
  scores: readonly Score[],
  value: number,
  count = TOP_COUNT,
): boolean {
  const places = bestOf(board, scores, count);
  return (
    places.length < count ||
    beats(board, value, places[places.length - 1].value)
  );
}

/**
 * Turns whatever the database holds into scores.
 *
 * @param board - which board, for the key its number is under
 * @param stored - the raw value under the game's node
 * @returns the entries it holds, ignoring anything malformed
 * @remarks
 * Anything at all can be under there - an old shape, a half-written entry, a
 * value somebody put there by hand. A board that throws on one bad row would
 * show nobody anything, so bad rows are simply skipped.
 */
export function scoresIn(board: Board, stored: unknown): readonly Score[] {
  if (stored === null || typeof stored !== "object") {
    return [];
  }
  const found: Score[] = [];
  for (const value of Object.values(stored as Record<string, unknown>)) {
    if (value === null || typeof value !== "object") {
      continue;
    }
    const row = value as Record<string, unknown>;
    const name = typeof row.name === "string" ? row.name.trim() : "";
    const scored = row[board.field];
    if (name === "" || typeof scored !== "number" || scored <= 0) {
      continue;
    }
    found.push({
      name: name.slice(0, NAME_LIMIT),
      value: scored,
      at: typeof row.at === "number" ? row.at : 0,
    });
  }
  return found;
}

/** Where one game's board lives. */
function boardPath(board: Board): string {
  return `rooms/${board.gameId}-__best`;
}

/**
 * Fetches every entry of a game's board.
 *
 * @param board - which board
 * @returns the entries, unsorted
 */
export async function loadScores(board: Board): Promise<readonly Score[]> {
  await signIn();
  const snap = await get(ref(database(), boardPath(board)));
  return scoresIn(board, snap.val());
}

/**
 * Adds a finished run to a game's board.
 *
 * @param board - which board
 * @param score - the run
 */
export async function saveScore(board: Board, score: Score): Promise<void> {
  await signIn();
  await push(ref(database(), boardPath(board)), {
    name: score.name.trim().slice(0, NAME_LIMIT),
    [board.field]: Math.round(score.value),
    at: score.at,
  });
}
