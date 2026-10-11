/**
 * The Petrol Station: a storeroom, a cellar, a toilet, a car park, a shop, a
 * workshop and the forecourt with its pumps, with a murdered woman.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/37. Die Tankstelle.png`, no
 * solution sheet - the solver proves the one solution, with the culprit
 * pencilled in on the photographed page).
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
      text: "Gwen war in einem Auto im Tankbereich und nicht mit Axel zusammen - Axel war also nicht im Tankbereich. Hinten in einem Auto bleiben ihm R1 C9 auf dem Parkplatz und R5 C5 in der Werkstatt. In R1 C9 bliebe Enno im Keller nur R2 C4, und Claus fände keinen Stuhl mehr: R1 C7 läge in R1, R6 C4 in C4. Axel war in R5 C5.",
      place: { A: { row: 4, col: 4 } },
      cross: [{ row: 0, col: 8 }],
    },
    {
      text: "Enno war im Keller: In R1 C5 und R2 C5 geht es nicht (C5 ist blockiert, R2 C5 ist ein Karton), also war er in C4. Damit bleibt Claus nur der Stuhl in R1 C7, und Enno war in R2 C4.",
      place: { C: { row: 0, col: 6 }, E: { row: 1, col: 3 } },
      cross: [{ row: 5, col: 3 }],
    },
    {
      text: "Delia war in der Werkstatt. R5, C4, C5 und C7 sind blockiert - es bleibt nur R4 C6.",
      place: { D: { row: 3, col: 5 } },
    },
    {
      text: "Genau eine Person stand in einer Ölpfütze. Alle Ölpfützen außer R9 C10 sind blockiert, also stand dort jemand. Harry bleibt auf dem Parkplatz nur R6 C9 (R3 C10 und R6 C10 liegen in C10), Gwen im Tankbereich nur das Auto in R8 C8.",
      place: { H: { row: 5, col: 8 }, G: { row: 7, col: 7 } },
    },
    {
      text: "Wer stand in R9 C10? Sonst sind nur noch R3 und R7 in C1 bis C3 frei. Brent dort hätte im Tankbereich niemanden neben einem Regal bei sich. Orianna dort: Brent und Francine müssten beide in den Laden, und neben einem Regal ist im Laden nur R3 C1 - neben der Kasse, wo Francine nicht war. Also stand Francine in R9 C10.",
      place: { F: { row: 8, col: 9 } },
    },
    {
      text: "Brent und Orianna bleiben R3 und R7. Jemand anderes in Brents Raum war neben einem Regal: Das kann nur Orianna in R3 C1 sein, neben dem Regal in R4 C1. Brent war in R7 C2 bei ihr im Laden (R7 C3 liegt im Tankbereich). Im Laden war Orianna allein mit Brent - Brent ist der Mörder!",
      place: { O: { row: 2, col: 0 }, B: { row: 6, col: 1 } },
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
