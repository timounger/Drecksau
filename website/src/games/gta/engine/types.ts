/**
 * The world of GTA: what is in it, and every number that tunes it.
 *
 * @module
 * @remarks
 * The city is continuous - everything is measured in pixels - while the streets
 * are laid out on a grid of {@link TILE}-sized cells. Every number a designer
 * would want to turn sits here with a name, so the {@link ../engine simulation}
 * reads as rules rather than as arithmetic.
 *
 * Nothing in this game reaches for the clock or the DOM: the same seed and the
 * same key presses play out the same way twice, which is what makes a chase
 * testable without a browser.
 */
import type { RandomState } from "./random";
import type { PersonKind } from "./people";
import type { VehicleBody } from "./vehicles";
import type { WeaponKind } from "./weapons";

/** A point or a vector in the city, in pixels. */
export type Vec = {
  readonly x: number;
  readonly y: number;
};

/** Edge length of one city cell, in pixels. */
export const TILE = 48;

/** How many cells the city is across and down. */
export const CITY_TILES = 168;

/** How wide the whole city is, in pixels. */
export const CITY_SIZE = CITY_TILES * TILE;

/**
 * How many squares one block of the city grid is, street included.
 *
 * @remarks
 * Eight. It was six, which gave a street one square wide - and one square is
 * forty eight pixels, which is two cars side by side with nothing to spare.
 * Two cars meeting on it had to pass with their wheels on the kerb. A street
 * is three squares now, and the block grew by two to pay for it, so the plots
 * on it are the same size as before and there is simply more room between
 * them.
 *
 * Ten was tried first, which gave five square plots - proper big buildings -
 * and left forty six built blocks in the whole of San Andreas, one of them the
 * only supermarket. A city one can cross in three streets is not a city. Eight
 * is what fits: the blocks are bigger, the streets are three times wider, and
 * there are still enough corners to put things on.
 */
export const BLOCK_TILES = 8;

/**
 * The train, which is one number.
 *
 * @remarks
 * How far it has come along the loop. Everything else about it - where the
 * engine is, where the fourth carriage is, which way they point - is worked
 * out from that, so the whole train costs one number to keep and to save.
 */
export type Train = {
  /** Distance along the loop, in pixels, from the north-west corner. */
  readonly along: number;
  /** The clock reading it may leave the platform at. */
  readonly waitUntil: number;
  /** How fast it is going right now, in pixels a second. */
  readonly speed: number;
};

/** How hard it pulls away from a platform, in pixels a second squared. */
export const TRAIN_ACCEL = 230;

/** And how hard it brakes for the next one. */
export const TRAIN_BRAKE = 280;

/** How long it stands in a station, in seconds. */
export const STATION_WAIT = 5;

/** How near a standing train one has to be to get on, in pixels. */
export const BOARD_REACH = 90;

/**
 * How fast it goes, in pixels a second.
 *
 * @remarks
 * Faster than the traffic, which is the point of taking it: one lap of San
 * Andreas is about fifty seconds of running plus the three station stops.
 */
export const TRAIN_SPEED = 440;

/** How many carriages there are, engine included. */
export const TRAIN_CARS = 5;

/** How far apart two of them are, in pixels. */
export const TRAIN_GAP = 62;

/** How long one carriage is. */
export const TRAIN_LONG = 58;

/** And how wide. */
export const TRAIN_WIDE = 26;

/** How much it takes off whatever it catches on the line. */
export const TRAIN_HURT = 90;

/**
 * The helicopter on the pad at the military base: the one you can fly.
 *
 * @remarks
 * Not the police machine - that one is {@link Heli} and flies itself. This one
 * does nothing at all until somebody climbs in, and then it does exactly what
 * the keys say: nose round, forward, and up while the space bar is held.
 */
export type Chopper = {
  readonly x: number;
  readonly y: number;
  /** Which way the nose points, in radians. */
  readonly angle: number;
  /** How far off the ground it is, in pixels. */
  readonly height: number;
  /** How fast it is going forwards, in pixels a second. */
  readonly speed: number;
  /** Where the rotor is in its turn, in radians. */
  readonly spin: number;
};

/** How fast the helicopter climbs, in pixels a second. */
export const CHOP_RISE = 70;

/** And sinks, with the space bar let go. */
export const CHOP_FALL = 55;

/** How high it goes at all. */
export const CHOP_CEILING = 140;

/** How fast it flies, in pixels a second. */
export const CHOP_SPEED = 460;

/** How hard it picks that up, and loses it again. */
export const CHOP_ACCEL = 240;

/** How quickly the nose comes round, in radians a second. */
export const CHOP_TURN = 1.5;

/** How fast the rotor turns, in radians a second. */
export const CHOP_SPIN = 26;

/** How near one has to stand to climb in, in pixels. */
export const CHOP_REACH = 70;

/** One city: a rectangle of land in the sea, in tiles. */
export type Island = {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
};

/**
 * The three cities of San Andreas.
 *
 * @remarks
 * West, north-east and south-east, with open water between them and three
 * bridges over it. Their edges fall on multiples of six so that the grid of
 * streets inside them lines up with the bridges that join them.
 *
 * It lives here rather than in ./city because two modules have to agree about
 * it: the floor lays sea where there is no island, and the block table refuses
 * to put a hospital on a square of water.
 */
export const ISLANDS: readonly Island[] = [
  { left: 12, top: 42, right: 48, bottom: 96 },
  { left: 108, top: 12, right: 156, bottom: 66 },
  { left: 90, top: 108, right: 156, bottom: 156 },
];

/**
 * The land itself: everything outside these rectangles is sea.
 *
 * @remarks
 * The three cities are only the built-up corners of it. Between them lie a
 * forest in the north-west, a desert across the north, meadows down the middle
 * and a mountain in the south-west - and a bay in the middle of all of it, so
 * that the way from San Fierro to the south is a bridge rather than a street.
 *
 * Rectangles, because a coastline drawn by hand would be a map file, and there
 * is no map file. The ragged edge comes later: see `shoreShift` in ./city.
 */
export const LAND: readonly Island[] = [
  { left: 8, top: 8, right: 58, bottom: 44 },
  { left: 8, top: 40, right: 50, bottom: 96 },
  { left: 46, top: 62, right: 60, bottom: 94 },
  { left: 54, top: 4, right: 114, bottom: 72 },
  { left: 104, top: 8, right: 158, bottom: 70 },
  { left: 76, top: 66, right: 126, bottom: 118 },
  { left: 68, top: 114, right: 126, bottom: 158 },
  { left: 108, top: 62, right: 150, bottom: 116 },
  { left: 86, top: 104, right: 158, bottom: 158 },
  { left: 8, top: 110, right: 44, bottom: 158 },
  { left: 40, top: 134, right: 70, bottom: 158 },
];

/**
 * The mountain in the south-west, as a middle and a radius in squares.
 *
 * @remarks
 * Mount Chiliad, and the only thing on the map one climbs rather than drives
 * round: a dirt track winds up it from the south side to the top. There is no
 * height in this game - the picture is flat - so the mountain is drawn as
 * bands of stone that grow lighter towards the summit, which is how a map
 * shows a mountain and how the eye reads one.
 */
export const MOUNTAIN = { x: 24, y: 134, radius: 15 };

/**
 * The fields of the north-west.
 *
 * @remarks
 * Rectangles, because fields are: somebody ploughed them that way. What makes
 * them read as farmland rather than as green squares is the furrows, which the
 * renderer draws, and the barns standing between them.
 */
export const FIELDS: readonly Island[] = [
  { left: 12, top: 12, right: 22, bottom: 18 },
  { left: 26, top: 10, right: 36, bottom: 16 },
  { left: 14, top: 22, right: 23, bottom: 28 },
  { left: 28, top: 20, right: 38, bottom: 26 },
  { left: 40, top: 14, right: 50, bottom: 20 },
  { left: 18, top: 32, right: 28, bottom: 38 },
  { left: 34, top: 30, right: 44, bottom: 36 },
  { left: 44, top: 24, right: 52, bottom: 30 },
];

/**
 * The farms themselves: a barn or a farmhouse apiece.
 *
 * @remarks
 * Walls like any house, and like the sheds on the military base they belong to
 * no city block - so the renderer draws them where they stand. Each one has a
 * tractor parked beside it.
 */
export const FARMS: readonly Island[] = [
  { left: 24, top: 17, right: 28, bottom: 19 },
  { left: 39, top: 28, right: 43, bottom: 30 },
  { left: 15, top: 30, right: 18, bottom: 32 },
  { left: 46, top: 21, right: 49, bottom: 23 },
];

/** How far behind the tractor a towed vehicle hangs, in pixels. */
export const TOW_GAP = 58;

/** How near one has to stop to hook something up, in pixels. */
export const TOW_REACH = 110;

/** How far a tow will stretch before the rope comes off, in pixels. */
export const TOW_SNAP = 140;

/** The desert across the north, between the forest and Las Venturas. */
export const DESERT: Island = { left: 54, top: 0, right: 112, bottom: 70 };

/** The docks west of the bay, where the boats lie. */
export const HARBOUR: Island = { left: 46, top: 64, right: 60, bottom: 94 };

/**
 * The piers that stick out of them into the water.
 *
 * @remarks
 * Concrete over the sea, one square wide apart from the wide one at the end -
 * one can drive out onto them, and there is nothing at the far end but water.
 */
export const PIERS: readonly Island[] = [
  { left: 58, top: 68, right: 70, bottom: 69 },
  { left: 58, top: 76, right: 71, bottom: 77 },
  { left: 58, top: 84, right: 69, bottom: 85 },
];

/**
 * The military base out in the desert.
 *
 * @remarks
 * A square of wire with one gate in the south fence and a tank standing inside
 * it. It is the only place in San Andreas one can simply take a tank, and
 * walking through the gate is worth every star there is - which is the trade:
 * the tank is not hidden, it is guarded.
 */
export const BASE: Island = { left: 60, top: 28, right: 78, bottom: 44 };

/** The gate: where the south fence is missing, in columns. */
export const BASE_GATE = { left: 67, right: 69 };

/**
 * The buildings on the base: hangar, barracks, store.
 *
 * @remarks
 * Walls like any other house - one drives round them, not through them - but
 * they are not part of any city block, so they are drawn where they stand
 * rather than dealt out of the block table.
 */
export const BASE_HUTS: readonly Island[] = [
  { left: 70, top: 30, right: 76, bottom: 34 },
  { left: 70, top: 37, right: 75, bottom: 39 },
  { left: 62, top: 41, right: 65, bottom: 42 },
];

/** Where the helicopter stands, in squares. */
export const BASE_PAD = { x: 67.5, y: 31.5 };

/** How far outside the corners of the wire a launcher stands, in squares. */
const ACK_OUT = 2.5;

/**
 * The four anti-aircraft sites, spread round the base outside the wire.
 *
 * @remarks
 * Outside, because that is where air defence stands: the thing it is defending
 * is behind it. They fire at anything in the air within {@link ACK_RANGE} -
 * the helicopter, or a man on a jetpack who thought the fence was the problem.
 */
export const ACK_SITES: readonly Vec[] = [
  { x: BASE.left - ACK_OUT, y: BASE.top - ACK_OUT },
  { x: BASE.right + ACK_OUT, y: BASE.top - ACK_OUT },
  { x: BASE.right + ACK_OUT, y: BASE.bottom + ACK_OUT },
  { x: BASE.left - ACK_OUT, y: BASE.bottom + ACK_OUT },
];

