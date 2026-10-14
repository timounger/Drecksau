/**
 * Visiting Aunt Ellen: a family get-together in Aunt Ellen's flat - a bedroom,
 * a bathroom, a guest room, a dining room, a living room and a kitchen - with
 * a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Besuch bei Tante Ellen/Besuch bei Tante Ellen.png`,
 * solution sheet `Das Murdoku-Orginal/Lösungen 1-80/Lösung 09-12.JPG`).
 * Oswin is the victim; whoever was alone with him killed him.
 *
 * The four windows sit in the left wall; standing in front of one means being
 * on the field right beside it. The beds and the armchairs - the chairs - can
 * be stood on; the tables, the shelves, the TV and the plant cannot. A field
 * is in a corner of its room when the room's border (or the map's edge) runs
 * along two of its sides that meet.
 */
import { all, alone, beside, inArea, on, own, victim } from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** Whether a field lies in a corner of its area. */
function inCorner(c: Context, cell: Cell): boolean {
  const area = c.areaOf(cell);
  const outside = (row: number, col: number): boolean =>
    c.areaOf({ row, col }) !== area;
  const vertical =
    outside(cell.row - 1, cell.col) || outside(cell.row + 1, cell.col);
  const horizontal =
    outside(cell.row, cell.col - 1) || outside(cell.row, cell.col + 1);
  return vertical && horizontal;
}

/** How many people stand on a bed. */
function onBeds(c: Context): number {
  return c.people().filter((id) => {
    const there = c.cellOf(id);
    return there !== undefined && c.is(there, "bed");
  }).length;
}

