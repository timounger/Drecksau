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
  FINAL_HEXES,
  FIND_HEXES,
  FISH_HEXES,
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
  BIG_ISLAND_CHIPS,
  BIG_ISLAND_LAND,
  BIG_REGION_CHIPS,
  CAMP_REGION_CHIPS,
  CAMP_REGION_LAND,
  FISH_NORTH_LAND,
  FISH_NORTH_ROW,
  FISH_NUMBERS,
  FISH_SOUTH_LAND,
  FISH_SOUTH_ROW,
  SHOALS,
  CAMP_TARGET,
  FINAL_COAST,
  FINAL_NORTH_LAND,
  FINAL_ROW,
  FINAL_SOUTH_COAST,
  FINAL_SOUTH_LAND,
  FINAL_TARGET,
  FISH_TARGET,
  FIND_TARGET,
  SPICES,
  SPICE_NORTH_LAND,
  SPICE_NORTH_ROW,
  SPICE_SOUTH_LAND,
  SPICE_SOUTH_ROW,
  SPICE_TARGET,
  finding,
  type Spice,
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
  stretchRow,
  stretched,
  region,
} from "./entdecker";
import {
  NEUE_WELT_CHIPS,
  NEUE_WELT_EXTRA,
  NEUE_WELT_LAND,
  NEUE_WELT_SEA,
  CLOTH_CHIPS,
  CORSAIR_CHIPS,
  WONDER_CHIPS,
  WONDER_ISLE_LAND,
  WONDER_MAIN_LAND,
  WONDER_TARGET,
  CORSAIR_DUNES,
  CORSAIR_HOME,
  CORSAIR_ISLES,
  CORSAIR_ISLE_CHIPS,
  CORSAIR_ISLE_LAND,
  CORSAIR_LAND,
  CORSAIR_TARGET,
  FORT_CHIPS,
  CLOTH_ISLES,
  CLOTH_ISLE_LAND,
  CLOTH_MAIN_LAND,
  CLOTH_NORTH,
  CLOTH_PER_VILLAGE,
  CLOTH_ROUNDS,
  CLOTH_SOUTH,
  CLOTH_SUPPLY,
  CLOTH_TARGET,
  CLOTH_VILLAGE_CHIPS,
  DUNE_BELT,
  TRIBE_CHIPS,
  TRIBE_GIFT_CARDS,
  TRIBE_GIFT_CHIPS,
  TRIBE_GIFT_PORTS,
  TRIBE_ISLES,
  TRIBE_ISLE_LAND,
  TRIBE_MAIN,
  TRIBE_MAIN_LAND,
  TRIBE_TARGET,
  DUNE_CHIPS,
  DUNE_ISLES,
  DUNE_ISLE_LAND,
  DUNE_MAIN,
  DUNE_MAIN_LAND,
  DUNE_STRIP,
  DUNE_STRIP_LAND,
  DUNE_TARGET,
  FOG_HIDDEN_CHIPS,
  FOG_HIDDEN_LAND,
  FOG_START_CHIPS,
  FOG_START_LAND,
  FOG_TARGET,
  FOUR_CHIPS,
  FOUR_LAND,
  FOUR_TARGET,
  SHIPS_EACH,
  SHORE_ISLE_CHIPS,
  SHORE_ISLE_LAND,
  SHORE_MAIN_CHIPS,
  SHORE_MAIN_LAND,
  SHORE_TARGET,
  fogIslands,
  fourIslands,
  mainIsland,
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
  type Gift,
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

/** Up to this many, a table plays on the printed boards. */
const SMALL_TABLE = 4;

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
export function foundingOrder(
  seats: number,
  first: number,
  rounds = 2,
): readonly number[] {
  const round = Array.from(
    { length: seats },
    (unused, step) => (first + step) % seats,
  );
  // Every round turns round: "beginnend mit der Person links von euch" and back
  // again. *Stoffe für Catan* wants a third: "haben alle ihre 2. Siedlung
  // gesetzt, beginnt die letzte Person, die eine Siedlung gesetzt hat, und
  // gründet eine 3. Siedlung" - and that is the same order as the first round.
  return Array.from({ length: rounds }, (unused, at) =>
    at % 2 === 0 ? round : [...round].reverse(),
  ).flat();
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
 * The board as two people of *Entdecker & Piraten* find it.
 *
 * @param board - the island
 * @param seats - how many people are playing, so the neutral colours follow
 * @returns the crossings, with the four obstacles already standing
 * @remarks
 * "Spielt ihr zu zweit, setzt ihr alle Figuren ein. Die Figuren der nicht
 * gewählten Farben bleiben auf der Startinsel als Hindernis stehen. Nur die
 * Entdeckerschiffe der nicht gewählten Farben werden entfernt." Per unused
 * colour one Hafensiedlung and one settlement, and nothing else: they never
 * yield, never build and never take a turn - see {@link playingTwo}.
 *
 * The rulebook has the two players place them before founding - "setzt zunächst
 * die Person, die beginnt, ... eine Hafensiedlung einer neutralen Farbe ein" -
 * and here the referee does, the way it already places the neutral settlements
 * of *CATAN für Zwei*. What the rule is about is that four good spots are gone
 * before anybody founds; who put them there changes nothing about that, and it
 * keeps the founding phase one thing rather than two.
 *
 * Where: the two Hafensiedlungen at the ends of the start island, which is
 * where its coast is longest, and the two settlements above and below the
 * middle of the board - the same shape {@link neutralStart} reads off the
 * picture of CATAN für Zwei, and far enough apart for the Abstandsregel.
 */
function obstacleTowns(board: Island, seats: number): readonly (Town | null)[] {
  const towns: (Town | null)[] = board.crossings.map(() => null);
  const shore = board.crossings
    .filter((crossing) =>
      crossing.hexes.some((hex) => region(board, hex) === "insel"),
    )
    .sort((one, other) => one.x - other.x);
  const spots = [
    { at: shore[0].id, port: true },
    { at: shore[shore.length - 1].id, port: true },
    ...neutralStart(board).map((at) => ({ at, port: false })),
  ];
  spots.forEach((spot, index) => {
    const room = board.crossings[spot.at].next.every(
      (near) => towns[near] === null,
    );
    if (towns[spot.at] === null && room) {
      towns[spot.at] = {
        owner: seats + (index % NEUTRAL_NAMES.length),
        city: false,
        port: spot.port,
      };
    }
  });
  return towns;
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
 * Whether a ship could reach the Catanischer Rat once every field is turned up.
 *
 * @param board - the island
 * @param land - the board as it will look with nothing face down any more
 * @param council - the sea field the council sits on
 * @returns whether its harbours can be sailed to at all
 * @remarks
 * The council is a sea field, so the six paths around it are always sea lanes -
 * but that is worth nothing if every field around it comes up land: the lanes
 * are then a puddle with no way in. A ship reaches it only along a chain of
 * lanes that starts at the frame, and the frame is where this walks from.
 */
function councilOpen(
  board: Island,
  land: readonly Land[],
  council: number,
): boolean {
  const wet = (hex: number): boolean =>
    land[hex] === "meer" || land[hex] === "fisch";
  const lane = (path: number): boolean => {
    const beside = board.paths[path].hexes;
    return beside.length === 1 || beside.some((hex) => wet(hex));
  };
  const seen = new Set<number>(board.hexes[council].rim.filter(lane));
  const queue = [...seen];
  let open = false;
  while (queue.length > 0 && !open) {
    const at = queue.shift() ?? 0;
    open = board.paths[at].hexes.length === 1;
    board.paths[at].ends.forEach((end) => {
      board.crossings[end].paths.forEach((path) => {
        if (!seen.has(path) && lane(path)) {
          seen.add(path);
          queue.push(path);
        }
      });
    });
  }
  return open;
}

/**
 * Moves one field so the Catanischer Rat keeps its way to the sea.
 *
 * @param board - the island
 * @param council - where the council lies
 * @param dealt - the deal, changed in place
 * @remarks
 * "Legt das Meerfeld an den Catanischen Rat an, um die Lücke zwischen Teil G und
 * dem Rahmen zu schließen": the printed board keeps water between the council
 * and the frame, and that is what this keeps too - the sea field beside it is
 * not always enough on the wider board, where the southern region is only two
 * rows deep and the row at the frame is dealt from the mission's own pile. Two
 * of forty deals walled the council in completely, and with it both tracks it
 * pays: a self-played finale ran 5000 turns with every ship carrying fish and
 * spice it could never land.
 *
 * What it does is a **swap**, not a new field: a landscape between the council
 * and the frame changes places with a water field of the same region. The
 * region keeps every field it was dealt - the camps stay on the outer row, the
 * villages keep their pairs - and only where two of them lie changes.
 */
function openCouncil(
  board: Island,
  council: number,
  dealt: {
    readonly land: readonly Land[];
    readonly hidden: Land[];
    readonly hiddenChips: number[];
    readonly fish: Record<number, number>;
    readonly spice: Record<number, Spice>;
  },
): void {
  const shown = (): readonly Land[] =>
    dealt.land.map((kind, hex) =>
      kind === "unbekannt" ? dealt.hidden[hex] : kind,
    );
  const swap = (one: number, other: number): void => {
    [dealt.hidden[one], dealt.hidden[other]] = [
      dealt.hidden[other],
      dealt.hidden[one],
    ];
    [dealt.hiddenChips[one], dealt.hiddenChips[other]] = [
      dealt.hiddenChips[other],
      dealt.hiddenChips[one],
    ];
    swapAt(dealt.fish, one, other);
    swapAt(dealt.spice, one, other);
  };
  // Towards the frame, which is the direction the rulebook's sea field closes:
  // the neighbours of the council that lie further out than it does.
  const gates = [
    ...new Set(
      board.hexes[council].corners
        .flatMap((corner) => board.crossings[corner].hexes)
        .filter(
          (hex) =>
            hex !== council && board.hexes[hex].row > board.hexes[council].row,
        ),
    ),
  ];
  const pools = board.hexes
    .map((hex) => hex.id)
    .filter(
      (hex) =>
        region(board, hex) === region(board, council) &&
        (dealt.hidden[hex] === "fisch" || dealt.hidden[hex] === "meer"),
    );
  for (const gate of gates) {
    for (const pool of pools) {
      if (councilOpen(board, shown(), council)) {
        return;
      }
      swap(gate, pool);
      if (!councilOpen(board, shown(), council)) {
        swap(gate, pool);
      }
    }
  }
}

/** Exchanges what two fields carry, in a record kept by field. */
function swapAt<T>(kept: Record<number, T>, one: number, other: number): void {
  const first = kept[one];
  const second = kept[other];
  if (second === undefined) {
    delete kept[one];
  } else {
    kept[one] = second;
  }
  if (first === undefined) {
    delete kept[other];
  } else {
    kept[other] = first;
  }
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
    bales: 0,
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
  fish = false,
  spices = false,
  all = false,
): {
  readonly land: readonly Land[];
  readonly chips: readonly number[];
  readonly hidden: readonly Land[];
  readonly hiddenChips: readonly number[];
  readonly fish: Readonly<Record<number, number>>;
  readonly spice: Readonly<Record<number, Spice>>;
  readonly council: number | null;
} {
  // How many fields a row of this lattice holds decides how long every list
  // has to be: the boards of three and four are narrower than the one the 5-6
  // Personen Erweiterung plays on. See stretched.
  const rows = board.rows;
  // On the wider board of five and six the regions keep the width they have at
  // three and four, and the fields at the ends of their rows become **open
  // sea**. That water is what the start island needs: its coast is where a
  // Hafensiedlung is founded, and with the regions pressed against it there are
  // twelve coastal crossings on the whole board - not enough for six colours,
  // whose settlements block one another. The printed board has open water
  // between the island and the unknown regions for the same reason.
  const wide = board.hexes.length > FISH_HEXES;
  const trim = wide ? REGION_TRIM : 0;
  // Only the row against the island gives its ends to the sea: the outer row
  // lies at the frame, where the coast is open anyway.
  const outer = rows[0];
  const inner = rows[1] - trim;
  const middle = board.hexes.filter(
    (hex) => region(board, hex.id) === "insel",
  ).length;
  const island = shuffle(
    random,
    stretched(
      middle > ISLAND_LAND.length ? BIG_ISLAND_LAND : ISLAND_LAND,
      middle,
    ),
  );
  const islandChips =
    middle > ISLAND_LAND.length ? BIG_ISLAND_CHIPS : ISLAND_CHIPS;
  // Scenario 3 lays the Catanischer Rat face up on the inner row of the
  // southern region, where the printed board has it: a sea field against the
  // start island, with its two harbours pointing away from it.
  const council = fish || spices || all ? councilHex(board, random) : null;
  // The finale lays a sea field next to the council: the rulebook adds one
  // ("um die Luecke zwischen Teil G und dem Rahmen zu schliessen"), and here it
  // is what keeps the council from being walled in by the mission's islands.
  const gap = all && council !== null ? beside(board, council) : null;
  // Scenario 2 fills both regions with the mission's own material: three
  // Goldflussfelder with a pirate camp on each - always on the outer row, where
  // the frame keeps them reachable by ship - and four fields behind them.
  // Scenario 3 deals the same regions its own way, with the fish fields in
  // among them.
  // How many fields the pile has to fill: everything of a region that is not a
  // fixed row - the inner row, and on the wider board the middle one too.
  const behind = board.hexes.filter(
    (hex) =>
      region(board, hex.id) === "nord" &&
      !outerRow(board, hex.id) &&
      (trim === 0 || inRegion(board, hex.id, trim)),
  ).length;
  const north = shuffle(
    random,
    stretchPile(
      behind,
      all
        ? FINAL_NORTH_LAND
        : spices
          ? SPICE_NORTH_LAND
          : fish
            ? FISH_NORTH_LAND
            : camps
              ? CAMP_REGION_LAND
              : NORTH_LAND,
    ),
  );
  const south = shuffle(
    random,
    stretchPile(
      behind,
      all
        ? FINAL_SOUTH_LAND
        : spices
          ? SPICE_SOUTH_LAND
          : fish
            ? FISH_SOUTH_LAND
            : camps
              ? CAMP_REGION_LAND
              : SOUTH_LAND,
    ),
  );
  const northRow = shuffle(
    random,
    stretchRow(
      all ? FINAL_ROW : spices ? SPICE_NORTH_ROW : FISH_NORTH_ROW,
      outer,
    ),
  );
  const southRow = shuffle(
    random,
    stretchRow(
      all ? FINAL_ROW : spices ? SPICE_SOUTH_ROW : FISH_SOUTH_ROW,
      outer,
    ),
  );
  // The finale keeps the island's own coast wet - see FINAL_COAST.
  const northCoast = shuffle(random, stretched(FINAL_COAST, inner));
  const southCoast = shuffle(
    random,
    // The council and the sea field beside it take two of this row.
    stretched(FINAL_SOUTH_COAST, Math.max(0, inner - 2)),
  );
  let upCoast = 0;
  let downCoast = 0;
  // The six villages are dealt their advantages: two Schnelle Fahrt, two
  // Piratenbonus, two Gutes Gold, and which field carries which is the deal.
  const gifts = shuffle(random, SPICES);
  const villages: Record<number, Spice> = {};
  let given = 0;
  // "Die Fischfelder sind mit Würfelzahlen von 1 bis 6 markiert" - five of the
  // six numbers are in play, and which five is the deal.
  const dice = shuffle(random, FISH_NUMBERS);
  const fishes: Record<number, number> = {};
  let caught = 0;
  const numbers =
    behind + outer > NORTH_LAND.length
      ? BIG_REGION_CHIPS
      : camps
        ? CAMP_REGION_CHIPS
        : REGION_CHIPS;
  const northChips = shuffle(random, numbers);
  const southChips = shuffle(random, numbers);
  let onIsland = 0;
  let up = 0;
  let down = 0;
  // The fixed outer row of scenario 3 has a pile of its own, so it may not
  // share a counter with the fields behind it.
  let upRow = 0;
  let downRow = 0;
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
      chips.push(islandChips[onIsland] ?? 0);
      hidden.push("unbekannt");
      hiddenChips.push(0);
      onIsland += 1;
    } else if (
      trim > 0 &&
      !outerRow(board, hex.id) &&
      !inRegion(board, hex.id, trim)
    ) {
      // The ends of a region's rows: open sea, face up, and no chip.
      land.push("meer");
      chips.push(0);
      hidden.push("meer");
      hiddenChips.push(0);
    } else {
      const pile = band === "nord" ? north : south;
      const chipPile = band === "nord" ? northChips : southChips;
      const at = band === "nord" ? up : down;
      const row = band === "nord" ? northRow : southRow;
      const rowAt = band === "nord" ? upRow : downRow;
      const fixed = outerRow(board, hex.id);
      // The finale keeps a wet row against the island only where its regions
      // are three rows deep. On the wider board of five and six they are two,
      // and the coast is open anyway: the ends of the inner row are sea there,
      // and the region is narrower than the island. Kept as it was, the villages
      // of that scenario would have had no row left to lie in at all.
      const shore = all && !wide && coastRow(board, hex.id);
      const coast = band === "nord" ? northCoast : southCoast;
      const coastAt = band === "nord" ? upCoast : downCoast;
      const dealt = fish || spices || all;
      const kind: Land = dealt
        ? hex.id === council || hex.id === gap
          ? "meer"
          : fixed
            ? (row[rowAt] ?? "meer")
            : shore
              ? (coast[coastAt] ?? "meer")
              : (pile[at] ?? "meer")
        : camps && fixed
          ? "gold"
          : (pile[at] ?? "meer");
      const chip = band === "nord" ? upChip : downChip;
      // The Catanischer Rat is the one field of a region that lies face up; the
      // sea field beside it is dealt like any other, face down.
      const open = hex.id === council;
      const spoken = open || hex.id === gap;
      land.push(open ? "meer" : "unbekannt");
      chips.push(0);
      hidden.push(kind);
      // Only a landscape gets a chip; sea and fish fields under the pile get
      // none - a Fischfeld carries a die number instead.
      const barren = kind === "meer" || kind === "fisch" || kind === "gewuerz";
      hiddenChips.push(barren ? 0 : (chipPile[chip] ?? 0));
      if (kind === "fisch") {
        fishes[hex.id] = dice[caught] ?? 1;
        caught += 1;
      }
      if (kind === "gewuerz") {
        villages[hex.id] = gifts[given] ?? "gold";
        given += 1;
      }
      // A fixed row draws from its own pile, and the council draws nothing.
      const drew = !spoken && !shore && !(dealt ? fixed : camps && fixed);
      const took = !spoken && dealt && fixed;
      const washed = !spoken && shore;
      if (band === "nord") {
        up += drew ? 1 : 0;
        upRow += took ? 1 : 0;
        upCoast += washed ? 1 : 0;
        upChip += barren ? 0 : 1;
      } else {
        down += drew ? 1 : 0;
        downRow += took ? 1 : 0;
        downCoast += washed ? 1 : 0;
        downChip += barren ? 0 : 1;
      }
    }
  }
  if (council !== null) {
    // The council is no use to anybody it cannot be sailed to - see
    // openCouncil, which moves one field of the region if the deal shut it in.
    openCouncil(board, council, {
      land,
      hidden,
      hiddenChips,
      fish: fishes,
      spice: villages,
    });
  }
  return {
    land,
    chips,
    hidden,
    hiddenChips,
    fish: fishes,
    spice: villages,
    council,
  };
}

/**
 * Whether this field of a region touches the start island.
 *
 * @param board - the lattice
 * @param hex - the field
 * @returns whether it is the region's coastal row
 */
function coastRow(board: Island, hex: number): boolean {
  const band = region(board, hex);
  if (band === "insel") {
    return false;
  }
  const rows = board.hexes
    .filter((each) => region(board, each.id) === band)
    .map((each) => each.row);
  const nearest = band === "nord" ? Math.max(...rows) : Math.min(...rows);
  return board.hexes[hex].row === nearest;
}

/**
 * A field of the same row beside this one.
 *
 * @param board - the lattice
 * @param hex - the field to sit beside
 * @returns its neighbour in the row, or the field itself when the row is one
 * @remarks
 * The row rather than any neighbour, because a row is where the deal counts its
 * slots: taking one out of the same row keeps the count of that row right.
 */
function beside(board: Island, hex: number): number {
  const row = board.hexes.filter((each) => each.row === board.hexes[hex].row);
  const at = row.findIndex((each) => each.id === hex);
  return (row[at - 1] ?? row[at + 1] ?? row[at]).id;
}

/**
 * Where the robber starts on a board dealt at sea.
 *
 * @param archipelago - the fields and chips actually laid out
 * @param scenario - which scenario is being played
 * @returns the field it stands on, or off the board
 * @remarks
 * Every Seefahrer scenario says it for itself, and they do not agree - so this
 * says it scenario by scenario rather than guessing from the board:
 *
 * - *Zu neuen Ufern*: "startet im Spiel zu dritt auf dem Feld mit der '12', im
 *   Spiel zu viert auf der Wüste" - so the desert where the deal has one.
 * - *Die vier Inseln*, *Ozeanien*, *Stoffe für Catan* and the free game *Neue
 *   Welt*: "Der Räuber startet auf dem Feld mit der '12'."
 * - *Durch die Wüste* ("auf einer der drei Wüsten"), *Der vergessene Stamm*
 *   (the start desert) and *Die Catanischen Wunder* ("auf einer beliebigen
 *   Wüste"): the desert.
 * - *Die Pirateninseln*: "**Es gibt keinen Räuber.**" Nothing on the board at
 *   all - and that matters, because a robber parked on a landscape would block
 *   its yield for the whole game.
 */
function seaRobber(
  archipelago: {
    readonly land: readonly Land[];
    readonly chips: readonly number[];
  } | null,
  scenario: Scenario,
): number {
  if (archipelago === null) {
    return OFF_BOARD;
  }
  if (scenario === "pirateninseln") {
    return OFF_BOARD;
  }
  const twelve = archipelago.chips.indexOf(ROBBER_CHIP);
  const desert = archipelago.land.indexOf("wueste");
  const onTwelve =
    scenario === "inseln" ||
    scenario === "ozeanien" ||
    scenario === "stoffe" ||
    scenario === "neuewelt";
  if (onTwelve && twelve >= 0) {
    return twelve;
  }
  return desert >= 0 ? desert : twelve >= 0 ? twelve : OFF_BOARD;
}

/** The number the robber starts on where there is no desert. */
const ROBBER_CHIP = 12;

/**
 * Puts the settlements that stand on the pirate fortresses on the board.
 *
 * @param forts - the fortresses, by crossing
 * @param towns - the crossings as they are so far
 * @param board - the lattice
 * @returns the crossings with those settlements standing
 * @remarks
 * "Jede Piratenfestung besteht aus 3 gleichfarbigen Piratenfestungs-Chips, auf
 * die jeweils 1 Siedlung derselben Farbe gesetzt wird" - they are on the board
 * before anybody has played a turn, and they are not built by anybody: "1
 * Piratenfestung, die jedoch nicht als Siedlung zählt".
 */
function withForts(
  forts: Readonly<
    Record<number, { readonly owner: number; readonly chips: number }>
  >,
  towns: readonly (Town | null)[],
  board: Island,
): readonly (Town | null)[] {
  return board.crossings.map((crossing) => {
    const fort = forts[crossing.id];
    return fort === undefined
      ? (towns[crossing.id] ?? null)
      : { owner: fort.owner, city: false };
  });
}

/**
 * Deals *Die Catanischen Wunder*: the big island, and small ones around it.
 *
 * @param board - the lattice
 * @param random - the generator
 * @returns the fields and their chips
 * @remarks
 * "Die Landschaftsfelder und Zahlenchips der großen Insel können innerhalb der
 * vorgegebenen Form beliebig neu ausgelegt und kombiniert werden. Hierbei
 * sollten jedoch die beiden Landschaftsfelder, die an die Wüsten grenzen, keine
 * guten Zahlenwerte erhalten (weder 6 noch 8)" - the shape stands, the fields
 * inside it are shuffled, and the numbers are laid again until they lie well.
 *
 * The board is the one *Der vergessene Stamm* uses: a long island in the middle
 * and six single fields around it. Here the small ones are settled rather than
 * visited - "gründest du im Laufe des Spieles eine Siedlung auf einer kleinen
 * Insel, erhältst du 1 Siegpunkt-Chip" - which is what the island chips of the
 * general rules already pay.
 */
function dealWonders(
  board: Island,
  random: Random,
): { readonly land: readonly Land[]; readonly chips: readonly number[] } {
  let land: readonly Land[] = [];
  let chips: readonly number[] = [];
  for (let tries = 0; tries < DEAL_TRIES; tries++) {
    const main = shuffle(random, WONDER_MAIN_LAND);
    const isles = shuffle(random, WONDER_ISLE_LAND);
    const numbers = shuffle(random, WONDER_CHIPS);
    land = board.hexes.map((hex) => {
      const inMain = TRIBE_MAIN.indexOf(hex.id);
      const inIsle = TRIBE_ISLES.indexOf(hex.id);
      return inMain >= 0
        ? (main[inMain] ?? "meer")
        : inIsle >= 0
          ? (isles[inIsle] ?? "meer")
          : "meer";
    });
    let next = 0;
    chips = land.map((kind) => {
      let chip = 0;
      if (kind !== "meer" && kind !== "wueste") {
        chip = numbers[next] ?? 0;
        next += 1;
      }
      return chip;
    });
    if (chipsLieWell(board, land, chips)) {
      break;
    }
  }
  return { land, chips };
}

/**
 * Deals *Die Pirateninseln*: a board that is not dealt at all.
 *
 * @param board - the lattice
 * @param random - the generator
 * @param seats - how many colours are playing
 * @returns the fields, their chips, the fortresses and the marked crossings
 * @remarks
 * "Das Szenario ist nur mit dem vorgegebenen Aufbau ausgewogen und sollte nicht
 * variiert werden" - so only the landscapes of the home island are shuffled,
 * and their chips stay where they are.
 *
 * Every colour gets one **fortress** on the pirate islands in the west, with a
 * settlement of its own colour standing on it, and one **marked crossing** on
 * the same island, which is the only place it may later build. "Spielt ihr zu
 * dritt, entfällt Weiß als Spielfarbe" - so a smaller table uses fewer of the
 * islands and the rest are left as they are. There are six, because the 5-6
 * Personen Erweiterung brings "6 Piratenfestungen" and every colour needs one:
 * a colour without a fortress has nothing to conquer and would win on points
 * alone, which is the one thing this scenario does not allow.
 */
function dealCorsairs(
  board: Island,
  random: Random,
  seats: number,
): {
  readonly land: readonly Land[];
  readonly chips: readonly number[];
  readonly forts: Readonly<
    Record<number, { readonly owner: number; readonly chips: number }>
  >;
  readonly marks: readonly number[];
} {
  const home = shuffle(random, CORSAIR_LAND);
  const land = board.hexes.map((hex) => {
    const inHome = CORSAIR_HOME.indexOf(hex.id);
    const inIsle = CORSAIR_ISLES.indexOf(hex.id);
    return CORSAIR_DUNES.includes(hex.id)
      ? "wueste"
      : inHome >= 0
        ? (home[inHome] ?? "meer")
        : inIsle >= 0
          ? (CORSAIR_ISLE_LAND[inIsle] ?? "meer")
          : "meer";
  });
  let next = 0;
  const chips = land.map((kind, hex) => {
    const inIsle = CORSAIR_ISLES.indexOf(hex);
    let chip = 0;
    if (CORSAIR_HOME.includes(hex) && kind !== "wueste") {
      chip = CORSAIR_CHIPS[next] ?? 0;
      next += 1;
    } else if (inIsle >= 0) {
      chip = CORSAIR_ISLE_CHIPS[inIsle] ?? 0;
    }
    return chip;
  });
  const forts: Record<
    number,
    { readonly owner: number; readonly chips: number }
  > = {};
  const marks: number[] = [];
  CORSAIR_ISLES.slice(0, seats).forEach((hex, seat) => {
    // The fortress on the seaward corner, and the colour's own crossing beside
    // it: "erreichst du die Kreuzung mit deinem Farbchip, darfst du die
    // Baukosten zahlen und hier eine Siedlung bauen."
    const corners = board.hexes[hex].corners;
    forts[corners[0]] = { owner: seat, chips: FORT_CHIPS };
    marks.push(corners[FORT_MARK]);
  });
  return { land, chips, forts, marks };
}

/** Which corner of a pirate island carries the colour's own chip. */
const FORT_MARK = 3;

/**
 * Deals *Stoffe für Catan*: two main islands, and four villages between them.
 *
 * @param board - the lattice
 * @param random - the generator
 * @returns the fields, their chips and the villages with their cloth
 * @remarks
 * "Die Landschaftsfelder und Zahlenchips der beiden Hauptinseln könnt ihr
 * beliebig neu anordnen. Position und Zahlenchips der 4 Inseln in der Mitte
 * sollten nicht verändert werden" - so the two main islands are shuffled and
 * the middle is not, except for which number sits on which village, which the
 * printed picture fixes and this reconstruction has to choose anyway.
 *
 * Each small island carries **two** villages: "auf die 4 kleinen Inseln legt
 * ihr je 2 Zahlenchips, genau auf die Kreuzung". They go on two opposite
 * corners of the field, so a ship can reach either without blocking the other.
 */
function dealCloth(
  board: Island,
  random: Random,
): {
  readonly land: readonly Land[];
  readonly chips: readonly number[];
  readonly villagesOf: Readonly<
    Record<number, { readonly number: number; readonly bales: number }>
  >;
} {
  const main = [...CLOTH_NORTH, ...CLOTH_SOUTH];
  const dealt = shuffle(random, CLOTH_MAIN_LAND);
  const isles = shuffle(random, CLOTH_ISLE_LAND);
  const numbers = shuffle(random, CLOTH_CHIPS);
  const land = board.hexes.map((hex) => {
    const inMain = main.indexOf(hex.id);
    const inIsle = CLOTH_ISLES.indexOf(hex.id);
    return inMain >= 0
      ? (dealt[inMain] ?? "meer")
      : inIsle >= 0
        ? (isles[inIsle] ?? "meer")
        : "meer";
  });
  let next = 0;
  const chips = land.map((kind, hex) => {
    let chip = 0;
    // The four small islands "bringen keine Erträge": their numbers sit on
    // their crossings as villages, not on the fields.
    if (main.includes(hex) && kind !== "wueste") {
      chip = numbers[next] ?? 0;
      next += 1;
    }
    return chip;
  });
  const villageChips = shuffle(random, CLOTH_VILLAGE_CHIPS);
  const villagesOf: Record<
    number,
    { readonly number: number; readonly bales: number }
  > = {};
  let given = 0;
  CLOTH_ISLES.forEach((hex) => {
    const corners = board.hexes[hex].corners;
    // Two of the six, opposite one another.
    [corners[0], corners[VILLAGE_APART]].forEach((corner) => {
      villagesOf[corner] = {
        number: villageChips[given] ?? 0,
        bales: CLOTH_PER_VILLAGE,
      };
      given += 1;
    });
  });
  return { land, chips, villagesOf };
}

/** How far apart on a field the two villages sit: opposite corners. */
const VILLAGE_APART = 3;

/**
 * Deals *Der vergessene Stamm*: the long island, and the gifts on the coasts.
 *
 * @param board - the lattice
 * @param random - the generator
 * @returns the fields, their chips and what lies on the coastlines
 * @remarks
 * "Legt 8 Siegpunkt-Chips auf die markierten Küstenlinien. Mischt die 6 Häfen
 * verdeckt und legt sie auf die markierten Plätze. Dreht sie anschließend um.
 * Nehmt die obersten 4 Karten vom gemischten Stapel mit den Entwicklungskarten
 * und legt diese verdeckt auf die markierten Plätze." Eighteen gifts, and the
 * marked places are the coastlines of the small islands - so here they are
 * dealt onto the sea paths around them, at most one to a path.
 */
function dealTribe(
  board: Island,
  random: Random,
): {
  readonly land: readonly Land[];
  readonly chips: readonly number[];
  readonly presents: Readonly<Record<number, Gift>>;
} {
  const main = shuffle(random, TRIBE_MAIN_LAND);
  const isles = shuffle(random, TRIBE_ISLE_LAND);
  const numbers = shuffle(random, TRIBE_CHIPS);
  const land = board.hexes.map((hex) => {
    const inMain = TRIBE_MAIN.indexOf(hex.id);
    const inIsle = TRIBE_ISLES.indexOf(hex.id);
    return inMain >= 0
      ? (main[inMain] ?? "meer")
      : inIsle >= 0
        ? (isles[inIsle] ?? "meer")
        : "meer";
  });
  let next = 0;
  const chips = land.map((kind, hex) => {
    let chip = 0;
    // "Die kleinen Inseln bleiben alle ohne Zahlenchip": only the main island
    // pays, and its desert pays nothing either.
    if (TRIBE_MAIN.includes(hex) && kind !== "wueste") {
      chip = numbers[next] ?? 0;
      next += 1;
    }
    return chip;
  });
  const coast = shuffle(random, [
    ...new Set(TRIBE_ISLES.flatMap((hex) => board.hexes[hex].rim)),
  ]);
  const wants = shuffle(random, [...RESOURCES, null]);
  const presents: Record<number, Gift> = {};
  coast.slice(0, TRIBE_GIFT_CHIPS).forEach((path) => {
    presents[path] = { kind: "chip" };
  });
  coast
    .slice(TRIBE_GIFT_CHIPS, TRIBE_GIFT_CHIPS + TRIBE_GIFT_PORTS)
    .forEach((path, at) => {
      presents[path] = { kind: "harbour", want: wants[at] ?? null };
    });
  coast
    .slice(
      TRIBE_GIFT_CHIPS + TRIBE_GIFT_PORTS,
      TRIBE_GIFT_CHIPS + TRIBE_GIFT_PORTS + TRIBE_GIFT_CARDS,
    )
    .forEach((path) => {
      presents[path] = { kind: "card" };
    });
  return { land, chips, presents };
}

/**
 * Deals *Durch die Wüste*: one island cut in two by a belt of desert.
 *
 * @param board - the lattice
 * @param random - the generator
 * @returns the fields and their chips
 * @remarks
 * "Die Landschaftsfelder, Häfen und Zahlenchips der Hauptinsel ... können
 * beliebig neu ausgelegt werden. Ihr könnt auch die Landschaftsfelder und
 * Zahlenchips der kleinen Inseln und des abgetrennten und markierten
 * Landstreifens ... neu auslegen. Rote Zahlen sollten jedoch nicht
 * nebeneinander oder auf einem Goldfluss liegen." Three shuffles into three
 * fixed outlines, and the numbers laid again until they lie the way the
 * rulebook wants them.
 */
function dealDunes(
  board: Island,
  random: Random,
): { readonly land: readonly Land[]; readonly chips: readonly number[] } {
  let land: readonly Land[] = [];
  let chips: readonly number[] = [];
  for (let tries = 0; tries < DEAL_TRIES; tries++) {
    const main = shuffle(random, DUNE_MAIN_LAND);
    const strip = shuffle(random, DUNE_STRIP_LAND);
    const isles = shuffle(random, DUNE_ISLE_LAND);
    const numbers = shuffle(random, DUNE_CHIPS);
    land = board.hexes.map((hex) => {
      const inMain = DUNE_MAIN.indexOf(hex.id);
      const inStrip = DUNE_STRIP.indexOf(hex.id);
      const inIsle = DUNE_ISLES.indexOf(hex.id);
      return DUNE_BELT.includes(hex.id)
        ? "wueste"
        : inMain >= 0
          ? (main[inMain] ?? "meer")
          : inStrip >= 0
            ? (strip[inStrip] ?? "meer")
            : inIsle >= 0
              ? (isles[inIsle] ?? "meer")
              : "meer";
    });
    let next = 0;
    chips = land.map((kind) => {
      let chip = 0;
      if (kind !== "meer" && kind !== "wueste") {
        chip = numbers[next] ?? 0;
        next += 1;
      }
      return chip;
    });
    if (chipsLieWell(board, land, chips)) {
      break;
    }
  }
  return { land, chips };
}

/**
 * Deals *Ozeanien*: two start islands, and fog over everything else.
 *
 * @param board - the lattice
 * @param random - the generator
 * @returns the fields, their chips, and what waits under the fog
 * @remarks
 * "Mischt die Sechseckfelder, die übrig geblieben ... sind, und legt sie
 * verdeckt auf die freien Plätze. Die Zahlenchips für diese Landschaftsfelder
 * werden ebenfalls gemischt und als verdeckter Stapel bereitgelegt." So the
 * chips of the fog are a **pile**, not a field each: the one that comes off the
 * top belongs to whatever field has just been turned over. Here the pile is
 * dealt onto the hidden landscapes in advance, which is the same thing seen
 * from the other end and saves carrying a stack around.
 *
 * "Sollten 2 rote Zahlenchips nebeneinander liegen, ist dies ausnahmsweise
 * erlaubt" - so this deal does not ask {@link chipsLieWell} about the fog.
 */
function dealFog(
  board: Island,
  random: Random,
): {
  readonly land: readonly Land[];
  readonly chips: readonly number[];
  readonly hidden: readonly Land[];
  readonly hiddenChips: readonly number[];
} {
  const start = fogIslands(board).flat();
  const dealt = shuffle(random, FOG_START_LAND);
  const numbers = shuffle(random, FOG_START_CHIPS);
  const fogged = shuffle(random, [
    ...FOG_HIDDEN_LAND,
    ...Array.from(
      { length: board.hexes.length - start.length - FOG_HIDDEN_LAND.length },
      () => "meer" as const,
    ),
  ]);
  const pile = shuffle(random, FOG_HIDDEN_CHIPS);
  let taken = 0;
  let chip = 0;
  const land: Land[] = [];
  const chips: number[] = [];
  const hidden: Land[] = [];
  const hiddenChips: number[] = [];
  board.hexes.forEach((hex) => {
    const at = start.indexOf(hex.id);
    if (at >= 0) {
      land.push(dealt[at] ?? "meer");
      chips.push(numbers[at] ?? 0);
      hidden.push("unbekannt");
      hiddenChips.push(0);
    } else {
      const kind = fogged[taken] ?? "meer";
      taken += 1;
      land.push("unbekannt");
      chips.push(0);
      hidden.push(kind);
      hiddenChips.push(kind === "meer" ? 0 : (pile[chip] ?? 0));
      chip += kind === "meer" ? 0 : 1;
    }
  });
  return { land, chips, hidden, hiddenChips };
}

/**
 * Deals *Die vier Inseln*: four fixed outlines, everything inside them shuffled.
 *
 * @param board - the lattice
 * @param random - the generator
 * @returns the fields and their chips
 * @remarks
 * "Innerhalb der Umrisse könnt ihr die Landschaftsfelder, Häfen und Zahlenchips
 * beliebig neu verteilen. Achtet aber darauf, dass Wald und Weideland nicht zu
 * schlechte Zahlen erhalten" - the second half of that is what
 * {@link chipsLieWell} already watches over, so the deal is dealt again until
 * the numbers lie the way the rulebook wants them.
 */
function dealFourIslands(
  board: Island,
  random: Random,
): { readonly land: readonly Land[]; readonly chips: readonly number[] } {
  const isles = fourIslands(board).flat();
  let land: readonly Land[] = [];
  let chips: readonly number[] = [];
  for (let tries = 0; tries < DEAL_TRIES; tries++) {
    const dealt = shuffle(random, FOUR_LAND);
    const numbers = shuffle(random, FOUR_CHIPS);
    land = board.hexes.map((hex) => {
      const at = isles.indexOf(hex.id);
      return at >= 0 ? (dealt[at] ?? "meer") : "meer";
    });
    let next = 0;
    chips = land.map((kind) => {
      let chip = 0;
      if (kind !== "meer") {
        chip = numbers[next] ?? 0;
        next += 1;
      }
      return chip;
    });
    if (chipsLieWell(board, land, chips)) {
      break;
    }
  }
  return { land, chips };
}

/**
 * Picks where the small islands lie.
 *
 * @param board - the lattice
 * @param open - the free ring fields, shuffled
 * @returns the fields the landscapes go on
 * @remarks
 * "Kleine Inseln", and the plural is the rule: the free ring of this lattice is
 * one field thick and hangs together, so laying the seven landscapes anywhere
 * in it makes **one** long island rather than several. So a field joins only
 * where it would keep its island under four fields, and never where it would
 * weld two of them together.
 */
function isleSpots(board: Island, open: readonly number[]): readonly number[] {
  const taken: number[] = [];
  const near = (hex: number): readonly number[] =>
    board.hexes[hex].rim.flatMap((path) =>
      board.paths[path].hexes.filter((each) => each !== hex),
    );
  const groupOf = (hex: number, placed: readonly number[]): number => {
    const seen = new Set<number>([hex]);
    const edge = [hex];
    while (edge.length > 0) {
      const at = edge.pop() as number;
      for (const other of near(at)) {
        if (placed.includes(other) && !seen.has(other)) {
          seen.add(other);
          edge.push(other);
        }
      }
    }
    return seen.size;
  };
  for (const hex of open) {
    if (taken.length >= SHORE_ISLE_LAND.length) {
      break;
    }
    // None of them bigger than three fields - the walk counts the whole group
    // the new field would belong to, so two islands welded into one are caught
    // by the same test.
    if (groupOf(hex, [...taken, hex]) <= ISLE_SIZE) {
      taken.push(hex);
    }
  }
  return taken;
}

/** How big a small island may grow. */
const ISLE_SIZE = 3;

/**
 * Deals *Zu neuen Ufern*: one big island, small ones around it.
 *
 * @param board - the lattice
 * @param random - the generator
 * @returns the fields and their chips
 * @remarks
 * "Mischt die Landschaftsfelder der Hauptinsel und legt diese zufällig aus ...
 * Mischt verdeckt die Sechseckfelder des eingerahmten Gebiets, legt sie
 * zufällig aus." Two shuffles, and the small islands are what the second one
 * makes of nine landscapes among sixteen sea fields.
 *
 * The one condition on that second shuffle: a small island may not touch the
 * main one, or it would not be an island at all - and reaching it would need no
 * ship, which is the whole point of the scenario.
 */
function dealShores(
  board: Island,
  random: Random,
): { readonly land: readonly Land[]; readonly chips: readonly number[] } {
  const main = mainIsland(board);
  const outside = board.hexes
    .map((hex) => hex.id)
    .filter((hex) => !main.includes(hex));
  // A field of the ring that touches the main island is sea for good: an
  // island grown onto the mainland is a peninsula.
  const coastal = outside.filter((hex) =>
    board.hexes[hex].corners.some((corner) =>
      board.crossings[corner].hexes.some((near) => main.includes(near)),
    ),
  );
  const open = outside.filter((hex) => !coastal.includes(hex));
  let land: Land[] = [];
  let chips: number[] = [];
  for (let tries = 0; tries < DEAL_TRIES; tries++) {
    const inner = shuffle(random, SHORE_MAIN_LAND);
    const outer = shuffle(random, SHORE_ISLE_LAND);
    const innerChips = shuffle(random, SHORE_MAIN_CHIPS);
    const outerChips = shuffle(random, SHORE_ISLE_CHIPS);
    const spots = isleSpots(board, shuffle(random, open));
    land = board.hexes.map((hex) => {
      const at = main.indexOf(hex.id);
      const out = spots.indexOf(hex.id);
      return at >= 0
        ? (inner[at] ?? "meer")
        : out >= 0
          ? (outer[out] ?? "meer")
          : "meer";
    });
    let nextInner = 0;
    let nextOuter = 0;
    chips = land.map((kind, hex) => {
      let chip = 0;
      if (kind !== "meer" && kind !== "wueste") {
        if (main.includes(hex)) {
          chip = innerChips[nextInner] ?? 0;
          nextInner += 1;
        } else {
          chip = outerChips[nextOuter] ?? 0;
          nextOuter += 1;
        }
      }
      return chip;
    });
    // Every landscape of the framed area has to find a place - the shuffle
    // decides how well the small islands fall, and a deal that leaves one over
    // is simply dealt again.
    if (
      spots.length === SHORE_ISLE_LAND.length &&
      chipsLieWell(board, land, chips)
    ) {
      break;
    }
  }
  return { land, chips };
}

/**
 * Whether a field of a region belongs to the region proper.
 *
 * @param board - the lattice
 * @param hex - the field
 * @param trim - how many fields of the row are open sea, half at each end
 * @returns whether the field is dealt rather than water
 */
function inRegion(board: Island, hex: number, trim: number): boolean {
  const row = board.hexes.filter((each) => each.row === board.hexes[hex].row);
  const at = row.findIndex((each) => each.id === hex);
  const skip = Math.floor(trim / 2);
  return at >= skip && at < row.length - (trim - skip);
}

/** How much narrower than its row a region is on the board of five and six. */
const REGION_TRIM = 2;

/**
 * A pile of face-down fields, as long as the region behind its fixed row.
 *
 * @param size - how many fields there are to fill
 * @param list - the printed pile
 * @returns the pile, stretched with countryside where the board is wider
 * @remarks
 * The scenario's own material - Goldflussfelder, Fischfelder, Gewürzfelder -
 * lies in the fixed rows and is never touched by this; what grows is the land
 * around it.
 */
function stretchPile(size: number, list: readonly Land[]): readonly Land[] {
  // Like a fixed row, the pile of a wider board carries one more field of the
  // mission itself - "6 Fischfelder aus Entdecker & Piraten" where the smaller
  // table plays five - and countryside after that.
  return stretchRow(list, Math.max(size, list.length));
}

/**
 * Where the Catanischer Rat goes.
 *
 * @param board - the lattice
 * @param random - the generator
 * @returns the sea field it takes
 * @remarks
 * On the inner row of the southern region, so it touches the start island the
 * way the printed tile does - and never at the very end of the row, where one
 * of its two harbours would sit against the frame.
 */
function councilHex(board: Island, random: Random): number {
  // The row of the southern region that touches the start island, which is
  // where the printed tile lies: "da der Catanische Rat an die Startinsel
  // grenzt". With a two-row region that is the only inner row; with three it is
  // the first of them.
  const south = board.hexes.filter((hex) => region(board, hex.id) === "sued");
  const first = Math.min(...south.map((hex) => hex.row));
  const row = south.filter((hex) => hex.row === first);
  const middle = row.slice(1, -1);
  const pick = middle.length > 0 ? middle : row;
  return pick[randomInt(random, pick.length)].id;
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
        : // "Das Szenario endet, wenn eine Person in ihrem Zug 15 Siegpunkte
          // erreicht hat" - two missions are worth more, so the target rises.
          scenario === "fische"
          ? FISH_TARGET
          : scenario === "gewuerze"
            ? SPICE_TARGET
            : scenario === "finale"
              ? FINAL_TARGET
              : // "Sobald jemand an der Reihe ist und dabei 14 Siegpunkte
                // erreicht, gewinnt diese Person."
                scenario === "ufer"
                ? SHORE_TARGET
                : // "Sobald jemand an der Reihe ist und dabei 13 Siegpunkte
                  // erreicht."
                  scenario === "inseln"
                  ? FOUR_TARGET
                  : // "Sobald jemand an der Reihe ist und dabei 12 Siegpunkte
                    // erreicht."
                    scenario === "ozeanien"
                    ? FOG_TARGET
                    : // "Sobald jemand an der Reihe ist und dabei 14
                      // Siegpunkte erreicht."
                      scenario === "wuestengurt"
                      ? DUNE_TARGET
                      : // "Sobald jemand an der Reihe ist und dabei 13
                        // Siegpunkte erreicht."
                        scenario === "stamm"
                        ? TRIBE_TARGET
                        : // "Sobald jemand an der Reihe ist und dabei 14
                          // Siegpunkte erreicht, hat diese Person gewonnen."
                          scenario === "stoffe"
                          ? CLOTH_TARGET
                          : // "Wer zuerst die Piratenfestung erobert und 10
                            // Siegpunkte besitzt, gewinnt."
                            scenario === "pirateninseln"
                            ? CORSAIR_TARGET
                            : // "... wenn jemand an der Reihe ist, 10
                              // Siegpunkte besitzt und eine höhere Stufe ...
                              // erreicht hat als die anderen."
                              scenario === "wunder"
                              ? WONDER_TARGET
                              : goal;
  // Seefahrer plays on its own, bigger board: "30 Sechseckfelder" on top of the
  // printed nineteen, laid inside a longer frame.
  const hexes =
    scenario === "neuewelt" ||
    scenario === "ufer" ||
    scenario === "inseln" ||
    scenario === "ozeanien" ||
    scenario === "wuestengurt" ||
    scenario === "stamm" ||
    scenario === "stoffe" ||
    scenario === "pirateninseln" ||
    scenario === "wunder"
      ? SEA_HEXES
      : // "Die Startinsel wird bei allen Szenarien für 5-6 Personen gleich
        // aufgebaut" - one and twenty fields rather than fourteen, and a region
        // of ten rather than seven. That is the board of the Seefahrer table,
        // and every scenario of Entdecker & Piraten plays on it at five and
        // six: 22 in the middle, 11 to a region.
        finding({ scenario } as CatanGame) && seats.length > SMALL_TABLE
        ? SEA_HEXES
        : scenario === "finale"
          ? FINAL_HEXES
          : scenario === "fische" || scenario === "gewuerze"
            ? FISH_HEXES
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
  const archipelago: {
    readonly land: readonly Land[];
    readonly chips: readonly number[];
    readonly hidden?: readonly Land[];
    readonly hiddenChips?: readonly number[];
    readonly presents?: Readonly<Record<number, Gift>>;
    readonly villagesOf?: Readonly<
      Record<number, { readonly number: number; readonly bales: number }>
    >;
    readonly forts?: Readonly<
      Record<number, { readonly owner: number; readonly chips: number }>
    >;
    readonly marks?: readonly number[];
  } | null =
    scenario === "neuewelt"
      ? dealArchipelago(board, random)
      : scenario === "ufer"
        ? dealShores(board, random)
        : scenario === "inseln"
          ? dealFourIslands(board, random)
          : scenario === "ozeanien"
            ? dealFog(board, random)
            : scenario === "wuestengurt"
              ? dealDunes(board, random)
              : scenario === "stamm"
                ? dealTribe(board, random)
                : scenario === "stoffe"
                  ? dealCloth(board, random)
                  : scenario === "pirateninseln"
                    ? dealCorsairs(board, random, seats.length)
                    : scenario === "wunder"
                      ? dealWonders(board, random)
                      : null;
  const unknown = finding({ scenario } as CatanGame)
    ? dealFind(
        board,
        random,
        scenario === "piraten" || scenario === "fische",
        scenario === "fische",
        scenario === "gewuerze",
        scenario === "finale",
      )
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
      // *Entdecker & Piraten* has them as well, and only as obstacles - "die
      // Figuren der nicht gewählten Farben bleiben auf der Startinsel als
      // Hindernis stehen" - with none of CATAN für Zwei's rules: they never
      // build, never roll and hold no Handelschips. See obstacleTowns.
      ...(seats.length === TWO_PLAYERS
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
      // "Mischt die 6 Häfen verdeckt und legt sie auf die markierten Plätze":
      // in Der vergessene Stamm every harbour there is lies on a coastline as a
      // gift, so the board starts without any.
      scenario === "stamm"
        ? []
        : archipelago === null
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
        : // A board dealt at sea has its own fields, and its own desert or none
          // at all: the archipelago of the Neue Welt has none, Zu neuen Ufern
          // has one on its main island. Taking the index out of the island deal
          // instead put the robber on whatever field happened to carry it -
          // twice over, because that deal is not the one being played.
          archipelago !== null
          ? seaRobber(archipelago, scenario)
          : // "Stellt den Räuber auf ein beliebiges der beiden Sumpffelder."
            // There is no desert in the rivers scenario either - the marshes
            // take its place, and the robber starts on one of them.
            (water?.marshes[0] ?? desert),
    // The two neutral settlements are already standing when the founding
    // phase begins - they are part of the setup, not of anybody's turn.
    // The two neutral settlements belong to CATAN für Zwei, which Entdecker &
    // Piraten does not use - see the seat list above.
    towns: withForts(
      archipelago?.forts ?? {},
      // "Die Figuren der nicht gewählten Farben bleiben auf der Startinsel als
      // Hindernis stehen": Entdecker & Piraten at a table of two puts its own
      // neutral pieces down, and none of CATAN für Zwei's.
      finding({ scenario } as CatanGame) && seats.length === TWO_PLAYERS
        ? obstacleTowns(board, seats.length)
        : startingTowns(board, seats.length),
      board,
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
    villagesOf: archipelago?.villagesOf ?? {},
    forts: archipelago?.forts ?? {},
    marks: archipelago?.marks ?? [],
    warships: [],
    armada: 0,
    stormed: false,
    wonders: seats.map(() => null),
    traders: {},
    baleStock: CLOTH_SUPPLY,
    lockedShips: [],
    presents: archipelago?.presents ?? {},
    heldPorts: seats.map(() => []),
    // "Hat er die Startwüste verlassen, darf er nicht mehr dorthin
    // zurückgesetzt werden."
    robberHome: scenario === "stamm" ? seaRobber(archipelago, scenario) : null,
    boats: [],
    hidden:
      unknown?.hidden ??
      archipelago?.hidden ??
      board.hexes.map(() => "unbekannt" as const),
    hiddenChips:
      archipelago === null || archipelago.hiddenChips === undefined
        ? (unknown?.hiddenChips ?? board.hexes.map(() => 0))
        : archipelago.hiddenChips,
    sailing: null,
    docks: {},
    camps: {},
    pirateShip: null,
    tributes: [],
    chased: [],
    mission: seats.map(() => 0),
    catches: seats.map(() => 0),
    fish: unknown?.fish ?? {},
    spice: unknown?.spice ?? {},
    villages: {},
    sacks: {},
    spices: seats.map(() => 0),
    sold: 0,
    shoals: [],
    shoalsLeft: SHOALS,
    cast: false,
    council: unknown?.council ?? null,
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
      order: foundingOrder(
        seats.length,
        first,
        scenario === "stoffe" ? CLOTH_ROUNDS : undefined,
      ),
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
