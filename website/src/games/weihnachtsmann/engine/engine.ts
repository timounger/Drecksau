/**
 * Runs the game: a new or loaded game, one step of the simulation, switching
 * characters between the snowy map and the houses, walking into the Advent
 * gates.
 *
 * @module
 */
import { ANY_DAY } from "./calendar";
import {
  achievementSave,
  applyAchievementSave,
  checkAchievements,
  updateToasts,
} from "./achievements";
import { applyAbility, chooseAnimal, moveMenu } from "./abilities";
import { followCamera, snapCamera } from "./camera";
import { CAST } from "./cast";
import { checkDoors, startFade, updateFade } from "./doors";
import { SPARKLE_TINTS, spawn, updateEffects } from "./effects";
import { checkGates, cleanGates } from "./gates";
import { updateMachine, interact } from "./interact";
import { CHIMNEYS, TILE, areaMap, buildMaps, fits } from "./map";
import { FIRST_CHARACTER, MAP_STARTS } from "./map-data";
import { currentProfile, moveCharacter } from "./movement";
import { nextRandom, randomIn } from "./random";
import { heldByShow, holdStill, updateShows } from "./shows";
import { isRiding, updateSleigh } from "./sleigh";
import { updateSpy } from "./spyglass";
import {
  ANIMAL_IDS,
  CHARACTER_IDS,
  type Action,
  type Character,
  type CharacterId,
  type GameState,
  NO_INPUT,
  type Input,
  type SaveData,
} from "./types";
import { rest, wander } from "./wander";
import { createWorld, updateWorld } from "./world";

/** The visible part of the map before the screen sets its own, map px. */
export const VIEW_W = 320;
export const VIEW_H = 180;

/**
 * How much faster the steered character goes than its walking pace - the map
 * is big, and the others keep strolling at their own speed.
 */
const STEERED_PACE = 1.8;

/** How long the camera glides to a newly chosen character, seconds. */
const GLIDE_SECONDS = 1.2;

/** Seconds between two sparkles behind a flying Trixi: moving and hovering. */
const SPARKLE_MOVING = 0.022;
const SPARKLE_HOVER = 0.1;

/** How far round her feet sparkles appear, map px. */
const SPARKLE_SPREAD = 4;

/** Share of Trixi's speed her sparkles keep, backwards. */
const SPARKLE_DRAG = 0.1;

/** Sideways drift of chimney smoke, map px per second. */
const SMOKE_DRIFT = 2;

/** How readily figures give way when they bump: one strolling, the bear. */
const GIVE_WAY_IDLE = 3;
const GIVE_WAY_BEAR = 0.2;

/** How much more readily everybody gives way to the bear. */
const BEAR_SHOVE = 4;

/** Seconds between two puffs from each chimney. */
const SMOKE_EVERY = 0.45;

/** Rest before a character the player left starts strolling, seconds. */
const LEFT_REST_MIN = 0.6;
const LEFT_REST_MAX = 1.6;

/** Room kept between two figures on the ground, besides their foot boxes, map px. */
const PERSONAL_SPACE = 2;

/** Seed of the random numbers on a new game. */
const FIRST_SEED = 20251224;

/** How far round a click a character is found, map px. */
const CLICK_SLACK = 8;

/**
 * Sets up a game: everybody at their start, or where they were saved.
 *
 * @param save - what was saved, or null for a fresh start
 * @returns the game, camera already on the chosen character
 */
export function createGame(save: SaveData | null): GameState {
  const chars = CHARACTER_IDS.map((id) => startCharacter(id));
  const maps = buildMaps();
  const state: GameState = {
    maps,
    viewArea: "outdoors",
    chars,
    active: CHARACTER_IDS.indexOf(FIRST_CHARACTER),
    camera: { x: 0, y: 0 },
    view: { w: VIEW_W, h: VIEW_H },
    glide: 0,
    menu: null,
    particles: [],
    time: 0,
    seed: FIRST_SEED,
    actions: [],
    smokeIn: 0,
    fade: null,
    sleigh: null,
    toys: [],
    spy: null,
    floats: [],
    sounds: [],
    gatesDone: new Set(),
    gateOpen: null,
    gateLatch: false,
    today: ANY_DAY,
    now: 0,
    world: createWorld(maps),
    achieved: new Map(),
    progress: { wishes: new Set(), instruments: new Set() },
    counts: { falls: 0, toys: 0 },
    toasts: [],
  };
  if (save !== null) {
    applySave(state, save);
  }
  state.viewArea = state.chars[state.active].area;
  for (const char of chars) {
    rest(char, randomIn(state, 0, LEFT_REST_MAX));
  }
  snapCamera(state);
  return state;
}

/**
 * Advances the game by one fixed step.
 *
 * @param state - the game; changed in place
 * @param input - the held controls
 * @param dt - seconds
 */
