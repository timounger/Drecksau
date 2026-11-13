/**
 * The TimeManager: the fixed simulation step, the time of day, the seasons
 * and the weather, and what they do to the economy.
 *
 * @module
 */
import { nextRandom, randomRange } from "./random";
import type { Game, Season, WeatherKind } from "./types";

/** Game seconds per simulation step. */
export const TICK = 0.1;

/** Game seconds in one day. */
export const DAY_SECONDS = 240;

/** Days in one season. */
export const SEASON_DAYS = 2;

/** The seasons in order. */
export const SEASONS: readonly Season[] = [
  "spring",
  "summer",
  "autumn",
  "winter",
];

/** How fields, pastures and vineyards grow per season. */
/* eslint-disable @typescript-eslint/no-magic-numbers -- seasonal factors */
export const CROP_FACTOR: Readonly<Record<Season, number>> = {
  spring: 1,
  summer: 1.2,
  autumn: 1.05,
  winter: 0.45,
};

/** How the sea gives fish per season. */
export const SEA_FACTOR: Readonly<Record<Season, number>> = {
  spring: 1,
  summer: 1.1,
  autumn: 1,
  winter: 0.8,
};

/** How each weather changes crops, fishing and sailing. */
export const WEATHER_EFFECT: Readonly<
  Record<WeatherKind, { crop: number; sea: number; ships: number }>
> = {
  clear: { crop: 1, sea: 1, ships: 1 },
  rain: { crop: 1.1, sea: 0.95, ships: 0.95 },
  fog: { crop: 1, sea: 0.9, ships: 0.8 },
  storm: { crop: 0.9, sea: 0.5, ships: 0.6 },
};

/** Chances of each weather per season (clear, rain, fog, storm). */
const WEATHER_ODDS: Readonly<Record<Season, readonly number[]>> = {
  spring: [0.55, 0.3, 0.1, 0.05],
  summer: [0.7, 0.15, 0.05, 0.1],
  autumn: [0.4, 0.3, 0.2, 0.1],
  winter: [0.45, 0.15, 0.25, 0.15],
};

/** How long a weather lasts, in game seconds. */
const WEATHER_MIN = 70;
const WEATHER_MAX = 200;

/** The day starts at morning, so a new game does not open at night. */
export const DAY_OFFSET = 0.3;
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** The weathers in the order of the odds. */
const WEATHERS: readonly WeatherKind[] = ["clear", "rain", "fog", "storm"];

/**
 * Time of day as a fraction: 0 midnight, 0.5 noon.
 *
 * @param time - game seconds
 * @returns 0 to 1
 */
export function dayFraction(time: number): number {
  return (time / DAY_SECONDS + DAY_OFFSET) % 1;
}

/**
 * The day number, from 1.
 *
 * @param time - game seconds
 * @returns the day
 */
export function dayNumber(time: number): number {
  return Math.floor(time / DAY_SECONDS + DAY_OFFSET) + 1;
}

/**
 * The season at a time.
 *
 * @param time - game seconds
 * @returns the season
 */
export function seasonAt(time: number): Season {
  const day = Math.floor(time / DAY_SECONDS + DAY_OFFSET);
  return SEASONS[Math.floor(day / SEASON_DAYS) % SEASONS.length];
}

/**
 * How far into the season, 0 to 1 - the view fades between seasons.
 *
 * @param time - game seconds
 * @returns 0 to 1
 */
export function seasonProgress(time: number): number {
  const days = time / DAY_SECONDS + DAY_OFFSET;
  return (days % SEASON_DAYS) / SEASON_DAYS;
}

/**
 * The year, from 1.
 *
 * @param time - game seconds
 * @returns the year
 */
export function yearNumber(time: number): number {
  const days = Math.floor(time / DAY_SECONDS + DAY_OFFSET);
  return Math.floor(days / (SEASON_DAYS * SEASONS.length)) + 1;
}

/**
 * Advances day and weather by one step and reports changes.
 *
 * @param game - the game
 */
export function stepTime(game: Game): void {
  const before = seasonAt(game.time);
  game.time += TICK;
  game.tick += 1;
  const season = seasonAt(game.time);
  if (season !== before) {
    game.events.push({ type: "season", season });
  }
  if (game.time >= game.weatherUntil) {
    const odds = WEATHER_ODDS[season];
    let roll = nextRandom(game);
    let chosen: WeatherKind = "clear";
    let found = false;
    WEATHERS.forEach((kind, index) => {
      if (!found && roll < odds[index]) {
        chosen = kind;
        found = true;
      }
      roll -= odds[index];
    });
    if (chosen !== game.weather) {
      game.events.push({ type: "weather", weather: chosen });
    }
    game.weather = chosen;
    game.weatherUntil = game.time + randomRange(game, WEATHER_MIN, WEATHER_MAX);
  }
}
