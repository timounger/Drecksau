/**
 * The shapes of the IMPERAVIS simulation: the world, islands, goods,
 * buildings, people, ships, routes and the whole game state.
 *
 * @module
 * @remarks
 * Nothing here knows the DOM or three.js. The game state is a plain object
 * that the fixed-step simulation changes; the view only reads it. What can be
 * rebuilt from the seed (the terrain) lives in {@link World} and is not saved.
 */

/** How large a new world is. */
export type MapSize = "small" | "medium" | "large";

/** The kinds of ground a tile can have. */
export enum Terrain {
  DeepWater = 0,
  Water = 1,
  Beach = 2,
  Meadow = 3,
  Forest = 4,
  Rock = 5,
  Mountain = 6,
  River = 7,
}

/** What lies under a tile and can be mined or dug. */
export enum Deposit {
  None = 0,
  Stone = 1,
  Clay = 2,
  Ore = 3,
}

/** The crops whose growth depends on the island. */
export type Crop = "grain" | "grapes" | "tobacco";

/** Every good there is. */
export type GoodId =
  | "wood"
  | "planks"
  | "stone"
  | "clay"
  | "bricks"
  | "ore"
  | "coal"
  | "iron"
  | "tools"
  | "fish"
  | "grain"
  | "flour"
  | "bread"
  | "wool"
  | "cloth"
  | "clothing"
  | "malt"
  | "beer"
  | "grapes"
  | "wine"
  | "quartz"
  | "glass"
  | "instruments"
  | "tobacco"
  | "cigars"
  | "pearls"
  | "jewelry"
  | "weapons"
  | "cannons"
  | "engines"
  // Goods of the foreign peoples and the pirates (see factions-data.ts).
  | "spices"
  | "silk"
  | "tea"
  | "porcelain"
  | "oliveOil"
  | "furniture"
  | "furs"
  | "ropes"
  | "rum"
  | "perfume"
  | "treasureMap";

/** What a good is used for, for grouping in lists. */
export type GoodCategory =
  | "raw"
  | "material"
  | "intermediate"
  | "food"
  | "luxury"
  /** Goods of the foreign peoples: only they make them, nobody else sells them. */
  | "exotic";

/** The fixed facts about a good. */
export type GoodDef = {
  readonly id: GoodId;
  readonly category: GoodCategory;
  /** Base trade value in gold per unit. */
  readonly value: number;
  /** Weight of one unit, in hundredweights (shown only). */
  readonly weight: number;
  /** Space one unit takes in a ship's hold, in units of hold space. */
  readonly volume: number;
  /** Whether it keeps in a warehouse (all goods here do). */
  readonly storable: boolean;
};

/** An amount of several goods. */
export type Amounts = Partial<Record<GoodId, number>>;

/** Every kind of building. */
export type BuildingKind =
  | "kontor"
  | "warehouse"
  | "house"
  | "market"
  | "chapel"
  | "tavern"
  | "school"
  | "bathhouse"
  | "woodcutter"
  | "sawmill"
  | "fishery"
  | "grainFarm"
  | "sheepFarm"
  | "vineyard"
  | "mill"
  | "bakery"
  | "malthouse"
  | "brewery"
  | "weaver"
  | "tailor"
  | "claypit"
  | "brickworks"
  | "quarry"
  | "oreMine"
  | "charcoal"
  | "smelter"
  | "toolmaker"
  | "winery"
  | "shipyard"
  | "watchtower"
  | "battery"
  | "barracks"
  | "fireStation"
  | "doctor"
  | "scholarHouse"
  | "university"
  | "theatre"
  | "sandPit"
  | "glassworks"
  | "instrumentMaker"
  | "tobaccoFarm"
  | "tobacconist"
  | "pearlDiver"
  | "goldsmith"
  | "gunsmith"
  | "foundry"
  | "engineWorks"
  | "decorTree"
  | "flowerBed"
  | "lantern"
  | "plaza"
  | "park"
  | "fountain"
  | "statue"
  | "perfumery"
  // Protection against the natural disasters (see disasters.ts).
  | "dike"
  | "pumpStation"
  | "irrigation"
  | "breakwater";

/** The shelves of the build menu. */
export type BuildingCategory =
  | "logistics"
  | "housing"
  | "public"
  | "raw"
  | "farm"
  | "craft"
  | "harbour"
  | "defence"
  | "decor";

/** Every field of research. */
export type ResearchId =
  | "glass"
  | "engineering"
  | "fortification"
  | "crops"
  | "guilds"
  | "shipbuilding"
  | "optics"
  | "tobacco"
  | "society"
  | "jewelry"
  | "wealth"
  | "gunnery"
  | "steam"
  | "tactics";

/** What a gun of a ship or a building does. */
export type Guns = {
  /** Hit points one shot takes before armour. */
  readonly damage: number;
  /** Reach in tiles. */
  readonly range: number;
  /** Seconds between two shots. */
  readonly reload: number;
};

/** What a site needs nearby to be allowed or to work. */
export type SiteNeed =
  | { readonly type: "coast" }
  | { readonly type: "forest"; readonly radius: number; readonly min: number }
  | {
      readonly type: "deposit";
      readonly deposit: Deposit;
      readonly radius: number;
    }
  | { readonly type: "fertility"; readonly crop: Crop }
  | { readonly type: "water"; readonly radius: number; readonly min: number };

/** How a producer turns inputs into an output. */
export type Recipe = {
  readonly inputs: readonly {
    readonly good: GoodId;
    readonly amount: number;
  }[];
  readonly output: GoodId;
  readonly amount: number;
  /** Seconds of one cycle at full efficiency. */
  readonly seconds: number;
  /** Which seasonal factor applies. */
  readonly seasonal: "crop" | "sea" | "none";
};

/** When a building becomes available: residents of a tier or above. */
export type Unlock = { readonly tier: number; readonly residents: number };

/** The fixed facts about a kind of building. */
export type BuildingDef = {
  readonly kind: BuildingKind;
  readonly category: BuildingCategory;
  /** Footprint before rotation, in tiles. */
  readonly w: number;
  readonly h: number;
  readonly cost: { readonly gold: number } & Amounts;
  /** Seconds to build. */
  readonly buildSeconds: number;
  /** Gold per minute while it stands. */
  readonly upkeep: number;
  /** Workers it needs, and of which tier. */
  readonly workers: { readonly tier: number; readonly count: number } | null;
  readonly recipe: Recipe | null;
  /** Reach of a service or of a warehouse, in tiles. */
  readonly radius: number;
  /** Territory it claims around itself, in tiles (0 for none). */
  readonly influence: number;
  /** What the site needs. */
  readonly needs: readonly SiteNeed[];
  readonly unlock: Unlock | null;
  /** Goods space it adds to its island, per good. */
  readonly storage: number;
  /** Carts it sends out (warehouses only). */
  readonly carts: number;
  /** Whether smoke rises from it while it works. */
  readonly smoke: boolean;
  /** Hit points when whole. */
  readonly hp: number;
  /** Share of every hit it shrugs off, 0 to 1. */
  readonly armour: number;
  /** Its guns, or null for a building that cannot shoot. */
  readonly guns: Guns | null;
  /** Research that must be done before it can be built, or null. */
  readonly research: ResearchId | null;
  /** Research points per minute at full staff (scholars), else 0. */
  readonly science: number;
  /**
   * The foreign people who teach it: such a building opens only through
   * good relations with them, never by residents or research.
   */
  readonly faction?: CultureId;
};

