/**
 * Mitternachtszug: four sleeping compartments and the corridor of a night
 * train, with a murdered passenger.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/42. Mitternachtszug.png`,
 * solution sheet `Lösungen 1-80/Lösung 41-44.JPG`).
 * Olive is the victim; whoever was alone with her killed her.
 *
 * The map has six rows and ten columns, so four columns stay empty. The
 * armchairs are the chairs; they, the beds and the rugs can be stood on. The
 * dark luggage tables and the plants cannot; the plain grey tiles are floor.
 * A bed directly north or south of Claire is the bed field right above or
 * right below her, in her compartment.
 */
import {
  about,
  all,
  beside,
  cellsWhere,
  counting,
  inArea,
  on,
  own,
  victim,
} from "../engine/clues";
import { areaAt, thingAt } from "../engine/rules";
import type { Cell, Context, Level } from "../engine/types";

/** Whether a field has a bed right above or right below it, in its area. */
function bedNorthOrSouth(
  areaOf: (cell: Cell) => string | null,
  isBed: (cell: Cell) => boolean,
  cell: Cell,
): boolean {
  return [cell.row - 1, cell.row + 1].some((row) => {
    const there = { row, col: cell.col };
    return areaOf(there) === areaOf(cell) && isBed(there);
  });
}

/** Whether nobody but the suspect stands on a thing of this id or kind. */
function onlyOneOn(c: Context, what: string): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return id === c.self || there === undefined || !c.is(there, what);
  });
}

/** How many people stand on a bed. */
function onBeds(c: Context): number {
  return c.people().filter((id) => {
    const there = c.cellOf(id);
    return there !== undefined && c.is(there, "bed");
  }).length;
}

