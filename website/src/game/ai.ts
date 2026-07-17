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
  hasBeauty,
  hasLightningRod,
  ownerOfPig,
  pigById,
  showsDirty,
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
 * everything, working on the own goal beats attacking, and attacking beats a
 * plain discard.
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
  /** A Schönsau on an own pig - a step towards the second way to win. */
  beautyOnOwn: 52,
  /** A Schönsau on an opponent pig only helps them - avoid. */
  beautyOnOpponent: 2,
  /** Taking an opponent's Schönsau off them. */
  dustOffOpponent: 34,
  /** Taking an own Schönsau off is usually a step backwards. */
  dustOffOwn: 3,
  /** Two cards for one turn is almost always good. */
  luckyBird: 70,
  /** Getting rid of a useless card. */
  discard: 1,
  /** Swapping a fully blocked hand. */
  redraw: 5,
} as const;

/** A Drecksau that is safe from every attack counts double in the lead. */
const SAFE_PIG_VALUE = 2;

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
 * the untargeted cards, which judge the whole table.
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

  // A Schönsau on an own pig works towards the beauty win. On an opponent it
  // would push them towards theirs, so it is nearly worthless.
  beauty: (state, actor, target) =>
    isOwnPig(actor, target!) ? SCORES.beautyOnOwn : SCORES.beautyOnOpponent,

  // Wiping an opponent's Schönsau sets them back; wiping an own one is only
  // useful when going for the mud win.
  dustOff: (state, actor, target) =>
    isOwnPig(actor, target!)
      ? SCORES.dustOffOwn
      : SCORES.dustOffOpponent +
        leadOf(ownerOfPig(state, target!.id)) * SCORES.leaderWeight,

  luckyBird: () => SCORES.luckyBird,

  // Defence cards are never offered as a play move, so these are unreachable -
  // present only to satisfy the exhaustive lookup.
  extraMud: () => 0,
  lipstick: () => 0,
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

  if (isWinningMove(actor, card.type, target)) {
    score = SCORES.win;
  } else {
    score = CARD_SCORES[card.type](state, actor, target);
  }

  return score;
}

/**
 * Tells whether this card at this pig ends the game right now.
 *
 * @remarks
 * Two ways to win, so two things to look for: the last clean pig turning to
 * mud, or the last pig getting its Schönsau.
 */
function isWinningMove(
  actor: Player,
  type: ActionCardType,
  target: Pig | null,
): boolean {
  let wins = false;

  if (target !== null && isOwnPig(actor, target)) {
    if (type === "mud") {
      wins = actor.pigs.every((pig) => showsDirty(pig) || pig.id === target.id);
    } else if (type === "beauty") {
      wins = actor.pigs.every((pig) => hasBeauty(pig) || pig.id === target.id);
    }
  }

  return wins;
}

/**
 * Judges rain: worth it only if it hurts the opponents more than the player.
 */
function scoreRain(state: GameState, actor: Player): number {
  const washed = (player: Player) =>
    player.pigs.filter((pig) => showsDirty(pig) && !hasBarn(pig)).length;

  // Own Extra-Matsch cards keep that many of the AI's own Drecksäue dirty, so
  // they do not count as a loss. Only the AI's own hand is consulted - it must
  // not peek at what the opponents hold.
  const shields = actor.hand.filter((card) => card.type === "extraMud").length;
  const ownLoss = Math.max(0, washed(actor) - shields) * SCORES.rainPerOwnPig;
  const opponentLoss = state.players
    .filter((player) => player.id !== actor.id)
    .reduce((sum, player) => sum + washed(player), 0);

  return opponentLoss * SCORES.rainPerOpponentPig - ownLoss;
}

/**
 * How close a player is to winning, as a share of their pigs.
 *
 * @remarks
 * Counts whichever of the two goals they are further along with. A Drecksau
 * that is safe from every attack counts double - it cannot be taken away
 * again, so that player is the real threat.
 */
function leadOf(player: Player): number {
  const dirtyValue = player.pigs.reduce(
    (sum, pig) =>
      sum + (showsDirty(pig) ? (isSafeDirtyPig(pig) ? SAFE_PIG_VALUE : 1) : 0),
    0,
  );
  const beautyValue = player.pigs.filter(hasBeauty).length;
  return (
    Math.max(dirtyValue, beautyValue) / (player.pigs.length * SAFE_PIG_VALUE)
  );
}

/** Tells whether a Drecksau can no longer be attacked at all. */
function isSafeDirtyPig(pig: Pig): boolean {
  return (
    showsDirty(pig) && hasBarn(pig) && hasLightningRod(pig) && hasBarnDoor(pig)
  );
}

/** Tells whether a pig belongs to the acting player. */
function isOwnPig(actor: Player, pig: Pig): boolean {
  return actor.pigs.some((own) => own.id === pig.id);
}
