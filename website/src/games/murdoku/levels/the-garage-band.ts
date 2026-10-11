/**
 * Die Garagenband: a living room, a bedroom, the band's garage, the
 * driveway and the front garden, and a murder after rehearsal.
 *
 * @module
 * @remarks
 * After the free case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Easy/Die Garagenband.png`, no solution sheet -
 * the solver proves the single solution). The car covers two fields of the
 * driveway, the bed two fields of the bedroom; the armchairs count as
 * chairs. Viper is the victim; whoever was alone with him killed him.
 */
import { beside, not, on, own, victim } from "../engine/clues";
import type { Level } from "../engine/types";

/** The case. */
export const THE_GARAGE_BAND: Level = {
  id: "the-garage-band",
  name: "Die Garagenband",
  difficulty: "easy",
  series: { book: "online" },
  story:
    "Viper wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#c3d0ea",
      label: { row: 3, col: 0 },
    },
    {
      key: "S",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "floor",
      tint: "#f2d2ef",
      label: { row: 2, col: 4 },
    },
    {
      key: "G",
      name: "Garage",
      at: "in der Garage",
      ground: "floor",
      tint: "#b8dcdc",
      label: { row: 5, col: 3 },
    },
    {
      key: "E",
      name: "Einfahrt",
      at: "in der Einfahrt",
      ground: "stone",
      tint: "#9cc4c4",
      label: { row: 6, col: 0 },
    },
    {
      key: "V",
      name: "Vorgarten",
      at: "im Vorgarten",
      ground: "grass",
      tint: "#7fbf86",
      label: { row: 6, col: 3 },
    },
  ],
  areaMap: [
    "WWWSSSS",
    "WWWSSSS",
    "WWWSSSS",
    "WWWGGGG",
    "EEGGGGG",
    "EEGGGGV",
    "EEVVVVV",
  ],
  thingMap: [
    ".rs.bbs",
    "......s",
    "..c.kc.",
    "c.cl..k",
    "aa...d.",
    "..k.l..",
    ".k.ht..",
  ],
  things: {
    r: "tv",
    s: "shelf",
    b: "bed",
    c: "chair",
    k: "crate",
    l: "speaker",
    a: "car",
    d: "drums",
    h: "shrub",
    t: "tree",
  },
  extraThings: {
    speaker: { name: "Lautsprecher", emoji: "\u{1F50A}", standable: false },
    drums: { name: "Schlagzeug", emoji: "\u{1F941}", standable: false },
  },
  pieces: [
    { at: { row: 0, col: 4 }, rows: 1, cols: 2 },
    { at: { row: 4, col: 0 }, rows: 1, cols: 2 },
  ],
  suspects: [
    {
      id: "A",
      name: "Axel",
      pronoun: "er",
      clue: { text: "Er war neben dem Schlagzeug.", ...beside("drums") },
      colour: "#b91c1c",
      face: "\u{1F9D4}",
    },
    {
      id: "B",
      name: "Briar",
      pronoun: "sie",
      clue: {
        text: "Sie war im Auto oder auf dem Bett.",
        ...own((c) => c.is(c.cell, "car") || c.is(c.cell, "bed")),
      },
      colour: "#15803d",
      face: "\u{1F475}",
    },
    {
      id: "C",
      name: "Carla",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Regal.", ...beside("shelf") },
      colour: "#0e7490",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "D",
      name: "Dallas",
      pronoun: "er",
      clue: {
        text: "Er war nicht neben einer Kiste.",
        ...not(beside("crate")),
      },
      colour: "#6366f1",
      face: "\u{1F468}‍\u{1F9B1}",
    },
    {
      id: "E",
      name: "Ernesto",
      pronoun: "er",
      clue: { text: "Er saß auf einem Stuhl.", ...on("seat") },
      colour: "#7c3aed",
      face: "\u{1F474}",
    },
    {
      id: "F",
      name: "Fawn",
      pronoun: "sie",
      clue: { text: "Sie war neben dem Baum.", ...beside("tree") },
      colour: "#be185d",
      face: "\u{1F469}",
    },
    {
      id: "V",
      name: "Viper",
      pronoun: "er",
      clue: { text: "Er war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F471}",
    },
  ],
  hints: [
    {
      text: "Es gibt nur ein mögliches Feld neben dem Baum für F, das isoliert F in R7 C6.",
      place: { F: { row: 6, col: 5 } },
    },
    {
      text: "Damit ist A neben dem Schlagzeug in R5, sperre den Rest von R5. B kann nicht im Auto sein, das isoliert B auf dem letzten Bettfeld, R1 C5.",
      place: { B: { row: 0, col: 4 } },
      cross: [
        { row: 4, col: 0 },
        { row: 4, col: 1 },
        { row: 4, col: 2 },
        { row: 4, col: 3 },
      ],
    },
    {
      text: "Das isoliert A in R5 C7, dann C auf dem letzten Feld neben einem Regal, R2 C3.",
      place: { A: { row: 4, col: 6 }, C: { row: 1, col: 2 } },
    },
    {
      text: "Das isoliert E auf dem letzten Stuhl in R4 C1, dann D auf dem letzten Feld, das nicht neben einer Kiste liegt, R3 C2.",
      place: { E: { row: 3, col: 0 }, D: { row: 2, col: 1 } },
    },
    {
      text: "Das isoliert V auf dem letzten verbleibenden Feld. V war allein mit A in der Garage, Axel ist der Mörder!",
      place: { V: { row: 5, col: 3 } },
    },
  ],
  solution: {
    A: { row: 4, col: 6 },
    B: { row: 0, col: 4 },
    C: { row: 1, col: 2 },
    D: { row: 2, col: 1 },
    E: { row: 3, col: 0 },
    F: { row: 6, col: 5 },
    V: { row: 5, col: 3 },
  },
};
