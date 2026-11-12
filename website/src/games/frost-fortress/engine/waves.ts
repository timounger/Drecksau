/**
 * The waves: what comes, from where, when - and the countdown between them.
 *
 * @module
 */
import { ENEMY_NAMES, LOG } from "@/games/frost-fortress/i18n/texts";
import { spawnEnemy } from "./combat";
import { receive } from "./economy";
import { BOSS_EVERY, ENEMIES, ENEMY_KINDS } from "./enemies";
import { GATES, MAP_COLS, TILE } from "./map";
import { pushMessage } from "./log";
import { nextRandom, randomRange } from "./random";
import type { Cost, EnemyKind, Game, Spawn } from "./types";

/** Seconds before the first wave. */
export const FIRST_WAVE = 210;

/** Seconds between the end of one wave and the next. */
export const WAVE_GAP = 100;

/** After this many seconds a wave counts as over even if stragglers remain. */
const MAX_WAVE_TIME = 200;

/** Budget of a wave: base, per wave, per wave squared. */
const BUDGET_BASE = 4;
const BUDGET_LINEAR = 4;
const BUDGET_SQUARE = 0.7;

/** How often each type is chosen, relative to the others. */
const WEIGHTS: Readonly<Record<EnemyKind, number>> = {
  raider: 3,
  soldier: 4,
  heavy: 2,
  demolisher: 1.5,
  siege: 1,
  boss: 0,
};

/** Spawning stretches over this long: base, per enemy, at most. */
const SPAWN_BASE = 6;
const SPAWN_PER_ENEMY = 0.45;
const SPAWN_MOST = 45;

/** The boss appears this many seconds into its wave. */
const BOSS_DELAY = 8;

/** More gates every so many waves, up to four; all eight from this wave. */
const WAVES_PER_GATE = 3;
const MOST_GATES = 4;
const CARDINAL_GATES = 4;
const ALL_GATES_FROM = 6;

/** Enemies appear within this many tiles of their gate. */
const GATE_SCATTER = 1.8;

/* eslint-disable @typescript-eslint/no-magic-numbers -- the reward table */
/** Reward for a wave: base and growth per wave, per resource. */
const REWARD: Readonly<Record<string, readonly [number, number]>> = {
  wood: [40, 15],
  iron: [25, 10],
  stone: [25, 10],
  food: [20, 5],
};
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** Half a tile. */
const HALF = 0.5;

/** Bonus per second of countdown left when a wave is called early. */
const EARLY_BONUS = 0.8;

/**
 * The budget of a wave.
 *
 * @param wave - the wave number
 * @returns points to spend on enemies
 */
export function waveBudget(wave: number): number {
  return BUDGET_BASE + BUDGET_LINEAR * wave + BUDGET_SQUARE * wave * wave;
}

/**
 * Whether a wave brings a boss.
 *
 * @param wave - the wave number
 * @returns true every fifth wave
 */
export function isBossWave(wave: number): boolean {
  return wave > 0 && wave % BOSS_EVERY === 0;
}

/**
 * The enemies of a wave.
 *
 * @param game - the game, for its random numbers
 * @param wave - the wave number
 * @returns who comes when and through which gate
 */
export function planWave(game: Game, wave: number): Spawn[] {
  const kinds = ENEMY_KINDS.filter(
    (kind) => kind !== "boss" && ENEMIES[kind].fromWave <= wave,
  );
  const chosen: EnemyKind[] = [];
  let budget = waveBudget(wave);
  for (;;) {
    const fitting = kinds.filter((kind) => ENEMIES[kind].points <= budget);
    if (fitting.length === 0) {
      break;
    }
    const total = fitting.reduce((sum, kind) => sum + WEIGHTS[kind], 0);
    let roll = nextRandom(game) * total;
    let pick = fitting[0];
    for (const kind of fitting) {
      roll -= WEIGHTS[kind];
      if (roll <= 0) {
        pick = kind;
        break;
      }
    }
    chosen.push(pick);
    budget -= ENEMIES[pick].points;
  }
  const length = Math.min(
    SPAWN_MOST,
    SPAWN_BASE + chosen.length * SPAWN_PER_ENEMY,
  );
  const gates = Math.max(1, game.wave.gates.length);
  const spawns: Spawn[] = chosen.map((kind) => ({
    kind,
    at: nextRandom(game) * length,
    gate: Math.floor(nextRandom(game) * gates),
  }));
  if (isBossWave(wave)) {
    spawns.push({ kind: "boss", at: BOSS_DELAY, gate: 0 });
  }
  return spawns.sort((a, b) => a.at - b.at);
}

/**
 * Chooses the gates for a wave.
 *
 * @param game - the game, for its random numbers
 * @param wave - the wave number
 * @returns the gates' tiles
 */
export function chooseGates(
  game: Game,
  wave: number,
): { col: number; row: number }[] {
  const count = Math.min(
    MOST_GATES,
    1 + Math.floor((wave - 1) / WAVES_PER_GATE),
  );
  const pool = GATES.slice(
    0,
    wave >= ALL_GATES_FROM ? GATES.length : CARDINAL_GATES,
  );
  const picked: { col: number; row: number }[] = [];
  while (picked.length < count && pool.length > 0) {
    const index = Math.floor(nextRandom(game) * pool.length);
    picked.push({ ...pool[index] });
    pool.splice(index, 1);
  }
  return picked;
}

