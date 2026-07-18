/**
 * Tests for the deck composition - it must match the Kosmos rulebooks exactly.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import {
  BASE_ACTION_CARD_COUNT,
  BASE_DECK_COMPOSITION,
  createDeck,
  EXPANSION_CARD_COUNT,
  EXPANSION_DECK_COMPOSITION,
  isAttachedCard,
  isExpansionCard,
  PIG_CARD_COUNT,
} from "./cards";

/** Adds up the copies in a composition. */
function total(composition: Readonly<Record<string, number>>): number {
  return Object.values(composition).reduce((sum, count) => sum + count, 0);
}

describe("base deck", () => {
  it("holds the 54 action cards of the German edition", () => {
    expect(createDeck(false)).toHaveLength(BASE_ACTION_CARD_COUNT);
  });

  it("matches the printed card counts", () => {
    expect(BASE_DECK_COMPOSITION).toEqual({
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
    expect(total(BASE_DECK_COMPOSITION)).toBe(BASE_ACTION_CARD_COUNT);
    expect(BASE_ACTION_CARD_COUNT + PIG_CARD_COUNT).toBe(66);
  });

  it("has no expansion cards in it", () => {
    expect(createDeck(false).some((card) => isExpansionCard(card.type))).toBe(
      false,
    );
  });
});

describe("Sauschön expansion", () => {
  it("matches the printed card counts", () => {
    expect(EXPANSION_DECK_COMPOSITION).toEqual({
      beauty: 16,
      dustOff: 12,
      luckyBird: 4,
    });
  });

  it("adds up to the 32 cards of the box", () => {
    expect(total(EXPANSION_DECK_COMPOSITION)).toBe(EXPANSION_CARD_COUNT);
  });

  it("is mixed into the base deck, making 86", () => {
    expect(createDeck(true)).toHaveLength(
      BASE_ACTION_CARD_COUNT + EXPANSION_CARD_COUNT,
    );
  });

  it("brings exactly the three new cards", () => {
    const added = createDeck(true).filter((card) => isExpansionCard(card.type));
    expect(added).toHaveLength(EXPANSION_CARD_COUNT);
    expect(new Set(added.map((card) => card.type))).toEqual(
      new Set(["beauty", "dustOff", "luckyBird"]),
    );
  });
});

describe("card behaviour", () => {
  it("gives every card a unique id, with and without the expansion", () => {
    for (const withExpansion of [false, true]) {
      const deck = createDeck(withExpansion);
      expect(new Set(deck.map((card) => card.id)).size).toBe(deck.length);
    }
  });

  it("knows which cards are attached to a pig", () => {
    expect(isAttachedCard("barn")).toBe(true);
    expect(isAttachedCard("lightningRod")).toBe(true);
    expect(isAttachedCard("barnDoor")).toBe(true);
    // The Schönsau lies on the pig until an Aus-dem-Staub takes it off.
    expect(isAttachedCard("beauty")).toBe(true);

    expect(isAttachedCard("mud")).toBe(false);
    expect(isAttachedCard("rain")).toBe(false);
    expect(isAttachedCard("lightning")).toBe(false);
    expect(isAttachedCard("farmerScrubs")).toBe(false);
    expect(isAttachedCard("dustOff")).toBe(false);
    expect(isAttachedCard("luckyBird")).toBe(false);
  });

  it("knows which cards come from the expansion", () => {
    expect(isExpansionCard("beauty")).toBe(true);
    expect(isExpansionCard("dustOff")).toBe(true);
    expect(isExpansionCard("luckyBird")).toBe(true);
    expect(isExpansionCard("mud")).toBe(false);
    expect(isExpansionCard("barnDoor")).toBe(false);
  });
});