/** The case. */
export const MIDNIGHT_TRAIN: Level = {
  id: "midnight-train",
  name: "Mitternachtszug",
  series: { book: "original", number: 42 },
  story: "Die Sache ist ein bisschen entgleist.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "A",
      name: "Schlafabteil A",
      at: "in Schlafabteil A",
      ground: "floor",
      tint: "#d9d6e0",
      label: { row: 1, col: 0 },
    },
    {
      key: "B",
      name: "Schlafabteil B",
      at: "in Schlafabteil B",
      ground: "floor",
      tint: "#d4d6df",
      label: { row: 1, col: 5 },
    },
    {
      key: "F",
      name: "Flur",
      at: "im Flur",
      ground: "floor",
      tint: "#e9e4dc",
      label: { row: 3, col: 4 },
    },
    {
      key: "C",
      name: "Schlafabteil C",
      at: "in Schlafabteil C",
      ground: "floor",
      tint: "#d6d9df",
      label: { row: 5, col: 1 },
    },
    {
      key: "D",
      name: "Schlafabteil D",
      at: "in Schlafabteil D",
      ground: "floor",
      tint: "#dad6df",
      label: { row: 5, col: 7 },
    },
  ],
  areaMap: [
    ".AAABBBBB.",
    "AAAABBBBBB",
    "FFFFFFFFFF",
    "FFFFFFFFFF",
    "CCCCCCCDDD",
    ".CCCCCCDD.",
  ],
  thingMap: [
    ".bb.bb.bb.",
    "rrr.rrrc..",
    "rtrtrr..rt",
    "r.r.rr.prt",
    "prrc.p..t.",
    "..bb.bbbb.",
  ],
  things: {
    b: "bed",
    c: "chair",
    p: "plant",
    r: "rug",
    t: "table",
  },
  pieces: [
    { at: { row: 0, col: 1 }, rows: 1, cols: 2 },
    { at: { row: 0, col: 4 }, rows: 1, cols: 2 },
    { at: { row: 0, col: 7 }, rows: 1, cols: 2 },
    { at: { row: 1, col: 0 }, rows: 1, cols: 3 },
    { at: { row: 1, col: 4 }, rows: 1, cols: 3 },
    { at: { row: 2, col: 0 }, rows: 2, cols: 1 },
    { at: { row: 2, col: 2 }, rows: 2, cols: 1 },
    { at: { row: 2, col: 4 }, rows: 2, cols: 2 },
    { at: { row: 2, col: 8 }, rows: 2, cols: 1 },
    { at: { row: 2, col: 9 }, rows: 2, cols: 1 },
    { at: { row: 4, col: 1 }, rows: 1, cols: 2 },
    { at: { row: 5, col: 2 }, rows: 1, cols: 2 },
    { at: { row: 5, col: 5 }, rows: 1, cols: 2 },
    { at: { row: 5, col: 7 }, rows: 1, cols: 2 },
  ],
  suspects: [
    {
      id: "A",
      name: "Anastasia",
      pronoun: "sie",
      clue: {
        text: "Sie war in Schlafabteil A oder in Schlafabteil D.",
        ...inArea("A", "D"),
      },
      colour: "#b91c1c",
      face: "\u{1F475}",
    },
    {
      id: "B",
      name: "Boris",
      pronoun: "er",
      clue: {
        text: "Er war neben einer Pflanze. Er war westlich von Emil.",
        ...all(
          beside("plant"),
          about(["E"], (c) => {
            const emil = c.cellOf("E");
            return emil !== undefined && c.cell.col < emil.col;
          }),
        ),
      },
      colour: "#15803d",
      face: "\u{1F474}",
    },
    {
      id: "C",
      name: "Claire",
      pronoun: "sie",
      clue: {
        text: "Sie war neben einem Bett, direkt nördlich oder südlich davon.",
        ...own((c) =>
          bedNorthOrSouth(c.areaOf, (cell) => c.is(cell, "bed"), c.cell),
        ),
        glow: (level) =>
          cellsWhere(level, (cell) =>
            bedNorthOrSouth(
              (one) => areaAt(level, one)?.key ?? null,
              (one) => thingAt(level, one) === "bed",
              cell,
            ),
          ),
      },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "David",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person auf einem Stuhl.",
        ...all(
          on("chair"),
          counting((c) => onlyOneOn(c, "chair")),
        ),
      },
      colour: "#6366f1",
      face: "\u{1F468}",
    },
    {
      id: "E",
      name: "Emil",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person auf einem Teppich.",
        ...all(
          on("rug"),
          counting((c) => onlyOneOn(c, "rug")),
        ),
      },
      colour: "#7c3aed",
      face: "\u{1F9D4}",
    },
    {
      id: "O",
      name: "Olive",
      pronoun: "sie",
      clue: {
        text: "Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F469}‍\u{1F9B0}",
    },
  ],
  rules: [
    {
      text: "Genau eine Person war auf einem Bett.",
      check: (c) => onBeds(c) === 1,
    },
    {
      note: true,
      text: "Detektiv, du wirst bemerken, dass dieser Tatort sechs Zeilen und zehn Spalten hat, was bedeutet, dass vier Spalten leer sein werden. - Chief Williams",
    },
  ],
  hints: [
    {
      text: "David ist auf einem der beiden Stühle. Die beiden sich überschneidenden Felder können ausgeschlossen werden.",
      cross: [
        { row: 1, col: 3 },
        { row: 4, col: 7 },
      ],
    },
    {
      text: "Z2 und Z5 sind von Claire und David in irgendeiner Reihenfolge besetzt. Boris ist entweder in S6, S7, S8 oder S9.",
    },
    { text: "Emil ist östlich von Boris. Er kann nur in S9 sein." },
    {
      text: "Das eliminiert das einzige Feld in Z2, das Claire hätte besetzen können (da nur Emil auf einem Teppich ist), was David in Z2 und Claire in Z5 lokalisiert.",
      place: { D: { row: 1, col: 7 }, C: { row: 4, col: 6 } },
    },
    {
      text: "Das lokalisiert Boris in Z6 S6, auf einem Bett. Laut dem allgemeinen Hinweis können alle anderen Bettfelder ausgeschlossen werden.",
      place: { B: { row: 5, col: 5 } },
    },
    {
      text: "Das lokalisiert Anastasia in Z1 und lokalisiert auch Emil in Z3 (da alle verbleibenden Felder in Z3 Teppich haben, kann niemand sonst sie besetzen).",
      place: { A: { row: 0, col: 3 }, E: { row: 2, col: 8 } },
    },
    {
      text: "Das lokalisiert Olive. Emil ist der Mörder!",
      place: { O: { row: 3, col: 1 } },
    },
  ],
  solution: {
    A: { row: 0, col: 3 },
    B: { row: 5, col: 5 },
    C: { row: 4, col: 6 },
    D: { row: 1, col: 7 },
    E: { row: 2, col: 8 },
    O: { row: 3, col: 1 },
  },
};
