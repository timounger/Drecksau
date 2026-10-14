/**
 * The Treasure Hunt: a pirate island with woods, a beach, a cavern, cabins, a
 * tavern, a dock and six ships, 23 pirates - and a treasure buried somewhere.
 *
 * @module
 * @remarks
 * After the first contest case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Schatzsuche/murdoku-contest1-treasurehunt-EN.pdf`,
 * no solution sheet - the solution is the solver's only one). There is no
 * crime: the answer is where the treasure lies. It is the 24th piece and takes
 * the very last row and column left; it may lie beneath a thing nobody can
 * stand on (`buried`), and in the solution it does.
 *
 * The three sloops, two frigates and the galleon are ships, each an area of
 * its own. "Beside a ship" (Nehemiah) therefore reaches over the area border:
 * a water field next to a ship field. Every other "beside" stays within the
 * area. "In front of a door" are the two fields either side of a door drawn
 * on a wall; they carry a door marker. Hats (Augustus, Dudley, Julius,
 * Mortimer, Ursula) and eyepatches (Griselda, Pedro, Ursula) come from the
 * portraits. "The top row of her area" is the topmost row any field of the
 * area lies in.
 */
import {
  about,
  all,
  beside,
  cellsWhere,
  counting,
  inArea,
  not,
  on,
  own,
} from "../engine/clues";
import { contextOf, isStandableFor } from "../engine/rules";
import type { Cell, Context, Hint, Level } from "../engine/types";

/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */

/** The side length of the square map. */
const SIZE = 24;

/** The areas that are ships: three sloops, two frigates, the galleon. */
const SHIPS: readonly string[] = ["x", "y", "z", "f", "g", "G"];

/** The sloops. */
const SLOOPS: readonly string[] = ["x", "y", "z"];

/** The cabins. */
const CABINS: readonly string[] = ["A", "B", "C"];

/** The pirates wearing a hat, as the portraits show. */
const HATS: readonly string[] = ["A", "D", "J", "M", "U"];

/** The pirates wearing an eyepatch, as the portraits show. */
const EYEPATCHES: readonly string[] = ["G", "P", "U"];

/** The treasure. */
const TREASURE = "T";

/** How many rows north of Cedric the one beside the tombstone was. */
const ROWS_ABOVE_CEDRIC = 8;

/** How many rows north of Linus Seraphina was at least. */
const ROWS_ABOVE_LINUS = 6;

/** The four neighbours of a field, over area borders too. */
const STEPS: readonly Cell[] = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

/** Per piece the fields still open to it, as indexes row * SIZE + col. */
type Fields = Record<string, readonly number[]>;

/** Each piece's fields by its own clue alone, worked out once. */
const OWN_FIELDS = new Map<string, readonly number[]>();

/** A field as an index. */
function indexOf(cell: Cell): number {
  return cell.row * SIZE + cell.col;
}

/** The row of a field index. */
function rowAt(at: number): number {
  return Math.floor(at / SIZE);
}

/** The column of a field index. */
function colAt(at: number): number {
  return at % SIZE;
}

/** The row of somebody, or -1 while not placed. */
function rowOf(c: Context, id: string): number {
  return c.cellOf(id)?.row ?? -1;
}

/** The column of somebody, or -1 while not placed. */
function colOf(c: Context, id: string): number {
  return c.cellOf(id)?.col ?? -1;
}

/** The topmost row of an area. */
function topRow(c: Context, area: string): number {
  return Math.min(...c.cellsOf(area).map((cell) => cell.row));
}

/** The fields beside the tombstone, in its area. */
function besideTombstone(level: Level): readonly Cell[] {
  const c = contextOf(level, {}, TREASURE);
  return cellsWhere(level, (cell) => c.beside(cell, "tombstone"));
}

/** Whether a field has a ship field next to it, whatever area that is. */
function besideShip(c: Context, cell: Cell): boolean {
  return STEPS.some((step) => {
    const next = { row: cell.row + step.row, col: cell.col + step.col };
    return c.inside(next) && SHIPS.includes(c.areaOf(next) ?? "");
  });
}

/**
 * The fields a piece's own clue allows, cached.
 *
 * @param level - the case
 * @param id - the piece
 * @returns the fields, as indexes
 */
function ownFields(level: Level, id: string): readonly number[] {
  const known = OWN_FIELDS.get(id);
  const unary = level.suspects.find((one) => one.id === id)?.clue.unary;
  const fields =
    known ??
    cellsWhere(
      level,
      (cell) =>
        isStandableFor(level, id, cell) &&
        (unary === undefined || unary(contextOf(level, { [id]: cell }, id))),
    ).map(indexOf);
  OWN_FIELDS.set(id, fields);
  return fields;
}

