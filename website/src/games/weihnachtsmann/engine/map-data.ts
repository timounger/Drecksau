/**
 * The outdoor map: Santa's glass dome workshop, the painted fir the sleigh
 * starts from, Grantelbart's crooked house, the frozen pond and the reindeer
 * pen and the cinema, with forest all round - east and south of them the
 * Advent path with its 26 gates, the five buildings of the village, and
 * beyond the forest belt the east land with the Christmas market, the
 * sledding slope, the snowball meadow, the frozen waterfall, the lake and the
 * fir plantation (`east-data.ts`) - and south of the old map's forest the
 * south land with the ice hockey rink, the snow castle, the balloon field,
 * the cable car and its mountain (`places-data.ts`).
 *
 * @module
 * @remarks
 * Kept apart from everything else so the map can change without touching the
 * engine: swap the rows, the objects, the doors and the start places. The two
 * houses one can enter are in `interior-data.ts`. The rows are read by
 * `map.ts`; every row must be equally long.
 *
 * | Letter | Meaning                                  |
 * | ------ | ---------------------------------------- |
 * | `.`    | snow                                     |
 * | `:`    | trodden path, cleared snow               |
 * | `~`    | ice (walkable, slippery)                 |
 * | `w`    | open water in the ice (blocks walkers)   |
 * | `T`    | fir tree, `t` small fir                  |
 * | `#`    | fence (joins its fence neighbours)       |
 * | `o`    | rock, `d` snow drift                     |
 * | `s`    | snowman, `l` lamp post, `g` presents     |
 * | `b`    | dead bush, `x` crooked sign              |
 * | `f`    | slalom flag, `p` pole of a light string   |
 * | `_`    | floor of a room, `X` its wall            |
 *
 * Buildings, furniture, the sleigh and the painted fir are bigger than a cell
 * and listed in {@link OUTDOORS}`.objects` by the top left cell of their
 * footprint; the cells under them should be plain snow (or path under the
 * painted fir, which is flat and blocks nothing). The Advent gates are listed
 * in {@link OUTDOORS}`.gates` the same way: three snow cells for the gate, a
 * free cell below the middle one as the doorway, and room above for the
 * picture.
 */
import { EAST_DOORS, EAST_OBJECTS, EAST_SPOTS } from "./east-data";
import { EXTRA_OBJECTS, EXTRA_SPOTS } from "./extras-data";
import { PLACE_OBJECTS, PLACE_SPOTS } from "./places-data";
import type { AreaData, AreaId, CellBox, CharacterId, Door } from "./types";

/* eslint-disable @typescript-eslint/no-magic-numbers -- places on the map */
/**
 * The door of a village building: stand in it and push up to go in.
 *
 * @param tx - its left cell
 * @param ty - its row, just below the building
 * @param w - how many cells wide
 * @param to - the building
 * @param toX - where the feet arrive inside, cells
 * @param toY - where the feet arrive inside, cells
 * @returns the door
 */
function villageDoor(
  tx: number,
  ty: number,
  w: number,
  to: AreaId,
  toX: number,
  toY: number,
): Door {
  return { tx, ty, w, h: 1, dir: "up", to, toX, toY, toDir: "up" };
}

