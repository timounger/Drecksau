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
import { THE_DUNGEON } from "../levels/the-dungeon";
import { THE_BEACH_RESORT } from "../levels/the-beach-resort";
import { THE_FORTRESS } from "../levels/the-fortress";
import { THE_CROSSROADS } from "../levels/the-crossroads";
import { THE_ROYAL_HUNT } from "../levels/the-royal-hunt";
import { THE_CRAFTSMENS_ALLEY } from "../levels/the-craftsmens-alley";
import { THE_TAVERN } from "../levels/the-tavern";
import { THE_MONASTERY } from "../levels/the-monastery";
import { THE_JOUST } from "../levels/the-joust";
import { THE_MARKET } from "../levels/the-market";
import { THE_VILLAGE_SQUARE } from "../levels/the-village-square";
import { THE_CASTLE_SIEGE } from "../levels/the-castle-siege";
import { THE_CASTLE_IN_THE_STORM } from "../levels/the-castle-in-the-storm";
import { THE_GENERAL_STORE } from "../levels/the-general-store";
import { THE_POST_OFFICE } from "../levels/the-post-office";
import { THE_PROSPECTORS_SHOP } from "../levels/the-prospectors-shop";
import { THE_GAMBLING_DEN } from "../levels/the-gambling-den";
import { THE_HIDEOUT } from "../levels/the-hideout";
import { THE_SHERIFFS_OFFICE } from "../levels/the-sheriffs-office";
import { THE_RANCH } from "../levels/the-ranch";
import { THE_BANK_ROBBERY } from "../levels/the-bank-robbery";
import { THE_TRAIN_STATION } from "../levels/the-train-station";
import { THE_GRAVE_ROBBERS } from "../levels/the-grave-robbers";
import { THE_OREGON_TRAIL } from "../levels/the-oregon-trail";
import { THE_DUEL } from "../levels/the-duel";
import { THE_SALOON } from "../levels/the-saloon";
import { THE_TRAIN_ROBBERY } from "../levels/the-train-robbery";
import { THE_GOLD_MINE } from "../levels/the-gold-mine";
import { THE_GREAT_PLAINS } from "../levels/the-great-plains";
import { TREASURE_ISLAND } from "../levels/treasure-island";
import { THE_SHIPWRECK } from "../levels/the-shipwreck";
import { THE_PRISON_SHIP } from "../levels/the-prison-ship";
import { THE_SKIRMISH } from "../levels/the-skirmish";
import { PARROT_ISLAND } from "../levels/parrot-island";
import { THE_GHOST_FRIGATE } from "../levels/the-ghost-frigate";
import { ISLANDS_OFF_THE_MAP } from "../levels/islands-off-the-map";
import { THE_GARRISON } from "../levels/the-garrison";
import { THE_SMUGGLERS_CAVE } from "../levels/the-smugglers-cave";
import { THE_HURRICANE } from "../levels/the-hurricane";
import { THE_SIEGE } from "../levels/the-siege";
import { THE_HARBOUR_TOWN } from "../levels/the-harbour-town";
import { TWIN_ISLANDS } from "../levels/twin-islands";
import { CAPUCHIN_ISLAND } from "../levels/capuchin-island";
import { MORNING_SNACK } from "../levels/morning-snack";
import { COSY_CAVE } from "../levels/cosy-cave";
import { THE_HUNT } from "../levels/the-hunt";
import { THE_BEACH_TT } from "../levels/the-beach-tt";
import { UNDERGROUND_CAVES } from "../levels/underground-caves";
import { MAMMOTH_LAKE } from "../levels/mammoth-lake";
import { VOLCANO } from "../levels/volcano";
import { THE_NIGHT_FIRE } from "../levels/the-night-fire";
import { FISH_AND_BEARS } from "../levels/fish-and-bears";
import { SABRE_TOOTH_MOUNTAIN } from "../levels/sabre-tooth-mountain";
import { A_PEACEFUL_VILLAGE } from "../levels/a-peaceful-village";
import { RIVER_CROCODILES } from "../levels/river-crocodiles";
import { BONE_CANYON } from "../levels/bone-canyon";
import { DEEP_IN_THE_FOREST } from "../levels/deep-in-the-forest";
import { THE_ICE_AGE } from "../levels/the-ice-age";
import { RIVAL_VILLAGES } from "../levels/rival-villages";
import { THE_SCRIBES_WORKSHOP } from "../levels/the-scribes-workshop";
import { PAPYRUS_HARVESTERS } from "../levels/papyrus-harvesters";
import { THE_QUEENS_GARDENS } from "../levels/the-queens-gardens";
import { THE_EMBALMING_HOUSE } from "../levels/the-embalming-house";
import { RIVERSIDE_MERCHANTS } from "../levels/riverside-merchants";
import { THE_TEMPLE_OF_ANUBIS } from "../levels/the-temple-of-anubis";
import { THE_GRANARIES } from "../levels/the-granaries";
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
import { THE_CARE_HOME } from "../levels/the-care-home";
import { BEST_PIZZA_IN_TOWN } from "../levels/best-pizza-in-town";
import { OCTAVIAS_NEW_HOUSE } from "../levels/octavias-new-house";
import { MASKED_BALL } from "../levels/masked-ball";
import { VALENTINES_DAY } from "../levels/valentines-day";
import { SHOPPING_MALL } from "../levels/shopping-mall";
import { THE_PETROL_STATION } from "../levels/the-petrol-station";
import { THE_CHESS_TOURNAMENT } from "../levels/the-chess-tournament";
import { THE_CONCERT } from "../levels/the-concert";
import { DIM_SUM } from "../levels/dim-sum";
import { THE_BLACK_LOTUS } from "../levels/the-black-lotus";
import { MIDNIGHT_TRAIN } from "../levels/midnight-train";
import { PRISON_BREAK } from "../levels/prison-break";
import { BASEMENT_DWELLER } from "../levels/basement-dweller";
import { THE_CASINO } from "../levels/the-casino";
import { STUDENT_DORM } from "../levels/student-dorm";
import { FAMILY_REUNION } from "../levels/family-reunion";
import { THE_CABIN_IN_THE_WOODS } from "../levels/the-cabin-in-the-woods";
import { DINNER_PARTY } from "../levels/dinner-party";
import { THE_CINEMA } from "../levels/the-cinema";
import { GLOOM_AND_DOOM } from "../levels/gloom-and-doom";
import { OPEN_PLAN_OFFICE } from "../levels/open-plan-office";
import { THE_CALL_CENTRE } from "../levels/the-call-centre";
import { DELIVERY_24H } from "../levels/delivery-24h";
import { THE_BOOK_CLUB } from "../levels/the-book-club";
import { THE_TREASURE_HUNT } from "../levels/the-treasure-hunt";
import { THE_GARDENERS_HOUSE } from "../levels/the-gardeners-house";
import { THE_NIGHTCLUB } from "../levels/the-nightclub";
import { THE_MUSEUM } from "../levels/the-museum";
import { THE_BAKERY } from "../levels/the-bakery";
import { SIBLING_RIVALRY } from "../levels/sibling-rivalry";
import { A_NIGHT_AT_THE_OPERA } from "../levels/a-night-at-the-opera";
import { SUMMER_HOLIDAY } from "../levels/summer-holiday";
import { BEACH_APARTMENT } from "../levels/beach-apartment";
import { THE_HOSPITAL } from "../levels/the-hospital";
import { HOME_SWEET_HOME } from "../levels/home-sweet-home";
import { SECURITY_CHECK } from "../levels/security-check";
import { THE_HOTEL } from "../levels/the-hotel";
import { THE_JUDGES_BIRTHDAY } from "../levels/the-judges-birthday";
import { ALL_DAY_CONFERENCE } from "../levels/all-day-conference";
import { THE_SUDOKU_MURDER } from "../levels/the-sudoku-murder";
import { THE_BANK_VAULT } from "../levels/the-bank-vault";
import { A_FULL_HOUSE } from "../levels/a-full-house";
import { THE_EMPTY_ROOM } from "../levels/the-empty-room";
import { THE_SECRET_MEETING } from "../levels/the-secret-meeting";
import { AVALANCHE } from "../levels/avalanche";
import { THE_YACHT } from "../levels/the-yacht";
import { THE_CIRCUS } from "../levels/the-circus";
import { THE_ESTATE } from "../levels/the-estate";
import { HALLOWEEN_PARTY } from "../levels/halloween-party";
import { MURDER_BURGER } from "../levels/murder-burger";
import { THE_FARM } from "../levels/the-farm";
import { THE_LAST_DUEL } from "../levels/the-last-duel";
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
  THE_DUNGEON,
  THE_BEACH_RESORT,
  THE_FORTRESS,
  THE_CROSSROADS,
  THE_ROYAL_HUNT,
  THE_CRAFTSMENS_ALLEY,
  THE_TAVERN,
  THE_MONASTERY,
  THE_JOUST,
  THE_MARKET,
  THE_VILLAGE_SQUARE,
  THE_CASTLE_SIEGE,
  THE_CASTLE_IN_THE_STORM,
  THE_GENERAL_STORE,
  THE_POST_OFFICE,
  THE_PROSPECTORS_SHOP,
  THE_GAMBLING_DEN,
  THE_HIDEOUT,
  THE_SHERIFFS_OFFICE,
  THE_RANCH,
  THE_BANK_ROBBERY,
  THE_TRAIN_STATION,
  THE_GRAVE_ROBBERS,
  THE_OREGON_TRAIL,
  THE_DUEL,
  THE_SALOON,
  THE_TRAIN_ROBBERY,
  THE_GOLD_MINE,
  THE_GREAT_PLAINS,
  TREASURE_ISLAND,
  THE_SHIPWRECK,
  THE_PRISON_SHIP,
  THE_SKIRMISH,
  PARROT_ISLAND,
  THE_GHOST_FRIGATE,
  ISLANDS_OFF_THE_MAP,
  THE_GARRISON,
  THE_SMUGGLERS_CAVE,
  THE_HURRICANE,
  THE_SIEGE,
  THE_HARBOUR_TOWN,
  TWIN_ISLANDS,
  CAPUCHIN_ISLAND,
  MORNING_SNACK,
  COSY_CAVE,
  THE_HUNT,
  THE_BEACH_TT,
  UNDERGROUND_CAVES,
  MAMMOTH_LAKE,
  VOLCANO,
  THE_NIGHT_FIRE,
  FISH_AND_BEARS,
  SABRE_TOOTH_MOUNTAIN,
  A_PEACEFUL_VILLAGE,
  RIVER_CROCODILES,
  BONE_CANYON,
  DEEP_IN_THE_FOREST,
  THE_ICE_AGE,
  RIVAL_VILLAGES,
  THE_SCRIBES_WORKSHOP,
  PAPYRUS_HARVESTERS,
  THE_QUEENS_GARDENS,
  THE_EMBALMING_HOUSE,
  RIVERSIDE_MERCHANTS,
  THE_TEMPLE_OF_ANUBIS,
  THE_GRANARIES,
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
  THE_CARE_HOME,
  BEST_PIZZA_IN_TOWN,
  OCTAVIAS_NEW_HOUSE,
  MASKED_BALL,
  VALENTINES_DAY,
  SHOPPING_MALL,
  THE_PETROL_STATION,
  THE_CHESS_TOURNAMENT,
  THE_CONCERT,
  DIM_SUM,
  THE_BLACK_LOTUS,
  MIDNIGHT_TRAIN,
  PRISON_BREAK,
  BASEMENT_DWELLER,
  THE_CASINO,
  STUDENT_DORM,
  FAMILY_REUNION,
  THE_CABIN_IN_THE_WOODS,
  DINNER_PARTY,
  THE_CINEMA,
  GLOOM_AND_DOOM,
  OPEN_PLAN_OFFICE,
  THE_CALL_CENTRE,
  THE_GARDENERS_HOUSE,
  THE_NIGHTCLUB,
  THE_MUSEUM,
  THE_BAKERY,
  SIBLING_RIVALRY,
  A_NIGHT_AT_THE_OPERA,
  SUMMER_HOLIDAY,
  BEACH_APARTMENT,
  THE_HOSPITAL,
  HOME_SWEET_HOME,
  SECURITY_CHECK,
  THE_HOTEL,
  THE_JUDGES_BIRTHDAY,
  ALL_DAY_CONFERENCE,
  THE_SUDOKU_MURDER,
  THE_BANK_VAULT,
  A_FULL_HOUSE,
  THE_EMPTY_ROOM,
  THE_SECRET_MEETING,
  AVALANCHE,
  THE_YACHT,
  THE_CIRCUS,
  THE_ESTATE,
  HALLOWEEN_PARTY,
  MURDER_BURGER,
  THE_FARM,
  THE_LAST_DUEL,
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
  "family",
  "online",
  "contest",
];

