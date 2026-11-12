/**
 * The shapes of Frost Fortress: resources, structures, enemies, the wave, the
 * weather and the whole running game.
 *
 * @module
 * @remarks
 * The engine works on one mutable {@link Game} object - a frame with two
 * hundred enemies would otherwise copy two hundred objects sixty times a
 * second. Only what {@link SaveData} lists goes to storage; everything else
 * (the flow field, the occupancy grid, the spatial hash) is rebuilt from it.
 */

/** The six resources. */
export type ResourceId = "wood" | "iron" | "stone" | "energy" | "food" | "fuel";

/** An amount of every resource. */
export type Resources = Record<ResourceId, number>;

/** Some resources, for costs and rewards. */
export type Cost = Readonly<Partial<Record<ResourceId, number>>>;

/** The nine buildings. */
export type BuildingKind =
  | "hq"
  | "warehouse"
  | "barracks"
  | "workshop"
  | "generator"
  | "mine"
  | "lumberCamp"
  | "lab"
  | "infirmary";

/** The seven defences. */
export type DefenseKind =
  | "machineGun"
  | "cannon"
  | "sniper"
  | "tesla"
  | "flamethrower"
  | "minefield"
  | "wall";

/** Anything that can be placed. */
export type StructureKind = BuildingKind | DefenseKind;

/** Which list of the build menu a structure sits in. */
export type MenuGroup = "base" | "production" | "defense";

/** The six enemy types. */
export type EnemyKind =
  "raider" | "soldier" | "heavy" | "demolisher" | "siege" | "boss";

/** Terrain of one tile. */
export enum Terrain {
  Snow = 0,
  DeepSnow = 1,
  Ice = 2,
  Rock = 3,
  Forest = 4,
  IronOre = 5,
  StoneOre = 6,
}

/** One placed structure - finished, being built or being upgraded. */
export type Structure = {
  readonly id: number;
  readonly kind: StructureKind;
  /** Top-left tile. */
  col: number;
  row: number;
  level: number;
  hp: number;
  /** False while the first construction runs. */
  built: boolean;
  /** Progress of construction or upgrade, 0 to 1. */
  progress: number;
  /** True while an upgrade to the next level runs. */
  upgrading: boolean;
  /** Seconds until the weapon may fire again (or the next soldier). */
  cooldown: number;
  /** The enemy aimed at, or 0. */
  target: number;
  /** Where the barrel points, in radians. */
  aim: number;
  /** Mines left in a minefield. */
  charges: number;
  /** Hit points still to be restored by a paid repair. */
  repairing: number;
  /** Seconds the weapon has been firing - flame, muzzle flash. */
  firing: number;
  /** Seconds since it was last hit, for the flash. */
  hitAgo: number;
};

/** One enemy on the field. */
export type Enemy = {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  armor: number;
  /** World units per second. */
  speed: number;
  damage: number;
  /** Attack reach in world units. */
  range: number;
  /** Seconds between attacks. */
  interval: number;
  cooldown: number;
  /** Structure id under attack, or 0. */
  target: number;
  /** Defender id under attack, or 0. */
  targetUnit: number;
  /** Seconds until the target is looked for again. */
  scan: number;
  /** Heading, radians. */
  angle: number;
  /** Seconds of slowing left, and how strong. */
  slow: number;
  slowFactor: number;
  /** Seconds of burning left, and damage per second. */
  burn: number;
  burnDps: number;
  /** Seconds stunned. */
  stun: number;
  /** Sideways offset so a crowd does not walk in single file. */
  lane: number;
  /** Boss timers: slam and summons. */
  special: number;
  /** Seconds since last hit, for the flash. */
  hitAgo: number;
  /** Walking animation clock. */
  stride: number;
  /** Whether the enemy is still on the field (pooled objects are reused). */
  alive: boolean;
};

/** What a projectile is, for drawing and for what it hits. */
export type ProjectileKind = "shell" | "siegeShell" | "bossRock";

/** A slow projectile with a landing point (shells, siege rounds). */
export type Projectile = {
  kind: ProjectileKind;
  x: number;
  y: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  /** 0 at launch, 1 on landing. */
  t: number;
  /** Progress per second. */
  rate: number;
  damage: number;
  splash: number;
  /** True for enemy fire, which hurts structures. */
  hostile: boolean;
  alive: boolean;
};

/** A soldier from the barracks. */
export type Defender = {
  id: number;
  /** The barracks it belongs to. */
  home: number;
  x: number;
  y: number;
  hp: number;
  cooldown: number;
  target: number;
  angle: number;
  stride: number;
  hitAgo: number;
};

/** Resources lying on the ground. */
export type Drop = {
  id: number;
  x: number;
  y: number;
  loot: Cost;
  /** Seconds it has lain there. */
  age: number;
  /** A supply crate from an event rather than enemy loot. */
  crate: boolean;
};

/** One enemy still to come in the running wave. */
export type Spawn = {
  readonly kind: EnemyKind;
  /** Seconds after the wave began. */
  readonly at: number;
  /** Which spawn point. */
  readonly gate: number;
};

