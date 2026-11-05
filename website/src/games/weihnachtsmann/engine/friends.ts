/**
 * Friendships: the character steered chats with somebody standing right in
 * front (the talk key with nothing to use) and they grow fonder of each
 * other - five steps of hearts, each with new things to say, up to best
 * friends.
 *
 * @module
 * @remarks
 * Points are kept per pair of characters in `GameState.keep.friends` and
 * saved. A pair can chat for a point only every few seconds, so holding the
 * key does not rush it.
 */
import {
  CHARACTER_TEXTS,
  FRIEND_TEXTS,
} from "@/games/weihnachtsmann/i18n/texts";
import { unlock } from "./achievements";
import { noteTask } from "./daily";
import { say, spawn } from "./effects";
import { pick } from "./random";
import { isRiding } from "./sleigh";
import type { Character, CharacterId, GameState } from "./types";

/** Points it takes for each step of friendship, from the first heart up. */
// eslint-disable-next-line @typescript-eslint/no-magic-numbers -- chats per step, picked by feel
export const FRIEND_STEPS: readonly number[] = [2, 5, 9, 14];

/** The highest step: best friends. */
export const BEST_FRIENDS = FRIEND_STEPS.length;

/** How near the other one has to stand, map px, sideways and in depth. */
const NEAR_X = 26;
const NEAR_Y = 14;

/** Seconds before the same two can chat for a point again. */
const CHAT_PAUSE = 3;

/** How far above the feet the hearts rise from, map px. */
const HEART_LIFT = 26;

/** How fast hearts rise, map px per second. */
const HEART_RISE = -14;

/** How far apart the hearts of one chat rise, map px. */
const HEART_GAP = 4;

/**
 * The name of a pair of characters, the same both ways round.
 *
 * @param a - one
 * @param b - the other
 * @returns "a+b" in alphabetical order
 */
export function pairKey(a: CharacterId, b: CharacterId): string {
  return a < b ? `${a}+${b}` : `${b}+${a}`;
}

/**
 * The step of friendship for some points.
 *
 * @param points - the points of a pair
 * @returns 0 (strangers) to {@link BEST_FRIENDS}
 */
export function friendLevel(points: number): number {
  return FRIEND_STEPS.filter((need) => points >= need).length;
}

/**
 * The best friendship anybody has reached.
 *
 * @param state - the game
 * @returns the highest step of any pair
 */
export function bestLevel(state: GameState): number {
  let best = 0;
  for (const points of state.keep.friends.values()) {
    best = Math.max(best, friendLevel(points));
  }
  return best;
}

/**
 * The talk key with nothing to use: if somebody stands right in front, the
 * two chat and grow fonder of each other.
 *
 * @param state - the game
 * @returns true when there was somebody to chat with
 */
export function befriend(state: GameState): boolean {
  const char = state.chars[state.active];
  const other = partner(state, char);
  if (other !== null) {
    const key = pairKey(char.id, other.id);
    const chats = state.world.extras.chats;
    const level = friendLevel(state.keep.friends.get(key) ?? 0);
    if (!chats.has(key)) {
      chats.set(key, CHAT_PAUSE);
      const points = (state.keep.friends.get(key) ?? 0) + 1;
      state.keep.friends.set(key, points);
      const now = friendLevel(points);
      noteTask(state, char, "chat");
      hearts(state, char, other, now);
      if (now > level) {
        state.sounds.push("wish");
      }
      if (now >= BEST_FRIENDS) {
        unlock(state, "bestFriends");
      }
      say(char, greeting(state, char, other, now));
      say(other, pick(state, FRIEND_TEXTS.replies[other.id][now]));
    } else {
      say(char, greeting(state, char, other, level));
    }
    other.dir = char.x < other.x ? "left" : "right";
  }
  return other !== null;
}

/**
 * Counts the pauses between chats down.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updateChats(state: GameState, dt: number): void {
  const chats = state.world.extras.chats;
  for (const [key, left] of chats) {
    if (left - dt <= 0) {
      chats.delete(key);
    } else {
      chats.set(key, left - dt);
    }
  }
}

/** Somebody standing right in front of the character, on the ground. */
function partner(state: GameState, char: Character): Character | null {
  const ahead = char.dir === "left" ? -1 : char.dir === "right" ? 1 : 0;
  let found: Character | null = null;
  let best = Infinity;
  for (const other of state.chars) {
    const dx = other.x - char.x;
    const dy = other.y - char.y;
    const inFront = ahead === 0 || Math.sign(dx) === ahead || dx === 0;
    const distance = Math.hypot(dx, dy * 2);
    if (
      other !== char &&
      other.area === char.area &&
      other.altitude < 1 &&
      char.altitude < 1 &&
      !isRiding(state, other) &&
      Math.abs(dx) < NEAR_X &&
      Math.abs(dy) < NEAR_Y &&
      inFront &&
      distance < best
    ) {
      found = other;
      best = distance;
    }
  }
  return found;
}

/** What the character steered says to the other one. */
function greeting(
  state: GameState,
  char: Character,
  other: Character,
  level: number,
): string {
  return pick(state, FRIEND_TEXTS.greetings[level]).replace(
    "{name}",
    CHARACTER_TEXTS[other.id].name,
  );
}

/** Hearts rising over the two, one more for each step. */
function hearts(
  state: GameState,
  a: Character,
  b: Character,
  level: number,
): void {
  for (const char of [a, b]) {
    for (let k = 0; k <= level; k += 1) {
      spawn(
        state,
        "heart",
        char.area,
        char.x + (k - level / 2) * HEART_GAP,
        char.y - HEART_LIFT,
        0,
        HEART_RISE,
      );
    }
  }
}
