/**
 * The shapes the Weihnachtsmann game is made of: who is on the map, what the
 * map consists of, the input and the running state.
 *
 * @module
 */
import type { ExtrasKeep, ExtrasState, SavedExtras } from "./extras-types";

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

/**
 * The places of the game: the snowy map outside, the two houses one could
 * always enter, and the five buildings of the village - the reindeer stable,
 * the post office, the elves' bakery, Gugor's observatory and the gift store -
 * the ice cave behind the frozen waterfall - and the summit the cable car
 * climbs to.
 */
export const AREA_IDS = [
  "outdoors",
  "workshop",
  "grantelHouse",
  "stable",
  "postOffice",
  "bakery",
  "observatory",
  "giftStore",
  "iceCave",
  "summit",
] as const;

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
  | "wall"
  | "gap";

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

/** The abilities that play out over a few seconds once started. */
export const SHOW_KINDS = [
  "wishes",
  "guitar",
  "telescope",
  "levitate",
  "fall",
  "nap",
] as const;

/** One of the abilities that play out over a few seconds. */
export type ShowKind = (typeof SHOW_KINDS)[number];

/** An ability playing out on somebody right now. */
export type Show = {
  readonly kind: ShowKind;
  /** Seconds since it began. */
  elapsed: number;
  /** Seconds until its next sparkle, note or bump. */
  tickIn: number;
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
  /** The ability playing out on it, or null. */
  show: Show | null;
  /** Seconds until the ability can be used again. */
  cooldown: number;
  /** Seconds left of a startled little jump. */
  hop: number;
  /** What it carries about, or null. */
  carry: Carried | null;
};

/** The things one can pick up and carry somewhere. */
export type CarryKind =
  | "carrot"
  | "letter"
  | "dough"
  | "trayRaw"
  | "trayBaked"
  | "trayBurnt"
  | "present"
  | "fir"
  | "found"
  | "treat"
  | "snowBlock"
  | "toy"
  | "wrapped"
  | "parcel"
  | "snowPart";

/**
 * Something carried: what it is, and for a letter, where it comes from; for a
 * lost thing or a treat from the market, which one.
 */
export type Carried = {
  readonly kind: CarryKind;
  /** A letter's continent, a lost thing or a market stall; 0 otherwise. */
  readonly tint: number;
};

/** What a particle looks like. */
export type ParticleKind =
  | "sparkle"
  | "poof"
  | "smoke"
  | "snowPuff"
  | "note"
  | "steam"
  | "soot"
  | "cookie"
  | "flour"
  | "zzz"
  | "spray"
  | "heart";

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

/**
 * Something Gilfi makes float: a small object of the map lifted from its cell,
 * or a conjured toy.
 */
export type Floater = {
  /** The place it floats in. */
  readonly area: AreaId;
  /** Where it rests, map px: the middle of its foot line. */
  readonly x: number;
  readonly y: number;
  /** The map cell whose small object is lifted, or -1 for a conjured toy. */
  readonly cell: number;
  /** The toy (or baking tray) conjured, or null for a lifted map object. */
  readonly toy: FloatKind | null;
  /** Where in its bobbing it starts, radians. */
  readonly phase: number;
  /** Seconds since it began to rise; below zero it still waits its turn. */
  age: number;
  /** Seconds from rising to resting again. */
  readonly life: number;
};

