/**
 * Tests that the aim line starts at the tank this client actually steers.
 *
 * @module
 */
import { describe, expect, it } from "vitest";
import { draw } from "./render";
import { project } from "./projection";
import { createGame } from "../engine/setup";
import type { GameState } from "../engine/types";

/** One recorded canvas call: the method and what it was given. */
type Call = { readonly name: string; readonly args: readonly unknown[] };

/** A screen point. */
type Point = { readonly x: number; readonly y: number };

/**
 * Where the mouse points, in world coordinates.
 *
 * Deliberately off the tile grid: the aim line is found by the point it ends
 * at, and no wall or tank corner can sit on these odd fractions by accident.
 */
const CURSOR = { x: 703.5, y: 401.25 };

/**
 * How far the line's start may sit above the tank's floor spot, in pixels.
 *
 * It is drawn at turret height, and the projection turns height into an upward
 * shift - so any sane rise is a small offset in y.
 */
const RISE_LIMIT = 20;

/**
 * A canvas context that records every call instead of painting.
 *
 * @returns the stand-in context and the list it fills
 * @remarks
 * A Proxy answers every property, so the renderer can use the whole 2D API
 * without this stub having to grow alongside it.
 */
function recordingContext(): {
  readonly ctx: CanvasRenderingContext2D;
  readonly calls: Call[];
} {
  const calls: Call[] = [];
  // Whatever a call returns must survive being used as a gradient.
  const gradient = { addColorStop: () => undefined };
  const canvas = { width: 800, height: 600 };
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
      set: () => true,
    },
  ) as unknown as CanvasRenderingContext2D;
  return { ctx, calls };
}

/**
 * Where the aim line was started.
 *
 * @param calls - everything the renderer asked the canvas to do
 * @returns the starting point, or null if no aim line was drawn
 * @remarks
 * The aim line is the one line that ends exactly on the cursor: the X around it
 * is drawn from an offset, and {@link CURSOR} sits off the grid so no scenery
 * lands there.
 */
function aimLineStart(calls: readonly Call[]): Point | null {
  const at = project(CURSOR.x, CURSOR.y);
  const end = calls.findIndex(
    (call) =>
      call.name === "lineTo" && call.args[0] === at.x && call.args[1] === at.y,
  );
  let start: Point | null = null;
  if (end >= 0) {
    // The moveTo just before it is where the line began.
    for (let i = end - 1; i >= 0 && start === null; i--) {
      if (calls[i].name === "moveTo") {
        start = {
          x: calls[i].args[0] as number,
          y: calls[i].args[1] as number,
        };
      }
    }
  }
  return start;
}

/** The tank of that id. */
function tankOf(state: GameState, id: string): Point {
  const tank = state.tanks.find((each) => each.id === id);
  expect(tank, `no tank ${id}`).toBeDefined();
  return { x: tank!.x, y: tank!.y };
}

/** Runs one frame and reports where the aim line began. */
function aimFrom(state: GameState, ownId: string): Point | null {
  const { ctx, calls } = recordingContext();
  draw(ctx, state, { ...CURSOR, ownId });
  return aimLineStart(calls);
}

describe("the aim line in co-op", () => {
  it("starts at the host's own tank", () => {
    const state = createGame(1, 2);
    const start = aimFrom(state, "player");
    expect(start).not.toBeNull();
    // The projection leaves x untouched, so this pins the tank exactly.
    expect(start!.x).toBe(tankOf(state, "player").x);
  });

  it("starts at the guest's own tank, not at the host's", () => {
    const state = createGame(1, 2);
    const mine = tankOf(state, "player2");
    const host = tankOf(state, "player");
    // The two tanks really do start apart, or this would prove nothing.
    expect(mine.x).not.toBe(host.x);

    const start = aimFrom(state, "player2");
    expect(start).not.toBeNull();
    expect(start!.x).toBe(mine.x);
    // And it sits just above that tank's spot on the floor, at turret height.
    const floor = project(mine.x, mine.y).y;
    expect(start!.y).toBeLessThanOrEqual(floor);
    expect(floor - start!.y).toBeLessThan(RISE_LIMIT);
  });

  it("draws no line while your own tank is gone", () => {
    const base = createGame(1, 2);
    const state: GameState = {
      ...base,
      tanks: base.tanks.map((tank) =>
        tank.id === "player2" ? { ...tank, alive: false } : tank,
      ),
    };
    expect(aimFrom(state, "player2")).toBeNull();
  });
});
