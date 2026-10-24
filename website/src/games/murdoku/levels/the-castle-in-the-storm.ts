/**
 * Die Burg im Sturm: a castle inside its wall - dungeon, royal gardens,
 * armoury, throne room, royal hall, chapel, courtyard and stables - on a
 * stormy night, with a murdered knight.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/16.png`, no
 * solution sheet and no culprit on the photographed page - most of the grid
 * is pencilled in, and the solver proves the solution is the only one).
 * Vigor is the victim; whoever was alone with him killed him.
 *
 * The book's estates: nobles (purple cards: Agnes, Blanche, Casimir, David)
 * only in the crowned areas - the royal gardens, the throne room, the royal
 * hall and the chapel - villagers (wooden cards: Emil, Francesca, Griffin,
 * Hilda, Jordan, Katryn) only in the others, knights (grey shields: Isidor,
 * Vigor) anywhere.
 *
 * The map is twelve by twelve with two fields missing at the bottom left and
 * two at the bottom right. A field is in a corner of its area when the
 * area's border runs along two of its sides that meet: one above or below
 * it, one to its left or right. "North-west of" means any field further
 * north and further west. Chairs, mud puddles and the horses can be stood
 * on; the time machine cannot (the legend says so), nor can barrels, crates,
 * trees, statues, tables, weapon racks and the boars.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  all,
  beside,
  column,
  counting,
  inArea,
  not,
  on,
  own,
  ranks,
  victim,
} from "../engine/clues";
import { contextOf } from "../engine/rules";
import type { Cell, Context, Level } from "../engine/types";

/** The crowned areas: royal gardens, throne room, royal hall, chapel. */
const CROWNED: readonly string[] = ["J", "T", "R", "K"];

/** The nobles, whom Emil was north-west of. */
const NOBLES: readonly string[] = ["A", "B", "C", "D"];

/** The wall. */
const WALL = "W";

/** The dungeon. */
const DUNGEON = "M";

/** How many people stand in an area where one is alone with one other. */
const PAIR = 2;

/** A field somebody not yet placed could still take. */
type Option = { readonly id: string; readonly cell: Cell };

/** The fields each suspect's own clue and the rules allow, worked out once. */
const domains = new Map<string, readonly Cell[]>();

/** Whether a row, counted from nought, has a mud puddle in it. */
function mudRow(c: Context, row: number): boolean {
  return Array.from({ length: c.cols }, (_, col) => ({ row, col })).some(
    (cell) => c.inside(cell) && c.is(cell, "mud"),
  );
}

/**
 * For the solver: whether the people placed so far still leave room for a
 * solution - everybody left still has a free field, the free rows and
 * columns can be shared out, and the clues about others can still hold.
 *
 * @param c - the context, with some people placed
 * @returns whether a solution may still follow
 */
function stillPossible(c: Context): boolean {
  const placed = c.people();
  const taken = placed.map((id) => c.cellOf(id) ?? { row: -1, col: -1 });
  const rowTaken = new Set(taken.map((at) => at.row));
  const colTaken = new Set(taken.map((at) => at.col));
  const waiting = c.level.suspects
    .map((one) => one.id)
    .filter((id) => !placed.includes(id));
  const free = waiting.map((id) =>
    domainOf(c, id).filter(
      (cell) => !rowTaken.has(cell.row) && !colTaken.has(cell.col),
    ),
  );
  const options: readonly Option[] = waiting.flatMap((id, index) =>
    (free[index] ?? []).map((cell) => ({ id, cell })),
  );
  return (
    free.every((cells) => cells.length > 0) &&
    linesShareOut(
      free.map((cells) => [...new Set(cells.map((at) => at.row))]),
    ) &&
    linesShareOut(
      free.map((cells) => [...new Set(cells.map((at) => at.col))]),
    ) &&
    cluesStillOpen(c, options)
  );
}

