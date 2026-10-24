/**
 * Das Versteck: a bandits' hideout with three tents in the desert, two
 * outlaws among the suspects and a murdered stranger.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/21.png`, no
 * solution sheet - the solved grid and the culprit are pencilled in on the
 * photographed page, and the solver proves it is the only solution). Vaughn
 * is the victim; whoever was alone with him killed him.
 *
 * **There are two outlaws, and they were the only two people on beds** - so
 * exactly two people lie on a bed, and Vaughn, no outlaw, is not one of
 * them. Ada was with an outlaw: somebody else in her area lies on a bed.
 * Beds and horses can be stood on; the fire (the legend says so), sacks,
 * dynamite and cacti cannot.
 */
import {
  all,
  beside,
  column,
  counting,
  inArea,
  not,
  on,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** How many outlaws there were - all of them, and nobody else, on beds. */
const OUTLAWS = 2;

/** Whether somebody lies on a bed. */
function onBed(c: Context, id: string): boolean {
  const there = c.cellOf(id);
  return there !== undefined && c.is(there, "bed");
}

/** Whether exactly the two outlaws lay on beds. */
function twoOnBeds(c: Context): boolean {
  return c.people().filter((id) => onBed(c, id)).length === OUTLAWS;
}

/** The case. */
export const THE_HIDEOUT: Level = {
  id: "the-hideout",
  name: "Das Versteck",
  series: { book: "timeTravel", number: 21 },
  story:
    "Das Dynamit so nah am Feuer zu lagern, ist ein klarer Verstoß gegen die Arbeitsschutzvorschriften.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "G",
      name: "Versteck",
      at: "im Versteck",
      ground: "sand",
      tint: "#ece4b4",
      label: { row: 3, col: 3 },
    },
    {
      key: "W",
      name: "Wüste",
      at: "in der Wüste",
      ground: "sand",
      tint: "#f2eccc",
      label: { row: 6, col: 2 },
    },
    {
      key: "A",
      name: "Zelt A",
      at: "in Zelt A",
      ground: "floor",
      tint: "#9cb8e0",
      label: { row: 2, col: 1 },
    },
    {
      key: "B",
      name: "Zelt B",
      at: "in Zelt B",
      ground: "floor",
      tint: "#9cb8e0",
      label: { row: 1, col: 5 },
    },
    {
      key: "C",
      name: "Zelt C",
      at: "in Zelt C",
      ground: "floor",
      tint: "#9cb8e0",
      label: { row: 5, col: 5 },
    },
  ],
  areaMap: [
    "GGGGGBB",
    "GAAGGBB",
    "GAAGGGG",
    "WWWGGGG",
    "WWWWGCC",
    "WWWWWCC",
    "WWWWWWW",
  ],
  thingMap: [
    ".h.k.db",
    ".k..f.b",
    ".bbk.h.",
    "h.....d",
    "k....bb",
    "..h.udd",
    ".u..h.u",
  ],
  things: {
    b: "bed",
    d: "dynamite",
    f: "campfire",
    h: "horse",
    k: "sack",
    u: "cactus",
  },
  // The beds in the tents.
  pieces: [
    { at: { row: 0, col: 6 }, rows: 2, cols: 1 },
    { at: { row: 2, col: 1 }, rows: 1, cols: 2 },
    { at: { row: 4, col: 5 }, rows: 1, cols: 2 },
  ],
  suspects: [
    {
      id: "A",
      name: "Ada",
      pronoun: "sie",
      clue: {
        text: "Sie war bei einem Gesetzlosen.",
        ...counting((c) =>
          c
            .peopleIn(c.areaOf(c.cell) ?? "")
            .some((id) => id !== c.self && onBed(c, id)),
        ),
      },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Billy",
      pronoun: "er",
      clue: { text: "Er war neben einem Sack.", ...beside("sack") },
      colour: "#15803d",
      face: "\u{1F920}",
    },
    {
      id: "C",
      name: "Cole",
      pronoun: "er",
      clue: { text: "Er ritt auf einem Pferd.", ...on("horse") },
      colour: "#0e7490",
      face: "\u{1F9D4}",
    },
    {
      id: "D",
      name: "Duncan",
      pronoun: "er",
      clue: { text: "Er war in der ersten Spalte.", ...column(1) },
      colour: "#6366f1",
      face: "\u{1F468}‍\u{1F9B2}",
    },
    {
      id: "E",
      name: "Edison",
      pronoun: "er",
      clue: { text: "Er war neben Dynamit.", ...beside("dynamite") },
      colour: "#a16207",
      face: "\u{1F977}",
    },
    {
      id: "F",
      name: "Frida",
      pronoun: "sie",
      clue: { text: "Sie war in Zelt C.", ...inArea("C") },
      colour: "#be185d",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "V",
      name: "Vaughn",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Nicht der Gesetzlose. Er war allein mit der Person, die den Mord beging.",
        ...all(victim(), not(on("bed"))),
      },
      colour: "#57534e",
      face: "\u{1F468}",
    },
  ],
  rules: [
    {
      text: "Es verstecken sich genau zwei Gesetzlose unter den Verdächtigen. Ein Gesetzloser kann der Mörder sein oder auch nicht.",
    },
    {
      text: "Die Gesetzlosen waren die einzigen zwei Personen auf Betten.",
      check: twoOnBeds,
    },
  ],
  hints: [
    {
      text: "Frida ist in Zelt C, und dort sind nur die beiden Betten in R5 frei. Sie liegt also auf einem Bett in R5 - sie ist eine der beiden Gesetzlosen.",
    },
    {
      text: "Ada war bei einem Gesetzlosen, also bei jemandem auf einem Bett in ihrem Bereich. In Zelt C wäre sie in Fridas Zeile. In Zelt B müsste sie in R2 C6 stehen und der Gesetzlose in R1 C7 liegen - dann wären C6 und C7 besetzt und Frida hätte kein Bett mehr. Also steht Ada in Zelt A auf R2 C3, und auf dem Bett in R3 C2 (C3 ist ihre Spalte) liegt der zweite Gesetzlose: Nur Billy passt dorthin, neben den Sack.",
      place: { A: { row: 1, col: 2 }, B: { row: 2, col: 1 } },
    },
    {
      text: "Edison steht neben Dynamit: R2 C6 ist Adas Zeile, R3 C7 Billys, und auf das Bett in R1 C7 darf niemand mehr. Er steht in R4 C6. Damit liegt Frida in R5 C7.",
      place: { E: { row: 3, col: 5 }, F: { row: 4, col: 6 } },
    },
    {
      text: "Cole reitet ein Pferd: R1 C2 ist Billys Spalte, R3 C6 Billys Zeile, R4 C1 Edisons Zeile, R6 C3 Adas Spalte. Er reitet in R7 C5.",
      place: { C: { row: 6, col: 4 } },
    },
    {
      text: "Übrig sind R1 und R6 in C1 und C4. R1 C4 ist ein Sack, also steht Vaughn in R6 C4 und Duncan in R1 C1. Vaughn ist in der Wüste allein mit Cole. Cole ist der Mörder!",
      place: { V: { row: 5, col: 3 }, D: { row: 0, col: 0 } },
    },
  ],
  solution: {
    A: { row: 1, col: 2 },
    B: { row: 2, col: 1 },
    C: { row: 6, col: 4 },
    D: { row: 0, col: 0 },
    E: { row: 3, col: 5 },
    F: { row: 4, col: 6 },
    V: { row: 5, col: 3 },
  },
};
