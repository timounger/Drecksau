/**
 * Der Nil: the temple, the altar, the west and east meadows, the house, the
 * jetty, the Nile, the field and the marsh, with a murdered woman.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/73. El Nino.png` -
 * the page itself is titled "El Nilo"; Spanish edition, no solution sheet -
 * the solved grid and the culprit are pencilled in on the photographed
 * page, and the solver proves it is the only solution). Vekhet is the
 * victim; whoever was alone with her killed her.
 *
 * The map is ten columns by twelve rows, with ten people: every column has
 * somebody in it, two rows stay empty. The rule under the cards says two
 * crocodiles lay in an empty row - read as: exactly two of the crocodiles
 * lay in rows nobody stood in ({@link CROCODILES}). Some fields carry a
 * hieroglyph: whoever stood on Anubis was alone in the area, whoever stood
 * on Ra was not. West of the Nile is west of every field of the river, in
 * the first three columns. The bed can be stood on; crocodiles, palms,
 * shrubs, baskets, the table, the statue and the obelisk cannot.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  beside,
  cellsWhere,
  counting,
  inArea,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Cell, Context, Level, Rule } from "../engine/types";

/** The crocodiles in rows nobody stood in: exactly two. */
const CROCODILES: Rule = {
  text: "Zwei der Krokodile lagen in Zeilen, in denen niemand stand.",
  check: (c) =>
    cellsWhere(c.level, (cell) => c.is(cell, "crocodile")).filter(
      (cell) => !c.people().some((id) => c.cellOf(id)?.row === cell.row),
    ).length === 2,
};

/** The rules of the case: the two hieroglyphs and the crocodiles. */
const RULES: readonly Rule[] = [
  {
    text: "Wer auf einer Anubis-Hieroglyphe stand, war allein in seinem Bereich.",
    check: (c) => everyOn(c, "anubis", (count) => count === 1),
  },
  {
    text: "Wer auf einer Ra-Hieroglyphe stand, war nicht allein in seinem Bereich.",
    check: (c) => everyOn(c, "ra", (count) => count > 1),
  },
  CROCODILES,
];

