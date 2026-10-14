/**
 * Das geheime Treffen: a hall round a meeting room, a dining room, a living
 * room, a lounge and a secret passage, with a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/72. Das geheime Treffen.JPG`,
 * solution sheet `Lösungen 1-80/Lösung 69-72.JPG`).
 * Osvald is the victim; whoever was alone with him killed him.
 *
 * The armchairs are the chairs; they and the pink rugs can be stood on. The
 * tables, the TVs (the record players with the note) and the plants cannot.
 * There are five windows: one in the north wall of the dining room and four
 * in the west wall of the hall; being in front of one means being on the
 * field right behind it.
 */
import {
  all,
  alone,
  beside,
  column,
  counting,
  inArea,
  not,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** The last column, as printed. */
const LAST_COLUMN = 9;

/** The fields right in front of a window. */
const WINDOWS: readonly Cell[] = [
  { row: 0, col: 4 },
  { row: 1, col: 0 },
  { row: 4, col: 0 },
  { row: 5, col: 0 },
  { row: 8, col: 0 },
];

/** Whether a field lies right in front of a window. */
function beforeWindow(cell: Cell): boolean {
  return WINDOWS.some((one) => one.row === cell.row && one.col === cell.col);
}

/** Whether nobody but the suspect stood on a rug. */
function onlyOneOnARug(c: Context): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return id === c.self || there === undefined || !c.is(there, "rug");
  });
}

/** Whether the suspect was alone with exactly two men. */
function aloneWithTwoMen(c: Context): boolean {
  const others = c
    .peopleIn(c.areaOf(c.cell) ?? "")
    .filter((id) => id !== c.self);
  return others.length === 2 && others.every((id) => c.has(id, "man"));
}

/** Whether no room held nobody. */
function noEmptyRoom(c: Context): boolean {
  return c.level.areas.every((area) => c.peopleIn(area.key).length > 0);
}

/** Whether exactly one person sat on a chair. */
function oneOnAChair(c: Context): boolean {
  return (
    c.people().filter((id) => {
      const there = c.cellOf(id);
      return there !== undefined && c.is(there, "chair");
    }).length === 1
  );
}

