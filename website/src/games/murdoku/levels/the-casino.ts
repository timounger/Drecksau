/**
 * Das Casino: the gaming hall, a lounge, the lobby, the security room and the
 * slot machines, with a murdered guest.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/45. Das Casino.png`,
 * solution sheet `Lösungen 1-80/Lösung 45-48.JPG`).
 * Ozzy is the victim; whoever was alone with him killed him.
 *
 * The armchairs are the chairs and can be stood on; the gaming tables (each
 * one covers every field it is drawn over), the TVs and slot machine screens
 * and the plants cannot. Sitting on a chair means being on an armchair. The
 * windows are the bars in the outer walls; standing in front of one means
 * being on the field right beside it. "Somebody else was beside the same
 * plant" means another person stood next to that plant, in its area.
 */
import {
  about,
  alone,
  all,
  beside,
  cellsWhere,
  counting,
  inArea,
  on,
  own,
  row,
  victim,
} from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** The fields right in front of a window. */
const WINDOWS: readonly Cell[] = [
  { row: 0, col: 1 },
  { row: 0, col: 4 },
  { row: 3, col: 8 },
  { row: 5, col: 8 },
];

/** Whether a field lies right in front of a window. */
function byWindow(cell: Cell): boolean {
  return WINDOWS.some((one) => one.row === cell.row && one.col === cell.col);
}

/** Whether nobody but the suspect stood on a thing of this id. */
function onlyOneOn(what: string): (c: Context) => boolean {
  return (c: Context): boolean =>
    c.people().every((id) => {
      const there = c.cellOf(id);
      return id === c.self || there === undefined || !c.is(there, what);
    });
}

/** Whether somebody else stood beside one of the plants beside the suspect. */
function plantShared(c: Context): boolean {
  return c
    .neighbours(c.cell)
    .filter((plant) => c.is(plant, "plant"))
    .some((plant) =>
      c.people().some((id) => {
        const there = c.cellOf(id);
        return (
          id !== c.self &&
          there !== undefined &&
          c
            .neighbours(plant)
            .some((one) => one.row === there.row && one.col === there.col)
        );
      }),
    );
}

