/**
 * The foreign peoples and pirate bands as data: names, rulers, colours,
 * character, what their fixed works make and their people use, what they
 * buy and sell, their ships, and the art they teach their friends.
 *
 * @module
 * @remarks
 * Everything here is made up for this game. A faction's goods only come
 * from its own works (the rates below) and from trade - nothing appears
 * from nothing. Its gold comes from its people (`income`) and from trade.
 */
import type {
  CultureId,
  FactionKind,
  GoodId,
  RelationReason,
  ShipKind,
} from "./types";

/** The owner ids of the factions, below the trader (-1). */
export const FACTION_ID: Readonly<Record<CultureId, number>> = {
  crows: -2,
  qasirah: -3,
  shogunara: -4,
  valdoria: -5,
  skeld: -6,
  blackreef: -7,
};

/** The peoples, in the order a world places them. */
export const NATIONS: readonly CultureId[] = [
  "qasirah",
  "shogunara",
  "valdoria",
  "skeld",
];

/** The pirate bands, in the order a world places them. */
export const PIRATE_BANDS: readonly CultureId[] = ["crows", "blackreef"];

/** What a faction's friendship can teach a player. */
export type Perk = "perfumery" | "lacquer" | "charter" | "knarr" | null;

/** A rate of a good, per minute. */
export type GoodRate = { readonly good: GoodId; readonly perMinute: number };

/** How strongly a culture reacts to what happens, by reason (1 = normal). */
export type Temper = Partial<Record<RelationReason, number>>;

/** The fixed facts about one faction. */
export type CultureDef = {
  readonly id: CultureId;
  readonly kind: FactionKind;
  /** The realm's name. */
  readonly name: string;
  /** The home island's name. */
  readonly island: string;
  /** The ruler at the start. */
  readonly leader: string;
  /** Flag and ship colour, 0xRRGGBB. */
  readonly color: number;
  /** A second colour for crests and roofs. */
  readonly accent: number;
  /** Where its opinion of everyone starts. */
  readonly base: number;
  /** Below this opinion it refuses to trade at all. */
  readonly tradeFloor: number;
  /** How strongly it takes things, by reason. */
  readonly temper: Temper;
  /** What its fixed works make. */
  readonly produces: readonly GoodRate[];
  /** What its people and works use up. */
  readonly consumes: readonly GoodRate[];
  /** What it sells (its own goods and loot). */
  readonly sells: readonly GoodId[];
  /** What it buys at a good price. */
  readonly wants: readonly GoodId[];
  /** True when it also buys any other surplus, at a lower price. */
  readonly buysSurplus: boolean;
  /** How strongly its prices swing with stock (the trader's is 0.6). */
  readonly swing: number;
  /** Gold at the start and per minute from its people. */
  readonly gold: number;
  readonly income: number;
  /** Ships it keeps: traders and guards (or raiders). */
  readonly merchants: number;
  readonly guards: number;
  readonly merchantKind: ShipKind;
  readonly guardKind: ShipKind;
  /** What it teaches its friends, and what the lesson costs. */
  readonly perk: Perk;
  readonly perkGold: number;
  /** The least opinion for the lesson. */
  readonly perkOpinion: number;
  /** Whether it sends war ships to help its friends. */
  readonly helps: boolean;
  /**
   * How many times stronger a player must be before it pays a demand for
   * gold (less for a friend, more for a foe); pirates are never asked.
   */
  readonly demandFear: number;
};

/** Opinion at which a faction is friendly. */
export const FRIENDLY = 20;

/** Opinion at which a faction is allied. */
export const ALLIED = 60;

