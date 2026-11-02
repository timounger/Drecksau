/**
 * Der Steinbruch: the foreman's tent, the pyramid site, the desert, the
 * tool awning, the workers' camp, the ramp and the quarry, with a murdered
 * man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/71. La Cantera.png`,
 * Spanish edition, no solution sheet - the solved grid and the culprit are
 * pencilled in on the photographed page, and the solver proves it is the
 * only solution). Vahmet is the victim; whoever was alone with him killed
 * him.
 *
 * The cards show no estates and the map no crowns. Some fields carry the Ra
 * hieroglyph: whoever stood on one was not alone in the area ({@link RA}).
 * Stone blocks "cannot be occupied", as the legend says; neither can
 * baskets, chests or palms. The sleeping mats can be stood on.
 */
import { all, beside, inArea, not, on, victim } from "../engine/clues";
import type { Context, Level, Rule } from "../engine/types";

/** Whoever stood on a Ra field was not alone in their area. */
const RA: Rule = {
  text: "Wer auf einer Ra-Hieroglyphe stand, war nicht allein in seinem Bereich.",
  check: (c) =>
    c.people().every((id) => {
      const there = c.cellOf(id);
      return (
        there === undefined ||
        !c.is(there, "ra") ||
        c.peopleIn(c.areaOf(there) ?? "").length > 1
      );
    }),
};

