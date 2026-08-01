/**
 * Core types and tuning constants of the Panzerkiste simulation.
 *
 * @module
 * @remarks
 * The world is continuous (pixels); walls sit on a grid of {@link TILE}-sized
 * cells. All the numbers a designer might tweak (speeds, sizes, timings) live
 * here as named constants, so the {@link ../engine engine} reads as rules, not
 * magic numbers.
 */
import type { RandomState } from "./random";

/** A point or vector in world (pixel) space. */
export type Vec = {
  readonly x: number;
  readonly y: number;
};

/** Which sort of tank this is - the human or one of the enemy types. */
export type TankKind =
  | "player"
  | "brown"
  | "grey"
  | "teal"
  | "green"
  | "yellow"
  | "purple"
  | "invisible"
  | "black"
  | "boss";

/** How far the simulation has got. */
export type Phase = "playing" | "cleared" | "won" | "lost";

/** One tank on the field. */
export type Tank = {
  readonly id: string;
  readonly kind: TankKind;
  readonly x: number;
  readonly y: number;
  /** The turret's aim angle, in radians. */
  readonly turret: number;
  /** True while the tank is on the field. */
  readonly alive: boolean;
  /** Simulation time before which the tank may not shoot again. */
  readonly reloadUntil: number;
  /** Enemy roaming: the current move heading in radians, and when to repick. */
  readonly headingUntil: number;
  readonly heading: number;
  /**
   * Simulation time until which nothing can destroy this tank.
   *
   * @remarks
   * Zero means unprotected. Kept as a deadline rather than a countdown so the
   * shield behaves the same however the frames fall.
   */
  readonly shieldUntil: number;
  /** Simulation time until which this tank reloads far quicker. */
  readonly rapidUntil: number;
  /** Simulation time until which its shots go out as a fan of shells. */
  readonly scatterUntil: number;
  /**
   * How many more hits it takes before it is destroyed.
   *
   * @remarks
   * One for everything but the boss, which is the point of the boss: you cannot
   * end it with a lucky shot, you have to keep landing them while it hunts you.
   */
  readonly hitsLeft: number;
};

/**
 * What a destroyed tank can leave behind.
 *
 * @remarks
 * `revive` is co-op only, and only ever dropped while a partner is actually
 * down - an item nobody could use would just be litter on the field.
 */
export type PickupKind = "shield" | "rapid" | "revive" | "scatter";

/** One item lying on the floor, waiting to be driven over. */
export type Pickup = {
  readonly id: string;
  readonly kind: PickupKind;
  readonly x: number;
  readonly y: number;
};

/** A shell in flight. */
export type Bullet = {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  /** How many wall bounces it has left before it dies. */
  readonly bouncesLeft: number;
  /** Who fired it, so a fresh shot does not blow up its own tank. */
  readonly ownerId: string;
  /** True once it may hit its own tank (after the first bounce). */
  readonly armed: boolean;
  /** A guided missile that steers itself towards the nearest enemy. */
  readonly homing: boolean;
};

/** A laid mine, counting down to its blast. */
export type Mine = {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly ownerId: string;
  /** Simulation time at which it detonates. */
  readonly explodeAt: number;
};

/** A short-lived blast, for the animation. */
export type Explosion = {
  readonly x: number;
  readonly y: number;
  /** Simulation time at which the blast fades. */
  readonly until: number;
};

/** One breadcrumb of a tank's path, for the tread trail left on the floor. */
export type Trail = {
  /** The tank that dropped it, so its points join into one trail. */
  readonly id: string;
  readonly x: number;
  readonly y: number;
  /** The chassis heading there, so the two track lines sit right. */
  readonly heading: number;
};

