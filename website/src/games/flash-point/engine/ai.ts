/**
 * The computer on the crew.
 *
 * @module
 * @remarks
 * Cooperative, so this is a colleague rather than an opponent, and it plays the
 * way a sensible colleague does: get the person you are carrying out of the
 * building, otherwise go to the nearest person who needs carrying, and hit the
 * fire only when it is in the way or about to reach somebody.
 *
 * It works from a **breadth-first walk** of the house rather than from
 * straight-line distance, because in a building with walls those two are not the
 * same thing at all - the room next door can be four moves away.
 */
import { around, isInside, onBoard, type Cell } from "./board";
import { legalMoves, stepCost } from "./moves";
import { passable } from "./fire";
import {
  activePlayer,
  blazeAt,
  cellKey,
  poiAt,
  sameCell,
  type FlashPointGame,
  type FlashPointMove,
} from "./state";

/** How long the computer waits before acting, so it can be followed. */
const MOVE_DELAY_MS = 550;

/** How far the walk will look before giving up on reaching something. */
const REACH_LIMIT = 40;

/**
 * Picks the computer's next action.
 *
 * @param game - the fire
 * @param seat - the seat the computer is playing
 * @returns the move, or null when there is nothing sensible left
 */
export function aiMove(
  game: FlashPointGame,
  seat: number,
): FlashPointMove | null {
  const moves = legalMoves(game, seat);
  let best: FlashPointMove | null = null;
  if (moves.length > 0) {
    const me = activePlayer(game);
    const goal = me.carrying ? nearestOutside(game) : nearestVictim(game);
    best =
      pickUp(game, moves) ??
      stepTowards(game, moves, goal) ??
      clearTheWay(game, moves, goal) ??
      moves.find((move) => move.kind === "endTurn") ??
      moves[0];
  }
  return best;
}

/**
 * How long the computer pauses before acting.
 *
 * @returns the delay in milliseconds
 */
export function botWaitMs(): number {
  return MOVE_DELAY_MS;
}

/** Somebody is lying right here and can be picked up. */
function pickUp(
  game: FlashPointGame,
  moves: readonly FlashPointMove[],
): FlashPointMove | null {
  const me = activePlayer(game);
  const here = poiAt(game, me.at);
  const worth =
    !me.carrying && here !== null && here.revealed && here.kind === "victim";
  return worth ? (moves.find((move) => move.kind === "carry") ?? null) : null;
}

/** The step that gets closest to where the computer wants to be. */
function stepTowards(
  game: FlashPointGame,
  moves: readonly FlashPointMove[],
  goal: Cell | null,
): FlashPointMove | null {
  let best: FlashPointMove | null = null;
  if (goal !== null) {
    const me = activePlayer(game);
    const from = walkFrom(game, goal);
    let bestScore = from.get(cellKey(me.at)) ?? Infinity;
    for (const move of moves) {
      if (move.kind === "move") {
        const score = from.get(cellKey(move.to)) ?? Infinity;
        // A square on fire costs two points and hurts to stand on; only step
        // there when it genuinely shortens the way.
        const penalty = blazeAt(game, move.to) === "fire" ? 1 : 0;
        if (score + penalty < bestScore) {
          bestScore = score + penalty;
          best = move;
        }
      }
    }
  }
  return best;
}

/**
 * Nothing to walk towards, so make the house safer.
 *
 * @remarks
 * Fire first and next to the goal by preference - putting it out where nobody
 * is going is work that the next roll undoes.
 */
function clearTheWay(
  game: FlashPointGame,
  moves: readonly FlashPointMove[],
  goal: Cell | null,
): FlashPointMove | null {
  const fires = moves.filter(
    (move) => move.kind === "extinguish" && blazeAt(game, move.at) === "fire",
  );
  const smoke = moves.filter((move) => move.kind === "extinguish");
  const doors = moves.filter((move) => move.kind === "door");
  // No axe. Every cube in a wall is a cube not left to hold the house up, and a
  // colleague who chops for something to do brings the roof down on everybody -
  // it is the same twenty-four cubes the explosions are eating.
  return fires[0] ?? smoke[0] ?? (goal === null ? null : (doors[0] ?? null));
}

/** The nearest square outside the building, for carrying somebody out. */
function nearestOutside(game: FlashPointGame): Cell | null {
  const me = activePlayer(game);
  const seen = walkFrom(game, me.at);
  let best: Cell | null = null;
  let bestSteps = Infinity;
  for (const [key, steps] of seen) {
    const [row, col] = key.split(",").map(Number);
    if (!isInside({ row, col }) && steps < bestSteps) {
      bestSteps = steps;
      best = { row, col };
    }
  }
  return best;
}

/** The nearest marker worth walking to - a known victim, or an unknown. */
function nearestVictim(game: FlashPointGame): Cell | null {
  const me = activePlayer(game);
  const seen = walkFrom(game, me.at);
  let best: Cell | null = null;
  let bestScore = Infinity;
  for (const [key, marker] of Object.entries(game.pois)) {
    const [row, col] = key.split(",").map(Number);
    const steps = seen.get(key);
    if (steps !== undefined) {
      // A known victim is worth a detour; an unknown marker is a maybe.
      const score = steps + (marker.revealed ? 0 : 2);
      if (score < bestScore) {
        bestScore = score;
        best = { row, col };
      }
    }
  }
  return best;
}

/**
 * How many steps every reachable square is from one square.
 *
 * @param game - the fire
 * @param from - where to start
 * @returns steps by cell key, for everything the walk could reach
 * @remarks
 * Costs, not steps: walking into fire costs two, so the walk counts what the
 * action points actually buy. Closed doors count as passable, because opening
 * one is a single point and the computer would rather go through than round.
 */
function walkFrom(
  game: FlashPointGame,
  from: Cell,
): ReadonlyMap<string, number> {
  const cost = new Map<string, number>([[cellKey(from), 0]]);
  const queue: Cell[] = [from];
  while (queue.length > 0) {
    const at = queue.shift() as Cell;
    const soFar = cost.get(cellKey(at)) ?? 0;
    if (soFar < REACH_LIMIT) {
      for (const to of around(at)) {
        if (onBoard(to) && reachable(game, at, to)) {
          const step = blazeAt(game, to) === "fire" ? 2 : 1;
          const key = cellKey(to);
          if ((cost.get(key) ?? Infinity) > soFar + step) {
            cost.set(key, soFar + step);
            queue.push(to);
          }
        }
      }
    }
  }
  return cost;
}

/** Whether the computer would consider going that way at all. */
function reachable(game: FlashPointGame, a: Cell, b: Cell): boolean {
  // A shut door is one action point, not a wall - so the walk goes through it.
  return passable(game, a, b) || isDoor(game, a, b);
}

/** Whether the edge is a door that is merely closed. */
function isDoor(game: FlashPointGame, a: Cell, b: Cell): boolean {
  const move = legalMoves(game, game.active).find(
    (each) => each.kind === "door" && sameCell(each.to, b),
  );
  return move !== undefined && sameCell(activePlayer(game).at, a);
}

/** The cost of a step, for anybody who wants to price one. */
export { stepCost };
