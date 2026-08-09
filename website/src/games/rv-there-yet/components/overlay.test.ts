/**
 * Tests for the screen that comes up when a drive ends.
 *
 * @module
 * @remarks
 * The board of best times is the whole point of the flag screen now, and
 * whether it is on there is not something a canvas test can see. The elements
 * are built by calling the component as the plain function it is - no DOM, no
 * renderer, just the tree it returns.
 */
import { describe, expect, it } from "vitest";
import type { ReactElement } from "react";
import { Overlay } from "./rv-there-yet-game";
import { Leaderboard } from "./leaderboard";
import { hudOf } from "@/games/rv-there-yet/hooks/hud";
import { startAt } from "@/games/rv-there-yet/engine/setup";
import type { Hud } from "@/games/rv-there-yet/hooks/hud";
import type { Run } from "@/games/rv-there-yet/stats/run-clock";

/** A drive of four minutes, driven from the first section through to the end. */
const WHOLE: Run = { seconds: 240, whole: true };

/** The heads-up facts of a drive in a given phase. */
function hud(over: Partial<Hud> = {}): Hud {
  const base = hudOf(startAt(0), {
    ready: -1,
    candidate: -1,
    running: true,
    me: 0,
  });
  return { ...base, ...over };
}

/** Every element of a tree whose type is that component. */
function find(
  node: unknown,
  type: unknown,
): ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node)) {
    return node.flatMap((each) => find(each, type));
  }
  if (node === null || typeof node !== "object") {
    return [];
  }
  const element = node as ReactElement<Record<string, unknown>>;
  const inside = find(element.props.children, type);
  return element.type === type ? [element, ...inside] : inside;
}

/** The overlay for a world, with nothing pressed. */
function overlay(facts: Partial<Hud>, run: Run = WHOLE) {
  return Overlay({
    hud: hud(facts),
    run,
    onStart: () => undefined,
    onAgain: () => undefined,
    onFromStart: () => undefined,
  });
}

describe("the screen at the end of a drive", () => {
  it("stays out of the way while the drive is running", () => {
    expect(overlay({ phase: "driving" })).toBeNull();
  });

  it("puts the board of best times on the flag screen", () => {
    // Reaching the flag is the one moment the board is worth anybody's time,
    // and the one moment a name can still be put to the drive.
    const boards = find(overlay({ phase: "arrived" }), Leaderboard);
    expect(boards).toHaveLength(1);
  });

  it("hands the board the whole drive, not the last section", () => {
    // The world's clock starts again at every section. A board measured on
    // that would be held by whoever jumped straight to the last one.
    const [board] = find(overlay({ phase: "arrived", time: 12 }), Leaderboard);
    expect(board.props.run).toEqual({ ms: 240_000, whole: true });
  });

  it("says a part-drive is a part-drive", () => {
    const [board] = find(
      overlay({ phase: "arrived" }, { seconds: 90, whole: false }),
      Leaderboard,
    );
    expect(board.props.run).toEqual({ ms: 90_000, whole: false });
  });

  it("leaves the board off the screens for a drive that ended badly", () => {
    // Nothing to enter: the drive is not finished, it is over.
    for (const phase of ["mauled", "taken", "fallen", "plunged"] as const) {
      expect(find(overlay({ phase }), Leaderboard)).toEqual([]);
    }
  });
});
