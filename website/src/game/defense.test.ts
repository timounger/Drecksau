/**
 * Tests for the "Drecksau total" defence cards - Extra-Matsch and Lippenstift.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import {
  BASE_ACTION_CARD_COUNT,
  createDeck,
  EXPANSION_CARD_COUNT,
  isDefenseCard,
} from "./cards";
import { applyMove } from "./engine";
import { isCardPlayable, legalMoves } from "./moves";
import type { GameState } from "./state";
import { handCardId, makeState, totalCardCount } from "./test-helpers";

/** Plays a card of a type at an optional target, for the active player. */
function play(
  state: GameState,
  type: Parameters<typeof handCardId>[2],
  targetPigId?: string,
): GameState {
  return applyMove(state, {
    kind: "playCard",
    cardId: handCardId(state, state.currentPlayerIndex, type),
    targetPigId,
  });
}

/** Counts cards of a type in a player's hand. */
function handCount(
  state: GameState,
  playerIndex: number,
  type: string,
): number {
  return state.players[playerIndex].hand.filter((c) => c.type === type).length;
}

describe("the defence deck", () => {
  it("adds 2 Extra-Matsch to the base game", () => {
    const deck = createDeck(false, true);
    expect(deck.filter((c) => c.type === "extraMud")).toHaveLength(2);
    // Lipstick needs Schönsäue, so it stays out without the expansion.
    expect(deck.filter((c) => c.type === "lipstick")).toHaveLength(0);
    expect(deck).toHaveLength(BASE_ACTION_CARD_COUNT + 2);
  });

  it("adds Extra-Matsch and Lippenstift alongside the expansion", () => {
    const deck = createDeck(true, true);
    expect(deck.filter((c) => c.type === "extraMud")).toHaveLength(2);
    expect(deck.filter((c) => c.type === "lipstick")).toHaveLength(2);
    expect(deck).toHaveLength(
      BASE_ACTION_CARD_COUNT + EXPANSION_CARD_COUNT + 4,
    );
  });

  it("knows the defence cards", () => {
    expect(isDefenseCard("extraMud")).toBe(true);
    expect(isDefenseCard("lipstick")).toBe(true);
    expect(isDefenseCard("mud")).toBe(false);
    expect(isDefenseCard("beauty")).toBe(false);
  });
});

describe("defence cards are never played actively", () => {
  it("cannot be played, only discarded", () => {
    const state = makeState(
      [
        // A clean pig, so the mud has a legal target and the defence cards
        // stand out as the unplayable ones.
        { pigs: [{}], hand: ["extraMud", "lipstick", "mud"] },
        { pigs: [{}], hand: [] },
      ],
      { hasExpansion: true },
    );

    expect(isCardPlayable(state, "p0", "extraMud")).toBe(false);
    expect(isCardPlayable(state, "p0", "lipstick")).toBe(false);

    const moves = legalMoves(state);
    const played = moves.filter((m) => m.kind === "playCard");
    // Only the mud is playable here; the two defence cards are not.
    expect(played).toHaveLength(1);
    // But they can be discarded.
    expect(moves.filter((m) => m.kind === "discardCard")).toHaveLength(3);
  });
});

