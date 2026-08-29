/**
 * *Der Barbarenüberfall* - the fourth of the five Händler & Barbaren scenarios.
 *
 * @module
 * @remarks
 * The biggest of the five, and nearly a game of its own: barbarians land on the
 * coast and choke it off, knights are trained in a castle and ride out to beat
 * them, there is no robber at all, and the development cards are a deck of
 * twenty-six that fire the moment they are bought.
 *
 * What that changes about Catan, in one list:
 *
 * - the island is **laid out**, not dealt: a castle and a desert side by side,
 *   ten coast fields around them and seven inland ones,
 * - **building** a settlement or a city brings a raid down on the coast,
 * - a coast field with three barbarians is **conquered**: no yield, no
 *   building at it, and any settlement that has nothing else left counts
 *   nothing,
 * - **knights stand on paths**, not on crossings, and ride at the end of a turn,
 * - a seven steals a card with no robber to move,
 * - two prisoners are a victory point, and the game runs to twelve.
 *
 * The rules are read out of `game_instructions/catan_babaren.pdf`, pages 15 to
 * 19, and written up in `docs/games/catan/szenarien.md`.
 */
import { islandOf, type Island } from "./board";
import type { CatanGame, Land } from "./state";

/** The barbarians in the box. */
export const BARBARIANS = 36;

/** How many knights each player gets. */
export const KNIGHTS_EACH = 6;

/** How many barbarians take a coast field. */
export const FULL_FIELD = 3;

/** How many numbers a raid rolls. */
export const RAID_ROLLS = 3;

/** How far a knight rides, and how much further one Getreide takes it. */
export const KNIGHT_STEPS = 3;
export const EXTRA_STEPS = 2;

/** What a lost knight and a missed prisoner are worth in gold. */
export const LOST_KNIGHT_GOLD = 3;
export const NO_PRISONER_GOLD = 3;

/**
 * What a lost knight is worth at a table of two.
 *
 * @remarks
 * "Als Entschädigung beim Verlust eines Ritters erhält man statt 3 Gold 2 Gold
 * und 1 Handelschip." The chip is the more valuable half: gold only buys
 * resources, a chip buys an action.
 */
export const LOST_KNIGHT_TWO_GOLD = 2;

/** The Handelschip that comes with it. */
export const LOST_KNIGHT_TWO_CHIP = 1;

/**
 * What the Fremder Ritter rolls when the prisoners are shared out.
 *
 * @remarks
 * "Gibt es nach einem Sieg nicht genug Gefangene für alle Parteien und ist der
 * Fremde Ritter am Sieg beteiligt, gilt für den Fremden Ritter immer das
 * Würfelergebnis '3'. Es muss also nicht extra für ihn gewürfelt werden."
 */
export const STRANGER_ROLL = 3;

/** How many prisoners make a victory point. */
export const PRISONERS_PER_POINT = 2;

/** The finish line: twelve rather than ten. */
export const BARBAREN_EXTRA = 2;

/** What the two barbarians on the table at the start stand on. */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the two numbers are
   the rulebook's own: "die Küstenfelder mit der '2' und der '12'". */
export const START_BARBARIAN_CHIPS: readonly number[] = [2, 12];
/* eslint-enable @typescript-eslint/no-magic-numbers */

/**
 * The ten coast fields.
 *
 * @remarks
 * "Im äußeren, grau markierten Kreis legt ihr in zufälliger Reihenfolge
 * folgende Landschaftsfelder aus: 2x Hügelland, 2x Wald, 3x Weideland, 2x
 * Ackerland, 1x Gebirge."
 */
export const COAST_LAND: readonly Land[] = [
  "lehm",
  "lehm",
  "holz",
  "holz",
  "wolle",
  "wolle",
  "wolle",
  "getreide",
  "getreide",
  "erz",
];

/**
 * The twelve coast fields of the bigger board.
 *
 * @remarks
 * "Im äußeren grauen Kreis legt ihr zufällig aus: 3x Hügelland, 3x Wald, 2x
 * Weideland, 2x Ackerland und 2x Gebirge" - the 5-6 booklet's own count, and
 * the ring of the big board holds exactly sixteen: these twelve, two deserts
 * and two castles.
 */
