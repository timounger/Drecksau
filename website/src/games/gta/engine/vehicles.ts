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
export type VehicleBody =
  "car" | "suv" | "taxi" | "bike" | "cycle" | "tank" | "dmc" | "tractor";

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
  /**
   * How quickly the tyres pull a slide straight, in shares a second.
   *
   * @remarks
   * The one number that gives each body a character the others cannot copy.
   * High and the thing follows its nose whatever one does with the wheel - a
   * bicycle, a tank on tracks. Low and the back comes round in a fast corner:
   * a heavy off-roader rolls onto its outside tyres, a DMC-12 has its engine
   * behind the rear axle and behaves accordingly.
   *
   * It sets how far sideways a corner puts the car, and the sum is worth
   * knowing: at full lock the slide settles at roughly **top speed times turn
   * rate, divided by this**. A saloon at 420 and 2.6 with a grip of 16 sits
   * about seventy pixels a second sideways - a tenth of a turn out of line,
   * which is a car leaning on its tyres rather than a car losing them.
   */
  readonly grip: number;
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
    grip: 16,
  },
  dmc: {
    body: "dmc",
    name: "DMC-12",
    // Low, wide and quick: the fastest thing on four wheels in this city, and
    // the only one that is never painted - it is bare stainless steel.
    length: 46,
    width: 27,
    top: 520,
    accel: 320,
    turn: 2.45,
    health: 85,
    gun: false,
    seats: 2,
    // The engine is behind the back axle. It goes, and then it goes sideways.
    // Engine behind the back axle: it goes, and then it goes sideways.
    grip: 6.5,
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
    // Tall and heavy: it leans onto the outside tyres and washes wide.
    grip: 13,
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
    grip: 17,
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
    // Two wheels lean into a corner instead of leaning out of one: a bike
    // holds a line nothing on four wheels can.
    grip: 100,
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
    grip: 120,
  },
  tractor: {
    body: "tractor",
    name: "Traktor",
    // Slow, heavy and stubborn. Nothing about it is a getaway car - what it is
    // for is the tow bar on the back, and for that it only has to be able to
    // pull.
    length: 48,
    width: 28,
    top: 190,
    accel: 150,
    turn: 1.9,
    health: 180,
    gun: false,
    seats: 1,
    // Slow enough that it could not slide if it wanted to.
    grip: 70,
  },
  tank: {
    body: "tank",
    name: "Panzer",
    length: 62,
    width: 46,
    top: 190,
    accel: 120,
    turn: 1.1,
    // Three times what it used to have, and see TANK_ARMOUR: small arms are a
    // waste of time against it, which is the point of there being one.
    health: 1200,
    gun: true,
    seats: 1,
    // Tracks, not tyres. A tank does not drift; it goes where it is pointed.
    grip: 200,
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
 * One, and it is not parked at a kerb: it stands behind the wire of the
 * military base out in the desert with ten armed men round it. The other way
 * to get one is still to take it off the police at six stars. Both ways cost
 * every star there is, which is what makes a tank the last thing in the game
 * rather than the first.
 */
export const TANKS = 1;

/**
 * How many tractors stand about the farms.
 *
 * @remarks
 * One to a farm. They are not traffic - nobody drives a tractor down a
 * motorway - so they stand where they belong and wait for somebody who needs
 * to tow something.
 */
export const TRACTORS = 4;

/**
 * How many DMC-12s stand about the city.
 *
 * @remarks
 * Three, parked, never in traffic. It is the fastest car in Los Santos and it
 * looks like nothing else on the road, so finding one should be a small event
 * rather than something one overtakes on the way to a job.
 */
export const DELOREANS = 3;
