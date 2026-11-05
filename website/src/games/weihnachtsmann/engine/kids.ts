/**
 * Visiting children: now and then a child turns up by the main road with a
 * wish in a thought bubble - only a question mark until Santa reads it with
 * his ability. Bring the toy it wishes for from the workshop's machine (or
 * wrapped) and it is happy: hearts, thanks, and off it goes.
 *
 * @module
 * @remarks
 * Children are no characters: they stand where they wait and walk off a few
 * steps when they leave; nothing of them is saved but the count of happy
 * ones (`counts.kids`). None come in a snowstorm, at most two wait at once,
 * and one left alone too long goes home sadly.
 */
import { EXTRA_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { addCount, steered } from "./achievements";
import { noteTask } from "./daily";
import { poof, say, spawn } from "./effects";
import type { Kid } from "./extras-types";
import { KID_SPOTS } from "./extras-data";
import { TILE } from "./map";
import { nextRandom, randomIn } from "./random";
import { stormStrength } from "./sky";
import type { Character, GameState, Spot } from "./types";

/** The toys children wish for: teddy, train, doll, ball. */
export const KID_WISHES = 4;

/** The children's looks. */
export const KID_LOOKS = 4;

/** Children waiting at most at once. */
const MAX_KIDS = 2;

/** Seconds until the first child on a visit, and between two. */
export const KID_FIRST = 20;
const KID_GAP_MIN = 35;
const KID_GAP_MAX = 75;

/** How long a child waits before it goes home, seconds. */
const KID_WAIT = 180;

/** How long a happy child stays, and how long it walks off, seconds. */
const HAPPY_SECONDS = 2.6;
const LEAVE_SECONDS = 2.4;

/** How fast a leaving child walks, map px per second. */
const LEAVE_SPEED = 30;

/** How far round Santa reading wishes a child's wish is seen, map px. */
const READ_REACH = 140;

/** How far ahead the talk key finds a child, map px. */
const KID_REACH = 14;

/** How long a child's words stay, seconds. */
const SAY_SECONDS = 2.8;

/** Seconds between two hearts over a happy child, and how fast they rise. */
const HEART_EVERY = 0.3;
const HEART_RISE = -16;

/** How far round a happy child's head hearts start, map px. */
const HEART_SPREAD = 4;

/** How far above its feet the child's head is, map px. */
export const KID_HEAD = 22;

/**
 * Runs the children on: new ones come, Santa reads their wishes, happy
 * ones leave, long-waiting ones go home.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updateKids(state: GameState, dt: number): void {
  const extras = state.world.extras;
  extras.kidIn -= dt;
  if (
    extras.kidIn <= 0 &&
    extras.kids.length < MAX_KIDS &&
    stormStrength(state) <= 0
  ) {
    extras.kidIn = randomIn(state, KID_GAP_MIN, KID_GAP_MAX);
    arrive(state);
  }
  const santa = state.chars.find((char) => char.id === "santa");
  for (const kid of extras.kids) {
    kid.time += dt;
    kid.sayLeft = Math.max(0, kid.sayLeft - dt);
    if (
      santa !== undefined &&
      santa.show?.kind === "wishes" &&
      santa.area === "outdoors" &&
      Math.hypot(santa.x - kid.x, santa.y - kid.y) < READ_REACH
    ) {
      kid.known = true;
    }
    if (kid.mode === "wait" && kid.time > KID_WAIT) {
      leave(kid, EXTRA_TEXTS.kidSad);
    } else if (kid.mode === "happy") {
      cheer(state, kid, dt);
      if (kid.time > HAPPY_SECONDS) {
        leave(kid, null);
      }
    } else if (kid.mode === "leave") {
      kid.x += (kid.dir === "left" ? -1 : 1) * LEAVE_SPEED * dt;
    }
  }
  const gone = extras.kids.filter(
    (kid) => kid.mode === "leave" && kid.time > LEAVE_SECONDS,
  );
  for (const kid of gone) {
    poof(state, "outdoors", kid.x, kid.y - KID_HEAD / 2);
  }
  const staying = extras.kids.filter((kid) => !gone.includes(kid));
  extras.kids.length = 0;
  extras.kids.push(...staying);
}

/**
 * The child in front of the character steered, as a spot to use.
 *
 * @param state - the game
 * @param char - the character
 * @param x - the point the talk key reaches, map px
 * @param y - the point the talk key reaches, map px
 * @returns the spot, or null
 */
export function kidSpot(
  state: GameState,
  char: Character,
  x: number,
  y: number,
): Spot | null {
  const kid =
    char.area === "outdoors"
      ? state.world.extras.kids.find(
          (candidate) =>
            candidate.mode === "wait" &&
            Math.hypot(candidate.x - x, candidate.y - y) < KID_REACH,
        )
      : undefined;
  return kid === undefined
    ? null
    : {
        kind: "kid",
        tx: Math.floor(kid.x / TILE),
        ty: Math.floor(kid.y / TILE),
        w: 1,
        h: 1,
      };
}

/**
 * The talk key at a child: hand over the toy carried, or hear the wish.
 *
 * @param state - the game
 * @param char - who comes
 * @param spot - the child's cell
 */
export function visitKid(state: GameState, char: Character, spot: Spot): void {
  const kid = state.world.extras.kids.find(
    (candidate) =>
      candidate.mode === "wait" &&
      Math.floor(candidate.x / TILE) === spot.tx &&
      Math.floor(candidate.y / TILE) === spot.ty,
  );
  if (kid !== undefined) {
    const carry = char.carry;
    const toy =
      carry !== null && (carry.kind === "toy" || carry.kind === "wrapped")
        ? carry.tint
        : -1;
    if (toy === kid.wish) {
      char.carry = null;
      kid.mode = "happy";
      kid.time = 0;
      kid.known = true;
      speak(kid, EXTRA_TEXTS.kidThanks);
      state.sounds.push("wish");
      say(char, EXTRA_TEXTS.kidGiven);
      noteTask(state, char, "kid");
      if (steered(state, char)) {
        addCount(state, "kids", "happyKids");
      }
    } else if (toy >= 0) {
      speak(kid, EXTRA_TEXTS.kidWrong);
    } else if (kid.known) {
      speak(
        kid,
        EXTRA_TEXTS.kidWish.replace("{toy}", EXTRA_TEXTS.toyWords[kid.wish]),
      );
    } else {
      speak(kid, EXTRA_TEXTS.kidSecret);
    }
    kid.dir = char.x < kid.x ? "left" : "right";
  }
}

/** A new child turns up at a free waiting place. */
function arrive(state: GameState): void {
  const extras = state.world.extras;
  const free = KID_SPOTS.map((_, index) => index).filter(
    (index) => !extras.kids.some((kid) => kid.spot === index),
  );
  if (free.length > 0) {
    const spot = free[Math.floor(nextRandom(state) * free.length)];
    const [tx, ty] = KID_SPOTS[spot];
    const kid: Kid = {
      look: Math.floor(nextRandom(state) * KID_LOOKS),
      spot,
      wish: Math.floor(nextRandom(state) * KID_WISHES),
      known: false,
      x: tx * TILE,
      y: ty * TILE,
      dir: "down",
      mode: "wait",
      time: 0,
      say: null,
      sayLeft: 0,
    };
    extras.kids.push(kid);
    poof(state, "outdoors", kid.x, kid.y - KID_HEAD / 2);
  }
}

/** A child sets off, perhaps with a last word. */
function leave(kid: Kid, words: string | null): void {
  kid.mode = "leave";
  kid.time = 0;
  kid.dir = kid.spot % 2 === 0 ? "left" : "right";
  if (words !== null) {
    speak(kid, words);
  }
}

/** Hearts rising over a happy child. */
function cheer(state: GameState, kid: Kid, dt: number): void {
  const before = Math.floor((kid.time - dt) / HEART_EVERY);
  if (Math.floor(kid.time / HEART_EVERY) !== before) {
    spawn(
      state,
      "heart",
      "outdoors",
      kid.x + randomIn(state, -HEART_SPREAD, HEART_SPREAD),
      kid.y - KID_HEAD,
      0,
      HEART_RISE,
    );
  }
}

/** Words over a child's head. */
function speak(kid: Kid, text: string): void {
  kid.say = text;
  kid.sayLeft = SAY_SECONDS;
}
