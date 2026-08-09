/**
 * Tests for the clock that runs over a whole drive.
 *
 * @module
 * @remarks
 * The board of best times stands or falls on this: the world's own clock
 * starts again at every section, and a board measured on that would be held by
 * whoever jumped straight to the last one.
 */
import { describe, expect, it } from "vitest";
import { NO_RUN, runAgain, runFrom, runOn, type Run } from "./run-clock";

/** A drive begun at the first section and driven for a while. */
function driven(seconds: number, from = 0): Run {
  return runOn(runFrom(from), seconds);
}

describe("the clock over a whole drive", () => {
  it("starts at nothing", () => {
    expect(NO_RUN.seconds).toBe(0);
    expect(NO_RUN.whole).toBe(false);
  });

  it("counts on through the sections", () => {
    // Not put back at a section mark: that is the whole point of it.
    const first = driven(30);
    const later = runOn(first, 45);
    expect(later.seconds).toBe(75);
  });

  it("counts a drive from the first section as a whole one", () => {
    expect(runFrom(0).whole).toBe(true);
  });

  it("counts a drive begun anywhere else as a part of one", () => {
    // Carrying on from a saved section, or stepping through them: the board
    // is for drives from the plateau to the flag, and that was neither.
    expect(runFrom(1).whole).toBe(false);
    expect(runFrom(7).whole).toBe(false);
    expect(driven(10, 5).whole).toBe(false);
  });

  it("keeps counting when a section is begun again after a crash", () => {
    // A section driven twice took twice as long. Putting the clock back would
    // make crashing on purpose the quick way round the hard bit.
    const crashed = driven(90);
    const again = runAgain(crashed);
    expect(again.seconds).toBe(90);
    expect(again.whole).toBe(true);
  });

  it("starts over when a drive begins at a section on purpose", () => {
    const crashed = driven(90);
    expect(runFrom(3).seconds).toBe(0);
    expect(runFrom(3).whole).toBe(false);
    expect(crashed.seconds).toBe(90);
  });
});
