/**
 * The map: one long way from the valley to the flag, cut into sections.
 *
 * @module
 * @remarks
 * One route, not a handful, and no separate idea of a checkpoint beside it: a
 * `C` in the marks line **begins a section**, and reaching one means the
 * section before it is done. That is the moment the progress is saved, and it
 * is what the two buttons over the field step through.
 *
 * The map is drawn as two lines of text, one above the other, exactly as the
 * levels of Panzerkiste are drawn as maps. The upper line is the ground, one
 * character every {@link ROUTE_STEP} metres: `0` is the valley floor and every
 * further digit (then `A` onwards) is {@link HEIGHT_UNIT} metres higher. The
 * lower line marks what stands there:
 *
 * - `T` a tree or rock the rope can be hooked to
 * - `C` the start of a section - and the save point for the one before it
 * - `X` a field of ditch: drive in here and the motorhome is wrecked
 * - `K` a jerrycan, `H` the hammer, `R` the off-road tyres, `S` the bear spray
 * - `N` fog: the first one closes the view in, the second one opens it again
 * - `B` the bear
 * - `P` a field of bridge - old timber over a gap, with its warning sign at
 *   the near end
 * - `A` the chasm: no road at all, and no bottom either
 * - `L` the tree that can be felled across it, `Z` the axe that fells it
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
 * give up, or the map is a dead end. Section marks belong on **level** ground,
 * or whoever starts there begins by sliding backwards.
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

/** The character that marks a section on the lower line. */
const SECTION_MARK = "C";

/** The character that marks a field of ditch - ground that wrecks a vehicle. */
const PIT_MARK = "X";

/** What each mark of a thing lying about stands for. */
const ITEM_MARKS: Readonly<Record<string, ItemKind>> = {
  K: "can",
  H: "hammer",
  R: "tyres",
  S: "spray",
  Z: "axe",
};

/**
 * The character that marks the fog.
 *
 * @remarks
 * Twice: the first closes the view in, the second opens it again. It used to
 * run from one mark to the end of the map, which was fine while the fog was
 * the last thing on it - and stopped being fine the moment a bridge came
 * after it, because a bridge nobody can see is a coin toss and not a test.
 */
const FOG_MARK = "N";

/** The character that marks a field of bridge. */
const BRIDGE_MARK = "P";

/** The character that marks the chasm, and the tree felled across it. */
const CHASM_MARK = "A";
const FELL_MARK = "L";

/**
 * How wide a marked chasm is, in metres.
 *
 * @remarks
 * Narrower than a field, and measured rather than chosen. A leap carries about
 * five and a third metres either way, but one made from the road has to start
 * {@link CHASM_STOP} back from the lip and one made from the roof does not -
 * so the gap has to sit between what is left of the first and the whole of
 * the second, or the roof is decoration. Halfway between them leaves about a
 * metre and a half of slack either way: comfortably too far from below,
 * comfortably inside it from above, and room to park roughly rather than to
 * the centimetre.
 */
const CHASM_HALF = 1.95;

/** The character that marks where the bear stands. */
const BEAR_MARK = "B";

/** The digits and letters the ground line is written in. */
const HEIGHT_SCALE = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** The ground, one character every {@link ROUTE_STEP} metres. */
const GROUND =
  "CCCCCCCCCCBA98765432111111123456789ABCDEFGHIJJJJJJJIHGFEDCBA" +
  "988888000888888888887654321111113579999999876543210000002468" +
  "AAAAAAA98765432222222222222222222211000001234543210123456543" +
  "210123432111111111111111111111111111111111111111111111111111" +
  "1111111111111111111111111111111100000000";

/** What stands on it: trees, sections, ditches and the things lying about. */
const MARKS =
  "  C   K                                        C            " +
  "      XXX T       H         C        T             C R      " +
  "                C S     B           NC                      " +
  "         N  C            PPPPPP         C           ALZ     " +
  "                                        ";

/** The whole map, ready to drive. */
export const MAP: Route = parseMap(GROUND, MARKS);

/** Where the sections stand, in metres, from the start to the last one. */
export const SECTIONS: readonly number[] = MAP.sections;

/** How many sections the map has. */
export const SECTION_COUNT = SECTIONS.length;

