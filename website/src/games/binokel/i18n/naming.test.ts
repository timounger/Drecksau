/**
 * Tests for the configurable Binokel naming helpers.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import type { Meld } from "@/games/binokel/engine/melds";
import { defaultNaming, meldName, rankName, suitName } from "./naming";

describe("naming", () => {
  it("uses the default (first) name for each suit, ace and Dix", () => {
    const naming = defaultNaming();
    expect(suitName("schellen", naming)).toBe("Schellen");
    expect(suitName("blatt", naming)).toBe("Blatt");
    expect(rankName("daus", naming)).toBe("Daus");
    expect(rankName("koenig", naming)).toBe("K");
  });

  it("applies chosen suit, ace and Dix names to melds", () => {
    const naming = {
      suitNames: {
        eichel: "Kreuz",
        blatt: "Pik",
        herz: "Rot",
        schellen: "Karo",
      },
      dixName: "7er",
      aceName: "Ass",
      bidName: "Steigern",
    };
    const dix: Meld = { kind: "dix", cards: [], points: 40 };
    const familie: Meld = {
      kind: "familie",
      suit: "herz",
      cards: [],
      points: 100,
    };
    const vier: Meld = { kind: "vier", rank: "daus", cards: [], points: 100 };

    expect(meldName(dix, naming)).toBe("7er");
    expect(meldName(familie, naming)).toBe("Familie Rot");
    expect(meldName(vier, naming)).toBe("Vier Gleiche (Ass)");
  });
});