/** The whole simulation at one instant - a pure, serialisable value. */
export type GameState = {
  readonly cols: number;
  readonly rows: number;
  /** Row-major grid; true where a wall blocks movement and shots. */
  readonly walls: readonly boolean[];
  /**
   * Row-major grid; true where a wall cell can be blasted away by a mine.
   *
   * @remarks
   * A destructible wall is also a wall (its {@link GameState.walls} entry is
   * true), so it blocks and bounces exactly like a solid one - it just turns to
   * floor when a blast reaches it.
   */
  readonly breakable: readonly boolean[];
  /**
   * Row-major grid; true where a hole blocks tanks but not shells.
   *
   * @remarks
   * A hole stops any tank that would drive onto it, yet shells fly straight over
   * it - so it shapes where tanks can go without ever blocking a line of fire.
   */
  readonly holes: readonly boolean[];
  readonly tanks: readonly Tank[];
  readonly bullets: readonly Bullet[];
  readonly mines: readonly Mine[];
  readonly explosions: readonly Explosion[];
  /** Items dropped by destroyed tanks, lying about to be collected. */
  readonly pickups: readonly Pickup[];
  /** Floor spots where an enemy was destroyed; shown until the round ends. */
  readonly marks: readonly Vec[];
  /** Tread-trail breadcrumbs of every tank; shown until the round ends. */
  readonly trails: readonly Trail[];
  /** The current level index into the level list. */
  readonly level: number;
  readonly lives: number;
  readonly phase: Phase;
  /** Accumulated simulation time in seconds. */
  readonly time: number;
  readonly random: RandomState;
  /** Counter for unique entity ids. */
  readonly nextId: number;
  /**
   * Ordinary shells the players have fired this mission.
   *
   * @remarks
   * Counted per **shell**, not per pull of the trigger: a scatter volley is
   * three of them. The guided missile is left out of both counts - it steers
   * itself, so mixing it in would say nothing about aim.
   *
   * Carried across levels within a mission and reset by {@link restart}, so it
   * measures a run rather than a level.
   */
  readonly shotsFired: number;
  /** How many of those shells destroyed an enemy. */
  readonly shotsHit: number;
  /**
   * Which wave of the endless arena is out, counting from 1; zero before the
   * first and on every ordinary level.
   */
  readonly wave: number;
  /**
   * When the next wave is due, in simulation time, or null while one is out.
   *
   * @remarks
   * A time rather than a countdown, so it behaves the same however the frames
   * fall. Null, not Infinity: the state travels to the other client as JSON,
   * and JSON has no Infinity.
   */
  readonly nextWaveAt: number | null;
};

/** What the player (or the driver) asks of their tank this step. */
export type Input = {
  /** Desired move direction; the zero vector means "stand still". */
  readonly move: Vec;
  /** World point the turret should aim at. */
  readonly aim: Vec;
  /** True on the step the player fires. */
  readonly fire: boolean;
  /** True on the step the player launches a homing missile (the secret weapon). */
  readonly fireHoming: boolean;
  /** True on the step the player lays a mine. */
  readonly layMine: boolean;
};

/** Edge length of one wall cell, in pixels. */
export const TILE = 40;

/** Collision radius of a tank body. */
export const TANK_RADIUS = 14;

/**
 * How far in front of a tank's centre a shell is born, in pixels.
 *
 * @remarks
 * This is the gun barrel's length, so a shell leaves at the muzzle rather than
 * the tank's centre. The offset is along the aim direction, so the shell stays
 * on the aim line and hits exactly where the barrel points. The renderer draws
 * the barrel to this same length, so the two line up in the tilted view.
 */
export const MUZZLE_OFFSET = 22;

/** Collision radius of a shell. */
export const BULLET_RADIUS = 4;

/** Shell speed in pixels per second. */
export const BULLET_SPEED = 250;

/** Rocket speed in pixels per second - faster than an ordinary shell. */
export const ROCKET_SPEED = 360;

/** Speed of a homing missile - the same as a rocket, but it steers. */
export const HOMING_SPEED = ROCKET_SPEED;

/** How fast a homing missile can turn, in radians/second - tight enough to
 * whip around corners and thread gaps rather than overshoot. */
export const HOMING_TURN_RATE = 12;

/** Bounce budget of a homing missile - a small safety net for the rare graze;
 * it mostly steers around walls (see the engine) rather than hitting them. */
export const HOMING_BOUNCES = 4;

/** Seconds the fire button is held before the secret homing missile launches. */
export const HOMING_CHARGE_SECONDS = 1.5;

/** How many times a shell bounces off walls before it dies. */
export const BULLET_BOUNCES = 1;

/** The human tank's move speed in pixels per second. */
export const PLAYER_SPEED = 140;

/** Most shells the player may have in flight at once. */
export const PLAYER_MAX_BULLETS = 5;

/** Most mines the player may have laid at once. */
export const PLAYER_MAX_MINES = 2;

/** Seconds the player must wait between shots. */
export const PLAYER_RELOAD = 0.35;

