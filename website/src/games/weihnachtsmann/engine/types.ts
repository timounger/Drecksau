/**
 * The shapes the Weihnachtsmann game is made of: who is on the map, what the
 * map consists of, the input and the running state.
 *
 * @module
 */

/** The eight characters, in the order of the selection bar. */
export const CHARACTER_IDS = [
  "santa",
  "balbo",
  "jordi",
  "trixi",
  "gilfi",
  "grantelbart",
  "gugor",
  "rudolf",
] as const;

/** One of the eight characters. */
export type CharacterId = (typeof CHARACTER_IDS)[number];

/** The animals Jordi can turn into, in the order of the choice. */
export const ANIMAL_IDS = [
  "hase",
  "vogel",
  "pinguin",
  "fuchs",
  "maus",
  "baer",
] as const;

/** One of Jordi's animals. */
export type AnimalId = (typeof ANIMAL_IDS)[number];

/** The places of the game: the snowy map outside and the two houses one can enter. */
export const AREA_IDS = ["outdoors", "workshop", "grantelHouse"] as const;

/** One of the places. */
export type AreaId = (typeof AREA_IDS)[number];

/** Which way somebody looks. */
export type Dir = "down" | "up" | "left" | "right";

/** What a map cell is made of, as far as walking is concerned. */
export type Terrain =
  | "snow"
  | "path"
  | "ice"
  | "water"
  | "tree"
  | "fence"
  | "rock"
  | "drift"
  | "thing"
  | "building"
  | "floor"
  | "wall";

/** What a character does when nobody controls it. */
export type Brain = {
  /** Standing about, or strolling towards a target. */
  mode: "rest" | "walk";
  /** Seconds left in this mode. */
  timer: number;
  /** Where the stroll goes, map px. */
  targetX: number;
  targetY: number;
  /** Seconds spent without getting anywhere. */
  stuck: number;
};

/** A speech bubble over somebody's head. */
export type Bubble = {
  readonly text: string;
  /** Seconds left on screen. */
  left: number;
};

/** One character on the map. */
export type Character = {
  readonly id: CharacterId;
  /** Which place it is in. */
  area: AreaId;
  /** Where the feet are, map px. */
  x: number;
  y: number;
  /** Speed, map px per second. */
  vx: number;
  vy: number;
  dir: Dir;
  /** Moved this step. */
  moving: boolean;
  /** Walk cycle position, in frames. */
  stride: number;
  /** Whether Trixi or Rudolf is up in the air. */
  flying: boolean;
  /** How high up the sprite is drawn, map px; eases towards the target. */
  altitude: number;
  /** Jordi's current animal, or null for Jordi himself. */
  form: AnimalId | null;
  /** On ice right now - the penguin slides. */
  onIce: boolean;
  readonly brain: Brain;
  bubble: Bubble | null;
  /** Seconds until the next sparkle leaves a flying Trixi. */
  sparkleIn: number;
};

/** What a particle looks like. */
export type ParticleKind =
  "sparkle" | "poof" | "smoke" | "snowPuff" | "note" | "steam";

/** A short-lived bit of decoration. */
export type Particle = {
  readonly kind: ParticleKind;
  /** The place it floats in. */
  readonly area: AreaId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  readonly life: number;
  /** Which colour of sparkle, 0 to 3, or which note. */
  readonly tint: number;
};

/** A placed map object bigger than a cell, such as a house. */
export type PlacedObject = {
  readonly kind: BigObjectKind;
  /** Top left cell of its footprint. */
  readonly tx: number;
  readonly ty: number;
};

/** The big objects the places can hold, outside and in. */
export type BigObjectKind =
  | "dome"
  | "paintedTree"
  | "sleigh"
  | "grantelMain"
  | "grantelWing"
  | "toyMachine"
  | "workbench"
  | "toyShelf"
  | "toyShelfLadder"
  | "armchair"
  | "fireplace"
  | "wishBoard"
  | "ampStack"
  | "drumKit"
  | "guitarStand"
  | "organ"
  | "candelabra"
  | "creepyChair";

