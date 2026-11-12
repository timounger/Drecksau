/**
 * Turning a game into something storable and back.
 *
 * @module
 * @remarks
 * Only plain numbers, strings and arrays go to storage. The map comes back
 * from the seed and the caches are rebuilt on the first step.
 */
import type { Game, SaveData } from "./types";

/**
 * The storable part of a game.
 *
 * @param game - the game
 * @returns a deep copy without the passing things
 */
export function toSave(game: Game): SaveData {
  const data: SaveData = {
    seed: game.seed,
    rng: game.rng,
    time: game.time,
    res: game.res,
    structures: game.structures,
    enemies: game.enemies.filter((enemy) => enemy.alive),
    defenders: game.defenders,
    drops: game.drops,
    nextId: game.nextId,
    wave: game.wave,
    research: game.research,
    weather: game.weather,
    effects: game.effects,
    offer: game.offer,
    eventIn: game.eventIn,
    expedition: game.expedition,
    stats: game.stats,
    over: game.over,
    cheat: game.cheat,
    cheated: game.cheated,
  };
  return JSON.parse(JSON.stringify(data)) as SaveData;
}

/**
 * A game from stored data.
 *
 * @param data - what was stored
 * @returns a running game
 */
export function fromSave(data: SaveData): Game {
  const copy = JSON.parse(JSON.stringify(data)) as SaveData;
  return {
    ...copy,
    res: { ...copy.res },
    structures: [...copy.structures],
    enemies: [...copy.enemies],
    projectiles: [],
    defenders: [...copy.defenders],
    drops: [...copy.drops],
    effects: [...copy.effects],
    cheat: copy.cheat === true,
    cheated: copy.cheated === true || copy.cheat === true,
    rangeBoost: 1,
    freeBuild: false,
    messages: [],
    events: [],
  };
}

/**
 * Whether a stored value still has the shape of a save.
 *
 * @param value - what was read
 * @returns true if it can be loaded
 */
export function isSaveData(value: unknown): value is SaveData {
  const data = value as SaveData;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof data.seed === "number" &&
    typeof data.time === "number" &&
    typeof data.nextId === "number" &&
    typeof data.res === "object" &&
    data.res !== null &&
    Array.isArray(data.structures) &&
    data.structures.every(isStructureLike) &&
    Array.isArray(data.enemies) &&
    Array.isArray(data.defenders) &&
    Array.isArray(data.drops) &&
    Array.isArray(data.effects) &&
    typeof data.wave === "object" &&
    data.wave !== null &&
    Array.isArray(data.wave.queue) &&
    Array.isArray(data.wave.gates) &&
    typeof data.research === "object" &&
    data.research !== null &&
    Array.isArray(data.research.done) &&
    typeof data.weather === "object" &&
    data.weather !== null &&
    typeof data.stats === "object" &&
    data.stats !== null &&
    typeof data.over === "boolean"
  );
}

/** Whether an entry looks like a structure. */
function isStructureLike(value: unknown): boolean {
  const structure = value as {
    kind?: unknown;
    col?: unknown;
    row?: unknown;
    hp?: unknown;
  };
  return (
    typeof value === "object" &&
    value !== null &&
    typeof structure.kind === "string" &&
    typeof structure.col === "number" &&
    typeof structure.row === "number" &&
    typeof structure.hp === "number"
  );
}
