/**
 * Tests that the right view is drawn, and that the far view has perspective.
 *
 * @module
 * @remarks
 * Two things are worth pinning here. The first is which world the player is
 * shown: behind the wheel the road ahead, on foot the motorhome from the side.
 * Drawing the wrong one is not a cosmetic slip - it is being handed somebody
 * else's controls.
 *
 * The second is that the far view really is a **projection** and not a flat
 * picture: something twice as far away has to come out about half the size, or
 * the road is a painted backdrop rather than a distance to be judged.
 */
import { describe, expect, it } from "vitest";
import { draw } from "./render";
import { startAt } from "../engine/setup";
import {
  NEUTRAL,
  REVERSE,
  ROUTE_STEP,
  TOP_GEAR,
  type GameState,
  type Route,
} from "../engine/types";

/** One recorded canvas call: the method or property, and its value. */
type Call = { readonly name: string; readonly args: readonly unknown[] };

/**
 * A canvas context that records every call and assignment instead of painting.
 *
 * @returns the stand-in context and the list it fills
 */
function recordingContext(): {
  readonly ctx: CanvasRenderingContext2D;
  readonly calls: Call[];
} {
  const calls: Call[] = [];
  const gradient = { addColorStop: () => undefined };
  const canvas = { width: 960, height: 420 };
  const ctx = new Proxy(
    {},
    {
      get: (_target, prop: string) => {
        if (prop === "canvas") {
          return canvas;
        }
        return (...args: unknown[]) => {
          calls.push({ name: prop, args });
          return gradient;
        };
      },
      set: (_target, prop: string, value: unknown) => {
        calls.push({ name: `set:${String(prop)}`, args: [value] });
        return true;
      },
    },
  ) as unknown as CanvasRenderingContext2D;
  return { ctx, calls };
}

/** Whether any colour was ever set to that value. */
function usedColour(calls: readonly Call[], colour: string): boolean {
  return calls.some((call) => call.args[0] === colour);
}

/**
 * The radius of every tree crown drawn.
 *
 * @param calls - what the canvas was asked to do
 * @returns the radii, in the order they were painted
 * @remarks
 * Found by the colour that was set just before, not by size: the steering
 * wheel's hub is a circle too, and counting that as a tree would make the test
 * pass for the wrong reason.
 */
function crownRadii(calls: readonly Call[]): number[] {
  const crowns: number[] = [];
  let colour = "";
  for (const call of calls) {
    if (call.name === "set:fillStyle") {
      colour = String(call.args[0]);
    }
    if (call.name === "arc" && CROWNS.includes(colour)) {
      crowns.push(Number(call.args[2]));
    }
  }
  return crowns;
}

/** The greens a tree crown is painted in: plain, and lit up for the rope. */
const CROWNS = ["#2f7d46", "#7ddc8f"];

/**
 * How wide every band of ground came out, far first.
 *
 * @param calls - what the canvas was asked to do
 * @returns the widths in pixels, in the order they were painted
 * @remarks
 * Each band starts with a `moveTo` at its far left corner and a `lineTo` at its
 * far right one, so the distance between the two is how wide the ground is at
 * that distance. Only pairs at the **same height** count: the speedometer's
 * ticks and its needle are lines too, and they all run at an angle.
 */
function bandWidths(calls: readonly Call[]): number[] {
  const widths: number[] = [];
  for (const [index, call] of calls.entries()) {
    const next = calls[index + 1];
    const flat =
      next?.name === "lineTo" && Number(next.args[1]) === Number(call.args[1]);
    if (call.name === "moveTo" && flat) {
      widths.push(Number(next.args[0]) - Number(call.args[0]));
    }
  }
  return widths.filter((width) => width > 0);
}

/** A flat road with two trees, one twice as far off as the other. */
const TWO_TREES: Route = {
  name: "zwei",
  heights: Array.from({ length: 40 }, () => 0),
  anchors: [
    { x: ROUTE_STEP * 5, y: 0 },
    { x: ROUTE_STEP * 10, y: 0 },
  ],
  pits: [],
  items: [],
  bear: null,
  checkpoints: [],
};

