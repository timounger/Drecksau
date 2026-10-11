/**
 * The Hair Salon: a store room, the salon, a back room, a break room and a
 * waiting area, with a murdered customer.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Der Friseursalon/Der Friseursalon.png`,
 * no solution sheet - the solver proves the one solution, with the culprit
 * pencilled in on the photographed page).
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
      text: "Glinda war auf einem Teppich, und alle in ihrem Raum trugen eine Brille. Elisa trägt keine, also ist Glinda nicht im Wartebereich, sondern im Salon - und im Salon waren nur Brillenträgerinnen: Alice, Betty und Glinda. Charlina, Dorothy, Elisa, Francesca und Olympia waren nicht im Salon.",
    },
    {
      text: "Elisa war im Wartebereich mit jemandem auf einem Stuhl: R8 C3 oder R8 C6. So oder so ist R8 besetzt. C4 und C5 haben außerhalb des Salons nur R8 C4 und R8 C5 - dort stehen also zwei Brillenträgerinnen im Salon. Elisa bleibt im Wartebereich nur C6 (R6 C6 oder R7 C6), also sitzt niemand in R8 C6: Auf R8 C3 sitzt jemand aus C3 - Francesca.",
      place: { F: { row: 7, col: 2 } },
    },
    {
      text: "Charlina saß auf einem Stuhl außerhalb des Salons: R3 C8 oder R6 C8 (R8 ist besetzt, C6 gehört Elisa). Genau eine Spalte östlich von Alice war jemand neben einer Pflanze: in R6 C6, R7 C8 oder R8 C7. R8 ist besetzt, und in C8 kann neben Charlina niemand stehen. Also stand Elisa in R6 C6 und Alice in C5 im Salon. Damit ist R6 voll, und Charlina saß in R3 C8.",
      place: { E: { row: 5, col: 5 }, C: { row: 2, col: 7 } },
    },
    {
      text: "Genau eine Zeile südlich von Betty war jemand neben einem Regal: in R2 C2, R3 C1 oder R6 C3. R3 und C3 sind besetzt, also stand jemand in R2 C2 und Betty in R1. Dort sind R1 C2 (Spalte C2) und alle Tische gesperrt - Betty war in R1 C4.",
      place: { B: { row: 0, col: 3 } },
    },
    {
      text: "Glinda war auf einem Teppich im Salon. C3, C4 und R6 sind besetzt, es bleibt R7 C1.",
      place: { G: { row: 6, col: 0 } },
    },
    {
      text: "Frei sind noch R2, R4 und R5 in C2, C5 und C7. In C7 bleibt nur R4 C7, und Alice in C5 bekommt R5 C5. Dorothy und Olympia teilen sich R2 C2 und R4 C7. In R2 C2 wäre Olympia allein im Lager - also war Dorothy dort, neben dem Tisch, und Olympia in R4 C7 im Hinterzimmer, allein mit Charlina. Charlina ist die Mörderin!",
      place: {
        A: { row: 4, col: 4 },
        D: { row: 1, col: 1 },
        O: { row: 3, col: 6 },
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