/** The case. */
export const THE_QUARRY: Level = {
  id: "the-quarry",
  name: "Der Steinbruch",
  series: { book: "timeTravel", number: 71 },
  story:
    "Wer hat die Pyramiden gebaut? Na ja - der hier jedenfalls nicht mehr.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "Z",
      name: "Zelt des Vorarbeiters",
      at: "im Zelt des Vorarbeiters",
      ground: "floor",
      tint: "#cfe2f1",
      label: { row: 1, col: 0 },
    },
    {
      key: "P",
      name: "Pyramidenbaustelle",
      at: "auf der Pyramidenbaustelle",
      ground: "stone",
      tint: "#efe6bd",
      label: { row: 2, col: 4 },
    },
    {
      key: "D",
      name: "Wüste",
      at: "in der Wüste",
      ground: "sand",
      tint: "#f1e4a6",
      label: { row: 3, col: 3 },
    },
    {
      key: "W",
      name: "Werkzeugdach",
      at: "unter dem Werkzeugdach",
      ground: "floor",
      tint: "#c9def0",
      label: { row: 5, col: 3 },
    },
    {
      key: "C",
      name: "Arbeiterlager",
      at: "im Arbeiterlager",
      ground: "sand",
      tint: "#eeece4",
      label: { row: 6, col: 0 },
    },
    {
      key: "R",
      name: "Rampe",
      at: "auf der Rampe",
      ground: "stone",
      tint: "#dcc6a8",
      label: { row: 7, col: 7 },
    },
    {
      key: "Q",
      name: "Steinbruch",
      at: "im Steinbruch",
      ground: "stone",
      tint: "#d6d5d2",
      label: { row: 8, col: 0 },
    },
  ],
  areaMap: [
    "ZZZPPPPPP",
    "ZZZPPPPPP",
    "DDDDPPPDD",
    "CDDDDDDDD",
    "CCCWWDDRR",
    "CCCWWDDRR",
    "CCQQQQQRR",
    "QQQQQQQRR",
    "QQQQQQQQQ",
  ],
  thingMap: [
    "kmcbrbbr.",
    ".m..b..b.",
    "...p.....",
    "rb......p",
    "mm.r.....",
    "mm.cr...b",
    "ck..b..bb",
    "b.......b",
    "..brrb...",
  ],
  things: {
    b: "stoneBlock",
    c: "chest",
    k: "basket",
    m: "mat",
    p: "palm",
    r: "ra",
  },
  extraThings: {
    stoneBlock: { name: "Steinblock", emoji: "\u{1F9F1}", standable: false },
    mat: { name: "Schlafmatte", emoji: "\u{1F6CF}\u{FE0F}", standable: true },
  },
  pieces: [
    { at: { row: 0, col: 1 }, rows: 2, cols: 1 },
    { at: { row: 4, col: 0 }, rows: 1, cols: 2 },
    { at: { row: 5, col: 0 }, rows: 1, cols: 2 },
  ],
  suspects: [
    {
      id: "A",
      name: "Amdukh",
      pronoun: "er",
      clue: {
        text: "Er war im Zelt des Vorarbeiters.",
        ...inArea("Z"),
      },
      colour: "#57534e",
      face: "\u{1F474}",
    },
    {
      id: "B",
      name: "Buhra",
      pronoun: "sie",
      clue: {
        text: "Sie war auf der Pyramidenbaustelle.",
        ...inArea("P"),
      },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "C",
      name: "Cahtek",
      pronoun: "er",
      clue: {
        text: "Er war neben einem Steinblock.",
        ...beside("stoneBlock"),
      },
      colour: "#0e7490",
      face: "\u{1F468}",
    },
    {
      id: "D",
      name: "Djet",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Korb.", ...beside("basket") },
      colour: "#7c3aed",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "E",
      name: "Ebanu",
      pronoun: "er",
      clue: {
        text: "Er war auf einem Feld mit einer Hieroglyphe. Er war nicht unter dem Werkzeugdach.",
        ...all(on("hieroglyph"), not(inArea("W"))),
      },
      colour: "#ea580c",
      face: "\u{1F9D4}",
    },
    {
      id: "F",
      name: "Fermuthis",
      pronoun: "er",
      clue: { text: "Er war unter dem Werkzeugdach.", ...inArea("W") },
      colour: "#15803d",
      face: "\u{1F468}‍\u{1F9B1}",
    },
    {
      id: "G",
      name: "Gahiji",
      pronoun: "er",
      clue: { text: "Er war auf der Rampe.", ...inArea("R") },
      colour: "#4338ca",
      face: "\u{1F466}",
    },
    {
      id: "H",
      name: "Hori",
      pronoun: "er",
      clue: { text: "Er war neben einem Baum.", ...beside("tree") },
      colour: "#a16207",
      face: "\u{1F468}‍\u{1F9B2}",
    },
    {
      id: "V",
      name: "Vahmet",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#be185d",
      face: "\u{1F9D4}‍♂️",
    },
  ],
  rules: [RA],
  prune: stillPossible,
  hints: [
    {
      text: "Hori steht neben einer Palme: R3C3, R4C4, R3C9 oder R4C8 - also in Zeile 3 oder 4. Buhra steht in Zeile 1 bis 3, Amdukh in Zeile 1 oder 2, Fermuthis in Zeile 5 oder 6. In die Zeilen 7 bis 9 passen nur Cahtek, Ebanu (nur auf den Ra-Feldern R9C4 und R9C5), Gahiji (nur R8C8) und Vahmet - in Zeile 7 sogar nur Cahtek oder Vahmet.",
    },
    {
      text: "Gahiji steht in R8C8. Sonst stünden Cahtek, Ebanu und Vahmet in Zeile 7 bis 9 und Gahiji neben Fermuthis in Zeile 5 oder 6. Djet müsste ins Zelt, Buhra in Zeile 3, Hori in Zeile 4. Cahteks Felder in Zeile 7 und 8 liegen alle im Steinbruch, wo auch Ebanu steht - Vahmet wäre dort nicht allein mit einer Person und müsste zu Gahiji auf R8C8. Dann bliebe Gahiji nur R5C9, Hori nur R4C4 - und Fermuthis und Ebanu hätten zusammen nur Spalte 5.",
      place: { G: { row: 7, col: 7 } },
    },
    {
      text: "Ebanu steht in Zeile 9. Sonst teilen sich Cahtek und Vahmet die Zeilen 7 und 9, Djet steht in R6C2, Fermuthis in Zeile 5, und Amdukh, Buhra, Hori und Ebanu füllen die Zeilen 1 bis 4. Amdukh steht in R2C1 oder R2C3 (Spalte 2 ist Djets), Ebanu auf R1C5 oder R4C1 (Spalte 8 ist Gahijis). Auf R1C5 drängt er Buhra in Zeile 3 und Hori auf R4C4 - Fermuthis fände keine Spalte. Auf R4C1 bleibt Hori nur R3C9 und Buhra R1C5 - und Fermuthis stünde auf R5C4 allein auf einer Ra-Hieroglyphe.",
    },
    {
      text: "Ebanu und Fermuthis teilen sich damit Spalte 4 und 5. Vahmet steht nicht in Zeile 7: Dort wäre er mit Ebanu im Steinbruch, Cahtek müsste also in Zeile 1 bis 6 stehen. Mit Cahtek auf R5C9 stünden Amdukh und Djet im Zelt, Buhra in Zeile 3 - und Hori bliebe nur R3C3 in derselben Zeile. Mit Djet auf R6C2 steht Amdukh in Zeile 2, Hori in Zeile 3, Buhra auf R1C9 und Cahtek auf R4C3 - dann bleibt für Hori kein Feld. Also steht Cahtek in Zeile 7, auf R7C6 (Spalte 4 ist besetzt).",
      place: { C: { row: 6, col: 5 } },
    },
    {
      text: "Djet steht in R6C2: Im Zelt neben Amdukh bliebe Buhra Zeile 3 und Hori Zeile 4 - R4C4 und R4C8 liegen aber in besetzten Spalten. Fermuthis steht also in Zeile 5, und Amdukh, Buhra, Hori und Vahmet füllen die Zeilen 1 bis 4. Amdukh steht in Zeile 2 (Spalte 2 ist Djets), Hori in Zeile 3 (R3C3 oder R3C9), Buhra damit in Zeile 1 - frei ist nur R1C9. Hori steht in R3C3, Amdukh in R2C1, Vahmet in R4C7.",
      place: {
        D: { row: 5, col: 1 },
        B: { row: 0, col: 8 },
        H: { row: 2, col: 2 },
        A: { row: 1, col: 0 },
        V: { row: 3, col: 6 },
      },
    },
    {
      text: "R5C4 ist eine Ra-Hieroglyphe, unter dem Werkzeugdach wäre Fermuthis dort allein: Er steht in R5C5, Ebanu in R9C4 - nicht allein, Cahtek ist ja im Steinbruch. Vahmet steht in der Wüste, allein mit Hori. Hori ist der Mörder!",
      place: { F: { row: 4, col: 4 }, E: { row: 8, col: 3 } },
    },
  ],
  solution: {
    A: { row: 1, col: 0 },
    B: { row: 0, col: 8 },
    C: { row: 6, col: 5 },
    D: { row: 5, col: 1 },
    E: { row: 8, col: 3 },
    F: { row: 4, col: 4 },
    G: { row: 7, col: 7 },
    H: { row: 2, col: 2 },
    V: { row: 3, col: 6 },
  },
};

/**
 * For the solver: whether a partial placement can still be finished.
 * Vahmet's area never holds more than two.
 */
function stillPossible(c: Context): boolean {
  const vahmet = c.cellOf("V");
  return vahmet === undefined || c.peopleIn(c.areaOf(vahmet) ?? "").length <= 2;
}
