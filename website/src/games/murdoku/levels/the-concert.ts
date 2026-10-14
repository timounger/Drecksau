/**
 * The Concert: a stage with a carpet, the west and the east stands and two
 * toilets, with a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/39. Das Konzert.png`,
 * solution sheet `Lösungen 1-80/Lösung 37-40.JPG`).
 * Oren is the victim; whoever was alone with him killed him.
 *
 * The armchairs and the carpet on the stage can be stood on; tables, TVs and
 * plants cannot. The stage's two front corners lie outside the carpet's
 * border. "West of" means in a column further left, any row.
 */
import {
  about,
  all,
  beside,
  inArea,
  not,
  on,
  onGround,
  row,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */

/** Whether the suspect stands in a column west of somebody. */
function westOf(id: string): (c: Context) => boolean {
  return (c: Context): boolean => {
    const there = c.cellOf(id);
    return there === undefined || c.cell.col < there.col;
  };
}

/** Whether somebody else stands beside a TV that the suspect stands beside. */
function shareATv(c: Context): boolean {
  return c.neighbours(c.cell).some(
    (tv) =>
      c.is(tv, "tv") &&
      c.neighbours(tv).some((spot) => {
        const other = c.personAt(spot);
        return other !== null && other !== c.self;
      }),
  );
}

/** The case. */
export const THE_CONCERT: Level = {
  id: "the-concert",
  name: "Das Konzert",
  series: { book: "original", number: 39 },
  story: "Das große Finale kam heute Nacht für jemanden etwas früher.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "W",
      name: "Tribüne (West)",
      at: "auf der Tribüne (West)",
      ground: "floor",
      tint: "#c4dcf0",
      label: { row: 8, col: 2 },
      labelEnd: true,
    },
    {
      key: "A",
      name: "Toilette A",
      at: "in Toilette A",
      ground: "stone",
      tint: "#d3e6f3",
      label: { row: 2, col: 4 },
    },
    {
      key: "O",
      name: "Tribüne (Ost)",
      at: "auf der Tribüne (Ost)",
      ground: "floor",
      tint: "#bfd8ee",
      label: { row: 8, col: 5 },
    },
    {
      key: "S",
      name: "Bühne",
      at: "auf der Bühne",
      ground: "carpet",
      tint: "#e2b6cc",
      label: { row: 5, col: 4 },
    },
    {
      key: "B",
      name: "Toilette B",
      at: "in Toilette B",
      ground: "stone",
      tint: "#d3e6f3",
      label: { row: 8, col: 3 },
    },
  ],
  areaMap: [
    "..WWAAO..",
    ".WWWAAOO.",
    "WWWWAAOOO",
    "WWSSSSSOO",
    "WWSSSSSOO",
    "WWSSSSSOO",
    "WWWBBOOOO",
    ".WWBBOOO.",
    "..WBBOO..",
  ],
  groundMap: [
    "ffffssfff",
    "ffffssfff",
    "ffffssfff",
    "fffcccfff",
    "ffcccccff",
    "ffcccccff",
    "fffssffff",
    "fffssffff",
    "fffssffff",
  ],
  grounds: { c: "carpet", f: "floor", s: "stone" },
  carpets: [
    [
      { row: 3, col: 3 },
      { row: 3, col: 4 },
      { row: 3, col: 5 },
      { row: 4, col: 2 },
      { row: 4, col: 3 },
      { row: 4, col: 4 },
      { row: 4, col: 5 },
      { row: 4, col: 6 },
      { row: 5, col: 2 },
      { row: 5, col: 3 },
      { row: 5, col: 4 },
      { row: 5, col: 5 },
      { row: 5, col: 6 },
    ],
  ],
  thingMap: [
    "..ttp....",
    "..cc.....",
    "..cc..cc.",
    "cc.....cc",
    "cc.....cc",
    "cc......c",
    "tv...vc..",
    "..cp.cc..",
    "...p..p..",
  ],
  things: {
    c: "chair",
    p: "plant",
    t: "table",
    v: "tv",
  },
  pieces: [{ at: { row: 0, col: 2 }, rows: 1, cols: 2 }],
  suspects: [
    {
      id: "A",
      name: "Anton",
      pronoun: "er",
      clue: { text: "Er war neben einem Tisch.", ...beside("table") },
      colour: "#b91c1c",
      face: "\u{1F9D4}",
    },
    {
      id: "B",
      name: "Bea",
      pronoun: "sie",
      clue: { text: "Sie war in der untersten Zeile.", ...row(9) },
      colour: "#15803d",
      face: "\u{1F471}\u{1F3FF}‍♀️",
    },
    {
      id: "C",
      name: "Cedric",
      pronoun: "er",
      clue: { text: "Er war in Toilette A.", ...inArea("A") },
      colour: "#0e7490",
      face: "\u{1F468}",
    },
    {
      id: "D",
      name: "Doris",
      pronoun: "sie",
      clue: { text: "Sie saß auf einem Stuhl.", ...on("chair") },
      colour: "#6366f1",
      face: "\u{1F469}",
    },
    {
      id: "E",
      name: "Eduardo",
      pronoun: "er",
      clue: {
        text: "Er war westlich von Anton. Er saß auf einem Stuhl.",
        ...all(on("chair"), about(["A"], westOf("A"))),
      },
      colour: "#7c3aed",
      face: "\u{1F468}‍\u{1F9B0}",
    },
    {
      id: "F",
      name: "Frances",
      pronoun: "sie",
      clue: {
        text: "Sie war westlich von Eduardo. Sie saß nicht auf einem Stuhl.",
        ...all(not(on("chair")), about(["E"], westOf("E"))),
      },
      colour: "#9f1239",
      face: "\u{1F469}‍\u{1F3A4}",
    },
    {
      id: "G",
      name: "Gabriella",
      pronoun: "sie",
      clue: {
        text: "Sie war neben einem Fernseher. Jemand anderes war neben demselben Fernseher.",
        ...all(beside("tv"), { global: true, check: shareATv }),
      },
      colour: "#ea580c",
      face: "\u{1F469}",
    },
    {
      id: "H",
      name: "Hans",
      pronoun: "er",
      clue: { text: "Er war auf dem Teppich.", ...onGround("carpet") },
      colour: "#4338ca",
      face: "\u{1F468}",
    },
    {
      id: "O",
      name: "Oren",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F9D4}",
    },
  ],
  rules: [
    {
      text: "Es gab keinen leeren Raum.",
      check: (c) =>
        c.level.areas.every((area) => c.peopleIn(area.key).length > 0),
    },
  ],
  hints: [
    {
      text: "Weil Frances westlich von Eduardo ist, der westlich von Anton ist, kann Anton nicht in S1 sein. Er muss dann in Z2 sein, in S3 oder S4.",
      cross: [{ row: 5, col: 0 }],
    },
    {
      text: "Wenn Gabriella und jemand anders beide neben dem Fernseher in der Tribüne (Ost) wären, könnte niemand in Z1 sein. Also ist Gabriella in der Tribüne (West) mit Anton, Eduardo und Frances.",
    },
    {
      text: "Gabriella und Eduardo müssen neben dem Fernseher in S2 und S3 in irgendeiner Konfiguration sein. Das lokalisiert Anton in S4 und platziert Frances in S1, wo sie nur in Z3 sein kann.",
      place: { A: { row: 1, col: 3 }, F: { row: 2, col: 0 } },
    },
    {
      text: "Eduardo sitzt, also muss er in Z6 S2 sein, was Gabriella lokalisiert.",
      place: { E: { row: 5, col: 1 }, G: { row: 6, col: 2 } },
    },
    {
      text: "Das lokalisiert Cedric, dann Bea.",
      place: { C: { row: 0, col: 5 }, B: { row: 8, col: 4 } },
    },
    {
      text: "Das lokalisiert Hans im letzten Teppichfeld.",
      place: { H: { row: 4, col: 6 } },
    },
    {
      text: "Das lokalisiert Doris und Oren. Doris ist die Mörderin!",
      place: { D: { row: 3, col: 8 }, O: { row: 7, col: 7 } },
    },
  ],
  solution: {
    A: { row: 1, col: 3 },
    B: { row: 8, col: 4 },
    C: { row: 0, col: 5 },
    D: { row: 3, col: 8 },
    E: { row: 5, col: 1 },
    F: { row: 2, col: 0 },
    G: { row: 6, col: 2 },
    H: { row: 4, col: 6 },
    O: { row: 7, col: 7 },
  },
};