/**
 * The section a place on the map belongs to.
 *
 * @param x - how far along the map, in metres
 * @returns the index of the last section at or before it
 */
export function sectionAt(x: number): number {
  let found = 0;
  SECTIONS.forEach((at, index) => {
    if (x >= at) {
      found = index;
    }
  });
  return found;
}

/**
 * The section one step away, wrapping around at both ends.
 *
 * @param from - the section standing at now
 * @param step - -1 for the one before, 1 for the one after
 * @returns the index to go to
 * @remarks
 * Wrapping is deliberate: from the first one, "back" is the shortest way to the
 * far end of the map, and from the last one, "on" is the way home.
 */
export function sectionStep(from: number, step: number): number {
  return (from + step + SECTION_COUNT) % SECTION_COUNT;
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
    fog: fogOf(marks, heights),
    bridges: runsOf(marks, heights, BRIDGE_MARK),
    chasms: runsOf(marks, heights, CHASM_MARK, CHASM_HALF),
    fellTree: markAt(marks, heights, FELL_MARK),
    sections: sectionsOf(ground, marks),
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
  return runsOf(marks, heights, PIT_MARK);
}

/**
 * Every run of one mark, turned into a stretch of route.
 *
 * @param marks - the marks line
 * @param heights - the ground, for the length of the route
 * @param mark - the character to look for
 * @returns the stretches, left to right
 * @remarks
 * Half a field of slack at each end, so the lip counts as the hole and the
 * first plank counts as the bridge: a motorhome with its nose over the edge is
 * already on its way in, whichever kind of edge it is.
 */
function runsOf(
  marks: string,
  heights: readonly number[],
  mark: string,
  half = ROUTE_STEP / 2,
): Pit[] {
  const pits: Pit[] = [];
  let from = -1;
  [...marks].forEach((char, index) => {
    const hole = char === mark && index < heights.length;
    if (hole && from < 0) {
      from = index;
    }
    if (!hole && from >= 0) {
      pits.push(spanOf(from, index - 1, half));
      from = -1;
    }
  });
  if (from >= 0) {
    pits.push(spanOf(from, heights.length - 1, half));
  }
  return pits;
}

/** One run of marked fields, turned into a stretch of route. */
function spanOf(from: number, to: number, half: number): Pit {
  return {
    from: from * ROUTE_STEP - half,
    to: to * ROUTE_STEP + half,
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

/**
 * Reads the stretch the fog lies over, if the map has any.
 *
 * @param marks - the marks line
 * @param heights - the ground, for the length of the route
 * @returns the foggy stretch, or null
 * @remarks
 * Two marks, and a single one means "from there to the end" - which is what
 * the older maps meant and what a map with a forgotten second mark most
 * likely means as well.
 */
function fogOf(marks: string, heights: readonly number[]): Pit | null {
  const at = [...marks]
    .map((char, index) => (char === FOG_MARK ? index : -1))
    .filter((index) => index >= 0 && index < heights.length);
  if (at.length === 0) {
    return null;
  }
  const last = at.length > 1 ? at[at.length - 1] : heights.length - 1;
  return { from: at[0] * ROUTE_STEP, to: last * ROUTE_STEP };
}

/** Reads where the bear stands, if the map has one. */
function bearOf(marks: string, heights: readonly number[]): number | null {
  return markAt(marks, heights, BEAR_MARK);
}

/**
 * Where the first of a mark stands, if the map has one at all.
 *
 * @param marks - the marks line
 * @param heights - the ground, for the length of the route
 * @param mark - the character to look for
 * @returns the metre it stands at, or null
 */
function markAt(
  marks: string,
  heights: readonly number[],
  mark: string,
): number | null {
  const at = [...marks].findIndex(
    (char, index) => char === mark && index < heights.length,
  );
  return at < 0 ? null : at * ROUTE_STEP;
}

/** Reads the section marks. */
function sectionsOf(ground: string, marks: string): number[] {
  const found: number[] = [];
  [...marks].forEach((char, index) => {
    if (char === SECTION_MARK && index < ground.length) {
      found.push(index * ROUTE_STEP);
    }
  });
  return found;
}
