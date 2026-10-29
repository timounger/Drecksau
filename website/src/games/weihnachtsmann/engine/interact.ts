/**
 * The talk key in front of something: the toy machine makes a toy (or breaks,
 * or is repaired), the sleigh takes off, guitars, amplifiers, drums and the
 * organ play, lamps go off and on, snowmen fall over and stand up again, and
 * a few things just get a remark. Anywhere else it is plain talking.
 *
 * @module
 * @remarks
 * One handler per {@link SpotKind}; the spots themselves are data in the map
 * files. A new thing to use is a new kind, a spot on a map and a handler here.
 * Lamps and snowmen are small objects of the map and need no spot: whatever
 * of them stands in reach is used; the fox also finds its secret this way.
 */
import { BUBBLE_TEXTS, TOY_NAMES } from "@/games/weihnachtsmann/i18n/texts";
import { talk } from "./abilities";
import { collect } from "./achievements";
import { notes, poof, say, spawn, SPARKLE_TINTS } from "./effects";
import { MACHINE_PARTS } from "./interior-data";
import { TILE, areaMap, inBox } from "./map";
import { SECRET_SPOT } from "./map-data";
import { pick, randomIn } from "./random";
import { isRiding, boardSleigh } from "./sleigh";
import {
  TOY_KINDS,
  type Character,
  type Dir,
  type FlyingToy,
  type GameMap,
  type GameState,
  type SmallObjectKind,
  type SoundId,
  type Spot,
  type SpotKind,
} from "./types";
import {
  DIG_SLACK,
  countToy,
  digSecret,
  machineCorner,
  tinkerMachine,
  toggleLamp,
  toggleSnowman,
} from "./world";

/** How far ahead of the feet the talk key reaches, map px. */
const REACH = 9;

/** How far outside a spot still counts, map px. */
const SLACK = 3;

/** How long a made toy flies from the funnel into the sack, seconds. */
export const TOY_FLIGHT = 1.1;

/** How high a made toy arcs over its straight way, map px. */
const TOY_ARC = 26;

/** Most toys in the air at once; the oldest lands at once. */
const MAX_TOYS = 5;

/** Seconds between two puffs of steam from the machine. */
const STEAM_EVERY = 0.35;

/** Sparkles when a toy lands in the sack, and how fast they spray, map px per second. */
const SACK_SPARKLES = 6;
const SACK_SPRAY = 12;

/** Sideways drift of the steam, map px per second. */
const STEAM_DRIFT = 2;

/** How far above the top of an instrument the notes start, map px. */
const NOTE_LIFT = 6;

/** Which way the reach points for each facing. */
const AHEAD: Readonly<Record<Dir, readonly [number, number]>> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

/** The small objects of the map the talk key works on, and as what. */
const USABLE_SMALL: Readonly<Partial<Record<SmallObjectKind, SpotKind>>> = {
  lamp: "lamp",
  snowman: "snowman",
};

/** What each kind of spot does. */
const HANDLERS: Readonly<
  Record<SpotKind, (state: GameState, char: Character, spot: Spot) => void>
> = {
  machine: (state, char) => {
    if (!tinkerMachine(state, char)) {
      makeToy(state, char);
    }
  },
  sleigh: (state, char) => {
    boardSleigh(state, char);
  },
  wishes: (state, char) => {
    say(char, pick(state, BUBBLE_TEXTS.wishes));
  },
  armchair: (state, char) => {
    say(
      char,
      char.id === "santa"
        ? BUBBLE_TEXTS.armchairSanta
        : BUBBLE_TEXTS.armchairOthers,
    );
  },
  guitar: (state, char, spot) => {
    play(state, char, spot, "riff");
  },
  amp: (state, char, spot) => {
    play(state, char, spot, "riff");
  },
  drums: (state, char, spot) => {
    play(state, char, spot, "drums");
  },
  organ: (state, char, spot) => {
    play(state, char, spot, "organ");
  },
  portrait: (state, char) => {
    say(char, BUBBLE_TEXTS.portrait);
  },
  lamp: (state, char, spot) => {
    toggleLamp(state, char, spot.ty * state.maps.outdoors.cols + spot.tx);
  },
  snowman: (state, char, spot) => {
    toggleSnowman(state, char, spot.ty * state.maps.outdoors.cols + spot.tx);
  },
  dig: digSecret,
};

/**
 * The thing the character steered stands in front of, if any.
 *
 * @param state - the game
 * @returns the spot within reach, or null
 */
export function spotInReach(state: GameState): Spot | null {
  const char = state.chars[state.active];
  let found: Spot | null = null;
  if (state.fade === null && !isRiding(state, char) && char.altitude < 1) {
    const [ax, ay] = AHEAD[char.dir];
    const x = char.x + ax * REACH;
    const y = char.y - 2 + ay * REACH;
    const map = areaMap(state, char);
    found =
      map.spots.find((spot) => inBox(spot, x, y, SLACK)) ??
      smallSpot(map, x, y) ??
      secretSpot(char, x, y);
  }
  return found;
}