/** Gugor looking through his telescope at the Weihnachtsmann. */
export type Spyglass = {
  /** Seconds since he raised it. */
  elapsed: number;
  /** Index of Gugor. */
  readonly watcher: number;
  /** Whether the Weihnachtsmann is in another place: the view crosses over. */
  readonly far: boolean;
  /** Whether the view is on the Weihnachtsmann right now. */
  watching: boolean;
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
  | "creepyChair"
  | "cinema"
  | "stableHouse"
  | "postHouse"
  | "bakeryHouse"
  | "observatory"
  | "storeHouse"
  | "stableGate"
  | "carrotTrough"
  | "strawBed"
  | "hayBales"
  | "sortShelf"
  | "letterPile"
  | "postDesk"
  | "mailSacks"
  | "oven"
  | "doughTable"
  | "trayTable"
  | "coolRack"
  | "flourSacks"
  | "bigTelescope"
  | "starDesk"
  | "globe"
  | "bookshelf"
  | "stallPunch"
  | "stallGinger"
  | "stallChestnut"
  | "carousel"
  | "waterfall"
  | "sledStack"
  | "startBanner"
  | "finishBanner"
  | "target"
  | "mailbox"
  | "treeStand"
  | "crystalBig"
  | "crystalSmall"
  | "crystalViolet"
  | "hockeyGoalLeft"
  | "hockeyGoalRight"
  | "hockeyBench"
  | "blockHeap"
  | "castleSite"
  | "balloonPad"
  | "valleyStation"
  | "mountain"
  | "summitStation"
  | "panoramaScope"
  | "skiRack"
  | "lighthouse"
  | "stationHouse"
  | "stage"
  | "magicBasket"
  | "schoolSign"
  | "postBoard"
  | "angelSign"
  | "contestSign"
  | "photoPost"
  | "ballPile"
  | "carrotBox"
  | "hatStand"
  | "scarfRack"
  | "snowmanPlot"
  | "jury"
  | "packTable"
  | "giftTree";

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
  | "crookedSign"
  | "parcels"
  | "parcelGap"
  | "flag"
  | "lightPole";

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
  | "portrait"
  | "lamp"
  | "snowman"
  | "dig"
  | "cinema"
  | "reindeer"
  | "carrots"
  | "straw"
  | "letters"
  | "slot"
  | "dough"
  | "trays"
  | "oven"
  | "rack"
  | "telescope"
  | "lostGift"
  | "stall"
  | "carousel"
  | "toboggan"
  | "snowball"
  | "curtain"
  | "foxHole"
  | "fellFir"
  | "treeStand"
  | "mailbox"
  | "critter"
  | "jetski"
  | "hockey"
  | "blocks"
  | "castle"
  | "balloon"
  | "cableCar"
  | "summitStation"
  | "panorama"
  | "skis"
  | "lighthouse"
  | "platform"
  | "school"
  | "airMail"
  | "photo"
  | "kid"
  | "partBalls"
  | "partCarrots"
  | "partHats"
  | "partScarves"
  | "snowmanPlot"
  | "jury"
  | "packTable"
  | "giftTree"
  | "angels";

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
  /** Whether the cinema opens at the darkest moment. */
  readonly cinema: boolean;
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

/** What Gilfi can make float out of thin air: a toy, or in the bakery a tray. */
export type FloatKind = ToyKind | "tray";

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
  | "sleighLand"
  | "wish"
  | "magic"
  | "spyglass"
  | "thud"
  | "achievement"
  | "crash"
  | "repair"
  | "lamp"
  | "splash"
  | "collect"
  | "munch"
  | "paper"
  | "ding"
  | "snore"
  | "carousel"
  | "throw"
  | "hit"
  | "chop"
  | "bell"
  | "iceBreak"
  | "owl"
  | "whoosh"
  | "jetskiStart"
  | "horn"
  | "whistle"
  | "chuff"
  | "puck"
  | "goalHorn"
  | "burner"
  | "gondola"
  | "blockSet"
  | "crossing"
  | "shutter"
  | "rocket"
  | "bang"
  | "cheer"
  | "wrap"
  | "shootingStar";

/** The achievements one can unlock, in the order of the achievements panel. */
export const ACHIEVEMENT_IDS = [
  "fish",
  "roofGift",
  "rudolfLap",
  "wishesAll",
  "machineBroken",
  "machineFixed",
  "grantelConcert",
  "spyWorkshop",
  "spySleigh",
  "levitateSnowman",
  "balboIce",
  "balboTen",
  "balboSnowman",
  "mouseFence",
  "bearDrift",
  "birdChimney",
  "hareRace",
  "foxDig",
  "sleighRide",
  "lampFirst",
  "lampsAll",
  "snowmanDown",
  "snowmanBuilt",
  "instruments",
  "toys10",
  "grantelVisit",
  "allInWorkshop",
  "firstGate",
  "allGates",
  "movieNight",
  "stableFed",
  "rudolfNap",
  "letters10",
  "santaLetter",
  "firstTray",
  "balboFlour",
  "gilfiTrays",
  "overview",
  "gugorEagle",
  "giftFound",
  "mouseGap",
  "marketStalls",
  "carousel",
  "iceCave",
  "aurora",
  "sledFast",
  "snowballs",
  "skater",
  "firTree",
  "bellsAll",
  "animalTalk",
  "errands5",
  "stormWalk",
  "fullThrottle",
  "hockeyWin",
  "snowCastle",
  "balloonRide",
  "roofSecret",
  "summit",
  "skiRun",
  "lighthouse",
  "trainStops",
  "trainLoop",
  "stageRock",
  "magicSchool",
  "airMail",
  "angelStar",
  "nightStars",
  "happyKids",
  "snowmanJury",
  "photoAlbum",
  "shootingStar",
  "fireworks",
  "dailyTasks",
  "bestFriends",
  "giftPile",
  "christmasEve",
] as const;

/** One of the achievements. */
export type AchievementId = (typeof ACHIEVEMENT_IDS)[number];

/** What is collected bit by bit for an achievement and kept between visits. */
export const PROGRESS_IDS = [
  "wishes",
  "instruments",
  "stalls",
  "bells",
  "critters",
  "stops",
  "nightStars",
  "photos",
] as const;

/** One kind of collected progress. */
export type ProgressId = (typeof PROGRESS_IDS)[number];

/** What is counted for an achievement and kept between visits. */
export const COUNT_IDS = [
  "falls",
  "toys",
  "letters",
  "hits",
  "errands",
  "sledBest",
  "skiBest",
  "kids",
  "wrapped",
  "postBest",
  "schoolBest",
  "snowmanBest",
  "starWishes",
  "dailyDays",
] as const;

/** One kind of counted progress. */
export type CountId = (typeof COUNT_IDS)[number];

/** The banner of an achievement just unlocked, on its way across the picture. */
export type Toast = {
  readonly id: AchievementId;
  /** Seconds on screen; it waits at 0 while an earlier banner shows. */
  age: number;
};

/** The fish in the pond's open water. */
export type FishSpot = {
  /** The water cell it swims in. */
  cell: number;
  /** Seconds until it is back after being caught; 0 while it is there. */
  away: number;
  /** Seconds until its next jump. */
  jumpIn: number;
  /** Seconds into the jump it is making, or -1 between jumps. */
  jump: number;
};

/** The toy machine: working, or broken and waiting for an elf. */
export type MachineState = {
  broken: boolean;
  /** Seconds until it mends itself while broken. */
  mendIn: number;
  /** Seconds left of an elf's repair, or 0 when nobody repairs it. */
  repair: number;
  /** Index of the elf repairing it. */
  repairer: number;
  /** Seconds until the next spark or puff of soot while broken. */
  sparkIn: number;
};

/**
 * What the characters changed in the world - lamps switched off, snowmen
 * knocked over, drifts ploughed flat, the fish caught, the present taken, the
 * machine broken. Every change mends itself after a while; none is saved.
 */
export type World = {
  /** Lamps switched off, by cell, in the order they went dark. */
  readonly lampsOff: number[];
  /** Seconds since the last lamp was switched off. */
  lampQuiet: number;
  /** Seconds until the next dark lamp lights up again, once it is quiet. */
  relightIn: number;
  /** Lamps flickering back on: cell to seconds left of the flicker. */
  readonly flicker: Map<number, number>;
  /** Snowmen knocked over: cell to seconds until they stand again. */
  readonly snowmenDown: Map<number, number>;
  /** Drifts ploughed flat: cell to seconds until they are back. */
  readonly driftsFlat: Map<number, number>;
  readonly fish: FishSpot;
  /** Seconds until a new present lies on the dome; 0 while it is there. */
  giftAway: number;
  readonly machine: MachineState;
  /** The corners of the map Rudolf has passed in this flight, 0 to 3. */
  readonly lap: Set<number>;
  /** When the hare last stood at the workshop door, game seconds, or null. */
  hareFrom: number | null;
  /** Seconds until the snow twitches again over the fox's secret. */
  sniffIn: number;
  readonly stable: StableState;
  readonly post: PostState;
  readonly bakery: BakeryState;
  readonly store: StoreState;
  /** The east land: market, cave, slope, meadow, lake, firs, bells, animals. */
  readonly east: EastState;
  /** Time of day and weather. */
  readonly sky: SkyState;
  /** The snow jetskis standing about the map, or ridden. */
  readonly jetskis: Jetski[];
  /**
   * The places of the south land and round it: the ice hockey rink, the snow
   * castle, the balloon, the cable car with the ski run, the lighthouse and
   * the railway.
   */
  readonly places: PlacesState;
  /**
   * Part B: the stage, the magic school, the air mail, the snow angels,
   * Rudolf's night stars, the visiting children, the snowman contest, the
   * photo points, shooting stars and fireworks, friendly chats, presents
   * and Christmas Eve.
   */
  readonly extras: ExtrasState;
};

/** Everything of the new places that changes and mends itself; none of it is saved. */
export type PlacesState = {
  readonly hockey: HockeyState;
  readonly castle: CastleState;
  readonly balloon: Balloon;
  readonly cable: CableState;
  readonly lighthouse: LighthouseState;
  readonly train: TrainState;
};

/** A moving point with a speed, map px and map px per second. */
export type Mover = { x: number; y: number; vx: number; vy: number };

/** The ice hockey rink: the puck, and the match while one is played. */
export type HockeyState = {
  readonly puck: Mover;
  /** Index of who has the puck at the stick, or -1. */
  owner: number;
  /** Seconds before the last shooter may take the puck again. */
  noCatch: number;
  match: HockeyMatch | null;
};

/** A match: the player against a forward and a goalie nobody steers. */
export type HockeyMatch = {
  readonly player: number;
  readonly forward: number;
  readonly goalie: number;
  /** Goals of the player and of the other side. */
  readonly score: [number, number];
  /** Seconds the play still waits after a goal or at the face-off. */
  pause: number;
  /** Seconds until the forward makes up its mind again. */
  thinkIn: number;
  /** Seconds the final whistle still shows, once somebody has won; 0 while playing. */
  over: number;
};

/** The snow castle being built, and melting again. */
export type CastleState = {
  /** Snow blocks set so far, 0 to 8. */
  blocks: number;
  /** Whether the flag flies on top: the castle is done. */
  flag: boolean;
  /** Seconds until the castle starts to melt. */
  meltIn: number;
  /** Whether it melts right now, a block at a time. */
  melting: boolean;
  /** Seconds until the next block melts away. */
  dripIn: number;
};

/** The hot-air balloon: at its field, aloft, or floating home by itself. */
export type Balloon = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** How high the basket floats over its shadow, map px. */
  altitude: number;
  /** Index of who stands in the basket, or -1. */
  rider: number;
  /**
   * At its field, up in the air, coming down to land, standing where it
   * landed, or floating home by itself.
   */
  mode: "home" | "flying" | "landing" | "parked" | "returning";
  /** Seconds it has stood away from its field without a rider. */
  idle: number;
  /** Seconds of the burner's flame still burning. */
  burner: number;
  /** Seconds this flight has been high up. */
  airTime: number;
  /** Which way the wind blows, radians. */
  wind: number;
};

