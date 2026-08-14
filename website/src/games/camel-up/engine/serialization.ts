/**
 * Checking a race read back from storage or off the wire.
 *
 * @module
 * @remarks
 * The state is plain JSON, so it survives a round trip unchanged - but what
 * comes back may be from an older version, hand-edited or simply broken. This
 * guard is the one place that decides whether to trust it.
 */
import {
  CAMELS,
  RUN_OFF,
  TRACK_SPACES,
  type Camel,
  type CamelUpGame,
  type DesertTile,
  type LegCard,
  type Player,
  type RaceBet,
  type Roll,
} from "./state";

/** The phases a stored race may claim to be in. */
const PHASES: readonly string[] = ["racing", "legOver", "gameOver"];

/** The two sides of a desert tile. */
const TILE_KINDS: readonly string[] = ["oasis", "mirage"];

/**
 * Checks an unknown value really is a Camel Up race.
 *
 * @param value - the value read back from storage or the network
 * @returns true if every field has the expected shape
 */
export function isCamelUpGame(value: unknown): value is CamelUpGame {
  const game = value as CamelUpGame;
  return (
    isObject(value) &&
    PHASES.includes(game.phase) &&
    Array.isArray(game.players) &&
    game.players.length > 0 &&
    game.players.every(isPlayer) &&
    isIndex(game.turn, game.players.length) &&
    isCount(game.leg) &&
    isTrack(game.track) &&
    Array.isArray(game.dice) &&
    game.dice.every(isCamel) &&
    Array.isArray(game.rolls) &&
    game.rolls.every(isRoll) &&
    Array.isArray(game.tiles) &&
    game.tiles.every((tile) => isTile(tile, game.players.length)) &&
    isLegBets(game.legBets) &&
    isBetPile(game.winnerBets, game.players.length) &&
    isBetPile(game.loserBets, game.players.length) &&
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
    isCount(player.coins) &&
    Array.isArray(player.legCards) &&
    player.legCards.every(isLegCard) &&
    Array.isArray(player.raceCards) &&
    player.raceCards.every(isCamel) &&
    (player.tileAt === null || isCount(player.tileAt))
  );
}

/** Checks the track: the right number of spaces, camels and nothing else. */
function isTrack(value: unknown): value is readonly (readonly Camel[])[] {
  return (
    Array.isArray(value) &&
    value.length === TRACK_SPACES + RUN_OFF &&
    value.every((stack) => Array.isArray(stack) && stack.every(isCamel))
  );
}

/** Checks one leg betting card. */
function isLegCard(value: unknown): value is LegCard {
  const card = value as LegCard;
  return isObject(value) && isCamel(card.camel) && isCount(card.value);
}

/** Checks one roll of the pyramid. */
function isRoll(value: unknown): value is Roll {
  const roll = value as Roll;
  return (
    isObject(value) &&
    isCamel(roll.camel) &&
    isCount(roll.pips) &&
    isCount(roll.seat)
  );
}

/** Checks one desert tile. */
function isTile(value: unknown, seats: number): value is DesertTile {
  const tile = value as DesertTile;
  return (
    isObject(value) &&
    isCount(tile.space) &&
    isIndex(tile.seat, seats) &&
    TILE_KINDS.includes(tile.kind)
  );
}

/** Checks the leg betting cards still on the table. */
function isLegBets(value: unknown): boolean {
  const bets = value as Record<string, unknown>;
  return (
    isObject(value) &&
    CAMELS.every(
      (camel) =>
        Array.isArray(bets[camel]) && (bets[camel] as unknown[]).every(isCount),
    )
  );
}

/** Checks a pile of overall bets. */
function isBetPile(value: unknown, seats: number): value is readonly RaceBet[] {
  return (
    Array.isArray(value) &&
    value.every(
      (bet: RaceBet) => isCamel(bet?.camel) && isIndex(bet?.seat, seats),
    )
  );
}

/** Whether a value is one of the five camels. */
function isCamel(value: unknown): value is Camel {
  return typeof value === "string" && CAMELS.includes(value as Camel);
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