/**
 * One anti-aircraft site, as the game keeps it.
 *
 * @remarks
 * It has bodywork like a car, because it can be shot to pieces like one - and
 * unlike a car it comes back: the army has more of them, and a base that can
 * be disarmed once and for ever would be a base one flies over on the way past
 * for the rest of the game.
 */
export type Ack = {
  readonly x: number;
  readonly y: number;
  /** From zero to {@link ACK_HEALTH}. */
  readonly health: number;
  /** When a wrecked one is replaced, or null while it still stands. */
  readonly backAt: number | null;
};

/** How much a launcher takes before it is scrap. */
export const ACK_HEALTH = 150;

/** How wide it is, for anything flying at it. */
export const ACK_SIZE = 34;

/** How long the army takes to put a new one in its place, in seconds. */
export const ACK_REPAIR = 45;

/** How far an anti-aircraft gun reaches, in pixels. */
export const ACK_RANGE = 900;

/** How high one has to be before they bother, in pixels. */
export const ACK_FLOOR = 30;

/** Seconds between two volleys. */
export const ACK_EVERY = 1.1;

/** What one round takes off. */
export const ACK_DAMAGE = 13;

/** And how fast it flies. */
export const ACK_SPEED = 900;

/** How near a guard's post the player has to be before the guard leaves it. */
export const GUARD_REACH = 1500;

/** How many men stand about inside the wire. */
export const GUARD_COUNT = 10;

/** The airport in the south-east corner, beside Los Santos. */
export const AIRPORT: Island = { left: 124, top: 138, right: 156, bottom: 156 };

/** And the strip down the middle of it. */
export const RUNWAY: Island = { left: 126, top: 145, right: 154, bottom: 148 };

/** How deep the sand along the south edge is, in tiles. */
export const BEACH_TILES = 5;

/** And the water beyond it. */
export const WATER_TILES = 3;

/** What one cell of the city is. */
export type Cell =
  | "road"
  | "walk"
  | "building"
  | "park"
  | "water"
  /** The railway: a road one may cross, with a train on it. */
  | "rail"
  /** Desert and beach: open, dusty, and nobody built on it. */
  | "sand"
  /** Woodland: one drives through it, slowly and into trees. */
  | "forest"
  /** The concrete of the docks, and the apron of the airport. */
  | "dock"
  /** The strip itself, which is the widest straight road in San Andreas. */
  | "runway"
  /** The wire round the military base: one may look through it, not walk. */
  | "fence"
  /** The mountain in the south-west: bare stone, and steep to look at. */
  | "rock"
  /** A farm track: one drives on it, nobody paints a line down it. */
  | "dirt"
  /** A ploughed field, in the farmland of the north-west. */
  | "field";

/** The four corners of town, and who calls them home. */
export type District = "grove" | "ballas" | "vagos" | "beach";

/** One district as the map knows it. */
export type Districts = Readonly<Record<District, DistrictState>>;

/** How far a district has been taken over. */
export type DistrictState = {
  /** Jobs finished inside it. */
  readonly done: number;
  /** True once it belongs to the player. */
  readonly owned: boolean;
};

/** How many jobs a district asks for before it changes hands. */
export const JOBS_PER_DISTRICT = 3;

/** What is being asked of the player right now. */
export type JobKind = "courier" | "taxi" | "steal";

/** One job on the map. */
export type Job = {
  readonly kind: JobKind;
  /** Where it is picked up. */
  readonly from: Vec;
  /** Where it has to end up. */
  readonly to: Vec;
  /** The district the reward counts for. */
  readonly district: District;
  /** True once the parcel or the passenger is aboard. */
  readonly loaded: boolean;
  /** Simulation time the job runs out at, or null while it has not started. */
  readonly until: number | null;
  /** What it pays. */
  readonly pay: number;
};

/** What a person on the pavement is doing. */
export type PersonMood = "walking" | "fleeing" | "down" | "floored" | "sitting";

/** Somebody on foot who is not the player. */
export type Person = {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  /** Where they are heading, in radians. */
  readonly heading: number;
  /** Simulation time at which they pick a new direction. */
  readonly turnAt: number;
  readonly mood: PersonMood;
  /**
   * Simulation time this one stops lying on the ground.
   *
   * @remarks
   * Two different endings out of one clock, because the mood says which: one
   * who is `down` has been killed and is taken away when it runs out, one who
   * is `floored` has been knocked over and gets back up. Anybody walking about
   * ignores it.
   */
  readonly stillUntil: number;
  /**
   * Until when this one is frightened, in seconds.
   *
   * @remarks
   * Fear is a thing somebody has, not a thing the player carries about with
   * him. It used to be the second: anybody within a hundred and fifty pixels
   * of a player with a star ran, which meant a whole city that had seen
   * nothing scattered as he walked down it. Now the shot sets this clock on
   * whoever was near enough to notice, and everybody else goes on shopping.
   */
  readonly scaredAt: number;
  /** Which of the shirt colours they wear. */
  readonly look: number;
  /** How far they have walked, in pixels. See {@link STRIDE}. */
  readonly walked: number;
  /** How fast they are going, as a share of an ordinary walk. */
  readonly pace: number;
  /** What sort of person they are - see the table in ./people. */
  readonly kind: PersonKind;
  /** What they carry, if anything: only the gangs do. */
  readonly holds: WeaponKind | null;
  /** What is left of them. */
  readonly health: number;
  /** Simulation time the next shot may be fired at, for the armed ones. */
  readonly reloadAt: number;
  /**
   * The corner this person belongs to, or null for everybody who is just out.
   *
   * @remarks
   * Only gang members have one. It is what makes them a gang rather than a
   * colour: they stand about their own patch, drift a little, and come back to
   * it - so the two shirts turn up where they turn up, and the rest of the city
   * is other people's.
   */
  readonly home: Vec | null;
};

/** What sort of animal something is. */
export type AnimalKind = "cat" | "dog";

/** A cat or a dog. */
export type Animal = {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  /** Which way it is trotting, in radians. */
  readonly heading: number;
  /** Simulation time it changes its mind at. */
  readonly turnAt: number;
  /** How far it has trotted, for the legs. */
  readonly walked: number;
  readonly kind: AnimalKind;
  /**
   * The person it belongs to, or null for the ones that belong to nobody.
   *
   * @remarks
   * Dogs always have one, cats never do. That is the whole difference in
   * behaviour: a dog orbits somebody, a cat goes where it likes.
   */
  readonly ownerId: number | null;
};

/** What a car is for. */
export type CarKind = "traffic" | "police" | "parked";

/** One car in the city. */
export type Car = {
  readonly id: number;
  readonly kind: CarKind;
  /** What sort of vehicle it is - see the table in ./vehicles. */
  readonly body: VehicleBody;
  readonly x: number;
  readonly y: number;
  /** Which way the bonnet points, in radians. */
  readonly angle: number;
  /** Speed along that heading, in pixels per second. */
  readonly speed: number;
  /** Which of the paint colours it wears. */
  readonly colour: number;
  /** From zero to {@link CAR_HEALTH}; at zero it stops for good. */
  readonly health: number;
  /** True while the player is behind the wheel. */
  readonly driven: boolean;
  /** Simulation time at which a computer driver picks a new direction. */
  readonly turnAt: number;
  /**
   * Simulation time the bodywork ran out at, or null while there is some left.
   *
   * @remarks
   * The clock of the four stages - smoke, fumes, fire, bang - and at the same
   * time the answer to "does this thing still drive": a wreck rolls out and
   * then stands there.
   */
  /**
   * Simulation time this patrol car pulled up beside the player.
   *
   * @remarks
   * Null while it is still driving. Getting out is not instant - the doors
   * open a second after the car stops - and this is that second.
   */
  readonly haltAt: number | null;
  readonly fireAt: number | null;
  /**
   * How many policemen are aboard.
   *
   * @remarks
   * Two in a fresh patrol car, none while its crew is out on the pavement, two
   * again once they have climbed back in. It is what says whether the car can
   * drive at all: a car whose crew was shot on the street has nobody at the
   * wheel and is a wreck in every way that matters, so the next patrol is sent
   * instead of it.
   */
  readonly crew: number;
  /**
   * How many rockets or shells have gone into it.
   *
   * @remarks
   * Only a tank counts them: see {@link TANK_HITS}. Everything else is alight
   * the moment a rocket touches it and never gets as far as a second.
   */
  readonly shells: number;
  /**
   * How fast it is going sideways, in pixels a second.
   *
   * @remarks
   * The whole of the driving model, in one number. {@link Car.speed} is what
   * the car is doing along its nose; this is what it is doing across it, and
   * it is what a car doing nothing wrong does not have. Turning the wheel
   * feeds forward speed into it; the tyres eat it again at whatever the body
   * grips at. Eaten faster than it arrives, the car follows its nose; eaten
   * slower, it slides - and that is a drift, without a single special case
   * for one.
   */
  readonly slip: number;
  /**
   * What this one is towing, by id, or null for anything with nothing on the
   * back.
   *
   * @remarks
   * Only a tractor ever has one. It is kept on the tractor rather than on the
   * thing being towed because the tractor is the one that decides: it hooks up,
   * it pulls, and it drops the rope.
   */
  readonly hitched: number | null;
  /**
   * How many people are sitting in it.
   *
   * @remarks
   * Every car in the traffic has a driver, and some of them have somebody
   * with them - a city whose cars drive themselves is a city of ghosts. They
   * are a number rather than a list because nothing about them matters until
   * the door is opened: at that moment the number becomes that many people
   * standing in the road, and the car becomes an empty car.
   *
   * A parked car has nobody in it. That is what parked means.
   */
  readonly seats: number;
  /**
   * Whether the brake lights are on.
   *
   * @remarks
   * Every car in this city drives with its lights on, which is what makes one
   * readable as a car at all from three streets away - so the headlamps and
   * the tail lamps need no flag. This one is for the moment the tail lamps go
   * from lit to bright: the brake pedal, the handbrake, or a computer driver
   * stopping for something. It is written where the speed is decided and only
   * read by the renderer.
   */
  readonly braking: boolean;
  /**
   * How far this one has rolled, in pixels, counting reverse as backwards.
   *
   * @remarks
   * Not a mileage: it is what the **wheels** are drawn from. A wheel turns
   * once every 2 pi r of road, so the angle of its spokes is this number over
   * the radius of the tyre - which means the renderer can draw a turning wheel
   * without remembering anything between frames, and a saved game comes back
   * with its wheels where it left them. The same trick as {@link Player.walked},
   * which is how a walking figure knows which leg is forward.
   */
  readonly rolled: number;
  /**
   * Whether the handbrake is pulled.
   *
   * @remarks
   * Not the same thing as {@link Car.braking}, which is on for the pedal as
   * well. This one is what the **back wheels** are told: a handbrake works on
   * them alone, so with it pulled they stop turning while the front pair go on
   * rolling. Only the car the player is driving ever has it.
   */
  readonly locked: boolean;
  /**
   * The earliest a stopped computer driver will pull away again.
   *
   * @remarks
   * **A reaction time.** Everything about a queue up to now was instant: the
   * moment the car in front moved out of the way, the car behind it moved, and
   * a line of six at a red light pulled away as one piece, all six noses
   * keeping the same gap all the way up the street. Nobody drives like that.
   *
   * So a car that has been brought to a stand keeps pushing this half a second
   * ahead of the clock, and when whatever was in its way clears, that half
   * second still has to run out. The car in front sets off, the one behind
   * waits its own half second, then the next - and the queue unzips from the
   * front the way a real one does. Nothing sets it up: the cascade falls out
   * of every driver reacting to the one ahead.
   */
  readonly wakeAt: number;
  /**
   * The heading a computer driver is steering **to**, in radians.
   *
   * @remarks
   * **The driver and the car are two different things.** A computer driver
   * thinks in compass points - north, south, east, west - because the city is
   * a grid and that is what a grid affords. He used to be given that heading
   * and the car simply *had* it: at a junction the whole vehicle pivoted
   * ninety degrees on the spot, in one frame, and drove off sideways. Nothing
   * in the world turns like that.
   *
   * So this is what he wants, {@link Car.angle} is where the machine actually
   * points, and the second comes round to the first at {@link TRAFFIC_TURN}.
   * The gap between them is the corner - a second or so of arc through the
   * junction, with the nose swinging and a motorbike leaning into it, because
   * the lean is read off the same turn rate.
   */
  readonly want: number;
  /**
   * How far a two-wheeler is leaning into the corner, in pixels of offset.
   *
   * @remarks
   * Signed: right of the nose is positive. Nothing on four wheels ever uses
   * it - a car leans **out** of a corner and by an amount nobody can see at
   * this size - but a motorbike leans in, and a motorbike that goes round a
   * corner bolt upright looks like it is on rails.
   *
   * It is an offset rather than an angle because that is what the renderer can
   * use: the machine and the rider are shifted sideways over the wheels, which
   * from above and from the side reads as a lean. How far depends on how hard
   * the corner is, which is the turn rate times the speed - the same sum that
   * decides whether a real one falls over.
   */
  readonly lean: number;
  /**
   * Which way the gun points, in radians - only the tank has one.
   *
   * @remarks
   * Its own angle rather than the hull's, because a turret that could only
   * point where the tracks point is not a turret. It follows the mouse while
   * the player is aboard, and the shell goes where it points.
   */
  readonly turret: number;
};

