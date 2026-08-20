/**
 * The whole game at one instant, and what it is worth.
 *
 * @module
 * @remarks
 * Plain data, no methods: the state travels to storage and over the wire, and
 * the referee in `moves.ts` is the only thing that changes it.
 *
 * The one shape worth explaining is a cow. It is a head, a run of middles and a
 * rear, kept as three fields rather than one list, because every rule in the
 * book talks about them separately: a cow needs a head **and** a rear to exist
 * at all, feed adds a middle, and the Kuhschubser strips the middles and leaves
 * the animal standing. A flat list would make each of those a search.
 */
import type { Breed, Card } from "./cards";

/** How far the game has got. */
export type Phase =
  /** Somebody is choosing how to get cards - the first half of their turn. */
  | "draw"
  /** Everybody is picking two cards to pass left. */
  | "trade"
  /** Somebody is laying cards out - the second half of their turn. */
  | "play"
  /** An attack is in the air and its target may still turn it away. */
  | "defend"
  | "gameOver";

/** A cow lying in somebody's herd. */
export type Cow = {
  readonly id: string;
  readonly head: Card;
  /** Between head and rear, in the order they were slotted in. */
  readonly middles: readonly Card[];
  readonly rear: Card;
  /**
   * The Brandeisen or Stall lying on it, or null while it is fair game.
   *
   * @remarks
   * The card itself, not its name. It has to be somewhere - on the table it
   * lies across the cow - and anything less would quietly lose it from the
   * ninety.
   */
  readonly guard: Card | null;
};

/** A player at the table. */
export type Player = {
  readonly name: string;
  readonly isBot: boolean;
  readonly hand: readonly Card[];
  readonly herd: readonly Cow[];
  /** Calves stand on their own - they are not part of any cow. */
  readonly calves: readonly Card[];
  /** The two cards passed left, while a Kuhhandel is being answered. */
  readonly trade: readonly string[] | null;
};

/** The three ribbons, and who holds each. */
export type Awards = {
  /** Whoever laid the first cow. Never changes hands again. */
  readonly firstCow: number | null;
  readonly biggestHerd: number | null;
  readonly longestCow: number | null;
};

/** An attack waiting to see whether the Herdenhund comes out. */
export type Pending = {
  readonly by: number;
  readonly target: number;
  /** The attack card, already out of its owner's hand. */
  readonly card: Card;
  /** The cow it is aimed at, or null for a calf. */
  readonly cowId: string | null;
};

/** The whole game. */
export type KuhleKueheGame = {
  readonly phase: Phase;
  readonly players: readonly Player[];
  /** Whose turn it is. */
  readonly active: number;
  readonly draw: readonly Card[];
  /** Face up, and searchable - the rules let you rummage for a cow part. */
  readonly discard: readonly Card[];
  readonly awards: Awards;
  readonly pending: Pending | null;
  /**
   * Set once the draw pile runs out; everybody else gets one more turn.
   *
   * @remarks
   * Holds the seat that emptied it, so the game can stop when the turn comes
   * back round to them rather than counting turns.
   */
  readonly emptiedBy: number | null;
  /** True while the active player may still lay a cow of crossed breeds. */
  readonly crossing: number | null;
  readonly rng: number;
  readonly seed: number;
  readonly log: readonly string[];
};

/** A move a seat can make. */
export type KuhleKueheMove =
  /** Phase 1: take two off the deck. */
  | { readonly kind: "drawTwo" }
  /** Phase 1: take one named cow part off the discard pile. */
  | { readonly kind: "takeDiscard"; readonly cardId: string }
  /** Phase 1: call a Kuhhandel. */
  | { readonly kind: "trade" }
  /** Answering a Kuhhandel: the two cards this seat passes left. */
  | { readonly kind: "pass"; readonly cardIds: readonly string[] }
  /** Phase 2: lay a new cow out of these cards, head and rear included. */
  | { readonly kind: "layCow"; readonly cardIds: readonly string[] }
  /** Phase 2: put a calf down. */
  | { readonly kind: "layCalf"; readonly cardId: string }
  /** Phase 2: play an action card. */
  | {
      readonly kind: "action";
      readonly cardId: string;
      /** Whose herd it lands in, for the cards that need one. */
      readonly target?: number;
      readonly cowId?: string;
      /** The middle to slot in, for feed. */
      readonly middleId?: string;
    }
  /** Defending: put the dog in the way, or wave the attack through. */
  | { readonly kind: "defend"; readonly cardId: string }
  | { readonly kind: "letThrough" }
  /** Phase 2: done - "Muh!". */
  | { readonly kind: "endTurn"; readonly discardIds?: readonly string[] };