/** The cable car's gondola on its way, and a run down the ski slope. */
export type CableState = {
  ride: GondolaRide | null;
  ski: SkiRun | null;
};

/** Somebody in the gondola, going up or down the cable. */
export type GondolaRide = {
  readonly who: number;
  /** How far along the cable, 0 at the valley station, 1 at the summit. */
  t: number;
  readonly up: boolean;
};

/** A run down the ski slope from the summit. */
export type SkiRun = {
  readonly who: number;
  time: number;
  speed: number;
};

/** The lighthouse by the lake. */
export type LighthouseState = {
  /** Seconds its light still burns; 0 while it is dark. */
  on: number;
  /** Which way the beam points, radians. */
  angle: number;
};

/** The narrow-gauge train going round its loop. */
export type TrainState = {
  /** How far the engine is along the loop, map px. */
  dist: number;
  /** Speed along the track, map px per second. */
  speed: number;
  /** The station the train waits at, or -1 while it runs. */
  stop: number;
  /** Seconds it still waits there. */
  wait: number;
  /** The station it left last, so it does not stop there again at once. */
  last: number;
  readonly riders: TrainRider[];
  /** Seconds until the next puff of steam and the next chuff. */
  puffIn: number;
  /** Seconds the train has stood blocked by somebody who cannot step aside. */
  blocked: number;
};

