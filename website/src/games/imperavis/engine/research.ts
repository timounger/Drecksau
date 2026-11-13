/**
 * Research: scholars' houses and universities gather research points for
 * their owner, who puts them into one field at a time; a finished field
 * opens buildings, ships, a house tier or makes producers faster.
 *
 * @module
 */
import { BUILDING, LEVEL_SPEED } from "./buildings-data";
import { ownerOf } from "./players";
import { RESEARCH, RESEARCH_BY_ID } from "./research-data";
import { TICK } from "./time";
import type { Game, Player, ResearchId } from "./types";

/** Seconds between two research rounds. */
const RESEARCH_EVERY = 1;

/** Steps per research round. */
const ROUND_STEPS = Math.round(RESEARCH_EVERY / TICK);

/** Seconds in a minute, for per-minute rates. */
const PER_MINUTE = 60;

/**
 * Whether a player may start a field now.
 *
 * @param player - the player
 * @param id - the field
 * @returns true when all it needs is done and it is not done itself
 */
export function canResearch(player: Player, id: ResearchId): boolean {
  const def = RESEARCH_BY_ID[id];
  return (
    def !== undefined &&
    !player.research.done.includes(id) &&
    def.needs.every((need) => player.research.done.includes(need))
  );
}

/**
 * Chooses what a player studies.
 *
 * @param player - the player
 * @param id - the field, or null to stop
 * @returns null when chosen, else why not
 */
export function chooseResearch(
  player: Player,
  id: ResearchId | null,
): string | null {
  let reason: string | null = null;
  if (id === null) {
    player.research.current = null;
    player.research.progress = 0;
  } else if (!canResearch(player, id)) {
    reason = "researchLocked";
  } else if (player.research.current !== id) {
    player.research.current = id;
    player.research.progress = 0;
  }
  return reason;
}

/**
 * Research points per minute a player gathers right now.
 *
 * @param game - the game
 * @param player - the player id
 * @returns points per minute
 */
export function researchRate(game: Game, player: number): number {
  let rate = 0;
  for (const building of game.buildings) {
    const def = BUILDING[building.kind];
    if (
      def.science > 0 &&
      building.complete &&
      !building.paused &&
      ownerOf(game, building) === player
    ) {
      const staff =
        def.workers === null
          ? 1
          : (game.labour[building.island]?.[def.workers.tier] ?? 0);
      rate += def.science * staff * (building.level > 0 ? LEVEL_SPEED : 1);
    }
  }
  return rate;
}

/**
 * One research round for every player.
 *
 * @param game - the game
 */
export function stepResearch(game: Game): void {
  if (game.tick % ROUND_STEPS === 0) {
    for (const player of game.players) {
      const state = player.research;
      state.rate = researchRate(game, player.id);
      const current = state.current;
      if (current !== null) {
        state.progress += (state.rate * RESEARCH_EVERY) / PER_MINUTE;
        if (state.progress >= RESEARCH_BY_ID[current].cost) {
          finish(game, player, current);
        }
      }
    }
  }
}

/**
 * The fields a player could start now.
 *
 * @param player - the player
 * @returns field ids in list order
 */
export function openFields(player: Player): ResearchId[] {
  return RESEARCH.filter((def) => canResearch(player, def.id)).map(
    (def) => def.id,
  );
}

/** A field is done: it opens what it opens. */
function finish(game: Game, player: Player, id: ResearchId): void {
  const state = player.research;
  state.done.push(id);
  state.current = null;
  state.progress = 0;
  game.events.push({ type: "researched", player: player.id, research: id });
  // Buildings it opens appear with the next population round's unlocks.
}