/** A population tier, from farmers (0) to wealthy citizens (6). */
export type TierDef = {
  readonly index: number;
  /** Residents per house of this tier. */
  readonly capacity: number;
  /** Gold per resident and minute at full satisfaction. */
  readonly tax: number;
  /** Goods wanted, per resident and minute. */
  readonly goods: readonly { readonly good: GoodId; readonly rate: number }[];
  /** Public buildings that must be in reach. */
  readonly services: readonly BuildingKind[];
  /** Materials to rise into this tier. */
  readonly upgradeCost: Amounts;
  /** Research needed before houses may rise into this tier, or null. */
  readonly research: ResearchId | null;
};

/** Where the time of year stands. */
export type Season = "spring" | "summer" | "autumn" | "winter";

/** The weather there can be. */
export type WeatherKind = "clear" | "rain" | "fog" | "storm";

/** Facts about one island, rebuilt from the seed. */
export type IslandInfo = {
  readonly id: number;
  readonly name: string;
  /** Land tiles. */
  readonly area: number;
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
  /** Centre of the land, in tiles. */
  readonly cx: number;
  readonly cy: number;
  readonly fertile: Readonly<Record<Crop, boolean>>;
  /** Deposit tiles per kind. */
  readonly deposits: Readonly<Record<"stone" | "clay" | "ore", number>>;
  readonly forest: number;
  readonly coast: number;
  readonly mountain: number;
  readonly river: number;
  /** Land tiles one could build on. */
  readonly buildable: number;
  /** Rough size class for display. */
  readonly size: "small" | "medium" | "large";
};

/** The landscape, rebuilt from seed and size and never saved. */
export type World = {
  readonly seed: number;
  readonly size: MapSize;
  /** Tiles per side. */
  readonly n: number;
  /** Height at each tile corner, (n + 1) x (n + 1), sea level 0. */
  readonly heights: Float32Array;
  /** Terrain per tile. */
  readonly terrain: Uint8Array;
  /** Island per tile, -1 on water. */
  readonly islandOf: Int16Array;
  /** Deposit per tile. */
  readonly deposits: Uint8Array;
  readonly islands: readonly IslandInfo[];
  /** The island the player starts at. */
  readonly startIsland: number;
  /** Where the first ship waits, a water tile. */
  readonly startShip: { readonly x: number; readonly y: number };
  /**
   * The home islands of the foreign peoples and pirates, in the order of
   * their factions; empty for worlds made before them (the map comes from
   * the seed, so older worlds keep theirs).
   */
  readonly factionHomes: readonly FactionHome[];
};

/** The foreign peoples and pirate bands there can be. */
export type CultureId =
  "qasirah" | "shogunara" | "valdoria" | "skeld" | "crows" | "blackreef";

/** A civilised island power or a band of pirates. */
export type FactionKind = "nation" | "pirates";

/** Where a faction lives, fixed when the world is made. */
export type FactionHome = {
  readonly culture: CultureId;
  /** The island, closed to everyone else. */
  readonly island: number;
  /** The sea tile ships lie at to trade, as an index. */
  readonly berth: number;
  /** The land tile of the harbour beside it, as an index. */
  readonly quay: number;
};

/** What a people's mind is busy with. */
export type NationMood =
  | "idle"
  | "producing"
  | "trading"
  | "negotiating"
  | "expanding"
  | "defending"
  | "recovering";

/** What a pirate band's mind is busy with. */
export type PirateMood =
  | "idle"
  | "patrolling"
  | "searching"
  | "chasing"
  | "attacking"
  | "looting"
  | "returning"
  | "repairing"
  | "negotiating";

/** What one ship of a faction does. */
export type FactionShipRole = "merchant" | "guard" | "raider";

/** One ship of a faction with its task. */
export type FactionShip = {
  readonly ship: number;
  readonly role: FactionShipRole;
  /** Its state: a pirate's raid or a people's voyage. */
  state: PirateMood | NationMood;
  /** The ship, island or player its task is about, or -1. */
  target: number;
  /** A point at sea it heads for, in tiles. */
  x: number;
  y: number;
  /** Game second the state began. */
  since: number;
};

/** A standing delivery between a faction and a player. */
export type SupplyContract = {
  readonly id: number;
  /** The faction's id. */
  readonly faction: number;
  readonly player: number;
  readonly good: GoodId;
  /** Units per delivery. */
  readonly amount: number;
  /** Gold paid per delivery. */
  readonly gold: number;
  /** Seconds between two deliveries. */
  readonly every: number;
  /** "sell": the player delivers and is paid; "buy": the faction delivers. */
  readonly direction: "sell" | "buy";
  /** Game second of the next delivery. */
  next: number;
  /** Deliveries made. */
  deliveries: number;
  /** Deliveries the player failed, in a row. */
  breaches: number;
  /** True while the last delivery could not be made. */
  suspended: boolean;
  /** Valdoria's charter: a better price for its friends. */
  readonly exclusive: boolean;
};

/** One lot on the pirates' black market. */
export type MarketLot = {
  readonly good: GoodId;
  amount: number;
  /** Gold per unit. */
  readonly price: number;
};

/** Protection money a player pays a pirate band. */
export type Protection = {
  readonly player: number;
  /** Gold per payment. */
  readonly gold: number;
  /** Game second of the next payment. */
  next: number;
  /** Game second the agreement ends. */
  readonly until: number;
};

/** A treasure a map leads to. */
export type Treasure = {
  readonly owner: number;
  readonly x: number;
  readonly y: number;
  readonly gold: number;
};

/** Things a faction's window reports, newest last. */
export type FactionNoteKind =
  | "bought"
  | "sold"
  | "contract"
  | "contractCancelled"
  | "suspended"
  | "breach"
  | "delivered"
  | "gift"
  | "demand"
  | "support"
  | "raid"
  | "assault"
  /** Allied pirates set out against a kontor of their ally's enemy. */
  | "allyStrike"
  | "loot"
  | "lostShip"
  | "newShip"
  | "protection"
  | "protectionEnded"
  | "market"
  | "unlock"
  | "ceasefire"
  | "alliance"
  | "war"
  | "aiTrade"
  | "treasure"
  | "mutiny"
  | "trade";

/** One line of a faction's news. */
export type FactionNote = {
  readonly time: number;
  readonly kind: FactionNoteKind;
  /** The player concerned, or -1. */
  readonly player: number;
  readonly good: GoodId | null;
  readonly amount: number;
};

/** Running effects of a faction's events, each until a game second. */
export type FactionEffects = {
  /** Production is halved (epidemic). */
  plague: number;
  /** Food is wanted urgently (famine). */
  famine: number;
  /** The harbour is damaged: no trade until then. */
  storm: number;
  /** The pirates gather their fleet for a great raid. */
  gathering: number;
  /** One good is made three times as fast (a rich harvest or caravan). */
  boost: number;
  boostGood: GoodId | null;
};

