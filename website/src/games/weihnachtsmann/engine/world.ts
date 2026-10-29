/**
 * What the characters can change in the world, and how it mends itself:
 * lamps switched off, snowmen knocked over, drifts ploughed flat, the fish in
 * the pond caught, the present on the dome taken and the toy machine broken.
 *
 * @module
 * @remarks
 * The maps themselves never change; the changes live in {@link World} and the
 * drawing asks here what a cell looks like right now. Every change undoes
 * itself after a while - dark lamps light up again one by one, snowmen and
 * drifts come back, a new fish swims in, a new present lands on the dome and
 * the machine rattles back to life - so nothing of it is saved.
 */
import { BUBBLE_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { addCount, steered, unlock } from "./achievements";
import { poof, say, snowPuff, spawn, SPARKLE_TINTS } from "./effects";
import { MACHINE_PARTS } from "./interior-data";
import { TILE, footprint, terrainUnder } from "./map";
import { SECRET_SPOT } from "./map-data";
import { pick, randomIn } from "./random";
import type {
  AreaId,
  Character,
  GameMap,
  GameState,
  SmallObjectKind,
  World,
} from "./types";

/** Seconds of quiet after the last lamp went dark before lamps light up again. */
export const LAMP_GRACE = 60;

/** Seconds between two lamps lighting up again. */
const LAMP_STAGGER = 3;

/** How long a lamp flickers before it burns steadily, seconds. */
export const LAMP_FLICKER = 0.9;

/** Seconds until a knocked snowman stands again by itself. */
const SNOWMAN_BACK = 90;

/** Seconds until a ploughed drift has grown back. */
const DRIFT_BACK = 45;

/** Seconds until a new fish swims in after one is caught. */
const FISH_BACK = 25;

/** Seconds between two jumps of the fish, and how long a jump lasts. */
const FISH_JUMP_MIN = 2.2;
const FISH_JUMP_MAX = 4.5;
export const FISH_JUMP = 0.7;

/** How close the penguin has to swim to the fish to catch it, map px. */
const FISH_REACH = 10;

/** How far below the middle of its cell the fish swims, map px. */
const FISH_DROP = 3;

/** Seconds until a new present lands on the dome after one is taken. */
const GIFT_BACK = 60;

/**
 * Where the lost present lies on the dome's picture, map px from the left
 * edge and from the top of the picture.
 */
const GIFT_ON_DOME = { x: 96, y: 30 } as const;

/** Height of the dome's picture, map px. */
const DOME_HEIGHT = 142;

/** How close a flyer has to come to the present to take it, map px. */
const GIFT_REACH = 12;

/** Seconds until the broken machine mends itself. */
const MACHINE_MEND = 120;

/** How long an elf takes to repair the machine, seconds. */
export const REPAIR_SECONDS = 1.6;

/** Seconds between two sparks or puffs of soot from the broken machine. */
const SPARK_EVERY = 0.22;

/** Seconds between two sparkles while an elf repairs. */
const REPAIR_SPARKLE = 0.08;

/** How far round the machine's middle sparks fly, map px. */
const SPARK_SPREAD = 26;

/** Sideways drift of the soot, map px per second. */
const SOOT_DRIFT = 2;

/** How far the fox smells its secret, map px. */
const SNIFF_REACH = 56;

/** Seconds between two twitches of the snow over the secret. */
const SNIFF_EVERY = 1.1;

/** How far a dig counts from the secret, map px. */
export const DIG_SLACK = 8;

/** Burst of sparkles where something comes back, and their speed. */
const BACK_SPARKLES = 6;
const BACK_SPRAY = 14;

/** How far above its foot a lamp's light sits, map px. */
const LAMP_HEAD = 32;

/** How far above the feet a speech-worthy poof sits, map px. */
const POOF_LIFT = 8;

/**
 * A fresh world, nothing changed.
 *
 * @param maps - every place, to find the water of the pond
 * @returns the world
 */
export function createWorld(maps: Readonly<Record<AreaId, GameMap>>): World {
  const water = waterCells(maps.outdoors);
  return {
    lampsOff: [],
    lampQuiet: 0,
    relightIn: 0,
    flicker: new Map(),
    snowmenDown: new Map(),
    driftsFlat: new Map(),
    fish: {
      cell: water[Math.floor(water.length / 2)] ?? -1,
      away: 0,
      jumpIn: FISH_JUMP_MIN,
      jump: -1,
    },
    giftAway: 0,
    machine: { broken: false, mendIn: 0, repair: 0, repairer: -1, sparkIn: 0 },
    lap: new Set(),
    hareFrom: null,
    sniffIn: 0,
  };
}

/**
 * Runs the world on: what mends itself, the fish, the broken machine, and
 * what the characters touch just by being there.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updateWorld(state: GameState, dt: number): void {
  relightLamps(state, dt);
  regrow(state, state.world.snowmenDown, dt, "outdoors");
  regrow(state, state.world.driftsFlat, dt, "outdoors");
  updateFish(state, dt);
  updateGift(state, dt);
  updateMachineState(state, dt);
  for (const char of state.chars) {
    if (char.form === "baer" && char.area === "outdoors") {
      ploughDrift(state, char);
    }
  }
  sniff(state, dt);
}

/**
 * What a small object of the map looks like right now.
 *
 * @param state - the game
 * @param area - the place
 * @param cell - the map cell
 * @param small - what stands there
 * @returns the look: as built, or changed (and flickering back)
 */
export function smallLook(
  state: GameState,
  area: AreaId,
  cell: number,
  small: SmallObjectKind,
): "plain" | "changed" {
  const world = state.world;
  let changed = false;
  if (area === "outdoors") {
    switch (small) {
      case "lamp":
        changed = !lampLit(state, cell);
        break;
      case "snowman":
        changed = world.snowmenDown.has(cell);
        break;
      case "drift":
        changed = world.driftsFlat.has(cell);
        break;
      default:
        changed = false;
    }
  }
  return changed ? "changed" : "plain";
}

/**
 * Whether a lamp shines right now; one lighting up again flickers.
 *
 * @param state - the game
 * @param cell - the lamp's cell outside
 * @returns true while it gives light
 */
export function lampLit(state: GameState, cell: number): boolean {
  const flicker = state.world.flicker.get(cell);
  let lit = !state.world.lampsOff.includes(cell);
  if (lit && flicker !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- flicker beats per second; dark on every third
    lit = Math.floor(state.time * 14 + cell) % 3 !== 0;
  }
  return lit;
}

/**
 * How many lamps stand outside.
 *
 * @param state - the game
 * @returns their number
 */
export function lampCount(state: GameState): number {
  return state.maps.outdoors.small.filter((small) => small === "lamp").length;
}

/**
 * The talk key at a lamp: off if it shines, on again if it is dark.
 *
 * @param state - the game
 * @param char - who stands at it
 * @param cell - the lamp's cell
 */
export function toggleLamp(
  state: GameState,
  char: Character,
  cell: number,
): void {
  const world = state.world;
  const at = cellPoint(state.maps.outdoors, cell);
  if (world.lampsOff.includes(cell)) {
    world.lampsOff.splice(world.lampsOff.indexOf(cell), 1);
    world.flicker.set(cell, LAMP_FLICKER);
    say(char, BUBBLE_TEXTS.lampOn);
  } else {
    world.lampsOff.push(cell);
    world.flicker.delete(cell);
    world.lampQuiet = 0;
    world.relightIn = 0;
    say(char, pick(state, BUBBLE_TEXTS.lampOff));
    if (steered(state, char)) {
      unlock(state, "lampFirst");
      if (world.lampsOff.length >= lampCount(state)) {
        unlock(state, "lampsAll");
      }
    }
  }
  spawn(state, "sparkle", "outdoors", at.x, at.y - LAMP_HEAD, 0, 0, 0);
  state.sounds.push("lamp");
}

/**
 * The talk key at a snowman: over it goes, or up again if it lies there.
 *
 * @param state - the game
 * @param char - who stands at it
 * @param cell - the snowman's cell
 */
export function toggleSnowman(
  state: GameState,
  char: Character,
  cell: number,
): void {
  const at = cellPoint(state.maps.outdoors, cell);
  if (state.world.snowmenDown.has(cell)) {
    state.world.snowmenDown.delete(cell);
    poof(state, "outdoors", at.x, at.y - POOF_LIFT);
    say(char, pick(state, BUBBLE_TEXTS.snowmanBuilt));
    state.sounds.push("collect");
    if (steered(state, char)) {
      unlock(state, "snowmanBuilt");
    }
  } else {
    knockSnowman(state, cell);
    say(char, pick(state, BUBBLE_TEXTS.snowmanDown));
    if (steered(state, char)) {
      unlock(state, "snowmanDown");
    }
  }
}

/**
 * Knocks a snowman over, if it stands.
 *
 * @param state - the game
 * @param cell - its cell outside
 * @returns true when it was standing and now lies in the snow
 */
export function knockSnowman(state: GameState, cell: number): boolean {
  const standing =
    state.maps.outdoors.small[cell] === "snowman" &&
    !state.world.snowmenDown.has(cell);
  if (standing) {
    state.world.snowmenDown.set(cell, SNOWMAN_BACK);
    const at = cellPoint(state.maps.outdoors, cell);
    snowPuff(state, "outdoors", at.x, at.y);
    snowPuff(state, "outdoors", at.x, at.y - POOF_LIFT);
    state.sounds.push("thud");
  }
  return standing;
}

/**
 * Whether a snowman stands in a cell outside, not knocked over.
 *
 * @param state - the game
 * @param cell - the cell
 * @returns true for a standing snowman
 */
export function snowmanStands(state: GameState, cell: number): boolean {
  return (
    state.maps.outdoors.small[cell] === "snowman" &&
    !state.world.snowmenDown.has(cell)
  );
}

/**
 * The talk key at the toy machine for somebody who can break or mend it:
 * Grantelbart breaks it, an elf repairs it.
 *
 * @param state - the game
 * @param char - who stands at it
 * @returns true when that was done, false to make a toy as ever
 */
export function tinkerMachine(state: GameState, char: Character): boolean {
  const machine = state.world.machine;
  let done = false;
  if (!machine.broken && char.id === "grantelbart") {
    breakMachine(state, char);
    done = true;
  } else if (machine.broken && machine.repair > 0) {
    say(char, BUBBLE_TEXTS.machineBusy);
    done = true;
  } else if (machine.broken && isElf(char)) {
    machine.repair = REPAIR_SECONDS;
    machine.repairer = state.chars.indexOf(char);
    say(char, pick(state, BUBBLE_TEXTS.machineRepairing));
    state.sounds.push("repair");
    done = true;
  } else if (machine.broken) {
    say(
      char,
      char.id === "grantelbart"
        ? BUBBLE_TEXTS.machineGloat
        : BUBBLE_TEXTS.machineBroken,
    );
    done = true;
  }
  return done;
}

/**
 * Breaks the toy machine, if it works: a crash, soot and sparks.
 *
 * @param state - the game
 * @param char - who broke it
 */
export function breakMachine(state: GameState, char: Character): void {
  const machine = state.world.machine;
  const middle = machineMiddle(state.maps.workshop);
  if (!machine.broken && middle !== null) {
    machine.broken = true;
    machine.mendIn = MACHINE_MEND;
    machine.repair = 0;
    state.toys.length = 0;
    poof(state, "workshop", middle.x, middle.y);
    for (let k = 0; k < BACK_SPARKLES; k += 1) {
      spawn(
        state,
        "soot",
        "workshop",
        middle.x + randomIn(state, -SPARK_SPREAD, SPARK_SPREAD),
        middle.y,
        randomIn(state, -BACK_SPRAY, BACK_SPRAY),
      );
    }
    say(char, pick(state, BUBBLE_TEXTS.machineCrash));
    if (char.area === state.viewArea) {
      state.sounds.push("crash");
    }
    if (steered(state, char) && char.id === "grantelbart") {
      unlock(state, "machineBroken");
    }
  }
}

/**
 * Where the toy machine's picture has its bottom left corner.
 *
 * @param map - the workshop
 * @returns map px, or null when the place has no machine
 * @remarks
 * The picture is exactly as wide as the footprint, so its left edge is the
 * footprint's.
 */
export function machineCorner(map: GameMap): { x: number; y: number } | null {
  const machine = map.objects.find((object) => object.kind === "toyMachine");
  let corner: { x: number; y: number } | null = null;
  if (machine !== undefined) {
    corner = {
      x: machine.tx * TILE,
      y: (machine.ty + footprint("toyMachine").rows) * TILE,
    };
  }
  return corner;
}

/**
 * Where the lost present lies on the dome, as drawn.
 *
 * @param state - the game
 * @returns map px, or null when the map has no dome
 */
export function giftSpot(state: GameState): { x: number; y: number } | null {
  const dome = state.maps.outdoors.objects.find(
    (object) => object.kind === "dome",
  );
  let spot: { x: number; y: number } | null = null;
  if (dome !== undefined) {
    const bottom = (dome.ty + footprint("dome").rows) * TILE;
    spot = {
      x: dome.tx * TILE + GIFT_ON_DOME.x,
      y: bottom - DOME_HEIGHT + GIFT_ON_DOME.y,
    };
  }
  return spot;
}

/**
 * Where the fish swims, while it is there.
 *
 * @param state - the game
 * @returns map px, or null while it is away
 */
export function fishSpot(state: GameState): { x: number; y: number } | null {
  const fish = state.world.fish;
  let spot: { x: number; y: number } | null = null;
  if (fish.away <= 0 && fish.cell >= 0) {
    const at = cellPoint(state.maps.outdoors, fish.cell);
    spot = { x: at.x, y: at.y - TILE / 2 + FISH_DROP };
  }
  return spot;
}

/**
 * The middle of the fox's secret, map px.
 *
 * @returns the point outside
 */
export function secretPoint(): { x: number; y: number } {
  return {
    x: (SECRET_SPOT[0] + 1 / 2) * TILE,
    y: (SECRET_SPOT[1] + 1 / 2) * TILE,
  };
}

/**
 * The fox digs at the secret: a golden bell comes out of the snow.
 *
 * @param state - the game
 * @param char - the fox
 */
export function digSecret(state: GameState, char: Character): void {
  const at = secretPoint();
  snowPuff(state, "outdoors", at.x, at.y);
  poof(state, "outdoors", at.x, at.y - POOF_LIFT);
  say(char, BUBBLE_TEXTS.foxDig);
  state.sounds.push("collect");
  if (steered(state, char)) {
    unlock(state, "foxDig");
  }
}

/**
 * Counts a toy the machine made towards its achievement.
 *
 * @param state - the game
 * @param char - who made it; only the one steered counts
 */
export function countToy(state: GameState, char: Character): void {
  if (steered(state, char)) {
    addCount(state, "toys", "toys10");
  }
}

/** Whether somebody is one of the three elves, as itself. */
function isElf(char: Character): boolean {
  return (
    (char.id === "jordi" || char.id === "trixi" || char.id === "gilfi") &&
    char.form === null
  );
}

/** The middle of the machine's boiler, map px. */
function machineMiddle(map: GameMap): { x: number; y: number } | null {
  const corner = machineCorner(map);
  return corner === null
    ? null
    : {
        x: corner.x + MACHINE_PARTS.funnel[0],
        y: corner.y + MACHINE_PARTS.panel[1],
      };
}

/** The foot of a cell: the middle of its bottom edge, map px. */
function cellPoint(map: GameMap, cell: number): { x: number; y: number } {
  const tx = cell % map.cols;
  const ty = Math.floor(cell / map.cols);
  return { x: (tx + 1 / 2) * TILE, y: (ty + 1) * TILE };
}

/** Every cell of open water in a map. */
function waterCells(map: GameMap): number[] {
  const cells: number[] = [];
  map.ground.forEach((ground, cell) => {
    if (ground === "water") {
      cells.push(cell);
    }
  });
  return cells;
}

/**
 * Dark lamps light up again one by one, once nobody has switched one off for
 * a minute; each flickers before it burns steadily.
 */
function relightLamps(state: GameState, dt: number): void {
  const world = state.world;
  world.lampQuiet += dt;
  for (const [cell, left] of world.flicker) {
    if (left - dt <= 0) {
      world.flicker.delete(cell);
    } else {
      world.flicker.set(cell, left - dt);
    }
  }
  if (world.lampsOff.length > 0 && world.lampQuiet >= LAMP_GRACE) {
    world.relightIn -= dt;
    if (world.relightIn <= 0) {
      world.relightIn = LAMP_STAGGER;
      const cell = world.lampsOff.shift();
      if (cell !== undefined) {
        world.flicker.set(cell, LAMP_FLICKER);
        const at = cellPoint(state.maps.outdoors, cell);
        spawn(state, "sparkle", "outdoors", at.x, at.y - LAMP_HEAD, 0, 0, 0);
      }
    }
  }
}

/** Counts the knocked snowmen or flat drifts down; back they come, with a puff. */
function regrow(
  state: GameState,
  changed: Map<number, number>,
  dt: number,
  area: AreaId,
): void {
  for (const [cell, left] of changed) {
    if (left - dt <= 0) {
      changed.delete(cell);
      const at = cellPoint(state.maps[area], cell);
      snowPuff(state, area, at.x, at.y);
      sparkleBurst(state, area, at.x, at.y - POOF_LIFT);
    } else {
      changed.set(cell, left - dt);
    }
  }
}

/** A little burst of sparkles where something comes back. */
function sparkleBurst(state: GameState, area: AreaId, x: number, y: number) {
  for (let k = 0; k < BACK_SPARKLES; k += 1) {
    spawn(
      state,
      "sparkle",
      area,
      x,
      y,
      randomIn(state, -BACK_SPRAY, BACK_SPRAY),
      randomIn(state, -BACK_SPRAY, 0),
      k % SPARKLE_TINTS,
    );
  }
}

/** The fish jumps now and then, and the penguin can catch it. */
function updateFish(state: GameState, dt: number): void {
  const fish = state.world.fish;
  if (fish.away > 0) {
    fish.away -= dt;
    if (fish.away <= 0) {
      const water = waterCells(state.maps.outdoors);
      fish.cell = pick(state, water);
      fish.jumpIn = FISH_JUMP_MIN;
      fish.jump = -1;
    }
  } else {
    if (fish.jump >= 0) {
      fish.jump += dt;
      if (fish.jump >= FISH_JUMP) {
        fish.jump = -1;
        splash(state);
      }
    } else {
      fish.jumpIn -= dt;
      if (fish.jumpIn <= 0) {
        fish.jump = 0;
        fish.jumpIn = randomIn(state, FISH_JUMP_MIN, FISH_JUMP_MAX);
        splash(state);
      }
    }
    catchFish(state);
  }
}

/** A little splash where the fish leaves or enters the water. */
function splash(state: GameState): void {
  const spot = fishSpot(state);
  if (spot !== null) {
    snowPuff(state, "outdoors", spot.x, spot.y);
  }
}

/** A penguin swimming onto the fish catches it. */
function catchFish(state: GameState): void {
  const spot = fishSpot(state);
  const map = state.maps.outdoors;
  for (const char of state.chars) {
    if (
      spot !== null &&
      char.form === "pinguin" &&
      char.area === "outdoors" &&
      terrainUnder(map, char.x, char.y - 1) === "water" &&
      Math.hypot(char.x - spot.x, char.y - spot.y) < FISH_REACH
    ) {
      state.world.fish.away = FISH_BACK;
      snowPuff(state, "outdoors", spot.x, spot.y);
      poof(state, "outdoors", spot.x, spot.y - POOF_LIFT);
      say(char, pick(state, BUBBLE_TEXTS.fishCaught));
      state.sounds.push("splash");
      if (steered(state, char)) {
        unlock(state, "fish");
      }
    }
  }
}

/** A new present on the dome after a while; Trixi flying takes it. */
function updateGift(state: GameState, dt: number): void {
  const spot = giftSpot(state);
  if (state.world.giftAway > 0) {
    state.world.giftAway -= dt;
    if (state.world.giftAway <= 0 && spot !== null) {
      sparkleBurst(state, "outdoors", spot.x, spot.y);
    }
  } else if (spot !== null) {
    for (const char of state.chars) {
      if (
        char.id === "trixi" &&
        char.flying &&
        char.area === "outdoors" &&
        Math.abs(char.x - spot.x) < GIFT_REACH &&
        Math.abs(char.y - char.altitude - spot.y) < GIFT_REACH
      ) {
        state.world.giftAway = GIFT_BACK;
        poof(state, "outdoors", spot.x, spot.y);
        say(char, pick(state, BUBBLE_TEXTS.giftTaken));
        state.sounds.push("collect");
        if (steered(state, char)) {
          unlock(state, "roofGift");
        }
      }
    }
  }
}

/** The broken machine smokes and sparks, an elf mends it, or it mends itself. */
function updateMachineState(state: GameState, dt: number): void {
  const machine = state.world.machine;
  const middle = machineMiddle(state.maps.workshop);
  const corner = machineCorner(state.maps.workshop);
  if (machine.broken && middle !== null && corner !== null) {
    machine.sparkIn -= dt;
    if (machine.repair > 0) {
      machine.repair -= dt;
      if (machine.sparkIn <= 0) {
        machine.sparkIn = REPAIR_SPARKLE;
        spawn(
          state,
          "sparkle",
          "workshop",
          middle.x + randomIn(state, -SPARK_SPREAD, SPARK_SPREAD),
          middle.y + randomIn(state, -SPARK_SPREAD, SPARK_SPREAD / 2),
          0,
          -BACK_SPRAY,
          Math.floor(randomIn(state, 0, SPARKLE_TINTS)),
        );
      }
      if (machine.repair <= 0) {
        mend(state, machine.repairer);
      }
    } else {
      machine.mendIn -= dt;
      if (machine.sparkIn <= 0) {
        machine.sparkIn = SPARK_EVERY;
        spawn(
          state,
          "soot",
          "workshop",
          corner.x + MACHINE_PARTS.steam[0] + randomIn(state, -1, 1),
          corner.y + MACHINE_PARTS.steam[1],
          randomIn(state, -SOOT_DRIFT, SOOT_DRIFT),
        );
        spawn(
          state,
          "sparkle",
          "workshop",
          corner.x + MACHINE_PARTS.panel[0] + randomIn(state, -SPARK_SPREAD, 0),
          corner.y + MACHINE_PARTS.panel[1],
          randomIn(state, -BACK_SPRAY, BACK_SPRAY),
          -BACK_SPRAY,
          0,
        );
      }
      if (machine.mendIn <= 0) {
        mend(state, -1);
      }
    }
  }
}

/** The machine works again: repaired by an elf, or by itself. */
function mend(state: GameState, repairer: number): void {
  const machine = state.world.machine;
  const middle = machineMiddle(state.maps.workshop);
  machine.broken = false;
  machine.repair = 0;
  machine.repairer = -1;
  if (middle !== null) {
    poof(state, "workshop", middle.x, middle.y);
  }
  if (state.viewArea === "workshop") {
    state.sounds.push("toy");
  }
  const elf = state.chars[repairer] as Character | undefined;
  if (elf !== undefined) {
    say(elf, pick(state, BUBBLE_TEXTS.machineFixed));
    if (steered(state, elf)) {
      unlock(state, "machineFixed");
    }
  }
}

/** The bear walking into a drift ploughs it flat. */
function ploughDrift(state: GameState, char: Character): void {
  const map = state.maps.outdoors;
  const tx = Math.floor(char.x / TILE);
  const ty = Math.floor((char.y - 1) / TILE);
  const cell = ty * map.cols + tx;
  if (
    map.small[cell] === "drift" &&
    !state.world.driftsFlat.has(cell) &&
    terrainUnder(map, char.x, char.y - 1) === "drift"
  ) {
    state.world.driftsFlat.set(cell, DRIFT_BACK);
    const at = cellPoint(map, cell);
    snowPuff(state, "outdoors", at.x, at.y);
    snowPuff(state, "outdoors", at.x, at.y - POOF_LIFT);
    say(char, BUBBLE_TEXTS.bearPlough);
    if (steered(state, char)) {
      unlock(state, "bearDrift");
    }
  }
}

/** Near its secret the fox's nose twitches: the snow there stirs now and then. */
function sniff(state: GameState, dt: number): void {
  const char = state.chars[state.active];
  const at = secretPoint();
  state.world.sniffIn -= dt;
  if (
    char.form === "fuchs" &&
    char.area === "outdoors" &&
    Math.hypot(char.x - at.x, char.y - at.y) < SNIFF_REACH &&
    state.world.sniffIn <= 0
  ) {
    state.world.sniffIn = SNIFF_EVERY;
    snowPuff(state, "outdoors", at.x, at.y);
  }
}