/** Somebody riding the train. */
export type TrainRider = {
  readonly who: number;
  /** Which seat: two per wagon. */
  readonly seat: number;
  /** How far this ride has gone, map px. */
  travelled: number;
  /** Whether the rider gets off at the next station. */
  alight: boolean;
};

/**
 * A snow jetski: a hull on two ski runners, so it races over snow and ice
 * and floats on open water. Its rider sits on it at its place.
 */
export type Jetski = {
  /** Which one: its home place and its colour. */
  readonly home: number;
  /** Where it stands, the middle of its runners, map px. */
  x: number;
  y: number;
  /** Speed, map px per second. */
  vx: number;
  vy: number;
  /** Which way the nose points, radians; 0 is right, a quarter turn down. */
  heading: number;
  /** Index of who sits on it, or -1. */
  rider: number;
  /** Seconds it has stood unridden away from its home. */
  idle: number;
  /** Seconds until it throws up the next spray of snow or water. */
  sprayIn: number;
  /** Seconds left of the wobble after bouncing off something. */
  bump: number;
  /** Whether this ride has reached the far west and the far east of the map. */
  west: boolean;
  east: boolean;
  /** Whether the rider was told to get off at the doorway they stand in. */
  doorSaid: boolean;
};

/** The clock, the snowstorms and the northern lights. */
export type SkyState = {
  /** Time of day, 0 (midnight) to 1. */
  clock: number;
  /** Seconds until the next snowstorm, or of it left while it blows. */
  stormIn: number;
  /** Seconds the storm still blows; 0 when calm. */
  storm: number;
  /** Seconds the northern lights still shine; 0 when none. */
  aurora: number;
  /** Whether tonight's chance of northern lights has been drawn. */
  auroraDrawn: boolean;
  /** Seconds the player has walked through the current storm. */
  stormWalked: number;
};