/** A foreign people or a pirate band: its island, goods, ships and mind. */
export type Faction = {
  /** The owner id of its ships, below the trader's. */
  readonly id: number;
  readonly culture: CultureId;
  readonly kind: FactionKind;
  readonly island: number;
  /** The ruler's name; a mutiny among pirates can change it. */
  leader: string;
  gold: number;
  /** Its warehouse, apart from every player's. */
  stock: Record<GoodId, number>;
  mood: NationMood | PirateMood;
  /** Game second of its next look at the world. */
  nextThink: number;
  fleet: FactionShip[];
  /** Earliest game second it builds or replaces a ship. */
  nextShip: number;
  contracts: SupplyContract[];
  protection: Protection[];
  /** The black market (pirates only) and when it changes. */
  market: MarketLot[];
  marketUntil: number;
  notes: FactionNote[];
  /** Players it taught its special art (recipe, refit, ship or charter). */
  granted: number[];
  effects: FactionEffects;
  /** The player it sends war ships to help, and until when. */
  support: { player: number; until: number; hunt: boolean } | null;
  /** Earliest game second the next raid on each owner may start. */
  raidAt: Record<string, number>;
  /** Until when each player may see its whole fleet (bought news). */
  intel: Record<string, number>;
  /** Gold of goods traded with the human so far. */
  traded: number;
  /** Game second it offers a new mission, has an event, trades with rivals. */
  nextMission: number;
  nextEvent: number;
  nextDeal: number;
  /** Treasures its maps lead to (pirates). */
  treasures: Treasure[];
  /** Game second until which it holds a ceasefire with each player. */
  ceasefire: Record<string, number>;
  /** Pirates demanding protection money from a player, until a second. */
  demand: { player: number; until: number } | null;
  /**
   * What each player did to other enemies since its last alliance with this
   * band broke (pirates only; missing in older saves, then empty): what
   * opens the way to an alliance with them.
   */
  deeds: Record<string, PirateDeeds>;
};

/** A player's deeds against enemies that are not pirates, as a band counts them. */
export type PirateDeeds = {
  /** Ships sunk of rivals and peoples it fought. */
  sunk: number;
  /** Kontors of rivals taken or destroyed. */
  taken: number;
};

/** What a player can do with a faction. */
export type FactionAction =
  /** Opens trade relations. */
  | { readonly type: "open" }
  | {
      readonly type: "buy" | "sell";
      /** The player's ship lying in the faction's harbour. */
      readonly ship: number;
      readonly good: GoodId;
      readonly amount: number;
    }
  | { readonly type: "gift"; readonly gold: number }
  /** Asks a people for gold; it pays or refuses by opinion, character and strength. */
  | { readonly type: "demand"; readonly gold: number }
  | {
      readonly type: "contract";
      readonly good: GoodId;
      readonly amount: number;
      readonly direction: "sell" | "buy";
    }
  | { readonly type: "cancelContract"; readonly contract: number }
  /** War ships to guard the player for a while. */
  | { readonly type: "support" }
  /** War ships to hunt the pirates together. */
  | { readonly type: "hunt" }
  | { readonly type: "ceasefire" }
  | { readonly type: "alliance" }
  | { readonly type: "cancelAlliance" }
  /** The special art the faction teaches its friends. */
  | { readonly type: "learn" }
  | { readonly type: "protection" }
  | { readonly type: "endProtection" }
  /** Buys news of the pirates' whole fleet. */
  | { readonly type: "intel" }
  | {
      readonly type: "market";
      readonly ship: number;
      readonly lot: number;
      readonly amount: number;
    }
  /** Hands over goods of a mission from a ship in the harbour. */
  | {
      readonly type: "deliver";
      readonly mission: number;
      readonly ship: number;
    };

/** Why a producer is or is not working. */
export type ProducerStatus =
  | "building"
  | "working"
  | "noInput"
  | "full"
  | "noWorkers"
  | "noResource"
  /** Its store is full or its inputs are out, and no cart can reach it. */
  | "noRoad"
  | "paused"
  /** Under water in a flood. */
  | "flooded"
  /** Its fields eaten bare by locusts. */
  | "ravaged";

/** How a producer is joined to its store: by road, over land, or not at all. */
export type LinkKind = "road" | "land" | "none";

/** The way a store's carts take to a producer (derived from buildings and roads). */
export type Link = {
  /** The store whose carts drive it. */
  readonly warehouse: number;
  /** Tiles from beside the store to beside the producer. */
  readonly path: readonly number[];
  /** Seconds one way takes without traffic. */
  readonly seconds: number;
  /** "road" when every tile of the way is road, else "land". */
  readonly kind: Exclude<LinkKind, "none">;
};

/** A producer's running state. */
export type ProducerState = {
  /** Inputs waiting to be used. */
  input: Amounts;
  /** Output waiting to be collected. */
  output: number;
  /** Seconds into the current cycle. */
  cycle: number;
  /** Share of recent time spent working, 0 to 1. */
  efficiency: number;
  status: ProducerStatus;
  /** The store whose carts serve it (over road or land), or -1. */
  warehouse: number;
  /** Units made in total. */
  made: number;
  /** How well the site suits it (forest, deposit, fish), 0 to 1. */
  site: number;
};

/** A house's running state. */
export type HouseState = {
  tier: number;
  residents: number;
  /** 0 to 1. */
  satisfaction: number;
  /** Fulfilment of each need of the tier, goods first, then services. */
  needs: number[];
  /** Seconds until residents may change again. */
  growth: number;
  /** Seconds until it may try to rise again. */
  upgrade: number;
  /** Why it does not rise, when it does not. */
  blocked: "needs" | "full" | "materials" | "locked" | "research" | "none";
  /** Seconds it has been badly supplied; at a limit it falls a tier. */
  decline: number;
};

/** A shipyard's running state: the ship on the slip and the orders after it. */
export type YardState = {
  /** The ship being built, or null. */
  building: ShipKind | null;
  /** Seconds done (worker-weighted). */
  progress: number;
  /** Ships ordered and paid for, waiting for the slip, first next. */
  queue: ShipKind[];
};

/** A barracks' running state: units ordered and the one in training. */
export type DrillState = {
  /** Units ordered and paid for; the first is the one in training. */
  queue: UnitKind[];
  /** Seconds done on the first one. */
  progress: number;
  /** While true no training goes on. */
  paused: boolean;
};

/** A building on the map. */
export type Building = {
  readonly id: number;
  readonly kind: BuildingKind;
  /** Top-left tile of the footprint. */
  x: number;
  y: number;
  /** Quarter turns, 0 to 3. */
  rot: number;
  /** Footprint after rotation. */
  w: number;
  h: number;
  readonly island: number;
  /** Seconds of building done; complete when it reaches the build time. */
  built: number;
  complete: boolean;
  paused: boolean;
  prod: ProducerState | null;
  house: HouseState | null;
  yard: YardState | null;
  /** The training of a barracks, else null. */
  drill: DrillState | null;
  /** Hit points left. */
  hp: number;
  /**
   * Whether its carts come first: a producer with priority is served before
   * the others when a warehouse picks its next job.
   */
  priority: boolean;
  /** Upgrade level, 0 (first stage) or 1 (second stage). */
  level: number;
  /** Seconds a fire still burns, 0 when none. */
  fire: number;
  /** Game second it was last hit, for repairs. */
  hitAt: number;
  /** Seconds until its guns are loaded again. */
  reload: number;
  /**
   * Seconds its fields still lie bare after locusts, 0 when none; missing
   * in saves from before the disasters.
   */
  blight: number;
};

