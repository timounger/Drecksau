/**
 * The temple's moving parts: push blocks sliding onto floor plates, and the
 * guardian rooms whose shutters open once every monster in them is beaten.
 *
 * @module
 */
import { isLockRoom } from "./clearing";
import { TILE, TILE_CHARS, tileAt } from "./tiles";
import type { GameState, StepReport } from "./types";

/** How fast a shoved block slides, px/s. */
const BLOCK_SPEED = 40;

/**
 * Moves the temple's parts on by one step.
 *
 * @param state - the game
 * @param report - where to note what happened
 * @param dt - seconds since the last step
 */
export function stepDungeon(
  state: GameState,
  report: StepReport,
  dt: number,
): void {
  if (state.area === "dungeon") {
    slideBlocks(state, report, dt);
    checkCleared(state, report);
  }
}

/**
 * Whether the room Link stands in has its shutters shut on him.
 *
 * @param state - the game
 * @returns true while the guardian room is still locked
 */
export function lockedIn(state: GameState): boolean {
  return (
    state.area === "dungeon" &&
    isLockRoom(state.room) &&
    !state.flags.has(`clear:${state.room}`)
  );
}

/** Slides shoved blocks; one coming to rest on a plate presses it for good. */
function slideBlocks(state: GameState, report: StepReport, dt: number): void {
  for (const block of state.blocks) {
    const target = block.target;
    if (target !== null) {
      const step = BLOCK_SPEED * dt;
      block.x +=
        Math.sign(target.x - block.x) *
        Math.min(step, Math.abs(target.x - block.x));
      block.y +=
        Math.sign(target.y - block.y) *
        Math.min(step, Math.abs(target.y - block.y));
      if (block.x === target.x && block.y === target.y) {
        block.target = null;
        const onPlate =
          tileAt(state.area, block.x / TILE, block.y / TILE) ===
          TILE_CHARS.plate;
        const flag = `switch:${block.room}`;
        if (onPlate && !state.flags.has(flag)) {
          state.flags.add(flag);
          report.events.push("switch", "shutter");
        }
      }
    }
  }
}

/** Opens a guardian room once all its monsters are beaten. */
function checkCleared(state: GameState, report: StepReport): void {
  if (lockedIn(state)) {
    const mine = state.spawns.filter(
      (spawn) => spawn.area === state.area && spawn.room === state.room,
    );
    const allBeaten =
      mine.length > 0 &&
      mine.every((spawn) => spawn.deadAt !== null && !spawn.alive);
    if (allBeaten) {
      state.flags.add(`clear:${state.room}`);
      report.events.push("shutter");
    }
  }
}
