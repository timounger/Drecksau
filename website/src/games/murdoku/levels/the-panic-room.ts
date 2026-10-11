/**
 * Der Panikraum: a house with a dining room, a kitchen, a panic room, a
 * courtyard, a hall, a corridor, a living room, two bedrooms, and a murdered
 * woman.
 *
 * @module
 * @remarks
 * After the free case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Easy/Der Panikraum.png`, no solution sheet -
 * the solver proves the single solution). The rugs are carpet ground, the
 * long dining table and the beds cover every field they are drawn over.
 * Violet is the victim; whoever was alone with her killed her.
 */
import {
  all,
  beside,
  counting,
  inArea,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** Whether somebody else stands on a rug exactly one row north of the suspect. */
function southOfSomebodyOnARug(c: Context): boolean {
  return c.people().some((id) => {
    const there = c.cellOf(id);
    return (
      id !== c.self &&
      there !== undefined &&
      c.groundAt(there) === "carpet" &&
      there.row === c.cell.row - 1
    );
  });
}

/** Whether a woman stands in the dining room besides the suspect. */
function womanInDiningRoom(c: Context): boolean {
  return c.peopleIn("E").some((id) => id !== c.self && c.has(id, "woman"));
}

/** Whether a woman stands exactly two columns west of the suspect. */
function twoColumnsEastOfAWoman(c: Context): boolean {
  return c.people().some((id) => {
    const there = c.cellOf(id);
    return (
      id !== c.self &&
      there !== undefined &&
      c.has(id, "woman") &&
      there.col === c.cell.col - 2
    );
  });
}

/** The case. */
export const THE_PANIC_ROOM: Level = {
  id: "the-panic-room",
  name: "Der Panikraum",
  difficulty: "hard",
  series: { book: "online" },
  story:
    "Violet wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "E",
      name: "Esszimmer",
      at: "im Esszimmer",
      ground: "floor",
      tint: "#e6e9ee",
      label: { row: 3, col: 0 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "floor",
      tint: "#dacfd3",
      label: { row: 2, col: 6 },
    },
    {
      key: "P",
      name: "Panikraum",
      at: "im Panikraum",
      ground: "stone",
      tint: "#62626f",
      label: { row: 2, col: 8 },
    },
    {
      key: "H",
      name: "Hof",
      at: "im Hof",
      ground: "grass",
      tint: "#4f6a6c",
      label: { row: 9, col: 1 },
    },
    {
      key: "D",
      name: "Diele",
      at: "in der Diele",
      ground: "floor",
      tint: "#ead9de",
      label: { row: 6, col: 3 },
    },
    {
      key: "F",
      name: "Flur",
      at: "im Flur",
      ground: "floor",
      tint: "#f1f3f8",
      label: { row: 9, col: 6 },
    },
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#cdc8e0",
      label: { row: 6, col: 7 },
    },
    {
      key: "S",
      name: "Hauptschlafzimmer",
      at: "im Hauptschlafzimmer",
      ground: "floor",
      tint: "#d3dae6",
      label: { row: 9, col: 3 },
    },
    {
      key: "G",
      name: "Gästezimmer",
      at: "im Gästezimmer",
      ground: "floor",
      tint: "#e6d3dc",
      label: { row: 9, col: 7 },
    },
  ],
  areaMap: [
    "EEEEEKKPPP",
    "EEEEEKKPPP",
    "EEEEEKKKPP",
    "EEDDDFFFFF",
    "HHDDDFWWWW",
    "HHDDDFWWWW",
    "HHDDDFWWWW",
    "HHHSSFFGGG",
    "HHHSSSFGGG",
    "HHHSSSFGGG",
  ],
  groundMap: [
    "ffffffffff",
    "ffffffffff",
    "ffffffffff",
    "ffffffccff",
    "ggffffffff",
    "ggccfffccf",
    "ggfcfcffff",
    "gggffccfff",
    "gggffffcff",
    "gggffffccf",
  ],
  grounds: { f: "floor", g: "grass", c: "carpet" },
  thingMap: [
    ".c...tt.v.",
    "ctttc.....",
    ".cc.ps....",
    ".t.c.....a",
    ".r..a..c..",
    ".a....c..v",
    "r.p....cct",
    "...tb..sbc",
    "....b...b.",
    "r.rp.....v",
  ],
  things: {
    c: "chair",
    t: "table",
    v: "tv",
    p: "plant",
    s: "shelf",
    a: "statue",
    r: "tree",
    b: "bed",
  },
  pieces: [
    { at: { row: 0, col: 5 }, rows: 1, cols: 2 },
    { at: { row: 1, col: 1 }, rows: 1, cols: 3 },
    { at: { row: 7, col: 4 }, rows: 2, cols: 1 },
    { at: { row: 7, col: 8 }, rows: 2, cols: 1 },
  ],
  suspects: [
    {
      id: "A",
      name: "Alvin",
      pronoun: "er",
      clue: { text: "Er war neben einer Statue.", ...beside("statue") },
      colour: "#b91c1c",
      face: "\u{1F468}‍\u{1F9B3}",
    },
    {
      id: "B",
      name: "Bobby",
      pronoun: "er",
      clue: { text: "Er saß auf einem Stuhl.", ...on("seat") },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Charlie",
      pronoun: "er",
      clue: { text: "Er war im Gästezimmer.", ...inArea("G") },
      colour: "#0e7490",
      face: "\u{1F9D4}",
    },
    {
      id: "D",
      name: "Dina",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Regal.", ...beside("shelf") },
      colour: "#6366f1",
      face: "\u{1F469}",
    },
    {
      id: "E",
      name: "Evan",
      pronoun: "er",
      clue: { text: "Er war im Panikraum.", ...inArea("P") },
      colour: "#7c3aed",
      face: "\u{1F468}‍\u{1F9B0}",
    },
    {
      id: "F",
      name: "Fawn",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Fernseher.", ...beside("tv") },
      colour: "#9f1239",
      face: "\u{1F469}",
    },
    {
      id: "G",
      name: "Graham",
      pronoun: "er",
      clue: {
        text: "Er war genau eine Reihe südlich von jemandem auf einem Teppich.",
        ...all(
          own((c) => c.cell.row > 0),
          counting(southOfSomebodyOnARug),
        ),
      },
      colour: "#ea580c",
      face: "\u{1F474}",
    },
    {
      id: "H",
      name: "Harold",
      pronoun: "er",
      clue: {
        text: "Er war mit einer Frau im Esszimmer.",
        ...all(inArea("E"), counting(womanInDiningRoom)),
      },
      colour: "#4338ca",
      face: "\u{1F9D4}",
    },
    {
      id: "I",
      name: "Iona",
      pronoun: "sie",
      clue: {
        text: "Sie war genau zwei Spalten östlich von einer Frau.",
        ...all(
          own((c) => c.cell.col > 1),
          counting(twoColumnsEastOfAWoman),
        ),
      },
      colour: "#a16207",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "V",
      name: "Violet",
      pronoun: "sie",
      clue: { text: "Das Opfer. Sie war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F475}",
    },
  ],
  hints: [
    {
      text: "Evan ist im Panikraum und Charlie im Gästezimmer - beide in C8 bis C10. Fawn kann nur in C8 bis C10 neben einem Fernseher stehen. Für Dina bleibt in diesen Spalten kein Platz, also ist sie in der Küche neben dem Regal. Sperre C8 bis C10 für alle anderen.",
    },
    {
      text: "In R1 bis R3 stehen Evan und Dina, dort ist nur noch eine Reihe frei. Harold und eine Frau im Esszimmer brauchen diese Reihe und R4 C1. Damit sind alle Stühle im Esszimmer und R4 C4 gesperrt, und Bobby bleibt nur der Stuhl R6 C7.",
      place: { B: { row: 5, col: 6 } },
    },
    {
      text: "Das sperrt C7. Dina bleibt in der Küche nur R2 C6.",
      place: { D: { row: 1, col: 5 } },
    },
    {
      text: "Graham war genau eine Reihe südlich von jemandem auf einem Teppich. Frei sind nur noch die Teppiche R7 C4 und R9 C8. Alvin steht neben einer Statue auf R5 C4 oder R7 C2 - beides sperrt R7 C4. Also ist Charlie auf R9 C8, und Graham ist in R10.",
      place: { C: { row: 8, col: 7 } },
    },
    {
      text: "Fawn bleibt neben einem Fernseher nur R5 C10, und Evan im Panikraum nur R3 C9.",
      place: { F: { row: 4, col: 9 }, E: { row: 2, col: 8 } },
    },
    {
      text: "R5 ist gesperrt, also ist Alvin auf R7 C2. Graham bleibt in R10 nur R10 C5.",
      place: { A: { row: 6, col: 1 }, G: { row: 9, col: 4 } },
    },
    {
      text: "Iona war genau zwei Spalten östlich einer Frau: Violet in C1, Iona in C3. Harold bleibt im Esszimmer nur R1 C4, und die Frau bei ihm ist Violet auf R4 C1. Iona ist auf R8 C3. V war allein mit H im Esszimmer, Harold ist der Mörder!",
      place: {
        H: { row: 0, col: 3 },
        V: { row: 3, col: 0 },
        I: { row: 7, col: 2 },
      },
    },
  ],
  solution: {
    A: { row: 6, col: 1 },
    B: { row: 5, col: 6 },
    C: { row: 8, col: 7 },
    D: { row: 1, col: 5 },
    E: { row: 2, col: 8 },
    F: { row: 4, col: 9 },
    G: { row: 9, col: 4 },
    H: { row: 0, col: 3 },
    I: { row: 7, col: 2 },
    V: { row: 3, col: 0 },
  },
};
