/**
 * The cases, in the order they are offered.
 *
 * @module
 * @remarks
 * Each case is its own file in ../levels, drawn after the printed page it
 * comes from (`game_instructions/Murdoku/<Difficulty>/<Name>/`, with the
 * solution sheet or the official hints). Every one is checked with the solver
 * in ./rules: exactly one solution, and the same as the stored one (`npm run murdoku`
 * runs the check, see scripts/murdoku-check.ts).
 */
import { A_WALK_IN_THE_PARK } from "../levels/a-walk-in-the-park";
import { CAR_REPAIR } from "../levels/car-repair";
import { CITY_BUS } from "../levels/city-bus";
import { NETFLIX_AND_KILL } from "../levels/netflix-and-kill";
import { PAINTING_OUTDOORS } from "../levels/painting-outdoors";
import { PREPPERS } from "../levels/preppers";
import { SLEEPING_WITH_THE_FISHES } from "../levels/sleeping-with-the-fishes";
import { SUMMER_ISLES } from "../levels/summer-isles";
import { THE_ART_SCHOOL } from "../levels/the-art-school";
import { THE_BACKYARD_GARDEN } from "../levels/the-backyard-garden";
import { THE_BOTANICAL_GARDEN } from "../levels/the-botanical-garden";
import { THE_CARICATURE } from "../levels/the-caricature";
import { THE_COOKIE_THIEF } from "../levels/the-cookie-thief";
import { THE_COURTROOM } from "../levels/the-courtroom";
import { THE_GOLF_COURSE } from "../levels/the-golf-course";
import { THE_FLOWER_SHOP } from "../levels/the-flower-shop";
import { THE_HIKING_TRIP } from "../levels/the-hiking-trip";
import { THE_MOVIE_STUDIO } from "../levels/the-movie-studio";
import { THE_PICNIC } from "../levels/the-picnic";
import { THE_MYSTERY_ISLANDS } from "../levels/the-mystery-islands";
import { THE_ZOO } from "../levels/the-zoo";
import { THE_PIGSTY } from "../levels/the-pigsty";
import { BEACH_BONFIRE } from "../levels/beach-bonfire";
import { THE_RIDING_LESSON } from "../levels/the-riding-lesson";
import { THE_BEACH } from "../levels/the-beach";
import { THE_BUS_STOP } from "../levels/the-bus-stop";
import { THE_GARAGE_BAND } from "../levels/the-garage-band";
import { THE_PIANO_LESSON } from "../levels/the-piano-lesson";
import { A_HORSE_WITH_NO_NAME } from "../levels/a-horse-with-no-name";
import { MIDNIGHT_RAIN } from "../levels/midnight-rain";
import { FISHING_AT_THE_LAKE } from "../levels/fishing-at-the-lake";
import { THE_FRENCH_RESTAURANT } from "../levels/the-french-restaurant";
import { THE_TERRACOTTA_COURTYARD } from "../levels/the-terracotta-courtyard";
import { THE_RETIREMENT_VILLAGE } from "../levels/the-retirement-village";
import { NEIGHBOURHOOD_FEUD } from "../levels/neighbourhood-feud";
import { AN_UNEXPECTED_VISIT } from "../levels/an-unexpected-visit";
import { WHITE_WEDDING } from "../levels/white-wedding";
import { THE_REMOTE_VILLAGE } from "../levels/the-remote-village";
import { THE_DONUT_HOUSE } from "../levels/the-donut-house";
import { THE_ABANDONED_MUSEUM } from "../levels/the-abandoned-museum";
import { THE_PANIC_ROOM } from "../levels/the-panic-room";
import { THE_BOSS_OFFICE } from "../levels/the-boss-office";
import { THE_WINE_CELLAR } from "../levels/the-wine-cellar";
import { THE_RIVER_CROSSING } from "../levels/the-river-crossing";
import { THE_FRONTIER_TOWN } from "../levels/the-frontier-town";
import { A_DIRTY_BUSINESS } from "../levels/a-dirty-business";
import { GRIZZLY_NIGHT } from "../levels/grizzly-night";
import { MINI_GOLF } from "../levels/mini-golf";
import { MAIN_STREET } from "../levels/main-street";
import { HOLIDAY_SHOPPING } from "../levels/holiday-shopping";
import { THE_BANDIT_RAID } from "../levels/the-bandit-raid";
import { THE_ROADSIDE_INN } from "../levels/the-roadside-inn";
import { THE_WATER_WHEEL } from "../levels/the-water-wheel";
import { THE_FIRST_CASE } from "../levels/the-first-case";
import { THE_CATHEDRAL } from "../levels/the-cathedral";
import { THE_HOLIDAY_FLAT } from "../levels/the-holiday-flat";
import { ENGLISH_BREAKFAST } from "../levels/english-breakfast";
import { THE_CAFE } from "../levels/the-cafe";
import { THE_LAB } from "../levels/the-lab";
import { THE_LOCAL_BOOKSHOP } from "../levels/the-local-bookshop";
import { STUDY_SESSION } from "../levels/study-session";
import { FOUR_WINDOWS } from "../levels/four-windows";
import { BACKYARD_HOT_TUB } from "../levels/backyard-hot-tub";
import { DEMOLITION_ZONE } from "../levels/demolition-zone";
import { VISITING_AUNT_ELLEN } from "../levels/visiting-aunt-ellen";
import { THE_FAMILY_ESTATE } from "../levels/the-family-estate";
import { THE_SUPERMARKET } from "../levels/the-supermarket";
import { THE_OLD_TAVERN } from "../levels/the-old-tavern";
import { THE_BIRTHDAY_PARTY } from "../levels/the-birthday-party";
import { THE_POLICE_STATION } from "../levels/the-police-station";
import { DOOMSCROLLING } from "../levels/doomscrolling";
import { A_STUNNING_MANSION } from "../levels/a-stunning-mansion";
import { KING_SIZE_BEDS } from "../levels/king-size-beds";
import { THE_CLOTHING_STORE } from "../levels/the-clothing-store";
import { THE_LIBRARIANS_HOUSE } from "../levels/the-librarians-house";
import { THE_HAIR_SALON } from "../levels/the-hair-salon";
import { THE_GROCERY_STORE } from "../levels/the-grocery-store";
import { SEMI_DETACHED_HOUSE } from "../levels/semi-detached-house";
import { THE_ELECTRONICS_STORE } from "../levels/the-electronics-store";
import { FLIGHT_85 } from "../levels/flight-85";
import { KNOCKOUT } from "../levels/knockout";
import { RAINY_DAY } from "../levels/rainy-day";
import { GAME_NIGHT } from "../levels/game-night";
import { BEACH_RESTAURANT } from "../levels/beach-restaurant";
import { DELIVERY_24H } from "../levels/delivery-24h";
import { THE_BOOK_CLUB } from "../levels/the-book-club";
import { THE_TREASURE_HUNT } from "../levels/the-treasure-hunt";
import type { Difficulty, Level, Series } from "./types";