/**
 * For the solver only: whether a partial placement can still be finished.
 *
 * @remarks
 * Narrows every piece's fields as one would by hand - a placed piece blocks
 * its row and column, a row or column only one piece can fill gets it, and
 * the clues linking two pieces trim each other's fields - until nothing
 * changes, then asks whether the rows and the columns can still be shared
 * out (a bipartite matching each).
 */
function stillPossible(c: Context): boolean {
  const fields: Fields = Object.fromEntries(
    c.level.suspects.map((one) => {
      const cell = c.cellOf(one.id);
      return [
        one.id,
        cell === undefined ? ownFields(c.level, one.id) : [indexOf(cell)],
      ];
    }),
  );
  let ok = true;
  let size = -1;
  while (ok && size !== sizeOf(fields)) {
    size = sizeOf(fields);
    ok = narrowed(c, fields);
  }
  return ok && sharable(fields, rowAt) && sharable(fields, colAt);
}

/** How many fields are open to all pieces together. */
function sizeOf(fields: Fields): number {
  return Object.values(fields).reduce((sum, one) => sum + one.length, 0);
}

/**
 * One round of narrowing, in place.
 *
 * @returns false when some piece or some row or column is left without a field
 */
function narrowed(c: Context, fields: Fields): boolean {
  blockLines(fields);
  const ok = fillLines(fields, rowAt) && fillLines(fields, colAt);
  if (ok) {
    trimLinks(c, fields);
  }
  return ok && Object.values(fields).every((one) => one.length > 0);
}

/** A piece with one field left blocks its row and column for the others. */
function blockLines(fields: Fields): void {
  for (const [id, own] of Object.entries(fields)) {
    const at = own.length === 1 ? own[0] : undefined;
    if (at !== undefined) {
      for (const other of Object.keys(fields)) {
        if (other !== id) {
          fields[other] = (fields[other] ?? []).filter(
            (one) => rowAt(one) !== rowAt(at) && colAt(one) !== colAt(at),
          );
        }
      }
    }
  }
}

/**
 * Every row (or column) holds a piece: one nobody can fill fails, one only a
 * single piece can fill gets that piece.
 */
function fillLines(fields: Fields, lineOf: (at: number) => number): boolean {
  const holders: string[][] = Array.from({ length: SIZE }, () => []);
  for (const [id, own] of Object.entries(fields)) {
    for (const line of new Set(own.map(lineOf))) {
      holders[line]?.push(id);
    }
  }
  holders.forEach((ids, line) => {
    const only = ids.length === 1 ? ids[0] : undefined;
    if (only !== undefined) {
      fields[only] = (fields[only] ?? []).filter((at) => lineOf(at) === line);
    }
  });
  return holders.every((ids) => ids.length > 0);
}

/** The clues that link two pieces trim each other's fields. */
function trimLinks(c: Context, fields: Fields): void {
  const keep = (id: string, test: (at: number) => boolean) => {
    fields[id] = (fields[id] ?? []).filter(test);
  };
  const cols = (id: string) => (fields[id] ?? []).map(colAt);
  const rows = (id: string) => (fields[id] ?? []).map(rowAt);
  // Dudley east of Griselda and west of Linus.
  keep("D", (at) => colAt(at) > Math.min(...cols("G")));
  keep("D", (at) => colAt(at) < Math.max(...cols("L")));
  keep("G", (at) => colAt(at) < Math.max(...cols("D")));
  keep("L", (at) => colAt(at) > Math.min(...cols("D")));
  // Seraphina at least six rows north of Linus.
  keep("S", (at) => rowAt(at) <= Math.max(...rows("L")) - ROWS_ABOVE_LINUS);
  keep("L", (at) => rowAt(at) >= Math.min(...rows("S")) + ROWS_ABOVE_LINUS);
  trimCedric(c, fields);
  trimHyacinth(fields);
  trimIsolde(c, fields);
}

/** Cedric: somebody beside the tombstone exactly eight rows north of him. */
function trimCedric(c: Context, fields: Fields): void {
  const spots = besideTombstone(c.level).map(indexOf);
  const holders = (row: number) =>
    Object.entries(fields)
      .filter(([id]) => id !== "C" && id !== TREASURE)
      .filter(([, own]) =>
        own.some(
          (at) => spots.includes(at) && rowAt(at) === row - ROWS_ABOVE_CEDRIC,
        ),
      )
      .map(([id]) => id);
  fields.C = (fields.C ?? []).filter((at) => holders(rowAt(at)).length > 0);
  const cedricRows = new Set((fields.C ?? []).map(rowAt));
  const [row] = [...cedricRows];
  const only =
    cedricRows.size === 1 && row !== undefined ? holders(row) : undefined;
  const one = only?.length === 1 ? only[0] : undefined;
  if (one !== undefined && row !== undefined) {
    fields[one] = (fields[one] ?? []).filter(
      (at) => spots.includes(at) && rowAt(at) === row - ROWS_ABOVE_CEDRIC,
    );
  }
}