/**
 * Whether a gang is at war with the player.
 *
 * @remarks
 * Both start peaceful. A gang goes to war when the player shoots one of its
 * members - not before, because a city where two dozen armed men open up on
 * sight is a city nobody walks through twice. Once the orange shirts are at war
 * the green ones join in on your side, which is what "your gang" means here.
 */
/**
 * Whether the orange shirts are at war with the player.
 *
 * @remarks
 * One flag, because there is only one war to have. Your own gang is yours
 * whatever you do - a stray shot into a green shirt is an accident among
 * friends, and there is nothing in this city so lonely as a man whose own
 * people are shooting at him because a bullet went wide.
 */
export type Feud = boolean;

/**
 * How far the simulation has got.
 *
 * @remarks
 * `prison` is the odd one out: the city stands still while it lasts and the
 * player is somewhere else entirely - inside the jail, on foot, with a screw
 * and a plan. See {@link PrisonState}.
 */
export type Phase =
  "playing" | "busted" | "wasted" | "won" | "prison" | "mint" | "bank";

/** The whole city, at one moment. */
export type GameState = {
  readonly phase: Phase;
  /** Seconds since the game began. */
  readonly time: number;
  readonly rng: RandomState;
  /** The city floor, row by row. */
  readonly cells: readonly Cell[];
  readonly player: Player;
  readonly cars: readonly Car[];
  readonly people: readonly Person[];
  readonly animals: readonly Animal[];
  readonly cops: readonly Cop[];
  readonly bullets: readonly Bullet[];
  readonly blasts: readonly Blast[];
  /** Weapons and vests lying about the city. */
  readonly pickups: readonly Pickup[];
  /** The charges the player has put down and not yet set off. */
  readonly charges: readonly Charge[];
  readonly job: Job | null;
  readonly districts: Districts;
  /** Where the spray shop is - drive in and the stars go. */
  readonly garages: readonly Vec[];
  /** The train going round the map. */
  readonly train: Train;
  /** The helicopter on the pad at the base, whoever is or is not in it. */
  readonly chopper: Chopper;
  /** The clock reading the anti-aircraft guns may fire their next volley at. */
  readonly ackAt: number;
  /** The four launchers round the base, wrecked or whole. */
  readonly acks: readonly Ack[];
  /** Black marks on the road, oldest first. */
  readonly marks: readonly Mark[];
  /** The clock reading the next lot may be laid at. */
  readonly markAt: number;
  /**
   * Simulation time the garage door shut at, or null while it stands open.
   *
   * @remarks
   * Only the picture cares, but it belongs here rather than in the renderer:
   * two frames of the same city have to show the same door.
   */
  readonly garageAt: number | null;
  /**
   * Whether the garage door stands open.
   *
   * @remarks
   * One answer for the picture and for the walls: while this is false the
   * square behind the door is part of the house (see `setGarage` in ./city),
   * so a car inside is shut in until it opens again.
   */
  readonly garageOpen: number | null;
  /** The helicopter overhead, or null while there is none. */
  readonly heli: Heli | null;
  /** Which gangs the player has picked a fight with. */
  readonly feud: Feud;
  /** Simulation time the next patrol car may be sent, so they arrive one by
   * one rather than all at once. */
  readonly patrolAt: number;
  /**
   * Simulation time the next helicopter may take off, in seconds.
   *
   * @remarks
   * Shooting one down used to buy nothing: the next frame saw an empty sky and
   * a wanted level and sent another. Taking a unit off the board has to be
   * worth something, and what it is worth is time.
   */
  readonly heliAt: number;
  /**
   * The bank, while somebody is inside it with a gun, or null out in the city.
   *
   * @remarks
   * The fourth little world: see {@link BankState} and ./bank.
   */
  readonly bank: BankState | null;
  /**
   * The escape, while one is under way - null whenever the city is being
   * played.
   *
   * @remarks
   * A whole second world, and deliberately beside the city rather than folded
   * into it: nothing inside the jail has a car, a wanted level or a district,
   * and nothing in the city has a cell door. Keeping it here means the city is
   * still standing when one comes back out of the wall.
   */
  readonly prison: PrisonState | null;
  /**
   * The printing works, while a job is on inside it, or null out in the city.
   *
   * @remarks
   * The third little world after the jail: see {@link MintState} and ./mint.
   */
  readonly mint: MintState | null;
  /**
   * The gang members the player has taken on, by id.
   *
   * @remarks
   * A list of ids rather than a flag on the person, because being in somebody's
   * crew is a thing between the player and them and not a property of a man in
   * a green shirt. They walk after him, and they are the reason the door of the
   * printing works opens at all.
   */
  readonly crew: readonly number[];
  /**
   * The hired men who are sitting in the car with the player.
   *
   * @remarks
   * They are taken out of {@link GameState.people} while they ride, because
   * that is what being in a car is: not being in the street. They go back into
   * it, round the car, the moment he gets out.
   */
  readonly riders: readonly Person[];
  /** The newest lines of what happened, newest last. */
  readonly log: readonly string[];
};

/** The player, on foot or at a wheel. */
/**
 * Somebody on his way into a vehicle.
 *
 * @remarks
 * Getting in is no longer a key that teleports a man through bodywork. He
 * walks round to the **driver's door**, opens it, and then he is in - which is
 * three things one can see happening, and the reason one can see them is that
 * they take time. The whole of that time lives here: what he is heading for,
 * and when he got there.
 */
export type Boarding = {
  /** Which vehicle, by id. */
  readonly car: number;
  /**
   * Simulation time he set off for it.
   *
   * @remarks
   * Only {@link BOARD_GRACE} reads it, and it is there for one case: almost
   * everybody is already walking when they press the key. Without a moment's
   * grace the key that starts the walk is cancelled by the key that carried
   * him there, and getting into a car becomes something one can only do
   * standing still.
   */
  readonly from: number;
  /**
   * Simulation time the door came open at, or null while he is still walking.
   *
   * @remarks
   * Doubles as which of the two halves he is in. Null means feet; a number
   * means he is standing at the open door with {@link DOOR_OPEN} to wait.
   */
  readonly openAt: number | null;
};

export type Player = {
  readonly x: number;
  readonly y: number;
  /** Which way they face, in radians - where the mouse points. */
  readonly angle: number;
  /** Which way they last moved, in radians. The legs go this way. */
  readonly heading: number;
  /** How far they have walked, in pixels. See {@link STRIDE}. */
  readonly walked: number;
  /**
   * How fast he is going, as a share of an ordinary walk.
   *
   * @remarks
   * Nought standing, one strolling, three running, ten with the cheat on. The
   * picture reads it and nothing else does: a figure at a run leans further
   * forward, swings wider and bounces harder than one out for a walk, and
   * without this number every pace looks like the same pace.
   */
  readonly pace: number;
  /** From zero to {@link PLAYER_HEALTH}. */
  readonly health: number;
  readonly money: number;
  /** Respect: what a takeover is paid in. */
  readonly respect: number;
  /** Zero to {@link MAX_STARS}. */
  readonly stars: number;
  /** Simulation time the stars fall by one at, while nothing new happens. */
  readonly coolAt: number;
  /**
   * Simulation time the player gets back on their feet, after being run over.
   *
   * @remarks
   * A car that touches somebody at walking pace is a bump; one that hits them
   * at speed puts them on the tarmac. Being down means no walking, no shooting
   * and no getting into anything until the clock runs out - the price of
   * crossing in front of traffic.
   */
  readonly floorUntil: number;
  /**
   * Simulation time the player last took a step.
   *
   * @remarks
   * What "standing still" means on foot, and standing still is what gets one
   * arrested. Reading it off the keys would not do: a wall one is pressed
   * against also stops a walk, and being taken while trying to get away would
   * be a different game.
   */
  readonly movedAt: number;
  /**
   * What is in the bag from a robbery, and not yet safe.
   *
   * @remarks
   * Kept apart from the money on purpose: a robbery is only worth anything
   * once one is away with it. The bag empties into the money when the search
   * dies down, and into the evidence room when the police catch up - which is
   * the whole risk of the thing.
   */
  readonly loot: number;
  /**
   * Whether the player is still in the striped suit he broke out in.
   *
   * @remarks
   * A man who has just come over a prison wall is wearing what he came over it
   * in, and everybody in the street can see it. It goes when the search does:
   * with the last star, he has found something else to put on.
   */
  readonly striped: boolean;
  /**
   * Whether he is still in the red overall and the mask of the printing works.
   *
   * @remarks
   * The same idea as {@link Player.striped} and for the same reason: what one
   * walks out of a job in is what the street sees. It goes with the last star.
   */
  readonly masked: boolean;
  /**
   * Whether he is wearing the black balaclava of a bank job.
   *
   * @remarks
   * The third thing one can be caught in, after the prison suit and the red
   * overall. It goes the same way they do: with the last star, or with the
   * money when there was never a star to lose.
   */
  readonly hooded: boolean;
  /**
   * Whether there is a jetpack on his back.
   *
   * @remarks
   * Not a weapon: there is nothing to select and nothing to reload. One either
   * owns it or one does not, and owning it means the space bar lifts you off
   * the ground.
   */
  readonly jetpack: boolean;
  /** Whether he is riding the train rather than standing beside it. */
  readonly aboard: boolean;
  /** Whether he is at the controls of the helicopter. */
  readonly flying: boolean;
  /**
   * How high above the road he is, in pixels.
   *
   * @remarks
   * Zero on the ground, which is where everybody without a jetpack stays. Above
   * {@link ROOF_HEIGHT} the houses are below him and he goes over them, and
   * anywhere between the two he is standing on a roof - see `roofAt`.
   */
  readonly height: number;
  /**
   * Whether the jetpack is burning this instant.
   *
   * @remarks
   * Not the same question as being off the ground, which is why it is its own
   * flag. A man who lets go of the button over a roof stands on the roof:
   * height above nought, jets out. A man who lets go over the street is on his
   * way down with them out as well. What the two flames under him mean is
   * **thrust**, and a jetpack that goes on burning all the way down is a
   * jetpack nobody has to switch off.
   */
  readonly thrust: boolean;
  /**
   * Simulation time the star count last went up at.
   *
   * @remarks
   * The picture wants it, not the rules: the stars flash three times when one
   * is added, and this is the clock that flashing runs off.
   */
  readonly starAt: number;
  /**
   * How much trouble has been caused that nobody in uniform has seen yet.
   *
   * @remarks
   * A punch in an empty side street is not a police matter. This counts what
   * has been done unseen, and only when it adds up does somebody call it in -
   * which is why the first star can take three fights, or none at all if a
   * patrol car happens to be at the lights.
   */
  readonly heat: number;
  /** The car being driven, or null on foot. */
  readonly car: number | null;
  /** The vehicle being walked up to and got into, or null. */
  readonly boarding: Boarding | null;
  /** Simulation time before which the player may not be arrested again. */
  readonly safeUntil: number;
  /**
   * How long the police have had the car pinned, in seconds.
   *
   * @remarks
   * The only way into the cells. Standing next to a policeman is not an
   * arrest - being brought to a stop in a stolen car and held there is.
   */
  readonly pinned: number;
  /** Simulation time before which ramming a patrol car costs nothing. */
  readonly rammedUntil: number;
  /** Simulation time before which the next crash does no damage. */
  readonly crashUntil: number;
  /** Simulation time the next shot may be fired at. */
  readonly reloadAt: number;
  /**
   * Simulation time the tank's machine gun may fire its next round at.
   *
   * @remarks
   * **Its own clock**, and it has to be one. The gun and the cannon on a tank
   * are two weapons that fire together: a gunner lays the main armament on
   * something worth a shell and keeps the coaxial going at everything else
   * while he does it. Shared with {@link Player.reloadAt}, a burst of machine
   * gun fire would reset the cannon's reload eleven times a second and one
   * could fire a shell as fast as one could rattle - or, the other way round,
   * one shell would silence the gun for as long as it took to load the next.
   */
  readonly gunAt: number;
  /**
   * How many blows have been struck by hand.
   *
   * @remarks
   * Only the picture cares: a fist fight alternates, and this counter is what
   * says whether this blow is the left or the right one. Anything held - a
   * knuckleduster, a baton, a knife - is swung with the hand that holds it and
   * ignores the count.
   */
  readonly punches: number;
  /** What is in the hand. */
  readonly weapon: WeaponKind;
  /**
   * The belt: rounds left per weapon slot, in WEAPON_ORDER.
   *
   * @remarks
   * Zero means "not found yet or shot dry", below zero means "found, never runs
   * out". Only the fist starts below zero; everything else is lying somewhere
   * in the city.
   */
  readonly ammo: readonly number[];
  /** The vest: soaked up before health is, zero to {@link PLAYER_HEALTH}. */
  readonly armour: number;
  /** Simulation time the player was last hurt at - health grows back after. */
  readonly hurtAt: number;
  /** The cheat: no damage, and one of everything. */
  readonly god: boolean;
};

