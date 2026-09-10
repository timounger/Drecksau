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
export const CITY_TILES = 64;

/** How wide the whole city is, in pixels. */
export const CITY_SIZE = CITY_TILES * TILE;

/** Every second cell of this many is a road. */
export const BLOCK_TILES = 6;

/** What one cell of the city is. */
export type Cell = "road" | "walk" | "building" | "park" | "water";

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
export type Feud = {
  readonly mine: boolean;
  readonly rival: boolean;
};

/**
 * How far the simulation has got.
 *
 * @remarks
 * `prison` is the odd one out: the city stands still while it lasts and the
 * player is somewhere else entirely - inside the jail, on foot, with a screw
 * and a plan. See {@link PrisonState}.
 */
export type Phase = "playing" | "busted" | "wasted" | "won" | "prison";

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
  readonly garage: Vec;
  /**
   * Simulation time the garage door shut at, or null while it stands open.
   *
   * @remarks
   * Only the picture cares, but it belongs here rather than in the renderer:
   * two frames of the same city have to show the same door.
   */
  readonly garageAt: number | null;
  /** The helicopter overhead, or null while there is none. */
  readonly heli: Heli | null;
  /** Which gangs the player has picked a fight with. */
  readonly feud: Feud;
  /** Simulation time the next patrol car may be sent, so they arrive one by
   * one rather than all at once. */
  readonly patrolAt: number;
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
  /** The newest lines of what happened, newest last. */
  readonly log: readonly string[];
};

/** The player, on foot or at a wheel. */
export type Player = {
  readonly x: number;
  readonly y: number;
  /** Which way they face, in radians - where the mouse points. */
  readonly angle: number;
  /** Which way they last moved, in radians. The legs go this way. */
  readonly heading: number;
  /** How far they have walked, in pixels. See {@link STRIDE}. */
  readonly walked: number;
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
   * Whether the player is still in the striped suit he broke out in.
   *
   * @remarks
   * A man who has just come over a prison wall is wearing what he came over it
   * in, and everybody in the street can see it. It goes when the search does:
   * with the last star, he has found something else to put on.
   */
  readonly striped: boolean;
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
  /** Shift: the debug turbo. See {@link CHEAT_WALK}. */
  readonly boost: boolean;
  /** Notches the mouse wheel turned this frame: the weapon in the hand. */
  readonly wheel: number;
  /** The other cheat: nothing hurts, and the belt is full. */
  readonly god: boolean;
};

/** Nothing pressed. */
export const IDLE_INPUT: Input = {
  up: false,
  down: false,
  left: false,
  right: false,
  use: false,
  plant: false,
  aim: { x: 0, y: 0 },
  fire: false,
  boost: false,
  wheel: 0,
  god: false,
};

/** Longest slice of time one step may advance, so a paused tab cannot jump. */
export const MAX_STEP = 0.05;

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

/** Top speed of traffic that drives itself. */
export const TRAFFIC_SPEED = 190;

/** How hard a car accelerates, in pixels per second squared. */
export const CAR_ACCEL = 260;

/** How hard it brakes. */
export const CAR_BRAKE = 460;

/** How quickly a car slows with nobody on the pedals. */
export const CAR_DRAG = 90;

/** How fast a car turns at speed, in radians per second. */
export const CAR_TURN = 2.6;

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
export const SMOKE_STAGE = 2;

/** How long after that the smoke turns thick and black. */
export const FUMES_STAGE = 4;

/** How long after that it is properly alight. */
export const FIRE_STAGE = 6;

/** How long a wreck lasts altogether before it goes off, in seconds. */
export const BURN_SECONDS = 9;

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

/** The most stars the police hand out. */
export const MAX_STARS = 6;

/** How long the stars hold before one falls off by itself, in seconds. */
export const COOL_SECONDS = 18;

/** How close the player has to be to a car to get in. */
export const ENTER_RANGE = 46;

/** How close counts as arriving at a job marker. */
export const MARKER_RANGE = 40;

/** How close to the spray shop counts as driving in. */
export const GARAGE_RANGE = 60;

/** How long the garage door stays shut while the work is done, in seconds. */
export const GARAGE_SHUT = 1.6;

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
export const PEOPLE_COUNT = 220;

/** How many cars drive around, the parked ones aside. */
export const TRAFFIC_COUNT = 58;

/** How many cars stand at the kerb waiting to be taken. */
export const PARKED_COUNT = 54;

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

/** How long somebody knocked over lies there before getting up, in seconds. */
export const FLOOR_SECONDS = 2.2;

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
  /** From zero to {@link COP_HEALTH}. */
  readonly health: number;
  /** What he carries, and what falls out of his hand when he goes down. */
  readonly holds: WeaponKind;
  /** Simulation time the next shot may be fired at. */
  readonly reloadAt: number;
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
  /** A weapon, or the armour vest. */
  readonly holds: WeaponKind | "armour";
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
