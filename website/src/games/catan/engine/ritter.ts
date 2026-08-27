/**
 * *Städte & Ritter*: the rules the referee asks about.
 *
 * @module
 * @remarks
 * Everything here answers one narrow question and changes nothing. The referee
 * in {@link ./moves} does the changing; this is what it consults, in the same
 * way {@link ./variants} serves the Händler & Barbaren variants.
 *
 * Kept apart from {@link ./knights}, which holds the *data* - names, costs,
 * counts. This holds the *judgements*: may this be built, who wins the fight,
 * how many cards may be kept.
 */
import { islandOf } from "./board";
import {
  BARBARIAN_STEPS,
  BENEFIT_LEVEL,
  COMMODITY_OF,
  KNIGHTS_PER_LEVEL,
  MAX_WALLS,
  METRO_LEVEL,
  MIGHTY,
  STRONG,
  TOP_LEVEL,
  TRACKS,
  TRACK_GOODS,
  WALL_CARDS,
  improveCost,
  type Commodity,
  type Track,
} from "./knights";
import {
  HAND_LIMIT,
  playingRitter,
  type CatanGame,
  type Resource,
} from "./state";

/**
 * The number chips an Erfindung card may never move.
 *
 * @remarks
 * "Vertausche 2 Zahlenchips miteinander, niemals aber die Chips 2, 12, 6 und
 * 8." The two rarest and the two commonest - the four a board is balanced
 * around.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the four numbers are
   the rule itself, quoted from the card. */
export const FIXED_CHIPS: readonly number[] = [2, 6, 8, 12];
/* eslint-enable @typescript-eslint/no-magic-numbers */

/**
 * What a city costs when Medizin pays for it.
 *
 * @remarks
 * "Für 2 Erz und 1 Getreide wandelst du eine deiner Siedlungen in eine Stadt
 * um" - one of each off the printed price, and the rest still has to be paid.
 */
export const MEDICINE_COST: Readonly<Record<Resource, number>> = {
  erz: 2,
  getreide: 1,
  lehm: 0,
  holz: 0,
  wolle: 0,
};

/** What a city wall costs. */
export const WALL_COST: Readonly<Record<Resource, number>> = {
  lehm: 2,
  holz: 0,
  wolle: 0,
  getreide: 0,
  erz: 0,
};

/** What putting a knight on the board costs. */
export const KNIGHT_COST: Readonly<Record<Resource, number>> = {
  wolle: 1,
  erz: 1,
  lehm: 0,
  holz: 0,
  getreide: 0,
};

/** What activating a knight costs. */
export const ACTIVATE_COST: Readonly<Record<Resource, number>> = {
  getreide: 1,
  lehm: 0,
  holz: 0,
  wolle: 0,
  erz: 0,
};

/**
 * How many cards a seat may keep when a seven is rolled.
 *
 * @param game - the game
 * @param seat - whose hand
 * @returns seven, plus two for every city wall standing
 * @remarks
 * "Die Stadtmauer erhöht die Anzahl der Karten, die du gefahrlos auf der Hand
 * halten darfst, um zwei. Jede weitere Stadtmauer ... um weitere zwei." The
 * hand being measured is **both** hands together: Handelswaren "zählen mit,
 * wenn eine '7' gewürfelt wird".
 */
export function keepLimit(game: CatanGame, seat: number): number {
  return playingRitter(game)
    ? HAND_LIMIT + game.players[seat].walls * WALL_CARDS
    : HAND_LIMIT;
}

/**
 * What a city on a landscape pays.
 *
 * @param land - what the landscape grows
 * @returns the resource twice, or the resource and its Handelsware
 * @remarks
 * "Es ist nicht erlaubt, auf eine der beiden Kartenarten zu verzichten und
 * dafür 2 gleiche Karten zu nehmen" - so this is not a choice and returns a
 * fixed pair.
 */
export function cityYield(land: Resource): {
  readonly resource: number;
  readonly commodity: Commodity | null;
} {
  const commodity = COMMODITY_OF[land];
  return commodity === null
    ? { resource: 2, commodity: null }
    : { resource: 1, commodity };
}