/** The small things that fill one cell each. */
export type SmallObjectKind =
  | "tree"
  | "smallTree"
  | "rock"
  | "drift"
  | "snowman"
  | "lamp"
  | "gifts"
  | "deadBush"
  | "crookedSign";

/** How an Advent gate looks; every style has the number plate in one place. */
export type GateStyle = "arch" | "hut" | "snowWall" | "giftBox";

/**
 * One of the 26 Advent gates on the map. Its footprint is three cells wide and
 * one deep; the doorway is the cell below the middle one - stand in it and
 * push up to play the gate's minigame.
 */
export type Gate = {
  /** The number on its plate, 1 to 26. */
  readonly number: number;
  readonly style: GateStyle;
  /** Top left cell of its footprint. */
  readonly tx: number;
  readonly ty: number;
};

/** A box of cells, by its top left cell and its size. */
export type CellBox = {
  readonly tx: number;
  readonly ty: number;
  readonly w: number;
  readonly h: number;
};

/** A doorway: stand in its cells and push its way to go through. */
export type Door = CellBox & {
  /** The way one has to push. */
  readonly dir: Dir;
  /** Where it leads. */
  readonly to: AreaId;
  /** Where the feet arrive, in cells of the other place (fractions allowed). */
  readonly toX: number;
  readonly toY: number;
  /** Which way one looks on arrival. */
  readonly toDir: Dir;
};

/** What the talk key does in front of something. */
export type SpotKind =
  | "machine"
  | "sleigh"
  | "wishes"
  | "armchair"
  | "guitar"
  | "amp"
  | "drums"
  | "organ"
  | "portrait";

/** Something to use with the talk key. */
export type Spot = CellBox & { readonly kind: SpotKind };

/** Everything a place is made of, as written in the data files. */
export type AreaData = {
  /** One string per row of cells; see the legend in `map-data.ts`. */
  readonly rows: readonly string[];
  readonly objects: readonly PlacedObject[];
  readonly doors: readonly Door[];
  readonly spots: readonly Spot[];
  /** The Advent gates; none indoors. */
  readonly gates: readonly Gate[];
  /** Tint laid over the whole picture for a dim room, or null. */
  readonly shade: string | null;
};

/** The map, ready to walk on. */
export type GameMap = {
  /** Which place this is. */
  readonly area: AreaId;
  /** Size in cells. */
  readonly cols: number;
  readonly rows: number;
  /** Terrain per cell, row by row. */
  readonly terrain: readonly Terrain[];
  /** Ground under each cell: what is painted there. */
  readonly ground: readonly Ground[];
  /** A small object standing in a cell, or null. */
  readonly small: readonly (SmallObjectKind | null)[];
  /** Fence pieces: which neighbours each joins (1 up, 2 right, 4 down, 8 left), or -1. */
  readonly fence: readonly number[];
  readonly objects: readonly PlacedObject[];
  readonly doors: readonly Door[];
  readonly spots: readonly Spot[];
  readonly gates: readonly Gate[];
  readonly shade: string | null;
};

/** What is painted on the ground of a cell; floors come with the room picture. */
export type Ground = "snow" | "path" | "ice" | "water" | "floor";

/** A fade to black and back, while going through a door or to another place. */
export type Fade = {
  /** Seconds since it began. */
  elapsed: number;
  /** The door somebody goes through, or null when only the view changes. */
  readonly door: Door | null;
  /** Index of who goes through. */
  readonly who: number;
  /** The Advent gate whose minigame opens at the darkest moment, or null. */
  readonly gate: number | null;
  /** Whether the change at the darkest moment has happened. */
  switched: boolean;
};

/** Santa's sleigh on its round over the map. */
export type SleighRide = {
  /** Seconds since take-off. */
  elapsed: number;
  /** Who sits in it or pulls it; they are off the map meanwhile. */
  readonly riders: readonly CharacterId[];
  /** Where it is, map px: the point under it, and how high up. */
  x: number;
  y: number;
  altitude: number;
  /** Which way it flies. */
  dir: "left" | "right";
  /** Seconds until the next sparkle. */
  sparkleIn: number;
};

