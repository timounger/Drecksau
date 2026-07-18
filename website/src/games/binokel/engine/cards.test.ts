/**
 * Tests for the Binokel deck.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { cardValue, createDeck } from "./cards";
import { card } from "./test-helpers";

describe("createDeck", () => {
  it("has 48 cards with Sevens and 40 without", () => {
    expect(createDeck(true)).toHaveLength(48);
    expect(createDeck(false)).toHaveLength(40);
  });

  it("holds every card exactly twice", () => {
    const deck = createDeck(true);
    const ids = new Set(deck.map((c) => c.id));
    expect(ids.size).toBe(48);
    const eichelDaus = deck.filter(
      (c) => c.suit === "eichel" && c.rank === "daus",
    );
    expect(eichelDaus).toHaveLength(2);
  });

  it("leaves out the Sevens for the 40-card deck", () => {
    expect(createDeck(false).some((c) => c.rank === "sieben")).toBe(false);
  });
});

describe("cardValue", () => {
  it("scores Daus 11, Zehn 10, Sieben 0", () => {
    expect(cardValue(card("herz", "daus"))).toBe(11);
    expect(cardValue(card("herz", "zehn"))).toBe(10);
    expect(cardValue(card("herz", "sieben"))).toBe(0);
  });
});
