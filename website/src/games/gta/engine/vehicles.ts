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
  | "car"
  | "patrol"
  | "patrolbike"
  | "suv"
  | "taxi"
  | "bike"
  | "cycle"
  | "corsa"
  | "corsaelegance"
  | "corsaultimate"
  | "tank"
  | "dmc"
  | "tractor";

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
    name: "Golf VIII",
    length: 44,
    // Off the mesh: 4284 by 1789 is 44 by 18.4, and that is what it is drawn
    // and collided at. Twenty four was a guess and made it look like a van.
    width: 18.4,
    top: 420,
    accel: 260,
    turn: 2.6,
    health: 100,
    gun: false,
    seats: 2,
    grip: 16,
  },
  /**
   * What the police drive: an estate, and a big one.
   *
   * @remarks
   * Not the hatchback with a light bar on it that it used to be. The car in
   * the reference photograph (`game_instructions/GTA/Fahrzeuge/Polizei`) is a
   * Mercedes E-Klasse T-Modell, and at the scale everything else is drawn at -
   * the Golf's 4284 millimetres are 44 pixels - its 4949 by 1880 come out at
   * 50,8 by 19,3. Six pixels longer than a Golf is a pixel and a half of
   * mirror on either side of one in the rear-view: the size **is** the thing
   * one notices when a patrol car pulls up behind.
   *
   * It drives like the Golf on purpose. A chase that the player cannot lose
   * and a chase he cannot win are equally dull, and that balance was tuned
   * when the patrol car was the same row as his - so the numbers stay where
   * they were, give or take what a longer, heavier car is owed.
   */
  patrol: {
    body: "patrol",
    name: "Polizeiwagen",
    length: 50.8,
    width: 19.3,
    top: 420,
    accel: 260,
    turn: 2.5,
    health: 110,
    gun: false,
    seats: 2,
    grip: 15,
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
  /**
   * The Cybertruck, measured rather than guessed.
   *
   * @remarks
   * 5,68 m long and 2,03 m across the body. The city draws at **10,3 pixels
   * to the metre** - a Golf VIII is 4,28 m and 44 pixels, an E-Klasse 4,95 m
   * and 50,8 - so this one is 58 by 21, and that is the whole of what makes it
   * look big: it is a third longer than a Golf and barely two pixels wider.
   * Thirty pixels across was two metres and a half, which is a van.
   */
  suv: {
    body: "suv",
    name: "Cybertruck",
    length: 58,
    // 2,03 m over the body and 2,20 m over the mirrors, and it is the mirrors
    // one sees from above: 22,6 pixels at the city's 10,3 to the metre. Still
    // only four wider than a Golf, which is what it is.
    width: 22.6,
    top: 380,
    accel: 235,
    turn: 2.1,
    health: 150,
    gun: false,
    seats: 2,
    // Tall and heavy: it leans onto the outside tyres and washes wide.
    grip: 13,
  },
  /**
   * The taxi, which is the same car as the patrol car in a different colour.
   *
   * @remarks
   * As it is on the street: the German taxi is an E-Klasse, and so is the
   * patrol car - same length, same width, same bodywork, and the only
   * differences are the paint, the chequered band and the sign on the roof.
   * Twenty five pixels across was two and a half metres, which no saloon has
   * ever been.
   */
  /**
   * The Opel Corsa F, and the two better ones.
   *
   * @remarks
   * **A Golf with a foot taken out of it.** 4,06 m by 1,765 - at the city's
   * 10,3 pixels to the metre that is 41,7 by 18,1 against the Golf's 44 by
   * 18,4 - so it is a shade narrower and noticeably shorter, which is the
   * whole of what one is looking at from up here. Its wheelbase is shorter in
   * the same proportion, so it turns a little tighter.
   *
   * The three of them are three **bodies** rather than one body with a trim
   * level on it, because what separates them is what is under the bonnet:
   * seventy five, a hundred and a hundred and thirty horses. Power lives in
   * this table, one row per vehicle, and a car that drives differently is a
   * different row. The paint, the black roof and the wheels then follow from
   * which row it is.
   */
  corsa: {
    body: "corsa",
    name: "Opel Corsa F",
    length: 41.7,
    width: 18.1,
    // 75 PS: the one that gets out of the way of everything else.
    top: 360,
    accel: 200,
    turn: 2.75,
    health: 90,
    gun: false,
    seats: 2,
    grip: 16,
  },
  corsaelegance: {
    body: "corsaelegance",
    name: "Opel Corsa F Elegance",
    length: 41.7,
    width: 18.1,
    // 100 PS, and a black roof to say so.
    top: 400,
    accel: 235,
    turn: 2.75,
    health: 90,
    gun: false,
    seats: 2,
    grip: 16.5,
  },
  corsaultimate: {
    body: "corsaultimate",
    name: "Opel Corsa F Ultimate",
    length: 41.7,
    width: 18.1,
    // 130 PS. Faster than a Golf off the line and slower at the top, which is
    // what a small car with a big engine in it actually does.
    top: 440,
    accel: 275,
    turn: 2.75,
    health: 90,
    gun: false,
    seats: 2,
    grip: 17,
  },
  taxi: {
    body: "taxi",
    name: "Taxi",
    length: 50.8,
    width: 19.3,
    top: 430,
    accel: 275,
    turn: 2.7,
    health: 95,
    gun: false,
    seats: 2,
    grip: 17,
  },
  /**
   * The ordinary motorbike, which is the patrol bike without the stripes.
   *
   * @remarks
   * The same machine and the same drawing: a faired tourer with panniers, in
   * green or black instead of the livery and with nothing flashing on it. One
   * shape done properly beats two done roughly, and a city where the police
   * ride a different **make** of motorbike from everybody else is a city where
   * somebody drew two bikes.
   */
  bike: {
    body: "bike",
    name: "Motorrad",
    length: 36,
    width: 11,
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
  /**
   * The machine they put a policeman on: a BMW R 1300 RT.
   *
   * @remarks
   * A tourer, not a naked bike - which is the whole reason it is a row of its
   * own rather than a plain motorbike in police paint. It carries a tall
   * screen, a full fairing and a pannier on each side, and from above those
   * panniers are what one sees: narrow at the front, wide at the back. See
   * `game_instructions/GTA/Fahrzeuge/Polizei/polizei_motorrad.png`.
   *
   * Half a hundredweight of luggage and radio says it should not handle like
   * the courier's bike, so it does not: a little slower, a little lazier into
   * a corner, and rather harder to knock off the road.
   */
  patrolbike: {
    body: "patrolbike",
    name: "Polizeimotorrad",
    length: 36,
    // Narrow, even with the panniers on: a thousand millimetres across against
    // the car's eighteen hundred. Drawn any wider it stops being a motorbike
    // from above and starts being a very short van.
    width: 11,
    top: 460,
    accel: 310,
    turn: 3.1,
    health: 70,
    gun: false,
    seats: 1,
    grip: 90,
  },
  /**
   * The bicycle, which is the narrowest thing in the city.
   *
   * @remarks
   * Nine pixels across, and most of those are the rider: a bicycle from above
   * is a line with a pair of shoulders on it. Twelve made it as wide as a
   * motorbike with panniers, which is about three times what one is.
   */
  cycle: {
    body: "cycle",
    name: "Fahrrad",
    length: 28,
    width: 9,
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
/**
 * Whether this body runs on two wheels.
 *
 * @param body - the sort of vehicle
 * @returns true for the bicycle and both motorbikes
 * @remarks
 * Three things hang off this and all three are the same fact: a rider sits on
 * top of it rather than inside it. It has no reversing lamp, it has no reverse
 * gear, and what one sees of the person on it is a person and not a roof.
 */
export function twoWheeled(body: VehicleBody): boolean {
  return body === "bike" || body === "cycle" || body === "patrolbike";
}

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
  // The Corsa is the other small hatchback in the traffic: plenty of the plain
  // one, fewer of each better one, the same way they sell.
  "corsa",
  "corsa",
  "corsaelegance",
  "corsaultimate",
  // One of these to five saloons. It is the odd one out in the traffic, not
  // every other car at the lights.
  "suv",
  "taxi",
  "taxi",
  // Police going about their business. Most of what the police do is drive
  // around, and one that is not after anybody has its blue lights off - which
  // is the whole reason they are in this list rather than only turning up when
  // the player has earned it. **One of each and no more**: the point of a
  // patrol in the traffic is that one comes past now and then, and with two
  // cars in the list there was one at every other junction.
  "patrol",
  "patrolbike",
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
