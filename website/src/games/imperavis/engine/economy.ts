/**
 * The EconomyManager: each player's treasury, the ledger of income and
 * expenses, and the running costs of buildings and ships.
 *
 * @module
 */
import { BUILDING, LEVEL_UPKEEP } from "./buildings-data";
import { SHIP } from "./ships-data";
import { troopUpkeep } from "./troops";
import { TICK } from "./time";
import type {
  Building,
  Game,
  Ledger,
  LedgerLine,
  Personality,
  Player,
} from "./types";

/**
 * Share of the building upkeep each AI character pays: the expansionist
 * runs its many small settlements cheaply.
 */
export const AI_UPKEEP: Readonly<Record<Personality, number>> = {
  trader: 1,
  expansionist: 0.75,
  warlike: 1,
};

/** Game seconds in a ledger minute. */
export const MINUTE = 60;

/** Minutes of balance history kept for the chart. */
export const HISTORY = 30;

/** A paused building costs this share of its upkeep. */
export const PAUSED_UPKEEP = 0.5;

/** A building site costs this share of its upkeep. */
const SITE_UPKEEP = 0.25;

/** The kinds of income. */
export type IncomeKind = "taxes" | "sales" | "rewards";

/** The kinds of expense. */
export type ExpenseKind =
  "upkeepBuildings" | "upkeepShips" | "purchases" | "construction" | "payments";

/**
 * A ledger line with nothing in it.
 *
 * @returns the line
 */
export function emptyLine(): LedgerLine {
  return {
    taxes: 0,
    sales: 0,
    upkeepBuildings: 0,
    upkeepShips: 0,
    purchases: 0,
    construction: 0,
    rewards: 0,
    payments: 0,
  };
}

/**
 * A fresh ledger.
 *
 * @param gold - the gold at the start
 * @returns the ledger
 */
export function createLedger(gold: number): Ledger {
  return { current: emptyLine(), last: emptyLine(), history: [gold], clock: 0 };
}

/**
 * Income minus expenses of one line.
 *
 * @param line - the line
 * @returns the balance
 */
export function lineBalance(line: LedgerLine): number {
  return (
    line.taxes +
    line.sales +
    line.rewards -
    line.upkeepBuildings -
    line.upkeepShips -
    line.purchases -
    line.construction -
    line.payments
  );
}

/**
 * Takes gold in.
 *
 * @param player - who earns it
 * @param amount - how much
 * @param kind - which income
 */
export function earn(player: Player, amount: number, kind: IncomeKind): void {
  player.gold += amount;
  player.ledger.current[kind] += amount;
}

/**
 * Pays gold out.
 *
 * @param player - who pays
 * @param amount - how much
 * @param kind - which expense
 */
export function spend(player: Player, amount: number, kind: ExpenseKind): void {
  player.gold -= amount;
  player.ledger.current[kind] += amount;
}

/**
 * Upkeep per minute of a player's buildings.
 *
 * @param game - the game
 * @param player - the player id
 * @returns gold per minute
 */
export function buildingUpkeep(game: Game, player: number): number {
  const personality = game.players[player]?.ai?.personality;
  const factor = personality === undefined ? 1 : AI_UPKEEP[personality];
  let sum = 0;
  for (const building of game.buildings) {
    if (game.islands[building.island].owner === player) {
      sum += upkeepOf(building);
    }
  }
  return sum * factor;
}

/**
 * Upkeep per minute of one building, before the owner's character: a site
 * pays a quarter, a paused building half, a second stage more.
 *
 * @param building - the building
 * @returns gold per minute
 */
export function upkeepOf(building: Building): number {
  const base =
    BUILDING[building.kind].upkeep * (building.level > 0 ? LEVEL_UPKEEP : 1);
  const share = !building.complete
    ? SITE_UPKEEP
    : building.paused
      ? PAUSED_UPKEEP
      : 1;
  return base * share;
}

/**
 * Upkeep per minute of a player's ships.
 *
 * @param game - the game
 * @param player - the player id
 * @returns gold per minute
 */
export function shipUpkeep(game: Game, player: number): number {
  return (
    game.ships
      .filter((ship) => ship.owner === player)
      .reduce((sum, ship) => sum + SHIP[ship.kind].upkeep, 0) +
    troopUpkeep(game, player)
  );
}

/**
 * Charges one step of running costs and closes the minute when it is over.
 *
 * @param game - the game
 */
export function stepEconomy(game: Game): void {
  for (const player of game.players) {
    const wasSolvent = player.gold >= 0;
    spend(
      player,
      (buildingUpkeep(game, player.id) / MINUTE) * TICK,
      "upkeepBuildings",
    );
    spend(player, (shipUpkeep(game, player.id) / MINUTE) * TICK, "upkeepShips");
    if (wasSolvent && player.gold < 0) {
      game.events.push({ type: "debt", player: player.id });
    }
    const ledger = player.ledger;
    ledger.clock += TICK;
    if (ledger.clock >= MINUTE) {
      ledger.clock -= MINUTE;
      ledger.last = ledger.current;
      ledger.current = emptyLine();
      ledger.history.push(Math.round(player.gold));
      if (ledger.history.length > HISTORY) {
        ledger.history.shift();
      }
    }
  }
}
