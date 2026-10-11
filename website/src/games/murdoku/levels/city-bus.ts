/**
 * City Bus: a city bus with back, mid, driver's and front sections, and an
 * attacked passenger.
 *
 * @module
 * @remarks
 * After the free case of Murdoku by Hiroji Osaka
 * (`game_instructions/Murdoku/Easy/CityBus.png`, solution beside it).
 * Everett is the victim; whoever was alone with him attacked him. The
 * windows are the bars on the bus's outline: a field is beside a window when
 * such a bar runs along one of its edges.
 */
import {
  alone,
  all,
  beside,
  cellsWhere,
  counting,
  inArea,
  own,
  victim,
} from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** The fields with a window along one of their edges. */
const WINDOWS: readonly Cell[] = [
  { row: 0, col: 1 },
  { row: 0, col: 3 },
  { row: 0, col: 4 },
  { row: 0, col: 7 },
  { row: 4, col: 1 },
  { row: 4, col: 3 },
  { row: 4, col: 4 },
  { row: 4, col: 7 },
  { row: 1, col: 0 },
  { row: 2, col: 0 },
  { row: 1, col: 7 },
  { row: 2, col: 7 },
  { row: 3, col: 7 },
];

/** Whether a field has a window along one of its edges. */
function byWindow(cell: Cell): boolean {
  return WINDOWS.some((one) => one.row === cell.row && one.col === cell.col);
}

/** Whether everybody but the suspect sits, and the suspect does not. */
function onlyOneStanding(c: Context): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return there !== undefined && c.is(there, "seat") === (id !== c.self);
  });
}

