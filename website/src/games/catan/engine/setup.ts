/**
 * Laying out the island.
 *
 * @module
 * @remarks
 * This is the rulebook's *variabler Aufbau*, the one it gives for every game
 * after the first: the frame goes together in any order, the landscapes are
 * shuffled face down into it, and the number chips go on afterwards in
 * alphabetical order, counter-clockwise from any corner landscape, skipping the
 * desert. The fixed beginner layout on page 4 is printed only as a picture, so
 * it is not reproduced here - see the spec for that decision.
 *
 * Placing the chips *by the letters* rather than by shuffling numbers is not a
 * detail. It is what keeps a 6 and an 8 from ever landing side by side more
 * often than the printed alphabet allows, and it is why every game of Catan
 * feels balanced even though the board is random.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the material list and the chip alphabet are printed data */

import {
  FIND_HEXES,
  SEA_HEXES,
  SMALL_HEXES,
  hexesFor,
  islandOf,
  type Island,
} from "./board";
import { buildEventCards, stackEvents } from "./events";
import { FISH_TILES, OFF_BOARD, OLD_SHOE, fishingGrounds } from "./fischer";
import {
  BRIDGES_EACH,
  REST_LAND,
  BIG_REST_LAND,
  BIG_RIVER_LAND,
  RIVER_LAND,
  layRivers,
  type Rivers,
} from "./fluesse";
import {
  KARAWANE_EXTRA,
  NO_TRAIL,
  WAGONS,
  firstCaravans,
  layTrail,
} from "./karawane";
import {
  BARBARIANS,
  BARBAREN_EXTRA,
  BIG_CASTLES,
  BIG_COAST_LAND,
  BIG_INLAND_LAND,
  COAST_LAND,
  INLAND_LAND,
  NO_FORT,
  RAID_DECK,
  START_BARBARIAN_CHIPS,
  layFort,
  type Fort,
} from "./barbaren";
import {
  BIG_DESERTS,
  BIG_HAUL_LAND,
  HAUL_DECK,
  HAUL_LAND,
  RAIDERS,
  SKIP_CHIPS,
  START_GOLD,
  HANDEL_EXTRA,
  TARGETS,
  layDepots,
  stackFor,
  type Depot,
} from "./handel";
import {
  BOATS_EACH,
  CAMP_REGION_CHIPS,
  CAMP_REGION_LAND,
  CAMP_TARGET,
  FIND_TARGET,
  UNITS_EACH,
  START_GOLD as FIND_START_GOLD,
  ISLAND_CHIPS,
  ISLAND_LAND,
  NORTH_LAND,
  PORTS_EACH,
  REGION_CHIPS,
  SCOUTS_EACH,
  SOUTH_LAND,
  outerRow,
  region,
} from "./entdecker";
import {
  NEUE_WELT_CHIPS,
  NEUE_WELT_EXTRA,
  NEUE_WELT_LAND,
  NEUE_WELT_SEA,
  SHIPS_EACH,
  boardLiesWell,
  chipsLieWell,
} from "./seefahrer";
import { NO_GOODS, NO_TABLEAU } from "./knights";
import { deckOf } from "./progress";
import { createRandom, randomInt, shuffle, type Random } from "./random";
import {
  CREW_DEV,
  DEV_DECK,
  NO_CARDS,
  RESOURCES,
  START_CHIPS,
  RITTER_EXTRA,
  type Mode,
  STOCK,
  WIN_POINTS,
  type CatanGame,
  type CatanPlayer,
  type DevKind,
  type Harbour,
  type Land,
  type Resource,
  type Scenario,
  type Town,
  type Variant,
} from "./state";

/** A seat at the table, before anything is dealt. */
export type CatanSeat = {
  readonly name: string;
  readonly isBot: boolean;
};

/** What the seat you play yourself is called when it has no other name. */
export const SELF_NAME = "Du";

/**
 * The fewest the box seats.
 *
 * @remarks
 * Two, because of *CATAN für Zwei* - which is not an optional extra at that
 * count but the only way the box plays at all with two people. A table of two
 * therefore always gets the neutral colours; there is nothing to switch on.
 */
export const MIN_PLAYERS = 2;

/** How many people make it a game of *CATAN für Zwei*. */
export const TWO_PLAYERS = 2;

/**
 * What the neutral colours are called on screen.
 *
 * @remarks
 * Not names, because they are not people. They own roads and settlements and
 * can hold the Längste Handelsroute, so they need a row in the standings - and
 * that row should read as a colour on the board rather than as an opponent.
 */
export const NEUTRAL_NAMES: readonly string[] = [
  "Neutral hell",
  "Neutral dunkel",
];

/**
 * The most the box seats with the 5-6 Personen Erweiterung.
 *
 * @remarks
 * Five and six play on a **different board**: eleven more landscapes, two
 * deserts, 28 number chips instead of 18, and a turn that two people share.
 * {@link hexesFor} is what decides which island a table gets.
 */
export const MAX_PLAYERS = 6;

/** From this many players on, the bigger board and the shared turn come in. */
export const CREW_PLAYERS = 5;

/**
 * The four figure colours, in the order they are dropped.
 *
 * @remarks
 * "Spielt ihr zu dritt, lasst ihr die weißen Figuren weg" - so white is last,
 * and a table of three is red, blue and orange.
 */
export const COLOURS: readonly string[] = [
  "rot",
  "blau",
  "orange",
  "weiss",
  "gruen",
  "lila",
];

/** What each colour is painted, as a CSS colour. */
export const COLOUR_INK: Readonly<Record<string, string>> = {
  rot: "#c0392b",
  blau: "#2761b3",
  orange: "#e07b1f",
  weiss: "#f2efe6",
  gruen: "#2f8f4e",
  lila: "#7d3f98",
};

/** Names the computer plays under. */
export const BOT_NAMES: readonly string[] = [
  "Freya",
  "Knut",
  "Silke",
  "Malte",
  "Rieke",
];

/**
 * How the 19 landscapes are stocked.
 *
 * @remarks
 * Straight off the material list: Hügelland 3, Wald 4, Weideland 4, Ackerland
 * 4, Gebirge 3, Wüste 1.
 */
