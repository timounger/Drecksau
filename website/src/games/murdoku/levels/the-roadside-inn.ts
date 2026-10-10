/**
 * The Roadside Inn: a kitchen, a guest room, a dining hall and the street in
 * front of a medieval inn, with a murdered innkeeper.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Das Gasthaus am Wegesrand/Das Gasthaus am Wegesrand.png`,
 * no solution sheet). The book's rule for crowned areas (nobles - the purple
 * cards - only there) makes it unique, with the culprit
 * pencilled in on the photographed page.
 * Odo is the victim; whoever was alone with him killed him.
 *
 * Chairs, the bed and the horses can be stood on; barrels and tables cannot.
 * Sitting means being on a chair or on a horse.
 */
import {
  about,
  column,
  inArea,
  nobility,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Level } from "../engine/types";

/** The case. */
export const THE_ROADSIDE_INN: Level = {
  id: "the-roadside-inn",
  name: "Das Gasthaus am Wegesrand",
  series: { book: "timeTravel", number: 1 },
  story:
    "Eigentlich ist das hier nur eine Zwischenstation, keine Endstation. Odo wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "floor",
      tint: "#e9dfc4",
      label: { row: 1, col: 1 },
    },
    {
      key: "G",
      name: "Gästezimmer",
      at: "im Gästezimmer",
      ground: "carpet",
      tint: "#c9b2e6",
      label: { row: 1, col: 4 },
    },
    {
      key: "S",
      name: "Speisesaal",
      at: "im Speisesaal",
      ground: "stone",
      tint: "#c8c4cc",
      label: { row: 3, col: 3 },
    },
    {
      key: "R",
      name: "Straße",
      at: "auf der Straße",
      ground: "stone",
      tint: "#9a98b0",
      label: { row: 5, col: 3 },
    },
  ],
  areaMap: ["KKKKGG", "KKSSGG", "SSSSSS", "SSSSSS", "SSSRRR", "RRRR.."],
  thingMap: [".a.a.b", "t...cb", ".ttc..", "tac...", "t....h", "h....."],
  things: {
    a: "barrel",
    b: "bed",
    c: "chair",
    h: "horse",
    t: "table",
  },
  extraThings: {
    horse: {
      name: "Pferd",
      emoji: "\u{1F40E}",
      standable: true,
      kinds: ["seat", "animal"],
    },
  },
  suspects: [
    {
      id: "A",
      name: "Alice",
      pronoun: "sie",
      traits: ["noble"],
      clue: { text: "Sie saß auf einem Stuhl.", ...on("chair") },
      colour: "#7c3aed",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Bart",
      pronoun: "er",
      clue: {
        text: "Er war südlich von Clementia und östlich von Odo.",
        ...about(["C", "O"], (c) => {
          const clementia = c.cellOf("C");
          const odo = c.cellOf("O");
          return (
            clementia !== undefined &&
            odo !== undefined &&
            c.cell.row > clementia.row &&
            c.cell.col > odo.col
          );
        }),
      },
      colour: "#15803d",
      face: "\u{1F468}",
    },
    {
      id: "C",
      name: "Clementia",
      pronoun: "sie",
      clue: { text: "Sie war in der ersten Spalte.", ...column(1) },
      colour: "#0e7490",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "D",
      name: "Duncan",
      pronoun: "er",
      clue: {
        text: "Er saß entweder auf einem Stuhl oder auf einem Pferd.",
        ...own((c) => c.is(c.cell, "chair") || c.is(c.cell, "horse")),
      },
      colour: "#334155",
      face: "\u{1F9D4}",
    },
    {
      id: "E",
      name: "Elija",
      pronoun: "er",
      clue: { text: "Er war in der Küche.", ...inArea("K") },
      colour: "#b91c1c",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "O",
      name: "Odo",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F474}",
    },
  ],
  rules: [nobility("Adlige (\u{1F451}) waren nur im Gästezimmer.", ["G"])],
  hints: [
    {
      text: "Alice ist adlig, also im Gästezimmer. Dort sitzt sie auf dem einzigen Stuhl, R2 C5. Blockiere den Rest von R2 und C5.",
      place: { A: { row: 1, col: 4 } },
      cross: [
        { row: 0, col: 4 },
        { row: 1, col: 1 },
        { row: 1, col: 2 },
        { row: 1, col: 3 },
        { row: 1, col: 5 },
        { row: 2, col: 4 },
        { row: 3, col: 4 },
        { row: 4, col: 4 },
      ],
    },
    {
      text: "Clementia steht in C1, also bleibt Elija in der Küche nur R1 C3. Clementia kann nicht auf das Pferd in R6 C1 (Bart muss südlich von ihr stehen), also steht sie in R3 C1.",
      place: { E: { row: 0, col: 2 }, C: { row: 2, col: 0 } },
    },
    {
      text: "Duncan sitzt auf einem Stuhl oder Pferd. R3 C4, R4 C3 und R6 C1 sind gesperrt, also sitzt er auf dem Pferd in R5 C6.",
      place: { D: { row: 4, col: 5 } },
    },
    {
      text: "Für Bart und Odo bleiben R4 und R6 in C2 und C4. Bart steht östlich von Odo, also Bart in C4 und Odo in C2 - R4 C2 ist ein Fass, also Odo in R6 C2 und Bart in R4 C4. Odo war allein mit Duncan auf der Straße - Duncan ist der Mörder!",
      place: { B: { row: 3, col: 3 }, O: { row: 5, col: 1 } },
    },
  ],
  solution: {
    A: { row: 1, col: 4 },
    B: { row: 3, col: 3 },
    C: { row: 2, col: 0 },
    D: { row: 4, col: 5 },
    E: { row: 0, col: 2 },
    O: { row: 5, col: 1 },
  },
};
