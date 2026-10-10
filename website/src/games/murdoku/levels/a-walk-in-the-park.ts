/**
 * A Walk in the Park: a park round a lake, with a boat rental and a bonsai
 * exhibit, and a murder.
 *
 * @module
 * @remarks
 * After the free case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Easy/AWalkInThePark.png`, solution beside it).
 * Vince is the victim; whoever was alone with him killed him.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  all,
  beside,
  counting,
  inArea,
  on,
  onGround,
  row,
  victim,
} from "../engine/clues";
import type { Level } from "../engine/types";

/** The case. */
export const A_WALK_IN_THE_PARK: Level = {
  id: "a-walk-in-the-park",
  name: "Ein Spaziergang im Park",
  difficulty: "easy",
  story:
    "Vince wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "N",
      name: "Nordseite",
      at: "auf der Nordseite",
      ground: "grass",
      tint: "#c9eeb0",
      label: { row: 1, col: 3 },
    },
    {
      key: "W",
      name: "Toilette",
      at: "in der Toilette",
      ground: "floor",
      tint: "#cfe3f7",
      label: { row: 2, col: 8 },
    },
    {
      key: "R",
      name: "Bootsverleih",
      at: "im Bootsverleih",
      ground: "floor",
      tint: "#c3dcf5",
      label: { row: 4, col: 2 },
    },
    {
      key: "L",
      name: "See",
      at: "im See",
      ground: "water",
      label: { row: 6, col: 4 },
    },
    {
      key: "S",
      name: "Südseite",
      at: "auf der Südseite",
      ground: "grass",
      tint: "#bfe8a6",
      label: { row: 8, col: 0 },
    },
    {
      key: "X",
      name: "Bonsai-Ausstellung",
      at: "in der Bonsai-Ausstellung",
      ground: "floor",
      tint: "#ddd0ee",
      label: { row: 8, col: 5 },
    },
  ],
  areaMap: [
    "NNNNNNNWW",
    "NNNNNNNWW",
    "NNRRLLNNW",
    "SSRRLLLNN",
    "SSRRLLLNN",
    "SSSLLLLNN",
    "SSSLLLNNN",
    "SSSSSSSXX",
    "SSSSXXXXX",
  ],
  groundMap: [
    "GGGGGGGFF",
    "GPPPPPPFF",
    "GPFFWWPPF",
    "GPFFWWWPG",
    "GPFFWWWPG",
    "GPPWWWWPG",
    "GGPWWWPPG",
    "GGPPPPPFF",
    "GGGGFFFFF",
  ],
  grounds: { G: "grass", P: "path", F: "floor", W: "water" },
  thingMap: [
    "..c.ft..c",
    "t.......k",
    ".........",
    "..b..lb..",
    "........t",
    "t....b..c",
    "f...l....",
    "c......z.",
    "ft.f.z..z",
  ],
  things: {
    c: "chair",
    f: "flowers",
    t: "tree",
    k: "table",
    b: "boat",
    l: "lilyPad",
    z: "bonsai",
  },
  extraThings: {
    lilyPad: {
      name: "Seerosenblatt",
      emoji: "\u{1FAB7}",
      standable: false,
      kinds: ["plant"],
    },
    bonsai: {
      name: "Bonsai",
      emoji: "\u{1FAB4}",
      standable: false,
      kinds: ["plant"],
    },
  },
  suspects: [
    {
      id: "A",
      name: "Alba",
      pronoun: "sie",
      clue: {
        text: "Sie war neben einem leeren Boot.",
        ...all(
          beside("boat"),
          counting((c) =>
            c
              .neighbours(c.cell)
              .some((next) => c.is(next, "boat") && c.personAt(next) === null),
          ),
        ),
      },
      colour: "#b91c1c",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "B",
      name: "Blair",
      pronoun: "sie",
      clue: { text: "Sie war in der untersten Reihe.", ...row(9) },
      colour: "#15803d",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "C",
      name: "Cassian",
      pronoun: "er",
      clue: { text: "Er saß auf einem Stuhl.", ...on("seat") },
      colour: "#0e7490",
      face: "\u{1F468}",
    },
    {
      id: "D",
      name: "Daphne",
      pronoun: "sie",
      clue: { text: "Sie war neben Blumen.", ...beside("flowers") },
      colour: "#6366f1",
      face: "\u{1F469}",
    },
    {
      id: "E",
      name: "Elias",
      pronoun: "er",
      clue: { text: "Er war in der Toilette.", ...inArea("W") },
      colour: "#7c3aed",
      face: "\u{1F9D1}",
    },
    {
      id: "F",
      name: "Fina",
      pronoun: "sie",
      clue: { text: "Sie war auf einem Weg.", ...onGround("path") },
      colour: "#9f1239",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "G",
      name: "Gordon",
      pronoun: "er",
      clue: { text: "Er war in der Bonsai-Ausstellung.", ...inArea("X") },
      colour: "#ea580c",
      face: "\u{1F468}‍\u{1F9B1}",
    },
    {
      id: "H",
      name: "Hana",
      pronoun: "sie",
      clue: { text: "Sie war auf einem Boot.", ...on("boat") },
      colour: "#4338ca",
      face: "\u{1F475}",
    },
    {
      id: "V",
      name: "Vince",
      pronoun: "er",
      clue: { text: "Er war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F9D4}",
    },
  ],
  hints: [
    {
      text: "Blair ist in der untersten Reihe, Reihe 9. Gordon in der Bonsai-Ausstellung kann dann nur noch in Reihe 8, Spalte 9 stehen.",
      place: { G: { row: 7, col: 8 } },
    },
    {
      text: "Damit bleibt für Cassian nur noch ein Stuhl.",
      place: { C: { row: 0, col: 2 } },
    },
    {
      text: "Damit bleibt für Elias nur noch ein Feld in der Toilette.",
      place: { E: { row: 1, col: 7 } },
    },
    {
      text: "Damit bleibt für Daphne nur noch ein Feld neben Blumen.",
      place: { D: { row: 6, col: 1 } },
    },
    {
      text: "Damit bleibt für Fina nur noch ein Feld auf einem Weg.",
      place: { F: { row: 2, col: 6 } },
    },
    {
      text: "Damit bleibt für Hana nur noch ein Boot - und für Blair nur noch ein Feld in Reihe 9.",
      place: { H: { row: 5, col: 5 }, B: { row: 8, col: 4 } },
    },
    {
      text: "Damit bleibt für Alba nur noch ein Feld neben einem Boot.",
      place: { A: { row: 3, col: 3 } },
    },
    {
      text: "Für Vince bleibt das letzte Feld, allein mit Daphne auf der Südseite. Daphne ist die Mörderin!",
      place: { V: { row: 4, col: 0 } },
    },
  ],
  solution: {
    A: { row: 3, col: 3 },
    B: { row: 8, col: 4 },
    C: { row: 0, col: 2 },
    D: { row: 6, col: 1 },
    E: { row: 1, col: 7 },
    F: { row: 2, col: 6 },
    G: { row: 7, col: 8 },
    H: { row: 5, col: 5 },
    V: { row: 4, col: 0 },
  },
};
