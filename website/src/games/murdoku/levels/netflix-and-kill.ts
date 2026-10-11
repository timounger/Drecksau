/**
 * Netflix and Kill: a flat with bedroom, bathroom, kitchen and living room,
 * and a murder during a film night.
 *
 * @module
 * @remarks
 * After the free case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Easy/NetflixAndKill.png`, solution beside it).
 * Vaughn is the victim; whoever was alone with him killed him.
 */
import { all, beside, counting, inArea, on, victim } from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** Whether nobody but the suspect sits on a seat. */
function onlyOneSitting(c: Context): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return id === c.self || there === undefined || !c.is(there, "seat");
  });
}

/** The case. */
export const NETFLIX_AND_KILL: Level = {
  id: "netflix-and-kill",
  name: "Netflix and Kill",
  difficulty: "veryEasy",
  series: { book: "online" },
  story:
    "Vaughn wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "B",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "floor",
      tint: "#e6dbe0",
      label: { row: 1, col: 2 },
    },
    {
      key: "H",
      name: "Badezimmer",
      at: "im Badezimmer",
      ground: "stone",
      tint: "#b9cdc8",
      label: { row: 1, col: 4 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "floor",
      tint: "#f7d9c4",
      label: { row: 5, col: 1 },
    },
    {
      key: "L",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#cfe8f3",
      label: { row: 5, col: 4 },
    },
  ],
  areaMap: ["BBBBHH", "BBBBHH", "BBLLLH", "KKLLLL", "KKLLLL", "KKLLLL"],
  thingMap: ["bb..pc", "...c..", "sp.cc.", "......", "s.c.cv", "tts..p"],
  things: {
    b: "bed",
    c: "chair",
    s: "shelf",
    p: "plant",
    t: "table",
    v: "tv",
  },
  pieces: [
    { at: { row: 0, col: 0 }, rows: 1, cols: 2 },
    { at: { row: 5, col: 0 }, rows: 1, cols: 2 },
  ],
  suspects: [
    {
      id: "A",
      name: "Austin",
      pronoun: "er",
      clue: { text: "Er war neben einem Regal.", ...beside("shelf") },
      colour: "#b91c1c",
      face: "\u{1F468}",
    },
    {
      id: "B",
      name: "Barbara",
      pronoun: "sie",
      clue: { text: "Sie war auf dem Bett.", ...on("bed") },
      colour: "#15803d",
      face: "\u{1F469}",
    },
    {
      id: "C",
      name: "Charlotte",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person, die auf einem Stuhl saß.",
        ...all(on("seat"), counting(onlyOneSitting)),
      },
      colour: "#0e7490",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "D",
      name: "Dean",
      pronoun: "er",
      clue: { text: "Er war in der Küche.", ...inArea("K") },
      colour: "#6366f1",
      face: "\u{1F9D1}",
    },
    {
      id: "E",
      name: "Enid",
      pronoun: "sie",
      clue: { text: "Sie war neben dem Fernseher.", ...beside("tv") },
      colour: "#7c3aed",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "V",
      name: "Vaughn",
      pronoun: "er",
      clue: { text: "Er war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F9D4}",
    },
  ],
  hints: [
    {
      text: "Da C die einzige Person ist, die auf einem Stuhl sitzt, gibt es nur ein Feld, auf dem E neben dem Fernseher sein kann: R4 C6.",
      place: { E: { row: 3, col: 5 } },
    },
    {
      text: "Damit bleibt ein Feld in der Küche für D.",
      place: { D: { row: 4, col: 1 } },
    },
    {
      text: "Da B auf dem Bett ist, muss sie das einzige verbleibende Bettfeld belegen, R1 C1.",
      place: { B: { row: 0, col: 0 } },
    },
    {
      text: "Danach ist das einzige verbleibende Feld, auf dem A neben einem Regal sein kann, R6 C4.",
      place: { A: { row: 5, col: 3 } },
    },
    {
      text: "C muss den letzten Stuhl in R3 C5 belegen. Das isoliert V auf dem letzten verbleibenden Feld.",
      place: { C: { row: 2, col: 4 }, V: { row: 1, col: 2 } },
    },
  ],
  solution: {
    A: { row: 5, col: 3 },
    B: { row: 0, col: 0 },
    C: { row: 2, col: 4 },
    D: { row: 4, col: 1 },
    E: { row: 3, col: 5 },
    V: { row: 1, col: 2 },
  },
};
