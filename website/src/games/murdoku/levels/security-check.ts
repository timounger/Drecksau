/**
 * Sicherheitskontrolle: a reception, a security check, a meeting room, an
 * anteroom and a corridor, with a murdered traveller.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/64. Sicherheitskontrolle.JPG`,
 * solution sheet `Lösungen 1-80/Lösung 61-64.JPG`).
 * Osbert is the victim; whoever was alone with him killed him.
 *
 * The reception reaches down the first column and along the bottom row to
 * the fifth column, the corridor runs along the top row, the last column and
 * the bottom right. The armchairs are the chairs; they and the light blue
 * rugs can be stood on. The tables (the L-shaped desk at the reception among
 * them), the TVs and the plant cannot. The patterned floor of the anteroom is
 * no rug. A field is beside a wall when one of its sides lies on a room
 * border or on the edge of the map.
 */
import {
  about,
  all,
  beside,
  counting,
  column,
  not,
  on,
  own,
  row,
  victim,
} from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** Whether a field has a wall on any side: a room border or the map's edge. */
function besideWall(c: Context, cell: Cell): boolean {
  const steps: readonly Cell[] = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
  ];
  return steps.some((step) => {
    const next = { row: cell.row + step.row, col: cell.col + step.col };
    return !c.inside(next) || c.areaOf(next) !== c.areaOf(cell);
  });
}

/** Whether nobody but the suspect stood on a thing of this id. */
function onlyOneOn(what: string): (c: Context) => boolean {
  return (c: Context): boolean =>
    c.people().every((id) => {
      const there = c.cellOf(id);
      return id === c.self || there === undefined || !c.is(there, what);
    });
}

/** Whether the suspect was alone in the area with one woman. */
function aloneWithAWoman(c: Context): boolean {
  const there = c.peopleIn(c.areaOf(c.cell) ?? "");
  return (
    there.length === 2 &&
    there.some((id) => id !== c.self && c.has(id, "woman"))
  );
}

/** Whether the suspect stood west of somebody, by id. */
function westOf(id: string): (c: Context) => boolean {
  return (c: Context): boolean => {
    const there = c.cellOf(id);
    return there !== undefined && c.cell.col < there.col;
  };
}

/** Whether every area held somebody. */
function noEmptyRoom(c: Context): boolean {
  return c.level.areas.every((area) => c.peopleIn(area.key).length > 0);
}

