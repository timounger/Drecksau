/**
 * The state of one game of Arschloch, and the moves that change it.
 *
 * @module
 * @remarks
 * A round is a race to an empty hand: whoever runs out first is the Praesident,
 * whoever is left holding cards is the Arschloch, and the next round begins
 * with the Arschloch handing its best cards over. Everything the referee needs
 * to know sits in one object so a game can be saved, sent over the wire and
 * checked by anybody.
 */
import type { Card } from "./cards";

/** What the table is waiting for. */
export type Phase = "passing" | "playing" | "roundOver" | "gameOver";

/** Every phase, so a stored game can be checked against the list. */
const PHASE_SET: Readonly<Record<Phase, true>> = {
  passing: true,
  playing: true,
  roundOver: true,
  gameOver: true,
};

/** The phases, for the guard that reads a game back. */
export const PHASES: readonly Phase[] = Object.keys(PHASE_SET) as Phase[];

/**
 * What a seat was called at the end of the last round.
 *
 * @remarks
 * The titles the game is named after, and they are not decoration: they decide
 * who hands cards to whom and who leads the first trick. With more than four at
 * the table everybody in the middle is a Buerger, which is exactly what the
 * rules say happens.
 */
export type Title =
  "praesident" | "vize" | "buerger" | "vizearsch" | "arschloch";

/** One player. */
export type ArschlochPlayer = {
  readonly name: string;
  readonly isBot: boolean;
  /** What they are still holding. */
  readonly hand: readonly Card[];
  /** Their title from the round before, or null in the first round. */
  readonly title: Title | null;
  /** Points from the rounds already played. */
  readonly score: number;
  /** True while they have passed on the pile that is lying there. */
  readonly passed: boolean;
};

/** What one seat owes another at the start of a round. */
export type Handover = {
  /** What kind of step it is. */
  readonly kind: HandoverKind;
  /** Who chooses the cards. */
  readonly from: number;
  /**
   * The seat on the other side of it.
   *
   * @remarks
   * For a wish the hand the cards are taken **from**, for a handover the seat
   * they go **to**, and for the deal's leftovers the discarding seat itself -
   * cards nobody gets are still cards somebody puts down.
   */
  readonly to: number;
  /** How many cards. */
  readonly count: number;
};

/**
 * The three things that happen before a round is played.
 *
 * @remarks
 * - `drop`: the seat that was dealt the leftovers puts as many cards away.
 * - `wish`: the Praesident (two) or the Vizepraesident (one) picks cards out
 *   of the loser's hand, which they get to see for it.
 * - `give`: the same seat hands as many cards back, its own choice.
 */
export type HandoverKind = "drop" | "wish" | "give";

/**
 * From this many of one rank on, a card is safe from a wish.
 *
 * @remarks
 * "Ausser der Spieler hat 3 oder mehr von der Sorte" - a set of three is worth
 * more than its cards, and taking one of them would be taking the set. The
 * loser keeps those; everything else is fair game.
 */
export const PROTECTED_COUNT = 3;

/** A whole game. */
export type ArschlochGame = {
  readonly phase: Phase;
  readonly players: readonly ArschlochPlayer[];
  /** Whose turn it is. */
  readonly active: number;
  /** The cards on the table, all of one rank. */
  readonly pile: readonly Card[];
  /**
   * Every card played this round, the pile included.
   *
   * @remarks
   * Public knowledge: it lay face up in the middle when it was played, and
   * anybody at the table could have counted it. It is kept because counting is
   * exactly what the referee does with it - see {@link beatable} - and asking
   * a table to hold thirty cards in their heads is asking for a different game.
   */
  readonly seen: readonly Card[];
  /** Who put them there. */
  readonly lead: number | null;
  /** The seats that have run out, in the order they did. */
  readonly out: readonly number[];
  /** Which round is being played, counting from one. */
  readonly round: number;
  /** How many rounds the game runs for. */
  readonly rounds: number;
  /** The handovers still to be chosen, first one first. */
  readonly owed: readonly Handover[];
  /** Who won, once it is over. */
  readonly winners: readonly number[];
  readonly rng: number;
  readonly seed: number;
  readonly log: readonly string[];
};

/** A move somebody can make. */
export type ArschlochMove =
  /** Put one card or a set of equal cards on the table. */
  | { readonly kind: "play"; readonly cards: readonly string[] }
  /** Leave the pile alone and sit out the rest of this trick. */
  | { readonly kind: "pass" }
  /** Put the leftovers of the deal away, face down. */
  | { readonly kind: "drop"; readonly cards: readonly string[] }
  /** Take these cards out of the loser's hand. */
  | { readonly kind: "wish"; readonly cards: readonly string[] }
  /** Hand the cards back that a title owes. */
  | { readonly kind: "give"; readonly cards: readonly string[] }
  /** Deal the next round. */
  | { readonly kind: "next" };

/** Every move kind, so nothing can be added without the guard knowing. */
const MOVE_SET: Readonly<Record<ArschlochMove["kind"], true>> = {
  play: true,
  pass: true,
  drop: true,
  wish: true,
  give: true,
  next: true,
};

