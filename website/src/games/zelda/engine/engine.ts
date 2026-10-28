/**
 * One step of the adventure: Link, the monsters, the items, the temple's
 * parts, the fades and room scrolls, the camera.
 *
 * @module
 * @remarks
 * Called at a fixed rate by the game loop, so every speed in here is in
 * pixels per second and every timer in seconds. While a text box, the menu,
 * a find held up or a change of place is going on, the rest of the world
 * holds its breath - as on the handheld.
 */
import { enterRoom, moveTo, roomCamera } from "./areas";
import { stepRocks } from "./boss";
import { addEffect, stepEffects } from "./effects";
import { VIEW_H, VIEW_W, stepEnemies } from "./enemies";
import { lockedIn, stepDungeon } from "./dungeon";
import { BODY_LIFT, swordHits, stepItems } from "./items";
import { stepPlayer } from "./player";
import { stepHook } from "./tools";
import { AREAS, TILE, roomAt, roomOrigin } from "./tiles";
import type { GameState, Input, StepReport } from "./types";
import { GRID_ITEMS, MAX_BOTTLES } from "./gear";
import {
  HALVES_PER_HEART,
  MAX_ARROWS,
  MAX_BOMBS,
  MAX_RUPEES,
  reviveAt,
} from "./world";

/** Heart containers the cheat hands out - a full row on the screen. */
const CHEAT_HEARTS = 10;

/** How quickly the camera catches up with Link, per second. */
const CAMERA_FOLLOW = 9;

/** Seconds before a cut bush grows back (only off screen). */
const REGROW_TIME = 90;

/** Seconds the victory banner stays up. */
const VICTORY_BANNER = 3.5;

/** Seconds of a fade: out to black, a breath of black, back in. */
export const FADE = { out: 0.32, hold: 0.12, back: 0.32 } as const;

/** Seconds a scroll from one room to the next takes. */
export const SCROLL_TIME = 0.72;

/** The cubic of the smooth ease-in-out, 3k² - 2k³. */
const EASE_CUBIC = 3;

/** How far Link steps into the new room while it scrolls in, px. */
const SCROLL_STEP = 22;

/**
 * Advances the game by one step.
 *
 * @param state - the game; changed in place
 * @param input - this step's buttons
 * @param dt - seconds to advance
 * @param victoryText - the banner to show when the temple's guardian falls
 * @returns what happened, for sounds and statistics
 */
export function step(
  state: GameState,
  input: Input,
  dt: number,
  victoryText: string,
): StepReport {
  const report: StepReport = { events: [], rupees: 0, kills: [], cuts: 0 };
  let frozen = false;
  if (state.cheat) {
    fillUp(state);
  }
  if (state.phase === "playing") {
    if (state.transition !== null) {
      stepTransition(state, report, dt);
    } else if (state.hitStop > 0) {
      state.hitStop -= dt;
      // Frozen, Link sees no buttons: keep the last step's, so a press or a
      // release during the freeze still counts once it ends.
      frozen = true;
    } else {
      const paused = stepPlayer(state, input, report, dt);
      if (!paused && state.transition === null) {
        state.time += dt;
        swordHits(state, report);
        stepEnemies(state, report, dt);
        stepItems(state, report, dt);
        stepHook(state, report, dt);
        stepRocks(state, report, dt);
        stepDungeon(state, report, dt);
        stepEffects(state, dt);
        regrow(state);
        checkRoom(state);
      }
    }
    if (report.events.includes("victory")) {
      state.banner = { text: victoryText, t: VICTORY_BANNER };
    }
  }
  if (state.banner !== null) {
    state.banner.t -= dt;
    if (state.banner.t <= 0) {
      state.banner = null;
    }
  }
  state.shake = Math.max(0, state.shake - dt);
  if (!frozen) {
    state.prev = input;
  }
  if (state.transition?.kind !== "scroll") {
    followCamera(state, dt);
  }
  return report;
}

/**
 * Puts the camera straight onto Link, without the smooth catch-up.
 *
 * @param state - the game
 */
export function snapCamera(state: GameState): void {
  const target = cameraTarget(state);
  state.camX = target.x;
  state.camY = target.y;
}

/**
 * Wakes Link up again after a game over.
 *
 * @param state - the game
 */
export function revive(state: GameState): void {
  reviveAt(state);
  state.dialog = null;
  state.hold = null;
  state.menu = null;
  state.transition = null;
  state.phase = "playing";
  addEffect(state, "poof", state.player.x, state.player.y - BODY_LIFT);
  snapCamera(state);
}

/**
 * How far a change of place has got, from 0 (start) to 1 (done).
 *
 * @param state - the game
 * @returns the darkness of a fade (0 clear, 1 black), or 0 without one
 */
export function fadeAmount(state: GameState): number {
  const transition = state.transition;
  let dark = 0;
  if (transition?.kind === "fade") {
    const t = transition.t;
    if (t < FADE.out) {
      dark = t / FADE.out;
    } else if (t < FADE.out + FADE.hold) {
      dark = 1;
    } else {
      dark = Math.max(0, 1 - (t - FADE.out - FADE.hold) / FADE.back);
    }
  }
  return dark;
}