/** What a cart is doing. */
export type CartTask = "collect" | "deliver";

/** A cart that carries goods between a warehouse and a producer. */
export type Cart = {
  readonly id: number;
  /** The warehouse it belongs to. */
  readonly home: number;
  /** Tile indices to drive along, there and back. */
  path: number[];
  /** Position along the path, in tiles. */
  pos: number;
  /** Index in the path where it turns back. */
  turn: number;
  target: number;
  task: CartTask;
  good: GoodId;
  /** Units loaded. */
  load: number;
  /** Units it was sent for. */
  amount: number;
};

/**
 * The kinds of ship. The ids stay as in older saves; the names shown are
 * those of their roles (cog = schooner, hulk = clipper, galleon = freighter,
 * warship = gunboat, frigate, lineShip, cruiser, steamer).
 */
export type ShipKind =
  | "cog"
  | "hulk"
  | "galleon"
  | "steamer"
  | "warship"
  | "frigate"
  | "lineShip"
  | "cruiser"
  | "trader"
  | "pirate"
  | "knarr"
  | "pirateBoat"
  | "corvette"
  | "pirateFrigate"
  | "pirateWarship";

/** What a ship is for: carrying goods, fighting, or neither (trader, pirates). */
export type ShipRole = "trade" | "war" | "other";

/** Fixed facts about a kind of ship. */
export type ShipDef = {
  readonly kind: ShipKind;
  readonly role: ShipRole;
  /**
   * The highest tier the player's houses must have reached before a
   * shipyard builds it (the peak tier of the player's statistics).
   */
  readonly tier: number;
  /** Guns aboard, shown; one broadside of them does the damage of its guns. */
  readonly cannons: number;
  /** Tiles per second. */
  readonly speed: number;
  /** How quickly it turns, radians per second. */
  readonly turn: number;
  /** Cargo slots and units per slot. */
  readonly slots: number;
  readonly slotSize: number;
  readonly crew: number;
  readonly hp: number;
  /** Gold per minute. */
  readonly upkeep: number;
  readonly cost: { readonly gold: number } & Amounts;
  readonly buildSeconds: number;
  /** Share of every hit it shrugs off, 0 to 1. */
  readonly armour: number;
  /** Its cannons, or null for an unarmed ship. */
  readonly guns: Guns | null;
  /** Research needed before a shipyard may build it, or null. */
  readonly research: ResearchId | null;
  /** Soldiers it can carry. */
  readonly troops: number;
  /** The foreign people whose friendship opens it to a shipyard, if any. */
  readonly faction?: CultureId;
};

/** What a ship is doing. */
export type ShipOrder =
  | { readonly type: "idle" }
  | {
      readonly type: "move";
      readonly x: number;
      readonly y: number;
      /** The fleet it sails with, keeping to the slowest; missing alone. */
      readonly fleet?: number;
    }
  | {
      /** Going after an enemy ship or building until it is gone. */
      readonly type: "attack";
      readonly target: number;
      /** True when the target is a building, else a ship. */
      readonly building: boolean;
    }
  | {
      /** Sailing to and fro between two points, fighting what comes near. */
      readonly type: "patrol";
      readonly ax: number;
      readonly ay: number;
      readonly bx: number;
      readonly by: number;
      /** 0 while heading for b, 1 while heading back to a. */
      leg: number;
    }
  | {
      /** Keeping close to an own ship and fighting off its attackers. */
      readonly type: "escort";
      readonly ship: number;
    }
  | {
      readonly type: "route";
      readonly route: number;
      stop: number;
      wait: number;
    }
  | {
      /** Sailing to an island to set the soldiers aboard ashore. */
      readonly type: "land";
      readonly island: number;
    };

/** The kinds of land unit. */
export type UnitKind =
  | "militia"
  | "line"
  | "grenadier"
  | "elite"
  | "musketeer"
  | "sharpshooter"
  | "artillery"
  | "cavalry"
  | "pioneer"
  | "medic"
  | "scout";

/** The shelves of the barracks: infantry, ranged, heavy infantry, specialists. */
export type UnitCategory = "infantry" | "ranged" | "heavy" | "special";

/** How a group of units stands: in a line, a block, or loosely spread. */
export type Formation = "line" | "block" | "loose";

/** What a unit on land is doing beyond walking its path. */
export type SoldierOrder =
  | { readonly type: "idle" }
  | {
      /** Going after an enemy unit until it falls. */
      readonly type: "attack";
      readonly soldier: number;
    }
  | {
      /** Firing on an enemy ship near the shore while it is in reach. */
      readonly type: "attackShip";
      readonly ship: number;
    }
  | {
      /** Walking to and fro between two points. */
      readonly type: "patrol";
      readonly ax: number;
      readonly ay: number;
      readonly bx: number;
      readonly by: number;
      /** 0 while heading for b, 1 while heading back to a. */
      leg: number;
    }
  | {
      /** Holding a position: dug in, it chases no one beyond its reach. */
      readonly type: "hold";
      readonly x: number;
      readonly y: number;
    }
  | {
      /** Falling back to the nearest own barracks or kontor. */
      readonly type: "retreat";
    };

/** One unit of land troops: on land, or aboard a ship. */
export type Soldier = {
  readonly id: number;
  /** The player it fights for. */
  readonly owner: number;
  /** What kind of unit it is (older saves: line infantry). */
  readonly kind: UnitKind;
  /** Its standing order. */
  order: SoldierOrder;
  /** How it stands with its group. */
  formation: Formation;
  /** Position in tiles (continuous). */
  x: number;
  y: number;
  hp: number;
  /** Seconds until it can strike again. */
  reload: number;
  /** The ship that carries it, or -1 on land. */
  ship: number;
  /** The island it stands on, or -1 while aboard. */
  island: number;
  /** The building it marches on, or -1. */
  target: number;
  /** Tiles still to walk, as indices. */
  path: number[];
};

/** One ship. */
export type Ship = {
  readonly id: number;
  readonly kind: ShipKind;
  /** The player it belongs to; {@link TRADER} or {@link PIRATES} for others. */
  owner: number;
  name: string;
  /** Position in tiles (continuous). */
  x: number;
  y: number;
  /** Heading in radians, 0 = +x. */
  heading: number;
  /** Waypoints still to sail, as [x, y] pairs in tiles. */
  path: number[];
  cargo: Amounts;
  order: ShipOrder;
  /** The kontor it lies at, or -1. */
  docked: number;
  /** Set when no way could be found. */
  stuck: boolean;
  /** Hit points left. */
  hp: number;
  /** Seconds until its cannons are loaded again. */
  reload: number;
  /** Game second it was last hit. */
  hitAt: number;
};

