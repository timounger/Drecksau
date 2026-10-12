/**
 * The shape of a game of Scotland Yard and the numbers from the box.
 *
 * @module
 */
import type { Transport } from "./map";

/** The standard game, or the simplified one for first-timers. */
export type Variant = "standard" | "intro";

/** A ticket Mister X can cover a move with - a transport, or the black one. */
export type Ticket = "taxi" | "bus" | "underground" | "black";

/** Which side somebody plays. */
export type Role = "misterX" | "detectives";

/** How the game ended, once it has. */
export type EndReason =
  /** A detective or a bobby moved onto Mister X's station. */
  | "caught"
  /** Mister X had no free station left to move to. */
  | "cornered"
  /** The last round ended with Mister X still at large. */
  | "escaped"
  /** Not one detective or bobby could move any more. */
  | "stuck";

/** The land tickets a detective holds. */
export type Tickets = {
  readonly taxi: number;
  readonly bus: number;
  readonly underground: number;
};

/** One person at the table, or a computer in their place. */
export type Player = {
  readonly name: string;
  readonly isBot: boolean;
  readonly role: Role;
};

/** One of the detectives' pieces: a detective, or a bobby helping them. */
export type Detective = {
  readonly name: string;
  readonly colour: string;
  /** A bobby moves for free and is played by the detectives together. */
  readonly bobby: boolean;
  /** The player who moves this piece. */
  readonly controller: number;
  readonly position: number;
  /** What is left on the ticket board; null for a bobby, who needs none. */
  readonly tickets: Tickets | null;
};

/** One line of Mister X's travel log. */
export type LogEntry = {
  /** The ticket on the line; null where the detectives cannot see one. */
  readonly ticket: Ticket | null;
  /** The station written down; null in a view where it is still secret. */
  readonly station: number | null;
  /** Whether Mister X showed himself with this move. */
  readonly shown: boolean;
  /** The round the move was made in. */
  readonly round: number;
  /** True for the first move of a double move. */
  readonly double: boolean;
};

/** Mister X and what he still has. */
export type MisterX = {
  readonly name: string;
  /** The player who moves him. */
  readonly controller: number;
  /** Where he is; null in a view where nobody may know. */
  readonly position: number | null;
  readonly black: number;
  readonly double: number;
};

/** Whose move it is within a round. */
export type Phase = "misterX" | "detectives" | "over";

/** A whole game of Scotland Yard. */
export type ScotlandYardGame = {
  readonly variant: Variant;
  readonly players: readonly Player[];
  readonly misterX: MisterX;
  readonly detectives: readonly Detective[];
  readonly log: readonly LogEntry[];
  /** The general ticket supply Mister X draws from and the detectives pay into. */
  readonly supply: Tickets;
  /** The round being played, from 1. */
  readonly round: number;
  readonly phase: Phase;
  /** True between the two halves of a double move. */
  readonly doubling: boolean;
  /** True once Mister X has played a double move this round. */
  readonly doubledThisRound: boolean;
  /** Which pieces have had their move this round, by index. */
  readonly moved: readonly boolean[];
  /** The last move of each piece this round, by index, for the screen. */
  readonly lastTo: readonly (number | null)[];
  readonly winner: Role | null;
  readonly endReason: EndReason | null;
  /** The piece that caught Mister X, by index, once one has. */
  readonly caughtBy: number | null;
  /** True in a copy made for somebody who may not know where Mister X is. */
  readonly hidden: boolean;
};

/** A move: Mister X's, or one detective piece's. */
export type ScotlandYardMove =
  | {
      readonly kind: "misterX";
      readonly to: number;
      readonly ticket: Ticket;
      /** True to spend a double-move ticket and move again straight after. */
      readonly double: boolean;
    }
  | {
      readonly kind: "detective";
      readonly piece: number;
      readonly to: number;
      readonly ticket: Transport;
    };

/** The fewest people at the table: Mister X and one detective player. */
export const MIN_PLAYERS = 2;

/** The most people at the table: Mister X and five detectives. */
export const MAX_PLAYERS = 6;

/* eslint-disable @typescript-eslint/no-magic-numbers -- the numbers from the box: rounds, start cards, tickets */
/** How many rounds each variant lasts. */
export const ROUNDS: Readonly<Record<Variant, number>> = {
  standard: 22,
  intro: 13,
};

/** After which of his moves Mister X shows himself in the standard game. */
export const REVEAL_MOVES: readonly number[] = [3, 8, 13, 18, 24];

/** Which of his moves Mister X makes unseen in the introductory game. */
export const INTRO_HIDDEN_MOVES: readonly number[] = [3, 8, 13];

/** What every detective starts with in the standard game. */
export const DETECTIVE_TICKETS: Tickets = { taxi: 11, bus: 8, underground: 4 };

/** Every land ticket in the box. */
export const TICKETS_IN_BOX: Tickets = { taxi: 57, bus: 45, underground: 23 };

/** Mister X's special tickets in each variant. */
export const SPECIAL_TICKETS: Readonly<
  Record<Variant, { readonly black: number; readonly double: number }>
> = {
  standard: { black: 5, double: 2 },
  intro: { black: 1, double: 1 },
};

/** The stations on the detectives' start cards. */
export const DETECTIVE_STARTS: readonly number[] = [
  13, 26, 29, 34, 50, 53, 91, 94, 103, 112, 117, 123, 138, 141, 155, 174,
];

/** The stations on Mister X's start cards. */
export const MISTER_X_STARTS: readonly number[] = [
  35, 45, 51, 71, 78, 104, 106, 127, 132, 146, 166, 170, 172,
];

/** Where Mister X starts in the introductory game. */
export const INTRO_MISTER_X_START = 82;

/** Where the detectives start in the introductory game, in order. */
export const INTRO_DETECTIVE_STARTS: readonly number[] = [41, 46, 124, 142];

/* eslint-enable @typescript-eslint/no-magic-numbers */

/** The detectives in the box, with the colour of their piece. */
export const CHARACTERS: readonly {
  readonly name: string;
  readonly colour: string;
}[] = [
  { name: "William", colour: "#dc2626" },
  { name: "Shin", colour: "#2563eb" },
  { name: "Oscar", colour: "#16a34a" },
  { name: "James", colour: "#ea580c" },
  { name: "Noah", colour: "#9333ea" },
];

/** The two names the fugitive can go by. */
export const MISTER_X_NAMES: readonly string[] = ["Mister X", "Ms. X"];

/** How many bobbies help the detectives, by the number of players. */
export const BOBBIES: Readonly<Record<number, number>> = {
  2: 2,
  3: 2,
  4: 1,
  5: 0,
  6: 0,
};

/** The fewest detectives a detective side plays, however few players there are. */
export const MIN_DETECTIVES = 2;

/** How many pieces the detectives move in the introductory game, by players. */
export function introPieces(players: number): number {
  return players >= INTRO_FULL_TABLE
    ? INTRO_DETECTIVE_STARTS.length
    : INTRO_SMALL_TABLE;
}

/** From this many players on, the introductory game has a fourth detective. */
const INTRO_FULL_TABLE = 5;

/** How many detectives the introductory game has below that. */
const INTRO_SMALL_TABLE = 3;
