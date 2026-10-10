/**
 * Beach Bonfire: a beach with a forest, a tent and a campfire, and a
 * murdered camper.
 *
 * @module
 * @remarks
 * After the free case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Easy/Lagerfeuer am Strand.png`, no solution
 * sheet; the solver proves the case has exactly one solution). Van is the
 * victim; whoever was alone with him killed him. The campfire, the pot in
 * the tent, the palms, the shrub and the boulder cannot be stood on.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  about,
  all,
  beside,
  column,
  inArea,
  not,
  victim,
} from "../engine/clues";
import type { Level } from "../engine/types";

/** The case. */
export const BEACH_BONFIRE: Level = {
  id: "beach-bonfire",
  name: "Lagerfeuer am Strand",
  difficulty: "veryEasy",
  series: { book: "online" },
  story:
    "Van wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "W",
      name: "Wald",
      at: "im Wald",
      ground: "grass",
      tint: "#5f8f8a",
      label: { row: 3, col: 0 },
    },
    {
      key: "S",
      name: "Strand",
      at: "am Strand",
      ground: "sand",
      tint: "#ecd59a",
      label: { row: 4, col: 2 },
    },
    {
      key: "Z",
      name: "Zelt",
      at: "im Zelt",
      ground: "floor",
      tint: "#7c87a8",
      label: { row: 3, col: 4 },
    },
  ],
  areaMap: ["WWWWW", "WWWWW", "WWSWZ", "WSSSZ", "SSSSS"],
  thingMap: ["..s..", ".p..p", ".....", "p.f.k", "....b"],
  things: { s: "shrub", p: "palm", f: "campfire", k: "pot", b: "boulder" },
  extraThings: {
    campfire: { name: "Lagerfeuer", emoji: "\u{1F525}", standable: false },
    pot: { name: "Kochtopf", emoji: "\u{1FAA3}", standable: false },
  },
  suspects: [
    {
      id: "A",
      name: "Angelo",
      pronoun: "er",
      clue: {
        text: "Er war südlich von Corinne.",
        ...about(["C"], (c) => c.cell.row > (c.cellOf("C")?.row ?? c.rows)),
      },
      colour: "#b91c1c",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "B",
      name: "Basil",
      pronoun: "er",
      clue: {
        text: "Er war im Wald. Er war nicht neben einem Baum.",
        ...all(inArea("W"), not(beside("tree"))),
      },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Corinne",
      pronoun: "sie",
      clue: { text: "Sie war in der letzten Spalte.", ...column(5) },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Daryl",
      pronoun: "sie",
      clue: { text: "Sie war neben dem Felsen.", ...beside("boulder") },
      colour: "#6366f1",
      face: "\u{1F469}",
    },
    {
      id: "V",
      name: "Van",
      pronoun: "er",
      clue: { text: "Er war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F9D4}",
    },
  ],
  hints: [
    {
      text: "Es gibt nur ein mögliches Feld für D neben dem Felsen, das grenzt sie auf R5 C4 ein.",
      place: { D: { row: 4, col: 3 } },
    },
    {
      text: "Jetzt gibt es nur noch ein mögliches Feld für B im Wald, das nicht neben einem Baum liegt, auf R1 C1.",
      place: { B: { row: 0, col: 0 } },
    },
    {
      text: "Damit bleibt für C nur das letzte freie Feld in C5: R3 C5.",
      place: { C: { row: 2, col: 4 } },
    },
    {
      text: "Damit bleibt für A nur das letzte Feld südlich von C, R4 C2, und dann V auf dem letzten Feld, R2 C3. V war allein mit B im Wald, Basil ist der Mörder!",
      place: { A: { row: 3, col: 1 }, V: { row: 1, col: 2 } },
    },
  ],
  solution: {
    A: { row: 3, col: 1 },
    B: { row: 0, col: 0 },
    C: { row: 2, col: 4 },
    D: { row: 4, col: 3 },
    V: { row: 1, col: 2 },
  },
};
