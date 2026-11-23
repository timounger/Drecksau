/**
 * Die Ausgrabung: an excavation near Cairo with two digging fields, the main
 * dig, a store and a tent, and a murdered archaeologist.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 3 - Auf Weltreise/14. Die Ausgrabung.jpeg`,
 * no solution sheet - the solver proves the solution is the only one).
 * Omnia is the victim; whoever was alone with her killed her.
 *
 * The map is eight by eight. The statues and the obelisk (the legend's two
 * things), the rocks, the crates and the table in the tent cannot be stood
 * on, as the empty grid on the page greys them out; the chairs can. Gamila
 * was alone in the tent with one other woman ({@link withOneWoman}).
 */
import {
  about,
  all,
  beside,
  counting,
  inArea,
  on,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** Whether exactly one other person stood in the suspect's area, a woman. */
function withOneWoman(c: Context): boolean {
  const others = c
    .peopleIn(c.areaOf(c.cell) ?? "")
    .filter((id) => id !== c.self);
  return others.length === 1 && others.every((id) => c.has(id, "woman"));
}

/** The case. */
export const THE_EXCAVATION: Level = {
  id: "the-excavation",
  name: "Die Ausgrabung",
  series: { book: "worldTravel", number: 14 },
  story:
    "Klären wir die Rätsel der jüngsten Vergangenheit, damit sich gleich alle wieder der uralten widmen können.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "A",
      name: "Grabungsfeld 1",
      at: "auf Grabungsfeld 1",
      ground: "stone",
      tint: "#e3d3b8",
      label: { row: 3, col: 0 },
    },
    {
      key: "H",
      name: "Hauptgrabung",
      at: "auf der Hauptgrabung",
      ground: "sand",
      tint: "#f3ecb4",
      label: { row: 6, col: 2 },
    },
    {
      key: "B",
      name: "Grabungsfeld 2",
      at: "auf Grabungsfeld 2",
      ground: "stone",
      tint: "#ddc9a8",
      label: { row: 3, col: 5 },
    },
    {
      key: "L",
      name: "Lager",
      at: "im Lager",
      ground: "floor",
      tint: "#b9a8e0",
      label: { row: 7, col: 1 },
    },
    {
      key: "Z",
      name: "Zelt",
      at: "im Zelt",
      ground: "carpet",
      tint: "#e6b3cf",
      label: { row: 7, col: 6 },
    },
  ],
  areaMap: [
    "AAAHHHHH",
    "AAHHBBBB",
    "AAHHBBBB",
    "AAHHBBBB",
    "AHHHBZZB",
    "HHHHZZZZ",
    "HHHHZZZZ",
    "LLLLZZZZ",
  ],
  thingMap: [
    "........",
    "x..r...r",
    ".r....o.",
    ".......x",
    ".....x..",
    "k...tt..",
    ".c....cx",
    "...kcx..",
  ],
  things: {
    c: "chair",
    k: "crate",
    o: "obelisk",
    r: "boulder",
    t: "table",
    x: "statue",
  },
  extraThings: {
    obelisk: { name: "Obelisk", emoji: "\u{1F5FC}", standable: false },
  },
  pieces: [{ at: { row: 5, col: 4 }, rows: 1, cols: 2 }],
  suspects: [
    {
      id: "A",
      name: "Abdullah",
      pronoun: "er",
      clue: { text: "Er war neben einer Statue.", ...beside("statue") },
      colour: "#7c3aed",
      face: "\u{1F474}\u{1F3FD}",
    },
    {
      id: "B",
      name: "Basim",
      pronoun: "er",
      clue: { text: "Er saß auf einem Stuhl.", ...on("chair") },
      colour: "#92400e",
      face: "\u{1F9D4}\u{1F3FC}",
    },
    {
      id: "C",
      name: "Chaima",
      pronoun: "sie",
      clue: { text: "Sie war neben dem Obelisken.", ...beside("obelisk") },
      colour: "#ca8a04",
      face: "\u{1F469}\u{1F3FE}\u{200D}\u{1F9B1}",
    },
    {
      id: "D",
      name: "Dawoud",
      pronoun: "er",
      clue: { text: "Er war auf der Hauptgrabung.", ...inArea("H") },
      colour: "#a16207",
      face: "\u{1F468}\u{1F3FD}",
    },
    {
      id: "E",
      name: "Ebrahim",
      pronoun: "er",
      clue: { text: "Er war neben einer Kiste.", ...beside("crate") },
      colour: "#57534e",
      face: "\u{1F9D4}\u{1F3FE}",
    },
    {
      id: "F",
      name: "Fatiha",
      pronoun: "sie",
      clue: {
        text: "Sie war südlich von Gamila.",
        ...about(["G"], (c) => {
          const gamila = c.cellOf("G");
          return gamila !== undefined && c.cell.row > gamila.row;
        }),
      },
      colour: "#ca8a04",
      face: "\u{1F469}\u{1F3FD}",
    },
    {
      id: "G",
      name: "Gamila",
      pronoun: "sie",
      clue: {
        text: "Sie war allein mit einer anderen Frau im Zelt.",
        ...all(inArea("Z"), counting(withOneWoman)),
      },
      colour: "#be185d",
      face: "\u{1F469}\u{1F3FF}",
    },
    {
      id: "O",
      name: "Omnia",
      pronoun: "sie",
      clue: {
        text: "Das Opfer. Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#b91c1c",
      face: "\u{1F469}\u{1F3FB}",
    },
  ],
  hints: [
    {
      text: "Im Zelt sind genau zwei: Gamila und eine andere Frau. Chaima steht neben dem Obelisken auf Grabungsfeld 2, nicht im Zelt. Basim kann also auf keinem der beiden Zeltstühle sitzen - er sitzt in R7 C2.",
      place: { B: { row: 6, col: 1 } },
    },
    {
      text: "Ebrahim war neben einer Kiste. Neben der Kiste in R6 C1 liegen auf der Hauptgrabung nur R7 C1 und R6 C2 - Basims Zeile und Spalte. Er steht also im Lager neben der anderen Kiste: R8 C3.",
      place: { E: { row: 7, col: 2 } },
    },
    {
      text: "Gamila steht im Zelt, aber nicht in den Zeilen 7 und 8. Fatiha war südlich von ihr - das geht nur, wenn Gamila in Zeile 5 steht: R5 C7 (R5 C6 ist eine Statue). Fatiha steht dann in Zeile 6.",
      place: { G: { row: 4, col: 6 } },
    },
    {
      text: "Stünde Fatiha in R6 C4 auf der Hauptgrabung, wären die Zeilen 5 bis 8 vergeben und Gamila allein im Zelt. Fatiha ist die andere Frau im Zelt: R6 C8 (R6 C5 und R6 C6 sind der Tisch, C7 ist Gamilas Spalte).",
      place: { F: { row: 5, col: 7 } },
    },
    {
      text: "Neben dem Obelisken liegen R2 C7, R4 C7, R3 C6 und R3 C8 - frei ist nur R3 C6 für Chaima. Abdullah war neben einer Statue: Im Zelt ist kein Platz mehr, und die Statue auf Grabungsfeld 2 hat nur Felder in vergebenen Zeilen und Spalten. Bleibt R1 C1 auf Grabungsfeld 1.",
      place: { C: { row: 2, col: 5 }, A: { row: 0, col: 0 } },
    },
    {
      text: "Frei sind noch die Zeilen 2 und 4 und die Spalten 4 und 5. Dawoud auf der Hauptgrabung steht in R4 C4 (R2 C4 ist ein Felsen). Für Omnia bleibt R2 C5 auf Grabungsfeld 2 - allein mit Chaima. Chaima ist die Mörderin!",
      place: { D: { row: 3, col: 3 }, O: { row: 1, col: 4 } },
    },
  ],
  solution: {
    A: { row: 0, col: 0 },
    B: { row: 6, col: 1 },
    C: { row: 2, col: 5 },
    D: { row: 3, col: 3 },
    E: { row: 7, col: 2 },
    F: { row: 5, col: 7 },
    G: { row: 4, col: 6 },
    O: { row: 1, col: 4 },
  },
};