export function step(state: GameState, input: Input, dt: number): void {
  state.time += dt;
  for (const action of state.actions.splice(0)) {
    // Nothing is done while the picture fades or Gugor looks through his
    // telescope; the command is dropped.
    if (state.fade === null && state.spy === null) {
      perform(state, action);
    }
  }
  updateFade(state, dt);
  state.chars.forEach((char, index) => {
    if (isRiding(state, char)) {
      // Off the map in the sleigh.
    } else if (heldByShow(char)) {
      holdStill(state, char, dt);
    } else if (index === state.active) {
      const steer =
        state.menu === null && state.fade === null && state.spy === null;
      const move = steer ? input : NO_INPUT;
      moveCharacter(
        areaMap(state, char),
        char,
        move.moveX,
        move.moveY,
        dt,
        STEERED_PACE,
      );
      checkDoors(state, char, move);
      checkGates(state, char, move);
    } else {
      wander(state, char, dt);
    }
    if (char.id === "trixi" && char.flying) {
      trailSparkles(state, char, dt);
    }
  });
  keepApart(state);
  updateShows(state, dt);
  updateSpy(state, dt);
  updateSleigh(state, dt);
  updateMachine(state, dt);
  updateWorld(state, dt);
  checkAchievements(state);
  updateToasts(state, dt);
  puffChimneys(state, dt);
  updateEffects(state, dt);
  followCamera(state, dt);
}

/**
 * What is kept of the game between visits.
 *
 * @param state - the game
 * @returns the save
 */
export function toSave(state: GameState): SaveData {
  return {
    active: state.chars[state.active].id,
    chars: state.chars.map((char) => ({
      id: char.id,
      area: char.area,
      x: Math.round(char.x),
      y: Math.round(char.y),
      dir: char.dir,
      form: char.form,
      flying: char.flying,
    })),
    gates: [...state.gatesDone].sort((a, b) => a - b),
    ...achievementSave(state),
  };
}

/** Carries one command out. */
function perform(state: GameState, action: Action): void {
  switch (action.kind) {
    case "select":
      select(state, action.index);
      break;
    case "cycle":
      select(
        state,
        (state.active + action.delta + state.chars.length) % state.chars.length,
      );
      break;
    case "ability":
      if (isRiding(state, state.chars[state.active])) {
        // Sitting in the sleigh: nothing to do but enjoy the ride.
      } else if (state.menu === null) {
        applyAbility(state);
      } else {
        chooseAnimal(state, ANIMAL_IDS[state.menu.cursor]);
      }
      break;
    case "talk":
      interact(state);
      break;
    case "menuMove":
      moveMenu(state, action.delta);
      break;
    case "menuPick":
      chooseAnimal(
        state,
        action.index === null ? null : (ANIMAL_IDS[action.index] ?? null),
      );
      break;
    case "menuClose":
      state.menu = null;
      break;
    case "clickMap":
      clickAt(state, action.x, action.y);
      break;
  }
}

/**
 * Hands control to another character; the one left behind starts strolling.
 * Somebody in another place is reached through a fade.
 */
function select(state: GameState, index: number): void {
  if (index !== state.active && index >= 0 && index < state.chars.length) {
    state.menu = null;
    rest(
      state.chars[state.active],
      randomIn(state, LEFT_REST_MIN, LEFT_REST_MAX),
    );
    state.active = index;
    if (state.chars[index].area === state.viewArea) {
      state.glide = GLIDE_SECONDS;
    } else {
      startFade(state, null, index);
    }
  }
}

/** A click on the map picks whoever stands there. */
function clickAt(state: GameState, x: number, y: number): void {
  let best = -1;
  let bestY = -Infinity;
  state.chars.forEach((char, index) => {
    const height = CAST[char.id].walk.height;
    const top = char.y - char.altitude - height;
    const hit =
      char.area === state.viewArea &&
      !isRiding(state, char) &&
      Math.abs(x - char.x) < CLICK_SLACK + 2 &&
      y > top - CLICK_SLACK / 2 &&
      y < char.y - char.altitude + 2;
    // The one in front - lower on the screen - wins.
    if (hit && char.y > bestY) {
      best = index;
      bestY = char.y;
    }
  });
  if (best >= 0) {
    select(state, best);
  }
}

/**
 * Pushes figures on the ground apart where they overlap, so nobody walks
 * through anybody. The one the player steers gives way least; the bear barely
 * at all - it is the strong one.
 */
function keepApart(state: GameState): void {
  const chars = state.chars;
  for (let i = 0; i < chars.length; i += 1) {
    for (let j = i + 1; j < chars.length; j += 1) {
      const a = chars[i];
      const b = chars[j];
      if (
        a.altitude < 1 &&
        b.altitude < 1 &&
        a.area === b.area &&
        !isRiding(state, a) &&
        !isRiding(state, b)
      ) {
        const room =
          (currentProfile(a).footW + currentProfile(b).footW) / 2 +
          PERSONAL_SPACE;
        const dx = b.x - a.x;
        // Feet boxes are flat: count height differences double.
        const dy = (b.y - a.y) * 2;
        const distance = Math.hypot(dx, dy);
        if (distance < room) {
          const push = room - distance;
          const nx = distance > 0 ? dx / distance : 1;
          const ny = distance > 0 ? dy / distance / 2 : 0;
          const share =
            weight(state, i, b) / (weight(state, i, b) + weight(state, j, a));
          shove(state, a, -nx * push * share, -ny * push * share);
          shove(state, b, nx * push * (1 - share), ny * push * (1 - share));
        }
      }
    }
  }
}

