/**
 * A Stunning Mansion: a bedroom, a dining room, a study, a kitchen, a
 * gallery, an entrance hall and a living room, with a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Ein umwerfendes Herrenhaus/Ein umwerfendes Herrenhaus.png`,
 * solution sheet
 * `game_instructions/Murdoku/Das Murdoku-Orginal/Lösungen 1-80/Lösung 17-20.JPG`).
 * Owen is the victim; whoever was alone with him killed him.
 *
 * The armchairs and the bed can be stood on; the TVs, the plants, the
 * shelves, the statues, the dark tables and the kitchen counters (tables)
 * cannot. Sitting on a chair means being on an armchair.
 */
import { all, beside, inArea, on, own, victim } from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** Whether a TV stands in the suspect's area and in the suspect's column. */
function tvInColumnAndRoom(c: Context): boolean {
  return c
    .cellsOf(c.areaOf(c.cell) ?? "")
    .some((cell) => cell.col === c.cell.col && c.is(cell, "tv"));
}

/** The case. */
export const A_STUNNING_MANSION: Level = {
  id: "a-stunning-mansion",
  name: "Ein umwerfendes Herrenhaus",
  series: { book: "original", number: 17 },
  story:
    "Ich werde zu solchen Partys nicht eingeladen. Wenn das dort so abgeht, ist das vielleicht auch besser so.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "S",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "floor",
      tint: "#f3ecc4",
      label: { row: 2, col: 1 },
    },
    {
      key: "Z",
      name: "Esszimmer",
      at: "im Esszimmer",
      ground: "floor",
      tint: "#e8d8ec",
      label: { row: 3, col: 6 },
    },
    {
      key: "A",
      name: "Arbeitszimmer",
      at: "im Arbeitszimmer",
      ground: "floor",
      tint: "#d2e2f2",
      label: { row: 5, col: 1 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "stone",
      tint: "#f2e6b4",
      label: { row: 5, col: 6 },
    },
    {
      key: "G",
      name: "Galerie",
      at: "in der Galerie",
      ground: "floor",
      tint: "#f5ddae",
      label: { row: 8, col: 1 },
    },
    {
      key: "E",
      name: "Eingangshalle",
      at: "in der Eingangshalle",
      ground: "stone",
      tint: "#dccbe8",
      label: { row: 8, col: 3 },
    },
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#f2eacc",
      label: { row: 8, col: 6 },
    },
  ],
  areaMap: [
    "SSSSZZZZZ",
    "SSSSZZZZZ",
    "SSSSZZZZZ",
    "AAAAZZZZZ",
    "AAAAKKKKK",
    "AAAAKKKKK",
    "GGGEEEWWW",
    "GGGEEEWWW",
    "GGGEEEWWW",
  ],
  thingMap: [
    "f....cc.p",
    ".bb.cttt.",
    "c..p.tttc",
    ".tc.pc...",
    "r..rt...t",
    "rr.rt.ttt",
    "s....pcf.",
    "s.t...t.p",
    "..sp...c.",
  ],
  things: {
    b: "bed",
    c: "chair",
    f: "tv",
    p: "plant",
    r: "shelf",
    s: "statue",
    t: "table",
  },
  shapes: [
    [
      { row: 4, col: 8 },
      { row: 5, col: 8 },
      { row: 5, col: 7 },
      { row: 5, col: 6 },
    ],
  ],
  pieces: [
    { at: { row: 1, col: 1 }, rows: 1, cols: 2 },
    { at: { row: 1, col: 5 }, rows: 2, cols: 3 },
    { at: { row: 4, col: 4 }, rows: 2, cols: 1 },
  ],
  suspects: [
    {
      id: "A",
      name: "Amara",
      pronoun: "sie",
      clue: { text: "Sie war in der Küche.", ...inArea("K") },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Barbara",
      pronoun: "sie",
      clue: { text: "Sie war im Arbeitszimmer.", ...inArea("A") },
      colour: "#15803d",
      face: "\u{1F475}",
    },
    {
      id: "C",
      name: "Cindy",
      pronoun: "sie",
      clue: { text: "Sie war in der Galerie.", ...inArea("G") },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Dennis",
      pronoun: "er",
      clue: { text: "Er saß auf einem Stuhl.", ...on("chair") },
      colour: "#4338ca",
      face: "\u{1F468}",
    },
    {
      id: "E",
      name: "Emmett",
      pronoun: "er",
      clue: { text: "Er war auf dem Bett.", ...on("bed") },
      colour: "#7c3aed",
      face: "\u{1F468}",
    },
    {
      id: "F",
      name: "Fiona",
      pronoun: "sie",
      clue: {
        text: "Sie saß auf einem Stuhl neben einer Pflanze.",
        ...all(on("chair"), beside("plant")),
      },
      colour: "#9f1239",
      face: "\u{1F475}",
    },
    {
      id: "G",
      name: "Griffin",
      pronoun: "er",
      clue: { text: "Er war neben einer Pflanze.", ...beside("plant") },
      colour: "#ea580c",
      face: "\u{1F468}",
    },
    {
      id: "H",
      name: "Hermine",
      pronoun: "sie",
      clue: {
        text: "Sie war im selben Raum wie ein Fernseher, in derselben Spalte.",
        ...own(tvInColumnAndRoom),
      },
      colour: "#0f766e",
      face: "\u{1F469}",
    },
    {
      id: "O",
      name: "Owen",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F9D4}",
    },
  ],
  hints: [
    {
      text: "Emmett ist auf dem Bett in Zeile 2. Schließe alle anderen Felder in Zeile 2 aus.",
      cross: [
        { row: 1, col: 0 },
        { row: 1, col: 3 },
        { row: 1, col: 4 },
        { row: 1, col: 8 },
      ],
    },
    {
      text: "Es gibt nur einen Stuhl, der neben einer Pflanze ist. Das lokalisiert Fiona.",
      place: { F: { row: 3, col: 5 } },
    },
    {
      text: "Das setzt Amara in Zeile 5 in der Küche, was Barbara im Arbeitszimmer lokalisiert.",
      place: { B: { row: 5, col: 2 } },
    },
    {
      text: "Das lokalisiert Emmett in Spalte 2, was Cindy in der Galerie lokalisiert.",
      place: { E: { row: 1, col: 1 }, C: { row: 8, col: 0 } },
    },
    {
      text: "Das lokalisiert Hermine im Wohnzimmer, dann Amara in Spalte 7.",
      place: { H: { row: 7, col: 7 }, A: { row: 4, col: 6 } },
    },
    {
      text: "Dennis ist auf dem letzten verbleibenden Stuhl, in Zeile 3, Spalte 9.",
      place: { D: { row: 2, col: 8 } },
    },
    {
      text: "Griffin muss im letzten Feld neben einer Pflanze sein, in der Eingangshalle.",
      place: { G: { row: 6, col: 4 } },
    },
    {
      text: "Das lokalisiert Owen im Schlafzimmer. Emmett ist der Mörder!",
      place: { O: { row: 0, col: 3 } },
    },
  ],
  solution: {
    A: { row: 4, col: 6 },
    B: { row: 5, col: 2 },
    C: { row: 8, col: 0 },
    D: { row: 2, col: 8 },
    E: { row: 1, col: 1 },
    F: { row: 3, col: 5 },
    G: { row: 6, col: 4 },
    H: { row: 7, col: 7 },
    O: { row: 0, col: 3 },
  },
};