/** Every faction. */
export const CULTURES: readonly CultureDef[] = [
  {
    id: "qasirah",
    kind: "nation",
    name: "Sultanat von Qasirah",
    island: "Qasirah",
    leader: "Sultanin Nadira",
    color: 0x16a39b,
    accent: 0xd8b04a,
    base: 10,
    tradeFloor: -60,
    temper: { trade: 1.5, piracy: 1.5, pirateHunt: 1.2 },
    produces: [
      { good: "spices", perMinute: 6 },
      { good: "silk", perMinute: 3 },
      { good: "perfume", perMinute: 1 },
    ],
    consumes: [
      { good: "planks", perMinute: 1.6 },
      { good: "tools", perMinute: 0.8 },
      { good: "glass", perMinute: 0.6 },
      { good: "jewelry", perMinute: 0.25 },
      { good: "instruments", perMinute: 0.25 },
      { good: "fish", perMinute: 1.5 },
      { good: "bread", perMinute: 1 },
    ],
    sells: ["spices", "silk", "perfume"],
    wants: [
      "planks",
      "wood",
      "tools",
      "glass",
      "jewelry",
      "instruments",
      "fish",
      "bread",
      "iron",
    ],
    buysSurplus: false,
    swing: 0.6,
    gold: 24000,
    income: 320,
    merchants: 2,
    guards: 1,
    merchantKind: "galleon",
    guardKind: "frigate",
    perk: "perfumery",
    perkGold: 2500,
    perkOpinion: FRIENDLY,
    helps: false,
    demandFear: 1.5,
  },
  {
    id: "shogunara",
    kind: "nation",
    name: "Kaiserreich von Shogunara",
    island: "Shogunara",
    leader: "Kaiserin Sayaka",
    color: 0x8e2a6b,
    accent: 0xe8e2d2,
    base: 0,
    tradeFloor: -20,
    temper: { contract: 2, breach: 2, attacked: 1.5, mission: 1.3 },
    produces: [
      { good: "tea", perMinute: 6 },
      { good: "porcelain", perMinute: 3 },
      { good: "silk", perMinute: 1.5 },
    ],
    consumes: [
      { good: "iron", perMinute: 1.2 },
      { good: "weapons", perMinute: 0.5 },
      { good: "cannons", perMinute: 0.2 },
      { good: "planks", perMinute: 1.2 },
      { good: "fish", perMinute: 1.5 },
      { good: "grain", perMinute: 1.5 },
    ],
    sells: ["tea", "porcelain", "silk"],
    wants: [
      "iron",
      "weapons",
      "cannons",
      "planks",
      "wood",
      "fish",
      "grain",
      "tools",
    ],
    buysSurplus: false,
    swing: 0.5,
    gold: 20000,
    income: 260,
    merchants: 1,
    guards: 3,
    merchantKind: "hulk",
    guardKind: "frigate",
    perk: "lacquer",
    perkGold: 3000,
    perkOpinion: FRIENDLY,
    helps: true,
    demandFear: 2.5,
  },
  {
    id: "valdoria",
    kind: "nation",
    name: "Handelsrepublik Valdoria",
    island: "Valdoria",
    leader: "Dogin Livia Morosetti",
    color: 0xe07a2a,
    accent: 0xb3402a,
    base: 5,
    tradeFloor: -60,
    temper: { trade: 2, contract: 1.3, breach: 1.5 },
    produces: [
      { good: "wine", perMinute: 5 },
      { good: "glass", perMinute: 3 },
      { good: "oliveOil", perMinute: 5 },
      { good: "furniture", perMinute: 1.5 },
    ],
    consumes: [
      { good: "wood", perMinute: 2 },
      { good: "planks", perMinute: 1 },
      { good: "bricks", perMinute: 1.2 },
      { good: "stone", perMinute: 1 },
      { good: "grain", perMinute: 1.5 },
      { good: "wool", perMinute: 1 },
      { good: "cloth", perMinute: 0.8 },
    ],
    sells: ["wine", "glass", "oliveOil", "furniture"],
    wants: [
      "wood",
      "planks",
      "bricks",
      "stone",
      "grain",
      "wool",
      "cloth",
      "clothing",
      "tools",
    ],
    buysSurplus: true,
    swing: 0.85,
    gold: 30000,
    income: 380,
    merchants: 3,
    guards: 1,
    merchantKind: "hulk",
    guardKind: "frigate",
    perk: "charter",
    perkGold: 0,
    perkOpinion: ALLIED,
    helps: false,
    demandFear: 1.8,
  },
  {
    id: "skeld",
    kind: "nation",
    name: "Nordlande von Skeld",
    island: "Skeld",
    leader: "Jarl Ragnhild",
    color: 0x5b7391,
    accent: 0xcfd6dd,
    base: 0,
    tradeFloor: -40,
    temper: { pirateHunt: 2, support: 1.5, trade: 1 },
    produces: [
      { good: "furs", perMinute: 4 },
      { good: "fish", perMinute: 8 },
      { good: "wool", perMinute: 5 },
      { good: "iron", perMinute: 3 },
      { good: "ropes", perMinute: 5 },
    ],
    consumes: [
      { good: "grain", perMinute: 2 },
      { good: "bread", perMinute: 1 },
      { good: "beer", perMinute: 1.2 },
      { good: "wine", perMinute: 0.5 },
      { good: "clothing", perMinute: 0.6 },
      { good: "tools", perMinute: 0.6 },
    ],
    sells: ["furs", "fish", "wool", "iron", "ropes"],
    wants: [
      "grain",
      "bread",
      "beer",
      "wine",
      "clothing",
      "cloth",
      "tools",
      "bricks",
    ],
    buysSurplus: false,
    swing: 0.55,
    gold: 14000,
    income: 180,
    merchants: 1,
    guards: 2,
    merchantKind: "knarr",
    guardKind: "warship",
    perk: "knarr",
    perkGold: 2000,
    perkOpinion: FRIENDLY,
    helps: true,
    demandFear: 2.5,
  },
  {
    id: "crows",
    kind: "pirates",
    name: "Piraten von Krähenfels",
    island: "Krähenfels",
    leader: "Kapitän Brack Rabenauge",
    color: 0x151515,
    accent: 0xe8e4da,
    base: -25,
    tradeFloor: -60,
    temper: { protection: 1, pirateHunt: 1.5, attacked: 1.2 },
    produces: [
      { good: "rum", perMinute: 4 },
      { good: "fish", perMinute: 3 },
      { good: "planks", perMinute: 2 },
    ],
    consumes: [
      { good: "fish", perMinute: 1.5 },
      { good: "bread", perMinute: 0.8 },
      { good: "beer", perMinute: 0.6 },
      { good: "wine", perMinute: 0.4 },
      { good: "rum", perMinute: 1 },
    ],
    sells: ["rum", "treasureMap"],
    wants: [
      "weapons",
      "cannons",
      "tools",
      "wood",
      "planks",
      "bread",
      "beer",
      "wine",
    ],
    buysSurplus: false,
    swing: 0.7,
    gold: 6000,
    income: 140,
    merchants: 0,
    guards: 3,
    merchantKind: "pirateBoat",
    guardKind: "pirateBoat",
    perk: null,
    perkGold: 0,
    perkOpinion: ALLIED,
    helps: false,
    demandFear: 0,
  },
  {
    id: "blackreef",
    kind: "pirates",
    name: "Bruderschaft vom Schwarzriff",
    island: "Schwarzriff",
    leader: "Kapitänin Ysolde Riffzahn",
    color: 0x5c1a1a,
    accent: 0xd9c9a3,
    base: -30,
    tradeFloor: -60,
    temper: { protection: 0.8, pirateHunt: 1.5, attacked: 1.4 },
    produces: [
      { good: "rum", perMinute: 3 },
      { good: "fish", perMinute: 3 },
      { good: "planks", perMinute: 2 },
    ],
    consumes: [
      { good: "fish", perMinute: 1.5 },
      { good: "bread", perMinute: 0.6 },
      { good: "rum", perMinute: 1 },
      { good: "beer", perMinute: 0.6 },
    ],
    sells: ["rum", "treasureMap"],
    wants: [
      "weapons",
      "cannons",
      "tools",
      "planks",
      "bread",
      "beer",
      "wine",
      "clothing",
    ],
    buysSurplus: false,
    swing: 0.7,
    gold: 5000,
    income: 110,
    merchants: 0,
    guards: 2,
    merchantKind: "pirateBoat",
    guardKind: "pirateBoat",
    perk: null,
    perkGold: 0,
    perkOpinion: ALLIED,
    helps: false,
    demandFear: 0,
  },
];

