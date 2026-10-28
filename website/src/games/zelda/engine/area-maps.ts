/**
 * The indoor areas as rows of tile letters - the moss temple, the two
 * village houses and the tiny root world. Generated together with
 * `assets/dungeon.png`, `assets/interior.png` and `assets/mini.png`.
 *
 * @module
 * @remarks
 * One letter per 16 x 16 tile. What each letter means is listed in
 * {@link ./tiles}. Change the generator, not these rows.
 */

/** The moss temple: four by three rooms of one screen each. */
export const DUNGEON_ROWS: readonly string[] = [
  "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW000000000000000000000000000000",
  "W.............WW.............W000000000000000000000000000000",
  "W......C......WW.I....C....I.W000000000000000000000000000000",
  "W.............WW.............W000000000000000000000000000000",
  "W.i....I....i.WW.............W000000000000000000000000000000",
  "W.............WW.............W000000000000000000000000000000",
  "W.............WW.............W000000000000000000000000000000",
  "W.S...........WW.............W000000000000000000000000000000",
  "W.............WW.............W000000000000000000000000000000",
  "WWWWWWW.WWWWWWWWWWWWWWZWWWWWWW000000000000000000000000000000",
  "WWWWWWWZWWWWWWWWWWWWWWKWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
  "W.............WW.............WW.............WW.............W",
  "W.S...y.......WW.y..S......y.WW..y.......y..WW......y......W",
  "W.....y...v...WW.............WW.............WW.............W",
  "W............................LZ.............LL..........C..W",
  "W...........y................LZ.............LL.............W",
  "W..B..........WW.............WW.............WW.............W",
  "W.............WW.y.........y.WW..y.......y..WW......y......W",
  "W.............WW.............WW.............WW.............W",
  "WWWWWWWWWWWWWWWWWWWWWW.WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
  "WWWWWWWWWWWWWWWWWWWWWW.WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
  "W.............WW.............WW.............WW.............W",
  "W..C.......y..WW........S....WW.............WW.............W",
  "W.............WW..y.......y..WW.............WW....C...C....W",
  "W.......................................C...XX.............W",
  "W...........................................XX.............W",
  "W.............WW.............WW.............WW.............W",
  "W..........y..WW.............WW..y..........WW.y.........y.W",
  "W.............WW.............WW.............WW.............W",
  "WWWWWWWWWWWWWWWWWWWWWWEWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
];

/** The elder's house (left) and the shop (right). */
export const HOUSE_ROWS: readonly string[] = [
  "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
  "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
  "W.a.......aaa.WW.aa.......aa.W",
  "W.a...........WW.............W",
  "W.............WW..uuuuuuuuu..W",
  "W.....aa......WW.............W",
  "W.............WW.............W",
  "W...........a.WW.a.........a.W",
  "W.............WW.............W",
  "WWWWWWWEWWWWWWWWWWWWWWEWWWWWWW",
];

/** The root world under the meadow, seen as small as a beetle. */
export const MINI_ROWS: readonly string[] = [
  "YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY",
  "Y...Y........Y.......Y.......Y",
  "Y...Y........Y.....JJY.......Y",
  "Y...Y.JJ.....Y.....JJY......nY",
  "Y...Y.JJ.Y...Y.......Y.......Y",
  "Y...Y....Y...Y...Y...Y.......Y",
  "Y...Y....Y...Y...Y...Y...Y...Y",
  "Y...Y....Y.......Y...Y...Y...Y",
  "Y........Y.JJ....Y...Y...Y...Y",
  "Yn....VV.Y.JJ....Y...Y...Y...Y",
  "Y.....VV.Y.....C.Y.......Y...Y",
  "Y........Y...Y...Y.....JJY...Y",
  "Y...Y....Y...Y...Y.....JJY...Y",
  "Y...Y....Y...Y...Y...Y...Y...Y",
  "Y...Y....Y...Y...Y...Y...Y...Y",
  "Y...Y.JJ.Y...Y.JJ....Y...Y.JJY",
  "Y...Y.JJ.....Y.JJ..VVY...Y.JJY",
  "Y...Y........Y.....V.Y.....C.Y",
  "Y...Y........Y.......Y.......Y",
  "YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY",
];
