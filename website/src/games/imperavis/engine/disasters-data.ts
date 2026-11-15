/**
 * The numbers of the natural disasters in one place - flood, drought,
 * blizzard, locusts and tsunami: when they may come, how long they warn and
 * last, what they do and how much each protection keeps off - and which
 * events a game may switch off.
 *
 * @module
 * @remarks
 * The rules live in `disasters.ts`; the tables in the rules document are
 * taken from here.
 */
import type {
  BuildingKind,
  CultureId,
  DisasterKind,
  EventOption,
  GameSettings,
  GoodId,
} from "./types";

/** The disasters in the order they are rolled. */
export const DISASTER_KINDS: readonly DisasterKind[] = [
  "flood",
  "drought",
  "locusts",
  "tsunami",
  "blizzard",
];

/** Every event a game may switch off, in the order of the menu. */
export const EVENT_OPTIONS: readonly EventOption[] = [
  "fire",
  "plague",
  "storm",
  "badHarvest",
  "goodHarvest",
  "pirateRaids",
  "factionEvents",
  ...DISASTER_KINDS,
];

/** The pirate bands; the menu has one switch for both. */
export const PIRATE_CULTURES: readonly CultureId[] = ["crows", "blackreef"];

/** No disaster comes before this game second (20 minutes)... */
export const DISASTERS_FROM = 1200;

/** ...and the dice are rolled this often after that, seconds. */
export const DISASTER_ROLL = 60;

/** An island hit by a disaster is spared this long after it ends, seconds. */
export const ISLAND_CALM = 900;

/** A player hit by a disaster is spared on all islands this long, seconds. */
export const PLAYER_CALM = 600;

/** Seconds between the end of a kind of disaster and the next of its kind. */
export const KIND_CALM: Readonly<Record<DisasterKind, number>> = {
  flood: 300,
  drought: 600,
  locusts: 600,
  tsunami: 1500,
  blizzard: 420,
};

/** Chance per roll and island of each disaster (the blizzard: per roll). */
export const DISASTER_CHANCE: Readonly<Record<DisasterKind, number>> = {
  flood: 0.025,
  drought: 0.06,
  locusts: 0.015,
  tsunami: 0.005,
  blizzard: 0.15,
};

/** Seconds between the warning and the blow. */
export const WARNING_SECONDS: Readonly<Record<DisasterKind, number>> = {
  flood: 30,
  drought: 45,
  locusts: 20,
  tsunami: 25,
  blizzard: 30,
};

/** Seconds a disaster rages once it struck. */
export const DISASTER_SECONDS: Readonly<Record<DisasterKind, number>> = {
  flood: 120,
  drought: 300,
  locusts: 60,
  tsunami: 6,
  blizzard: 150,
};

/** The protection buildings and the disasters each keeps off. */
export const PROTECTION: Readonly<
  Partial<Record<BuildingKind, readonly DisasterKind[]>>
> = {
  dike: ["flood", "tsunami"],
  pumpStation: ["flood"],
  irrigation: ["drought"],
  breakwater: ["tsunami"],
};

/** The protection kinds. */
export const PROTECTION_KINDS: readonly BuildingKind[] = Object.keys(
  PROTECTION,
) as BuildingKind[];

/** Land this close to a river floods when the river bursts its banks, tiles. */
export const RIVER_REACH = 2;

/** Low coast floods in a storm tide: land below this height... */
export const LOW_LAND = 1.3;

/** ...and at most this far from the sea, tiles. */
export const LOW_REACH = 3;

/** A tsunami hits land this far from the sea on its side, tiles. */
export const TSUNAMI_REACH = 5;

/** A tile lies on a side of its island within this angle of it (cosine). */
export const SIDE_SPREAD = 0.5;

/** Hit points a flooded building loses per second, as a share of the whole. */
export const FLOOD_DAMAGE = 0.003;

/** A flood never takes a building below this share of its hit points. */
export const FLOOD_FLOOR = 0.4;

/** A pump station drains the land in its reach this long after the blow, seconds. */
export const PUMP_DRAIN = 25;

/** Crops grow at this share in a drought... */
export const DROUGHT_CROPS = 0.35;

/** ...with a fountain in reach at this share... */
export const FOUNTAIN_CROPS = 0.6;

/** ...and watered fields as in any summer. */
export const IRRIGATED_CROPS = 1;

/** Share of an island's crop farms locusts eat bare. */
export const LOCUST_SHARE = 0.5;

