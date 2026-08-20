/**
 * The whole game at one instant, and who is winning it.
 *
 * @module
 * @remarks
 * Plain data, no methods: the state travels to storage and over the wire, and
 * the referee in `moves.ts` is the only thing that changes it.
 *
 * One field decides everything about this game and is the reason it needs
 * redaction at all: {@link Card.owner}. The spymasters know it for all
 * twenty-five cards from the first second; their operatives learn it one card
 * at a time, by guessing. Every screen, every snapshot on the wire and every
 * computer player is arranged around keeping those two views apart.
 */
import type { Tag } from "./words";

/** The two sides. */
export type Team = "red" | "blue";

/** Who a card belongs to. */
export type Owner = Team | "bystander" | "assassin";

/** What a player does at the table. */
export type Role =
  /** Sees the key and gives the clues. */
  | "spymaster"
  /** Sees only the words, and guesses. */
  | "operative";

/** How far the game has got. */
export type Phase =
  /** The spymaster on turn owes a clue. */
  | "clue"
  /** A clue is on the table and the operatives are guessing. */
  | "guess"
  | "gameOver";

/** One of the twenty-five words on the table. */
export type Card = {
  readonly word: string;
  /**
   * Whose agent it is - or nobody's, or the assassin.
   *
   * @remarks
   * Null on a client that is not allowed to know. That only ever happens to an
   * **unrevealed** card seen by an operative: the moment a card is turned over
   * its owner is public, and it stays public.
   */
  readonly owner: Owner | null;
  readonly revealed: boolean;
};

/** A player, with the side and the job they were given. */
export type Seat = {
  readonly name: string;
  readonly team: Team;
  readonly role: Role;
  readonly isBot: boolean;
};

/** The clue on the table, and how much of it is left. */
export type Clue = {
  readonly word: string;
  /** How many cards it is meant to cover; 0 means "unlimited". */
  readonly count: number;
  /**
   * The category a computer spymaster meant, or null for a person's clue.
   *
   * @remarks
   * Public, and harmless: for a computer clue the tag **is** the word, spelled
   * differently. It is here so a computer operative can tell which words the
   * clue points at without being told which words are its own - it understands
   * the clue perfectly and knows nothing about the key, which is exactly the
   * position a person is in.
   */
  readonly tag: Tag | null;
  /** Guesses still allowed, or null while the clue is unlimited. */
  readonly guessesLeft: number | null;
  /** How many have been made, so "stop" can be forbidden before the first. */
  readonly guessesMade: number;
};

/** A move a seat can make. */
export type CodenamesMove =
  /** Give a clue: one word and a number. */
  | {
      readonly kind: "clue";
      readonly word: string;
      readonly count: number;
      readonly tag?: Tag;
    }
  /** Touch a card. */
  | { readonly kind: "guess"; readonly at: number }
  /** Stop guessing and hand the turn over. */
  | { readonly kind: "stop" };

/** The whole game. */
export type CodenamesGame = {
  readonly phase: Phase;
  readonly seats: readonly Seat[];
  /** The twenty-five words, row by row. */
  readonly board: readonly Card[];
  /** Whose turn it is. */
  readonly turn: Team;
  /** The team that gave the first clue, and therefore has nine words. */
  readonly starter: Team;
  readonly clue: Clue | null;
  /** Who won, once somebody has. */
  readonly winner: Team | null;
  /** True when the game ended because somebody touched the assassin. */
  readonly byAssassin: boolean;
  readonly rng: number;
  readonly seed: number;
  readonly log: readonly string[];
};

/** How wide and tall the grid is - from the rulebook. */
export const GRID_SIDE = 5;

/** How many words are on the table - from the rulebook. */
export const BOARD_SIZE = GRID_SIDE * GRID_SIDE;

/** Agents for the team that begins - from the rulebook. */
export const STARTER_AGENTS = 9;

/** Agents for the other team - from the rulebook. */
export const SECOND_AGENTS = 8;

/** Innocent bystanders - from the rulebook. */
export const BYSTANDERS = 7;

/** The highest number a spymaster may say, so the input has a top. */
export const MAX_CLUE = 9;

/** Fewest and most players an online table seats. */
export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 8;

/** The other side. */
export function other(team: Team): Team {
  return team === "red" ? "blue" : "red";
}

/**
 * How many of a team's agents have been found.
 *
 * @param game - the current game
 * @param team - the side to count
 * @returns the cards of that colour lying face up
 */
export function agentsFound(game: CodenamesGame, team: Team): number {
  return game.board.filter((card) => card.revealed && card.owner === team)
    .length;
}

/**
 * How many of a team's agents are still out there.
 *
 * @param game - the current game
 * @param team - the side to count
 * @returns the cards of that colour still face down
 * @remarks
 * Counted as "started with, minus found" rather than by looking for face-down
 * cards of that colour - because on an operative's board there are no such
 * cards to find. A revealed card always carries its owner; an unrevealed one
 * never does. So this is the one count that means the same thing on every
 * screen at the table, which is what lets the scoreboard be public.
 */
export function agentsLeft(game: CodenamesGame, team: Team): number {
  return agentsTotal(game, team) - agentsFound(game, team);
}

/**
 * How many agents a team started with.
 *
 * @param game - the current game
 * @param team - the side
 * @returns nine for the starting team, eight for the other
 */
export function agentsTotal(game: CodenamesGame, team: Team): number {
  return team === game.starter ? STARTER_AGENTS : SECOND_AGENTS;
}

/** The seat filling one job for one side, or null if nobody does. */
export function seatOf(
  game: CodenamesGame,
  team: Team,
  role: Role,
): number | null {
  const at = game.seats.findIndex(
    (seat) => seat.team === team && seat.role === role,
  );
  return at < 0 ? null : at;
}

/** Every seat on a side with a given job. */
export function seatsOf(
  game: CodenamesGame,
  team: Team,
  role: Role,
): readonly number[] {
  return game.seats
    .map((seat, at) => (seat.team === team && seat.role === role ? at : -1))
    .filter((at) => at >= 0);
}

/** Whether this seat is allowed to see the key. */
export function seesKey(game: CodenamesGame, seat: number): boolean {
  return game.seats[seat]?.role === "spymaster";
}

/** What a team is called. */
export const TEAM_NAMES: Readonly<Record<Team, string>> = {
  red: "Rot",
  blue: "Blau",
};