const LAND_STOCK: readonly (readonly [Land, number])[] = [
  ["lehm", 3],
  ["holz", 4],
  ["wolle", 4],
  ["getreide", 4],
  ["erz", 3],
  ["wueste", 1],
];

/**
 * What the 5-6 Personen Erweiterung adds.
 *
 * @remarks
 * "11 Landschaftsfelder: je 2 x Hügelland, Wald, Weideland, Ackerland, Gebirge,
 * 1 x Wüste." Which makes 30 in all, and **two** deserts - the robber starts on
 * either of them.
 */
const CREW_LAND: readonly (readonly [Land, number])[] = [
  ["lehm", 2],
  ["holz", 2],
  ["wolle", 2],
  ["getreide", 2],
  ["erz", 2],
  ["wueste", 1],
];

/**
 * What the 18 number chips say, in alphabetical order.
 *
 * @remarks
 * The rulebook says to lay the chips out letter side up and place them "in
 * alphabetischer Reihenfolge", but it never prints which letter carries which
 * number - on the table you simply turn them over. This is the printed
 * A-to-R sequence off the physical chips, and it is knowledge from the game
 * rather than from this booklet. It does add up to the material list: one 2,
 * one 12, and two each of everything between except 7.
 */
export const CHIP_LETTERS: readonly number[] = [
  5, 2, 6, 3, 8, 10, 9, 12, 11, 4, 8, 10, 9, 4, 5, 6, 3, 11,
];

/**
 * What the 28 chips of the 5-6 Personen Erweiterung say, A to Zc.
 *
 * @remarks
 * "Legt jetzt die 28 Zahlenchips aus dieser Erweiterung in alphabetischer
 * Reihenfolge aus ... Hinweis: Die drei letzten Chips tragen je 2 Buchstaben -
 * Za, Zb, Zc." Which numbers those letters carry is **not printed**, exactly as
 * in the base game.
 *
 * The multiset *is* printed, on the material page: twice the 2 and the 12,
 * three times everything between except the 7. So the counts are the
 * rulebook's; the **order is a construction**, not the sequence off the
 * physical chips.
 *
 * It was **searched for, not guessed**, against the one job the printed
 * alphabet does: keep the red numbers apart. Laid along the real spiral, with
 * two random deserts skipped and any of the six corners as the start, the
 * printed 18-chip alphabet never once puts a 6 or an 8 beside another - and
 * this one does the same. A first, hand-built attempt that merely spread the
 * reds evenly through the alphabet averaged two touching pairs per board,
 * which is the complaint every Catan player has about a bad shuffle. The
 * measurement is in the spec.
 */
export const CREW_CHIP_LETTERS: readonly number[] = [
  10, 4, 8, 11, 5, 6, 10, 9, 6, 11, 8, 5, 12, 6, 9, 3, 11, 2, 3, 4, 5, 4, 12, 9,
  10, 3, 2, 8,
];

/**
 * The nine harbours.
 *
 * @remarks
 * Four generic ones that take any three alike, and one two-for-one for each of
 * the five resources.
 */
/**
 * The ten harbours of a Seefahrer board.
 *
 * @remarks
 * "5 x Spezialhafen, 5 x 3:1 Hafen", straight off the material list - one
 * two-for-one per resource, and five generic ones.
 */
const SEA_HARBOUR_STOCK: readonly (Resource | null)[] = [
  null,
  null,
  null,
  null,
  null,
  ...RESOURCES,
];

/** How many times a bad archipelago is dealt again before it stands. */
const DEAL_TRIES = 200;

const HARBOUR_STOCK: readonly (Resource | null)[] = [
  null,
  null,
  null,
  null,
  ...RESOURCES,
];

/**
 * The eleven harbours of the bigger board.
 *
 * @remarks
 * A **decision**: the 5-6 rulebook never says how many harbours the assembled
 * frame carries, only to mind their position while slotting the small pieces
 * in. Two more generic ones keeps exactly one two-for-one per resource - so no
 * resource is easier to trade than another - and holds the harbour density of
 * the printed board across a longer coast.
 */
const CREW_HARBOUR_STOCK: readonly (Resource | null)[] = [
  null,
  null,
  null,
  null,
  null,
  null,
  ...RESOURCES,
];

/** The shuffled landscapes, in whichever size this table plays. */
function dealLand(random: Random, hexes: number): readonly Land[] {
  const stock =
    hexes === SMALL_HEXES ? LAND_STOCK : [...LAND_STOCK, ...CREW_LAND];
  const stack: Land[] = [];
  stock.forEach(([land, count]) => {
    for (let i = 0; i < count; i += 1) {
      stack.push(land);
    }
  });
  return shuffle(random, stack);
}

/**
 * The number chips, laid on alphabetically along the spiral.
 *
 * @remarks
 * The desert is skipped and takes no chip - both deserts, on the bigger board.
 * "Auf die beiden Wüsten wird kein Chip gelegt, daher werden sie übersprungen."
 */
function layChips(
  land: readonly Land[],
  start: number,
  bare: readonly number[] = [],
  without: readonly number[] = [],
): readonly number[] {
  const board = islandOf(land.length);
  // "Sortiert die '2' und die '12' aus. Legt die restlichen Zahlenchips wie
  // üblich in alphabetischer Reihenfolge aus und lasst dabei das 'B' ('2') und
  // das 'H' ('12') aus." Taking them out of the sequence rather than out of the
  // board is exactly what skipping their letters comes to.
  const printed =
    land.length === SMALL_HEXES ? CHIP_LETTERS : CREW_CHIP_LETTERS;
  const letters = printed.filter((number) => !without.includes(number));
  const chips = board.hexes.map(() => 0);
  let letter = 0;
  (board.spirals[start] ?? []).forEach((hex) => {
    // The desert never gets one, and neither do the two marshes of Die Flüsse
    // von Catan: "auf die beiden Sumpflandschaften werden keine Zahlenchips
    // gelegt."
    if (
      land[hex] !== "wueste" &&
      land[hex] !== "see" &&
      land[hex] !== "wasserstelle" &&
      land[hex] !== "burg" &&
      land[hex] !== "ziel" &&
      !bare.includes(hex)
    ) {
      chips[hex] = letters[letter];
      letter += 1;
    }
  });
  return chips;
}

