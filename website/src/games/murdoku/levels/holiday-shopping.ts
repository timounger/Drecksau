/**
 * Holiday Shopping: a shopping centre with shops, a walkway, Santa's Lodge
 * and Santa's Village - and a murder among the Christmas shoppers.
 *
 * @module
 * @remarks
 * After the medium case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Mittel/Weihnachtseinkäufe/holiday-shopping-color.pdf`,
 * solution sheet beside it). Vlimbo is the victim; whoever was alone with him
 * killed him. The doors are drawn on the walls between the walkway and the
 * shops; "in front of a door" is the walkway field each door opens onto, so
 * the doors stand on those walkway fields.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data:
   rows, columns and counts straight off the printed page. */
import {
  about,
  all,
  alone,
  beside,
  column,
  counting,
  inArea,
  on,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** Whether nobody but the suspect sits on a chair. */
function onlyOneSitting(c: Context): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return id === c.self || there === undefined || !c.is(there, "chair");
  });
}

/** The case. */
export const HOLIDAY_SHOPPING: Level = {
  id: "holiday-shopping",
  name: "Weihnachtseinkäufe",
  difficulty: "medium",
  series: { book: "online" },
  story:
    "Vlimbo wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "E",
      name: "Elektronikladen",
      at: "im Elektronikladen",
      ground: "floor",
      tint: "#f6e3bf",
      label: { row: 5, col: 0 },
    },
    {
      key: "W",
      name: "Gang",
      at: "im Gang",
      ground: "floor",
      tint: "#cfe3f0",
      label: { row: 7, col: 2 },
    },
    {
      key: "B",
      name: "Buchladen",
      at: "im Buchladen",
      ground: "floor",
      tint: "#f8f0dc",
      label: { row: 4, col: 9 },
    },
    {
      key: "L",
      name: "Hütte des Weihnachtsmanns",
      at: "in der Hütte des Weihnachtsmanns",
      ground: "floor",
      tint: "#b9e4c4",
      label: { row: 2, col: 6 },
    },
    {
      key: "V",
      name: "Weihnachtsdorf",
      at: "im Weihnachtsdorf",
      ground: "floor",
      tint: "#e8f5f7",
      label: { row: 6, col: 3 },
    },
    {
      key: "T",
      name: "Spielzeugladen",
      at: "im Spielzeugladen",
      ground: "floor",
      tint: "#f6d9d9",
      label: { row: 10, col: 0 },
    },
    {
      key: "C",
      name: "Café",
      at: "im Café",
      ground: "floor",
      tint: "#e8b9a0",
      label: { row: 10, col: 7 },
    },
  ],
  areaMap: [
    "EEEEWWWWWBB",
    "EEWWWWLLWBB",
    "EEWVVVLLWBB",
    "EEWVVVVVWBB",
    "EEWVVVVVWBB",
    "EEWVVVVVWWW",
    "TTWVVVVVWCC",
    "TTWWWWWWWCC",
    "TTTTWWCCCCC",
    "TTTTWWCCCCC",
    "TTTTWWCCCCC",
  ],
  groundMap: [
    "...........",
    "...........",
    "...........",
    "...........",
    ".....k.....",
    ".....k.....",
    "...kkk.....",
    "...........",
    "...........",
    "...........",
    "...........",
  ],
  grounds: { ".": "floor", k: "carpet" },
  thingMap: [
    "vv..c.....s",
    "......ct.t.",
    "r...g...d.r",
    "v....cg.d.s",
    "..dx...x...",
    "v.....y.m..",
    "s.d...x...t",
    "..d....d..c",
    "y....mc....",
    "ssrt..t.ttr",
    "...sc.c....",
  ],
  things: {
    v: "tv",
    c: "chair",
    s: "shelf",
    t: "table",
    r: "cashRegister",
    g: "present",
    d: "door",
    x: "tree",
    y: "teddyBear",
    m: "bin",
  },
  extraThings: {
    cashRegister: { name: "Kasse", emoji: "\u{1F4B5}", standable: false },
    present: { name: "Geschenk", emoji: "\u{1F381}", standable: false },
    door: { name: "Tür", emoji: "\u{1F6AA}", standable: true },
    teddyBear: { name: "Teddybär", emoji: "\u{1F9F8}", standable: false },
    bin: { name: "Mülleimer", emoji: "\u{1F5D1}️", standable: false },
  },
  pieces: [{ at: { row: 9, col: 8 }, rows: 1, cols: 2 }],
  suspects: [
    {
      id: "A",
      name: "Avery",
      pronoun: "er",
      clue: {
        text: "Er war nördlich von Vlimbo.",
        ...about(["V"], (c) => {
          const vlimbo = c.cellOf("V");
          return vlimbo !== undefined && c.cell.row < vlimbo.row;
        }),
      },
      colour: "#b91c1c",
      face: "\u{1F468}",
    },
    {
      id: "B",
      name: "Bashir",
      pronoun: "er",
      clue: {
        text: "Er war im Gang, vor einer Tür.",
        ...all(inArea("W"), on("door")),
      },
      colour: "#15803d",
      face: "\u{1F468}",
    },
    {
      id: "C",
      name: "Crystal",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Teddybären.", ...beside("teddyBear") },
      colour: "#0e7490",
      face: "\u{1F469}‍\u{1F9B3}",
    },
    {
      id: "D",
      name: "Dana",
      pronoun: "sie",
      clue: { text: "Sie war neben einer Kasse.", ...beside("cashRegister") },
      colour: "#6366f1",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "E",
      name: "Eva",
      pronoun: "sie",
      clue: {
        text: "Sie war im Café. Sie war nicht mit Figgy zusammen.",
        ...all(
          inArea("C"),
          about(["F"], (c) => {
            const figgy = c.cellOf("F");
            return figgy !== undefined && c.areaOf(figgy) !== c.areaOf(c.cell);
          }),
        ),
      },
      colour: "#7c3aed",
      face: "\u{1F469}",
    },
    {
      id: "F",
      name: "Figgy",
      pronoun: "sie",
      clue: {
        text: "Sie war die Einzige, die auf einem Stuhl saß.",
        ...all(on("chair"), counting(onlyOneSitting)),
      },
      colour: "#9f1239",
      face: "\u{1F9DD}‍♀️",
    },
    {
      id: "G",
      name: "Gemma",
      pronoun: "sie",
      clue: { text: "Sie war im Buchladen.", ...inArea("B") },
      colour: "#ea580c",
      face: "\u{1F469}",
    },
    {
      id: "S",
      name: "Santa",
      pronoun: "er",
      clue: {
        text: "Er war allein in der Hütte des Weihnachtsmanns.",
        ...all(inArea("L"), alone()),
      },
      colour: "#4338ca",
      face: "\u{1F385}",
    },
    {
      id: "I",
      name: "Isabella",
      pronoun: "sie",
      clue: { text: "Sie war in der fünften Spalte.", ...column(5) },
      colour: "#0f766e",
      face: "\u{1F469}",
    },
    {
      id: "J",
      name: "Jack",
      pronoun: "er",
      clue: {
        text: "Er war genau eine Reihe nördlich von Gemma.",
        ...about(["G"], (c) => {
          const gemma = c.cellOf("G");
          return gemma !== undefined && gemma.row === c.cell.row + 1;
        }),
      },
      colour: "#a16207",
      face: "\u{1F9D4}",
    },
    {
      id: "V",
      name: "Vlimbo",
      pronoun: "er",
      clue: { text: "Er war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F9DD}‍♂️",
    },
  ],
  hints: [
    {
      text: "F ist die Einzige, die auf einem Stuhl sitzt. Wegen Es Hinweis kann sie nicht im Café sein. In C5 kann sie nicht sein, dort ist schon I. In der Hütte des Weihnachtsmanns kann sie nicht sein, denn S ist dort allein. Also bleibt für F nur noch ein Stuhl, in R4 C6. Das isoliert F; streiche die anderen Stühle.",
      place: { F: { row: 3, col: 5 } },
      cross: [
        { row: 0, col: 4 },
        { row: 1, col: 6 },
        { row: 7, col: 10 },
        { row: 8, col: 6 },
        { row: 10, col: 4 },
        { row: 10, col: 6 },
      ],
    },
    {
      text: "S kann nur in R3 in der Hütte des Weihnachtsmanns sein. Streiche den Rest von R3.",
      cross: [
        { row: 2, col: 0 },
        { row: 2, col: 1 },
        { row: 2, col: 2 },
        { row: 2, col: 3 },
        { row: 2, col: 4 },
        { row: 2, col: 5 },
        { row: 2, col: 8 },
        { row: 2, col: 9 },
        { row: 2, col: 10 },
      ],
    },
    {
      text: "J ist eine Reihe nördlich von G, die im Buchladen ist. J kann jetzt nur noch in R1 sein und G in R2. Das isoliert G.",
      place: { G: { row: 1, col: 10 } },
    },
    {
      text: "Damit muss D neben der Kasse in C3 sein. Das isoliert B vor der letzten Tür, danach S.",
      place: { B: { row: 7, col: 7 }, S: { row: 2, col: 6 } },
    },
    {
      text: "Das isoliert C neben dem letzten Teddybären, danach D.",
      place: { C: { row: 8, col: 1 }, D: { row: 10, col: 2 } },
    },
    {
      text: "Das isoliert E im Café und A auf dem letzten freien Feld im Elektronikladen (J ist schon in R1).",
      place: { E: { row: 6, col: 9 }, A: { row: 4, col: 0 } },
    },
    {
      text: "I muss auf dem letzten freien Feld in R10 sein, und J auf dem letzten freien Feld in C9.",
      place: { I: { row: 9, col: 4 }, J: { row: 0, col: 8 } },
    },
    {
      text: "Das isoliert V auf dem letzten Feld, allein mit F im Weihnachtsdorf. Figgy ist die Mörderin!",
      place: { V: { row: 5, col: 3 } },
    },
  ],
  solution: {
    A: { row: 4, col: 0 },
    B: { row: 7, col: 7 },
    C: { row: 8, col: 1 },
    D: { row: 10, col: 2 },
    E: { row: 6, col: 9 },
    F: { row: 3, col: 5 },
    G: { row: 1, col: 10 },
    S: { row: 2, col: 6 },
    I: { row: 9, col: 4 },
    J: { row: 0, col: 8 },
    V: { row: 5, col: 3 },
  },
};
