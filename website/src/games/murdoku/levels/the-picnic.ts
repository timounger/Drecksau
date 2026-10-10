/**
 * Das Picknick: a picnic ground, a garden, a pond and a pavilion - and a
 * murdered picnic guest.
 *
 * @module
 * @remarks
 * After the free case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Easy/Das Picknick.png`, no solution sheet).
 * Vicky is the victim; whoever was alone with her killed her.
 */
import { about, all, beside, inArea, on, victim } from "../engine/clues";
import type { Level } from "../engine/types";

/** The case. */
export const THE_PICNIC: Level = {
  id: "the-picnic",
  name: "Das Picknick",
  difficulty: "easy",
  story:
    "Vicky wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "P",
      name: "Picknickbereich",
      at: "im Picknickbereich",
      ground: "grass",
      tint: "#86d48a",
      label: { row: 6, col: 1 },
    },
    {
      key: "G",
      name: "Garten",
      at: "im Garten",
      ground: "grass",
      tint: "#7ccf86",
      label: { row: 3, col: 5 },
    },
    {
      key: "T",
      name: "Teich",
      at: "im Teich",
      ground: "water",
      tint: "#a9b4ec",
      label: { row: 5, col: 3 },
    },
    {
      key: "V",
      name: "Pavillon",
      at: "im Pavillon",
      ground: "stone",
      tint: "#f1dcec",
      label: { row: 6, col: 5 },
    },
  ],
  areaMap: [
    "PPPPGGG",
    "PPPPGGG",
    "PPTTGGG",
    "PPTTTGG",
    "PPTTVVV",
    "PPPTVVV",
    "PPPPVVV",
  ],
  thingMap: [
    ".cc.f.f",
    "trr...f",
    ".......",
    "...b..t",
    "c.....c",
    "......c",
    "rrc.cs.",
  ],
  things: {
    c: "chair",
    f: "flowers",
    t: "tree",
    r: "rug",
    b: "boulder",
    s: "table",
  },
  suspects: [
    {
      id: "A",
      name: "Avery",
      pronoun: "sie",
      clue: { text: "Sie war auf einem Teppich.", ...on("rug") },
      colour: "#15803d",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Bruno",
      pronoun: "er",
      traits: ["glasses"],
      clue: {
        text: "Er saß auf einem Stuhl im Pavillon.",
        ...all(on("seat"), inArea("V")),
      },
      colour: "#4338ca",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "C",
      name: "Christian",
      pronoun: "er",
      clue: { text: "Er war im Picknickbereich.", ...inArea("P") },
      colour: "#a16207",
      face: "\u{1F9D4}",
    },
    {
      id: "D",
      name: "Daphne",
      pronoun: "sie",
      clue: {
        text: "Sie war neben Blumen und neben einem Baum.",
        ...all(beside("flowers"), beside("tree")),
      },
      colour: "#be185d",
      face: "\u{1F469}",
    },
    {
      id: "E",
      name: "Ethan",
      pronoun: "er",
      clue: { text: "Er saß auf einem Stuhl.", ...on("seat") },
      colour: "#334155",
      face: "\u{1F468}",
    },
    {
      id: "F",
      name: "Fabian",
      pronoun: "er",
      clue: {
        text: "Er war im Teich. Er war nördlich von Ethan.",
        ...all(
          inArea("T"),
          about(["E"], (c) => {
            const ethan = c.cellOf("E");
            return ethan !== undefined && c.cell.row < ethan.row;
          }),
        ),
      },
      colour: "#1d4ed8",
      face: "\u{1F468}\u{1F3FE}",
    },
    {
      id: "V",
      name: "Vicky",
      pronoun: "sie",
      clue: { text: "Sie war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F475}",
    },
  ],
  hints: [
    {
      text: "Es gibt nur ein Feld, auf dem D neben Blumen und neben einem Baum sein kann. Das isoliert D im Garten in der letzten Spalte. Sperre ihre ganze Zeile und Spalte.",
      place: { D: { row: 2, col: 6 } },
    },
    {
      text: "Das isoliert B auf dem einzigen Stuhl, der im Pavillon übrig bleibt. Da E südlich von F ist, kann er nicht in der obersten Zeile sein. Das isoliert E auf dem letzten freien Stuhl.",
      place: { B: { row: 6, col: 4 }, E: { row: 4, col: 0 } },
    },
    {
      text: "Das isoliert F auf dem letzten Feld im Teich, das auch nördlich von E liegt, und damit A auf dem letzten Feld mit Teppich. Das isoliert C auf dem letzten Feld im Picknickbereich und danach V. V war allein mit B, Bruno ist der Mörder!",
      place: {
        F: { row: 3, col: 2 },
        A: { row: 1, col: 1 },
        C: { row: 0, col: 3 },
        V: { row: 5, col: 5 },
      },
    },
  ],
  solution: {
    A: { row: 1, col: 1 },
    B: { row: 6, col: 4 },
    C: { row: 0, col: 3 },
    D: { row: 2, col: 6 },
    E: { row: 4, col: 0 },
    F: { row: 3, col: 2 },
    V: { row: 5, col: 5 },
  },
};
