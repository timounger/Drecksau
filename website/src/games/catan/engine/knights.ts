/**
 * *Städte & Ritter*: what the expansion adds to the state, and the rules that
 * read only from it.
 *
 * @module
 * @remarks
 * Not a variant. It **replaces** parts of the printed game rather than sitting
 * beside them - no development cards, three dice instead of two, thirteen
 * victory points instead of ten, no Größte Rittermacht, and the second founding
 * placement is a city. So it is a mode: {@link CatanGame.mode} is `"ritter"`
 * for a whole game or it is not, and nothing here is combinable with itself.
 *
 * The full rules this is built from are written up in
 * `docs/games/catan/staedte-und-ritter.md`, read out of the rulebook PDF.
 * Everything with a number in it quotes that document.
 */
import type { Resource } from "./state";

/** The three Handelswaren, and which landscape makes each. */
export type Commodity = "papier" | "tuch" | "muenzen";

/** The three sorts, in the order the rulebook lists them. */
export const COMMODITIES: readonly Commodity[] = ["papier", "tuch", "muenzen"];

/** Handelswaren in hand, counted by sort. */
export type Goods = Readonly<Record<Commodity, number>>;

/** An empty set of Handelswaren. */
export const NO_GOODS: Goods = { papier: 0, tuch: 0, muenzen: 0 };

/**
 * Which Handelsware a city on each landscape produces.
 *
 * @remarks
 * "Für eine Stadt erhaltet ihr weiterhin 2 Karten, und zwar entweder bei den
 * Landschaftsfeldern Hügelland und Ackerland 2 Rohstoffe der jeweiligen
 * Landschaft **oder** bei den Landschaftsfeldern Wald, Weideland und Gebirge
 * 1 Rohstoff und 1 Handelsware." So three of the five landscapes pay a city in
 * two sorts, and the other two pay double as before - which is why this is a
 * lookup that returns null rather than a list of three.
 */
export const COMMODITY_OF: Readonly<Record<Resource, Commodity | null>> = {
  holz: "papier",
  wolle: "tuch",
  erz: "muenzen",
  lehm: null,
  getreide: null,
};

/** The three areas a city can be improved in. */
export type Track = "wissenschaft" | "handel" | "politik";

/** The tracks, in the order the tableau prints them. */
export const TRACKS: readonly Track[] = ["wissenschaft", "handel", "politik"];

/** Which Handelsware pays for each track. */
export const TRACK_GOODS: Readonly<Record<Track, Commodity>> = {
  wissenschaft: "papier",
  handel: "tuch",
  politik: "muenzen",
};

/** How far a track can be built. */
export const TOP_LEVEL = 5;

/** The level that hands out the permanent benefit. */
export const BENEFIT_LEVEL = 3;

/** The level that wins a metropolis. */
export const METRO_LEVEL = 4;

/**
 * What each step of each track is called.
 *
 * @remarks
 * Straight off the Fortschritt-Tableau, level 1 first. The names matter on
 * screen: people say "ich baue die Gilde", not "Handel Stufe 3".
 */
export const LEVEL_NAMES: Readonly<Record<Track, readonly string[]>> = {
  wissenschaft: ["Schule", "Bibliothek", "Aquädukt", "Theater", "Universität"],
  handel: ["Markt", "Zunft", "Gilde", "Bank", "Handelszentrum"],
  politik: ["Rathaus", "Botschaft", "Festung", "Gericht", "Rat Catans"],
};

/** German names of the three Handelswaren. */
export const COMMODITY_NAMES: Readonly<Record<Commodity, string>> = {
  papier: "Papier",
  tuch: "Tuch",
  muenzen: "Münzen",
};

/** German names of the three tracks. */
export const TRACK_NAMES: Readonly<Record<Track, string>> = {
  wissenschaft: "Wissenschaft",
  handel: "Handel",
  politik: "Politik",
};

/**
 * What the next step of a track costs.
 *
 * @param level - how far the track is built already, 0 to {@link TOP_LEVEL}
 * @returns how many of that track's Handelsware the next step takes
 * @remarks
 * "Der erste Stadtausbau eines Bereichs kostet immer 1 Handelsware der
 * dazugehörigen Sorte. Jeder zweite Stadtausbau eines Bereichs kostet immer 2
 * Handelswaren der dazugehörigen Sorte, jeder dritte 3 usw." So the price is
 * the level being bought, and nothing else.
 */
