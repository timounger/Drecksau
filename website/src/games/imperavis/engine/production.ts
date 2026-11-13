/**
 * The ProductionManager: every producer turns its inputs into its output,
 * slowed by missing workers, a poor site, the season and the weather, and
 * stopped by missing inputs or a full store of its own. Roads play no part
 * here: a producer works into its own store whether a road leads to it or
 * not; how quickly carts empty that store is the logistics' business.
 *
 * @module
 */
import { BUILDING, LEVEL_SPEED, OUTPUT_CAPACITY } from "./buildings-data";
import { ownerOf, playerById } from "./players";
import { RESEARCH } from "./research-data";
import {
  CROP_FACTOR,
  SEA_FACTOR,
  seasonAt,
  TICK,
  WEATHER_EFFECT,
} from "./time";
import type {
  Building,
  Game,
  ProducerState,
  ProducerStatus,
  Recipe,
} from "./types";

/** Seconds over which efficiency is averaged. */
const EFFICIENCY_WINDOW = 60;

/** Below this worker share a producer stands still. */
const MIN_WORKERS = 0.05;

/** A building below this share of its hit points works at half speed. */
export const DAMAGED = 0.5;

/** How fast a badly damaged building works. */
const DAMAGED_SPEED = 0.5;

/**
 * A fresh producer state.
 *
 * @returns it
 */
export function createProducer(): ProducerState {
  return {
    input: {},
    output: 0,
    cycle: 0,
    efficiency: 0,
    status: "building",
    warehouse: -1,
    made: 0,
    site: 1,
  };
}

/**
 * How fast a producer works right now, apart from its inputs.
 *
 * @param game - the game
 * @param building - the producer
 * @returns a factor, 0 when it cannot work
 */
export function speedOf(game: Game, building: Building): number {
  const def = BUILDING[building.kind];
  const recipe = def.recipe as Recipe;
  const season = seasonAt(game.time);
  const weather = WEATHER_EFFECT[game.weather];
  let factor = (building.prod as ProducerState).site;
  if (def.workers !== null) {
    factor *= game.labour[building.island]?.[def.workers.tier] ?? 0;
  }
  if (building.level > 0) {
    factor *= LEVEL_SPEED;
  }
  if (building.hp < def.hp * DAMAGED) {
    factor *= DAMAGED_SPEED;
  }
  factor *= 1 + researchBonus(game, building);
  switch (recipe.seasonal) {
    case "crop": {
      const harvest = game.islands[building.island].harvest;
      factor *= CROP_FACTOR[season] * weather.crop;
      if (harvest !== null && harvest.until > game.time) {
        factor *= harvest.factor;
      }
      break;
    }
    case "sea":
      factor *= SEA_FACTOR[season] * weather.sea;
      break;
    default:
      break;
  }
  return factor;
}

/**
 * Extra output the owner's research gives a producer, as a share.
 *
 * @param game - the game
 * @param building - the producer
 * @returns 0 for none, 0.2 for +20 %
 */
export function researchBonus(game: Game, building: Building): number {
  const owner = playerById(game, ownerOf(game, building));
  const def = BUILDING[building.kind];
  let bonus = 0;
  for (const field of RESEARCH) {
    const helps =
      (field.boosts === "crop" && def.recipe?.seasonal === "crop") ||
      (field.boosts === "craft" && def.category === "craft");
    if (helps && owner !== null && owner.research.done.includes(field.id)) {
      bonus += field.bonus;
    }
  }
  return bonus;
}

/**
 * Runs one step of every producer.
 *
 * @param game - the game
 */
export function stepProduction(game: Game): void {
  const blend = TICK / EFFICIENCY_WINDOW;
  for (const building of game.buildings) {
    const prod = building.prod;
    const recipe = BUILDING[building.kind].recipe;
    if (prod !== null && recipe !== null) {
      let status: ProducerStatus;
      if (!building.complete) {
        status = "building";
      } else if (building.paused || building.fire > 0) {
        status = "paused";
      } else {
        status = work(game, building, prod, recipe);
      }
      prod.status = status;
      prod.efficiency +=
        ((status === "working" ? 1 : 0) - prod.efficiency) * blend;
    }
  }
}

/** One step of one working producer; returns what it is doing. */
function work(
  game: Game,
  building: Building,
  prod: ProducerState,
  recipe: Recipe,
): ProducerStatus {
  const speed = speedOf(game, building);
  const workers = BUILDING[building.kind].workers;
  const staffed =
    workers === null ||
    (game.labour[building.island]?.[workers.tier] ?? 0) >= MIN_WORKERS;
  const hasInputs = recipe.inputs.every(
    (input) => (prod.input[input.good] ?? 0) >= input.amount,
  );
  let status: ProducerStatus;
  if (prod.site <= 0) {
    status = "noResource";
  } else if (!staffed) {
    status = "noWorkers";
  } else if (prod.output + recipe.amount > OUTPUT_CAPACITY) {
    // Full: waiting for a cart, or no cart can come at all.
    status = prod.warehouse < 0 ? "noRoad" : "full";
  } else if (!hasInputs && prod.cycle <= 0) {
    status = prod.warehouse < 0 ? "noRoad" : "noInput";
  } else {
    if (prod.cycle <= 0) {
      // Inputs are taken when a cycle begins.
      for (const input of recipe.inputs) {
        prod.input[input.good] = (prod.input[input.good] ?? 0) - input.amount;
      }
    }
    prod.cycle += TICK * speed;
    if (prod.cycle >= recipe.seconds) {
      prod.cycle = 0;
      prod.output += recipe.amount;
      prod.made += recipe.amount;
    }
    status = "working";
  }
  return status;
}
