/**
 * The game state of Kniffel and the scoring that decides it.
 *
 * @module
 * @remarks
 * Five dice, three throws, thirteen boxes - and every box may be filled
 * **once**. That last rule is the game: a turn that rolls nothing useful does
 * not simply score little, it costs you a box, and which box you give up is
 * the only real decision on a bad roll.
 *
 * The scoring lives here rather than in the referee because it is a pure
 * question about five dice: what would this roll be worth in that box. The
 * screen asks it to show what is on offer, the computer asks it to choose, and
 * the referee asks it to write the number down.
 */

/** The thirteen boxes of a score sheet. */
export type Category =
  | "einser"
  | "zweier"
  | "dreier"
  | "vierer"
  | "fuenfer"
  | "sechser"
  | "dreierpasch"
  | "viererpasch"
  | "fullHouse"
  | "kleineStrasse"
  | "grosseStrasse"
  | "kniffel"
  | "chance";

/** The boxes of the upper half, in the order they are printed. */
export const UPPER: readonly Category[] = [
  "einser",
  "zweier",
  "dreier",
  "vierer",
  "fuenfer",
  "sechser",
];

/** The boxes of the lower half, in the order they are printed. */
export const LOWER: readonly Category[] = [
  "dreierpasch",
  "viererpasch",
  "fullHouse",
  "kleineStrasse",
  "grosseStrasse",
  "kniffel",
  "chance",
];

/** Every box, upper half first. */
export const CATEGORIES: readonly Category[] = [...UPPER, ...LOWER];

/** German label of every box. */
export const CATEGORY_LABELS: Readonly<Record<Category, string>> = {
  einser: "Einser",
  zweier: "Zweier",
  dreier: "Dreier",
  vierer: "Vierer",
  fuenfer: "Fünfer",
  sechser: "Sechser",
  dreierpasch: "Dreierpasch",
  viererpasch: "Viererpasch",
  fullHouse: "Full House",
  kleineStrasse: "Kleine Straße",
  grosseStrasse: "Große Straße",
  kniffel: "Kniffel",
  chance: "Chance",
};

/** Which number the upper boxes count. */
const UPPER_FACE: Readonly<Record<string, number>> = {
  einser: 1,
  zweier: 2,
  dreier: 3,
  vierer: 4,
  fuenfer: 5,
  sechser: 6,
};

/** Fewest and most players a game seats. */
export const MIN_PLAYERS = 1;
export const MAX_PLAYERS = 6;

/** How many dice are thrown, and how often per turn. */
export const DICE_COUNT = 5;
export const ROLLS_PER_TURN = 3;

/** Faces of one die. */
export const DIE_FACES = 6;

/** What the upper half has to reach for the bonus, and what it pays. */
export const BONUS_TARGET = 63;
export const BONUS_POINTS = 35;

/** How many alike the two passes need. */
export const THREE_OF_A_KIND = 3;
export const FOUR_OF_A_KIND = 4;

/** How long a run the small straight needs; the large one wants all five. */
export const SMALL_STRAIGHT_RUN = 4;

/** The fixed scores of the boxes that do not add dice up. */
export const FULL_HOUSE_POINTS = 25;
export const SMALL_STRAIGHT_POINTS = 30;
export const LARGE_STRAIGHT_POINTS = 40;
export const KNIFFEL_POINTS = 50;

/** One player's sheet: what is written in each box, or null while it is free. */
export type Sheet = Readonly<Record<Category, number | null>>;

/** One player. */
export type Player = {
  readonly name: string;
  /** True if the computer plays this seat. */
  readonly isBot: boolean;
  readonly sheet: Sheet;
};

/** How far the game has got. */
export type KniffelPhase =
  /** Dice are on the table; hold, throw again, or write something down. */
  | "turn"
  /** Every box of every sheet is filled. */
  | "gameOver";

/** A move a seat can make. */
export type KniffelMove =
  /** Keep this die, or let it go again. */
  | { readonly kind: "hold"; readonly index: number }
  /** Throw everything that is not being held. */
  | { readonly kind: "roll" }
  /** Write this roll into a box - even if that means writing a nought. */
  | { readonly kind: "enter"; readonly category: Category };

/** The whole game at one instant. */
export type KniffelGame = {
  readonly phase: KniffelPhase;
  readonly players: readonly Player[];
  readonly active: number;
  /** The five dice as they lie. */
  readonly dice: readonly number[];
  /** Which of them are being kept for the next throw. */
  readonly held: readonly boolean[];
  /** Throws still to come this turn, after the first one. */
  readonly rollsLeft: number;
  /** The round, 1 to thirteen. */
  readonly round: number;
  readonly seed: number;
  readonly rng: number;
  readonly log: readonly string[];
};

