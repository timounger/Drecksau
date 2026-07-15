/**
 * State shape of a running Drecksau game plus small read only helpers.
 *
 * @module
 */
import type { ActionCardType, Card } from "./cards";
import type { RandomState } from "./random";

/** Identifies a player for the whole game. */
export type PlayerId = string;

/** Identifies a pig for the whole game. */
export type PigId = string;

/**
 * One pig in front of a player.
 *
 * @remarks
 * The attachments hold the actual card instances, mirroring the physical cards
 * laid next to the pig. Keeping the instances matters because lightning sends
 * them to the discard pile, from where they return into the game once the draw
 * pile is reshuffled. A rod or door can only exist while a barn is attached.
 */
export type Pig = {
  readonly id: PigId;
  /** True once the pig has been turned to its Drecksau side. */
  readonly isDirty: boolean;
  /** A stall protects against rain. */
  readonly barn: Card | null;
  /** A lightning rod makes the stall immune to lightning. */
  readonly lightningRod: Card | null;
  /** A nailed door blocks the farmer. */
  readonly barnDoor: Card | null;
};

/** A player with their pigs and hand cards. */
export type Player = {
  readonly id: PlayerId;
  /** Shown in the UI - German, like all user facing texts. */
  readonly name: string;
  /** False for the computer controlled opponents. */
  readonly isHuman: boolean;
  readonly pigs: readonly Pig[];
  readonly hand: readonly Card[];
};

/** A single line of the game log, already translated for the UI. */
export type LogEntry = {
  readonly id: number;
  readonly text: string;
};

/** The complete state of a game - everything needed to render and continue. */
export type GameState = {
  readonly players: readonly Player[];
  /** Index into {@link GameState.players} of the player to move. */
  readonly currentPlayerIndex: number;
  readonly drawPile: readonly Card[];
  readonly discardPile: readonly Card[];
  readonly random: RandomState;
  /** Set as soon as somebody has only dirty pigs left. */
  readonly winnerId: PlayerId | null;
  readonly log: readonly LogEntry[];
  /** Counter for stable log entry ids. */
  readonly nextLogId: number;
};

/** A move a player can make on their turn. */
export type Move =
  /** Play a card, optionally at a target pig. */
  | {
      readonly kind: "playCard";
      readonly cardId: string;
      readonly targetPigId?: PigId;
    }
  /** Put a card on the discard pile without using it. */
  | { readonly kind: "discardCard"; readonly cardId: string }
  /** Blockade rule: no card is playable, swap the whole hand. */
  | { readonly kind: "redrawHand" };

/** Number of cards a player holds. */
export const HAND_SIZE = 3;

/**
 * Returns the player whose turn it is.
 *
 * @param state - the game state
 * @returns the active player
 */
export function currentPlayer(state: GameState): Player {
  return state.players[state.currentPlayerIndex];
}

/**
 * Looks up a player by id.
 *
 * @param state - the game state
 * @param playerId - the id to look for
 * @returns the player
 * @throws if no player has that id
 */
export function playerById(state: GameState, playerId: PlayerId): Player {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (player === undefined) {
    throw new Error(`unknown player: ${playerId}`);
  }
  return player;
}

/**
 * Finds the player that owns a pig.
 *
 * @param state - the game state
 * @param pigId - the pig to look for
 * @returns the owning player
 * @throws if no player owns that pig
 */
export function ownerOfPig(state: GameState, pigId: PigId): Player {
  const owner = state.players.find((player) =>
    player.pigs.some((pig) => pig.id === pigId),
  );
  if (owner === undefined) {
    throw new Error(`unknown pig: ${pigId}`);
  }
  return owner;
}

/**
 * Looks up a pig by id.
 *
 * @param state - the game state
 * @param pigId - the id to look for
 * @returns the pig
 * @throws if no such pig exists
 */
export function pigById(state: GameState, pigId: PigId): Pig {
  const pig = ownerOfPig(state, pigId).pigs.find(
    (candidate) => candidate.id === pigId,
  );
  if (pig === undefined) {
    throw new Error(`unknown pig: ${pigId}`);
  }
  return pig;
}

/**
 * Looks up a hand card of a player.
 *
 * @param player - the holder of the card
 * @param cardId - the id to look for
 * @returns the card
 * @throws if the player does not hold that card
 */
export function handCardById(player: Player, cardId: string): Card {
  const card = player.hand.find((candidate) => candidate.id === cardId);
  if (card === undefined) {
    throw new Error(`player ${player.id} does not hold card ${cardId}`);
  }
  return card;
}

/**
 * Tells whether a pig stands in a stall.
 *
 * @param pig - the pig to check
 * @returns true if a barn card is attached
 */
export function hasBarn(pig: Pig): boolean {
  return pig.barn !== null;
}

/**
 * Tells whether the pig's stall is protected against lightning.
 *
 * @param pig - the pig to check
 * @returns true if a lightning rod is attached
 */
export function hasLightningRod(pig: Pig): boolean {
  return pig.lightningRod !== null;
}

/**
 * Tells whether the pig's stall is nailed shut against the farmer.
 *
 * @param pig - the pig to check
 * @returns true if a barn door is attached
 */
export function hasBarnDoor(pig: Pig): boolean {
  return pig.barnDoor !== null;
}

/**
 * Collects the cards attached to a pig.
 *
 * @param pig - the pig to inspect
 * @returns barn, rod and door cards, if present
 */
export function attachedCards(pig: Pig): Card[] {
  return [pig.barn, pig.lightningRod, pig.barnDoor].filter(
    (card): card is Card => card !== null,
  );
}

/**
 * Tells whether a player has reached the win condition.
 *
 * @param player - the player to check
 * @returns true if every pig in front of them is dirty
 */
export function hasWon(player: Player): boolean {
  return player.pigs.every((pig) => pig.isDirty);
}

/**
 * Counts how many cards of a type a player holds.
 *
 * @param player - the holder
 * @param type - the card type to count
 * @returns the number of matching hand cards
 */
export function countInHand(player: Player, type: ActionCardType): number {
  return player.hand.filter((card) => card.type === type).length;
}