export const BIG_COAST_LAND: readonly Land[] = [
  "lehm",
  "lehm",
  "lehm",
  "holz",
  "holz",
  "holz",
  "wolle",
  "wolle",
  "getreide",
  "getreide",
  "erz",
  "erz",
];

/**
 * The fourteen inland fields of the bigger board.
 *
 * @remarks
 * "Legt in der inneren weißen Fläche zufällig aus: 2x Hügelland, 2x Wald, 3x
 * Weideland, 4x Ackerland und 3x Gebirge."
 */
export const BIG_INLAND_LAND: readonly Land[] = [
  "lehm",
  "lehm",
  "holz",
  "holz",
  "wolle",
  "wolle",
  "wolle",
  "getreide",
  "getreide",
  "getreide",
  "getreide",
  "erz",
  "erz",
  "erz",
];

/** How many castles and deserts the big board carries. */
export const BIG_CASTLES = 2;

/**
 * The seven inland fields.
 *
 * @remarks
 * "In der inneren, weiß markierten Fläche legt ihr in zufälliger Reihenfolge
 * folgende Landschaftsfelder aus: 1x Hügelland, 1x Wald, 1x Weideland, 2x
 * Ackerland, 2x Gebirge. Eine der Waldlandschaften bleibt übrig, diese benötigt
 * ihr für das Spiel nicht."
 */
export const INLAND_LAND: readonly Land[] = [
  "lehm",
  "holz",
  "wolle",
  "getreide",
  "getreide",
  "erz",
  "erz",
];

/** What the numbers a raid may not roll, and what two more steps cost. */
export const SEVEN = 7;

/** The four cards of this scenario's own deck. */
export type RaidCard = "ritterweihe" | "starkerRitter" | "verrat" | "gefangen";

/**
 * The twenty-six development cards.
 *
 * @remarks
 * "Mischt die 26 Entwicklungskarten dieses Szenarios." The rulebook shows the
 * four faces and gives the total, but not how the total splits - so the split
 * is a **reconstruction**, and it is chosen the way the scenario reads: knights
 * are the engine of it ("um dieses Szenario gewinnen zu können, solltet ihr
 * Ritter bauen"), so two thirds of the deck puts one on the board, with the
 * cheaper placement - into the castle, from where it still has to ride out -
 * the commoner of the two. The two events share the rest evenly.
 */
export const RAID_DECK: readonly RaidCard[] = [
  ...Array.from({ length: 10 }, () => "ritterweihe" as const),
  ...Array.from({ length: 6 }, () => "starkerRitter" as const),
  ...Array.from({ length: 5 }, () => "verrat" as const),
  ...Array.from({ length: 5 }, () => "gefangen" as const),
];

/** The names the log calls the four cards by. */
export const RAID_CARD_NAMES: Readonly<Record<RaidCard, string>> = {
  ritterweihe: "Ritterweihe",
  starkerRitter: "Starker Ritter",
  verrat: "Verrat",
  gefangen: "Gefangen",
};

/** What Verrat pays, and how many barbarians it moves. */
export const VERRAT_GOLD = 2;
export const VERRAT_MOVES = 2;

/** Whether this game is the barbarian scenario. */
export function raiding(game: CatanGame): boolean {
  return game.scenario === "barbaren";
}

/**
 * The castle, the desert, and the coast.
 *
 * @remarks
 * Laid once with the board. "Legt zunächst, wie abgebildet, die Wüste und das
 * Burgfeld aus" - the two sit side by side in the outer ring, and the ten
 * fields around them are the coast.
 */
export type Fort = {
  /**
   * The castle fields.
   *
   * @remarks
   * One on the printed board, **two** once the 5-6 Personen Erweiterung is in:
   * "legt wie abgebildet zuerst die Wüsten und Burgfelder aus."
   */
  readonly castles: readonly number[];
  /** The deserts beside them, one each. */
  readonly deserts: readonly number[];
  /**
   * The ten coast fields, in the order the victory check walks them.
   *
   * @remarks
   * "Beginnt dafür bei dem Küstenfeld, das links an das Burgfeld angrenzt, und
   * überprüft dann im Uhrzeigersinn nacheinander alle anderen Felder." The
   * order matters: a field checked earlier can free a knight for a later one.
   */
  readonly coast: readonly number[];
  /** The castle's six paths, which knights are trained on and never rest on. */
  readonly gates: readonly number[];
};