/** The state of the waves. */
export type WaveState = {
  /** The last wave sent, 0 before the first. */
  number: number;
  /** Seconds until the next wave, while no wave runs. */
  countdown: number;
  /** True while a wave is under way. */
  active: boolean;
  /** Seconds since the running wave began. */
  elapsed: number;
  /** Enemies still to appear. */
  queue: Spawn[];
  /** Spawn points used by the next or running wave, as tile positions. */
  gates: { col: number; row: number }[];
};

/** A timed random effect. */
export type ActiveEffect = {
  readonly kind: "coldSnap" | "aurora" | "blackout";
  left: number;
};

/** A trader's offer, waiting for an answer. */
export type TradeOffer = {
  readonly give: ResourceId;
  readonly giveAmount: number;
  readonly get: ResourceId;
  readonly getAmount: number;
  left: number;
};

/** Weather and time of day. */
export type WeatherState = {
  /** Seconds into the day-night cycle. */
  clock: number;
  /** Blizzard strength now, 0 to 1. */
  storm: number;
  /** Where the blizzard is heading, 0 or 1. */
  stormGoal: number;
  /** Seconds the blizzard goal holds. */
  stormLeft: number;
};

/** The research currently running and what is done. */
export type ResearchState = {
  done: string[];
  current: string | null;
  /** Research points collected for the current project. */
  progress: number;
};

/** Counters for the statistics. */
export type RunStats = {
  kills: number;
  bosses: number;
  built: number;
  lost: number;
  collected: number;
};

/** A line in the message log. */
export type Message = {
  readonly text: string;
  readonly tone: "info" | "good" | "bad";
  readonly at: number;
};

/** Something the screen should show or play this frame. */
export type GameEvent =
  | {
      readonly type:
        "mg" | "sniper" | "rifle" | "defenderShot" | "heavyShot" | "zap";
      readonly x: number;
      readonly y: number;
      readonly tx: number;
      readonly ty: number;
    }
  | { readonly type: "chain"; readonly points: readonly number[] }
  | {
      readonly type:
        | "explosion"
        | "bigExplosion"
        | "mine"
        | "flame"
        | "hitEnemy"
        | "hitStructure"
        | "death"
        | "destroyed"
        | "slam"
        | "repairSpark"
        | "spawn"
        | "loot";
      readonly x: number;
      readonly y: number;
      readonly size?: number;
      readonly angle?: number;
    }
  | {
      readonly type: "damage";
      readonly x: number;
      readonly y: number;
      readonly amount: number;
    }
  | {
      readonly type:
        | "cannon"
        | "siegeFire"
        | "built"
        | "placed"
        | "upgraded"
        | "waveStart"
        | "waveClear"
        | "bossArrives"
        | "researchDone"
        | "eventNews"
        | "hqHit"
        | "collect"
        | "denied"
        | "gameOver";
      readonly x?: number;
      readonly y?: number;
    };

/** The whole running game. */
export type Game = {
  readonly seed: number;
  /** State of the game's own random numbers. */
  rng: number;
  /** Seconds played (game time). */
  time: number;
  res: Resources;
  structures: Structure[];
  enemies: Enemy[];
  projectiles: Projectile[];
  defenders: Defender[];
  drops: Drop[];
  nextId: number;
  wave: WaveState;
  research: ResearchState;
  weather: WeatherState;
  effects: ActiveEffect[];
  offer: TradeOffer | null;
  /** Seconds until the next random event. */
  eventIn: number;
  /** Seconds left on the expedition, or 0 when none is out. */
  expedition: number;
  stats: RunStats;
  /** True once the headquarters fell. */
  over: boolean;
  /** True while the cheat is on: everything unlocked, the stores always full. */
  cheat: boolean;
  /** True once the cheat was on in this run - such a run counts for no record. */
  cheated: boolean;
  /** Factor on the reach of the towers, from the settings - not saved. */
  rangeBoost: number;
  /** Free building, from the settings - no wave comes by itself; not saved. */
  freeBuild: boolean;
  messages: Message[];
  /** Filled during a step, emptied by whoever draws. */
  events: GameEvent[];
};

/** What goes into storage - the game without the passing things. */
export type SaveData = {
  readonly seed: number;
  readonly rng: number;
  readonly time: number;
  readonly res: Resources;
  readonly structures: readonly Structure[];
  readonly enemies: readonly Enemy[];
  readonly defenders: readonly Defender[];
  readonly drops: readonly Drop[];
  readonly nextId: number;
  readonly wave: WaveState;
  readonly research: ResearchState;
  readonly weather: WeatherState;
  readonly effects: readonly ActiveEffect[];
  readonly offer: TradeOffer | null;
  readonly eventIn: number;
  readonly expedition: number;
  readonly stats: RunStats;
  readonly over: boolean;
  /** Missing in saves from before the cheat. */
  readonly cheat?: boolean;
  readonly cheated?: boolean;
};
