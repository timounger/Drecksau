/**
 * The Skyjo game state and the moves that change it.
 *
 * @module
 * @remarks
 * One plain, serialisable value. The whole game is here: every player's layout,
 * the two piles, whose turn it is and the running totals. Time and randomness
 * are passed in from outside, so the rules can be played out in a test without
 * a browser.
 *
 * A slot's `value` is the card lying there - also while it is still face down.
 * Face-down values are the game's secret, and unlike most card games they are
 * secret from their **owner** too. Hiding them for the wire is therefore the
 * transport's job ({@link ../multiplayer/adapter}), not something the rules
 * concern themselves with.
 */

/** How a single card in a layout stands. */
export type SlotState =
  /** Face down - nobody knows the value, not even the owner. */
  | "down"
  /** Face up - everyone can read it. */
  | "up"
  /** Cleared by the column rule and out of the game. */
  | "gone";

/** One of the twelve places in a player's layout. */
export type Slot = {
  readonly state: SlotState;
  /** The card lying here; meaningless once the slot is `gone`. */
  readonly value: number;
};

/** One player at the table. */
export type Player = {
  readonly name: string;
  /** The layout, row-major: four columns, three rows. */
  readonly grid: readonly Slot[];
  /** Points collected over the finished rounds. */
  readonly total: number;
  /** What this player scored in the round just finished, for the result table. */
  readonly roundScore: number;
  /** True if the computer plays this seat. */
  readonly isBot: boolean;
};

/** How far the game has got. */
export type SkyjoPhase =
  /** Everybody turns two of their cards face up, before the first turn. */
  | "flip"
  /** Normal play: the player on turn takes a card. */
  | "turn"
  /** The round is scored and the result is on screen. */
  | "roundOver"
  /** Somebody passed the limit; the game is done. */
  | "gameOver";

/** The whole game at one instant. */
export type SkyjoGame = {
  readonly phase: SkyjoPhase;
  readonly players: readonly Player[];
  /** Whose turn it is, as an index into {@link players}. */
  readonly turn: number;
  /** The current round, 1-based. */
  readonly round: number;
  /** The face-down draw pile; the last entry is the top. */
  readonly deck: readonly number[];
  /** The face-up discard pile; the last entry is the top. */
  readonly discard: readonly number[];
  /** The card drawn from the deck and not yet placed, or null. */
  readonly drawn: number | null;
  /** Who turned their last card face up, ending the round; else null. */
  readonly endedBy: number | null;
  /** The seed the round was dealt from, so a round can be replayed. */
  readonly seed: number;
  /** What happened, newest last - shown as the game log. */
  readonly log: readonly string[];
};

/** A move a player can make. */
export type SkyjoMove =
  /** Turn a face-down card up - during the opening, or after discarding a draw. */
  | { readonly kind: "flip"; readonly index: number }
  /** Take the top of the discard pile into a slot. */
  | { readonly kind: "takeDiscard"; readonly index: number }
  /** Draw the top of the deck and look at it. */
  | { readonly kind: "draw" }
  /** Put the drawn card into a slot, the old card goes to the discard pile. */
  | { readonly kind: "swapDrawn"; readonly index: number }
  /** Throw the drawn card away and turn a face-down card up instead. */
  | { readonly kind: "discardDrawn"; readonly index: number }
  /** Deal the next round, once the last one is scored. */
  | { readonly kind: "nextRound" };

/** How many cards each player turns up before the first turn. */
export const OPENING_FLIPS = 2;

/** Reaching this many points ends the game. */
export const POINT_LIMIT = 100;

/** Fewest and most players a game seats. */
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 8;

/** The top card of a pile, or null if it is empty. */
export function topOf(pile: readonly number[]): number | null {
  return pile.length === 0 ? null : pile[pile.length - 1];
}

/** How many of a player's cards are still face down. */
export function faceDownCount(player: Player): number {
  return player.grid.filter((slot) => slot.state === "down").length;
}

/** Whether every card of a layout is face up or cleared. */
export function isLayoutComplete(player: Player): boolean {
  return faceDownCount(player) === 0;
}

/**
 * What a layout is worth right now.
 *
 * @param player - the player to score
 * @returns the sum of every card still lying there, face down ones included
 * @remarks
 * Used for the end-of-round score, where every card is turned up first. Cleared
 * slots count nothing - that is the whole point of the column rule.
 */
export function layoutValue(player: Player): number {
  return player.grid.reduce(
    (sum, slot) => (slot.state === "gone" ? sum : sum + slot.value),
    0,
  );
}

/** The sum of the cards a player has already turned up. */
export function visibleValue(player: Player): number {
  return player.grid.reduce(
    (sum, slot) => (slot.state === "up" ? sum + slot.value : sum),
    0,
  );
}
