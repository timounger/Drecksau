/**
 * Ein Abend in der Oper: an opera house with the gallery, the stalls, two
 * balconies, the orchestra pit, the stage and backstage, and a murdered
 * opera-goer.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/59. Ein Abend in der Oper.JPG`,
 * solution sheet `Lösungen 1-80/Lösung 57-60.JPG`).
 * Osric is the victim; whoever was alone with him killed him.
 *
 * The armchairs are the chairs; they and the U-shaped rug in the orchestra
 * pit can be stood on. The tables, the plants and the crates cannot. The
 * bottom corners of the map, beside the backstage area, are not part of it.
 */
import {
  about,
  all,
  alone,
  column,
  counting,
  inArea,
  not,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** The column Clyde stood in, as printed. */
const CLYDES_COLUMN = 5;

/** How many people sat on chairs. */
const SEATED = 3;

/** What Darren was beside none of. */
const NOT_BESIDE: readonly string[] = ["plant", "chair", "table", "crate"];

/** Whether the suspect stands exactly one row south of Hannah. */
function oneRowSouthOfHannah(c: Context): boolean {
  const hannah = c.cellOf("H");
  return hannah !== undefined && c.cell.row === hannah.row + 1;
}

/** Whether the suspect stands in the top row of their area. */
function topRowOfArea(c: Context): boolean {
  const rows = c.cellsOf(c.areaOf(c.cell) ?? "").map((cell) => cell.row);
  return c.cell.row === Math.min(...rows);
}

/** Whether Darren's field is beside none of the things, and no rug. */
function darrensField(c: Context): boolean {
  return (
    !NOT_BESIDE.some((what) => c.beside(c.cell, what)) && !c.is(c.cell, "rug")
  );
}

/** Whether the suspect stands west of Clyde. */
function westOfClyde(c: Context): boolean {
  const clyde = c.cellOf("C");
  return clyde !== undefined && c.cell.col < clyde.col;
}

/** Whether at least one woman was in the suspect's area. */
function womanInArea(c: Context): boolean {
  return c
    .peopleIn(c.areaOf(c.cell) ?? "")
    .some((id) => id !== c.self && c.has(id, "woman"));
}

/** Whether another woman in the suspect's area sat on a chair. */
function womanSittingInArea(c: Context): boolean {
  return c.peopleIn(c.areaOf(c.cell) ?? "").some((id) => {
    const there = c.cellOf(id);
    return (
      id !== c.self &&
      there !== undefined &&
      c.has(id, "woman") &&
      c.is(there, "chair")
    );
  });
}

/** Whether exactly three people sat on chairs. */
function threeOnChairs(c: Context): boolean {
  return seatedCount(c) === SEATED;
}

/** For the solver: whether no more than three people sit so far. */
function notTooManySeated(c: Context): boolean {
  return seatedCount(c) <= SEATED;
}

/** How many of the placed people sat on chairs. */
function seatedCount(c: Context): number {
  return c.people().filter((id) => {
    const there = c.cellOf(id);
    return there !== undefined && c.is(there, "chair");
  }).length;
}

/** The case. */
export const A_NIGHT_AT_THE_OPERA: Level = {
  id: "a-night-at-the-opera",
  name: "Ein Abend in der Oper",
  series: { book: "original", number: 59 },
  story: "Ich glaube nicht, dass ein Phantom dafür verantwortlich war.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "G",
      name: "Galerie",
      at: "in der Galerie",
      ground: "floor",
      tint: "#d98b78",
      label: { row: 2, col: 7 },
    },
    {
      key: "P",
      name: "Parkett",
      at: "im Parkett",
      ground: "floor",
      tint: "#e0a08e",
      label: { row: 3, col: 4 },
    },
    {
      key: "A",
      name: "Balkon A",
      at: "auf Balkon A",
      ground: "floor",
      tint: "#b98a9a",
      label: { row: 4, col: 0 },
      labelOverhang: true,
    },
    {
      key: "B",
      name: "Balkon B",
      at: "auf Balkon B",
      ground: "floor",
      tint: "#b98a9a",
      label: { row: 4, col: 8 },
      labelEnd: true,
      labelOverhang: true,
    },
    {
      key: "O",
      name: "Orchester",
      at: "im Orchester",
      ground: "floor",
      tint: "#c49378",
      label: { row: 4, col: 4 },
    },
    {
      key: "U",
      name: "Bühne",
      at: "auf der Bühne",
      ground: "floor",
      tint: "#f0d27a",
      label: { row: 7, col: 4 },
    },
    {
      key: "K",
      name: "Backstage",
      at: "im Backstage",
      ground: "floor",
      tint: "#a07c66",
      label: { row: 8, col: 4 },
    },
  ],
  areaMap: [
    "GGGGGGGGG",
    "GGGGGGGGG",
    "GPPPPPGGG",
    "PPPPPPPPP",
    "AAOOOOOBB",
    "AOOOOOOOB",
    "AOUUUUUOB",
    "KKUUUUUKK",
    ".KKKKKKK.",
  ],
  thingMap: [
    ".c..c...c",
    "t..cc.cc.",
    "t.p..p.p.",
    ".c....c.c",
    "ct.....tc",
    "trrrrrrr.",
    ".r....prt",
    "..p....x.",
    ".xxx.x...",
  ],
  things: {
    c: "chair",
    p: "plant",
    r: "rug",
    t: "table",
    x: "crate",
  },
  pieces: [{ at: { row: 1, col: 0 }, rows: 2, cols: 1 }],
  shapes: [
    [
      { row: 5, col: 1 },
      { row: 5, col: 2 },
      { row: 5, col: 3 },
      { row: 5, col: 4 },
      { row: 5, col: 5 },
      { row: 5, col: 6 },
      { row: 5, col: 7 },
      { row: 6, col: 1 },
      { row: 6, col: 7 },
    ],
  ],
  suspects: [
    {
      id: "A",
      name: "Ayla",
      pronoun: "sie",
      clue: {
        text: "Sie war genau eine Zeile südlich von Hannah.",
        ...about(["H"], oneRowSouthOfHannah),
      },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Barbara",
      pronoun: "sie",
      clue: {
        text: "Sie war in der obersten Zeile ihres Raumes.",
        ...own(topRowOfArea),
      },
      colour: "#15803d",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "C",
      name: "Clyde",
      pronoun: "er",
      clue: {
        text: "Er war in der fünften Spalte. Er war allein.",
        ...all(column(CLYDES_COLUMN), alone()),
      },
      colour: "#0e7490",
      face: "\u{1F9D4}",
    },
    {
      id: "D",
      name: "Darren",
      pronoun: "er",
      clue: {
        text: "Er war nicht neben einer Pflanze, einem Stuhl, einem Tisch oder einer Kiste, und er war auch nicht auf einem Teppich.",
        ...own(darrensField),
      },
      colour: "#4338ca",
      face: "\u{1F468}",
    },
    {
      id: "E",
      name: "Erkan",
      pronoun: "er",
      clue: {
        text: "Er war auf Balkon A oder Balkon B.",
        ...inArea("A", "B"),
      },
      colour: "#7c3aed",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "F",
      name: "Freya",
      pronoun: "sie",
      clue: {
        text: "Sie war westlich von Clyde. Sie stand.",
        ...all(not(on("chair")), about(["C"], westOfClyde)),
      },
      colour: "#9f1239",
      face: "\u{1F469}",
    },
    {
      id: "G",
      name: "Gregor",
      pronoun: "er",
      clue: {
        text: "Er war neben einem Tisch. Mindestens eine Frau war in seinem Raum.",
        ...all(
          own((c) => c.beside(c.cell, "table")),
          counting(womanInArea),
        ),
      },
      colour: "#ea580c",
      face: "\u{1F468}\u{1F3FF}",
    },
    {
      id: "H",
      name: "Hannah",
      pronoun: "sie",
      clue: {
        text: "Sie stand. Eine weitere Frau in ihrem Raum saß auf einem Stuhl.",
        ...all(not(on("chair")), counting(womanSittingInArea)),
      },
      colour: "#6d28d9",
      face: "\u{1F469}",
    },
    {
      id: "O",
      name: "Osric",
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
      text: "Genau drei Personen saßen auf einem Stuhl.",
      check: threeOnChairs,
      prune: notTooManySeated,
    },
  ],
  hints: [
    {
      text: "Gregor ist nicht allein in seinem Raum, also ist er nicht auf einem Balkon; er muss neben dem Galerietisch stehen, in R1 oder R2.",
    },
    {
      text: "Drei Personen sitzen auf Stühlen, und genau vier Zeilen enthalten Stühle. Die oberen beiden Zeilen können nicht beide jemanden sitzend haben, da Gregor dort ist, also müssen ein Stuhl in R4 und ein anderer in R5 besetzt sein.",
    },
    {
      text: "Die einzige Zeile, in der Hannah möglicherweise sein könnte, ist R3, mit Ayla sitzend in R4. In welchem Raum auch immer Hannah ist, es muss eine andere Frau in der Galerie sitzen, die nur Barbara sein kann, in R1.",
    },
    {
      text: "Das lokalisiert Gregor, dann Barbara (die nicht in C5 sein kann, weil Clyde in dieser Spalte ist), dann Ayla im Parkett und Erkan auf dem Balkonstuhl in R5. Das lokalisiert auch Hannah in R3 C4, dann Darren in R8 C6. (Wieder eliminieren wir C5 laut Clydes Hinweis.)",
      place: {
        G: { row: 1, col: 1 },
        B: { row: 0, col: 8 },
        A: { row: 3, col: 6 },
        E: { row: 4, col: 0 },
        H: { row: 2, col: 3 },
        D: { row: 7, col: 5 },
      },
    },
    {
      text: "Freya muss in C3 sein. Wenn sie auf der Bühne wäre, wäre Osric allein in seinem Raum, also ist Freya im Orchester mit Osric, und Clyde ist allein hinter der Bühne in R9. Freya ist die Mörderin!",
      place: {
        F: { row: 5, col: 2 },
        O: { row: 6, col: 7 },
        C: { row: 8, col: 4 },
      },
    },
  ],
  solution: {
    A: { row: 3, col: 6 },
    B: { row: 0, col: 8 },
    C: { row: 8, col: 4 },
    D: { row: 7, col: 5 },
    E: { row: 4, col: 0 },
    F: { row: 5, col: 2 },
    G: { row: 1, col: 1 },
    H: { row: 2, col: 3 },
    O: { row: 6, col: 7 },
  },
};