/** The difficulties, easiest first. */
export const DIFFICULTY_ORDER: readonly Difficulty[] = [
  "veryEasy",
  "easy",
  "medium",
  "hard",
  "expert",
];

/** The article a name may start with, left out when sorting by name. */
const ARTICLE = /^(der|die|das|ein|eine|the)\s+/iu;

/**
 * Two cases by their names, as a list sorts them: the article left out, so
 * "Der Buchclub" stands under B.
 *
 * @param one - a case
 * @param other - another case
 * @returns which comes first
 */
export function byName(one: Level, other: Level): number {
  return one.name
    .replace(ARTICLE, "")
    .localeCompare(other.name.replace(ARTICLE, ""), "de");
}

/**
 * Two cases of one collection in its order: a book by its numbers, the
 * others easiest first and by name within a difficulty.
 *
 * @param one - a case
 * @param other - another case of the same collection
 * @returns which comes first
 */
export function inOrder(one: Level, other: Level): number {
  const numbered =
    one.series?.number !== undefined && other.series?.number !== undefined;
  const grade = (level: Level): number =>
    level.difficulty === undefined
      ? -1
      : DIFFICULTY_ORDER.indexOf(level.difficulty);
  return numbered
    ? (one.series?.number ?? 0) - (other.series?.number ?? 0)
    : grade(one) - grade(other) || byName(one, other);
}

/**
 * The cases before and after this one in its own collection - a book in the
 * book's order, the others as the list has them.
 *
 * @param level - the open case
 * @returns the one before and the one after, where there is one
 */
export function neighboursOf(
  level: Level,
): readonly [Level | undefined, Level | undefined] {
  const row = LEVELS.filter(
    (one) => one.series?.book === level.series?.book,
  ).toSorted(inOrder);
  const at = row.findIndex((one) => one.id === level.id);
  return [row[at - 1], row[at + 1]];
}