/**
 * What the keyboard and the mouse are asking for this frame.
 *
 * @remarks
 * The four keys mean two different things, and that is on purpose. **On foot**
 * they are the four points of the compass: north is north whichever way the
 * player happens to be looking, because that is what the hand expects from four
 * keys. **In a car** they are the pedals and the wheel, because a car that
 * could slide sideways would not be a car.
 */
export type Input = {
  /** North on foot, the accelerator in a car. */
  readonly up: boolean;
  /** South on foot, the brake and reverse in a car. */
  readonly down: boolean;
  /** West on foot, the wheel to the left in a car. */
  readonly left: boolean;
  /** East on foot, the wheel to the right in a car. */
  readonly right: boolean;
  /**
   * Where a thumb is pointing on the drive stick, in city pixels, or null.
   *
   * @remarks
   * **A compass, not a steering wheel.** The four keys above are a wheel: up
   * is the throttle and left and right are the lock, both read against
   * whichever way the car happens to be pointing. A thumb on a phone is not
   * that - one pushes the stick towards where one wants to go, and down means
   * **south**, not reverse. So the stick sends its direction as well, and
   * behind a wheel that is what gets used: the car steers itself round towards
   * the heading and drives there.
   *
   * Null on a keyboard, and null while no thumb is on the stick. On foot it is
   * ignored, because walking was already a compass.
   */
  readonly steer: Vec | null;
  /** True on the frame the player gets in or out of a car. */
  readonly use: boolean;
  /**
   * True on the frame the right button goes down: one charge on the ground.
   *
   * @remarks
   * Its own flag rather than a second meaning for {@link Input.fire}, because
   * the two are opposite halves of the same weapon - the right button puts
   * charges down, the left one sets every one of them off.
   */
  readonly plant: boolean;
  /** Where the mouse points, in city pixels - what the player faces. */
  readonly aim: Vec;
  /** True while the mouse button is down. */
  readonly fire: boolean;
  /**
   * True while the **right** button is held down.
   *
   * @remarks
   * Its own flag rather than a held version of {@link Input.plant}, because
   * the two are different questions about the same button. Putting a charge
   * down is an event - one press, one charge - and holding the button must not
   * lay a hundred of them. The machine gun on the tank is the opposite: it
   * fires for as long as one holds the button, and an edge would give one
   * round per click.
   *
   * On foot it does nothing at all. In a tank it is the coaxial gun.
   */
  readonly spray: boolean;
  /** Shift: the debug turbo. See {@link CHEAT_WALK}. */
  readonly boost: boolean;
  /** Notches the mouse wheel turned this frame: the weapon in the hand. */
  readonly wheel: number;
  /** The other cheat: nothing hurts, and the belt is full. */
  readonly god: boolean;
  /** The space bar: up, while there is a jetpack to go up with. */
  readonly lift: boolean;
  /**
   * What the player asked for at a counter this frame, or null for nothing.
   *
   * @remarks
   * The keys and the mouse say where the player is and what they are pointing
   * at; this says what they pressed in the panel that opens when they are
   * standing in a doorway. It is spent the moment it is read, like
   * {@link Input.use}.
   */
  readonly order: Order | null;
};

/** What can be asked for at a counter. */
export type Order =
  /** One of the things on the wall of the gun shop. */
  | {
      readonly kind: "buy";
      readonly what: WeaponKind | "armour" | "jetpack";
    }
  /** Rounds for a weapon already in the belt. */
  | { readonly kind: "refill"; readonly what: WeaponKind }
  /** The other way of doing business in a bank. */
  | { readonly kind: "rob" }
  /** One gang member, taken on for the day. */
  | { readonly kind: "hire" }
  /** In through the door of the printing works, with the crew. */
  | { readonly kind: "raid" }
  /** On or off the train, which is the same key either way. */
  | { readonly kind: "board" }
  /** The tow bar on the tractor: hook something on, or drop it. */
  | { readonly kind: "hitch" }
  /** One hostage out of the front door, to buy quiet. */
  | { readonly kind: "release" }
  /** The mains, cut - which works once. */
  | { readonly kind: "power" };

/** Nothing pressed. */
export const IDLE_INPUT: Input = {
  up: false,
  down: false,
  left: false,
  right: false,
  steer: null,
  use: false,
  plant: false,
  aim: { x: 0, y: 0 },
  fire: false,
  spray: false,
  boost: false,
  wheel: 0,
  god: false,
  lift: false,
  order: null,
};

/** Longest slice of time one step may advance, so a paused tab cannot jump. */
export const MAX_STEP = 0.05;

/** How fast the jetpack climbs, in pixels a second. */
export const JET_RISE = 80;

/** And how fast one sinks with the thumb off the button. */
export const JET_FALL = 65;

/**
 * How high it goes at all.
 *
 * @remarks
 * Heights in this game are small numbers: a house is 26 to 74, the police
 * helicopter hangs at 52. A ceiling of a hundred and ten is well over the
 * tallest roof in Los Santos and still inside the picture - twice that and the
 * figure simply leaves the top of the screen.
 */
export const JET_CEILING = 110;

/**
 * The lowest a house is built, in pixels.
 *
 * @remarks
 * Here rather than in the picture because a roof is not only something to
 * draw: one can **stand on it**. How high a house is therefore has to be an
 * answer the engine can give - see `roofAt` - and a number the engine gives
 * and the picture uses is a number that belongs to the engine.
 */
export const HOUSE_LOW = 26;

/** The tallest a house is built - downtown, and only there. */
export const HOUSE_HIGH = 74;

/** How tall a shed on the military base stands. */
export const HUT_HIGH = 34;

/** And a barn out in the country. */
export const BARN_HIGH = 40;

/**
 * How high one has to be to clear the roofs, in pixels.
 *
 * @remarks
 * Above this nothing on the ground is in the way any more - houses, cars,
 * water, the lot. Below it one is in the street like everybody else, which is
 * what makes taking off and landing the only two interesting moments.
 */
export const ROOF_HEIGHT = 80;

/** What a jetpack costs at the counter, in euros. */
export const JET_PRICE = 25000;

/** How fast the player walks, in pixels per second. */
export const WALK_SPEED = 130;

/**
 * How much faster Shift makes you - on foot, and behind the wheel.
 *
 * @remarks
 * A cheat, and meant as one: crossing the city to look at something takes half
 * a minute at walking pace, and that is half a minute per look. Shift makes the
 * city small enough to check a corner of it and carry on.
 *
 * On foot it is a tenfold jump because walking is slow enough to take it; a car
 * at ten times its top speed would be through a block before the wheel bit, so
 * it gets a factor that is still driveable.
 */
export const CHEAT_WALK = 10;

/**
 * How much faster Shift is on its own, without the cheat.
 *
 * @remarks
 * Shift by itself is a run: quick enough to cross a street before the lights
 * change, slow enough that the city still goes past. The tenfold sprint above
 * belongs to the cheat, and only to the cheat.
 */
export const RUN_WALK = 3;

/** And what Shift alone does to a car. */
export const RUN_DRIVE = 1.5;

/** How much faster Shift makes a car. See {@link CHEAT_WALK}. */
export const CHEAT_DRIVE = 3;

/**
 * How far a figure walks in one full stride, in pixels.
 *
 * @remarks
 * The clock of the walk cycle is distance, not time. A figure that animates on
 * a timer moonwalks the moment it is slowed down or sped up - and this game
 * has both a stroll, a run from trouble and a tenfold cheat. Distance walked
 * cannot come apart from the feet.
 */
export const STRIDE = 34;

/**
 * How fast a standing figure closes its legs, in pixels of stride a second.
 *
 * @remarks
 * Stopping mid-step and freezing there looks like a photograph of somebody
 * falling over. The cycle carries on to the next moment where the feet are
 * together, and stops there.
 */
export const SETTLE = 90;

/** Collision radius of a person. */
export const PERSON_RADIUS = 9;

/** How long a plain car is - the tables in ./vehicles hold the rest. */
export const CAR_LENGTH = 44;

/** How wide a plain car is. */
export const CAR_WIDTH = 24;

/** Top speed of a police car - they are faster, and that is the point. */
export const POLICE_TOP_SPEED = 360;

