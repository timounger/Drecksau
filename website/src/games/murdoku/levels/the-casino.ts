/**
 * Das Casino: the gaming hall, a lounge, the lobby, the security room and the
 * slot machines, with a murdered guest.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/45. Das Casino.png`, no
 * solution sheet - the solver proves the one solution, with the culprit
 * pencilled in on the photographed page).
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
      text: "Eloise war in R1. R1 C2 ist ein Stuhl, und nur Diana saß; R1 C5 liegt vor einem Fenster, und davor stand nur Hein. Eloise war also in R1 C4 oder R1 C6. Hein kann damit nicht in R1 sein: Er stand vor einem Fenster der Lobby, in R4 C9 oder R6 C9.",
    },
    {
      text: "Die Lounge darf nicht leer sein. In ihrer R1 stehen nur Stühle und eine Pflanze, und R1 gehört Eloise: Diana kann dort nicht sitzen, und Björn fände in R2 C8 niemanden an derselben Pflanze (R1 C8), denn daneben sind nur die Stühle in R1. Auch für Ozzy käme niemand in die Lounge mit. Also war Clara allein in der Lounge, in R2 oder R3 - in C7 oder C8, denn C9 gehört Hein.",
    },
    {
      text: "Abdul war in der Spielhalle südlich von Björn - Björn war also nicht in R7 bis R9. In R7 bis R9 müssen drei Personen sein; außer Francis, Ozzy und Diana kommt dafür niemand in Frage. Diana saß bei den Spielautomaten in R8, auf R8 C6 oder R8 C7 (C9 gehört Hein).",
    },
    {
      text: "Die Sicherheit darf nicht leer sein, und Ozzy war nicht allein: Francis war in der Sicherheit, neben einem Fernseher - R7 C1 oder R9 C2, denn R8 gehört Diana.",
    },
    {
      text: "In der Spielhalle waren Abdul, Björn, Eloise und Guido. Wer stand mit Björn an derselben Pflanze? An der Pflanze in R1 C1 ist nur der Stuhl frei. An der Pflanze in R5 C1 kämen nur R5 C2 und R6 C1 in Frage - dort könnte nur Abdul stehen, aber er war östlich von Eloise. An der Pflanze in R2 C6 müsste Eloise in R1 C6 stehen - dann bliebe Abdul nur C7, ebenso wie Diana. Also an der Pflanze in R4 C6, mit Abdul südlich von Björn: Abdul in R5 C6, Björn in R4 C5 oder R4 C7.",
      place: { A: { row: 4, col: 5 } },
    },
    {
      text: "C6 ist belegt: Diana saß in R8 C7. Eloise war westlich von Abdul, also in R1 C4. Björn bleibt ohne C7 nur R4 C5, und Hein ohne R4 nur R6 C9.",
      place: {
        D: { row: 7, col: 6 },
        E: { row: 0, col: 3 },
        B: { row: 3, col: 4 },
        H: { row: 5, col: 8 },
      },
    },
    {
      text: "Clara war in C8, C7 und C9 sind belegt. Guido war neben einem Tisch und einem Stuhl: nur R3 C1, R4 C3 und R5 C3 passen, R4 und R5 sind belegt - Guido war in R3 C1. Clara bleibt R2 C8.",
      place: { G: { row: 2, col: 0 }, C: { row: 1, col: 7 } },
    },
    {
      text: "C1 ist belegt: Francis war in R9 C2. Ozzy bleibt das letzte Feld, R7 C3 in der Sicherheit. Dort war er allein mit Francis - Francis ist der Mörder!",
      place: { F: { row: 8, col: 1 }, O: { row: 6, col: 2 } },
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
