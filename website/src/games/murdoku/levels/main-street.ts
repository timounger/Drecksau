/**
 * Main Street: a high street between two towers, each with its elevator,
 * with a fountain, a park, two pavements and a road full of cars.
 *
 * @module
 * @remarks
 * After the free case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Experte/Hauptstraße/Hauptstraße.png`, no
 * solution sheet; the solver proves the case has exactly one solution).
 * Virgil is the victim; whoever was alone with him killed him. Cars, the bus
 * and chairs can be stood on, and so can the fountain's water; trees, potted
 * plants, statues, tables, traffic cones and bins cannot. A field is "beside
 * the border of an empty area" when a field right next to it belongs to
 * another area that nobody stands in.
 */
import {
  about,
  all,
  alone,
  beside,
  counting,
  inArea,
  on,
  own,
  victim,
} from "../engine/clues";
import { contextOf } from "../engine/rules";
import type { Cell, Context, Level } from "../engine/types";

/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */

/** The two elevators. */
const ELEVATORS: readonly string[] = ["A", "Z"];

/** The two pavements. */
const PAVEMENTS: readonly string[] = ["G", "W"];

/** How many people stand in an area where one is alone with one other. */
const PAIR = 2;

/** How many columns west of Carissa the person in a car was. */
const CAR_OFFSET = 3;

/** How many rows north of Kimberly the person beside a statue was. */
const STATUE_OFFSET = 2;

/** The four steps to the fields right next to one, across any border. */
const STEPS: readonly Cell[] = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

/** The fields right next to one, on the map, whatever their area. */
function around(c: Context, cell: Cell): readonly Cell[] {
  return STEPS.map((step) => ({
    row: cell.row + step.row,
    col: cell.col + step.col,
  })).filter((there) => c.inside(there));
}

/** The other areas a field borders on. */
function bordering(c: Context, cell: Cell): readonly string[] {
  const own = c.areaOf(cell);
  return around(c, cell).flatMap((there) => {
    const area = c.areaOf(there);
    return area === null || area === own ? [] : [area];
  });
}

/** Whether somebody stands on a field that passes a test. */
function somebodyWhere(c: Context, test: (cell: Cell) => boolean): boolean {
  return c.people().some((id) => {
    const there = c.cellOf(id);
    return there !== undefined && test(there);
  });
}

/** Whether a column holds a car anywhere. */
function columnHasCar(c: Context, col: number): boolean {
  return Array.from({ length: c.rows }, (_, row) => ({ row, col })).some(
    (cell) => c.is(cell, "car"),
  );
}

/** The fields each suspect's own clue allows, worked out once. */
const domains = new Map<string, readonly Cell[]>();

/** The fields a suspect's own clue allows. */
function domainOf(c: Context, id: string): readonly Cell[] {
  const known = domains.get(id);
  const suspect = c.level.suspects.find((one) => one.id === id);
  const cells: Cell[] = [];
  if (known === undefined) {
    for (let row = 0; row < c.rows; row += 1) {
      for (let col = 0; col < c.cols; col += 1) {
        const cell = { row, col };
        const unary = suspect?.clue.unary;
        if (
          c.standable(cell) &&
          (unary === undefined || unary(contextOf(c.level, { [id]: cell }, id)))
        ) {
          cells.push(cell);
        }
      }
    }
    domains.set(id, cells);
  }
  return known ?? cells;
}

/** A field somebody could still be on: placed there, or free and allowed by their own clue. */
type Option = { readonly id: string; readonly cell: Cell };

/** Whether the people placed in an area are all among these. */
function onlyAmong(
  c: Context,
  id: string,
  allowed: readonly string[],
): boolean {
  const there = c.cellOf(id);
  return (
    there === undefined ||
    c.peopleIn(c.areaOf(there) ?? "").every((other) => allowed.includes(other))
  );
}