/** The case. */
export const VISITING_AUNT_ELLEN: Level = {
  id: "visiting-aunt-ellen",
  name: "Besuch bei Tante Ellen",
  series: { book: "original", number: 10 },
  story: "Bei Familientreffen kochen die Gemüter immer hoch.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "S",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "floor",
      tint: "#f1e6b8",
      label: { row: 3, col: 0 },
    },
    {
      key: "B",
      name: "Badezimmer",
      at: "im Badezimmer",
      ground: "stone",
      tint: "#eef1f4",
      label: { row: 3, col: 2 },
    },
    {
      key: "G",
      name: "Gästezimmer",
      at: "im Gästezimmer",
      ground: "floor",
      tint: "#f3e3e6",
      label: { row: 2, col: 5 },
    },
    {
      key: "E",
      name: "Esszimmer",
      at: "im Esszimmer",
      ground: "stone",
      tint: "#f2c3a8",
      label: { row: 5, col: 6 },
    },
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#e3d6bd",
      label: { row: 7, col: 1 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "floor",
      tint: "#ede6d6",
      label: { row: 7, col: 5 },
    },
  ],
  areaMap: [
    "SSSSGGGG",
    "SSBBGGGG",
    "SSBBGGGG",
    "SSBBEEEE",
    "WWWWEEEE",
    "WWWWEEEE",
    "WWWWEEKK",
    "WWWKKKKK",
  ],
  thingMap: [
    "bb.sbtb.",
    "w..tbtb.",
    "w......t",
    ".s.....t",
    ".c..ct..",
    "wt.vct..",
    "w....c.t",
    "ssp....s",
  ],
  things: {
    b: "bed",
    c: "chair",
    p: "plant",
    s: "shelf",
    t: "table",
    v: "tv",
    w: "window",
  },
  extraThings: {
    window: { name: "Fenster", emoji: "\u{1FA9F}", standable: true },
  },
  pieces: [
    { at: { row: 0, col: 0 }, rows: 1, cols: 2 },
    { at: { row: 0, col: 4 }, rows: 2, cols: 1 },
    { at: { row: 0, col: 5 }, rows: 2, cols: 1 },
    { at: { row: 0, col: 6 }, rows: 2, cols: 1 },
    { at: { row: 4, col: 5 }, rows: 2, cols: 1 },
  ],
  windows: [
    { at: { row: 1, col: 0 }, side: "left" },
    { at: { row: 2, col: 0 }, side: "left" },
    { at: { row: 5, col: 0 }, side: "left" },
    { at: { row: 6, col: 0 }, side: "left" },
  ],
  suspects: [
    {
      id: "A",
      name: "Albert",
      pronoun: "er",
      clue: { text: "Er war neben einem Regal.", ...beside("shelf") },
      colour: "#b91c1c",
      face: "\u{1F9D4}",
    },
    {
      id: "B",
      name: "Berti",
      pronoun: "er",
      clue: { text: "Er war neben einem Bett.", ...beside("bed") },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Carolina",
      pronoun: "sie",
      clue: { text: "Sie war neben der Pflanze.", ...beside("plant") },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Desiree",
      pronoun: "sie",
      clue: {
        text: "Sie war allein im Schlafzimmer.",
        ...all(inArea("S"), alone()),
      },
      colour: "#7c3aed",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "E",
      name: "Ellen",
      pronoun: "sie",
      clue: { text: "Sie saß auf einem Stuhl.", ...on("chair") },
      colour: "#be185d",
      face: "\u{1F475}",
    },
    {
      id: "F",
      name: "Farouk",
      pronoun: "er",
      clue: { text: "Er war vor einem Fenster.", ...on("window") },
      colour: "#334155",
      face: "\u{1F9D4}",
    },
    {
      id: "G",
      name: "Gustaf",
      pronoun: "er",
      clue: {
        text: "Er war in einer Ecke seines Raumes.",
        ...own((c) => inCorner(c, c.cell)),
      },
      colour: "#ea580c",
      face: "\u{1F468}",
    },
    {
      id: "O",
      name: "Oswin",
      pronoun: "er",
      clue: {
        text: "Er war im letzten verbleibenden Feld, allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F474}",
    },
  ],
  rules: [
    {
      text: "Genau eine Person war auf einem Bett.",
      check: (c) => onBeds(c) === 1,
    },
    {
      note: true,
      text: "Jetzt, wo die Fälle kniffliger werden, gibt es manchmal allgemeine Hinweise, die du zusammen mit den Hinweisen der Verdächtigen beachten musst. - Chief Williams",
    },
  ],
  hints: [
    {
      text: "Wir können Carolina neben der einzigen Pflanze lokalisieren.",
      place: { C: { row: 6, col: 2 } },
    },
    {
      text: "Desiree ist allein im Schlafzimmer, also gibt es nur ein Regal für Albert. Das lokalisiert Albert.",
      place: { A: { row: 7, col: 6 } },
    },
    {
      text: "Es gibt auch nur ein Fenster, vor dem Farouk sein kann. Das lokalisiert Farouk.",
      place: { F: { row: 5, col: 0 } },
    },
    { text: "Desiree muss in Spalte 2 sein." },
    {
      text: "Das lokalisiert Ellen auf dem letzten verfügbaren Stuhl.",
      place: { E: { row: 4, col: 4 } },
    },
    {
      text: "Jemand ist auf einem Bett. Spalten 5 und 7 sind besetzt, also muss Desiree in Zeile 1 sein.",
      place: { D: { row: 0, col: 1 } },
    },
    {
      text: "Das lokalisiert Gustaf in der letzten verfügbaren Ecke, in der Toilette (dem Badezimmer).",
      place: { G: { row: 3, col: 3 } },
    },
    {
      text: "Das lokalisiert Berti neben einem Bett, dann Oswin. Berti ist der Mörder!",
      place: { B: { row: 1, col: 7 }, O: { row: 2, col: 5 } },
    },
  ],
  solution: {
    A: { row: 7, col: 6 },
    B: { row: 1, col: 7 },
    C: { row: 6, col: 2 },
    D: { row: 0, col: 1 },
    E: { row: 4, col: 4 },
    F: { row: 5, col: 0 },
    G: { row: 3, col: 3 },
    O: { row: 2, col: 5 },
  },
};