export function improveCost(level: number): number {
  return level + 1;
}

/**
 * The red die a track's level draws a Fortschrittskarte on.
 *
 * @param level - how far that track is built
 * @returns the highest red die that still draws, or 0 while nothing is built
 * @remarks
 * The tableau prints a die beside every step, and the rulebook's two worked
 * examples pin it down: level 1 is "die Würfelzahlen 1 und 2", and level 3
 * "zeigt eine +4" and draws on a rolled 3. So the condition is **level plus
 * one**, and a track still on "Stadt" never draws at all.
 */
export function drawLimit(level: number): number {
  return level === 0 ? 0 : level + 1;
}

/** The three strengths of knight. */
export const SIMPLE = 1;
export const STRONG = 2;
export const MIGHTY = 3;

/** The three strengths, weakest first. */
export const KNIGHT_LEVELS: readonly number[] = [SIMPLE, STRONG, MIGHTY];

/** How many of each strength a player owns. */
export const KNIGHTS_PER_LEVEL = 2;

/** What a knight on a crossing is. */
export type Knight = {
  readonly owner: number;
  /** 1 Einfacher, 2 Starker, 3 Mächtiger - and its strength in the fight. */
  readonly level: number;
  /** Wearing its helmet, and so able to act. */
  readonly active: boolean;
  /**
   * Activated this turn, and so not usable until the next one.
   *
   * @remarks
   * "Aktivierst du einen Ritter, darfst du diesen frühestens in deinem nächsten
   * Zug für eine Aktion einsetzen." Cleared when its owner's turn comes round.
   */
  readonly fresh: boolean;
  /** Already acted this turn, so it may not act again. */
  readonly spent: boolean;
};

/** German names of the three knight strengths. */
export const KNIGHT_NAMES: readonly string[] = [
  "Einfacher Ritter",
  "Starker Ritter",
  "Mächtiger Ritter",
];

/** How far the barbarian ship sails before it lands. */
export const BARBARIAN_STEPS = 7;

/** What a city wall costs, and how many one player may build. */
export const MAX_WALLS = 3;

/** How many extra cards each wall lets you keep after a seven. */
export const WALL_CARDS = 2;

/** Victory points needed to win a game of Städte & Ritter. */
export const RITTER_POINTS = 13;

/** What a metropolis adds to the city under it. */
export const METRO_POINTS = 2;

/** How many progress cards may be held face down. */
export const PROGRESS_LIMIT = 4;

/**
 * The faces of the event die.
 *
 * @remarks
 * The rulebook's text never states the distribution - the illustration on page
 * 6 shows the four *different* faces and not how often each appears. Three
 * ships and one of each symbol is the printed die, and it is the only number in
 * this module that is not quoted from the text; it is written here on one line
 * so it can be corrected in one place.
 */
export const EVENT_DIE: readonly ("schiff" | Track)[] = [
  "schiff",
  "schiff",
  "schiff",
  "wissenschaft",
  "handel",
  "politik",
];

/**
 * A metropolis: whose it is, and which of their cities carries it.
 *
 * @remarks
 * Both, in one place. The seat is what scores it; the crossing is what makes a
 * city unavailable to carry a second one. Kept as one record because two would
 * drift apart the first time a city changed hands.
 */
export type Metropolis = {
  readonly seat: number;
  readonly at: number;
};

/** How many of each Handelsware and improvement a fresh player has. */
export type Tableau = Readonly<Record<Track, number>>;

/** A tableau with nothing built. */
export const NO_TABLEAU: Tableau = { wissenschaft: 0, handel: 0, politik: 0 };

/** How many of a Handelsware a set holds. */
export function goodsSize(goods: Goods): number {
  return COMMODITIES.reduce((sum, sort) => sum + goods[sort], 0);
}

/** One more of a Handelsware, or one fewer. */
export function withGood(goods: Goods, sort: Commodity, count = 1): Goods {
  return { ...goods, [sort]: goods[sort] + count };
}