/**
 * Runs the countdown or the wave.
 *
 * @param game - the game, changed
 * @param dt - seconds
 */
export function updateWaves(game: Game, dt: number): void {
  const wave = game.wave;
  if (!wave.active) {
    // Building freely, the clock stands still: waves come only when called.
    if (!game.freeBuild) {
      wave.countdown -= dt;
      if (wave.countdown <= 0) {
        startWave(game);
      }
    }
  } else {
    wave.elapsed += dt;
    while (wave.queue.length > 0 && wave.queue[0].at <= wave.elapsed) {
      const spawn = wave.queue.shift() as Spawn;
      const gate = wave.gates[spawn.gate] ?? wave.gates[0] ?? GATES[0];
      const x =
        (gate.col + HALF + randomRange(game, -GATE_SCATTER, GATE_SCATTER)) *
        TILE;
      const y =
        (gate.row + HALF + randomRange(game, -GATE_SCATTER, GATE_SCATTER)) *
        TILE;
      spawnEnemy(game, spawn.kind, clampWorld(x), clampWorld(y));
    }
    const cleared =
      wave.queue.length === 0 && game.enemies.every((enemy) => !enemy.alive);
    if (cleared || (wave.queue.length === 0 && wave.elapsed > MAX_WAVE_TIME)) {
      finishWave(game);
    }
  }
}

/**
 * Sends the next wave now, with a bonus for the time given up.
 *
 * @param game - the game, changed
 * @returns true if a wave was sent
 */
export function callWave(game: Game): boolean {
  const ok = !game.wave.active && !game.over;
  if (ok) {
    // Building freely, the countdown stands still - nothing was given up.
    const bonus = game.freeBuild
      ? 0
      : Math.round(game.wave.countdown * EARLY_BONUS);
    if (bonus > 0) {
      receive(game, { wood: bonus, iron: bonus });
      pushMessage(game, LOG.early(bonus), "good");
    }
    startWave(game);
  }
  return ok;
}

/** How many of a kind one call brings. */
export const SUMMON_GROUP: Readonly<Record<EnemyKind, number>> = {
  raider: 6,
  soldier: 5,
  heavy: 3,
  demolisher: 3,
  siege: 2,
  boss: 1,
};

/** Spread of a called group around its gate, tiles. */
const SUMMON_SCATTER = 1.5;

/**
 * Calls a group of one enemy kind from a random gate, as strong as the
 * current wave's enemies.
 *
 * @param game - the game, changed
 * @param kind - which enemy
 * @returns true if they came
 */
export function summonEnemies(game: Game, kind: EnemyKind): boolean {
  const ok = !game.over;
  if (ok) {
    const gate = GATES[Math.floor(nextRandom(game) * GATES.length)];
    for (let index = 0; index < SUMMON_GROUP[kind]; index += 1) {
      const x =
        (gate.col + HALF + randomRange(game, -SUMMON_SCATTER, SUMMON_SCATTER)) *
        TILE;
      const y =
        (gate.row + HALF + randomRange(game, -SUMMON_SCATTER, SUMMON_SCATTER)) *
        TILE;
      spawnEnemy(game, kind, clampWorld(x), clampWorld(y));
    }
    pushMessage(
      game,
      LOG.summoned(ENEMY_NAMES[kind], SUMMON_GROUP[kind]),
      "bad",
    );
  }
  return ok;
}

/**
 * What a cleared wave brings.
 *
 * @param wave - the wave number
 * @returns the reward
 */
export function waveReward(wave: number): Cost {
  const reward: Partial<Record<string, number>> = {};
  for (const [id, [base, step]] of Object.entries(REWARD)) {
    reward[id] = base + step * wave;
  }
  return reward;
}

/** Begins the next wave. */
function startWave(game: Game): void {
  const wave = game.wave;
  wave.number += 1;
  wave.active = true;
  wave.elapsed = 0;
  wave.countdown = 0;
  if (wave.gates.length === 0) {
    wave.gates = chooseGates(game, wave.number);
  }
  wave.queue = planWave(game, wave.number);
  const boss = isBossWave(wave.number);
  pushMessage(
    game,
    boss ? LOG.bossWave(wave.number) : LOG.waveStart(wave.number),
    "bad",
  );
  for (const kind of ENEMY_KINDS) {
    if (
      ENEMIES[kind].fromWave === wave.number &&
      kind !== "boss" &&
      wave.number > 1
    ) {
      pushMessage(game, LOG.newEnemy(ENEMY_NAMES[kind]), "bad");
    }
  }
  game.events.push({ type: boss ? "bossArrives" : "waveStart" });
}

/** Ends the running wave and starts the countdown. */
function finishWave(game: Game): void {
  const wave = game.wave;
  wave.active = false;
  wave.countdown = WAVE_GAP;
  wave.queue = [];
  receive(game, waveReward(wave.number));
  pushMessage(game, LOG.waveClear(wave.number), "good");
  game.events.push({ type: "waveClear" });
  wave.gates = chooseGates(game, wave.number + 1);
}

/** Keeps a spawn point on the map. */
function clampWorld(value: number): number {
  return Math.min(MAP_COLS * TILE - TILE / 2, Math.max(TILE / 2, value));
}