/** Every case, easiest first. */
export const LEVELS: readonly Level[] = [
  // Very easy
  DELIVERY_24H,
  CAR_REPAIR,
  THE_BOOK_CLUB,
  THE_PIGSTY,
  BEACH_BONFIRE,
  PAINTING_OUTDOORS,
  NETFLIX_AND_KILL,
  // Easy
  SUMMER_ISLES,
  A_WALK_IN_THE_PARK,
  THE_COURTROOM,
  CITY_BUS,
  THE_PICNIC,
  THE_FLOWER_SHOP,
  THE_BACKYARD_GARDEN,
  THE_BEACH,
  THE_BUS_STOP,
  THE_GARAGE_BAND,
  THE_PIANO_LESSON,
  THE_RIDING_LESSON,
  A_HORSE_WITH_NO_NAME,
  MIDNIGHT_RAIN,
  THE_BANDIT_RAID,
  THE_ROADSIDE_INN,
  THE_WATER_WHEEL,
  THE_FIRST_CASE,
  THE_CATHEDRAL,
  THE_HOLIDAY_FLAT,
  ENGLISH_BREAKFAST,
  THE_CAFE,
  THE_LAB,
  THE_LOCAL_BOOKSHOP,
  STUDY_SESSION,
  FOUR_WINDOWS,
  BACKYARD_HOT_TUB,
  DEMOLITION_ZONE,
  VISITING_AUNT_ELLEN,
  THE_FAMILY_ESTATE,
  THE_SUPERMARKET,
  THE_OLD_TAVERN,
  THE_BIRTHDAY_PARTY,
  THE_POLICE_STATION,
  DOOMSCROLLING,
  A_STUNNING_MANSION,
  KING_SIZE_BEDS,
  THE_CLOTHING_STORE,
  THE_LIBRARIANS_HOUSE,
  THE_HAIR_SALON,
  THE_GROCERY_STORE,
  SEMI_DETACHED_HOUSE,
  THE_ELECTRONICS_STORE,
  FLIGHT_85,
  KNOCKOUT,
  RAINY_DAY,
  GAME_NIGHT,
  BEACH_RESTAURANT,
  // Medium
  FISHING_AT_THE_LAKE,
  THE_FRENCH_RESTAURANT,
  THE_TERRACOTTA_COURTYARD,
  THE_RETIREMENT_VILLAGE,
  NEIGHBOURHOOD_FEUD,
  PREPPERS,
  AN_UNEXPECTED_VISIT,
  WHITE_WEDDING,
  THE_ART_SCHOOL,
  HOLIDAY_SHOPPING,
  // Hard
  THE_REMOTE_VILLAGE,
  THE_DONUT_HOUSE,
  THE_ABANDONED_MUSEUM,
  THE_PANIC_ROOM,
  THE_WINE_CELLAR,
  THE_RIVER_CROSSING,
  THE_FRONTIER_TOWN,
  A_DIRTY_BUSINESS,
  GRIZZLY_NIGHT,
  MINI_GOLF,
  SLEEPING_WITH_THE_FISHES,
  THE_HIKING_TRIP,
  THE_BOTANICAL_GARDEN,
  // Expert
  THE_BOSS_OFFICE,
  THE_ZOO,
  THE_GOLF_COURSE,
  MAIN_STREET,
  THE_MOVIE_STUDIO,
  THE_MYSTERY_ISLANDS,
  // Family
  THE_COOKIE_THIEF,
  THE_CARICATURE,
  // Treasure
  THE_TREASURE_HUNT,
];

/** The book series, in the order they came out. */
export const SERIES_ORDER: readonly Series[] = [
  "original",
  "timeTravel",
  "worldTravel",
  "beyondGrave",
  "online",
];

/** The difficulties, easiest first. */
export const DIFFICULTY_ORDER: readonly Difficulty[] = [
  "veryEasy",
  "easy",
  "medium",
  "hard",
  "expert",
  "family",
  "treasure",
];