/** The cream of the motorhome's body - only the side view paints it. */
const BODY = "#efe4cb";

/** The colours of a checkpoint flag: its pole, and passed or still ahead. */
const MARK_POLE = "#4a5a6b";
const MARK_AHEAD = "#3f7fd0";
const MARK_PASSED = "#6d8bab";

/** The knob of the shift gate. */
const KNOB = "#d9d2c6";

/** The dashboard - only the driver's view paints that. */
const DASHBOARD = "#241f1c";

/**
 * A world at the very first metre, sitting in the cab.
 *
 * @remarks
 * Placed by hand rather than taken from the map: these tests measure distances
 * to two trees, and where the map happens to put its first checkpoint is none
 * of their business.
 */
function seated(): GameState {
  const state = startAt(0);
  return {
    ...state,
    rv: { x: 0, v: 0 },
    people: [{ ...state.people[0], inside: true, at: 0 }],
    driver: 0,
  };
}

/** The same world as the game hands it over: standing beside the motorhome. */
function standing(): GameState {
  const state = seated();
  return {
    ...state,
    people: [{ ...state.people[0], inside: false, at: 0 }],
    driver: -1,
  };
}

describe("which view is drawn", () => {
  it("shows the road ahead from the driver's seat", () => {
    const { ctx, calls } = recordingContext();
    draw(ctx, seated(), TWO_TREES, -1, -1);
    expect(usedColour(calls, DASHBOARD)).toBe(true);
    expect(usedColour(calls, BODY)).toBe(false);
  });

  it("shows the motorhome from the side once you are out of it", () => {
    const { ctx, calls } = recordingContext();
    draw(ctx, standing(), TWO_TREES, -1, -1);
    expect(usedColour(calls, BODY)).toBe(true);
    expect(usedColour(calls, DASHBOARD)).toBe(false);
  });
});

describe("the checkpoint flags", () => {
  /** A flat road with a checkpoint behind and one ahead. */
  const MARKED: Route = {
    ...TWO_TREES,
    anchors: [],
    pits: [],
    items: [],
    bear: null,
    checkpoints: [ROUTE_STEP * 2, ROUTE_STEP * 8],
  };

  it("puts a flag on every checkpoint in sight", () => {
    const at = { ...seated(), rv: { x: ROUTE_STEP * 4, v: 0 }, checkpoint: 0 };
    const { ctx, calls } = recordingContext();
    draw(ctx, at, MARKED, -1, -1);
    expect(usedColour(calls, MARK_POLE)).toBe(true);
  });

  it("fades the ones already behind you", () => {
    // A glance should say both "this is a checkpoint" and "you have had it".
    const passed = {
      ...seated(),
      rv: { x: ROUTE_STEP * 4, v: 0 },
      checkpoint: 0,
    };
    const { ctx, calls } = recordingContext();
    draw(
      ctx,
      {
        ...passed,
        people: [{ ...passed.people[0], inside: false, at: ROUTE_STEP * 4 }],
        driver: -1,
      },
      MARKED,
      -1,
      -1,
    );
    expect(usedColour(calls, MARK_PASSED)).toBe(true);
    expect(usedColour(calls, MARK_AHEAD)).toBe(true);
  });

  it("marks them all as ahead before any is reached", () => {
    const fresh = {
      ...seated(),
      rv: { x: 0, v: 0 },
      people: [{ ...seated().people[0], inside: false, at: 0 }],
      driver: -1,
      checkpoint: -1,
    };
    const { ctx, calls } = recordingContext();
    draw(ctx, fresh, MARKED, -1, -1);
    expect(usedColour(calls, MARK_PASSED)).toBe(false);
  });
});