/** Seconds from laying a mine to its blast. */
export const MINE_FUSE = 3;

/** Blast radius of a mine. */
export const MINE_RADIUS = 56;

/** How close a shell must pass a mine to set it off on contact. */
export const MINE_BODY_RADIUS = 9;

/** How long a blast stays on screen, in seconds. */
export const EXPLOSION_TIME = 0.35;

/** Largest step the simulation takes at once, so a lag spike cannot tunnel. */
export const MAX_STEP = 0.03;

/** The behaviour of one enemy type. */
export type EnemyTraits = {
  /** Move speed in pixels per second; zero for a turret that stays put. */
  readonly speed: number;
  /** Seconds between shots. */
  readonly reload: number;
  /** Shells this enemy may have in flight at once. */
  readonly maxBullets: number;
  /** Wall bounces its shells get. */
  readonly bounces: number;
  /** How accurately it tracks the player, 0..1 (1 = dead on). */
  readonly aim: number;
  /** Whether it drops mines as it roams. */
  readonly laysMines: boolean;
  /** Speed of the shells it fires, in pixels per second. */
  readonly bulletSpeed: number;
  /** Whether it aims bank shots off walls to reach the player around cover. */
  readonly banks: boolean;
};

/** How many hits the boss takes before it goes up. */
export const BOSS_HITS = 6;

/** The breather between one wave of the endless arena and the next, seconds. */
export const WAVE_PAUSE = 2.5;

/** How many enemies the first wave sends. */
export const WAVE_BASE_ENEMIES = 2;

/** How many more enemies each further wave adds. */
export const WAVE_GROWTH = 0.5;

/**
 * Most enemies one wave will ever send.
 *
 * @remarks
 * A ceiling, because the field is only so big: past this the arena stops being
 * hard and starts being a traffic jam. Beyond it the waves keep getting worse
 * through the **kinds** that turn up, not the numbers.
 */
export const WAVE_MAX_ENEMIES = 8;

/** How far from every player a wave spawns, in tiles. */
export const SPAWN_CLEARANCE = 4;

/** How many spots are tried before a wave settles for any free one. */
export const SPAWN_TRIES = 40;

/**
 * Which enemy kinds a wave may send, and from which wave on.
 *
 * @remarks
 * This is the whole difficulty curve of the arena: the numbers stop growing at
 * {@link WAVE_MAX_ENEMIES}, but what turns up keeps getting nastier, ending
 * with the boss - by then several at once.
 */
export const WAVE_UNLOCKS: readonly {
  readonly from: number;
  readonly kind: Exclude<TankKind, "player">;
}[] = [
  { from: 1, kind: "brown" },
  { from: 1, kind: "grey" },
  { from: 3, kind: "yellow" },
  { from: 4, kind: "teal" },
  { from: 6, kind: "green" },
  { from: 7, kind: "purple" },
  { from: 9, kind: "invisible" },
  { from: 11, kind: "black" },
  // Past the enemy-count ceiling this is what "harder" still means: the arena
  // starts sending the boss itself, and more than one of them later on.
  { from: 14, kind: "boss" },
];

/** How often a destroyed enemy leaves something behind, as a chance of one. */
export const DROP_CHANCE = 0.3;

/** How close a tank has to come to pick an item up, in pixels. */
export const PICKUP_RADIUS = 20;

/** How long a shield holds, in seconds. */
export const SHIELD_SECONDS = 8;

/**
 * How long before a shield lapses it starts to blink, in seconds.
 *
 * @remarks
 * Running out unannounced would be the worst kind of surprise: you would only
 * learn the shield was gone by being destroyed.
 */
export const SHIELD_BLINK_LEAD = 2.5;

/**
 * How long a revived tank is protected, in seconds.
 *
 * @remarks
 * Shorter than a collected shield: it is there so the partner is not shot the
 * instant they reappear, not a reward in itself.
 */
export const REVIVE_SHIELD_SECONDS = 3;

/** How long rapid fire holds, in seconds. */
export const RAPID_SECONDS = 10;

/** How much quicker the reload is while rapid fire holds. */
export const RAPID_FACTOR = 4;

/**
 * How long scatter shot holds, in seconds.
 *
 * @remarks
 * Deliberately the same span as rapid fire: both are a burst of firepower you
 * make the most of while it lasts, and two different clocks for the same kind
 * of thing would only be something else to keep track of mid-fight.
 */