/**
 * What a roll is worth in one box.
 *
 * @param dice - the five dice
 * @param category - the box to score it in
 * @returns the points, which may well be nought
 * @remarks
 * Always answerable: every box takes every roll, it is just that most of them
 * are worth nothing. That is why crossing a box out is a move rather than a
 * penalty - you are choosing which nought to write.
 */
export function scoreOf(dice: readonly number[], category: Category): number {
  const counts = faceCounts(dice);
  const sum = dice.reduce((all, die) => all + die, 0);
  let score: number;
  switch (category) {
    case "einser":
    case "zweier":
    case "dreier":
    case "vierer":
    case "fuenfer":
    case "sechser":
      score = counts[UPPER_FACE[category]] * UPPER_FACE[category];
      break;
    case "dreierpasch":
      score = ofAKind(counts, THREE_OF_A_KIND) ? sum : 0;
      break;
    case "viererpasch":
      score = ofAKind(counts, FOUR_OF_A_KIND) ? sum : 0;
      break;
    case "fullHouse":
      score = isFullHouse(counts) ? FULL_HOUSE_POINTS : 0;
      break;
    case "kleineStrasse":
      score =
        longestRun(counts) >= SMALL_STRAIGHT_RUN ? SMALL_STRAIGHT_POINTS : 0;
      break;
    case "grosseStrasse":
      score = longestRun(counts) >= DICE_COUNT ? LARGE_STRAIGHT_POINTS : 0;
      break;
    case "kniffel":
      score = ofAKind(counts, DICE_COUNT) ? KNIFFEL_POINTS : 0;
      break;
    case "chance":
      score = sum;
      break;
  }
  return score;
}

/** How many dice show each face, indexed by the face itself. */
export function faceCounts(dice: readonly number[]): readonly number[] {
  const counts = Array.from({ length: DIE_FACES + 1 }, () => 0);
  for (const die of dice) {
    counts[die] += 1;
  }
  return counts;
}

/** Whether some face turns up at least that often. */
function ofAKind(counts: readonly number[], many: number): boolean {
  return counts.some((count) => count >= many);
}

/**
 * Whether the dice are a full house.
 *
 * @remarks
 * Three of one and two of another - and five of a kind does **not** count.
 * The German sheet is strict about that, and a Kniffel written into the full
 * house is a box thrown away for twenty-five points.
 */
function isFullHouse(counts: readonly number[]): boolean {
  return (
    counts.some((count) => count === THREE_OF_A_KIND) &&
    counts.some((count) => count === 2)
  );
}

/** The longest run of consecutive faces present. */
function longestRun(counts: readonly number[]): number {
  let best = 0;
  let run = 0;
  for (let face = 1; face <= DIE_FACES; face++) {
    run = counts[face] > 0 ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

/** The boxes of a sheet that are still empty. */
export function freeBoxes(sheet: Sheet): readonly Category[] {
  return CATEGORIES.filter((category) => sheet[category] === null);
}

/** What the upper half adds up to, before the bonus. */
export function upperSum(sheet: Sheet): number {
  return UPPER.reduce((sum, category) => sum + (sheet[category] ?? 0), 0);
}

/** The bonus, if the upper half has earned it. */
export function bonusOf(sheet: Sheet): number {
  return upperSum(sheet) >= BONUS_TARGET ? BONUS_POINTS : 0;
}

/** What the lower half adds up to. */
export function lowerSum(sheet: Sheet): number {
  return LOWER.reduce((sum, category) => sum + (sheet[category] ?? 0), 0);
}

/** What a whole sheet is worth. */
export function sheetTotal(sheet: Sheet): number {
  return upperSum(sheet) + bonusOf(sheet) + lowerSum(sheet);
}

/** Whether every box of every sheet has been filled. */
export function isFinished(game: KniffelGame): boolean {
  return game.players.every((player) => freeBoxes(player.sheet).length === 0);
}

/**
 * The players with the highest total.
 *
 * @param game - the current game
 * @returns every seat sharing the best sheet
 */
export function leaders(game: KniffelGame): readonly number[] {
  const totals = game.players.map((player) => sheetTotal(player.sheet));
  const best = totals.reduce((most, score) => Math.max(most, score), 0);
  return totals
    .map((score, seat) => (score === best ? seat : -1))
    .filter((seat) => seat >= 0);
}