/**
 * The harbours, shuffled onto their nine coastal paths.
 *
 * @remarks
 * Which harbour ends up where is exactly what assembling the frame "in
 * beliebiger Reihenfolge" decides, so shuffling the nine over the nine fixed
 * spots is the same freedom the box gives.
 */
function dockHarbours(random: Random, hexes: number): readonly Harbour[] {
  const board = islandOf(hexes);
  const stock = hexes === SMALL_HEXES ? HARBOUR_STOCK : CREW_HARBOUR_STOCK;
  const sorts = shuffle(random, stock);
  return board.harbourPaths.map((path: number, index: number) => ({
    path,
    want: sorts[index],
  }));
}

/**
 * The development cards, shuffled.
 *
 * @remarks
 * 25 in the printed game. The 5-6 Personen Erweiterung adds nine - "1 x
 * Monopol, 1 x Straßenbau, 1 x Erfindung, 6 x Ritter" - which makes 34, and
 * twenty of them knights.
 */
function buildStack(random: Random, hexes: number): readonly DevKind[] {
  const stack: DevKind[] = [];
  (Object.keys(DEV_DECK) as DevKind[]).forEach((kind) => {
    const extra = hexes === SMALL_HEXES ? 0 : CREW_DEV[kind];
    for (let i = 0; i < DEV_DECK[kind] + extra; i += 1) {
      stack.push(kind);
    }
  });
  return shuffle(random, stack);
}

/**
 * The order the founding phase runs in.
 *
 * @param seats - how many are playing
 * @param first - who won the roll for the start
 * @returns every seat once clockwise, then every seat once back again
 *
 * @remarks
 * "Haben alle eine Siedlung mit angrenzender Straße eingesetzt, startet, wer
 * als Letztes eine Siedlung eingesetzt hat, die zweite Runde" - which is the
 * snake: the last player of round one is also the first of round two, and so
 * places two settlements back to back.
 */
export function foundingOrder(seats: number, first: number): readonly number[] {
  const round = Array.from(
    { length: seats },
    (unused, step) => (first + step) % seats,
  );
  return [...round, ...[...round].reverse()];
}

/**
 * Where the two neutral settlements of *CATAN für Zwei* start.
 *
 * @param board - the island being played
 * @returns the two crossings, top one first
 * @remarks
 * "Setzt von jeder der beiden neutralen Farben jeweils 1 Siedlung (ohne Straße)
 * auf die beiden Kreuzungen, wie auf der Abbildung gezeigt." The figure is
 * drawn on the fixed starting layout and shows them **above and below the
 * middle landscape**, point-symmetric about the centre of the board.
 *
 * Read off the picture rather than named, because the rulebook gives no
 * crossing numbers and this table builds its island variably - so the rule has
 * to be a *shape* rather than two indexes. The shape is what the picture is
 * about anyway: two settlements in the middle, in the way of the best spots,
 * and far enough apart to satisfy the Abstandsregel between themselves.
 *
 * Taking the topmost and bottommost corner of the middle hex is also what makes
 * it orientation-proof: it asks the geometry where "above" is instead of
 * assuming which entry of `corners` that happens to be.
 */
export function neutralStart(board: Island): readonly [number, number] {
  const middleX = mean(board.hexes.map((hex) => hex.x));
  const middleY = mean(board.hexes.map((hex) => hex.y));
  const centre = board.hexes.reduce((best, hex) =>
    Math.hypot(hex.x - middleX, hex.y - middleY) <
    Math.hypot(best.x - middleX, best.y - middleY)
      ? hex
      : best,
  );
  const byHeight = [...centre.corners].sort(
    (one, other) => board.crossings[one].y - board.crossings[other].y,
  );
  return [byHeight[0], byHeight[byHeight.length - 1]];
}

/** The average of a list, for finding the middle of the board. */
function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * The board as the founding phase finds it.
 *
 * @param board - the island
 * @param seats - how many people are playing
 * @returns the crossings, with the two neutral settlements already on them
 */
function startingTowns(board: Island, seats: number): readonly (Town | null)[] {
  const towns: (Town | null)[] = board.crossings.map(() => null);
  if (seats === TWO_PLAYERS) {
    neutralStart(board).forEach((crossing, index) => {
      towns[crossing] = { owner: seats + index, city: false };
    });
  }
  return towns;
}

/**
 * The island of *Die Flüsse von Catan*.
 *
 * @param board - the island
 * @param water - where the rivers run
 * @param random - the generator, so the deal stays reproducible
 * @returns the landscapes, with the river tiles fixed and the rest shuffled
 * @remarks
 * "Baut mit diesen Landschaftsfeldern den Rest der Insel variabel auf." So the
 * seven fields the two river tiles cover are printed and fixed, and the other
 * twelve are dealt as usual - which is exactly the freedom the box gives.
 */
function riverLand(
  board: Island,
  water: Rivers,
  random: Random,
): readonly Land[] {
  const big = board.hexes.length > SMALL_HEXES;
  const rest = shuffle(random, [...(big ? BIG_REST_LAND : REST_LAND)]);
  const fixed = new Map<number, Land>();
  let at = 0;
  for (const run of big ? BIG_RIVER_LAND : RIVER_LAND) {
    for (const kind of run) {
      const hex = water.hexes[at];
      if (hex !== undefined) {
        fixed.set(hex, kind);
      }
      at += 1;
    }
  }
  let next = 0;
  return board.hexes.map(
    (hex) => fixed.get(hex.id) ?? rest[next++] ?? "wueste",
  );
}

/**
 * Puts the lake on the board in place of the desert.
 *
 * @param board - the island
 * @param land - the landscapes as dealt
 * @param desert - where the desert came up
 * @param random - the generator, so the swap stays reproducible
 * @returns the landscapes, with a lake and no desert
 * @remarks
 * "Ersetzt die Wüste durch den See." A **replacement**, so the desert is gone
 * afterwards - which is also why the robber has nowhere to stand and starts
 * beside the board.
 *
 * "Der See darf nicht am Rand der Insel (Küste) ausgelegt werden." If the
 * desert came up on the coast the two tiles trade places: the lake goes to an
 * inland spot and whatever was there moves out to the coast. That is what a
 * table does with a tile it may not put down - it swaps it with one it may.
 */
