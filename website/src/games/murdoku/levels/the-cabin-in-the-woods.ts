/**
 * Die Hütte im Wald: a living room, a guest room, a bathroom, a kitchen and a
 * bedroom of a cabin, with the wood all round it and a murdered guest.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/49. Die Hütte im Wald.png`,
 * no solution sheet - the solver proves the one solution, with the culprit
 * pencilled in on the photographed page).
 * Oberon is the victim; whoever was alone with him killed him.
 *
 * The wood is the ring of fields round the cabin. The armchairs are the
 * chairs; they and the beds can be stood on. The trees, the tables, the
 * shelves, the TV and the plant cannot. The windows are the bars in the
 * cabin's outer walls; standing in front of one means being on a field right
 * beside it, inside the cabin or out in the wood. A room is empty when nobody
 * stands in it; the wood counts as one of the rooms.
 */
import {
  about,
  all,
  alone,
  beside,
  counting,
  inArea,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** The fields right in front of a window, on both sides of the wall. */
const WINDOWS: readonly Cell[] = [
  { row: 2, col: 0 },
  { row: 2, col: 1 },
  { row: 3, col: 0 },
  { row: 3, col: 1 },
  { row: 6, col: 0 },
  { row: 6, col: 1 },
  { row: 7, col: 5 },
  { row: 8, col: 5 },
];

/** The TV's field. */
const TV: Cell = { row: 0, col: 3 };

/** Whether a field lies right in front of a window. */
function byWindow(cell: Cell): boolean {
  return WINDOWS.some((one) => one.row === cell.row && one.col === cell.col);
}

/** How many people stand on a thing of this id or kind. */
function countOn(c: Context, what: string): number {
  return c.people().filter((id) => {
    const there = c.cellOf(id);
    return there !== undefined && c.is(there, what);
  }).length;
}

/** The case. */
export const THE_CABIN_IN_THE_WOODS: Level = {
  id: "the-cabin-in-the-woods",
  name: "Die Hütte im Wald",
  series: { book: "original", number: 49 },
  story: "Was für eine Tragödie. Hier draußen gibt es kein Handysignal.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "L",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#eef3c4",
      label: { row: 0, col: 1 },
    },
    {
      key: "G",
      name: "Gästezimmer",
      at: "im Gästezimmer",
      ground: "floor",
      tint: "#dfeedd",
      label: { row: 4, col: 6 },
    },
    {
      key: "B",
      name: "Badezimmer",
      at: "im Badezimmer",
      ground: "floor",
      tint: "#e2efc8",
      label: { row: 5, col: 1 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "floor",
      tint: "#f3efc0",
      label: { row: 7, col: 4 },
    },
    {
      key: "S",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "floor",
      tint: "#dfeedd",
      label: { row: 7, col: 6 },
    },
    {
      key: "W",
      name: "Wald",
      at: "im Wald",
      ground: "path",
      tint: "#f2c9a8",
      label: { row: 8, col: 7 },
    },
  ],
  areaMap: [
    "WLLLLLGGW",
    "WLLLLLGGW",
    "WLLLLLGGW",
    "WLLLLLGGW",
    "WLLLLLGGW",
    "WBBKKKSSW",
    "WBBKKKSSW",
    "WBBKKKSSW",
    "WWWWWWWWW",
  ],
  thingMap: [
    "t..vTTcct",
    "..c.ccbb.",
    ".sTsTs.T.",
    "..c.c....",
    "..p.s....",
    ".ccTT..c.",
    "......bb.",
    ".c.......",
    ".tTc.....",
  ],
  things: {
    T: "table",
    b: "bed",
    c: "chair",
    p: "plant",
    s: "shelf",
    t: "tree",
    v: "tv",
  },
  pieces: [
    { at: { row: 0, col: 4 }, rows: 1, cols: 2 },
    { at: { row: 1, col: 6 }, rows: 1, cols: 2 },
    { at: { row: 5, col: 3 }, rows: 1, cols: 2 },
    { at: { row: 6, col: 6 }, rows: 1, cols: 2 },
  ],
  windows: [
    { at: { row: 2, col: 1 }, side: "left" },
    { at: { row: 3, col: 1 }, side: "left" },
    { at: { row: 6, col: 1 }, side: "left" },
    { at: { row: 7, col: 5 }, side: "bottom" },
  ],
  suspects: [
    {
      id: "A",
      name: "Alexander",
      pronoun: "er",
      clue: { text: "Er war neben einem Tisch.", ...beside("table") },
      colour: "#b91c1c",
      face: "\u{1F9D4}",
    },
    {
      id: "B",
      name: "Bill",
      pronoun: "er",
      clue: { text: "Er war in der Küche.", ...inArea("K") },
      colour: "#15803d",
      face: "\u{1F468}",
    },
    {
      id: "C",
      name: "Conrad",
      pronoun: "er",
      clue: {
        text: "Er war neben einem Baum oder einer Pflanze.",
        ...own((c) => c.beside(c.cell, "tree") || c.beside(c.cell, "plant")),
      },
      colour: "#0e7490",
      face: "\u{1F468}‍\u{1F9B3}",
    },
    {
      id: "D",
      name: "Dalilah",
      pronoun: "sie",
      clue: { text: "Sie war allein.", ...alone() },
      colour: "#6366f1",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "E",
      name: "Eva",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person auf einem Bett.",
        ...all(
          on("bed"),
          counting((c) => countOn(c, "bed") === 1),
        ),
      },
      colour: "#7c3aed",
      face: "\u{1F469}",
    },
    {
      id: "F",
      name: "Flora",
      pronoun: "sie",
      clue: {
        text: "Sie war vor einem Fenster.",
        ...own((c) => byWindow(c.cell)),
        glow: () => WINDOWS,
      },
      colour: "#9f1239",
      face: "\u{1F469}",
    },
    {
      id: "G",
      name: "Gordon",
      pronoun: "er",
      clue: {
        text: "Er war im Wohnzimmer, in derselben Zeile oder Spalte wie der Fernseher.",
        ...all(
          inArea("L"),
          own((c) => c.cell.row === TV.row || c.cell.col === TV.col),
        ),
      },
      colour: "#ea580c",
      face: "\u{1F9D4}",
    },
    {
      id: "H",
      name: "Henrietta",
      pronoun: "sie",
      clue: {
        text: "Sie war neben einem Bett. Sie war nördlich von Eva.",
        ...all(
          beside("bed"),
          about(["E"], (c) => {
            const eva = c.cellOf("E");
            return eva !== undefined && c.cell.row < eva.row;
          }),
        ),
      },
      colour: "#4338ca",
      face: "\u{1F469}‍\u{1F9B3}",
    },
    {
      id: "O",
      name: "Oberon",
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
      text: "Genau eine Person saß auf einem Stuhl.",
      check: (c) => countOn(c, "chair") === 1,
    },
    {
      text: "Es gab keinen leeren Raum.",
      check: (c) =>
        c.level.areas.every((area) => c.peopleIn(area.key).length > 0),
    },
  ],
  hints: [
    {
      text: "Eva lag als Einzige auf einem Bett. Läge sie im Gästezimmer (R2), müsste Henrietta nördlich von ihr neben einem Bett sein - nur R1 C7 oder R1 C8. Dann wären C7 und C8 belegt, und im Schlafzimmer (nur C7 und C8) wäre niemand. Es gab aber keinen leeren Raum: Eva lag im Schlafzimmer, in R7. Blockiere den Rest von R7.",
      cross: [
        { row: 6, col: 0 },
        { row: 6, col: 1 },
        { row: 6, col: 2 },
        { row: 6, col: 3 },
        { row: 6, col: 4 },
        { row: 6, col: 5 },
        { row: 6, col: 8 },
      ],
    },
    {
      text: "Henrietta war neben einem Bett und nördlich von Eva: R1 C7, R1 C8, R3 C7, R6 C7 oder R6 C8. Stünde sie im Schlafzimmer, hätten Eva und sie C7 und C8, und das Gästezimmer bliebe leer. Henrietta war also im Gästezimmer - in R1 C7, R1 C8 oder R3 C7. C7 und C8 gehören Eva und Henrietta: Sie waren beide allein in ihren Zimmern.",
      cross: [
        { row: 3, col: 6 },
        { row: 3, col: 7 },
        { row: 4, col: 6 },
        { row: 4, col: 7 },
        { row: 5, col: 6 },
        { row: 5, col: 7 },
        { row: 7, col: 6 },
        { row: 7, col: 7 },
      ],
    },
    {
      text: "C1, C9 und R9 liegen ganz im Wald, also standen dort mindestens zwei Personen. Im Wohnzimmer war Gordon, in der Küche Bill, im Gästezimmer Henrietta, im Schlafzimmer Eva. Dalilah war allein - das geht nur im Badezimmer. Dort war sonst niemand.",
    },
    {
      text: "Wer kann in C1 und C9 stehen? Alexanders einziger Platz im Wald ist der Stuhl R9 C4 neben dem Tisch. In C9 bleiben nur Conrad (R2 C9, neben dem Baum) und Oberon. In C1 bleiben Conrad (R2 C1 oder R9 C1), Flora (vor den Fenstern R3 C1 oder R4 C1 - R7 gehört Eva) und Oberon. Also standen dort Conrad und Oberon, Conrad in R2 C9 und Flora, oder Flora und Oberon.",
    },
    {
      text: "Angenommen, Conrad stand in R2 C9 und Flora in C1. Dann war Oberon nicht im Wald - dort wäre er nicht allein mit einer Person. R9 bliebe nur Alexander auf dem Stuhl R9 C4, und er wäre der Einzige auf einem Stuhl. Henrietta käme nach R3 C7, Flora nach R4 C1, Dalilah nach R8 C3, Gordon nach R1 C2 und Bill nach R6 C6 - für Oberon bliebe nur R5 C5, ein Regal. Das geht nicht.",
    },
    {
      text: "Angenommen, Conrad und Oberon standen in C1 und C9. Dann waren sie die Einzigen im Wald, und Flora war in R4 C2 oder R8 C6. In R8 C6 müsste Bill nach R6 C6, Alexander säße auf einem Stuhl im Wohnzimmer, und Dalilah dürfte nicht sitzen - ihr einziger Platz ohne Stuhl, R8 C3, liegt aber in Floras Reihe. In R4 C2: Stünde Alexander in R6 C6, müsste Bill nach R8, und Dalilah bliebe keine Reihe. Also säße Alexander in R2, Conrad stünde in R9 C1, Henrietta in R3 C7, Dalilah in R8 C3, Bill in R6 C6 und Gordon in R5 C4 - für Oberon bliebe nur R1 C9, ein Baum. Das geht auch nicht.",
    },
    {
      text: "Also stand Flora in C1 (R3 C1 oder R4 C1) und Oberon in C9 - zu zweit im Wald, sonst war dort niemand. R9 muss trotzdem besetzt sein: Oberon stand in R9 C9. Blockiere den Rest von R9 und C9.",
      place: { O: { row: 8, col: 8 } },
      cross: [
        { row: 8, col: 0 },
        { row: 8, col: 2 },
        { row: 8, col: 3 },
        { row: 8, col: 4 },
        { row: 8, col: 5 },
        { row: 8, col: 6 },
        { row: 8, col: 7 },
        { row: 1, col: 8 },
        { row: 2, col: 8 },
        { row: 3, col: 8 },
        { row: 4, col: 8 },
        { row: 5, col: 8 },
        { row: 6, col: 8 },
        { row: 7, col: 8 },
      ],
    },
    {
      text: "Alexander war nicht im Wald. Neben einem Tisch hätte er sonst nur R6 C6 in der Küche - dann müsste Bill in R8, und Dalilah bliebe weder R6 noch R8. Alexander saß also im Wohnzimmer und als Einziger auf einem Stuhl. Damit war Henrietta in R3 C7, Flora in R4 C1, Dalilah in R8 C3 und Bill in R6 C6.",
      place: {
        H: { row: 2, col: 6 },
        F: { row: 3, col: 0 },
        D: { row: 7, col: 2 },
        B: { row: 5, col: 5 },
      },
    },
    {
      text: "Alexander bleibt nur der Stuhl R2 C5. Gordon war in R1 C2 oder R5 C4 - und R1 kann sonst niemand mehr füllen: Gordon in R1 C2. Conrad war neben der Pflanze in R5 C4, Eva auf dem Bett in R7 C8.",
      place: {
        A: { row: 1, col: 4 },
        G: { row: 0, col: 1 },
        C: { row: 4, col: 3 },
        E: { row: 6, col: 7 },
      },
    },
    {
      text: "Oberon war im Wald allein mit Flora - Flora ist die Mörderin!",
    },
  ],
  solution: {
    A: { row: 1, col: 4 },
    B: { row: 5, col: 5 },
    C: { row: 4, col: 3 },
    D: { row: 7, col: 2 },
    E: { row: 6, col: 7 },
    F: { row: 3, col: 0 },
    G: { row: 0, col: 1 },
    H: { row: 2, col: 6 },
    O: { row: 8, col: 8 },
  },
};