/** A carousel rider: who, on which horse, and seconds left of the ride. */
export type CarouselRider = {
  readonly who: number;
  readonly seat: number;
  left: number;
  /** Seconds until the music plays again. */
  tuneIn: number;
};

/** A run down the sledding slope. */
export type SledRun = {
  /** Index of who sits on the sled. */
  readonly who: number;
  /** Seconds since the start. */
  time: number;
  /** Speed down the slope, map px per second. */
  speed: number;
  /** Whether the finish line has been crossed. */
  done: boolean;
};

/** A snowball on its way. */
export type Snowball = {
  x: number;
  y: number;
  readonly vx: number;
  readonly vy: number;
  /** Seconds since it left the hand. */
  age: number;
  /** Index of who threw it. */
  readonly thrower: number;
};

/** One of the wild animals: snow hare, penguin or owl. */
export type Critter = {
  readonly kind: CritterKind;
  x: number;
  y: number;
  /** Where it goes, map px. */
  targetX: number;
  targetY: number;
  /** Seconds until it picks a new target. */
  timer: number;
  /** Looking right, else left. */
  right: boolean;
  moving: boolean;
  /** How high an owl flies, map px. */
  altitude: number;
  bubble: Bubble | null;
};

/** The kinds of wild animals. */
export type CritterKind = "hare" | "penguin" | "owl";

/** An errand from the mailbox. */
export type Errand =
  | {
      readonly kind: "deliver";
      /** The lost thing, index of its kind. */
      readonly item: number;
      /** Where it lies, map px outside. */
      readonly x: number;
      readonly y: number;
      /** Whether somebody has picked it up. */
      picked: boolean;
      readonly to: CharacterId;
    }
  | { readonly kind: "visit"; readonly to: CharacterId }
  | { readonly kind: "fetch"; readonly stall: number };

/** What changed in the east land, mending itself; nothing of it is saved. */
export type EastState = {
  readonly riders: CarouselRider[];
  /** Seconds until the market music plays again for whoever strolls there. */
  tuneIn: number;
  sled: SledRun | null;
  readonly snowballs: Snowball[];
  /** Targets just hit: cell to seconds left of the wobble. */
  readonly targetsHit: Map<number, number>;
  /** Seconds the ice curtain stays broken; 0 while it is whole. */
  curtain: number;
  /** Seconds the fox's hole stays open; 0 while snow covers it. */
  hole: number;
  /** Seconds until the snow twitches over the hole again. */
  sniffIn: number;
  /** Felled firs: cell to seconds until a young one has grown. */
  readonly felled: Map<number, number>;
  /** Seconds the decorated tree stays in the workshop; 0 when there is none. */
  xmasTree: number;
  /** Seconds the bell knocked from the fir top lies in the snow. */
  bellDown: number;
  /** Laps round the island: radians turned so far, and the last angle. */
  lapTurn: number;
  lapAngle: number | null;
  readonly critters: Critter[];
  /** The errand from the mailbox, or null. */
  errand: Errand | null;
  /** Seconds until a new letter lies in the mailbox; 0 while one waits. */
  letterIn: number;
};

/** The reindeer in their boxes. */
export type StableState = {
  /** Per reindeer: seconds until it is hungry again; 0 while hungry. */
  readonly full: number[];
  /** Per reindeer: seconds left of munching a carrot just given. */
  readonly munch: number[];
};