/** The fields a suspect's own clue and the rules allow. */
function domainOf(c: Context, id: string): readonly Cell[] {
  const known = domains.get(id);
  const suspect = c.level.suspects.find((one) => one.id === id);
  const cells: Cell[] = [];
  if (known === undefined && suspect !== undefined) {
    for (let row = 0; row < c.rows; row += 1) {
      for (let col = 0; col < c.cols; col += 1) {
        const cell = { row, col };
        const alone = contextOf(c.level, { [id]: cell }, id);
        const unary = suspect.clue.unary;
        if (
          c.inside(cell) &&
          c.standable(cell) &&
          (unary === undefined || unary(alone)) &&
          (c.level.rules ?? []).every(
            (rule) => rule.unary === undefined || rule.unary(suspect, alone),
          )
        ) {
          cells.push(cell);
        }
      }
    }
    domains.set(id, cells);
  }
  return known ?? cells;
}

/** Whether these people can each get a line of their own (rows or columns). */
function linesShareOut(lists: readonly (readonly number[])[]): boolean {
  const owner = new Map<number, number>();
  const take = (who: number, seen: Set<number>): boolean =>
    (lists[who] ?? []).some((line) => {
      const holder = owner.get(line);
      const fits =
        !seen.has(line) &&
        (seen.add(line), holder === undefined || take(holder, seen));
      if (fits) {
        owner.set(line, who);
      }
      return fits;
    });
  return lists.every((_, who) => take(who, new Set<number>()));
}

/** The partial checks of the rules and of the clues about others. */
function cluesStillOpen(c: Context, options: readonly Option[]): boolean {
  const emil = c.cellOf("E");
  const victimAt = c.cellOf("V");
  const david = c.cellOf("D");
  const katryn = c.cellOf("K");
  return (
    c.peopleIn(WALL).every((id) => {
      const there = c.cellOf(id);
      return there !== undefined && c.beside(there, "barrel");
    }) &&
    c.peopleIn(DUNGEON).length <= 1 &&
    c.peopleIn(DUNGEON).every((id) => c.has(id, "man")) &&
    (emil === undefined ||
      NOBLES.every((id) => {
        const there = c.cellOf(id);
        return there === undefined
          ? options.some(
              (option) =>
                option.id === id &&
                option.cell.row > emil.row &&
                option.cell.col > emil.col,
            )
          : there.row > emil.row && there.col > emil.col;
      })) &&
    (victimAt === undefined ||
      c.peopleIn(c.areaOf(victimAt) ?? "").length <= PAIR) &&
    (david === undefined ||
      can(
        c,
        options,
        (id, cell) =>
          c.has(id, "man") &&
          cell.row === david.row - 1 &&
          c.areaOf(cell) === DUNGEON,
      )) &&
    (katryn === undefined ||
      can(
        c,
        options,
        (id, cell) =>
          c.has(id, "woman") &&
          cell.row === katryn.row - 2 &&
          c.is(cell, "mud"),
      )) &&
    c.level.areas.every(
      (area) =>
        c.peopleIn(area.key).length > 0 ||
        options.some((option) => c.areaOf(option.cell) === area.key),
    )
  );
}

/** Whether somebody stands, or could still stand, on a field that passes a test. */
function can(
  c: Context,
  options: readonly Option[],
  test: (id: string, cell: Cell) => boolean,
): boolean {
  return (
    somebodyWhere(c, test) ||
    options.some((option) => test(option.id, option.cell))
  );
}

/** Whether a field lies in a corner of its area, given the area of each field. */
function inCorner(areaOf: (cell: Cell) => string | null, cell: Cell): boolean {
  const area = areaOf(cell);
  const outside = (row: number, col: number): boolean =>
    areaOf({ row, col }) !== area;
  const vertical =
    outside(cell.row - 1, cell.col) || outside(cell.row + 1, cell.col);
  const horizontal =
    outside(cell.row, cell.col - 1) || outside(cell.row, cell.col + 1);
  return vertical && horizontal;
}

/** Whether somebody stands on a field that passes a test. */
function somebodyWhere(
  c: Context,
  test: (id: string, cell: Cell) => boolean,
): boolean {
  return c.people().some((id) => {
    const there = c.cellOf(id);
    return there !== undefined && test(id, there);
  });
}

/** Whether every area has somebody in it. */
function noEmptyArea(c: Context): boolean {
  return c.level.areas.every((area) => c.peopleIn(area.key).length > 0);
}

