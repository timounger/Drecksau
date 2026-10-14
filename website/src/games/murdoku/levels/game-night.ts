/**
 * Game Night: a guest room, a bathroom, a living room with the game table, a
 * bedroom and a kitchen, with a murdered woman.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Spieleabend/Spieleabend.png`,
 * solution sheet
 * `game_instructions/Murdoku/Das Murdoku-Orginal/Lösungen 1-80/Lösung 21-24.JPG`).
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
      text: "Da es fünf Räume und fünf Verdächtige gibt, und kein Raum leer ist, müssen alle Verdächtigen in verschiedenen Räumen sein. (Wenn zwei Verdächtige zusammen in einem Raum wären, müsste Ondine allein in einem Raum sein, was unmöglich ist.)",
    },
    {
      text: "Da Briana die einzige Person auf einem Stuhl ist, kann nur Briana im Wohnzimmer sein.",
    },
    { text: "Ali, neben einem Tisch, ist in der Küche." },
    {
      text: "Dima kann nicht mit Cosima im Gästezimmer sein; er muss im Schlafzimmer sein. Elias kann nicht mit Dima zusammen sein und ist nicht auf einem Stuhl; das lokalisiert Elias im Badezimmer.",
      place: { E: { row: 1, col: 3 } },
    },
    {
      text: "Das lokalisiert Cosima (die laut Dimas Hinweis nicht auf dem Bett ist), dann Dima, dann Briana, dann Ali.",
      place: {
        C: { row: 0, col: 2 },
        D: { row: 5, col: 1 },
        B: { row: 2, col: 4 },
        A: { row: 4, col: 5 },
      },
    },
    {
      text: "Das lokalisiert Ondine im Schlafzimmer. Dima ist der Mörder!",
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
