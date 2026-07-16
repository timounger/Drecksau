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
  /**
   * True once the pig has been turned to its Drecksau side.
   *
   * @remarks
   * Keeps its value while a Schönsau lies on top: taking the Schönsau off
   * uncovers whatever the pig was before.
   */
  readonly isDirty: boolean;
  /** A stall protects against rain. */
  readonly barn: Card | null;
  /** A lightning rod makes the stall immune to lightning. */
  readonly lightningRod: Card | null;
  /** A nailed door blocks the farmer. */
  readonly barnDoor: Card | null;
  /**
   * A Schönsau lying on the pig card (expansion only).
   *
   * @remarks
   * Not an attachment like the others but a cover: while it lies there the pig
   * counts as a Schönsau, no matter what {@link Pig.isDirty} says underneath.
   */
  readonly beauty: Card | null;
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
  /** Set as soon as somebody has reached a win condition. */
  readonly winnerId: PlayerId | null;
  readonly log: readonly LogEntry[];
  /** Counter for stable log entry ids. */
  readonly nextLogId: number;
  /**
   * Cards the active player still has to use this turn (Glücksvogel).
   *
   * @remarks
   * Empty for a normal turn. A Glücksvogel puts the player's two other hand
   * cards in here: the turn does not end and no cards are drawn until all of
   * them are gone.
   */
  readonly pendingCardIds: readonly string[];
  /** True while the expansion is part of this game. */
  readonly hasExpansion: boolean;
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
 * Tells whether a Schönsau lies on the pig (expansion only).
 *
 * @param pig - the pig to check
 * @returns true if a Schönsau covers it
 */
export function hasBeauty(pig: Pig): boolean {
  return pig.beauty !== null;
}

/**
 * Tells whether the pig counts as a Drecksau right now.
 *
 * @param pig - the pig to check
 * @returns true if it is dirty and no Schönsau covers it
 * @remarks
 * A Drecksau with a Schönsau on it is a Schönsau, not a Drecksau - that is
 * what makes the two win conditions mutually exclusive.
 */
export function showsDirty(pig: Pig): boolean {
  return pig.isDirty && !hasBeauty(pig);
}

/**
 * Collects the cards attached to a pig.
 *
 * @param pig - the pig to inspect
 * @returns barn, rod, door and Schönsau cards, if present
 */
export function attachedCards(pig: Pig): Card[] {
  return [pig.barn, pig.lightningRod, pig.barnDoor, pig.beauty].filter(
    (card): card is Card => card !== null,
  );
}

/**
 * Tells whether a player has reached a win condition.
 *
 * @param player - the player to check
 * @returns true if every pig shows a Drecksau, or every pig shows a Schönsau
 * @remarks
 * The base game only has the first path - it has no Schönsau cards, so nothing
 * changes there. With the expansion both count, but a mixture does not: three
 * Drecksäue win, three Schönsäue win, two and one wins nothing.
 */
export function hasWon(player: Player): boolean {
  return (
    player.pigs.every((pig) => showsDirty(pig)) ||
    player.pigs.every((pig) => hasBeauty(pig))
  );
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