/**
 * The talk key: uses what is in reach, or says something.
 *
 * @param state - the game
 */
export function interact(state: GameState): void {
  const char = state.chars[state.active];
  const spot = spotInReach(state);
  if (spot !== null) {
    HANDLERS[spot.kind](state, char, spot);
  } else if (!isRiding(state, char)) {
    talk(state);
  }
}

/**
 * Moves the made toys on, drops them into the sack and keeps the steam
 * coming out of the machine.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updateMachine(state: GameState, dt: number): void {
  const corner = machineCorner(state.maps.workshop);
  for (const toy of state.toys) {
    toy.age += dt;
  }
  const landed = state.toys.filter((toy) => toy.age >= TOY_FLIGHT);
  if (landed.length > 0 && corner !== null) {
    for (let k = 0; k < SACK_SPARKLES; k += 1) {
      spawn(
        state,
        "sparkle",
        "workshop",
        corner.x + MACHINE_PARTS.sack[0],
        corner.y + MACHINE_PARTS.sack[1],
        randomIn(state, -SACK_SPRAY, SACK_SPRAY),
        randomIn(state, -SACK_SPRAY * 2, -SACK_SPRAY / 2),
        k % SPARKLE_TINTS,
      );
    }
  }
  const flying = state.toys.filter((toy) => toy.age < TOY_FLIGHT);
  state.toys.length = 0;
  state.toys.push(...flying);
  const ticks = Math.floor(state.time / STEAM_EVERY);
  if (
    corner !== null &&
    !state.world.machine.broken &&
    ticks !== Math.floor((state.time - dt) / STEAM_EVERY)
  ) {
    spawn(
      state,
      "steam",
      "workshop",
      corner.x + MACHINE_PARTS.steam[0] + randomIn(state, -1, 1),
      corner.y + MACHINE_PARTS.steam[1],
      randomIn(state, -STEAM_DRIFT, STEAM_DRIFT),
    );
  }
}

/**
 * Where a made toy is on its way from the funnel into the sack.
 *
 * @param corner - the machine picture's bottom left corner, map px
 * @param toy - the toy
 * @returns map px
 */
export function toyPosition(
  corner: { x: number; y: number },
  toy: FlyingToy,
): { x: number; y: number } {
  const t = Math.min(1, toy.age / TOY_FLIGHT);
  const [fx, fy] = MACHINE_PARTS.funnel;
  const [sx, sy] = MACHINE_PARTS.sack;
  return {
    x: corner.x + fx + (sx - fx) * t,
    y: corner.y + fy + (sy - fy) * t - TOY_ARC * Math.sin(Math.PI * t),
  };
}

/** The machine: a poof from the funnel, and a new toy on its way. */
function makeToy(state: GameState, char: Character): void {
  const corner = machineCorner(areaMap(state, char));
  if (corner !== null) {
    const kind = pick(state, TOY_KINDS);
    if (state.toys.length >= MAX_TOYS) {
      state.toys.shift();
    }
    state.toys.push({ kind, age: 0 });
    poof(
      state,
      char.area,
      corner.x + MACHINE_PARTS.funnel[0],
      corner.y + MACHINE_PARTS.funnel[1],
    );
    say(char, TOY_NAMES[kind]);
    state.sounds.push("toy");
    countToy(state, char);
  }
}

/** An instrument: its sound, notes floating up, and a remark. */
function play(
  state: GameState,
  char: Character,
  spot: Spot,
  sound: SoundId,
): void {
  state.sounds.push(sound);
  if (char.area === "grantelHouse") {
    collect(state, "instruments", spot.kind);
  }
  notes(
    state,
    char.area,
    (spot.tx + spot.w / 2) * TILE,
    spot.ty * TILE - NOTE_LIFT,
  );
  say(
    char,
    pick(
      state,
      char.id === "grantelbart"
        ? BUBBLE_TEXTS.musicGrantelbart
        : BUBBLE_TEXTS.musicOthers,
    ),
  );
}

/** A lamp or snowman of the map at a point outside, as a spot to use. */
function smallSpot(map: GameMap, x: number, y: number): Spot | null {
  const tx = Math.floor(x / TILE);
  const ty = Math.floor(y / TILE);
  const inside =
    map.area === "outdoors" &&
    tx >= 0 &&
    ty >= 0 &&
    tx < map.cols &&
    ty < map.rows;
  const small = inside ? map.small[ty * map.cols + tx] : null;
  const kind = small === null ? undefined : USABLE_SMALL[small];
  return kind === undefined ? null : { kind, tx, ty, w: 1, h: 1 };
}

/** The fox's secret, if the fox stands at it outside. */
function secretSpot(char: Character, x: number, y: number): Spot | null {
  const secret: Spot = {
    kind: "dig",
    tx: SECRET_SPOT[0],
    ty: SECRET_SPOT[1],
    w: 1,
    h: 1,
  };
  const found =
    char.form === "fuchs" &&
    char.area === "outdoors" &&
    (inBox(secret, x, y, DIG_SLACK) ||
      inBox(secret, char.x, char.y, DIG_SLACK));
  return found ? secret : null;
}
