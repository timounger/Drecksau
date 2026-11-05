/**
 * Ice hockey on the rink in the south land: a puck to push about and shoot,
 * and a match to three goals against two characters nobody steers - a
 * forward who chases the puck and a goalie in front of the right goal.
 *
 * @module
 * @remarks
 * The puck slides on the ice by itself and bounces off the boards; whoever
 * skates onto it takes it along at the stick, and the talk key shoots it the
 * way one goes (or looks). The talk key at the bench starts a match: two of
 * the others are fetched onto the ice, everybody lines up for the face-off,
 * and the match runs until one side has three goals - or ends when the
 * player switches to somebody else or leaves the ice. The two helpers are
 * moved by {@link updateHockeyHelper} instead of strolling. Nothing of it is
 * saved; only the win counts, as an achievement.
 */
import { PLACES_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { steered, unlock } from "./achievements";
import { vehicleOf } from "./aboard";
import { poof, say, snowPuff } from "./effects";
import { TILE, areaMap, inBox } from "./map";
import { moveCharacter } from "./movement";
import { HOCKEY_ICE } from "./places-data";
import { nextRandom, pick, randomIn } from "./random";
import { rest } from "./wander";
import type {
  AreaId,
  Character,
  Dir,
  GameState,
  HockeyMatch,
  HockeyState,
  Spot,
} from "./types";

/** Goals it takes to win a match. */
export const HOCKEY_GOALS_TO_WIN = 3;

/* eslint-disable @typescript-eslint/no-magic-numbers -- places on the rink, cells */
/** The middle of the ice, where the puck is put down, cells. */
const FACE_OFF = { x: 16, y: 76 } as const;

/** Where everybody lines up, cells: the player, the forward, the goalie. */
const LINE_UP = {
  player: { x: 12.5, y: 76.6 },
  forward: { x: 19.5, y: 76.6 },
  goalie: { x: 23.8, y: 76.6 },
} as const;

/** The goal mouths: top and bottom, map px, and where each goal line is. */
const MOUTH_TOP = 75 * TILE + 1;
const MOUTH_BOTTOM = 77 * TILE - 1;
const LEFT_LINE = 7 * TILE;
const RIGHT_LINE = 25 * TILE;
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** The puck's size round its middle, map px. */
const PUCK_R = 2.5;

/** How quickly the puck slows on the ice, per second. */
const PUCK_DRAG = 0.55;

/** Share of its speed the puck keeps off the boards. */
const BOARD_BOUNCE = 0.75;

/** How near a skater's stick has to come to take the puck, map px. */
const CATCH = 10;

/** How fast the puck may still be caught, map px per second. */
const CATCH_SPEED = 230;

/** Where the puck sits in front of the skater who has it, map px. */
const STICK_AHEAD = 8;
const STICK_DOWN = 1;

/** How hard a shot flies, map px per second. */
const SHOT = 240;

/**
 * How near the goal a shot's way must point to be steered into the goal's
 * corner (cosine of the angle), and how far inside the post it goes, map px.
 */
const AIM_CONE = 0.5;
const AIM_INSIDE = 8;

/** How near the puck one has to be to shoot it without having it, map px. */
const SHOT_REACH = 16;

/** Seconds before the shooter may take the puck back. */
const NO_CATCH = 0.35;

/** How hard a skater's push sends a free puck, share of the skater's speed. */
const KICK = 0.65;

/** Speed above which a puck's bounce clacks, map px per second. */
const CLACK = 90;

/** How fast the helpers skate, as a share of their walking pace. */
const FORWARD_PACE = 1.25;
const GOALIE_PACE = 0.8;

/** How far in front of the right goal line the goalie stays, map px. */
const GOALIE_OFF = 18;

/** How near the goalie must come to the puck to clear it, map px. */
const GOALIE_REACH = 8;

/** How hard the goalie clears the puck back, and how far out to the boards. */
const CLEAR = 110;
const CLEAR_WIDE = 170;

/** How near the left goal the forward shoots, map px from the goal line. */
const FORWARD_RANGE = 96;

/** How unsure the forward aims, map px either side of the goal's middle. */
const FORWARD_AIM = 30;

/** How fast the forward skates with the puck at its stick: slower than without. */
const CARRY_PACE = 0.85;

/** Chance per second that the player steals the puck off the forward at the stick. */
const TACKLE = 4;

/** Chance per second that the forward steals the puck off the player at the stick. */
const STEAL = 1.1;

/** Seconds the forward waits between two decisions. */
const THINK = 0.45;

/** Seconds the play waits after a goal and at the face-off. */
const GOAL_PAUSE = 1.8;
const FACE_OFF_PAUSE = 1.2;

/** Seconds the final whistle shows before the helpers go. */
const OVER_SECONDS = 3;

/** How far outside the ice the player may skate before the match ends, map px. */
const LEAVE_SLACK = 20;

/** Below this push a helper stands still. */
const ARRIVED = 3;

/** Which way each facing points. */
const AHEAD: Readonly<Record<Dir, readonly [number, number]>> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

/**
 * The rink on a new visit: the puck at the face-off point, no match.
 *
 * @returns its state
 */
export function createHockey(): HockeyState {
  return {
    puck: { x: FACE_OFF.x * TILE, y: FACE_OFF.y * TILE, vx: 0, vy: 0 },
    owner: -1,
    noCatch: 0,
    match: null,
  };
}

/**
 * The puck as a spot for the talk key, when the character steered stands on
 * the ice close to it.
 *
 * @param state - the game
 * @param char - who looks for it
 * @returns the spot, or null
 */
export function puckSpot(state: GameState, char: Character): Spot | null {
  const puck = state.world.places.hockey.puck;
  const near =
    char.area === "outdoors" &&
    inBox(HOCKEY_ICE, char.x, char.y) &&
    Math.hypot(puck.x - char.x, puck.y - char.y) < SHOT_REACH;
  return near
    ? {
        kind: "hockey",
        tx: Math.floor(puck.x / TILE),
        ty: Math.floor(puck.y / TILE),
        w: 1,
        h: 1,
      }
    : null;
}

/**
 * The talk key at the rink: on the ice by the puck it shoots, at the bench
 * it starts a match.
 *
 * @param state - the game
 * @param char - who stands there
 */
export function useHockey(state: GameState, char: Character): void {
  const hockey = state.world.places.hockey;
  if (puckSpot(state, char) !== null) {
    shoot(state, char);
  } else if (hockey.match !== null) {
    say(char, PLACES_TEXTS.hockeyBusy);
  } else if (char.form !== null) {
    say(char, PLACES_TEXTS.hockeyAnimal);
  } else {
    startMatch(state, char);
  }
}

/**
 * Whether the talk key or the ability key shoots right now: the player in a
 * match, or anybody steered on the ice with the puck at the stick.
 *
 * @param state - the game
 * @returns true when a shot goes off instead
 */
export function shotReady(state: GameState): boolean {
  const char = state.chars[state.active];
  const match = state.world.places.hockey.match;
  return (
    (match !== null && match.player === state.active && match.over <= 0) ||
    puckSpot(state, char) !== null
  );
}

/**
 * The player's shot: the puck flies the way the skater goes, or looks.
 *
 * @param state - the game
 * @param char - who shoots
 */
export function shoot(state: GameState, char: Character): void {
  const hockey = state.world.places.hockey;
  const puck = hockey.puck;
  const who = state.chars.indexOf(char);
  const near = Math.hypot(puck.x - char.x, puck.y - char.y) < SHOT_REACH;
  if (hockey.owner === who || near) {
    const speed = Math.hypot(char.vx, char.vy);
    const [fx, fy] = aimAt(
      state,
      puck,
      speed > 1 ? [char.vx / speed, char.vy / speed] : AHEAD[char.dir],
    );
    puck.vx = fx * SHOT;
    puck.vy = fy * SHOT;
    hockey.owner = -1;
    hockey.noCatch = NO_CATCH;
    state.sounds.push("puck");
  }
}

/**
 * Whether somebody's character is the player of the match running.
 *
 * @param state - the game
 * @returns the match, or null when none is played
 */
export function hockeyMatch(state: GameState): HockeyMatch | null {
  return state.world.places.hockey.match;
}

/**
 * Runs the rink on: the match's rules, the helpers' minds, and the puck.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updateHockey(state: GameState, dt: number): void {
  const hockey = state.world.places.hockey;
  const match = hockey.match;
  hockey.noCatch = Math.max(0, hockey.noCatch - dt);
  if (match !== null) {
    runMatch(state, match, dt);
  }
  if (match === null || match.pause <= 0) {
    movePuck(state, dt);
  }
}

/**
 * One step for a helper in the match: the forward chases the puck and
 * carries it to the left goal, the goalie keeps in front of the right one.
 *
 * @param state - the game
 * @param char - the forward or the goalie
 * @param dt - seconds
 */
export function updateHockeyHelper(
  state: GameState,
  char: Character,
  dt: number,
): void {
  const hockey = state.world.places.hockey;
  const match = hockey.match;
  const who = state.chars.indexOf(char);
  let goal = { x: char.x, y: char.y };
  let pace = FORWARD_PACE;
  if (match !== null && match.pause <= 0 && match.over <= 0) {
    if (who === match.goalie) {
      goal = {
        x: RIGHT_LINE - GOALIE_OFF,
        y: Math.max(MOUTH_TOP, Math.min(MOUTH_BOTTOM, hockey.puck.y)),
      };
      pace = GOALIE_PACE;
    } else {
      goal = forwardGoal(state, match, char, dt);
      pace = hockey.owner === who ? CARRY_PACE : FORWARD_PACE;
    }
  }
  const dx = goal.x - char.x;
  const dy = goal.y - char.y;
  const distance = Math.hypot(dx, dy);
  const push = distance > ARRIVED ? 1 : 0;
  moveCharacter(
    areaMap(state, char),
    char,
    push * (dx / Math.max(distance, 1)),
    push * (dy / Math.max(distance, 1)),
    dt,
    pace,
  );
  if (match !== null && who === match.goalie) {
    // The goalie looks at the play, not at the way it skates.
    char.dir = "left";
  }
}

/**
 * Where a shot goes: the way the skater moves - unless that points roughly
 * at the right goal, then into its corner farther from the goalie.
 */
function aimAt(
  state: GameState,
  puck: { x: number; y: number },
  way: readonly [number, number],
): readonly [number, number] {
  const match = state.world.places.hockey.match;
  const goalie = match === null ? undefined : state.chars[match.goalie];
  const middle = (MOUTH_TOP + MOUTH_BOTTOM) / 2;
  const corner =
    goalie === undefined || goalie.y > middle
      ? MOUTH_TOP + AIM_INSIDE
      : MOUTH_BOTTOM - AIM_INSIDE;
  const dx = RIGHT_LINE + TILE / 2 - puck.x;
  const dy = corner - puck.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const toGoal: readonly [number, number] = [dx / length, dy / length];
  const cos = way[0] * toGoal[0] + way[1] * toGoal[1];
  return cos > AIM_CONE ? toGoal : way;
}

/** Fetches two of the others onto the ice and lines everybody up. */
function startMatch(state: GameState, char: Character): void {
  const player = state.chars.indexOf(char);
  const helpers = state.chars
    .map((other, index) => ({ other, index }))
    .filter(
      ({ other, index }) =>
        index !== player &&
        other.form === null &&
        other.show === null &&
        vehicleOf(state, other) === null,
    )
    .sort(
      (a, b) =>
        awayFromRink(state, a.other.area, a.other.x, a.other.y) -
        awayFromRink(state, b.other.area, b.other.x, b.other.y),
    );
  const forward = helpers.at(0);
  const goalie = helpers.at(1);
  if (forward === undefined || goalie === undefined) {
    say(char, PLACES_TEXTS.hockeyNobody);
  } else {
    const match: HockeyMatch = {
      player,
      forward: forward.index,
      goalie: goalie.index,
      score: [0, 0],
      pause: FACE_OFF_PAUSE,
      thinkIn: THINK,
      over: 0,
    };
    state.world.places.hockey.match = match;
    lineUp(state, match, true);
    say(char, pick(state, PLACES_TEXTS.hockeyStart));
    say(goalie.other, pick(state, PLACES_TEXTS.hockeyGoalie));
    state.sounds.push("whistle");
  }
}

/** How far somebody is from the rink, for picking the helpers; inside counts far. */
function awayFromRink(
  state: GameState,
  area: AreaId,
  x: number,
  y: number,
): number {
  const far = state.maps.outdoors.cols * TILE;
  return area === "outdoors"
    ? Math.hypot(x - FACE_OFF.x * TILE, y - FACE_OFF.y * TILE)
    : far * 2;
}

/** Everybody to their place for the face-off, the puck in the middle. */
function lineUp(state: GameState, match: HockeyMatch, fetch: boolean): void {
  const places: readonly (readonly [number, { x: number; y: number }])[] = [
    [match.player, LINE_UP.player],
    [match.forward, LINE_UP.forward],
    [match.goalie, LINE_UP.goalie],
  ];
  for (const [index, place] of places) {
    const char = state.chars[index];
    if (fetch && char.area === "outdoors") {
      poof(state, "outdoors", char.x, char.y - TILE / 2);
    }
    char.area = "outdoors";
    char.x = place.x * TILE;
    char.y = place.y * TILE;
    char.vx = 0;
    char.vy = 0;
    char.flying = false;
    char.altitude = 0;
    char.dir = index === match.player ? "right" : "left";
    if (fetch) {
      poof(state, "outdoors", char.x, char.y - TILE / 2);
    }
  }
  const hockey = state.world.places.hockey;
  hockey.puck.x = FACE_OFF.x * TILE;
  hockey.puck.y = FACE_OFF.y * TILE;
  hockey.puck.vx = 0;
  hockey.puck.vy = 0;
  hockey.owner = -1;
}

/** The match's clock and rules: pauses, the end, and when it is called off. */
function runMatch(state: GameState, match: HockeyMatch, dt: number): void {
  const player = state.chars[match.player];
  match.pause = Math.max(0, match.pause - dt);
  if (match.over > 0) {
    match.over -= dt;
    if (match.over <= 0) {
      endMatch(state);
    }
  } else if (
    state.active !== match.player ||
    player.area !== "outdoors" ||
    !inBox(HOCKEY_ICE, player.x, player.y, LEAVE_SLACK) ||
    vehicleOf(state, player) !== null
  ) {
    say(player, PLACES_TEXTS.hockeyOff);
    state.sounds.push("whistle");
    endMatch(state);
  }
}

/** The helpers go back to strolling; the puck stays where it lies. */
function endMatch(state: GameState): void {
  const hockey = state.world.places.hockey;
  const match = hockey.match;
  if (match !== null) {
    rest(state.chars[match.forward], randomIn(state, 1, 2));
    rest(state.chars[match.goalie], randomIn(state, 1, 2));
  }
  hockey.match = null;
  hockey.owner = -1;
}

/** Where the forward wants to go, and its shot when it is near the goal. */
function forwardGoal(
  state: GameState,
  match: HockeyMatch,
  char: Character,
  dt: number,
): { x: number; y: number } {
  const hockey = state.world.places.hockey;
  const puck = hockey.puck;
  const who = state.chars.indexOf(char);
  const mouth = (MOUTH_TOP + MOUTH_BOTTOM) / 2;
  let goal = { x: puck.x + puck.vx * THINK, y: puck.y + puck.vy * THINK };
  match.thinkIn -= dt;
  if (hockey.owner === who) {
    goal = { x: LEFT_LINE, y: mouth };
    if (char.x - LEFT_LINE < FORWARD_RANGE && match.thinkIn <= 0) {
      const aimY = mouth + randomIn(state, -FORWARD_AIM, FORWARD_AIM);
      const dx = LEFT_LINE - puck.x;
      const dy = aimY - puck.y;
      const length = Math.max(1, Math.hypot(dx, dy));
      puck.vx = (dx / length) * SHOT;
      puck.vy = (dy / length) * SHOT;
      hockey.owner = -1;
      hockey.noCatch = NO_CATCH;
      state.sounds.push("puck");
    }
  } else if (
    hockey.owner === match.player &&
    Math.hypot(puck.x - char.x, puck.y - char.y) < CATCH &&
    nextRandom(state) < STEAL * dt
  ) {
    hockey.owner = who;
  }
  const player = state.chars[match.player];
  if (
    hockey.owner === who &&
    Math.hypot(puck.x - player.x, puck.y - player.y) < CATCH &&
    nextRandom(state) < TACKLE * dt
  ) {
    // The player skates in and takes it off the forward's stick.
    hockey.owner = match.player;
    hockey.noCatch = 0;
  }
  if (match.thinkIn <= 0) {
    match.thinkIn = THINK;
  }
  return goal;
}

/**
 * The puck: at the stick of whoever has it, or sliding, bouncing off the
 * boards, cleared by the goalie, caught by a skater - or in a goal.
 */
function movePuck(state: GameState, dt: number): void {
  const hockey = state.world.places.hockey;
  const puck = hockey.puck;
  const owner = hockey.owner >= 0 ? state.chars[hockey.owner] : undefined;
  if (owner !== undefined) {
    const [fx, fy] = AHEAD[owner.dir];
    puck.x = owner.x + fx * STICK_AHEAD;
    puck.y = owner.y + STICK_DOWN + fy * STICK_AHEAD;
    puck.vx = owner.vx;
    puck.vy = owner.vy;
  } else {
    const keep = Math.exp(-PUCK_DRAG * dt);
    puck.vx *= keep;
    puck.vy *= keep;
    puck.x += puck.vx * dt;
    puck.y += puck.vy * dt;
  }
  bounce(state);
  scoreGoal(state);
  guard(state);
  catchPuck(state);
}

/** Off the boards and the goal frames; a hard bounce clacks. */
function bounce(state: GameState): void {
  const puck = state.world.places.hockey.puck;
  const left = HOCKEY_ICE.tx * TILE + PUCK_R;
  const right = (HOCKEY_ICE.tx + HOCKEY_ICE.w) * TILE - PUCK_R;
  const top = HOCKEY_ICE.ty * TILE + PUCK_R;
  const bottom = (HOCKEY_ICE.ty + HOCKEY_ICE.h) * TILE - PUCK_R;
  const inMouth = puck.y > MOUTH_TOP && puck.y < MOUTH_BOTTOM;
  // Beside a goal its frame is as good as the boards.
  const wallLeft = inMouth ? left : LEFT_LINE + PUCK_R;
  const wallRight = inMouth ? right : RIGHT_LINE - PUCK_R;
  let hit = 0;
  if (puck.x < wallLeft || puck.x > wallRight) {
    hit = Math.abs(puck.vx);
    puck.x = Math.max(wallLeft, Math.min(wallRight, puck.x));
    puck.vx = -puck.vx * BOARD_BOUNCE;
  }
  if (puck.y < top || puck.y > bottom) {
    hit = Math.max(hit, Math.abs(puck.vy));
    puck.y = Math.max(top, Math.min(bottom, puck.y));
    puck.vy = -puck.vy * BOARD_BOUNCE;
  }
  if (hit > CLACK) {
    state.sounds.push("puck");
  }
}

/** A puck over a goal line in the mouth: a goal, or just a puck in the net. */
function scoreGoal(state: GameState): void {
  const hockey = state.world.places.hockey;
  const puck = hockey.puck;
  const match = hockey.match;
  const inMouth = puck.y > MOUTH_TOP && puck.y < MOUTH_BOTTOM;
  // The player shoots at the right goal, the other side at the left one.
  const forPlayer = puck.x > RIGHT_LINE;
  if (inMouth && (forPlayer || puck.x < LEFT_LINE)) {
    snowPuff(state, "outdoors", puck.x, puck.y);
    state.sounds.push("goalHorn");
    if (match !== null && match.over <= 0) {
      if (forPlayer) {
        match.score[0] += 1;
      } else {
        match.score[1] += 1;
      }
      const scorer = state.chars[forPlayer ? match.player : match.forward];
      say(scorer, pick(state, PLACES_TEXTS.hockeyGoal));
      finishOrFaceOff(state, match);
    } else {
      puck.x = FACE_OFF.x * TILE;
      puck.y = FACE_OFF.y * TILE;
      puck.vx = 0;
      puck.vy = 0;
      hockey.owner = -1;
    }
  }
}

/** After a goal: three wins the match, else everybody lines up again. */
function finishOrFaceOff(state: GameState, match: HockeyMatch): void {
  const player = state.chars[match.player];
  if (match.score[0] >= HOCKEY_GOALS_TO_WIN) {
    match.over = OVER_SECONDS;
    say(player, PLACES_TEXTS.hockeyWon);
    if (steered(state, player)) {
      unlock(state, "hockeyWin");
    }
  } else if (match.score[1] >= HOCKEY_GOALS_TO_WIN) {
    match.over = OVER_SECONDS;
    say(player, PLACES_TEXTS.hockeyLost);
  }
  match.pause = GOAL_PAUSE;
  lineUp(state, match, false);
}

/** The goalie clears a puck that comes too near. */
function guard(state: GameState): void {
  const hockey = state.world.places.hockey;
  const match = hockey.match;
  const puck = hockey.puck;
  const goalie = match === null ? undefined : state.chars[match.goalie];
  if (
    goalie !== undefined &&
    Math.hypot(puck.x - goalie.x, puck.y - goalie.y) < GOALIE_REACH &&
    hockey.noCatch <= 0
  ) {
    // Out towards the boards, away from the middle, not at the empty goal.
    const side = puck.y < (MOUTH_TOP + MOUTH_BOTTOM) / 2 ? -1 : 1;
    puck.vx = -CLEAR;
    puck.vy = side * randomIn(state, CLEAR_WIDE / 2, CLEAR_WIDE);
    hockey.owner = -1;
    hockey.noCatch = NO_CATCH;
    state.sounds.push("puck");
  }
}

/**
 * A skater on the ice takes a free puck at the stick: in a match the player
 * and the forward, otherwise anybody steered. Somebody else skating into it
 * gives it a push.
 */
function catchPuck(state: GameState): void {
  const hockey = state.world.places.hockey;
  const puck = hockey.puck;
  const match = hockey.match;
  const speed = Math.hypot(puck.vx, puck.vy);
  state.chars.forEach((char, index) => {
    const near =
      char.area === "outdoors" &&
      char.altitude < 1 &&
      Math.hypot(puck.x - char.x, puck.y - char.y) < CATCH;
    const catcher =
      match === null
        ? index === state.active
        : index === match.player || index === match.forward;
    if (
      near &&
      catcher &&
      hockey.owner < 0 &&
      hockey.noCatch <= 0 &&
      speed < CATCH_SPEED &&
      (match === null || match.pause <= 0)
    ) {
      hockey.owner = index;
    } else if (
      near &&
      !catcher &&
      match === null &&
      hockey.owner < 0 &&
      char.moving
    ) {
      puck.vx += char.vx * KICK;
      puck.vy += char.vy * KICK;
    }
  });
  const owner = hockey.owner >= 0 ? state.chars[hockey.owner] : undefined;
  if (
    owner !== undefined &&
    (owner.area !== "outdoors" || !inBox(HOCKEY_ICE, owner.x, owner.y))
  ) {
    // Off the ice: the puck stays behind.
    hockey.owner = -1;
  }
}
