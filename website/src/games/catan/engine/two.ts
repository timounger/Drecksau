/**
 * *CATAN für Zwei* - the variant that lets two people play at all.
 *
 * @module
 * @remarks
 * Not an optional extra at that player count: the box has no two-handed game
 * without it, so a table of two always plays it and there is nothing to switch
 * on. Everything here therefore asks {@link playingTwo} rather than a setting.
 *
 * Four things change, and each of them is here as one narrow question the
 * referee asks:
 *
 * - the turn has **two rolls** instead of one, and they must differ,
 * - building a road or a settlement builds a free one in a **neutral colour**,
 * - **Handelschips** buy two actions and are earned three ways,
 * - the neutral colours own pieces but earn nothing and never take a turn -
 *   which lives in {@link CatanPlayer.neutral} and in the referee.
 *
 * What is deliberately *not* here: the neutral colours are ordinary seats, so
 * the distance rule, the road rules and the Längste Handelsroute all apply to
 * them through the ordinary code. The rulebook wants exactly that - "in einer
 * neutralen Farbe kann aber durchaus die Längste Handelsroute entstehen".
 */
import { islandOf } from "./board";
import { SKIP_CHIPS } from "./handel";
import {
  CHIPS_COAST,
  CHIPS_DESERT,
  CHIPS_PER_KNIGHT,
  CHIP_COST,
  CHIP_COST_AHEAD,
  playingTwo,
  pointsOf,
  realSeats,
  type CatanGame,
} from "./state";

/** How many landscapes touch an inland crossing. */
const INLAND_HEXES = 3;

/** The two rolls a turn has in this variant. */
export const ROLLS_PER_TURN = 2;

/**
 * How many cards a Zwangshandel moves each way.
 *
 * @remarks
 * Two out and two back, and the two are not the same two: the pull is blind and
 * the return is chosen. "Hat die andere Person nur 1 Karte, ziehst du diese,
 * musst aber trotzdem 2 Karten zurückgeben" - so the counts can differ, and
 * only the return is fixed.
 */
export const SWAP_CARDS = 2;

/**
 * The seats of the two neutral colours.
 *
 * @param game - the game
 * @returns their seat indexes, or nothing on any other table
 */
export function neutralSeats(game: CatanGame): readonly number[] {
  return game.players
    .map((player, seat) => (player.neutral ? seat : -1))
    .filter((seat) => seat >= 0);
}

/**
 * Whether the turn still owes a roll.
 *
 * @param game - the game, after a roll has been fully resolved
 * @returns true while the second of the two rolls is still to come
 * @remarks
 * "Bist du an der Reihe, würfelst du zweimal hintereinander... Nach jedem der
 * beiden Würfelwürfe erhalten alle sofort ihre Erträge bzw. versetzt du bei
 * einer '7' den Räuber." So the second roll comes after the first has been
 * settled in full, robber and all - not both dice at once.
 */
export function owesRoll(game: CatanGame): boolean {
  return playingTwo(game) && game.rolls < ROLLS_PER_TURN;
}

/**
 * Whether a roll may stand, or has to be thrown again.
 *
 * @param game - the game
 * @param rolled - what the dice just showed
 * @returns true if this result is allowed to count
 * @remarks
 * "Dabei gilt, dass sich die beiden gewürfelten Zahlen unterscheiden müssen.
 * Zeigt der zweite Würfelwurf das gleiche Ergebnis wie der erste, wird er
 * wiederholt - so lange, bis zwei verschiedene Ergebnisse vorliegen." A repeat
 * is not a result, so it is thrown away inside the referee rather than shown.
 */
export function rollStands(game: CatanGame, rolled: number): boolean {
  // "Würfelst du eine '2' oder eine '12', wiederhole deinen Würfelwurf." The
  // hauling scenario leaves both chips in the box, so neither number pays
  // anybody and both are simply thrown again. Here rather than in the referee
  // because this is already the one question "does this roll count".
  const skipped = game.scenario === "handel" && SKIP_CHIPS.includes(rolled);
  return (
    !skipped &&
    (!playingTwo(game) || game.firstRoll === null || game.firstRoll !== rolled)
  );
}

/**
 * What a Handelschip action costs this seat.
 *
 * @param game - the game
 * @param seat - who wants to act
 * @returns one chip, or two while they are ahead
 * @remarks
 * "Hast du gleich viele oder weniger Siegpunkte als die gegnerische Person,
 * kostet 1 Aktion 1 Handelschip für dich. Hast du mehr Siegpunkte als die
 * gegnerische Person, kostet dich die Aktion 2 Handelschips." A catch-up rule,
 * and the comparison is against the **other player** rather than against the
 * field, because at this table there is only one other.
 */
export function chipCost(game: CatanGame, seat: number): number {
  const mine = pointsOf(game, seat);
  const best = Math.max(
    ...realSeats(game)
      .filter((other) => other !== seat)
      .map((other) => pointsOf(game, other)),
  );
  return mine > best ? CHIP_COST_AHEAD : CHIP_COST;
}

/**
 * The chips a new settlement earns.
 *
 * @param game - the game
 * @param at - the crossing being built on
 * @returns two at the desert, one at the coast, three at both, otherwise none
 * @remarks
 * "Baust du eine Siedlung an der Wüste, erhältst du dafür 2 Handelschips (gilt
 * auch in der Gründungsphase)... an der Küste 1... an die Wüste **und** an die
 * Küste grenzt, 3." The third line is the sum of the other two rather than a
 * rule of its own, which is why this adds instead of choosing.
 *
 * A crossing is at the coast when fewer than three landscapes touch it - that
 * is what "am Rand" means on a board addressed by index.
 */
export function chipsForTown(game: CatanGame, at: number): number {
  const crossing = islandOf(game.land.length).crossings[at];
  const desert = crossing.hexes.some((hex) => game.land[hex] === "wueste");
  const coast = crossing.hexes.length < INLAND_HEXES;
  return (desert ? CHIPS_DESERT : 0) + (coast ? CHIPS_COAST : 0);
}

/**
 * Whether this seat may hand a played knight in for chips.
 *
 * @param game - the game
 * @param seat - who is asking
 * @returns true if they have one to give and have not already done it this turn
 * @remarks
 * "Bist du an der Reihe, darfst du **einmal** in deinem Zug einen deiner
 * bereits ausgespielten Ritter abgeben und dir dafür 2 Handelschips aus dem
 * Vorrat nehmen." Once a turn, and only a knight already turned face up -
 * a card still in hand is not one of these.
 *
 * The Größte Rittermacht follows from the count as it always does: hand a
 * knight in and the tile is re-awarded from the new numbers, which is exactly
 * what the rulebook spells out the long way.
 */
export function canHandKnightIn(game: CatanGame, seat: number): boolean {
  return (
    playingTwo(game) && game.players[seat].knights > 0 && !game.knightGiven
  );
}

/** What handing a knight in is worth. */
export const KNIGHT_CHIPS = CHIPS_PER_KNIGHT;
