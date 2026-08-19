/**
 * The game state of The Mind and the moves that change it.
 *
 * @module
 * @remarks
 * A cooperative game with **no turns at all**: everybody holds cards and plays
 * whenever they believe theirs is the lowest one left. That is not a detail of
 * the interface, it is the game - the only thing anybody has to go on is how
 * long the others have been quiet.
 *
 * So the state has no `turn`, and the referee accepts a play from any seat at
 * any moment. Nothing in here ever says whose card is next, because that is
 * precisely the thing the players are supposed to work out.
 */

/** Fewest and most players a game seats. */
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;

/** The deck: every number from one to a hundred, once. */
export const HIGHEST_CARD = 100;

/**
 * How many levels a table plays, by how many sit at it.
 *
 * @remarks
 * Fewer people, more levels: with two players a level of twelve cards each is
 * still readable, with four it would be hopeless.
 */
export const LEVELS_BY_PLAYERS: Readonly<Record<number, number>> = {
  2: 12,
  3: 10,
  4: 8,
};

/** Shuriken everybody starts with. */
export const START_SHURIKENS = 1;

/** Nobody ever holds more than this many lives or shuriken. */
export const MAX_LIVES = 5;
export const MAX_SHURIKENS = 5;

/**
 * Which levels hand out a reward, and what.
 *
 * @remarks
 * Reconstructed rather than copied: see the notes in
 * `docs/games/the-mind/game-rules.md`. Completing the level named here pays
 * the reward beside it. Kept as plain data so a corrected schedule is a
 * one-line change.
 */
export const REWARDS: Readonly<Record<number, readonly Reward[]>> = {
  2: [
    { level: 2, gift: "shuriken" },
    { level: 3, gift: "life" },
    { level: 5, gift: "shuriken" },
    { level: 6, gift: "life" },
    { level: 8, gift: "shuriken" },
    { level: 9, gift: "life" },
    { level: 11, gift: "shuriken" },
  ],
  3: [
    { level: 3, gift: "shuriken" },
    { level: 4, gift: "life" },
    { level: 6, gift: "shuriken" },
    { level: 8, gift: "life" },
    { level: 9, gift: "shuriken" },
  ],
  4: [
    { level: 2, gift: "shuriken" },
    { level: 3, gift: "life" },
    { level: 5, gift: "shuriken" },
    { level: 6, gift: "life" },
    { level: 8, gift: "shuriken" },
  ],
};

/** What finishing a level can hand out. */
export type Reward = {
  readonly level: number;
  readonly gift: "life" | "shuriken";
};

/** One player. */
export type Player = {
  readonly name: string;
  /** True if the computer plays this seat. */
  readonly isBot: boolean;
  /**
   * The cards in hand, lowest first.
   *
   * @remarks
   * Everybody's own business and nobody else's: the online layer blanks every
   * other seat's hand, and there is no move that reads one.
   */
  readonly hand: readonly number[];
  /** True while this seat has its hand up for a shuriken. */
  readonly wantsShuriken: boolean;
};

/** How far the game has got. */
export type MindPhase =
  /** Cards are being played. */
  | "playing"
  /** A level is done and the table is looking at what it cost. */
  | "levelOver"
  /** Out of lives, or through the last level. */
  | "gameOver";

/** What went wrong when a card came down too late. */
export type Mistake = {
  /** The card that was played. */
  readonly played: number;
  /** The seat that played it. */
  readonly seat: number;
  /** The cards that were still lower, and are now gone. */
  readonly lost: readonly number[];
};

/** A move a seat can make - any seat, at any time. */
export type MindMove =
  /** Put your lowest card down. */
  | { readonly kind: "play" }
  /** Raise or lower your hand for a shuriken. */
  | { readonly kind: "shuriken" }
  /** Deal the next level, once the last one has been read. */
  | { readonly kind: "nextLevel" };

/** The whole game at one instant. */
export type MindGame = {
  readonly phase: MindPhase;
  readonly players: readonly Player[];
  /** The level being played, 1-based. */
  readonly level: number;
  /** How many levels this table has in front of it. */
  readonly levels: number;
  readonly lives: number;
  readonly shurikens: number;
  /** The cards played so far this level, in the order they came down. */
  readonly pile: readonly number[];
  /** Cards lost to a mistake or thrown by a shuriken, lowest first. */
  readonly lost: readonly number[];
  /** The mistake just made, for the screen; null while all is well. */
  readonly lastMistake: Mistake | null;
  /** The reward the last finished level paid, or null. */
  readonly lastReward: Reward | null;
  /** True once the table has come through the final level. */
  readonly won: boolean;
  readonly seed: number;
  readonly rng: number;
  readonly log: readonly string[];
};

/**
 * The stand-in for a card this client is not allowed to see, or does not have
 * yet.
 *
 * @remarks
 * Zero, because no real card is zero - the deck is 1 to 100. Online the host
 * publishes every hand as a row of these and sends each seat its own cards on a
 * private channel; the two arrive over separate connections, so for a moment
 * after somebody plays, a client can hold the new table and the old hand. It
 * blanks the hand rather than showing stale numbers, and what is on screen then
 * is this.
 *
 * **Never draw it as a number.** It is the absence of a card, and a screen that
 * prints "0" is claiming to know something it does not.
 */
export const UNKNOWN_CARD = 0;

/**
 * The card on top of the pile, or zero before anything is played.
 *
 * @param game - the current game
 * @returns the highest card played this level
 */
export function topCard(game: MindGame): number {
  return game.pile.length === 0 ? 0 : game.pile[game.pile.length - 1];
}

/**
 * How many cards are still in hands all told.
 *
 * @param game - the current game
 * @returns the number of cards left to play this level
 */
export function cardsLeft(game: MindGame): number {
  return game.players.reduce((sum, player) => sum + player.hand.length, 0);
}

/**
 * The lowest card still in anybody's hand.
 *
 * @param game - the current game
 * @returns the card that ought to come next, or 0 if the level is done
 * @remarks
 * The answer to the whole game, which is why nothing shown to a player is ever
 * derived from it. It exists for the referee, which has to know whether a play
 * was too early, and for the computer players, which are allowed to know their
 * own hand and nothing else.
 */
export function lowestOutstanding(game: MindGame): number {
  return game.players.reduce(
    (lowest, player) =>
      player.hand.length === 0 ? lowest : Math.min(lowest, player.hand[0]),
    HIGHEST_CARD + 1,
  );
}

/**
 * Whether every seat holding cards has its hand up for a shuriken.
 *
 * @param game - the current game
 * @returns true if the star may be thrown
 * @remarks
 * Only seats that still hold something have a say. Somebody who has played
 * everything has nothing to throw and nothing to lose, so waiting for them to
 * agree would let an empty hand veto the table.
 */
export function shurikenAgreed(game: MindGame): boolean {
  const holders = game.players.filter((player) => player.hand.length > 0);
  return holders.length > 0 && holders.every((player) => player.wantsShuriken);
}

/**
 * How many levels this table plays.
 *
 * @param playerCount - how many sit at it
 * @returns the number of levels
 */
export function levelsFor(playerCount: number): number {
  return LEVELS_BY_PLAYERS[playerCount] ?? LEVELS_BY_PLAYERS[MIN_PLAYERS];
}

/**
 * The reward for finishing a level, if there is one.
 *
 * @param playerCount - how many sit at the table
 * @param level - the level just finished
 * @returns the reward, or null
 */
export function rewardFor(playerCount: number, level: number): Reward | null {
  const table = REWARDS[playerCount] ?? [];
  return table.find((entry) => entry.level === level) ?? null;
}
