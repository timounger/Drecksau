/**
 * 24-Stunden-Lieferung: a house with dining room, bedroom, kitchen, veranda
 * and front garden, and a murder by the delivered crate.
 *
 * @module
 * @remarks
 * After the free case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Easy/24-Stunden-Lieferung.png`, no solution
 * sheet - the solver proves the single solution). Carpets are ground, not
 * things. Viraj is the victim; whoever was alone with him killed him.
 */
import {
  all,
  beside,
  counting,
  inArea,
  on,
  onGround,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** Whether nobody but the suspect stands on a carpet. */
function onlyOneOnCarpet(c: Context): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return (
      id === c.self || there === undefined || c.groundAt(there) !== "carpet"
    );
  });
}

/** The case. */
export const DELIVERY_24H: Level = {
  id: "delivery-24h",
  name: "24-Stunden-Lieferung",
  difficulty: "veryEasy",
  story:
    "Viraj wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "E",
      name: "Esszimmer",
      at: "im Esszimmer",
      ground: "floor",
      tint: "#ead9c3",
      label: { row: 3, col: 0 },
    },
    {
      key: "S",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "floor",
      tint: "#fbe8a6",
      label: { row: 1, col: 3 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "floor",
      tint: "#f6d3a6",
      label: { row: 3, col: 3 },
    },
    {
      key: "V",
      name: "Veranda",
      at: "auf der Veranda",
      ground: "floor",
      tint: "#e2c6a3",
      label: { row: 5, col: 0 },
    },
    {
      key: "G",
      name: "Vorgarten",
      at: "im Vorgarten",
      ground: "grass",
      tint: "#b4f0d6",
      label: { row: 5, col: 2 },
    },
  ],
  areaMap: ["EEESSS", "EEESSS", "EEEKKK", "EEEKKK", "VVGGGG", "VVGGGG"],
  groundMap: ["fffffc", "fffffc", "fffccf", "ffffff", "ccgggg", "ffgggg"],
  grounds: { f: "floor", c: "carpet", g: "grass" },
  thingMap: [".c.bb.", "ct..p.", "ct....", "p..tt.", "...s..", ".k..s."],
  things: {
    c: "chair",
    t: "table",
    b: "bed",
    p: "plant",
    s: "shrub",
    k: "crate",
  },
  suspects: [
    {
      id: "A",
      name: "Alexander",
      pronoun: "er",
      clue: { text: "Er war neben der Kiste.", ...beside("crate") },
      colour: "#b91c1c",
      face: "\u{1F468}",
    },
    {
      id: "B",
      name: "Bella",
      pronoun: "sie",
      clue: { text: "Sie saß auf einem Stuhl.", ...on("seat") },
      colour: "#15803d",
      face: "\u{1F475}",
    },
    {
      id: "C",
      name: "Carol",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person auf einem Teppich.",
        ...all(onGround("carpet"), counting(onlyOneOnCarpet)),
      },
      colour: "#0e7490",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "D",
      name: "Dalia",
      pronoun: "sie",
      clue: { text: "Sie war im Schlafzimmer.", ...inArea("S") },
      colour: "#6366f1",
      face: "\u{1F469}",
    },
    {
      id: "E",
      name: "Evangeline",
      pronoun: "sie",
      clue: {
        text: "Sie war entweder neben einem Strauch oder einer Pflanze.",
        ...beside("plant"),
      },
      colour: "#7c3aed",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "V",
      name: "Viraj",
      pronoun: "er",
      clue: { text: "Er war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F9D4}",
    },
  ],
  hints: [
    {
      text: "Da C die einzige Person auf einem Teppich ist, gibt es nur ein Feld, auf dem A neben der Kiste sein kann: R6 C1.",
      place: { A: { row: 5, col: 0 } },
    },
    {
      text: "Das isoliert B auf dem letzten Stuhl.",
      place: { B: { row: 0, col: 1 } },
    },
    {
      text: "Das isoliert D auf dem letzten Feld im Schlafzimmer, das nicht auf einem Teppich liegt.",
      place: { D: { row: 1, col: 3 } },
    },
    {
      text: "Das isoliert C auf dem letzten Teppichfeld.",
      place: { C: { row: 2, col: 4 } },
    },
    {
      text: "Das isoliert E auf dem letzten Feld neben einem Strauch, dann V auf dem letzten verbleibenden Feld.",
      place: { E: { row: 4, col: 2 }, V: { row: 3, col: 5 } },
    },
  ],
  solution: {
    A: { row: 5, col: 0 },
    B: { row: 0, col: 1 },
    C: { row: 2, col: 4 },
    D: { row: 1, col: 3 },
    E: { row: 4, col: 2 },
    V: { row: 3, col: 5 },
  },
};