/** How many cards each player starts with. */
export const START_HAND = 6;

/** The most a player may hold at the end of their turn. */
export const HAND_LIMIT = 8;

/** Cards each player passes in a Kuhhandel. */
export const TRADE_SIZE = 2;

/** The fewest cards a cow can have: a head and a rear. */
export const MIN_COW = 2;

/** Cows needed before the biggest-herd ribbon is handed out at all. */
export const HERD_MINIMUM = 3;

/** Cards a cow needs before the longest-cow ribbon is handed out at all. */
export const LONGEST_MINIMUM = 5;

/** What each ribbon is worth. */
export const AWARD_POINTS = { firstCow: 1, biggestHerd: 2, longestCow: 3 };

/** A pure-bred cow is worth this per card. */
const PURE_PER_CARD = 2;

/** A mixed or crossed cow, and a calf, is worth this per card. */
const MIXED_PER_CARD = 1;

/** Fewest and most players. */
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 5;

/**
 * Every card of a cow, front to back.
 *
 * @param cow - the cow
 * @returns head, middles, rear
 */
export function cowCards(cow: Cow): readonly Card[] {
  return [cow.head, ...cow.middles, cow.rear];
}

/**
 * The breeds a cow is made of, jokers left out.
 *
 * @param cow - the cow
 * @returns the distinct breeds, which is empty for a cow of nothing but jokers
 * @remarks
 * Jokers are left out on purpose: the rulebook says they "count as no breed",
 * which is what makes a joker legal in any cow without a crossing card.
 */
export function breedsOf(cow: Cow): readonly Breed[] {
  const seen = new Set<Breed>();
  for (const card of cowCards(cow)) {
    if (card.kind === "cow" && card.breed !== null) {
      seen.add(card.breed);
    }
  }
  return [...seen];
}

/**
 * Whether a cow is pure-bred, and so worth double.
 *
 * @param cow - the cow
 * @returns true for one breed and not a joker in sight
 * @remarks
 * A joker spoils it even though it is not a breed - "deshalb erhältst du am
 * Spielende für gemischte Kühe, in denen mindestens ein Joker liegt, auch nur 1
 * Siegpunkt pro Karte". So this asks two separate questions, not one.
 */
export function isPure(cow: Cow): boolean {
  const hasJoker = cowCards(cow).some(
    (card) => card.kind === "cow" && card.breed === null,
  );
  return !hasJoker && breedsOf(cow).length === 1;
}

/** What one cow is worth at the end. */
export function cowPoints(cow: Cow): number {
  return cowCards(cow).length * (isPure(cow) ? PURE_PER_CARD : MIXED_PER_CARD);
}

/**
 * How many cows a herd counts as for the biggest-herd ribbon.
 *
 * @param player - the player
 * @returns cows plus calves
 * @remarks
 * "Jedes Kalb ... gilt als 1 Kuh innerhalb der Herde (siehe Auszeichnung DIE
 * GRÖSSTE HERDE) bei der Zählung." So a calf is a whole cow here and a single
 * point at the end - the one place the two counts disagree.
 */
export function herdSize(player: Player): number {
  return player.herd.length + player.calves.length;
}

/** The most cards in any one of this player's cows. */
export function longestCow(player: Player): number {
  return player.herd.reduce(
    (best, cow) => Math.max(best, cowCards(cow).length),
    0,
  );
}

/**
 * What a player has scored.
 *
 * @param game - the game
 * @param seat - the player
 * @returns their total, ribbons included
 */
export function scoreOf(game: KuhleKueheGame, seat: number): number {
  const player = game.players[seat];
  const herd = player.herd.reduce((sum, cow) => sum + cowPoints(cow), 0);
  const calves = player.calves.length * MIXED_PER_CARD;
  return herd + calves + awardPoints(game.awards, seat);
}

/** What the ribbons in front of a seat are worth. */
export function awardPoints(awards: Awards, seat: number): number {
  return (
    (awards.firstCow === seat ? AWARD_POINTS.firstCow : 0) +
    (awards.biggestHerd === seat ? AWARD_POINTS.biggestHerd : 0) +
    (awards.longestCow === seat ? AWARD_POINTS.longestCow : 0)
  );
}

/**
 * The seats with the highest score.
 *
 * @param game - a finished game
 * @returns every leading seat, so a tie can be shown as one
 */
export function leaders(game: KuhleKueheGame): readonly number[] {
  const scores = game.players.map((unused, seat) => scoreOf(game, seat));
  const best = Math.max(...scores);
  return scores
    .map((score, seat) => ({ score, seat }))
    .filter((entry) => entry.score === best)
    .map((entry) => entry.seat);
}