/**
 * Top speed of traffic that drives itself.
 *
 * @remarks
 * Well under half of what the player car will do. Traffic that moves at the
 * pace one drives at oneself is traffic one can never overtake, and a street
 * where everything moves at the same speed has no sense of speed in it at all.
 */
export const TRAFFIC_SPEED = 110;

/** How hard a car accelerates, in pixels per second squared. */
export const CAR_ACCEL = 260;

/**
 * How much more the tyres bite with the brakes on.
 *
 * @remarks
 * Weight goes forward under braking and the front axle digs in, so braking
 * into a corner is what pulls a slide straight. A quarter more is enough to
 * feel without turning the handbrake into an anchor.
 */
export const GRIP_BRAKE = 1.25;

/** And how much they let go with the throttle down: power out of a corner. */
export const GRIP_PUSH = 0.85;

/**
 * How much sideways it takes before the tyres smoke, in pixels a second.
 *
 * @remarks
 * Set above what an ordinary corner produces: smoke every time somebody turns
 * would say nothing at all. It means "you are sliding", and it should only say
 * so when that is true.
 */
export const SLIP_SMOKE = 55;

/**
 * How quickly a shoved car rolls to a stop, in pixels per second squared.
 *
 * @remarks
 * Nobody is at the wheel of it, so nothing keeps it going: a car knocked aside
 * travels about as far as it was thrown and then stands where it stopped,
 * usually across the road, which is the point of knocking it aside.
 */
export const LOOSE_DRAG = 240;

/**
 * How hard the handbrake slows a car, in pixels per second squared.
 *
 * @remarks
 * Less than the foot brake, because that is not what it is for: it locks the
 * back wheels, and a wheel that is not turning has no grip to give. Stopping
 * with it works, but sideways.
 */
export const HAND_DRAG = 300;

/**
 * What is left of the tyres' grip with the back wheels locked.
 *
 * @remarks
 * Not much. This one number is the whole handbrake: pull it in a corner and
 * the back comes round, pull it with the wheel hard over and the car turns on
 * its own axle - a donut, which nothing in the code knows the word for.
 */
export const HAND_GRIP = 0.16;

/**
 * How much of the usual speed the wheel needs while the handbrake is up.
 *
 * @remarks
 * A standing car cannot steer, and that is right - but a car spinning slowly
 * round its own middle with the back wheels locked very much can, and without
 * this it could not be done at all.
 */
export const HAND_LOCK = 0.25;

/** And how much more the nose comes round with the back end loose. */
export const HAND_TURN = 1.4;

/**
 * How fast a computer driver swings the nose round, in radians a second.
 *
 * @remarks
 * Turn rate against speed is a **radius**: at {@link TRAFFIC_SPEED} of 110
 * this is a corner of about twenty five pixels, which is half a street wide -
 * a car turning into a side road, drawn at the size the side road is. Faster
 * and it snaps round again; slower and a car leaves the junction still
 * pointing at the pavement.
 */
export const TRAFFIC_TURN = 4.4;

/**
 * How far off the wanted heading still counts as mid-corner, in radians.
 *
 * @remarks
 * Inside this the driver is going where he meant to and the lane pull may have
 * him back. Outside it he is **in** the corner, and pulling him sideways
 * towards a lane he is halfway out of fights the turn: the car crabs through
 * the junction instead of driving round it.
 */
export const TURN_DONE = 0.12;

/** How long a black mark stays on the road, in seconds. */
export const MARK_LIFE = 22;

/** How often a sliding tyre lays one down, in seconds. */
export const MARK_EVERY = 0.03;

/**
 * How long a tank's tracks stay in the ground, in seconds.
 *
 * @remarks
 * Shorter than rubber, for a reason that is arithmetic rather than taste: a
 * tank lays a pair of these every {@link MARK_EVERY} the whole time it is
 * moving, where a car lays a pair only while it is actually sliding. At this
 * life the trail behind a tank that never stops is six hundred marks, which
 * sits inside {@link MARK_MAX} and leaves everybody else's skids alone. Twice
 * as long and one tank driving about would quietly rub out every black line in
 * the city.
 */
export const TRACK_LIFE = 9;

/** How many are kept at once; the oldest go first. */
export const MARK_MAX = 800;

/** How hard it brakes. */
export const CAR_BRAKE = 460;

/** How quickly a car slows with nobody on the pedals. */
export const CAR_DRAG = 90;

/** How fast a car turns at speed, in radians per second. */
export const CAR_TURN = 2.6;

/**
 * How fast the walk cycle may run at most, in pixels a second.
 *
 * @remarks
 * Twice a walking pace. The cycle is driven by distance, so at a run it would
 * otherwise turn three times as fast and at the cheat ten - and a figure whose
 * legs go round ten times a second is not running, it is vibrating.
 *
 * Capping it means the feet no longer keep up with the ground at a sprint.
 * That is the right trade: nobody looks at the feet of a figure crossing the
 * screen, and everybody notices a body bouncing like a pneumatic drill.
 */
export const CYCLE_CAP = 2 * WALK_SPEED;

/**
 * How fast somebody on foot turns to face a new direction, in radians a second.
 *
 * @remarks
 * The keys give eight directions and nothing in between, so a figure that
 * faced them exactly snapped through forty-five degrees at a time. Turning at
 * a rate instead costs a tenth of a second and is the difference between a
 * person changing direction and a sprite being replaced.
 *
 * Purely how it looks: where the feet actually go is still the keys.
 */
export const FOOT_TURN = 14;

/** Below this speed the wheel does nothing - a standing car cannot steer. */
export const CAR_TURN_FLOOR = 30;

/** How much health a car has. */
export const CAR_HEALTH = 100;

/** How many cats roam the city. */
export const CAT_COUNT = 10;

/** How many people in a hundred have a dog with them. */
export const DOG_SHARE = 0.22;

/** How fast a cat trots, in pixels a second. */
export const CAT_WALK = 55;

/** How fast a dog trots when it has fallen behind. */
export const DOG_WALK = 78;

/** How far from its owner a dog is happy to be, in pixels. */
export const DOG_LEASH = 34;

/** How long an animal holds a direction, in seconds. */
export const ANIMAL_TURN = 1.8;

/** How long the police have to hold a stopped car before it is an arrest. */
export const BUST_SECONDS = 3;

/** Below this speed a car counts as stopped, in pixels a second. */
export const BUST_CRAWL = 40;

/** How much health a policeman on foot has. */
export const COP_HEALTH = 34;

/** How many get out of one patrol car. */
export const COPS_PER_CAR = 2;

/** How close a patrol car pulls up before the doors open, in pixels. */
export const COP_STOP = 120;

/** How fast a policeman walks after the player. */
export const COP_WALK = 62;

/** How near the car a policeman has to be to start climbing in, in pixels. */
export const BOARD_RANGE = 26;

/** How long climbing back in takes, in seconds. */
export const BOARD_SECONDS = 1.6;

/**
 * Seconds between two shots of the same burst.
 *
 * @remarks
 * Short, because the pause between bursts is what does the pacing now. It used
 * to be a flat one and a bit between every pair of shots, which read as a slow
 * drip rather than as somebody firing at you.
 */
/** How long a patrol car stands before the doors open, in seconds. */
export const COP_OUT = 1;

/** And how long they take to spread out round the player before firing. */
export const COP_FORM = 1;

/** How far from the player they take up position, in pixels. */
export const COP_RING = 120;

export const COP_RELOAD = 0.22;

/** How near the player has to be before a car brakes for them, in pixels. */
export const BRAKE_RANGE = 74;

/** How wide the corridor in front of a car is that it brakes for. */
export const BRAKE_WIDTH = 26;

/**
 * How long after its bodywork runs out a wreck smokes lightly, in seconds.
 *
 * @remarks
 * The bar in the corner is the warning while there is bodywork left; the smoke
 * is what happens after it is gone. Four stages, and each one is a chance to
 * get out: a wisp, a black plume, flames, and then the bang. A wreck that went
 * up the moment the bar emptied would be a death, not a decision.
 */
/**
 * How many rockets or shells it takes to set a tank alight.
 *
 * @remarks
 * Three. A rocket sets any other vehicle on fire where it hits it, and that is
 * right for a car - but a tank that goes up on the first hit makes the duel
 * between two of them a matter of who fires first, which is no duel at all.
 */
export const TANK_HITS = 3;

/**
 * How much of a hit a tank soaks up compared to any other vehicle.
 *
 * @remarks
 * A quarter. With twelve hundred of bodywork behind it that is the better part
 * of five thousand rounds of pistol - which is the right answer: whatever is
 * going to stop a tank is not a pistol, it is a rocket, another tank, or a very
 * long argument with a helicopter.
 */
export const TANK_ARMOUR = 0.25;

export const SMOKE_STAGE = 0.8;

/** How long after that the smoke turns thick and black. */
export const FUMES_STAGE = 4;

/** How long after that it is properly alight. */
export const FIRE_STAGE = 2.2;

/** How long a wreck lasts altogether before it goes off, in seconds. */
export const BURN_SECONDS = 4.5;

/** How long an explosion is drawn for, in seconds. */
export const BLAST_SECONDS = 0.5;

/** How long the player must go unhurt before health grows back, in seconds. */
export const REGEN_AFTER = 7;

/** How fast health grows back, in points a second. */
export const REGEN_RATE = 7;

/** How close you have to walk to a pickup to take it, in pixels. */
export const PICKUP_RANGE = 22;

/** How long a taken pickup stays gone, in seconds. */
export const PICKUP_BACK = 40;

/** How long the stars flash after one is added, in seconds. */
export const STAR_FLASH = 1.2;

/** How much health the player has. */
export const PLAYER_HEALTH = 100;

/**
 * How many game minutes one real second is worth.
 *
 * @remarks
 * One. A whole day is twenty-four real minutes, which is short enough that
 * anybody who plays for half an hour sees two sunsets and long enough that
 * driving somewhere does not happen in a different hour than setting off did.
 */
export const MINUTES_PER_SECOND = 1;

/** What the clock says when a game begins: eight in the morning. */
export const START_HOUR = 8;

/** How many minutes are in an hour, and hours in a day. */
export const HOUR_MINUTES = 60;

/** And how many of those in a day. */
export const DAY_HOURS = 24;

/** The most stars the police hand out. */
export const MAX_STARS = 6;

/** How long the stars hold before one falls off by itself, in seconds. */
export const COOL_SECONDS = 18;

/** How close the player has to be to a car to get in. */
export const ENTER_RANGE = 46;

/**
 * How far out from the flank the driver's door is stood at, in pixels.
 *
 * @remarks
 * The same distance somebody thrown out of a car lands at, so that the spot he
 * walks to is the spot the man he is taking it from is standing on.
 */
export const DOOR_STAND = 34;

/** How near that spot counts as being at it, in pixels. */
export const DOOR_REACH = 9;

/**
 * How long the door takes to open, in seconds.
 *
 * @remarks
 * A seventh of a second: one sees it happen and one is not kept waiting. Half
 * a second was long enough to feel like the game had missed the key. The men
 * who were in it still get out in this same moment, which is what the pause is
 * for - a carjacking in which the driver vanishes the instant one touches the
 * handle is a magic trick - but that moment does not have to be a long one.
 */
export const DOOR_OPEN = 0.15;

/**
 * How far the vehicle may get away before he gives up on it, in pixels.
 *
 * @remarks
 * A car in the traffic does not wait to be taken. Walking after one that is
 * pulling away is fair enough for a few yards; chasing it across the district
 * at walking pace is not, and this is where he stops.
 */