/** The move kinds, for the guard that reads a move off the wire. */
export const MOVE_KINDS: readonly ArschlochMove["kind"][] = Object.keys(
  MOVE_SET,
) as ArschlochMove["kind"][];

/** The fewest players a table seats. */
export const MIN_PLAYERS = 3;

/** The most players a table seats. */
export const MAX_PLAYERS = 6;

/** How many rounds a game runs for unless the settings say otherwise. */
export const DEFAULT_ROUNDS = 5;

/* eslint-disable @typescript-eslint/no-magic-numbers -- the lengths a game is
   played to, which are the numbers themselves. */

/**
 * The rounds on offer.
 *
 * @remarks
 * Odd numbers, and on purpose: with an even count two players can finish level
 * on points, and this game has no tie-break worth the name. Ten is there for a
 * long evening, where a draw is a fair outcome anyway.
 */
export const ROUND_COUNTS: readonly number[] = [3, 5, 7, 10];

/* eslint-enable @typescript-eslint/no-magic-numbers */

/** How many cards the Arschloch hands over, and the Vizearschloch one fewer. */
export const ARSCH_GIVES = 2;

/**
 * From this many seats up, both Vize titles are handed out.
 *
 * @remarks
 * Below it the five titles do not fit: at three there is one seat between the
 * Praesident and the Arschloch, and calling it Vizepraesident and
 * Vizearschloch at once would be two titles for one chair.
 */
const TITLE_SEATS = 4;

/**
 * Which title a finishing place carries.
 *
 * @param place - the place, 0 for the first one out
 * @param seats - how many are playing
 * @returns the title that place gets
 * @remarks
 * "Nach der Reihenfolge des Kartenleerens: Koenig/Praesident, Vizekoenig, dann
 * Buerger ..., Vizearschloch, Arschloch." At three the middle seat is the only
 * Buerger and there is no Vize on either side, which is why the two Vize titles
 * are only handed out once the table is big enough to hold five titles.
 */
export function titleFor(place: number, seats: number): Title {
  const last = seats - 1;
  let title: Title;
  if (place === 0) {
    title = "praesident";
  } else if (place === last) {
    title = "arschloch";
  } else if (seats >= TITLE_SEATS && place === 1) {
    title = "vize";
  } else if (seats >= TITLE_SEATS && place === last - 1) {
    title = "vizearsch";
  } else {
    title = "buerger";
  }
  return title;
}

/**
 * What a place is worth at the end of a round.
 *
 * @param place - the place, 0 for the first one out
 * @param seats - how many are playing
 * @returns the points, from seats-1 down to zero
 * @remarks
 * One point per player beaten. It scales to any table size on its own, which a
 * printed table of titles would not, and it says the same thing the titles say
 * without a second scale to remember.
 */
export function pointsFor(place: number, seats: number): number {
  return seats - 1 - place;
}

/**
 * How many cards a title hands over at the start of a round.
 *
 * @param title - the title from the round before
 * @returns two for the Arschloch, one for the Vizearschloch, none for the rest
 */
export function owesCards(title: Title | null): number {
  let count: number;
  if (title === "arschloch") {
    count = ARSCH_GIVES;
  } else if (title === "vizearsch") {
    count = ARSCH_GIVES - 1;
  } else {
    count = 0;
  }
  return count;
}

/**
 * The seat a title hands its cards to.
 *
 * @param title - the title from the round before
 * @returns the title that receives them, or null when nothing is owed
 */
export function givesTo(title: Title | null): Title | null {
  let to: Title | null;
  if (title === "arschloch") {
    to = "praesident";
  } else if (title === "vizearsch") {
    to = "vize";
  } else {
    to = null;
  }
  return to;
}

/**
 * The seat holding a title.
 *
 * @param game - the game
 * @param title - the title to look for
 * @returns the seat, or null if nobody holds it
 */
export function seatWith(game: ArschlochGame, title: Title): number | null {
  const at = game.players.findIndex((player) => player.title === title);
  return at < 0 ? null : at;
}

/**
 * The cards of a hand that a wish may take.
 *
 * @param game - the game
 * @param seat - whose hand is being looked at
 * @returns the ids that are not part of a set of three or more
 * @remarks
 * "Ausser der Spieler hat 3 oder mehr von der Sorte, dann muss er sie nicht
 * abgeben." Three of a kind is a weapon in this game - it forces everybody to
 * answer with three - and handing one over would not cost a card but the set.
 */
export function wishableIds(
  game: ArschlochGame,
  seat: number,
): readonly string[] {
  const hand = game.players[seat].hand;
  return hand
    .filter(
      (card) =>
        hand.filter((each) => each.rank === card.rank).length < PROTECTED_COUNT,
    )
    .map((card) => card.id);
}

/**
 * Whether a seat has run out of cards.
 *
 * @param game - the game
 * @param seat - the seat
 * @returns true once their hand is empty
 */
export function isOut(game: ArschlochGame, seat: number): boolean {
  return game.players[seat].hand.length === 0;
}

/**
 * Whether a seat may still answer the pile that is lying there.
 *
 * @param game - the game
 * @param seat - the seat
 * @returns true when they are still in this trick
 */
export function stillIn(game: ArschlochGame, seat: number): boolean {
  return !isOut(game, seat) && !game.players[seat].passed;
}
