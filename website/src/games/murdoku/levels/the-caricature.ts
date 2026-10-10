/**
 * The Caricature: a classroom with the teacher's area, a front and a back
 * area - and somebody who drew on the chalkboard.
 *
 * @module
 * @remarks
 * After the free family case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Family/familymurdoku-caricature-color.pdf`, no
 * solution sheet - the solver proves the one solution). Nobody was murdered:
 * whoever stood in the top row drew the caricature.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  all,
  beside,
  column,
  counting,
  inArea,
  not,
  on,
} from "../engine/clues";
import type { Level } from "../engine/types";

/** The case. */
export const THE_CARICATURE: Level = {
  id: "the-caricature",
  name: "Die Karikatur",
  difficulty: "family",
  story:
    "Jemand hat eine gemeine Karikatur der Lehrerin an die Tafel gemalt! Finde heraus, wo alle im Klassenzimmer waren. Der Täter war in der obersten Reihe.",
  culprit: { name: "der Täter", dative: "dem Täter" },
  areas: [
    {
      key: "T",
      name: "Lehrerbereich",
      at: "im Lehrerbereich",
      ground: "floor",
      tint: "#ecdcc2",
      label: { row: 2, col: 2 },
    },
    {
      key: "F",
      name: "Vorderer Bereich",
      at: "im vorderen Bereich",
      ground: "floor",
      tint: "#f3e6d0",
      label: { row: 4, col: 1 },
    },
    {
      key: "B",
      name: "Hinterer Bereich",
      at: "im hinteren Bereich",
      ground: "floor",
      tint: "#e8d6b8",
      label: { row: 6, col: 1 },
    },
  ],
  areaMap: [
    "TTTTTTT",
    "TTTTTTT",
    "FFTTTFF",
    "FFFFFFF",
    "FFFFFFF",
    "BBBBBBB",
    "BBBBBBB",
  ],
  thingMap: [
    "s.....g",
    "w.ddd..",
    ".......",
    "wdcd.d.",
    "...c.c.",
    ".d.d.d.",
    "wc.c.cs",
  ],
  things: { s: "shelf", g: "garbageBin", d: "desk", c: "chair", w: "window" },
  extraThings: {
    window: { name: "Fenster", emoji: "\u{1FA9F}", standable: true },
    garbageBin: { name: "Mülleimer", emoji: "\u{1F5D1}️", standable: false },
    desk: {
      name: "Pult",
      emoji: "\u{1F7EB}",
      standable: false,
      kinds: ["furniture"],
    },
  },
  suspects: [
    {
      id: "A",
      name: "Anabella",
      pronoun: "sie",
      traits: ["glasses"],
      clue: {
        text: "Sie war im hinteren Bereich, zusammen mit jemandem, der auf einem Stuhl saß.",
        ...all(
          inArea("B"),
          counting((c) =>
            c
              .peopleIn("B")
              .some(
                (id) => id !== c.self && c.is(c.cellOf(id) ?? c.cell, "seat"),
              ),
          ),
        ),
      },
      colour: "#b91c1c",
      face: "\u{1F475}",
    },
    {
      id: "B",
      name: "Bobby",
      pronoun: "er",
      clue: { text: "Er war neben dem Mülleimer.", ...beside("garbageBin") },
      colour: "#15803d",
      face: "\u{1F466}",
    },
    {
      id: "C",
      name: "Crystal",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Regal.", ...beside("shelf") },
      colour: "#0e7490",
      face: "\u{1F467}",
    },
    {
      id: "D",
      name: "Diana",
      pronoun: "sie",
      clue: { text: "Sie war direkt vor einem Fenster.", ...on("window") },
      colour: "#6366f1",
      face: "\u{1F469}",
    },
    {
      id: "E",
      name: "Elliot",
      pronoun: "er",
      traits: ["cap"],
      clue: { text: "Er war in der fünften Spalte.", ...column(5) },
      colour: "#7c3aed",
      face: "\u{1F9D1}",
    },
    {
      id: "F",
      name: "Francesca",
      pronoun: "sie",
      clue: {
        text: "Sie saß auf einem Stuhl im vorderen Bereich.",
        ...all(on("seat"), inArea("F")),
      },
      colour: "#9f1239",
      face: "\u{1F467}",
    },
    {
      id: "G",
      name: "Gregory",
      pronoun: "er",
      clue: {
        text: "Er war neben einem Pult. Er saß nicht auf einem Stuhl.",
        ...all(beside("desk"), not(on("seat"))),
      },
      colour: "#ea580c",
      face: "\u{1F468}‍\u{1F9B0}",
    },
  ],
  hints: [
    {
      text: "Anabella braucht im hinteren Bereich jemanden, der auf einem Stuhl sitzt. Gregory sitzt nicht, Francesca sitzt vorne, Diana steht am Fenster, Bobby am Mülleimer, und in Spalte 5 steht dort kein Stuhl. Nur Crystal kann sitzen - auf dem Stuhl neben dem Regal in der untersten Reihe. Anabella muss dann in Reihe 6 sein.",
      place: { C: { row: 6, col: 5 } },
    },
    {
      text: "Spalte 6 ist jetzt besetzt, also bleibt für Bobby nur das Feld neben dem Mülleimer in Reihe 2.",
      place: { B: { row: 1, col: 6 } },
    },
    {
      text: "Reihe 2 und Reihe 7 sind besetzt, also bleibt für Diana nur das Fenster in Reihe 4. Francesca bleibt damit nur der Stuhl in Reihe 5, Spalte 4.",
      place: { D: { row: 3, col: 0 }, F: { row: 4, col: 3 } },
    },
    {
      text: "In Reihe 6 bleiben für Anabella nur die Spalten 3 und 5. Spalte 5 braucht Elliot, also ist Anabella in Spalte 3.",
      place: { A: { row: 5, col: 2 } },
    },
    {
      text: "Für Gregory bleibt Spalte 2: Neben einem Pult ist dort nur das Feld in Reihe 3. Elliot bleibt die oberste Reihe in Spalte 5 - Elliot hat die Karikatur gemalt!",
      place: { G: { row: 2, col: 1 }, E: { row: 0, col: 4 } },
    },
  ],
  // No victim here: whoever stood in the top row drew the caricature.
  findCulprit: (c) => c.people().find((id) => c.cellOf(id)?.row === 0) ?? null,
  solution: {
    A: { row: 5, col: 2 },
    B: { row: 1, col: 6 },
    C: { row: 6, col: 5 },
    D: { row: 3, col: 0 },
    E: { row: 0, col: 4 },
    F: { row: 4, col: 3 },
    G: { row: 2, col: 1 },
  },
};
