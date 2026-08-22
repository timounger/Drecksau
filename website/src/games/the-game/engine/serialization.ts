/**
 * Checking a game read back from storage or off the wire.
 *
 * @module
 * @remarks
 * The state is plain JSON, so a round trip leaves it alone - but what comes
 * back may be from an older build, hand-edited, or simply broken. This guard is
 * the one place that decides whether to trust it.
 *
 * It checks shape, not legality. A row whose numbers run the wrong way is not
 * this module's problem: the referee never produced it, and no move will make
 * it worse.
 */
import { HIDDEN, HIGHEST, LOWEST, PILE_COUNT, type Pile } from "./cards";
import type { Hint, TheGame, TheGamePlayer } from "./state";

/** The phases a stored game may claim to be in. */
const PHASES: readonly string[] = ["playing", "won", "lost"];

/** The requests a stored game may carry. */
const HINTS: readonly string[] = ["keep", "small"];

/** Which ways a row may run. */
const KINDS: readonly string[] = ["up", "down"];

/**
 * Checks an unknown value really is a game of Das Spiel.
 *
 * @param value - the value read back from storage or the network
 * @returns true if every field has the expected shape
 */
export function isTheGame(value: unknown): value is TheGame {
  const game = value as TheGame;
  const seats = Array.isArray(game?.players) ? game.players.length : 0;
  return (
    isObject(value) &&
    PHASES.includes(game.phase) &&
    seats > 0 &&
    game.players.every(isPlayer) &&
    isSeat(game.active, seats) &&
    Array.isArray(game.piles) &&
    game.piles.length === PILE_COUNT &&
    game.piles.every(isPile) &&
    isCards(game.draw) &&
    Number.isInteger(game.placed) &&
    Number.isInteger(game.handSize) &&
    Number.isInteger(game.minPerTurn) &&
    isHints(game.hints) &&
    Number.isFinite(game.rng) &&
    Number.isFinite(game.seed) &&
    Array.isArray(game.log)
  );
}

/** Whether this is a player. */
function isPlayer(value: unknown): value is TheGamePlayer {
  const player = value as TheGamePlayer;
  return (
    isObject(value) &&
    typeof player.name === "string" &&
    typeof player.isBot === "boolean" &&
    isCards(player.hand)
  );
}

/** Whether this is one of the four rows. */
function isPile(value: unknown): value is Pile {
  const pile = value as Pile;
  return (
    isObject(value) &&
    KINDS.includes(pile.kind) &&
    Array.isArray(pile.cards) &&
    pile.cards.length > 0 &&
    pile.cards.every((card) => Number.isInteger(card))
  );
}

/** Whether this is a list of number cards, hidden ones included. */
function isCards(value: unknown): value is readonly number[] {
  return Array.isArray(value) && value.every(isCard);
}

/**
 * Whether this is a card value.
 *
 * @remarks
 * {@link HIDDEN} passes too. A hand arriving from another player is a row of
 * those, and refusing them here would reject every snapshot but your own.
 */
function isCard(value: unknown): value is number {
  return (
    Number.isInteger(value) &&
    ((value as number) === HIDDEN ||
      ((value as number) >= LOWEST && (value as number) <= HIGHEST))
  );
}

/** Whether the requests on the rows are requests. */
function isHints(value: unknown): value is Readonly<Record<string, Hint>> {
  return (
    isObject(value) &&
    Object.values(value).every(
      (hint) => typeof hint === "string" && HINTS.includes(hint),
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
