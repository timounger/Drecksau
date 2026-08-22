/**
 * The cockpit: which space takes which die, from whom.
 *
 * @module
 * @remarks
 * Every number here comes from the rulebook. Written as data rather than as
 * branches, because "may this die go there" is asked in four places - the
 * referee, the list of legal moves, the computer opponent and the screen - and
 * four copies of it would be four chances to disagree.
 *
 * The two seats are **not** interchangeable. The pilot has the landing gear and
 * the brakes, the co-pilot the flaps, and there is no space that both may use
 * except the radio (one each side) and the concentration row. That asymmetry is
 * the game: neither of you can do the other's job, and you may not ask.
 */

/** Which side of the cockpit somebody sits on. */
export type Seat = 0 | 1;

/** The pilot, blue, left-hand side. */
export const PILOT: Seat = 0;

/** The co-pilot, orange, right-hand side. */
export const COPILOT: Seat = 1;

/** What a space does when a die lands on it. */
export type SpaceKind =
  "axis" | "engine" | "gear" | "flaps" | "brake" | "radio" | "coffee";

/** One place a die may be put. */
export type Space = {
  readonly id: string;
  readonly kind: SpaceKind;
  /** The seat that may use it, or null where both may. */
  readonly seat: Seat | null;
  /** The values it accepts, or null for any. */
  readonly values: readonly number[] | null;
  /** Its place within its own group - which gear leg, which flap. */
  readonly slot: number;
};

/** Dice each player rolls per round - from the rulebook. */
export const DICE_PER_PLAYER = 4;

/** Sides of a die. */
export const DIE_FACES = 6;

/** Rounds a landing takes - one per space of the altitude track. */
export const ROUNDS = 7;

/** How far the attitude indicator may tilt before the ✕. */
export const AXIS_LIMIT = 3;

/* eslint-disable @typescript-eslint/no-magic-numbers -- what is printed on the
   board. These are not quantities anything is derived from; they are the labels
   under the switches, and writing them as anything but themselves would put a
   layer of arithmetic between this file and the component it describes. */

/** Landing gear legs, and the values each accepts. */
export const GEAR_VALUES: readonly (readonly number[])[] = [
  [1, 2],
  [3, 4],
  [5, 6],
];

/** Flaps, in the order they must be deployed. */
export const FLAP_VALUES: readonly (readonly number[])[] = [
  [1, 2],
  [2, 3],
  [4, 5],
  [5, 6],
];

/** Brakes, in the order they must be activated - and their strength. */
export const BRAKE_VALUES: readonly number[] = [2, 4, 6];

/* eslint-enable @typescript-eslint/no-magic-numbers */

/** Concentration spaces, which is also the most coffee you may hold. */
export const COFFEE_SPACES = 3;

/** Where the blue aerodynamics marker starts. */
export const BLUE_START = 4;

/** Where the orange aerodynamics marker starts. */
export const ORANGE_START = 8;

/** Radio spaces the co-pilot has; the pilot has one. */
const COPILOT_RADIOS = 2;

/**
 * Every space in the cockpit, in the order the screen reads them.
 *
 * @remarks
 * The ids are what a move names and what a saved game stores, so they are
 * stable: `gear-1` is the middle leg for as long as this game exists.
 */
export const SPACES: readonly Space[] = [
  { id: "axis-p", kind: "axis", seat: PILOT, values: null, slot: 0 },
  { id: "axis-c", kind: "axis", seat: COPILOT, values: null, slot: 1 },
  { id: "engine-p", kind: "engine", seat: PILOT, values: null, slot: 0 },
  { id: "engine-c", kind: "engine", seat: COPILOT, values: null, slot: 1 },
  ...GEAR_VALUES.map((values, slot) => ({
    id: `gear-${slot}`,
    kind: "gear" as const,
    seat: PILOT,
    values,
    slot,
  })),
  ...FLAP_VALUES.map((values, slot) => ({
    id: `flaps-${slot}`,
    kind: "flaps" as const,
    seat: COPILOT,
    values,
    slot,
  })),
  ...BRAKE_VALUES.map((value, slot) => ({
    id: `brake-${slot}`,
    kind: "brake" as const,
    seat: PILOT,
    values: [value],
    slot,
  })),
  { id: "radio-p", kind: "radio", seat: PILOT, values: null, slot: 0 },
  ...Array.from({ length: COPILOT_RADIOS }, (unused, index) => ({
    id: `radio-c${index}`,
    kind: "radio" as const,
    seat: COPILOT,
    values: null,
    slot: index + 1,
  })),
  ...Array.from({ length: COFFEE_SPACES }, (unused, index) => ({
    id: `coffee-${index}`,
    kind: "coffee" as const,
    seat: null,
    values: null,
    slot: index,
  })),
];

/**
 * Looks a space up by its id.
 *
 * @param id - the id a move named
 * @returns the space, or undefined if the id is not one
 */
export function spaceById(id: string): Space | undefined {
  return SPACES.find((space) => space.id === id);
}

/**
 * Whether this seat may put this value on this space.
 *
 * @param space - the space in question
 * @param seat - who wants to use it
 * @param value - the value the die shows, coffee already spent
 * @returns true if colour and number both allow it
 * @remarks
 * Says nothing about whether the space is free or whether the flaps before it
 * are out - that is the referee's business, because it depends on the game and
 * not on the cockpit.
 */
export function accepts(space: Space, seat: Seat, value: number): boolean {
  return (
    (space.seat === null || space.seat === seat) &&
    (space.values === null || space.values.includes(value))
  );
}
