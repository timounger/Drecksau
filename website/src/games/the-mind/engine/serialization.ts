/**
 * Checking a game read back from storage or off the wire.
 *
 * @module
 * @remarks
 * The state is plain JSON, so it survives a round trip unchanged - but what
 * comes back may be from an older version, hand-edited or simply broken. This
 * guard is the one place that decides whether to trust it.
 *
 * Cards are checked for range, not for uniqueness: a redacted snapshot fills
 * every other seat's hand with zeros so that only its **size** is public, and
 * that has to pass.
 */
import {
  HIGHEST_CARD,
  type MindGame,
  type Mistake,
  type Player,
  type Reward,
} from "./state";

/** The phases a stored game may claim to be in. */
const PHASES: readonly string[] = ["playing", "levelOver", "gameOver"];

/** What a reward may be. */
const GIFTS: readonly string[] = ["life", "shuriken"];

/**
 * Checks an unknown value really is a game of The Mind.
 *
 * @param value - the value read back from storage or the network
 * @returns true if every field has the expected shape
 */
export function isMindGame(value: unknown): value is MindGame {
  const game = value as MindGame;
  return (
    isObject(value) &&
    PHASES.includes(game.phase) &&
    Array.isArray(game.players) &&
    game.players.length > 0 &&
    game.players.every(isPlayer) &&
    isCount(game.level) &&
    isCount(game.levels) &&
    isCount(game.lives) &&
    isCount(game.shurikens) &&
    isCards(game.pile) &&
    isCards(game.lost) &&
    (game.lastMistake === null ||
      isMistake(game.lastMistake, game.players.length)) &&
    (game.lastReward === null || isReward(game.lastReward)) &&
    typeof game.won === "boolean" &&
    typeof game.seed === "number" &&
    typeof game.rng === "number" &&
    Array.isArray(game.log) &&
    game.log.every((line) => typeof line === "string")
  );
}

/** Checks one player. */
function isPlayer(value: unknown): value is Player {
  const player = value as Player;
  return (
    isObject(value) &&
    typeof player.name === "string" &&
    typeof player.isBot === "boolean" &&
    isCards(player.hand) &&
    typeof player.wantsShuriken === "boolean"
  );
}

/** Checks the record of a mistake. */
function isMistake(value: unknown, seats: number): value is Mistake {
  const mistake = value as Mistake;
  return (
    isObject(value) &&
    isCard(mistake.played) &&
    isIndex(mistake.seat, seats) &&
    isCards(mistake.lost)
  );
}

/** Checks a level reward. */
function isReward(value: unknown): value is Reward {
  const reward = value as Reward;
  return (
    isObject(value) && isCount(reward.level) && GIFTS.includes(reward.gift)
  );
}

/** Whether a value is a list of cards. */
function isCards(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(isCard);
}

/** Whether a value is a card - zero included, that is the hidden placeholder. */
function isCard(value: unknown): boolean {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= HIGHEST_CARD
  );
}

/** Whether a value is a seat index of a table that size. */
function isIndex(value: unknown, size: number): boolean {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value < size
  );
}

/** Whether a value is a non-negative whole number. */
function isCount(value: unknown): boolean {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

/** Whether a value is a non-null object. */
function isObject(value: unknown): boolean {
  return typeof value === "object" && value !== null;
}
