/**
 * The shape of a running adventure: Link, the monsters, everything flying
 * about, the temple's puzzles, and the input that drives one step.
 *
 * @module
 * @remarks
 * The state is one plain object that the engine changes in place, sixty times
 * a second. Copying it on every step would buy nothing here: nobody keeps an
 * old state around, and a game loop that allocates a new world per frame only
 * gives the garbage collector something to stutter about.
 */

/** The four ways Link and the monsters can face. */
export type Dir = "up" | "down" | "left" | "right";

/** The places the adventure happens in, each with its own map. */
export type AreaId = "overworld" | "dungeon" | "houses" | "mini";

/** The tools in the inventory grid, in no particular order. */
export type ItemId =
  | "sword"
  | "shield"
  | "bow"
  | "bombs"
  | "boomerang"
  | "lantern"
  | "boots"
  | "fireRod"
  | "hookshot"
  | "shovel"
  | "feather"
  | "gloves";

/** One of the four bottle slots, by number. */
export type BottleId = "bottle0" | "bottle1" | "bottle2" | "bottle3";

/** What can sit on the A or the B button: a tool or a bottle. */
export type EquipId = ItemId | BottleId;

/** What a bottle holds. */
export type Bottle = "empty" | "potion";

/** A mouse click on the picture, in screen pixels, and which button. */
export type PointerClick = {
  readonly x: number;
  readonly y: number;
  /** Left button "a", right button "b". */
  readonly button: "a" | "b";
};

/** A point on the 240 x 160 picture. */
export type ScreenPoint = { readonly x: number; readonly y: number };

/** One frame of controls, already merged from keyboard, touch and gamepad. */
export type Input = {
  /** Horizontal stick, -1 (left) to 1 (right). */
  readonly moveX: number;
  /** Vertical stick, -1 (up) to 1 (down). */
  readonly moveY: number;
  /** A - the item on A - is held. */
  readonly a: boolean;
  /** B - the item on B - is held. */
  readonly b: boolean;
  /** R - roll or read - is held. */
  readonly r: boolean;
  /** Start - the inventory - is held. */
  readonly start: boolean;
  /** A mouse click on the picture during this step, or null. */
  readonly click: PointerClick | null;
  /** Where the mouse points on the picture, or null when it is elsewhere. */
  readonly hover: ScreenPoint | null;
};

/** No buttons, no stick. */
export const NO_INPUT: Input = {
  moveX: 0,
  moveY: 0,
  a: false,
  b: false,
  r: false,
  start: false,
  click: null,
  hover: null,
};

/** What Link is busy with. */
export type Action =
  | { readonly kind: "idle" }
  | { readonly kind: "slash"; t: number; readonly hit: Set<number> }
  | { readonly kind: "spin"; t: number; readonly hit: Set<number> }
  | {
      readonly kind: "roll";
      t: number;
      readonly dx: number;
      readonly dy: number;
    }
  | { readonly kind: "use"; t: number; readonly item: EquipId | null }
  | { readonly kind: "hold"; t: number }
  | {
      readonly kind: "dash";
      t: number;
      readonly hit: Set<number>;
      /** The button the boots sit on - letting go of it stops the run. */
      readonly button: "a" | "b";
    }
  | {
      readonly kind: "hop";
      t: number;
      readonly vx: number;
      readonly vy: number;
      /** Where the hop started - a bad landing puts Link back here. */
      readonly fromX: number;
      readonly fromY: number;
    }
  | { readonly kind: "hook"; t: number }
  | {
      /** Hopping down a low ledge: no control until he lands. */
      readonly kind: "leap";
      t: number;
      readonly fromX: number;
      readonly fromY: number;
      readonly toX: number;
      readonly toY: number;
    };

