/**
 * The hand-drawn levels, as ASCII maps of the playable interior.
 *
 * @module
 * @remarks
 * Each map is the {@link ./setup FIELD_COLS} x {@link ./setup FIELD_ROWS}
 * interior only - the solid wall ring around it is added by {@link ./setup}, so
 * a map never draws its own border and every field is the same fixed size. `#`
 * is a wall, `x` a destructible wall, `o` a hole (stops tanks, not shells), `.`
 * empty floor, `P` the player's start, and `B`/`G`/`T` the brown, grey and teal
 * enemy tanks.
 *
 * The full map format (characters, size, rules, a blank template) is documented
 * in `docs/games/panzerkiste/levels.md`.
 */

/** The character each cell can hold in a level map. */
export type Cell = "#" | "x" | "o" | "." | "P" | "B" | "G" | "T";

/** One level: rows of equal length, the interior only (no border). */
export type LevelMap = readonly string[];

/** All levels, in the order they are played. */
export const LEVELS: readonly LevelMap[] = [
  // Level 1 - the player on the left, one brown turret on the right, split by
  // two wall columns. The right column's middle is a destructible crate ('x'):
  // blast it open with a mine to clear a lane to the enemy, or drive around.
  // The field is 22x17; this level only uses the top part, so the rest below is
  // filled solid with walls.
  [
    "......................",
    "......................",
    "......................",
    ".....#.....#..........",
    ".....#.....#..........",
    "...........x..........",
    "..P........x......B...",
    ".....#.....#..........",
    ".....#.....#..........",
    "......................",
    "......................",
    "......................",
    "######################",
    "######################",
    "######################",
    "######################",
    "######################",
  ],
  // Level 2 - the player starts bottom-left, a roaming grey tank top-right. Two
  // staggered barriers cross the field; each is half solid wall, half
  // destructible crates ('x'), so a mine can open a shortcut through either one.
  [
    "......................",
    "......................",
    "......................",
    "...................G..",
    "......................",
    "......................",
    ".....########xxxx.....",
    "......................",
    "......................",
    "......................",
    "......................",
    "......xxxx########....",
    "......................",
    "..P...................",
    "......................",
    "......................",
    "......................",
  ],
  // Level 3 - two roaming grey tanks (top-left and bottom-right) and one
  // stationary brown turret on the right, walled off from the player by a big
  // central barrier. Its top and bottom arms are part crate ('x'), so mines can
  // punch through; otherwise fight around the long walls.
  [
    "......................",
    ".....G................",
    "......................",
    "...##xxxxxx#..........",
    "...........#..........",
    "...........#..........",
    "...........#..........",
    "...........#..........",
    "..P.......##.......B..",
    "..........#...........",
    "..........#...........",
    "..........#...........",
    "..........#...........",
    "..........#xxxxxx##...",
    "......................",
    "..................G...",
    "......................",
  ],
  // Level 4 - a grid of holes ('o') carves the field into rooms joined by narrow
  // gaps. Holes stop tanks but not shells, so you can fire across a pit you can
  // never drive over. Four enemies (two brown, two grey) sit in separate rooms.
  [
    ".......o......o.......",
    ".......o......o.......",
    ".......o..B...o...G...",
    ".......o......o.......",
    ".......o......o.......",
    "oooooo.o.ooooooooooooo",
    ".......o..............",
    ".......o......o.......",
    ".......o..G...o...B...",
    ".......o......o.......",
    "..............o.......",
    "ooooooooooooo.o.oooooo",
    "..............o.......",
    ".......o......o.......",
    "...P...o......o.......",
    ".......o......o.......",
    ".......o......o.......",
  ],
];