/** Hyacinth: no hat in a column next to hers. */
function trimHyacinth(fields: Fields): void {
  const hyacinth = new Set((fields.H ?? []).map(colAt));
  const [col] = [...hyacinth];
  if (hyacinth.size === 1 && col !== undefined) {
    for (const id of HATS) {
      fields[id] = (fields[id] ?? []).filter(
        (at) => Math.abs(colAt(at) - col) !== 1,
      );
    }
  }
  const hatCols = HATS.flatMap((id) => {
    const own = fields[id] ?? [];
    return own.length === 1 && own[0] !== undefined ? [colAt(own[0])] : [];
  });
  fields.H = (fields.H ?? []).filter((at) =>
    hatCols.every((one) => Math.abs(one - colAt(at)) !== 1),
  );
}

/** Isolde: in a cabin with somebody wearing an eyepatch. */
function trimIsolde(c: Context, fields: Fields): void {
  const areaAtIndex = (at: number) =>
    c.areaOf({ row: rowAt(at), col: colAt(at) }) ?? "";
  const wearers = (area: string) =>
    EYEPATCHES.filter((id) =>
      (fields[id] ?? []).some((at) => areaAtIndex(at) === area),
    );
  fields.I = (fields.I ?? []).filter(
    (at) => wearers(areaAtIndex(at)).length > 0,
  );
  const cabins = new Set((fields.I ?? []).map(areaAtIndex));
  const [cabin] = [...cabins];
  const only = cabins.size === 1 && cabin !== undefined ? wearers(cabin) : [];
  const one = only.length === 1 ? only[0] : undefined;
  if (one !== undefined) {
    fields[one] = (fields[one] ?? []).filter((at) => areaAtIndex(at) === cabin);
  }
}

/**
 * Whether every piece can get a line of its own - a row, or a column - out of
 * the lines its fields offer (a bipartite matching).
 */
function sharable(fields: Fields, lineOf: (at: number) => number): boolean {
  const options = Object.values(fields).map((own) => [
    ...new Set(own.map(lineOf)),
  ]);
  const holder = new Map<number, number>();
  const claim = (who: number, seen: Set<number>): boolean =>
    (options[who] ?? []).some((line) => {
      const owner = holder.get(line);
      const free =
        !seen.has(line) &&
        (seen.add(line), owner === undefined || claim(owner, seen));
      if (free) {
        holder.set(line, who);
      }
      return free;
    });
  return options.every((_, who) => claim(who, new Set<number>()));
}

/**
 * Every field of a row or a column but one, for the hints that block a line.
 *
 * @param line - whether it is a row or a column
 * @param index - the line, from nought
 * @param keep - the fields on it left open, from nought
 * @returns the fields
 */
function lineExcept(
  line: "row" | "col",
  index: number,
  ...keep: readonly number[]
): readonly Cell[] {
  return Array.from({ length: SIZE }, (_, at) => at)
    .filter((at) => !keep.includes(at))
    .map((at) =>
      line === "row" ? { row: index, col: at } : { row: at, col: index },
    );
}

