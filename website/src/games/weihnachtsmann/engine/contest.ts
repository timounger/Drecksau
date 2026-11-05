/**
 * The snowman contest in the south west: carry three snowballs from the
 * heap to the plot, then a carrot nose, a hat and a scarf from their stands
 * (two hats, two scarves - each stand hands out the other one next), and
 * the penguin jury gives up to five stars. The snowman melts after a while
 * and the plot is free again; the best score is kept.
 *
 * @module
 * @remarks
 * Parts are carried like everything else (`snowPart`, the part's number as
 * its tint: 0 ball, 1 carrot, 2 top hat, 3 bucket, 4 red scarf, 5 green
 * scarf). The best score is saved as `counts.snowmanBest`.
 */
import { EXTRA_TEXTS, PLACES_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { steered, unlock } from "./achievements";
import { pickUp } from "./carry";
import { say, snowPuff } from "./effects";
import type { ContestSnowman } from "./extras-types";
import { CONTEST_PLOT } from "./extras-data";
import { TILE } from "./map";
import { pick } from "./random";
import type { Character, GameState } from "./types";

/** The parts, as the tint of a carried `snowPart`. */
export const PART_BALL = 0;
export const PART_CARROT = 1;
export const PART_TOP_HAT = 2;
export const PART_BUCKET = 3;
export const PART_RED_SCARF = 4;
export const PART_GREEN_SCARF = 5;

/** Balls a snowman needs. */
export const SNOWMAN_BALLS = 3;

/** The most stars the jury gives. */
export const MAX_STARS = 5;

/** How long the jury holds up its card, seconds. */
const CARD_SECONDS = 4;

/** Seconds until a judged snowman melts, and one left unjudged. */
const MELT_JUDGED = 60;
const MELT_LEFT = 180;

/**
 * A fresh, empty plot.
 *
 * @returns the snowman of the contest, not yet begun
 */
export function createSnowman(): ContestSnowman {
  return {
    balls: 0,
    nose: false,
    hat: 0,
    scarf: 0,
    nextHat: PART_TOP_HAT,
    nextScarf: PART_RED_SCARF,
    stars: 0,
    card: 0,
    meltIn: 0,
  };
}

/**
 * The talk key at one of the stands: a part to carry.
 *
 * @param state - the game
 * @param char - who takes it
 * @param part - which stand, as its part
 */
export function takePart(
  state: GameState,
  char: Character,
  part: number,
): void {
  const snowman = state.world.extras.snowman;
  if (char.form !== null) {
    say(char, PLACES_TEXTS.blockAnimal);
  } else {
    let tint = part;
    if (part === PART_TOP_HAT) {
      tint = snowman.nextHat;
    } else if (part === PART_RED_SCARF) {
      tint = snowman.nextScarf;
    }
    if (pickUp(char, "snowPart", tint)) {
      if (part === PART_TOP_HAT) {
        snowman.nextHat = tint === PART_TOP_HAT ? PART_BUCKET : PART_TOP_HAT;
      } else if (part === PART_RED_SCARF) {
        snowman.nextScarf =
          tint === PART_RED_SCARF ? PART_GREEN_SCARF : PART_RED_SCARF;
      }
      state.sounds.push("paper");
      say(char, EXTRA_TEXTS.partNames[tint]);
    }
  }
}

/**
 * The talk key at the plot: the part carried goes onto the snowman.
 *
 * @param state - the game
 * @param char - who builds
 */
export function buildSnowman(state: GameState, char: Character): void {
  const snowman = state.world.extras.snowman;
  const carry = char.carry;
  const part = carry?.kind === "snowPart" ? carry.tint : -1;
  let used = false;
  if (snowman.stars > 0) {
    say(char, EXTRA_TEXTS.contestJudged);
  } else if (part === PART_BALL && snowman.balls < SNOWMAN_BALLS) {
    snowman.balls += 1;
    used = true;
  } else if (part === PART_BALL) {
    say(char, EXTRA_TEXTS.contestEnoughBalls);
  } else if (part > PART_BALL && snowman.balls < SNOWMAN_BALLS) {
    say(char, EXTRA_TEXTS.contestBallsFirst);
  } else if (part === PART_CARROT) {
    used = !snowman.nose;
    snowman.nose = true;
  } else if (part === PART_TOP_HAT || part === PART_BUCKET) {
    used = true;
    snowman.hat = part;
  } else if (part === PART_RED_SCARF || part === PART_GREEN_SCARF) {
    used = true;
    snowman.scarf = part;
  } else {
    say(
      char,
      snowman.balls < SNOWMAN_BALLS
        ? EXTRA_TEXTS.contestNeedBall
        : EXTRA_TEXTS.contestNeedParts,
    );
  }
  if (used) {
    char.carry = null;
    snowman.meltIn = MELT_LEFT;
    state.sounds.push("blockSet");
    snowPuff(state, "outdoors", plotX(), plotY());
    say(char, pick(state, EXTRA_TEXTS.contestPlaced));
  }
}

/**
 * The talk key at the jury: the snowman is judged.
 *
 * @param state - the game
 * @param char - who asks
 */
export function askJury(state: GameState, char: Character): void {
  const snowman = state.world.extras.snowman;
  if (snowman.balls < SNOWMAN_BALLS) {
    say(char, EXTRA_TEXTS.juryWaiting);
  } else if (snowman.stars > 0) {
    snowman.card = CARD_SECONDS;
  } else {
    snowman.stars =
      2 +
      (snowman.nose ? 1 : 0) +
      (snowman.hat > 0 ? 1 : 0) +
      (snowman.scarf > 0 ? 1 : 0);
    snowman.card = CARD_SECONDS;
    snowman.meltIn = MELT_JUDGED;
    state.counts.snowmanBest = Math.max(
      state.counts.snowmanBest,
      snowman.stars,
    );
    state.sounds.push(snowman.stars >= MAX_STARS ? "cheer" : "ding");
    say(char, EXTRA_TEXTS.juryVerdicts[snowman.stars]);
    if (snowman.stars >= MAX_STARS && steered(state, char)) {
      unlock(state, "snowmanJury");
    }
  }
}

/**
 * Lets the snowman melt in time and the jury lower its card.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updateContest(state: GameState, dt: number): void {
  const snowman = state.world.extras.snowman;
  snowman.card = Math.max(0, snowman.card - dt);
  if (snowman.balls > 0) {
    snowman.meltIn -= dt;
    if (snowman.meltIn <= 0) {
      Object.assign(snowman, createSnowman());
      snowPuff(state, "outdoors", plotX(), plotY());
    }
  }
}

/** The plot's middle, map px. */
function plotX(): number {
  return (CONTEST_PLOT.tx + 1 / 2) * TILE;
}

/** The plot's foot line, map px. */
function plotY(): number {
  return (CONTEST_PLOT.ty + 1) * TILE;
}
