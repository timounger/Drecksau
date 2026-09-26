/**
 * What this game counts about itself: the numbers of one city.
 *
 * @module
 * @remarks
 * **The shared statistics do not fit this game.** `lib/stats` counts what
 * every game in the collection has - games begun, games won, how long they
 * took - and that is the right set for a round of Skyjo. Los Santos is not a
 * round of anything: one does not win it, one lives in it, and "sixty per cent
 * won" says nothing about an afternoon spent driving about. What one actually
 * wants to know afterwards is how far one drove, how much was left standing
 * and how badly the police wanted one.
 *
 * So the general numbers stay where they are - time played and when it was
 * last touched are worth having - and everything else about this game is
 * counted here.
 *
 * **Counted, not stored per game.** These are totals over every afternoon: a
 * per-game list would be a diary, and nobody reads a diary of a game they are
 * still playing. The one button on the statistics page sets all of it to nought
 * again.
 */

/** Everything this game counts. Distances in city pixels, money in euros. */
export type CityStats = {
  /** How far the player has driven, in city pixels. */
  readonly driven: number;
  /** And how far on foot, swimming included - anything not in a machine. */
  readonly walked: number;
  /** Vehicles that stopped being vehicles. */
  readonly wrecked: number;
  /** Passers-by who went down. */
  readonly people: number;
  /** And policemen. */
  readonly cops: number;
  /** The highest wanted level ever reached, nought to six. */
  readonly stars: number;
  /** Every euro that was ever taken in, whatever became of it. */
  readonly earned: number;
  /** How often the police won. */
  readonly busted: number;
  /** And how often the city did. */
  readonly wasted: number;
  /** Jobs delivered, across all districts. */
  readonly jobs: number;
  /** The most districts held at one time, nought to four. */
  readonly districts: number;
};

/** Nothing has happened yet. */
export const EMPTY_CITY: CityStats = {
  driven: 0,
  walked: 0,
  wrecked: 0,
  people: 0,
  cops: 0,
  stars: 0,
  earned: 0,
  busted: 0,
  wasted: 0,
  jobs: 0,
  districts: 0,
};

/**
 * Two sets of numbers laid on top of each other.
 *
 * @param stats - what was counted before
 * @param more - what has happened since
 * @returns the two together
 * @remarks
 * **Most of them add up, three of them do not.** A record is not a sum: six
 * stars twice is still six stars, and holding three districts in one game and
 * two in the next is not five. Those take whichever is the larger, which is
 * what a record is.
 */
export function plusCity(stats: CityStats, more: CityStats): CityStats {
  return {
    driven: stats.driven + more.driven,
    walked: stats.walked + more.walked,
    wrecked: stats.wrecked + more.wrecked,
    people: stats.people + more.people,
    cops: stats.cops + more.cops,
    stars: Math.max(stats.stars, more.stars),
    earned: stats.earned + more.earned,
    busted: stats.busted + more.busted,
    wasted: stats.wasted + more.wasted,
    jobs: stats.jobs + more.jobs,
    districts: Math.max(stats.districts, more.districts),
  };
}

/** True when nothing has been counted at all. */
export function isEmptyCity(stats: CityStats): boolean {
  return Object.values(stats).every((value) => value === 0);
}

/**
 * Whether something read out of storage is a set of these numbers.
 *
 * @param value - whatever was stored
 * @returns true if every field is there and is a number
 */
export function isCityStats(value: unknown): value is CityStats {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const some = value as Record<string, unknown>;
  return Object.keys(EMPTY_CITY).every(
    (key) => typeof some[key] === "number" && Number.isFinite(some[key]),
  );
}

/**
 * A distance in city pixels, as kilometres.
 *
 * @param pixels - how far
 * @returns the same distance in kilometres
 * @remarks
 * **Ten pixels to the metre**, which is not measured but decided: a car in
 * this city is about forty pixels long, and a car is about four metres long.
 * Everything else follows from that - a block is a hundred metres across, the
 * whole city eight hundred metres square, and a drive across it is far enough
 * to be worth a number.
 */
export function asKm(pixels: number): number {
  return pixels / PX_PER_METRE / METRES_PER_KM;
}

/** How many pixels make a metre - see {@link asKm}. */
const PX_PER_METRE = 10;

/** And how many metres make a kilometre, which is not a decision. */
const METRES_PER_KM = 1000;