/** The hero. Position is the middle of his feet. */
export type Player = {
  x: number;
  y: number;
  /** Walking velocity, px/s - eased towards the stick for a soft start. */
  vx: number;
  vy: number;
  facing: Dir;
  /** Health in half hearts. */
  hp: number;
  /** Heart containers - each worth two half hearts. */
  maxHearts: number;
  action: Action;
  /** Seconds the sword has been held out after a swing, for the spin. */
  charge: number;
  /** Seconds of invulnerability left after a hit. */
  invuln: number;
  knockX: number;
  knockY: number;
  /** Seconds of knockback left. */
  knockT: number;
  /** Seconds of walking, for the step animation. */
  walk: number;
  moving: boolean;
  /** The shield is raised (its button held). */
  shieldUp: boolean;
  /** Seconds until the next roll is allowed. */
  rollCooldown: number;
  /** Shrunk on the stump to the size of a beetle. */
  small: boolean;
  /** Seconds left of the shrink or grow animation. */
  shrinkT: number;
  /** Holding a heavy rock over his head. */
  carrying: boolean;
  /** Seconds spent leaning against a push block. */
  pushT: number;
  /** In the water: head and arms above the surface, no tools. */
  swimming: boolean;
  /** Seconds left under water during a dive, 0 at the surface. */
  diveT: number;
  /** Seconds until the next dive or stroke is allowed. */
  diveCooldown: number;
  /** Seconds left of a stroke's burst of speed. */
  strokeT: number;
  /** Seconds spent walking against the edge of a low ledge. */
  ledgeT: number;
};

/** What Link carries. */
export type Inventory = {
  rupees: number;
  arrows: number;
  bombs: number;
  /** The tool or bottle on the A button. */
  aItem: EquipId;
  /** The tool or bottle on the B button - never the same as aItem. */
  bItem: EquipId;
  /** The tools Link has found (or started with). */
  readonly owned: Set<ItemId>;
  /** The bottles found or bought, up to four, and what is in each. */
  bottles: Bottle[];
  /** Small keys for the temple's locked doors. */
  keys: number;
  /** Pieces of heart found towards the next container (0 to 3). */
  heartPieces: number;
};

/** The kinds of monster - the last two are the temple's guardians. */
export type EnemyKind =
  | "octorok"
  | "chuchu"
  | "keese"
  | "moblin"
  | "tektite"
  | "darknut"
  | "beetle"
  | "golem";

/** One monster. Position is the middle of its feet; z is height above ground. */
export type Enemy = {
  readonly id: number;
  /** Which spawn point it belongs to. */
  readonly spawn: number;
  readonly kind: EnemyKind;
  x: number;
  y: number;
  z: number;
  vz: number;
  vx: number;
  vy: number;
  hp: number;
  facing: Dir;
  /** What it is doing - the meaning depends on the kind. */
  mode: string;
  /** Seconds left in the current mode. */
  t: number;
  /** Seconds left of the hit flash. */
  hurt: number;
  /** Seconds left of being stunned by the boomerang. */
  stun: number;
  knockX: number;
  knockY: number;
  knockT: number;
  /** Seconds alive, for animation. */
  anim: number;
};

/** Where a monster lives and whether it is currently out. */
export type Spawn = {
  readonly kind: EnemyKind;
  readonly area: AreaId;
  /** The temple room it belongs to, or -1 out in the open. */
  readonly room: number;
  readonly x: number;
  readonly y: number;
  /** Game time it was defeated at, or null while it lives. */
  deadAt: number | null;
  alive: boolean;
};

/** Something flying in a straight line. */
export type Shot = {
  readonly kind: "rock" | "arrow" | "fireball" | "boulder" | "flame";
  x: number;
  y: number;
  readonly vx: number;
  readonly vy: number;
  readonly facing: Dir;
  /** Seconds left before it falls to the ground. */
  life: number;
  readonly fromPlayer: boolean;
  /** An arrow that flew through a brazier and burns now. */
  fire: boolean;
};

/** A lit bomb on the ground. */
export type Bomb = { x: number; y: number; fuse: number };

