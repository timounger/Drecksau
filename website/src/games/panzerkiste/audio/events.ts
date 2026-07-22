/**
 * Turns a game-state transition into the sound events it should trigger.
 *
 * @module
 * @remarks
 * The engine is pure and makes no sound; the React layer compares the state
 * before and after a step and plays whatever this function reports. Keeping the
 * detection here (a pure function of two states) makes it testable without a
 * browser or an audio device. The continuous "own tank moving" hum is not an
 * event and is handled separately from the local input.
 */
import { BULLET_SPEED, type GameState } from "@/games/panzerkiste/engine/types";

/** A one-shot sound the game plays on a state change. */
export type SoundEvent =
  "shot" | "rocket" | "enemyDown" | "playerDown" | "roundStart";

/** A shell counts as a rocket above this multiple of the ordinary shell speed. */
const ROCKET_SPEED_FACTOR = 1.2;

/**
 * The sound events a step produced.
 *
 * @param prev - the state before the step
 * @param next - the state after the step
 * @returns the one-shot sounds to play, in no particular order
 * @remarks
 * - Every freshly fired shell is a "shot", or a "rocket" if it flies fast.
 * - A human losing a life on the same level is "playerDown" (respawn or loss).
 * - An enemy going down without a reload in between is "enemyDown".
 * - A freshly loaded level that is not a respawn is "roundStart".
 */
export function detectSounds(prev: GameState, next: GameState): SoundEvent[] {
  const events: SoundEvent[] = [];

  // New shells: any bullet id in `next` that was not in `prev` was just fired.
  const before = new Set(prev.bullets.map((bullet) => bullet.id));
  for (const bullet of next.bullets) {
    if (!before.has(bullet.id)) {
      const speed = Math.hypot(bullet.vx, bullet.vy);
      events.push(
        speed > BULLET_SPEED * ROCKET_SPEED_FACTOR ? "rocket" : "shot",
      );
    }
  }

  // A human died: a life was spent and the level did not change (respawn or the
  // final loss both reload/keep the same level).
  if (next.lives < prev.lives && next.level === prev.level) {
    events.push("playerDown");
  }

  // An enemy died: only when nothing reloaded in between (same level and lives).
  if (next.level === prev.level && next.lives === prev.lives) {
    const stillAlive = new Set(
      next.tanks
        .filter((tank) => tank.kind !== "player" && tank.alive)
        .map((tank) => tank.id),
    );
    const enemyDied = prev.tanks.some(
      (tank) =>
        tank.kind !== "player" && tank.alive && !stillAlive.has(tank.id),
    );
    if (enemyDied) {
      events.push("enemyDown");
    }
  }

  // A fresh level was loaded (its clock reset) and it is not a respawn: the
  // level advanced, or the same/more lives came with it (start, restart, jump).
  if (
    next.time < prev.time &&
    (next.level !== prev.level || next.lives >= prev.lives)
  ) {
    events.push("roundStart");
  }

  return events;
}