/** The case. */
export const THE_SECRET_MEETING: Level = {
  id: "the-secret-meeting",
  name: "Das geheime Treffen",
  series: { book: "original", number: 72 },
  story:
    "Wenn du nicht weißt, wer das Menschenopfer beim geheimen Treffen ist, dann bist du es.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "F",
      name: "Flur",
      at: "im Flur",
      ground: "floor",
      tint: "#d9bfdc",
      label: { row: 8, col: 1 },
    },
    {
      key: "E",
      name: "Esszimmer",
      at: "im Esszimmer",
      ground: "floor",
      tint: "#bfd9d6",
      label: { row: 2, col: 3 },
    },
    {
      key: "V",
      name: "Versammlungsraum",
      at: "im Versammlungsraum",
      ground: "floor",
      tint: "#c9bfd6",
      label: { row: 4, col: 5 },
    },
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#ddcfe8",
      label: { row: 7, col: 1 },
    },
    {
      key: "L",
      name: "Lounge",
      at: "in der Lounge",
      ground: "floor",
      tint: "#e6dcef",
      label: { row: 8, col: 3 },
    },
    {
      key: "G",
      name: "Geheimgang",
      at: "im Geheimgang",
      ground: "stone",
      tint: "#8f7f96",
      label: { row: 8, col: 6 },
    },
  ],
  areaMap: [
    "FFFEEEGGG",
    "FVVEEEVVG",
    "FVVEEEVVG",
    "FVVVVVVVG",
    "FVVVVVVVG",
    "FWWWWWWWG",
    "FWWWWWWWG",
    "FWWLLLWWG",
    "FFFLLLGGG",
  ],
  thingMap: [
    "..p......",
    ".pt..t.pt",
    "r.t.....t",
    "r.rcccr.r",
    "...ttt...",
    ".tv...t.t",
    "r......v.",
    "r...cp..r",
    "..prrr...",
  ],
  things: {
    c: "chair",
    p: "plant",
    r: "rug",
    t: "table",
    v: "tv",
  },
  pieces: [
    { at: { row: 1, col: 2 }, rows: 2, cols: 1 },
    { at: { row: 1, col: 8 }, rows: 2, cols: 1 },
    { at: { row: 2, col: 0 }, rows: 2, cols: 1 },
    { at: { row: 4, col: 3 }, rows: 1, cols: 3 },
    { at: { row: 6, col: 0 }, rows: 2, cols: 1 },
    { at: { row: 8, col: 3 }, rows: 1, cols: 3 },
  ],
  windows: [
    { at: { row: 0, col: 4 }, side: "top" },
    { at: { row: 1, col: 0 }, side: "left" },
    { at: { row: 4, col: 0 }, side: "left" },
    { at: { row: 5, col: 0 }, side: "left" },
    { at: { row: 8, col: 0 }, side: "left" },
  ],
  suspects: [
    {
      id: "A",
      name: "Arno",
      pronoun: "er",
      clue: {
        text: "Er war neben einem Tisch. Er saß nicht auf einem Stuhl.",
        ...all(beside("table"), not(on("chair"))),
      },
      colour: "#c2410c",
      face: "\u{1F977}",
    },
    {
      id: "B",
      name: "Bjarne",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person auf einem Teppich.",
        ...all(on("rug"), counting(onlyOneOnARug)),
      },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Claire",
      pronoun: "sie",
      clue: { text: "Sie war allein.", ...alone() },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Diana",
      pronoun: "sie",
      clue: {
        text: "Sie war vor einem Fenster.",
        ...own((c) => beforeWindow(c.cell)),
      },
      colour: "#4338ca",
      face: "\u{1F469}",
    },
    {
      id: "E",
      name: "Ella",
      pronoun: "sie",
      clue: {
        text: "Sie war in der Lounge. Sie saß nicht auf einem Stuhl.",
        ...all(inArea("L"), not(on("chair"))),
      },
      colour: "#6d28d9",
      face: "\u{1F469}",
    },
    {
      id: "F",
      name: "Farah",
      pronoun: "sie",
      clue: {
        text: "Sie war allein mit zwei Männern.",
        ...counting(aloneWithTwoMen),
      },
      colour: "#7f1d1d",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "G",
      name: "Glenn",
      pronoun: "er",
      clue: { text: "Er war neben einer Pflanze.", ...beside("plant") },
      colour: "#ea580c",
      face: "\u{1F9D4}",
    },
    {
      id: "H",
      name: "Heino",
      pronoun: "er",
      clue: { text: "Er war in der letzten Spalte.", ...column(LAST_COLUMN) },
      colour: "#1d4ed8",
      face: "\u{1F474}",
    },
    {
      id: "O",
      name: "Osvald",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#be123c",
      face: "\u{1F9D4}",
    },
  ],
  rules: [
    { text: "Es gab keinen leeren Raum.", check: noEmptyRoom },
    { text: "Genau eine Person saß auf einem Stuhl.", check: oneOnAChair },
  ],
  hints: [
    {
      text: "Ella ist nicht auf einem Stuhl oder (laut Bjarnes Hinweis) auf einem Teppich. Das lokalisiert sie in der Lounge.",
      place: { E: { row: 7, col: 3 } },
    },
    {
      text: "Jemand muss auf einem Stuhl in Z4 sein. Schließe den Rest von Z4 aus.",
      cross: [
        { row: 3, col: 0 },
        { row: 3, col: 1 },
        { row: 3, col: 2 },
        { row: 3, col: 6 },
        { row: 3, col: 7 },
        { row: 3, col: 8 },
      ],
    },
    {
      text: "Kein Raum ist leer, also muss jemand im Esszimmer sein. Diese Person und die Person auf einem Stuhl besetzen S5 und S6; schließe den Rest dieser Spalten aus.",
      cross: [
        { row: 5, col: 4 },
        { row: 6, col: 4 },
        { row: 7, col: 4 },
        { row: 8, col: 4 },
        { row: 5, col: 5 },
        { row: 6, col: 5 },
        { row: 8, col: 5 },
      ],
    },
    {
      text: "Farah ist in einem Raum mit zwei Männern. Keiner der Männer ist Osvald (er ist allein mit dem Mörder). Farah ist nicht im Geheimgang (niemand außer Heino in S9 könnte mit ihr dort sein), also ist sie im Versammlungsraum.",
    },
    {
      text: "Farah kann nur mit Arno und Glenn zusammen sein. Bjarne muss in S1 auf einem der letzten beiden Teppichfelder sein. Das lokalisiert Diana am Fenster in Z1, dann Farah auf dem letzten Stuhl.",
      place: { D: { row: 0, col: 4 }, F: { row: 3, col: 5 } },
    },
    {
      text: "Jemand ist im letzten leeren Feld in Z6; da das Wohnzimmer der einzige Raum ist, wo Claire allein sein kann, ist es Claire. Schließe den Rest des Wohnzimmers aus. Glenn und Arno müssen in den letzten leeren Feldern in Z2 und S3 sein. Schließe das letzte leere Feld im Versammlungsraum aus.",
      place: {
        C: { row: 5, col: 7 },
        G: { row: 1, col: 6 },
        A: { row: 4, col: 2 },
      },
    },
    {
      text: "Das lokalisiert Bjarne (einziges Feld in Z3), dann Heino (einziges Feld in Z7), dann Osvald. Bjarne ist der Mörder!",
      place: {
        B: { row: 2, col: 0 },
        H: { row: 6, col: 8 },
        O: { row: 8, col: 1 },
      },
    },
  ],
  solution: {
    A: { row: 4, col: 2 },
    B: { row: 2, col: 0 },
    C: { row: 5, col: 7 },
    D: { row: 0, col: 4 },
    E: { row: 7, col: 3 },
    F: { row: 3, col: 5 },
    G: { row: 1, col: 6 },
    H: { row: 6, col: 8 },
    O: { row: 8, col: 1 },
  },
};
