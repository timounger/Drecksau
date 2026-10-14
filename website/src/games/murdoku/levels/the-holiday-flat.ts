/**
 * The Holiday Flat: a bedroom, a bathroom, a guest room and a living room of a
 * rented flat, with a murdered guest.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Ferienwohnung/Ferienwohnung.png`,
 * solution sheet
 * `game_instructions/Murdoku/Das Murdoku-Orginal/Lösungen 1-80/Lösung 01-04.JPG`).
 * Oscar is the victim; whoever was alone with him killed him.
 *
 * The armchair and the beds can be stood on; the plants, the TVs and the two
 * dark side tables cannot. Sitting on the chair means being on the armchair.
 */
import { all, beside, inArea, on, victim } from "../engine/clues";
import type { Level } from "../engine/types";

/** The case. */
export const THE_HOLIDAY_FLAT: Level = {
  id: "the-holiday-flat",
  name: "Ferienwohnung",
  series: { book: "original", number: 2 },
  story:
    "Jemand wird die Kaution für das AirBnB verlieren, wenn diese Blutflecken nicht beseitigt werden.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "S",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "floor",
      tint: "#d6e6ee",
      label: { row: 3, col: 0 },
    },
    {
      key: "B",
      name: "Badezimmer",
      at: "im Badezimmer",
      ground: "stone",
      tint: "#cfe4f2",
      label: { row: 3, col: 2 },
    },
    {
      key: "G",
      name: "Gästezimmer",
      at: "im Gästezimmer",
      ground: "floor",
      tint: "#d9e8ee",
      label: { row: 3, col: 4 },
    },
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "stone",
      tint: "#c4dfec",
      label: { row: 5, col: 1 },
    },
  ],
  areaMap: ["SSBBGG", "SSBBGG", "SSBBGG", "SSBBGG", "WWWWWW", "WWWWWW"],
  thingMap: ["..t.f.", "c....p", "bb..bb", "......", "p.....", "f..t.."],
  things: {
    b: "bed",
    c: "chair",
    f: "tv",
    p: "plant",
    t: "table",
  },
  pieces: [
    { at: { row: 2, col: 0 }, rows: 1, cols: 2 },
    { at: { row: 2, col: 4 }, rows: 1, cols: 2 },
  ],
  suspects: [
    {
      id: "A",
      name: "Arianna",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Fernseher.", ...beside("tv") },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Bernd",
      pronoun: "er",
      clue: { text: "Er saß auf dem Stuhl.", ...on("chair") },
      colour: "#15803d",
      face: "\u{1F468}",
    },
    {
      id: "C",
      name: "Colleen",
      pronoun: "sie",
      clue: { text: "Sie war im Badezimmer.", ...inArea("B") },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Dario",
      pronoun: "er",
      clue: {
        text: "Er war neben einer Pflanze und er war auf einem Bett.",
        ...all(beside("plant"), on("bed")),
      },
      colour: "#7c3aed",
      face: "\u{1F474}",
    },
    {
      id: "E",
      name: "Erik",
      pronoun: "er",
      clue: { text: "Er war neben einem Bett.", ...beside("bed") },
      colour: "#334155",
      face: "\u{1F468}",
    },
    {
      id: "O",
      name: "Oscar",
      pronoun: "er",
      clue: { text: "Er war im letzten verbleibenden Feld.", ...victim() },
      colour: "#d97706",
      face: "\u{1F9D4}",
    },
  ],
  rules: [
    {
      note: true,
      text: "Kollege, dieser kleine Notizblock könnte praktisch sein, um dir Notizen zu machen. Du kannst dich später bei mir bedanken. - Chief Williams",
    },
  ],
  hints: [
    {
      text: "Wir können Bernd auf dem Stuhl lokalisieren, und Dario in Zeile 3, Spalte 6.",
      place: { B: { row: 1, col: 0 }, D: { row: 2, col: 5 } },
      cross: [
        { row: 1, col: 1 },
        { row: 1, col: 2 },
        { row: 1, col: 3 },
        { row: 1, col: 4 },
        { row: 1, col: 5 },
        { row: 0, col: 0 },
        { row: 2, col: 0 },
        { row: 3, col: 0 },
        { row: 4, col: 0 },
        { row: 5, col: 0 },
        { row: 2, col: 2 },
        { row: 2, col: 3 },
        { row: 2, col: 4 },
        { row: 0, col: 5 },
        { row: 3, col: 5 },
        { row: 4, col: 5 },
        { row: 5, col: 5 },
      ],
    },
    {
      text: "Erik muss dann in Zeile 4 sein, entweder in Spalte 2 oder Spalte 5.",
    },
    {
      text: "Colleen muss dann im Badezimmer sein, Spalte 4.",
      place: { C: { row: 0, col: 3 } },
    },
    {
      text: "Arianna kann nur im letzten Feld neben einem Fernseher sein, im Wohnzimmer, Spalte 2.",
      place: { A: { row: 5, col: 1 } },
    },
    {
      text: "So lassen sich Erik und Oscar lokalisieren.",
      place: { E: { row: 3, col: 4 }, O: { row: 4, col: 2 } },
    },
    {
      text: "Arianna war allein mit Oscar im Wohnzimmer. Arianna ist die Mörderin!",
    },
  ],
  solution: {
    A: { row: 5, col: 1 },
    B: { row: 1, col: 0 },
    C: { row: 0, col: 3 },
    D: { row: 2, col: 5 },
    E: { row: 3, col: 4 },
    O: { row: 4, col: 2 },
  },
};