/** The toys the machine can make. */
export const TOY_KINDS = ["teddy", "train", "doll", "ball", "present"] as const;

/** One of the toys. */
export type ToyKind = (typeof TOY_KINDS)[number];

/** A toy the machine just made, on its way from the funnel into the sack. */
export type FlyingToy = {
  readonly kind: ToyKind;
  /** Seconds since it popped out. */
  age: number;
};

/** A day of the year, for the Advent calendar's locks. */
export type CalendarDay = {
  /** 1 (January) to 12 (December). */
  readonly month: number;
  /** Day of the month, 1 to 31. */
  readonly day: number;
};

/** The sounds the game can ask for. */
export type SoundId =
  | "door"
  | "gate"
  | "toy"
  | "riff"
  | "drums"
  | "organ"
  | "sleighStart"
  | "sleighLand";

/** The open animal choice. */
export type AnimalMenu = {
  /** The highlighted animal, index into {@link ANIMAL_IDS}. */
  cursor: number;
};

/** A one-off command, from a key, a button or a click. */
export type Action =
  | { readonly kind: "select"; readonly index: number }
  | { readonly kind: "cycle"; readonly delta: number }
  | { readonly kind: "ability" }
  | { readonly kind: "talk" }
  | { readonly kind: "menuMove"; readonly delta: number }
  | { readonly kind: "menuPick"; readonly index: number | null }
  | { readonly kind: "menuClose" }
  | { readonly kind: "clickMap"; readonly x: number; readonly y: number };

/** The held controls, read once per step. */
export type Input = {
  /** Stick or keys, each -1 to 1. */
  readonly moveX: number;
  readonly moveY: number;
};

/** Nothing held. */
export const NO_INPUT: Input = { moveX: 0, moveY: 0 };

/** The whole running game. */
export type GameState = {
  /** Every place, ready to walk on. */
  readonly maps: Readonly<Record<AreaId, GameMap>>;
  /** The place on screen: where the character steered is, once a fade is done. */
  viewArea: AreaId;
  readonly chars: Character[];
  /** Index of the character the player steers. */
  active: number;
  /** Top left of the view, map px. */
  readonly camera: { x: number; y: number };
  /** Size of the visible part of the map, map px - set by the screen. */
  readonly view: { w: number; h: number };
  /** Seconds the camera still glides after a switch. */
  glide: number;
  /** The animal choice while it is open. */
  menu: AnimalMenu | null;
  readonly particles: Particle[];
  /** Seconds since the game began. */
  time: number;
  /** State of the random numbers. */
  seed: number;
  /** Commands waiting for the next step. */
  readonly actions: Action[];
  /** Seconds until the chimneys puff again. */
  smokeIn: number;
  /** The fade while going through a door, or null. */
  fade: Fade | null;
  /** The sleigh while it flies, or null when it stands on the painted fir. */
  sleigh: SleighRide | null;
  /** Toys on their way into the sack. */
  readonly toys: FlyingToy[];
  /** Sounds to play, taken by the screen each frame. */
  readonly sounds: SoundId[];
  /** Numbers of the Advent gates whose minigame has been won. */
  readonly gatesDone: Set<number>;
  /**
   * The gate whose minigame should run now; set at the darkest moment of the
   * fade into a gate, taken by the screen, which pauses the map meanwhile.
   */
  gateOpen: number | null;
  /** Just back from a gate: no gate opens until the push towards it is let go. */
  gateLatch: boolean;
  /** Today, set by the screen: in December the gates open one per day. */
  today: CalendarDay;
};

/** What is kept between visits. */
export type SaveData = {
  readonly active: CharacterId;
  readonly chars: readonly SavedCharacter[];
  /** Numbers of the Advent gates won; missing in saves from before the gates. */
  readonly gates?: readonly number[];
};

/** One character as saved. */
export type SavedCharacter = {
  readonly id: CharacterId;
  /** The place; missing in saves from before there were houses to enter. */
  readonly area?: AreaId;
  readonly x: number;
  readonly y: number;
  readonly dir: Dir;
  readonly form: AnimalId | null;
  readonly flying: boolean;
};
