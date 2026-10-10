/**
 * Der Buchclub: a library with a discussion circle and a refreshments
 * corner, and a murder among the readers.
 *
 * @module
 * @remarks
 * After the free case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Easy/Der Buchclub.png`, no solution sheet -
 * the solver proves the single solution). Carpets are ground, not things;
 * the counter in the refreshments corner counts as a table. Vinita is the
 * victim; whoever was alone with her killed her.
 */
import {
  about,
  all,
  beside,
  counting,
  inArea,
  not,
  on,
  onGround,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** Whether nobody but the suspect sits on a seat. */
function onlyOneSitting(c: Context): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return id === c.self || there === undefined || !c.is(there, "seat");
  });
}

/** Whether the suspect stands somewhere south of Cameron. */
function southOfCameron(c: Context): boolean {
  const cameron = c.cellOf("C");
  return cameron !== undefined && c.cell.row > cameron.row;
}

/** The case. */
export const THE_BOOK_CLUB: Level = {
  id: "the-book-club",
  name: "Der Buchclub",
  difficulty: "veryEasy",
  story:
    "Vinita wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "B",
      name: "Bibliothek",
      at: "in der Bibliothek",
      ground: "floor",
      tint: "#a9b0dc",
      label: { row: 2, col: 3 },
    },
    {
      key: "G",
      name: "Gesprächskreis",
      at: "im Gesprächskreis",
      ground: "floor",
      tint: "#b3e6df",
      label: { row: 5, col: 1 },
    },
    {
      key: "R",
      name: "Erfrischungen",
      at: "bei den Erfrischungen",
      ground: "floor",
      tint: "#f0d6f2",
      label: { row: 5, col: 4 },
    },
  ],
  areaMap: ["BBBBBB", "BBBBBB", "GGGBBR", "GGGGRR", "GGGGRR", "GGGGRR"],
  groundMap: ["ffffff", "fccccc", "ffffff", "ffcfff", "fccfcf", "ffffff"],
  grounds: { f: "floor", c: "carpet" },
  thingMap: [".sp.ss", "s.....", ".c.ss.", "c.....", "c....t", "t.cptt"],
  things: {
    s: "shelf",
    p: "plant",
    c: "chair",
    t: "table",
  },
  suspects: [
    {
      id: "A",
      name: "Ada",
      pronoun: "sie",
      clue: { text: "Sie war neben einer Pflanze.", ...beside("plant") },
      colour: "#b91c1c",
      face: "\u{1F475}",
    },
    {
      id: "B",
      name: "Brigitte",
      pronoun: "sie",
      clue: {
        text: "Sie war südlich von Cameron.",
        ...about(["C"], southOfCameron),
      },
      colour: "#15803d",
      face: "\u{1F469}‍\u{1F9B3}",
    },
    {
      id: "C",
      name: "Cameron",
      pronoun: "sie",
      clue: { text: "Sie war auf einem Teppich.", ...onGround("carpet") },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Darlene",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person, die auf einem Stuhl saß.",
        ...all(on("seat"), counting(onlyOneSitting)),
      },
      colour: "#6366f1",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "E",
      name: "Edison",
      pronoun: "er",
      clue: {
        text: "Er war in der Bibliothek. Er war nicht neben einem Regal.",
        ...all(inArea("B"), not(beside("shelf"))),
      },
      colour: "#7c3aed",
      face: "\u{1F9D4}",
    },
    {
      id: "V",
      name: "Vinita",
      pronoun: "sie",
      clue: { text: "Sie war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F471}‍♀️",
    },
  ],
  hints: [
    {
      text: "Zu Beginn: E ist in der Bibliothek, und es gibt nur ein Feld in der Bibliothek, das NICHT neben einem Regal liegt. Das isoliert E.",
      place: { E: { row: 1, col: 2 } },
    },
    {
      text: "Jetzt wirst du bemerken, dass nur noch zwei Teppichfelder übrig sind, beide in R5. Das bedeutet, dass C in R5 ist, blockiere den Rest von R5.",
      cross: [
        { row: 4, col: 0 },
        { row: 4, col: 3 },
        { row: 4, col: 5 },
      ],
    },
    {
      text: "B ist südlich von C. B muss also in R6 sein, auf dem letzten verfügbaren Feld der gesamten Reihe: R6 C2. Das isoliert C auf dem letzten Teppichfeld.",
      place: { B: { row: 5, col: 1 }, C: { row: 4, col: 4 } },
    },
    {
      text: "Es bleibt ein Feld übrig, auf dem A neben einer Pflanze sein kann, das isoliert A.",
      place: { A: { row: 0, col: 3 } },
    },
    {
      text: "Das isoliert D auf dem letzten Stuhl. Damit bleibt das letzte Feld für V.",
      place: { D: { row: 3, col: 0 }, V: { row: 2, col: 5 } },
    },
  ],
  solution: {
    A: { row: 0, col: 3 },
    B: { row: 5, col: 1 },
    C: { row: 4, col: 4 },
    D: { row: 3, col: 0 },
    E: { row: 1, col: 2 },
    V: { row: 2, col: 5 },
  },
};
