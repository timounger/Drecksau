/**
 * Ganztagskonferenz: a break room, the manager's office, a toilet, an
 * open-plan office and a conference room, with a murdered colleague.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/67. Ganztagskonferenz.JPG`,
 * solution sheet in `Lösungen 1-80/Lösung 65-68.JPG`). The page has no rule
 * under the magnifier.
 * Ogden is the victim; whoever was alone with him killed him.
 *
 * The armchairs are the chairs and can be stood on; sitting means being on
 * one. The tables (the desk and the long tables among them), the shelves, the
 * TVs and the plants cannot. The windows are in the outer walls; being in
 * front of one means being on the field right next to it.
 */
import {
  about,
  all,
  alone,
  beside,
  cellsWhere,
  counting,
  inArea,
  not,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Cell, Context, Level, WallWindow } from "../engine/types";

/** The windows in the outer walls, with the field in front of each. */
const WINDOWS: readonly WallWindow[] = [
  { at: { row: 1, col: 0 }, side: "left" },
  { at: { row: 0, col: 4 }, side: "top" },
  { at: { row: 0, col: 7 }, side: "top" },
  { at: { row: 4, col: 8 }, side: "right" },
  { at: { row: 5, col: 8 }, side: "right" },
  { at: { row: 6, col: 8 }, side: "right" },
  { at: { row: 7, col: 8 }, side: "right" },
];

/** Whether a field lies right in front of a window. */
function byWindow(cell: Cell): boolean {
  return WINDOWS.some(
    (one) => one.at.row === cell.row && one.at.col === cell.col,
  );
}

/** Whether somebody else shared the suspect's room, and everybody in it sat. */
function notAloneAndAllSeated(c: Context): boolean {
  const here = c.peopleIn(c.areaOf(c.cell) ?? "");
  return (
    here.length > 1 &&
    here.every((id) => {
      const there = c.cellOf(id);
      return there !== undefined && c.is(there, "chair");
    })
  );
}

/** Whether the suspect stood east of somebody, by id. */
function eastOf(id: string): (c: Context) => boolean {
  return (c: Context): boolean => {
    const there = c.cellOf(id);
    return there !== undefined && c.cell.col > there.col;
  };
}

/** Whether the suspect stood west of somebody, by id. */
function westOf(id: string): (c: Context) => boolean {
  return (c: Context): boolean => {
    const there = c.cellOf(id);
    return there !== undefined && c.cell.col < there.col;
  };
}