function layLake(
  board: Island,
  land: readonly Land[],
  deserts: readonly number[],
  random: Random,
): readonly Land[] {
  const inland = board.hexes
    .filter((hex) =>
      hex.corners.every((corner) => board.crossings[corner].hexes.length === 3),
    )
    .map((hex) => hex.id);
  // "Die beiden Seen ersetzen die beiden Wüsten" once the 5-6 Erweiterung is
  // in, and one lake for one desert on the printed board - so every desert
  // there is gets one, and each keeps clear of the coast.
  let laid = [...land];
  const taken = new Set<number>();
  for (const desert of deserts) {
    // Never onto another desert: a lake that landed there would swap one desert
    // for another and leave the board with a desert it should not have.
    const free = inland.filter(
      (hex) => !taken.has(hex) && (hex === desert || !deserts.includes(hex)),
    );
    const water = free.includes(desert)
      ? desert
      : (free[randomInt(random, free.length)] ?? desert);
    taken.add(water);
    const displaced = laid[water];
    laid = laid.map((kind, at) =>
      at === water
        ? "see"
        : at === desert
          ? // Whatever the lake displaced takes the desert's old place, so the
            // board keeps one of every landscape it was dealt.
            displaced
          : kind,
    );
  }
  return laid;
}

/**
 * The 29 fish tiles and the Alter Schuh, unshuffled.
 *
 * @returns one entry per tile: how many fish it shows, or {@link OLD_SHOE}
 */
function buildFishPile(): readonly number[] {
  const pile: number[] = [OLD_SHOE];
  for (const kind of FISH_TILES) {
    for (let copy = 0; copy < kind.count; copy++) {
      pile.push(kind.fish);
    }
  }
  return pile;
}

/** A player with nothing yet. */
function seatPlayer(
  seat: CatanSeat,
  colour: string,
  chips = 0,
  neutral = false,
): CatanPlayer {
  return {
    name: seat.name,
    bot: seat.isBot,
    colour,
    neutral,
    chips,
    hand: NO_CARDS,
    cards: 0,
    deck: [],
    fresh: [],
    knights: 0,
    damaged: null,
    roads: STOCK.roads,
    settlements: STOCK.settlements,
    cities: STOCK.cities,
    goods: NO_GOODS,
    goodsCount: 0,
    tableau: NO_TABLEAU,
    walls: 0,
    progress: [],
    victoryChips: 0,
    fish: [],
    gold: 0,
    bridgesLeft: BRIDGES_EACH,
    prisoners: 0,
    wagon: null,
    level: 0,
    ware: null,
    delivered: 0,
    moves: 0,
    boosted: false,
    haul: [],
    shipsLeft: SHIPS_EACH,
    homeIslands: [],
    islandChips: 0,
    boatsLeft: BOATS_EACH,
    scoutsLeft: SCOUTS_EACH,
    portsLeft: PORTS_EACH,
    unitsLeft: UNITS_EACH,
  };
}

/**
 * Lays the island of *Der Barbarenüberfall* out.
 *
 * @param board - the island
 * @param fort - where the castle and the desert go
 * @param random - the generator
 * @returns the landscapes
 * @remarks
 * This scenario is the one that does **not** deal its board: "legt zunächst,
 * wie abgebildet, die Wüste und das Burgfeld aus", and then names the ten
 * coast fields and the seven inland ones exactly. Only the order within each
 * ring is shuffled, which is all the rulebook leaves free.
 */
function fortLand(board: Island, fort: Fort, random: Random): readonly Land[] {
  const big = board.hexes.length > SMALL_HEXES;
  const coast = shuffle(random, big ? BIG_COAST_LAND : COAST_LAND);
  const inland = shuffle(random, big ? BIG_INLAND_LAND : INLAND_LAND);
  let next = 0;
  return board.hexes.map((hex) => {
    let kind: Land;
    if (fort.castles.includes(hex.id)) {
      kind = "burg";
    } else if (fort.deserts.includes(hex.id)) {
      kind = "wueste";
    } else if (fort.coast.includes(hex.id)) {
      kind = coast[fort.coast.indexOf(hex.id)] ?? "wueste";
    } else {
      kind = inland[next] ?? "wueste";
      next += 1;
    }
    return kind;
  });
}

/**
 * Moves a 2 and a 12 onto the coast.
 *
 * @param chips - the chips as the spiral laid them
 * @param coast - the coast fields
 * @returns the chips with both numbers on the coast
 * @remarks
 * "Stellt 1 Barbaren auf die Küstenfelder mit der '2' und der '12'." The
 * printed layout puts them there; this one lays the chips by the ordinary
 * spiral and then swaps, because a scenario that needs a coast field with a 2
 * needs it whichever way the spiral came out.
 */
function chipsToCoast(
  chips: readonly number[],
  coast: readonly number[],
): readonly number[] {
  let moved = [...chips];
  for (const number of START_BARBARIAN_CHIPS) {
    const at = moved.indexOf(number);
    if (at !== -1 && !coast.includes(at)) {
      // Swap with the first coast field that is not already one of the two.
      const to = coast.find(
        (hex) => !START_BARBARIAN_CHIPS.includes(moved[hex]) && moved[hex] > 0,
      );
      if (to !== undefined) {
        const held = moved[to];
        moved = moved.map((chip, hex) =>
          hex === to ? number : hex === at ? held : chip,
        );
      }
    }
  }
  return moved;
}

/** No sites: what every game outside the hauling scenario carries. */
const NO_DEPOTS_HERE: readonly Depot[] = [];

/** How many watering holes the bigger board carries. */
const BIG_HOLES = 2;

/**
 * Lays the island of *Händler & Barbaren* out.
 *
 * @param board - the island
 * @param depots - where the three sites sit
 * @param random - the generator
 * @returns the landscapes, with the three sites among them
 * @remarks
 * Sixteen landscapes shuffled into the sixteen fields the sites leave free -
 * "legt die Landschaftsfelder zufällig aus", and the sites are the only fixed
 * thing on this board.
 */
