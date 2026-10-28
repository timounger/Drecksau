/**
 * Machu Picchu: the terraced ruins in the region of Cusco, Peru - a ramp,
 * three sections of stone, a stair, the plaza and the lower terrace - with
 * a murdered visitor.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 3 - Auf Weltreise/23. Machu Picchu.png`,
 * solution sheet `23. Machu Picchu_Lösung.png`). Ollo is the victim;
 * whoever was alone with her killed her.
 *
 * The map is nine by nine with its corners missing and holds no things.
 * The sign "Mittlerer Abschnitt" belongs to the stone section in the north
 * west, "Oberer Abschnitt" to the one in the north east - as the solution
 * sheet shows, where Braulio stands in the upper section in R7 C9.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  about,
  all,
  column,
  counting,
  inArea,
  row,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** Whether the suspect's area held exactly one man and one other woman besides her. */
function withAManAndAWoman(c: Context): boolean {
  const others = c
    .peopleIn(c.areaOf(c.cell) ?? "")
    .filter((id) => id !== c.self);
  return (
    others.length === 2 &&
    others.some((id) => c.has(id, "woman")) &&
    others.some((id) => !c.has(id, "woman"))
  );
}

/** The case. */
export const MACHU_PICCHU: Level = {
  id: "machu-picchu",
  name: "Machu Picchu",
  series: { book: "worldTravel", number: 23 },
  story:
    "Woher wussten die alten Peruaner immer so gut Bescheid? Sie hatten ihre Inka-Quellen! Okay, zurück zum Mord.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "M",
      name: "Mittlerer Abschnitt",
      at: "im mittleren Abschnitt",
      ground: "stone",
      tint: "#ddd5c0",
      label: { row: 5, col: 1 },
    },
    {
      key: "R",
      name: "Rampe",
      at: "auf der Rampe",
      ground: "stone",
      tint: "#c4bba8",
      label: { row: 1, col: 1 },
    },
    {
      key: "O",
      name: "Oberer Abschnitt",
      at: "im oberen Abschnitt",
      ground: "stone",
      tint: "#d8d0bb",
      label: { row: 1, col: 5 },
    },
    {
      key: "T",
      name: "Treppe",
      at: "auf der Treppe",
      ground: "stone",
      tint: "#c9c1ae",
      label: { row: 4, col: 5 },
    },
    {
      key: "P",
      name: "Plaza",
      at: "auf der Plaza",
      ground: "grass",
      tint: "#9cc56f",
      label: { row: 7, col: 3 },
    },
    {
      key: "L",
      name: "Untere Terrasse",
      at: "auf der unteren Terrasse",
      ground: "grass",
      tint: "#86b85c",
      label: { row: 8, col: 4 },
    },
    {
      key: "U",
      name: "Unterer Abschnitt",
      at: "im unteren Abschnitt",
      ground: "stone",
      tint: "#e2dac6",
      label: { row: 8, col: 1 },
    },
  ],
  areaMap: [
    "MMMMMO...",
    "MRRMMOOO.",
    "MMPPPTOO.",
    "MMPPPTOOO",
    "MMPPPTTOO",
    "UMMPPPPOO",
    "UUUPPPLLO",
    "UUUPPPLLL",
    ".UUULLLL.",
  ],
  thingMap: [
    ".........",
    ".........",
    ".........",
    ".........",
    ".........",
    ".........",
    ".........",
    ".........",
    ".........",
  ],
  things: {},
  suspects: [
    {
      id: "A",
      name: "Anabella",
      pronoun: "sie",
      clue: { text: "Sie war in der fünften Spalte.", ...column(5) },
      colour: "#b45309",
      face: "\u{1F469}\u{200D}\u{1F9B0}",
    },
    {
      id: "B",
      name: "Braulio",
      pronoun: "er",
      clue: { text: "Er war im oberen Abschnitt.", ...inArea("O") },
      colour: "#15803d",
      face: "\u{1F4F7}",
    },
    {
      id: "C",
      name: "Camila",
      pronoun: "sie",
      clue: { text: "Sie war auf der Rampe.", ...inArea("R") },
      colour: "#0e7490",
      face: "\u{1F469}\u{200D}\u{1F33E}",
    },
    {
      id: "D",
      name: "Dulce",
      pronoun: "sie",
      clue: {
        text: "Sie war auf der Plaza, allein mit einem Mann und einer weiteren Frau.",
        ...all(inArea("P"), counting(withAManAndAWoman)),
      },
      colour: "#4338ca",
      face: "\u{1F469}\u{1F3FE}",
    },
    {
      id: "E",
      name: "Esteban",
      pronoun: "er",
      clue: { text: "Er war auf der Treppe.", ...inArea("T") },
      colour: "#312e81",
      face: "\u{1F468}\u{1F3FD}",
    },
    {
      id: "F",
      name: "Fernando",
      pronoun: "er",
      clue: {
        text: "Er war südwestlich von Guadalupe.",
        ...about(["G"], (c) => {
          const guadalupe = c.cellOf("G");
          return (
            guadalupe !== undefined &&
            c.cell.row > guadalupe.row &&
            c.cell.col < guadalupe.col
          );
        }),
      },
      colour: "#292524",
      face: "\u{1F60E}",
    },
    {
      id: "G",
      name: "Guadalupe",
      pronoun: "sie",
      clue: {
        text: "Sie war genau zwei Zeilen südlich und zwei Spalten östlich von Camila.",
        ...about(["C"], (c) => {
          const camila = c.cellOf("C");
          return (
            camila !== undefined &&
            c.cell.row === camila.row + 2 &&
            c.cell.col === camila.col + 2
          );
        }),
      },
      colour: "#c2410c",
      face: "\u{1F469}\u{1F3FD}",
    },
    {
      id: "H",
      name: "Honorio",
      pronoun: "er",
      clue: { text: "Er war in der obersten Zeile.", ...row(1) },
      colour: "#1e1b4b",
      face: "\u{1F468}\u{1F3FE}\u{200D}\u{1F9B2}",
    },
    {
      id: "O",
      name: "Ollo",
      pronoun: "sie",
      clue: {
        text: "Das Opfer. Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#9f1239",
      face: "\u{1F469}",
    },
  ],
  hints: [
    {
      text: "Camila ist auf der Rampe, in R2 C2 oder R2 C3. Guadalupe steht zwei Zeilen südlich und zwei Spalten östlich von ihr - in C5 nicht, das ist Anabellas Spalte. Also steht Camila in R2 C2 und Guadalupe in R4 C4, auf der Plaza.",
      place: { C: { row: 1, col: 1 }, G: { row: 3, col: 3 } },
    },
    {
      text: "Dulce war auf der Plaza allein mit einem Mann und einer weiteren Frau - die Frau ist Guadalupe. Der Mann ist weder Braulio (oberer Abschnitt), Esteban (Treppe) noch Honorio (oberste Zeile): Es bleibt Fernando, auf der Plaza südwestlich von Guadalupe. Dort ist nur R5 C3 frei.",
      place: { F: { row: 4, col: 2 } },
    },
    {
      text: "Esteban steht auf der Treppe: R3 C6 ist das einzige Feld außerhalb von Fernandos und Guadalupes Zeilen. Honorio steht in R1 - C2 bis C4 sind besetzte Spalten, C5 ist Anabellas, C6 Estebans: R1 C1. Dulce bleibt auf der Plaza nur R6 C7 (C5 ist Anabellas Spalte).",
      place: {
        E: { row: 2, col: 5 },
        H: { row: 0, col: 0 },
        D: { row: 5, col: 6 },
      },
    },
    {
      text: "Braulio im oberen Abschnitt: frei sind nur noch die Zeilen 7 bis 9 und die Spalten 5, 8 und 9 - es bleibt R7 C9.",
      place: { B: { row: 6, col: 8 } },
    },
    {
      text: "Auf der Plaza sind schon drei Personen, Anabella steht also in C5 außerhalb: nur R9 C5 auf der unteren Terrasse. Ollo bleibt das letzte Feld, R8 C8 - allein auf der unteren Terrasse mit Anabella. Anabella ist die Mörderin!",
      place: { A: { row: 8, col: 4 }, O: { row: 7, col: 7 } },
    },
  ],
  solution: {
    A: { row: 8, col: 4 },
    B: { row: 6, col: 8 },
    C: { row: 1, col: 1 },
    D: { row: 5, col: 6 },
    E: { row: 2, col: 5 },
    F: { row: 4, col: 2 },
    G: { row: 3, col: 3 },
    H: { row: 0, col: 0 },
    O: { row: 7, col: 7 },
  },
};
