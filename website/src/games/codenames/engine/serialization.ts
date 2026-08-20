/**
 * Checking a game read back from storage or off the wire.
 *
 * @module
 * @remarks
 * The state is plain JSON, so it survives a round trip unchanged - but what
 * comes back may be from an older version, hand-edited or simply broken. This
 * guard is the one place that decides whether to trust it.
 *
 * It checks shape, not legality, with one exception it cannot avoid: a card's
 * owner is allowed to be **null**, because that is exactly what an operative's
 * copy of the board looks like. So this guard cannot tell a redacted game from
 * a suspicious one, and it does not try - the host is the only place a full
 * board is ever needed, and the host is the only place one ever exists.
 */
import {
  BOARD_SIZE,
  type Card,
  type Clue,
  type CodenamesGame,
  type Seat,
} from "./state";
import { TAGS } from "./words";

/** The phases a stored game may claim to be in. */
const PHASES: readonly string[] = ["clue", "guess", "gameOver"];

/** The sides. */
const TEAMS: readonly string[] = ["red", "blue"];

/** Everything a card may belong to. */
const OWNERS: readonly string[] = [...TEAMS, "bystander", "assassin"];

/** The jobs at the table. */
const ROLES: readonly string[] = ["spymaster", "operative"];

/**
 * Checks an unknown value really is a game of Codenames.
 *
 * @param value - the value read back from storage or the network
 * @returns true if every field has the expected shape
 */
export function isCodenamesGame(value: unknown): value is CodenamesGame {
  const game = value as CodenamesGame;
  return (
    isObject(value) &&
    PHASES.includes(game.phase) &&
    Array.isArray(game.seats) &&
    game.seats.length > 0 &&
    game.seats.every(isSeat) &&
    Array.isArray(game.board) &&
    game.board.length === BOARD_SIZE &&
    game.board.every(isCard) &&
    TEAMS.includes(game.turn) &&
    TEAMS.includes(game.starter) &&
    isClue(game.clue) &&
    (game.winner === null || TEAMS.includes(game.winner)) &&
    typeof game.byAssassin === "boolean" &&
    Number.isFinite(game.rng) &&
    Number.isFinite(game.seed) &&
    Array.isArray(game.log)
  );
}

/** Whether this is a player at the table. */
function isSeat(value: unknown): value is Seat {
  const seat = value as Seat;
  return (
    isObject(value) &&
    typeof seat.name === "string" &&
    typeof seat.isBot === "boolean" &&
    TEAMS.includes(seat.team) &&
    ROLES.includes(seat.role)
  );
}

/** Whether this is one of the words on the table. */
function isCard(value: unknown): value is Card {
  const card = value as Card;
  return (
    isObject(value) &&
    typeof card.word === "string" &&
    typeof card.revealed === "boolean" &&
    (card.owner === null || OWNERS.includes(card.owner))
  );
}

/** Whether this is a clue, or the absence of one. */
function isClue(value: unknown): value is Clue | null {
  const clue = value as Clue;
  return (
    value === null ||
    (isObject(value) &&
      typeof clue.word === "string" &&
      Number.isInteger(clue.count) &&
      Number.isInteger(clue.guessesMade) &&
      (clue.guessesLeft === null || Number.isInteger(clue.guessesLeft)) &&
      (clue.tag === null || TAGS.includes(clue.tag)))
  );
}

/** Whether this is an object at all. */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