/** The way to the solution. */
const HINTS: readonly Hint[] = [
  {
    text: "H steht auf der Klippe, also in C6 oder C7. Damit trägt in C6 und C7 niemand einen Hut: Die eine Spalte ist ihre, die andere liegt daneben. Alle Felder neben einem Seil auf der Galeone liegen in C6 oder C7 - M steht also auf Fregatte A neben dem Seil, in R10 (C15 oder C17). Blockiere den Rest von R10.",
    cross: lineExcept("row", 9, 14, 16),
  },
  {
    text: "C steht genau acht Reihen südlich von jemandem neben dem Grabstein (R1 bis R3), also in R9, R10 oder R11 - R10 gehört aber M. Damit steht die Person neben dem Grabstein nicht in R2, sondern in R1C14 oder R3C14: C14 gehört ihr. Blockiere den Rest von C14.",
    cross: lineExcept("col", 13, 0, 2),
  },
  {
    text: "I sitzt in einer Hütte mit jemandem mit Augenklappe (G, P oder U). In Hütte C (R21C16) geht das nicht: G und U stünden dort in ihrer Reihe R21, und die Betten für P liegen in C14. Auf R17C15 bliebe in Hütte B nur G in R14C13, P müsste in Hütte A (C5) - und K hätte weder R14 noch C5 frei.",
    cross: [
      { row: 20, col: 15 },
      { row: 16, col: 14 },
    ],
  },
  {
    text: "Säße I in Hütte A (R3C4), müsste P oder G in C5 die Augenklappe tragen (U vor der Tür stünde in R3). K müsste dann in R14, die Person am Grabstein in R1C14 und P in R2C5. A bliebe nur R4C21, B nur R20C6, W nur C23 - und für E gäbe es kein Feld neben einem Regal mehr. Also sitzt I in Hütte B, in R15C13.",
    place: { I: { row: 14, col: 12 } },
  },
  {
    text: "G (R14C13) und U (R17C13) stünden in der Spalte von I - die Augenklappe in Hütte B trägt also P, auf dem Bett in R14C15. Damit bleibt K nur Schaluppe A in R12C5, und M steht in R10C17.",
    place: {
      P: { row: 13, col: 14 },
      K: { row: 11, col: 4 },
      M: { row: 9, col: 16 },
    },
  },
  {
    text: "B (R1C23, R5C21, R20C6), E (R2C6, R17C23, R21C21) und W (R13C21, R13C23, R16C6) teilen sich die Spalten C6, C21 und C23. Also steht H in C7, und A ist nicht in C21.",
    cross: [
      { row: 20, col: 5 },
      { row: 21, col: 5 },
      { row: 22, col: 5 },
      { row: 1, col: 20 },
      { row: 3, col: 20 },
    ],
  },
  {
    text: "F (neben Blumen) kann jetzt nur noch in R21 bis R24 stehen, H in R21 bis R23 und U in R21C12, R21C22 oder R22C22. L steht mindestens sechs Reihen südlich von S, also in R11C22 oder ganz unten. In R11C22 müssten C in R9, A in R3C20 und U in R21C12 stehen, und für R bliebe nur der Stuhl R3C4 - in der Reihe von A. Also sind R21 bis R24 mit F, H, U und L voll, und O bleibt nur die Galeone in R17C8.",
    place: { O: { row: 16, col: 7 } },
  },
  {
    text: "O in R17 nimmt E das Feld R17C23, und R21C21 liegt in der vollen R21: E steht in R2C6, neben dem Regal in Hütte A. B und W stehen damit in C21 und C23 - W auf jeden Fall in R13.",
    place: { E: { row: 1, col: 5 } },
  },
  {
    text: "R sitzt nicht in R21 (voll) und nicht in R17C22 (O), also in R3C4 oder in C22. In R3C4 hätte A kein Feld neben einem Feuer mehr (R3C20, R3C22, R9C4, R11C4). R sitzt also in C22, und U bleibt nur R21C12.",
    place: { U: { row: 20, col: 11 } },
    cross: [{ row: 2, col: 3 }],
  },
  {
    text: "Wäre A in R3C20, stünde die Person am Grabstein in R1C14, Z bliebe nur R5C4 - und B (R1C23 oder R5C21) hätte keinen Platz. A steht also in C4 und teilt sich R9 und R11 mit C. Damit bleibt N (im Wasser neben einem Schiff) nur R8C16.",
    place: { N: { row: 7, col: 15 } },
    cross: [{ row: 2, col: 19 }],
  },
  {
    text: "J (neben einem Fass) bleibt nur C9 oder C10 - genau wie F. Damit bleibt Z nur R1C2, B muss in R5C21 und W in R13C23.",
    place: {
      Z: { row: 0, col: 1 },
      B: { row: 4, col: 20 },
      W: { row: 12, col: 22 },
    },
  },
  {
    text: "G (oberste Reihe ihres Bereichs) bleibt nur noch ganz oben im Wasser, in R6 (C18 bis C20). D steht östlich von G und westlich von L (R23C18, R23C20, R24C11 oder R24C19) - das geht nur mit G in R6C18, D in C19 und L in R23C20.",
    place: { G: { row: 5, col: 17 }, L: { row: 22, col: 19 } },
  },
  {
    text: "Neben dem Grabstein steht also S. In R1C14 müsste C in R9 stehen, aber R1 gehört Z. Also steht S in R3C14, C in R11 und A in R9C4.",
    place: { S: { row: 2, col: 13 }, A: { row: 8, col: 3 } },
  },
  {
    text: "Y (im Wald, nicht neben einem Baum) bleibt nur R7C3, Q damit nur R19C1. H steht in R22C7, F in R24C10, J in R18C9, R in R20C22, D in R16C19 und C in R11C24. Damit bleibt für den Schatz nur noch R4 C11 - vergraben unter der Palme.",
    place: {
      Y: { row: 6, col: 2 },
      Q: { row: 18, col: 0 },
      H: { row: 21, col: 6 },
      F: { row: 23, col: 9 },
      J: { row: 17, col: 8 },
      R: { row: 19, col: 21 },
      D: { row: 15, col: 18 },
      C: { row: 10, col: 23 },
      T: { row: 3, col: 10 },
    },
  },
];

