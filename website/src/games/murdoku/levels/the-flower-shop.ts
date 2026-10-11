/**
 * The Flower Shop: a flower shop with a preparation room, a sales floor and
 * a till, and a murdered customer.
 *
 * @module
 * @remarks
 * After the free case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Easy/Der Blumenladen.png`, no solution sheet).
 * Vickie is the victim; whoever was alone with her killed her.
 */
import {
  all,
  beside,
  column,
  counting,
  inArea,
  on,
  onGround,
  victim,
} from "../engine/clues";
import type { Level } from "../engine/types";

/** The case. */
export const THE_FLOWER_SHOP: Level = {
  id: "the-flower-shop",
  name: "Der Blumenladen",
  difficulty: "easy",
  series: { book: "online" },
  story:
    "Vickie wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "V",
      name: "Vorbereitung",
      at: "im Vorbereitungsbereich",
      ground: "floor",
      tint: "#fbeee8",
      label: { row: 2, col: 4 },
    },
    {
      key: "S",
      name: "Verkaufsfläche",
      at: "auf der Verkaufsfläche",
      ground: "floor",
      tint: "#f8d3cf",
      label: { row: 6, col: 0 },
    },
    {
      key: "K",
      name: "Kasse",
      at: "an der Kasse",
      ground: "floor",
      tint: "#f4c2c8",
      label: { row: 6, col: 5 },
    },
  ],
  areaMap: [
    "VVVVVVV",
    "VVVVVVV",
    "SSSSVVV",
    "SSSSKKK",
    "SSSSKKK",
    "SSSSKKK",
    "SSSSKKK",
  ],
  groundMap: [
    ".......",
    "....cc.",
    ".....c.",
    ".......",
    "..c....",
    "..c....",
    ".......",
  ],
  grounds: { ".": "floor", c: "carpet" },
  thingMap: [
    "tt.sff.",
    ".c.....",
    "f.f...s",
    "f.....s",
    "...fr.b",
    "s...tc.",
    "f..s...",
  ],
  things: {
    t: "table",
    s: "shelf",
    f: "flowers",
    c: "chair",
    r: "cashRegister",
    b: "bonsai",
  },
  // The rugs, as the page draws them.
  carpets: [
    [
      { row: 1, col: 4 },
      { row: 1, col: 5 },
      { row: 2, col: 5 },
    ],
    [
      { row: 4, col: 2 },
      { row: 5, col: 2 },
    ],
  ],
  extraThings: {
    cashRegister: {
      name: "Kasse",
      emoji: "\u{1F4B5}",
      standable: false,
    },
    bonsai: {
      name: "Bonsai",
      emoji: "\u{1FAB4}",
      standable: false,
      kinds: ["plant"],
    },
  },
  pieces: [{ at: { row: 0, col: 0 }, rows: 1, cols: 2 }],
  suspects: [
    {
      id: "A",
      name: "Amir",
      pronoun: "er",
      clue: { text: "Er war neben dem Bonsai.", ...beside("bonsai") },
      colour: "#b91c1c",
      face: "\u{1F468}",
    },
    {
      id: "B",
      name: "Bianca",
      pronoun: "sie",
      clue: { text: "Sie war im Vorbereitungsbereich.", ...inArea("V") },
      colour: "#15803d",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "C",
      name: "Carly",
      pronoun: "sie",
      clue: { text: "Sie war auf einem Teppich.", ...onGround("carpet") },
      colour: "#0e7490",
      face: "\u{1F475}",
    },
    {
      id: "D",
      name: "Diane",
      pronoun: "sie",
      clue: { text: "Sie saß auf einem Stuhl.", ...on("seat") },
      colour: "#6366f1",
      face: "\u{1F469}",
    },
    {
      id: "E",
      name: "Emmett",
      pronoun: "er",
      clue: { text: "Er war in der ersten Spalte.", ...column(1) },
      colour: "#7c3aed",
      face: "\u{1F9D4}",
    },
    {
      id: "F",
      name: "Felicia",
      pronoun: "sie",
      clue: {
        text: "Sie war auf der Verkaufsfläche. In ihrem Bereich war ein Mann.",
        ...all(
          inArea("S"),
          counting((c) =>
            c.peopleIn("S").some((id) => id !== c.self && c.has(id, "man")),
          ),
        ),
      },
      colour: "#9f1239",
      face: "\u{1F475}",
    },
    {
      id: "V",
      name: "Vickie",
      pronoun: "sie",
      clue: { text: "Sie war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F469}‍\u{1F9B0}",
    },
  ],
  hints: [
    {
      text: "F ist auf der Verkaufsfläche bei einem Mann. A, neben dem Bonsai, ist an der Kasse. E ist der einzige Mann, der bei F sein kann, das isoliert E in R5 C1.",
      place: { E: { row: 4, col: 0 } },
    },
    {
      text: "Das isoliert A auf dem letzten Feld neben dem Bonsai.",
      place: { A: { row: 5, col: 6 } },
    },
    {
      text: "Das isoliert D auf dem letzten Stuhl.",
      place: { D: { row: 1, col: 1 } },
    },
    {
      text: "Das isoliert C auf dem letzten Teppichfeld.",
      place: { C: { row: 2, col: 5 } },
    },
    {
      text: "Das isoliert B auf dem letzten Feld in der Vorbereitung.",
      place: { B: { row: 0, col: 2 } },
    },
    {
      text: "Das isoliert F auf dem letzten Feld auf der Verkaufsfläche, dann V auf dem letzten verbleibenden Feld.",
      place: { F: { row: 3, col: 3 }, V: { row: 6, col: 4 } },
    },
  ],
  solution: {
    A: { row: 5, col: 6 },
    B: { row: 0, col: 2 },
    C: { row: 2, col: 5 },
    D: { row: 1, col: 1 },
    E: { row: 4, col: 0 },
    F: { row: 3, col: 3 },
    V: { row: 6, col: 4 },
  },
};
