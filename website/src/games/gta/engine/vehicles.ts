/**
 * What is on the roads, and how each of it behaves.
 *
 * @module
 * @remarks
 * Five bodies, one row each: how big it is, how fast it goes, how hard it
 * pulls away, how sharply it turns and how much it can take. The engine asks
 * the row rather than the kind, so a sixth body - a bus, a fire engine - is a
 * row and a shape, not a new branch in the driving code.
 *
 * The tank is in the table for the same reason: it is not a special case, it is
 * a very slow, very heavy, very tough car that happens to have a gun. Only the
 * gun is a special case.
 */

/** What sort of vehicle something is. */
export type VehicleBody = "car" | "suv" | "taxi" | "bike" | "cycle" | "tank";

/** One body, as numbers. */
export type Vehicle = {
  readonly body: VehicleBody;
  /** What it is called on screen. */
  readonly name: string;
  /** How long it is, in pixels. */
  readonly length: number;
  /** How wide it is. */
  readonly width: number;
  /** Top speed in pixels a second. */
  readonly top: number;
  /** How hard it accelerates, in pixels a second squared. */
  readonly accel: number;
  /** How sharply it turns at speed, in radians a second. */
  readonly turn: number;
  /** How much bodywork it has. */
  readonly health: number;
  /** True for the one that can shoot back. */
  readonly gun: boolean;
  /**
   * How many policemen ride in one, when the police send it.
   *
   * @remarks
   * Two in a patrol car, one on a bike, one in the tank. It is what says how
   * many men get out at the kerb, and a bike with two men on it would be a
   * circus act.
   */
  readonly seats: number;
};

/** Every body there is. */
export const VEHICLES: Readonly<Record<VehicleBody, Vehicle>> = {
  car: {
    body: "car",
    name: "Wagen",
    length: 44,
    width: 24,
    top: 420,
    accel: 260,
    turn: 2.6,
    health: 100,
    gun: false,
    seats: 2,
  },
  suv: {
    body: "suv",
    name: "Geländewagen",
    length: 54,
    width: 30,
    top: 380,
    accel: 235,
    turn: 2.1,
    health: 150,
    gun: false,
    seats: 2,
  },
  taxi: {
    body: "taxi",
    name: "Taxi",
    length: 46,
    width: 25,
    top: 430,
    accel: 275,
    turn: 2.7,
    health: 95,
    gun: false,
    seats: 2,
  },
  bike: {
    body: "bike",
    name: "Motorrad",
    length: 34,
    width: 14,
    top: 480,
    accel: 330,
    turn: 3.4,
    health: 55,
    gun: false,
    seats: 1,
  },
  cycle: {
    body: "cycle",
    name: "Fahrrad",
    length: 28,
    width: 12,
    top: 150,
    accel: 130,
    turn: 3.8,
    health: 25,
    gun: false,
    seats: 1,
  },
  tank: {
    body: "tank",
    name: "Panzer",
    length: 62,
    width: 46,
    top: 190,
    accel: 120,
    turn: 1.1,
    health: 400,
    gun: true,
    seats: 1,
  },
};

/**
 * How far out from the middle a body reaches, for bumping into things.
 *
 * @param body - the sort of vehicle
 * @returns one radius that stands for a shape that is not round
 * @remarks
 * The mean of half the length and half the width: a circle that is too small
 * at the nose and too big at the flank, which is the usual bargain in a game
 * that checks a few hundred pairs a frame.
 */
export function bodyRadius(body: VehicleBody): number {
  const shape = VEHICLES[body];
  return (shape.length / 2 + shape.width / 2) / 2;
}

/**
 * What rolls in ordinary traffic, and how often.
 *
 * @remarks
 * Mostly cars, a good few off-roaders, the odd bike and the odd cyclist. The
 * tank is not in here - it stands about, and finding one is meant to be an
 * event rather than a queue at the lights.
 */
export const ON_THE_ROAD: readonly VehicleBody[] = [
  "car",
  "car",
  "car",
  "car",
  "car",
  "suv",
  "suv",
  "taxi",
  "taxi",
  "bike",
  "cycle",
];

/**
 * How many tanks stand about the city.
 *
 * @remarks
 * None. A tank is not something one finds parked at the kerb - it is what the
 * police send at six stars, and the only way to get one is to take it off
 * them. That makes it the last thing in the game rather than the first.
 */
export const TANKS = 0;