/**
 * Whether this seat may take the next step of a track.
 *
 * @param game - the game
 * @param seat - who wants to build
 * @param track - which of the three
 * @returns true if it is legal and paid for
 * @remarks
 * Three conditions, and the third is the one people forget. A seat needs a
 * **city** to improve at all - "hast du keine Stadt, da du sie bei einem
 * Barbarenüberfall verloren hast, kannst du keine weiteren Stadtausbauten mehr
 * vornehmen" - and reaching level four needs a city that is not already a
 * metropolis, since the new one has to stand somewhere.
 */
export function canImprove(
  game: CatanGame,
  seat: number,
  track: Track,
): boolean {
  const level = game.players[seat].tableau[track];
  return (
    playingRitter(game) &&
    level < TOP_LEVEL &&
    cityCount(game, seat) > 0 &&
    game.players[seat].goods[TRACK_GOODS[track]] >=
      improvePrice(game, seat, track) &&
    (level + 1 !== METRO_LEVEL || freeCityFor(game, seat) !== null)
  );
}

/**
 * What the next step of a track costs this seat right now.
 *
 * @param game - the game
 * @param seat - who is building
 * @param track - which of the three
 * @returns the number of Handelswaren, never below zero
 * @remarks
 * The printed price is the level being bought ({@link improveCost}). A
 * **Baukran** takes one off it, once: "ein Stadtausbau kostet dich in dieser
 * Runde eine Handelsware weniger... sie gilt also nur für das einmalige
 * Hochrücken eines Markierungssteins." So the discount lives on the game for
 * the turn and is spent by the improvement that uses it - which is why the
 * price is asked here rather than worked out at each call site.
 */
export function improvePrice(
  game: CatanGame,
  seat: number,
  track: Track,
): number {
  const full = improveCost(game.players[seat].tableau[track]);
  return game.crane === seat ? Math.max(0, full - 1) : full;
}

/** How many cities a seat has standing. */
export function cityCount(game: CatanGame, seat: number): number {
  return game.towns.reduce(
    (sum, town) =>
      town !== null && town.owner === seat && town.city ? sum + 1 : sum,
    0,
  );
}

/**
 * A city of this seat's that could carry a new metropolis.
 *
 * @param game - the game
 * @param seat - whose city
 * @returns the crossing, or null if every city already carries one
 * @remarks
 * "Besitzt du nur 1 Stadt, die du bereits zur Metropole ausgebaut hast, darfst
 * du in den anderen beiden Bereichen Stadtausbauten nur bis zur dritten Stufe
 * vornehmen." A metropolis needs a city under it, and a city carries one at
 * most - so the fourth step is barred while none is free.
 */
export function freeCityFor(game: CatanGame, seat: number): number | null {
  const taken = TRACKS.map((track) => game.metro[track])
    .filter((metro) => metro !== null)
    .map((metro) => metro.at);
  const free = game.towns.findIndex(
    (town, crossing) =>
      town !== null &&
      town.owner === seat &&
      town.city &&
      !taken.includes(crossing),
  );
  return free < 0 ? null : free;
}

/** Whether a seat has finished a track far enough for its standing benefit. */
export function hasBenefit(
  game: CatanGame,
  seat: number,
  track: Track,
): boolean {
  return (
    playingRitter(game) && game.players[seat].tableau[track] >= BENEFIT_LEVEL
  );
}

/** Whether this seat may put another city wall up. */
export function canWall(game: CatanGame, seat: number): boolean {
  return (
    playingRitter(game) &&
    game.players[seat].walls < MAX_WALLS &&
    game.players[seat].walls < cityCount(game, seat)
  );
}

/**
 * Whether a knight may go on a crossing.
 *
 * @param game - the game
 * @param seat - whose knight
 * @param at - the crossing
 * @returns true if it is free, connected and this seat has a piece left
 * @remarks
 * "Du musst den Ritter innerhalb deines eigenen Straßennetzes auf einer freien
 * Kreuzung einsetzen... Für Ritter gibt es **keine Abstandsregel**." So a
 * knight cares about two things a settlement does not: it may stand next to
 * anything, and it may not share a crossing with a building or another knight.
 */
