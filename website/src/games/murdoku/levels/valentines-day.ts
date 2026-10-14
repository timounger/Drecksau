/**
 * Valentine's Day: a dining room, a living room, a bathroom, a study, a
 * kitchen, a guest room and a bedroom, with a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/35. Valentinstag.png`,
 * solution sheet `Lösungen 1-80/Lösung 33-36.JPG`).
 * Osmond is the victim; whoever was alone with him killed him.
 *
 * The armchairs are the chairs; they and the beds can be stood on. Tables
 * (the kitchen counter among them), shelves, plants and the TV
 * cannot.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  about,
  alone,
  all,
  beside,
  column,
  counting,
  inArea,
  on,
  row,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** Whether nobody but the suspect stands beside a shelf. */
function onlyOneBesideShelf(c: Context): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return id === c.self || there === undefined || !c.beside(there, "shelf");
  });
}

/** Whether the living room held Bastian, Harald and one woman, nobody else. */
function withHaraldAndAWoman(c: Context): boolean {
  const there = c.peopleIn("W");
  return (
    there.length === 3 &&
    there.includes("H") &&
    there.filter((id) => c.has(id, "woman")).length === 1
  );
}

/** Whether the suspect shared the room with one man only, both on chairs. */
function aloneWithASeatedMan(c: Context): boolean {
  const there = c.peopleIn(c.areaOf(c.cell) ?? "");
  const other = there.find((id) => id !== c.self);
  const otherCell = other === undefined ? undefined : c.cellOf(other);
  return (
    there.length === 2 &&
    other !== undefined &&
    c.has(other, "man") &&
    otherCell !== undefined &&
    c.is(otherCell, "chair")
  );
}

/** Whether a woman stood one column west and two rows north of the suspect. */
function womanNorthWest(c: Context): boolean {
  const there = c.personAt({ row: c.cell.row - 2, col: c.cell.col - 1 });
  return there !== null && c.has(there, "woman");
}

/**
 * For the solver only: whether a partial placement can still be completed -
 * the rooms' head counts and the shelves, checked as people are placed.
 */
function stillPossible(c: Context): boolean {
  const placed = c.people().flatMap((id) => {
    const cell = c.cellOf(id);
    return cell === undefined ? [] : [{ id, area: c.areaOf(cell), cell }];
  });
  const company = (id: string): readonly string[] => {
    const own = placed.find((one) => one.id === id);
    return own === undefined
      ? []
      : placed
          .filter((one) => one.id !== id && one.area === own.area)
          .map((one) => one.id);
  };
  const living = placed.filter((one) => one.area === "W").map((one) => one.id);
  const harald = c.cellOf("H");
  const northWest =
    harald === undefined
      ? undefined
      : { row: harald.row - 2, col: harald.col - 1 };
  const there = northWest === undefined ? null : c.personAt(northWest);
  return (
    company("G").length === 0 &&
    company("O").length <= 1 &&
    company("C").length <= 1 &&
    company("C").every((id) => {
      const cell = c.cellOf(id);
      return c.has(id, "man") && cell !== undefined && c.is(cell, "chair");
    }) &&
    living.length <= 3 &&
    living.filter((id) => c.has(id, "woman")).length <= 1 &&
    living.every((id) => id === "B" || id === "H" || c.has(id, "woman")) &&
    placed.every((one) => one.id === "A" || !c.beside(one.cell, "shelf")) &&
    (northWest === undefined ||
      (c.inside(northWest) &&
        c.standable(northWest) &&
        (there === null || c.has(there, "woman"))))
  );
}

