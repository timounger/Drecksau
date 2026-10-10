/**
 * The Water Wheel: a field, a house, a manor house, a manor stable, a water
 * mill and the river with its wheel, with a murdered guard.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Das Wasserrad/Das Wasserrad.png`, no
 * solution sheet). The book's rule for crowned areas (nobles - the purple
 * cards - only there) makes it unique, with the culprit
 * pencilled in on the photographed page.
 * Osmar is the victim; whoever was alone with him killed him.
 *
 * Chairs, beds and the horses can be stood on; barrels, tables, bushes, the
 * boars and the water wheel cannot. Sitting means being on a chair or on a
 * horse.
 */
import {
  about,
  beside,
  counting,
  inArea,
  nobility,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Level } from "../engine/types";

/** The case. */
export const THE_WATER_WHEEL: Level = {
  id: "the-water-wheel",
  name: "Das Wasserrad",
  series: { book: "timeTravel", number: 3 },
  story:
    "Wer hier herumlungert, wird gnadenlos durch die Mühle gedreht. Osmar wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "F",
      name: "Feld",
      at: "auf dem Feld",
      ground: "grass",
      tint: "#a9cf8e",
      label: { row: 5, col: 5 },
    },
    {
      key: "H",
      name: "Herrenhaus",
      at: "im Herrenhaus",
      ground: "floor",
      tint: "#e2cdee",
      label: { row: 2, col: 4 },
    },
    {
      key: "S",
      name: "Herrenstall",
      at: "im Herrenstall",
      ground: "stone",
      tint: "#d4c6e6",
      label: { row: 3, col: 6 },
    },
    {
      key: "A",
      name: "Haus",
      at: "im Haus",
      ground: "floor",
      tint: "#e6d6e9",
      label: { row: 4, col: 0 },
    },
    {
      key: "M",
      name: "Wassermühle",
      at: "in der Wassermühle",
      ground: "floor",
      tint: "#d8c3a2",
      label: { row: 6, col: 0 },
    },
    {
      key: "W",
      name: "Fluss",
      at: "im Fluss",
      ground: "water",
      tint: "#a7d3f2",
      label: { row: 7, col: 0 },
    },
  ],
  areaMap: [
    "FFFHHHSS",
    "FFFHHHSS",
    "AAFFHHSS",
    "AAFFFFSS",
    "AAFFFFFF",
    "MMMMFFFF",
    "MMMMMWFF",
    "WWWWWWWW",
  ],
  thingMap: [
    ".w..tcah",
    "....cdh.",
    "cc...d.h",
    "d...u...",
    "d..u....",
    "at..w...",
    "a.tt...h",
    "...rr...",
  ],
  things: {
    a: "barrel",
    c: "chair",
    d: "bed",
    h: "horse",
    r: "waterWheel",
    t: "table",
    u: "bush",
    w: "boar",
  },
  extraThings: {
    horse: {
      name: "Pferd",
      emoji: "\u{1F40E}",
      standable: true,
      kinds: ["seat", "animal"],
    },
    bush: {
      name: "Busch",
      emoji: "\u{1F33F}",
      standable: false,
      kinds: ["plant"],
    },
    waterWheel: {
      name: "Wasserrad",
      emoji: "\u{2699}\u{FE0F}",
      standable: false,
    },
  },
  suspects: [
    {
      id: "A",
      name: "Anna",
      pronoun: "sie",
      traits: ["noble"],
      clue: {
        text: "Sie saß entweder auf einem Stuhl oder auf einem Pferd.",
        ...own((c) => c.is(c.cell, "chair") || c.is(c.cell, "horse")),
      },
      colour: "#7c3aed",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Betsy",
      pronoun: "sie",
      traits: ["noble"],
      clue: {
        text: "Sie war nicht allein.",
        ...counting((c) => c.peopleIn(c.areaOf(c.cell) ?? "").length > 1),
      },
      colour: "#0e7490",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "C",
      name: "Charles",
      pronoun: "er",
      traits: ["noble"],
      clue: {
        text: "Entweder er oder Betsy war auf einem Bett.",
        ...about(["B"], (c) => {
          const betsy = c.cellOf("B");
          return (
            betsy !== undefined && c.is(c.cell, "bed") !== c.is(betsy, "bed")
          );
        }),
      },
      colour: "#334155",
      face: "\u{1F468}",
    },
    {
      id: "D",
      name: "Dennis",
      pronoun: "er",
      clue: { text: "Er war neben einem Fass.", ...beside("barrel") },
      colour: "#b91c1c",
      face: "\u{1F9D4}",
    },
    {
      id: "E",
      name: "Elliot",
      pronoun: "er",
      clue: { text: "Er saß auf einem Stuhl.", ...on("chair") },
      colour: "#15803d",
      face: "\u{1F9D1}",
    },
    {
      id: "F",
      name: "Freya",
      pronoun: "sie",
      clue: {
        text: "Sie war neben einem Pferd oder einem Wildschwein.",
        ...own((c) => c.beside(c.cell, "horse") || c.beside(c.cell, "boar")),
      },
      colour: "#be185d",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "G",
      name: "Gideon",
      pronoun: "er",
      clue: { text: "Er war im Fluss.", ...inArea("W") },
      colour: "#4338ca",
      face: "\u{1F474}",
    },
    {
      id: "O",
      name: "Osmar",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F482}",
    },
  ],
  rules: [
    nobility(
      "Adlige (\u{1F451}) waren nur im Herrenhaus oder im Herrenstall.",
      ["H", "S"],
    ),
  ],
  hints: [
    {
      text: "Anna, Betsy und Charles sind adlig, also nur im Herrenhaus oder Herrenstall. Genau einer von Betsy und Charles liegt auf einem Bett - für sie kommt nur das Bett im Herrenhaus in C6 in Frage.",
    },
    {
      text: "Elliot sitzt auf einem Stuhl, aber nicht in C6. Säße er in R2 C5, läge der Bettende in R3 C6, Anna auf dem Pferd in R1 C8 und der dritte Adlige in R4 C7. Dennis müsste in R7 C2 neben das Fass, Gideon in R8 - und für Freya bliebe kein Feld neben einem Pferd oder Wildschwein. Also sitzt Elliot in R3 C1 oder R3 C2. Blockiere den Rest von R3.",
      cross: [
        { row: 2, col: 2 },
        { row: 2, col: 3 },
        { row: 2, col: 4 },
        { row: 2, col: 5 },
        { row: 2, col: 6 },
        { row: 2, col: 7 },
      ],
    },
    {
      text: "Da R3 gesperrt ist, liegt der Bettende in R2 C6. Damit bleibt für Anna nur das Pferd in R1 C8.",
      place: { A: { row: 0, col: 7 } },
    },
    {
      text: "Der andere der beiden muss in R4 stehen - im Herrenstall bleibt nur R4 C7. Betsy war nicht allein, allein im Herrenhaus wäre sie es (R1 bis R3 sind voll). Also steht Betsy in R4 C7 bei Anna, und Charles liegt in R2 C6.",
      place: { B: { row: 3, col: 6 }, C: { row: 1, col: 5 } },
    },
    {
      text: "Dennis steht neben einem Fass. R1 C8 und R2 C7 sind vergeben bzw. gesperrt, in der Wassermühle ist nur R7 C2 frei. Damit sitzt Elliot auf dem Stuhl in R3 C1.",
      place: { D: { row: 6, col: 1 }, E: { row: 2, col: 0 } },
    },
    {
      text: "Freya steht neben einem Pferd oder Wildschwein. Übrig ist nur R5 C5 neben dem Wildschwein - die Felder neben dem Pferd in R7 C8 liegen in C7 und C8.",
      place: { F: { row: 4, col: 4 } },
    },
    {
      text: "Gideon steht im Fluss in R8, frei ist nur R8 C3. Für Osmar bleibt R6 C4 in der Wassermühle - allein mit Dennis. Dennis ist der Mörder!",
      place: { G: { row: 7, col: 2 }, O: { row: 5, col: 3 } },
    },
  ],
  solution: {
    A: { row: 0, col: 7 },
    B: { row: 3, col: 6 },
    C: { row: 1, col: 5 },
    D: { row: 6, col: 1 },
    E: { row: 2, col: 0 },
    F: { row: 4, col: 4 },
    G: { row: 7, col: 2 },
    O: { row: 5, col: 3 },
  },
};