/** Seconds a field eaten bare stays bare. */
export const LOCUST_BLIGHT = 240;

/** Share of the stored food the swarm eats, per good. */
export const LOCUST_EATS: Readonly<Partial<Record<GoodId, number>>> = {
  grain: 0.3,
  flour: 0.15,
  bread: 0.1,
};

/** A tsunami takes this share of the hit points of a harbour building... */
export const TSUNAMI_HARBOUR = 0.6;

/** ...and of any other building on its side of the coast. */
export const TSUNAMI_OTHER = 0.45;

/** A tsunami never takes a building below this share of its hit points. */
export const TSUNAMI_FLOOR = 0.15;

/** A dike in reach lets through this share of the wave. */
export const DIKE_WAVE = 0.5;

/** A breakwater in reach lets through this share of it at the harbour... */
export const BREAKWATER_HARBOUR = 0.15;

/** ...and this share elsewhere. */
export const BREAKWATER_OTHER = 0.4;

/** The harbour buildings a breakwater guards best. */
export const HARBOUR_KINDS: readonly BuildingKind[] = [
  "kontor",
  "shipyard",
  "fishery",
  "pearlDiver",
  "battery",
];

/** A struck kontor loses this share of every good to the sea. */
export const TSUNAMI_STOCK = 0.12;

/** Ships at the struck island's quay lose this share of their hit points... */
export const TSUNAMI_DOCKED = 0.4;

/** ...ships at sea close by this much... */
export const TSUNAMI_AT_SEA = 0.1;

/** ...within this many tiles of the island's middle. */
export const TSUNAMI_SEA_RANGE = 40;

/** A tsunami never sinks a ship: it leaves this share of its hit points. */
export const TSUNAMI_SHIP_FLOOR = 0.1;

/** In a blizzard carts drive plain roads at this share of the road pace... */
export const BLIZZARD_ROAD = 0.4;

/** ...paved roads at this share... */
export const BLIZZARD_PAVED = 0.6;

/** ...and open land at this share of its own pace. */
export const BLIZZARD_LAND = 0.85;

/** Ships sail at this share of their speed in a blizzard. */
export const BLIZZARD_SHIPS = 0.7;

/** Fuel a resident burns in a blizzard, units per minute. */
export const FUEL_RATE = 0.02;

/** The fuels, the first burnt first. */
export const FUELS = ["coal", "wood"] as const;

/** Missing fuel lowers the mood of a house by up to this much. */
export const COLD_MOOD = 0.3;

/** How quickly the remembered fuel supply follows the real one, per second. */
export const WARMTH_BLEND = 0.15;

/** Work of a faction's island while a disaster rages there, per kind. */
export const FACTION_WORK: Readonly<Record<DisasterKind, number>> = {
  flood: 0.6,
  drought: 0.5,
  locusts: 0.4,
  tsunami: 1,
  blizzard: 1,
};

/** A tsunami spoils this share of a faction's largest stocks... */
export const FACTION_WAVE_LOSS = 0.25;

/** ...of this many goods, and closes its harbour this long, seconds. */
export const FACTION_WAVE_GOODS = 3;
export const FACTION_WAVE_CLOSED = 90;

/** The AI builds at most this many of a protection kind per island. */
export const AI_PROTECTION_MOST: Readonly<
  Partial<Record<BuildingKind, number>>
> = {
  dike: 3,
  pumpStation: 1,
  irrigation: 2,
  breakwater: 1,
};

/**
 * Whether an event is on in a game.
 *
 * @param settings - the game's settings
 * @param option - the event
 * @returns true unless it was switched off
 */
export function eventOn(settings: GameSettings, option: EventOption): boolean {
  return !(settings.eventsOff ?? []).includes(option);
}

/**
 * Whether pirate raids happen in a game: not in a peaceful one, and not
 * when they were switched off.
 *
 * @param settings - the game's settings
 * @returns true when pirates may raid
 */
export function raidsOn(settings: GameSettings): boolean {
  return !settings.peaceful && eventOn(settings, "pirateRaids");
}

/**
 * Whether a people or pirate band has its island in a game.
 *
 * @param settings - the game's settings
 * @param culture - the people or band
 * @returns true unless it was left out
 */
export function cultureOn(settings: GameSettings, culture: CultureId): boolean {
  return !(settings.culturesOff ?? []).includes(culture);
}