export const SCATTER_SECONDS = RAPID_SECONDS;

/** How many shells one scatter shot puts in the air. */
export const SCATTER_SHOTS = 3;

/** How far the outer shells of a scatter shot fan out, in radians. */
export const SCATTER_SPREAD = 0.2;

/** How many mines an enemy that lays them keeps out at once. */
export const ENEMY_MAX_MINES = 2;

/** A mine-laying enemy's chance per second of dropping one while roaming. */
export const ENEMY_MINE_RATE = 0.5;

/** Per enemy type: how it drives and shoots. */
export const ENEMY_TRAITS: Readonly<
  Record<Exclude<TankKind, "player">, EnemyTraits>
> = {
  // Brown: a stationary turret that fires slow, straight shots.
  brown: {
    speed: 0,
    reload: 1.6,
    maxBullets: 1,
    bounces: 1,
    aim: 0.75,
    laysMines: false,
    bulletSpeed: BULLET_SPEED,
    banks: false,
  },
  // Grey: roams slowly and takes aimed shots.
  grey: {
    speed: 62,
    reload: 1.3,
    maxBullets: 1,
    bounces: 1,
    aim: 0.85,
    laysMines: false,
    bulletSpeed: BULLET_SPEED,
    banks: false,
  },
  // Teal (the turquoise "blue" enemy): roams and fires fast rockets that do NOT
  // ricochet - they fly straight and die on the first wall. Rockets are strong,
  // so it reloads slowly and keeps only one in the air at a time.
  teal: {
    speed: 100,
    reload: 2.2,
    maxBullets: 1,
    bounces: 0,
    aim: 0.9,
    laysMines: false,
    bulletSpeed: ROCKET_SPEED,
    banks: false,
  },
  // Green: a stationary sharpshooter; fires fast rockets that ricochet twice and
  // it aims bank shots off walls to reach the player after one or two bounces.
  // Its rockets are dangerous, so it fires them sparingly - a long reload and
  // only one rocket in flight at a time.
  green: {
    speed: 0,
    reload: 2.4,
    maxBullets: 1,
    bounces: 2,
    aim: 0.92,
    laysMines: false,
    bulletSpeed: ROCKET_SPEED,
    banks: true,
  },
  // Yellow: fast, presses forward, fires quickly and lays mines as it roams.
  yellow: {
    speed: 130,
    reload: 1.0,
    maxBullets: 2,
    bounces: 1,
    aim: 0.9,
    laysMines: true,
    bulletSpeed: BULLET_SPEED,
    banks: false,
  },
  // Purple: fast and relentless; fires twice as fast as a normal tank, with
  // ricocheting shells (a few in the air at once so the fast rate shows).
  purple: {
    speed: 135,
    reload: 0.5,
    maxBullets: 3,
    bounces: 2,
    aim: 0.95,
    laysMines: false,
    bulletSpeed: BULLET_SPEED,
    banks: false,
  },
  // Invisible: white for a moment at the start, then unseen; roams, lays mines
  // and fires ordinary shells (its trail, mines and shots give it away).
  invisible: {
    speed: 70,
    reload: 1.2,
    maxBullets: 1,
    bounces: 1,
    aim: 0.85,
    laysMines: true,
    bulletSpeed: BULLET_SPEED,
    banks: false,
  },
  // The boss: slow and heavy, but it throws rockets about in numbers and lays
  // mines while it comes at you. What makes it a boss is BOSS_HITS, not its
  // driving - everything else on the field dies to one shell.
  boss: {
    speed: 85,
    reload: 1.1,
    maxBullets: 3,
    bounces: 2,
    aim: 0.9,
    laysMines: true,
    bulletSpeed: ROCKET_SPEED,
    banks: true,
  },
  // Black: the hardest of the lot. Quicker on its tracks than anything else on
  // the field, and it fires rockets - fast ones, in quick succession, and they
  // ricochet. Nothing else combines that speed with that reach, so cover buys
  // far less time against it than against any other enemy.
  black: {
    speed: 150,
    reload: 0.9,
    maxBullets: 2,
    bounces: 1,
    aim: 0.95,
    laysMines: false,
    bulletSpeed: ROCKET_SPEED,
    banks: false,
  },
};
