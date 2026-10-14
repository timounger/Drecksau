/**
 * Die Hütte im Wald: a living room, a guest room, a bathroom, a kitchen and a
 * bedroom of a cabin, with the wood all round it and a murdered guest.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/49. Die Hütte im Wald.png`,
 * solution sheet `Lösungen 1-80/Lösung 49-52.JPG`).
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
      text: "Henrietta und Eva sind in S7 und S8 in irgendeiner Konfiguration; da kein Raum leer ist, müssen sie in verschiedenen Räumen sein. Henrietta ist nördlich von Eva, also ist Henrietta im Gästezimmer, Eva im Schlafzimmer.",
    },
    {
      text: "Bill ist in der Küche, Gordon im Wohnzimmer, und mindestens zwei Personen sind im Wald (in S1 und S9), also kann Dalilah nur allein im Badezimmer sein.",
    },
    {
      text: "Dalilah, Bill und Eva besetzen Z6/Z7/Z8.",
    },
    {
      text: "Alle verbleibenden Felder neben einem Tisch enthalten einen Stuhl, also sitzt Alexander auf einem Stuhl und niemand sonst. Das lokalisiert Henrietta, dann Eva, dann Dalilah, dann Bill.",
      place: {
        H: { row: 2, col: 6 },
        E: { row: 6, col: 7 },
        D: { row: 7, col: 2 },
        B: { row: 5, col: 5 },
      },
    },
    {
      text: "Z1 S2 ist das letzte Feld in Z1, also muss es besetzt sein (entweder von Gordon oder Oberon). Das lokalisiert Flora. Alexander kann jetzt in Z2 S5 oder Z9 S4 sein; wir können die beiden sich überschneidenden Felder ausschließen. Das lässt nur ein verfügbares Feld in S5: den Stuhl, den Alexander besetzen muss.",
      place: { F: { row: 3, col: 0 }, A: { row: 1, col: 4 } },
    },
    {
      text: "Conrad kann nur in Z5 S4 sein. Das lokalisiert Gordon in Z1 S2, dann Oberon in der unteren rechten Ecke. Flora ist die Mörderin!",
      place: {
        C: { row: 4, col: 3 },
        G: { row: 0, col: 1 },
        O: { row: 8, col: 8 },
      },
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