/** A named group of a player's ships that sails together. */
export type Fleet = {
  readonly id: number;
  readonly owner: number;
  name: string;
  /** Its ships, in order; sunk ones drop out. */
  ships: number[];
};

/** One thing to do at a stop. */
export type RouteAction = {
  good: GoodId;
  mode: "load" | "unload";
  /** Load: cargo to have. Unload: most to put down. */
  amount: number;
  /** Load: least to leave in the warehouse. Unload: most the warehouse should hold. */
  limit: number;
  /** 0 low, 1 normal, 2 high: higher goes first when the hold is short. */
  priority: number;
};

/** One stop of a trade route: a kontor and what to do there. */
export type RouteStop = { island: number; actions: RouteAction[] };

/** A trade route between the player's islands. */
export type TradeRoute = {
  readonly id: number;
  /** The player whose route it is. */
  readonly owner: number;
  name: string;
  stops: RouteStop[];
  active: boolean;
  /** Why it is blocked, or null. */
  blocked: "noKontor" | "noPath" | "noShip" | null;
  /** Round trips completed. */
  trips: number;
};

/** What the player wants the free trader to buy or sell at one island. */
export type TradeOrder = { sellAbove: number | null; buyBelow: number | null };

/** The player's state on one island. */
export type IslandState = {
  readonly id: number;
  /** The player whose kontor stands there, or -1. */
  owner: number;
  /** The goods in its warehouses. */
  stock: Record<GoodId, number>;
  /** Share of demand met recently, per good. */
  supply: Record<GoodId, number>;
  orders: Partial<Record<GoodId, TradeOrder>>;
  foundedAt: number;
  /** Seconds a plague still rages, 0 when none. */
  plague: number;
  /** Harvest factor of an event and until when it holds. */
  harvest: { factor: number; until: number } | null;
};

/** The free trader who sails between the player's kontors. */
export type TraderState = {
  /** Price pressure per good, -1 (glut) to 1 (scarcity). */
  pressure: Record<GoodId, number>;
  /** What the trader has to sell. */
  stock: Record<GoodId, number>;
  /** Seconds until the next visit begins. */
  nextVisit: number;
  /** Islands still to visit on this voyage. */
  queue: number[];
  /** Gold the trader paid and took on the last visit. */
  lastDeal: { island: number; bought: number; sold: number } | null;
};

/** Money in and out, by kind. */
export type LedgerLine = {
  taxes: number;
  sales: number;
  upkeepBuildings: number;
  upkeepShips: number;
  purchases: number;
  construction: number;
  /** Income from missions, treaties, tribute and gifts. */
  rewards: number;
  /** Gifts, tribute, deals and repairs paid. */
  payments: number;
};

/** The money of the last full minute and the running one. */
export type Ledger = {
  current: LedgerLine;
  last: LedgerLine;
  /** Gold at the end of each recent minute, oldest first. */
  history: number[];
  /** Seconds into the running minute. */
  clock: number;
};

/** Things the view, the sound or the messages may want to know about. */
export type GameEvent =
  | {
      readonly type: "placed";
      readonly player: number;
      readonly kind: BuildingKind;
      readonly x: number;
      readonly y: number;
    }
  | {
      readonly type: "built";
      readonly player: number;
      readonly kind: BuildingKind;
      readonly x: number;
      readonly y: number;
    }
  | { readonly type: "removed"; readonly x: number; readonly y: number }
  | {
      readonly type: "upgraded";
      readonly player: number;
      readonly tier: number;
      readonly x: number;
      readonly y: number;
    }
  | {
      readonly type: "downgraded";
      readonly player: number;
      readonly tier: number;
      readonly x: number;
      readonly y: number;
    }
  | {
      readonly type: "levelUp";
      readonly player: number;
      readonly kind: BuildingKind;
      readonly x: number;
      readonly y: number;
    }
  | {
      readonly type: "unlocked";
      readonly player: number;
      readonly kind: BuildingKind;
    }
  | {
      readonly type: "founded";
      readonly player: number;
      readonly island: number;
    }
  | {
      readonly type: "shipBuilt";
      readonly player: number;
      readonly ship: number;
    }
  | {
      readonly type: "docked";
      readonly player: number;
      readonly ship: number;
      readonly island: number;
    }
  | {
      readonly type: "trader";
      readonly player: number;
      readonly island: number;
      readonly bought: number;
      readonly sold: number;
    }
  | {
      readonly type: "shortage";
      readonly player: number;
      readonly island: number;
      readonly good: GoodId;
    }
  | { readonly type: "weather"; readonly weather: WeatherKind }
  | { readonly type: "season"; readonly season: Season }
  | { readonly type: "debt"; readonly player: number }
  | {
      readonly type: "shot";
      readonly x1: number;
      readonly y1: number;
      readonly x2: number;
      readonly y2: number;
    }
  | {
      readonly type: "sunk";
      readonly player: number;
      readonly kind: ShipKind;
      readonly x: number;
      readonly y: number;
    }
  | {
      readonly type: "destroyed";
      readonly player: number;
      readonly kind: BuildingKind;
      readonly x: number;
      readonly y: number;
    }
  | {
      readonly type: "captured";
      readonly island: number;
      readonly from: number;
      readonly to: number;
    }
  | {
      readonly type: "plundered";
      readonly island: number;
      readonly player: number;
    }
  | {
      readonly type: "incident";
      readonly kind: IncidentKind;
      readonly player: number;
      readonly island: number;
      readonly x: number;
      readonly y: number;
    }
  /** A disaster is coming: it strikes in so many seconds. */
  | {
      readonly type: "disasterWarning";
      readonly kind: DisasterKind;
      readonly player: number;
      readonly island: number;
      readonly seconds: number;
      readonly x: number;
      readonly y: number;
    }
  /** A disaster is over. */
  | {
      readonly type: "disasterOver";
      readonly kind: DisasterKind;
      readonly player: number;
      readonly island: number;
    }
  | {
      readonly type: "fireOut";
      readonly player: number;
      readonly kind: BuildingKind;
    }
  | {
      readonly type: "war";
      readonly a: number;
      readonly b: number;
      /** True when a joins because of an alliance. */
      readonly called: boolean;
    }
  | { readonly type: "peace"; readonly a: number; readonly b: number }
  | {
      readonly type: "treaty";
      readonly a: number;
      readonly b: number;
      readonly treaty: Treaty;
      readonly signed: boolean;
    }
  | { readonly type: "offer"; readonly offer: number; readonly from: number }
  | {
      readonly type: "answer";
      readonly from: number;
      readonly to: number;
      readonly accepted: boolean;
      readonly answer: DiplomacyAnswer;
    }
  | {
      readonly type: "mission";
      readonly mission: number;
      readonly state: MissionState;
    }
  | {
      readonly type: "landed";
      readonly player: number;
      readonly island: number;
      readonly soldiers: number;
    }
  | {
      /** An AI is angered by soldiers on its island, or goes to war over them. */
      readonly type: "trespass";
      readonly owner: number;
      readonly intruder: number;
      readonly war: boolean;
    }
  | {
      /** A faction did something worth telling. */
      readonly type: "faction";
      readonly faction: number;
      readonly note: FactionNote;
    }
  | {
      readonly type: "researched";
      readonly player: number;
      readonly research: ResearchId;
    }
  | {
      /**
       * The guided start moved on: a task was done ("done"), the last one
       * was done ("finished"), or the player ended it ("ended", no step).
       */
      readonly type: "tutorial";
      readonly player: number;
      readonly step: TutorialStepId | null;
      readonly state: "done" | "finished" | "ended";
    };

