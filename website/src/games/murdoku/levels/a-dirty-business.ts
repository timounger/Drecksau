/**
 * Eine schmutzige Angelegenheit: a house with a back yard, a kitchen, a
 * living room, a toilet, a bedroom, a veranda and a front garden, muddy
 * puddles everywhere and a murdered man.
 *
 * @module
 * @remarks
 * After the free case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Schwer/Eine schmutzige Angelegenheit/Eine schmutzige Angelegenheit.png`,
 * no solution sheet - the solver proves the single solution). The back yard
 * is narrower than the house: its outer fields are off the map. The long
 * kitchen table and the bed cover every field they are drawn over. Mud
 * puddles, chairs and the bed can be stood on; trees, rubble, tables and
 * the television cannot. "South-east" and "north-west" mean any field
 * further south and further east (or north and west), not only on the
 * diagonal. Valentino is the victim; whoever was alone with him killed him.
 */
import {
  about,
  all,
  alone,
  beside,
  counting,
  not,
  on,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** Whether the suspect stood south-east of one person and north-west of another. */
function betweenDiagonally(
  northWest: string,
  southEast: string,
): (c: Context) => boolean {
  return (c: Context): boolean => {
    const first = c.cellOf(northWest);
    const second = c.cellOf(southEast);
    return (
      first !== undefined &&
      second !== undefined &&
      c.cell.row > first.row &&
      c.cell.col > first.col &&
      c.cell.row < second.row &&
      c.cell.col < second.col
    );
  };
}

/** Whether the suspect stood exactly one row north of somebody. */
function oneRowNorthOf(id: string): (c: Context) => boolean {
  return (c: Context): boolean => c.cellOf(id)?.row === c.cell.row + 1;
}

/** Whether the suspect's area held exactly the suspect and one other person. */
function aloneWith(id: string): (c: Context) => boolean {
  return (c: Context): boolean => {
    const there = c.peopleIn(c.areaOf(c.cell) ?? "");
    return there.length === 2 && there.includes(id);
  };
}

/** The case. */
export const A_DIRTY_BUSINESS: Level = {
  id: "a-dirty-business",
  name: "Eine schmutzige Angelegenheit",
  difficulty: "hard",
  story:
    "Valentino wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "H",
      name: "Hinterhof",
      at: "im Hinterhof",
      ground: "grass",
      tint: "#c3d79a",
      label: { row: 1, col: 1 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "floor",
      tint: "#a39a92",
      label: { row: 3, col: 0 },
    },
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#f3ddd2",
      label: { row: 6, col: 0 },
    },
    {
      key: "T",
      name: "Toilette",
      at: "in der Toilette",
      ground: "stone",
      tint: "#b9b2ab",
      label: { row: 3, col: 5 },
    },
    {
      key: "S",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "floor",
      tint: "#b49a98",
      label: { row: 6, col: 6 },
    },
    {
      key: "V",
      name: "Veranda",
      at: "auf der Veranda",
      ground: "floor",
      tint: "#b58e6c",
      label: { row: 7, col: 3 },
    },
    {
      key: "G",
      name: "Vorgarten",
      at: "im Vorgarten",
      ground: "grass",
      tint: "#d4e9a8",
      label: { row: 8, col: 0 },
    },
  ],
  areaMap: [
    ".HHHHHHH.",
    ".HHHHHHH.",
    "KKKWWTTTT",
    "KKKWWTTTT",
    "WWWWWWSSS",
    "WWWWWWSSS",
    "WWWVVVSSS",
    "GVVVVVVVG",
    "GGGGGGGGG",
  ],
  thingMap: [
    "...m..t..",
    ".t..r..r.",
    "d.d....c.",
    "d...m.d.m",
    ".....vd..",
    ".dc....bb",
    "c....m...",
    "..m......",
    "..r...rt.",
  ],
  things: {
    m: "mud",
    t: "tree",
    r: "rubble",
    d: "table",
    c: "chair",
    v: "tv",
    b: "bed",
  },
  suspects: [
    {
      id: "A",
      name: "Abigail",
      pronoun: "sie",
      clue: { text: "Sie war allein.", ...alone() },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Ben",
      pronoun: "er",
      clue: {
        text: "Er war südöstlich von Abigail und nordwestlich von Hawa.",
        ...about(["A", "H"], betweenDiagonally("A", "H")),
      },
      colour: "#15803d",
      face: "\u{1F468}\u{1F3FF}",
    },
    {
      id: "C",
      name: "Carl",
      pronoun: "er",
      clue: { text: "Er war auf einer Schlammpfütze.", ...on("mud") },
      colour: "#0e7490",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "D",
      name: "David",
      pronoun: "er",
      clue: { text: "Er war allein mit Carl.", ...counting(aloneWith("C")) },
      colour: "#6366f1",
      face: "\u{1F9D4}",
    },
    {
      id: "E",
      name: "Edgar",
      pronoun: "er",
      clue: { text: "Er war neben einem Baum.", ...beside("tree") },
      colour: "#7c3aed",
      face: "\u{1F9D4}\u{1F3FC}",
    },
    {
      id: "F",
      name: "France",
      pronoun: "sie",
      clue: { text: "Sie war auf einer Schlammpfütze.", ...on("mud") },
      colour: "#9f1239",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "G",
      name: "Grace",
      pronoun: "sie",
      clue: {
        text: "Sie saß auf einem Stuhl. Sie war genau eine Reihe nördlich von France.",
        ...all(on("chair"), about(["F"], oneRowNorthOf("F"))),
      },
      colour: "#ea580c",
      face: "\u{1F475}",
    },
    {
      id: "H",
      name: "Hawa",
      pronoun: "sie",
      clue: {
        text: "Sie war nicht neben einem Tisch.",
        ...not(beside("table")),
      },
      colour: "#0f766e",
      face: "\u{1F469}\u{1F3FE}",
    },
    {
      id: "V",
      name: "Valentino",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit dem Mörder.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F468}",
    },
  ],
  rules: [
    {
      text: "Kein Bereich war leer.",
      check: (c) =>
        c.level.areas.every((area) => c.peopleIn(area.key).length > 0),
    },
  ],
  hints: [
    {
      text: "In jeder Reihe steht genau eine Person. Küche und Toilette liegen nur in R3 und R4 und dürfen nicht leer sein. Also ist in R3 und R4 je eine Person allein in der Küche und allein in der Toilette. Blockiere das Wohnzimmer in R3 und R4.",
      cross: [
        { row: 2, col: 3 },
        { row: 2, col: 4 },
        { row: 3, col: 3 },
        { row: 3, col: 4 },
      ],
    },
    {
      text: "G sitzt genau eine Reihe nördlich von F, die auf einer Schlammpfütze ist. Säße G auf R3 C8, wäre F auf R4 C5 (gesperrt) oder auf R4 C9 - dann wären beide in der Toilette und die Küche bliebe leer. Also sitzt G im Wohnzimmer, und F ist auf der Veranda, auf R7 C6 oder R8 C3.",
    },
    {
      text: "C ist auf einer Schlammpfütze allein mit D. In der Toilette ist nur eine Person, auf der Veranda ist F - also bleibt nur R1 C4 im Hinterhof, und D ist bei ihm in R2. Für E neben einem Baum bleibt damit nur R9 C9 im Vorgarten.",
      place: { C: { row: 0, col: 3 }, E: { row: 8, col: 8 } },
    },
    {
      text: "Wer ist allein in Küche und Toilette? V nicht, denn V war mit dem Mörder zusammen. H nicht, denn A und B sind beide nördlich von ihr, und über R3 ist keine Reihe mehr frei. Also sind es A und B: A in R3, B südöstlich von ihr in R4 - A in der Küche, B in der Toilette. In R3 der Küche bleibt für A nur R3 C2.",
      place: { A: { row: 2, col: 1 } },
    },
    {
      text: "H ist südöstlich von B. Wäre B auf R4 C8, müsste H in C9 sein, und dort ist E. Also ist B auf R4 C6. Das sperrt C6: F ist auf R8 C3, und G sitzt eine Reihe nördlich auf R7 C1.",
      place: {
        B: { row: 3, col: 5 },
        F: { row: 7, col: 2 },
        G: { row: 6, col: 0 },
      },
    },
    {
      text: "Für D bleibt in R2 nur R2 C7. Übrig sind R5 und R6 in C5 und C8. H ist östlich von B in C8, aber nicht neben einem Tisch: also auf dem Bett in R6 C8. V ist auf R5 C5 im Wohnzimmer. V war allein mit G, Grace ist die Mörderin!",
      place: {
        D: { row: 1, col: 6 },
        H: { row: 5, col: 7 },
        V: { row: 4, col: 4 },
      },
    },
  ],
  solution: {
    A: { row: 2, col: 1 },
    B: { row: 3, col: 5 },
    C: { row: 0, col: 3 },
    D: { row: 1, col: 6 },
    E: { row: 8, col: 8 },
    F: { row: 7, col: 2 },
    G: { row: 6, col: 0 },
    H: { row: 5, col: 7 },
    V: { row: 4, col: 4 },
  },
};
