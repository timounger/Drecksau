/**
 * Das Krankenhaus: three patient rooms, a toilet and the reception, with a
 * murdered patient.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/62. Das Krankenhaus.JPG`,
 * solution sheet `Lösungen 1-80/Lösung 61-64.JPG`).
 * Osmund is the victim; whoever was alone with him killed him.
 *
 * The armchairs are the chairs; they, the beds and the light rugs can be
 * stood on. The tables (the reception counter among them), the TVs and the
 * plants cannot. There are five beds, each over two fields.
 */
import {
  about,
  all,
  alone,
  beside,
  column,
  inArea,
  not,
  on,
  victim,
} from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** The five beds, each as its fields. */
const BEDS: readonly (readonly Cell[])[] = [
  [
    { row: 1, col: 1 },
    { row: 1, col: 2 },
  ],
  [
    { row: 3, col: 1 },
    { row: 3, col: 2 },
  ],
  [
    { row: 0, col: 5 },
    { row: 1, col: 5 },
  ],
  [
    { row: 0, col: 7 },
    { row: 1, col: 7 },
  ],
  [
    { row: 5, col: 8 },
    { row: 6, col: 8 },
  ],
];

/** Whether all beds but one had somebody on them. */
function allBedsButOne(c: Context): boolean {
  const empty = BEDS.filter((bed) =>
    bed.every((cell) => c.personAt(cell) === null),
  );
  return empty.length === 1;
}

/** Whether the suspect stood south of somebody, by id. */
function southOf(id: string): (c: Context) => boolean {
  return (c: Context): boolean => {
    const there = c.cellOf(id);
    return there !== undefined && c.cell.row > there.row;
  };
}