/** The boomerang while it is out. */
export type Boomerang = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Seconds since it was thrown. */
  t: number;
  returning: boolean;
  /** Pickups it has caught and is bringing back. */
  readonly carried: Pickup[];
  readonly hit: Set<number>;
};

/** The hookshot's chain while it is out. */
export type Hook = {
  /** Where the tip is. */
  x: number;
  y: number;
  readonly facing: Dir;
  /** How far the tip has flown, px. */
  dist: number;
  /** Flying out, reeling back in, or pulling Link to what it caught. */
  phase: "out" | "back" | "pull";
  /** Where Link is pulled to, once it has caught a post or a chest. */
  toX: number;
  toY: number;
  /** Where the pull started - a bad stop puts Link back here. */
  fromX: number;
  fromY: number;
  /** Pickups it caught and is bringing back. */
  readonly carried: Pickup[];
};

/** What can lie on the ground. */
export type PickupKind =
  | "rupee1"
  | "rupee5"
  | "rupee20"
  | "heart"
  | "arrows"
  | "bombs"
  | "container"
  | "piece";

/** Something to pick up. */
export type Pickup = {
  readonly id: number;
  readonly kind: PickupKind;
  x: number;
  y: number;
  z: number;
  vz: number;
  /** Seconds before it vanishes, or null if it stays. */
  life: number | null;
  /** For lasting finds: the flag that marks it as taken. */
  readonly spot: string | null;
};

/** Purely visual: puffs, sparks, leaves, explosions, dust. */
export type Effect = {
  readonly kind:
    | "poof"
    | "spark"
    | "leaf"
    | "grass"
    | "explosion"
    | "dust"
    | "ring"
    | "twinkle"
    | "flame"
    | "dirt"
    | "glow"
    | "splash"
    | "bubble";
  x: number;
  y: number;
  readonly vx: number;
  readonly vy: number;
  t: number;
  readonly life: number;
};

/** A stone block that can be shoved one tile at a time. */
export type Block = {
  /** Top-left corner in area pixels. */
  x: number;
  y: number;
  /** Where it is sliding to, or null while it rests. */
  target: { readonly x: number; readonly y: number } | null;
  /** The room it belongs to. */
  readonly room: number;
};

/** A rock dropping from the ceiling after the golem's leap. */
export type FallingRock = { x: number; y: number; z: number; vz: number };

/** Things that happened during a step - for sounds and statistics. */
export type GameEvent =
  | "swing"
  | "spin"
  | "charged"
  | "hit"
  | "kill"
  | "hurt"
  | "rupee"
  | "heart"
  | "item"
  | "bombPlace"
  | "explode"
  | "arrow"
  | "boomerang"
  | "cut"
  | "block"
  | "container"
  | "menu"
  | "text"
  | "type"
  | "die"
  | "roll"
  | "secret"
  | "victory"
  | "fanfare"
  | "smallItem"
  | "key"
  | "door"
  | "shutter"
  | "switch"
  | "torch"
  | "push"
  | "shrink"
  | "grow"
  | "bossHit"
  | "bossDie"
  | "slam"
  | "buy"
  | "error"
  | "lift"
  | "throw"
  | "stairs"
  | "chest"
  | "dash"
  | "hop"
  | "land"
  | "splash"
  | "stroke"
  | "hookshot"
  | "dig"
  | "fire"
  | "drink"
  | "save";

/** What a step reports beyond the state itself. */
export type StepReport = {
  readonly events: GameEvent[];
  /** Rupees collected this step, by value. */
  rupees: number;
  /** Monsters defeated this step. */
  kills: EnemyKind[];
  /** Bushes and grass cut this step. */
  cuts: number;
};

/** Where the game is: playing, or waiting at the game-over screen. */
export type Phase = "playing" | "gameover";

/** The open pause screen: the item grid or the map. */
export type Menu = {
  /** The chosen slot: the twelve tools, the four bottles, then "save". */
  cursor: number;
  page: "items" | "map";
  /** Seconds the "saved" note still shows. */
  saved: number;
};

