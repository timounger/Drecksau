/**
 * The map: one long way from the valley to the flag, with checkpoints on it.
 *
 * @module
 * @remarks
 * One route, not a handful. The drive is a single journey, and the checkpoints
 * are the places along it you can pick up from - the sections between them are
 * what the level buttons step through.
 *
 * The map is drawn as two lines of text, one above the other, exactly as the
 * levels of Panzerkiste are drawn as maps. The upper line is the ground, one
 * character every {@link ROUTE_STEP} metres: `0` is the valley floor and every
 * further digit (then `A` onwards) is {@link HEIGHT_UNIT} metres higher. The
 * lower line marks what stands there:
 *
 * - `T` a tree or rock the rope can be hooked to
 * - `C` a checkpoint
 * - `X` a field of ditch: drive in here and the motorhome is wrecked
 * - `H` the hammer, `R` the off-road tyres, `S` the bear spray
 * - `B` the bear
 *
 * The drive begins high up on a **snowy plateau** and works its way down and
 * along. Whether ground is under snow is not marked here: anything above
 * {@link SNOW_FROM} is white, so the plateau and the high passes are snowed in
 * and the valleys are not, without anybody having to draw it in twice.
 *
 * The arithmetic that matters when drawing a stretch: a rise of **one**
 * character over one step is a slope of about 0.28 and can be driven; **two**
 * characters is about 0.56, which is past {@link NO_GRIP_SLOPE} and can only be
 * won with the winch. So every wall of two or more needs an anchor within
 * {@link WINCH_RANGE} - about five and a half characters - of where the wheels
 * give up, or the map is a dead end. Checkpoints belong on **level** ground, or
 * whoever starts there begins by sliding backwards.
 *
 * None of that is left to the eye: `map.test.ts` drives every section.
 */
import {
  HEIGHT_UNIT,
  ROUTE_STEP,
  type Anchor,
  type Item,
  type ItemKind,
  type Pit,
  type Route,
} from "./types";

/** The character that marks a tree on the lower line. */
const ANCHOR_MARK = "T";

/** The character that marks a checkpoint on the lower line. */
const CHECKPOINT_MARK = "C";

/** The character that marks a field of ditch - ground that wrecks a vehicle. */
const PIT_MARK = "X";

/** What each mark of a thing lying about stands for. */
const ITEM_MARKS: Readonly<Record<string, ItemKind>> = {
  H: "hammer",
  R: "tyres",
  S: "spray",
};

/** The character that marks where the bear stands. */
const BEAR_MARK = "B";

/** The digits and letters the ground line is written in. */
const HEIGHT_SCALE = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** The ground, one character every {@link ROUTE_STEP} metres. */
const GROUND =
  "CCCCCCCCCCBA98765432111111123456789ABCDEFGHIJJJJJJJIHGFEDCBA" +
  "988888000888888888887654321111113579999999876543210000002468" +
  "AAAAAAA987654322222222222222222222110";

/** What stands on it: trees, checkpoints, ditches and the things lying about. */
const MARKS =
  "  C                   C                        C            " +
  "   C  XXX T  C    H         C        T C           C R      " +
  "   C            C S     B     C      ";

/** The whole map, ready to drive. */
export const MAP: Route = parseMap(GROUND, MARKS);

/** Where the checkpoints stand, in metres, from the start to the last one. */
export const CHECKPOINTS: readonly number[] = MAP.checkpoints;

/** How many checkpoints the map has. */
export const CHECKPOINT_COUNT = CHECKPOINTS.length;

/**
 * The checkpoint a place on the map belongs to.
 *
 * @param x - how far along the map, in metres
 * @returns the index of the last checkpoint at or before it
 */
export function checkpointAt(x: number): number {
  let found = 0;
  CHECKPOINTS.forEach((at, index) => {
    if (x >= at) {
      found = index;
    }
  });
  return found;
}

/**
 * The checkpoint one step away, wrapping around at both ends.
 *
 * @param from - the checkpoint standing at now
 * @param step - -1 for the one before, 1 for the one after
 * @returns the index to go to
 * @remarks
 * Wrapping is deliberate: from the first one, "back" is the shortest way to the
 * far end of the map, and from the last one, "on" is the way home.
 */
export function checkpointStep(from: number, step: number): number {
  return (from + step + CHECKPOINT_COUNT) % CHECKPOINT_COUNT;
}

/**
 * Turns two lines of text into the map.
 *
 * @param ground - the ground line
 * @param marks - what stands on it
 * @returns the route
 * @throws if the ground is too short to drive or holds an unknown height
 */
export function parseMap(ground: string, marks: string): Route {
  const heights = [...ground].map((char) => {
    const level = HEIGHT_SCALE.indexOf(char);
    if (level < 0) {
      throw new Error(`unknown height "${char}" in the map`);
    }
    return level * HEIGHT_UNIT;
  });
  if (heights.length < 2) {
    throw new Error("the map is too short to drive");
  }
  return {
    name: "Karte",
    heights,
    anchors: anchorsOf(marks, heights),
    pits: pitsOf(marks, heights),
    items: itemsOf(marks, heights),
    bear: bearOf(marks, heights),
    checkpoints: checkpointsOf(ground, marks),
  };
}

/** Reads the tree marks and stands each one on the ground. */
function anchorsOf(marks: string, heights: readonly number[]): Anchor[] {
  const anchors: Anchor[] = [];
  [...marks].forEach((char, index) => {
    if (char === ANCHOR_MARK && index < heights.length) {
      anchors.push({ x: index * ROUTE_STEP, y: heights[index] });
    }
  });
  return anchors;
}

/**
 * Reads the ditch marks and turns each run of them into one pit.
 *
 * @remarks
 * Half a field of slack at each end, so the lip counts as the hole: a
 * motorhome that has its nose over the edge is already on its way in.
 */
function pitsOf(marks: string, heights: readonly number[]): Pit[] {
  const pits: Pit[] = [];
  let from = -1;
  [...marks].forEach((char, index) => {
    const hole = char === PIT_MARK && index < heights.length;
    if (hole && from < 0) {
      from = index;
    }
    if (!hole && from >= 0) {
      pits.push(spanOf(from, index - 1));
      from = -1;
    }
  });
  if (from >= 0) {
    pits.push(spanOf(from, heights.length - 1));
  }
  return pits;
}

/** One run of ditch fields, turned into a pit. */
function spanOf(from: number, to: number): Pit {
  return {
    from: from * ROUTE_STEP - ROUTE_STEP / 2,
    to: to * ROUTE_STEP + ROUTE_STEP / 2,
  };
}

/** Reads the things lying about on the route. */
function itemsOf(marks: string, heights: readonly number[]): Item[] {
  const items: Item[] = [];
  [...marks].forEach((char, index) => {
    const kind = ITEM_MARKS[char];
    if (kind !== undefined && index < heights.length) {
      items.push({ at: index * ROUTE_STEP, kind });
    }
  });
  return items;
}

/** Reads where the bear stands, if the map has one. */
function bearOf(marks: string, heights: readonly number[]): number | null {
  const at = [...marks].findIndex(
    (char, index) => char === BEAR_MARK && index < heights.length,
  );
  return at < 0 ? null : at * ROUTE_STEP;
}

/** Reads the checkpoint marks. */
function checkpointsOf(ground: string, marks: string): number[] {
  const found: number[] = [];
  [...marks].forEach((char, index) => {
    if (char === CHECKPOINT_MARK && index < ground.length) {
      found.push(index * ROUTE_STEP);
    }
  });
  return found;
}
