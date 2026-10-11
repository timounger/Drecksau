/**
 * The Cookie Thief: a family flat with kitchen, two bedrooms and a living
 * room, and a tin of cookies eaten up by somebody.
 *
 * @module
 * @remarks
 * After the free family case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Family/the-cookie-thief-color.pdf`, no solution
 * sheet - the solution is the solver's only one). Nobody was harmed: the
 * thief is whoever stood on crumbs, so the case has no victim.
 */
import { about, all, beside, inArea, not, on } from "../engine/clues";
import type { Level } from "../engine/types";

/** The case. */
export const THE_COOKIE_THIEF: Level = {
  id: "the-cookie-thief",
  name: "Der Keksdieb",
  series: { book: "family" },
  story:
    "Jemand hat alle Kekse aufgegessen! Die Krümel liegen noch auf dem Boden … aber wer war es? Finde heraus, wo alle zur Tatzeit waren. Der Keksdieb stand genau auf den Krümeln.",
  culprit: { name: "der Dieb", dative: "dem Dieb" },
  areas: [
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "floor",
      tint: "#f6dfb0",
      label: { row: 2, col: 1 },
    },
    {
      key: "M",
      name: "Elternschlafzimmer",
      at: "im Elternschlafzimmer",
      ground: "carpet",
      tint: "#d6cdf5",
      label: { row: 2, col: 4 },
    },
    {
      key: "F",
      name: "Freds Zimmer",
      at: "in Freds Zimmer",
      ground: "carpet",
      tint: "#c4ead6",
      label: { row: 5, col: 0 },
    },
    {
      key: "L",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#f6d3d3",
      label: { row: 5, col: 4 },
    },
  ],
  areaMap: ["KKKMMM", "KKKMMM", "KKKMMM", "FFLLLL", "FFLLLL", "FFLLLL"],
  thingMap: ["pts.bb", "s.k.ts", "..skg.", "b.tck.", "b..kT.", "s.cckg"],
  things: {
    p: "plant",
    t: "table",
    s: "shelf",
    b: "bed",
    c: "chair",
    k: "crumbs",
    g: "present",
    T: "tree",
  },
  extraThings: {
    crumbs: { name: "Krümel", emoji: "\u{1F36A}", standable: true },
    present: { name: "Geschenk", emoji: "\u{1F381}", standable: false },
  },
  pieces: [
    { at: { row: 0, col: 4 }, rows: 1, cols: 2 },
    { at: { row: 3, col: 0 }, rows: 2, cols: 1 },
  ],
  suspects: [
    {
      id: "A",
      name: "Adam",
      pronoun: "er",
      clue: { text: "Er war neben einem Geschenk.", ...beside("present") },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "B",
      name: "Beth",
      pronoun: "sie",
      clue: { text: "Sie war im Wohnzimmer.", ...inArea("L") },
      colour: "#b91c1c",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "C",
      name: "Carissa",
      pronoun: "sie",
      clue: {
        text: "Sie war neben dem Tisch in der Küche.",
        ...all(inArea("K"), beside("table")),
      },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Denise",
      pronoun: "sie",
      clue: {
        text: "Sie war in einem Schlafzimmer. Sie war nicht auf einem Bett.",
        ...all(inArea("M", "F"), not(on("bed"))),
      },
      colour: "#7c3aed",
      face: "\u{1F467}",
    },
    {
      id: "E",
      name: "Ella",
      pronoun: "sie",
      clue: {
        text: "Sie war im selben Raum wie Carissa.",
        ...about(["C"], (c) => {
          const carissa = c.cellOf("C");
          return (
            carissa !== undefined && c.areaOf(c.cell) === c.areaOf(carissa)
          );
        }),
      },
      colour: "#ea580c",
      face: "\u{1F476}",
    },
    {
      id: "F",
      name: "Fred",
      pronoun: "er",
      clue: { text: "Er saß auf einem Stuhl.", ...on("seat") },
      colour: "#4338ca",
      face: "\u{1F466}",
    },
  ],
  hints: [
    {
      text: "Carissa war neben dem Tisch in der Küche. Neben dem Tisch liegen die Pflanze, ein Regal und nur ein freies Feld darunter - dort stand sie. Streiche ihre Reihe und Spalte.",
      place: { C: { row: 1, col: 1 } },
    },
    {
      text: "Ella war auch in der Küche. Außerhalb von Carissas Reihe und Spalte bleibt dort nur das Feld unten links.",
      place: { E: { row: 2, col: 0 } },
    },
    {
      text: "Denise war in einem Schlafzimmer, aber nicht auf einem Bett. Freds Zimmer liegt ganz in Carissas und Ellas Spalten, und im Elternschlafzimmer sind Reihe 2 und 3 belegt. Es bleibt nur das freie Feld neben dem Bett in Reihe 1.",
      place: { D: { row: 0, col: 3 } },
    },
    {
      text: "Fred saß auf einem Stuhl. Der Stuhl in Reihe 4 liegt in Denises Spalte - Fred saß also auf einem der beiden Stühle in Reihe 6. Streiche den Rest von Reihe 6.",
    },
    {
      text: "Adam war neben einem Geschenk. Am Geschenk im Elternschlafzimmer sind alle freien Nachbarfelder in belegten Reihen, und das Feld links vom Geschenk im Wohnzimmer liegt in Freds Reihe 6. Es bleibt das Feld über dem Geschenk.",
      place: { A: { row: 4, col: 5 } },
    },
    {
      text: "Damit bleibt für Fred in Reihe 6 nur der Stuhl ganz links im Wohnzimmer.",
      place: { F: { row: 5, col: 2 } },
    },
    {
      text: "Für Beth bleibt im Wohnzimmer nur das letzte freie Feld: auf den Krümeln neben dem Baum. Beth ist die Keksdiebin!",
      place: { B: { row: 3, col: 4 } },
    },
  ],
  // No victim here: whoever stood on the crumbs ate the cookies.
  findCulprit: (c) =>
    c.people().find((id) => {
      const cell = c.cellOf(id);
      return cell !== undefined && c.is(cell, "crumbs");
    }) ?? null,
  solution: {
    A: { row: 4, col: 5 },
    B: { row: 3, col: 4 },
    C: { row: 1, col: 1 },
    D: { row: 0, col: 3 },
    E: { row: 2, col: 0 },
    F: { row: 5, col: 2 },
  },
};
