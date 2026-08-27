/**
 * The variants of *Händler & Barbaren* that need no new board.
 *
 * @module
 * @remarks
 * Four rule sets that sit on the printed island and change how it plays. The
 * rulebook says outright that they combine - with each other, with the
 * scenarios, and with Seefahrer - so nothing here may assume it is the only one
 * switched on. Each function answers one narrow question and the referee asks
 * whichever ones apply.
 *
 * What lives here is only what a variant *adds*. The turn, the board and the
 * costs stay in {@link ./moves} and {@link ./state} exactly as the base game
 * has them, because that is what the rulebook does too: "gespielt wird nach den
 * normalen Regeln von CATAN - Das Spiel. Hinzu kommen folgende Änderungen."
 */
import { islandOf } from "./board";
import { openPoints, playing, type CatanGame } from "./state";

/**
 * Victory points needed when *Die Häfen von Catan* is played.
 *
 * @remarks
 * "Es gewinnt, wer an der Reihe ist und 11 Siegpunkte besitzt." One more than
 * the printed game, because the variant hands out a third two-point tile.
 */
export const HARBOUR_TARGET = 11;

/** Harbour points needed before *Stärkste Häfen* is awarded at all. */
export const HARBOUR_MIN = 3;

/** What a city at a harbour is worth against a settlement's one. */
const CITY_HARBOUR = 2;

/**
 * Above how many victory points the friendly robber stops sparing you.
 *
 * @remarks
 * "Der freundliche Räuber verschont alle Personen so lange, bis sie mehr als
 * 2 Siegpunkte besitzen."
 */
const SPARED_UPTO = 2;

/**
 * How many harbour points a seat has.
 *
 * @param game - the game as it stands
 * @param seat - whose harbours to count
 * @returns one per settlement at a harbour, two per city
 */
export function harbourPoints(game: CatanGame, seat: number): number {
  const board = islandOf(game.land.length);
  return game.harbours.reduce((sum, harbour) => {
    const mine = board.paths[harbour.path].ends.reduce((count, end) => {
      const town = game.towns[end];
      const worth =
        town !== null && town.owner === seat
          ? town.city
            ? CITY_HARBOUR
            : 1
          : 0;
      return count + worth;
    }, 0);
    return sum + mine;
  }, 0);
}

/**
 * Hands *Stärkste Häfen* to whoever has earned it.
 *
 * @param game - the game as it stands
 * @returns the game with the tile where it belongs
 *
 * @remarks
 * The same shape as the two printed tiles: three points to take it at all, and
 * strictly more to take it off somebody. A tie leaves it where it is.
 */
export function awardHarbourTile(game: CatanGame): CatanGame {
  let next = game;
  if (playing(game, "haefen")) {
    const points = game.players.map((unused, seat) =>
      harbourPoints(game, seat),
    );
    const holder = game.harbourTile;
    const beat = holder === null ? HARBOUR_MIN - 1 : points[holder];
    const best = Math.max(...points);
    const leaders = points.reduce<number[]>(
      (list, count, seat) => (count === best ? [...list, seat] : list),
      [],
    );
    const won = best > beat && leaders.length === 1 ? leaders[0] : holder;
    next = {
      ...game,
      harbourTile: won,
      harbourBest: won === null ? 0 : points[won],
    };
  }
  return next;
}

/**
 * Whether the friendly robber may be put on a landscape.
 *
 * @param game - the game as it stands
 * @param hex - the landscape in question
 * @returns whether the variant allows it
 *
 * @remarks
 * "Ihr dürft den Räuber nicht auf ein Landschaftsfeld setzen, an das eine
 * Siedlung einer Person grenzt, die nur 2 Siegpunkte hat."
 *
 * Counted in **open** points, not real ones. A Siegpunkt card is held face down
 * until it wins the game, so a table cannot apply this rule to points nobody
 * can see - and a referee that did would be telling everyone that somebody is
 * holding one.
 */
export function robberWelcome(game: CatanGame, hex: number): boolean {
  return islandOf(game.land.length).hexes[hex].corners.every((corner) => {
    const town = game.towns[corner];
    return town === null || openPoints(game, town.owner) > SPARED_UPTO;
  });
}

/**
 * The landscapes the robber may be moved to.
 *
 * @param game - the game as it stands
 * @param from - where the robber stands now
 * @returns every landscape it may go to, which is never empty
 *
 * @remarks
 * The base rule is only "ein anderes Landschaftsfeld". The friendly robber can
 * rule out every one of them early on, and the rulebook has an answer for that:
 * "bleibt der Räuber auf der Wüste stehen bzw. setzt ihr ihn zurück auf die
 * Wüste." So the desert is always in the list when nothing else is, which also
 * keeps the phase from having no legal move at all.
 */
export function robberSpots(game: CatanGame, from: number): readonly number[] {
  const others = islandOf(game.land.length)
    .hexes.filter((hex) => hex.id !== from)
    .map((hex) => hex.id);
  const allowed = playing(game, "raeuber")
    ? others.filter((hex) => robberWelcome(game, hex))
    : others;
  const desert = game.land.indexOf("wueste");
  return allowed.length > 0 ? allowed : [desert];
}

/**
 * Whether a seat may be robbed of a card.
 *
 * @param game - the game as it stands
 * @param seat - the seat the robber would take from
 * @returns whether the variant allows it
 *
 * @remarks
 * "Sollte eine Person eine Siedlung an der Wüste besitzen und nur über
 * 2 Siegpunkte verfügen, darf von ihr kein Rohstoff gezogen werden." The
 * sparing follows the person, not the landscape - so it holds wherever the
 * robber ended up.
 */
export function robbable(game: CatanGame, seat: number): boolean {
  return !playing(game, "raeuber") || openPoints(game, seat) > SPARED_UPTO;
}