/** No castle at all: what every game outside this scenario carries. */
export const NO_FORT: Fort = {
  castles: [],
  deserts: [],
  coast: [],
  gates: [],
};

/**
 * Lays the castle out on an island.
 *
 * @param board - the island
 * @returns where the castle, the desert and the coast are
 * @remarks
 * The rulebook prints the layout, and its shape is what is copied here: the
 * castle and the desert are two neighbours in the **outer ring**, and the ring
 * counted round from the castle is the coast. Which two of the twelve is the
 * only thing the picture fixes that this reconstruction does not, and it cannot
 * matter: the ring is symmetric, so any pair of neighbours gives the same game.
 *
 * The count checks out either way - twelve in the ring, two of them taken, ten
 * left, which is exactly the ten coast fields the material list names.
 */
export function layFort(board: Island, castles = 1): Fort {
  const ring = outerRing(board);
  // Two castles go opposite one another, each with its desert beside it - which
  // is what the printed 5-6 layout shows and what keeps the coast in two even
  // stretches for the victory check to walk.
  const step = Math.floor(ring.length / castles);
  const seats = Array.from({ length: castles }, (unused, at) => at * step);
  const taken = new Set(seats.flatMap((at) => [ring[at], ring[at + 1]]));
  return {
    castles: seats.map((at) => ring[at]),
    deserts: seats.map((at) => ring[at + 1]),
    // Round the ring from a castle, skipping the castles and their deserts:
    // the first coast field is a castle's other neighbour, which is where the
    // check starts.
    coast: ring.filter((hex) => !taken.has(hex)),
    gates: seats.flatMap((at) => [...board.hexes[ring[at]].rim]),
  };
}

/** The outer ring of the island, in order once around. */
function outerRing(board: Island): readonly number[] {
  const start = board.cornerHexes[0];
  const spiral = board.spirals[start] ?? [];
  const edge = board.hexes.filter((hex) =>
    hex.rim.some((path) => board.paths[path].hexes.length === 1),
  );
  const outer = new Set(edge.map((hex) => hex.id));
  return spiral.filter((hex) => outer.has(hex));
}

/** Whether a coast field has fallen: three barbarians on it. */
export function conquered(game: CatanGame, hex: number): boolean {
  return raiding(game) && (game.barbarians[hex] ?? 0) >= FULL_FIELD;
}

/** Whether barbarians may still land on a field. */
export function raidable(game: CatanGame, hex: number): boolean {
  return (
    raiding(game) &&
    game.fort.coast.includes(hex) &&
    (game.barbarians[hex] ?? 0) < FULL_FIELD
  );
}

/**
 * Whether a crossing may still be built on.
 *
 * @remarks
 * "Auf den Wegen, die an ein erobertes Küstenfeld angrenzen, darfst du keine
 * Straßen bauen und auf seinen Ecken keine Siedlungen. Siedlungen dürfen nicht
 * zu Städten ausgebaut werden."
 */
export function freeCrossing(game: CatanGame, at: number): boolean {
  const board = islandOf(game.land.length);
  return !board.crossings[at].hexes.some((hex) => conquered(game, hex));
}

/** Whether a path may still be built on. */
export function freePath(game: CatanGame, at: number): boolean {
  const board = islandOf(game.land.length);
  return !board.paths[at].hexes.some((hex) => conquered(game, hex));
}

/**
 * Whether a settlement or city has been overrun.
 *
 * @param game - the game
 * @param at - the crossing
 * @returns true when nothing but sea and conquered coast is left around it
 * @remarks
 * "Sobald eine Siedlung oder Stadt nur noch von Meeres- oder Küstenfeldern
 * umgeben ist, die von Barbaren erobert wurden, gilt sie als erobert und zählt
 * keinen Siegpunkt mehr." The sea is simply a landscape the board has not got,
 * so a crossing with one hex beside it needs only that one to fall.
 *
 * "Da die Wüste und das Burgfeld niemals erobert werden können, sind
 * Siedlungen und Städte an diesen Feldern sicher" - and they are, without a
 * word of their own, because neither ever holds a barbarian.
 */
