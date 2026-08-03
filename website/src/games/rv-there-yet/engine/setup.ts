/**
 * Starting a drive: the state the map begins in, at a checkpoint.
 *
 * @module
 */
import { besideTheVehicle } from "./engine";
import { CHECKPOINTS, CHECKPOINT_COUNT, MAP } from "./map";
import { type GameState, type Route } from "./types";

/** The rope is off the hook. */
const UNHOOKED = -1;

/** How far apart two players are put down at the start, in metres. */
const SIDE_BY_SIDE = 2.5;

/**
 * Begins a drive at a checkpoint.
 *
 * @param checkpoint - which one, counted from zero
 * @param people - how many are playing: one alone, two in co-op
 * @returns the world at that checkpoint, ready to go
 * @remarks
 * You start **beside** the motorhome, not in it. It is the first thing the game
 * has to teach - that there is a person here who gets in and out - and a
 * player who begins already behind the wheel never finds that out until the
 * first wall stops them.
 */
export function startAt(checkpoint: number, people = 1): GameState {
  const index = Math.min(CHECKPOINT_COUNT - 1, Math.max(0, checkpoint));
  const x = CHECKPOINTS[index];
  return {
    rv: { x, v: 0 },
    hooked: UNHOOKED,
    rope: 0,
    battery: 1,
    phase: "driving",
    time: 0,
    reached: x,
    people: Array.from({ length: Math.max(1, people) }, (_each, who) => ({
      // Side by side rather than on top of each other, so two players can
      // tell which little figure is theirs before either has moved.
      at: besideTheVehicle(x) + who * SIDE_BY_SIDE,
      inside: false,
      stride: 0,
      facing: 1,
      walking: false,
      carrying: [],
    })),
    driver: -1,
    gear: 1,
    damaged: false,
    tyres: false,
    repair: 0,
    checkpoint: index,
  };
}

/**
 * The map being driven.
 *
 * @returns the route
 * @remarks
 * A function rather than the constant itself, so the rest of the game asks for
 * "the map" and never has to care that there is only one.
 */
export function theMap(): Route {
  return MAP;
}