/** The open text box, typed out letter by letter. */
export type Dialog = {
  readonly pages: readonly string[];
  page: number;
  /** Letters of the page shown so far. */
  shown: number;
  /** Seconds since the box opened, for its unfolding. */
  t: number;
};

/** What Link can hold up over his head after finding it. */
export type Treasure =
  | "key"
  | "bigKey"
  | "map"
  | "compass"
  | "gloves"
  | "piece"
  | "container"
  | "rupees"
  | "sunstone"
  | "lantern"
  | "boots"
  | "fireRod"
  | "hookshot"
  | "shovel"
  | "feather"
  | "bottle";

/** Link showing off a find, before the text box explains it. */
export type Hold = {
  readonly item: Treasure;
  readonly text: string;
  t: number;
  /** The text box has been opened. */
  told: boolean;
};

/** Where a door, a hole or a stair leads. */
export type Destination = {
  readonly area: AreaId;
  readonly x: number;
  readonly y: number;
  readonly facing: Dir;
};

/** A change of place: a fade through black, or a scroll to the next room. */
export type Transition =
  | {
      readonly kind: "fade";
      t: number;
      readonly to: Destination;
      swapped: boolean;
    }
  | {
      readonly kind: "scroll";
      t: number;
      readonly room: number;
      readonly fromCam: { readonly x: number; readonly y: number };
      readonly toCam: { readonly x: number; readonly y: number };
      readonly fromPlayer: { readonly x: number; readonly y: number };
      readonly toPlayer: { readonly x: number; readonly y: number };
    };

/** The whole running adventure. */
export type GameState = {
  phase: Phase;
  /**
   * The cheat button: nothing hurts, everything is full and Link runs faster.
   * Not saved - the page switches it.
   */
  cheat: boolean;
  /** Seconds played in this world, the clock respawns are measured on. */
  time: number;
  /** The place Link is in. */
  area: AreaId;
  /** The temple room or house Link is in, or -1 out in the open. */
  room: number;
  player: Player;
  inv: Inventory;
  enemies: Enemy[];
  readonly spawns: Spawn[];
  shots: Shot[];
  bombs: Bomb[];
  boomerang: Boomerang | null;
  /** The hookshot's chain, while it is out. */
  hook: Hook | null;
  pickups: Pickup[];
  effects: Effect[];
  blocks: Block[];
  rocks: FallingRock[];
  /** Cut bushes, grass and lifted rocks: tile index to the time it happened. */
  readonly cut: Map<number, number>;
  /** Holes dug with the shovel: tile index to the time they were dug. */
  readonly dug: Map<number, number>;
  /** Cracked rocks and walls blown open, as "area:tile" - for good. */
  readonly opened: Set<string>;
  /** Heart container hiding places already emptied. */
  readonly takenContainers: Set<number>;
  /**
   * Everything else that stays done: opened chests and doors, lit torches,
   * pressed switches, beaten guardians, items owned, the story so far.
   */
  readonly flags: Set<string>;
  /** Temple rooms Link has set foot in, for the map. */
  readonly visited: Set<number>;
  /** The open text box, if any. */
  dialog: Dialog | null;
  /** A find held up over Link's head. */
  hold: Hold | null;
  menu: Menu | null;
  /** A fade or a room scroll in progress. */
  transition: Transition | null;
  /** Seconds the world freezes after a hard hit, to make it land. */
  hitStop: number;
  /** Seconds the screen still shakes. */
  shake: number;
  /** Camera top-left in area pixels (smoothed). */
  camX: number;
  camY: number;
  /** The previous step's buttons, to tell a press from a hold. */
  prev: Input;
  nextId: number;
  /** The black knight in the ruins has been beaten at least once. */
  darknutBeaten: boolean;
  /** A banner shown briefly over the play field, and its time left. */
  banner: { readonly text: string; t: number } | null;
};