/** The heap of letters in the post office. */
export type PostState = {
  /** Letters on the heap. */
  pile: number;
  /** Seconds until the heap grows by a letter again. */
  growIn: number;
  /** Santa reading a letter: seconds left, and which wish, or null. */
  reading: {
    left: number;
    readonly wish: number;
    readonly from: number;
  } | null;
};

/** The oven and the cooling rack in the bakery. */
export type BakeryState = {
  /** What is in the oven. */
  oven: "empty" | "baking" | "done" | "burnt";
  /** Seconds since the tray went in. */
  ovenTime: number;
  /** Trays of cookies on the rack. */
  rack: number;
  /** Seconds until the elves have eaten a tray from the rack. */
  nibbleIn: number;
  /** Seconds until the next waft of smell from the oven. */
  waftIn: number;
};

/** The lost present in the gift store's maze of parcel stacks. */
export type StoreState = {
  /** Where the present is: hidden in the maze, carried, or not lost yet. */
  present: "hidden" | "carried" | "away";
  /** The map cell of the store it lies in while hidden. */
  cell: number;
  /** Seconds until the elves stack the parcels anew. */
  shuffleIn: number;
  /** Seconds until a present is lost again after one was brought home. */
  lostIn: number;
  /** Seconds until the present glints again. */
  glintIn: number;
};

/** The view over the whole map from the big telescope, while it is open. */
export type Overview = {
  /** Seconds since it opened. */
  elapsed: number;
  /** Whether Gugor looks: he sees hidden things as well. */
  readonly eagle: boolean;
};

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
  /**
   * Every place, ready to walk on; the gift store's map is rebuilt when the
   * elves stack the parcels anew.
   */
  readonly maps: Record<AreaId, GameMap>;
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
  /** Gugor's look through the telescope, or null. */
  spy: Spyglass | null;
  /** The view over the whole map from the observatory, or null. */
  overview: Overview | null;
  /** What Gilfi makes float. */
  readonly floats: Floater[];
  /** Sounds to play, taken by the screen each frame. */
  readonly sounds: SoundId[];
  /** Numbers of the Advent gates whose minigame has been won. */
  readonly gatesDone: Set<number>;
  /**
   * The gate whose minigame should run now; set at the darkest moment of the
   * fade into a gate, taken by the screen, which pauses the map meanwhile.
   */
  gateOpen: number | null;
  /**
   * Just back from a gate or the cinema: neither opens until the push towards
   * it is let go.
   */
  gateLatch: boolean;
  /**
   * Whether the cinema is open; set at the darkest moment of the fade into it,
   * cleared by the screen when it closes. The map waits meanwhile.
   */
  cinemaOpen: boolean;
  /** Today, set by the screen: in December the gates open one per day. */
  today: CalendarDay;
  /** The time of day, epoch ms, set by the screen: when an achievement came. */
  now: number;
  /** What the characters changed in the world, mending itself. */
  readonly world: World;
  /** Achievements unlocked, with when, epoch ms. */
  readonly achieved: Map<AchievementId, number>;
  /** What has been collected towards an achievement. */
  readonly progress: Readonly<Record<ProgressId, Set<string>>>;
  /** What has been counted towards an achievement. */
  readonly counts: Record<CountId, number>;
  /** Banners of achievements just unlocked, the first on screen. */
  readonly toasts: Toast[];
  /**
   * How far the camera has zoomed out, 0 (as ever) to 1 (from the balloon,
   * showing more of the map); the screen picks its scale from it.
   */
  zoom: number;
  /** What part B keeps between visits: friendships and today's tasks. */
  readonly keep: ExtrasKeep;
};

/** What is kept between visits. */
export type SaveData = {
  readonly active: CharacterId;
  readonly chars: readonly SavedCharacter[];
  /** Numbers of the Advent gates won; missing in saves from before the gates. */
  readonly gates?: readonly number[];
  /** Achievements unlocked; missing in saves from before the achievements. */
  readonly achievements?: readonly SavedAchievement[];
  /** What has been collected towards achievements, by kind. */
  readonly progress?: Readonly<Partial<Record<ProgressId, readonly string[]>>>;
  /** What has been counted towards achievements, by kind. */
  readonly counts?: Readonly<Partial<Record<CountId, number>>>;
  /** Friendships and today's tasks; missing in saves from before part B. */
  readonly extras?: SavedExtras;
};

/** One achievement as saved. */
export type SavedAchievement = {
  /** Which; unknown ids from other versions are dropped on loading. */
  readonly id: string;
  /** When it was unlocked, epoch ms. */
  readonly at: number;
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