/** Whether somebody can still be on a field that passes a test. */
function can(
  options: readonly Option[],
  id: string | null,
  test: (cell: Cell) => boolean,
): boolean {
  return options.some(
    (option) => (id === null || option.id === id) && test(option.cell),
  );
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

/** The partial checks of the clues that need other people placed. */
function cluesStillOpen(c: Context, options: readonly Option[]): boolean {
  const at = (id: string) => c.cellOf(id);
  const areaOfId = (id: string) => {
    const there = at(id);
    return there === undefined ? null : c.areaOf(there);
  };
  const andy = at("A");
  const iliana = at("I");
  const carissa = at("C");
  const kimberly = at("K");
  const donna = at("D");
  const virgil = at("V");
  const ezra = at("E");
  const otherElevator = ELEVATORS.find((key) => key !== areaOfId("E"));
  return (
    onlyAmong(c, "A", ["A", "I"]) &&
    onlyAmong(c, "J", ["J"]) &&
    (andy === undefined ||
      can(
        options,
        "I",
        (cell) => c.areaOf(cell) === c.areaOf(andy) && cell.row > andy.row,
      )) &&
    (iliana === undefined ||
      can(
        options,
        "A",
        (cell) => c.areaOf(cell) === c.areaOf(iliana) && cell.row < iliana.row,
      )) &&
    (areaOfId("H") === null ||
      can(options, "B", (cell) => c.areaOf(cell) === areaOfId("H"))) &&
    (areaOfId("B") === null ||
      can(options, "H", (cell) => c.areaOf(cell) === areaOfId("B"))) &&
    (virgil === undefined ||
      (c.peopleIn(c.areaOf(virgil) ?? "").length <= PAIR &&
        options.some(
          (option) =>
            option.id !== "V" && c.areaOf(option.cell) === c.areaOf(virgil),
        ))) &&
    (carissa === undefined ||
      can(
        options,
        null,
        (cell) => cell.col === carissa.col - CAR_OFFSET && c.is(cell, "car"),
      )) &&
    (kimberly === undefined ||
      can(
        options,
        null,
        (cell) =>
          cell.row === kimberly.row - STATUE_OFFSET && c.beside(cell, "statue"),
      )) &&
    (donna === undefined ||
      bordering(c, donna).some((area) => c.peopleIn(area).length === 0)) &&
    (ezra === undefined ||
      options.some(
        (option) =>
          c.has(option.id, "woman") && c.areaOf(option.cell) === otherElevator,
      ))
  );
}

/**
 * For the solver only: whether a partial placement can still be finished -
 * the clues that need other people can still hold, and the free rows and
 * columns can be shared out among the people not yet placed.
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
  const options: readonly Option[] = [
    ...placed.map((id, index) => ({
      id,
      cell: taken[index] ?? { row: -1, col: -1 },
    })),
    ...waiting.flatMap((id, index) =>
      (free[index] ?? []).map((cell) => ({ id, cell })),
    ),
  ];
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

/** The side length of the square map. */
const SIZE = 12;

/**
 * Every field of a row or a column but one, for the hints that block a line.
 *
 * @param line - whether it is a row or a column
 * @param index - the line, from nought
 * @param keep - the one field on it left open, from nought
 * @returns the fields
 */
function lineExcept(
  line: "row" | "col",
  index: number,
  keep: number,
): readonly Cell[] {
  return Array.from({ length: SIZE }, (_, at) => at)
    .filter((at) => at !== keep)
    .map((at) =>
      line === "row" ? { row: index, col: at } : { row: at, col: index },
    );
}

/** The case. */
export const MAIN_STREET: Level = {
  id: "main-street",
  name: "Hauptstraße",
  difficulty: "expert",
  story:
    "Virgil wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "A",
      name: "Aufzug A",
      at: "in Aufzug A",
      ground: "floor",
      tint: "#f8d9b8",
      label: { row: 1, col: 0 },
    },
    {
      key: "B",
      name: "Brunnen",
      at: "im Brunnen",
      ground: "water",
      tint: "#8fdcef",
      label: { row: 1, col: 3 },
    },
    {
      key: "N",
      name: "Nordturm",
      at: "im Nordturm",
      ground: "floor",
      tint: "#fdf6e8",
      label: { row: 3, col: 3 },
    },
    {
      key: "G",
      name: "Gehweg Nord",
      at: "auf dem Gehweg Nord",
      ground: "stone",
      tint: "#b9c3c9",
      label: { row: 4, col: 3 },
    },
    {
      key: "S",
      name: "Straße",
      at: "auf der Straße",
      ground: "stone",
      tint: "#6e8a92",
      label: { row: 6, col: 5 },
    },
    {
      key: "W",
      name: "Gehweg Süd",
      at: "auf dem Gehweg Süd",
      ground: "stone",
      tint: "#c3ccd1",
      label: { row: 11, col: 5 },
    },
    {
      key: "P",
      name: "Park",
      at: "im Park",
      ground: "grass",
      tint: "#7fd88f",
      label: { row: 11, col: 2 },
    },
    {
      key: "T",
      name: "Südturm",
      at: "im Südturm",
      ground: "floor",
      tint: "#b2e8e6",
      label: { row: 11, col: 7 },
    },
    {
      key: "Z",
      name: "Aufzug B",
      at: "in Aufzug B",
      ground: "floor",
      tint: "#8fc4c8",
      label: { row: 11, col: 10 },
    },
  ],
  areaMap: [
    "AAABBBNNNGSS",
    "AAABBBNNNGSS",
    "NNNNNNNNNGSS",
    "NNNNNNNNNGSS",
    "GGGGGGGGGGSS",
    "SSSSSSSSSSSS",
    "SSSSSSSSSSSS",
    "WWWWWWWWWWWW",
    "PPPPPWTTTTTT",
    "PPPPPWTTTTTT",
    "PPPPPWTTTTZZ",
    "PPPPPWTTTTZZ",
  ],
  thingMap: [
    ".p..s.p..b..",
    "......h.h..k",
    ".....ttttk..",
    ".........k..",
    ".....kb...kk",
    ".k.cc..uuu..",
    "cc....cc.cc.",
    ".....b......",
    "...r.......p",
    ".rs...tt....",
    "......ph..p.",
    ".hhp........",
  ],
  things: {
    p: "plant",
    s: "statue",
    b: "bin",
    h: "chair",
    t: "table",
    k: "cone",
    c: "car",
    u: "bus",
    r: "tree",
  },
  extraThings: {
    bus: { name: "Bus", emoji: "\u{1F68C}", standable: true },
    cone: { name: "Leitkegel", emoji: "\u{1F6A7}", standable: false },
    bin: { name: "Mülleimer", emoji: "\u{1F5D1}️", standable: false },
  },
  suspects: [
    {
      id: "A",
      name: "Andy",
      pronoun: "er",
      clue: {
        text: "Er war allein mit Iliana. Er war nördlich von ihr.",
        ...all(
          counting((c) => {
            const people = c.peopleIn(c.areaOf(c.cell) ?? "");
            return people.length === PAIR && people.includes("I");
          }),
          about(["I"], (c) => {
            const iliana = c.cellOf("I");
            return iliana !== undefined && c.cell.row < iliana.row;
          }),
        ),
      },
      colour: "#b91c1c",
      face: "\u{1F9D4}",
    },
    {
      id: "B",
      name: "Briggs",
      pronoun: "er",
      clue: { text: "Er saß auf einem Stuhl.", ...on("seat") },
      colour: "#15803d",
      face: "\u{1F468}",
    },
    {
      id: "C",
      name: "Carissa",
      pronoun: "sie",
      clue: {
        text: "Genau drei Spalten westlich von ihr war jemand in einem Auto.",
        ...all(
          own(
            (c) =>
              c.cell.col >= CAR_OFFSET &&
              columnHasCar(c, c.cell.col - CAR_OFFSET),
          ),
          counting((c) =>
            somebodyWhere(
              c,
              (there) =>
                there.col === c.cell.col - CAR_OFFSET && c.is(there, "car"),
            ),
          ),
        ),
      },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Donna",
      pronoun: "sie",
      clue: {
        text: "Sie war neben der Grenze eines leeren Bereichs.",
        ...all(
          own((c) => bordering(c, c.cell).length > 0),
          counting((c) =>
            bordering(c, c.cell).some((area) => c.peopleIn(area).length === 0),
          ),
        ),
      },
      colour: "#be185d",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "E",
      name: "Ezra",
      pronoun: "sie",
      clue: {
        text: "Sie war in einem Aufzug. Im anderen Aufzug war eine Frau.",
        ...all(
          inArea(...ELEVATORS),
          counting((c) => {
            const other = ELEVATORS.find((key) => key !== c.areaOf(c.cell));
            return c.peopleIn(other ?? "").some((id) => c.has(id, "woman"));
          }),
        ),
      },
      colour: "#6366f1",
      face: "\u{1F469}",
    },
    {
      id: "F",
      name: "Felicia",
      pronoun: "sie",
      clue: {
        text: "Sie war in einem Auto oder im Bus.",
        ...own((c) => c.is(c.cell, "car") || c.is(c.cell, "bus")),
      },
      colour: "#ea580c",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "G",
      name: "Greg",
      pronoun: "er",
      clue: {
        text: "Er war in der ersten oder zweiten Spalte.",
        ...own((c) => c.cell.col <= 1),
      },
      colour: "#4338ca",
      face: "\u{1F9D4}",
    },
    {
      id: "H",
      name: "Hayes",
      pronoun: "er",
      clue: {
        text: "Er war neben einer Topfpflanze. Er war mit Briggs zusammen.",
        ...all(
          beside("plant"),
          about(["B"], (c) => {
            const briggs = c.cellOf("B");
            return (
              briggs !== undefined && c.areaOf(briggs) === c.areaOf(c.cell)
            );
          }),
        ),
      },
      colour: "#0f766e",
      face: "\u{1F468}",
    },
    {
      id: "I",
      name: "Iliana",
      pronoun: "sie",
      clue: {
        text: "Sie war auf einem Gehweg. Sie war östlich von Donna.",
        ...all(
          inArea(...PAVEMENTS),
          about(["D"], (c) => {
            const donna = c.cellOf("D");
            return donna !== undefined && c.cell.col > donna.col;
          }),
        ),
      },
      colour: "#7c3aed",
      face: "\u{1F469}",
    },
    {
      id: "J",
      name: "Jimmy",
      pronoun: "er",
      clue: {
        text: "Er war allein auf einem Gehweg.",
        ...all(inArea(...PAVEMENTS), alone()),
      },
      colour: "#334155",
      face: "\u{1F9D4}",
    },
    {
      id: "K",
      name: "Kimberly",
      pronoun: "sie",
      clue: {
        text: "Zwei Reihen nördlich von ihr war jemand neben einer Statue.",
        ...all(
          own((c) => c.cell.row >= STATUE_OFFSET),
          counting((c) =>
            somebodyWhere(
              c,
              (there) =>
                there.row === c.cell.row - STATUE_OFFSET &&
                c.beside(there, "statue"),
            ),
          ),
        ),
      },
      colour: "#65a30d",
      face: "\u{1F475}",
    },
    {
      id: "V",
      name: "Virgil",
      pronoun: "er",
      clue: {
        text: "Er war allein mit dem Mörder.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F468}",
    },
  ],
  prune: stillPossible,
  hints: [
    {
      text: "H+B können nicht im Park sein, sonst würden sie Aufzug (B) blockieren. H+B können auch nicht im Nordturm sein, sonst würden sie Aufzug (A) blockieren. Sie müssen im Südturm sein, das isoliert B auf dem einzigen Stuhl im Südturm.",
      place: { B: { row: 10, col: 7 } },
    },
    {
      text: "Das setzt die Frau in Aufzug (B) in Reihe 12. Das setzt H und die unbekannte Frau in C11-C12, in beliebiger Reihenfolge.",
    },
    {
      text: "Jemand muss im Nordturm in R4 sein, dieser Bereich kann nicht leer sein. D kann nicht auf einem Gehweg sein: Ein Gehweg ist von A+I besetzt, die allein zusammen sind, der andere von J, der ebenfalls allein ist. Der einzige Bereich, in dem D sein könnte, ist der Nordturm oder Aufzug A, neben einem leeren Brunnen.",
    },
    {
      text: "K ist zwei Reihen südlich von jemandem neben einer Statue, und die Person neben der Statue muss jetzt im Park sein. Das setzt K in R12. Das isoliert jemanden neben der Statue in R10 C4, was H isoliert, dann K.",
      place: { H: { row: 8, col: 10 }, K: { row: 11, col: 11 } },
    },
    {
      text: "A+I passen jetzt nicht mehr beide auf den Gehweg Süd, sie müssen auf dem Gehweg Nord sein. A, der nördlich von I ist, muss dann in R2 C10 sein, I in R5, J in R8.",
      place: { A: { row: 1, col: 9 } },
    },
    {
      text: "Da K in Aufzug B ist, muss E in Aufzug A sein, in R1. Das isoliert D auf dem letzten Feld neben dem Bereich des Brunnens.",
      place: { D: { row: 2, col: 4 } },
    },
    {
      text: "C ist die einzige Person, die in R10C4 passt. Das isoliert jemanden im Auto in R7 C1 und blockiert den Rest von R7 und C1. Das isoliert E.",
      place: { C: { row: 9, col: 3 }, E: { row: 0, col: 2 } },
      cross: [...lineExcept("row", 6, 0), ...lineExcept("col", 0, 6)],
    },
    {
      text: "Das isoliert I auf dem letzten Feld auf dem Gehweg Nord östlich von D. Für F ist nur ein Feld verfügbar, in R7 C1, was G auf dem letzten verfügbaren Feld in C2 isoliert.",
      place: {
        I: { row: 4, col: 8 },
        F: { row: 6, col: 0 },
        G: { row: 3, col: 1 },
      },
    },
    {
      text: "Das isoliert J und V auf dem letzten verbleibenden Feld. V war allein mit F, Felicia ist die Mörderin!",
      place: { J: { row: 7, col: 6 }, V: { row: 5, col: 5 } },
    },
  ],
  solution: {
    A: { row: 1, col: 9 },
    B: { row: 10, col: 7 },
    C: { row: 9, col: 3 },
    D: { row: 2, col: 4 },
    E: { row: 0, col: 2 },
    F: { row: 6, col: 0 },
    G: { row: 3, col: 1 },
    H: { row: 8, col: 10 },
    I: { row: 4, col: 8 },
    J: { row: 7, col: 6 },
    K: { row: 11, col: 11 },
    V: { row: 5, col: 5 },
  },
};