function haulLand(
  board: Island,
  depots: readonly Depot[],
  random: Random,
): readonly Land[] {
  const big = board.hexes.length > SMALL_HEXES;
  // "Legt dann ... die 2 Wüsten ... aus", which the printed board has none of.
  const dealt = shuffle(random, [
    ...(big ? BIG_HAUL_LAND : HAUL_LAND),
    ...Array.from({ length: big ? BIG_DESERTS : 0 }, () => "wueste" as const),
  ]);
  const sites = new Set(depots.map((depot) => depot.hex));
  let next = 0;
  return board.hexes.map((hex) => {
    let kind: Land = "ziel";
    if (!sites.has(hex.id)) {
      kind = dealt[next] ?? "wueste";
      next += 1;
    }
    return kind;
  });
}

/**
 * Where the three left-over barbarians start.
 *
 * @param board - the island
 * @returns three paths
 * @remarks
 * "Stellt die 3 Barbaren auf die mit den schwarzen Kreuzen markierten Wege" -
 * printed positions, so what is copied is where they are **for**: in the middle
 * of the island and evenly apart, so that every route between two sites has to
 * reckon with one. The middle field's own edges, every other one.
 */
function raiderStart(board: Island): readonly number[] {
  const rim = board.hexes[middleHex(board)].rim;
  return rim.filter((unused, at) => at % 2 === 0).slice(0, RAIDERS);
}

/**
 * Deals the archipelago of *Neue Welt*.
 *
 * @param board - the island
 * @param random - the generator
 * @returns the landscapes and their number chips
 * @remarks
 * "Mischt alle Sechseckfelder verdeckt und legt sie offen nacheinander im
 * Rahmen aus. Verfahrt mit den Zahlenchips ebenso. Achtet darauf, dass rote
 * Zahlen nicht nebeneinander liegen." Two shuffles and one condition - and the
 * condition is checked on the finished layout rather than built into the deal,
 * because that is what the sentence says and what a table actually does: look
 * at it, and lay it again if two reds ended up side by side.
 *
 * The gold rivers come with a condition of their own - "achtet darauf, dass auf
 * diesen keine roten Zahlen liegen" - and it is checked in the same breath.
 */
function dealArchipelago(
  board: Island,
  random: Random,
): { readonly land: readonly Land[]; readonly chips: readonly number[] } {
  let land: readonly Land[] = [];
  let chips: readonly number[] = [];
  // Bounded, because a shuffle that cannot satisfy the condition would
  // otherwise spin: after this many tries the last deal stands, which is a
  // worse board and not a broken one.
  for (let tries = 0; tries < DEAL_TRIES; tries++) {
    land = shuffle(random, [
      ...NEUE_WELT_LAND,
      ...Array.from({ length: NEUE_WELT_SEA }, () => "meer" as const),
    ]);
    const numbers = shuffle(random, NEUE_WELT_CHIPS);
    let next = 0;
    chips = land.map((kind) => {
      let chip = 0;
      if (kind !== "meer") {
        chip = numbers[next] ?? 0;
        next += 1;
      }
      return chip;
    });
    if (boardLiesWell(board, land) && chipsLieWell(board, land, chips)) {
      break;
    }
  }
  return { land, chips };
}

/**
 * Puts the ten harbours out on an archipelago.
 *
 * @param board - the island
 * @param land - the landscapes
 * @param random - the generator
 * @returns the harbours, on coastal paths of the islands
 * @remarks
 * "Beginnend bei der ältesten Person legen nun alle reihum Häfen an ein
 * Landschaftsfeld ihrer Wahl, bis der Stapel aufgebraucht ist. An einer
 * Kreuzung darf nie mehr als 1 Hafen liegen." The choice is a player's; here
 * the shuffle makes it, which is the same freedom exercised by a different
 * hand - and the one hard rule, never two at a crossing, is kept.
 *
 * A harbour needs a shore, so it goes on a path with land on one side and water
 * on the other. The fixed `harbourPaths` of the printed board are no use here:
 * they were derived for an island with a coast all the way round, and this
 * board's coast is wherever the deal put it.
 */
function dockArchipelago(
  board: Island,
  land: readonly Land[],
  random: Random,
): readonly Harbour[] {
  const shores = shuffle(
    random,
    board.paths
      .filter(
        (path) =>
          path.hexes.some((hex) => land[hex] !== "meer") &&
          (path.hexes.length === 1 ||
            path.hexes.some((hex) => land[hex] === "meer")),
      )
      .map((path) => path.id),
  );
  const sorts = shuffle(random, SEA_HARBOUR_STOCK);
  const taken = new Set<number>();
  const harbours: Harbour[] = [];
  for (const path of shores) {
    const ends = board.paths[path].ends;
    if (harbours.length < sorts.length && !ends.some((end) => taken.has(end))) {
      ends.forEach((end) => taken.add(end));
      harbours.push({ path, want: sorts[harbours.length] });
    }
  }
  return harbours;
}

/**
 * Deals the board of *Entdecker & Piraten*.
 *
 * @param board - the island
 * @param random - the generator
 * @returns the start island face up and the two regions face down
 * @remarks
 * The start island is dealt from the fourteen landscapes the rulebook counts
 * out, with its printed chips - the variable setup the rulebook itself offers
 * from the second play on: "mischt die Landschaftsfelder verdeckt und legt sie
 * in zufälliger Reihenfolge im Gebiet der Startinsel aus. Die Position der
 * Zahlenchips solltet ihr jedoch nicht ändern."
 *
 * North and south are dealt **face down**, sorted by their backs and shuffled
 * separately, and what lies under each tile is kept in `hidden` until a ship
 * turns it over.
 */
