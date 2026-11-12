/**
 * The computer opponent: it picks an ability when one makes sense, works out a
 * throw that would hit, then misses it by as much as its difficulty says.
 *
 * @module
 * @remarks
 * It searches the real flight, wind included, over a grid of
 * angles and strengths, and keeps the throw in the middle of the widest run of
 * hits - the one that still hits when its hand shakes a little. Then the hand
 * shakes: each difficulty adds its own amount of scatter to the angle, the
 * strength and its reading of the wind. Every draw comes from the match seed,
 * so the same match always plays out the same way.
 */
import { ABILITIES, characterById } from "./characters";
import { canUseAbility, flightSetup } from "./game";
import { ANGLE_MAX, simulateFlight } from "./physics";
import { randomAt } from "./random";
import type { AbilityDef, AbilityId, DuelGame, ThrowInput } from "./types";

/** How good the computer is. */
export type Difficulty = "leicht" | "mittel" | "schwer";

/** Every difficulty, easiest first. */
export const DIFFICULTIES: readonly Difficulty[] = [
  "leicht",
  "mittel",
  "schwer",
];

/** How much a difficulty scatters its throws. */
type Shake = {
  /** Spread of the angle, in degrees. */
  readonly angle: number;
  /** Spread of the strength, as a share of the full range. */
  readonly power: number;
  /** How wrong it may read the wind, in steps. */
  readonly wind: number;
  /** How keen it is on its abilities, 0 to 1. */
  readonly keen: number;
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- tuning values */
/** The scatter of each difficulty. */
const SHAKES: Readonly<Record<Difficulty, Shake>> = {
  leicht: { angle: 7, power: 0.075, wind: 2.5, keen: 0.2 },
  mittel: { angle: 4.2, power: 0.045, wind: 1.6, keen: 0.35 },
  schwer: { angle: 2.6, power: 0.03, wind: 1, keen: 0.5 },
};

/** The angles tried, in degrees. */
const ANGLES: readonly number[] = [
  15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75,
];

/** How finely the strength is tried. */
const POWER_STEPS = 50;

/** Below this share of its life the computer heals or shields itself. */
const LOW_LIFE = 0.55;
const SHIELD_LIFE = 0.8;

/** The opponent's life below which the big throws come out. */
const FINISH_LIFE = 45;

/** Wind at which calming it is worth it, in steps. */
const STRONG_WIND = 3;

/** How much a blinded computer scatters more, and a far-sighted one less. */
const BLIND_SCATTER = 1.8;
const SPYGLASS_SCATTER = 0.7;
const TRUE_SIGHT_SCATTER = 0.35;

/** How many random numbers one throw needs. */
const ROLLS = 5;

/** Draw counters, so each choice has its own random number. */
const DRAW_BASE = 5000;
const DRAW_STRIDE = 8;
/* eslint-enable @typescript-eslint/no-magic-numbers */

/**
 * The computer's throw for the seat on turn.
 *
 * @param game - a match in its throwing phase
 * @param difficulty - how well it aims
 * @returns the throw it makes, with the ability it uses
 */
export function aiThrow(game: DuelGame, difficulty: Difficulty): ThrowInput {
  const seat = game.turn;
  const shake = SHAKES[difficulty];
  const draw = (n: number) =>
    randomAt(
      game.seed,
      DRAW_BASE + (game.lastThrow?.id ?? 0) * DRAW_STRIDE + n,
    );
  const [abilityRoll, windRoll, angleRoll, powerRoll, keenRoll] = Array.from(
    { length: ROLLS },
    (_, i) => draw(i),
  );
  const ability = chooseAbility(game, seat, shake, abilityRoll, keenRoll);
  const def = ability === null ? null : ABILITIES[ability];
  let scatter = game.players[seat].status.blind ? BLIND_SCATTER : 1;
  if (def?.preview === "full") {
    scatter *= SPYGLASS_SCATTER;
  } else if (def?.preview === "true") {
    scatter *= TRUE_SIGHT_SCATTER;
  }
  const guessedWind = game.wind + spread(windRoll, shake.wind * scatter);
  const best = bestAim(game, seat, ability, guessedWind);
  return {
    angle: clamp(
      best.angle + spread(angleRoll, shake.angle * scatter),
      0,
      ANGLE_MAX,
    ),
    power: clamp(best.power + spread(powerRoll, shake.power * scatter), 0, 1),
    ability,
  };
}

/** Which ability, if any, the computer uses this turn. */
function chooseAbility(
  game: DuelGame,
  seat: number,
  shake: Shake,
  roll: number,
  keenRoll: number,
): AbilityId | null {
  const own = game.players[seat];
  const other = game.players[1 - seat];
  const left = characterById(own.character ?? "koch").abilities.filter((id) =>
    canUseAbility(game, seat, id),
  );
  const wants = (def: AbilityDef): boolean => {
    let want = false;
    if (def.heal !== undefined) {
      want = own.hp <= own.maxHp * LOW_LIFE;
    } else if (def.status === "shield") {
      want = own.hp <= own.maxHp * SHIELD_LIFE && !own.status.shield;
    } else if (def.calm === true) {
      want = Math.abs(game.wind) >= STRONG_WIND;
    } else if (def.item !== undefined || def.volley !== undefined) {
      want = other.hp <= FINISH_LIFE || keenRoll < shake.keen;
    } else {
      want = keenRoll < shake.keen;
    }
    return want;
  };
  const willing = left.filter((id) => wants(ABILITIES[id]));
  return willing.length === 0
    ? null
    : willing[Math.floor(roll * willing.length)];
}

/**
 * The surest hit there is, under the wind it believes in.
 *
 * @returns the angle and strength in the middle of the widest run of hits, or
 *   a sensible lob towards the target when nothing hits
 */
function bestAim(
  game: DuelGame,
  seat: number,
  ability: AbilityId | null,
  wind: number,
): { angle: number; power: number } {
  let best = { angle: 45, power: 0.6, score: -1 };
  for (const angle of ANGLES) {
    let runStart = -1;
    for (let step = 0; step <= POWER_STEPS + 1; step++) {
      const power = step / POWER_STEPS;
      const hits =
        step <= POWER_STEPS &&
        simulateFlight(flightSetup(game, seat, { angle, power, ability }, wind))
          .damage > 0;
      if (hits && runStart < 0) {
        runStart = step;
      } else if (!hits && runStart >= 0) {
        const width = step - runStart;
        if (width > best.score) {
          best = {
            angle,
            power: (runStart + step - 1) / 2 / POWER_STEPS,
            score: width,
          };
        }
        runStart = -1;
      }
    }
  }
  return { angle: best.angle, power: best.power };
}

/** A value in [-size, size], from a draw in [0, 1). */
function spread(roll: number, size: number): number {
  return (roll * 2 - 1) * size;
}

/** Keeps a value inside bounds. */
function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}