export function canKnight(game: CatanGame, seat: number, at: number): boolean {
  const board = islandOf(game.land.length);
  const touchesRoad = board.crossings[at].paths.some(
    (path) => game.roads[path] === seat,
  );
  return (
    playingRitter(game) &&
    game.towns[at] === null &&
    game.garrison[at] === null &&
    touchesRoad &&
    knightsLeft(game, seat, 1) > 0
  );
}

/**
 * How many knights of a strength this seat still has in the box.
 *
 * @param game - the game
 * @param seat - whose knights
 * @param level - the strength
 * @returns how many are left to place at that strength
 * @remarks
 * "Alle von euch besitzen jeweils 2 Ritter pro Stärkestufe. Wer z. B. 2
 * Einfache Ritter auf dem Spielfeld hat, muss zuerst einen davon aufwerten, um
 * erneut einen Einfachen Ritter bauen zu können."
 */
export function knightsLeft(
  game: CatanGame,
  seat: number,
  level: number,
): number {
  const standing = game.garrison.filter(
    (knight) =>
      knight !== null && knight.owner === seat && knight.level === level,
  ).length;
  return KNIGHTS_PER_LEVEL - standing;
}

/**
 * Whether a knight may be raised a step.
 *
 * @param game - the game
 * @param seat - whose knight
 * @param at - where it stands
 * @returns true if it may go up
 * @remarks
 * Two gates. A Starker Ritter only becomes a Mächtiger once its owner has built
 * the **Festung** - the third step of Politik - and there has to be a piece of
 * the higher strength left in the box.
 */
export function canUpgrade(game: CatanGame, seat: number, at: number): boolean {
  const knight = game.garrison[at];
  return (
    knight !== null &&
    knight.owner === seat &&
    knight.level < MIGHTY &&
    (knight.level < STRONG || hasBenefit(game, seat, "politik")) &&
    knightsLeft(game, seat, knight.level + 1) > 0
  );
}

/**
 * Whether a knight is ready to act.
 *
 * @param game - the game
 * @param at - where it stands
 * @returns true if it wears its helmet, has not acted, and was not just roused
 */
export function knightReady(game: CatanGame, at: number): boolean {
  const knight = game.garrison[at];
  return knight !== null && knight.active && !knight.fresh && !knight.spent;
}

/**
 * Where the barbarians would land, and who would hold them.
 *
 * @param game - the game
 * @returns the two strengths, and who contributed what
 * @remarks
 * "Ermittelt zuerst die Stärke des Barbarenheers. Dazu zählt ihr alle auf Catan
 * gebauten Städte (inklusive Metropolen) zusammen" - **everybody's** cities,
 * one point each. Against it, "zählt dazu alle Spitzen der Fähnchen aller
 * aktivierten Ritter", so a knight is worth its own strength and only if it is
 * awake.
 */
export function barbarianFight(game: CatanGame): {
  readonly attack: number;
  readonly defence: number;
  readonly bySeat: readonly number[];
} {
  const attack = game.towns.reduce(
    (sum, town) => (town !== null && town.city ? sum + 1 : sum),
    0,
  );
  const bySeat = game.players.map((unused, seat) =>
    game.garrison.reduce(
      (sum, knight) =>
        knight !== null && knight.owner === seat && knight.active
          ? sum + knight.level
          : sum,
      0,
    ),
  );
  return {
    attack,
    defence: bySeat.reduce((sum, each) => sum + each, 0),
    bySeat,
  };
}

/** Whether the ship has reached the last space and the army is ashore. */
export function barbariansLanding(game: CatanGame): boolean {
  return game.barbarian >= BARBARIAN_STEPS;
}

/**
 * Whether the robber may be moved at all.
 *
 * @param game - the game
 * @returns true unless the barbarians have yet to land for the first time
 * @remarks
 * "Der Räuber darf zu Beginn des Spiels so lange nicht versetzt werden, bis die
 * Barbaren zum ersten Mal Catan erreicht haben." It holds against everything -
 * a seven, a knight, a Fortschrittskarte - which is why this is asked in one
 * place rather than at each of them.
 */
