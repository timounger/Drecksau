/**
 * *Der Handelstross* - the third of the five Händler & Barbaren scenarios.
 *
 * @module
 * @remarks
 * Nomads have settled at a watering hole in the middle of the island and send
 * out caravans of wagons for wool and grain. Three caravans grow across the
 * board, one wagon at a time, and **the table votes** on where each one goes -
 * with wool and grain cards as the ballots.
 *
 * What the wagons are worth: a settlement or city the caravan passes **through**
 * counts a point more, and a road with a wagon beside it counts as two roads
 * for the Längste Handelsroute. The game runs to twelve points.
 *
 * The rules are read out of `game_instructions/catan_babaren.pdf`, pages 12 to
 * 14, and written up in `docs/games/catan/szenarien.md`.
 */
import { islandOf, type Island } from "./board";
import type { CatanGame, Resource } from "./state";

/** The wagons in the box. */
export const WAGONS = 22;

/** How many caravans set out from one watering hole. */
export const CARAVANS = 3;

/** The most there can be: three from each of the two bigger board's holes. */
export const MOST_CARAVANS = 6;

/**
 * How much higher the finish line is: twelve rather than ten.
 *
 * @remarks
 * Added to the target rather than replacing it, the way *Städte & Ritter* does
 * it, so a deliberately short or long game keeps its length.
 */
export const KARAWANE_EXTRA = 2;

/** What a settlement or city between two wagons is worth. */
export const WAGON_POINTS = 1;

/** What a road with a wagon beside it counts in a trade route. */
export const WAGON_ROAD = 2;

/** The two sorts that vote. */
export const BALLOT: readonly Resource[] = ["wolle", "getreide"];

/** Whether this game is the caravan scenario. */
export function caravans(game: CatanGame): boolean {
  return game.scenario === "karawane";
}

/**
 * Where the nomads sit and which way their arrows point.
 *
 * @remarks
 * Laid once with the board, like the rivers, because it is part of the map.
 */
export type Trail = {
  /**
   * The landscapes the watering holes are on.
   *
   * @remarks
   * One on the printed board, two once the 5-6 Personen Erweiterung is in: "es
   * gibt nun zwei Wasserstellen, von denen aus insgesamt 6 Handelstrosse
   * starten können."
   */
  readonly holes: readonly number[];
  /** The path each caravan's first wagon must go on, one per arrow. */
  readonly arrows: readonly number[];
  /** The crossing each of those paths sets out from. */
  readonly gates: readonly number[];
};

/** No caravans at all: what every game outside this scenario carries. */
export const NO_TRAIL: Trail = { holes: [], arrows: [], gates: [] };

/** One caravan, from the watering hole outwards. */
export type Caravan = {
  /** The paths its wagons stand on, in the order they were placed. */
  readonly paths: readonly number[];
  /** The crossing the next wagon grows from. */
  readonly head: number;
  /** Whether another caravan has swallowed it. */
  readonly merged: boolean;
};

/**
 * Lays the watering hole and its three arrows.
 *
 * @param board - the island
 * @param hole - the landscape the watering hole took
 * @returns everything the scenario needs to know about the nomads
 * @remarks
 * The rulebook shows the arrows only as a picture, on the printed tile - and
 * this table lays its island out afresh every game, so the arrows are
 * reconstructed as a **shape** rather than copied as a list of numbers, the way
 * the rivers of the second scenario are.
 *
 * What the picture shows: the arrows leave the watering hole in a straight
 * line. A straight line out of a hex through one of its corners is exactly the
 * **third** path at that corner - the one that is not an edge of the hex - so
 * an arrow points at a radial path. Six corners give six of them, and the
 * rulebook asks for three caravans, so the arrows take every other corner.
 *
 * That reconstruction can be checked against the two numbers the rulebook
 * prints under its examples. Before anything is placed there are three legal
 * paths, one per caravan - "es gibt 3 Wege, auf denen er platziert werden
 * darf". After the first wagon its caravan can grow two ways and the other two
 * still have one each, which is four - "für den nächsten Trosswagen gibt es nun
 * 4 Wege". Both numbers fall out of the shape; neither was put into it.
 */
