/**
 * Game Night: a guest room, a bathroom, a living room with the game table, a
 * bedroom and a kitchen, with a murdered woman.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Spieleabend/Spieleabend.png`, no
 * solution sheet - the solver proves the one solution, with the culprit
 * pencilled in on the photographed page).
 * Ondine is the victim; whoever was alone with her killed her.
 *
 * The armchairs and the beds can be stood on; the plants and the tables (the
 * game table and the two kitchen tables) cannot. Sitting on a chair means
 * being on an armchair.
 */
import { all, beside, counting, inArea, on, victim } from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** Whether nobody but the suspect stood on a thing of this id. */
function onlyOneOn(what: string): (c: Context) => boolean {
  return (c: Context): boolean =>
    c.people().every((id) => {
      const there = c.cellOf(id);
      return id === c.self || there === undefined || !c.is(there, what);
    });
}

/** The case. */
export const GAME_NIGHT: Level = {
  id: "game-night",
  name: "Spieleabend",
  series: { book: "original", number: 21 },
  story: "Jemand muss direkt ins Gefängnis ... ohne vorher über LOS zu gehen.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "G",
      name: "Gästezimmer",
      at: "im Gästezimmer",
      ground: "floor",
      tint: "#ecdcdc",
      label: { row: 1, col: 0 },
    },
    {
      key: "B",
      name: "Badezimmer",
      at: "im Badezimmer",
      ground: "floor",
      tint: "#dde8ee",
      label: { row: 1, col: 4 },
    },
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "carpet",
      tint: "#f3dfc8",
      label: { row: 3, col: 2 },
    },
    {
      key: "S",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "floor",
      tint: "#e2e6dc",
      label: { row: 5, col: 0 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "floor",
      tint: "#e6e2d6",
      label: { row: 5, col: 4 },
    },
  ],
  areaMap: ["GGGBBB", "GGGBBB", "SWWWWB", "SWWWWB", "SSSKKK", "SSSKKK"],
  thingMap: ["bb.pc.", "......", "pcttc.", ".cttp.", "...t..", ".bb..t"],
  things: { b: "bed", c: "chair", p: "plant", t: "table" },
  pieces: [
    { at: { row: 0, col: 0 }, rows: 1, cols: 2 },
    { at: { row: 2, col: 2 }, rows: 2, cols: 2 },
    { at: { row: 5, col: 1 }, rows: 1, cols: 2 },
  ],
  suspects: [
    {
      id: "A",
      name: "Ali",
      pronoun: "er",
      clue: { text: "Er war neben einem Tisch.", ...beside("table") },
      colour: "#b91c1c",
      face: "\u{1F9D1}‍\u{1F9B0}",
    },
    {
      id: "B",
      name: "Briana",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person, die auf einem Stuhl saß.",
        ...all(on("chair"), counting(onlyOneOn("chair"))),
      },
      colour: "#15803d",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "C",
      name: "Cosima",
      pronoun: "sie",
      clue: { text: "Sie war im Gästezimmer.", ...inArea("G") },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Dima",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person auf einem Bett.",
        ...all(on("bed"), counting(onlyOneOn("bed"))),
      },
      colour: "#a16207",
      face: "\u{1F468}‍\u{1F9B0}",
    },
    {
      id: "E",
      name: "Elias",
      pronoun: "er",
      clue: { text: "Er war neben einer Pflanze.", ...beside("plant") },
      colour: "#7c3aed",
      face: "\u{1F9D4}",
    },
    {
      id: "O",
      name: "Ondine",
      pronoun: "sie",
      clue: {
        text: "Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F475}",
    },
  ],
  rules: [
    {
      text: "Es gab keinen leeren Raum.",
      check: (c) =>
        c.level.areas.every((area) => c.peopleIn(area.key).length > 0),
    },
  ],
  hints: [
    {
      text: "Sechs Personen in fünf Räumen und kein Raum ist leer: Genau ein Raum hat zwei Personen - Ondine und den Mörder. Im Wohnzimmer sind nur die Sessel R3 C2, R4 C2 und R3 C5 frei, wer dort ist, sitzt. Nur Briana saß, also war sie allein im Wohnzimmer. Auf den Sessel R1 C5 setzt sich niemand.",
      cross: [{ row: 0, col: 4 }],
    },
    {
      text: "Ali war neben einem Tisch. Die Felder am Spieltisch sind Sessel, also stand er in der Küche neben einem Tisch, in R5 oder R6. Elias war neben einer Pflanze: Ohne die Sessel bleiben nur R2 C4 und R4 C1.",
    },
    {
      text: "Dima war die einzige Person auf einem Bett. Läge er in R1 im Gästezimmer, wäre Cosima dort bei ihm - zwei Personen ohne Ondine. Also lag Dima in R6 im Schlafzimmer, und Ali stand in R5. Cosima steht nicht auf dem Bett im Gästezimmer.",
      cross: [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
      ],
    },
    {
      text: "Stünde Elias in R4 C1, wären er und Dima zu zweit im Schlafzimmer, ohne Ondine. Also war Elias in R2 C4. Damit blieb für Cosima im Gästezimmer nur R1 C3.",
      place: { E: { row: 1, col: 3 }, C: { row: 0, col: 2 } },
    },
    {
      text: "C3 ist besetzt, also lag Dima in R6 C2. In C2 ist kein Sessel mehr frei: Briana saß in R3 C5. Ali stand in R5, C5 ist besetzt - R5 C6.",
      place: {
        D: { row: 5, col: 1 },
        B: { row: 2, col: 4 },
        A: { row: 4, col: 5 },
      },
    },
    {
      text: "Ondine blieb das letzte Feld, R4 C1. Im Schlafzimmer war sie allein mit Dima - Dima ist der Mörder!",
      place: { O: { row: 3, col: 0 } },
    },
  ],
  solution: {
    A: { row: 4, col: 5 },
    B: { row: 2, col: 4 },
    C: { row: 0, col: 2 },
    D: { row: 5, col: 1 },
    E: { row: 1, col: 3 },
    O: { row: 3, col: 0 },
  },
};