export function robberLoose(game: CatanGame): boolean {
  return !playingRitter(game) || game.landed;
}

/**
 * Where a knight standing here could march.
 *
 * @param game - the game
 * @param from - the crossing it stands on
 * @returns every crossing it could reach
 * @remarks
 * "Beide Kreuzungen... müssen durch eigene Straßen miteinander verbunden sein...
 * Das Vorbeiziehen an fremden Rittern ist nicht möglich." So this is a walk
 * along **that colour's** roads that stops dead at somebody else's knight - not
 * a distance, and not the road network as a whole.
 *
 * A knight may land on a free crossing, or on one held by a **weaker** enemy
 * knight, which drives that one off. It may never land on a building, on one of
 * its owner's own knights, or on an equal or stronger one.
 */
export function marchSpots(game: CatanGame, from: number): readonly number[] {
  const knight = game.garrison[from];
  if (knight === null) {
    return [];
  }
  const board = islandOf(game.land.length);
  const seen = new Set<number>([from]);
  const queue = [from];
  const spots: number[] = [];
  while (queue.length > 0) {
    const at = queue.shift() as number;
    for (const path of board.crossings[at].paths) {
      if (game.roads[path] !== knight.owner) {
        continue;
      }
      const next = board.paths[path].ends.find((end) => end !== at);
      if (next === undefined || seen.has(next)) {
        continue;
      }
      seen.add(next);
      const sitting = game.garrison[next];
      const building = game.towns[next];
      if (sitting !== null) {
        // Somebody is standing here. A weaker enemy can be driven off, and
        // either way the walk stops - "das Vorbeiziehen an fremden Rittern ist
        // nicht möglich".
        if (sitting.owner !== knight.owner && sitting.level < knight.level) {
          spots.push(next);
        }
        continue;
      }
      if (building === null) {
        spots.push(next);
      }
      // A building does not block the road, so the walk carries on through it.
      queue.push(next);
    }
  }
  return spots;
}

/**
 * Where a driven-off knight may go.
 *
 * @param game - the game
 * @param from - where it was standing
 * @param owner - whose knight it is
 * @returns the free crossings it can be put on
 * @remarks
 * "Muss diesen auf eine freie Kreuzung innerhalb derselben (eigenen)
 * Handelsroute versetzen... Wird ein Ritter vertrieben, darf er dabei keine
 * fremden Ritter überspringen." The same walk as a march, minus the option of
 * driving somebody else off in turn - a knight being pushed about does not get
 * to push back.
 */
export function retreatSpots(
  game: CatanGame,
  from: number,
  owner: number,
): readonly number[] {
  const board = islandOf(game.land.length);
  const seen = new Set<number>([from]);
  const queue = [from];
  const spots: number[] = [];
  while (queue.length > 0) {
    const at = queue.shift() as number;
    for (const path of board.crossings[at].paths) {
      if (game.roads[path] !== owner) {
        continue;
      }
      const next = board.paths[path].ends.find((end) => end !== at);
      if (next === undefined || seen.has(next)) {
        continue;
      }
      seen.add(next);
      if (game.garrison[next] !== null) {
        continue;
      }
      if (game.towns[next] === null) {
        spots.push(next);
      }
      queue.push(next);
    }
  }
  return spots;
}

/**
 * Whether a knight standing here could chase the robber off.
 *
 * @param game - the game
 * @param at - where the knight stands
 * @returns true if the robber is on one of its three landscapes
 * @remarks
 * "Du kannst mit einem eigenen aktivierten Ritter (egal wie stark) den Räuber
 * vertreiben, wenn dieser auf einem der drei benachbarten Landschaftsfelder
 * steht." Strength does not come into it - which is why this asks only where
 * the robber is.
 */
export function canChase(game: CatanGame, at: number): boolean {
  return (
    robberLoose(game) &&
    knightReady(game, at) &&
    islandOf(game.land.length).crossings[at].hexes.includes(game.robber)
  );
}
