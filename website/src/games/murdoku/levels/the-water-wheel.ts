/**
 * The Water Wheel: a field, a house, a manor house, a manor stable, a water
 * mill and the river with its wheel, with a murdered guard.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Das Wasserrad/Das Wasserrad.png`, no
 * solution sheet). The book's estates - nobles (purple cards) only in the
 * crowned areas, villagers (wooden cards) only outside them, knights (grey
 * shields) anywhere - make it unique, with the culprit pencilled in on the
 * photographed page.
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
  ranks,
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
  story: "Wer hier herumlungert, wird gnadenlos durch die Mühle gedreht.",
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
  pieces: [
    { at: { row: 1, col: 5 }, rows: 2, cols: 1 },
    { at: { row: 3, col: 0 }, rows: 2, cols: 1 },
    { at: { row: 6, col: 2 }, rows: 1, cols: 2 },
    { at: { row: 7, col: 3 }, rows: 1, cols: 2 },
  ],
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
      traits: ["villager"],
      clue: { text: "Er war neben einem Fass.", ...beside("barrel") },
      colour: "#b91c1c",
      face: "\u{1F9D4}",
    },
    {
      id: "E",
      name: "Elliot",
      pronoun: "er",
      traits: ["villager"],
      clue: { text: "Er saß auf einem Stuhl.", ...on("chair") },
      colour: "#15803d",
      face: "\u{1F9D1}",
    },
    {
      id: "F",
      name: "Freya",
      pronoun: "sie",
      traits: ["villager"],
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
      traits: ["villager"],
      clue: { text: "Er war im Fluss.", ...inArea("W") },
      colour: "#4338ca",
      face: "\u{1F474}",
    },
    {
      id: "O",
      name: "Osmar",
      pronoun: "er",
      traits: ["knight"],
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F482}",
    },
  ],
  rules: [
    ranks(
      "Adlige (\u{1F451}) waren nur im Herrenhaus oder im Herrenstall, Dorfbewohner nur in den anderen Bereichen, Ritter überall.",
      ["H", "S"],
    ),
  ],
  hints: [
    {
      text: "Anna, Betsy und Charles sind adlig, also nur im Herrenhaus oder Herrenstall; Dennis, Elliot, Freya und Gideon sind Dorfbewohner, also nie dort. Elliot sitzt auf einem Stuhl - außerhalb von Herrenhaus und Herrenstall stehen Stühle nur im Haus, in R3 C1 und R3 C2. Elliot ist in R3; blockiere den Rest von R3.",
    },
    {
      text: "Betsy oder Charles liegt auf einem Bett, also im Herrenhaus (das Bett im Haus ist für Adlige tabu). Das Bett im Herrenhaus reicht über R2 C6 und R3 C6 - R3 ist Elliots Zeile, also liegt der Bettende in R2 C6.",
    },
    {
      text: "Anna sitzt auf einem Stuhl oder Pferd im Herrenhaus oder Herrenstall. Der Stuhl in R1 C6 liegt in der Spalte des Bettenden, der in R2 C5 in seiner Zeile; vom Pferd in R2 C7 und R3 C8 sind R2 und R3 besetzt. Anna sitzt auf dem Pferd in R1 C8.",
      place: { A: { row: 0, col: 7 } },
    },
    {
      text: "R1 bis R3 sind besetzt, also steht der zweite von Betsy und Charles im Herrenstall in R4 - in C8 steht Anna, also R4 C7. Betsy war nicht allein: Im Herrenhaus wäre sie allein, im Herrenstall ist sie bei Anna. Also steht Betsy in R4 C7, und Charles liegt in R2 C6.",
      place: { B: { row: 3, col: 6 }, C: { row: 1, col: 5 } },
    },
    {
      text: "Dennis steht neben einem Fass, aber nicht im Herrenstall. In der Wassermühle ist neben einem Fass nur R7 C2 frei (R6 C2 ist ein Tisch). Damit bleibt Elliot nur der Stuhl in R3 C1.",
      place: { D: { row: 6, col: 1 }, E: { row: 2, col: 0 } },
    },
    {
      text: "Freya steht neben einem Pferd oder Wildschwein. Frei sind nur noch R5 und R8 sowie C3, C4 und C5: Das einzige passende Feld ist R5 C5 neben dem Wildschwein im Feld.",
      place: { F: { row: 4, col: 4 } },
    },
    {
      text: "Gideon ist im Fluss in R8: C4 und C5 sind das Wasserrad, also R8 C3. Osmar steht auf dem letzten Feld, R6 C4 in der Wassermühle - allein mit Dennis. Dennis ist der Mörder!",
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
