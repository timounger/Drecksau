/**
 * Tests that the German on screen stayed German.
 *
 * @module
 * @remarks
 * These exist because of a real slip: a rename that turned the English
 * identifier `checkpoint` into `section` walked straight through the German
 * labels as well and left "Nochmal von diesem Section" on a button. Nothing in
 * the type system minds that, and nothing in a canvas test looks at it.
 */
import { describe, expect, it } from "vitest";
import { RV_TEXTS } from "./texts";
import { SECTION_COUNT } from "@/games/rv-there-yet/engine/map";

/** English words that have no business in a German label. */
const ENGLISH = [
  "Section",
  "Checkpoint",
  "Bear",
  "Vehicle",
  "Item",
  "Person",
  "Route",
];

/** Every label the game can show, with the functions filled in. */
function labels(): readonly string[] {
  return Object.values(RV_TEXTS).flatMap((value) => {
    if (typeof value === "function") {
      // Three arguments, because the longest of them takes three. Too few and
      // the label comes out with an "undefined" in it, which the checks below
      // would then be reading instead of the real text.
      const filled = value as (...args: never[]) => string;
      return [String(filled(1 as never, 2 as never, "x" as never))];
    }
    return Array.isArray(value) ? value.map(String) : [String(value)];
  });
}

describe("the German labels", () => {
  it("carry no English left over from a rename", () => {
    const slipped = labels().filter((text) =>
      ENGLISH.some((word) => text.includes(word)),
    );
    expect(slipped).toEqual([]);
  });

  it("are all non-empty", () => {
    expect(labels().filter((text) => text.trim().length === 0)).toEqual([]);
  });

  it("have no gaps where a value was left out", () => {
    // "undefined" in a label is the sign of a text that grew an argument and
    // a caller that did not.
    expect(labels().filter((text) => text.includes("undefined"))).toEqual([]);
  });

  it("name every section on the map, and no more", () => {
    // A name too few leaves a stretch of road nameless; one too many is a
    // section somebody deleted without saying so.
    expect(RV_TEXTS.sectionNames).toHaveLength(SECTION_COUNT);
  });

  it("call the thing that pulls the rope in a winch", () => {
    // It is a winch on the vehicle, worked from a handset. Calling the item a
    // remote control named the handset and left the winch unnamed, so the bag
    // held a thing nobody could match to the job it does.
    expect(RV_TEXTS.itemRemote).toBe("Seilwinde");
    expect(labels().filter((text) => text.includes("Fernbedienung"))).toEqual(
      [],
    );
  });

  it("say what there is to do in every section", () => {
    // Indexed by section number, so a hint too few would leave the last
    // section without a board and one too many belongs to nothing.
    expect(RV_TEXTS.sectionHints).toHaveLength(SECTION_COUNT);
    expect(RV_TEXTS.sectionHints.filter((hint) => hint === "")).toEqual([]);
    expect(RV_TEXTS.sectionHints[0]).toContain("Gang");
  });

  it("say what the buttons after a finished drive do", () => {
    // The one that ends a drive says "from the start", because that is what it
    // does - landing back on the last section was the bug that put it here.
    expect(RV_TEXTS.againFromStart).toContain("vorne");
    expect(RV_TEXTS.again).not.toContain("vorne");
  });
});

describe("what the loss screens give away", () => {
  /** Words that would hand the player the answer to a section.  */
  const GIVEAWAYS = ["einer fährt", "einer geht", "nur einer"];

  it("says why the bridge went, not how to cross it", () => {
    // The hint used to read "one drives, one walks" - the whole puzzle of the
    // section, printed on the screen that comes up when you get it wrong.
    const hint = RV_TEXTS.fallenHint.toLowerCase();
    expect(hint.length).toBeGreaterThan(0);
    for (const word of GIVEAWAYS) {
      expect(hint).not.toContain(word);
    }
    // It still has to say what happened, or it is not a hint at all.
    expect(hint).toContain("schwer");
  });
});