describe("Extra-Matsch defends a Drecksau", () => {
  it("keeps a scrubbed Drecksau dirty and is spent", () => {
    const state = makeState(
      [
        { pigs: [{}], hand: ["farmerScrubs", "mud", "mud"] },
        { pigs: [{ isDirty: true }], hand: ["extraMud", "mud", "mud"] },
      ],
      { drawPile: ["rain", "rain", "rain", "rain"], hasExpansion: true },
    );
    const next = play(state, "farmerScrubs", "p1-pig0");

    // The Drecksau stayed dirty.
    expect(next.players[1].pigs[0].isDirty).toBe(true);
    // The Extra-Matsch was spent to the discard pile.
    expect(handCount(next, 1, "extraMud")).toBe(0);
    expect(next.discardPile.map((c) => c.type).sort()).toEqual([
      "extraMud",
      "farmerScrubs",
    ]);
  });

  it("draws a replacement at once, so defending costs no card", () => {
    const state = makeState(
      [
        { pigs: [{}], hand: ["farmerScrubs", "mud", "mud"] },
        { pigs: [{ isDirty: true }], hand: ["extraMud", "mud", "mud"] },
      ],
      { drawPile: ["rain", "rain", "rain"], hasExpansion: true },
    );
    const next = play(state, "farmerScrubs", "p1-pig0");

    // The defender kept a full hand: spent the Extra-Matsch, drew one back.
    expect(next.players[1].hand).toHaveLength(3);
    expect(next.players[1].hand.some((c) => c.type === "rain")).toBe(true);
  });

  it("without it, the scrub cleans the Drecksau as usual", () => {
    const state = makeState(
      [
        { pigs: [{}], hand: ["farmerScrubs", "mud", "mud"] },
        { pigs: [{ isDirty: true }], hand: ["mud"] },
      ],
      { drawPile: ["mud"], hasExpansion: true },
    );
    expect(
      play(state, "farmerScrubs", "p1-pig0").players[1].pigs[0].isDirty,
    ).toBe(false);
  });

  it("saves an own Drecksau from the own rain, one card per pig", () => {
    const state = makeState(
      [
        {
          // Two Drecksäue, but only one Extra-Matsch to protect them.
          pigs: [{ isDirty: true }, { isDirty: true }],
          hand: ["rain", "extraMud", "mud"],
        },
        { pigs: [{ isDirty: true }], hand: [] },
      ],
      { drawPile: ["mud", "mud", "mud"], hasExpansion: true },
    );
    const next = play(state, "rain");

    const dirtyOwn = next.players[0].pigs.filter((p) => p.isDirty).length;
    // One of the two own Drecksäue is saved, the other washed.
    expect(dirtyOwn).toBe(1);
    // The opponent had no shield, so their Drecksau was washed.
    expect(next.players[1].pigs[0].isDirty).toBe(false);
    expect(handCount(next, 0, "extraMud")).toBe(0);
  });

  it("protects a Drecksau of every player that holds one", () => {
    const state = makeState(
      [
        { pigs: [{}], hand: ["rain", "mud", "mud"] },
        { pigs: [{ isDirty: true }], hand: ["extraMud"] },
      ],
      { drawPile: ["mud", "mud"], hasExpansion: true },
    );
    const next = play(state, "rain");
    // The opponent defends their own Drecksau against my rain.
    expect(next.players[1].pigs[0].isDirty).toBe(true);
    expect(handCount(next, 1, "extraMud")).toBe(0);
  });

  it("does not lose or duplicate cards", () => {
    const state = makeState(
      [
        { pigs: [{ isDirty: true }], hand: ["rain", "extraMud", "mud"] },
        { pigs: [{ isDirty: true }], hand: ["extraMud"] },
      ],
      { drawPile: ["mud", "mud", "beauty"], hasExpansion: true },
    );
    const before = totalCardCount(state);
    expect(totalCardCount(play(state, "rain"))).toBe(before);
  });
});

describe("Lippenstift defends a Schönsau", () => {
  it("keeps an opponent's Aus-dem-Staub from removing it, and is spent", () => {
    const state = makeState(
      [
        { pigs: [{}], hand: ["dustOff", "mud", "mud"] },
        { pigs: [{ hasBeauty: true }], hand: ["lipstick", "mud", "mud"] },
      ],
      { drawPile: ["rain", "rain", "rain", "rain"], hasExpansion: true },
    );
    const next = play(state, "dustOff", "p1-pig0");

    // The Schönsau is still there.
    expect(next.players[1].pigs[0].beauty).not.toBeNull();
    // The Lippenstift was spent; the dustOff too.
    expect(handCount(next, 1, "lipstick")).toBe(0);
    expect(next.discardPile.map((c) => c.type).sort()).toEqual([
      "dustOff",
      "lipstick",
    ]);
    // The defender drew a replacement, keeping a full hand.
    expect(next.players[1].hand).toHaveLength(3);
  });

  it("does not defend against your own Aus-dem-Staub", () => {
    // You take your own Schönsau off on purpose - the Lippenstift stays.
    const state = makeState(
      [
        {
          pigs: [{ isDirty: true, hasBeauty: true }],
          hand: ["dustOff", "lipstick", "mud"],
        },
        { pigs: [{}], hand: [] },
      ],
      { drawPile: ["mud", "mud"], hasExpansion: true },
    );
    const next = play(state, "dustOff", "p0-pig0");

    expect(next.players[0].pigs[0].beauty).toBeNull();
    // Drecksau underneath shows again, Lippenstift not wasted.
    expect(next.players[0].pigs[0].isDirty).toBe(true);
    expect(handCount(next, 0, "lipstick")).toBe(1);
  });

  it("does not lose or duplicate cards", () => {
    const state = makeState(
      [
        { pigs: [{}], hand: ["dustOff", "mud", "mud"] },
        { pigs: [{ hasBeauty: true }], hand: ["lipstick"] },
      ],
      { drawPile: ["mud", "beauty"], hasExpansion: true },
    );
    const before = totalCardCount(state);
    expect(totalCardCount(play(state, "dustOff", "p1-pig0"))).toBe(before);
  });
});
