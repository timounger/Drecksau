/**
 * The wild animals of the east land: snow hares in the clearing by the
 * plantation, penguins on the lake and owls round the market. They wander
 * about and shy away from everybody - except Jordi in their own shape, who
 * can talk to them with the talk key.
 *
 * @module
 */
import { EAST_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { collect, steered } from "./achievements";
import { CRITTER_HOMES } from "./east-data";
import { TILE, fits, inBox } from "./map";
import type { MoveProfile } from "./cast";
import { nextRandom, pick, randomIn } from "./random";
import type {
  AnimalId,
  Character,
  Critter,
  CritterKind,
  GameState,
  Spot,
} from "./types";

/** Which of Jordi's animals each kind talks to. */
const FRIENDS: Readonly<Record<CritterKind, AnimalId>> = {
  hare: "hase",
  penguin: "pinguin",
  owl: "vogel",
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- paces, tuned by eye */
/** How fast each kind strolls and flees, map px per second. */
const PACE: Readonly<Record<CritterKind, readonly [number, number]>> = {
  hare: [26, 95],
  penguin: [14, 40],
  owl: [28, 70],
};
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** How near somebody may come before an animal flees, map px. */
const SHY = 38;

/** How far it flees, map px. */
const FLEE = 60;

/** How far an animal notices Jordi in its own shape and comes over, map px. */
const CURIOUS = 96;

/** How close it comes, map px. */
const COME_CLOSE = 14;

/** How near Jordi has to be to talk, map px. */
const TALK_REACH = 30;

/** Shortest and longest rest between two strolls, seconds. */
const REST_MIN = 1.5;
const REST_MAX = 5;

/** How far a stroll goes at most, map px. */
const STROLL = 50;

/** Close enough to the target, map px. */
const ARRIVED = 2;

/** How high an owl flies, map px, and how fast it rises or lands, per second. */
const OWL_HEIGHT = 16;
const OWL_LIFT = 4;

/** How long an animal's speech bubble stays, seconds. */
const BUBBLE_SECONDS = 3.2;

/** The foot box of a hare or penguin, for what blocks it. */
const SMALL_FEET: MoveProfile = {
  speed: 0,
  passes: [],
  flies: false,
  grip: 1,
  iceSpeed: 1,
  waterSpeed: 0,
  footW: 6,
  footH: 3,
  height: 12,
};

/**
 * The animals at their homes, spread out.
 *
 * @returns them all
 */
export function createCritters(): Critter[] {
  const critters: Critter[] = [];
  for (const kind of Object.keys(CRITTER_HOMES) as CritterKind[]) {
    const home = CRITTER_HOMES[kind];
    for (let k = 0; k < home.count; k += 1) {
      const x =
        (home.box.tx + ((k + 1) * home.box.w) / (home.count + 1)) * TILE;
      const y = (home.box.ty + home.box.h / 2) * TILE;
      critters.push({
        kind,
        x,
        y,
        targetX: x,
        targetY: y,
        timer: k,
        right: k % 2 === 0,
        moving: false,
        altitude: 0,
        bubble: null,
      });
    }
  }
  return critters;
}

/**
 * Lets the animals wander, flee and fall silent.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updateCritters(state: GameState, dt: number): void {
  for (const critter of state.world.east.critters) {
    const bubble = critter.bubble;
    if (bubble !== null) {
      bubble.left -= dt;
      critter.bubble = bubble.left > 0 ? bubble : null;
    }
    const fright = scarer(state, critter);
    const friend = friendOf(state, critter);
    critter.timer -= dt;
    if (friend !== null && critter.bubble === null) {
      // Curious: it comes over to Jordi in its own shape.
      const side = critter.x < friend.x ? -1 : 1;
      critter.targetX = friend.x + side * COME_CLOSE;
      critter.targetY = friend.y;
      critter.timer = REST_MIN;
    } else if (fright !== null) {
      const away = Math.atan2(critter.y - fright.y, critter.x - fright.x);
      critter.targetX = critter.x + Math.cos(away) * FLEE;
      critter.targetY = critter.y + Math.sin(away) * FLEE;
      critter.timer = REST_MIN;
    } else if (critter.timer <= 0) {
      planStroll(state, critter);
    }
    walk(state, critter, fright !== null, dt);
  }
}

/**
 * An animal Jordi could talk to, as a spot for the talk key.
 *
 * @param state - the game
 * @param char - the character steered
 * @returns a spot at the animal, or null
 */
export function critterSpot(state: GameState, char: Character): Spot | null {
  const critter = friendNear(state, char);
  return critter === null
    ? null
    : {
        kind: "critter",
        tx: Math.floor(critter.x / TILE),
        ty: Math.floor(critter.y / TILE),
        w: 1,
        h: 1,
      };
}

/**
 * Jordi in the right shape has a chat with an animal.
 *
 * @param state - the game
 * @param char - Jordi
 */
export function talkToCritter(state: GameState, char: Character): void {
  const critter = friendNear(state, char);
  if (critter !== null) {
    critter.bubble = {
      text: pick(state, EAST_TEXTS.critterLines[critter.kind]),
      left: BUBBLE_SECONDS,
    };
    critter.right = char.x > critter.x;
    critter.timer = BUBBLE_SECONDS;
    critter.targetX = critter.x;
    critter.targetY = critter.y;
    state.sounds.push(critter.kind === "owl" ? "owl" : "wish");
    if (steered(state, char)) {
      collect(state, "critters", critter.kind);
    }
  }
}

/** The nearest animal of Jordi's own shape within talking distance. */
function friendNear(state: GameState, char: Character): Critter | null {
  let best: Critter | null = null;
  let bestD = TALK_REACH;
  if (char.area === "outdoors") {
    for (const critter of state.world.east.critters) {
      const d = Math.hypot(critter.x - char.x, critter.y - char.y);
      if (FRIENDS[critter.kind] === char.form && d < bestD) {
        best = critter;
        bestD = d;
      }
    }
  }
  return best;
}

/** Jordi in this animal's shape, when near enough to come over to. */
function friendOf(state: GameState, critter: Critter): Character | null {
  return (
    state.chars.find(
      (char) =>
        char.area === "outdoors" &&
        char.form === FRIENDS[critter.kind] &&
        Math.hypot(char.x - critter.x, char.y - critter.y) < CURIOUS,
    ) ?? null
  );
}

/** Whoever comes too near an animal and is not its friend, or null. */
function scarer(state: GameState, critter: Critter): Character | null {
  return (
    state.chars.find(
      (char) =>
        char.area === "outdoors" &&
        char.form !== FRIENDS[critter.kind] &&
        Math.hypot(char.x - critter.x, char.y - critter.y) < SHY,
    ) ?? null
  );
}

/** A new place to stroll to inside its home, or a rest. */
function planStroll(state: GameState, critter: Critter): void {
  const box = CRITTER_HOMES[critter.kind].box;
  critter.timer = randomIn(state, REST_MIN, REST_MAX);
  if (nextRandom(state) < 1 / 2 || !inBox(box, critter.x, critter.y)) {
    const angle = randomIn(state, 0, Math.PI * 2);
    const distance = randomIn(state, STROLL / 2, STROLL);
    let x = critter.x + Math.cos(angle) * distance;
    let y = critter.y + Math.sin(angle) * distance;
    if (!inBox(box, x, y)) {
      x = (box.tx + randomIn(state, 1, box.w - 1)) * TILE;
      y = (box.ty + randomIn(state, 1, box.h - 1)) * TILE;
    }
    critter.targetX = x;
    critter.targetY = y;
  }
}

/** One step towards the target; hares and penguins go round what blocks. */
function walk(
  state: GameState,
  critter: Critter,
  fleeing: boolean,
  dt: number,
): void {
  const dx = critter.targetX - critter.x;
  const dy = critter.targetY - critter.y;
  const distance = Math.hypot(dx, dy);
  const speed = PACE[critter.kind][fleeing ? 1 : 0];
  const flies = critter.kind === "owl";
  critter.moving = distance > ARRIVED;
  if (critter.moving) {
    const step = Math.min(distance, speed * dt);
    const x = critter.x + (dx / distance) * step;
    const y = critter.y + (dy / distance) * step;
    const map = state.maps.outdoors;
    if (flies || fits(map, SMALL_FEET, x, y)) {
      critter.x = x;
      critter.y = y;
    } else {
      critter.targetX = critter.x;
      critter.targetY = critter.y;
      critter.moving = false;
    }
    if (Math.abs(dx) > ARRIVED) {
      critter.right = dx > 0;
    }
  }
  if (flies) {
    const lift = critter.moving ? OWL_HEIGHT : 0;
    critter.altitude += (lift - critter.altitude) * Math.min(1, dt * OWL_LIFT);
  }
}
