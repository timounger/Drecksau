/**
 * Der Strand: a beach with a lifeguard tower, a changing room and the sea,
 * and a murdered bather.
 *
 * @module
 * @remarks
 * After the free case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Easy/Der Strand.png`, no solution sheet -
 * the solver proves the single solution). The beach towels are carpet
 * ground, not things. Valentino is the victim; whoever was alone with him
 * killed him.
 */
import {
  alone,
  all,
  beside,
  inArea,
  not,
  on,
  onGround,
  victim,
} from "../engine/clues";
import type { Level } from "../engine/types";

/** The case. */
export const THE_BEACH: Level = {
  id: "the-beach",
  name: "Der Strand",
  difficulty: "easy",
  story:
    "Valentino wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "T",
      name: "Rettungsschwimmerturm",
      at: "im Rettungsschwimmerturm",
      ground: "floor",
      tint: "#e2c99a",
      label: { row: 1, col: 0 },
    },
    {
      key: "U",
      name: "Umkleide",
      at: "in der Umkleide",
      ground: "floor",
      tint: "#f6c9a8",
      label: { row: 2, col: 4 },
    },
    {
      key: "S",
      name: "Strand",
      at: "am Strand",
      ground: "sand",
      tint: "#f3e3a0",
      label: { row: 5, col: 4 },
    },
    {
      key: "M",
      name: "Meer",
      at: "im Meer",
      ground: "water",
      tint: "#8fcbef",
      label: { row: 6, col: 3 },
    },
  ],
  areaMap: [
    "TTSSUUU",
    "TTSSUUU",
    "MSSSUSS",
    "MSSSSSS",
    "MMSSSSS",
    "MMMSSSS",
    "MMMMMMM",
  ],
  groundMap: [
    "ffssfff",
    "ffssfff",
    "wcssfss",
    "wcsssss",
    "wwssscc",
    "wwwccss",
    "wwwwwww",
  ],
  grounds: { f: "floor", s: "sand", w: "water", c: "carpet" },
  thingMap: [
    ".t..tt.",
    "c.....c",
    ".......",
    ".......",
    "..c....",
    "b......",
    ".......",
  ],
  things: { t: "table", c: "chair", b: "boulder" },
  suspects: [
    {
      id: "A",
      name: "Ashton",
      pronoun: "er",
      clue: { text: "Er war neben dem Felsbrocken.", ...beside("boulder") },
      colour: "#b91c1c",
      face: "\u{1F468}",
    },
    {
      id: "B",
      name: "Brenda",
      pronoun: "sie",
      clue: { text: "Sie war auf einem Teppich.", ...onGround("carpet") },
      colour: "#15803d",
      face: "\u{1F469}",
    },
    {
      id: "C",
      name: "Carla",
      pronoun: "sie",
      clue: {
        text: "Sie saß auf einem Stuhl. Sie war nicht am Strand.",
        ...all(on("seat"), not(inArea("S"))),
      },
      colour: "#0e7490",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "D",
      name: "Daryl",
      pronoun: "sie",
      clue: { text: "Sie war am Strand.", ...inArea("S") },
      colour: "#6366f1",
      face: "\u{1F469}",
    },
    {
      id: "E",
      name: "Earl",
      pronoun: "er",
      clue: { text: "Er war neben einem Stuhl.", ...beside("seat") },
      colour: "#7c3aed",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "F",
      name: "Fabian",
      pronoun: "er",
      clue: {
        text: "Er war allein im Rettungsschwimmerturm.",
        ...all(inArea("T"), alone()),
      },
      colour: "#9f1239",
      face: "\u{1F9D4}",
    },
    {
      id: "V",
      name: "Valentino",
      pronoun: "er",
      clue: { text: "Das Opfer. Er war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F468}‍\u{1F9B0}",
    },
  ],
  hints: [
    {
      text: "C kann nicht am Strand sein, und sie kann laut Fs Hinweis nicht im Rettungsschwimmerturm sein. Sie kann nur in der Umkleide sitzen, in R2 C7.",
      place: { C: { row: 1, col: 6 } },
    },
    {
      text: "Damit bleibt ein Feld übrig, auf dem F im Rettungsschwimmerturm sein kann, also ist F in R1 C1.",
      place: { F: { row: 0, col: 0 } },
    },
    {
      text: "Das einzige verbleibende Feld, auf dem A neben einem Felsbrocken sein kann, ist R6 C2.",
      place: { A: { row: 5, col: 1 } },
    },
    {
      text: "Das schränkt auch B auf R5 C6 ein, das letzte Teppichfeld.",
      place: { B: { row: 4, col: 5 } },
    },
    {
      text: "Jetzt ist das einzige verbleibende Feld, auf dem E neben einem Stuhl sein kann, R4 C3.",
      place: { E: { row: 3, col: 2 } },
    },
    {
      text: "Und D nimmt das letzte Feld am Strand, R3 C4. Damit bleibt das letzte Feld R7 C5 für V.",
      place: { D: { row: 2, col: 3 }, V: { row: 6, col: 4 } },
    },
  ],
  solution: {
    A: { row: 5, col: 1 },
    B: { row: 4, col: 5 },
    C: { row: 1, col: 6 },
    D: { row: 2, col: 3 },
    E: { row: 3, col: 2 },
    F: { row: 0, col: 0 },
    V: { row: 6, col: 4 },
  },
};