/** The case. */
export const VALENTINES_DAY: Level = {
  id: "valentines-day",
  name: "Valentinstag",
  series: { book: "original", number: 35 },
  story:
    "Liebe bis der Tod sie scheidet? Sieht aus, als hätte jemand beschlossen, den Prozess zu beschleunigen.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "E",
      name: "Esszimmer",
      at: "im Esszimmer",
      ground: "floor",
      tint: "#f3dcd2",
      label: { row: 4, col: 0 },
    },
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "stone",
      tint: "#f2d4d4",
      label: { row: 2, col: 5 },
    },
    {
      key: "B",
      name: "Badezimmer",
      at: "im Badezimmer",
      ground: "stone",
      tint: "#f4eeee",
      label: { row: 4, col: 2 },
    },
    {
      key: "A",
      name: "Arbeitszimmer",
      at: "im Arbeitszimmer",
      ground: "stone",
      tint: "#f2cfc0",
      label: { row: 6, col: 4 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "stone",
      tint: "#f3e0e0",
      label: { row: 6, col: 1 },
    },
    {
      key: "G",
      name: "Gästezimmer",
      at: "im Gästezimmer",
      ground: "floor",
      tint: "#f0d8d0",
      label: { row: 8, col: 2 },
    },
    {
      key: "S",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "floor",
      tint: "#f2e2d6",
      label: { row: 8, col: 5 },
    },
  ],
  areaMap: [
    "EEEWWWWWW",
    "EEEWWWWWW",
    "EEEWWWWWW",
    "EEBBAAAWW",
    "EEBBAAAWW",
    "KKKKAAAWW",
    "KKKKAAASS",
    "GGGGGSSSS",
    "GGGGGSSSS",
  ],
  thingMap: [
    ".spcttm..",
    "ct...c...",
    "ctc.p...s",
    ".c.cc....",
    "p...t.s..",
    "ttt...s..",
    "....c...b",
    "bb..c...b",
    "pc..s..ps",
  ],
  things: {
    b: "bed",
    c: "chair",
    m: "tv",
    p: "plant",
    s: "shelf",
    t: "table",
  },
  pieces: [
    { at: { row: 0, col: 4 }, rows: 1, cols: 2 },
    { at: { row: 1, col: 1 }, rows: 2, cols: 1 },
    { at: { row: 5, col: 0 }, rows: 1, cols: 3 },
    { at: { row: 7, col: 0 }, rows: 1, cols: 2 },
    { at: { row: 6, col: 8 }, rows: 2, cols: 1 },
  ],
  suspects: [
    {
      id: "A",
      name: "Aaliyah",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person neben einem Regal.",
        ...all(beside("shelf"), counting(onlyOneBesideShelf)),
      },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Bastian",
      pronoun: "er",
      clue: {
        text: "Er war im Wohnzimmer mit Harald und einer Frau.",
        ...all(inArea("W"), counting(withHaraldAndAWoman)),
      },
      colour: "#15803d",
      face: "\u{1F468}‍\u{1F9B3}",
    },
    {
      id: "C",
      name: "Carly",
      pronoun: "sie",
      clue: {
        text: "Sie war allein mit einem Mann. Beide saßen auf einem Stuhl.",
        ...all(on("chair"), counting(aloneWithASeatedMan)),
      },
      colour: "#0e7490",
      face: "\u{1F475}",
    },
    {
      id: "D",
      name: "Dave",
      pronoun: "er",
      clue: { text: "Er war in der vierten Zeile.", ...row(4) },
      colour: "#6366f1",
      face: "\u{1F468}",
    },
    {
      id: "E",
      name: "Eli",
      pronoun: "er",
      clue: { text: "Er war in der dritten Spalte.", ...column(3) },
      colour: "#7c3aed",
      face: "\u{1F468}‍\u{1F9B0}",
    },
    {
      id: "F",
      name: "Felicity",
      pronoun: "sie",
      clue: { text: "Sie war neben einer Pflanze.", ...beside("plant") },
      colour: "#9f1239",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "G",
      name: "Gabriella",
      pronoun: "sie",
      clue: { text: "Sie war allein.", ...alone() },
      colour: "#ea580c",
      face: "\u{1F469}",
    },
    {
      id: "H",
      name: "Harald",
      pronoun: "er",
      clue: {
        text: "Eine Frau war in dem Feld, das eine Spalte westlich und zwei Zeilen nördlich von ihm lag.",
        ...about(["A", "C", "F", "G"], womanNorthWest),
      },
      colour: "#4338ca",
      face: "\u{1F468}",
    },
    {
      id: "O",
      name: "Osmond",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F468}",
    },
  ],
  prune: stillPossible,
  hints: [
    {
      text: "Harald ist im Wohnzimmer (laut Bastians Hinweis) und mit einer Frau genau zwei Zeilen über ihm und eine Spalte links von ihm. Das kann nur Aaliyah sein.",
    },
    {
      text: "Aaliyah könnte in Z3 S8 oder Z4 S7 sein, aber da Dave in Z4 ist, lokalisiert das Aaliyah und Harald. Schließe alle anderen Felder neben Regalen aus.",
      place: { A: { row: 2, col: 7 }, H: { row: 4, col: 8 } },
      cross: [
        { row: 0, col: 0 },
        { row: 1, col: 8 },
        { row: 3, col: 8 },
        { row: 3, col: 6 },
        { row: 4, col: 5 },
        { row: 5, col: 5 },
        { row: 6, col: 6 },
        { row: 7, col: 4 },
        { row: 8, col: 3 },
        { row: 7, col: 8 },
      ],
    },
    {
      text: "Jemand muss in Z1 S4 sein; das kann nur Bastian sein.",
      place: { B: { row: 0, col: 3 } },
    },
    {
      text: "Jemand muss in Z6 S5 sein (entweder Gabriella oder Osmond). Das lokalisiert Carly und Dave im Esszimmer.",
      place: { C: { row: 1, col: 0 }, D: { row: 3, col: 1 } },
    },
    {
      text: "Das lokalisiert Felicity im letzten Feld neben einer Pflanze.",
      place: { F: { row: 8, col: 6 } },
    },
    {
      text: "Gabriella ist nicht im Gästezimmer (da Eli in S3 ist) und muss im Arbeitszimmer sein, in Z6 S5. Das blockiert Z7 S6, was Eli im letzten Feld in Z7 lokalisiert.",
      place: { G: { row: 5, col: 4 }, E: { row: 6, col: 2 } },
      cross: [{ row: 6, col: 5 }],
    },
    {
      text: "Das lokalisiert Osmond. Felicity ist die Mörderin!",
      place: { O: { row: 7, col: 5 } },
    },
  ],
  solution: {
    A: { row: 2, col: 7 },
    B: { row: 0, col: 3 },
    C: { row: 1, col: 0 },
    D: { row: 3, col: 1 },
    E: { row: 6, col: 2 },
    F: { row: 8, col: 6 },
    G: { row: 5, col: 4 },
    H: { row: 4, col: 8 },
    O: { row: 7, col: 5 },
  },
};
