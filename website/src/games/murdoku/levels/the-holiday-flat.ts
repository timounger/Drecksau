/**
 * The Holiday Flat: a bedroom, a bathroom, a guest room and a living room of a
 * rented flat, with a murdered guest.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Ferienwohnung/Ferienwohnung.png`, no
 * solution sheet), with the culprit pencilled in on the photographed page.
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
    "Jemand wird die Kaution für das AirBnB verlieren, wenn diese Blutflecken nicht beseitigt werden. Oscar wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
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
  suspects: [
    {
      id: "A",
      name: "Arianna",
      pronoun: "sie",
      traits: ["glasses"],
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
      traits: ["glasses"],
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
      text: "Kollege, dieser kleine Notizblock könnte praktisch sein, um dir Notizen zu machen. Du kannst dich später bei mir bedanken. - Chief Williams",
    },
  ],
  hints: [
    {
      text: "Es gibt nur einen Stuhl, den Sessel in R2 C1 - dort saß Bernd. Blockiere den Rest von R2 und C1.",
      place: { B: { row: 1, col: 0 } },
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
      ],
    },
    {
      text: "Dario lag auf einem Bett neben einer Pflanze. Die Pflanze in R5 C1 steht im Wohnzimmer, nicht neben einem Bett; nur das Bettende in R3 C6 liegt neben der Pflanze in R2 C6. Dario war in R3 C6 - blockiere den Rest von R3 und C6.",
      place: { D: { row: 2, col: 5 } },
      cross: [
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
      text: "Arianna war neben einem Fernseher. Am Fernseher in R1 C5 sind R1 C6 und R2 C5 schon blockiert, am Fernseher in R6 C1 steht in R5 C1 eine Pflanze. Also war Arianna in R6 C2 - blockiere den Rest von R6 und C2.",
      place: { A: { row: 5, col: 1 } },
      cross: [
        { row: 5, col: 2 },
        { row: 5, col: 3 },
        { row: 5, col: 4 },
        { row: 0, col: 1 },
        { row: 3, col: 1 },
        { row: 4, col: 1 },
      ],
    },
    {
      text: "Frei sind nur noch R1, R4 und R5 in C3, C4 und C5. Erik war neben einem Bett: Davon liegt nur R4 C5 neben dem Bett im Gästezimmer. Erik war in R4 C5.",
      place: { E: { row: 3, col: 4 } },
    },
    {
      text: "Colleen war im Badezimmer, also in R1 - R1 C3 ist ein Tisch, darum R1 C4. Oscar blieb das letzte Feld, R5 C3. Im Wohnzimmer war er allein mit Arianna - Arianna ist die Mörderin!",
      place: { C: { row: 0, col: 3 }, O: { row: 4, col: 2 } },
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
