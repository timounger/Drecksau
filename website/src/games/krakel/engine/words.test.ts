/**
 * Tests for dealing and shuffling the round's words.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { KRAKEL_WORDS, pickWords, shuffleWords } from "./words";
import { createRandom } from "./random";
import { DECOY_COUNT, MAX_PLAYERS, TOTAL_ROUNDS } from "./types";

/** Adds a word to the set, reporting whether it was new. */
function addNew(seen: Set<string>, word: string): boolean {
  const fresh = !seen.has(word);
  seen.add(word);
  return fresh;
}

describe("KRAKEL_WORDS", () => {
  it("lists no word twice", () => {
    // A duplicate would let one draw deal the same word to two players, or make
    // a decoy somebody's real term - which breaks the round rather than the list.
    const seen = new Set<string>();
    const duplicates = KRAKEL_WORDS.filter((word) => !addNew(seen, word));
    expect(duplicates).toEqual([]);
  });

  it("holds enough words for the longest game", () => {
    // Six players, three rounds, each round dealing a term per player plus the
    // decoys - all of them distinct across the whole game.
    expect(KRAKEL_WORDS.length).toBeGreaterThanOrEqual(
      TOTAL_ROUNDS * (MAX_PLAYERS + DECOY_COUNT),
    );
  });

  it("has no word with stray whitespace", () => {
    for (const word of KRAKEL_WORDS) {
      expect(word).toBe(word.trim());
      expect(word.length).toBeGreaterThan(0);
    }
  });
});

describe("pickWords", () => {
  it("deals the asked-for number of distinct words", () => {
    const words = pickWords(createRandom(7), 10, []);
    expect(words).toHaveLength(10);
    expect(new Set(words).size).toBe(words.length);
    for (const word of words) {
      expect(KRAKEL_WORDS).toContain(word);
    }
  });

  it("avoids the already used words", () => {
    const used = KRAKEL_WORDS.slice(0, 20);
    const words = pickWords(createRandom(7), 10, used);
    for (const word of words) {
      expect(used).not.toContain(word);
    }
  });

  it("still deals in full once the fresh words run out", () => {
    const used = KRAKEL_WORDS.slice(0, KRAKEL_WORDS.length - 2);
    const words = pickWords(createRandom(7), 5, used);
    expect(words).toHaveLength(5);
    expect(new Set(words).size).toBe(words.length);
  });

  it("deals the same words for the same seed", () => {
    expect(pickWords(createRandom(99), 6, [])).toEqual(
      pickWords(createRandom(99), 6, []),
    );
  });
});

describe("shuffleWords", () => {
  it("keeps every word and only reorders them", () => {
    const input = KRAKEL_WORDS.slice(0, 8);
    const shuffled = shuffleWords(createRandom(3), input);
    expect([...shuffled].sort()).toEqual([...input].sort());
  });

  it("shuffles the same way for the same seed", () => {
    const input = KRAKEL_WORDS.slice(0, 8);
    expect(shuffleWords(createRandom(3), input)).toEqual(
      shuffleWords(createRandom(3), input),
    );
  });

  it("leaves the caller's list untouched", () => {
    const input = KRAKEL_WORDS.slice(0, 8);
    const copy = [...input];
    shuffleWords(createRandom(3), input);
    expect(input).toEqual(copy);
  });
});