function dealFind(
  board: Island,
  random: Random,
  camps = false,
): {
  readonly land: readonly Land[];
  readonly chips: readonly number[];
  readonly hidden: readonly Land[];
  readonly hiddenChips: readonly number[];
} {
  const island = shuffle(random, ISLAND_LAND);
  // Scenario 2 fills both regions with the mission's own material: three
  // Goldflussfelder with a pirate camp on each - always on the outer row, where
  // the frame keeps them reachable by ship - and four fields behind them.
  const north = shuffle(random, camps ? CAMP_REGION_LAND : NORTH_LAND);
  const south = shuffle(random, camps ? CAMP_REGION_LAND : SOUTH_LAND);
  const numbers = camps ? CAMP_REGION_CHIPS : REGION_CHIPS;
  const northChips = shuffle(random, numbers);
  const southChips = shuffle(random, numbers);
  let onIsland = 0;
  let up = 0;
  let down = 0;
  // The chips are their own pile: a sea field under the tiles takes none, so
  // the next landscape gets the next chip and not the one at its own place.
  let upChip = 0;
  let downChip = 0;
  const land: Land[] = [];
  const chips: number[] = [];
  const hidden: Land[] = [];
  const hiddenChips: number[] = [];
  for (const hex of board.hexes) {
    const band = region(board, hex.id);
    if (band === "insel") {
      land.push(island[onIsland] ?? "wueste");
      chips.push(ISLAND_CHIPS[onIsland] ?? 0);
      hidden.push("unbekannt");
      hiddenChips.push(0);
      onIsland += 1;
    } else {
      const pile = band === "nord" ? north : south;
      const chipPile = band === "nord" ? northChips : southChips;
      const at = band === "nord" ? up : down;
      const kind =
        camps && outerRow(board, hex.id) ? "gold" : (pile[at] ?? "meer");
      const chip = band === "nord" ? upChip : downChip;
      land.push("unbekannt");
      chips.push(0);
      hidden.push(kind);
      // Only a landscape gets a chip; the sea fields under the pile get none.
      hiddenChips.push(kind === "meer" ? 0 : (chipPile[chip] ?? 0));
      // The outer row is fixed, so only the inner one draws from the pile.
      const drew = !(camps && outerRow(board, hex.id));
      if (band === "nord") {
        up += drew ? 1 : 0;
        upChip += kind === "meer" ? 0 : 1;
      } else {
        down += drew ? 1 : 0;
        downChip += kind === "meer" ? 0 : 1;
      }
    }
  }
  return { land, chips, hidden, hiddenChips };
}

/**
 * The landscape in the middle of the island.
 *
 * @param board - the island
 * @returns the hex nearest the centre
 * @remarks
 * "Sie wird genau in der Mitte der Insel ausgelegt." The printed
 * nineteen-landscape island has one; the six-player one "hat eine Reihe von
 * sechs durch die Mitte und keine einzelne Landschaft in ihrem Zentrum", so
 * there the nearest to the middle is what a table would reach for.
 */
function middleHex(board: Island): number {
  return middleHexes(board, 1)[0];
}

/**
 * The landscapes nearest the middle of the island.
 *
 * @param board - the island
 * @param count - how many are wanted
 * @returns their ids, nearest first
 * @remarks
 * "Sie wird genau in der Mitte der Insel ausgelegt", and the bigger board wants
 * two of them - so the nearest to the centre, and then the nearest that is not
 * a neighbour of the first, which is what keeps two watering holes apart
 * instead of side by side.
 */
function middleHexes(board: Island, count: number): readonly number[] {
  const away = (hex: (typeof board.hexes)[number]): number =>
    hex.x * hex.x + hex.y * hex.y;
  const ranked = [...board.hexes].sort((one, other) => away(one) - away(other));
  const picked: number[] = [];
  for (const hex of ranked) {
    const touches = picked.some((at) =>
      board.hexes[at].rim.some((path) =>
        board.paths[path].hexes.includes(hex.id),
      ),
    );
    if (picked.length < count && !touches) {
      picked.push(hex.id);
    }
  }
  return picked;
}

/**
 * Puts the watering hole in the middle of the island.
 *
 * @param land - the landscapes as dealt
 * @param desert - where the desert came out
 * @param middle - the landscape in the middle
 * @returns the island with the nomads at its centre
 * @remarks
 * "Die Wasserstelle ersetzt die Wüste. Sie wird genau in der Mitte der Insel
 * ausgelegt." Two sentences and one move: the desert is gone, the middle field
 * is now the watering hole, and what stood in the middle takes the place the
 * desert had - which is what a table does when it has one tile too many for the
 * spot it wants.
 */
function layWatering(
  land: readonly Land[],
  deserts: readonly number[],
  holes: readonly number[],
): readonly Land[] {
  return land.map((kind, at) => {
    const hole = holes.indexOf(at);
    const desert = deserts.indexOf(at);
    return hole !== -1
      ? "wasserstelle"
      : desert !== -1 && holes[desert] !== undefined
        ? land[holes[desert]]
        : kind;
  });
}

/**
 * Deals a fresh island.
 *
 * @param seats - who is playing, in seating order
 * @param seed - the cursor to lay the board out from
 * @param target - Siegpunkte needed to win; the printed game asks ten
 * @param variants - which variants of *Händler & Barbaren* are switched on
 * @returns a game waiting for its first settlement
 *
 * @remarks
 * *Die Häfen von Catan* raises the finish line by one - "es gewinnt, wer an der
 * Reihe ist und 11 Siegpunkte besitzt", which is the printed ten plus one,
 * because the variant puts a third two-point tile on the table. Applied as
 * **plus one** rather than as a flat eleven, so a deliberately short or long
 * game keeps its length.
 */
