/**
 * The cheat mode: while it is on, the human's gold and every good on the
 * human's islands never run out, every building may be built without any
 * requirement, and every house of the human stands at the top tier, full and
 * with every need met. Switching it on finishes all research for good.
 *
 * @module
 * @remarks
 * The flag is part of the game and its save, so it stays deterministic and a
 * loaded game goes on the same way. A game that had the cheat on once is
 * marked for good and no longer counts for the statistics. Nothing here is
 * a second set of rules: the build check asks {@link buildOpen} and
 * {@link guidedHolds}, and {@link fillIfCheating} runs at the end of every
 * step, after the usual rules had their go.
 */
import { GOOD_IDS } from "./goods";
import { HUMAN } from "./players";
import { RESEARCH } from "./research-data";
import { needCount, TIERS, TOP_TIER } from "./tiers";
import { tutorialHolds } from "./tutorial-data";
import type { BuildingKind, Game } from "./types";
import { capacityOf } from "./warehouse";

/** The gold the human holds while the cheat is on. */
export const CHEAT_GOLD = 9999999;

/**
 * Switches the cheat mode on or off.
 *
 * @param game - the game, changed
 * @param on - the new state
 * @remarks
 * Switching on finishes every field of research, and it stays finished when
 * the cheat goes off. Switching off gives back the gold from before, so the
 * endless gold does not stay; the goods are kept as far as the warehouses
 * hold them, and the houses go on by the usual rules (falling back when
 * they lack something). The guided start is never ended by the cheat: it
 * only stops holding buildings back while the cheat is on.
 */
export function setCheat(game: Game, on: boolean): void {
  const human = game.players[HUMAN];
  if (on && !game.cheat) {
    game.goldBeforeCheat = human.gold;
    game.cheated = true;
  } else if (!on && game.cheat) {
    human.gold = game.goldBeforeCheat;
  }
  game.cheat = on;
  if (on) {
    human.research.done = RESEARCH.map((def) => def.id);
    human.research.current = null;
    human.research.progress = 0;
  }
  fillIfCheating(game);
}

/**
 * Fills the human's treasury and warehouses and lifts the human's houses
 * while the cheat is on.
 *
 * @param game - the game, changed
 */
export function fillIfCheating(game: Game): void {
  if (game.cheat) {
    game.players[HUMAN].gold = CHEAT_GOLD;
    for (const island of game.islands) {
      if (island.owner === HUMAN) {
        const capacity = capacityOf(game, island.id);
        for (const good of GOOD_IDS) {
          island.stock[good] = Math.max(island.stock[good], capacity);
          island.supply[good] = 1;
        }
      }
    }
    liftHouses(game);
  }
}

/**
 * Whether a player may build a kind as far as unlocks go: unlocked by the
 * usual rules (residents, tier, research), or the human while the cheat is
 * on.
 *
 * @param game - the game
 * @param player - who wants to build
 * @param kind - the building
 * @returns true when open
 */
export function buildOpen(
  game: Game,
  player: number,
  kind: BuildingKind,
): boolean {
  return (
    (game.cheat && player === HUMAN) ||
    (game.players[player]?.unlocked.includes(kind) ?? false)
  );
}

/**
 * Whether the cheat pays a player's materials where the usual rules would
 * ask for them elsewhere (the hold of the ship that founds a kontor, the
 * unlocks of ships and troops): only the human's, only while it is on.
 *
 * @param game - the game
 * @param player - who wants to build or train
 * @returns true while the cheat covers it
 */
export function cheatPays(game: Game, player: number): boolean {
  return game.cheat && player === HUMAN;
}

/**
 * Whether the guided start holds a kind back from a player: only the
 * human's, and not while the cheat is on.
 *
 * @param game - the game
 * @param player - who wants to build
 * @param kind - the building
 * @returns true when held back
 */
export function guidedHolds(
  game: Game,
  player: number,
  kind: BuildingKind,
): boolean {
  return player === HUMAN && !game.cheat && tutorialHolds(game.tutorial, kind);
}

/** Puts every finished house of the human at the top tier, full and content. */
function liftHouses(game: Game): void {
  const top = TIERS[TOP_TIER];
  for (const building of game.buildings) {
    const house = building.house;
    if (
      house !== null &&
      building.complete &&
      game.islands[building.island].owner === HUMAN
    ) {
      if (house.tier !== TOP_TIER) {
        house.tier = TOP_TIER;
        // The house looks different now.
        game.version += 1;
      }
      house.residents = top.capacity;
      house.satisfaction = 1;
      house.needs = new Array<number>(needCount(TOP_TIER)).fill(1);
      house.decline = 0;
    }
  }
}
