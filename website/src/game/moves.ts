/**
 * Legality of moves: which card may be played, and at which pig.
 *
 * @module
 */
import { UNTARGETED_CARD_TYPES, type ActionCardType } from "./cards";
import {
  currentPlayer,
  hasBarn,
  hasBarnDoor,
  hasBeauty,
  hasLightningRod,
  ownerOfPig,
  playerById,
  type GameState,
  type Move,
  type PigId,
  type PlayerId,
  type Player,
} from "./state";

/**
 * Per card type: the pigs it may legally be played at.
 *
 * @remarks
 * A lookup instead of a long if-else chain, as required by the coding rules.
 * Each entry gets the full state and the acting player and returns the pigs
 * that are valid targets right now.
 *
 * The expansion adds one rule that runs through almost every entry: a Schönsau
 * shields the pig underneath. Mud, rain and the farmer cannot touch it - only
 * an Aus-dem-Staub takes the Schönsau off again.
 */
const TARGET_RULES: Readonly<
  Record<ActionCardType, (state: GameState, actor: Player) => PigId[]>
> = {
  // Mud turns an own clean pig into a Drecksau - a stall does not prevent it,
  // a Schönsau does.
  mud: (state, actor) =>
    pigIdsOf(actor, (pig) => !pig.isDirty && !hasBeauty(pig)),

  // Rain hits the whole table, so it has no target pig.
  rain: () => [],

  // A stall goes to any own pig that has none yet - a Schönsau may stand in a
  // stall, so it is no obstacle here.
  barn: (state, actor) => pigIdsOf(actor, (pig) => !hasBarn(pig)),

  // Lightning burns down the stall of an opponent, unless a rod protects it.
  lightning: (state, actor) =>
    opponentPigIds(
      state,
      actor,
      (pig) => hasBarn(pig) && !hasLightningRod(pig),
    ),

  // A rod is attached to an own stall that has none yet.
  lightningRod: (state, actor) =>
    pigIdsOf(actor, (pig) => hasBarn(pig) && !hasLightningRod(pig)),

  // The farmer scrubs a dirty pig of an opponent - a stall does not help,
  // only a nailed door or a Schönsau does.
  farmerScrubs: (state, actor) =>
    opponentPigIds(
      state,
      actor,
      (pig) => pig.isDirty && !hasBarnDoor(pig) && !hasBeauty(pig),
    ),

  // The door may only be nailed onto an own stall that holds a Drecksau - and
  // never onto a stall with a Schönsau in it.
  barnDoor: (state, actor) =>
    pigIdsOf(
      actor,
      (pig) =>
        hasBarn(pig) && pig.isDirty && !hasBarnDoor(pig) && !hasBeauty(pig),
    ),

  // A Schönsau goes on any pig on the table, own or not - except a Drecksau
  // that sits in a nailed stall.
  beauty: (state) =>
    allPigIds(state, (pig) => !hasBeauty(pig) && !hasBarnDoor(pig)),

  // Aus-dem-Staub takes any Schönsau off the table again, own or not.
  dustOff: (state) => allPigIds(state, hasBeauty),

  // The lucky bird lets the player use their other two cards - no target.
  luckyBird: () => [],
};

/**
 * Lists the pigs a card may be played at.
 *
 * @param state - the game state
 * @param playerId - the acting player
 * @param type - the card type to play
 * @returns the ids of all legal target pigs; empty for untargeted cards
 */
export function legalTargets(
  state: GameState,
  playerId: PlayerId,
  type: ActionCardType,
): PigId[] {
  return TARGET_RULES[type](state, playerById(state, playerId));
}

/**
 * Tells whether a card type can be played at all right now.
 *
 * @param state - the game state
 * @param playerId - the acting player
 * @param type - the card type to check
 * @returns true if the card has an effect it could be played for
 */
export function isCardPlayable(
  state: GameState,
  playerId: PlayerId,
  type: ActionCardType,
): boolean {
  return !needsTarget(type) || legalTargets(state, playerId, type).length > 0;
}

/**
 * Tells whether a card needs a target pig chosen by the player.
 *
 * @param type - the card type to check
 * @returns false for rain and the lucky bird, true for the rest
 */