/** How readily a figure gives way to another: higher gives way more. */
function weight(state: GameState, index: number, other: Character): number {
  const char = state.chars[index];
  let result = index === state.active ? 1 : GIVE_WAY_IDLE;
  if (char.form === "baer") {
    result = GIVE_WAY_BEAR;
  }
  if (other.form === "baer") {
    result *= BEAR_SHOVE;
  }
  return result;
}

/** Moves a figure a little, if it fits there. */
function shove(
  state: GameState,
  char: Character,
  dx: number,
  dy: number,
): void {
  const profile = currentProfile(char);
  const map = areaMap(state, char);
  if (fits(map, profile, char.x + dx, char.y)) {
    char.x += dx;
  }
  if (fits(map, profile, char.x, char.y + dy)) {
    char.y += dy;
  }
}

/** Leaves a trail of coloured sparkles behind a flying Trixi. */
function trailSparkles(state: GameState, char: Character, dt: number): void {
  char.sparkleIn -= dt;
  if (char.sparkleIn <= 0) {
    char.sparkleIn = char.moving ? SPARKLE_MOVING : SPARKLE_HOVER;
    spawn(
      state,
      "sparkle",
      char.area,
      char.x + randomIn(state, -SPARKLE_SPREAD, SPARKLE_SPREAD),
      char.y - char.altitude + randomIn(state, -SPARKLE_SPREAD, SPARKLE_SPREAD),
      -char.vx * SPARKLE_DRAG,
      randomIn(state, 0, SPARKLE_SPREAD),
      Math.floor(nextRandom(state) * SPARKLE_TINTS),
    );
  }
}

/** Smoke from every chimney. */
function puffChimneys(state: GameState, dt: number): void {
  state.smokeIn -= dt;
  if (state.smokeIn <= 0) {
    state.smokeIn = SMOKE_EVERY;
    for (const object of state.maps.outdoors.objects) {
      const chimney = CHIMNEYS[object.kind];
      if (chimney !== undefined) {
        spawn(
          state,
          "smoke",
          "outdoors",
          object.tx * TILE + chimney[0] + randomIn(state, -1, 1),
          object.ty * TILE + chimney[1],
          randomIn(state, -SMOKE_DRIFT, SMOKE_DRIFT),
        );
      }
    }
  }
}

/** A character at its start place, at rest. */
function startCharacter(id: CharacterId): Character {
  const [area, cx, cy] = MAP_STARTS[id];
  const x = cx * TILE;
  const y = cy * TILE;
  return {
    id,
    area,
    x,
    y,
    vx: 0,
    vy: 0,
    dir: "down",
    moving: false,
    stride: 0,
    flying: false,
    altitude: 0,
    form: null,
    onIce: false,
    brain: { mode: "rest", timer: 0, targetX: x, targetY: y, stuck: 0 },
    bubble: null,
    sparkleIn: 0,
    show: null,
    cooldown: 0,
    hop: 0,
  };
}

/**
 * Puts everybody back where the save has them, if they still fit there, and
 * marks the gates won and the achievements unlocked.
 * Saves from before the houses could be entered know nothing of places and
 * were made on another map: they keep who is steered, the facing and Jordi's
 * animal, and everybody starts at their start place.
 */
function applySave(state: GameState, save: SaveData): void {
  for (const saved of save.chars) {
    const char = state.chars.find((candidate) => candidate.id === saved.id);
    const area = saved.area;
    if (char !== undefined && area !== undefined) {
      const form = char.id === "jordi" ? saved.form : null;
      const flying =
        CAST[char.id].air !== null && saved.flying && area === "outdoors";
      const probe: Character = { ...char, area, form, flying };
      const profile = currentProfile(probe);
      if (
        fits(state.maps[area], profile, saved.x, saved.y) &&
        (area === "outdoors" || !profile.flies)
      ) {
        char.area = area;
        char.x = saved.x;
        char.y = saved.y;
        char.form = form;
        char.flying = flying;
        char.dir = saved.dir;
      }
    } else if (char !== undefined) {
      char.dir = saved.dir;
      const probe: Character = { ...char, form: saved.form };
      if (
        char.id === "jordi" &&
        fits(areaMap(state, char), currentProfile(probe), char.x, char.y)
      ) {
        char.form = saved.form;
      }
    }
  }
  const active = CHARACTER_IDS.indexOf(save.active);
  if (active >= 0) {
    state.active = active;
  }
  for (const number of cleanGates(save.gates ?? [])) {
    state.gatesDone.add(number);
  }
  applyAchievementSave(state, save);
}