/** The case. */
export const THE_HOSPITAL: Level = {
  id: "the-hospital",
  name: "Das Krankenhaus",
  series: { book: "original", number: 62 },
  story: "Dieser Mord wurde mit klinischer Präzision begangen.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "1",
      name: "Zimmer 1",
      at: "in Zimmer 1",
      ground: "floor",
      tint: "#d4d4d4",
      label: { row: 4, col: 2 },
    },
    {
      key: "2",
      name: "Zimmer 2",
      at: "in Zimmer 2",
      ground: "floor",
      tint: "#cfd2f0",
      label: { row: 2, col: 5 },
    },
    {
      key: "T",
      name: "Toilette",
      at: "in der Toilette",
      ground: "floor",
      tint: "#d6e4dc",
      label: { row: 8, col: 1 },
    },
    {
      key: "E",
      name: "Empfang",
      at: "am Empfang",
      ground: "floor",
      tint: "#d8ecf2",
      label: { row: 8, col: 4 },
    },
    {
      key: "3",
      name: "Zimmer 3",
      at: "in Zimmer 3",
      ground: "floor",
      tint: "#d9d2ee",
      label: { row: 8, col: 8 },
      labelEnd: true,
    },
  ],
  areaMap: [
    "111122222",
    "111122222",
    "111122222",
    "1111EEE22",
    "1111EEE33",
    "TTEEEEE33",
    "TTEEEEE33",
    "TTTEEEE33",
    "TTTEEEE33",
  ],
  thingMap: [
    "ttv.tbtbp",
    "cbbr.bcb.",
    "...r...rv",
    ".bbrrrrrr",
    "pt.....v.",
    ".t..pct.b",
    "c..rttt.b",
    "t..rrr..t",
    "c......p.",
  ],
  things: {
    b: "bed",
    c: "chair",
    p: "plant",
    r: "rug",
    t: "table",
    v: "tv",
  },
  pieces: [
    { at: { row: 0, col: 0 }, rows: 1, cols: 2 },
    { at: { row: 1, col: 1 }, rows: 1, cols: 2 },
    { at: { row: 3, col: 1 }, rows: 1, cols: 2 },
    { at: { row: 1, col: 3 }, rows: 3, cols: 1 },
    { at: { row: 0, col: 5 }, rows: 2, cols: 1 },
    { at: { row: 0, col: 7 }, rows: 2, cols: 1 },
    { at: { row: 3, col: 4 }, rows: 1, cols: 3 },
    { at: { row: 5, col: 8 }, rows: 2, cols: 1 },
  ],
  shapes: [
    [
      { row: 2, col: 7 },
      { row: 3, col: 7 },
      { row: 3, col: 8 },
    ],
    [
      { row: 5, col: 6 },
      { row: 6, col: 6 },
      { row: 6, col: 5 },
      { row: 6, col: 4 },
    ],
    [
      { row: 6, col: 3 },
      { row: 7, col: 3 },
      { row: 7, col: 4 },
      { row: 7, col: 5 },
    ],
  ],
  suspects: [
    {
      id: "A",
      name: "Albrecht",
      pronoun: "er",
      clue: { text: "Er war neben einem Fernseher.", ...beside("tv") },
      colour: "#c2410c",
      face: "\u{1F468}\u{1F3FF}",
    },
    {
      id: "B",
      name: "Brianna",
      pronoun: "sie",
      clue: { text: "Sie saß auf einem Stuhl.", ...on("chair") },
      colour: "#15803d",
      face: "\u{1F475}",
    },
    {
      id: "C",
      name: "Clarence",
      pronoun: "er",
      clue: {
        text: "Er war südlich von Brianna.",
        ...about(["B"], southOf("B")),
      },
      colour: "#0e7490",
      face: "\u{1F468}",
    },
    {
      id: "D",
      name: "David",
      pronoun: "er",
      clue: {
        text: "Er war allein in der Toilette.",
        ...all(inArea("T"), alone()),
      },
      colour: "#6366f1",
      face: "\u{1F468}\u{1F3FD}‍\u{1F9B2}",
    },
    {
      id: "E",
      name: "Ezra",
      pronoun: "er",
      clue: { text: "Er war in Zimmer 1.", ...inArea("1") },
      colour: "#7c3aed",
      face: "\u{1F468}‍⚕️",
    },
    {
      id: "F",
      name: "Faith",
      pronoun: "sie",
      clue: { text: "Sie war in der zweiten Spalte.", ...column(2) },
      colour: "#9f1239",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "G",
      name: "Gloria",
      pronoun: "sie",
      clue: { text: "Sie war auf einem Teppich.", ...on("rug") },
      colour: "#ea580c",
      face: "\u{1F469}\u{1F3FE}",
    },
    {
      id: "H",
      name: "Hiltrud",
      pronoun: "sie",
      clue: {
        text: "Sie war in Zimmer 1, 2 oder 3. Sie war nicht auf einem Bett.",
        ...all(inArea("1", "2", "3"), not(on("bed"))),
      },
      colour: "#4338ca",
      face: "\u{1F469}",
    },
    {
      id: "O",
      name: "Osmund",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F9D4}",
    },
  ],
  rules: [
    { text: "Alle Betten bis auf eines waren besetzt.", check: allBedsButOne },
  ],
  hints: [
    {
      text: "Es ist unmöglich, dass alle drei Betten in Z1/Z2 besetzt sind, also ist eines davon das leere Bett. Die Betten in Z4 und S9 müssen dann besetzt sein. Schließe den Rest von Z4 und S9 aus. Schließe auch alle Nicht-Bett-Felder in Z1 und Z2 aus.",
      cross: [
        { row: 3, col: 0 },
        { row: 3, col: 3 },
        { row: 3, col: 4 },
        { row: 3, col: 5 },
        { row: 3, col: 6 },
        { row: 3, col: 7 },
        { row: 3, col: 8 },
        { row: 1, col: 8 },
        { row: 4, col: 8 },
        { row: 8, col: 8 },
        { row: 0, col: 3 },
        { row: 1, col: 0 },
        { row: 1, col: 3 },
        { row: 1, col: 4 },
        { row: 1, col: 6 },
      ],
    },
    {
      text: "Da David allein in der Toilette ist, gibt es nur einen verfügbaren Stuhl für Brianna. Das lokalisiert sie am Empfang und lokalisiert jemanden bei Z7 S9 auf dem Bett.",
      place: { B: { row: 5, col: 5 } },
    },
    {
      text: "Das lokalisiert Albrecht auf dem Bett in Z2 S3, und jemand ist auf jedem verbleibenden Bettfeld (Z1 S8 und Z4 S2). Das lokalisiert Faith auf dem Bett in S2 und lokalisiert David in der Toilette.",
      place: {
        A: { row: 1, col: 2 },
        F: { row: 3, col: 1 },
        D: { row: 8, col: 0 },
      },
    },
    {
      text: "Ezra ist irgendwo in S4 in Zimmer 1. Das lokalisiert Gloria auf dem Empfangsteppich, was Clarence auf dem Bett in Zimmer 3 lokalisiert.",
      place: { G: { row: 7, col: 4 }, C: { row: 6, col: 8 } },
    },
    {
      text: "Das lokalisiert Hiltrud in Zimmer 2, was Ezra in Zimmer 1 und Osmund auf dem verbleibenden Bett lokalisiert. Hiltrud ist die Mörderin!",
      place: {
        H: { row: 2, col: 6 },
        E: { row: 4, col: 3 },
        O: { row: 0, col: 7 },
      },
    },
  ],
  solution: {
    A: { row: 1, col: 2 },
    B: { row: 5, col: 5 },
    C: { row: 6, col: 8 },
    D: { row: 8, col: 0 },
    E: { row: 4, col: 3 },
    F: { row: 3, col: 1 },
    G: { row: 7, col: 4 },
    H: { row: 2, col: 6 },
    O: { row: 0, col: 7 },
  },
};
