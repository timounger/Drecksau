/**
 * Die Oase: the desert round an oasis in the Sahara, with its vegetation,
 * a west tent and an east tent, and a murdered traveller.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 3 - Auf Weltreise/19. Die Oase.png`,
 * no solution sheet - the solver proves the solution is the only one).
 * Ousmane is the victim; whoever was alone with him killed him.
 *
 * The map is nine by nine with its corners missing. The camels (the
 * legend's only thing) and the chairs can be stood on; the palms and the
 * bushes cannot, as the empty grid on the page greys them out. The water of
 * the oasis is an area people can stand in. Gouma was in the oasis with
 * exactly two other women ({@link withTwoWomen}).
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  about,
  all,
  column,
  counting,
  inArea,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** Whether exactly two other women stood in the suspect's area. */
function withTwoWomen(c: Context): boolean {
  const others = c
    .peopleIn(c.areaOf(c.cell) ?? "")
    .filter((id) => id !== c.self && c.has(id, "woman"));
  return others.length === 2;
}

/** The case. */
export const THE_OASIS: Level = {
  id: "the-oasis",
  name: "Die Oase",
  series: { book: "worldTravel", number: 19 },
  story:
    "Die Beweise sind wie eine Fata Morgana verschwunden, so nah und doch so fern.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "V",
      name: "Vegetation",
      at: "in der Vegetation",
      ground: "grass",
      tint: "#b5d38f",
      label: { row: 3, col: 7 },
    },
    {
      key: "O",
      name: "Oase",
      at: "in der Oase",
      ground: "water",
      tint: "#7fb8e8",
      label: { row: 6, col: 4 },
    },
    {
      key: "E",
      name: "Ostzelt",
      at: "im Ostzelt",
      ground: "sand",
      tint: "#ecc982",
      label: { row: 5, col: 7 },
    },
    {
      key: "W",
      name: "Westzelt",
      at: "im Westzelt",
      ground: "sand",
      tint: "#eeb48c",
      label: { row: 8, col: 0 },
    },
    {
      key: "D",
      name: "Wüste",
      at: "in der Wüste",
      ground: "sand",
      tint: "#f1e2b8",
      label: { row: 8, col: 3 },
    },
  ],
  areaMap: [
    "...VVVV..",
    ".DDVVVVV.",
    "DDDOOOVVV",
    "DDOOOOOVV",
    "DDOOOOOEE",
    "DDDOOOOEE",
    "WWDDOODDD",
    "WWDDDDDD.",
    "WWDDDDD..",
  ],
  thingMap: [
    ".....p...",
    "..pkb....",
    "......b.b",
    ".........",
    ".k......c",
    ".........",
    ".ckp.....",
    ".c....k..",
    "c........",
  ],
  things: {
    b: "shrub",
    c: "chair",
    k: "camel",
    p: "palm",
  },
  extraThings: {
    camel: { name: "Kamel", emoji: "\u{1F42A}", standable: true },
  },
  suspects: [
    {
      id: "A",
      name: "Ahmed",
      pronoun: "er",
      clue: {
        text: "Er saß auf einem Stuhl. Er war nördlich von Gouma.",
        ...all(
          on("chair"),
          about(["G"], (c) => {
            const gouma = c.cellOf("G");
            return gouma !== undefined && c.cell.row < gouma.row;
          }),
        ),
      },
      colour: "#1e3a8a",
      face: "\u{1F473}\u{200D}\u{2642}\u{FE0F}",
    },
    {
      id: "B",
      name: "Bashir",
      pronoun: "er",
      clue: {
        text: "Er saß auf einem Stuhl. Er war südlich von Chaâbane.",
        ...all(
          on("chair"),
          about(["C"], (c) => {
            const chaabane = c.cellOf("C");
            return chaabane !== undefined && c.cell.row > chaabane.row;
          }),
        ),
      },
      colour: "#b45309",
      face: "\u{1F473}",
    },
    {
      id: "C",
      name: "Chaâbane",
      pronoun: "er",
      clue: { text: "Er war auf einem Kamel.", ...on("camel") },
      colour: "#a16207",
      face: "\u{1F474}",
    },
    {
      id: "D",
      name: "Dassin",
      pronoun: "sie",
      clue: {
        text: "Sie war genau fünf Zeilen südlich von Hinane.",
        ...about(["H"], (c) => {
          const hinane = c.cellOf("H");
          return hinane !== undefined && c.cell.row === hinane.row + 5;
        }),
      },
      colour: "#64748b",
      face: "\u{1F9D5}",
    },
    {
      id: "E",
      name: "Emini",
      pronoun: "sie",
      clue: {
        text: "Sie war neben einem Baum.",
        ...own((c) => c.beside(c.cell, "tree")),
      },
      colour: "#4d7c0f",
      face: "\u{1F9D5}\u{1F3FD}",
    },
    {
      id: "F",
      name: "Farha",
      pronoun: "sie",
      clue: { text: "Sie war in der dritten Spalte.", ...column(3) },
      colour: "#1f2937",
      face: "\u{1F9D5}\u{1F3FB}",
    },
    {
      id: "G",
      name: "Gouma",
      pronoun: "sie",
      clue: {
        text: "Sie war mit zwei Frauen in der Oase.",
        ...all(inArea("O"), counting(withTwoWomen)),
      },
      colour: "#0e7490",
      face: "\u{1F9D5}\u{1F3FE}",
    },
    {
      id: "H",
      name: "Hinane",
      pronoun: "sie",
      clue: {
        text: "Sie war mit Chaâbane zusammen. Sie war nordwestlich von ihm.",
        ...about(["C"], (c) => {
          const chaabane = c.cellOf("C");
          return (
            chaabane !== undefined &&
            c.areaOf(chaabane) === c.areaOf(c.cell) &&
            c.cell.row < chaabane.row &&
            c.cell.col < chaabane.col
          );
        }),
      },
      colour: "#0f766e",
      face: "\u{1F9D5}\u{1F3FC}",
    },
    {
      id: "O",
      name: "Ousmane",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#b91c1c",
      face: "\u{1F474}\u{1F3FD}",
    },
  ],
  hints: [
    {
      text: "Hinane war mit Chaâbane zusammen, also nicht in der Oase - dort gibt es kein Kamel. Emini auch nicht: Alle Palmen stehen außerhalb der Oase. Gouma war also mit Dassin und Farha in der Oase.",
    },
    {
      text: "Dassin steht in der Oase genau fünf Zeilen südlich von Hinane, also in R6 oder R7 - Hinane in R1 oder R2. Neben Chaâbane steht Hinane nicht in der Vegetation (nordwestlich vom Kamel in R2 C4 gibt es kein Feld), sondern in der Wüste: Dort bleibt in R1 und R2 nur R2 C2. Dassin steht damit in R7.",
      place: { H: { row: 1, col: 1 } },
    },
    {
      text: "Chaâbane sitzt auf einem Kamel in der Wüste südöstlich von Hinane: R7 C3 ist Dassins Zeile, also R8 C7. Bashir saß südlich davon auf einem Stuhl - nur R9 C1.",
      place: { C: { row: 7, col: 6 }, B: { row: 8, col: 0 } },
    },
    {
      text: "Ahmed saß auf einem Stuhl nördlich von Gouma, die in der Oase steht. R7 C2 und R8 C2 liegen in Dassins und Chaâbanes Zeile - Ahmed sitzt in R5 C9. Gouma steht südlich von ihm in der Oase, nicht in Dassins R7: also in R6. Farha in der dritten Spalte der Oase bleibt nur R4 C3.",
      place: { A: { row: 4, col: 8 }, F: { row: 3, col: 2 } },
    },
    {
      text: "Emini war neben einem Baum. Neben den Palmen liegen im selben Bereich R1 C5, R1 C7, R2 C6, R2 C2, R3 C3 und R8 C4. Frei ist nur noch R1 C5 (C7 ist Chaâbanes Spalte). Dassin steht damit in R7 C6, Gouma in R6 C4.",
      place: {
        E: { row: 0, col: 4 },
        D: { row: 6, col: 5 },
        G: { row: 5, col: 3 },
      },
    },
    {
      text: "Für Ousmane bleibt R3 C8 in der Vegetation - allein mit Emini. Emini ist die Mörderin!",
      place: { O: { row: 2, col: 7 } },
    },
  ],
  solution: {
    A: { row: 4, col: 8 },
    B: { row: 8, col: 0 },
    C: { row: 7, col: 6 },
    D: { row: 6, col: 5 },
    E: { row: 0, col: 4 },
    F: { row: 3, col: 2 },
    G: { row: 5, col: 3 },
    H: { row: 1, col: 1 },
    O: { row: 2, col: 7 },
  },
};
