/**
 * Detecting melds in a hand and scoring them.
 *
 * @module
 * @remarks
 * Pure over a hand plus the trump. A family uses up its own King and Ober, so
 * those cards do not also form a separate pair; four/eight of a kind, Binokel
 * and the Dix are scored on their own and may share cards. Within one type each
 * physical card counts once. The table and the deliberate rulings are in
 * `docs/games/binokel/game-rules.md`.
 */
import { SUITS, type Card, type Rank, type Suit } from "./cards";

/** The kinds of meld the engine recognises. */
export type MeldKind =
  | "dix"
  | "paar"
  | "binokel"
  | "doppelbinokel"
  | "vier"
  | "acht"
  | "familie"
  | "doppelteFamilie"
  | "rundgang";

/** One scored meld. */
export type Meld = {
  readonly kind: MeldKind;
  /** For four/eight of a kind - which rank. */
  readonly rank?: Rank;
  /** For pairs and families - which suit. */
  readonly suit?: Suit;
  readonly points: number;
};

/** Point values that do not depend on trump. */
const POINTS = {
  dix: 10,
  paar: 20,
  paarTrump: 40,
  binokel: 40,
  doppelbinokel: 300,
  familie: 100,
  familieTrump: 150,
  doppelteFamilie: 1500,
  rundgang: 240,
  acht: 1000,
} as const;

/** Four-of-a-kind values by rank (Zehn and Sieben never count). */
const VIER_POINTS: Readonly<
  Record<"daus" | "koenig" | "ober" | "unter", number>
> = {
  daus: 100,
  koenig: 80,
  ober: 60,
  unter: 40,
};

/** Ranks that can form four/eight of a kind, highest first. */
const SET_RANKS: readonly ("daus" | "koenig" | "ober" | "unter")[] = [
  "daus",
  "koenig",
  "ober",
  "unter",
];

/** The five ranks a family needs (a suit without its Sieben). */
const FAMILY_RANKS: readonly Rank[] = [
  "daus",
  "zehn",
  "koenig",
  "ober",
  "unter",
];

/** The Binokel meld is the Blatt-Ober together with the Schellen-Unter. */
const BINOKEL_OBER_SUIT: Suit = "blatt";
const BINOKEL_UNTER_SUIT: Suit = "schellen";

/**
 * Finds every meld in a hand.
 *
 * @param hand - the cards to inspect
 * @param trump - the trump suit, or null if not yet announced
 * @param withSevens - whether the deck has Sevens (needed for the Dix)
 * @returns the melds and their total points
 */
export function findMelds(
  hand: readonly Card[],
  trump: Suit | null,
  withSevens: boolean,
): { melds: Meld[]; total: number } {
  const count = counter(hand);
  const melds: Meld[] = [
    ...familyPairRundgangMelds(count, trump),
    ...binokelMelds(count),
    ...setMelds(count),
    ...dixMelds(count, trump, withSevens),
  ];
  const total = melds.reduce((sum, meld) => sum + meld.points, 0);
  return { melds, total };
}

/** Builds a fast lookup of how many of each card the hand holds (0, 1 or 2). */
function counter(hand: readonly Card[]): (suit: Suit, rank: Rank) => number {
  const counts = new Map<string, number>();
  for (const card of hand) {
    const key = `${card.suit}-${card.rank}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return (suit, rank) => counts.get(`${suit}-${rank}`) ?? 0;
}

/**
 * Families, then König+Ober pairs from what the families leave, then Rundgang.
 *
 * @remarks
 * A family consumes one König and one Ober of its suit, so those cards cannot
 * also be a pair. A Rundgang (a pair in every suit) is scored from the pairs
 * that remain, ahead of the individual pairs.
 */
function familyPairRundgangMelds(
  count: (suit: Suit, rank: Rank) => number,
  trump: Suit | null,
): Meld[] {
  const melds: Meld[] = [];

  // Families first, and how many King+Ober pairs each suit has left over.
  const remainingPairs = SUITS.map((suit) => {
    const familyCount = Math.min(
      ...FAMILY_RANKS.map((rank) => count(suit, rank)),
    );
    if (familyCount >= 2) {
      melds.push({
        kind: "doppelteFamilie",
        suit,
        points: POINTS.doppelteFamilie,
      });
    } else if (familyCount >= 1) {
      melds.push({
        kind: "familie",
        suit,
        points: suit === trump ? POINTS.familieTrump : POINTS.familie,
      });
    }
    return Math.min(
      count(suit, "koenig") - familyCount,
      count(suit, "ober") - familyCount,
    );
  });

  // A Rundgang takes one leftover pair from every suit; then the rest score singly.
  const rundgaenge = Math.min(...remainingPairs);
  for (let i = 0; i < rundgaenge; i++) {
    melds.push({ kind: "rundgang", points: POINTS.rundgang });
  }
  SUITS.forEach((suit, index) => {
    for (let i = 0; i < remainingPairs[index] - rundgaenge; i++) {
      melds.push({
        kind: "paar",
        suit,
        points: suit === trump ? POINTS.paarTrump : POINTS.paar,
      });
    }
  });
  return melds;
}

/** Binokel (Blatt-Ober + Schellen-Unter), doubled to a Doppelbinokel. */
function binokelMelds(count: (suit: Suit, rank: Rank) => number): Meld[] {
  const pairs = Math.min(
    count(BINOKEL_OBER_SUIT, "ober"),
    count(BINOKEL_UNTER_SUIT, "unter"),
  );
  let melds: Meld[];

  if (pairs >= 2) {
    melds = [{ kind: "doppelbinokel", points: POINTS.doppelbinokel }];
  } else if (pairs === 1) {
    melds = [{ kind: "binokel", points: POINTS.binokel }];
  } else {
    melds = [];
  }
  return melds;
}

/** Four and eight of a kind (Eight replaces Four for the same rank). */
function setMelds(count: (suit: Suit, rank: Rank) => number): Meld[] {
  const melds: Meld[] = [];
  for (const rank of SET_RANKS) {
    const allEight = SUITS.every((suit) => count(suit, rank) === 2);
    const allFour = SUITS.every((suit) => count(suit, rank) >= 1);
    if (allEight) {
      melds.push({ kind: "acht", rank, points: POINTS.acht });
    } else if (allFour) {
      melds.push({ kind: "vier", rank, points: VIER_POINTS[rank] });
    }
  }
  return melds;
}

/** The Dix - the trump Seven - worth 10 each (only with Sevens). */
function dixMelds(
  count: (suit: Suit, rank: Rank) => number,
  trump: Suit | null,
  withSevens: boolean,
): Meld[] {
  const melds: Meld[] = [];
  if (withSevens && trump !== null) {
    const dix = count(trump, "sieben");
    for (let i = 0; i < dix; i++) {
      melds.push({ kind: "dix", points: POINTS.dix });
    }
  }
  return melds;
}