/** The counters statistics read, per player. */
export type GameStats = {
  built: number;
  peakPopulation: number;
  peakTier: number;
  founded: number;
  shipsBuilt: number;
  traded: number;
  /** Units sold to the free trader. */
  sold: number;
  /** Enemy ships sunk. */
  sunk: number;
  /** Missions fulfilled. */
  missions: number;
  /** Pirate ships sunk (missing in older saves). */
  pirates?: number;
};

/** How much tax a player asks. */
export type TaxLevel = 0 | 1 | 2;

/** The characters an AI player can have. */
export type Personality = "trader" | "expansionist" | "warlike";

/** What an AI player is busy with beyond building. */
export type AiTask =
  | { readonly type: "none" }
  | {
      readonly type: "colonize";
      readonly island: number;
      readonly ship: number;
      stage: "load" | "sail" | "found";
      readonly since: number;
    }
  | {
      /** Bringing soldiers to an enemy island. */
      readonly type: "invade";
      readonly island: number;
      readonly ship: number;
      stage: "board" | "sail";
      readonly since: number;
    };

/** The mind of an AI player. */
export type AiState = {
  readonly personality: Personality;
  /** Game second of the next look at the economy. */
  nextThink: number;
  /** Game second of the next look at the neighbours. */
  nextDiplomacy: number;
  task: AiTask;
  /**
   * Kinds that found no site on an island ("kind@island"), and until which
   * second not to try there again.
   */
  noSite: Record<string, number>;
  /** Whether it is saving money because the treasury runs low. */
  thrifty: boolean;
  /** How often each kind of crisis was met, for the record. */
  crises: { shortage: number; money: number; war: number };
  /** Crown orders it has looked at already (contract ids). */
  missions: number[];
};

/** A player's research. */
export type ResearchState = {
  /** What is being studied, or null. */
  current: ResearchId | null;
  /** Points put into the current field. */
  progress: number;
  done: ResearchId[];
  /** Points per minute at the last count. */
  rate: number;
};

/** Why a relation or a reputation is what it is. */
export type RelationReason =
  | "personality"
  | "reputation"
  | "gift"
  | "demand"
  | "refused"
  | "trade"
  | "mission"
  | "failedMission"
  | "attacked"
  | "war"
  | "peace"
  | "brokenPact"
  | "border"
  | "sharedEnemy"
  | "tradeAgreement"
  | "pact"
  | "alliance"
  | "declaredWar"
  | "rivalry"
  | "incident"
  | "conquest"
  | "trespass"
  // Reasons of the foreign peoples and pirates.
  | "culture"
  | "contract"
  | "breach"
  | "piracy"
  | "pirateHunt"
  | "protection"
  | "support"
  | "urgent"
  | "ceasefire"
  | "provoked";

/** One reason with its weight. */
export type Modifier = { reason: RelationReason; value: number };

/** One player in the game: the human or an AI. */
export type Player = {
  readonly id: number;
  readonly name: string;
  /** Colour of flags and borders, as 0xRRGGBB. */
  readonly color: number;
  readonly human: boolean;
  gold: number;
  taxLevel: TaxLevel;
  ledger: Ledger;
  /** Buildings the player may build. */
  unlocked: BuildingKind[];
  stats: GameStats;
  research: ResearchState;
  /** How the world sees this player, with its reasons. */
  reputation: Modifier[];
  /** The AI's mind, or null for the human. */
  ai: AiState | null;
  /** False once the player has neither islands nor ships. */
  alive: boolean;
};

/** The treaties two players can sign. */
export type Treaty = "trade" | "pact" | "alliance";

/** How two players stand with each other. */
export type Relation = {
  /** The lower player id. */
  readonly a: number;
  /** The higher player id. */
  readonly b: number;
  war: boolean;
  trade: boolean;
  pact: boolean;
  alliance: boolean;
  /** Game second of the last change of war or peace. */
  since: number;
  /** Things remembered, fading over time. */
  memory: Modifier[];
};

/** What one side hands over in a deal. */
export type Deal = {
  readonly gold: number;
  readonly good: GoodId | null;
  readonly amount: number;
};

/** What one player can propose to another. */
export type DiplomacyAction =
  | { readonly type: "propose"; readonly treaty: Treaty }
  | { readonly type: "cancel"; readonly treaty: Treaty }
  | { readonly type: "war" }
  | { readonly type: "peace" }
  | { readonly type: "gift"; readonly give: Deal }
  | { readonly type: "demand"; readonly take: Deal }
  | { readonly type: "trade"; readonly give: Deal; readonly take: Deal };

/** Why a proposal was taken or turned down. */
export type DiplomacyAnswer =
  | "accepted"
  | "friendship"
  | "fear"
  | "fair"
  | "warWeary"
  | "relationLow"
  | "notWorth"
  | "noGoods"
  | "noGold"
  | "atWar"
  | "pactActive"
  | "peaceful"
  | "confident"
  | "notAfraid"
  | "already"
  | "needPact"
  | "notAtWar"
  | "warlike"
  | "noTreaty"
  | "gone";

/** A proposal an AI made to the human, waiting for an answer. */
export type Offer = {
  readonly id: number;
  readonly from: number;
  readonly to: number;
  readonly action: DiplomacyAction;
  /** Game second it is withdrawn. */
  readonly expires: number;
};

/** One answered proposal, for the log. */
export type DiplomacyEntry = {
  readonly time: number;
  readonly from: number;
  readonly to: number;
  readonly action: DiplomacyAction;
  readonly accepted: boolean;
  readonly answer: DiplomacyAnswer;
};

/** The DiplomacyManager's state. */
export type DiplomacyState = {
  relations: Relation[];
  offers: Offer[];
  log: DiplomacyEntry[];
};

/** The kinds of mission. */
export type MissionKind =
  | "delivery"
  | "settle"
  | "production"
  | "trade"
  | "economy"
  | "diplomacy"
  | "rescue"
  | "build"
  /** Goods a faction needs, brought by ship into its harbour. */
  | "cargo"
  /** Pirate ships to sink for a people. */
  | "hunt"
  /** One ship to sink for the pirates. */
  | "sink";

/** Where a mission stands. */
export type MissionState =
  "offered" | "active" | "done" | "failed" | "expired" | "lost";

/** What fulfilling a mission brings. */
export type MissionReward = {
  readonly gold: number;
  readonly goods: Amounts;
  /** Relation gained with the giver. */
  readonly relation: number;
  /** Reputation gained. */
  readonly reputation: number;
};