/** The snowy map outside. */
export const OUTDOORS: AreaData = {
  rows: [
    "TTTTTTTTTTTTTtTTTtTTtTtTTTTtTTTTTTTTTTTTTTtTTTTttTtTTtTTTTtTtTTTTTTtTtttttTTTTTTTtTtTTtTTTTtTTTTtTTttTTTTtTtTTTTttttTTTTTTtTTTTT",
    "tTTt.TttTTTTtTtTttTt.TTTTTtTTttTTTTTTTT.TTTtTTTTtTTt.TTTTt.tTtTtTTTtT.TTtTtTTTTTtTtT.TtTTTTTTTtTTtTTtTTTTTTTtTTTTTtTTTttTTTTtTTt",
    "ttT.TT.......TT......T....tt.....Tt.t....T.......TT.Tt.....TT.tT.TTT.T.......t..t.TT.TTTTT..TtT......tt..t..TTtTT..tt....T...TTT",
    "TT.......................................................TT.......t..................TTT....................................TttT",
    "tT.......................T................d.................................................................................tttt",
    "Tt......................t....t.........................d..............................TT....................................TtTT",
    "TT.......................t.t..............................T...........................TT...............:::::::::::::::::::..TtTT",
    "T..........................tTT........................................................TT...............:::::::::::::::::::..tTTT",
    "TTT.......................T..t..::....::.#................tT............::............TT...............p::::::::p::::::::p..TTtT",
    "tT.................:::o...T..T..::....::.#b...............t.::::::::::::::::::::::::.TTT...............:::::::::::::::::::...TTT",
    "T..................::...........::T...::..............::::::::::::::::::::::::::::::.TTT...............:::::::::::::::::::..TTTT",
    "TT..........::.....::....t......::.T.T::.#............:::::::...l....l..::....l.......TT...............:::::::::::::::::::..tTTt",
    "Tt...t....g.::lg...::.t.........::tT.t::.#....:..........b..............::............TT...............:::::::::::::::::::..tTTt",
    "tTT.........::.....::..T........::....::.#.b..:.....b.....TT..........s.::...........tTt...............:::::::::::::::::::..TtTt",
    "ttT.........::....s::...........::....::.####.::.###.##.................::............TT...............:::::::::::::::::::..tTTT",
    "TT.......d..::.....::...........::....::......::......o...T.............::...........TTT...............p::::::::p::::::::p..TTTT",
    "tT..........::.....::...........::.o..::.....::.x........T.T............::.............T..................::.................TTT",
    "TtT........l::.....::l..........::...l::.....::.....l.....TT............::................................::................Tttt",
    "tT..::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::...Ttt",
    "TT..::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::...Ttt",
    "tT.................::.......l::l..........::.l...........T.t....l....l..::....l...l..........................................tTT",
    "TT......s..........::...l.::::::::.l...o..::......o........T........o...::............Tt.....................................TTT",
    "TT..............o..::....::::::::::.......::........T...t...............::............TT.###.................................TTT",
    "T.T................::....::::::::::.......::.......T.tT.tTT......TT.....::...T.......TTt.#.#................................TTTT",
    "TTT.....~~~~~~~....::....::::::::::...####..#####.....T...T.............::.............T.###.................................TTt",
    "TT....~~~~~~~~~~~..::....::::::::::...#.........#...t...................::............Tt..............#.....#................TTT",
    "TTt..~~~~~~~~~~~~~.......::::::::::...#.......d.#.........t.............::...........tTt..............#.....#.....s.....s...tTTT",
    "TT..~~~~~wwwww~~~~~......::::::::::...#..g......#.......................::.............t..............#.....#...............TttT",
    "TTT.~~~~~wwwww~~~~~......::::::::::...#.........#.......................::...........TTT..............#.....#...............TTTT",
    "TT..~~~~~wwwww~~~~~......::::::::::...#......s..#......s.t..::::::::::::::::::::::::..TT..............#.f...#..............TTTTT",
    "TtT..~~~~~~~~~~~~~...d...::::::::::...#.g.......#........t..::::::::::::::::::::::::.TTT..............#.....#..............TT.TT",
    "TT....~~~~~~~~~~~.........::::::::....###########..t.t.....T....l....l..::....l.......TT..............#.....#..............TTTTT",
    "TtT.....~~~~~~~..............::......t............t..T...T..............::...........TtT..............#...f.#................tTt",
    "TT.................tT........::.t....T....................t.............::...........TTt...........T..#.....#...oo........o.tTTT",
    "t.T.................T.TT.....::.ttT............d...t.......T...g........::...s.......TTT..............#.....#..ooo........o.tTtt",
    "TtT...o......................::.t.T......................T.T............::...........tTt..............#.....#.............o.tTtT",
    "tt...........................:::::::::::::::.............t.......t......::....T.......TT..............#o....#...............TTTT",
    "TTT...t..T.....T.............::..T.T...TT.......T.........TT....T.T.....::.....T...T..TT..............#.....#...............TTTT",
    "tTt.Ttt.t.T....Tt...T.T.TTTTT::...TT.....Tt...TT...t.t.T..tt.....T......::.......t....tT..............#.....#...............TTTT",
    "TTt..T.....TT.T.TTt.TT.T.TT.T::tTTT...tTT.T.t.TT.t..TTT..TTT...t.T......::....T.tt....tT..............#..f..#.....~~~~~.....TTTT",
    "Ttt.........T...T............::...........T....T.............T....T.....::.....T......TT..............#.....#....~~~~~~~.....TTT",
    "TTt.........T..T.............::........................TT...............::...........tTt..............#.....#...~~~~~~~~~...TTTT",
    "tt..........T................::..............T...........T..............::...d........TT..t.t.t.t.t...#.....#..~~~~~~~~~~~..tTtT",
    "tT..........Tt...............::.........................................::.........TT.Tt..............#....f#..~~~~~~~~~~~...tTT",
    "TT.................g.........::.........................................::...........ttT..t.t.t.t.t...#.....#.~~~~~~~~~~~~~..tTT",
    "ttT..........................::.........................................::..........T.TT..............#.....#.~~~~~~~~~~~~~.tTtT",
    "t............................::.........................................::...........TTt..t.t.t.t.t...#.o...#.~~~~~...~~~~~..ttT",
    "tT..::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::..Tt..............#.....#.~~~~~.T.~~~~~..tTt",
    "t...::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::.TtT..t.t.t.t.t...#.....#.~~~~~...~~~~~.TTTT",
    "TT..::....l.........l......l.::.......l...........l...........l.......l.......l.......TT..............#...f.#.~~~~~~~~~~~~~.tTTT",
    "TT..::......g................::...............o........d..T..T......s................t.T..t.t.t.t.t...#.....#.~~~~~~~~~~~~~.tttt",
    "TTT.::........t.T............::........................T................T....Tt...g...TT..............#.....#..~~~~~~~~~~~...tTT",
    "ttt.::.......................::........................T...T..............T..........TTT..t.t.t.t.t...#f....#..~~~~~~~~~~~..tTTt",
    "T...::.......................::............................................T..t......Ttt..............#.....#...~~~~~~~~~...TtTT",
    "tT..::.......................::...........................TT.t..........t..T..........TT..t.t.t.t.t...#.....#....~~~~~~~.....TtT",
    "tt..::.......................::...........................T.T...........T............TTT..............#.....#.....~~~~~......TTT",
    "TT..::.......................::.............................T...............T.T......TTt.....................................TTT",
    "Tt..:::::::::::::::::::::::::::::::::::::::::::::::....................................T.............................ddd.....tTT",
    "ttt.:::::::::::::::::::::::::::::::::::::::::::::::...................................TT.............................d.d.....TtT",
    "tT.........l....l....l.....l..::....l.....l.....l.....................................Tt................::...........ddd.....TTT",
    "Tt............................::....................s................................TtT................::..................tttt",
    "tT....TTT.T.T.....tT.........T::T..TT...Ttt....TT....TT.tTtT.t..T.TtT......T...T..t..TTT................::...................TtT",
    "TTT.tTttTTT..T.TTtTTTT.tT.TTTT::TTtTtTtTTTT.T.tTtTT.TTTTtTtTTTtTT..tTTttttTTTTTTTTtTT.TtTTTtTTTTTTTT.Ttt::TTTTTtTTTTTTTtTtTTTTtT",
    "TTT.TTtTTTTTTTTtTTTTTTtTtTTttT::tTTTTTTTtTTTtTTTtTTTtTTTTTTTTtTTTTTTtTtttTTttTttTTtTTTTtTTTTTTTTTTTT.TTT::TTTTTTTtttTTTTTttTTTtT",
    "TT............................::........................................................................::..................tTtt",
    "TT............................::........................................................................::..................TTTT",
    "tT..::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::..................TTtt",
    "Tt..::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::..................TTTt",
    "TT.............::................::...............::.....................::.................................................tTTt",
    "TT.............::................::...............::.....................::...........................................T....TTtTT",
    "Ttt..##########::##########......::...............::....................................t.......................o.......T..TtttT",
    "tTT..#~~~~~~~~~~~~~~~~~~~~#......::.......s.......::................................t......................................TTtTT",
    "ttT..#~~~~~~~~~~~~~~~~~~~~#.T....::.........................................................................................TTTT",
    "tTt..#~~~~~~~~~~~~~~~~~~~~#......::...................................::::::::.............................................tttTT",
    "TT...#~~~~~~~~~~~~~~~~~~~~#......::...................................::::::::........T..................................T..TTTT",
    "tT...#~~~~~~~~~~~~~~~~~~~~#......::.........................................................................................TTtT",
    "TT...#~~~~~~~~~~~~~~~~~~~~#......::.........................................................................................TtTT",
    "Tt...#~~~~~~~~~~~~~~~~~~~~#..T...::................................s..............T.........................................tTtT",
    "tT...#~~~~~~~~~~~~~~~~~~~~#......:::::::::......................t..........................................................tTTtT",
    "Tt...#~~~~~~~~~~~~~~~~~~~~#......:::::::::..................................................................................TTtT",
    "TTT..#~~~~~~~~~~~~~~~~~~~~#................................................................................................tTTTT",
    "tT...######################.................................................................................................TTTT",
    "TT......................................................o..................................................................TtTTt",
    "Tt.........................................................................................................................tTttT",
    "TTT.....................o.......................................T..........................................................TttTT",
    "TT......T..............................o...................................................................................tTttT",
    "Ttt........t......................................................T.........................................................tTTt",
    "TT.......T..................................................................................................................TTTT",
    "TTT.................T.......................t...................................t...........................................TTtt",
    "TT....t.......................................................t.............................................................TTTT",
    "TT...........t................................T.......................o..............T.....................................TTTtT",
    "tT........T................................t................................................................................Tttt",
    "tT.........................................................................................................................TtTtT",
    "tT.TT.t.tTTT.T.T..T.T.....T.TT.t..TTt.tt.T.T..TTttTTT..T....TTT.....TtTt.TTtTT.TtT..T.T...tTT....tTt.t....TT.TTT.Ttt.TTTTTT.tTtT",
    "tTTtTtTTTTTTTTTTTTTTTTTTtTTTtTtTTTTTTTTTtTTTTTTTTTTTTTTTttTTTtTTTTTtTTTTTTTTTTTTTTTTTtTtTTTTtTTTTttTTTtTtttTtTTTTtTTTtTTTTTTTTTT",
    "TTTTTTTtTTTTTTTTTTTTTTTtTTTtTTTTTTTTTTTtTTTTTTTTTTTTttTTTTTTTTttttTTTtTttTTTTtTtTTTTTTTTTttTTTTTTtTTttTTTTtTTtTtttTTTTTTTTtTttTt",
  ],
  objects: [
    { kind: "dome", tx: 8, ty: 7 },
    { kind: "paintedTree", tx: 26, ty: 21 },
    { kind: "sleigh", tx: 29, ty: 25 },
    { kind: "grantelMain", tx: 44, ty: 8 },
    { kind: "grantelWing", tx: 49, ty: 8 },
    // The cinema north of the main road, a path leading up to its door.
    { kind: "cinema", tx: 30, ty: 5 },
    // The village: the bakery beside the workshop, the post office beside
    // the cinema, Gugor's observatory on its hill north of Grantelbart, the
    // reindeer stable below the pen and the gift store out east.
    { kind: "bakeryHouse", tx: 18, ty: 6 },
    { kind: "postHouse", tx: 36, ty: 5 },
    { kind: "observatory", tx: 53, ty: 6 },
    { kind: "stableHouse", tx: 40, ty: 33 },
    { kind: "storeHouse", tx: 92, ty: 14 },
    // The east land: market, slope, meadow, waterfall - and the mailbox.
    ...EAST_OBJECTS,
    // The south land, the lighthouse by the lake and the workshop station.
    ...PLACE_OBJECTS,
    // Part B: the stage, the magic school, the air mail board, the angel
    // field, the snowman contest, the gift tree and the photo posts.
    ...EXTRA_OBJECTS,
  ],
  doors: [
    // Into the glass dome, up through its door.
    {
      tx: 12,
      ty: 11,
      w: 2,
      h: 1,
      dir: "up",
      to: "workshop",
      toX: 12,
      toY: 13.6,
      toDir: "up",
    },
    // Into Grantelbart's house.
    {
      tx: 46,
      ty: 12,
      w: 1,
      h: 1,
      dir: "up",
      to: "grantelHouse",
      toX: 10,
      toY: 11.4,
      toDir: "up",
    },
    villageDoor(20, 9, 2, "bakery", 10, 11.4),
    villageDoor(38, 8, 1, "postOffice", 10, 11.4),
    villageDoor(54, 10, 2, "observatory", 9, 11.4),
    villageDoor(42, 36, 2, "stable", 10, 11.4),
    villageDoor(95, 18, 2, "giftStore", 14, 16.4),
    ...EAST_DOORS,
  ],
  spots: [
    { kind: "sleigh", tx: 29, ty: 25, w: 2, h: 1 },
    // The cinema's front round its door: the talk key goes in as well.
    { kind: "cinema", tx: 31, ty: 7, w: 4, h: 1 },
    ...EAST_SPOTS,
    ...PLACE_SPOTS,
    ...EXTRA_SPOTS,
  ],
  // The Advent path east and south of the old map: 1-4 on the main road,
  // 5-8 on the north street, 9-12 on the east street, 13-19 along the south
  // street and 20-26 along the far south street.
  gates: [
    { number: 1, style: "arch", tx: 61, ty: 17 },
    { number: 2, style: "hut", tx: 66, ty: 17 },
    { number: 3, style: "giftBox", tx: 75, ty: 17 },
    { number: 4, style: "snowWall", tx: 80, ty: 17 },
    { number: 5, style: "hut", tx: 61, ty: 8 },
    { number: 6, style: "snowWall", tx: 66, ty: 8 },
    { number: 7, style: "arch", tx: 75, ty: 8 },
    { number: 8, style: "giftBox", tx: 80, ty: 8 },
    { number: 9, style: "giftBox", tx: 61, ty: 28 },
    { number: 10, style: "arch", tx: 66, ty: 28 },
    { number: 11, style: "snowWall", tx: 75, ty: 28 },
    { number: 12, style: "hut", tx: 80, ty: 28 },
    { number: 13, style: "arch", tx: 65, ty: 46 },
    { number: 14, style: "hut", tx: 59, ty: 46 },
    { number: 15, style: "giftBox", tx: 53, ty: 46 },
    { number: 16, style: "snowWall", tx: 47, ty: 46 },
    { number: 17, style: "hut", tx: 41, ty: 46 },
    { number: 18, style: "arch", tx: 35, ty: 46 },
    { number: 19, style: "giftBox", tx: 24, ty: 46 },
    { number: 20, style: "snowWall", tx: 8, ty: 56 },
    { number: 21, style: "giftBox", tx: 13, ty: 56 },
    { number: 22, style: "hut", tx: 18, ty: 56 },
    { number: 23, style: "arch", tx: 23, ty: 56 },
    { number: 24, style: "snowWall", tx: 33, ty: 56 },
    { number: 25, style: "hut", tx: 38, ty: 56 },
    { number: 26, style: "arch", tx: 44, ty: 56 },
  ],
  shade: null,
};

/**
 * Where everybody stands on a new game: the place and the cell (fractions
 * allowed); the feet go to that point.
 */
export const MAP_STARTS: Readonly<
  Record<CharacterId, readonly [AreaId, number, number]>
> = {
  santa: ["outdoors", 13, 13.5],
  balbo: ["outdoors", 21.5, 27],
  jordi: ["outdoors", 16, 15.5],
  trixi: ["outdoors", 27, 17],
  gilfi: ["workshop", 7, 10.5],
  grantelbart: ["outdoors", 47.5, 16.5],
  gugor: ["grantelHouse", 5, 9.5],
  rudolf: ["outdoors", 32.5, 26.5],
};

/**
 * The doorway of the cinema: the two cells below the middle of its front.
 * Stand in it and push up to go in.
 */
export const CINEMA_DOOR: CellBox = { tx: 32, ty: 8, w: 2, h: 1 };

/**
 * The cell where something golden lies buried, east of the crooked sign:
 * only Jordi as a fox smells it and can dig it up.
 */
export const SECRET_SPOT: readonly [number, number] = [56, 16];
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** Who the player steers on a new game. */
export const FIRST_CHARACTER: CharacterId = "santa";
