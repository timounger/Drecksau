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
  PICKUP_REACH,
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
  sections: [],
};

/** The cream of the motorhome's body - only the side view paints it. */
const BODY = "#efe4cb";

/** The colours of a section flag: its pole, and passed or still ahead. */
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
 * to two trees, and where the map happens to put its first section is none
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

describe("the section flags", () => {
  /** A flat road with a section behind and one ahead. */
  const MARKED: Route = {
    ...TWO_TREES,
    anchors: [],
    pits: [],
    items: [],
    bear: null,
    sections: [ROUTE_STEP * 2, ROUTE_STEP * 8],
  };

  it("puts a flag on every section in sight", () => {
    const at = { ...seated(), rv: { x: ROUTE_STEP * 4, v: 0 }, section: 0 };
    const { ctx, calls } = recordingContext();
    draw(ctx, at, MARKED, -1, -1);
    expect(usedColour(calls, MARK_POLE)).toBe(true);
  });

  it("fades the ones already behind you", () => {
    // A glance should say both "this is a section" and "you have had it".
    const passed = {
      ...seated(),
      rv: { x: ROUTE_STEP * 4, v: 0 },
      section: 0,
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
      section: -1,
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
      sections: [],
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

describe("the tyres on the motorhome", () => {
  /** The colour the tyres are painted in. */
  const RUBBER = "#2b2b2b";

  /**
   * The radius of every wheel drawn on the motorhome.
   *
   * @param calls - what the canvas was asked to do
   * @returns the radii, in the order they were painted
   * @remarks
   * Found by the colour set just before, like the tree crowns: plenty of other
   * things on this canvas are circles.
   */
  function wheelRadii(calls: readonly Call[]): number[] {
    const found: number[] = [];
    let colour = "";
    for (const call of calls) {
      if (call.name === "set:fillStyle") {
        colour = String(call.args[0]);
      }
      if (call.name === "arc" && colour === RUBBER) {
        found.push(Number(call.args[2]));
      }
    }
    return found;
  }

  /** How many tread blocks were drawn: rubber-coloured rounded squares. */
  function treadBlocks(calls: readonly Call[]): number {
    let colour = "";
    let found = 0;
    for (const call of calls) {
      if (call.name === "set:fillStyle") {
        colour = String(call.args[0]);
      }
      if (
        call.name === "roundRect" &&
        colour === RUBBER &&
        call.args[2] === call.args[3]
      ) {
        found += 1;
      }
    }
    return found;
  }

  /** The side view of a world, with or without the off-road tyres fitted. */
  function fitted(tyres: boolean) {
    const { ctx, calls } = recordingContext();
    draw(ctx, { ...standing(), tyres }, TWO_TREES, -1, -1);
    return calls;
  }

  it("makes the wheels visibly bigger once they are on", () => {
    const road = wheelRadii(fitted(false));
    const offRoad = wheelRadii(fitted(true));
    expect(road).toHaveLength(2);
    expect(offRoad).toHaveLength(2);
    // A third bigger, not a hair: it has to read across the whole screen.
    expect(offRoad[0]).toBeGreaterThan(road[0] * 1.3);
    expect(offRoad[1]).toBeGreaterThan(road[1] * 1.3);
  });

  it("gives them tread blocks the road tyres do not have", () => {
    expect(treadBlocks(fitted(false))).toBe(0);
    // Both wheels, all the way round.
    expect(treadBlocks(fitted(true))).toBeGreaterThan(20);
  });

  it("lifts the motorhome by exactly what the bigger tyres add", () => {
    // The body is drawn from the ground up, so without the lift the fat tyres
    // would eat into the floor - or hover.
    const lift = (calls: readonly Call[]) => {
      const move = calls.find(
        (call) => call.name === "translate" && call.args[0] === 0,
      );
      return move === undefined ? 0 : -Number(move.args[1]);
    };
    const road = wheelRadii(fitted(false))[0];
    const offRoad = wheelRadii(fitted(true))[0];
    expect(lift(fitted(true))).toBeCloseTo(offRoad - road, 6);
    expect(lift(fitted(false))).toBe(0);
  });
});

describe("the two seats in the cab", () => {
  /** The colours that only the driver's side has. */
  const STEERING_WHEEL = "#5b524a";
  const DIAL_FACE = "#e8e2d6";
  const GATE_PLATE = "#141210";
  /** The colours that only the passenger's side has. */
  const GLOVE_BOX = "#332c26";
  const GRAB_HANDLE = "#6b6058";

  /**
   * Both of them in the cab, seen from one of the two seats.
   *
   * @param me - whose screen this is: 0 drives, 1 rides along
   * @returns what the canvas was asked to do
   */
  function fromSeat(me: number): readonly Call[] {
    const base = seated();
    const both: GameState = {
      ...base,
      people: [
        { ...base.people[0], inside: true, at: 0 },
        { ...base.people[0], inside: true, at: 0 },
      ],
      // Person zero got in first, so person zero drives.
      driver: 0,
    };
    const { ctx, calls } = recordingContext();
    draw(ctx, both, TWO_TREES, -1, -1, me);
    return calls;
  }

  it("puts a wheel and a speedometer in front of the driver", () => {
    const driver = fromSeat(0);
    expect(usedColour(driver, STEERING_WHEEL)).toBe(true);
    expect(usedColour(driver, DIAL_FACE)).toBe(true);
    expect(usedColour(driver, GATE_PLATE)).toBe(true);
  });

  it("gives the passenger neither of them", () => {
    // The whole point: a passenger who still saw a wheel would keep pressing
    // the pedals and wondering why nothing happens.
    const rider = fromSeat(1);
    expect(usedColour(rider, STEERING_WHEEL)).toBe(false);
    expect(usedColour(rider, DIAL_FACE)).toBe(false);
    expect(usedColour(rider, GATE_PLATE)).toBe(false);
  });

  it("gives the passenger a glove box and something to hold instead", () => {
    // Otherwise the seat reads as a drawing somebody forgot to finish.
    const rider = fromSeat(1);
    expect(usedColour(rider, GLOVE_BOX)).toBe(true);
    expect(usedColour(rider, GRAB_HANDLE)).toBe(true);
    const driver = fromSeat(0);
    expect(usedColour(driver, GLOVE_BOX)).toBe(false);
  });

  it("shows both of them the same road", () => {
    // Only the furniture differs - the drive is one drive.
    expect(usedColour(fromSeat(0), DASHBOARD)).toBe(true);
    expect(usedColour(fromSeat(1), DASHBOARD)).toBe(true);
    expect(usedColour(fromSeat(1), BODY)).toBe(false);
  });
});

describe("the speedometer", () => {
  /** Every string the canvas was asked to write. */
  function written(calls: readonly Call[]): string[] {
    return calls
      .filter((call) => call.name === "fillText")
      .map((call) => String(call.args[0]));
  }

  /** The driver's view at a given speed, in metres per second. */
  function atSpeed(speed: number): readonly Call[] {
    const base = seated();
    const { ctx, calls } = recordingContext();
    draw(ctx, { ...base, rv: { x: 0, v: speed } }, TWO_TREES, -1, -1);
    return calls;
  }

  it("says the speed in figures, in km/h", () => {
    // A needle alone answers "how far round", not "how fast".
    expect(written(atSpeed(10))).toContain("36 km/h");
    expect(written(atSpeed(0))).toContain("0 km/h");
  });

  it("reads a reverse roll as speed, not as a negative number", () => {
    expect(written(atSpeed(-5))).toContain("18 km/h");
  });

  it("labels the dial so the needle stands for something", () => {
    const labels = written(atSpeed(0));
    // Every second tick of the six carries its own number.
    expect(labels).toContain("0");
    expect(labels).toContain("20");
    expect(labels).toContain("40");
    expect(labels).toContain("60");
  });

  it("keeps the numbers off the passenger's side", () => {
    const base = seated();
    const both: GameState = {
      ...base,
      people: [
        { ...base.people[0], inside: true, at: 0 },
        { ...base.people[0], inside: true, at: 0 },
      ],
      driver: 0,
      rv: { x: 0, v: 10 },
    };
    const { ctx, calls } = recordingContext();
    draw(ctx, both, TWO_TREES, -1, -1, 1);
    expect(written(calls)).not.toContain("36 km/h");
  });
});

describe("a thing you could pick up", () => {
  /** The ring drawn around something within reach. */
  const TAKE_GLOW = "#ffd75e88";

  /** A route with a hammer lying at a known spot. */
  const WITH_HAMMER: Route = {
    ...TWO_TREES,
    anchors: [],
    items: [{ at: ROUTE_STEP * 3, kind: "hammer" }],
  };

  /** The side view with the walker standing a given distance from it. */
  function away(gap: number): readonly Call[] {
    const base = standing();
    const at = WITH_HAMMER.items[0].at + gap;
    const { ctx, calls } = recordingContext();
    draw(
      ctx,
      { ...base, rv: { x: at, v: 0 }, people: [{ ...base.people[0], at }] },
      WITH_HAMMER,
      -1,
      -1,
    );
    return calls;
  }

  it("is ringed the moment somebody is close enough", () => {
    // Without this the only sign is a line of text, and a player watching the
    // road walks straight past a thing they are standing on.
    expect(usedColour(away(PICKUP_REACH - 1), TAKE_GLOW)).toBe(true);
  });

  it("is not ringed from further off than the reach", () => {
    expect(usedColour(away(PICKUP_REACH + 2), TAKE_GLOW)).toBe(false);
  });

  it("is not ringed for somebody sitting in the cab", () => {
    // Two of them, so the side view is drawn at all: one on foot far away
    // watching, one parked in the cab right on top of the hammer. Reaching out
    // of a cab window for it is not a thing that happens, so no ring.
    const base = standing();
    const at = WITH_HAMMER.items[0].at;
    const { ctx, calls } = recordingContext();
    draw(
      ctx,
      {
        ...base,
        rv: { x: at, v: 0 },
        people: [
          { ...base.people[0], at: at - PICKUP_REACH * 6, inside: false },
          { ...base.people[0], at, inside: true },
        ],
        driver: 1,
      },
      WITH_HAMMER,
      -1,
      -1,
      0,
    );
    expect(usedColour(calls, TAKE_GLOW)).toBe(false);
  });
});
