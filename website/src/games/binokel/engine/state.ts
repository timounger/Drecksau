/**
 * State shape of a Binokel game and small read-only helpers.
 *
 * @module
 * @remarks
 * A round runs through phases: bidding -> exchange (the declarer takes the Dabb
 * and discards) -> melding -> trick play -> scoring, then the next round is
 * dealt. Everything is plain data so it serializes and replays from a seed.
 */
import type { Card, Suit } from "./cards";
import type { RandomState } from "./random";

/** Identifies a player for the whole game. */
export type PlayerId = string;

/** Where a round currently is. */
export type Phase =
  "bidding" | "exchange" | "melding" | "trick" | "roundEnd" | "matchEnd";

/** What the declarer plays: a normal game or a "Durch" (win every trick). */
export type GameType = "normal" | "durch";

/** A single line of the game log, already translated for the UI. */
export type LogEntry = {
  readonly id: number;
  readonly text: string;
};

/** One card played into the current trick. */
export type TrickCard = {
  readonly playerIndex: number;
  readonly card: Card;
};

/** A player at the table. */
export type BinokelPlayer = {
  readonly id: PlayerId;
  readonly name: string;
  readonly isHuman: boolean;
  /** Cards still in hand. */
  readonly hand: readonly Card[];
  /** Cards captured in tricks this round - their Augen are the trick points. */
  readonly won: readonly Card[];
  /** Meld points declared this round (0 until melding). */
  readonly meldPoints: number;
  /** True once the player has taken at least one trick (melds only count then). */
  readonly hasTrick: boolean;
  /** Cumulative match score across rounds. */
  readonly score: number;
  /** The player's current bid, or null once they have passed. */
  readonly bid: number | null;
  /** True while the player is still in the bidding. */
  readonly bidding: boolean;
};

/** The complete state of a Binokel game. */
export type GameState = {
  readonly players: readonly BinokelPlayer[];
  /** True for the 48-card deck, false for 40 cards. */
  readonly withSevens: boolean;
  /**
   * Whether a Dabb (widow) is played. Without it the cards are dealt out as far
   * as they divide; any remainder still forms a small Dabb.
   */
  readonly withDabb: boolean;
  /**
   * Whether two teams play (cross partnership: even seats vs odd seats). Only
   * for four or six players; teammates pool their points.
   */
  readonly teams: boolean;
  /** Points that end the match. */
  readonly targetScore: number;
  readonly dealerIndex: number;
  readonly phase: Phase;
  /** The face-down widow; emptied once the declarer takes it. */
  readonly dabb: readonly Card[];
  /**
   * The cards the declarer just took from the Dabb, kept apart from the rest of
   * the hand so the discard UI can show them as their own row. Empty except
   * during the declarer's discard step.
   */
  readonly takenDabb: readonly Card[];
  readonly currentPlayerIndex: number;
  /** Highest bid so far this round. */
  readonly highestBid: number;
  /** Who won the bidding, or null while still bidding. */
  readonly declarerIndex: number | null;
  /** The declarer's chosen trump, or null until announced. */
  readonly trump: Suit | null;
  /** Normal or Durch, chosen by the declarer after melding; null until then. */
  readonly gameType: GameType | null;
  /** True if the declarer conceded (went off) instead of playing the round. */
  readonly conceded: boolean;
  readonly currentTrick: readonly TrickCard[];
  /** Who leads the current trick. */
  readonly leaderIndex: number;
  readonly random: RandomState;
  readonly log: readonly LogEntry[];
  readonly nextLogId: number;
  /** Set to the winner's id once the match is over. */
  readonly matchWinnerId: PlayerId | null;
};

/**
 * Returns the player whose turn it is.
 *
 * @param state - the game state
 * @returns the active player
 */
export function currentPlayer(state: GameState): BinokelPlayer {
  return state.players[state.currentPlayerIndex];
}

/**
 * Looks up a player by id.
 *
 * @param state - the game state
 * @param playerId - the id to find
 * @returns the player
 * @throws if no player has that id
 */
export function playerById(
  state: GameState,
  playerId: PlayerId,
): BinokelPlayer {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (player === undefined) {
    throw new Error(`unknown player: ${playerId}`);
  }
  return player;
}

/**
 * The team a seat belongs to.
 *
 * @param state - the game state
 * @param index - the seat index
 * @returns the team index; each seat is its own team when teams are off
 * @remarks
 * With teams on, partners sit across (even seats are one team, odd the other).
 */
export function teamOf(state: GameState, index: number): number {
  return state.teams ? index % 2 : index;
}

/**
 * How many teams are at the table.
 *
 * @param state - the game state
 * @returns two with teams on, otherwise one per player
 */
export function teamCount(state: GameState): number {
  return state.teams ? 2 : state.players.length;
}
