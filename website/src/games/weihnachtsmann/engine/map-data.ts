/**
 * The outdoor map: Santa's glass dome workshop, the painted fir the sleigh
 * starts from, Grantelbart's crooked house, the frozen pond and the reindeer
 * pen, with forest all round - and east and south of them the Advent path
 * with its 26 gates.
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
import type { AreaData, AreaId, CharacterId } from "./types";

/* eslint-disable @typescript-eslint/no-magic-numbers -- places on the map */
/** The snowy map outside. */
export const OUTDOORS: AreaData = {
  rows: [
    "TTTTTTTTTTTTTtTTTtTTtTtTTTTtTTTTTTTTTTTTTTtTTTTttTtTTtTTTTtTtTTTTTTtTtttttTTTTTTTtTtTTtT",
    "tTTt.TttTTTTtTtTttTt.TTTTTtTTttTTTTTTTT.TTTtTTTTtTTt.TTTTt.tTtTtTTTtT.TTtTtTTTTTtTtT.TtT",
    "ttT.TT.......TT......T....tt.....Tt.t....T.......TT.Tt.....TT.tT.TTT.T.......t..t.TT.TTT",
    "TT.......................................................TT.......t..................TTT",
    "tT.......................T.....d.......................................................T",
    "Tt......................t....t.........................d..............................TT",
    "TT.......................t.t..............................T...........................TT",
    "T..........................tTT........................................................TT",
    "TTT.......................T..t...........#................tT............::............TT",
    "tT....................o...T..T........T..#b...............t.::::::::::::::::::::::::.TTT",
    "T.................................T...................b..TT.::::::::::::::::::::::::.TTT",
    "TT..........::...........t.........T.T...#......................l....l..::....l.......TT",
    "Tt.t.t....g.::lg......t...........tT.t...#....:.........................::............TT",
    "tTT.........::.........T.................#.b..:.....b.....TT..........s.::...........tTt",
    "ttT.........::....s......................####.::.###.##.................::............TT",
    "TT.......d..::................................::......o...T.............::...........TTT",
    "tT..........::...................o...........::.x........T.T............::.............T",
    "TtT........l::.......l...............l.......::.....l.....TT............::............Tt",
    "tT..::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::.T.T",
    "TT..::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::.TTT",
    "tT.................::.......l::l..........::.l...........T.t....l....l..::....l...l...Tt",
    "TT......s..........::...l.::::::::.l...o..::......o........T........o...::............Tt",
    "TT..............o..::....::::::::::.......::........T...t...............::............TT",
    "T.T................::....::::::::::.......::.......T.tT.tTT......TT.....::...T.......TTt",
    "TTT.....~~~~~~~....::....::::::::::...####..#####.....T...T.............::.............T",
    "TT....~~~~~~~~~~~..::....::::::::::...#.........#...t...................::............Tt",
    "TTt..~~~~~~~~~~~~~.......::::::::::...#.......d.#.........t.............::...........tTt",
    "TT..~~~~~wwwww~~~~~......::::::::::...#..g......#.......................::.............t",
    "TTT.~~~~~wwwww~~~~~......::::::::::...#.........#.......................::...........TTT",
    "TT..~~~~~wwwww~~~~~......::::::::::...#......s..#......s.t..::::::::::::::::::::::::..TT",
    "TtT..~~~~~~~~~~~~~...d...::::::::::...#.g.......#........t..::::::::::::::::::::::::.TTT",
    "TT....~~~~~~~~~~~.........::::::::....###########..t.t.....T....l....l..::....l.......TT",
    "TtT.....~~~~~~~..............::......t............t..T...T..............::...........TtT",
    "TT.................tT........::.t....T....................t.............::...........TTt",
    "t.T.................T.TT.....::.ttT............d...t.......T...g........::...s.......TTT",
    "TtT...o......................::.t.T......................T.T............::...........tTt",
    "tt...........................::..........................t.......t......::....T.......TT",
    "TTTt..t..T.....T.............::..T.T...TT.......T.........TT....T.T.....::.....T...T..TT",
    "tTt.Ttt.t.T....Tt...T.T.TTTTT::...TT.....Tt...TT...t.t.T..tt.....T......::.......t....tT",
    "TTtt.T.....TT.T.TTt.TT.T.TT.T::tTTT...tTT.T.t.TT.t..TTT..TTT...t.T......::....T.tt....tT",
    "Ttt.........T...T............::...........T....T.............T....T.....::.....T......TT",
    "TTt.........T..T.............::........................TT...............::...........tTt",
    "tt..........T................::..............T...........T..............::...d........TT",
    "tT..........Tt...............::.........................................::.........TT.Tt",
    "TT.................g.........::.........................................::...........ttT",
    "ttT..........................::.........................................::..........T.TT",
    "t............................::.........................................::...........TTt",
    "tT..::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::..Tt",
    "t...::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::.TtT",
    "TT..::....l.........l......l.::.......l...........l...........l.......l.......l.......TT",
    "TT..::......g................::...............o........d..T..T......s................t.T",
    "TTT.::........t.T............::........................T................T....Tt...g...TT",
    "ttt.::.......................::........................T...T..............T..........TTT",
    "T...::.......................::............................................T..t......Ttt",
    "tT..::.......................::...........................TT.t..........t..T..........TT",
    "tt..::.......................::...........................T.T...........T............TTT",
    "TT..::.......................::.............................T...............T.T......TTt",
    "Tt..:::::::::::::::::::::::::::::::::::::::::::::::....................................T",
    "ttt.:::::::::::::::::::::::::::::::::::::::::::::::...................................TT",
    "tT.........l....l....l.....l........l.....l.....l.....................................Tt",
    "Tt..................................................s................................TtT",
    "tT....TTT.T.T.....tT.........T..T..TT...Ttt....TT....TT.tTtT.t..T.TtT......T...T..t..TTT",
    "TTT.tTttTTT..T.TTtTTTT.tT.TTTTTTTTtTtTtTTTT.T.tTtTT.TTTTtTtTTTtTT..tTTttttTTTTTTTTtTT.Tt",
    "TTTtTTtTTTTTTTTtTTTTTTtTtTTttTTttTTTTTTTtTTTtTTTtTTTtTTTTTTTTtTTTTTTtTtttTTttTttTTtTTTTt",
  ],
  objects: [
    { kind: "dome", tx: 8, ty: 7 },
    { kind: "paintedTree", tx: 26, ty: 21 },
    { kind: "sleigh", tx: 29, ty: 25 },
    { kind: "grantelMain", tx: 44, ty: 8 },
    { kind: "grantelWing", tx: 49, ty: 8 },
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
  ],
  spots: [{ kind: "sleigh", tx: 29, ty: 25, w: 2, h: 1 }],
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
 * The cell where something golden lies buried, east of the crooked sign:
 * only Jordi as a fox smells it and can dig it up.
 */
export const SECRET_SPOT: readonly [number, number] = [56, 16];
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** Who the player steers on a new game. */
export const FIRST_CHARACTER: CharacterId = "santa";