export const BOARD_GIVE_UP = 150;

/**
 * How long the walking keys are ignored after setting off, in seconds.
 *
 * @remarks
 * A quarter of a second: long enough to let go of the key one arrived on,
 * short enough that walking away really does mean walking away.
 */
export const BOARD_GRACE = 0.25;

/**
 * How long he keeps trying to reach a door before he stops, in seconds.
 *
 * @remarks
 * Every walk that can be done is done in well under a second, so this is not a
 * budget, it is a way out: a door on the far side of a car parked against a
 * wall can be a spot with no way to stand on it, and without this he would go
 * on pushing at the wall until somebody pressed the key again.
 */
export const BOARD_PATIENCE = 4;

/**
 * How far off the wanted heading the stick still counts as straight ahead.
 *
 * @remarks
 * In radians, and it is an easing rather than a dead zone: the closer the nose
 * gets to where the thumb is pointing, the less lock goes on. Steered flat out
 * until the last degree, a car hunts either side of the line for ever.
 */
export const STICK_EASE = 0.4;

/** How close counts as arriving at a job marker. */
export const MARKER_RANGE = 40;

/**
 * How close to the middle of the bay counts as being all the way in.
 *
 * @remarks
 * Half a square, so that the work only starts once the car is past the doorway
 * and the door has something to come down behind. Anything wider and the door
 * shuts on a car that is still standing in it - and whatever is already inside
 * a wall is allowed to drive out of it, so it would simply leave again.
 */
/**
 * The number Los Santos is built from.
 *
 * @remarks
 * One city, always the same one. The plan of the streets never depended on it -
 * that comes out of a hash - but where the traffic stands, where the gangs hold
 * their corners and where one wakes up did, and a city that rearranged its cars
 * every time one pressed "new game" was a city one could never learn.
 */
export const CITY_SEED = 20260912;

export const GARAGE_RANGE = 26;

/** How long the garage door stays shut while the work is done, in seconds. */
export const GARAGE_SHUT = 1.4;

/**
 * How near the player has to be for the door to roll up, in pixels.
 *
 * @remarks
 * About two car lengths: far enough that it is up by the time one is close
 * enough to steer at it, near enough that it is plainly answering to you
 * rather than standing open all day.
 */
export const GARAGE_OPEN = 90;

/**
 * How close a policeman has to be to see who went in, in pixels.
 *
 * @remarks
 * The one hole in the trick: a fresh coat of paint only works on somebody who
 * did not watch it being applied. Drive in with a patrol on your bumper and
 * you come out just as wanted as you went in.
 */
export const GARAGE_SEEN = 130;

/** What a stay in hospital costs. */
export const HOSPITAL_COST = 200;

/** What being arrested costs. */
export const BUSTED_COST = 300;

/** How much respect a finished job is worth. */
export const JOB_RESPECT = 1;

/** How much respect taking a district is worth. */
export const DISTRICT_RESPECT = 5;

/** How long a job runs before it is failed, in seconds. */
export const JOB_SECONDS = 100;

/**
 * How many people walk the streets.
 *
 * @remarks
 * Raised along with the camera. At life size a few dozen people in a city this
 * size read as a busy street, because the screen held six blocks; with the lens
 * three times closer the screen holds one, and the same few dozen read as a
 * ghost town. Only what is near the player is simulated, so the price of the
 * bigger number is memory rather than time.
 */
export const PEOPLE_COUNT = 620;

/** How many cars drive around, the parked ones aside. */
export const TRAFFIC_COUNT = 170;

/** How many cars stand at the kerb waiting to be taken. */
export const PARKED_COUNT = 160;

/** How many people are in a car in the traffic, at most. */
export const CAR_SEATS = 3;

/**
 * How long each direction gets at a traffic light, in seconds.
 *
 * @remarks
 * One clock for the whole city rather than one per junction: every light on
 * the north-south axis is green together, and then every light on the
 * east-west axis is. That is a green wave, which is what a city council
 * spends a fortune trying to arrange - and here it comes free and keeps the
 * traffic moving in blocks rather than in dribs.
 */
export const LIGHT_PHASE = 7;

/** How long the amber lasts at the end of each green, in seconds. */
export const LIGHT_AMBER = 2;

/** How far in front of a junction a car begins to slow for a red, in pixels. */
export const LIGHT_LOOK = 90;

/**
 * How many police cars come out per star.
 *
 * @remarks
 * One. The first star is one car, each further star one more - which makes a
 * wanted level something you can watch grow, rather than a switch between
 * "nothing" and "surrounded".
 */
export const POLICE_PER_STAR = 1;

/** How long between one patrol car arriving and the next, in seconds. */
export const PATROL_EVERY = 7;

/**
 * How long the law needs after losing a man or a car, in seconds.
 *
 * @remarks
 * Twice the ordinary gap. This is the reward for fighting back rather than
 * only running: every patrol that goes down buys a quarter of a minute in
 * which the next one is not there yet, and a quarter of a minute is two
 * streets and a corner.
 */
export const POLICE_AGAIN = 15;

/** And how long before another helicopter comes up, in seconds. */
export const HELI_AGAIN = 50;

/** How much unseen trouble it takes before somebody calls the police. */
export const HEAT_PER_STAR = 3;

/** How fast unseen trouble is forgotten, in points a second. */
export const HEAT_COOLS = 0.12;

/** How far a policeman has to be to see something happen, in pixels. */
export const WITNESS_RANGE = 420;

/** The most police cars the city can put on the road at once. */
export const POLICE_MAX = 6;

/**
 * The most stars anything short of attacking the police is worth.
 *
 * @remarks
 * Knocking passers-by about is a police matter, but it is not a manhunt: it
 * tops out here. The last two stars - the helicopter and the tank - have to be
 * earned off the police themselves, which is what stops the top of the scale
 * from being something one wanders into.
 */
export const CIVIL_STARS = 4;

/**
 * How badly the police want somebody who has taken one of their machines.
 *
 * @remarks
 * Two, straight away and without anybody having to see it. A patrol car or a
 * patrol bike is theirs however it was come by, and the radio in it tells them
 * where it is - so the wanted level here is not a matter of witnesses, it is a
 * matter of the vehicle having been taken at all.
 */
export const PATROL_STARS = 2;

/**
 * How fast a two-wheeler will go backwards, in pixels a second.
 *
 * @remarks
 * Walking pace, because that is what it is: nothing on two wheels has a
 * reverse gear, and a rider who wants to back out of a space puts his feet
 * down and paddles. A car does half its top speed; a motorbike does this,
 * whatever else is under the throttle.
 */
export const PADDLE_BACK = 40;

/**
 * How far a two-wheeler may lean, in pixels of offset.
 *
 * @remarks
 * **Ten pixels on a machine eleven wide**, which is a whole bike's width: flat
 * out on full lock the rider is over beside his own machine rather than on top
 * of it. That is further than a real one goes, and deliberately - a lean drawn
 * true to life is a lean nobody sees from up here, and what this is for is
 * being seen. Two had to be looked for, four could be seen, six and a half
 * could not be missed, and this is the one that is the whole point of the
 * corner.
 */
export const LEAN_MOST = 10;

/**
 * What a corner has to be worth before it leans at all.
 *
 * @remarks
 * Turn rate times speed, divided by this, gives the offset. Set so that a
 * motorbike flat out on full lock is right over on {@link LEAN_MOST} - a bike
 * turns at 3.1 radians a second and does 460, so the hardest corner in the
 * game is worth about 1400 - and one trickling round a junction barely moves.
 */
export const LEAN_STIFF = 145;

/** How quickly it goes over and comes back up, in shares a second. */
export const LEAN_RATE = 9;

/**
 * The star at which one man on a motorbike stops being enough.
 *
 * @remarks
 * One star is a traffic offence: a single bike turns up. From two on, cars
 * come as well, and the bike keeps coming with them - which is what makes the
 * difference between one star and two something you see rather than count.
 */
export const CAR_STARS = 2;

/** The star at which the helicopter joins in. */
export const HELI_STARS = 5;

/** And the one at which they send a tank. */
export const TANK_STARS = 6;

/** How fast the helicopter flies, in pixels a second. */
export const HELI_SPEED = 300;

/** How near the player it hovers before it stops closing in. */
export const HELI_HOLD = 90;

/**
 * How much depth is squashed on screen - the tilt of the whole picture.
 *
 * @remarks
 * A drawing number that the rules need as well, which is why it lives here
 * rather than in the renderer: anything drawn above the ground appears further
 * north than it stands, and working out **where a player is aiming when they
 * aim at the helicopter** is arithmetic, not painting.
 */
export const DEPTH = 0.82;

/**
 * How high it flies, in screen pixels.
 *
 * @remarks
 * Above the roofs - the tallest tower stands at seventy-four - but not so far
 * above that the machine leaves the top of the screen while its shadow is
 * still in the middle of it. Height here is multiplied by the zoom, so a
 * number that looks modest is a long way up at six times.
 */
export const HELI_HEIGHT = 52;

/**
 * How far north of itself the helicopter appears to be, in pixels.
 *
 * @remarks
 * Its height, undone by the tilt. Put the crosshair on the machine and the
 * point on the road under the crosshair is this far from the point the machine
 * is actually over - so this is the offset a shot has to allow for. Aiming at
 * what you can see is the only rule a player will ever guess.
 */
export const HELI_LOOK = HELI_HEIGHT / DEPTH;

/** Seconds between two shots from the helicopter. */
export const HELI_RELOAD = 0.5;

/**
 * How much of a hit at the player actually lands, as a share.
 *
 * @remarks
 * Everything shooting at the player - policemen, the helicopter, the gangs -
 * is toned down by this, and only at the player. The numbers in the weapon
 * table are what a weapon does; this is how hard the city is, and the two are
 * different questions. Full-strength police fire made a five-star chase a
 * matter of seconds.
 */
export const FOE_DAMAGE = 0.4;

/** What one of its shots takes off. */
export const HELI_DAMAGE = 7;

/** How far it shoots, in pixels. */
export const HELI_RANGE = 340;

/** How much the helicopter can take before it comes down. */
export const HELI_HEALTH = 120;

/** How far from the player police cars are spawned, in pixels. */
export const POLICE_SPAWN_RANGE = 700;

/** How far away anything at all stops being simulated closely. */
export const NEAR_RANGE = 900;

/**
 * How much damage a crash does per pixel per second of impact.
 *
 * @remarks
 * A hit at full speed takes about a fifth of a car. Five hard crashes are a
 * write-off, which is enough to make a chase frightening and not so much that
 * one kerb ends the game.
 */
export const CRASH_DAMAGE = 0.05;

/**
 * How long after a crash the next one is free, in seconds.
 *
 * @remarks
 * Two cars touching are two cars touching for many frames. Without this, one
 * bump was counted sixty times a second and a patrol car nudging a parked
 * player wrote the car off in three seconds.
 */
export const CRASH_PAUSE = 0.6;

/** Below this speed a bump is just a bump. */
export const CRASH_FLOOR = 90;

/** How long a body lies in the street before it is gone, in seconds. */
export const BODY_SECONDS = 5;

/**
 * How long somebody knocked over lies there before getting up, in seconds.
 *
 * @remarks
 * Long enough to be a price and short enough to stay a price. At two and a
 * bit one sat and watched the street go past; what being run over should cost
 * is the car one was about to reach, not the next minute of the game.
 */
export const FLOOR_SECONDS = 0.9;