export function needsTarget(type: ActionCardType): boolean {
  return !UNTARGETED_CARD_TYPES.includes(type);
}

/**
 * Tells whether the blockade rule applies: not a single hand card is playable.
 *
 * @param state - the game state
 * @param playerId - the acting player
 * @returns true if the player may swap their whole hand
 */
export function isBlocked(state: GameState, playerId: PlayerId): boolean {
  const player = playerById(state, playerId);
  return (
    state.pendingCardIds.length === 0 &&
    player.hand.every((card) => !isCardPlayable(state, playerId, card.type))
  );
}

/**
 * Checks a concrete move against the rules.
 *
 * @param state - the game state
 * @param move - the move to check
 * @returns true if the active player may make this move
 */
export function isLegalMove(state: GameState, move: Move): boolean {
  const actor = currentPlayer(state);
  let legal: boolean;

  switch (move.kind) {
    case "playCard": {
      const card = actor.hand.find((candidate) => candidate.id === move.cardId);
      if (card === undefined || !isAllowedNow(state, move.cardId)) {
        legal = false;
      } else if (needsTarget(card.type)) {
        legal =
          move.targetPigId !== undefined &&
          legalTargets(state, actor.id, card.type).includes(move.targetPigId);
      } else {
        legal = true;
      }
      break;
    }
    case "discardCard":
      legal =
        actor.hand.some((candidate) => candidate.id === move.cardId) &&
        isAllowedNow(state, move.cardId);
      break;
    case "redrawHand":
      legal = isBlocked(state, actor.id);
      break;
  }

  return legal && state.winnerId === null;
}

/**
 * Enumerates every legal move of the active player.
 *
 * @param state - the game state
 * @returns all playable cards with their targets, plus discards and the
 *   blockade swap when it applies
 */
export function legalMoves(state: GameState): Move[] {
  const actor = currentPlayer(state);
  const moves: Move[] = [];

  if (state.winnerId === null) {
    const usable = actor.hand.filter((card) => isAllowedNow(state, card.id));

    for (const card of usable) {
      if (needsTarget(card.type)) {
        for (const targetPigId of legalTargets(state, actor.id, card.type)) {
          moves.push({ kind: "playCard", cardId: card.id, targetPigId });
        }
      } else {
        moves.push({ kind: "playCard", cardId: card.id });
      }
      moves.push({ kind: "discardCard", cardId: card.id });
    }

    if (isBlocked(state, actor.id)) {
      moves.push({ kind: "redrawHand" });
    }
  }

  return moves;
}

/**
 * Tells whether a pig belongs to a player.
 *
 * @param state - the game state
 * @param playerId - the suspected owner
 * @param pigId - the pig to check
 * @returns true if the player owns the pig
 */
export function ownsPig(
  state: GameState,
  playerId: PlayerId,
  pigId: PigId,
): boolean {
  return ownerOfPig(state, pigId).id === playerId;
}

/**
 * While a Glücksvogel is being resolved only its two cards may be used.
 *
 * @param state - the game state
 * @param cardId - the card the player wants to use
 * @returns true if the card may be used right now
 */
function isAllowedNow(state: GameState, cardId: string): boolean {
  return (
    state.pendingCardIds.length === 0 || state.pendingCardIds.includes(cardId)
  );
}

/** Ids of the player's own pigs that match a predicate. */
function pigIdsOf(
  player: Player,
  predicate: (pig: Player["pigs"][number]) => boolean,
): PigId[] {
  return player.pigs.filter(predicate).map((pig) => pig.id);
}

/** Ids of all opponent pigs that match a predicate. */
function opponentPigIds(
  state: GameState,
  actor: Player,
  predicate: (pig: Player["pigs"][number]) => boolean,
): PigId[] {
  return state.players
    .filter((player) => player.id !== actor.id)
    .flatMap((player) => pigIdsOf(player, predicate));
}

/** Ids of every pig on the table that matches a predicate. */
function allPigIds(
  state: GameState,
  predicate: (pig: Player["pigs"][number]) => boolean,
): PigId[] {
  return state.players.flatMap((player) => pigIdsOf(player, predicate));
}
