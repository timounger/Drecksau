/**
 * The guided start at work: when a task counts as done, moving on (and over
 * tasks the player has already done), its progress for the screen, and
 * ending it.
 *
 * @module
 * @remarks
 * Driven by changes, not by looking at every building in every step: it
 * looks again when a command of the human built, laid a road or tore
 * something down, when the derived grids were rebuilt (a site finished, a
 * road joined a store - {@link Game.version} moved on), and once a second
 * for what grows by itself (residents, tiers, the ship nearing a coast, the
 * time the road task waits for).
 * The ship is only looked at on that second, so a loaded game moves on at
 * exactly the same step as the original.
 */
import { linkKind } from "./logistics";
import { freeCoastNear, settleSite } from "./placement";
import { HUMAN } from "./players";
import { TICK } from "./time";
import {
  currentStep,
  TUTORIAL_STEPS,
  type TutorialGoal,
} from "./tutorial-data";
import type { Game, PlayerCommand, Ship } from "./types";

/** Seconds between two looks at what grows by itself. */
export const TUTORIAL_EVERY = 1;

/** Steps between two such looks. */
const LOOK_STEPS = Math.round(TUTORIAL_EVERY / TICK);

/** Commands after which the guided start looks again at once. */
const BUILDING_COMMANDS: readonly PlayerCommand["type"][] = [
  "build",
  "road",
  "demolish",
  "relocate",
];

/** How far a task has come. */
export type TutorialProgress = {
  readonly done: number;
  readonly total: number;
};

/**
 * The guided start's part of a simulation step, at its end.
 *
 * @param game - the game
 */
export function stepTutorial(game: Game): void {
  if (game.tutorial.active) {
    const looked = game.tick % LOOK_STEPS === 0;
    if (looked || game.version !== game.tutorialSeen) {
      game.tutorialSeen = game.version;
      advance(game, looked);
    }
  }
}

/**
 * Looks again after a command of the human that changed the buildings.
 *
 * @param game - the game
 * @param command - the command just applied
 */
export function noteCommand(game: Game, command: PlayerCommand): void {
  if (
    game.tutorial.active &&
    command.player === HUMAN &&
    BUILDING_COMMANDS.includes(command.type)
  ) {
    advance(game, false);
  }
}

/**
 * Starts the guided start again from its first task (the test flag
 * `tutorial`), and moves on over what is done already.
 *
 * @param game - the game
 */
export function startTutorial(game: Game): void {
  game.tutorial = { active: true, step: 0, times: [] };
  advance(game, true);
}

/**
 * Ends the guided start for good: from now on only the usual unlocks count.
 *
 * @param game - the game
 * @param player - who asks (only the human has a guided start)
 * @returns null when ended, else why not
 */
export function endTutorial(game: Game, player: number): string | null {
  let reason: string | null = null;
  if (player !== HUMAN || !game.tutorial.active) {
    reason = "missing";
  } else {
    game.tutorial.active = false;
    game.events.push({
      type: "tutorial",
      player: HUMAN,
      step: null,
      state: "ended",
    });
  }
  return reason;
}

/**
 * How far the current task has come, for the screen.
 *
 * @param game - the game
 * @returns done and total, or null without a current task
 */
export function tutorialProgress(game: Game): TutorialProgress | null {
  const step = currentStep(game.tutorial);
  return step === null ? null : goalProgress(game, step.goal, true);
}

/**
 * The own ship that lies off a free island, and the island.
 *
 * @param game - the game
 * @returns the first such ship with its island, or null
 */
export function shipOffFreeCoast(
  game: Game,
): { readonly ship: Ship; readonly island: number } | null {
  let result: { ship: Ship; island: number } | null = null;
  for (const ship of game.ships) {
    const island: number =
      result === null && ship.owner === HUMAN
        ? freeCoastNear(game, ship.x, ship.y)
        : -1;
    if (island >= 0 && settleSite(game, HUMAN, ship, island) !== null) {
      result = { ship, island };
    }
  }
  return result;
}

/**
 * Moves on while the current task is done; tasks done early are passed at
 * once, each with its event.
 *
 * @param game - the game
 * @param looked - whether this is the second to look at ships and people
 */
function advance(game: Game, looked: boolean): void {
  const state = game.tutorial;
  let going = true;
  while (going && state.active) {
    const step = TUTORIAL_STEPS[state.step];
    const progress = goalProgress(game, step.goal, looked);
    going = progress.done >= progress.total;
    if (going) {
      state.times.push(game.time);
      state.step += 1;
      const finished = state.step >= TUTORIAL_STEPS.length;
      state.active = !finished;
      game.events.push({
        type: "tutorial",
        player: HUMAN,
        step: step.id,
        state: finished ? "finished" : "done",
      });
    }
  }
}

/**
 * How far a goal has come.
 *
 * @param game - the game
 * @param goal - the goal
 * @param looked - whether the ships may be looked at
 * @returns done and total
 */
function goalProgress(
  game: Game,
  goal: TutorialGoal,
  looked: boolean,
): TutorialProgress {
  const human = game.players[HUMAN];
  let result: TutorialProgress;
  switch (goal.type) {
    case "coast":
      result = {
        done:
          ownedIslands(game) > 0 || (looked && shipOffFreeCoast(game) !== null)
            ? 1
            : 0,
        total: 1,
      };
      break;
    case "islands":
      result = {
        done: Math.min(goal.count, ownedIslands(game)),
        total: goal.count,
      };
      break;
    case "build": {
      const counts = buildingCounts(game);
      result = {
        done: goal.kinds.reduce(
          (sum, kind) => sum + Math.min(goal.count, counts.get(kind) ?? 0),
          0,
        ),
        total: goal.kinds.length * goal.count,
      };
      break;
    }
    case "road": {
      // Since the task before this one was done.
      const since = game.time - (game.tutorial.times.at(-1) ?? 0);
      const own = game.buildings.filter(
        (b) => b.kind === goal.kind && game.islands[b.island].owner === HUMAN,
      );
      const byRoad = own.some((b) => linkKind(game, b) === "road");
      const overLand =
        since >= goal.grace &&
        own.some((b) => b.complete && linkKind(game, b) !== "none");
      result = { done: byRoad || overLand ? 1 : 0, total: 1 };
      break;
    }
    case "residents":
      result = {
        done: Math.min(goal.count, human.stats.peakPopulation),
        total: goal.count,
      };
      break;
    default:
      result = { done: human.stats.peakTier >= goal.tier ? 1 : 0, total: 1 };
  }
  return result;
}

/** Islands the human owns. */
function ownedIslands(game: Game): number {
  return game.islands.filter((island) => island.owner === HUMAN).length;
}

/** The human's buildings by kind, sites included. */
function buildingCounts(game: Game): Map<string, number> {
  const counts = new Map<string, number>();
  for (const building of game.buildings) {
    if (game.islands[building.island].owner === HUMAN) {
      counts.set(building.kind, (counts.get(building.kind) ?? 0) + 1);
    }
  }
  return counts;
}