/** The case. */
export const THE_CASINO: Level = {
  id: "the-casino",
  name: "Das Casino",
  series: { book: "original", number: 45 },
  story: "Ich bevorzuge Roulette in der Nicht-Russischen Variante.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "H",
      name: "Spielhalle",
      at: "in der Spielhalle",
      ground: "floor",
      tint: "#bfe3dc",
      label: { row: 5, col: 0 },
    },
    {
      key: "L",
      name: "Lounge",
      at: "in der Lounge",
      ground: "floor",
      tint: "#bcd3ef",
      label: { row: 2, col: 6 },
    },
    {
      key: "Y",
      name: "Lobby",
      at: "in der Lobby",
      ground: "floor",
      tint: "#e2e3e4",
      label: { row: 5, col: 7 },
    },
    {
      key: "S",
      name: "Sicherheit",
      at: "in der Sicherheit",
      ground: "floor",
      tint: "#dccbea",
      label: { row: 8, col: 0 },
    },
    {
      key: "A",
      name: "Spielautomaten",
      at: "bei den Spielautomaten",
      ground: "floor",
      tint: "#eab3aa",
      label: { row: 8, col: 3 },
    },
  ],
  areaMap: [
    "HHHHHHLLL",
    "HHHHHHLLL",
    "HHHHHHLLL",
    "HHHHHHHYY",
    "HHHHHHHYY",
    "HHHHHHHYY",
    "SSSAAAAAA",
    "SSSAAAAAA",
    "SSSAAAAAA",
  ],
  thingMap: [
    "pct...cpc",
    "ttt..p...",
    ".cc..c...",
    "tt...p...",
    "p..tt....",
    "..ctt....",
    ".........",
    "v....cc.c",
    "v.p..vvvv",
  ],
  things: { c: "chair", p: "plant", t: "table", v: "tv" },
  shapes: [
    [
      { row: 0, col: 2 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
    ],
  ],
  pieces: [
    { at: { row: 3, col: 0 }, rows: 1, cols: 2 },
    { at: { row: 4, col: 3 }, rows: 2, cols: 2 },
  ],
  windows: [
    { at: { row: 0, col: 1 }, side: "top" },
    { at: { row: 0, col: 4 }, side: "top" },
    { at: { row: 3, col: 8 }, side: "right" },
    { at: { row: 5, col: 8 }, side: "right" },
  ],
  suspects: [
    {
      id: "A",
      name: "Abdul",
      pronoun: "er",
      clue: {
        text: "Er war in der Spielhalle. Er war östlich von Eloise, südlich von Björn.",
        ...all(
          inArea("H"),
          about(["E", "B"], (c) => {
            const eloise = c.cellOf("E");
            const bjoern = c.cellOf("B");
            return (
              eloise !== undefined &&
              bjoern !== undefined &&
              c.cell.col > eloise.col &&
              c.cell.row > bjoern.row
            );
          }),
        ),
      },
      colour: "#b91c1c",
      face: "\u{1F468}‍\u{1F9B2}",
    },
    {
      id: "B",
      name: "Björn",
      pronoun: "er",
      clue: {
        text: "Er war neben einer Pflanze. Jemand anders war neben derselben Pflanze.",
        ...all(beside("plant"), counting(plantShared)),
      },
      colour: "#15803d",
      face: "\u{1F468}",
    },
    {
      id: "C",
      name: "Clara",
      pronoun: "sie",
      clue: { text: "Sie war allein.", ...alone() },
      colour: "#0e7490",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "D",
      name: "Diana",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person, die auf einem Stuhl saß.",
        ...all(on("chair"), counting(onlyOneOn("chair"))),
      },
      colour: "#6366f1",
      face: "\u{1F469}",
    },
    {
      id: "E",
      name: "Eloise",
      pronoun: "sie",
      clue: { text: "Sie war in der obersten Zeile.", ...row(1) },
      colour: "#7c3aed",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "F",
      name: "Francis",
      pronoun: "er",
      clue: { text: "Er war neben einem Fernseher.", ...beside("tv") },
      colour: "#9f1239",
      face: "\u{1F468}",
    },
    {
      id: "G",
      name: "Guido",
      pronoun: "er",
      clue: {
        text: "Er war neben einem Tisch und neben einem Stuhl.",
        ...all(beside("table"), beside("chair")),
      },
      colour: "#ea580c",
      face: "\u{1F9D4}",
    },
    {
      id: "H",
      name: "Hein",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person vor einem Fenster.",
        ...all(
          own((c) => byWindow(c.cell)),
          counting((c) =>
            c.people().every((id) => {
              const there = c.cellOf(id);
              return id === c.self || there === undefined || !byWindow(there);
            }),
          ),
        ),
        glow: (level) => cellsWhere(level, byWindow),
      },
      colour: "#4338ca",
      face: "\u{1F474}",
    },
    {
      id: "O",
      name: "Ozzy",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F468}",
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
      text: "Weil Eloise in der obersten Zeile ist, muss Hein an einem Lobby-Fenster sein, Z4 oder Z6. Eloise ist laut Dianas und Heins Hinweisen nicht auf einem Stuhl oder am Fenster, also ist sie in S4 oder S6.",
      cross: [
        { row: 0, col: 1 },
        { row: 0, col: 4 },
      ],
    },
    {
      text: "Abdul ist in der Spielhalle, ebenso Björn (zwei Personen können nicht neben der Lounge-Pflanze sein, und der Sicherheitsraum ist zu weit südlich) und auch Guido, der neben einem Tisch ist.",
    },
    {
      text: "Kein Raum ist leer, also sind Clara, Diana und Francis in der Lounge, im Sicherheitsraum und im Spielautomatenraum in irgendeiner Reihenfolge. Nur Clara kann in der Lounge sein. Das lässt Diana bei den Spielautomaten und Francis im Sicherheitsraum in S1 oder S2.",
    },
    {
      text: "Die beiden Personen neben einer Pflanze sind nicht in S1/S2 (Francis ist in S1 oder S2) oder S6/S7 (Diana ist auf einem Stuhl in S6 oder S7), also müssen sie S5 und S6 besetzen. Das lässt einen Stuhl für Diana, in Z8 S7.",
      place: { D: { row: 7, col: 6 } },
    },
    {
      text: "Weil Abdul östlich von Eloise ist, muss Eloise in S4 sein. Das lokalisiert Björn und Abdul in Z4 und Z5, dann Hein und Guido, dann Clara und Francis. Ozzy muss im Sicherheitsraum mit Francis sein. Francis ist der Mörder!",
      place: {
        E: { row: 0, col: 3 },
        B: { row: 3, col: 4 },
        A: { row: 4, col: 5 },
        H: { row: 5, col: 8 },
        G: { row: 2, col: 0 },
        C: { row: 1, col: 7 },
        F: { row: 8, col: 1 },
        O: { row: 6, col: 2 },
      },
    },
  ],
  solution: {
    A: { row: 4, col: 5 },
    B: { row: 3, col: 4 },
    C: { row: 1, col: 7 },
    D: { row: 7, col: 6 },
    E: { row: 0, col: 3 },
    F: { row: 8, col: 1 },
    G: { row: 2, col: 0 },
    H: { row: 5, col: 8 },
    O: { row: 6, col: 2 },
  },
};