/** The case. */
export const SECURITY_CHECK: Level = {
  id: "security-check",
  name: "Sicherheitskontrolle",
  series: { book: "original", number: 64 },
  story:
    "Ein Metalldetektor ist machtlos gegen einen Plastik-Göffel. Und dieser Typ hier offenbar auch.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "E",
      name: "Empfang",
      at: "am Empfang",
      ground: "floor",
      tint: "#d3e2ee",
      label: { row: 3, col: 1 },
    },
    {
      key: "K",
      name: "Korridor",
      at: "im Korridor",
      ground: "floor",
      tint: "#f1efe8",
      label: { row: 8, col: 8 },
      labelEnd: true,
    },
    {
      key: "S",
      name: "Sicherheitskontrolle",
      at: "in der Sicherheitskontrolle",
      ground: "floor",
      tint: "#e6eef3",
      label: { row: 7, col: 1 },
    },
    {
      key: "B",
      name: "Besprechungsraum",
      at: "im Besprechungsraum",
      ground: "floor",
      tint: "#ecd8ea",
      label: { row: 4, col: 5 },
    },
    {
      key: "V",
      name: "Vorzimmer",
      at: "im Vorzimmer",
      ground: "floor",
      tint: "#e3cfe6",
      label: { row: 7, col: 6 },
    },
  ],
  areaMap: [
    "EEEKKKKKK",
    "EEESSBBBK",
    "EEESBBBBK",
    "EEESBBBBK",
    "ESSSSBBBK",
    "ESSSSVVVK",
    "ESSSSVVVK",
    "ESSSSKVVK",
    "EEEEEKKKK",
  ],
  thingMap: [
    "rv..crrr.",
    "rtc...c..",
    "rtt.cr..r",
    "r.p.rrtcr",
    "rvc..rc.r",
    "..t.tt.tr",
    ".vt.t...r",
    ".......t.",
    ".........",
  ],
  things: {
    c: "chair",
    p: "plant",
    r: "rug",
    t: "table",
    v: "tv",
  },
  pieces: [
    { at: { row: 0, col: 0 }, rows: 5, cols: 1 },
    { at: { row: 0, col: 5 }, rows: 1, cols: 3 },
    { at: { row: 2, col: 8 }, rows: 5, cols: 1 },
    { at: { row: 5, col: 2 }, rows: 2, cols: 1 },
    { at: { row: 5, col: 4 }, rows: 2, cols: 1 },
  ],
  shapes: [
    [
      { row: 1, col: 1 },
      { row: 2, col: 1 },
      { row: 2, col: 2 },
    ],
    [
      { row: 2, col: 5 },
      { row: 3, col: 5 },
      { row: 4, col: 5 },
      { row: 3, col: 4 },
    ],
  ],
  suspects: [
    {
      id: "A",
      name: "Ali",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person auf einem Teppich.",
        ...all(on("rug"), counting(onlyOneOn("rug"))),
      },
      colour: "#c2410c",
      face: "\u{1F474}",
    },
    {
      id: "B",
      name: "Brock",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person, die auf einem Stuhl saß.",
        ...all(on("chair"), counting(onlyOneOn("chair"))),
      },
      colour: "#15803d",
      face: "\u{1F468}",
    },
    {
      id: "C",
      name: "Clara",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Tisch.", ...beside("table") },
      colour: "#0e7490",
      face: "\u{1F475}",
    },
    {
      id: "D",
      name: "Dascha",
      pronoun: "sie",
      clue: { text: "Sie war in der obersten Zeile.", ...row(1) },
      colour: "#6366f1",
      face: "\u{1F469}\u{1F3FE}",
    },
    {
      id: "E",
      name: "Ernst",
      pronoun: "er",
      clue: {
        text: "Er war neben einem Stuhl. Er war allein mit einer Frau.",
        ...all(beside("chair"), counting(aloneWithAWoman)),
      },
      colour: "#7c3aed",
      face: "\u{1F474}",
    },
    {
      id: "F",
      name: "Fillip",
      pronoun: "er",
      clue: { text: "Er war in der zweiten Spalte.", ...column(2) },
      colour: "#9f1239",
      face: "\u{1F468}‍\u{1F9B2}",
    },
    {
      id: "G",
      name: "Gilbert",
      pronoun: "er",
      clue: {
        text: "Er war nicht neben einer Wand. Er war westlich von Ali.",
        ...all(
          own((c) => !besideWall(c, c.cell)),
          about(["A"], westOf("A")),
        ),
      },
      colour: "#ea580c",
      face: "\u{1F9D4}\u{1F3FE}",
    },
    {
      id: "H",
      name: "Heinrich",
      pronoun: "er",
      clue: {
        text: "Er war nicht neben einem Tisch oder Stuhl.",
        ...all(not(beside("table")), not(beside("chair"))),
      },
      colour: "#4338ca",
      face: "\u{1F468}",
    },
    {
      id: "O",
      name: "Osbert",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F471}‍♂️",
    },
  ],
  rules: [{ text: "Es gab keinen leeren Raum.", check: noEmptyRoom }],
  hints: [
    {
      text: "Ernst kann nur allein mit Clara sein, denn wo auch immer Dascha in Z1 platziert ist, blockiert sie alle Felder neben einem Stuhl in ihrem Raum. (Das bedeutet auch, dass Ernst nicht am Empfang oder im Korridor ist.)",
    },
    {
      text: "Alle Räume sind besetzt, also ist ein Verdächtiger im Vorzimmer. Das kann nur Gilbert oder Heinrich sein; so oder so ist jemand in Z7 S7.",
    },
    {
      text: "Da Clara laut Alis und Brocks Hinweisen nicht auf einem Teppich oder Stuhl ist, ist sie nicht im Besprechungsraum, also müssen Clara und Ernst in der Sicherheitskontrolle sein. Das lokalisiert Ernst.",
      place: { E: { row: 4, col: 3 } },
    },
    {
      text: "Alle verbleibenden Felder sind neben einer Wand außer zwei Teppichfeldern und Z7 S7, also ist Gilbert im Vorzimmer. Das platziert Ali in S9 (nicht S8, da Dascha in Z1 ist). Schließe alle anderen Teppiche aus.",
      place: { G: { row: 6, col: 6 } },
      cross: [
        { row: 0, col: 0 },
        { row: 1, col: 0 },
        { row: 2, col: 0 },
        { row: 3, col: 0 },
        { row: 0, col: 5 },
        { row: 0, col: 6 },
        { row: 0, col: 7 },
        { row: 2, col: 5 },
        { row: 3, col: 5 },
        { row: 3, col: 4 },
        { row: 4, col: 5 },
      ],
    },
    {
      text: "Dascha ist nicht auf einem Stuhl, also muss sie in Z1 S3 sein. Das, plus dass Fillip in S2 ist, lokalisiert Clara in Z8 S5.",
      place: { D: { row: 0, col: 2 }, C: { row: 7, col: 4 } },
    },
    {
      text: "Das lokalisiert Brock auf dem letzten Stuhl, was Fillip in Z9 S2 lokalisiert.",
      place: { B: { row: 3, col: 7 }, F: { row: 8, col: 1 } },
    },
    {
      text: "Das lokalisiert Heinrich, Ali und Osbert. Brock ist der Mörder!",
      place: {
        H: { row: 5, col: 0 },
        A: { row: 2, col: 8 },
        O: { row: 1, col: 5 },
      },
    },
  ],
  solution: {
    A: { row: 2, col: 8 },
    B: { row: 3, col: 7 },
    C: { row: 7, col: 4 },
    D: { row: 0, col: 2 },
    E: { row: 4, col: 3 },
    F: { row: 8, col: 1 },
    G: { row: 6, col: 6 },
    H: { row: 5, col: 0 },
    O: { row: 1, col: 5 },
  },
};