/** The case. */
export const THE_NILE: Level = {
  id: "the-nile",
  name: "Der Nil",
  series: { book: "timeTravel", number: 73 },
  story: "Dass es so endet, hätte sich das Opfer nie im Nil träumen lassen.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "T",
      name: "Tempel",
      at: "im Tempel",
      ground: "stone",
      tint: "#f3e6bf",
      label: { row: 2, col: 1 },
    },
    {
      key: "A",
      name: "Altar",
      at: "am Altar",
      ground: "stone",
      tint: "#ddd0ee",
      label: { row: 1, col: 9 },
      labelEnd: true,
    },
    {
      key: "W",
      name: "Westaue",
      at: "auf der Westaue",
      ground: "grass",
      tint: "#d3e6b8",
      label: { row: 6, col: 1 },
    },
    {
      key: "O",
      name: "Ostaue",
      at: "auf der Ostaue",
      ground: "grass",
      tint: "#c6e2cf",
      label: { row: 3, col: 6 },
    },
    {
      key: "H",
      name: "Haus",
      at: "im Haus",
      ground: "floor",
      tint: "#f2d6d0",
      label: { row: 8, col: 1 },
    },
    {
      key: "J",
      name: "Anleger",
      at: "am Anleger",
      ground: "floor",
      tint: "#e2cdb8",
      label: { row: 7, col: 6 },
    },
    {
      key: "N",
      name: "Nil",
      at: "im Nil",
      ground: "water",
      label: { row: 11, col: 3 },
    },
    {
      key: "F",
      name: "Feld",
      at: "auf dem Feld",
      ground: "sand",
      tint: "#f3e3a6",
      label: { row: 11, col: 0 },
    },
    {
      key: "S",
      name: "Sumpf",
      at: "im Sumpf",
      ground: "water",
      tint: "#b4d3e6",
      label: { row: 11, col: 6 },
    },
  ],
  areaMap: [
    "TTTNNOOOAA",
    "TTTNNOOOAA",
    "TTTNNNOOOO",
    "TWWWNNOOOO",
    "WWWWNJJJOO",
    "WWWWNNNJOO",
    "WWWWWNNJOO",
    "WHHHWNJJOO",
    "FHHHNNJSOO",
    "FFFNNNSSSS",
    "FFFNNSSSSS",
    "FFFNNSSSSS",
  ],
  thingMap: [
    ".ra..l..oa",
    "...k......",
    "x....k..l.",
    "r.........",
    "...s...b..",
    "...a......",
    "as........",
    "..et......",
    "r.eak....l",
    "rar.......",
    "rbr....b.s",
    "rar...s...",
  ],
  things: {
    a: "anubis",
    b: "basket",
    e: "bed",
    k: "crocodile",
    l: "palm",
    o: "obelisk",
    r: "ra",
    s: "shrub",
    t: "table",
    x: "statue",
  },
  extraThings: {
    obelisk: { name: "Obelisk", emoji: "\u{1F5FC}", standable: false },
  },
  pieces: [{ at: { row: 7, col: 2 }, rows: 2, cols: 1 }],
  suspects: [
    {
      id: "A",
      name: "Amenia",
      pronoun: "sie",
      clue: {
        text: "In ihrer Zeile lag ein Krokodil.",
        ...own((c) =>
          cellsWhere(c.level, (cell) => c.is(cell, "crocodile")).some(
            (cell) => cell.row === c.cell.row,
          ),
        ),
        glow: (level) =>
          cellsWhere(level, (cell) => crocodileRows(level).includes(cell.row)),
      },
      colour: "#be185d",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Baufra",
      pronoun: "er",
      clue: { text: "Er war neben einem Krokodil.", ...beside("crocodile") },
      colour: "#4338ca",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Cheops",
      pronoun: "er",
      clue: { text: "Er war im Sumpf.", ...inArea("S") },
      colour: "#57534e",
      face: "\u{1F474}",
    },
    {
      id: "D",
      name: "Djehuti",
      pronoun: "er",
      clue: { text: "Er war im Tempel.", ...inArea("T") },
      colour: "#a16207",
      face: "\u{1F468}\u{1F3FE}",
    },
    {
      id: "E",
      name: "Eban",
      pronoun: "er",
      clue: { text: "Er war neben einem Baum.", ...beside("tree") },
      colour: "#15803d",
      face: "\u{1F468}\u{1F3FF}‍\u{1F9B1}",
    },
    {
      id: "F",
      name: "Fenti",
      pronoun: "er",
      clue: { text: "Er war auf dem Feld.", ...inArea("F") },
      colour: "#ea580c",
      face: "\u{1F468}",
    },
    {
      id: "G",
      name: "Gahra",
      pronoun: "sie",
      clue: {
        text: "Sie stand auf einer Anubis-Hieroglyphe.",
        ...on("anubis"),
      },
      colour: "#7c3aed",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "H",
      name: "Hapu",
      pronoun: "er",
      clue: {
        text: "Er war allein mit Amenia.",
        ...counting((c) => {
          const others = c
            .peopleIn(c.areaOf(c.cell) ?? "")
            .filter((id) => id !== c.self);
          return others.length === 1 && others[0] === "A";
        }),
      },
      colour: "#0e7490",
      face: "\u{1F473}",
    },
    {
      id: "I",
      name: "Itet",
      pronoun: "sie",
      clue: {
        text: "Sie war westlich des Nils.",
        ...own((c) =>
          c.cellsOf("N").every((cell: Cell) => c.cell.col < cell.col),
        ),
        glow: (level) => cellsWhere(level, (cell) => cell.col < 3),
      },
      colour: "#b91c1c",
      face: "\u{1F469}\u{1F3FD}",
    },
    {
      id: "V",
      name: "Vekhet",
      pronoun: "sie",
      clue: {
        text: "Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#334155",
      face: "\u{1F9D5}",
    },
  ],
  rules: RULES,
  prune: stillPossible,
  hints: [
    {
      text: "Die Krokodile liegen in den Zeilen 2, 3 und 9. Zehn Personen in zwölf Zeilen lassen genau zwei Zeilen leer, und zwei Krokodile liegen in leeren Zeilen: Beide leeren Zeilen sind Krokodilzeilen. In den drei Krokodilzeilen steht also genau eine Person - Amenia, die ein Krokodil in ihrer Zeile hat. Alle anderen Zeilen sind belegt.",
    },
    {
      text: "Tempel und Feld liegen in den Spalten 1 bis 3, und Itet steht westlich des Nils, also auch dort: Djehuti, Fenti und Itet füllen die Spalten 1 bis 3, alle anderen stehen weiter östlich.",
    },
    {
      text: "Baufra steht neben einem Krokodil, aber nicht in einer Krokodilzeile: auf R1C4, R4C6 oder R10C5 - immer im Nil. Eban steht neben einer Palme: R1C7, R4C9 oder R8C10 - immer auf der Ostaue. Cheops ist im Sumpf. Hapu ist mit Amenia allein, also steht sie in keinem dieser Bereiche. Am Altar fände Hapu kein Feld außerhalb ihrer Zeile, und R9C4 im Haus ist ein Anubis-Feld. Amenia steht in R9C7 am Anleger, Hapu ebenfalls am Anleger. Die Zeilen 2 und 3 bleiben leer.",
      place: { A: { row: 8, col: 6 } },
    },
    {
      text: "Gahra steht allein auf einer Anubis-Hieroglyphe außerhalb der Spalten 1 bis 3 und der Zeile 9: R1C10 oder R6C4. Auf R1C10 bliebe Eban nur R4C9 (R1C7 liegt in Amenias Spalte, R8C10 in Gahras) - und Djehuti, der im Tempel nur noch Zeile 1 oder 4 hat, fände keine Zeile. Gahra steht in R6C4, allein auf der Westaue.",
      place: { G: { row: 5, col: 3 } },
    },
    {
      text: "Für die Zeilen 5, 7 und 8 bleiben nur Hapu (R5C6, R7C8, R8C8), Voser, Itet und Eban - die beiden letzten nur in Zeile 8 (Itet im Haus, Eban auf R8C10), denn auf die Westaue darf niemand zu Gahra. Hapu und Voser stehen also in Zeile 5 und 7, Zeile 8 gehört Itet oder Eban.",
    },
    {
      text: "Eban steht nicht auf R8C10. Sonst stünde Itet im Tempel oder auf dem Feld, wo jedes Feld eine Hieroglyphe ist. Mit Itet auf dem Feld stünden sie und Fenti auf Ra-Feldern in Spalte 1 und 3, Baufra in R4C6 und Djehuti allein im Tempel auf R1C2 - einem Ra-Feld. Mit Itet im Tempel stünde Fenti allein auf dem Feld, also auf einem Anubis-Feld in Spalte 2, Djehuti und Itet auf R4C1 und R1C3 - einem Anubis-Feld, und das zu zweit. Also steht Eban in R4C9, Itet im Haus in Zeile 8, Djehuti in Zeile 1 und Baufra in R10C5.",
      place: { E: { row: 3, col: 8 }, B: { row: 9, col: 4 } },
    },
    {
      text: "Zu Fenti kann niemand mehr aufs Feld: Er steht allein auf einem Anubis-Feld, R12C2 (Zeile 10 ist Baufras). Damit steht Itet in R8C3 und Djehuti in R1C1. Cheops bleibt im Sumpf nur Zeile 11: R11C6. Hapu steht in R7C8, Voser in R5C10 - auf der Ostaue allein mit Eban. Eban ist der Mörder!",
      place: {
        F: { row: 11, col: 1 },
        I: { row: 7, col: 2 },
        D: { row: 0, col: 0 },
        C: { row: 10, col: 5 },
        H: { row: 6, col: 7 },
        V: { row: 4, col: 9 },
      },
    },
  ],
  solution: {
    A: { row: 8, col: 6 },
    B: { row: 9, col: 4 },
    C: { row: 10, col: 5 },
    D: { row: 0, col: 0 },
    E: { row: 3, col: 8 },
    F: { row: 11, col: 1 },
    G: { row: 5, col: 3 },
    H: { row: 6, col: 7 },
    I: { row: 7, col: 2 },
    V: { row: 4, col: 9 },
  },
};

