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
import { RV_TEXTS } from "../i18n/texts";
import { NOTICE_AFTER } from "./notice";
import { SECTIONS, WOOD_FROM, woodShare } from "../engine/map";
import {
  NEUTRAL,
  REVERSE,
  PICKUP_REACH,
  HEIGHT_UNIT,
  ROUTE_STEP,
  SNOW_FULL,
  STILL_SECONDS,
  TOP_GEAR,
  type GameState,
  type ItemKind,
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
  // The stops go into the same list. A gradient names its colours here rather
  // than as a fill style, and a picture painted entirely in gradients would
  // otherwise look to a test like a picture with no colours in it at all.
  const gradient = {
    addColorStop: (...args: unknown[]) =>
      void calls.push({ name: "addColorStop", args }),
  };
  const canvas = { width: 960, height: 420 };
  /** How wide one character is, as a share of the size the font is set to. */
  const LETTER = 0.5;
  /** The size of the font in force, for measuring with. */
  let size = 10;
  const ctx = new Proxy(
    {},
    {
      get: (_target, prop: string) => {
        if (prop === "canvas") {
          return canvas;
        }
        return (...args: unknown[]) => {
          calls.push({ name: prop, args });
          // Something that can be measured, or every width worked out from a
          // string comes back as `undefined` and the geometry is all NaN.
          if (prop === "measureText") {
            return { width: String(args[0]).length * size * LETTER };
          }
          return gradient;
        };
      },
      set: (_target, prop: string, value: unknown) => {
        if (prop === "font") {
          size = Number.parseFloat(String(value)) || size;
        }
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

/** How wide the canvas is, for telling left of the road from right. */
const WIDE = 960;

/** The bark of a trunk, in both views. */
const BARK = "#6b4a2f";

/**
 * How bright a colour is, on a scale of nought to one.
 *
 * @param tone - the colour, as `#rrggbb`
 * @returns its brightness
 */
function brightness(tone: string): number {
  const channels = [1, 3, 5].map((at) =>
    Number.parseInt(tone.slice(at, at + 2), 16),
  );
  return channels.reduce((sum, each) => sum + each, 0) / (3 * 255);
}

/**
 * The calls that painted the road surface itself.
 *
 * @param calls - what the canvas was asked to do
 * @returns only the calls made while the road colours were in force
 * @remarks
 * The hillside either side of the road is built from flat quads as well, so a
 * measurement of "how wide is the road here" has to know which colour it is
 * looking at.
 */
function onlyRoad(calls: readonly Call[]): Call[] {
  const ROAD = ["#b09265", "#8f7446", "#c6d5e4", "#adbfd2"];
  const kept: Call[] = [];
  let on = false;
  for (const call of calls) {
    if (call.name === "set:fillStyle") {
      on = ROAD.includes(String(call.args[0]));
    }
    if (on) {
      kept.push(call);
    }
  }
  return kept;
}

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
  fog: null,
  bridges: [],
  mud: [],
  chasms: [],
  fellTree: null,
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
    fog: null,
    bridges: [],
    mud: [],
    chasms: [],
    fellTree: null,
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
    // judged from it. Measured on the **road** itself: the hillside beside it
    // is drawn out of flat quads too, and counting those as road would be
    // measuring the wrong thing.
    const { ctx, calls } = recordingContext();
    draw(ctx, seated(), TWO_TREES, -1, -1);
    const widths = bandWidths(onlyRoad(calls));
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

  it("says the speed in figures, with its unit", () => {
    // A needle alone answers "how far round", not "how fast". Two lines,
    // because one wide one ran into the 0 and the 60 at the rim.
    expect(written(atSpeed(10))).toContain("36");
    expect(written(atSpeed(10))).toContain("km/h");
  });

  it("reads a reverse roll as speed, not as a negative number", () => {
    expect(written(atSpeed(-5))).toContain("18");
    expect(written(atSpeed(-5)).join(" ")).not.toContain("-");
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
    expect(written(calls)).not.toContain("km/h");
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

describe("the bear on the screen", () => {
  /** A flat route with a bear standing in the middle of it. */
  const WITH_BEAR: Route = {
    ...TWO_TREES,
    anchors: [],
    items: [],
    bear: ROUTE_STEP * 4,
  };

  /** The side view, with the bear in a given state and the clock at a time. */
  function scene(
    over: {
      hold?: number;
      time?: number;
      walkerAt?: number;
      bearAt?: number;
    } = {},
  ): readonly Call[] {
    const base = standing();
    const at = over.bearAt ?? WITH_BEAR.bear ?? 0;
    const { ctx, calls } = recordingContext();
    draw(
      ctx,
      {
        ...base,
        time: over.time ?? 0,
        rv: { x: at - ROUTE_STEP, v: 0 },
        people: [{ ...base.people[0], at: over.walkerAt ?? at - 4 }],
        bear: { at, hold: over.hold ?? 0, sprayed: 0, gone: false },
      },
      WITH_BEAR,
      -1,
      -1,
    );
    return calls;
  }

  /** How many claws were actually painted. */
  function clawsIn(calls: readonly Call[]): number {
    let colour = "";
    let claws = 0;
    for (const call of calls) {
      if (call.name === "set:fillStyle") {
        colour = String(call.args[0]);
      }
      if (call.name === "fill" && colour === "#e8e0d2") {
        claws += 1;
      }
    }
    return claws;
  }

  /** Every rotation the canvas was asked to make. */
  function turns(calls: readonly Call[]): number[] {
    return calls
      .filter((call) => call.name === "rotate")
      .map((call) => Number(call.args[0]));
  }

  /** Where things were moved to, as x offsets. */
  function shifts(calls: readonly Call[]): number[] {
    return calls
      .filter((call) => call.name === "translate")
      .map((call) => Number(call.args[0]));
  }

  it("stands square on all fours while it has nobody", () => {
    // Flat ground, so the only rotation would be the bear rearing. (Comparing
    // against zero rather than the array: a negative zero is still square.)
    expect(turns(scene()).every((angle) => angle === 0)).toBe(true);
  });

  it("swings a paw the moment it has hold of somebody", () => {
    const attacking = turns(scene({ hold: 0.5 }));
    expect(attacking.some((angle) => angle !== 0)).toBe(true);
    // Claws, so the blow reads as a blow and not as a stick waving about.
    // Counted, not merely coloured: the colour is set before the loop that
    // draws them, so setting it proves nothing on its own.
    expect(clawsIn(scene({ hold: 0.5 }))).toBeGreaterThan(0);
    expect(clawsIn(scene())).toBe(0);
  });

  it("swings the paw through an arc rather than holding it out", () => {
    // The angle at two instants of one strike has to differ, or the paw is
    // simply a limb stuck out in front.
    const early = turns(scene({ hold: 0.5, time: 0 }));
    const later = turns(scene({ hold: 0.5, time: 0.2 }));
    expect(later).not.toEqual(early);
  });

  it("keeps moving while it attacks, and stands still when it does not", () => {
    // Two instants a fraction apart: attacking, the picture has to differ.
    const early = shifts(scene({ hold: 0.5, time: 0 }));
    const later = shifts(scene({ hold: 0.5, time: 0.17 }));
    expect(later).not.toEqual(early);

    const restingEarly = shifts(scene({ time: 0 }));
    const restingLater = shifts(scene({ time: 0.17 }));
    expect(restingLater).toEqual(restingEarly);
  });

  /** Where the paws were put down, across the canvas. */
  function paws(calls: readonly Call[]): number[] {
    let colour = "";
    const feet: number[] = [];
    for (const call of calls) {
      if (call.name === "set:fillStyle") {
        colour = String(call.args[0]);
      }
      if (call.name === "roundRect" && (colour === PAW || colour === FAR)) {
        feet.push(Number(call.args[0]));
      }
    }
    return feet;
  }

  /** The pale near paw, the shaded far side, the muzzle and the nose. */
  const PAW = "#6b4d38";
  const FAR = "#33241a";
  const MUZZLE = "#8a6a4e";
  const SNOUT = "#1d1512";

  it("stands on four legs, two of them in its own shadow", () => {
    // Two legs is a pantomime horse seen end-on. The far pair is darker, so
    // that there is an animal between the two pairs.
    expect(paws(scene())).toHaveLength(4);
    expect(usedColour(scene(), FAR)).toBe(true);
  });

  it("has a muzzle on it, and a nose on the end of that", () => {
    // What tells a bear from a boulder with ears: the long pale snout.
    expect(usedColour(scene(), MUZZLE)).toBe(true);
    expect(usedColour(scene(), SNOUT)).toBe(true);
  });

  it("walks in step with the ground it covers", () => {
    // The legs swing by **where** it is, not by what time it is - a bear that
    // paddles its legs while standing still is a bear on a treadmill. Two
    // places, one a whole stride apart from the other and one half of one.
    const spread = (at: number): number => {
      const feet = paws(scene({ bearAt: at }));
      return Math.max(...feet) - Math.min(...feet);
    };
    const square = 1.1111 * 29;
    expect(spread(square + 0.2778)).toBeGreaterThan(spread(square) + 1);
  });

  it("turns to face whoever is on foot", () => {
    /** Which way round the bear was drawn. */
    const facing = (calls: readonly Call[]) =>
      calls
        .filter((call) => call.name === "scale")
        .map((call) => Number(call.args[0]));
    const bearAt = WITH_BEAR.bear ?? 0;
    expect(facing(scene({ walkerAt: bearAt + 8 }))).toContain(1);
    expect(facing(scene({ walkerAt: bearAt - 8 }))).toContain(-1);
  });
});

describe("the bear seen from the seat", () => {
  /** A flat road with a bear standing on it, seen through the windscreen. */
  const AHEAD: Route = {
    ...TWO_TREES,
    anchors: [],
    items: [],
    sections: [],
    bear: ROUTE_STEP * 4,
  };

  /** Everything the cab drew, with the bear that far ahead. */
  function fromSeat(): readonly Call[] {
    const base = seated();
    const at = AHEAD.bear ?? 0;
    const { ctx, calls } = recordingContext();
    draw(
      ctx,
      { ...base, bear: { at, hold: 0, sprayed: 0, gone: false } },
      AHEAD,
      -1,
      -1,
    );
    return calls;
  }

  it("faces you with a head rather than a stack of circles", () => {
    // Head-on it was three brown discs. Ears set wide, a pale blunt muzzle
    // and two small eyes are what nobody takes for a boulder.
    expect(usedColour(fromSeat(), "#8a6a4e")).toBe(true);
    expect(usedColour(fromSeat(), "#1d1512")).toBe(true);
  });

  it("has a side the light is not on", () => {
    // A flat brown blob has no front and no sides; the shading is what says
    // "that is a body, and it is facing you". Found as the shaded slab laid
    // over the chest and clipped to it - the far leg and the far ear are in
    // the same colour, so the colour alone proves nothing.
    let tone = "";
    let shaded = 0;
    for (const call of fromSeat()) {
      if (call.name === "set:fillStyle") {
        tone = String(call.args[0]);
      } else if (call.name === "fillRect" && tone === "#33241a") {
        shaded += 1;
      }
    }
    expect(shaded).toBeGreaterThan(0);
  });

  it("is gone from the road once it has been driven off", () => {
    const base = seated();
    const at = AHEAD.bear ?? 0;
    const { ctx, calls } = recordingContext();
    draw(
      ctx,
      { ...base, bear: { at, hold: 0, sprayed: 0, gone: true } },
      AHEAD,
      -1,
      -1,
    );
    expect(usedColour(calls, "#8a6a4e")).toBe(false);
  });
});

describe("what the driver has in their hands", () => {
  /** The side view of somebody holding a thing, with the job part done. */
  function holding(kind: "hammer" | "tyres" | null, repair = 0, time = 0) {
    const base = standing();
    const { ctx, calls } = recordingContext();
    draw(
      ctx,
      {
        ...base,
        repair,
        time,
        people: [
          {
            ...base.people[0],
            carrying: kind === null ? [] : [kind],
            holding: kind,
          },
        ],
      },
      TWO_TREES,
      -1,
      -1,
    );
    return calls;
  }

  /** Every rotation the canvas was asked to make. */
  const turns = (calls: readonly Call[]) =>
    calls
      .filter((call) => call.name === "rotate")
      .map((call) => Number(call.args[0]));

  it("turns the tyre while it is being fitted", () => {
    // A tyre that hangs motionless in the hands says nothing about whether
    // holding the key is doing anything.
    const early = turns(holding("tyres", 0.2));
    const later = turns(holding("tyres", 0.6));
    expect(later).not.toEqual(early);
  });

  it("turns with the work rather than with a clock", () => {
    // Held down, it turns; let go, it stops dead. A spin driven by the clock
    // would keep going and say "still working" when nothing is happening.
    expect(turns(holding("tyres", 0.4, 0))).toEqual(
      turns(holding("tyres", 0.4, 9)),
    );
  });

  it("shows nothing in the hand that is only in the bag", () => {
    // The bag is not the hand, and the picture has to agree with the rules.
    const base = standing();
    const { ctx, calls } = recordingContext();
    draw(
      ctx,
      {
        ...base,
        repair: 0.5,
        people: [
          {
            ...base.people[0],
            carrying: ["remote", "tyres", "hammer"],
            holding: "remote",
          },
        ],
      },
      TWO_TREES,
      -1,
      -1,
    );
    // Neither the tyre nor the hammer: both are in the bag, and the picture
    // has to agree with the rules about which of them can be used.
    expect(turns(calls)).toEqual(turns(holding(null, 0)));
  });

  it("swings the hammer only when it is the thing in hand", () => {
    expect(turns(holding("hammer", 0.3))).not.toEqual(
      turns(holding(null, 0.3)),
    );
  });
});

describe("the jerrycan in the hands", () => {
  /** Every rotation the canvas was asked to make. */
  const spins = (calls: readonly Call[]) =>
    calls
      .filter((call) => call.name === "rotate")
      .map((call) => Number(call.args[0]));

  /** The side view of somebody holding the can, with the job part done. */
  function pouring(repair: number, time = 0): readonly Call[] {
    const base = standing();
    const { ctx, calls } = recordingContext();
    draw(
      ctx,
      {
        ...base,
        repair,
        time,
        people: [{ ...base.people[0], carrying: ["can"], holding: "can" }],
      },
      TWO_TREES,
      -1,
      -1,
    );
    return calls;
  }

  it("tips further over as the tank fills", () => {
    const early = spins(pouring(0.5));
    const late = spins(pouring(3));
    expect(late).not.toEqual(early);
  });

  it("stands upright before the pouring starts", () => {
    // Carried level, poured upside down: the difference is the whole animation.
    expect(spins(pouring(0)).every((angle) => angle === 0)).toBe(true);
  });

  it("tips with the work rather than with a clock", () => {
    expect(spins(pouring(1.5, 0))).toEqual(spins(pouring(1.5, 8)));
  });
});

describe("the mountains behind the drive", () => {
  const RANGE_FAR = "#a9c2d8";
  const RANGE_NEAR = "#93ae9b";
  const RANGE_SNOW = "#eef4fa";

  /**
   * Where the canvas drew lines, for a walker standing at a given metre.
   *
   * @param at - where they stand, in metres
   * @param colour - which range to collect, by the colour set before it
   * @returns the x coordinates of that range's line
   */
  function skyline(at: number, colour: string): number[] {
    const base = standing();
    const { ctx, calls } = recordingContext();
    draw(
      ctx,
      { ...base, rv: { x: at, v: 0 }, people: [{ ...base.people[0], at }] },
      TWO_TREES,
      -1,
      -1,
    );
    const found: number[] = [];
    let current = "";
    for (const call of calls) {
      if (call.name === "set:fillStyle") {
        current = String(call.args[0]);
      }
      if (call.name === "lineTo" && current === colour) {
        found.push(Number(call.args[0]));
      }
    }
    return found;
  }

  it("has two ranges, one behind the other", () => {
    const { ctx, calls } = recordingContext();
    draw(ctx, standing(), TWO_TREES, -1, -1);
    expect(usedColour(calls, RANGE_FAR)).toBe(true);
    expect(usedColour(calls, RANGE_NEAR)).toBe(true);
  });

  it("caps the far summits with snow", () => {
    // Counting what was **painted**, not merely which colour was set: the
    // colour is chosen before the loop that decides whether any summit stands
    // high enough, so setting it proves nothing on its own.
    const { ctx, calls } = recordingContext();
    draw(ctx, standing(), TWO_TREES, -1, -1);
    let colour = "";
    let caps = 0;
    for (const call of calls) {
      if (call.name === "set:fillStyle") {
        colour = String(call.args[0]);
      }
      if (call.name === "fill" && colour === RANGE_SNOW) {
        caps += 1;
      }
    }
    expect(caps).toBeGreaterThan(0);
  });

  it("gives the summits different heights, so they are landmarks", () => {
    // All of them the same height is a saw blade, and a saw blade tells you as
    // little about where you are as a flat line does.
    const base = standing();
    const { ctx, calls } = recordingContext();
    draw(ctx, base, TWO_TREES, -1, -1);
    let colour = "";
    const tops: number[] = [];
    for (const call of calls) {
      if (call.name === "set:fillStyle") {
        colour = String(call.args[0]);
      }
      if (call.name === "lineTo" && colour === RANGE_FAR) {
        tops.push(Number(call.args[1]));
      }
    }
    expect(new Set(tops).size).toBeGreaterThan(2);
  });

  it("moves as you move, so there is something to judge motion against", () => {
    // The whole point. A backdrop that stood still made a bear walking at you
    // look exactly like you walking at the bear.
    const here = skyline(0, RANGE_NEAR);
    const there = skyline(40, RANGE_NEAR);
    expect(there).not.toEqual(here);
  });

  it("moves the far range less than the near one", () => {
    // Depth comes from the difference in speed, not from either of them alone.
    //
    // A short step on purpose: the ranges are drawn summit by summit, and once
    // the camera has moved far enough for a new summit to come into the window
    // the first line belongs to a different mountain. Ten metres keeps both
    // windows still, so the two numbers really are the same peak twice.
    const step = 10;
    const farShift = skyline(0, RANGE_FAR)[0] - skyline(step, RANGE_FAR)[0];
    const nearShift = skyline(0, RANGE_NEAR)[0] - skyline(step, RANGE_NEAR)[0];
    expect(Math.abs(farShift)).toBeGreaterThan(0);
    expect(Math.abs(farShift)).toBeLessThan(Math.abs(nearShift));
  });

  it("puts the same mountains on the same stretch of road", () => {
    // A landmark that moved about would be worse than no landmark at all.
    expect(skyline(120, RANGE_FAR)).toEqual(skyline(120, RANGE_FAR));
  });
});

describe("the horizon from the driver's seat", () => {
  const RIDGE = "#9fbcae";
  const RIDGE_SNOW = "#eef4fa";

  /**
   * The horizon line, driving at a given metre.
   *
   * @param at - where the motorhome stands, in metres
   * @param axis - 0 for where the summits are, 1 for how tall they are
   * @returns those coordinates, in the order they were drawn
   */
  function horizon(at: number, axis: 0 | 1 = 1): number[] {
    const base = seated();
    const { ctx, calls } = recordingContext();
    draw(ctx, { ...base, rv: { x: at, v: 0 } }, TWO_TREES, -1, -1);
    const found: number[] = [];
    let colour = "";
    for (const call of calls) {
      if (call.name === "set:fillStyle") {
        colour = String(call.args[0]);
      }
      if (call.name === "lineTo" && colour === RIDGE) {
        found.push(Number(call.args[axis]));
      }
    }
    return found;
  }

  it("has summits rather than one smooth line", () => {
    // A wave looks the same everywhere; summits are something to pick out.
    expect(new Set(horizon(0)).size).toBeGreaterThan(2);
  });

  it("carries snow, like the mountains seen from outside", () => {
    // Counting caps actually painted: the colour is set before the loop that
    // decides whether any summit is high enough, so setting it proves nothing.
    const { ctx, calls } = recordingContext();
    draw(ctx, seated(), TWO_TREES, -1, -1);
    let colour = "";
    let caps = 0;
    for (const call of calls) {
      if (call.name === "set:fillStyle") {
        colour = String(call.args[0]);
      }
      if (call.name === "fill" && colour === RIDGE_SNOW) {
        caps += 1;
      }
    }
    expect(caps).toBeGreaterThan(0);
  });

  it("goes past as the motorhome gets on", () => {
    // Driving with nothing moving on the horizon is driving on a treadmill.
    // Measured across, not up: the same summits keep the same heights as they
    // drift by, and it is the drifting that says you are getting somewhere.
    expect(horizon(60, 0)).not.toEqual(horizon(0, 0));
  });
});

describe("the remote and the spray in the hands", () => {
  const LAMP_ON = "#ff5a3c";
  const LAMP_OFF = "#5a4038";
  const MIST = "#ffffffb0";

  /** The side view of somebody holding a thing, with the world as given. */
  function inHand(
    kind: "remote" | "spray",
    world: Partial<GameState> = {},
  ): readonly Call[] {
    const base = standing();
    const { ctx, calls } = recordingContext();
    draw(
      ctx,
      {
        ...base,
        ...world,
        people: [{ ...base.people[0], carrying: [kind], holding: kind }],
      },
      TWO_TREES,
      -1,
      -1,
    );
    return calls;
  }

  it("lights the remote only while the winch is actually running", () => {
    // The rope moves over there and the hand does nothing visible, so without
    // the lamp a player holding the key cannot tell whether it is working.
    expect(usedColour(inHand("remote", { winch: 0, time: 0 }), LAMP_ON)).toBe(
      false,
    );
    expect(usedColour(inHand("remote", { winch: 1, time: 0.1 }), LAMP_ON)).toBe(
      true,
    );
  });

  it("blinks rather than glowing steadily", () => {
    // Two instants of one second: on at the first, dark at the second.
    expect(usedColour(inHand("remote", { winch: 1, time: 0.1 }), LAMP_ON)).toBe(
      true,
    );
    expect(usedColour(inHand("remote", { winch: 1, time: 0.2 }), LAMP_ON)).toBe(
      false,
    );
    expect(
      usedColour(inHand("remote", { winch: 1, time: 0.2 }), LAMP_OFF),
    ).toBe(true);
  });

  it("throws mist only while the can is going off at a bear", () => {
    const idle = { at: 40, hold: 0, sprayed: 0, gone: false };
    expect(usedColour(inHand("spray", { bear: idle }), MIST)).toBe(false);
    expect(
      usedColour(inHand("spray", { bear: { ...idle, sprayed: 1 } }), MIST),
    ).toBe(true);
  });

  it("throws no mist where there is no bear at all", () => {
    expect(usedColour(inHand("spray", { bear: null }), MIST)).toBe(false);
  });
});

describe("driving in the fog", () => {
  const FOG = "#d8dee3";

  /** A route whose far half is closed in. */
  const FOGGY: Route = {
    ...TWO_TREES,
    fog: { from: ROUTE_STEP * 4, to: ROUTE_STEP * 40 },
  };

  /** The side view from a given metre, on a route with or without fog. */
  function outside(at: number, route: Route): readonly Call[] {
    const base = standing();
    const { ctx, calls } = recordingContext();
    draw(
      ctx,
      { ...base, rv: { x: at, v: 0 }, people: [{ ...base.people[0], at }] },
      route,
      -1,
      -1,
    );
    return calls;
  }

  it("closes in only once you are inside it", () => {
    expect(usedColour(outside(0, FOGGY), FOG)).toBe(false);
    expect(usedColour(outside(ROUTE_STEP * 6, FOGGY), FOG)).toBe(true);
  });

  it("leaves a route without fog alone", () => {
    expect(usedColour(outside(ROUTE_STEP * 6, TWO_TREES), FOG)).toBe(false);
  });

  it("thickens with distance rather than dimming everything alike", () => {
    // One flat wash would darken the picture without hiding the hill ahead,
    // and the hill is exactly what has to go.
    const shades = outside(ROUTE_STEP * 6, FOGGY)
      .filter((call) => call.name === "set:globalAlpha")
      .map((call) => Number(call.args[0]))
      .filter((alpha) => alpha > 0 && alpha < 1);
    expect(new Set(shades).size).toBeGreaterThan(3);
  });

  it("closes the windscreen in too, but leaves the instruments readable", () => {
    const base = seated();
    const { ctx, calls } = recordingContext();
    draw(ctx, { ...base, rv: { x: ROUTE_STEP * 6, v: 10 } }, FOGGY, -1, -1);
    expect(usedColour(calls, FOG)).toBe(true);
    // The dial is drawn after the fog, so the needle still says what it says.
    const fogAt = calls.findIndex((call) => call.args[0] === FOG);
    const dialAt = calls.findIndex((call) => call.args[0] === "#e8e2d6");
    expect(dialAt).toBeGreaterThan(fogAt);
  });
});

describe("the figure in the fog", () => {
  /** How wide the canvas is. */
  const CANVAS_WIDE = 960;

  /** Where the player is put on screen, and how many pixels a metre is. */
  const DRIVER_X = 250;
  const SCALE = 13;

  /** How tall a grown person is, in metres. */
  const PERSON_TALL = 1.8;

  /** Part of the way through the count, well past his first showing. */
  const PART_WAY = 0.7;

  /** How solid he is by then: half of the way from his first showing to full. */
  const HALF_SHOWN = 0.5;

  /** The black he is painted in, head and all. */
  const SLENDER = "#1b1d20";

  /** The grey he steps out of. */
  const FOG = "#d8dee3";

  /** Flat road, closed in from the very first metre. */
  const FOGGY: Route = {
    ...TWO_TREES,
    anchors: [],
    fog: { from: 0, to: ROUTE_STEP * 100 },
    bridges: [],
    mud: [],
    chasms: [],
    fellTree: null,
  };

  /** Standing beside the motorhome, having stood there this long. */
  function stood(seconds: number): GameState {
    return { ...standing(), still: seconds };
  }

  /** How often the canvas was filled while a colour was in force. */
  function fillsIn(calls: readonly Call[], colour: string): number {
    let now = "";
    let fills = 0;
    for (const call of calls) {
      if (call.name === "set:fillStyle") {
        now = String(call.args[0]);
      }
      if (
        (call.name === "fill" || call.name === "fillRect") &&
        now === colour
      ) {
        fills++;
      }
    }
    return fills;
  }

  /**
   * How see-through he was painted.
   *
   * @param calls - what the canvas was asked to do
   * @returns the transparency in force when his body was filled
   * @remarks
   * The last one set **before** his colour, not the largest of them all: the
   * fog sets a transparency for every band it paints, and measuring one of
   * those would pass whatever he was drawn like.
   */
  function shownAt(calls: readonly Call[]): number {
    let alpha = 1;
    for (const call of calls) {
      if (call.name === "set:globalAlpha") {
        alpha = Number(call.args[0]);
      }
      if (call.name === "set:fillStyle" && call.args[0] === SLENDER) {
        return alpha;
      }
    }
    return Number.NaN;
  }

  it("stays away while nobody has stood about", () => {
    const { ctx, calls } = recordingContext();
    draw(ctx, stood(0), FOGGY, -1, -1);
    expect(fillsIn(calls, SLENDER)).toBe(0);
    // The fog itself is there from the first metre, so this proves he is
    // missing and not merely that nothing was drawn at all.
    expect(fillsIn(calls, FOG)).toBeGreaterThan(0);
  });

  it("is there once the count has run up", () => {
    const { ctx, calls } = recordingContext();
    draw(ctx, stood(STILL_SECONDS), FOGGY, -1, -1);
    // Body, both of those arms, and the head on top of them.
    expect(fillsIn(calls, SLENDER)).toBe(4);
  });

  it("thickens as the seconds run out", () => {
    const half = recordingContext();
    draw(half.ctx, stood(STILL_SECONDS * PART_WAY), FOGGY, -1, -1);
    const full = recordingContext();
    draw(full.ctx, stood(STILL_SECONDS), FOGGY, -1, -1);
    const faint = shownAt(half.calls);
    const solid = shownAt(full.calls);
    // He starts out of nothing at four seconds' worth of standing and is all
    // there at five, so seven tenths of the way through he is half there.
    expect(faint).toBeCloseTo(HALF_SHOWN);
    expect(solid).toBeGreaterThan(faint);
    // All there at the last second: by then he is the whole warning.
    expect(solid).toBe(1);
  });

  it("stands in front of the fog, not behind it", () => {
    // Painted first he would be a shape nobody ever saw.
    const { ctx, calls } = recordingContext();
    draw(ctx, stood(STILL_SECONDS), FOGGY, -1, -1);
    const lastFog = calls.findLastIndex((call) => call.args[0] === FOG);
    const him = calls.findIndex((call) => call.args[0] === SLENDER);
    expect(lastFog).toBeGreaterThan(0);
    expect(him).toBeGreaterThan(lastFog);
  });

  it("stands ahead of the player and towers over one", () => {
    const { ctx, calls } = recordingContext();
    draw(ctx, stood(STILL_SECONDS), FOGGY, -1, -1);
    const at = calls
      .filter((call) => call.name === "translate")
      .map((call) => Number(call.args[0]));
    // Down the road, past where the player stands - never behind them, and
    // never so far off that he is out of the picture altogether.
    expect(Math.max(...at)).toBeGreaterThan(DRIVER_X);
    expect(Math.max(...at)).toBeLessThan(CANVAS_WIDE);

    let colour = "";
    const tall: number[] = [];
    for (const call of calls) {
      if (call.name === "set:fillStyle") {
        colour = String(call.args[0]);
      }
      if (call.name === "roundRect" && colour === SLENDER) {
        tall.push(Number(call.args[3]));
      }
    }
    // Taller than any person on the road: that is what gives him away.
    expect(Math.max(...tall)).toBeGreaterThan(PERSON_TALL * SCALE);
  });

  it("keeps out of a clear section however long you stand there", () => {
    const { ctx, calls } = recordingContext();
    draw(ctx, stood(STILL_SECONDS), TWO_TREES, -1, -1);
    expect(fillsIn(calls, SLENDER)).toBe(0);
  });
});

describe("how the cab is laid out", () => {
  /** The canvas the game draws on. */
  const WIDE = 960;
  const HIGH = 420;

  /** The dark of the instrument rim - and of the gear plate beside it. */
  const INSTRUMENT = "#141210";

  /** The dark the scale marks are drawn in. */
  const TICK = "#3a342e";

  /** How far the scale keeps off the ends, as a share of the arch's height. */
  const SCALE_GAP = 0.2;

  /** How much of the arch the scale still covers, all the same. */
  const SCALE_SPAN = 0.85;

  /** An ellipse the renderer drew: where, how big, and how far round. */
  type Ring = {
    readonly x: number;
    readonly y: number;
    readonly rx: number;
    readonly ry: number;
    readonly from: number;
    readonly to: number;
  };

  /** Every ellipse drawn, in the order they were drawn. */
  function rings(calls: readonly Call[]): Ring[] {
    return calls
      .filter((call) => call.name === "ellipse")
      .map((call) => ({
        x: Number(call.args[0]),
        y: Number(call.args[1]),
        rx: Number(call.args[2]),
        ry: Number(call.args[3]),
        from: Number(call.args[5]),
        to: Number(call.args[6]),
      }));
  }

  /** What the cab drew this time. */
  function cab(): Ring[] {
    const { ctx, calls } = recordingContext();
    draw(ctx, seated(), TWO_TREES, -1, -1);
    return rings(calls);
  }

  /** The steering wheel: the one ring drawn all the way round. */
  function wheelOf(all: readonly Ring[]): Ring {
    const found = all.find((ring) => ring.to - ring.from >= Math.PI * 2);
    expect(found).toBeDefined();
    return found as Ring;
  }

  /** The speedometer: the widest of the half-turn arches. */
  function dialOf(all: readonly Ring[]): Ring {
    const arches = all.filter((ring) => ring.to - ring.from < Math.PI * 2);
    expect(arches.length).toBeGreaterThan(0);
    return arches.reduce((big, ring) => (ring.rx > big.rx ? ring : big));
  }

  /** How far a point lies inside a ring: under 1 is inside, over 1 outside. */
  function within(ring: Ring, x: number, y: number): number {
    return ((x - ring.x) / ring.rx) ** 2 + ((y - ring.y) / ring.ry) ** 2;
  }

  it("draws the speedometer as an arch, not as a clock", () => {
    const dial = dialOf(cab());
    // Half a turn, over the top - a rainbow rather than a full circle.
    expect(dial.from).toBeCloseTo(Math.PI);
    expect(dial.to).toBeCloseTo(Math.PI * 2);
    // And wide for its height, or it would be a clock with its bottom cut off.
    expect(dial.rx).toBeGreaterThan(dial.ry * 2);
  });

  it("leaves room at both ends before the scale starts", () => {
    // The 0 and the 60 used to sit on the very corners of the arch, where
    // there is no face left above them and a number reads as pushed off the
    // edge. The scale is held back from both ends now.
    const { ctx, calls } = recordingContext();
    draw(ctx, seated(), TWO_TREES, -1, -1);
    const dial = dialOf(rings(calls));

    let colour = "";
    const ticks: { readonly x: number; readonly y: number }[] = [];
    for (const call of calls) {
      if (call.name === "set:strokeStyle") {
        colour = String(call.args[0]);
      }
      if (
        (call.name === "moveTo" || call.name === "lineTo") &&
        colour === TICK
      ) {
        ticks.push({ x: Number(call.args[0]), y: Number(call.args[1]) });
      }
    }
    expect(ticks.length).toBeGreaterThan(0);

    // Every mark stands above the line the arch springs from, first and last
    // included - that gap is the room being asked for.
    const lowest = Math.max(...ticks.map((tick) => tick.y));
    expect(dial.y - lowest).toBeGreaterThan(dial.ry * SCALE_GAP);
    // But the scale still uses most of the arch, or the room would have been
    // bought by shrinking the instrument to a stub.
    const spread =
      Math.max(...ticks.map((t) => t.x)) - Math.min(...ticks.map((t) => t.x));
    expect(spread).toBeGreaterThan(dial.rx * 2 * SCALE_SPAN);
  });

  it("puts the wheel round the speedometer", () => {
    const all = cab();
    const wheel = wheelOf(all);
    const dial = dialOf(all);
    expect(wheel.rx).toBeGreaterThan(dial.rx);
    // Both upper corners of the arch stand inside the rim, which is what
    // "the wheel goes round the dial" means when you have to check it.
    expect(within(wheel, dial.x - dial.rx, dial.y - dial.ry)).toBeLessThan(1);
    expect(within(wheel, dial.x + dial.rx, dial.y - dial.ry)).toBeLessThan(1);
    // Its hub is off the bottom of the picture, the way a wheel looks from
    // behind it.
    expect(wheel.y).toBeGreaterThan(HIGH);
  });

  it("keeps the whole arch on the canvas", () => {
    const dial = dialOf(cab());
    expect(dial.y).toBeLessThan(HIGH);
    expect(dial.x - dial.rx).toBeGreaterThan(0);
    expect(dial.x + dial.rx).toBeLessThan(WIDE);
    expect(dial.y - dial.ry).toBeGreaterThan(0);
  });

  it("puts the gear lever out to the right, clear of the dial", () => {
    const { ctx, calls } = recordingContext();
    draw(ctx, seated(), TWO_TREES, -1, -1);
    const dial = dialOf(rings(calls));

    let colour = "";
    const plates: { readonly left: number; readonly right: number }[] = [];
    for (const call of calls) {
      if (call.name === "set:fillStyle") {
        colour = String(call.args[0]);
      }
      if (call.name === "roundRect" && colour === INSTRUMENT) {
        plates.push({
          left: Number(call.args[0]),
          right: Number(call.args[0]) + Number(call.args[2]),
        });
      }
    }
    expect(plates.length).toBe(1);
    // Right of the middle, and past the dial: reaching for the lever must not
    // mean reaching across the speedometer.
    expect(plates[0].left).toBeGreaterThan(dial.x + dial.rx);
    expect(plates[0].right).toBeLessThan(WIDE);
  });

  it("gives the passenger neither of them", () => {
    // Sitting in the other seat, not standing in the road: the passenger sees
    // the same windscreen and no instruments at all.
    const beside = seated();
    const { ctx, calls } = recordingContext();
    draw(
      ctx,
      { ...beside, people: [beside.people[0], beside.people[0]] },
      TWO_TREES,
      -1,
      -1,
      1,
    );
    expect(usedColour(calls, INSTRUMENT)).toBe(false);
    expect(
      rings(calls).some((ring) => ring.to - ring.from >= Math.PI * 2),
    ).toBe(false);
  });
});

describe("the figure in the fog, seen from the cab", () => {
  /** The black he is painted in, and the grey he steps out of. */
  const SLENDER = "#1b1d20";
  const FOG = "#d8dee3";

  /** Flat road, closed in from the very first metre. */
  const FOGGY: Route = {
    ...TWO_TREES,
    anchors: [],
    fog: { from: 0, to: ROUTE_STEP * 100 },
    bridges: [],
    mud: [],
    chasms: [],
    fellTree: null,
  };

  /**
   * How tall he may come out on the windscreen, in pixels.
   *
   * @remarks
   * Both ends matter. Too far off and he is a smudge; close enough to loom
   * over the bonnet and he is a portrait rather than a figure down the road,
   * which is a jump scare and not the slow warning this is meant to be.
   */
  const CAB_LEAST_TALL = 45;
  const CAB_MOST_TALL = 150;

  /** Behind the wheel, having stood still this long. */
  function waited(seconds: number): GameState {
    return { ...seated(), still: seconds };
  }

  /** How often the canvas was filled while a colour was in force. */
  function fills(calls: readonly Call[], colour: string): number {
    let now = "";
    let count = 0;
    for (const call of calls) {
      if (call.name === "set:fillStyle") {
        now = String(call.args[0]);
      }
      if (
        (call.name === "fill" || call.name === "fillRect") &&
        now === colour
      ) {
        count++;
      }
    }
    return count;
  }

  /** Where a colour was first set, or -1. */
  function firstAt(calls: readonly Call[], colour: string): number {
    return calls.findIndex((call) => call.args[0] === colour);
  }

  /** What the cab drew with the count standing at that many seconds. */
  function cab(seconds: number, route: Route = FOGGY) {
    const { ctx, calls } = recordingContext();
    draw(ctx, waited(seconds), route, -1, -1);
    return calls;
  }

  it("shows him through the windscreen too", () => {
    // Sitting in the vehicle is no way out of the rule, so it must be no way
    // out of the warning: body, both arms and the head, the same as outside.
    expect(fills(cab(STILL_SECONDS), SLENDER)).toBe(4);
  });

  it("leaves the road empty while nobody has stood about", () => {
    expect(fills(cab(0), SLENDER)).toBe(0);
  });

  it("stands near enough to be made out", () => {
    // Projected down the road he shrinks with the distance, and a figure put
    // far enough off is a smudge nobody reads as a figure at all.
    let colour = "";
    const tall: number[] = [];
    for (const call of cab(STILL_SECONDS)) {
      if (call.name === "set:fillStyle") {
        colour = String(call.args[0]);
      }
      if (call.name === "fillRect" && colour === SLENDER) {
        tall.push(Number(call.args[3]));
      }
    }
    expect(Math.max(...tall)).toBeGreaterThan(CAB_LEAST_TALL);
    // And not so near that he looms over the bonnet.
    expect(Math.max(...tall)).toBeLessThan(CAB_MOST_TALL);
  });

  it("keeps him out of a section that has no fog", () => {
    expect(fills(cab(STILL_SECONDS, TWO_TREES), SLENDER)).toBe(0);
  });

  it("puts him in front of the fog and behind the dashboard", () => {
    const calls = cab(STILL_SECONDS);
    const him = firstAt(calls, SLENDER);
    expect(him).toBeGreaterThan(firstAt(calls, FOG));
    // The instruments stay on top of him: a figure painted over the
    // speedometer would take away the one thing still worth reading.
    expect(firstAt(calls, DASHBOARD)).toBeGreaterThan(him);
  });

  it("thickens with the count here as well", () => {
    let alpha = 1;
    for (const call of cab(STILL_SECONDS * 0.7)) {
      if (call.name === "set:globalAlpha") {
        alpha = Number(call.args[0]);
      }
      if (call.name === "set:fillStyle" && call.args[0] === SLENDER) {
        break;
      }
    }
    expect(alpha).toBeCloseTo(0.5);
  });
});

describe("a jumping figure", () => {
  /** The pale of the driver's face, drawn once per person. */
  const SKIN = "#f0c9a4";

  /** How many pixels a metre is worth in the side view, and how tall it is. */
  const PER_METRE = 13;
  const CANVAS_HIGH = 420;

  /** Standing beside the motorhome, this far off the ground. */
  function upBy(lift: number): GameState {
    const state = standing();
    return { ...state, people: [{ ...state.people[0], lift }] };
  }

  /**
   * How far down the canvas the figure was drawn.
   *
   * @param state - the world to draw
   * @returns the y of the frame the figure is painted in
   * @remarks
   * The whole figure goes into one translated frame, so the frame is what
   * moves - the last translate before the face colour is set.
   */
  function faceY(state: GameState): number {
    const { ctx, calls } = recordingContext();
    draw(ctx, state, TWO_TREES, -1, -1);
    // Follows save and restore as the canvas does: every part of the picture
    // paints inside its own frame, and only the figure's own moves count.
    const stack: number[] = [];
    let now = 0;
    for (const call of calls) {
      if (call.name === "save") {
        stack.push(now);
      }
      if (call.name === "restore") {
        now = stack.pop() ?? 0;
      }
      if (call.name === "translate") {
        now += Number(call.args[1]);
      }
      if (call.name === "set:fillStyle" && call.args[0] === SKIN) {
        return now;
      }
    }
    return Number.NaN;
  }

  it("stands on the middle of the frame", () => {
    // The drive belongs in the middle of the picture. It used to run a third
    // of the way down, which left it up in the top corner with a great deal
    // of empty hillside underneath.
    expect(faceY(upBy(0))).toBeCloseTo(CANVAS_HIGH / 2, 0);
  });

  it("is drawn higher up the more it is off the ground", () => {
    const down = faceY(upBy(0));
    const up = faceY(upBy(1));
    expect(down).toBeGreaterThan(0);
    // Up the screen is a smaller y, and a metre is worth the same here as it
    // is anywhere else in the picture.
    expect(down - up).toBeCloseTo(PER_METRE, 0);
  });

  it("keeps its legs still while it is in the air", () => {
    // A figure pedalling along a metre above the road reads as a mistake.
    const walking = { ...standing() };
    const strides = (state: GameState) => {
      const { ctx, calls } = recordingContext();
      draw(ctx, state, TWO_TREES, -1, -1);
      return calls.filter((call) => call.name === "rotate").length;
    };
    const onFoot = {
      ...walking,
      people: [{ ...walking.people[0], walking: true, stride: 1 }],
    };
    const inAir = {
      ...onFoot,
      people: [{ ...onFoot.people[0], lift: 1 }],
    };
    expect(strides(inAir)).toBeLessThanOrEqual(strides(onFoot));
  });
});

describe("the bridge", () => {
  /** The timber, the gap under it, and the red edge of its sign. */
  const DECK = "#8a6d4b";
  const GORGE = "#20262d";
  const RAIL = "#7d6142";
  const SIGN_EDGE = "#c0392b";
  const TIMBER = "#6b5236";
  const RIVER = "#3d6d8c";
  const RIVER_LIT = "#5f9cbd";

  /** How tall the side view is, and how wide, for the checks below. */
  const CANVAS_TALL = 420;
  const CANVAS_WIDE = 960;

  /** How far down a post reaches to count as a pier and not a strut, in pixels. */
  const FAR_DOWN = 65;

  /** The lens the driver's view is built with: horizon, eye height, focal. */
  const HORIZON = 0.44;
  const EYE = 2.3;
  const FOCAL = 300;

  /** Flat road with a stretch of bridge just ahead of the motorhome. */
  const CROSSING: Route = {
    ...TWO_TREES,
    anchors: [],
    bridges: [{ from: ROUTE_STEP * 3, to: ROUTE_STEP * 6 }],
    mud: [],
    chasms: [],
    fellTree: null,
  };

  /** Beside the motorhome, a little before the timber. */
  function approaching(): GameState {
    return standing();
  }

  /** Behind the wheel, a little before the timber. */
  function driving(): GameState {
    return seated();
  }

  /** What the side view drew. */
  function fromTheSide(route: Route = CROSSING): Call[] {
    const { ctx, calls } = recordingContext();
    draw(ctx, approaching(), route, -1, -1);
    return calls;
  }

  /**
   * Where a colour was first named, wherever in the call it stood.
   *
   * @param calls - what the canvas was asked to do
   * @param colour - the colour to look for
   * @returns the index of the first call naming it, or -1
   * @remarks
   * Not only as a fill style: the gorge is a gradient, and a gradient names
   * its colours as arguments to `addColorStop` instead.
   */
  function firstNamed(calls: readonly Call[], colour: string): number {
    return calls.findIndex((call) => call.args.includes(colour));
  }

  it("runs a river through the gap under it", () => {
    // The one thing that turns a hole with a plank over it into a bridge:
    // water down there, with a light running along it.
    const calls = fromTheSide();
    expect(usedColour(calls, RIVER)).toBe(true);
    expect(usedColour(calls, RIVER_LIT)).toBe(true);
  });

  it("keeps the water in the picture", () => {
    // A gorge deeper than the canvas is a bridge over a black rectangle that
    // runs off the bottom of the screen, and the river is never seen.
    let tone = "";
    const water: number[] = [];
    for (const call of fromTheSide()) {
      if (call.name === "set:fillStyle") {
        tone = String(call.args[0]);
      } else if (call.name === "fillRect" && tone === RIVER) {
        water.push(Number(call.args[1]));
      }
    }
    expect(water.length).toBeGreaterThan(0);
    for (const top of water) {
      expect(top).toBeLessThan(CANVAS_TALL);
    }
  });

  it("slings an arch under the deck and stands piers in the water", () => {
    // An arch and piers are what a bridge is; a deck alone is a plank.
    let tone = "";
    let arches = 0;
    const deep: number[] = [];
    for (const call of fromTheSide()) {
      if (call.name === "set:fillStyle") {
        tone = String(call.args[0]);
      } else if (tone === TIMBER && call.name === "quadraticCurveTo") {
        arches += 1;
      } else if (tone === TIMBER && call.name === "fillRect") {
        deep.push(Number(call.args[3]));
      }
    }
    expect(arches).toBeGreaterThan(0);
    // Told from the little struts of the arch by how far down they reach: an
    // abutment or a pier goes most of the way to the water, a strut does not.
    expect(deep.filter((tall) => tall > FAR_DOWN).length).toBeGreaterThan(2);
  });

  it("shows the drop and the water from the seat as well", () => {
    // Rails alone made it look like a fenced-off stretch of road. What says
    // bridge is that the ground beside it is gone and there is water below.
    const { ctx, calls } = recordingContext();
    draw(ctx, driving(), CROSSING, -1, -1);
    expect(usedColour(calls, RIVER)).toBe(true);
    // Never across the road: the water is painted per side, or it would run
    // over the very road being driven on.
    let tone = "";
    let patch: number[] = [];
    let patches = 0;
    for (const call of calls) {
      if (call.name === "set:fillStyle") {
        tone = String(call.args[0]);
      } else if (
        tone === RIVER &&
        (call.name === "moveTo" || call.name === "lineTo")
      ) {
        patch.push(Number(call.args[0]) - CANVAS_WIDE / 2);
      } else if (call.name === "fill" && patch.length > 0) {
        patches += 1;
        const left = patch.every((across) => across <= 0);
        const right = patch.every((across) => across >= 0);
        expect(left || right).toBe(true);
        patch = [];
      }
    }
    // One patch of water per side, and neither of them crossing over.
    expect(patches).toBe(2);
  });

  it("does not let anybody see through the deck on the way up to it", () => {
    // Standing short of the bridge, the ground in front of the near lip is in
    // the way: without cutting the gorge off at that line, the wall and the
    // water swept up towards the bonnet and one appeared to be looking
    // **through** the bridge one was driving onto.
    const { ctx, calls } = recordingContext();
    draw(ctx, driving(), CROSSING, -1, -1);
    // Where the near lip of it comes out on the canvas, from the projection
    // this view is built on: the horizon plus the eye over the distance.
    const near = (CROSSING.bridges[0]?.from ?? 0) - driving().rv.x;
    const lip = CANVAS_TALL * HORIZON + (EYE * FOCAL) / near;
    const cut = calls
      .filter((call) => call.name === "rect")
      .map((call) => Number(call.args[3]));
    expect(cut.some((tall) => Math.abs(tall - lip) < 1)).toBe(true);
    // And the cut is a clip, not a box drawn on the picture.
    const at = calls.findIndex(
      (call) =>
        call.name === "rect" && Math.abs(Number(call.args[3]) - lip) < 1,
    );
    expect(calls[at + 1].name).toBe("clip");
  });

  it("gives the canvas back the way it found it", () => {
    // The gorge is drawn inside a clip. A clip left standing would go on
    // cutting everything drawn after it - the signs, the dashboard, the
    // speedometer - and the fault would show up anywhere but here.
    const { ctx, calls } = recordingContext();
    draw(ctx, driving(), CROSSING, -1, -1);
    const saved = calls.filter((call) => call.name === "save").length;
    const back = calls.filter((call) => call.name === "restore").length;
    expect(saved).toBeGreaterThan(0);
    expect(back).toBe(saved);
  });

  it("leaves the seat's view of it alone where there is no bridge", () => {
    const { ctx, calls } = recordingContext();
    draw(ctx, driving(), { ...CROSSING, bridges: [] }, -1, -1);
    expect(usedColour(calls, RIVER)).toBe(false);
  });

  it("paints the timber and the gap under it", () => {
    const calls = fromTheSide();
    expect(usedColour(calls, DECK)).toBe(true);
    expect(firstNamed(calls, GORGE)).toBeGreaterThan(0);
  });

  it("paints the gap first, so the deck lies over it", () => {
    const calls = fromTheSide();
    const gap = firstNamed(calls, GORGE);
    const deck = firstNamed(calls, DECK);
    expect(gap).toBeGreaterThan(0);
    expect(deck).toBeGreaterThan(gap);
  });

  it("stands its sign before it", () => {
    expect(usedColour(fromTheSide(), SIGN_EDGE)).toBe(true);
  });

  it("draws none of it on a road that has no bridge", () => {
    const calls = fromTheSide(TWO_TREES);
    expect(usedColour(calls, DECK)).toBe(false);
    expect(firstNamed(calls, GORGE)).toBe(-1);
    expect(usedColour(calls, SIGN_EDGE)).toBe(false);
  });

  it("shows its rails and its sign from the seat as well", () => {
    // The deck needs no drawing there - it is the road. What says "bridge"
    // through a windscreen is the rail running away on both sides.
    const { ctx, calls } = recordingContext();
    draw(ctx, driving(), CROSSING, -1, -1);
    expect(usedColour(calls, RAIL)).toBe(true);
    expect(usedColour(calls, SIGN_EDGE)).toBe(true);
  });

  it("leaves the driver's view clear where there is no bridge", () => {
    const { ctx, calls } = recordingContext();
    draw(ctx, driving(), TWO_TREES, -1, -1);
    expect(usedColour(calls, RAIL)).toBe(false);
    expect(usedColour(calls, SIGN_EDGE)).toBe(false);
  });
});

describe("the chasm and the tree over it", () => {
  /** The dark of the gap, the trunk, and the ladder up the back door. */
  const GORGE = "#20262d";
  const TRUNK = "#6b4a2f";
  const LADDER = "#8d8578";
  const AXE_HEAD = "#b8bec4";

  /** Flat road with a gap in it and the tree past it. */
  const GAP: Route = {
    ...TWO_TREES,
    anchors: [],
    mud: [],
    chasms: [{ from: ROUTE_STEP * 3, to: ROUTE_STEP * 3 + 4.6 }],
    fellTree: ROUTE_STEP * 4,
    items: [{ at: ROUTE_STEP * 4 + 8, kind: "axe" }],
  };

  /** Where a colour was first named, wherever in the call it stood. */
  function firstNamed(calls: readonly Call[], colour: string): number {
    return calls.findIndex((call) => call.args.includes(colour));
  }

  /** What the side view drew, with the tree standing or down. */
  function drawn(felled: boolean): Call[] {
    const { ctx, calls } = recordingContext();
    draw(ctx, { ...standing(), felled }, GAP, -1, -1);
    return calls;
  }

  it("paints the gap while it is still a gap", () => {
    expect(firstNamed(drawn(false), GORGE)).toBeGreaterThan(0);
  });

  it("keeps painting the gap once the tree is down", () => {
    // The hole does not go away, it gets a trunk over it. One that vanished
    // the moment it was bridged would leave the player wondering what they
    // had just driven across.
    expect(firstNamed(drawn(true), GORGE)).toBeGreaterThan(0);
  });

  it("lays the trunk right across the gap, onto both lips", () => {
    const calls = drawn(true);
    let colour = "";
    const logs: { readonly from: number; readonly to: number }[] = [];
    for (const call of calls) {
      if (call.name === "set:fillStyle") {
        colour = String(call.args[0]);
      }
      if (call.name === "roundRect" && colour === TRUNK) {
        logs.push({
          from: Number(call.args[0]),
          to: Number(call.args[0]) + Number(call.args[2]),
        });
      }
    }
    expect(logs.length).toBe(1);
    // Both ends stand on ground, not on air: the trunk starts before the near
    // lip and ends past the far one.
    const scale = 13;
    const near = logs[0].from;
    const far = logs[0].to;
    expect(far - near).toBeGreaterThan(
      (GAP.chasms[0].to - GAP.chasms[0].from) * scale,
    );
  });

  it("draws the tree either way, standing or lying", () => {
    expect(usedColour(drawn(false), TRUNK)).toBe(true);
    expect(usedColour(drawn(true), TRUNK)).toBe(true);
  });

  it("hangs a ladder on the back of the motorhome", () => {
    // The roof is the only way over the gap, and a roof with no visible way
    // up is a puzzle with a piece missing.
    expect(usedColour(drawn(false), LADDER)).toBe(true);
  });

  it("lays the axe out where it fell", () => {
    expect(usedColour(drawn(false), AXE_HEAD)).toBe(true);
  });

  it("puts the axe in the hand that carries it", () => {
    const state = standing();
    const { ctx, calls } = recordingContext();
    draw(
      ctx,
      {
        ...state,
        people: [{ ...state.people[0], carrying: ["axe"], holding: "axe" }],
      },
      TWO_TREES,
      -1,
      -1,
    );
    expect(usedColour(calls, AXE_HEAD)).toBe(true);
  });
});

describe("the ground under the driver's view", () => {
  /** The canvas, and where the horizon sits on it. */
  const WIDE = 960;
  const HIGH = 420;
  const HORIZON = HIGH * 0.44;

  /** Every rectangle the canvas was asked to fill, with the colour in force. */
  function rects(calls: readonly Call[]) {
    let colour = "";
    const found: {
      readonly colour: string;
      readonly x: number;
      readonly y: number;
      readonly wide: number;
      readonly high: number;
      readonly at: number;
    }[] = [];
    calls.forEach((call, at) => {
      if (call.name === "set:fillStyle") {
        colour = String(call.args[0]);
      }
      if (call.name === "fillRect") {
        found.push({
          colour,
          x: Number(call.args[0]),
          y: Number(call.args[1]),
          wide: Number(call.args[2]),
          high: Number(call.args[3]),
          at,
        });
      }
    });
    return found;
  }

  it("fills everything below the horizon before drawing the road on it", () => {
    // The bug this is here for: the road is a row of bands, and over a crest
    // the nearest band starts below the horizon. Everything above it was sky
    // - a pale gap in the middle of the picture that reads as seeing straight
    // through the world.
    const { ctx, calls } = recordingContext();
    draw(ctx, seated(), TWO_TREES, -1, -1);
    const wash = rects(calls).find(
      (rect) =>
        rect.x === 0 &&
        rect.wide === WIDE &&
        Math.abs(rect.y - HORIZON) < 1 &&
        Math.abs(rect.y + rect.high - HIGH) < 1,
    );
    expect(wash).toBeDefined();

    // Before the road: it is what the road is painted **on**.
    const firstBand = calls.findIndex((call) => call.name === "moveTo");
    expect(firstBand).toBeGreaterThan(wash?.at ?? 0);

    // And after the sky, which covers the whole canvas: painted the other way
    // round the sky would simply wipe the ground off again.
    const sky = rects(calls).find(
      (rect) => rect.x === 0 && rect.y === 0 && rect.high === HIGH,
    );
    expect(sky).toBeDefined();
    expect(wash?.at ?? 0).toBeGreaterThan(sky?.at ?? 0);
  });

  it("paints that ground in earth rather than sky", () => {
    const { ctx, calls } = recordingContext();
    draw(ctx, seated(), TWO_TREES, -1, -1);
    const wash = rects(calls).find(
      (rect) => rect.x === 0 && rect.wide === WIDE && rect.y > 1,
    );
    // Green, not the near-white of the sky low down: more green than blue.
    const green = Number.parseInt((wash?.colour ?? "#000000").slice(3, 5), 16);
    const blue = Number.parseInt((wash?.colour ?? "#000000").slice(5, 7), 16);
    expect(green).toBeGreaterThan(blue);
  });
});

describe("the things in the road, seen from the seat", () => {
  /** The colours each one is built from. */
  const CAN = "#c4562a";
  const TYRE = "#2b2b2b";
  const RIM = "#e8dcc2";
  const SPRAY_CAP = "#f0f0f0";
  const HEAD = "#5a5f66";

  /** A road with one thing lying on it, a little way ahead. */
  function withThing(kind: ItemKind): Route {
    return { ...TWO_TREES, anchors: [], items: [{ at: ROUTE_STEP * 3, kind }] };
  }

  /** What the driver's view drew for it. */
  function fromTheSeat(kind: ItemKind): Call[] {
    const { ctx, calls } = recordingContext();
    draw(ctx, seated(), withThing(kind), -1, -1);
    return calls;
  }

  /** How many rectangles were filled while a colour was in force. */
  function boxes(calls: readonly Call[], colour: string): number {
    let now = "";
    let count = 0;
    for (const call of calls) {
      if (call.name === "set:fillStyle") {
        now = String(call.args[0]);
      }
      if (call.name === "fillRect" && now === colour) {
        count++;
      }
    }
    return count;
  }

  it("draws the jerrycan as a can and not as a ball", () => {
    // The bug this is here for: every thing was a coloured circle, and the
    // can - having no colour of its own in this view - was a black one.
    const calls = fromTheSeat("can");
    expect(boxes(calls, CAN)).toBeGreaterThan(1);
    expect(usedColour(calls, CAN)).toBe(true);
  });

  it("gives the tyres two wheels, each with a hole in the middle", () => {
    // Two filled discs were two black blobs. What makes a wheel read as a
    // wheel at any size is the rim showing through the middle of it.
    let colour = "";
    const rings: { readonly paint: string; readonly wide: number }[] = [];
    for (const call of fromTheSeat("tyres")) {
      if (call.name === "set:fillStyle") {
        colour = String(call.args[0]);
      }
      if (call.name === "arc") {
        rings.push({ paint: colour, wide: Number(call.args[2]) });
      }
    }
    const tyres = rings.filter((ring) => ring.paint === TYRE);
    const rims = rings.filter((ring) => ring.paint === RIM);
    expect(tyres.length).toBe(2);
    expect(rims.length).toBe(2);
    // And the rim is inside the tyre, not beside it.
    expect(Math.max(...rims.map((r) => r.wide))).toBeLessThan(
      Math.min(...tyres.map((t) => t.wide)),
    );
  });

  it("caps the spray and heads the hammer and the axe", () => {
    expect(usedColour(fromTheSeat("spray"), SPRAY_CAP)).toBe(true);
    expect(usedColour(fromTheSeat("hammer"), HEAD)).toBe(true);
    expect(usedColour(fromTheSeat("axe"), HEAD)).toBe(true);
  });

  it("tells them apart from one another", () => {
    // The point of the whole thing: two different things must not paint the
    // same picture.
    const can = fromTheSeat("can").filter((call) => call.name === "fillRect");
    const spray = fromTheSeat("spray").filter(
      (call) => call.name === "fillRect",
    );
    expect(can.length).not.toBe(spray.length);
  });
});

describe("the mud", () => {
  /** The wet brown of a churned patch. */
  const MUD = "#5a4630";

  /** Flat road with a patch of mud on it. */
  const BOG: Route = {
    ...TWO_TREES,
    anchors: [],
    mud: [{ from: ROUTE_STEP * 2, to: ROUTE_STEP * 4 }],
  };

  it("shows it from the side", () => {
    const { ctx, calls } = recordingContext();
    draw(ctx, standing(), BOG, -1, -1);
    expect(usedColour(calls, MUD)).toBe(true);
  });

  it("shows it through the windscreen, where it matters most", () => {
    // A driver who sees it coming stops arguing with the throttle.
    const { ctx, calls } = recordingContext();
    draw(ctx, seated(), BOG, -1, -1);
    expect(usedColour(calls, MUD)).toBe(true);
  });

  it("paints none of it on a clean road", () => {
    const side = recordingContext();
    draw(side.ctx, standing(), TWO_TREES, -1, -1);
    expect(usedColour(side.calls, MUD)).toBe(false);
    const seat = recordingContext();
    draw(seat.ctx, seated(), TWO_TREES, -1, -1);
    expect(usedColour(seat.calls, MUD)).toBe(false);
  });
});

describe("the trees", () => {
  /** One circle of a crown. */
  type Lobe = {
    readonly tone: string;
    readonly x: number;
    readonly y: number;
    readonly radius: number;
  };

  /** The calls that only prepare a shape, rather than being one. */
  const BETWEEN = new Set(["set:fillStyle", "beginPath", "fill", "closePath"]);

  /**
   * The crowns drawn, each as the run of circles it is made of.
   *
   * @param calls - what the canvas was asked to do
   * @returns one list of lobes per tree
   * @remarks
   * A crown is a run of circles with nothing but colour changes between them,
   * which is what tells it from the wheels and the hub - those have the rest
   * of a motorhome drawn in among them.
   */
  function crowns(calls: readonly Call[]): Lobe[][] {
    const found: Lobe[][] = [];
    let run: Lobe[] = [];
    let tone = "";
    for (const call of calls) {
      if (call.name === "set:fillStyle") {
        tone = String(call.args[0]);
      } else if (call.name === "arc") {
        run.push({
          tone,
          x: Number(call.args[0]),
          y: Number(call.args[1]),
          radius: Number(call.args[2]),
        });
      } else if (!BETWEEN.has(call.name)) {
        if (run.some((lobe) => CROWNS.includes(lobe.tone))) {
          found.push(run);
        }
        run = [];
      }
    }
    return found;
  }

  /** One filled outline: the colour of it and the corners it was drawn with. */
  type Shape = {
    readonly tone: string;
    readonly points: readonly { readonly x: number; readonly y: number }[];
  };

  /**
   * Every filled outline, in the order they were painted.
   *
   * @param calls - what the canvas was asked to do
   * @returns the outlines, each with the colour it was filled in
   */
  function shapes(calls: readonly Call[]): Shape[] {
    const found: Shape[] = [];
    let tone = "";
    let points: { x: number; y: number }[] = [];
    const corner = (x: unknown, y: unknown) =>
      points.push({ x: Number(x), y: Number(y) });
    for (const call of calls) {
      if (call.name === "set:fillStyle") {
        tone = String(call.args[0]);
      } else if (call.name === "moveTo" || call.name === "lineTo") {
        corner(call.args[0], call.args[1]);
      } else if (call.name === "quadraticCurveTo") {
        corner(call.args[2], call.args[3]);
      } else if (call.name === "fill" && points.length > 0) {
        found.push({ tone, points });
        points = [];
      } else if (call.name === "stroke") {
        // A stroked path is a line, not an outline - and left lying about it
        // would tack its corners onto the next shape that **is** filled.
        points = [];
      }
    }
    return found;
  }

  /** How wide an outline is at its lowest corners and at its highest. */
  function spread(shape: Shape): {
    foot: number;
    wide: number;
    thin: number;
  } {
    const low = Math.max(...shape.points.map((point) => point.y));
    const high = Math.min(...shape.points.map((point) => point.y));
    const at = (y: number) => {
      const xs = shape.points.filter((p) => p.y === y).map((p) => p.x);
      return Math.max(...xs) - Math.min(...xs);
    };
    return { foot: low, wide: at(low), thin: at(high) };
  }

  /** The first trunk drawn, and the shape painted straight after it. */
  function firstTrunk(calls: readonly Call[]): {
    readonly trunk: Shape;
    readonly next: Shape;
  } {
    const all = shapes(calls);
    const at = all.findIndex((shape) => shape.tone === BARK);
    expect(at).toBeGreaterThan(-1);
    expect(all[at + 1]).toBeDefined();
    return { trunk: all[at], next: all[at + 1] };
  }

  /** Everything the roadside view drew, with two trees standing in it. */
  function roadside(): Call[] {
    const { ctx, calls } = recordingContext();
    draw(ctx, standing(), TWO_TREES, -1, -1);
    return calls;
  }

  it("gives a crown more than one circle to be made of", () => {
    // One circle is a lollipop. Several overlapping ones, in tones of the same
    // green, are a crown with a shape and a side the light comes from.
    const [first] = crowns(roadside());
    expect(first.length).toBeGreaterThan(3);
    expect(new Set(first.map((lobe) => lobe.tone)).size).toBeGreaterThan(3);
  });

  it("lights the crown from the same side as the rest of the view", () => {
    // The hillside, the trunk and the crown all catch the light from one side.
    // Two of them agreeing and the third not is worse than no shading at all.
    const [first] = crowns(roadside());
    const sorted = [...first].sort(
      (a, b) => brightness(a.tone) - brightness(b.tone),
    );
    expect(sorted[0].x).toBeGreaterThan(sorted[sorted.length - 1].x);
  });

  it("holds the crown up on the trunk instead of on the ground", () => {
    // The rope goes round the trunk at the height the map gives. With the
    // crown centred there it swallowed the whole trunk and sat in the grass.
    const calls = roadside();
    const [first] = crowns(calls);
    const body = first.find((lobe) => CROWNS.includes(lobe.tone));
    const trunk = spread(firstTrunk(calls).trunk);
    expect(body).toBeDefined();
    const clear = trunk.foot - (Number(body?.y) + Number(body?.radius));
    expect(clear).toBeGreaterThan(Number(body?.radius) / 4);
  });

  it("widens the trunk towards its roots", () => {
    // A trunk of one width is a broom handle, and one that merely tapers is a
    // pencil: it flares out where it goes into the ground, so that it stands
    // in the earth rather than having been stuck into it.
    const trunk = spread(firstTrunk(roadside()).trunk);
    expect(trunk.wide).toBeGreaterThan(trunk.thin * 3);
  });

  it("shades one side of the trunk", () => {
    // Two flat browns side by side is what makes a trunk round instead of a
    // plank, and the dark one has to be the side the light is not on.
    const { trunk, next } = firstTrunk(roadside());
    expect(brightness(next.tone)).toBeLessThan(brightness(trunk.tone));
    const middle =
      (Math.min(...trunk.points.map((point) => point.x)) +
        Math.max(...trunk.points.map((point) => point.x))) /
      2;
    expect(Math.min(...next.points.map((point) => point.x))).toBeGreaterThan(
      middle,
    );
  });

  it("puts branches out from the trunk", () => {
    // Trunk, crown, nothing in between is a mushroom. A branch or two coming
    // out from under the leaves is what says the crown grew there.
    const reaches: number[] = [];
    let bark = false;
    let from = 0;
    for (const call of roadside()) {
      if (call.name === "set:strokeStyle") {
        bark = call.args[0] === BARK;
      } else if (bark && call.name === "moveTo") {
        from = Number(call.args[0]);
      } else if (bark && call.name === "quadraticCurveTo") {
        reaches.push(Math.abs(Number(call.args[2]) - from));
      }
    }
    const trunk = spread(firstTrunk(roadside()).trunk);
    expect(reaches.length).toBeGreaterThan(1);
    expect(Math.max(...reaches)).toBeGreaterThan(trunk.wide);
  });

  it("does not draw one tree over and over", () => {
    // Two trees within sight of one another in the same shape read as
    // wallpaper. Closer together than the usual pair, so that both of them
    // are on the canvas at once.
    const near: Route = {
      ...TWO_TREES,
      anchors: [
        { x: ROUTE_STEP * 3, y: 0 },
        { x: ROUTE_STEP * 6, y: 0 },
      ],
    };
    const { ctx, calls } = recordingContext();
    draw(ctx, standing(), near, -1, -1);
    const [first, second] = crowns(calls);
    expect(second).toBeDefined();
    const shape = (lobes: Lobe[]) => {
      const body = lobes.find((lobe) => CROWNS.includes(lobe.tone));
      const unit = Number(body?.radius);
      return lobes
        .map((lobe) =>
          [
            ((lobe.x - Number(body?.x)) / unit).toFixed(2),
            ((lobe.y - Number(body?.y)) / unit).toFixed(2),
            (lobe.radius / unit).toFixed(2),
          ].join(),
        )
        .join(" ");
    };
    expect(shape(first)).not.toBe(shape(second));
  });
});

describe("the girl at the foot of the climb", () => {
  /** Her red pinafore, which nothing else in the picture wears. */
  const DRESS = "#d13a2b";

  /** A road with a patch of mud on it, as the second section has. */
  const CLIMB: Route = {
    ...TWO_TREES,
    anchors: [],
    mud: [{ from: ROUTE_STEP * 4, to: ROUTE_STEP * 5 }],
  };

  /** Everything one of the views drew, from a place along that road. */
  function seen(at: number, inside: boolean): readonly Call[] {
    const base = inside ? seated() : standing();
    const { ctx, calls } = recordingContext();
    draw(
      ctx,
      { ...base, rv: { x: at, v: 0 }, people: [{ ...base.people[0], at }] },
      CLIMB,
      -1,
      -1,
    );
    return calls;
  }

  it("stands where the mud ends, in both views", () => {
    expect(usedColour(seen(ROUTE_STEP * 4, true), DRESS)).toBe(true);
    expect(usedColour(seen(ROUTE_STEP * 5, false), DRESS)).toBe(true);
  });

  it("is not on a road without mud", () => {
    const { ctx, calls } = recordingContext();
    draw(ctx, seated(), { ...CLIMB, mud: [] }, -1, -1);
    expect(usedColour(calls, DRESS)).toBe(false);
  });

  it("has her kid with her, in both views", () => {
    // The white one: the same goat as on the pasture, only small and pale.
    // Found by its horn, which on this road nothing else has - the pasture
    // and its herd are a section away.
    const HORN = "#6f6455";
    expect(usedColour(seen(ROUTE_STEP * 4, true), HORN)).toBe(true);
    expect(usedColour(seen(ROUTE_STEP * 5, false), HORN)).toBe(true);
  });
});

describe("the boy flying over the ditch", () => {
  /** His lincoln green, which nothing else in the picture is painted in. */
  const TUNIC = "#3c8b4a";

  /** The red of the feather in his cap. */
  const FEATHER = "#c0392b";

  /** A road with a hole in it, as the third section has. */
  const HOLE: Route = {
    ...TWO_TREES,
    anchors: [],
    pits: [{ from: ROUTE_STEP * 4, to: ROUTE_STEP * 5 }],
  };

  /** Everything one of the views drew, from a place along that road. */
  function seen(at: number, inside: boolean): readonly Call[] {
    const base = inside ? seated() : standing();
    const { ctx, calls } = recordingContext();
    draw(
      ctx,
      { ...base, rv: { x: at, v: 0 }, people: [{ ...base.people[0], at }] },
      HOLE,
      -1,
      -1,
    );
    return calls;
  }

  it("hangs over the hole, in both views", () => {
    expect(usedColour(seen(ROUTE_STEP * 3, true), TUNIC)).toBe(true);
    expect(usedColour(seen(ROUTE_STEP * 4, false), TUNIC)).toBe(true);
  });

  it("wears the feather in both views, which is who he is", () => {
    expect(usedColour(seen(ROUTE_STEP * 3, true), FEATHER)).toBe(true);
    expect(usedColour(seen(ROUTE_STEP * 4, false), FEATHER)).toBe(true);
  });

  it("is not on a road without a hole in it", () => {
    const { ctx, calls } = recordingContext();
    draw(ctx, seated(), { ...HOLE, pits: [] }, -1, -1);
    expect(usedColour(calls, TUNIC)).toBe(false);
  });

  it("has his fairy with him, in both views", () => {
    // What makes her a fairy and not a fly is the glow around her.
    const GLOW = "#f7e79a";
    expect(usedColour(seen(ROUTE_STEP * 3, true), GLOW)).toBe(true);
    expect(usedColour(seen(ROUTE_STEP * 4, false), GLOW)).toBe(true);
  });

  it("is up in the sky from the driver's seat, not down on the road", () => {
    // Hanging higher than the driver sits, he belongs **above** the horizon.
    // Anything painted on the ground out there lands below it.
    const HORIZON = 420 * 0.44;
    const calls = seen(ROUTE_STEP * 3, true);
    let green = false;
    const painted: number[] = [];
    for (const call of calls) {
      if (call.name === "set:fillStyle") {
        green = call.args[0] === TUNIC;
      } else if (green && (call.name === "moveTo" || call.name === "lineTo")) {
        painted.push(Number(call.args[1]));
      }
    }
    expect(painted.length).toBeGreaterThan(0);
    expect(Math.max(...painted)).toBeLessThan(HORIZON);
  });

  it("flies above the ground rather than standing in the hole", () => {
    // On a level road the side view keeps the ground down the middle of the
    // canvas. Everything he is painted in has to sit higher up than that, or
    // he is a boy standing in a ditch.
    const road = 420 / 2;
    const calls = seen(ROUTE_STEP * 4, false);
    let green = false;
    const painted: number[] = [];
    for (const call of calls) {
      if (call.name === "set:fillStyle") {
        green = call.args[0] === TUNIC;
      } else if (green && (call.name === "moveTo" || call.name === "lineTo")) {
        painted.push(Number(call.args[1]));
      }
    }
    expect(painted.length).toBeGreaterThan(0);
    expect(Math.max(...painted)).toBeLessThan(road);
  });
});

describe("the goats on the first section", () => {
  /** A goat's horn, which nothing else in the picture is painted in. */
  const HORN = "#6f6455";

  /** The road of the first section, with a second section to end it. */
  const PASTURE: Route = {
    ...TWO_TREES,
    anchors: [],
    sections: [ROUTE_STEP * 2, ROUTE_STEP * 30],
  };

  it("puts them out where the drive begins", () => {
    // Scenery, and that is the point: the first section is where somebody is
    // learning which pedal is which, and a road with something living beside
    // it is a road somebody wants to drive down.
    const { ctx, calls } = recordingContext();
    draw(
      ctx,
      { ...seated(), rv: { x: ROUTE_STEP * 4, v: 0 } },
      PASTURE,
      -1,
      -1,
    );
    expect(usedColour(calls, HORN)).toBe(true);
  });

  it("shows them from the roadside as well", () => {
    const out = standing();
    const at = ROUTE_STEP * 4;
    const { ctx, calls } = recordingContext();
    draw(
      ctx,
      { ...out, rv: { x: at, v: 0 }, people: [{ ...out.people[0], at }] },
      PASTURE,
      -1,
      -1,
    );
    expect(usedColour(calls, HORN)).toBe(true);
  });

  it("keeps them off the rest of the map", () => {
    // Further along there is a bear, and no goat would stand about there.
    const { ctx, calls } = recordingContext();
    draw(
      ctx,
      { ...seated(), rv: { x: ROUTE_STEP * 34, v: 0 } },
      PASTURE,
      -1,
      -1,
    );
    expect(usedColour(calls, HORN)).toBe(false);
  });
});

describe("the country the drive goes through", () => {
  /** The far range, the near range, and the trees along the road. */
  const RANGE = "#a9c2d8";
  const NEARER = "#93ae9b";
  const WOOD = "#3f6b46";

  /** The two views, from a place along the route. */
  function seen(at: number): {
    readonly side: readonly Call[];
    readonly cab: readonly Call[];
  } {
    const out = standing();
    const side = recordingContext();
    draw(
      side.ctx,
      { ...out, rv: { x: at, v: 0 }, people: [{ ...out.people[0], at }] },
      TWO_TREES,
      -1,
      -1,
    );
    const seat = seated();
    const cab = recordingContext();
    draw(cab.ctx, { ...seat, rv: { x: at, v: 0 } }, TWO_TREES, -1, -1);
    return { side: side.calls, cab: cab.calls };
  }

  it("climbs about in the mountains for the first half of it", () => {
    const early = seen(0);
    expect(usedColour(early.side, RANGE)).toBe(true);
    expect(usedColour(early.side, WOOD)).toBe(false);
    expect(usedColour(early.cab, WOOD)).toBe(false);
  });

  it("runs into forest from the fifth section on", () => {
    // Half the map each: rock and snow to begin with, trees from the bear
    // onwards. One drive, two countries.
    const late = seen(WOOD_FROM + ROUTE_STEP);
    expect(usedColour(late.side, WOOD)).toBe(true);
    expect(usedColour(late.side, RANGE)).toBe(false);
    expect(usedColour(late.side, NEARER)).toBe(false);
    expect(usedColour(late.cab, WOOD)).toBe(true);
  });

  it("fades the mountains out rather than switching them off", () => {
    // At speed a skyline that changed between one frame and the next would
    // read as a fault, so for a stretch they are still there and faint. What
    // arrives instead is the wood along the road, not a second skyline: a row
    // of trees on the horizon only stood behind the near ones and hardly
    // moved with them.
    const between = seen(WOOD_FROM - ROUTE_STEP * 4);
    expect(usedColour(between.side, RANGE)).toBe(true);
    const fading = between.side
      .filter((call) => call.name === "set:globalAlpha")
      .map((call) => Number(call.args[0]));
    expect(fading.some((share) => share > 0 && share < 1)).toBe(true);
  });

  it("stands trees along both verges once the wood begins", () => {
    // A treeline on the horizon says there is a forest somewhere out there.
    // Trees going past the window say you are in one.
    const CONIFER = "#3f6b46";
    const late = seen(WOOD_FROM + ROUTE_STEP);
    expect(usedColour(late.cab, CONIFER)).toBe(true);
    expect(usedColour(late.side, CONIFER)).toBe(true);
    // On trunks, not hanging in the air: a conifer without one is a green
    // arrowhead lying on the grass.
    expect(usedColour(late.cab, "#43301f")).toBe(true);
  });

  it("stands every one of them on the ground", () => {
    // They floated: the wood was lifted a little to fake depth, so the trees
    // hung a hand's breadth over the road. Further back is said with size
    // alone now, and a tree with its feet off the ground is a tree in a tree.
    const BARK = "#43301f";
    // On the level the ground runs across the middle of the side view.
    const GROUND = 210;
    let tone = "";
    const feet: number[] = [];
    for (const call of seen(WOOD_FROM + ROUTE_STEP).side) {
      if (call.name === "set:fillStyle") {
        tone = String(call.args[0]);
      } else if (call.name === "fillRect" && tone === BARK) {
        feet.push(Number(call.args[1]) + Number(call.args[3]));
      }
    }
    expect(feet.length).toBeGreaterThan(4);
    for (const foot of feet) {
      expect(foot).toBeCloseTo(GROUND, 5);
    }
  });

  it("leaves the mountain half without them", () => {
    const CONIFER = "#3f6b46";
    const early = seen(0);
    expect(usedColour(early.cab, CONIFER)).toBe(false);
    expect(usedColour(early.side, CONIFER)).toBe(false);
  });

  it("has both halves in full by the time a section starts", () => {
    // Whoever starts a section afresh stands well past the mixing, so no
    // section ever opens on a half-faded skyline.
    for (const start of SECTIONS) {
      const share = woodShare(start);
      expect(share === 0 || share === 1).toBe(true);
    }
  });
});

describe("the notice board at the start of a section", () => {
  /** The wording of the first section, which is the one that has one. */
  const FIRST = RV_TEXTS.sectionHints[0];

  /** The painted face of the board, which nothing else in the picture wears. */
  const PAPER = "#f7f1e3";

  /** The lit side of a post it stands on. */
  const POST = "#6b4a2f";

  /** Where the first section starts, and where its board therefore stands. */
  const STARTS = ROUTE_STEP * 2;

  /** A flat road with a section marker on it, and so with a board. */
  const MARKED: Route = { ...TWO_TREES, anchors: [], sections: [STARTS] };

  /** What the canvas was asked to do, from a place along that road. */
  function shown(
    at: number,
    inside = true,
  ): { readonly written: string[]; readonly calls: Call[] } {
    const base = inside ? seated() : standing();
    const state = {
      ...base,
      rv: { x: at, v: 0 },
      people: [{ ...base.people[0], at }],
    };
    const { ctx, calls } = recordingContext();
    draw(ctx, state, MARKED, -1, -1);
    return {
      written: calls
        .filter((call) => call.name === "fillText")
        .map((call) => String(call.args[0])),
      calls,
    };
  }

  /** How many boards were painted: one face fill each. */
  function boards(calls: readonly Call[]): number {
    return calls.filter((call) => call.args[0] === PAPER).length;
  }

  it("stands where the section starts, to be read from the seat", () => {
    // A section drops you somewhere new with a new problem, and out of the
    // scenery alone there is no telling what the game wants of you.
    const { written, calls } = shown(STARTS);
    expect(boards(calls)).toBe(1);
    expect(written.filter((each) => FIRST.includes(each)).join(" ")).toBe(
      FIRST,
    );
  });

  it("stands to the left of the road", () => {
    // Where a driver looking over the wheel has it in front of them all the
    // way up to it, rather than off in the corner of the windscreen.
    const { calls } = shown(STARTS);
    const writing = calls
      .filter((call) => call.name === "fillText")
      .filter((call) => FIRST.includes(String(call.args[0])));
    expect(writing.length).toBeGreaterThan(0);
    for (const line of writing) {
      expect(Number(line.args[1])).toBeLessThan(WIDE / 2);
    }
  });

  it("stands in the ground on the way in, not on top of the marker", () => {
    // A few metres past it: the marker says which section, the board says
    // what to do in it, and neither is drawn over the other.
    expect(NOTICE_AFTER).toBeGreaterThan(0);
    // Still in sight from the marker itself, or it would say it too late.
    expect(boards(shown(STARTS).calls)).toBe(1);
  });

  it("is there from the roadside as well", () => {
    // It belongs to the ground it stands in, not to the seat.
    expect(boards(shown(STARTS, false).calls)).toBeGreaterThan(0);
  });

  it("stands on two posts that go into the ground", () => {
    // A board hanging in the air is a placard; this one is planted in the
    // verge, and both posts have to reach the same ground.
    const posts: { readonly x: number; readonly foot: number }[] = [];
    let tone = "";
    for (const call of shown(STARTS).calls) {
      if (call.name === "set:fillStyle") {
        tone = String(call.args[0]);
      } else if (call.name === "fillRect" && tone === POST) {
        posts.push({
          x: Number(call.args[0]),
          foot: Number(call.args[1]) + Number(call.args[3]),
        });
      }
    }
    expect(posts).toHaveLength(2);
    expect(posts[0].foot).toBeCloseTo(posts[1].foot, 5);
    expect(posts[0].x).not.toBeCloseTo(posts[1].x, 5);
  });

  it("breaks the wording over the board rather than off the edge of it", () => {
    // A sentence set in one line on a board this shape comes out either as a
    // strip of two-pixel letters or as half a sentence.
    const lines = shown(STARTS).written.filter((each) => FIRST.includes(each));
    expect(lines.length).toBeGreaterThan(1);
  });

  it("sets the wording once and then only scales it", () => {
    // It used to be laid out in pixels, afresh every frame, so as the board
    // grew on the approach the line break kept changing its mind: five words
    // on the first line, then four, then five again. A painted sign does not
    // reflow itself while you drive towards it.
    const writing = (
      at: number,
    ): { readonly lines: string[]; readonly size: number } => {
      const lines: string[] = [];
      let font = "";
      let size = 0;
      for (const call of shown(at).calls) {
        if (call.name === "set:font") {
          font = String(call.args[0]);
        } else if (
          call.name === "fillText" &&
          FIRST.includes(String(call.args[0]))
        ) {
          lines.push(String(call.args[0]));
          size = Number.parseFloat(font);
        }
      }
      return { lines, size };
    };
    const near = writing(STARTS);
    const far = writing(STARTS - NOTICE_AFTER);
    expect(near.lines.length).toBeGreaterThan(1);
    expect(near.lines).toEqual(far.lines);
    // Twice as far off, half the letters - and nothing else changed.
    expect(far.size * 2).toBeCloseTo(near.size, 5);
  });

  it("keeps the writing on the board, in lines that do not touch", () => {
    // The size is chosen to fit the face: too big and the sentence hangs off
    // the edges of it, too tight and the lines sit on top of one another.
    let tone = "";
    let font = 0;
    let face: { y: number; high: number } | null = null;
    let size = 0;
    const down: number[] = [];
    for (const call of shown(STARTS).calls) {
      if (call.name === "set:fillStyle") {
        tone = String(call.args[0]);
      } else if (call.name === "set:font") {
        font = Number.parseFloat(String(call.args[0]));
      } else if (call.name === "fillRect" && tone === PAPER) {
        face = { y: Number(call.args[1]), high: Number(call.args[3]) };
      } else if (
        call.name === "fillText" &&
        FIRST.includes(String(call.args[0]))
      ) {
        // The size in force **then**, not the last one the frame ever set.
        size = font;
        down.push(Number(call.args[2]));
      }
    }
    expect(face).not.toBeNull();
    expect(down.length).toBeGreaterThan(1);
    for (const y of down) {
      expect(y).toBeGreaterThan(Number(face?.y));
      expect(y).toBeLessThan(Number(face?.y) + Number(face?.high));
    }
    expect(down[1] - down[0]).toBeGreaterThan(size);
  });

  it("leaves the wording off when it is too far away to read", () => {
    // Half-pixel letters are a grey smear that says less than a blank board.
    const far = shown(STARTS - 120);
    expect(boards(far.calls)).toBe(1);
    expect(far.written.filter((each) => FIRST.includes(each))).toEqual([]);
  });

  it("gives every section with something to say a board of its own", () => {
    // One board per hint, and none for a section nobody has written one for:
    // a blank board beside the road would be worse than no board.
    const all = RV_TEXTS.sectionHints.length;
    const many: Route = {
      ...MARKED,
      // One section more than there are hints, all of them within reading
      // distance, so the odd one out has to come out as no board rather than
      // as an empty one.
      sections: Array.from(
        { length: all + 1 },
        (_each, index) => STARTS + index * ROUTE_STEP,
      ),
    };
    const { ctx, calls } = recordingContext();
    draw(ctx, { ...seated(), rv: { x: STARTS, v: 0 } }, many, -1, -1);
    expect(boards(calls)).toBe(all);
  });
});

describe("what the land hides", () => {
  /** The crowns drawn from the seat, as circles in the tree's own greens. */
  function crownsAhead(route: Route, at: number): number {
    const { ctx, calls } = recordingContext();
    draw(ctx, { ...seated(), rv: { x: at, v: 0 } }, route, -1, -1);
    return crownRadii(calls).length;
  }

  /**
   * A flat road with a rise in it and one tree beyond the rise.
   *
   * @param high - how high the rise is, in metres
   * @returns the route
   */
  function overTheRise(high: number): Route {
    const heights = Array.from({ length: 40 }, (_each, field) =>
      field >= 3 && field <= 5 ? high : 0,
    );
    return {
      ...TWO_TREES,
      heights,
      sections: [],
      anchors: [{ x: ROUTE_STEP * 10, y: 0 }],
    };
  }

  /** A flat road with one tree on it, that many metres along. */
  function outThere(at: number): Route {
    return { ...TWO_TREES, sections: [], anchors: [{ x: at, y: 0 }] };
  }

  it("keeps what is behind a rise behind it", () => {
    // The whole complaint: from the seat you could see every tree, marker and
    // item the section still held, hills or no hills. Half of a bend or a
    // brow is not knowing yet what is over it.
    expect(crownsAhead(overTheRise(6), 0)).toBe(0);
  });

  it("shows it again from the top of the rise", () => {
    // Hidden has to mean hidden by **something**, not simply gone: from up on
    // the brow the same tree is in plain sight.
    expect(crownsAhead(overTheRise(6), ROUTE_STEP * 4)).toBe(1);
  });

  it("invents no hill on the level", () => {
    // The line of sight runs a whisker over flat ground all the way, so the
    // rule must not shave off what stands on it.
    expect(crownsAhead(overTheRise(0), 0)).toBe(1);
  });

  it("cuts a tree off at the crest it stands behind", () => {
    // A rise too low to hide the whole tree hides the foot of it, the way a
    // hill does - the crown stands over the brow and the trunk does not.
    const { ctx, calls } = recordingContext();
    draw(ctx, seated(), overTheRise(3), -1, -1);
    expect(crownRadii(calls)).toHaveLength(1);
    const cut = calls.filter((call) => call.name === "rect");
    const foot = Math.max(
      ...calls
        .filter((call) => call.name === "moveTo")
        .map((call) => Number(call.args[1])),
    );
    expect(cut.some((call) => Number(call.args[3]) < foot)).toBe(true);
  });

  it("leaves out what is further off than things are drawn", () => {
    // The road runs to the horizon; what stands beside it does not have to.
    expect(crownsAhead(outThere(100), 0)).toBe(1);
    expect(crownsAhead(outThere(200), 0)).toBe(0);
  });

  it("fades the last stretch out rather than letting it pop", () => {
    const faded = (at: number): number => {
      const { ctx, calls } = recordingContext();
      draw(ctx, seated(), outThere(at), -1, -1);
      const set = calls.filter((call) => call.name === "set:globalAlpha");
      return Math.min(...set.map((call) => Number(call.args[0])), 1);
    };
    expect(faded(100)).toBe(1);
    const going = faded(150);
    expect(going).toBeGreaterThan(0);
    expect(going).toBeLessThan(1);
  });
});

describe("the hillside beside the road", () => {
  /** The canvas, its middle, and where the horizon sits. */
  const WIDE = 960;
  const HORIZON = 420 * 0.44;

  /** The green of the range on the horizon, and of the road surface. */
  const RIDGE = "#9fbcae";
  /** Both roads: the bare one, and the one under snow up at the top. */
  const ROADS = new Set(["#b09265", "#c6d5e4"]);

  /**
   * Ground that rises to a ridge, and ground that dips into a valley.
   *
   * @remarks
   * Deliberately below the snow line, so the hillside keeps its plain green
   * and can be picked out by colour.
   */
  function shaped(peak: boolean): Route {
    // Level for a good way either side of where the motorhome stands, so the
    // **road** ahead is the same in all three worlds and only the country
    // beyond it differs. Otherwise a test of the hillside would really be a
    // test of the slope under the wheels.
    const heights = Array.from({ length: 60 }, (_each, field) => {
      const away = Math.abs(field - 30);
      const step = Math.max(0, away - 5) * HEIGHT_UNIT;
      return peak ? -step : step;
    });
    return { ...TWO_TREES, anchors: [], heights };
  }

  /** Behind the wheel at the top of the ridge or the bottom of the valley. */
  function atTheMiddle(): GameState {
    const state = seated();
    const at = ROUTE_STEP * 30;
    return {
      ...state,
      rv: { x: at, v: 0 },
      people: [{ ...state.people[0], at, inside: true }],
    };
  }

  /**
   * Where the near end of the outermost hillside strip is drawn.
   *
   * @param route - the ground to drive on
   * @returns its y on the canvas, which is lower down the steeper it falls
   * @remarks
   * Found by colour: the steering wheel and the dashboard reach further out
   * still, and measuring one of those would say nothing about the land.
   */
  function flankNear(route: Route): number {
    let widest = 0;
    let atWidest = HORIZON;
    for (const call of hillside(route)) {
      if (call.name !== "moveTo" && call.name !== "lineTo") {
        continue;
      }
      const away = Math.abs(Number(call.args[0]) - WIDE / 2);
      if (away > widest) {
        widest = away;
        atWidest = Number(call.args[1]);
      }
    }
    expect(widest).toBeGreaterThan(0);
    return atWidest;
  }

  /**
   * Everything the cab drew for the hillside.
   *
   * @param route - the ground to drive on
   * @returns the calls between the range on the horizon and the road surface
   * @remarks
   * Found by **when** rather than by colour: the hillside is shaded from its
   * own shape, so its colours are worked out rather than named, and the only
   * fixed thing about it is that it is painted after the horizon and before
   * the road that lies on it.
   */
  function hillside(route: Route): Call[] {
    const { ctx, calls } = recordingContext();
    draw(ctx, atTheMiddle(), route, -1, -1);
    const from = calls.findLastIndex((call) => call.args[0] === RIDGE);
    const to = calls.findIndex((call) => ROADS.has(String(call.args[0])));
    expect(from).toBeGreaterThan(0);
    expect(to).toBeGreaterThan(from);
    return calls.slice(from, to);
  }

  it("falls away to both sides on a ridge and climbs in a valley", () => {
    // The whole point: driving along the top of something has to look like
    // it, and driving along the bottom of something has to look like that.
    // Lower down the canvas is further below the eye, so the ridge's flank is
    // drawn under the flat one and the valley's above it.
    const ridge = flankNear(shaped(true));
    const flat = flankNear(TWO_TREES);
    const valley = flankNear(shaped(false));
    expect(ridge).toBeGreaterThan(flat);
    expect(valley).toBeLessThan(flat);
  });

  /** How tall a shape has to be to be a strip of hillside and not a band. */
  const DEEP = 100;

  /** One strip of hillside: the colour it was filled with and where it lies. */
  type Strip = {
    readonly tone: string;
    /** The middle of it across the canvas. */
    readonly x: number;
    /** How far out its outer edge reaches, as a distance from the middle. */
    readonly reach: number;
    /** Where its outer edge starts, at the near end of the view. */
    readonly near: number;
  };

  /**
   * The strips of hillside, in the order they were painted.
   *
   * @param route - the ground to drive on
   * @returns each strip's colour and the middle of it across the canvas
   */
  function strips(route: Route): Strip[] {
    const found: Strip[] = [];
    let tone = "";
    let across: number[] = [];
    let down: number[] = [];
    for (const call of hillside(route)) {
      if (call.name === "set:fillStyle") {
        tone = String(call.args[0]);
      } else if (call.name === "moveTo" || call.name === "lineTo") {
        across.push(Number(call.args[0]));
        down.push(Number(call.args[1]));
      } else if (call.name === "fill" && across.length > 0) {
        const tall = Math.max(...down) - Math.min(...down);
        // Told from the bands over the road by how deep it is: a strip of
        // hillside runs from under the bumper to the horizon, while a band
        // across the road is a sliver a couple of pixels high.
        if (tall > DEEP) {
          const middle = across.reduce((sum, x) => sum + x, 0) / across.length;
          const reach = Math.max(...across.map((x) => Math.abs(x - WIDE / 2)));
          found.push({ tone, x: middle, reach, near: down[0] });
        }
        across = [];
        down = [];
      }
    }
    expect(found.length).toBeGreaterThan(2);
    return found;
  }

  /** The strips on one side of the road, outermost first. */
  function side(route: Route, left: boolean): Strip[] {
    return strips(route).filter((strip) =>
      left ? strip.x < WIDE / 2 : strip.x > WIDE / 2,
    );
  }

  it("shades the faces, so the lie of the land can be read", () => {
    // Without this the hillside is one flat green shape and says nothing
    // about whether the country falls away or climbs.
    const tones = strips(shaped(false)).map((strip) => brightness(strip.tone));
    expect(Math.max(...tones) - Math.min(...tones)).toBeGreaterThan(0.1);
  });

  it("darkens a face the further down the hillside it lies", () => {
    // The outermost strip is painted first, and it is the one furthest from
    // the road and so the deepest into the shade.
    const strip = side(shaped(false), true);
    const tones = strip.map((each) => brightness(each.tone));
    expect(tones.length).toBeGreaterThan(2);
    for (let index = 1; index < tones.length; index++) {
      expect(tones[index]).toBeGreaterThanOrEqual(tones[index - 1]);
    }
    // Never the same all the way: the strips near the road may round to the
    // same colour, but the foot of the hillside is plainly darker than its
    // shoulder or nothing has been shaded at all.
    expect(tones[tones.length - 1]).toBeGreaterThan(tones[0] + 0.1);
  });

  it("lights the two sides of the road differently", () => {
    // One light, one direction: a hillside lit the same on both flanks reads
    // as a paper cut-out rather than as ground.
    const valley = shaped(false);
    const left = brightness(side(valley, true)[0].tone);
    const right = brightness(side(valley, false)[0].tone);
    expect(Math.abs(left - right)).toBeGreaterThan(0.05);
    // And a ridge, whose flanks face the other way, is lit the other way
    // about: whichever side the light catches in a valley, it misses here.
    const ridge = shaped(true);
    const overLeft = brightness(side(ridge, true)[0].tone);
    const overRight = brightness(side(ridge, false)[0].tone);
    expect(left > right).toBe(overLeft < overRight);
  });

  it("rounds the hillside rather than stepping it", () => {
    // A handful of wide steps is a staircase, not a hillside: the ground has
    // to come round in enough faces, and shade gently enough from one to the
    // next, that no single edge of it stands out as a line.
    const tones = side(shaped(false), true).map((each) =>
      brightness(each.tone),
    );
    expect(tones.length).toBeGreaterThan(4);
    for (let index = 1; index < tones.length; index++) {
      expect(tones[index] - tones[index - 1]).toBeLessThan(0.12);
    }
  });

  it("shades snow even where the ground is flat", () => {
    // On grass, level country is left one colour on purpose - nothing is
    // invented where the map says nothing. Snow cannot afford that: it has no
    // grain and no colour of its own, so a flat snowfield came out as a blank
    // white sheet with a road drawn on it.
    const flat: Route = {
      ...TWO_TREES,
      heights: TWO_TREES.heights.map((height) => height + SNOW_FULL),
    };
    const tones = strips(flat).map((strip) => brightness(strip.tone));
    expect(Math.max(...tones)).toBeGreaterThan(Math.min(...tones) + 0.05);
  });

  it("lights the two sides of a snowy hillside differently too", () => {
    // The light does not stop at the snow line. Without the side it comes
    // from, a snowy valley is two identical white walls.
    const deep = shaped(false);
    const snowy: Route = {
      ...deep,
      heights: deep.heights.map((height) => height + SNOW_FULL),
    };
    const left = brightness(side(snowy, true)[0].tone);
    const right = brightness(side(snowy, false)[0].tone);
    expect(Math.abs(left - right)).toBeGreaterThan(0.03);
  });

  it("shades snow as well, so a summit is not one white sheet", () => {
    // Up where everything is white the shading is the only thing left saying
    // where the ground rises and where it falls.
    const deep = shaped(false);
    const snowy: Route = {
      ...deep,
      heights: deep.heights.map((height) => height + SNOW_FULL),
    };
    const tones = strips(snowy).map((strip) => brightness(strip.tone));
    expect(Math.max(...tones)).toBeGreaterThan(Math.min(...tones) + 0.05);
  });

  it("carries the hillside far out past the roadside", () => {
    // Stopping it at the verge is what left the picture a band of ground with
    // one flat colour either side of it: the country has to reach out several
    // times the width of the road before it runs off the screen.
    const left = side(shaped(false), true);
    const outermost = left[0].reach;
    const atTheVerge = left[left.length - 1].reach;
    expect(outermost).toBeGreaterThan(atTheVerge * 4);
  });

  it("drops each step of the hillside further than the one before", () => {
    // What rounds it: one drop per step is a straight wedge, and a wedge has
    // an edge along the top of it that reads as a crease in the ground.
    const near = side(shaped(false), true).map((each) => each.near);
    const drops = near
      .slice(1)
      .map((each, index) => Math.abs(each - near[index]));
    expect(drops.length).toBeGreaterThan(2);
    // Painted from the outside in, so the drops get smaller as they go.
    for (let index = 1; index < drops.length; index++) {
      expect(drops[index]).toBeLessThan(drops[index - 1]);
    }
  });

  it("leaves flat country one colour", () => {
    // No relief, nothing to shade: inventing light and shade on the level
    // would show hills where the map has none.
    const tones = new Set(strips(TWO_TREES).map((strip) => strip.tone));
    expect(tones.size).toBe(1);
  });

  it("leaves flat country flat", () => {
    // Nothing invented where the map says nothing: on the level the hillside
    // lies at the height of the road, the same both sides of it.
    const seen = hillside(TWO_TREES)
      .filter((call) => call.name === "lineTo")
      .map((call) => ({ x: Number(call.args[0]), y: Number(call.args[1]) }));
    // Every point of it sits at the same height as the road at that distance,
    // so the left and the right of the picture mirror one another exactly.
    const left = seen.filter((point) => point.x < WIDE / 2).map((p) => p.y);
    const right = seen.filter((point) => point.x > WIDE / 2).map((p) => p.y);
    expect(left.length).toBeGreaterThan(0);
    expect(Math.min(...left)).toBeCloseTo(Math.min(...right), 5);
    expect(Math.max(...left)).toBeCloseTo(Math.max(...right), 5);
  });
});
