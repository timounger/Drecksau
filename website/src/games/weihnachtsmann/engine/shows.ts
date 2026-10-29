/**
 * The abilities that play out over a few seconds: Santa reading wishes,
 * Grantelbart's electric guitar, Gugor's telescope, Gilfi making things float
 * and Balbo falling flat on his face.
 *
 * @module
 * @remarks
 * A show starts on the ability key or, for some, now and then by itself
 * ({@link NpcHabit}); it runs on the character ({@link Show}) and ends on its
 * own. Lengths and cooldowns are data in `cast.ts` ({@link SHOWS}), so pressing
 * the key again and again does no harm. What a show does when it starts,
 * while it runs and when it ends is one handler per kind here; what it looks
 * like is drawn by `components/render-shows.ts`.
 */
import { BUBBLE_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { addCount, collect, inView, steered, unlock } from "./achievements";
import { CAST, SHOWS, type NpcHabit } from "./cast";
import { SPARKLE_TINTS, NOTE_KINDS, say, snowPuff, spawn } from "./effects";
import { TILE, areaMap, fits, footprint, terrainUnder } from "./map";
import { moveCharacter } from "./movement";
import { nextRandom, pick, randomIn } from "./random";
import { isRiding } from "./sleigh";
import { spyRemark, startSpy } from "./spyglass";
import {
  breakMachine,
  knockSnowman,
  machineCorner,
  snowmanStands,
} from "./world";
import {
  TOY_KINDS,
  type BigObjectKind,
  type Character,
  type Dir,
  type Floater,
  type GameState,
  type ShowKind,
  type SmallObjectKind,
  type SoundId,
} from "./types";

/** When Balbo hits the ground and when he starts to get up, seconds. */
export const FALL_IMPACT = 0.22;
export const FALL_GETUP = 0.35;

/** How long a startled jump lasts, seconds, and how high it goes, map px. */
const HOP_SECONDS = 0.35;
const HOP_HEIGHT = 5;

/** How far Grantelbart's guitar is heard well enough to complain, map px. */
const LOUD_REACH = 90;

/** Listeners a riff has to startle at once for the concert achievement. */
const CONCERT_CROWD = 3;

/** How close to the toy machine a riff shakes it to pieces, map px. */
const MACHINE_SHAKE = 110;

/** Where the machine's middle is from its picture's bottom left, map px. */
const MACHINE_MIDDLE = { x: 64, y: -20 } as const;

/** How far ahead of Balbo's feet a snowman is hit by his fall, map px. */
const SNOWMAN_HIT = 14;

/** Seconds between two notes out of the guitar. */
const NOTE_EVERY = 0.16;

/** How fast notes rise and spread, map px per second. */
const NOTE_RISE = 30;
const NOTE_SPREAD = 26;

/** Where on Grantelbart the notes come out, above the feet, map px. */
const GUITAR_HEIGHT = 16;

/** Seconds between two sparkles round Santa, and how far round him. */
const SHIMMER_EVERY = 0.09;
const SHIMMER_SPREAD = 12;

/** How far round Gilfi things float, map px. */
const FLOAT_REACH = 64;

/** Most map objects lifted at once, and toys conjured at least. */
const MAX_LIFTED = 6;
const MIN_CONJURED = 2;

/** Things floating in all, at most. */
const MAX_FLOATERS = 7;

/** How far from Gilfi conjured toys appear, map px. */
const CONJURE_NEAR = 16;
const CONJURE_FAR = 34;

/** Each floater rises this much after the one before, seconds. */
const FLOAT_STAGGER = 0.12;

/** How long before the end of the show the floaters are all down, seconds. */
const FLOAT_SETTLE = 0.2;

/** Seconds between two sparkles round the floaters. */
const MAGIC_EVERY = 0.06;

/** How far round a floater sparkles appear, and how high it floats, map px. */
const MAGIC_SPREAD = 6;
export const FLOAT_HEIGHT = 14;

/** The small map objects light enough to float. */
const FLOATABLE: ReadonlySet<SmallObjectKind> = new Set<SmallObjectKind>([
  "gifts",
  "rock",
  "snowman",
  "deadBush",
  "crookedSign",
]);

/** The workshop furniture whose toys rise into the air. */
const TOY_PLACES: ReadonlySet<BigObjectKind> = new Set<BigObjectKind>([
  "toyShelf",
  "toyShelfLadder",
  "workbench",
  "toyMachine",
]);

/** How far ahead of Balbo's feet his head lands in the snow, map px. */
const HEAD_AHEAD = 8;

/** Balbo's lurch forward when he trips: on snow, and on ice, map px per second. */
const TRIP_PUSH = 28;
const TRIP_PUSH_ICE = 80;

/** How quickly the lurch dies away: on snow, and on ice, per second. */
const TRIP_DRAG = 9;
const TRIP_DRAG_ICE = 1.6;

/** Which way each facing points. */
const AHEAD: Readonly<Record<Dir, readonly [number, number]>> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

/** What a show does: when it starts, every step, and when it ends. */
type ShowHandlers = {
  readonly start: (state: GameState, char: Character) => void;
  readonly tick: (state: GameState, char: Character) => void;
  readonly end: (state: GameState, char: Character) => void;
};

/** Nothing to do. */
const IDLE = (): void => {};

/** What each kind of show does. */
const HANDLERS: Readonly<Record<ShowKind, ShowHandlers>> = {
  wishes: { start: startWishes, tick: shimmer, end: endWishes },
  guitar: { start: startGuitar, tick: moreNotes, end: IDLE },
  telescope: { start: startTelescope, tick: IDLE, end: endTelescope },
  levitate: { start: startLevitate, tick: magicDust, end: endLevitate },
  fall: { start: startFall, tick: hitGround, end: getUp },
};

/**
 * Starts a show on somebody, unless one is running or it is too soon again.
 *
 * @param state - the game
 * @param char - who shows off
 * @param kind - which show
 */
export function startShow(
  state: GameState,
  char: Character,
  kind: ShowKind,
): void {
  if (char.show === null && char.cooldown <= 0) {
    char.show = { kind, elapsed: 0, tickIn: 0 };
    char.cooldown = SHOWS[kind].cooldown;
    HANDLERS[kind].start(state, char);
  }
}

/**
 * Runs every show on, ends those that are over, and counts the cooldowns and
 * jumps down.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updateShows(state: GameState, dt: number): void {
  for (const char of state.chars) {
    char.cooldown = Math.max(0, char.cooldown - dt);
    char.hop = Math.max(0, char.hop - dt);
    const show = char.show;
    if (show !== null) {
      show.elapsed += dt;
      show.tickIn -= dt;
      HANDLERS[show.kind].tick(state, char);
      if (show.elapsed >= SHOWS[show.kind].seconds) {
        char.show = null;
        HANDLERS[show.kind].end(state, char);
      }
    }
  }
  for (const floater of state.floats) {
    floater.age += dt;
  }
  const floating = state.floats.filter((floater) => floater.age < floater.life);
  state.floats.length = 0;
  state.floats.push(...floating);
}

/**
 * Whether somebody is held in place by its show.
 *
 * @param char - the character
 * @returns true while a show keeps it standing (or lying)
 */
export function heldByShow(char: Character): boolean {
  return char.show !== null && SHOWS[char.show.kind].still;
}

/**
 * Moves somebody held by its show a step: it stands, or Balbo slides along
 * where he fell.
 *
 * @param state - the game
 * @param char - the character
 * @param dt - seconds
 */
export function holdStill(state: GameState, char: Character, dt: number): void {
  const map = areaMap(state, char);
  if (char.show?.kind === "fall") {
    char.onIce = terrainUnder(map, char.x, char.y - 1) === "ice";
    const drag = char.onIce ? TRIP_DRAG_ICE : TRIP_DRAG;
    const keep = 1 - Math.min(1, dt * drag);
    char.vx *= keep;
    char.vy *= keep;
    const walk = CAST[char.id].walk;
    if (fits(map, walk, char.x + char.vx * dt, char.y)) {
      char.x += char.vx * dt;
    } else {
      char.vx = 0;
    }
    if (fits(map, walk, char.x, char.y + char.vy * dt)) {
      char.y += char.vy * dt;
    } else {
      char.vy = 0;
    }
    char.moving = false;
  } else {
    moveCharacter(map, char, 0, 0, dt);
  }
}

/**
 * Now and then somebody nobody steers puts on its show by itself: Balbo
 * trips, Grantelbart strums at home, Gilfi tries a little magic.
 *
 * @param state - the game
 * @param char - the character, not steered
 * @param dt - seconds
 */
export function showOffMaybe(
  state: GameState,
  char: Character,
  dt: number,
): void {
  const ability = CAST[char.id].ability;
  if (ability !== "fly" && ability !== "transform") {
    const habit: NpcHabit | null = SHOWS[ability].npc;
    if (
      habit !== null &&
      char.show === null &&
      char.cooldown <= 0 &&
      char.form === null &&
      !char.flying &&
      habit.when === char.brain.mode &&
      (habit.area === null || habit.area === char.area) &&
      nextRandom(state) < habit.rate * dt
    ) {
      startShow(state, char, ability);
    }
  }
}

/**
 * How high a startled jump lifts somebody right now.
 *
 * @param char - the character
 * @returns map px above the ground
 */
export function hopLift(char: Character): number {
  return char.hop > 0
    ? Math.sin(Math.PI * (1 - char.hop / HOP_SECONDS)) * HOP_HEIGHT
    : 0;
}

/**
 * How far a floater is up right now.
 *
 * @param floater - the floater
 * @returns map px above where it rests, 0 while it waits
 */
export function floatLift(floater: Floater): number {
  const rise = FLOAT_STAGGER * 2 + FLOAT_SETTLE;
  const up = Math.max(
    0,
    Math.min(1, floater.age / rise, (floater.life - floater.age) / rise),
  );
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- smoothstep
  const eased = up * up * (3 - 2 * up);
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- bobbing speed (rad/s) and depth (share of the height)
  const bob = Math.sin(floater.age * 3 + floater.phase) * 0.18;
  return FLOAT_HEIGHT * eased * (1 + bob);
}

/** Pushes a sound, if the one making it is on screen. */
function heard(state: GameState, char: Character, sound: SoundId): void {
  if (char.area === state.viewArea) {
    state.sounds.push(sound);
  }
}

/** Santa: a chime, and he wonders aloud. */
function startWishes(state: GameState, char: Character): void {
  say(char, pick(state, BUBBLE_TEXTS.wishesStart));
  heard(state, char, "wish");
}

/** Golden sparkles round Santa while he reads the wishes. */
function shimmer(state: GameState, char: Character): void {
  const show = char.show;
  if (steered(state, char)) {
    for (const other of state.chars) {
      if (
        other !== char &&
        other.area === char.area &&
        !isRiding(state, other) &&
        inView(state, other)
      ) {
        collect(state, "wishes", other.id);
      }
    }
  }
  if (show !== null && show.tickIn <= 0) {
    show.tickIn = SHIMMER_EVERY;
    spawn(
      state,
      "sparkle",
      char.area,
      char.x + randomIn(state, -SHIMMER_SPREAD, SHIMMER_SPREAD),
      char.y -
        char.altitude -
        randomIn(state, 0, CAST[char.id].walk.height + SHIMMER_SPREAD / 2),
      0,
      -randomIn(state, 0, SHIMMER_SPREAD),
      0,
    );
  }
}

/** Santa has seen enough. */
function endWishes(state: GameState, char: Character): void {
  say(char, pick(state, BUBBLE_TEXTS.wishesEnd));
}

/** Grantelbart: a riff, and everybody near jumps and complains. */
function startGuitar(state: GameState, char: Character): void {
  say(char, pick(state, BUBBLE_TEXTS.guitarStart));
  heard(state, char, "riff");
  let startled = 0;
  for (const other of state.chars) {
    if (
      other !== char &&
      other.area === char.area &&
      !isRiding(state, other) &&
      Math.hypot(other.x - char.x, other.y - char.y) < LOUD_REACH
    ) {
      if (other.altitude < 1) {
        other.hop = HOP_SECONDS;
      }
      startled += 1;
      say(
        other,
        other.id === "gugor"
          ? BUBBLE_TEXTS.guitarFan
          : pick(state, BUBBLE_TEXTS.guitarTooLoud),
      );
    }
  }
  if (startled >= CONCERT_CROWD && steered(state, char)) {
    unlock(state, "grantelConcert");
  }
  shakeMachine(state, char);
}

/** A riff right next to the toy machine shakes it to pieces. */
function shakeMachine(state: GameState, char: Character): void {
  const corner = machineCorner(areaMap(state, char));
  if (
    char.area === "workshop" &&
    corner !== null &&
    Math.hypot(
      char.x - corner.x - MACHINE_MIDDLE.x,
      char.y - corner.y - MACHINE_MIDDLE.y,
    ) < MACHINE_SHAKE
  ) {
    breakMachine(state, char);
  }
}

/** Notes keep flying out of the guitar. */
function moreNotes(state: GameState, char: Character): void {
  const show = char.show;
  if (show !== null && show.tickIn <= 0) {
    show.tickIn = NOTE_EVERY;
    const side = char.dir === "left" ? -1 : 1;
    spawn(
      state,
      "note",
      char.area,
      char.x + side * randomIn(state, 0, MAGIC_SPREAD),
      char.y - GUITAR_HEIGHT,
      randomIn(state, -NOTE_SPREAD, NOTE_SPREAD),
      -NOTE_RISE * randomIn(state, 1, 2),
      Math.floor(nextRandom(state) * NOTE_KINDS),
    );
  }
}

/** Gugor raises his telescope; the view goes looking for Santa. */
function startTelescope(state: GameState, char: Character): void {
  startSpy(state, state.chars.indexOf(char));
  heard(state, char, "spyglass");
}

/** Gugor lowers the telescope and has something to say about it. */
function endTelescope(state: GameState, char: Character): void {
  say(char, spyRemark(state));
}

/** Gilfi: nearby loose things and a few conjured toys rise into the air. */
function startLevitate(state: GameState, char: Character): void {
  say(char, pick(state, BUBBLE_TEXTS.levitateStart));
  heard(state, char, "magic");
  const life = SHOWS.levitate.seconds - FLOAT_SETTLE;
  const lifted = liftable(state, char).slice(0, MAX_LIFTED);
  if (
    char.area === "outdoors" &&
    steered(state, char) &&
    lifted.some((spot) => snowmanStands(state, spot.cell))
  ) {
    unlock(state, "levitateSnowman");
  }
  const places = toyPlaces(state, char);
  const conjured = Math.max(MIN_CONJURED, MAX_FLOATERS - lifted.length);
  const floaters: Floater[] = lifted.map((spot) => ({
    area: char.area,
    x: spot.x,
    y: spot.y,
    cell: spot.cell,
    toy: null,
    phase: randomIn(state, 0, Math.PI * 2),
    age: 0,
    life,
  }));
  for (let k = 0; k < conjured; k += 1) {
    const at =
      places.length > 0
        ? places[k % places.length]
        : { ...nearby(state, char.x, char.y), w: MAGIC_SPREAD };
    floaters.push({
      area: char.area,
      x: at.x + randomIn(state, -at.w, at.w),
      y: at.y,
      cell: -1,
      toy: pick(state, TOY_KINDS),
      phase: randomIn(state, 0, Math.PI * 2),
      age: 0,
      life,
    });
  }
  floaters.forEach((floater, index) => {
    floater.age = -index * FLOAT_STAGGER;
    state.floats.push(floater);
  });
}

/** Sparkles round whatever floats, and at Gilfi's hands. */
function magicDust(state: GameState, char: Character): void {
  const show = char.show;
  const mine = state.floats.filter(
    (floater) => floater.area === char.area && floater.age > 0,
  );
  if (show !== null && show.tickIn <= 0) {
    show.tickIn = MAGIC_EVERY;
    const floater = mine.length > 0 ? pick(state, mine) : null;
    const x = floater === null ? char.x : floater.x;
    const y =
      floater === null
        ? char.y - CAST[char.id].walk.height
        : floater.y - floatLift(floater);
    spawn(
      state,
      "sparkle",
      char.area,
      x + randomIn(state, -MAGIC_SPREAD, MAGIC_SPREAD),
      y - randomIn(state, 0, MAGIC_SPREAD),
      0,
      0,
      Math.floor(nextRandom(state) * SPARKLE_TINTS),
    );
  }
}

/** Lazy Gilfi is worn out. */
function endLevitate(state: GameState, char: Character): void {
  say(char, pick(state, BUBBLE_TEXTS.levitateEnd));
}

/** Balbo trips: a lurch forward, longer on ice. */
function startFall(state: GameState, char: Character): void {
  const map = areaMap(state, char);
  const ice = terrainUnder(map, char.x, char.y - 1) === "ice";
  const push = ice ? TRIP_PUSH_ICE : TRIP_PUSH;
  if (steered(state, char)) {
    addCount(state, "falls", "balboTen");
    if (ice) {
      unlock(state, "balboIce");
    }
  }
  const [ax, ay] = AHEAD[char.dir];
  char.vx = ax * push;
  char.vy = ay * push;
  if (char.show !== null) {
    char.show.tickIn = FALL_IMPACT;
  }
}

/** The moment Balbo hits the ground: snow flies, a thud, "Uff!". */
function hitGround(state: GameState, char: Character): void {
  const show = char.show;
  if (show !== null && show.tickIn <= 0) {
    show.tickIn = Infinity;
    snowPuff(state, char.area, char.x, char.y);
    snowPuff(
      state,
      char.area,
      char.x + (char.dir === "left" ? -HEAD_AHEAD : HEAD_AHEAD),
      char.y,
    );
    say(char, pick(state, BUBBLE_TEXTS.fallOuch));
    heard(state, char, "thud");
    fallOnSnowman(state, char);
  }
}

/** Balbo falling head first into a snowman knocks it over. */
function fallOnSnowman(state: GameState, char: Character): void {
  const map = areaMap(state, char);
  const [ax, ay] = AHEAD[char.dir];
  const tx = Math.floor((char.x + ax * SNOWMAN_HIT) / TILE);
  const ty = Math.floor((char.y - 1 + ay * SNOWMAN_HIT) / TILE);
  const inside = tx >= 0 && ty >= 0 && tx < map.cols && ty < map.rows;
  if (
    inside &&
    char.area === "outdoors" &&
    knockSnowman(state, ty * map.cols + tx) &&
    steered(state, char)
  ) {
    say(char, BUBBLE_TEXTS.fallSnowman);
    unlock(state, "balboSnowman");
  }
}

/** Back on his paws. */
function getUp(state: GameState, char: Character): void {
  char.vx = 0;
  char.vy = 0;
  say(char, pick(state, BUBBLE_TEXTS.fallUp));
}

/** The small objects near somebody light enough to float, nearest first. */
function liftable(
  state: GameState,
  char: Character,
): { x: number; y: number; cell: number }[] {
  const map = areaMap(state, char);
  const found: { x: number; y: number; cell: number; d: number }[] = [];
  const reach = Math.ceil(FLOAT_REACH / TILE);
  const cx = Math.floor(char.x / TILE);
  const cy = Math.floor((char.y - 1) / TILE);
  for (let ty = cy - reach; ty <= cy + reach; ty += 1) {
    for (let tx = cx - reach; tx <= cx + reach; tx += 1) {
      const inside = tx >= 0 && ty >= 0 && tx < map.cols && ty < map.rows;
      const cell = ty * map.cols + tx;
      const small = inside ? map.small[cell] : null;
      if (small !== null && FLOATABLE.has(small)) {
        const x = (tx + 1 / 2) * TILE;
        const y = (ty + 1) * TILE;
        const d = Math.hypot(x - char.x, y - char.y);
        if (d < FLOAT_REACH) {
          found.push({ x, y, cell, d });
        }
      }
    }
  }
  return found.sort((a, b) => a.d - b.d);
}

/**
 * Where toys can rise from: the workshop furniture near somebody - the middle
 * of its front edge and half its width.
 */
function toyPlaces(
  state: GameState,
  char: Character,
): { x: number; y: number; w: number }[] {
  const places: { x: number; y: number; w: number }[] = [];
  for (const object of areaMap(state, char).objects) {
    if (TOY_PLACES.has(object.kind)) {
      const size = footprint(object.kind);
      const x = (object.tx + size.cols / 2) * TILE;
      const y = (object.ty + size.rows) * TILE;
      if (Math.hypot(x - char.x, y - char.y) < FLOAT_REACH * 2) {
        places.push({ x, y, w: (size.cols * TILE) / 2 - MAGIC_SPREAD });
      }
    }
  }
  return places;
}

/** A random point round somebody, for a conjured toy. */
function nearby(
  state: GameState,
  x: number,
  y: number,
): { x: number; y: number } {
  const angle = randomIn(state, 0, Math.PI * 2);
  const distance = randomIn(state, CONJURE_NEAR, CONJURE_FAR);
  return {
    x: x + Math.cos(angle) * distance,
    // Flat: the ground is seen from above at a slant.
    y: y + (Math.sin(angle) * distance) / 2,
  };
}
