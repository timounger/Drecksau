/**
 * Tests for trick play: winner, legal plays and points.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { beats, legalPlays, trickPoints, trickWinnerIndex } from "./tricks";
import { card, trickCard } from "./test-helpers";

describe("beats", () => {
  it("lets a trump beat a non-trump", () => {
    expect(beats(card("herz", "sieben"), card("eichel", "daus"), "herz")).toBe(
      true,
    );
  });

  it("compares strength within a suit - Zehn beats König", () => {
    expect(
      beats(card("eichel", "zehn"), card("eichel", "koenig"), "herz"),
    ).toBe(true);
    expect(
      beats(card("eichel", "koenig"), card("eichel", "zehn"), "herz"),
    ).toBe(false);
  });

  it("keeps the first card on a tie", () => {
    expect(
      beats(card("eichel", "daus", 1), card("eichel", "daus", 0), "herz"),
    ).toBe(false);
  });
});

describe("trickWinnerIndex", () => {
  it("gives the trick to the highest trump", () => {
    const trick = [
      trickCard(0, card("eichel", "daus")),
      trickCard(1, card("herz", "sieben")),
      trickCard(2, card("eichel", "zehn")),
    ];
    expect(trickWinnerIndex(trick, "herz")).toBe(1);
  });

  it("without a trump, the highest led card wins", () => {
    const trick = [
      trickCard(0, card("eichel", "koenig")),
      trickCard(1, card("eichel", "daus")),
      trickCard(2, card("blatt", "daus")),
    ];
    expect(trickWinnerIndex(trick, "herz")).toBe(1);
  });
});

describe("trickPoints", () => {
  it("sums the Augen", () => {
    const trick = [
      trickCard(0, card("eichel", "daus")), // 11
      trickCard(1, card("herz", "koenig")), // 4
      trickCard(2, card("blatt", "sieben")), // 0
    ];
    expect(trickPoints(trick)).toBe(15);
  });
});

describe("legalPlays", () => {
  const hand = [
    card("eichel", "unter"),
    card("eichel", "daus"),
    card("blatt", "koenig"),
    card("herz", "sieben"),
  ];

  it("allows anything when leading", () => {
    expect(legalPlays(hand, [], "herz")).toHaveLength(4);
  });

  it("must follow suit and head the trick if possible", () => {
    // Led eichel-koenig; must play a higher eichel (the Daus), not the Unter.
    const trick = [trickCard(0, card("eichel", "koenig"))];
    const legal = legalPlays(hand, trick, "herz");
    expect(legal.map((c) => c.rank)).toEqual(["daus"]);
  });

  it("must follow suit even if it cannot head the trick", () => {
    // Led eichel-daus; the Unter cannot beat it, but must still be played.
    const trick = [trickCard(0, card("eichel", "daus"))];
    const legal = legalPlays(
      [card("eichel", "unter"), card("herz", "sieben")],
      trick,
      "herz",
    );
    expect(legal.map((c) => c.suit)).toEqual(["eichel"]);
  });

  it("must trump when it cannot follow suit", () => {
    const trick = [trickCard(0, card("blatt", "daus"))];
    const legal = legalPlays(
      [card("eichel", "daus"), card("herz", "sieben")],
      trick,
      "herz",
    );
    expect(legal.map((c) => c.suit)).toEqual(["herz"]);
  });

  it("plays anything when it can neither follow nor trump", () => {
    const trick = [trickCard(0, card("blatt", "daus"))];
    const legal = legalPlays(
      [card("eichel", "daus"), card("schellen", "koenig")],
      trick,
      "herz",
    );
    expect(legal).toHaveLength(2);
  });
});
