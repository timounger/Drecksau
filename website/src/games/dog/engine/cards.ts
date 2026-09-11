/**
 * The pack: what is on a card and what it is allowed to do.
 *
 * @module
 * @remarks
 * A hundred and ten cards - eight of every rank of a French pack and six
 * jokers. Thirteen ranks, and seven of them are more than a number: the ace and
 * the king fetch a piece out of the kennel, the four also walks backwards, the
 * seven is split over several pieces and burns everything it passes, the jack
 * swaps two pieces, and the joker is whichever of them you need.
 *
 * Every one of those is a row in {@link POWERS} rather than a branch in the
 * rules: what a rank can do is a property of the rank, and the referee in
 * ./moves only ever asks the table.
 */

/** What is printed on a card. */
export type Rank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K"
  | "joker";

/** One card of the pack. */
export type Card = {
  /** Unique within one pack, so a card can be named across the wire. */
  readonly id: number;
  readonly rank: Rank;
};

/** What a rank may do. */
export type Power = {
  /** How many fields forward it walks - empty for a card that never walks. */
  readonly steps: readonly number[];
  /** Whether it also fetches a piece out of the kennel onto its start field. */
  readonly starts: boolean;
  /** Whether it may walk backwards as well as forwards. */
  readonly backwards: boolean;
  /** Whether its points are split over several pieces, burning what they pass. */
  readonly splits: boolean;
  /** Whether it swaps one of your pieces with somebody else's. */
  readonly swaps: boolean;
  /** Whether it may stand in for any other card. */
  readonly wild: boolean;
};

/** The plain card: so many fields forward and nothing else. */
function plain(steps: number): Power {
  return {
    steps: [steps],
    starts: false,
    backwards: false,
    splits: false,
    swaps: false,
    wild: false,
  };
}

/* eslint-disable @typescript-eslint/no-magic-numbers -- the numbers in this
   table are the numbers on the cards. A five walks five fields, and a constant
   called FIVE between the two would only be a place for them to disagree. */

/** What every rank does. */
export const POWERS: Readonly<Record<Rank, Power>> = {
  A: { ...plain(1), steps: [1, 11], starts: true },
  "2": plain(2),
  "3": plain(3),
  "4": { ...plain(4), backwards: true },
  "5": plain(5),
  "6": plain(6),
  "7": { ...plain(7), splits: true },
  "8": plain(8),
  "9": plain(9),
  "10": plain(10),
  J: { ...plain(0), steps: [], swaps: true },
  Q: plain(12),
  K: { ...plain(13), starts: true },
  joker: { ...plain(0), steps: [], wild: true },
};

/* eslint-enable @typescript-eslint/no-magic-numbers */

/** The ranks, in the order a hand is sorted. */
export const RANKS: readonly Rank[] = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "joker",
];

/** The ranks a joker may stand in for - everything except another joker. */
export const WILD_CHOICES: readonly Rank[] = RANKS.filter(
  (rank) => rank !== "joker",
);

/** How many of each ordinary rank are in the pack. */
const COPIES = 8;

/** How many jokers are in it. */
const JOKERS = 6;

/** How many cards the whole pack holds. */
export const PACK_SIZE = (RANKS.length - 1) * COPIES + JOKERS;

/** What each card is called on screen. */
export const CARD_NAMES: Readonly<Record<Rank, string>> = {
  A: "Ass",
  "2": "Zwei",
  "3": "Drei",
  "4": "Vier",
  "5": "Fünf",
  "6": "Sechs",
  "7": "Sieben",
  "8": "Acht",
  "9": "Neun",
  "10": "Zehn",
  J: "Bube",
  Q: "Dame",
  K: "König",
  joker: "Joker",
};

/** What is printed on the face of the card. */
export const CARD_FACES: Readonly<Record<Rank, string>> = {
  A: "A",
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
  "10": "10",
  J: "B",
  Q: "D",
  K: "K",
  joker: "★",
};

/**
 * A fresh pack, in order.
 *
 * @returns all {@link PACK_SIZE} cards, unshuffled
 */
export function freshPack(): readonly Card[] {
  const cards: Card[] = [];
  for (const rank of RANKS) {
    const many = rank === "joker" ? JOKERS : COPIES;
    for (let copy = 0; copy < many; copy += 1) {
      cards.push({ id: cards.length, rank });
    }
  }
  return cards;
}

/**
 * Whether a rank is one of the special ones - the red cards of the pack.
 *
 * @param rank - the rank in question
 * @returns true for everything that does more than walk forwards
 */
export function isSpecial(rank: Rank): boolean {
  const power = POWERS[rank];
  return (
    power.starts || power.backwards || power.splits || power.swaps || power.wild
  );
}

/**
 * Where a rank sits when a hand is sorted.
 *
 * @param rank - the rank in question
 * @returns its place in {@link RANKS}
 */
export function rankOrder(rank: Rank): number {
  return RANKS.indexOf(rank);
}