/** Runs a fade or a scroll on, and finishes it. */
function stepTransition(
  state: GameState,
  report: StepReport,
  dt: number,
): void {
  const transition = state.transition;
  if (transition !== null) {
    transition.t += dt;
    if (transition.kind === "fade") {
      if (!transition.swapped && transition.t >= FADE.out) {
        transition.swapped = true;
        moveTo(state, transition.to);
        snapCamera(state);
      }
      if (transition.t >= FADE.out + FADE.hold + FADE.back) {
        state.transition = null;
      }
    } else {
      const k = Math.min(1, transition.t / SCROLL_TIME);
      const ease = k * k * (EASE_CUBIC - 2 * k);
      state.camX = lerp(transition.fromCam.x, transition.toCam.x, ease);
      state.camY = lerp(transition.fromCam.y, transition.toCam.y, ease);
      state.player.x = lerp(transition.fromPlayer.x, transition.toPlayer.x, k);
      state.player.y = lerp(transition.fromPlayer.y, transition.toPlayer.y, k);
      state.player.walk += dt;
      state.player.moving = true;
      if (k >= 1) {
        state.transition = null;
        enterRoom(state, transition.room);
        if (lockedIn(state)) {
          report.events.push("shutter");
        }
      }
    }
  }
}

/** Starts a scroll when Link walks out of his room into the next one. */
function checkRoom(state: GameState): void {
  const player = state.player;
  if (AREAS[state.area].roomed) {
    const room = roomAt(state.area, player.x, player.y);
    if (room !== state.room && state.room >= 0) {
      const from = roomOrigin(state.area, state.room);
      const to = roomOrigin(state.area, room);
      const dx = Math.sign(to.x - from.x);
      const dy = Math.sign(to.y - from.y);
      player.action = { kind: "idle" };
      player.charge = 0;
      player.vx = 0;
      player.vy = 0;
      state.transition = {
        kind: "scroll",
        t: 0,
        room,
        fromCam: { x: state.camX, y: state.camY },
        toCam: to,
        fromPlayer: { x: player.x, y: player.y },
        toPlayer: {
          x: player.x + dx * SCROLL_STEP,
          y: player.y + dy * SCROLL_STEP,
        },
      };
    }
  }
}

/** Lets the camera glide after Link - or rest on his room. */
function followCamera(state: GameState, dt: number): void {
  const target = cameraTarget(state);
  const roomed = AREAS[state.area].roomed;
  const k = roomed ? 1 : Math.min(1, CAMERA_FOLLOW * dt);
  state.camX += (target.x - state.camX) * k;
  state.camY += (target.y - state.camY) * k;
}

/** Where the camera wants to be: Link in the middle, the map edge respected. */
function cameraTarget(state: GameState): { x: number; y: number } {
  const player = state.player;
  const map = AREAS[state.area];
  let target: { x: number; y: number };
  if (map.roomed && state.room >= 0) {
    target = { ...roomCamera(state) };
  } else {
    target = {
      x: Math.min(map.width - VIEW_W, Math.max(0, player.x - VIEW_W / 2)),
      y: Math.min(
        map.height - VIEW_H,
        Math.max(0, player.y - BODY_LIFT - VIEW_H / 2),
      ),
    };
  }
  return target;
}

/** Lets cut bushes, grass, lifted rocks and dug holes come back once nobody looks. */
function regrow(state: GameState): void {
  regrowTiles(state, state.cut);
  regrowTiles(state, state.dug);
}

/** Forgets the changed tiles of one list that are old and out of sight. */
function regrowTiles(state: GameState, changed: Map<number, number>): void {
  const cols = AREAS[state.area].cols;
  for (const [index, at] of changed) {
    if (state.time - at > REGROW_TIME) {
      const tx = (index % cols) * TILE;
      const ty = Math.floor(index / cols) * TILE;
      const visible =
        tx + TILE > state.camX &&
        tx < state.camX + VIEW_W &&
        ty + TILE > state.camY &&
        ty < state.camY + VIEW_H;
      const underLink =
        Math.abs(state.player.x - tx - TILE / 2) < TILE &&
        Math.abs(state.player.y - ty - TILE / 2) < TILE;
      if (!visible && !underLink) {
        changed.delete(index);
      }
    }
  }
}

/** Straight-line blend. */
function lerp(a: number, b: number, k: number): number {
  return a + (b - a) * k;
}

/**
 * The cheat, once a step: every heart, every tool, four full bottles and as
 * many rupees, arrows and bombs as fit. What it hands out is kept, like any
 * find; that nothing hurts is in `hurtPlayer`.
 *
 * @param state - the game
 */
function fillUp(state: GameState): void {
  const player = state.player;
  const inv = state.inv;
  player.maxHearts = Math.max(player.maxHearts, CHEAT_HEARTS);
  player.hp = player.maxHearts * HALVES_PER_HEART;
  inv.rupees = MAX_RUPEES;
  inv.arrows = MAX_ARROWS;
  inv.bombs = MAX_BOMBS;
  for (const item of GRID_ITEMS) {
    inv.owned.add(item);
  }
  inv.bottles = Array.from({ length: MAX_BOTTLES }, () => "potion" as const);
}
