/**
 * Moving a camel, with everything that is riding on its back.
 *
 * @module
 * @remarks
 * The one rule that makes Camel Up what it is: camels **stack**. A camel that
 * moves takes every camel above it along for the ride, and a camel that lands
 * on a space goes on **top** of whatever is already there. So the animal you
 * bet on can be carried half the board by somebody else's die - and the one
 * lying at the bottom of a heap is going nowhere until the heap moves.
 *
 * The one exception is the mirage, and it is the exception that proves the
 * rule: a camel thrown **backwards** slides in **underneath** the stack it
 * lands on, because it stumbled in from the front rather than being dropped on
 * top.
 */
import { TILE_STEP, type Camel, type DesertTile } from "./state";

/** What one throw of a die did. */
export type Advance = {
  /** The track afterwards. */
  readonly track: readonly (readonly Camel[])[];
  /** The tile the camel landed on, or null if it landed on bare sand. */
  readonly tile: DesertTile | null;
};

/**
 * Moves a camel and everything stacked on it.
 *
 * @param track - the track as it is
 * @param tiles - the desert tiles lying on it
 * @param camel - the camel whose die was rolled
 * @param pips - what the die showed
 * @returns the track afterwards, and the tile that was landed on
 * @remarks
 * Pure: the track that comes back is a fresh set of arrays, so the odds
 * calculator can throw thousands of imagined dice at a position without ever
 * disturbing the real one.
 */
export function advance(
  track: readonly (readonly Camel[])[],
  tiles: readonly DesertTile[],
  camel: Camel,
  pips: number,
): Advance {
  const from = spaceOf(track, camel);
  let result: Advance = { track, tile: null };
  if (from >= 0) {
    const height = track[from].indexOf(camel);
    const carried = track[from].slice(height);
    const plain = from + pips;
    const landed =
      plain < track.length ? tiles.find((t) => t.space === plain) : undefined;
    const tile = landed ?? null;
    const to = Math.min(
      track.length - 1,
      Math.max(
        0,
        tile === null
          ? plain
          : plain + (tile.kind === "oasis" ? TILE_STEP : -TILE_STEP),
      ),
    );
    // The movers leave first, so a move that ends where it began - which a
    // mirage can do - lands on the camels it left behind rather than on itself.
    const next = track.map((stack, at) =>
      at === from ? stack.slice(0, height) : stack,
    );
    // Under the stack after a mirage, on top of it every other time.
    next[to] =
      tile !== null && tile.kind === "mirage"
        ? [...carried, ...next[to]]
        : [...next[to], ...carried];
    result = { track: next, tile };
  }
  return result;
}

/**
 * Which space a camel stands on.
 *
 * @param track - the track to search
 * @param camel - the camel to find
 * @returns the space, or -1 if it is not on the track
 */
export function spaceOf(
  track: readonly (readonly Camel[])[],
  camel: Camel,
): number {
  let found = -1;
  for (let at = 0; at < track.length && found < 0; at++) {
    if (track[at].includes(camel)) {
      found = at;
    }
  }
  return found;
}
