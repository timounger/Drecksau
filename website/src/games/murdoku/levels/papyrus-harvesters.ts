/**
 * Die Papyrusernte: a thicket, a canal and the harvesting ground on the
 * Nile, with a murdered harvester.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/64.png`, no solution
 * sheet - the solved grid and the culprit are pencilled in on the
 * photographed page, and the solver proves it is the only solution).
 * Vahibre is the victim; whoever was alone with him killed him.
 *
 * The cards show no estates and the map no crowns. Two fields of the thicket
 * carry the Anubis sign: whoever stood on one was alone in the area
 * ({@link ANUBIS}). Papyrus rolls "cannot be occupied", as the legend says;
 * neither can the shrubs or the crocodiles. The boats and the water can be
 * stood on.
 */
import {
  all,
  beside,
  column,
  counting,
  inArea,
  on,
  victim,
} from "../engine/clues";
import type { Context, Level, Rule } from "../engine/types";

/** Whoever stood on an Anubis field was alone in their area. */
const ANUBIS: Rule = {
  text: "Wer auf einer Anubis-Hieroglyphe stand, war allein in seinem Bereich.",
  check: (c) =>
    c.people().every((id) => {
      const there = c.cellOf(id);
      return (
        there === undefined ||
        !c.is(there, "anubis") ||
        c.peopleIn(c.areaOf(there) ?? "").length === 1
      );
    }),
};

/** The case. */
export const PAPYRUS_HARVESTERS: Level = {
  id: "papyrus-harvesters",
  name: "Die Papyrusernte",
  series: { book: "timeTravel", number: 64 },
  story:
    "Zu den Berufsrisiken gehören Krokodile, Mücken und die lieben Kollegen.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "M",
      name: "Dickicht",
      at: "im Dickicht",
      ground: "grass",
      tint: "#a9cfd6",
      label: { row: 3, col: 1 },
    },
    {
      key: "K",
      name: "Kanal",
      at: "im Kanal",
      ground: "water",
      label: { row: 4, col: 3 },
    },
    {
      key: "Z",
      name: "Erntefeld",
      at: "auf dem Erntefeld",
      ground: "grass",
      tint: "#d2e6cf",
      label: { row: 5, col: 4 },
    },
  ],
  areaMap: ["MKKZZZ", "MMKKZZ", "MMMKZZ", "MMMKZZ", "MKKKZZ", "KKZZZZ"],
  thingMap: ["a.....", "asc...", "...b.p", "s.s.p.", ".....c", "b....."],
  things: {
    a: "anubis",
    b: "boat",
    c: "crocodile",
    p: "papyrusRolls",
    s: "shrub",
  },
  suspects: [
    {
      id: "A",
      name: "Ashai",
      pronoun: "sie",
      clue: { text: "Sie war in der ersten Spalte.", ...column(1) },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Bek",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Krokodil.", ...beside("crocodile") },
      colour: "#15803d",
      face: "\u{1F467}",
    },
    {
      id: "C",
      name: "Cahfre",
      pronoun: "sie",
      clue: {
        text: "Sie war neben einem Stapel Papyrusrollen.",
        ...beside("papyrusRolls"),
      },
      colour: "#0e7490",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "D",
      name: "Djeru",
      pronoun: "er",
      clue: { text: "Er war im Dickicht.", ...inArea("M") },
      colour: "#7c3aed",
      face: "\u{1F9D4}",
    },
    {
      id: "E",
      name: "Enef",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person in einem Boot.",
        ...all(
          on("boat"),
          counting((c) => onlyOneOn(c, "boat")),
        ),
      },
      colour: "#ea580c",
      face: "\u{1F468}",
    },
    {
      id: "V",
      name: "Vahibre",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#57534e",
      face: "\u{1F474}",
    },
  ],
  rules: [ANUBIS],
  hints: [
    {
      text: "Ashai steht in Spalte 1. Das Boot in R6C1 gehört allein Enef, alle anderen Felder der Spalte liegen im Dickicht - dort steht auch Djeru. Wer auf einem Anubis-Feld steht, ist allein im Bereich: Weder Ashai noch Djeru stehen also auf R1C1 oder R2C1. Ashai steht in R3C1 oder R5C1.",
    },
    {
      text: "Enef ist die einzige Person in einem Boot: R6C1 liegt in Ashais Spalte, also steht er in R3C4. Damit bleibt Ashai R5C1.",
      place: { E: { row: 2, col: 3 }, A: { row: 4, col: 0 } },
    },
    {
      text: "Djeru steht im Dickicht, nicht auf einem Anubis-Feld, nicht in Spalte 1 und nicht in Zeile 3 oder 5: Es bleibt R4C2.",
      place: { D: { row: 3, col: 1 } },
    },
    {
      text: "Frei sind noch Zeile 1, 2 und 6 sowie Spalte 3, 5 und 6. Cahfre steht neben Papyrusrollen - so bleibt nur R2C6. Bek steht neben einem Krokodil: R6C6 liegt in Cahfres Spalte, also R1C3.",
      place: { C: { row: 1, col: 5 }, B: { row: 0, col: 2 } },
    },
    {
      text: "Vahibre steht auf dem letzten Feld, R6C5 auf dem Erntefeld - allein mit Cahfre. Cahfre ist die Mörderin!",
      place: { V: { row: 5, col: 4 } },
    },
  ],
  solution: {
    A: { row: 4, col: 0 },
    B: { row: 0, col: 2 },
    C: { row: 1, col: 5 },
    D: { row: 3, col: 1 },
    E: { row: 2, col: 3 },
    V: { row: 5, col: 4 },
  },
};

/** Whether exactly one person stood on a thing of this id. */
function onlyOneOn(c: Context, what: string): boolean {
  return (
    c.people().filter((id) => {
      const there = c.cellOf(id);
      return there !== undefined && c.is(there, what);
    }).length === 1
  );
}
