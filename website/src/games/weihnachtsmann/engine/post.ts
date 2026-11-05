/**
 * The post office: wish letters from the heap, sorted into the compartment of
 * their continent; the heap grows again by itself. The Weihnachtsmann reads
 * every letter he picks up - a thought bubble shows the wish.
 *
 * @module
 * @remarks
 * Each letter comes from one of the five continents, shown by its colour,
 * which matches one compartment of the sorting shelf. Sorted letters count
 * towards "letters10" (saved); the heap and the letters in hand are not.
 */
import { TOWN_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { addCount, steered, unlock } from "./achievements";
import { noteTask } from "./daily";
import { SORT_ROW, SORT_SLOTS } from "./building-data";
import { carries, pickUp } from "./carry";
import { say, spawn, SPARKLE_TINTS } from "./effects";
import { TILE } from "./map";
import { pick, randomIn } from "./random";
import type { Character, GameState, PostState, Spot } from "./types";

/** Most letters on the heap. */
export const PILE_MAX = 12;

/** Seconds between two letters landing on the heap again. */
const PILE_GROW = 6;

/** How long the Weihnachtsmann reads a letter, seconds. */
export const READ_SECONDS = 4;

/** Sparkles when a letter goes into its compartment, and their speed. */
const SORT_SPARKLES = 6;
const SORT_SPRAY = 14;

/**
 * The post office as it is on a new game: a full heap.
 *
 * @returns the post office
 */
export function createPost(): PostState {
  return { pile: PILE_MAX, growIn: PILE_GROW, reading: null };
}

/**
 * The heap grows back letter by letter, and the Weihnachtsmann reads on.
 *
 * @param state - the game
 * @param dt - seconds
 */
export function updatePost(state: GameState, dt: number): void {
  const post = state.world.post;
  if (post.pile < PILE_MAX) {
    post.growIn -= dt;
    if (post.growIn <= 0) {
      post.growIn = PILE_GROW;
      post.pile += 1;
    }
  }
  const reading = post.reading;
  if (reading !== null) {
    reading.left -= dt;
    const santa = state.chars.find((char) => char.id === "santa");
    if (reading.left <= 0 || santa?.area !== "postOffice") {
      post.reading = null;
      if (santa !== undefined && santa.area === "postOffice") {
        say(santa, pick(state, TOWN_TEXTS.letterRead));
      }
    }
  }
}

/**
 * The talk key at the heap: a letter into the hands. The Weihnachtsmann reads
 * it at once.
 *
 * @param state - the game
 * @param char - who takes it
 */
export function takeLetter(state: GameState, char: Character): void {
  const post = state.world.post;
  if (post.pile <= 0) {
    say(char, TOWN_TEXTS.pileEmpty);
  } else if (
    pickUp(char, "letter", Math.floor(randomIn(state, 0, SORT_SLOTS.length)))
  ) {
    post.pile -= 1;
    state.sounds.push("paper");
    const tint = char.carry?.tint ?? 0;
    if (char.id === "santa") {
      post.reading = {
        left: READ_SECONDS,
        wish: Math.floor(randomIn(state, 0, TOWN_TEXTS.letterWishes.length)),
        from: Math.floor(randomIn(state, 0, TOWN_TEXTS.letterSenders.length)),
      };
      // No bubble: the thought cloud over him shows the wish.
      state.sounds.push("wish");
      if (steered(state, char)) {
        unlock(state, "santaLetter");
      }
    } else {
      say(char, `${TOWN_TEXTS.letterFrom} ${TOWN_TEXTS.continents[tint]}!`);
    }
  }
}

/**
 * The talk key at a compartment of the sorting shelf: the letter in hand goes
 * in, if it is the right continent.
 *
 * @param state - the game
 * @param char - who sorts
 * @param spot - the compartment
 */
export function sortLetter(
  state: GameState,
  char: Character,
  spot: Spot,
): void {
  const slot = Math.max(0, SORT_SLOTS.indexOf(spot.tx));
  const letter = char.carry;
  if (letter === null || !carries(char, "letter")) {
    say(char, TOWN_TEXTS.letterNone);
  } else if (letter.tint !== slot) {
    say(
      char,
      `${TOWN_TEXTS.letterWrong} ${TOWN_TEXTS.continents[letter.tint]}!`,
    );
  } else {
    char.carry = null;
    say(char, pick(state, TOWN_TEXTS.letterRight));
    state.sounds.push("collect");
    for (let k = 0; k < SORT_SPARKLES; k += 1) {
      spawn(
        state,
        "sparkle",
        char.area,
        (spot.tx + spot.w / 2) * TILE,
        SORT_ROW * TILE,
        randomIn(state, -SORT_SPRAY, SORT_SPRAY),
        randomIn(state, -SORT_SPRAY, 0),
        k % SPARKLE_TINTS,
      );
    }
    noteTask(state, char, "letter");
    if (steered(state, char)) {
      addCount(state, "letters", "letters10");
    }
  }
}
