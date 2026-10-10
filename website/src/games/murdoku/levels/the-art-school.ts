/**
 * The Art School: a model platform, studios, a gallery - and a murder.
 *
 * @module
 * @remarks
 * After the medium case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Medium/TheArtSchool.png`, solution beside it).
 * Veronica was murdered; whoever was alone with her did it.
 */

import {
  all,
  alone,
  beside,
  counting,
  on,
  onGround,
  own,
  victim,
} from "../engine/clues";
import type { Level } from "../engine/types";

/** The case. */
export const THE_ART_SCHOOL: Level = {
  id: "the-art-school",
  name: "Kunstschule",
  difficulty: "medium",
  story:
    "Veronica wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "O",
      name: "Büro",
      at: "im Büro",
      ground: "floor",
      tint: "#c4b5fd",
      label: { row: 2, col: 0 },
    },
    {
      key: "M",
      name: "Modellpodest",
      at: "auf dem Modellpodest",
      ground: "floor",
      tint: "#fdf6e3",
      label: { row: 1, col: 2 },
    },
    {
      key: "S",
      name: "Lager",
      at: "im Lager",
      ground: "floor",
      tint: "#d6c7c0",
      label: { row: 2, col: 8 },
    },
    {
      key: "P",
      name: "Malatelier",
      at: "im Malatelier",
      ground: "floor",
      tint: "#f3e3c3",
      label: { row: 4, col: 6 },
    },
    {
      key: "G",
      name: "Galerie",
      at: "in der Galerie",
      ground: "floor",
      tint: "#f9d5d0",
      label: { row: 8, col: 0 },
    },
    {
      key: "K",
      name: "Bildhaueratelier",
      at: "im Bildhaueratelier",
      ground: "floor",
      tint: "#fbe0d6",
      label: { row: 8, col: 5 },
    },
  ],
  areaMap: [
    "OOMMMMMSS",
    "OOMMMMMSS",
    "OPPPPPPPS",
    "PPPPPPPPP",
    "PPPPPPPPP",
    "GGPPPPPKK",
    "GGGGGKKKK",
    "GGGGGKKKK",
    "GGGGGKKKK",
  ],
  groundMap: [
    "...ccc...",
    "...ccc...",
    ".........",
    ".........",
    ".........",
    ".c.......",
    ".c.......",
    ".cccc....",
    ".........",
  ],
  grounds: { c: "carpet", ".": "floor" },
  thingMap: [
    "cp....shh",
    "t..s.c..e",
    ".ce...tc.",
    ".ces.....",
    "..cee.e..",
    "p.....cc.",
    "s.ptpss.s",
    ".....c.sc",
    "..s...ct.",
  ],
  things: {
    c: "chair",
    p: "painting",
    s: "statue",
    h: "shelf",
    t: "table",
    e: "easel",
  },
  suspects: [
    {
      id: "A",
      name: "Anthony",
      pronoun: "er",
      clue: { text: "Er war allein.", ...alone() },
      colour: "#b91c1c",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "B",
      name: "Ben",
      pronoun: "er",
      clue: {
        text: "Auf seinem Feld war ein gerahmtes Bild.",
        ...on("painting"),
      },
      colour: "#15803d",
      face: "\u{1F468}",
    },
    {
      id: "C",
      name: "Coralie",
      pronoun: "sie",
      clue: { text: "Sie war neben einer Statue.", ...beside("statue") },
      colour: "#0e7490",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "D",
      name: "Delilah",
      pronoun: "sie",
      clue: {
        text: "Eine Reihe nördlich von ihr war eine Frau allein in der Galerie.",
        ...all(
          own((c) => c.cell.row > 0),
          counting((c) =>
            c
              .peopleIn("G")
              .some(
                (one) =>
                  one !== c.self &&
                  c.peopleIn("G").length === 1 &&
                  c.has(one, "woman") &&
                  c.cellOf(one)?.row === c.cell.row - 1,
              ),
          ),
        ),
      },
      colour: "#6366f1",
      face: "\u{1F469}",
    },
    {
      id: "E",
      name: "Everly",
      pronoun: "sie",
      clue: {
        text: "Sie war neben einer Staffelei, direkt südlich davon.",
        ...all(
          beside("easel"),
          own((c) => {
            const above = { row: c.cell.row - 1, col: c.cell.col };
            return c.is(above, "easel") && c.areaOf(above) === c.areaOf(c.cell);
          }),
        ),
      },
      colour: "#7c3aed",
      face: "\u{1F475}",
    },
    {
      id: "F",
      name: "Fritz",
      pronoun: "er",
      clue: { text: "Er war auf einem Teppich.", ...onGround("carpet") },
      colour: "#9f1239",
      face: "\u{1F9D4}",
    },
    {
      id: "G",
      name: "Ginevra",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person, die auf einem Stuhl saß.",
        ...all(
          on("seat"),
          counting(
            (c) =>
              c.people().filter((one) => {
                const there = c.cellOf(one);
                return there !== undefined && c.is(there, "seat");
              }).length === 1,
          ),
        ),
      },
      colour: "#ea580c",
      face: "\u{1F469}",
    },
    {
      id: "H",
      name: "Hartley",
      pronoun: "er",
      clue: { text: "Er war neben einem Tisch.", ...beside("table") },
      colour: "#4338ca",
      face: "\u{1F474}",
    },
    {
      id: "V",
      name: "Veronica",
      pronoun: "sie",
      clue: { text: "Sie war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F469}",
    },
  ],
  hints: [
    {
      text: "Laut Delilahs Hinweis war eine Frau allein in der Galerie. Damit bleibt für Ben nur das letzte gerahmte Bild, in Reihe 1, Spalte 2.",
      place: { B: { row: 0, col: 1 } },
    },
    {
      text: "Fritz kann ebenfalls nicht in der Galerie sein, und er saß nicht auf einem Stuhl (Ginevras Hinweis). Damit bleibt für ihn nur das letzte Teppichfeld auf dem Modellpodest.",
      place: { F: { row: 1, col: 4 } },
    },
    {
      text: "Delilah ist eine Reihe südlich einer Frau, die allein in der Galerie war - sie kann also nur im Bildhaueratelier sein. Die beiden Personen in Reihe 4 und 5 können nur im Malatelier sein. Anthony kann also nur allein im Lager sein. Damit steht Anthony fest.",
      place: { A: { row: 2, col: 8 } },
    },
    {
      text: "Everly kann nicht auf einem Stuhl sitzen (Ginevras Hinweis). Direkt südlich einer Staffelei bleibt ihr nur Reihe 6, Spalte 4.",
      place: { E: { row: 5, col: 3 } },
    },
    {
      text: "Die Frau allein in der Galerie, eine Reihe nördlich von Delilah, kann nur Coralie sein (Veronica kann nicht allein sein). Damit steht Coralie neben der Statue in Reihe 8, Spalte 1. Streiche den Rest der Galerie.",
      place: { C: { row: 7, col: 0 } },
    },
    {
      text: "Damit stehen Delilah (nicht auf einem Stuhl) und Hartley fest.",
      place: { D: { row: 8, col: 5 }, H: { row: 3, col: 6 } },
    },
    {
      text: "Damit bleibt für Ginevra nur der letzte Stuhl.",
      place: { G: { row: 4, col: 2 } },
    },
    {
      text: "Veronica steht auf dem letzten Feld, allein mit Delilah. Delilah ist die Mörderin!",
      place: { V: { row: 6, col: 7 } },
    },
  ],
  solution: {
    A: { row: 2, col: 8 },
    B: { row: 0, col: 1 },
    C: { row: 7, col: 0 },
    D: { row: 8, col: 5 },
    E: { row: 5, col: 3 },
    F: { row: 1, col: 4 },
    G: { row: 4, col: 2 },
    H: { row: 3, col: 6 },
    V: { row: 6, col: 7 },
  },
};