/** One mission. */
export type Mission = {
  readonly id: number;
  readonly kind: MissionKind;
  /** The player who asks, or -1 for the crown. */
  readonly giver: number;
  /** The player it is offered to. */
  readonly taker: number;
  state: MissionState;
  /** 1 easy, 2 middling, 3 hard. */
  readonly difficulty: number;
  readonly offeredAt: number;
  /** Game second the offer is withdrawn. */
  readonly offerUntil: number;
  /** Seconds to fulfil it once accepted. */
  readonly duration: number;
  /** Game second it must be done by, once accepted. */
  deadline: number;
  readonly good: GoodId | null;
  readonly building: BuildingKind | null;
  /** The island concerned, or -1. */
  readonly island: number;
  /** The other player concerned, or -1. */
  readonly partner: number;
  readonly metric: "residents" | "gold" | null;
  /** Where castaways drift, for a rescue. */
  readonly x: number;
  readonly y: number;
  readonly goal: number;
  progress: number;
  /** The counter's value when it was accepted. */
  base: number;
  /** The ship that carries the castaways, or -1. */
  carrier: number;
  readonly reward: MissionReward;
  /** Least tier the taker's people must have reached to be offered it. */
  readonly minTier: number;
  /** Game second it ended, or 0. */
  endedAt: number;
  /**
   * The crown's order this mission belongs to: the id of the first offer.
   * Every player who takes the same order races for it.
   */
  readonly contract: number;
  /** Who fulfilled the order first, or -1. */
  wonBy: number;
  /** The ship to sink for a pirates' order, missing otherwise. */
  readonly target?: number;
};

/** The kinds of chance event. */
export type IncidentKind =
  | "fire"
  | "plague"
  | "storm"
  | "pirates"
  | "goodHarvest"
  | "badHarvest"
  // Events of the foreign peoples (owner: the faction).
  | "famine"
  | "epidemic"
  | "harbourStorm"
  | "caravan"
  | "aid"
  // Events of the pirates (owner: the band).
  | "gathering"
  | "treasure"
  | "demand"
  | "convoy"
  | "sighted"
  | "mutiny"
  // The natural disasters (owner: the island's owner, -1 for the sea).
  | DisasterKind;

/** The natural disasters. */
export type DisasterKind =
  "flood" | "drought" | "blizzard" | "locusts" | "tsunami";

/** Every kind of event a new game can switch off. */
export type EventOption =
  | "fire"
  | "plague"
  | "storm"
  | "badHarvest"
  | "goodHarvest"
  | "pirateRaids"
  | "factionEvents"
  | DisasterKind;

/** A disaster announced, raging or just over. */
export type Disaster = {
  readonly id: number;
  readonly kind: DisasterKind;
  /** The island it strikes, -1 for a blizzard over the whole map. */
  readonly island: number;
  /** Game second it was announced. */
  readonly warned: number;
  /** Game second it strikes. */
  readonly strikes: number;
  /** Game second it is over. */
  until: number;
  /**
   * Side of the island the water comes from - 0 north, 1 east, 2 south,
   * 3 west - for a storm tide and a tsunami; -1 for a river flood and the
   * other disasters.
   */
  readonly side: number;
  /** Tiles under water while a flood lasts, set when it strikes. */
  tiles: number[];
  /** Whether it has struck yet. */
  struck: boolean;
};

/** The disasters of a game and what they left behind. */
export type HazardState = {
  /** Disasters announced or raging. */
  disasters: Disaster[];
  /** Game second the dice are rolled next. */
  next: number;
  /** Per island, the game second until which no new disaster comes. */
  calm: Record<number, number>;
  /** Per player or faction, the game second until which none of its islands is struck. */
  rest: Record<number, number>;
  /** Per kind, the game second it last ended anywhere. */
  last: Partial<Record<DisasterKind, number>>;
  /** Per player, the disasters that struck them - the AI builds against them. */
  hit: Record<number, DisasterKind[]>;
  /** Per island, how well its fuel need was met lately, 0 to 1. */
  warmth: Record<number, number>;
};

/** A chance event that happened or still goes on. */
export type Incident = {
  readonly id: number;
  readonly kind: IncidentKind;
  readonly owner: number;
  readonly island: number;
  readonly at: number;
  until: number;
  readonly x: number;
  readonly y: number;
};

/** How hard a game is: the level chosen for a new game. */
export type Difficulty = "easy" | "normal" | "hard";

/** Choices made when the game began. */
export type GameSettings = {
  /** AI players, 0 to 3. */
  readonly aiCount: number;
  /** No wars and no pirate raids when true. */
  readonly peaceful: boolean;
  /**
   * Whether the world has foreign peoples and pirate bands on their own
   * islands; missing (as in older saves) means a world from before them.
   */
  readonly factions?: boolean;
  /**
   * Whether the guided start leads the human through the first tasks;
   * missing (as in older saves) counts as off.
   */
  readonly guided?: boolean;
  /**
   * Chance events and disasters switched off for this game; missing (as
   * in older saves) means every one is on.
   */
  readonly eventsOff?: readonly EventOption[];
  /**
   * Foreign peoples and pirate bands left out of this world (no home
   * island, no ships, no trade); missing means none is left out.
   */
  readonly culturesOff?: readonly CultureId[];
  /**
   * How hard the game is (the factors stand in `difficulty-data.ts`);
   * missing (as in older saves) means normal.
   */
  readonly difficulty?: Difficulty;
};

/** The tasks of the guided start, in their order. */
export type TutorialStepId =
  | "explore"
  | "settle"
  | "wood"
  | "road"
  | "planks"
  | "houses"
  | "fish"
  | "centre"
  | "grow"
  | "workers"
  | "cloth"
  | "tavern";

/** Where the human's guided start stands; saved with the game. */
export type TutorialState = {
  /** True while it leads and holds buildings back. */
  active: boolean;
  /** Index of the current task; the number of tasks once finished. */
  step: number;
  /** Game second each finished task was done, in order. */
  times: number[];
};