/** The case. */
export const CITY_BUS: Level = {
  id: "city-bus",
  name: "Stadtbus",
  difficulty: "easy",
  series: { book: "online" },
  story:
    "Everett wurde gestern Abend überfallen! Finde heraus, wer es war. Der Täter war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Täter", dative: "dem Täter" },
  areas: [
    {
      key: "B",
      name: "Hinterer Bereich",
      at: "im hinteren Bereich",
      ground: "floor",
      tint: "#cfe0f2",
      label: { row: 4, col: 0 },
    },
    {
      key: "M",
      name: "Mittlerer Bereich",
      at: "im mittleren Bereich",
      ground: "floor",
      tint: "#e2eef3",
      label: { row: 4, col: 4 },
    },
    {
      key: "D",
      name: "Fahrerbereich",
      at: "im Fahrerbereich",
      ground: "floor",
      tint: "#eef4f8",
      label: { row: 1, col: 6 },
    },
    {
      key: "F",
      name: "Vorderer Bereich",
      at: "im vorderen Bereich",
      ground: "floor",
      tint: "#dbe8f3",
      label: { row: 4, col: 6 },
    },
  ],
  areaMap: ["BBMMMMDD", "BBMMMMDD", "BBMMMMFF", "BBMMMMFF", "BBMMMMFF"],
  groundMap: ["........", ".c......", ".ccccccc", ".c....cc", "........"],
  grounds: { ".": "floor", c: "carpet" },
  thingMap: ["c..c.ct.", "cmcc.cc.", "c.......", "c..m.c..", "cccc.cc."],
  things: { c: "chair", m: "mud", t: "table" },
  // The rugs, as the page draws them.
  carpets: [
    [
      { row: 1, col: 1 },
      { row: 2, col: 1 },
      { row: 3, col: 1 },
    ],
    [
      { row: 2, col: 2 },
      { row: 2, col: 3 },
      { row: 2, col: 4 },
      { row: 2, col: 5 },
    ],
    [
      { row: 2, col: 6 },
      { row: 2, col: 7 },
      { row: 3, col: 6 },
      { row: 3, col: 7 },
    ],
  ],
  windows: [
    { at: { row: 0, col: 1 }, side: "top" },
    { at: { row: 0, col: 3 }, side: "top" },
    { at: { row: 0, col: 4 }, side: "top" },
    { at: { row: 0, col: 7 }, side: "top" },
    { at: { row: 4, col: 1 }, side: "bottom" },
    { at: { row: 4, col: 3 }, side: "bottom" },
    { at: { row: 4, col: 4 }, side: "bottom" },
    { at: { row: 4, col: 7 }, side: "bottom" },
    { at: { row: 1, col: 0 }, side: "left" },
    { at: { row: 2, col: 0 }, side: "left" },
    { at: { row: 1, col: 7 }, side: "right" },
    { at: { row: 2, col: 7 }, side: "right" },
    { at: { row: 3, col: 7 }, side: "right" },
  ],
  suspects: [
    {
      id: "A",
      name: "Audrey",
      pronoun: "sie",
      clue: {
        text: "Alle im Bus saßen auf einem Stuhl, außer ihr.",
        unary: (c) => !c.is(c.cell, "seat"),
        ...counting(onlyOneStanding),
      },
      colour: "#b91c1c",
      face: "\u{1F475}",
    },
    {
      id: "B",
      name: "Brock",
      pronoun: "er",
      clue: { text: "Er war im Fahrerbereich.", ...inArea("D") },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Conrad",
      pronoun: "er",
      clue: { text: "Er war neben einer Schlammpfütze.", ...beside("mud") },
      colour: "#0e7490",
      face: "\u{1F468}",
    },
    {
      id: "D",
      name: "Diana",
      pronoun: "sie",
      clue: {
        text: "Sie war neben einem Fenster, allein in ihrem Bereich.",
        ...all(
          own((c) => byWindow(c.cell)),
          alone(),
        ),
        glow: (level) => cellsWhere(level, byWindow),
      },
      colour: "#7c3aed",
      face: "\u{1F469}",
    },
    {
      id: "E",
      name: "Everett",
      pronoun: "er",
      clue: {
        text: "Er war im letzten freien Feld, allein mit dem Täter.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F431}",
    },
  ],
  rules: [
    {
      text: "Es war genau eine Person auf einem Teppich.",
      check: (c) =>
        c.people().filter((id) => {
          const there = c.cellOf(id);
          return there !== undefined && c.groundAt(there) === "carpet";
        }).length === 1,
    },
  ],
  hints: [
    {
      text: "Nach Audreys Hinweis sitzen Brock, Conrad, Diana und Everett auf einem Stuhl.",
    },
    {
      text: "Im Fahrerbereich gibt es nur einen Stuhl - dort sitzt Brock. Streiche seine Reihe und Spalte.",
      place: { B: { row: 1, col: 6 } },
    },
    {
      text: "Jetzt gibt es nur noch ein Feld, auf dem Conrad sitzen und neben einer Schlammpfütze sein kann.",
      place: { C: { row: 4, col: 3 } },
    },
    {
      text: "Streiche Conrads Reihe und Spalte. Es bleibt nur ein Stuhl, auf dem Diana neben einem Fenster sitzen kann.",
      place: { D: { row: 2, col: 0 } },
    },
    {
      text: "Diana ist allein in ihrem Bereich - streiche den ganzen hinteren Bereich.",
      cross: [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 1, col: 0 },
        { row: 1, col: 1 },
        { row: 2, col: 1 },
        { row: 3, col: 0 },
        { row: 3, col: 1 },
        { row: 4, col: 0 },
        { row: 4, col: 1 },
      ],
    },
    {
      text: "Alle außer Audrey sitzen auf einem Stuhl, also muss Audrey die eine Person auf einem Teppich sein.",
    },
    {
      text: "Damit bleibt für Audrey nur ein Teppichfeld im vorderen Bereich.",
      place: { A: { row: 3, col: 7 } },
    },
    {
      text: "Für Everett bleibt nur noch ein Stuhl.",
      place: { E: { row: 0, col: 5 } },
    },
    {
      text: "Everett war allein mit Conrad im mittleren Bereich. Conrad ist der Täter!",
    },
  ],
  solution: {
    A: { row: 3, col: 7 },
    B: { row: 1, col: 6 },
    C: { row: 4, col: 3 },
    D: { row: 2, col: 0 },
    E: { row: 0, col: 5 },
  },
};
