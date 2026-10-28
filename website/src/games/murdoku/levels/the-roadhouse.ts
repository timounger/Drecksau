/**
 * Das Roadhouse: the outback, a roadhouse, the petrol pumps and the road at
 * Coober Pedy, Australia, with a murdered traveller.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 3 - Auf Weltreise/3. Das Roadhouse.png`,
 * no solution sheet - the solved grid and the culprit are pencilled in on
 * the photographed page, and the solver proves it is the only solution).
 * Ossie is the victim; whoever was alone with him killed him.
 *
 * The map is six by six. The cars can be sat in; the shelves, the counter,
 * the pumps and the bush cannot be stood on. The lizard in the outback is
 * only a picture.
 */
import { beside, inArea, on, victim } from "../engine/clues";
import type { Level } from "../engine/types";

/** The case. */
export const THE_ROADHOUSE: Level = {
  id: "the-roadhouse",
  name: "Das Roadhouse",
  series: { book: "worldTravel", number: 3 },
  story: "Selbst die Cola-Dosen sehen verrostet aus.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "O",
      name: "Outback",
      at: "im Outback",
      ground: "sand",
      tint: "#e8c38a",
      label: { row: 4, col: 0 },
    },
    {
      key: "R",
      name: "Roadhouse",
      at: "im Roadhouse",
      ground: "floor",
      tint: "#c9b8a6",
      label: { row: 2, col: 3 },
    },
    {
      key: "T",
      name: "Tankbereich",
      at: "im Tankbereich",
      ground: "stone",
      tint: "#b9b5b0",
      label: { row: 4, col: 4 },
    },
    {
      key: "S",
      name: "Straße",
      at: "auf der Straße",
      ground: "stone",
      tint: "#a8a29e",
      label: { row: 5, col: 4 },
    },
  ],
  areaMap: ["OOORRR", "OOORRR", "OOORRR", "OOTTTT", "OOTTTT", "SSSSSS"],
  thingMap: ["...hhh", "....tt", "b...t.", "...pp.", "..cc..", "cc...."],
  things: {
    b: "shrub",
    c: "car",
    h: "shelf",
    p: "pump",
    t: "table",
  },
  extraThings: {
    pump: { name: "Zapfsäule", emoji: "\u{26FD}", standable: false },
  },
  pieces: [
    { at: { row: 4, col: 2 }, rows: 1, cols: 2 },
    { at: { row: 5, col: 0 }, rows: 1, cols: 2 },
  ],
  // The counter, round a corner.
  shapes: [
    [
      { row: 1, col: 4 },
      { row: 1, col: 5 },
      { row: 2, col: 4 },
    ],
  ],
  suspects: [
    {
      id: "A",
      name: "Aubrey",
      pronoun: "sie",
      clue: { text: "Sie war in einem Auto.", ...on("car") },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Brian",
      pronoun: "er",
      clue: { text: "Er war neben einer Zapfsäule.", ...beside("pump") },
      colour: "#7c3aed",
      face: "\u{1F468}",
    },
    {
      id: "C",
      name: "Cassandra",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Regal.", ...beside("shelf") },
      colour: "#be185d",
      face: "\u{1F469}\u{200D}\u{1F9B1}",
    },
    {
      id: "D",
      name: "Dean",
      pronoun: "er",
      clue: { text: "Er war neben dem Busch.", ...beside("shrub") },
      colour: "#a16207",
      face: "\u{1F920}",
    },
    {
      id: "E",
      name: "Edison",
      pronoun: "er",
      clue: { text: "Er war im Roadhouse.", ...inArea("R") },
      colour: "#334155",
      face: "\u{1F474}",
    },
    {
      id: "O",
      name: "Ossie",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#b91c1c",
      face: "\u{1F9D4}",
    },
  ],
  hints: [
    {
      text: "Cassandra war neben einem Regal. Die Regale stehen in R1 C4 bis C6; darunter liegen R2 C5 und R2 C6 unter der Theke - es bleibt R2 C4.",
      place: { C: { row: 1, col: 3 } },
    },
    {
      text: "Edison war im Roadhouse. R1 sind Regale, R2 ist Cassandras Zeile, und in R3 ist C4 ihre Spalte und C5 die Theke - Edison steht in R3 C6.",
      place: { E: { row: 2, col: 5 } },
    },
    {
      text: "Dean war neben dem Busch in R3 C1. Daneben liegen im Outback R2 C1 (Cassandras Zeile), R3 C2 (Edisons Zeile) und R4 C1 - Dean steht in R4 C1.",
      place: { D: { row: 3, col: 0 } },
    },
    {
      text: "Brian war neben einer Zapfsäule (R4 C4 und R4 C5): R4 ist Deans Zeile, R4 C6 und R5 C6 liegen in Edisons Spalte, R5 C4 in Cassandras - er steht in R5 C5.",
      place: { B: { row: 4, col: 4 } },
    },
    {
      text: "Aubrey war in einem Auto: Das im Tankbereich steht in Brians Zeile, und auf der Straße ist R6 C1 Deans Spalte - sie sitzt in R6 C2. Ossie bleibt R1 C3 im Outback, allein mit Dean. Dean ist der Mörder!",
      place: { A: { row: 5, col: 1 }, O: { row: 0, col: 2 } },
    },
  ],
  solution: {
    A: { row: 5, col: 1 },
    B: { row: 4, col: 4 },
    C: { row: 1, col: 3 },
    D: { row: 3, col: 0 },
    E: { row: 2, col: 5 },
    O: { row: 0, col: 2 },
  },
};
