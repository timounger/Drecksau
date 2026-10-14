/**
 * The Petrol Station: a storeroom, a cellar, a toilet, a car park, a shop, a
 * workshop and the forecourt with its pumps, with a murdered woman.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/37. Die Tankstelle.png`,
 * solution sheet `Lösungen 1-80/Lösung 37-40.JPG`).
 * Orianna is the victim; whoever was alone with her killed her.
 *
 * Every car covers two fields and faces east: its west field is the back.
 * Cars, the chairs and the oil puddles can be stood on; pumps, shelves, boxes,
 * the till, the table and the workbench cannot.
 */
import { about, all, beside, inArea, not, on, victim } from "../engine/clues";
import type { Level } from "../engine/types";

/** The case. */
export const THE_PETROL_STATION: Level = {
  id: "the-petrol-station",
  name: "Die Tankstelle",
  series: { book: "original", number: 37 },
  story:
    "Besser die belegten Brötchen hinter der Theke beschlagnahmen ... die sehen aus, als könnten sie jemanden umbringen.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "A",
      name: "Abstellraum",
      at: "im Abstellraum",
      ground: "floor",
      tint: "#cfe0e6",
      label: { row: 1, col: 0 },
    },
    {
      key: "K",
      name: "Keller",
      at: "im Keller",
      ground: "stone",
      tint: "#a9b7bd",
      label: { row: 1, col: 3 },
    },
    {
      key: "T",
      name: "Toilette",
      at: "in der Toilette",
      ground: "stone",
      tint: "#d4ebe6",
      label: { row: 2, col: 6 },
    },
    {
      key: "P",
      name: "Parkplatz",
      at: "auf dem Parkplatz",
      ground: "stone",
      tint: "#b9b5da",
      label: { row: 5, col: 8 },
    },
    {
      key: "L",
      name: "Laden",
      at: "im Laden",
      ground: "floor",
      tint: "#b8d3d6",
      label: { row: 6, col: 0 },
    },
    {
      key: "W",
      name: "Werkstatt",
      at: "in der Werkstatt",
      ground: "floor",
      tint: "#dbb7b0",
      label: { row: 5, col: 5 },
    },
    {
      key: "Z",
      name: "Tankbereich",
      at: "im Tankbereich",
      ground: "stone",
      tint: "#aeb2d0",
      label: { row: 8, col: 4 },
    },
  ],
  areaMap: [
    "AAKKKTTTPP",
    "AAKKKTTTPP",
    "LLLWWTTTPP",
    "LLLWWWWWPP",
    "LLLWWWWWPP",
    "LLLWWWWWPP",
    "LLZZZZZZZZ",
    "ZZZZZZZZZZ",
    "ZZZZZZZZZZ",
  ],
  thingMap: [
    ".sk..shoba",
    "s.k.k.o.o.",
    ".r..so..k.",
    "ss.o...t..",
    "s...ba....",
    "...h.www..",
    ".....ba...",
    "s.pp.ppba.",
    "..ba..ba.o",
  ],
  things: {
    a: "car",
    b: "carBack",
    h: "chair",
    k: "box",
    o: "oilPuddle",
    p: "pump",
    r: "cashRegister",
    s: "shelf",
    t: "table",
    w: "workbench",
  },
  extraThings: {
    carBack: {
      name: "Auto (hinten)",
      emoji: "\u{1F697}",
      standable: true,
      kinds: ["car"],
    },
    oilPuddle: { name: "Ölpfütze", emoji: "\u{26AB}", standable: true },
    pump: { name: "Zapfsäule", emoji: "\u{26FD}", standable: false },
    cashRegister: { name: "Kasse", emoji: "\u{1F4B5}", standable: false },
    workbench: {
      name: "Werkbank",
      emoji: "\u{1F6E0}\u{FE0F}",
      standable: false,
      kinds: ["furniture"],
    },
  },
  pieces: [
    { at: { row: 5, col: 5 }, rows: 1, cols: 3 },
    { at: { row: 0, col: 8 }, rows: 1, cols: 2, thing: "car" },
    { at: { row: 4, col: 4 }, rows: 1, cols: 2, thing: "car" },
    { at: { row: 6, col: 5 }, rows: 1, cols: 2, thing: "car" },
    { at: { row: 7, col: 7 }, rows: 1, cols: 2, thing: "car" },
    { at: { row: 8, col: 2 }, rows: 1, cols: 2, thing: "car" },
    { at: { row: 8, col: 6 }, rows: 1, cols: 2, thing: "car" },
  ],
  suspects: [
    {
      id: "A",
      name: "Axel",
      pronoun: "er",
      clue: { text: "Er war hinten in einem Auto.", ...on("carBack") },
      colour: "#b91c1c",
      face: "\u{1F468}\u{1F3FF}",
    },
    {
      id: "B",
      name: "Brent",
      pronoun: "er",
      clue: {
        text: "Jemand anderes in seinem Raum war neben einem Regal.",
        global: true,
        check: (c) =>
          c.peopleIn(c.areaOf(c.cell) ?? "").some((id) => {
            const there = c.cellOf(id);
            return (
              id !== c.self && there !== undefined && c.beside(there, "shelf")
            );
          }),
      },
      colour: "#15803d",
      face: "\u{1F468}‍\u{1F9B3}",
    },
    {
      id: "C",
      name: "Claus",
      pronoun: "er",
      clue: { text: "Er saß auf einem Stuhl.", ...on("chair") },
      colour: "#0e7490",
      face: "\u{1F474}",
    },
    {
      id: "D",
      name: "Delia",
      pronoun: "sie",
      clue: { text: "Sie war in der Werkstatt.", ...inArea("W") },
      colour: "#6366f1",
      face: "\u{1F475}",
    },
    {
      id: "E",
      name: "Enno",
      pronoun: "er",
      clue: { text: "Er war im Keller.", ...inArea("K") },
      colour: "#7c3aed",
      face: "\u{1F9D4}",
    },
    {
      id: "F",
      name: "Francine",
      pronoun: "sie",
      clue: {
        text: "Sie war nicht neben einer Kasse.",
        ...not(beside("cashRegister")),
      },
      colour: "#9f1239",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "G",
      name: "Gwen",
      pronoun: "sie",
      clue: {
        text: "Sie war in einem Auto im Tankbereich. Sie war nicht mit Axel zusammen.",
        ...all(
          on("car"),
          inArea("Z"),
          about(["A"], (c) => {
            const axel = c.cellOf("A");
            return axel === undefined || c.areaOf(axel) !== c.areaOf(c.cell);
          }),
        ),
      },
      colour: "#ea580c",
      face: "\u{1F469}",
    },
    {
      id: "H",
      name: "Harry",
      pronoun: "er",
      clue: { text: "Er war auf dem Parkplatz.", ...inArea("P") },
      colour: "#4338ca",
      face: "\u{1F9D4}",
    },
    {
      id: "O",
      name: "Orianna",
      pronoun: "sie",
      clue: {
        text: "Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F469}",
    },
  ],
  rules: [
    {
      text: "Genau eine Person war in einer Ölpfütze.",
      check: (c) =>
        c.people().filter((id) => {
          const there = c.cellOf(id);
          return there !== undefined && c.is(there, "oilPuddle");
        }).length === 1,
    },
    {
      note: true,
      text: "Dieser Ort hat ein besonderes Merkmal (abgesehen davon, dass er seit Jahren nicht geputzt wurde): Er hat eine leere Spalte. - Chief Williams",
    },
  ],
  hints: [
    {
      text: "Claus saß auf einem der beiden Stühle; schließe das sich überschneidende Feld in Z1 S4 aus.",
      cross: [{ row: 0, col: 3 }],
    },
    {
      text: "Axel (der laut Gwens Hinweis nicht im Tankbereich ist) ist entweder in der Werkstatt oder auf dem Parkplatz hinten in einem der beiden Autos in diesen Bereichen. Schließe die sich überschneidenden Felder bei Z1 S5 und Z5 S9 aus. Das lokalisiert Enno im Keller.",
      place: { E: { row: 1, col: 3 } },
      cross: [
        { row: 0, col: 4 },
        { row: 4, col: 8 },
      ],
    },
    {
      text: "Das lokalisiert Claus auf dem verbleibenden Stuhl, dann Axel, dann Delia in der Werkstatt.",
      place: {
        C: { row: 0, col: 6 },
        A: { row: 4, col: 4 },
        D: { row: 3, col: 5 },
      },
    },
    {
      text: "Das lässt eine verfügbare Ölpfütze, die laut dem allgemeinen Hinweis besetzt sein muss. Das lokalisiert Harry auf dem Parkplatz.",
      place: { H: { row: 5, col: 8 } },
    },
    {
      text: "Das lokalisiert Gwen im letzten Auto.",
      place: { G: { row: 7, col: 7 } },
    },
    {
      text: "Das lässt ein verfügbares Feld neben einem Regal (Z3 S1). Das lokalisiert Brent im selben Raum, in Z7 S2.",
      place: { B: { row: 6, col: 1 } },
    },
    {
      text: "Francine ist nicht neben der Kasse im Laden, also muss sie in der Ölpfütze sein, und Orianna ist neben dem Regal. Brent ist der Mörder!",
      place: { F: { row: 8, col: 9 }, O: { row: 2, col: 0 } },
    },
  ],
  solution: {
    A: { row: 4, col: 4 },
    B: { row: 6, col: 1 },
    C: { row: 0, col: 6 },
    D: { row: 3, col: 5 },
    E: { row: 1, col: 3 },
    F: { row: 8, col: 9 },
    G: { row: 7, col: 7 },
    H: { row: 5, col: 8 },
    O: { row: 2, col: 0 },
  },
};