/** The case. */
export const THE_TREASURE_HUNT: Level = {
  id: "the-treasure-hunt",
  name: "Die Schatzsuche",
  series: { book: "contest" },
  story:
    "Auf der Pirateninsel ist ein Schatz vergraben! Finde heraus, wo die 23 Piraten standen - der Schatz liegt auf dem allerletzten Feld, in der einzigen Reihe und Spalte, die übrig bleiben.",
  culprit: { name: "der Schatz", dative: "dem Schatz" },
  treasure: TREASURE,
  areas: [
    {
      key: "W",
      name: "Wald",
      at: "im Wald",
      ground: "grass",
      tint: "#a3d68f",
      label: { row: 6, col: 3 },
    },
    {
      key: "A",
      name: "Hütte A",
      at: "in Hütte A",
      ground: "floor",
      tint: "#eadfc4",
      label: { row: 2, col: 5 },
    },
    {
      key: "B",
      name: "Hütte B",
      at: "in Hütte B",
      ground: "floor",
      tint: "#eadfc4",
      label: { row: 17, col: 13 },
    },
    {
      key: "C",
      name: "Hütte C",
      at: "in Hütte C",
      ground: "floor",
      tint: "#eadfc4",
      label: { row: 22, col: 13 },
    },
    {
      key: "S",
      name: "Strand",
      at: "am Strand",
      ground: "sand",
      tint: "#f5e6b3",
      label: { row: 10, col: 0 },
    },
    {
      key: "H",
      name: "Höhle",
      at: "in der Höhle",
      ground: "stone",
      tint: "#c9ced6",
      label: { row: 5, col: 22 },
    },
    {
      key: "M",
      name: "Wasser",
      at: "im Wasser",
      ground: "water",
      tint: "#a8d6f3",
      label: { row: 23, col: 3 },
    },
    {
      key: "K",
      name: "Klippe",
      at: "auf der Klippe",
      ground: "stone",
      tint: "#b8bfca",
      label: { row: 22, col: 5 },
    },
    {
      key: "D",
      name: "Steg",
      at: "auf dem Steg",
      ground: "floor",
      tint: "#d2b293",
      label: { row: 19, col: 7 },
    },
    {
      key: "T",
      name: "Taverne",
      at: "in der Taverne",
      ground: "floor",
      tint: "#e8d9bd",
      label: { row: 19, col: 18 },
    },
    {
      key: "L",
      name: "Lichtung",
      at: "auf der Lichtung",
      ground: "grass",
      tint: "#bde5a0",
      label: { row: 23, col: 14 },
    },
    {
      key: "x",
      name: "Schaluppe A",
      at: "auf Schaluppe A",
      ground: "floor",
      tint: "#f1dcae",
      label: { row: 11, col: 4 },
    },
    {
      key: "y",
      name: "Schaluppe B",
      at: "auf Schaluppe B",
      ground: "floor",
      tint: "#f1dcae",
      label: { row: 13, col: 1 },
    },
    {
      key: "z",
      name: "Schaluppe C",
      at: "auf Schaluppe C",
      ground: "floor",
      tint: "#f1dcae",
      label: { row: 13, col: 7 },
    },
    {
      key: "f",
      name: "Fregatte A",
      at: "auf Fregatte A",
      ground: "floor",
      tint: "#f1dcae",
      label: { row: 9, col: 14 },
    },
    {
      key: "g",
      name: "Fregatte B",
      at: "auf Fregatte B",
      ground: "floor",
      tint: "#f1dcae",
      label: { row: 23, col: 0 },
    },
    {
      key: "G",
      name: "Galeone",
      at: "auf der Galeone",
      ground: "floor",
      tint: "#f1dcae",
      label: { row: 17, col: 6 },
    },
  ],
  areaMap: [
    "WWWAAAWWWWWWWWWWWHHHHHHH",
    "WWWAAAWWWWWWWWWWWHHHHHHH",
    "WWWAAAWWWWWWWWWWHHHHHHHH",
    "WWWWWWWWWWWWWWWHHHHHHHHH",
    "WWWWWWWWWWSSSSSSSSHHHHHH",
    "SWWWWWWWSSSSSMMMMMMMMMHH",
    "SSWWWWWSSSSSMMMMMMMMMMMM",
    "SSSSSSSSSSSMMMMMMMMMMMMM",
    "SSSSSSSSSMMMMMfffMMMMMMM",
    "SSSSSSSMMMMMMMfffLLLLMMM",
    "SSSSSMMMMMMMLLLLLLLLLLMM",
    "MMMMxxMMMMMLLLLLLLLLLLLM",
    "MMMMMMMMMDDLLLLLLLLLLLLL",
    "MyyMMMMzzDDLBBBLLLLLLLLL",
    "MMMMMMMMMDDLBBBLLLLLLLLL",
    "MMMMGGGGDDDLBBBLLLLTTTTT",
    "MMMMGGGGDDLLBBBBLLLTTTTT",
    "MMMMGGGGDDLLLBBBLLTTTTTT",
    "MMMMMDDDDDLLLLLLLLTTTTTT",
    "MMMMMDDDDDLLLLLLLLTTTTTT",
    "MMMMMKKKLLLLCCCCLLLTTTTT",
    "MMMMMKKKLLLLCCCCLLLLLLLL",
    "gggMMKKLLLLLLCCCLLLLLLLL",
    "gggMMMKLLLLLLLLLLLLLLLLL",
  ],
  thingMap: [
    "s..Teh........t....akmm.",
    ".b..e...st...o....kb....",
    "...cd..t.......t....f...",
    ".t..d.....t.st....b..b..",
    "....sl..t..........mm...",
    "....t.s.................",
    "........r...............",
    "......a..mm.............",
    ".b...t...r.....k........",
    "mm.f...........R...p....",
    "..........x....l...kt...",
    ".....r..........t...l...",
    "x........k........b..t..",
    "..........a..he...t.p.p.",
    "..x......a..c.e......p..",
    "....p.Rk....k.T....r.ahr",
    "..b.........d.c......c..",
    "....kR.k.r..d.r.....TT.a",
    "....................ccTT",
    "x....mm.rk.........k.cT.",
    ".......bl..dd..c...h.dTc",
    "b.x....b..l.Te.......d..",
    ".r.......lt..e......t.s.",
    "......b....t.....t......",
  ],
  things: {
    s: "shrub",
    t: "palm",
    b: "boulder",
    o: "tombstone",
    T: "table",
    e: "bed",
    h: "shelf",
    c: "chair",
    k: "crate",
    f: "fire",
    m: "hammock",
    a: "sack",
    r: "barrel",
    p: "pig",
    x: "shark",
    l: "flowers",
    R: "rope",
    d: "door",
  },
  extraThings: {
    hammock: { name: "Hängematte", emoji: "\u{3030}\u{FE0F}", standable: true },
    door: { name: "Vor einer Tür", emoji: "\u{1F6AA}", standable: true },
    fire: { name: "Feuer", emoji: "\u{1F525}", standable: false },
    sack: { name: "Sack", emoji: "\u{1F45D}", standable: false },
    rope: { name: "Seil", emoji: "\u{1FAA2}", standable: false },
    tombstone: { name: "Grabstein", emoji: "\u{1FAA6}", standable: false },
    pig: {
      name: "Schwein",
      emoji: "\u{1F416}",
      standable: false,
      kinds: ["animal"],
    },
  },
  pieces: [
    { at: { row: 0, col: 4 }, rows: 2, cols: 1 },
    { at: { row: 0, col: 21 }, rows: 1, cols: 2 },
    { at: { row: 4, col: 19 }, rows: 1, cols: 2 },
    { at: { row: 7, col: 9 }, rows: 1, cols: 2 },
    { at: { row: 9, col: 0 }, rows: 1, cols: 2 },
    { at: { row: 13, col: 14 }, rows: 2, cols: 1 },
    { at: { row: 17, col: 20 }, rows: 1, cols: 2 },
    { at: { row: 19, col: 5 }, rows: 1, cols: 2 },
    { at: { row: 21, col: 13 }, rows: 2, cols: 1 },
  ],
  // The doors, drawn in the walls between their two fields.
  windows: [
    { at: { row: 2, col: 4 }, side: "bottom", door: true },
    { at: { row: 16, col: 12 }, side: "bottom", door: true },
    { at: { row: 20, col: 11 }, side: "right", door: true },
    { at: { row: 20, col: 21 }, side: "bottom", door: true },
  ],
  suspects: [
    {
      id: "A",
      name: "Augustus",
      pronoun: "er",
      traits: ["hat"],
      clue: { text: "Er war neben einem Feuer.", ...beside("fire") },
      colour: "#b91c1c",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "B",
      name: "Bart",
      pronoun: "er",
      clue: {
        text: "Er war auf einer Hängematte. In seiner Spalte lag nirgends ein Sack.",
        ...all(
          on("hammock"),
          own((c) =>
            Array.from({ length: c.rows }, (_, row) => row).every(
              (row) => !c.is({ row, col: c.cell.col }, "sack"),
            ),
          ),
        ),
      },
      colour: "#15803d",
      face: "\u{1F468}‍\u{1F9B2}",
    },
    {
      id: "C",
      name: "Cedric",
      pronoun: "er",
      clue: {
        text: "Jemand genau acht Reihen nördlich von ihm war neben dem Grabstein.",
        ...all(
          own((c) =>
            besideTombstone(c.level).some(
              (cell) => cell.row === c.cell.row - ROWS_ABOVE_CEDRIC,
            ),
          ),
          counting((c) =>
            c
              .people()
              .some(
                (id) =>
                  id !== c.self &&
                  id !== TREASURE &&
                  rowOf(c, id) === c.cell.row - ROWS_ABOVE_CEDRIC &&
                  c.beside(c.cellOf(id) ?? c.cell, "tombstone"),
              ),
          ),
        ),
      },
      colour: "#0e7490",
      face: "\u{1F468}",
    },
    {
      id: "D",
      name: "Dudley",
      pronoun: "er",
      traits: ["hat"],
      clue: {
        text: "Er war östlich von Griselda und westlich von Linus.",
        ...about(
          ["G", "L"],
          (c) => colOf(c, "G") < c.cell.col && c.cell.col < colOf(c, "L"),
        ),
      },
      colour: "#6366f1",
      face: "\u{1F9D4}",
    },
    {
      id: "E",
      name: "Eiko",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Regal.", ...beside("shelf") },
      colour: "#7c3aed",
      face: "\u{1F469}",
    },
    {
      id: "F",
      name: "Fleur",
      pronoun: "sie",
      clue: { text: "Sie war neben Blumen.", ...beside("flowers") },
      colour: "#9f1239",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "G",
      name: "Griselda",
      pronoun: "sie",
      traits: ["eyepatch"],
      clue: {
        text: "Sie war in der obersten Reihe ihres Bereichs.",
        ...own((c) => c.cell.row === topRow(c, c.areaOf(c.cell) ?? "")),
      },
      colour: "#ea580c",
      face: "\u{1F475}",
    },
    {
      id: "H",
      name: "Hyacinth",
      pronoun: "sie",
      clue: {
        text: "Sie war auf der Klippe. Niemand in einer benachbarten Spalte trug einen Hut.",
        ...all(
          inArea("K"),
          counting((c) =>
            c
              .people()
              .every(
                (id) =>
                  Math.abs(colOf(c, id) - c.cell.col) !== 1 ||
                  !c.has(id, "hat"),
              ),
          ),
        ),
      },
      colour: "#4338ca",
      face: "\u{1F469}‍\u{1F9B3}",
    },
    {
      id: "I",
      name: "Isolde",
      pronoun: "sie",
      clue: {
        text: "Sie saß auf einem Stuhl. Sie war in einer Hütte mit jemandem, der eine Augenklappe trug.",
        ...all(
          on("seat"),
          inArea(...CABINS),
          counting((c) =>
            c
              .peopleIn(c.areaOf(c.cell) ?? "")
              .some((id) => id !== c.self && c.has(id, "eyepatch")),
          ),
        ),
      },
      colour: "#0f766e",
      face: "\u{1F469}\u{1F3FC}",
    },
    {
      id: "J",
      name: "Julius",
      pronoun: "er",
      traits: ["hat"],
      clue: { text: "Er war neben einem Fass.", ...beside("barrel") },
      colour: "#a16207",
      face: "\u{1F9D4}\u{1F3FF}",
    },
    {
      id: "K",
      name: "Kathleen",
      pronoun: "sie",
      clue: { text: "Sie war auf einer Schaluppe.", ...inArea(...SLOOPS) },
      colour: "#be185d",
      face: "\u{1F469}\u{1F3FD}",
    },
    {
      id: "L",
      name: "Linus",
      pronoun: "er",
      clue: { text: "Er war neben einem Baum.", ...beside("tree") },
      colour: "#1d4ed8",
      face: "\u{1F471}",
    },
    {
      id: "M",
      name: "Mortimer",
      pronoun: "er",
      traits: ["hat"],
      clue: {
        text: "Er war auf einem Schiff, neben einem Seil.",
        ...all(inArea(...SHIPS), beside("rope")),
      },
      colour: "#65a30d",
      face: "\u{1F474}",
    },
    {
      id: "N",
      name: "Nehemiah",
      pronoun: "er",
      clue: {
        text: "Er war im Wasser, neben einem Schiff.",
        ...all(
          inArea("M"),
          own((c) => besideShip(c, c.cell)),
        ),
      },
      colour: "#c2410c",
      face: "\u{1F468}‍\u{1F9B0}",
    },
    {
      id: "O",
      name: "Orville",
      pronoun: "er",
      clue: { text: "Er war auf einem Schiff.", ...inArea(...SHIPS) },
      colour: "#7e22ce",
      face: "\u{1F9D4}\u{1F3FD}",
    },
    {
      id: "P",
      name: "Pedro",
      pronoun: "er",
      traits: ["eyepatch"],
      clue: { text: "Er war auf einem Bett.", ...on("bed") },
      colour: "#334155",
      face: "\u{1F9D4}\u{1F3FB}",
    },
    {
      id: "Q",
      name: "Quincy",
      pronoun: "er",
      clue: {
        text: "Er war im Wasser, neben einem Hai.",
        ...all(inArea("M"), beside("shark")),
      },
      colour: "#0891b2",
      face: "\u{1F468}\u{1F3FD}‍\u{1F9B2}",
    },
    {
      id: "R",
      name: "Rosalind",
      pronoun: "sie",
      clue: { text: "Sie saß auf einem Stuhl.", ...on("seat") },
      colour: "#db2777",
      face: "\u{1F469}\u{1F3FB}",
    },
    {
      id: "S",
      name: "Seraphina",
      pronoun: "sie",
      clue: {
        text: "Sie war mindestens sechs Reihen nördlich von Linus.",
        ...about(["L"], (c) => rowOf(c, "L") - c.cell.row >= ROWS_ABOVE_LINUS),
      },
      colour: "#ca8a04",
      face: "\u{1F471}\u{1F3FC}‍♀️",
    },
    {
      id: "U",
      name: "Ursula",
      pronoun: "sie",
      traits: ["hat", "eyepatch"],
      clue: { text: "Sie war vor einer Tür.", ...on("door") },
      colour: "#16a34a",
      face: "\u{1F469}\u{1F3FE}‍\u{1F9B0}",
    },
    {
      id: "W",
      name: "Wilfred",
      pronoun: "er",
      clue: { text: "Er war neben einem Schwein.", ...beside("pig") },
      colour: "#9333ea",
      face: "\u{1F9D4}\u{1F3FC}",
    },
    {
      id: "Y",
      name: "Yannis",
      pronoun: "er",
      clue: {
        text: "Er war im Wald. Er war nicht neben einem Baum.",
        ...all(inArea("W"), not(beside("tree"))),
      },
      colour: "#2563eb",
      face: "\u{1F468}\u{1F3FE}‍\u{1F9B3}",
    },
    {
      id: "Z",
      name: "Zoe",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Strauch.", ...beside("shrub") },
      colour: "#e11d48",
      face: "\u{1F469}\u{1F3FB}‍\u{1F9B1}",
    },
    {
      id: TREASURE,
      name: "Schatz",
      pronoun: "er",
      buried: true,
      clue: {
        text: "Auf dem allerletzten Feld. Er kann unter einem Gegenstand vergraben sein, auf dem sonst niemand stehen kann.",
      },
      colour: "#d97706",
      face: "\u{1F4B0}",
    },
  ],
  rules: [
    {
      text: "Schaluppen, Fregatten und die Galeone zählen alle als Schiffe - und jedes Schiff ist ein eigener Bereich.",
      prune: stillPossible,
    },
  ],
  hints: HINTS,
  solution: {
    A: { row: 8, col: 3 },
    B: { row: 4, col: 20 },
    C: { row: 10, col: 23 },
    D: { row: 15, col: 18 },
    E: { row: 1, col: 5 },
    F: { row: 23, col: 9 },
    G: { row: 5, col: 17 },
    H: { row: 21, col: 6 },
    I: { row: 14, col: 12 },
    J: { row: 17, col: 8 },
    K: { row: 11, col: 4 },
    L: { row: 22, col: 19 },
    M: { row: 9, col: 16 },
    N: { row: 7, col: 15 },
    O: { row: 16, col: 7 },
    P: { row: 13, col: 14 },
    Q: { row: 18, col: 0 },
    R: { row: 19, col: 21 },
    S: { row: 2, col: 13 },
    U: { row: 20, col: 11 },
    W: { row: 12, col: 22 },
    Y: { row: 6, col: 2 },
    Z: { row: 0, col: 1 },
    T: { row: 3, col: 10 },
  },
};