export function layTrail(board: Island, holes: readonly number[]): Trail {
  const arrows: number[] = [];
  const gates: number[] = [];
  for (const hole of holes) {
    const corners = board.hexes[hole].corners;
    const rim = new Set(board.hexes[hole].rim);
    for (let step = 0; step < corners.length; step += 2) {
      const gate = corners[step];
      const out = board.crossings[gate].paths.find(
        (path) => !rim.has(path) && !arrows.includes(path),
      );
      if (out !== undefined) {
        arrows.push(out);
        gates.push(gate);
      }
    }
  }
  return { holes, arrows, gates };
}

/** The three caravans as they stand before the first wagon is placed. */
export function firstCaravans(trail: Trail): readonly Caravan[] {
  return trail.gates.map((gate) => ({ paths: [], head: gate, merged: false }));
}

/**
 * Where the next wagon of one caravan may go.
 *
 * @param game - the game
 * @param which - which of the caravans
 * @returns the paths it may grow onto
 * @remarks
 * "Er muss so eingesetzt werden, dass er direkt an den vorderen (bzw. zuletzt
 * aufgestellten) Trosswagen eines Handelstrosses angrenzt. Eine Verzweigung
 * eines Handelstrosses ist somit nicht möglich." So a caravan grows at its head
 * and nowhere else, which leaves the two other paths of the head crossing - or,
 * before it has set out, the one path its arrow points at.
 */
export function caravanSpots(
  game: CatanGame,
  which: number,
): readonly number[] {
  const caravan = game.caravans[which];
  const board = islandOf(game.land.length);
  let spots: readonly number[] = [];
  if (caravan !== undefined && !caravan.merged) {
    spots =
      caravan.paths.length === 0
        ? [game.trail.arrows[which]].filter(
            (path) => path !== undefined && game.wagons[path] === null,
          )
        : board.crossings[caravan.head].paths.filter(
            (path) => game.wagons[path] === null,
          );
  }
  return spots;
}

/**
 * Every path a wagon could be put on right now.
 *
 * @param game - the game
 * @returns the paths, without repeats
 * @remarks
 * "Gibt es keinen Weg mehr, um mit einem Trosswagen einen Handelstross zu
 * verlängern, endet dieser Handelstross" - so an empty list for one caravan is
 * that caravan's end, and an empty list for all three is the end of the
 * voting altogether.
 */
export function wagonSpots(game: CatanGame): readonly number[] {
  const spots = new Set<number>();
  // At a table of two a round places two wagons, and the second may not extend
  // the caravan the first one did: "diese Person muss mit den Trosswagen jedoch
  // zwei verschiedene Handelstrosse verlängern."
  const already = game.vote?.grown ?? [];
  if (caravans(game) && game.wagonsLeft > 0) {
    game.caravans.forEach((unused, which) => {
      if (!already.includes(which)) {
        caravanSpots(game, which).forEach((path) => spots.add(path));
      }
    });
  }
  return [...spots];
}

/** Which caravan a path would extend, or null if none would. */
export function caravanFor(game: CatanGame, at: number): number | null {
  const found = game.caravans.findIndex((unused, which) =>
    caravanSpots(game, which).includes(at),
  );
  return found === -1 ? null : found;
}

/**
 * What a road on this path counts in a trade route.
 *
 * @param game - the game
 * @param at - the path
 * @returns two where a wagon stands beside the road, one otherwise
 * @remarks
 * "Eine Straße, die parallel zu einem Trosswagen verläuft, zählt wie 2
 * Straßen." Parallel is the only way the two ever lie: "wird oder wurde auf
 * einem Weg, auf dem ein Trosswagen steht, eine Straße gebaut, wird der
 * Trosswagen neben die Straße gestellt" - the wagon does not give the path up,
 * it shares it.
 */
export function roadWeight(game: CatanGame, at: number): number {
  return caravans(game) && game.wagons[at] !== null ? WAGON_ROAD : 1;
}

