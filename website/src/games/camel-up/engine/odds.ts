/**
 * What is actually likely to happen in the rest of a leg.
 *
 * @module
 * @remarks
 * Not a guess and not a sample: with at most five dice left, each showing one
 * of three numbers, there are at most `5! x 3^5 = 29160` ways the leg can play
 * out, and every one of them is equally likely. So the odds are **counted**
 * rather than estimated - walk all of them and see how often each camel ends up
 * in front.
 *
 * That is worth doing properly, because the whole game is about knowing what
 * stacking does to a position. A camel two spaces behind but sitting on top of
 * a heap is often the favourite, and no rule of thumb will tell you that.
 *
 * The walk moves camels **in place and puts them back** rather than copying the
 * track for each branch, which is why there is a second, mutable mover in here
 * next to the pure one in {@link ./track}. Forty thousand copies of a
 * twenty-space track per decision is the difference between a computer player
 * that answers at once and one that thinks for a second every turn; the referee
 * itself stays purely functional, where that matters.
 */
import {
  CAMELS,
  MAX_PIPS,
  TILE_STEP,
  type Camel,
  type CamelUpGame,
  type DesertTile,
} from "./state";

/** How often a camel comes first and second, as shares of one. */
export type Chance = {
  readonly first: number;
  readonly second: number;
};

/** The chances of every camel in the leg being run. */
export type LegOdds = Readonly<Record<Camel, Chance>>;

/** What one move did, so it can be taken back again. */
type Undo = {
  readonly from: number;
  readonly to: number;
  readonly count: number;
  /** True if the camels slid in underneath, which a mirage does. */
  readonly under: boolean;
};

/**
 * Counts how the leg can still end.
 *
 * @param game - the current game
 * @returns for each camel, how often it ends the leg first and second
 * @remarks
 * Only the dice **still in the pyramid** are thrown: what has already been
 * rolled is on the track, and a leg ends when the last die is out.
 */
export function legOdds(game: CamelUpGame): LegOdds {
  const track = game.track.map((stack) => [...stack]);
  const first = new Map<Camel, number>(CAMELS.map((camel) => [camel, 0]));
  const second = new Map<Camel, number>(CAMELS.map((camel) => [camel, 0]));
  const total = walk(track, game.tiles, [...game.dice], first, second);
  const odds = {} as Record<Camel, Chance>;
  for (const camel of CAMELS) {
    odds[camel] = {
      first: (first.get(camel) ?? 0) / total,
      second: (second.get(camel) ?? 0) / total,
    };
  }
  return odds;
}

/**
 * Walks every way the remaining dice can fall.
 *
 * @returns how many endings were counted
 * @remarks
 * Depth-first over "which die comes next" and "what it shows". The die being
 * tried is swapped to the end of the list and the list shortened, so no array
 * is built for the branch; the swap is undone on the way back up.
 */
function walk(
  track: Camel[][],
  tiles: readonly DesertTile[],
  left: Camel[],
  first: Map<Camel, number>,
  second: Map<Camel, number>,
): number {
  if (left.length === 0) {
    const lead = topTwo(track);
    first.set(lead[0], (first.get(lead[0]) ?? 0) + 1);
    second.set(lead[1], (second.get(lead[1]) ?? 0) + 1);
    return 1;
  }
  let counted = 0;
  const last = left.length - 1;
  for (let index = 0; index <= last; index++) {
    // The die being tried is taken out by moving the last one into its slot
    // and shortening the list; both are put back after the branch.
    const chosen = left[index];
    left[index] = left[last];
    left.length = last;
    for (let pips = 1; pips <= MAX_PIPS; pips++) {
      const undo = move(track, tiles, chosen, pips);
      counted += walk(track, tiles, left, first, second);
      unmove(track, undo);
    }
    left.length = last + 1;
    left[last] = index === last ? chosen : left[index];
    left[index] = chosen;
  }
  return counted;
}

/**
 * Moves a camel and everything on its back, remembering how to undo it.
 *
 * @remarks
 * The same rules as the referee's mover: the stack above the camel travels
 * with it, it lands on top of what is already there, and a mirage slides it in
 * underneath instead.
 */
function move(
  track: Camel[][],
  tiles: readonly DesertTile[],
  camel: Camel,
  pips: number,
): Undo {
  const from = spaceOf(track, camel);
  const height = track[from].indexOf(camel);
  const carried = track[from].splice(height);
  const plain = from + pips;
  const tile = plain < track.length ? tileAt(tiles, plain) : null;
  const under = tile !== null && tile.kind === "mirage";
  const to = Math.min(
    track.length - 1,
    Math.max(
      0,
      tile === null ? plain : plain + (under ? -TILE_STEP : TILE_STEP),
    ),
  );
  if (under) {
    track[to].unshift(...carried);
  } else {
    track[to].push(...carried);
  }
  return { from, to, count: carried.length, under };
}

/** Puts a move back exactly as it was. */
function unmove(track: Camel[][], undo: Undo): void {
  const dest = track[undo.to];
  const carried = undo.under
    ? dest.splice(0, undo.count)
    : dest.splice(dest.length - undo.count, undo.count);
  // Back on the end of where they came from - which is exactly where they
  // were, because everything above them travelled with them.
  for (const camel of carried) {
    track[undo.from].push(camel);
  }
}

/** The tile lying on a space, if any. */
function tileAt(
  tiles: readonly DesertTile[],
  space: number,
): DesertTile | null {
  return tiles.find((tile) => tile.space === space) ?? null;
}

/** Which space a camel stands on. */
function spaceOf(track: readonly (readonly Camel[])[], camel: Camel): number {
  let found = -1;
  for (let at = track.length - 1; at >= 0 && found < 0; at--) {
    if (track[at].includes(camel)) {
      found = at;
    }
  }
  return found;
}

/**
 * The two camels in front, without sorting the whole field.
 *
 * @param track - the track to read
 * @returns the leader and the one behind it
 * @remarks
 * Walked from the finish line backwards and from the top of each stack down,
 * because the camel on top of a heap is the one being carried and therefore
 * the one in front. Stops as soon as it has two - this runs tens of thousands
 * of times per decision.
 */
function topTwo(track: readonly (readonly Camel[])[]): readonly [Camel, Camel] {
  const found: Camel[] = [];
  for (let space = track.length - 1; space >= 0 && found.length < 2; space--) {
    const stack = track[space];
    for (
      let height = stack.length - 1;
      height >= 0 && found.length < 2;
      height--
    ) {
      found.push(stack[height]);
    }
  }
  return [found[0], found[1]];
}
