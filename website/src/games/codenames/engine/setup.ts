/**
 * Laying out a fresh table.
 *
 * @module
 * @remarks
 * Twenty-five words and a key: nine agents for the team that begins, eight for
 * the other, seven bystanders and one assassin. The nine and the eight are what
 * pay for the first move - and that is the only advantage either side gets.
 */
import { createRandom, randomInt, shuffle } from "./random";
import {
  BOARD_SIZE,
  BYSTANDERS,
  MAX_PLAYERS,
  MIN_PLAYERS,
  SECOND_AGENTS,
  STARTER_AGENTS,
  TEAM_NAMES,
  other,
  type Card,
  type CodenamesGame,
  type Owner,
  type Seat,
  type Team,
} from "./state";
import { WORDS } from "./words";

/** A player to seat, before the roles are handed out. */
export type CodenamesSeat = {
  readonly name: string;
  readonly isBot: boolean;
};

/**
 * Deals the table.
 *
 * @param seats - the players, already carrying their side and job
 * @param seed - the shuffle to use, so a game can be replayed exactly
 * @returns a game waiting for the first clue
 */
export function createGame(
  seats: readonly Seat[],
  seed: number,
): CodenamesGame {
  const random = createRandom(seed);
  const words = shuffle(random, WORDS).slice(0, BOARD_SIZE);
  // The key card comes out of the box either way up: which side begins is
  // drawn, not chosen, and it is worth exactly one extra agent.
  const starter: Team = randomInt(random, 2) === 0 ? "red" : "blue";
  const owners = shuffle(random, keyFor(starter));
  const board: Card[] = words.map((entry, at) => ({
    word: entry.word,
    owner: owners[at],
    revealed: false,
  }));
  return {
    phase: "clue",
    seats,
    board,
    turn: starter,
    starter,
    clue: null,
    winner: null,
    byAssassin: false,
    rng: random.state(),
    seed,
    log: [
      `${TEAM_NAMES[starter]} beginnt und hat ${STARTER_AGENTS} Wörter, ${TEAM_NAMES[other(starter)]} hat ${SECOND_AGENTS}.`,
    ],
  };
}

/** The twenty-five identities, unshuffled. */
function keyFor(starter: Team): readonly Owner[] {
  return [
    ...Array.from<Owner>({ length: STARTER_AGENTS }).fill(starter),
    ...Array.from<Owner>({ length: SECOND_AGENTS }).fill(other(starter)),
    ...Array.from<Owner>({ length: BYSTANDERS }).fill("bystander"),
    "assassin",
  ];
}

/**
 * Hands out sides and jobs to a list of players.
 *
 * @param players - the players, in the order they joined
 * @returns the seats, with a side and a job each
 * @remarks
 * Alternating, and the first of each side is its spymaster. The rulebook lets a
 * table sort itself out; a room full of strangers cannot, so the rule is stated
 * instead - and being stated, it is at least predictable from the lobby.
 */
export function assignSeats(
  players: readonly CodenamesSeat[],
): readonly Seat[] {
  const size = Math.min(MAX_PLAYERS, players.length);
  return players.slice(0, size).map((player, at) => ({
    name: player.name,
    isBot: player.isBot,
    team: at % 2 === 0 ? "red" : "blue",
    // Seats 0 and 1 are the first of their side, and take the key.
    role: at < 2 ? "spymaster" : "operative",
  }));
}

/**
 * The table for a game against the computer.
 *
 * @param playerName - what the human seat is called
 * @param seed - decides which side the human plays on
 * @returns four seats, of which exactly one is a person
 * @remarks
 * The human is an **operative**, always. Giving clues is the half of Codenames
 * that needs a sense of language on the other side of the table, and a computer
 * that has to understand a typed clue would only pretend to. Guessing needs
 * nothing of the sort - so that is the job the person gets, and all four other
 * hats are worn by the machine.
 */
export function soloSeats(playerName: string, seed: number): readonly Seat[] {
  const mine: Team = randomInt(createRandom(seed), 2) === 0 ? "red" : "blue";
  const theirs = other(mine);
  return [
    {
      name: `Chef ${TEAM_NAMES[mine]}`,
      team: mine,
      role: "spymaster",
      isBot: true,
    },
    { name: playerName, team: mine, role: "operative", isBot: false },
    {
      name: `Chef ${TEAM_NAMES[theirs]}`,
      team: theirs,
      role: "spymaster",
      isBot: true,
    },
    {
      name: `Team ${TEAM_NAMES[theirs]}`,
      team: theirs,
      role: "operative",
      isBot: true,
    },
  ];
}

/** How many players an online table needs at least. */
export const ONLINE_MINIMUM = MIN_PLAYERS;
