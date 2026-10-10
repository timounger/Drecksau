/**
 * The cases, in the order they are offered.
 *
 * @module
 * @remarks
 * Each case is its own file in ../levels, drawn after the printed page it
 * comes from (`game_instructions/Murdoku/<Difficulty>/<Name>.png`, with the
 * solution sheet beside it). Every one is checked with the solver in ./rules:
 * exactly one solution, and the same as on the sheet (`npm run murdoku`
 * runs the check, see scripts/murdoku-check.ts).
 */
import { A_WALK_IN_THE_PARK } from "../levels/a-walk-in-the-park";
import { CAR_REPAIR } from "../levels/car-repair";
import { NETFLIX_AND_KILL } from "../levels/netflix-and-kill";
import { PREPPERS } from "../levels/preppers";
import { SLEEPING_WITH_THE_FISHES } from "../levels/sleeping-with-the-fishes";
import { SUMMER_ISLES } from "../levels/summer-isles";
import { THE_ART_SCHOOL } from "../levels/the-art-school";
import { THE_BACKYARD_GARDEN } from "../levels/the-backyard-garden";
import { THE_BOTANICAL_GARDEN } from "../levels/the-botanical-garden";
import { THE_COURTROOM } from "../levels/the-courtroom";
import { THE_GOLF_COURSE } from "../levels/the-golf-course";
import { THE_HIKING_TRIP } from "../levels/the-hiking-trip";
import { THE_MOVIE_STUDIO } from "../levels/the-movie-studio";
import { THE_MYSTERY_ISLANDS } from "../levels/the-mystery-islands";
import { THE_ZOO } from "../levels/the-zoo";
import type { Difficulty, Level } from "./types";

/** Every case, easiest first. */
export const LEVELS: readonly Level[] = [
  // Easy
  SUMMER_ISLES,
  CAR_REPAIR,
  NETFLIX_AND_KILL,
  A_WALK_IN_THE_PARK,
  THE_BACKYARD_GARDEN,
  THE_COURTROOM,
  // Medium
  PREPPERS,
  THE_ART_SCHOOL,
  // Hard
  SLEEPING_WITH_THE_FISHES,
  THE_HIKING_TRIP,
  THE_BOTANICAL_GARDEN,
  // Expert
  THE_MOVIE_STUDIO,
  THE_ZOO,
  THE_GOLF_COURSE,
  THE_MYSTERY_ISLANDS,
];

/** The difficulties, easiest first. */
export const DIFFICULTY_ORDER: readonly Difficulty[] = [
  "easy",
  "medium",
  "hard",
  "expert",
];
