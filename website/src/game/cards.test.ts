/**
 * Tests for the deck composition - it must match the Kosmos rulebook exactly.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import {
  ACTION_CARD_COUNT,
  createDeck,
  DECK_COMPOSITION,
  isAttachedCard,
  PIG_CARD_COUNT,
} from "./cards";

describe("deck composition", () => {
  it("holds the 54 action cards of the German edition", () => {
    expect(createDeck()).toHaveLength(ACTION_CARD_COUNT);
  });

  it("matches the printed card counts", () => {
    expect(DECK_COMPOSITION).toEqual({
      mud: 21,
      rain: 4,
      barn: 9,
      lightning: 4,
      lightningRod: 4,
      farmerScrubs: 8,
      barnDoor: 4,
    });
  });

  it("adds up to the 66 cards of the box", () => {
    const actionCards = Object.values(DECK_COMPOSITION).reduce(
      (sum, count) => sum + count,
      0,
    );
    expect(actionCards).toBe(ACTION_CARD_COUNT);
    expect(actionCards + PIG_CARD_COUNT).toBe(66);
  });

  it("gives every card a unique id", () => {
    const deck = createDeck();
    const ids = new Set(deck.map((card) => card.id));
    expect(ids.size).toBe(deck.length);
  });

  it("knows which cards are attached to a pig", () => {
    expect(isAttachedCard("barn")).toBe(true);
    expect(isAttachedCard("lightningRod")).toBe(true);
    expect(isAttachedCard("barnDoor")).toBe(true);
    expect(isAttachedCard("mud")).toBe(false);
    expect(isAttachedCard("rain")).toBe(false);
    expect(isAttachedCard("lightning")).toBe(false);
    expect(isAttachedCard("farmerScrubs")).toBe(false);
  });
});