/** The case. */
export const THE_CASTLE_IN_THE_STORM: Level = {
  id: "the-castle-in-the-storm",
  name: "Die Burg im Sturm",
  series: { book: "timeTravel", number: 16 },
  story:
    "Behalte den Hofnarren im Auge. Ich habe gehört, er bringt jede Nacht die Leute um - vor Lachen.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "W",
      name: "Burgmauer",
      at: "auf der Burgmauer",
      ground: "stone",
      tint: "#c3c8e4",
      label: { row: 11, col: 2 },
    },
    {
      key: "M",
      name: "Kerker",
      at: "im Kerker",
      ground: "stone",
      tint: "#9d9aae",
      label: { row: 5, col: 1 },
    },
    {
      key: "J",
      name: "Königliche Gärten",
      at: "in den Königlichen Gärten",
      ground: "floor",
      tint: "#cbbfe6",
      label: { row: 3, col: 4 },
    },
    {
      key: "A",
      name: "Waffenkammer",
      at: "in der Waffenkammer",
      ground: "floor",
      tint: "#bcd2ec",
      label: { row: 6, col: 5 },
    },
    {
      key: "T",
      name: "Thronsaal",
      at: "im Thronsaal",
      ground: "floor",
      tint: "#d8c4ec",
      label: { row: 6, col: 7 },
    },
    {
      key: "R",
      name: "Königssaal",
      at: "im Königssaal",
      ground: "floor",
      tint: "#d2c2ea",
      label: { row: 5, col: 9 },
    },
    {
      key: "K",
      name: "Kapelle",
      at: "in der Kapelle",
      ground: "floor",
      tint: "#c9b4e2",
      label: { row: 10, col: 2 },
    },
    {
      key: "P",
      name: "Burghof",
      at: "im Burghof",
      ground: "stone",
      tint: "#ddd6cc",
      label: { row: 11, col: 6 },
    },
    {
      key: "S",
      name: "Ställe",
      at: "in den Ställen",
      ground: "floor",
      tint: "#d8cbb4",
      label: { row: 10, col: 8 },
    },
  ],
  areaMap: [
    "WWWWWWWWWWWW",
    "WMMJJJTTTRRW",
    "WMMJJJTTTRRW",
    "WMMJJJTTTRRW",
    "WMMAAATTTRRW",
    "WMMAAATTTRRW",
    "WPPAAATTTSSW",
    "WPPPPPPPPSSW",
    "WPPPPPPPSSSW",
    "WWKKKKPPSSWW",
    ".WKKKPPPSSW.",
    ".WWWWPPPWWW.",
  ],
  thingMap: [
    ".bb........b",
    "...ct.s.s...",
    ".x.tst.cdcs.",
    ".x.ct.......",
    "..x......de.",
    "b..rr.....eb",
    ".xxrr.s.s..b",
    "bqo.m......b",
    ".x....m...h.",
    "...cdco..hb.",
    "...cc....mb.",
    "...b...b....",
  ],
  things: {
    b: "barrel",
    c: "chair",
    d: "table",
    e: "bed",
    h: "horse",
    m: "mud",
    o: "boar",
    q: "timeMachine",
    r: "weaponRack",
    s: "statue",
    t: "tree",
    x: "woodCrate",
  },
  pieces: [{ at: { row: 4, col: 10 }, rows: 2, cols: 1 }],
  suspects: [
    {
      id: "A",
      name: "Agnes",
      pronoun: "sie",
      traits: ["noble"],
      clue: {
        text: "Sie saß nicht auf einem Stuhl.",
        ...not(on("chair")),
      },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Blanche",
      pronoun: "sie",
      traits: ["noble"],
      clue: { text: "Sie war neben einer Statue.", ...beside("statue") },
      colour: "#7c3aed",
      face: "\u{1F478}",
    },
    {
      id: "C",
      name: "Casimir",
      pronoun: "er",
      traits: ["noble"],
      clue: { text: "Er saß auf einem Stuhl.", ...on("chair") },
      colour: "#0e7490",
      face: "\u{1F921}",
    },
    {
      id: "D",
      name: "David",
      pronoun: "er",
      traits: ["noble"],
      clue: {
        text: "Eine Reihe über ihm war ein Mann allein im Kerker.",
        ...all(
          own((c) =>
            c.cellsOf(DUNGEON).some((cell) => cell.row === c.cell.row - 1),
          ),
          counting((c) =>
            somebodyWhere(
              c,
              (id, cell) =>
                c.has(id, "man") &&
                cell.row === c.cell.row - 1 &&
                c.areaOf(cell) === DUNGEON &&
                c.peopleIn(DUNGEON).length === 1,
            ),
          ),
        ),
      },
      colour: "#ca8a04",
      face: "\u{1F934}",
    },
    {
      id: "E",
      name: "Emil",
      pronoun: "er",
      traits: ["villager"],
      clue: {
        text: "Er war nordwestlich aller Adligen.",
        ...counting((c) =>
          NOBLES.every((id) => {
            const there = c.cellOf(id);
            return (
              there !== undefined &&
              c.cell.row < there.row &&
              c.cell.col < there.col
            );
          }),
        ),
      },
      colour: "#57534e",
      face: "\u{1F468}‍\u{1F9B2}",
    },
    {
      id: "F",
      name: "Francesca",
      pronoun: "sie",
      traits: ["villager"],
      clue: {
        text: "Sie war auf der Burgmauer. Alle, die dort waren, standen neben einem Fass.",
        ...all(
          inArea(WALL),
          beside("barrel"),
          counting((c) =>
            c.peopleIn(WALL).every((id) => {
              const there = c.cellOf(id);
              return there !== undefined && c.beside(there, "barrel");
            }),
          ),
        ),
      },
      colour: "#be185d",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "G",
      name: "Griffin",
      pronoun: "er",
      traits: ["villager"],
      clue: { text: "Er war in der dritten Spalte.", ...column(3) },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "H",
      name: "Hilda",
      pronoun: "sie",
      traits: ["villager"],
      clue: {
        text: "Sie war neben einem Wildschwein oder einem Pferd.",
        ...own((c) => c.beside(c.cell, "boar") || c.beside(c.cell, "horse")),
      },
      colour: "#ea580c",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "I",
      name: "Isidor",
      pronoun: "er",
      traits: ["knight"],
      clue: {
        text: "Er war nicht auf der Burgmauer.",
        ...not(inArea(WALL)),
      },
      colour: "#6366f1",
      face: "\u{1F9D4}‍♂️",
    },
    {
      id: "J",
      name: "Jordan",
      pronoun: "er",
      traits: ["villager"],
      clue: {
        text: "Er war in einer Ecke seines Bereichs.",
        ...own((c) => inCorner(c.areaOf, c.cell)),
      },
      colour: "#0f766e",
      face: "\u{1F474}",
    },
    {
      id: "K",
      name: "Katryn",
      pronoun: "sie",
      traits: ["villager"],
      clue: {
        text: "Zwei Reihen über ihr war eine Frau auf einer Schlammpfütze.",
        ...all(
          own((c) => mudRow(c, c.cell.row - 2)),
          counting((c) =>
            somebodyWhere(
              c,
              (id, cell) =>
                c.has(id, "woman") &&
                cell.row === c.cell.row - 2 &&
                c.is(cell, "mud"),
            ),
          ),
        ),
      },
      colour: "#a16207",
      face: "\u{1F9D5}",
    },
    {
      id: "V",
      name: "Vigor",
      pronoun: "er",
      traits: ["knight"],
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#78716c",
      face: "\u{1F9D4}",
    },
  ],
  rules: [
    ranks(
      "Adlige (\u{1F451}) waren nur in den Königlichen Gärten, im Thronsaal, im Königssaal und in der Kapelle, Dorfbewohner nur in den anderen Bereichen, Ritter überall.",
      CROWNED,
    ),
    {
      text: "Kein Bereich war leer.",
      check: noEmptyArea,
      prune: stillPossible,
    },
  ],
  hints: [
    {
      text: "Katryn: Zwei Reihen über ihr stand eine Frau auf einer Schlammpfütze. Agnes und Blanche dürfen als Adlige nicht in den Burghof, Francesca ist auf der Mauer - es bleibt Hilda. Neben einem Wildschwein oder Pferd ist von den Pfützen nur R9 C7 (neben dem Wildschwein in R10 C7). Hilda steht in R9 C7, Katryn ist in R11.",
      place: { H: { row: 8, col: 6 } },
    },
    {
      text: "Alle auf der Mauer standen neben einem Fass. In C2 bleiben damit nur Felder im Kerker - und im Kerker war genau ein Mann allein (Davids Hinweis). Griffin in C3 ist also nicht im Kerker: R9 C3 ist Hildas Zeile, die Kapelle ist für Dorfbewohner verboten. Griffin steht auf der Mauer in R12 C3, neben dem Fass.",
      place: { G: { row: 11, col: 2 } },
    },
    {
      text: "In der Kapelle bleibt nur R10 (C3 ist Griffins Spalte, R11 Katryns Zeile), also R10 C4 oder R10 C6. In den Königlichen Gärten sind nur R2 C4, R2 C6, R4 C4 und R4 C6 frei. Die Spalten 4 und 6 gehören damit diesen beiden - in der Waffenkammer bleibt nur R5 C5. Emil war nordwestlich aller Adligen: Casimir sitzt frühestens in C4, also ist Emil in C1 oder der Mann im Kerker in C2. In R5 bis R7 wäre er zu weit südlich - Agnes, Blanche und David hätten dann nur R6 und R7. Emil steht also in R1 C1 oder R2 C2, und in R5 C5 steht Isidor oder Vigor.",
    },
    {
      text: "In C12 sind nur Mauerfelder neben einem Fass: R2 C12, R5 C12 (Zeile der Waffenkammer), R9 C12 (Hildas Zeile) und R10 C12 (Zeile der Kapelle). Auf R2 C12 passt nur Francesca: Jordan wäre dort in keiner Ecke, Emil nicht nordwestlich, und Vigor wäre auf der Mauer nie allein mit einer Person, weil Francesca und Griffin schon dort sind. Francesca steht in R2 C12, Emil damit in R1 C1.",
      place: { F: { row: 1, col: 11 }, E: { row: 0, col: 0 } },
    },
    {
      text: "Der Mann im Kerker steht in C2: R2 ist Francescas Zeile, R5 die der Waffenkammer - es bleibt R6 C2, für Isidor oder Jordan. David ist eine Reihe tiefer, und in R7 bleibt ihm nur R7 C8 im Thronsaal.",
      place: { D: { row: 6, col: 7 } },
    },
    {
      text: "Agnes kann nur noch in R4 stehen - ihre übrigen Felder liegen in vergebenen Zeilen oder in Griffins Spalte. Die Gärten brauchen jemanden in R4, und Agnes sitzt nicht - sie steht in R4 C6. Blanche bleibt neben einer Statue nur R3 C10, Casimir nur der Stuhl in R10 C4 in der Kapelle.",
      place: {
        A: { row: 3, col: 5 },
        B: { row: 2, col: 9 },
        C: { row: 9, col: 3 },
      },
    },
    {
      text: "Katryn steht in R11 C9 (C6, C8 und C10 sind besetzt). Für Isidor, Jordan und Vigor bleiben R5 C5, R6 C2 und R8 in C11. Jordan steht in seiner Ecke R6 C2. Vigor wäre in der Waffenkammer allein - er steht in R8 C11 in den Ställen, und Isidor in R5 C5. Vigor ist allein mit Katryn. Katryn ist die Mörderin!",
      place: {
        K: { row: 10, col: 8 },
        J: { row: 5, col: 1 },
        I: { row: 4, col: 4 },
        V: { row: 7, col: 10 },
      },
    },
  ],
  solution: {
    A: { row: 3, col: 5 },
    B: { row: 2, col: 9 },
    C: { row: 9, col: 3 },
    D: { row: 6, col: 7 },
    E: { row: 0, col: 0 },
    F: { row: 1, col: 11 },
    G: { row: 11, col: 2 },
    H: { row: 8, col: 6 },
    I: { row: 4, col: 4 },
    J: { row: 5, col: 1 },
    K: { row: 10, col: 8 },
    V: { row: 7, col: 10 },
  },
};