/** The case. */
export const ALL_DAY_CONFERENCE: Level = {
  id: "all-day-conference",
  name: "Ganztagskonferenz",
  series: { book: "original", number: 67 },
  story:
    "Wer sechs Stunden PowerPoint-Präsentationen durchhalten muss, könnte vor Gericht durchaus mit vorübergehender Unzurechnungsfähigkeit davonkommen.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "P",
      name: "Pausenraum",
      at: "im Pausenraum",
      ground: "floor",
      tint: "#dcebe8",
      label: { row: 3, col: 0 },
    },
    {
      key: "M",
      name: "Büro des Managers",
      at: "im Büro des Managers",
      ground: "floor",
      tint: "#d6e3f0",
      label: { row: 3, col: 3 },
    },
    {
      key: "T",
      name: "Toilette",
      at: "in der Toilette",
      ground: "floor",
      tint: "#f0d8e2",
      label: { row: 2, col: 8 },
      labelEnd: true,
    },
    {
      key: "G",
      name: "Großraumbüro",
      at: "im Großraumbüro",
      ground: "floor",
      tint: "#dfe3f0",
      label: { row: 8, col: 1 },
    },
    {
      key: "K",
      name: "Konferenzraum",
      at: "im Konferenzraum",
      ground: "floor",
      tint: "#e4d6ec",
      label: { row: 8, col: 8 },
      labelEnd: true,
    },
  ],
  areaMap: [
    "PPPMMMTTT",
    "PPPMMMTTT",
    "PPPMMMTTT",
    "PPPMMMKKK",
    "GGGGGKKKK",
    "GGGGGKKKK",
    "GGGGGKKKK",
    "GGGGGKKKK",
    "GGGGGKKKK",
  ],
  thingMap: [
    "c..s.p...",
    "..v.c.t.c",
    "csttt....",
    ".tcs..vc.",
    "...p.sttc",
    "ctvtc.ct.",
    "vtctvc.tc",
    "ttttt..t.",
    "cvtcvpvc.",
  ],
  things: {
    c: "chair",
    p: "plant",
    s: "shelf",
    t: "table",
    v: "tv",
  },
  pieces: [{ at: { row: 2, col: 3 }, rows: 1, cols: 2 }],
  shapes: [
    [
      { row: 4, col: 6 },
      { row: 4, col: 7 },
      { row: 5, col: 7 },
      { row: 6, col: 7 },
      { row: 7, col: 7 },
    ],
    [
      { row: 5, col: 1 },
      { row: 6, col: 1 },
      { row: 5, col: 3 },
      { row: 6, col: 3 },
      { row: 7, col: 0 },
      { row: 7, col: 1 },
      { row: 7, col: 2 },
      { row: 7, col: 3 },
      { row: 7, col: 4 },
      { row: 8, col: 2 },
    ],
  ],
  windows: WINDOWS,
  suspects: [
    {
      id: "A",
      name: "Andre",
      pronoun: "er",
      clue: { text: "Er saß auf einem Stuhl.", ...on("chair") },
      colour: "#b91c1c",
      face: "\u{1F468}",
    },
    {
      id: "B",
      name: "Bethany",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Fernseher.", ...beside("tv") },
      colour: "#15803d",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "C",
      name: "Clyde",
      pronoun: "er",
      clue: {
        text: "Er war vor einem Fenster. Er saß nicht.",
        ...all(
          own((c) => byWindow(c.cell)),
          not(on("chair")),
        ),
        glow: (level) => cellsWhere(level, byWindow),
      },
      colour: "#0e7490",
      face: "\u{1F474}",
    },
    {
      id: "D",
      name: "Delia",
      pronoun: "sie",
      clue: {
        text: "Sie war nicht allein. Alle in ihrem Raum saßen auf einem Stuhl.",
        ...counting(notAloneAndAllSeated),
      },
      colour: "#6366f1",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "E",
      name: "Eduardo",
      pronoun: "er",
      clue: {
        text: "Er saß nicht. Er war nicht in der Toilette.",
        ...all(not(on("chair")), not(inArea("T"))),
      },
      colour: "#7c3aed",
      face: "\u{1F9D4}",
    },
    {
      id: "F",
      name: "Felicia",
      pronoun: "sie",
      clue: {
        text: "Sie war allein im Pausenraum.",
        ...all(inArea("P"), alone()),
      },
      colour: "#9f1239",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "G",
      name: "Gustav",
      pronoun: "er",
      clue: {
        text: "Er war neben einer Pflanze. Er war östlich von Delia.",
        ...all(beside("plant"), about(["D"], eastOf("D"))),
      },
      colour: "#ea580c",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "H",
      name: "Helena",
      pronoun: "sie",
      clue: {
        text: "Sie war östlich von Felicia und westlich von Delia.",
        ...about(["F", "D"], (c) => eastOf("F")(c) && westOf("D")(c)),
      },
      colour: "#4338ca",
      face: "\u{1F469}",
    },
    {
      id: "O",
      name: "Ogden",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F9D4}",
    },
  ],
  hints: [
    {
      text: "Gustav kann nicht im selben Raum wie Delia sein, da er nicht sitzt (kein Stuhl ist neben einer Pflanze).",
    },
    {
      text: "Weil Gustav östlich von Delia in einem anderen Raum ist, kann Delia nur im Großraumbüro sein (nicht im Pausenraum, wo Felicia allein ist). Schließe alle Felder im Großraumbüro aus, die keinen Stuhl haben.",
      cross: [
        { row: 4, col: 0 },
        { row: 4, col: 1 },
        { row: 4, col: 2 },
        { row: 4, col: 4 },
      ],
    },
    {
      text: "Jemand muss im Pausenraum in C2 sein; das kann nur Felicia sein. Schließe den Rest des Raums aus. Das lokalisiert jemanden auf dem Stuhl in R7 C3.",
    },
    {
      text: "Wir können auch jemanden auf dem Stuhl in R5 C9 lokalisieren. Das setzt Clyde in R1, was Felicia lokalisiert. Das lokalisiert Gustav neben der letzten Pflanze, was Eduardo lokalisiert, dann Clyde.",
      place: {
        F: { row: 1, col: 1 },
        G: { row: 7, col: 5 },
        E: { row: 3, col: 4 },
        C: { row: 0, col: 7 },
      },
    },
    {
      text: "Das lokalisiert Helena und Delia im Großraumbüro. Das lokalisiert Bethany im verbleibenden Feld neben einem Fernseher, dann Andre auf dem verbleibenden Stuhl, dann Ogden. Clyde ist der Mörder!",
      place: {
        H: { row: 6, col: 2 },
        D: { row: 8, col: 3 },
        B: { row: 5, col: 0 },
        A: { row: 4, col: 8 },
        O: { row: 2, col: 6 },
      },
    },
  ],
  solution: {
    A: { row: 4, col: 8 },
    B: { row: 5, col: 0 },
    C: { row: 0, col: 7 },
    D: { row: 8, col: 3 },
    E: { row: 3, col: 4 },
    F: { row: 1, col: 1 },
    G: { row: 7, col: 5 },
    H: { row: 6, col: 2 },
    O: { row: 2, col: 6 },
  },
};
