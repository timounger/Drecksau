/**
 * Heuristic computer opponent: scores every legal move and picks the best.
 *
 * @module
 */
import type { ActionCardType } from "./cards";
import { legalMoves } from "./moves";
import { pickRandom } from "./random";
import {
  currentPlayer,
  handCardById,
  hasBarn,
  hasBarnDoor,
  hasLightningRod,
  ownerOfPig,
  pigById,
  type GameState,
  type Move,
  type Pig,
  type Player,
} from "./state";

/**
 * Weights of the heuristic.
 *
 * @remarks
 * Tuned by hand, not by search. The ordering is what matters: winning beats
 * everything, dirtying an own pig beats attacking, and attacking beats a plain
 * discard.
 */
const SCORES = {
  /** Move that ends the game right now. */
  win: 1000,
  /** Mud on a pig that already stands in a stall - it stays dirty. */
  mudProtected: 60,
  /** Mud on an unprotected pig. */
  mudPlain: 50,
  /** A stall around a Drecksau protects it from rain. */
  barnOnDirty: 40,
  /** A stall around a clean pig prepares a rain proof Drecksau. */
  barnOnClean: 22,
  /** Nailing the door makes a Drecksau nearly untouchable. */
  barnDoorOnDirty: 45,
  /** A rod secures a stall that shelters a Drecksau. */
  lightningRodOnDirty: 35,
  /** A rod on a stall with a clean pig is worth less. */
  lightningRodOnClean: 15,
  /** Base value of scrubbing an opponent's Drecksau. */
  farmerBase: 30,
  /** Base value of burning an opponent's stall. */
  lightningBase: 25,
  /** Extra value for hitting a stall that shelters a Drecksau. */
  lightningShelteredBonus: 15,
  /** Per point of lead the victim has, attacks get more attractive. */
  leaderWeight: 30,
  /** Gain per opponent Drecksau that rain washes clean. */
  rainPerOpponentPig: 18,
  /** Loss per own Drecksau that rain washes clean. */
  rainPerOwnPig: 26,
  /** Getting rid of a useless card. */
  discard: 1,
  /** Swapping a fully blocked hand. */
  redraw: 5,
} as const;

/**
 * Picks the move the computer opponent plays.
 *
 * @param state - the game state, with a computer player to move
 * @returns the chosen move
 * @throws if no legal move exists, e.g. because the game is already over
 * @example
 * ```ts
 * const state = applyMove(current, chooseAiMove(current));
 * ```
 */
export function chooseAiMove(state: GameState): Move {
  const moves = legalMoves(state);
  if (moves.length === 0) {
    throw new Error("no legal move available");
  }

  const scored = moves.map((move) => ({ move, score: scoreMove(state, move) }));
  const best = Math.max(...scored.map((entry) => entry.score));
  const bestMoves = scored
    .filter((entry) => entry.score === best)
    .map((entry) => entry.move);

  // Ties are broken at random so the opponents do not feel mechanical.
  return pickRandom(bestMoves, state.random).item;
}

/**
 * Scores a single move - higher is better.
 *
 * @param state - the game state
 * @param move - the move to judge
 * @returns the heuristic value of the move
 */
export function scoreMove(state: GameState, move: Move): number {
  const actor = currentPlayer(state);
  let score: number;

  switch (move.kind) {
    case "playCard":
      score = scorePlayCard(state, actor, move.cardId, move.targetPigId);
      break;
    case "discardCard":
      score = SCORES.discard;
      break;
    case "redrawHand":
      score = SCORES.redraw;
      break;
  }

  return score;
}

/**
 * Per card type: how attractive playing it at a target is.
 *
 * @remarks
 * A lookup instead of an if-else chain. The target pig is undefined only for
 * rain, which judges the whole table.
 */
const CARD_SCORES: Readonly<
  Record<
    ActionCardType,
    (state: GameState, actor: Player, target: Pig | null) => number
  >
> = {
  mud: (state, actor, target) =>
    hasBarn(target!) ? SCORES.mudProtected : SCORES.mudPlain,

  rain: (state, actor) => scoreRain(state, actor),

  barn: (state, actor, target) =>
    target!.isDirty ? SCORES.barnOnDirty : SCORES.barnOnClean,

  lightning: (state, actor, target) =>
    SCORES.lightningBase +
    (target!.isDirty ? SCORES.lightningShelteredBonus : 0) +
    leadOf(ownerOfPig(state, target!.id)) * SCORES.leaderWeight,

  lightningRod: (state, actor, target) =>
    target!.isDirty ? SCORES.lightningRodOnDirty : SCORES.lightningRodOnClean,

  farmerScrubs: (state, actor, target) =>
    SCORES.farmerBase +
    leadOf(ownerOfPig(state, target!.id)) * SCORES.leaderWeight,

  barnDoor: () => SCORES.barnDoorOnDirty,
};

/** Scores playing a card, checking for an immediate win first. */
function scorePlayCard(
  state: GameState,
  actor: Player,
  cardId: string,
  targetPigId: string | undefined,
): number {
  const card = handCardById(actor, cardId);
  const target = targetPigId === undefined ? null : pigById(state, targetPigId);
  let score: number;

  if (card.type === "mud" && isLastCleanPig(actor, targetPigId!)) {
    score = SCORES.win;
  } else {
    score = CARD_SCORES[card.type](state, actor, target);
  }

  return score;
}

/**
 * Judges rain: worth it only if it hurts the opponents more than the player.
 */
function scoreRain(state: GameState, actor: Player): number {
  const washed = (player: Player) =>
    player.pigs.filter((pig) => pig.isDirty && !hasBarn(pig)).length;

  const ownLoss = washed(actor) * SCORES.rainPerOwnPig;
  const opponentLoss = state.players
    .filter((player) => player.id !== actor.id)
    .reduce((sum, player) => sum + washed(player), 0);

  return opponentLoss * SCORES.rainPerOpponentPig - ownLoss;
}

/** Tells whether dirtying this pig wins the game immediately. */
function isLastCleanPig(actor: Player, targetPigId: string): boolean {
  return actor.pigs.every((pig) => pig.isDirty || pig.id === targetPigId);
}

/**
 * How close a player is to winning, as a share of their pigs.
 *
 * @remarks
 * A Drecksau that is safe from every attack counts double - it cannot be taken
 * away again, so that player is the real threat.
 */
function leadOf(player: Player): number {
  const value = player.pigs.reduce((sum, pig) => {
    let pigValue = 0;
    if (pig.isDirty) {
      pigValue = isSafeDirtyPig(pig) ? 2 : 1;
    }
    return sum + pigValue;
  }, 0);
  return value / (player.pigs.length * 2);
}

/** Tells whether a Drecksau can no longer be attacked at all. */
function isSafeDirtyPig(pig: Pig): boolean {
  return (
    pig.isDirty && hasBarn(pig) && hasLightningRod(pig) && hasBarnDoor(pig)
  );
}