describe("the shift gate", () => {
  /** Where the knob was put, in canvas pixels, and how big it came out. */
  function knobAt(gear: number): { x: number; y: number } {
    const { ctx, calls } = recordingContext();
    draw(ctx, { ...seated(), gear }, TWO_TREES, -1, -1);
    let colour = "";
    for (const [index, call] of calls.entries()) {
      if (call.name === "set:fillStyle") {
        colour = String(call.args[0]);
      }
      if (call.name === "arc" && colour === KNOB) {
        void index;
        // A knob of no size is a knob nobody can see.
        expect(Number(call.args[2])).toBeGreaterThan(1);
        return { x: Number(call.args[0]), y: Number(call.args[1]) };
      }
    }
    throw new Error(`no knob drawn for gear ${gear}`);
  }

  it("puts the knob in the slot of the gear that is in", () => {
    // The whole point of a gate instead of a letter: you see where the lever
    // sits, and the gear beside it is one slot away rather than a number away.
    const first = knobAt(1);
    const third = knobAt(3);
    const fifth = knobAt(TOP_GEAR);
    expect(first.x).toBeLessThan(third.x);
    expect(third.x).toBeLessThan(fifth.x);
    expect(first.y).toBeCloseTo(third.y);
  });

  it("puts the even gears below the odd ones", () => {
    expect(knobAt(1).y).toBeLessThan(knobAt(2).y);
    expect(knobAt(3).y).toBeLessThan(knobAt(4).y);
  });

  it("puts reverse under fifth, and neutral in the middle of the bar", () => {
    const fifth = knobAt(TOP_GEAR);
    const reverse = knobAt(REVERSE);
    expect(reverse.x).toBeCloseTo(fifth.x);
    expect(reverse.y).toBeGreaterThan(fifth.y);

    const neutral = knobAt(NEUTRAL);
    expect(neutral.x).toBeCloseTo(knobAt(3).x);
    expect(neutral.y).toBeGreaterThan(knobAt(3).y);
    expect(neutral.y).toBeLessThan(knobAt(4).y);
  });
});

describe("the view ahead", () => {
  it("draws what is twice as far away at about half the size", () => {
    const { ctx, calls } = recordingContext();
    draw(ctx, seated(), TWO_TREES, -1, -1);
    const crowns = crownRadii(calls);
    expect(crowns).toHaveLength(2);

    // Drawn far first, so the last of them is the near one.
    const far = crowns[0];
    const near = crowns[1];
    expect(near / far).toBeGreaterThan(1.7);
    expect(near / far).toBeLessThan(2.3);
  });

  it("narrows the road towards the horizon", () => {
    // Without this the road is a painted backdrop and no distance can be
    // judged from it.
    const { ctx, calls } = recordingContext();
    draw(ctx, seated(), TWO_TREES, -1, -1);
    const widths = bandWidths(calls);
    expect(widths.length).toBeGreaterThan(20);
    // Painted from far to near, so the last band is the widest by a long way.
    expect(widths[widths.length - 1]).toBeGreaterThan(widths[0] * 5);
  });

  it("does not draw what is still miles away", () => {
    const faraway: Route = {
      ...TWO_TREES,
      anchors: [{ x: ROUTE_STEP * 200, y: 0 }],
      checkpoints: [],
    };
    const { ctx, calls } = recordingContext();
    draw(ctx, seated(), faraway, -1, -1);
    expect(crownRadii(calls)).toHaveLength(0);
  });

  it("lights up the tree the rope would reach", () => {
    const lit = "#7ddc8f";
    const { ctx, calls } = recordingContext();
    draw(ctx, seated(), TWO_TREES, 0, -1);
    expect(usedColour(calls, lit)).toBe(true);

    const dull = recordingContext();
    draw(dull.ctx, seated(), TWO_TREES, -1, -1);
    expect(usedColour(dull.calls, lit)).toBe(false);
  });

  it("leaves out what is behind the motorhome", () => {
    // Standing past both trees there is nothing left to draw ahead.
    const passed = { ...seated(), rv: { x: ROUTE_STEP * 20, v: 0 } };
    const { ctx, calls } = recordingContext();
    draw(ctx, passed, TWO_TREES, -1, -1);
    expect(crownRadii(calls)).toHaveLength(0);
  });
});
