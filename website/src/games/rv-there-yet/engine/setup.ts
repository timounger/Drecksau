/**
 * Starting a drive: the state the map begins in, at a section.
 *
 * @module
 */
import { besideTheVehicle } from "./engine";
import { SECTIONS, SECTION_COUNT, MAP } from "./map";
import { REMOTE, type GameState, type Route } from "./types";

/** The rope is off the hook. */
const UNHOOKED = -1;

/** How far apart two players are put down at the start, in metres. */
const SIDE_BY_SIDE = 2.5;

/**
 * Begins a drive at a section.
 *
 * @param section - which one, counted from zero
 * @param people - how many are playing: one alone, two in co-op
 * @returns the world at that section, ready to go
 * @remarks
 * You start **beside** the motorhome, not in it. It is the first thing the game
 * has to teach - that there is a person here who gets in and out - and a
 * player who begins already behind the wheel never finds that out until the
 * first wall stops them.
 */
export function startAt(section: number, people = 1): GameState {
  const index = Math.min(SECTION_COUNT - 1, Math.max(0, section));
  const x = SECTIONS[index];
  return {
    rv: { x, v: 0 },
    hooked: UNHOOKED,
    rope: 0,
    winch: 0,
    // Every section begins with a full tank: a fresh start is a fresh tank.
    fuel: 1,
    phase: "driving",
    time: 0,
    doing: null,
    still: 0,
    brake: false,
    felled: false,
    reached: x,
    people: Array.from({ length: Math.max(1, people) }, (_each, who) => ({
      // Side by side rather than on top of each other, so two players can
      // tell which little figure is theirs before either has moved.
      at: besideTheVehicle(x) + who * SIDE_BY_SIDE,
      inside: false,
      stride: 0,
      facing: 1,
      walking: false,
      lift: 0,
      rise: 0,
      pop: -1,
      // The remote is the motorhome's own, so it is in the bag - and in hand,
      // because starting with empty hands would only mean one press before
      // anybody could do anything at all.
      carrying: [REMOTE],
      // Empty hands. The remote is in the bag from the start, but it only
      // comes out once the rope is on something.
      holding: null,
    })),
    // The map says where it sleeps; the drive is what wakes it.
    bear:
      MAP.bear === null
        ? null
        : { at: MAP.bear, hold: 0, sprayed: 0, gone: false },
    driver: -1,
    gear: 1,
    damaged: false,
    tyres: false,
    repair: 0,
    section: index,
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
