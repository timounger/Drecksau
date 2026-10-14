/**
 * Lawine: a mountain from the summit down to the base camp, with a murdered
 * climber.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/73. Lawine.JPG`, solution
 * sheet `Lösungen 1-80/Lösung 73-76.JPG`).
 * Oddvar is the victim; whoever was alone with him killed him.
 *
 * The map is shaped like the mountain: ten rows and nine columns, with
 * fields off the map left and right of the top. Nine people on ten rows -
 * one row stays empty. The armchairs are the chairs; they and the beds can
 * be stood on. The boulders, the crate and the bedside table cannot. Higher
 * on the mountain means in a row further up.
 */
import {
  about,
  all,
  beside,
  counting,
  inArea,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** How many rows Brigitte was above Dieter. */
const ROWS_ABOVE_DIETER = 5;

/** How many columns Gloria was west of the person on the summit. */
const COLUMNS_WEST = 4;

/** The rows of everybody else with a trait. */
function rowsOf(c: Context, trait: string): readonly number[] {
  return c.people().flatMap((id) => {
    const there = c.cellOf(id);
    return id !== c.self && there !== undefined && c.has(id, trait)
      ? [there.row]
      : [];
  });
}

/** Whether the suspect was higher than everybody else with a trait. */
function highestOf(trait: string): (c: Context) => boolean {
  return (c: Context): boolean =>
    rowsOf(c, trait).every((row) => row > c.cell.row);
}

/** Whether nobody stood in the row right below the suspect. */
function rowBelowEmpty(c: Context): boolean {
  return c.people().every((id) => c.cellOf(id)?.row !== c.cell.row + 1);
}

/** Whether somebody stood on the summit, this many columns off the suspect. */
function summitColumnsOff(offset: number): (c: Context) => boolean {
  return (c: Context): boolean =>
    c.peopleIn("T").some((id) => c.cellOf(id)?.col === c.cell.col + offset);
}

/** Whether the summit has a field in the column this many columns off the suspect. */
function summitColumnFits(offset: number): (c: Context) => boolean {
  return (c: Context): boolean =>
    c.cellsOf("T").some((cell) => cell.col === c.cell.col + offset);
}

/** Whether nobody but the suspect stood on a thing of this id. */
function onlyOneOn(what: string): (c: Context) => boolean {
  return (c: Context): boolean =>
    c.people().every((id) => {
      const there = c.cellOf(id);
      return id === c.self || there === undefined || !c.is(there, what);
    });
}

/** Whether Brigitte stood exactly five rows above the suspect. */
function brigitteFiveAbove(c: Context): boolean {
  return c.cellOf("B")?.row === c.cell.row - ROWS_ABOVE_DIETER;
}

/** Whether exactly one person sat on a chair. */
function oneOnAChair(c: Context): boolean {
  return (
    c.people().filter((id) => {
      const there = c.cellOf(id);
      return there !== undefined && c.is(there, "chair");
    }).length === 1
  );
}

/** A context for a placed suspect's own clue, or undefined while unplaced. */
function as(c: Context, id: string): Context | undefined {
  const there = c.cellOf(id);
  return there === undefined ? undefined : { ...c, self: id, cell: there };
}

/**
 * For the solver: whatever the clues of Albrecht, Brigitte, Chanel, Hardin
 * and Oddvar already rule out among the people placed so far.
 */
function stillPossible(c: Context): boolean {
  const albrecht = as(c, "A");
  const brigitte = as(c, "B");
  const hardin = as(c, "H");
  const oddvar = c.cellOf("O");
  return (
    (albrecht === undefined ||
      (highestOf("man")(albrecht) && rowBelowEmpty(albrecht))) &&
    (brigitte === undefined || highestOf("woman")(brigitte)) &&
    (c.cellOf("C") === undefined || c.peopleIn("H").length <= 1) &&
    (hardin === undefined || onlyOneOn("bed")(hardin)) &&
    (oddvar === undefined || c.peopleIn(c.areaOf(oddvar) ?? "").length <= 2)
  );
}

/** The case. */
export const AVALANCHE: Level = {
  id: "avalanche",
  name: "Lawine",
  series: { book: "original", number: 73 },
  story: "Ich glaube, mit diesem Fall erklimme ich den Gipfel meiner Karriere!",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "T",
      name: "Gipfel",
      at: "auf dem Gipfel",
      ground: "snow",
      tint: "#e8eef6",
      label: { row: 0, col: 3 },
    },
    {
      key: "R",
      name: "Gipfelgrat",
      at: "auf dem Gipfelgrat",
      ground: "snow",
      tint: "#e4ebf4",
      label: { row: 3, col: 4 },
    },
    {
      key: "M",
      name: "Mittellager",
      at: "im Mittellager",
      ground: "floor",
      tint: "#b9d0ec",
      label: { row: 5, col: 2 },
      labelOverhang: true,
    },
    {
      key: "P",
      name: "Gipfelplateau",
      at: "auf dem Gipfelplateau",
      ground: "snow",
      tint: "#e8eef6",
      label: { row: 5, col: 4 },
    },
    {
      key: "W",
      name: "Eiswand",
      at: "an der Eiswand",
      ground: "snow",
      tint: "#dde6f2",
      label: { row: 7, col: 0 },
      labelOverhang: true,
    },
    {
      key: "H",
      name: "Hochebene",
      at: "in der Hochebene",
      ground: "snow",
      tint: "#e4ebf4",
      label: { row: 7, col: 5 },
    },
    {
      key: "B",
      name: "Basislager",
      at: "im Basislager",
      ground: "floor",
      tint: "#b9d0ec",
      label: { row: 9, col: 5 },
    },
  ],
  areaMap: [
    "...TTT...",
    "..RRRRR..",
    "..RRRRR..",
    ".MMMRRPP.",
    ".WMMPPPP.",
    "WWMMPPPPP",
    "WWHHHHHHH",
    "WWHHHHHHH",
    "WHHHBBBBB",
    "WHHBBBBBB",
  ],
  thingMap: [
    ".........",
    "...o.....",
    "..o...o..",
    "..cb.o...",
    ".o.b...o.",
    "o.......o",
    "o......o.",
    ".o.o.....",
    "o....ckbt",
    ".o.bb..bc",
  ],
  things: {
    b: "bed",
    c: "chair",
    k: "crate",
    o: "boulder",
    t: "table",
  },
  pieces: [
    { at: { row: 3, col: 3 }, rows: 2, cols: 1 },
    { at: { row: 8, col: 7 }, rows: 2, cols: 1 },
    { at: { row: 9, col: 3 }, rows: 1, cols: 2 },
  ],
  suspects: [
    {
      id: "A",
      name: "Albrecht",
      pronoun: "er",
      clue: {
        text: "Er war höher auf dem Berg als jeder andere Mann. Die Zeile direkt unter ihm war leer.",
        ...all(counting(highestOf("man")), counting(rowBelowEmpty)),
      },
      colour: "#b91c1c",
      face: "\u{1F474}",
    },
    {
      id: "B",
      name: "Brigitte",
      pronoun: "sie",
      clue: {
        text: "Sie war höher auf dem Berg als jede andere Frau.",
        ...counting(highestOf("woman")),
      },
      colour: "#15803d",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "C",
      name: "Chanel",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person in der Hochebene.",
        ...all(
          inArea("H"),
          counting((c) => c.peopleIn("H").length === 1),
        ),
      },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Dieter",
      pronoun: "er",
      clue: {
        text: "Brigitte war genau fünf Zeilen über ihm.",
        ...about(["B"], brigitteFiveAbove),
      },
      colour: "#4338ca",
      face: "\u{1F468}",
    },
    {
      id: "E",
      name: "Eberhard",
      pronoun: "er",
      clue: {
        text: "Er war eine Spalte östlich von der Person auf dem Gipfel.",
        ...all(own(summitColumnFits(-1)), counting(summitColumnsOff(-1))),
      },
      colour: "#6d28d9",
      face: "\u{1F9D4}",
    },
    {
      id: "F",
      name: "Fern",
      pronoun: "sie",
      clue: {
        text: "Sie war im Basislager neben einer Kiste.",
        ...all(inArea("B"), beside("crate")),
      },
      colour: "#7f1d1d",
      face: "\u{1F469}‍\u{1F9B3}",
    },
    {
      id: "G",
      name: "Gloria",
      pronoun: "sie",
      clue: {
        text: "Sie war vier Spalten westlich von der Person auf dem Gipfel.",
        ...all(
          own(summitColumnFits(COLUMNS_WEST)),
          counting(summitColumnsOff(COLUMNS_WEST)),
        ),
      },
      colour: "#ea580c",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "H",
      name: "Hardin",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person auf einem Bett.",
        ...all(on("bed"), counting(onlyOneOn("bed"))),
      },
      colour: "#1d4ed8",
      face: "\u{1F468}",
    },
    {
      id: "O",
      name: "Oddvar",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#be123c",
      face: "\u{1F9D4}",
    },
  ],
  rules: [
    {
      text: "Genau eine Person saß auf einem Stuhl.",
      check: oneOnAChair,
      prune: stillPossible,
    },
  ],
  hints: [
    {
      text: "Gloria ist vier Spalten westlich der Person auf dem Gipfel, was den Gipfel in S4 ausschließt. Eberhard, eine Spalte östlich des Gipfelkletterers, ist in S6 oder S7.",
      cross: [{ row: 0, col: 3 }],
    },
    {
      text: "Fern, laut Hardins Hinweis nicht auf einem Bett, ist in S6 oder S7 neben der einzigen Kiste. Aber S6 muss entweder von der Person auf dem Gipfel oder Eberhard besetzt sein, was Fern in S7 lokalisiert.",
      place: { F: { row: 9, col: 6 } },
    },
    {
      text: "Das platziert Eberhard in S6, und Albrecht oder Brigitte auf dem Gipfel in S5. Das lokalisiert Gloria in S1.",
    },
    {
      text: "Jemand muss in Z7 S9 sein, was Chanel sein muss. Schließe den Rest der Hochebene aus.",
      place: { C: { row: 6, col: 8 } },
    },
    {
      text: "Da Dieter nicht in Z9 ist (Eberhard ist in S6 und nur Hardin ist auf einem Bett), muss Dieter in Z6 sein mit Brigitte fünf Zeilen darüber in Z1, und Albrecht ist in Z2 mit Z3 leer. Das lokalisiert Albrecht und Brigitte.",
      place: { A: { row: 1, col: 2 }, B: { row: 0, col: 4 } },
    },
    {
      text: "Eberhard muss auf dem letzten verbleibenden Stuhl sein, in Z9 S6. Das lässt nur ein verfügbares Feld in Z5; es ist auf dem Bett, also ist Hardin dort, und Oddvar ist irgendwo in Z4.",
      place: { E: { row: 8, col: 5 }, H: { row: 4, col: 3 } },
    },
    {
      text: "Oddvar kann nicht allein auf dem Gipfelplateau sein, also ist er im Mittellager in Z4 S2, und Dieter ist in Z6 S8. Hardin ist der Mörder!",
      place: {
        O: { row: 3, col: 1 },
        D: { row: 5, col: 7 },
        G: { row: 7, col: 0 },
      },
    },
  ],
  solution: {
    A: { row: 1, col: 2 },
    B: { row: 0, col: 4 },
    C: { row: 6, col: 8 },
    D: { row: 5, col: 7 },
    E: { row: 8, col: 5 },
    F: { row: 9, col: 6 },
    G: { row: 7, col: 0 },
    H: { row: 4, col: 3 },
    O: { row: 3, col: 1 },
  },
};