export function overrun(game: CatanGame, at: number): boolean {
  const board = islandOf(game.land.length);
  return (
    raiding(game) &&
    board.crossings[at].hexes.every((hex) => conquered(game, hex))
  );
}

/** The three orientations a path can have. */
export type Lie = 0 | 1 | 2;

/**
 * Which way a path lies.
 *
 * @param board - the island
 * @param at - the path
 * @returns one of three, the same for every path drawn the same way
 * @remarks
 * The colour die does not name a path, it names one of the castle's six - and
 * what that costs everybody is the **orientation** of it: "steht ein Ritter auf
 * einem Weg, der dieselbe Ausrichtung hat wie der Weg am Burgfeld, dessen Farbe
 * du gewürfelt hast, ist dieser verloren." A hex has six edges in three
 * orientations, so the six colours come down to three answers - which is why
 * the die is read through this rather than through the colour.
 */
export function lieOf(board: Island, at: number): Lie {
  const [one, other] = board.paths[at].ends;
  const dx = board.crossings[other].x - board.crossings[one].x;
  const dy = board.crossings[other].y - board.crossings[one].y;
  // Vertical, leaning one way, leaning the other. Read off the lattice rather
  // than off an angle, because the lattice is exact.
  return dx === 0 ? 0 : dx > 0 === dy > 0 ? 1 : 2;
}

/** Whether a knight may come to rest here. */
export function restSpot(game: CatanGame, at: number): boolean {
  return (
    game.guards[at] === null &&
    // "Der Zug eines Ritters darf niemals auf einem Weg des Burgfeldes enden."
    !game.fort.gates.includes(at)
  );
}

/**
 * Where a knight can ride to.
 *
 * @param game - the game
 * @param from - the path it stands on
 * @param steps - how far it may go
 * @returns every path it could come to rest on
 * @remarks
 * "Beim Bewegen darfst du eigene und fremde Ritter, Siedlungen und Städte
 * überspringen. Du darfst den Ritter auch über Wege mit eigenen oder fremden
 * Straßen hinweg ziehen." Nothing blocks the ride - only the resting place is
 * asked about - so this is a plain breadth-first walk of the path graph, and
 * the filter comes at the end.
 */
export function rideSpots(
  game: CatanGame,
  from: number,
  steps: number,
): readonly number[] {
  const board = islandOf(game.land.length);
  const seen = new Set<number>([from]);
  let edge = [from];
  for (let step = 0; step < steps; step++) {
    const next: number[] = [];
    for (const path of edge) {
      for (const end of board.paths[path].ends) {
        for (const near of board.crossings[end].paths) {
          if (!seen.has(near)) {
            seen.add(near);
            next.push(near);
          }
        }
      }
    }
    edge = next;
  }
  seen.delete(from);
  return [...seen].filter((at) => restSpot(game, at) && freePath(game, at));
}

/** The paths around a coast field, and who stands on them. */
export function guardsAt(game: CatanGame, hex: number): readonly number[] {
  const board = islandOf(game.land.length);
  return board.hexes[hex].rim
    .map((path) => game.guards[path])
    .filter((owner): owner is number => owner !== null);
}

/**
 * Whether the knights around a field beat the barbarians on it.
 *
 * @remarks
 * "Eure Ritter besiegen die Barbaren, wenn sich auf den Wegen, die ein
 * Küstenfeld umgeben, mehr Ritter befinden als Barbaren auf dem
 * Landschaftsfeld stehen." Strictly more, and a field with no barbarians on it
 * is not a battle at all.
 */
export function beaten(game: CatanGame, hex: number): boolean {
  const barbarians = game.barbarians[hex] ?? 0;
  return barbarians > 0 && guardsAt(game, hex).length > barbarians;
}

/** What the prisoners are worth to a seat. */
export function prisonerPoints(game: CatanGame, seat: number): number {
  return !raiding(game)
    ? 0
    : Math.floor(game.players[seat].prisoners / PRISONERS_PER_POINT);
}

/** How many knights a seat still has beside the board. */
export function knightsLeft(game: CatanGame, seat: number): number {
  return KNIGHTS_EACH - game.guards.filter((owner) => owner === seat).length;
}
