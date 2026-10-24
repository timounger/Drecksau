/**
 * Der Dorfladen: a hardware corner, a shop counter and a storeroom, an
 * outlaw hiding among the customers and a murdered shopkeeper.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/17.png`, no
 * solution sheet - the solved grid is pencilled in on the photographed page,
 * and the solver proves it is the only solution). Vernon is the victim;
 * whoever was alone with him killed him.
 *
 * **Who the outlaw is, is not printed.** Exactly one suspect is the outlaw,
 * it is not Vernon, and the outlaw was beside the sack - so somebody other
 * than Vernon stands beside it. "North of" means any row further up.
 * Nothing on the map can be stood on: barrels, the sack, shelves, the cash
 * register, the counters and the coal heap are all in the way.
 */
import { about, beside, victim } from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** The suspects who are said not to be the outlaw. */
const NOT_OUTLAWS: readonly string[] = ["V"];

/** Whether somebody who may be the outlaw stands beside the sack. */
function outlawBesideSack(c: Context): boolean {
  return c.people().some((id) => {
    const there = c.cellOf(id);
    return (
      !NOT_OUTLAWS.includes(id) &&
      there !== undefined &&
      c.beside(there, "sack")
    );
  });
}

/** The case. */
export const THE_GENERAL_STORE: Level = {
  id: "the-general-store",
  name: "Der Dorfladen",
  series: { book: "timeTravel", number: 17 },
  story:
    "Ich nehme an, jetzt bereut er das Angebot »Eine Kugel gratis zu jedem Einkauf«.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "E",
      name: "Eisenwaren",
      at: "bei den Eisenwaren",
      ground: "floor",
      tint: "#ece2c4",
      label: { row: 3, col: 1 },
    },
    {
      key: "T",
      name: "Ladentheke",
      at: "an der Ladentheke",
      ground: "floor",
      tint: "#e2d8b4",
      label: { row: 3, col: 3 },
    },
    {
      key: "L",
      name: "Lagerraum",
      at: "im Lagerraum",
      ground: "stone",
      tint: "#b9b4e0",
      label: { row: 4, col: 3 },
    },
  ],
  areaMap: ["EEETT", "EEETT", "EEETT", "LEETT", "LLLLL"],
  thingMap: ["bkss.", "...r.", "sb.t.", "..s.t", "..h.."],
  things: {
    b: "barrel",
    h: "coal",
    k: "sack",
    r: "cashRegister",
    s: "shelf",
    t: "table",
  },
  extraThings: {
    cashRegister: {
      name: "Registrierkasse",
      emoji: "\u{1F9FE}",
      standable: false,
    },
  },
  suspects: [
    {
      id: "A",
      name: "Abraham",
      pronoun: "er",
      clue: { text: "Er war neben einem Regal.", ...beside("shelf") },
      colour: "#b91c1c",
      face: "\u{1F920}",
    },
    {
      id: "B",
      name: "Barbara",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Fass.", ...beside("barrel") },
      colour: "#15803d",
      face: "\u{1F469}",
    },
    {
      id: "C",
      name: "Carolina",
      pronoun: "sie",
      clue: {
        text: "Sie war nördlich von Abraham.",
        ...about(["A"], (c) => {
          const abraham = c.cellOf("A");
          return abraham !== undefined && c.cell.row < abraham.row;
        }),
      },
      colour: "#0e7490",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "D",
      name: "Dean",
      pronoun: "er",
      clue: { text: "Er war neben dem Kohlehaufen.", ...beside("coal") },
      colour: "#6366f1",
      face: "\u{1F9D4}",
    },
    {
      id: "V",
      name: "Vernon",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Nicht der Gesetzlose. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#57534e",
      face: "\u{1F468}",
    },
  ],
  rules: [
    {
      text: "Es versteckt sich genau ein Gesetzloser unter den Verdächtigen. Der Gesetzlose kann der Mörder sein oder auch nicht.",
    },
    {
      text: "Der Gesetzlose war neben dem Sack.",
      check: outlawBesideSack,
    },
  ],
  hints: [
    {
      text: "In R1 ist nur R1 C5 frei. Barbara und Dean passen dort nicht, und Abraham auch nicht, denn Carolina war nördlich von ihm. Wäre Vernon dort, bliebe an der Ladentheke für seinen Mörder nur R4 C4 (C5 ist dann seine Spalte) - dort passt nur Carolina, aber dann wäre Abraham in R5, wo kein Regal neben ihm steht. Carolina steht in R1 C5.",
      place: { C: { row: 0, col: 4 } },
    },
    {
      text: "Der Gesetzlose war neben dem Sack, und neben dem Sack ist nur R2 C2 frei. Dort steht also jemand außer Vernon: Abraham hat dort kein Regal neben sich, Dean keinen Kohlehaufen - es ist Barbara, neben dem Fass in R3 C2.",
      place: { B: { row: 1, col: 1 } },
    },
    {
      text: "Abraham ist südlich von Carolina und nicht in Barbaras Zeile R2. Neben einem Regal bleiben R3 C3 und R4 C2 - R4 C2 ist Barbaras Spalte. Abraham steht in R3 C3.",
      place: { A: { row: 2, col: 2 } },
    },
    {
      text: "Dean steht neben dem Kohlehaufen in R5 C2 oder R5 C4; C2 ist Barbaras Spalte, also R5 C4. Vernon bleibt das letzte freie Feld, R4 C1 im Lagerraum - allein mit Dean. Dean ist der Mörder!",
      place: { D: { row: 4, col: 3 }, V: { row: 3, col: 0 } },
    },
  ],
  solution: {
    A: { row: 2, col: 2 },
    B: { row: 1, col: 1 },
    C: { row: 0, col: 4 },
    D: { row: 4, col: 3 },
    V: { row: 3, col: 0 },
  },
};
