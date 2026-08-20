/**
 * The whole game at one instant, and who is winning it.
 *
 * @module
 * @remarks
 * Plain data, no methods: the state travels to storage and over the wire, and
 * the referee in `moves.ts` is the only thing that changes it.
 *
 * Two fields carry the awkward parts of the rulebook and are worth reading
 * together. {@link Flip7Game.pending} is an action card lying on the table
 * waiting for its owner to say who it hits; {@link Flip7Game.forced} is a
 * Dreimal in progress. Both interrupt whatever was happening - the opening deal
 * or somebody's turn - and both have to remember enough to put it back
 * afterwards. That is why the thing they interrupt is a separate field,
 * {@link Flip7Game.stage}, rather than a phase they overwrite.
 */
import { FLIP_BONUS, TIMES_FACTOR, type Card } from "./cards";

/** What the table is doing, underneath any interruption. */
export type Stage =
  /** The opening card is going round, one each. */
  | "deal"
  /** Somebody has to take a card or stop. */
  | "turn"
  /** The round is over and the scores are on screen. */
  | "roundEnd"
  | "gameOver";

/** How a player stands in the current round. */
export type Standing =
  /** Still deciding - an "active player" in the rulebook's words. */
  | "in"
  /** Stopped, or frozen: out of the round with the points banked. */
  | "stayed"
  /** Drew a number they already had. Nothing this round. */
  | "busted";

/** A player. */
export type Player = {
  readonly name: string;
  readonly isBot: boolean;
  /** The row of number cards, in the order they were flipped. */
  readonly numbers: readonly Card[];
  /** The plus and times cards above the row. */
  readonly modifiers: readonly Card[];
  /** An unused Zweite Chance lying in front of them. */
  readonly second: Card | null;
  readonly standing: Standing;
  /** Points from the rounds already finished. */
  readonly score: number;
  /** What this round has just been worth, for the score screen. */
  readonly roundScore: number;
};

/** An action card on the table, waiting to be pointed at somebody. */
export type Pending = {
  readonly card: Card;
  /** Who drew it and therefore chooses. */
  readonly by: number;
};

/** A Dreimal being carried out. */
export type Forced = {
  /** Who has to take the cards. */
  readonly at: number;
  /** How many are still to come. */
  readonly left: number;
  /**
   * Action cards turned up during the three, held back until they are over.
   *
   * @remarks
   * "If another Flip Three or Freeze card is revealed they are resolved AFTER
   * all three cards are drawn (but only if the player hasn't busted)." A Zweite
   * Chance is not held back - the rulebook lets that one be used at once, which
   * matters, because the card it saves you from may be the very next one.
   */
  readonly deferred: readonly Card[];
};

/** A move a seat can make. */
export type Flip7Move =
  /** Take one card. */
  | { readonly kind: "hit" }
  /** Stop, and bank what is in front of you. */
  | { readonly kind: "stay" }
  /** Point the action card in your hand at a seat. */
  | { readonly kind: "target"; readonly at: number }
  /** Turn over the next of the three a Dreimal is making you take. */
  | { readonly kind: "flip" }
  /** Deal the next round. */
  | { readonly kind: "next" };

/** The whole game. */
export type Flip7Game = {
  readonly stage: Stage;
  readonly players: readonly Player[];
  /** Whose turn it is, or who is being dealt to. */
  readonly active: number;
  /** Who deals this round; it moves one seat on afterwards. */
  readonly dealer: number;
  /** How many have had their opening card. */
  readonly dealt: number;
  readonly deck: readonly Card[];
  /** Everything out of play, and where a new deck comes from. */
  readonly discard: readonly Card[];
  readonly pending: Pending | null;
  readonly forced: Forced | null;
  /** True once somebody has laid seven numbers, for the score screen. */
  readonly flipped: number | null;
  readonly round: number;
  readonly rng: number;
  readonly seed: number;
  readonly log: readonly string[];
};

/**
 * What the seat you play yourself is called when it has no other name.
 *
 * @remarks
 * Offline there is nobody to tell your name to, so the seat is simply "Du" -
 * and the table then knows not to label it "Du (Du)". Online every seat has a
 * real name and this never comes up.
 */
export const SELF_NAME = "Du";

/** Points that end the game - from the rulebook. */
export const TARGET_SCORE = 200;

/** Fewest players - the box says three. */
export const MIN_PLAYERS = 3;

/** Most players this table seats. */
export const MAX_PLAYERS = 8;

/** Whether this player may still be dealt to. */
export function isActive(player: Player): boolean {
  return player.standing === "in";
}

/** The seats still in the round. */
export function activeSeats(game: Flip7Game): readonly number[] {
  return game.players
    .map((player, seat) => (isActive(player) ? seat : -1))
    .filter((seat) => seat >= 0);
}

/** Whether this player already has that number in front of them. */
export function hasNumber(player: Player, value: number): boolean {
  return player.numbers.some((card) => card.value === value);
}

/**
 * What a player's cards are worth right now.
 *
 * @param player - the player
 * @param bonus - true to add the Flip 7 bonus
 * @returns the points for the round
 * @remarks
 * The order is the rulebook's and it is not the obvious one: the doubler acts on
 * the **numbers alone**, and the plus cards go on afterwards. "First multiply
 * the sum of your Number cards x2, then add the additional Modifier cards."
 */
export function roundValue(player: Player, bonus: boolean): number {
  let points = 0;
  if (player.standing !== "busted") {
    const sum = player.numbers.reduce((total, card) => total + card.value, 0);
    const doubled = player.modifiers.some((card) => card.kind === "times");
    const plus = player.modifiers
      .filter((card) => card.kind === "plus")
      .reduce((total, card) => total + card.value, 0);
    points =
      sum * (doubled ? TIMES_FACTOR : 1) + plus + (bonus ? FLIP_BONUS : 0);
  }
  return points;
}

/** How many cards a player still has in front of them. */
export function cardCount(player: Player): number {
  return (
    player.numbers.length +
    player.modifiers.length +
    (player.second === null ? 0 : 1)
  );
}

/**
 * The seats with the most points.
 *
 * @param game - the game
 * @returns every leading seat, so a tie can be shown as one
 */
export function leaders(game: Flip7Game): readonly number[] {
  const best = game.players.reduce(
    (most, player) => Math.max(most, player.score),
    0,
  );
  return game.players
    .map((player, seat) => (player.score === best ? seat : -1))
    .filter((seat) => seat >= 0);
}
