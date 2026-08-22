/**
 * Checking a game read back from storage or off the wire.
 *
 * @module
 * @remarks
 * The state is plain JSON, so a round trip leaves it alone - but what comes
 * back may be from an older build, hand-edited, or simply broken. This guard is
 * the one place that decides whether to trust it.
 *
 * It checks shape, not legality. A game where somebody holds Australien with
 * ninety units is not this module's problem: the referee never produced it, and
 * no move will make it worse. What it does insist on is that **every territory
 * is present**, because the rest of the code indexes the board by id and a
 * missing one would read as `undefined` for the whole game rather than fail.
 */
import { HIDDEN_CARD, TRUCE } from "./cards";
import { TERRITORIES, territoryOf } from "./map";
import type { Advance, Battle, RisikoGame, RisikoPlayer } from "./state";

/** The variants a stored game may claim to be. */
const VARIANTS: readonly string[] = ["grundspiel", "klassisch", "zweispieler"];

/** The phases a stored game may claim to be in. */
const PHASES: readonly string[] = [
  "claim",
  "deploy",
  "neutral",
  "reinforce",
  "attack",
  "fortify",
  "gameOver",
];

/**
 * Checks an unknown value really is a game of Risiko.
 *
 * @param value - the value read back from storage or the network
 * @returns true if every field has the expected shape
 */
export function isRisikoGame(value: unknown): value is RisikoGame {
  const game = value as RisikoGame;
  const seats = Array.isArray(game?.players) ? game.players.length : 0;
  return (
    isObject(value) &&
    VARIANTS.includes(game.variant) &&
    PHASES.includes(game.phase) &&
    seats > 0 &&
    game.players.every(isPlayer) &&
    isSeat(game.active, seats) &&
    isBoard(game.owner, seats) &&
    isCounts(game.units) &&
    Number.isInteger(game.toPlace) &&
    Array.isArray(game.pool) &&
    game.pool.every((left) => Number.isInteger(left)) &&
    typeof game.conquered === "boolean" &&
    isAdvance(game.advance) &&
    (game.boosting === null || isSeat(game.boosting, seats)) &&
    isCards(game.deck) &&
    isCards(game.discard) &&
    isBattle(game.lastBattle) &&
    Number.isInteger(game.target) &&
    Array.isArray(game.winners) &&
    game.winners.every((seat) => isSeat(seat, seats)) &&
    Number.isFinite(game.rng) &&
    Number.isFinite(game.seed) &&
    Array.isArray(game.log)
  );
}

/** Whether this is a player. */
function isPlayer(value: unknown): value is RisikoPlayer {
  const player = value as RisikoPlayer;
  return (
    isObject(value) &&
    typeof player.name === "string" &&
    typeof player.isBot === "boolean" &&
    typeof player.isNeutral === "boolean" &&
    typeof player.alive === "boolean" &&
    isCards(player.cards)
  );
}

/**
 * Whether the ownership map covers the whole board.
 *
 * @remarks
 * Every territory, not merely some: the referee reads `owner[id]` for ids it
 * takes from the map module, and a board missing Madagaskar would quietly treat
 * it as owned by seat `undefined` for the rest of the game.
 */
function isBoard(value: unknown, seats: number): boolean {
  const owner = value as Record<string, number>;
  return (
    isObject(value) &&
    TERRITORIES.every(
      (each) =>
        Number.isInteger(owner[each.id]) &&
        owner[each.id] >= -1 &&
        owner[each.id] < seats,
    )
  );
}

/** Whether the unit counts cover the whole board and are not negative. */
function isCounts(value: unknown): boolean {
  const units = value as Record<string, number>;
  return (
    isObject(value) &&
    TERRITORIES.every(
      (each) => Number.isInteger(units[each.id]) && units[each.id] >= 0,
    )
  );
}

/** Whether a pending conquest makes sense. */
function isAdvance(value: unknown): value is Advance | null {
  const advance = value as Advance;
  return (
    value === null ||
    (isObject(value) &&
      territoryOf(advance.from) !== null &&
      territoryOf(advance.to) !== null &&
      Number.isInteger(advance.max) &&
      advance.max >= 0)
  );
}

/** Whether the last battle is a battle. */
function isBattle(value: unknown): value is Battle | null {
  const battle = value as Battle;
  return (
    value === null ||
    (isObject(value) &&
      territoryOf(battle.from) !== null &&
      territoryOf(battle.to) !== null &&
      isDice(battle.attack) &&
      isDice(battle.defence) &&
      Number.isInteger(battle.attackerLost) &&
      Number.isInteger(battle.defenderLost) &&
      typeof battle.taken === "boolean")
  );
}

/** Whether this is a list of dice results. */
function isDice(value: unknown): boolean {
  return Array.isArray(value) && value.every((die) => Number.isInteger(die));
}

/**
 * Whether this is a list of cards.
 *
 * @remarks
 * A territory, the truce card, or {@link HIDDEN_CARD} - somebody else's card as
 * it arrives over the wire. Refusing the last of those here would reject every
 * snapshot but your own.
 */
function isCards(value: unknown): value is readonly string[] {
  return (
    Array.isArray(value) &&
    value.every(
      (card) =>
        typeof card === "string" &&
        (card === TRUCE || card === HIDDEN_CARD || territoryOf(card) !== null),
    )
  );
}

/** Whether this is a seat number at this table. */
function isSeat(value: unknown, seats: number): value is number {
  return (
    Number.isInteger(value) &&
    (value as number) >= 0 &&
    (value as number) < seats
  );
}

/** Whether this is an object at all. */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
