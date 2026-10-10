/**
 * The Backyard Garden: a house with its garden, pond and shed, and a murder.
 *
 * @module
 * @remarks
 * After the free case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Easy/TheBackyardGarden.png`, solution beside
 * it). Violet is the victim; whoever was alone with her killed her.
 */
import {
  about,
  alone,
  all,
  beside,
  inArea,
  on,
  onGround,
  victim,
} from "../engine/clues";
import type { Level } from "../engine/types";

/** The case. */
export const THE_BACKYARD_GARDEN: Level = {
  id: "the-backyard-garden",
  name: "Der Hinterhofgarten",
  difficulty: "easy",
  story:
    "Violet wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "Y",
      name: "Hinterhof",
      at: "im Hinterhof",
      ground: "grass",
      tint: "#b5ead7",
      label: { row: 5, col: 2 },
    },
    {
      key: "P",
      name: "Teich",
      at: "im Teich",
      ground: "water",
      label: { row: 1, col: 3 },
    },
    {
      key: "G",
      name: "Garten",
      at: "im Garten",
      ground: "stone",
      tint: "#cbbcb2",
      label: { row: 2, col: 7 },
    },
    {
      key: "S",
      name: "Schuppen",
      at: "im Schuppen",
      ground: "floor",
      tint: "#e2cdb8",
      label: { row: 4, col: 1 },
    },
    {
      key: "U",
      name: "Wintergarten",
      at: "im Wintergarten",
      ground: "floor",
      tint: "#e4e0f5",
      label: { row: 5, col: 7 },
    },
    {
      key: "B",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "floor",
      tint: "#f6edb8",
      label: { row: 8, col: 0 },
    },
    {
      key: "L",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#fbdcc0",
      label: { row: 8, col: 3 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "floor",
      tint: "#fbe6c2",
      label: { row: 8, col: 6 },
    },
  ],
  areaMap: [
    "YYYPPPYGG",
    "YYPPPPYGG",
    "YYPYYYYGG",
    "YYYYYYYYY",
    "SSSYUUUUU",
    "SYYYUUUUU",
    "YYBLLLKKK",
    "BBBLLLKKK",
    "BBBLLLKKK",
  ],
  groundMap: [
    "GGGWWWGSS",
    "GGWWWWGSS",
    "GGWGGGGSS",
    "GGGGGGGGG",
    "FFFGFFFFF",
    "FGGGFCCFF",
    "GGFFFFFFF",
    "FFCFFFCCF",
    "FFCFFFCFF",
  ],
  grounds: { G: "grass", W: "water", S: "stone", F: "floor", C: "carpet" },
  thingMap: [
    ".t......f",
    "..l......",
    ".....t.f.",
    "f.....f.k",
    "s.....ckc",
    "....c....",
    ".f.svs...",
    ".k.k....k",
    "bb..c..sk",
  ],
  things: {
    t: "tree",
    f: "flowers",
    l: "lilyPad",
    k: "table",
    s: "shelf",
    c: "chair",
    v: "tv",
    b: "bed",
  },
  extraThings: {
    lilyPad: {
      name: "Seerosenblatt",
      emoji: "\u{1FAB7}",
      standable: false,
      kinds: ["plant"],
    },
  },
  suspects: [
    {
      id: "A",
      name: "Aaron",
      pronoun: "er",
      clue: {
        text: "Er war mit Elyse im Wohnzimmer.",
        ...all(
          inArea("L"),
          about(["E"], (c) => {
            const there = c.cellOf("E");
            return there !== undefined && c.areaOf(there) === "L";
          }),
        ),
      },
      colour: "#b91c1c",
      face: "\u{1F468}",
    },
    {
      id: "B",
      name: "Bruce",
      pronoun: "er",
      clue: { text: "Er war im Schuppen.", ...inArea("S") },
      colour: "#15803d",
      face: "\u{1F9D1}",
    },
    {
      id: "C",
      name: "Carissa",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Baum.", ...beside("tree") },
      colour: "#0e7490",
      face: "\u{1F469}‍\u{1F9B3}",
    },
    {
      id: "D",
      name: "Denise",
      pronoun: "sie",
      clue: {
        text: "Sie war im Schlafzimmer oder im Wintergarten.",
        ...inArea("B", "U"),
      },
      colour: "#6366f1",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "E",
      name: "Elyse",
      pronoun: "sie",
      clue: { text: "Sie saß auf einem Stuhl.", ...on("seat") },
      colour: "#7c3aed",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "F",
      name: "Franklin",
      pronoun: "er",
      clue: { text: "Er war auf einem Teppich.", ...onGround("carpet") },
      colour: "#9f1239",
      face: "\u{1F9D4}",
    },
    {
      id: "G",
      name: "Gilbert",
      pronoun: "er",
      clue: { text: "Er war im Garten.", ...inArea("G") },
      colour: "#ea580c",
      face: "\u{1F474}",
    },
    {
      id: "H",
      name: "Holden",
      pronoun: "er",
      clue: { text: "Er war allein.", ...alone() },
      colour: "#4338ca",
      face: "\u{1F468}",
    },
    {
      id: "V",
      name: "Violet",
      pronoun: "sie",
      clue: { text: "Sie war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F475}",
    },
  ],
  hints: [
    {
      text: "Nach Aarons Hinweis sind Aaron und Elyse beide im Wohnzimmer. Elyse sitzt also auf dem Stuhl im Wohnzimmer, in Reihe 9, Spalte 5. Streiche ihre Reihe und Spalte.",
      place: { E: { row: 8, col: 4 } },
    },
    {
      text: "Damit bleibt für Aaron nur noch ein Feld.",
      place: { A: { row: 7, col: 5 } },
    },
    {
      text: "Damit bleibt für Franklin nur noch ein Feld auf einem Teppich.",
      place: { F: { row: 5, col: 6 } },
    },
    {
      text: "Damit bleibt für Denise nur noch ein Feld im Schlafzimmer.",
      place: { D: { row: 6, col: 2 } },
    },
    {
      text: "Damit bleibt für Bruce nur noch ein Feld im Schuppen.",
      place: { B: { row: 4, col: 1 } },
    },
    {
      text: "Damit bleibt für Carissa nur noch ein Feld neben einem Baum.",
      place: { C: { row: 0, col: 0 } },
    },
    {
      text: "Damit bleibt für Holden nur noch ein Feld im Teich.",
      place: { H: { row: 1, col: 3 } },
    },
    {
      text: "Damit bleibt für Gilbert nur noch ein Feld im Garten.",
      place: { G: { row: 2, col: 8 } },
    },
    {
      text: "Für Violet bleibt das letzte Feld, allein mit Carissa im Hinterhof. Carissa ist die Mörderin!",
      place: { V: { row: 3, col: 7 } },
    },
  ],
  solution: {
    A: { row: 7, col: 5 },
    B: { row: 4, col: 1 },
    C: { row: 0, col: 0 },
    D: { row: 6, col: 2 },
    E: { row: 8, col: 4 },
    F: { row: 5, col: 6 },
    G: { row: 2, col: 8 },
    H: { row: 1, col: 3 },
    V: { row: 3, col: 7 },
  },
};
