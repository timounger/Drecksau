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

  it("say what the buttons after a finished drive do", () => {
    // The one that ends a drive says "from the start", because that is what it
    // does - landing back on the last section was the bug that put it here.
    expect(RV_TEXTS.againFromStart).toContain("vorne");
    expect(RV_TEXTS.again).not.toContain("vorne");
  });
});
