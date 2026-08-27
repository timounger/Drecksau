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

import { SMALL_HEXES, hexesFor, islandOf, type Island } from "./board";
import { buildEventCards, stackEvents } from "./events";
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
function layChips(land: readonly Land[], start: number): readonly number[] {
  const board = islandOf(land.length);
  const letters =
    land.length === SMALL_HEXES ? CHIP_LETTERS : CREW_CHIP_LETTERS;
  const chips = board.hexes.map(() => 0);
  let letter = 0;
  (board.spirals[start] ?? []).forEach((hex) => {
    if (land[hex] !== "wueste") {
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
  };
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
): CatanGame {
  const random = createRandom(seed);
  const goal = mode === "ritter" ? target + RITTER_EXTRA : target;
  const hexes = hexesFor(seats.length);
  const board = islandOf(hexes);
  const land = dealLand(random, hexes);
  const start = board.cornerHexes[randomInt(random, board.cornerHexes.length)];
  const chips = layChips(land, start);
  const first = randomInt(random, seats.length);
  // "Der Räuber startet beliebig auf einer der beiden Wüsten."
  const deserts = land.reduce<number[]>(
    (list, kind, at) => (kind === "wueste" ? [...list, at] : list),
    [],
  );
  const desert = deserts[randomInt(random, deserts.length)];
  return {
    seed: random.state(),
    players: [
      ...seats.map((seat, index) =>
        seatPlayer(
          seat,
          COLOURS[index],
          seats.length === TWO_PLAYERS ? START_CHIPS : 0,
        ),
      ),
      // "Die beiden Figurensätze, mit denen ihr nicht spielt, sind die Figuren
      // von zwei imaginären neutralen Personen." Only ever at a table of two.
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
    land,
    chips,
    harbours: dockHarbours(random, hexes),
    robber: desert,
    // The two neutral settlements are already standing when the founding
    // phase begins - they are part of the setup, not of anybody's turn.
    towns: startingTowns(board, seats.length),
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
    target: goal + (variants.includes("haefen") ? 1 : 0),
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