/** Looking a culture up. */
export const CULTURE: Readonly<Record<CultureId, CultureDef>> =
  Object.fromEntries(CULTURES.map((def) => [def.id, def])) as Record<
    CultureId,
    CultureDef
  >;

/** The pirate ships, weakest first, with what one costs the band. */
export const PIRATE_CLASSES: readonly {
  readonly kind: ShipKind;
  readonly gold: number;
  readonly planks: number;
  readonly cannons: number;
  /** At most this many at once. */
  readonly most: number;
}[] = [
  { kind: "pirateBoat", gold: 900, planks: 14, cannons: 0, most: 4 },
  { kind: "corvette", gold: 2200, planks: 28, cannons: 2, most: 3 },
  { kind: "pirateFrigate", gold: 4200, planks: 44, cannons: 6, most: 2 },
  { kind: "pirateWarship", gold: 8000, planks: 70, cannons: 12, most: 1 },
];

/** Gold a people pays to replace a lost ship of a kind. */
export const NATION_SHIP_GOLD = 3000;

/** Rulers who can take over a pirate band in a mutiny. */
export const CAPTAINS: readonly string[] = [
  "Kapitän Hagen Sturmzahn",
  "Kapitänin Mira Kielschwert",
  "Kapitän Jorin Salzbart",
  "Kapitänin Tilda Dreizack",
];