/** Everything about a running game. */
export type Game = {
  readonly world: World;
  readonly settings: GameSettings;
  /** Simulation steps done. */
  tick: number;
  /** Game seconds since the start. */
  time: number;
  rng: number;
  /** Everyone playing; index 0 is the human. */
  players: Player[];
  islands: IslandState[];
  buildings: Building[];
  nextId: number;
  /** Road per tile: 0 none, 1 a plain road, 2 a paved road. */
  roads: Uint8Array;
  /** Tiles whose trees were cleared, 1 where cleared. */
  cleared: Uint8Array;
  /** Building id + 1 per tile, 0 when free (derived). */
  occupancy: Int32Array;
  /** 1 where the island's owner may build (derived). */
  territory: Uint8Array;
  /** Per service kind, 1 where a house is in reach (derived). */
  coverage: Partial<Record<BuildingKind, Uint8Array>>;
  /** Share of needed workers present, per island and tier (derived). */
  labour: Record<number, number[]>;
  /** Carts planning to use each road tile (derived from the carts). */
  traffic: Uint16Array;
  /**
   * The way of each producer's carts, by building id (derived, not saved):
   * rebuilt with the other grids whenever buildings or roads change.
   */
  links: Map<number, Link>;
  carts: Cart[];
  ships: Ship[];
  /** Soldiers on land and aboard. */
  soldiers: Soldier[];
  /** The players' fleets. */
  fleets: Fleet[];
  routes: TradeRoute[];
  trader: TraderState;
  /** The trader's ship id, or -1 while away. */
  traderShip: number;
  weather: WeatherKind;
  /** Game second the weather changes next. */
  weatherUntil: number;
  diplomacy: DiplomacyState;
  missions: Mission[];
  /** Game second the next mission is offered. */
  nextMission: number;
  incidents: Incident[];
  /** Game second chance events are rolled next. */
  nextIncident: number;
  /** The natural disasters. */
  hazards: HazardState;
  /**
   * 1 on tiles under water in a flood (derived from
   * {@link HazardState.disasters}, not saved).
   */
  flooded: Uint8Array;
  /** The foreign peoples and pirate bands (none in older worlds). */
  factions: Faction[];
  events: GameEvent[];
  /** Grows on every change of buildings or roads, for the view. */
  version: number;
  /** Set when derived grids need rebuilding. */
  dirty: boolean;
  /** Endless gold and goods for the human while on. */
  cheat: boolean;
  /** Set once the cheat was ever on; such a game is not counted. */
  cheated: boolean;
  /** The human's gold when the cheat was switched on, given back when off. */
  goldBeforeCheat: number;
  /** The human's guided start (inactive when off, ended or finished). */
  tutorial: TutorialState;
  /**
   * The {@link Game.version} the guided start last looked at (derived, not
   * saved): a new version means the buildings or roads changed.
   */
  tutorialSeen: number;
};

/** Something a player asks the simulation to do. */
export type Command =
  | {
      readonly type: "build";
      readonly kind: BuildingKind;
      readonly x: number;
      readonly y: number;
      readonly rot: number;
    }
  | { readonly type: "road"; readonly tiles: readonly number[] }
  /** Paves plain road tiles (gold and stone per tile). */
  | { readonly type: "pave"; readonly tiles: readonly number[] }
  | { readonly type: "demolish"; readonly x: number; readonly y: number }
  | {
      readonly type: "relocate";
      readonly id: number;
      readonly x: number;
      readonly y: number;
      readonly rot: number;
    }
  | { readonly type: "pause"; readonly id: number; readonly paused: boolean }
  | { readonly type: "levelUp"; readonly id: number }
  | { readonly type: "repair"; readonly id: number }
  | {
      readonly type: "priority";
      readonly id: number;
      readonly priority: boolean;
    }
  | { readonly type: "tax"; readonly level: TaxLevel }
  | {
      readonly type: "moveShip";
      readonly ship: number;
      readonly x: number;
      readonly y: number;
    }
  | {
      readonly type: "transfer";
      readonly ship: number;
      readonly good: GoodId;
      readonly amount: number;
    }
  | {
      readonly type: "buildShip";
      readonly yard: number;
      readonly kind: ShipKind;
    }
  | {
      /** Cancels a ship order: index 0 the one on the slip, then the queue. */
      readonly type: "cancelShip";
      readonly yard: number;
      readonly index: number;
    }
  | {
      readonly type: "shipAttack";
      readonly ship: number;
      readonly target: number;
      readonly building: boolean;
    }
  | {
      /** Patrols from where the ship is to the point and back. */
      readonly type: "shipPatrol";
      readonly ship: number;
      readonly x: number;
      readonly y: number;
    }
  | {
      readonly type: "shipEscort";
      readonly ship: number;
      readonly escort: number;
    }
  | {
      readonly type: "fleetCreate";
      readonly name: string;
      readonly ships: readonly number[];
    }
  | { readonly type: "fleetDisband"; readonly fleet: number }
  | {
      readonly type: "fleetMove";
      readonly fleet: number;
      readonly x: number;
      readonly y: number;
    }
  | {
      readonly type: "order";
      readonly island: number;
      readonly good: GoodId;
      readonly order: TradeOrder | null;
    }
  | {
      readonly type: "routeCreate";
      readonly name: string;
      readonly stops: readonly RouteStop[];
    }
  | {
      readonly type: "routeUpdate";
      readonly route: number;
      readonly stops: readonly RouteStop[];
      readonly active: boolean;
    }
  | { readonly type: "routeDelete"; readonly route: number }
  | {
      readonly type: "assign";
      readonly ship: number;
      readonly route: number | null;
    }
  | {
      readonly type: "diplomacy";
      readonly to: number;
      readonly action: DiplomacyAction;
      /** The island goods come from or go to. */
      readonly island: number;
    }
  | {
      readonly type: "answer";
      readonly offer: number;
      readonly accept: boolean;
      readonly island: number;
    }
  | { readonly type: "research"; readonly research: ResearchId | null }
  | {
      readonly type: "train";
      readonly barracks: number;
      readonly unit: UnitKind;
      readonly count: number;
    }
  | {
      /** Cancels a unit in training (index 0) or waiting in the queue. */
      readonly type: "cancelTraining";
      readonly barracks: number;
      readonly index: number;
    }
  | {
      readonly type: "pauseTraining";
      readonly barracks: number;
      readonly paused: boolean;
    }
  | {
      /** Units go for an enemy unit, building or ship near the shore. */
      readonly type: "unitAttack";
      readonly soldiers: readonly number[];
      readonly target: {
        readonly kind: "soldier" | "building" | "ship";
        readonly id: number;
      };
    }
  | {
      readonly type: "unitPatrol";
      readonly soldiers: readonly number[];
      readonly x: number;
      readonly y: number;
    }
  | { readonly type: "unitHold"; readonly soldiers: readonly number[] }
  | { readonly type: "unitRetreat"; readonly soldiers: readonly number[] }
  | {
      readonly type: "formation";
      readonly soldiers: readonly number[];
      readonly formation: Formation;
    }
  | {
      /** Soldiers on the coast the ship lies off go aboard. */
      readonly type: "embark";
      readonly ship: number;
      /** Only these soldiers; all waiting there when left out. */
      readonly soldiers?: readonly number[];
    }
  | {
      /** Soldiers on land walk to a tile of their island. */
      readonly type: "march";
      readonly soldiers: readonly number[];
      readonly x: number;
      readonly y: number;
    }
  | {
      readonly type: "land";
      readonly ship: number;
      readonly island: number;
    }
  | { readonly type: "missionAccept"; readonly mission: number }
  | { readonly type: "missionDecline"; readonly mission: number }
  | {
      readonly type: "missionDeliver";
      readonly mission: number;
      readonly island: number;
    }
  | {
      /** Ends the guided start for good; everything opens as usual. */
      readonly type: "tutorialEnd";
    }
  | {
      /** Trade, diplomacy and deals with a foreign people or pirates. */
      readonly type: "faction";
      /** The faction's id. */
      readonly faction: number;
      readonly action: FactionAction;
      /** The player's island goods come from, where it matters. */
      readonly island: number;
    };

/** A command together with the player who gives it. */
export type PlayerCommand = Command & { readonly player: number };

/** What a command achieved: ok, or why not. */
export type CommandResult =
  { readonly ok: true } | { readonly ok: false; readonly reason: string };
