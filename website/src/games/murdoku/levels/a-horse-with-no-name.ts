/**
 * A Horse with No Name: a desert with a gorge and a hut, a horse, an outlaw
 * hiding among the suspects and a murdered stranger.
 *
 * @module
 * @remarks
 * After the free case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Easy/Ein Pferd ohne Namen.png`, no solution
 * sheet; the solver proves the case has exactly one solution). Vin is the
 * victim; whoever was alone with him killed him. Exactly one suspect is the
 * outlaw, and the outlaw sat on the horse - so somebody sits on it, and it
 * is not Vin. The horse and the chair can be sat on; the cacti, the
 * boulders and the table cannot.
 */
import { about, all, beside, inArea, not, on, victim } from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** Whether somebody sits on the horse. */
function somebodyOnTheHorse(c: Context): boolean {
  return c.people().some((id) => {
    const there = c.cellOf(id);
    return there !== undefined && c.is(there, "horse");
  });
}

/** The case. */
export const A_HORSE_WITH_NO_NAME: Level = {
  id: "a-horse-with-no-name",
  name: "Ein Pferd ohne Namen",
  difficulty: "easy",
  series: { book: "online" },
  story:
    "Vin wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "S",
      name: "Schlucht",
      at: "in der Schlucht",
      ground: "stone",
      tint: "#d8c3a8",
      label: { row: 1, col: 3 },
    },
    {
      key: "W",
      name: "Wüste",
      at: "in der Wüste",
      ground: "sand",
      tint: "#f2dc8c",
      label: { row: 5, col: 4 },
    },
    {
      key: "H",
      name: "Hütte",
      at: "in der Hütte",
      ground: "floor",
      tint: "#d9b8a2",
      label: { row: 5, col: 1 },
    },
  ],
  areaMap: [".SSSS.", "WWSSSS", "WWWWWW", "HHWWWW", "HHWWWW", "HHWWW."],
  thingMap: ["....b.", ".k...b", "....p.", ".....k", "r.b...", "t....."],
  things: {
    b: "boulder",
    k: "cactus",
    p: "horse",
    r: "chair",
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
      name: "Aldous",
      pronoun: "er",
      clue: { text: "Er war neben einem Kaktus.", ...beside("cactus") },
      colour: "#b91c1c",
      face: "\u{1F9D4}",
    },
    {
      id: "B",
      name: "Blanche",
      pronoun: "sie",
      clue: {
        text: "Sie war nicht in der Wüste. Sie war auf derselben Diagonale wie Aldous.",
        ...all(
          not(inArea("W")),
          about(["A"], (c) => {
            const aldous = c.cellOf("A");
            return (
              aldous !== undefined &&
              Math.abs(aldous.row - c.cell.row) ===
                Math.abs(aldous.col - c.cell.col)
            );
          }),
        ),
      },
      colour: "#15803d",
      face: "\u{1F475}",
    },
    {
      id: "C",
      name: "Cornelius",
      pronoun: "er",
      clue: {
        text: "Er war nördlich von Aldous.",
        ...about(["A"], (c) => {
          const aldous = c.cellOf("A");
          return aldous !== undefined && c.cell.row < aldous.row;
        }),
      },
      colour: "#0e7490",
      face: "\u{1F468}",
    },
    {
      id: "D",
      name: "Dahlia",
      pronoun: "sie",
      clue: { text: "Sie war neben dem Tisch.", ...beside("table") },
      colour: "#6366f1",
      face: "\u{1F469}",
    },
    {
      id: "E",
      name: "Emeric",
      pronoun: "er",
      clue: { text: "Er war neben einem Felsbrocken.", ...beside("boulder") },
      colour: "#7c3aed",
      face: "\u{1F9D4}",
    },
    {
      id: "V",
      name: "Vin",
      pronoun: "er",
      clue: {
        text: "Nicht der Gesetzlose. Er war allein mit dem Mörder.",
        ...all(victim(), not(on("horse"))),
      },
      colour: "#d97706",
      face: "\u{1F468}",
    },
  ],
  rules: [
    {
      text: "Es versteckt sich genau ein Gesetzloser unter den Verdächtigen. Der Gesetzlose kann der Mörder sein oder nicht.",
    },
    {
      text: "Der Gesetzlose war auf dem Pferd.",
      check: somebodyOnTheHorse,
    },
  ],
  hints: [
    {
      text: "Der Gesetzlose muss in R3 C5 auf dem Pferd sein. Blockiere den Rest von R3 und C5.",
      cross: [
        { row: 2, col: 0 },
        { row: 2, col: 1 },
        { row: 2, col: 2 },
        { row: 2, col: 3 },
        { row: 2, col: 5 },
        { row: 0, col: 4 },
        { row: 1, col: 4 },
        { row: 3, col: 4 },
        { row: 4, col: 4 },
        { row: 5, col: 4 },
      ],
    },
    {
      text: "Welcher Verdächtige kann der Gesetzlose auf dem Pferd sein? A, B, D und E passen nicht in R3 C5, also ist C die einzige Möglichkeit.",
      place: { C: { row: 2, col: 4 } },
    },
    {
      text: "Das isoliert A auf dem einzigen Feld neben einem Kaktus südlich von C, in R5 C6.",
      place: { A: { row: 4, col: 5 } },
    },
    {
      text: "Das isoliert D auf dem letzten Feld neben einem Tisch, dann B auf dem letzten Feld auf derselben Diagonale wie A.",
      place: { D: { row: 5, col: 1 }, B: { row: 1, col: 2 } },
    },
    {
      text: "Das isoliert E auf dem letzten Feld neben einem Felsbrocken. V befindet sich auf dem letzten verbleibenden Feld.",
      place: { E: { row: 0, col: 3 }, V: { row: 3, col: 0 } },
    },
  ],
  solution: {
    A: { row: 4, col: 5 },
    B: { row: 1, col: 2 },
    C: { row: 2, col: 4 },
    D: { row: 5, col: 1 },
    E: { row: 0, col: 3 },
    V: { row: 3, col: 0 },
  },
};
