/**
 * The three difficulty levels and the named factors each one sets - the
 * only place where the level changes a number of the game.
 *
 * @module
 * @remarks
 * The systems read the factors of a game through {@link difficultyOf} and
 * nowhere else. "Normal" sets every factor to its neutral value (1, or 0
 * for an offset), so a normal game runs exactly as games did before there
 * were levels. What the human gets (start, prices) applies to the human
 * only, what the rivals get to the AI rivals only; pirates and disasters
 * strike everyone alike. The table in the rules document is taken from
 * here.
 */
import type { Difficulty, Game, GameSettings } from "./types";

/** The factors one level sets. */
export type DifficultyFactors = {
  /** Factor on the human's starting gold. */
  readonly startGold: number;
  /** Factor on each good aboard the human's first ship. */
  readonly startCargo: number;
  /** Factor on the seconds between two economic thoughts of a rival. */
  readonly aiThink: number;
  /** Factor on a rival's placement checks and road searches per thought. */
  readonly aiBudget: number;
  /**
   * Factor on the houses a rival wants per island; the residents and gold
   * it waits for before the next island are divided by it.
   */
  readonly aiGrowth: number;
  /** Islands more (or fewer) a rival wants at most. */
  readonly aiIslands: number;
  /** Factor on how fast a rival's producers work. */
  readonly aiWork: number;
  /** Factor on the building upkeep a rival pays (on top of its character). */
  readonly aiUpkeep: number;
  /**
   * Points added to the opinion below which a rival declares war on the
   * human or answers soldiers on its land with war: above 0 it comes to
   * war sooner, below 0 it needs more anger.
   */
  readonly aiWarLine: number;
  /** Factor on the strength a rival wants over the human before a war. */
  readonly aiWarRatio: number;
  /** Factor on the pauses between pirate raids (and old-world raid chance). */
  readonly raidGap: number;
  /** Pirate raiders more (or fewer) out at once, at the start and at most. */
  readonly raiders: number;
  /** Factor on the pause between two pirate ships and on their gold price. */
  readonly pirateBuild: number;
  /** Factor on the chance of disasters, fires and plagues. */
  readonly hazardChance: number;
  /**
   * How hard disasters and fires hit: a factor on how long a disaster
   * lasts and on the damage and losses (a drought's yield share is raised
   * to this power).
   */
  readonly hazardImpact: number;
  /** Factor on what the human pays the free trader and the peoples. */
  readonly buyPrice: number;
  /** Factor on what the free trader and the peoples pay the human. */
  readonly sellPrice: number;
};

/** The levels in menu order. */
export const DIFFICULTIES: readonly Difficulty[] = ["easy", "normal", "hard"];

/** The level of a new game unless chosen otherwise, and of older saves. */
export const DEFAULT_DIFFICULTY: Difficulty = "normal";

/** The factors of every level. */
export const DIFFICULTY: Readonly<Record<Difficulty, DifficultyFactors>> = {
  easy: {
    startGold: 1.5,
    startCargo: 1.25,
    aiThink: 1.25,
    aiBudget: 0.8,
    aiGrowth: 0.8,
    aiIslands: -1,
    aiWork: 0.8,
    aiUpkeep: 1.15,
    aiWarLine: -15,
    aiWarRatio: 1.15,
    raidGap: 1.8,
    raiders: -1,
    pirateBuild: 1.6,
    hazardChance: 0.5,
    hazardImpact: 0.7,
    buyPrice: 0.9,
    sellPrice: 1.1,
  },
  normal: {
    startGold: 1,
    startCargo: 1,
    aiThink: 1,
    aiBudget: 1,
    aiGrowth: 1,
    aiIslands: 0,
    aiWork: 1,
    aiUpkeep: 1,
    aiWarLine: 0,
    aiWarRatio: 1,
    raidGap: 1,
    raiders: 0,
    pirateBuild: 1,
    hazardChance: 1,
    hazardImpact: 1,
    buyPrice: 1,
    sellPrice: 1,
  },
  hard: {
    startGold: 0.7,
    startCargo: 1,
    aiThink: 0.8,
    aiBudget: 1.25,
    aiGrowth: 1.25,
    aiIslands: 1,
    aiWork: 1.25,
    aiUpkeep: 0.85,
    aiWarLine: 10,
    aiWarRatio: 0.85,
    raidGap: 0.6,
    raiders: 1,
    pirateBuild: 0.6,
    hazardChance: 1.5,
    hazardImpact: 1.3,
    buyPrice: 1.1,
    sellPrice: 0.9,
  },
};

/**
 * The level a game was started with; a missing or unknown one is normal.
 *
 * @param settings - the game's settings
 * @returns the level
 */
export function levelOf(settings: GameSettings): Difficulty {
  const level = settings.difficulty;
  return level !== undefined && DIFFICULTIES.includes(level)
    ? level
    : DEFAULT_DIFFICULTY;
}

/**
 * The factors of a game's level.
 *
 * @param game - the game
 * @returns the factors
 */
export function difficultyOf(game: Game): DifficultyFactors {
  return DIFFICULTY[levelOf(game.settings)];
}