/**
 * How fast something has to be moving to knock somebody over, in pixels a
 * second.
 *
 * @remarks
 * Above a walk. Bumping into people on the pavement makes them step aside;
 * running at them, or driving into them, puts them down.
 */
export const KNOCK_SPEED = 150;

/** What being run over takes off the player. */
export const RUN_OVER_DAMAGE = 18;

/** How far away a body still counts as being in the way, in pixels. */
export const BUMP_RANGE = 16;

/** How long the player cannot be arrested after getting out of trouble. */
export const SAFE_SECONDS = 3;

/** One shot on its way. */
export type Bullet = {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  /** Which way it flies, in radians. */
  readonly angle: number;
  /** How far it may still travel, in pixels. */
  readonly left: number;
  /** How fast it travels, in pixels a second. */
  readonly speed: number;
  /** What it takes off whatever it hits. */
  readonly damage: number;
  /** What kind of thing is in the air. */
  readonly shape: BulletShape;
  /** Who fired it - nobody is hit by their own side. */
  readonly from: BulletFrom;
  /** For a grenade: the time it goes off at, wherever it is by then. */
  readonly blowAt: number | null;
};

/** Who put something in the air. */
export type BulletFrom = "player" | "police" | "mine" | "rival";

/** What is in the air: a bullet, a lick of fire, or something that goes off. */
export type BulletShape = "shot" | "flame" | "rocket" | "grenade";

/** An explosion, kept only so it can be drawn while it fades. */
export type Blast = {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  /** The time it went off. */
  readonly at: number;
};

/** A policeman on foot: they get out and shoot rather than run you over. */
export type Cop = {
  readonly id: number;
  /** The patrol car they got out of - one carload, one set of doors. */
  readonly carId: number;
  readonly x: number;
  readonly y: number;
  /** Which way they face, in radians. */
  readonly angle: number;
  /** How far they have walked, for the walk cycle. */
  readonly walked: number;
  /** How fast they are going, as a share of an ordinary walk. */
  readonly pace: number;
  /** From zero to {@link COP_HEALTH}. */
  readonly health: number;
  /** What he carries, and what falls out of his hand when he goes down. */
  readonly holds: WeaponKind;
  /** Simulation time the next shot may be fired at. */
  readonly reloadAt: number;
  /**
   * Simulation time he is in position and may open fire.
   *
   * @remarks
   * A second after he is out of the car. Two men who got out and fired in the
   * same frame were a firing squad at the kerb; two who spread out first are
   * police surrounding somebody, which is what the whole scene is meant to
   * look like.
   */
  readonly readyAt: number;
  /** Which side of the player he takes up, in radians. */
  readonly post: number;
  /**
   * The spot in the military base he guards, or null for an ordinary patrol.
   *
   * @remarks
   * A guard is not a patrol: he belongs to a place rather than to a car, he
   * goes back to it when there is nobody to chase, and he never counts towards
   * how much law is already on the scene - otherwise ten men standing in a
   * desert would mean no patrol car is ever sent anywhere again.
   */
  readonly guards: Vec | null;
  /**
   * How many shots are left in this burst before he has to reload.
   *
   * @remarks
   * A policeman who fires without ever stopping is a hose, and a chase against
   * a hose is over in three seconds. Three shots and then a pause long enough
   * to cross the street in.
   */
  readonly burst: number;
  /** Simulation time the body is cleared away at, or null while alive. */
  readonly stillUntil: number | null;
  /**
   * Simulation time they finish climbing back into their car, or null.
   *
   * @remarks
   * Set the moment they reach the door on the way back. Getting in is not
   * instant on purpose: driving off is what the player is doing meanwhile, and
   * a car that could resume the chase the instant its men touched it would
   * make getting out of it pointless.
   */
  readonly boardAt: number | null;
};

/**
 * The police helicopter, when there is one.
 *
 * @remarks
 * Not a car and not a policeman: it flies, so no wall stops it and no road
 * carries it, and it is drawn well above everything else. That is the whole of
 * why it is a thing of its own rather than another row in the traffic.
 */
export type Heli = {
  readonly x: number;
  readonly y: number;
  /** Which way the nose points, in radians. */
  readonly angle: number;
  /** Turns the rotor, and nothing else. */
  readonly spin: number;
  /** From zero to {@link HELI_HEALTH}. */
  readonly health: number;
  /** Simulation time the next shot may be fired at. */
  readonly reloadAt: number;
  /**
   * Simulation time it was shot down at, or null while it is still flying.
   *
   * @remarks
   * A machine that blinked out of existence when its health ran out was a
   * light switch. From here it is on fire and coming down: it keeps its last
   * heading, loses height over {@link HELI_FALL} seconds, and goes off where
   * it lands. Which way it was pointing when it was hit is what makes the fall
   * a diagonal rather than a drop.
   */
  readonly fallAt: number | null;
};

/** How long a hit helicopter takes to come down, in seconds. */
export const HELI_FALL = 2.4;

/** How fast it still travels while it falls, in pixels a second. */
export const HELI_GLIDE = 120;

/** Something lying in the street waiting to be walked over. */
export type Pickup = {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  /** A weapon, the armour vest, or a fold of notes off somebody. */
  readonly holds: WeaponKind | "armour" | "cash";
  /** What the notes are worth, in euros. Nought for anything else. */
  readonly worth: number;
  /** Simulation time it comes back at, or null while it is lying there. */
  readonly backAt: number | null;
  /**
   * Whether another one appears here once this has been taken.
   *
   * @remarks
   * The everyday things do; the heavy ones do not. A rocket launcher that is
   * back on the same corner forty seconds later is not a find, it is a
   * dispenser - and whatever falls out of a dead man's hand is his, once.
   */
  readonly again: boolean;
};

/**
 * One black mark on the tarmac, where a tyre was dragged rather than rolled.
 *
 * @remarks
 * Four numbers and no owner: once it is down it belongs to the road, not to
 * the car that made it. They are not saved - a stored game full of last
 * afternoon's skid marks would be a bigger file for nothing.
 */
export type Mark = {
  readonly x: number;
  readonly y: number;
  /** Which way the tyre was pointing, in radians. */
  readonly angle: number;
  /** The clock reading it was laid at, for fading it out again. */
  readonly at: number;
  /**
   * Which vehicle laid it, and which of its tyres.
   *
   * @remarks
   * So that the marks can be **joined up**. Drawn one by one, each along the
   * way its tyre was pointing at the time, a corner comes out as a row of
   * separate straight dashes fanned out either side of the line the car
   * actually took - every one of them a tangent, none of them the curve. Told
   * which mark follows which, the picture can instead run a line from each to
   * the next, and that line is the curve.
   */
  readonly car: number;
  /** Which tyre of it: negative for the left, positive for the right. */
  readonly lane: number;
  /**
   * What laid it, which is what it is drawn and faded as.
   *
   * @remarks
   * A tyre dragged sideways leaves black rubber on tarmac: narrow, dark, and
   * gone in twenty seconds. **A track is not that.** A tank leaves one
   * wherever it goes rather than only where it slides, it is as wide as the
   * steel that pressed it, it is the colour of the ground it churned rather
   * than of rubber, and the cleats print a ladder along it. Two different
   * things on the road, so the mark says which of them it is.
   */
  readonly tread: Tread;
};

/** What pressed a mark into the road. */
export type Tread = "rubber" | "track";

/**
 * One remote charge, lying where it was put down.
 *
 * @remarks
 * It does nothing at all until the button is pressed - no fuse, no clock, no
 * trigger of its own. That is the whole point of it: everything else in the
 * belt goes off when the player is looking at the target, and this one goes
 * off when the target is standing on it. It is how a tank is taken apart.
 */
export type Charge = {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  /** Simulation time it was put down, which is what makes its light blink. */
  readonly at: number;
};

/** How many charges may lie about at once. */
export const CHARGE_MAX = 10;

/**
 * What one of them takes off at the very centre.
 *
 * @remarks
 * Well over a grenade, and deliberately: three of them under the same tank are
 * more than its four hundred of bodywork, which is the one honest way of
 * taking one apart on foot. Anything less and the answer to a tank would still
 * be "run".
 */
export const CHARGE_FORCE = 150;

/** How many stars shooting somebody costs. */
export const SHOT_STARS = 2;

/** How many lines of the log are kept. */
export const LOG_LINES = 6;

/** How close one has to stand to a counter to be served, in pixels. */
export const COUNTER_RANGE = 46;

/* ---------------------------------------------------------------- the bank */

/** One of the people behind the counter. */
export type Clerk = Inmate & {
  /** Whether his hands are up and he does as he is told. */
  readonly held: boolean;
  /** Simulation time at which he would start for the alarm button. */
  readonly panicAt: number;
};

/** One till, and how far it has been emptied. */
export type Till = {
  readonly open: boolean;
  /** How far the drawer has got, from zero to one. */
  readonly work: number;
};

/**
 * A hold-up, from the inside.
 *
 * @remarks
 * Its own little world beside the city, like the jail and the printing works.
 * What goes back to the city is two things: how much is in the bag, and
 * whether anybody got to the button.
 */
export type BankState = {
  /** Seconds since the gun came out. */
  readonly time: number;
  /** The player. */
  readonly hero: Inmate;
  /** The people behind the counter. */
  readonly staff: readonly Clerk[];
  /** The four drawers. */
  readonly tills: readonly Till[];
  /** What is in the bag. */
  readonly taken: number;
  /** How far the vault door has come open, from zero to one. */
  readonly vault: number;
  /** Whether the silent alarm has gone. */
  readonly alarm: boolean;
  /** Simulation time the police walk through the door. */
  readonly raidAt: number;
  /** How far the job in hand has got, from zero to one. */
  readonly work: number;
};

/**
 * How long one has in a bank before the police come by themselves, in seconds.
 *
 * @remarks
 * Long enough to cover three people, open the vault and empty four tills - but
 * only just, and only if none of it goes wrong. A quiet bank job is a job done
 * to a clock.
 */
export const BANK_GRACE = 100;

/** And how long one has once the silent alarm is out. */
export const ALARM_GRACE = 22;

/**
 * How long each clerk waits before trying for the button, in seconds.
 *
 * @remarks
 * The first one goes almost at once, the second twice as late, the third
 * later still - so the opening of a bank job is a sprint: three people to put
 * on the floor before the first of them finds his nerve.
 */
export const PANIC_AFTER = 5;

/** How near one has to stand to keep somebody from trying, in pixels. */
export const BANK_COVER = 130;

/** What one till holds, in euros. */
export const TILL_EACH = 950;

/** How long a drawer takes to empty, in seconds. */
export const TILL_SECONDS = 2.2;

/** How long the vault takes to open once somebody works the wheel. */
export const VAULT_SECONDS = 7;

/** How near the man with the combination has to be, in pixels. */
export const VAULT_ROOM = 120;

/** What the open vault pays out, in euros a second. */
export const VAULT_RATE = 850;

/** And how much is in there altogether. */
export const VAULT_TOTAL = 9000;

/**
 * How hard they look for whoever comes out of a bank the alarm went off in.
 *
 * @remarks
 * Two stars: cars, and enough of them to make the street outside the wrong
 * place to stand. A robbery nobody noticed is worth none at all - which is the
 * whole reason for covering the clerks rather than shooting the lock off.
 */
export const BANK_STARS = 2;

/* ------------------------------------------------------------ the prison */

/**
 * What one square of the jail is.
 *
 * @remarks
 * The jail is a fixed plan rather than a generated one, for the same reason
 * the city is fixed: an escape is a route learned by heart, and a route that
 * reshuffles itself is a maze, not a plan. See the plan in ./prison.
 */
