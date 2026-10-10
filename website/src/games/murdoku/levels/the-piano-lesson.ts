/**
 * Die Klavierstunde: a study with a grand piano, a hall, a storeroom and
 * a foyer, and a murder during the lesson.
 *
 * @module
 * @remarks
 * After the free case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Easy/Die Klavierstunde.png`, no solution
 * sheet - the solver proves the single solution). Carpets are ground, not
 * things; the armchairs count as chairs and the dark cabinets as tables.
 * The page's general clue - exactly one person on a carpet - is the case's
 * rule. Vada is the victim; whoever was alone with her killed her.
 */
import { beside, counting, inArea, on, victim } from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** Whether somebody beside the piano stands exactly one row south of the suspect. */
function oneRowNorthOfPianist(c: Context): boolean {
  return c.people().some((id) => {
    const there = c.cellOf(id);
    return (
      id !== c.self &&
      there !== undefined &&
      there.row === c.cell.row + 1 &&
      c.beside(there, "piano")
    );
  });
}

/** Whether somebody in the suspect's area stands north of her. */
function somebodyNorthInArea(c: Context): boolean {
  const area = c.areaOf(c.cell) ?? "";
  return c
    .peopleIn(area)
    .some((id) => id !== c.self && (c.cellOf(id)?.row ?? c.rows) < c.cell.row);
}

/** The case. */
export const THE_PIANO_LESSON: Level = {
  id: "the-piano-lesson",
  name: "Die Klavierstunde",
  difficulty: "easy",
  series: { book: "online" },
  story:
    "Vada wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "A",
      name: "Arbeitszimmer",
      at: "im Arbeitszimmer",
      ground: "floor",
      tint: "#efe9df",
      label: { row: 2, col: 1 },
    },
    {
      key: "F",
      name: "Flur",
      at: "im Flur",
      ground: "floor",
      tint: "#e9dcc4",
      label: { row: 3, col: 3 },
    },
    {
      key: "K",
      name: "Abstellkammer",
      at: "in der Abstellkammer",
      ground: "floor",
      tint: "#ece6dc",
      label: { row: 5, col: 0 },
    },
    {
      key: "O",
      name: "Foyer",
      at: "im Foyer",
      ground: "stone",
      tint: "#cfcfcf",
      label: { row: 5, col: 3 },
    },
  ],
  areaMap: ["AAAAAF", "AAAAAF", "AAAAAF", "KKFFFF", "KOOOOO", "KOOOOO"],
  groundMap: ["ffffff", "fcccff", "ffffff", "ffffff", "fssccs", "fsssss"],
  grounds: { f: "floor", c: "carpet", s: "stone" },
  thingMap: ["c.pt..", "s.....", "....c.", "..c...", "..x..t", "s....."],
  things: {
    c: "chair",
    p: "piano",
    t: "table",
    s: "shelf",
    x: "statue",
  },
  extraThings: {
    piano: { name: "Klavier", emoji: "\u{1F3B9}", standable: false },
  },
  suspects: [
    {
      id: "A",
      name: "Annie",
      pronoun: "sie",
      clue: { text: "Sie war in der Abstellkammer.", ...inArea("K") },
      colour: "#b91c1c",
      face: "\u{1F475}",
    },
    {
      id: "B",
      name: "Boris",
      pronoun: "er",
      clue: { text: "Er war neben der Statue.", ...beside("statue") },
      colour: "#15803d",
      face: "\u{1F474}",
    },
    {
      id: "C",
      name: "Clover",
      pronoun: "sie",
      clue: {
        text: "Es gab jemanden nördlich von ihr im selben Bereich.",
        ...counting(somebodyNorthInArea),
      },
      colour: "#0e7490",
      face: "\u{1F469}‍\u{1F9B3}",
    },
    {
      id: "D",
      name: "Daryl",
      pronoun: "sie",
      clue: {
        text: "Sie war genau eine Reihe nördlich von jemandem neben dem Klavier.",
        ...counting(oneRowNorthOfPianist),
      },
      colour: "#6366f1",
      face: "\u{1F469}",
    },
    {
      id: "E",
      name: "Eve",
      pronoun: "sie",
      clue: { text: "Sie saß auf einem Stuhl.", ...on("seat") },
      colour: "#7c3aed",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "V",
      name: "Vada",
      pronoun: "sie",
      clue: { text: "Sie war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F471}‍♀️",
    },
  ],
  rules: [
    {
      text: "Es gab genau eine Person auf einem Teppich.",
      check: (c) =>
        c.people().filter((id) => {
          const there = c.cellOf(id);
          return there !== undefined && c.groundAt(there) === "carpet";
        }).length === 1,
    },
  ],
  hints: [
    {
      text: "D muss genau eine Reihe nördlich von jemandem neben dem Klavier sein, was D in R1 festlegt und eine unbekannte Person neben dem Klavier in R2 C3. Blockiere den Rest von R2 und C3.",
      cross: [
        { row: 1, col: 0 },
        { row: 1, col: 1 },
        { row: 1, col: 3 },
        { row: 1, col: 4 },
        { row: 1, col: 5 },
        { row: 0, col: 2 },
        { row: 2, col: 2 },
        { row: 3, col: 2 },
        { row: 4, col: 2 },
        { row: 5, col: 2 },
      ],
    },
    {
      text: "Die unbekannte Person neben dem Klavier ist auf einem Teppich, und laut dem allgemeinen Hinweis ist das die einzige Person auf einem Teppich. Blockiere jedes andere Teppichfeld. Das isoliert B im letzten Feld neben der Statue.",
      place: { B: { row: 4, col: 1 } },
      cross: [
        { row: 1, col: 1 },
        { row: 1, col: 3 },
        { row: 4, col: 3 },
        { row: 4, col: 4 },
      ],
    },
    {
      text: "Das isoliert A im letzten Feld in der Abstellkammer, was E im letzten Feld mit einem Stuhl isoliert.",
      place: { A: { row: 3, col: 0 }, E: { row: 2, col: 4 } },
    },
    {
      text: "Das isoliert D im letzten Feld in R1. C muss jemanden nördlich von sich im selben Bereich haben, also kann sie nicht neben dem Klavier sein, da niemand im Arbeitszimmer nördlich von ihr wäre. Das isoliert C im letzten Feld in R6 und V als die Person neben dem Klavier.",
      place: {
        D: { row: 0, col: 5 },
        C: { row: 5, col: 3 },
        V: { row: 1, col: 2 },
      },
    },
  ],
  solution: {
    A: { row: 3, col: 0 },
    B: { row: 4, col: 1 },
    C: { row: 5, col: 3 },
    D: { row: 0, col: 5 },
    E: { row: 2, col: 4 },
    V: { row: 1, col: 2 },
  },
};
