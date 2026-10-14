/**
 * The Hair Salon: a store room, the salon, a back room, a break room and a
 * waiting area, with a murdered customer.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Der Friseursalon/Der Friseursalon.png`,
 * solution on `Das Murdoku-Orginal/Lösungen 1-80/Lösung 25-28.JPG`).
 * Olympia is the victim; whoever was alone with her killed her.
 *
 * Chairs and rugs can be stood on (the L-shaped one in the salon too); tables,
 * shelves, plants and the TVs cannot.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  all,
  beside,
  column,
  counting,
  inArea,
  on,
  victim,
} from "../engine/clues";
import type { Cell, Level } from "../engine/types";

/** The case. */
export const THE_HAIR_SALON: Level = {
  id: "the-hair-salon",
  name: "Der Friseursalon",
  series: { book: "original", number: 25 },
  story:
    "Vielleicht sollten sie den Laden umbenennen ... »Live and Dye« wirkt jetzt etwas unsensibel.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "L",
      name: "Lager",
      at: "im Lager",
      ground: "stone",
      tint: "#ecdcec",
      label: { row: 2, col: 0 },
    },
    {
      key: "S",
      name: "Salon",
      at: "im Salon",
      ground: "floor",
      tint: "#e6cfe4",
      label: { row: 4, col: 3 },
    },
    {
      key: "H",
      name: "Hinterzimmer",
      at: "im Hinterzimmer",
      ground: "stone",
      tint: "#ece4f0",
      label: { row: 3, col: 6 },
    },
    {
      key: "P",
      name: "Pausenraum",
      at: "im Pausenraum",
      ground: "floor",
      tint: "#e4c8e0",
      label: { row: 7, col: 6 },
    },
    {
      key: "W",
      name: "Wartebereich",
      at: "im Wartebereich",
      ground: "stone",
      tint: "#ece4f0",
      label: { row: 7, col: 3 },
    },
  ],
  areaMap: [
    "LLSSSSSH",
    "LLSSSSSH",
    "LLSSSSHH",
    "SSSSSSHH",
    "SSSSSSPP",
    "SSWWWWPP",
    "SWWWWWPP",
    "SWWWWWPP",
  ],
  thingMap: [
    "s.t.tttt",
    "s.c.c.c.",
    ".trrr..c",
    "tcr..f.f",
    ".t....t.",
    "r..sp..c",
    "rt.tt...",
    "..crrc.p",
  ],
  things: {
    c: "chair",
    f: "tv",
    p: "plant",
    r: "rug",
    s: "shelf",
    t: "table",
  },
  shapes: [
    [
      { row: 2, col: 2 },
      { row: 2, col: 3 },
      { row: 2, col: 4 },
      { row: 3, col: 2 },
    ],
  ],
  pieces: [
    { at: { row: 0, col: 4 }, rows: 1, cols: 3 },
    { at: { row: 5, col: 0 }, rows: 2, cols: 1 },
    { at: { row: 6, col: 3 }, rows: 1, cols: 2 },
    { at: { row: 7, col: 3 }, rows: 1, cols: 2 },
  ],
  suspects: [
    {
      id: "A",
      name: "Alice",
      pronoun: "sie",
      traits: ["glasses"],
      clue: {
        text: "Genau eine Spalte östlich von ihr war jemand neben einer Pflanze.",
        ...counting((c) =>
          c.people().some((id) => {
            const cell = c.cellOf(id) as Cell;
            return cell.col === c.cell.col + 1 && c.beside(cell, "plant");
          }),
        ),
      },
      colour: "#b91c1c",
      face: "\u{1F475}",
    },
    {
      id: "B",
      name: "Betty",
      pronoun: "sie",
      traits: ["glasses"],
      clue: {
        text: "Genau eine Zeile südlich von ihr war jemand neben einem Regal.",
        ...counting((c) =>
          c.people().some((id) => {
            const cell = c.cellOf(id) as Cell;
            return cell.row === c.cell.row + 1 && c.beside(cell, "shelf");
          }),
        ),
      },
      colour: "#15803d",
      face: "\u{1F469}",
    },
    {
      id: "C",
      name: "Charlina",
      pronoun: "sie",
      clue: { text: "Sie saß auf einem Stuhl.", ...on("chair") },
      colour: "#0e7490",
      face: "\u{1F469}\u200D\u{1F9B0}",
    },
    {
      id: "D",
      name: "Dorothy",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Tisch.", ...beside("table") },
      colour: "#7c3aed",
      face: "\u{1F469}\u{1F3FF}",
    },
    {
      id: "E",
      name: "Elisa",
      pronoun: "sie",
      clue: {
        text: "Sie war im Wartebereich mit jemandem, der auf einem Stuhl saß.",
        ...all(
          inArea("W"),
          counting((c) =>
            c
              .peopleIn("W")
              .some(
                (id) => id !== c.self && c.is(c.cellOf(id) as Cell, "chair"),
              ),
          ),
        ),
      },
      colour: "#be185d",
      face: "\u{1F469}\u200D\u{1F9B0}",
    },
    {
      id: "F",
      name: "Francesca",
      pronoun: "sie",
      clue: { text: "Sie war in der dritten Spalte.", ...column(3) },
      colour: "#ea580c",
      face: "\u{1F471}\u200D\u2640\uFE0F",
    },
    {
      id: "G",
      name: "Glinda",
      pronoun: "sie",
      traits: ["glasses"],
      clue: {
        text: "Sie war auf einem Teppich. Alle in ihrem Raum trugen eine Brille.",
        ...all(
          on("rug"),
          counting((c) =>
            c
              .peopleIn(c.areaOf(c.cell) ?? "")
              .every((id) => c.has(id, "glasses")),
          ),
        ),
      },
      colour: "#4338ca",
      face: "\u{1F469}",
    },
    {
      id: "O",
      name: "Olympia",
      pronoun: "sie",
      clue: {
        text: "Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F475}",
    },
  ],
  hints: [
    {
      text: "Elisa trägt keine Brille, also kann Glinda nicht mit Elisa im Wartebereich sein.",
    },
    {
      text: "Damit muss Glinda in den Salon, also muss Francesca (die auch keine Brille trägt) im Wartebereich sein.",
    },
    {
      text: "Wer auch immer auf dem Stuhl im Raum mit Elisa sitzt, ist in Zeile 8. Wenn jemand auf dem Stuhl in Spalte 6 ist, gibt es kein Feld mehr für Elisa, also ist der andere Stuhl in Spalte 3 besetzt, von Francesca.",
      place: { F: { row: 7, col: 2 } },
    },
    {
      text: "Charlina, ohne Brille, kann nicht mit Glinda im Salon sein, also ist sie auf einem der Stühle in Spalte 8.",
    },
    {
      text: "Die Person neben der Pflanze muss Elisa sein. Das lokalisiert Elisa, dann Charlina. Das lokalisiert Glinda und Betty.",
      place: {
        E: { row: 5, col: 5 },
        C: { row: 2, col: 7 },
        G: { row: 6, col: 0 },
        B: { row: 0, col: 3 },
      },
    },
    {
      text: "Das lokalisiert Alice, dann Olympia. Charlina ist die Mörderin!",
      place: {
        A: { row: 4, col: 4 },
        O: { row: 3, col: 6 },
        D: { row: 1, col: 1 },
      },
    },
  ],
  solution: {
    A: { row: 4, col: 4 },
    B: { row: 0, col: 3 },
    C: { row: 2, col: 7 },
    D: { row: 1, col: 1 },
    E: { row: 5, col: 5 },
    F: { row: 7, col: 2 },
    G: { row: 6, col: 0 },
    O: { row: 3, col: 6 },
  },
};
