/**
 * The guided start as data: its tasks in order, what each recommends, which
 * buildings it releases and when it counts as done - laid out along the real
 * dependencies of the buildings, the tiers and their needs.
 *
 * @module
 * @remarks
 * The guided start only ever holds buildings back on top of the usual
 * unlocks (residents, tier, research); it never opens one early. A building
 * is free to build when it is unlocked as usual and the current task or an
 * earlier one released it. Roads and tearing down are tools and always free.
 * Each building is released by one task at most; whatever no task releases
 * waits for the end of the guided start.
 */
import { BUILDING } from "./buildings-data";
import type { BuildingKind, TutorialState, TutorialStepId } from "./types";

/** Houses the first quarter wants. */
const HOUSES_GOAL = 4;

/**
 * Residents the town should reach: where the sheep farm and the weaver
 * unlock, so the first chain can follow.
 */
const RESIDENTS_GOAL = BUILDING.weaver.unlock?.residents ?? 0;

/** The workers' tier, the second one. */
const WORKERS_TIER = 1;

/**
 * Seconds the road task waits before it counts as done without a road,
 * when the finished woodcutter is already reached by carts over open land.
 */
export const ROAD_GRACE = 45;

/** When a task counts as done. */
export type TutorialGoal =
  /** An own ship lies off the coast of a free island, or an island is owned. */
  | { readonly type: "coast" }
  /** The human owns this many islands. */
  | { readonly type: "islands"; readonly count: number }
  /** Of each kind at least this many stand (building sites count). */
  | {
      readonly type: "build";
      readonly kinds: readonly BuildingKind[];
      readonly count: number;
    }
  /**
   * A building of the kind reaches a finished kontor or warehouse by road -
   * or, after the grace seconds, a finished one is already reached by carts
   * over open land (a road is a gain, not a must).
   */
  | {
      readonly type: "road";
      readonly kind: BuildingKind;
      readonly grace: number;
    }
  /** The human's residents reached this many at some time. */
  | { readonly type: "residents"; readonly count: number }
  /** A house of the human reached this tier. */
  | { readonly type: "tier"; readonly tier: number };

/** One task of the guided start. */
export type TutorialStep = {
  readonly id: TutorialStepId;
  /** The buildings the task is about, highlighted in the build menu. */
  readonly recommended: readonly BuildingKind[];
  /** Whether the road tool is what the task wants. */
  readonly road: boolean;
  /** Buildings open from this task on. */
  readonly releases: readonly BuildingKind[];
  readonly goal: TutorialGoal;
};

/** The tasks, in order. */
export const TUTORIAL_STEPS: readonly TutorialStep[] = [
  {
    id: "explore",
    recommended: ["kontor"],
    road: false,
    releases: ["kontor"],
    goal: { type: "coast" },
  },
  {
    id: "settle",
    recommended: ["kontor"],
    road: false,
    releases: [],
    goal: { type: "islands", count: 1 },
  },
  {
    id: "wood",
    recommended: ["woodcutter"],
    road: false,
    releases: ["woodcutter"],
    goal: { type: "build", kinds: ["woodcutter"], count: 1 },
  },
  {
    id: "road",
    recommended: [],
    road: true,
    releases: [],
    goal: { type: "road", kind: "woodcutter", grace: ROAD_GRACE },
  },
  {
    id: "planks",
    recommended: ["sawmill"],
    road: false,
    releases: ["sawmill"],
    goal: { type: "build", kinds: ["sawmill"], count: 1 },
  },
  {
    id: "houses",
    recommended: ["house"],
    road: false,
    releases: ["house"],
    goal: { type: "build", kinds: ["house"], count: HOUSES_GOAL },
  },
  {
    id: "fish",
    recommended: ["fishery"],
    road: false,
    releases: ["fishery"],
    goal: { type: "build", kinds: ["fishery"], count: 1 },
  },
  {
    id: "centre",
    recommended: ["market", "chapel"],
    road: false,
    releases: ["market", "chapel"],
    goal: { type: "build", kinds: ["market", "chapel"], count: 1 },
  },
  {
    id: "grow",
    recommended: ["house"],
    road: false,
    releases: ["warehouse", "decorTree", "flowerBed"],
    goal: { type: "residents", count: RESIDENTS_GOAL },
  },
  {
    id: "workers",
    recommended: ["house"],
    road: false,
    releases: ["claypit", "brickworks", "quarry"],
    goal: { type: "tier", tier: WORKERS_TIER },
  },
  {
    id: "cloth",
    recommended: ["sheepFarm", "weaver"],
    road: false,
    releases: ["sheepFarm", "weaver"],
    goal: { type: "build", kinds: ["sheepFarm", "weaver"], count: 1 },
  },
  {
    id: "tavern",
    recommended: ["tavern"],
    road: false,
    releases: ["tavern"],
    goal: { type: "build", kinds: ["tavern"], count: 1 },
  },
];

/** The task index that releases each building; missing ones wait for the end. */
const RELEASED_AT: Readonly<Partial<Record<BuildingKind, number>>> =
  Object.fromEntries(
    TUTORIAL_STEPS.flatMap((step, index) =>
      step.releases.map((kind) => [kind, index]),
    ),
  );

/**
 * The guided start in its first task, or switched off.
 *
 * @param on - whether it leads
 * @returns the state
 */
export function createTutorial(on: boolean): TutorialState {
  return { active: on, step: 0, times: [] };
}

/**
 * Whether the guided start still holds a building back.
 *
 * @param state - the guided start
 * @param kind - the building
 * @returns true while no task up to the current one released it
 */
export function tutorialHolds(
  state: TutorialState,
  kind: BuildingKind,
): boolean {
  return (
    state.active && (RELEASED_AT[kind] ?? TUTORIAL_STEPS.length) > state.step
  );
}

/**
 * The task that releases a building.
 *
 * @param kind - the building
 * @returns its index, or the number of tasks when only the end releases it
 */
export function releaseStep(kind: BuildingKind): number {
  return RELEASED_AT[kind] ?? TUTORIAL_STEPS.length;
}

/**
 * The current task.
 *
 * @param state - the guided start
 * @returns the task, or null when it is off, ended or finished
 */
export function currentStep(state: TutorialState): TutorialStep | null {
  return state.active ? (TUTORIAL_STEPS[state.step] ?? null) : null;
}

/**
 * Whether the current task recommends a building.
 *
 * @param state - the guided start
 * @param kind - the building
 * @returns true when it is highlighted
 */
export function tutorialRecommends(
  state: TutorialState,
  kind: BuildingKind,
): boolean {
  return currentStep(state)?.recommended.includes(kind) === true;
}
