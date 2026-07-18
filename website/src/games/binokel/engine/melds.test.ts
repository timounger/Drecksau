/**
 * Tests for meld detection and scoring.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { SUITS } from "./cards";
import { findMelds } from "./melds";
import { card } from "./test-helpers";

describe("findMelds", () => {
  it("scores a family, more in trump, and no extra pair from it", () => {
    const family = [
      card("herz", "daus"),
      card("herz", "zehn"),
      card("herz", "koenig"),
      card("herz", "ober"),
      card("herz", "unter"),
    ];
    // The King+Ober belong to the family, so it is exactly 100 - not 120.
    expect(findMelds(family, null, false).total).toBe(100);
    expect(findMelds(family, "herz", false).total).toBe(150);
  });

  it("scores a second King+Ober beyond the family as a pair", () => {
    const hand = [
      card("herz", "daus"),
      card("herz", "zehn"),
      card("herz", "koenig", 0),
      card("herz", "ober", 0),
      card("herz", "unter"),
      card("herz", "koenig", 1),
      card("herz", "ober", 1),
    ];
    // Family 100 + one leftover pair 20.
    expect(findMelds(hand, null, false).total).toBe(120);
  });

  it("scores a Binokel and a Doppelbinokel", () => {
    expect(
      findMelds([card("blatt", "ober"), card("schellen", "unter")], null, false)
        .total,
    ).toBe(40);
    expect(
      findMelds(
        [
          card("blatt", "ober", 0),
          card("blatt", "ober", 1),
          card("schellen", "unter", 0),
          card("schellen", "unter", 1),
        ],
        null,
        false,
      ).total,
    ).toBe(300);
  });

  it("scores a pair, more in trump", () => {
    const pair = [card("eichel", "koenig"), card("eichel", "ober")];
    expect(findMelds(pair, null, false).total).toBe(20);
    expect(findMelds(pair, "eichel", false).total).toBe(40);
  });

  it("scores four and eight of a kind", () => {
    const fourDausen = SUITS.map((suit) => card(suit, "daus"));
    expect(findMelds(fourDausen, null, false).total).toBe(100);
    const eightDausen = SUITS.flatMap((suit) => [
      card(suit, "daus", 0),
      card(suit, "daus", 1),
    ]);
    expect(findMelds(eightDausen, null, false).total).toBe(1000);
  });

  it("scores a Rundgang, plus the four Kings and four Obers it contains", () => {
    const rundgang = SUITS.flatMap((suit) => [
      card(suit, "koenig"),
      card(suit, "ober"),
    ]);
    const { melds, total } = findMelds(rundgang, null, false);
    expect(melds.some((m) => m.kind === "rundgang")).toBe(true);
    // Rundgang 240 + four Kings 80 + four Obers 60 - the sets count on their own.
    expect(total).toBe(380);
  });

  it("scores the Dix only with Sevens and a trump", () => {
    const hand = [card("herz", "sieben")];
    expect(findMelds(hand, "herz", true).total).toBe(10);
    expect(findMelds(hand, "herz", false).total).toBe(0);
    expect(findMelds(hand, "eichel", true).total).toBe(0);
  });
});