/**
 * What the caravans are worth to a seat.
 *
 * @param game - the game
 * @param seat - whose settlements to count
 * @returns one point for each of theirs the caravans run through
 * @remarks
 * "Siedlungen oder Städte, die zwischen 2 Trosswagen liegen, zählen 1 Siegpunkt
 * mehr." **Between** two wagons, so a crossing the caravan merely ends at is
 * worth nothing - which is two wagons meeting at the crossing, counted as two
 * of its paths carrying one.
 */
export function wagonPoints(game: CatanGame, seat: number): number {
  const board = islandOf(game.land.length);
  return !caravans(game)
    ? 0
    : board.crossings.reduce(
        (sum, crossing) =>
          game.towns[crossing.id]?.owner === seat &&
          crossing.paths.filter((path) => game.wagons[path] !== null).length >=
            2
            ? sum + WAGON_POINTS
            : sum,
        0,
      );
}

/**
 * How the table has voted.
 *
 * @remarks
 * Three steps, because the rulebook has three: everybody lays cards down in
 * turn, then everybody who laid something says where they want the wagon, then
 * somebody puts it there. Which of the three is running is what the panel and
 * the referee both ask.
 */
export type Vote = {
  /** Who built, and who decides when the table cannot. */
  readonly caller: number;
  /** The seats in turn order, starting with the caller. */
  readonly order: readonly number[];
  /** How many cards each seat has laid down. */
  readonly laid: readonly number[];
  /** Which path each seat has put their votes on. */
  readonly picks: readonly (number | null)[];
  /** How far along {@link Vote.order} the round is. */
  readonly step: number;
  /** What the round is waiting for. */
  readonly stage: "lay" | "assign" | "place";
  /** Who is placing the wagon, once the table has decided that much. */
  readonly decider: number | null;
  /**
   * Who places after them.
   *
   * @remarks
   * Empty at a table of three or more, where a round is one wagon. *CATAN für
   * Zwei* makes it two - "kommt es zu einer Abstimmungsrunde, geht es um 2
   * Trosswagen, die eingesetzt werden" - so the queue is what is left of them.
   */
  readonly queue: readonly number[];
  /** The caravans this round has already extended. */
  readonly grown: readonly number[];
};

/**
 * Whether one seat alone has more votes than everybody else together.
 *
 * @param laid - the cards each seat put down
 * @returns that seat, or null
 * @remarks
 * "Hat eine Person allein mehr Stimmen als alle anderen Personen zusammen,
 * entscheidet sie allein." A majority of that kind skips the whole assignment:
 * there is nothing left to negotiate.
 */
export function soleVoice(laid: readonly number[]): number | null {
  const total = laid.reduce((sum, count) => sum + count, 0);
  const found = laid.findIndex((count) => count > total - count);
  return found === -1 ? null : found;
}

/**
 * The seat with the most votes, if exactly one has.
 *
 * @param laid - the cards each seat put down
 * @returns that seat, or null when nobody leads alone
 */
export function loudest(laid: readonly number[]): number | null {
  const most = Math.max(0, ...laid);
  const leaders = laid.reduce<number[]>(
    (list, count, seat) =>
      count === most && count > 0 ? [...list, seat] : list,
    [],
  );
  return leaders.length === 1 ? leaders[0] : null;
}

/**
 * Where the assigned votes point.
 *
 * @param vote - the round as it stands
 * @returns the path with the most votes, or null when none leads alone
 * @remarks
 * "Hat 1 Position die meisten Stimmen, stellt den Trosswagen dort auf." Most
 * means most **alone**: two positions tied at the top are no decision, and the
 * rulebook then falls back on a person rather than on a coin.
 */
export function chosenSpot(vote: Vote): number | null {
  const tally = new Map<number, number>();
  vote.picks.forEach((pick, seat) => {
    if (pick !== null) {
      tally.set(pick, (tally.get(pick) ?? 0) + vote.laid[seat]);
    }
  });
  const most = Math.max(0, ...tally.values());
  const leaders = [...tally.entries()].filter(
    ([, count]) => count === most && count > 0,
  );
  return leaders.length === 1 ? leaders[0][0] : null;
}
