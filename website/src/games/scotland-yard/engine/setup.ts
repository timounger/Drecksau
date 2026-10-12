/**
 * Setting up a game: who plays what, which pieces are on the board, and where
 * they start.
 *
 * @module
 */
import { createRandom, randomInt, shuffle } from "./random";
import {
  BOBBIES,
  CHARACTERS,
  DETECTIVE_STARTS,
  DETECTIVE_TICKETS,
  INTRO_DETECTIVE_STARTS,
  INTRO_MISTER_X_START,
  MAX_PLAYERS,
  MIN_DETECTIVES,
  MISTER_X_STARTS,
  MISTER_X_NAMES,
  ROUNDS,
  SPECIAL_TICKETS,
  TICKETS_IN_BOX,
  introPieces,
  type Detective,
  type Player,
  type Role,
  type ScotlandYardGame,
  type Tickets,
  type Variant,
} from "./state";
import { settle } from "./moves";

/** What the computer is called at the table. */
const COMPUTER_NAME = "Computer";

/** What a game is set up with besides its players. */
export type SetupOptions = {
  readonly variant: Variant;
  /** What the fugitive is called: "Mister X" or "Ms. X". */
  readonly misterXName: string;
};

/**
 * Sets up a new game.
 *
 * @param players - everybody at the table; exactly one plays Mister X
 * @param options - the variant and Mister X's name
 * @param seed - draws the start cards
 * @returns the game, Mister X to move in round 1
 * @remarks
 * The number of detective pieces follows the box. In the standard game every
 * detective player has a detective, but never fewer than two; the bobbies
 * make up the rest - two at a table of two or three, one at four, none from
 * five on. In the introductory game there are no bobbies and the detectives
 * move three pieces, four at a table of five.
 */
export function createGame(
  players: readonly Player[],
  options: SetupOptions,
  seed: number,
): ScotlandYardGame {
  const random = createRandom(seed);
  const misterXIndex = Math.max(
    0,
    players.findIndex((player) => player.role === "misterX"),
  );
  const hunters = players
    .map((player, index) => ({ player, index }))
    .filter(({ index }) => index !== misterXIndex)
    .map(({ index }) => index);
  const table = Math.min(Math.max(players.length, 2), MAX_PLAYERS);
  const intro = options.variant === "intro";
  const characters = intro
    ? introPieces(table)
    : Math.max(hunters.length, MIN_DETECTIVES);
  const bobbies = intro ? 0 : (BOBBIES[table] ?? 0);
  const starts = intro
    ? INTRO_DETECTIVE_STARTS
    : shuffle(random, DETECTIVE_STARTS);
  const misterXStart = intro
    ? INTRO_MISTER_X_START
    : (MISTER_X_STARTS[randomInt(random, MISTER_X_STARTS.length)] ??
      MISTER_X_STARTS[0]);
  const detectives: Detective[] = Array.from(
    { length: characters + bobbies },
    (unused, index) => {
      const character = CHARACTERS[index % CHARACTERS.length];
      const bobby = index >= characters;
      return {
        name: bobby
          ? `Bobby ${String(index - characters + 1)}`
          : character.name,
        colour: character.colour,
        bobby,
        // Round the table: with two detective players and four pieces each
        // has two, the bobbies shared out like the rest.
        controller: hunters[index % Math.max(hunters.length, 1)] ?? 0,
        position: starts[index] ?? DETECTIVE_STARTS[index],
        tickets: bobby || intro ? null : { ...DETECTIVE_TICKETS },
      };
    },
  );
  const special = SPECIAL_TICKETS[options.variant];
  const game: ScotlandYardGame = {
    variant: options.variant,
    players,
    misterX: {
      name: MISTER_X_NAMES.includes(options.misterXName)
        ? options.misterXName
        : MISTER_X_NAMES[0],
      controller: misterXIndex,
      position: misterXStart,
      black: special.black,
      double: special.double,
    },
    detectives,
    log: [],
    supply: intro ? TICKETS_IN_BOX : supplyAfterDealing(detectives),
    round: 1,
    phase: "misterX",
    doubling: false,
    doubledThisRound: false,
    moved: detectives.map(() => false),
    lastTo: detectives.map(() => null),
    winner: null,
    endReason: null,
    caughtBy: null,
    hidden: false,
  };
  return settle(game);
}

/**
 * The table for a game against the computer.
 *
 * @param playerName - what the human is called
 * @param role - the side the human plays
 * @param players - how many sit at the table, Mister X included
 * @returns the players, Mister X first
 * @remarks
 * Whoever plays the detectives here plays all of them: the computer is never
 * given a human's piece to move, and a human never waits on a computer
 * teammate. The count of players still matters, because the box sets the
 * number of pieces by it.
 */
export function soloPlayers(
  playerName: string,
  role: Role,
  players: number,
): readonly Player[] {
  const count = Math.min(Math.max(players, 2), MAX_PLAYERS);
  const misterX: Player = {
    name: role === "misterX" ? playerName : COMPUTER_NAME,
    isBot: role !== "misterX",
    role: "misterX",
  };
  const hunter: Player = {
    name: role === "detectives" ? playerName : COMPUTER_NAME,
    isBot: role !== "detectives",
    role: "detectives",
  };
  return [misterX, ...Array.from({ length: count - 1 }, () => hunter)];
}

/**
 * What is left in the general supply once the detectives have their tickets.
 *
 * @param detectives - the pieces as dealt
 * @returns the box less every ticket on a detective's board
 */
function supplyAfterDealing(detectives: readonly Detective[]): Tickets {
  return detectives.reduce<Tickets>(
    (left, piece) =>
      piece.tickets === null
        ? left
        : {
            taxi: Math.max(0, left.taxi - piece.tickets.taxi),
            bus: Math.max(0, left.bus - piece.tickets.bus),
            underground: Math.max(
              0,
              left.underground - piece.tickets.underground,
            ),
          },
    TICKETS_IN_BOX,
  );
}

/** The rounds a variant lasts, for the screens that show a counter. */
export function roundsOf(variant: Variant): number {
  return ROUNDS[variant];
}