/** The rows with a crocodile in them. */
function crocodileRows(level: Level): readonly number[] {
  return cellsWhere(level, (cell) => {
    const key = level.thingMap[cell.row]?.[cell.col] ?? ".";
    return level.things[key] === "crocodile";
  }).map((cell) => cell.row);
}

/** Whether the head count of the area holds for everybody on a thing of this id. */
function everyOn(
  c: Context,
  thing: string,
  test: (count: number) => boolean,
): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return (
      there === undefined ||
      !c.is(there, thing) ||
      test(c.peopleIn(c.areaOf(there) ?? "").length)
    );
  });
}

/**
 * For the solver: whether a partial placement can still be finished.
 * Whoever stands on Anubis stays alone, Vekhet's area never holds more than
 * two, and with ten people in twelve rows the two empty rows are both rows
 * with a crocodile - so all but two of those rows hold nobody else.
 */
function stillPossible(c: Context): boolean {
  const rows = crocodileRows(c.level);
  const inCrocodileRows = c
    .people()
    .filter((id) => rows.includes(c.cellOf(id)?.row ?? -1)).length;
  return (
    inCrocodileRows <= rows.length - 2 &&
    c.people().every((id) => {
      const there = c.cellOf(id);
      const count =
        there === undefined ? 0 : c.peopleIn(c.areaOf(there) ?? "").length;
      return (
        there === undefined ||
        ((!c.is(there, "anubis") || count === 1) && (id !== "V" || count <= 2))
      );
    })
  );
}