export function createGame(
  seats: readonly CatanSeat[],
  seed: number,
  target: number = WIN_POINTS,
  variants: readonly Variant[] = [],
  mode: Mode = "klassisch",
  scenario: Scenario = "keins",
): CatanGame {
  const random = createRandom(seed);
  const goal =
    (mode === "ritter" ? target + RITTER_EXTRA : target) +
    // "Es gewinnt, wer an der Reihe ist und 12 Siegpunkte erreicht hat."
    (scenario === "karawane" ? KARAWANE_EXTRA : 0) +
    (scenario === "barbaren" ? BARBAREN_EXTRA : 0) +
    (scenario === "handel" ? HANDEL_EXTRA : 0) +
    // "Sobald jemand an der Reihe ist und dabei 12 Siegpunkte erreicht."
    (scenario === "neuewelt" ? NEUE_WELT_EXTRA : 0);
  // Entdecker & Piraten does not raise the printed target, it replaces it:
  // "das Szenario endet, wenn eine Person in ihrem Zug 8 Siegpunkte erreicht."
  const finish =
    scenario === "entdecker"
      ? FIND_TARGET
      : scenario === "piraten"
        ? CAMP_TARGET
        : goal;
  // Seefahrer plays on its own, bigger board: "30 Sechseckfelder" on top of the
  // printed nineteen, laid inside a longer frame.
  const hexes =
    scenario === "neuewelt"
      ? SEA_HEXES
      : scenario === "entdecker" || scenario === "piraten"
        ? FIND_HEXES
        : hexesFor(seats.length);
  const board = islandOf(hexes);
  const land = dealLand(random, hexes);
  const start = board.cornerHexes[randomInt(random, board.cornerHexes.length)];
  const water = scenario === "fluesse" ? layRivers(board) : null;
  // The rivers bring their own landscapes with them: the two tiles are printed,
  // so those seven fields are fixed and only the other twelve are dealt.
  const dealt = water === null ? land : riverLand(board, water, random);
  const first = randomInt(random, seats.length);
  // "Der Räuber startet beliebig auf einer der beiden Wüsten."
  const deserts = land.reduce<number[]>(
    (list, kind, at) => (kind === "wueste" ? [...list, at] : list),
    [],
  );
  const desert = deserts[randomInt(random, deserts.length)];
  const dockedAt = dockHarbours(random, hexes);
  const laid =
    scenario === "fischer" ? layLake(board, dealt, deserts, random) : dealt;
  // "Die Wasserstelle ersetzt die Wüste. Sie wird genau in der Mitte der Insel
  // ausgelegt." A replacement in the middle, so whatever stood there takes the
  // desert's place rather than being dropped off the island.
  // "Es gibt nun zwei Wasserstellen, von denen aus insgesamt 6 Handelstrosse
  // starten können" - one on the printed board, two on the bigger one.
  const holes = middleHexes(board, hexes > SMALL_HEXES ? BIG_HOLES : 1);
  const nomads =
    scenario === "karawane" ? layWatering(laid, deserts, holes) : laid;
  const trail = scenario === "karawane" ? layTrail(board, holes) : NO_TRAIL;
  // "Legt die 3 Zielfelder so in den Rahmen": three of the nineteen fields are
  // sites here, and the other sixteen are the sixteen landscapes the rulebook
  // counts out.
  const depots =
    scenario === "handel"
      ? layDepots(
          board,
          TARGETS.map((target) => shuffle(random, stackFor(target))),
        )
      : NO_DEPOTS_HERE;
  const haulIsland =
    scenario === "handel" ? haulLand(board, depots, random) : null;
  // The barbarian scenario is laid out rather than dealt, so it replaces the
  // island wholesale instead of swapping a field into it.
  const fort =
    scenario === "barbaren"
      ? layFort(board, hexes > SMALL_HEXES ? BIG_CASTLES : 1)
      : NO_FORT;
  const island =
    scenario === "barbaren"
      ? fortLand(board, fort, random)
      : (haulIsland ?? nomads);
  // Last, on the island as it will actually be played: a scenario that moves a
  // landscape moves the chip that belongs on it, and laying the chips first
  // left the swapped-in field paying nothing at all.
  const archipelago =
    scenario === "neuewelt" ? dealArchipelago(board, random) : null;
  const unknown =
    scenario === "entdecker" || scenario === "piraten"
      ? dealFind(board, random, scenario === "piraten")
      : null;
  const spiralled = layChips(
    island,
    start,
    water?.marshes ?? [],
    scenario === "handel" ? SKIP_CHIPS : [],
  );
  const chips =
    unknown !== null
      ? unknown.chips
      : archipelago !== null
        ? archipelago.chips
        : scenario === "barbaren"
          ? chipsToCoast(spiralled, fort.coast)
          : spiralled;
  return {
    seed: random.state(),
    players: [
      ...seats.map((seat, index) => ({
        ...seatPlayer(
          seat,
          COLOURS[index],
          seats.length === TWO_PLAYERS ? START_CHIPS : 0,
        ),
        // "Nehmt euch alle je 1 Wagen-Tableau, 1 Trosswagen und 1 Ritter eurer
        // Farbe und 5 Gold."
        gold:
          scenario === "handel"
            ? START_GOLD
            : // "Zusätzlich nehmt ihr euch alle eine Baukostenübersicht und
              // 2 Gold."
              scenario === "entdecker" || scenario === "piraten"
              ? FIND_START_GOLD
              : 0,
      })),
      // "Die beiden Figurensätze, mit denen ihr nicht spielt, sind die Figuren
      // von zwei imaginären neutralen Personen." Only ever at a table of two.
      // *Entdecker & Piraten* has two-player rules of its own - "die Figuren der
      // nicht gewählten Farben bleiben auf der Startinsel als Hindernis stehen"
      // - and none of CATAN für Zwei's: no neutral colours that build, no two
      // rolls, no Handelschips. So it never deals them.
      ...(seats.length === TWO_PLAYERS &&
      scenario !== "entdecker" &&
      scenario !== "piraten"
        ? NEUTRAL_NAMES.map((name, index) =>
            seatPlayer(
              { name, isBot: false },
              COLOURS[seats.length + index],
              0,
              true,
            ),
          )
        : []),
    ],
    land: unknown?.land ?? archipelago?.land ?? island,
    chips,
    harbours:
      archipelago === null
        ? dockedAt
        : dockArchipelago(board, archipelago.land, random),
    // "Stellt den Räuber neben das Spielfeld. Er kommt erst bei der ersten '7'
    // oder wenn eine Ritterkarte gespielt wird ins Spiel." Off the board is a
    // place, and -1 is what it is called here.
    robber:
      // The watering hole takes the desert's place too, so the robber has
      // nowhere to start here either: "stellt den Räuber außerhalb des
      // Spielfeldes bereit".
      // "Den Räuber und die Sondersiegpunkttafel Größte Rittermacht benötigt
      // ihr nicht" - the barbarian scenario has no robber at all, so it stands
      // off the board for good.
      scenario === "fischer" ||
      scenario === "karawane" ||
      scenario === "barbaren" ||
      // "Den Räuber und die Längste Handelsroute gibt es in diesem Szenario
      // nicht."
      scenario === "handel" ||
      // "Es wird ohne Räuber gespielt." Left on the board it would silence a
      // landscape for no reason, and be drawn there for everyone to wonder at.
      scenario === "entdecker" ||
      scenario === "piraten"
        ? OFF_BOARD
        : // "Stellt den Räuber auf ein beliebiges der beiden Sumpffelder."
          // There is no desert in the rivers scenario either - the marshes take
          // its place, and the robber starts on one of them.
          (water?.marshes[0] ?? desert),
    // The two neutral settlements are already standing when the founding
    // phase begins - they are part of the setup, not of anybody's turn.
    // The two neutral settlements belong to CATAN für Zwei, which Entdecker &
    // Piraten does not use - see the seat list above.
    towns: startingTowns(
      board,
      scenario === "entdecker" || scenario === "piraten" ? 0 : seats.length,
    ),
    roads: board.paths.map(() => null),
    stack: buildStack(random, hexes),
    events: variants.includes("ereignisse")
      ? stackEvents(shuffle(random, buildEventCards()))
      : [],
    drawn: null,
    owed: [],
    // One slot per seat on the board, neutral colours included: the array is
    // indexed by seat and a short one would run off the end of it.
    given: Array.from(
      {
        length:
          seats.length === TWO_PLAYERS
            ? seats.length + NEUTRAL_NAMES.length
            : seats.length,
      },
      () => null,
    ),
    after: null,
    active: first,
    stone: 1,
    phase: "founding",
    dice: null,
    rolls: 0,
    firstRoll: null,
    neutralBuild: null,
    swapWith: null,
    knightGiven: false,
    mode,
    scenario,
    // The fishing grounds go on the coastal paths the harbours left free.
    grounds:
      scenario === "fischer"
        ? fishingGrounds(
            board,
            dockedAt.map((harbour) => harbour.path),
          )
        : [],
    fishPile: scenario === "fischer" ? shuffle(random, buildFishPile()) : [],
    fishSpent: [],
    shoe: null,
    // The rivers are part of the map, so they are laid once with it.
    rivers: water ?? {
      hexes: [],
      bridges: [],
      crossings: [],
      paths: [],
      marshes: [],
    },
    bridges: board.paths.map(() => null),
    richest: null,
    poorest: [],
    goldBuys: 0,
    trail,
    wagons: board.paths.map(() => null),
    caravans: firstCaravans(trail),
    wagonsLeft: scenario === "karawane" ? WAGONS : 0,
    vote: null,
    built: false,
    fort,
    // "Stellt 1 Barbaren auf die Küstenfelder mit der '2' und der '12'."
    barbarians: chips.map((chip, hex) =>
      scenario === "barbaren" &&
      fort.coast.includes(hex) &&
      START_BARBARIAN_CHIPS.includes(chip)
        ? 1
        : 0,
    ),
    barbariansLeft:
      scenario === "barbaren" ? BARBARIANS - START_BARBARIAN_CHIPS.length : 0,
    guards: board.paths.map(() => null),
    ridden: [],
    raidDeck: scenario === "barbaren" ? shuffle(random, RAID_DECK) : [],
    raidUsed: [],
    raidCard: null,
    posting: null,
    barbTake: 0,
    barbPut: 0,
    lastLie: null,
    depots,
    raiders: board.paths.map((path) =>
      scenario === "handel" ? raiderStart(board).includes(path.id) : false,
    ),
    haulDeck: scenario === "handel" ? shuffle(random, HAUL_DECK) : [],
    haulUsed: [],
    shiftDraws: false,
    secondDrive: false,
    shoved: [],
    ships: board.paths.map(() => null),
    freshShips: [],
    shipMoved: false,
    // "Stellt den Seeräuber auf ein beliebiges Feld auf dem Rahmen" - which is
    // the outer water, so it starts on a sea field at the rim.
    pirate:
      archipelago === null
        ? OFF_BOARD
        : (board.hexes.find(
            (hex) =>
              archipelago.land[hex.id] === "meer" &&
              hex.rim.some((path) => board.paths[path].hexes.length === 1),
          )?.id ?? OFF_BOARD),
    goldOwed: [],
    boats: [],
    hidden: unknown?.hidden ?? board.hexes.map(() => "unbekannt" as const),
    hiddenChips: unknown?.hiddenChips ?? board.hexes.map(() => 0),
    sailing: null,
    docks: {},
    camps: {},
    pirateShip: null,
    tributes: [],
    chased: [],
    mission: seats.map(() => 0),
    garrison: board.crossings.map(() => null),
    // Shuffled once at the start. Each is a ring afterwards: a played card goes
    // back underneath its own deck, so a deck never runs out.
    decks: {
      wissenschaft: shuffle(random, deckOf("wissenschaft")),
      handel: shuffle(random, deckOf("handel")),
      politik: shuffle(random, deckOf("politik")),
    },
    barbarian: 0,
    landed: false,
    metro: { wissenschaft: null, handel: null, politik: null },
    eventDie: null,
    redDie: null,
    trader: null,
    traderOwner: null,
    drawing: [],
    playing: null,
    displaced: null,
    crane: null,
    fleet: null,
    variants,
    harbourTile: null,
    harbourBest: 0,
    founding: {
      order: foundingOrder(seats.length, first),
      step: 0,
      placing: "town",
      lastTown: null,
    },
    offer: null,
    owing: [],
    targets: [],
    freeRoads: 0,
    gifts: 0,
    playedDev: false,
    offers: 0,
    longest: null,
    longestLen: 0,
    army: null,
    // Both add to the target rather than replacing it; see RITTER_EXTRA.
    target: finish + (variants.includes("haefen") ? 1 : 0),
    winner: null,
    turn: 0,
    log: [],
  };
}

/**
 * The seats of a game against the computer.
 *
 * @param count - how many sit at the table, you included
 * @returns you first, then as many bots as it takes
 */
export function soloSeats(count: number): readonly CatanSeat[] {
  const bots = BOT_NAMES.slice(0, count - 1).map((name) => ({
    name,
    isBot: true,
  }));
  return [{ name: SELF_NAME, isBot: false }, ...bots];
}