export type Slab =
  | "wall"
  | "floor"
  | "cell"
  | "bars"
  | "gate"
  | "yard"
  | "bench"
  | "loo"
  | "myLoo"
  | "bunk"
  | "stones"
  | "tunnel"
  | "ward"
  | "window"
  | "cable"
  | "tower"
  | "free";

/** How far along the escape the player has got. */
export type PrisonStage =
  /** Out in the yard, after a screw off one of the benches. */
  | "screw"
  /** Back in the cell, with the screw: the pan comes off the floor. */
  | "loo"
  /** The stones round the drain, one by one. */
  | "stones"
  /** Through the wall and along the passage behind the cells. */
  | "tunnel"
  /** Out in the sick bay: the window, and the cable behind it. */
  | "window"
  /** Hand over hand along the cable, over the wall. */
  | "cable"
  /** Outside. */
  | "out";

/** Anybody inside the jail: the player, a warder, a fellow prisoner. */
export type Inmate = {
  readonly x: number;
  readonly y: number;
  /** Which way they face, in radians. */
  readonly heading: number;
  /** How far they have walked, which is the clock of the step. */
  readonly walked: number;
};

/**
 * A warder on his round.
 *
 * @remarks
 * Every one of them walks a fixed line and turns round at the end of it, so
 * that watching a warder for a few seconds tells you exactly when he will be
 * looking the other way. That is the whole game with them: an escape is a
 * question of timing, not of luck.
 */
export type Warder = Inmate & {
  /** The two ends of his round, in jail pixels. */
  readonly from: Vec;
  readonly to: Vec;
  /** Whether he is on his way to {@link Warder.to} or back. */
  readonly onward: boolean;
  /** Simulation time he stands still until, at the end of his round. */
  readonly waitUntil: number;
  /** How far this one sees, in jail pixels. */
  readonly range: number;
  /**
   * Whether he is up on the watchtower.
   *
   * @remarks
   * Two things follow from it, and both are what a tower is for: he looks over
   * the walls instead of along them, and he is drawn up on his platform. The
   * cable over the wall runs right through his beat - which is why the last
   * stretch of the escape is a matter of waiting for him to turn.
   */
  readonly high: boolean;
};

/**
 * The escape, at one moment.
 *
 * @remarks
 * Its own little world beside the city: a floor of {@link Slab}s, a handful of
 * people on it, and one ladder of tasks. Nothing here knows about cars, money
 * or stars - what the jail hands back to the city is one thing, whether the
 * player got out.
 */
export type PrisonState = {
  /** Seconds since the cell door was unlocked for the day. */
  readonly time: number;
  /** How far along the escape the player is. */
  readonly stage: PrisonStage;
  /** The player, on foot. */
  readonly hero: Inmate;
  /** The warders on their rounds. */
  readonly warders: readonly Warder[];
  /** The prisoners coming along, once the wall is open. */
  readonly mates: readonly Inmate[];
  /** Where the player has been, newest first: what the followers walk. */
  readonly trail: readonly Vec[];
  /** The men who stay behind: leaning about the yard and the cells. */
  readonly idle: readonly Inmate[];
  /** How far the job in hand has got, from zero to one. */
  readonly work: number;
  /** Whether the screw off the bench is in the player's pocket. */
  readonly screw: boolean;
  /** How often a warder has taken the player back to the cell. */
  readonly caught: number;
  /** Simulation time the warders look past the player until, after a catch. */
  readonly graceUntil: number;
};

/** How many jail pixels one square of the plan is. */
export const SLAB = 40;

/**
 * How close one has to stand to work on something, in jail pixels.
 *
 * @remarks
 * A little more than one square of the plan, so that standing in the square
 * next to a thing is close enough to work on it. Less than that and the game
 * would be about shuffling into a pixel-perfect spot, which is not the game.
 */
export const REACH = 46;

/** How far a warder sees, in jail pixels. */
export const WATCH_RANGE = 190;

/** How wide his look is to each side, in radians. */
export const WATCH_WIDE = 0.62;

/** How fast a warder walks his round, in pixels per second. */
export const WARDER_SPEED = 62;

/** How long he stands at the end of it, in seconds. */
export const WARDER_TURN = 1.4;

/** How many steps of the player's way the followers walk behind. */
export const TRAIL_STEPS = 90;

/** How far apart two points of that trail are, in jail pixels. */
export const TRAIL_GAP = 14;

/** How many prisoners come along once the wall is open. */
export const MATE_COUNT = 5;

/** How often a warder may take you back before the escape is over. */
export const CATCHES = 3;

/** How long the warders look past you after one, in seconds. */
export const GRACE_SECONDS = 2.5;

/** How far the man on the tower sees, in jail pixels. */
export const TOWER_RANGE = 320;

/** How high his platform stands over the ground, in screen pixels. */
export const TOWER_HEIGHT = 78;

/**
 * How hard they look for somebody who went over the wall.
 *
 * @remarks
 * Three stars: cars and bikes, no helicopter. Getting out of the jail is not
 * the end of the escape - the way it ends is a chase through Los Santos, and
 * a chase one cannot lose is not a chase.
 */
export const ESCAPE_STARS = 3;

/** How many of the others make it out of the wall with the player. */
export const ESCAPE_MATES = MATE_COUNT;

/** How fast the player crosses the cable, as a share of walking pace. */
export const CABLE_PACE = 0.55;

/** How high over the ground the cable hangs, in pixels. */
export const CABLE_HEIGHT = 46;

/* ------------------------------------------------------ the printing works */

/**
 * What one square of the printing works is.
 *
 * @remarks
 * The third fixed plan, after the city and the jail, and for the same reason: a
 * job is a route learned by heart. See the plan in ./mint.
 */
export type Tile =
  | "wall"
  /** The hall inside the front door. */
  | "hall"
  /** The floor of the press room. */
  | "works"
  /** A press: somebody stands at it and it runs off notes. */
  | "press"
  /** Pallets of paper, stacked. */
  | "pallet"
  /** A desk in the office. */
  | "desk"
  /** The front door - where they knock first. */
  | "door"
  /** The loading gate at the back. */
  | "gate"
  /** The high window over the yard. */
  | "window"
  /** The cellar under the works. */
  | "cellar"
  /** Where the tunnel is dug. */
  | "dig"
  /** The tunnel itself, once it is open. */
  | "tunnel"
  /** The far end of it: out. */
  | "out"
  /** Anything past the walls. */
  | "free";

/** Which of the three ways in. */
export type GateKind = "door" | "gate" | "window";

/**
 * One way into the building, and how hard they are leaning on it.
 *
 * @remarks
 * Three of them, and the siege is these three numbers. What is piled against a
 * door slows what comes through it; what comes through it eats what is piled
 * against it. Neither gets to the end on its own, which is what makes standing
 * in the right doorway at the right moment the whole game.
 */
export type Gate = {
  readonly kind: GateKind;
  /** Where it stands, in works pixels. */
  readonly at: Vec;
  /** What is piled against it, from zero to one. */
  readonly barricade: number;
  /** How far they have got through it, from zero to one. */
  readonly push: number;
  /** Whether a squad is working on it this moment. */
  readonly busy: boolean;
};

/**
 * Somebody who works here and is having a very bad morning.
 *
 * @remarks
 * Until they are taken they walk about their own business. Afterwards they do
 * what they are told: they go to a press and they run it. Which press is
 * remembered rather than worked out again, so that two of them never end up at
 * the same machine.
 */
export type Hostage = Inmate & {
  /** Whether they have given up. */
  readonly taken: boolean;
  /** Which press they were sent to, or null while they are still free. */
  readonly press: number | null;
};

/**
 * The job in the printing works, at one moment.
 *
 * @remarks
 * Its own little world beside the city, like the jail - but a busy one. Three
 * things run at once and each has its own people: the hostages print, the hired
 * men dig, and the player is the only one who can hold a door. What goes back
 * to the city is one number and one answer - how much was printed, and whether
 * it came out through the tunnel or they came in through a door.
 */
export type MintState = {
  /** Seconds since the front door shut. */
  readonly time: number;
  /** The player. */
  readonly hero: Inmate;
  /** The hired men, digging. */
  readonly crew: readonly Inmate[];
  /** Everybody who works here. */
  readonly staff: readonly Hostage[];
  /** The three ways in. */
  readonly gates: readonly Gate[];
  /** What the presses have run off so far. */
  readonly printed: number;
  /** How far the tunnel has got, from zero to one. */
  readonly tunnel: number;
  /** How far the job in hand has got, from zero to one. */
  readonly work: number;
  /** Simulation time they keep their distance until. */
  readonly calmUntil: number;
  /** Simulation time the lights come back on - and with them the presses. */
  readonly darkUntil: number;
  /** Whether the mains have been cut already - that works once. */
  readonly cut: boolean;
  /** Simulation time the next squad turns up at. */
  readonly waveAt: number;
  /** How many squads have come so far. */
  readonly waves: number;
};

/** How many hired men the door of the printing works opens for. */
export const MINT_CREW = 4;

/** How many of them will work for one man at a time. */
export const CREW_MAX = 6;

/**
 * What a man from the other gang costs for the day, in euros.
 *
 * @remarks
 * Only the other gang. Your own come along because they are your own - which
 * is the whole point of having a side in this city, and the reason the green
 * shirts on the corner by your house are worth knowing about.
 */
export const HIRE_PRICE = 500;

/**
 * How close one has to stand to take somebody on, in city pixels.
 *
 * @remarks
 * Two squares, which is wider than the doorways are. A gang member is not a
 * counter with a sign over it - the offer has to catch the eye of somebody who
 * was only walking past.
 */
export const HIRE_RANGE = 96;

/** How close behind the player his crew walk, in city pixels. */
export const CREW_GAP = 34;

/**
 * What one manned press runs off, in euros a second.
 *
 * @remarks
 * Five machines and a few minutes come to more than a bank vault several times
 * over, and they are meant to: this is the one job in the city that needs a
 * crew, a plan and somebody to hold three doors. The number is what makes the
 * risk worth taking, and the tunnel is what stops it being taken twice.
 */
export const PRESS_RATE = 85;

/** How long one man alone would dig the tunnel, in seconds. */
export const DIG_SECONDS = 620;

/** How many men the player digs like, when he digs himself. */
export const HERO_DIG = 1.6;

/** How long it takes to talk somebody onto a press, in seconds. */
export const TAKE_SECONDS = 1.5;

/** How fast a barricade goes up by hand, in shares of a door a second. */
export const BUILD_RATE = 0.4;

/**
 * How fast a squad comes through a bare door, in shares a second.
 *
 * @remarks
 * A minute on a door with nothing against it, and the better part of five on
 * one piled to the top. That is the width of the whole decision: the building
 * is big enough that crossing it takes fifteen seconds, so a door left bare is
 * a door lost, and one piled up early is one that can be left alone for a
 * while.
 */
export const PUSH_RATE = 0.016;

/** How much of that a full barricade takes off. */
export const SHIELD = 0.82;

/** How long after the door shuts the first squad turns up, in seconds. */
export const WAVE_FIRST = 30;

/** And how long between the ones after it. */
export const WAVE_EVERY = 36;

/** How long they stand off after a hostage is let out, in seconds. */
export const RELEASE_CALM = 26;

/** And after the mains go, which happens once. */
export const POWER_CALM = 46;

/** How many of the hired men come out of the tunnel with the player. */
export const MINT_MATES = 3;
