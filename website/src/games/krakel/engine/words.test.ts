/**
 * Tests for the word lists, and for dealing and shuffling a round's words.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import {
  EASY_WORDS,
  HARD_WORDS,
  pickWords,
  shuffleWords,
  wordsFor,
} from "./words";
import { createRandom } from "./random";
import {
  DECOY_COUNT,
  DIFFICULTIES,
  MAX_PLAYERS,
  TOTAL_ROUNDS,
  type Difficulty,
} from "./types";

/** Adds a word to the set, reporting whether it was new. */
function addNew(seen: Set<string>, word: string): boolean {
  const fresh = !seen.has(word);
  seen.add(word);
  return fresh;
}

describe("the word lists", () => {
  it("has one list per difficulty", () => {
    expect(DIFFICULTIES).toEqual(["easy", "hard"]);
    expect(wordsFor("easy")).toBe(EASY_WORDS);
    expect(wordsFor("hard")).toBe(HARD_WORDS);
  });

  for (const difficulty of ["easy", "hard"] as const) {
    describe(difficulty, () => {
      const words = wordsFor(difficulty);

      it("lists no word twice", () => {
        // A duplicate would let one draw deal the same word to two players, or
        // make a decoy somebody's real term - which breaks the round.
        const seen = new Set<string>();
        expect(words.filter((word) => !addNew(seen, word))).toEqual([]);
      });

      it("holds enough words for the longest game", () => {
        expect(words.length).toBeGreaterThanOrEqual(
          TOTAL_ROUNDS * (MAX_PLAYERS + DECOY_COUNT),
        );
      });

      it("has no word with stray whitespace", () => {
        for (const word of words) {
          expect(word).toBe(word.trim());
          expect(word.length).toBeGreaterThan(0);
        }
      });
    });
  }

  it("may share words between the lists - only one is ever in play", () => {
    // Not a rule, just a note that overlap is harmless: a game draws from one
    // list only. This asserts the lists are genuinely different, not that they
    // are disjoint.
    expect(EASY_WORDS).not.toEqual(HARD_WORDS);
  });
});

describe("pickWords", () => {
  for (const difficulty of ["easy", "hard"] as const) {
    it(`deals distinct ${difficulty} words from that list`, () => {
      const words = pickWords(createRandom(7), 10, [], difficulty);
      expect(words).toHaveLength(10);
      expect(new Set(words).size).toBe(words.length);
      for (const word of words) {
        expect(wordsFor(difficulty)).toContain(word);
      }
    });
  }

  it("never crosses from one list into the other", () => {
    const hard = pickWords(createRandom(11), 12, [], "hard");
    const easyOnly = EASY_WORDS.filter((word) => !HARD_WORDS.includes(word));
    for (const word of hard) {
      expect(easyOnly).not.toContain(word);
    }
  });

  it("avoids the already used words", () => {
    const used = EASY_WORDS.slice(0, 20);
    const words = pickWords(createRandom(7), 10, used, "easy");
    for (const word of words) {
      expect(used).not.toContain(word);
    }
  });

  it("still deals in full once the fresh words run out", () => {
    const used = EASY_WORDS.slice(0, EASY_WORDS.length - 2);
    const words = pickWords(createRandom(7), 5, used, "easy");
    expect(words).toHaveLength(5);
    expect(new Set(words).size).toBe(words.length);
  });

  it("deals the same words for the same seed", () => {
    expect(pickWords(createRandom(99), 6, [], "hard")).toEqual(
      pickWords(createRandom(99), 6, [], "hard"),
    );
  });

  it("deals different words for different difficulties", () => {
    const seed = 99;
    const easy = pickWords(createRandom(seed), 6, [], "easy");
    const hard = pickWords(createRandom(seed), 6, [], "hard");
    expect(easy).not.toEqual(hard);
  });
});

describe("shuffleWords", () => {
  it("keeps every word and only reorders them", () => {
    const input = EASY_WORDS.slice(0, 8);
    const shuffled = shuffleWords(createRandom(3), input);
    expect([...shuffled].sort()).toEqual([...input].sort());
  });

  it("shuffles the same way for the same seed", () => {
    const input = EASY_WORDS.slice(0, 8);
    expect(shuffleWords(createRandom(3), input)).toEqual(
      shuffleWords(createRandom(3), input),
    );
  });

  it("leaves the caller's list untouched", () => {
    const input = EASY_WORDS.slice(0, 8);
    const copy = [...input];
    shuffleWords(createRandom(3), input);
    expect(input).toEqual(copy);
  });
});

describe("difficulty in a dealt round", () => {
  it("covers every difficulty the game offers", () => {
    for (const difficulty of DIFFICULTIES) {
      const pool: readonly string[] = wordsFor(difficulty satisfies Difficulty);
      expect(pool.length).toBeGreaterThan(0);
    }
  });
});
