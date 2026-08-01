/**
 * Tests that the items and the shield are actually painted.
 *
 * @module
 * @remarks
 * The engine tests say what an item does; these say you can see it. A power
 * that works but is invisible is barely better than one that does not work -
 * the shield's warning blink in particular exists only on screen.
 */
import { describe, expect, it } from "vitest";
import { draw } from "./render";
import { createRandom } from "../engine/random";
import {
  SHIELD_BLINK_LEAD,
  TILE,
  type GameState,
  type Pickup,
  type Tank,
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
  const canvas = { width: 900, height: 600 };
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

/** Whether any colour was set to that value. */
function usedColour(calls: readonly Call[], colour: string): boolean {
  return calls.some(
    (call) =>
      (call.name === "set:fillStyle" || call.name === "set:strokeStyle") &&
      call.args[0] === colour,
  );
}

/** A plain tank standing still. */
function tank(over: Partial<Tank> = {}): Tank {
  return {
    id: "player",
    kind: "player",
    x: TILE * 3,
    y: TILE * 3,
    turret: 0,
    alive: true,
    reloadUntil: 0,
    heading: 0,
    headingUntil: 0,
    shieldUntil: 0,
    rapidUntil: 0,
    scatterUntil: 0,
    hitsLeft: 1,
    ...over,
  };
}

/** A small field holding whatever is put in it. */
function field(over: Partial<GameState> = {}): GameState {
  const cols = 8;
  const rows = 6;
  const walls = Array.from(
    { length: cols * rows },
    (unused, index) =>
      index < cols ||
      index >= cols * (rows - 1) ||
      index % cols === 0 ||
      index % cols === cols - 1,
  );
  return {
    cols,
    rows,
    walls,
    breakable: walls.map(() => false),
    holes: walls.map(() => false),
    tanks: [tank()],
    bullets: [],
    mines: [],
    pickups: [],
    explosions: [],
    marks: [],
    shotsFired: 0,
    shotsHit: 0,
    wave: 0,
    nextWaveAt: null,
    trails: [],
    level: 0,
    lives: 3,
    phase: "playing",
    time: 0,
    random: createRandom(1),
    nextId: 1,
    ...over,
  };
}

/** Paints one frame and hands back what the canvas was asked to do. */
function paint(state: GameState): Call[] {
  const { ctx, calls } = recordingContext();
  draw(ctx, state, null);
  return calls;
}

/** The colour each kind of item is drawn in. */
const COLOURS = {
  shield: "#38bdf8",
  rapid: "#f97316",
  revive: "#22c55e",
  scatter: "#a855f7",
} as const;

describe("items on the floor", () => {
  it("paints each kind in its own colour", () => {
    for (const [kind, colour] of Object.entries(COLOURS)) {
      const pickup = {
        id: "k1",
        kind,
        x: TILE * 5,
        y: TILE * 3,
      } as Pickup;
      const calls = paint(field({ pickups: [pickup] }));
      expect(usedColour(calls, colour), `${kind} fehlt`).toBe(true);
    }
  });

  it("paints nothing of the sort while the floor is clear", () => {
    const calls = paint(field());
    for (const colour of Object.values(COLOURS)) {
      expect(usedColour(calls, colour)).toBe(false);
    }
  });
});

describe("the shield ring", () => {
  /** How often the ring is on across a stretch of the shield's last seconds. */
  function onOverTime(from: number, to: number, shieldUntil: number): number {
    let on = 0;
    const samples = 40;
    for (let i = 0; i < samples; i++) {
      const time = from + ((to - from) * i) / samples;
      const calls = paint(field({ time, tanks: [tank({ shieldUntil })] }));
      if (usedColour(calls, COLOURS.shield)) {
        on++;
      }
    }
    return on / samples;
  }

  it("shows while the shield holds", () => {
    const calls = paint(field({ time: 0, tanks: [tank({ shieldUntil: 10 })] }));
    expect(usedColour(calls, COLOURS.shield)).toBe(true);
  });

  it("is gone once the shield has lapsed", () => {
    const calls = paint(
      field({ time: 10, tanks: [tank({ shieldUntil: 10 })] }),
    );
    expect(usedColour(calls, COLOURS.shield)).toBe(false);
  });

  it("blinks out its last seconds instead of simply stopping", () => {
    const until = 10;
    // Early on it is solid: on in every frame.
    const early = onOverTime(0, until - SHIELD_BLINK_LEAD - 1, until);
    // At the end it flickers, so it is on only part of the time.
    const late = onOverTime(
      until - SHIELD_BLINK_LEAD + 0.05,
      until - 0.05,
      until,
    );
    expect(early).toBe(1);
    expect(late).toBeGreaterThan(0);
    expect(late).toBeLessThan(1);
  });
});