/**
 * The exotic wants of the residents: goods of the foreign peoples (and the
 * pirates' rum) that each tier enjoys on top of its needs. Having them
 * lifts satisfaction and makes rising easier; lacking them costs nothing.
 */
export const EXOTIC_WANTS: readonly (readonly {
  readonly good: GoodId;
  readonly rate: number;
}[])[] = [
  [],
  [{ good: "rum", rate: 0.02 }],
  [
    { good: "rum", rate: 0.02 },
    { good: "spices", rate: 0.015 },
    { good: "furs", rate: 0.01 },
  ],
  [
    { good: "spices", rate: 0.015 },
    { good: "tea", rate: 0.015 },
    { good: "oliveOil", rate: 0.015 },
    { good: "furs", rate: 0.01 },
  ],
  [
    { good: "tea", rate: 0.015 },
    { good: "oliveOil", rate: 0.015 },
    { good: "silk", rate: 0.01 },
    { good: "porcelain", rate: 0.01 },
  ],
  [
    { good: "silk", rate: 0.012 },
    { good: "porcelain", rate: 0.012 },
    { good: "furniture", rate: 0.008 },
    { good: "perfume", rate: 0.008 },
  ],
  [
    { good: "silk", rate: 0.014 },
    { good: "porcelain", rate: 0.014 },
    { good: "furniture", rate: 0.01 },
    { good: "perfume", rate: 0.01 },
  ],
];

/** Satisfaction a house gains with its exotic wants fully met. */
export const EXOTIC_MOOD = 0.12;

/** With exotic wants met at least this well a house rises more easily... */
export const EXOTIC_EASE_FROM = 0.5;

/** ...needing each need only this well instead of the usual. */
export const EXOTIC_RISE_NEED = 0.6;

/** Armour the lacquer refit of Shogunara adds to every ship. */
export const LACQUER_ARMOUR = 0.1;

/** Armour never goes above this. */
export const MAX_ARMOUR = 0.75;

/** Share of the price Valdoria's charter takes off and adds to deals. */
export const CHARTER_SHARE = 0.12;
