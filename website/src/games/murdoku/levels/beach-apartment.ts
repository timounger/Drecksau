/**
 * Strandwohnung: a flat by the sea with a kitchen, a bedroom, a bathroom, a
 * dining room and a living room, the beach before it, and a murdered guest.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/61. Strandwohnung.JPG`,
 * solution sheet `Lösungen 1-80/Lösung 61-64.JPG`).
 * Orlaith is the victim; whoever was alone with her killed her.
 *
 * The armchairs are the chairs; they, the bed and the beach towels (which
 * the page says can be stood on) can be. The tables (the L-shaped kitchen
 * counter and the bedside table among them), the TVs and the plants cannot.
 * The windows between the flat and the beach are only drawn.
 */
import {
  about,
  all,
  alone,
  beside,
  column,
  counting,
  inArea,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** How many columns Danielle stood west of Gordon. */
const DANIELLES_LEAD = 3;

/** Whether a woman other than the suspect, alone in her area, stood exactly one row north. */
function lonelyWomanOneRowNorth(c: Context): boolean {
  return c.people().some((id) => {
    const there = c.cellOf(id);
    return (
      id !== c.self &&
      there !== undefined &&
      there.row === c.cell.row - 1 &&
      c.has(id, "woman") &&
      c.peopleIn(c.areaOf(there) ?? "").length === 1
    );
  });
}

/** Whether a field's row holds a TV in the field's own area. */
function tvInRowAndRoom(c: Context, cell: Cell): boolean {
  return c
    .cellsOf(c.areaOf(cell) ?? "")
    .some((one) => one.row === cell.row && c.is(one, "tv"));
}

/** Whether a woman in the suspect's area stood in the same row as a TV. */
function womanInTvRow(c: Context): boolean {
  return c.peopleIn(c.areaOf(c.cell) ?? "").some((id) => {
    const there = c.cellOf(id);
    return (
      id !== c.self &&
      there !== undefined &&
      c.has(id, "woman") &&
      tvInRowAndRoom(c, there)
    );
  });
}

/** Whether the suspect stood exactly three columns west of Gordon. */
function threeColumnsWestOfGordon(c: Context): boolean {
  const gordon = c.cellOf("G");
  return gordon !== undefined && gordon.col === c.cell.col + DANIELLES_LEAD;
}

/** Whether nobody but the suspect stood beside a table. */
function onlyOneBesideATable(c: Context): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return id === c.self || there === undefined || !c.beside(there, "table");
  });
}

/** Whether a woman stood on a towel. */
function womanOnATowel(c: Context): boolean {
  return c.people().some((id) => {
    const there = c.cellOf(id);
    return there !== undefined && c.has(id, "woman") && c.is(there, "towel");
  });
}

/** Whether exactly one person sat on a chair. */
function oneOnAChair(c: Context): boolean {
  return seatedCount(c) === 1;
}

/** For the solver: whether at most one person sits so far. */
function notTooManySeated(c: Context): boolean {
  return seatedCount(c) <= 1;
}

/** How many of the placed people sat on chairs. */
function seatedCount(c: Context): number {
  return c.people().filter((id) => {
    const there = c.cellOf(id);
    return there !== undefined && c.is(there, "chair");
  }).length;
}

/** The case. */
export const BEACH_APARTMENT: Level = {
  id: "beach-apartment",
  name: "Strandwohnung",
  series: { book: "original", number: 61 },
  story: "Hier ist einiges in den Sand gesetzt worden.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "floor",
      tint: "#e4dcea",
      label: { row: 2, col: 1 },
    },
    {
      key: "S",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "floor",
      tint: "#ecebe6",
      label: { row: 2, col: 4 },
    },
    {
      key: "B",
      name: "Badezimmer",
      at: "im Badezimmer",
      ground: "floor",
      tint: "#f4e6c4",
      label: { row: 2, col: 7 },
      labelOverhang: true,
    },
    {
      key: "E",
      name: "Esszimmer",
      at: "im Esszimmer",
      ground: "floor",
      tint: "#e8e8ec",
      label: { row: 5, col: 0 },
    },
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#ececec",
      label: { row: 5, col: 7 },
    },
    {
      key: "T",
      name: "Strand",
      at: "am Strand",
      ground: "sand",
      label: { row: 8, col: 5 },
    },
  ],
  areaMap: [
    "KKKKSSSBB",
    "KKKKSSSBB",
    "KKKKSSSBB",
    "EEEEWWWWW",
    "EEEEWWWWW",
    "EEEEWWWWW",
    "TTTTTTTTT",
    "TTTTTTTTT",
    "TTTTTTTTT",
  ],
  thingMap: [
    "tttttb...",
    "t....bp.c",
    "t..pv....",
    ".....c...",
    "cttc.cc.v",
    "p.c...p..",
    ".......h.",
    "..cchc.h.",
    ".hhth....",
  ],
  things: {
    b: "bed",
    c: "chair",
    h: "towel",
    p: "plant",
    t: "table",
    v: "tv",
  },
  extraThings: {
    towel: { name: "Handtuch", emoji: "\u{1F7EA}", standable: true },
  },
  pieces: [
    { at: { row: 0, col: 5 }, rows: 2, cols: 1 },
    { at: { row: 4, col: 1 }, rows: 1, cols: 2 },
    { at: { row: 6, col: 7 }, rows: 2, cols: 1 },
    { at: { row: 7, col: 4 }, rows: 2, cols: 1 },
    { at: { row: 8, col: 1 }, rows: 1, cols: 2 },
  ],
  shapes: [
    [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 0, col: 3 },
      { row: 1, col: 0 },
      { row: 2, col: 0 },
    ],
  ],
  windows: [
    { at: { row: 5, col: 1 }, side: "bottom" },
    { at: { row: 5, col: 2 }, side: "bottom" },
    { at: { row: 5, col: 5 }, side: "bottom" },
    { at: { row: 5, col: 6 }, side: "bottom" },
    { at: { row: 5, col: 7 }, side: "bottom" },
  ],
  suspects: [
    {
      id: "A",
      name: "Amy",
      pronoun: "sie",
      clue: {
        text: "Eine Zeile nördlich von ihr war eine Frau, die allein in einem Raum war.",
        ...counting(lonelyWomanOneRowNorth),
      },
      colour: "#b91c1c",
      face: "\u{1F469}‍\u{1F9B3}",
    },
    {
      id: "B",
      name: "Brad",
      pronoun: "er",
      clue: {
        text: "Er war allein in der Küche.",
        ...all(inArea("K"), alone()),
      },
      colour: "#15803d",
      face: "\u{1F468}",
    },
    {
      id: "C",
      name: "Cem",
      pronoun: "er",
      clue: {
        text: "In seinem Raum war eine Frau in derselben Zeile wie ein Fernseher.",
        ...counting(womanInTvRow),
      },
      colour: "#0e7490",
      face: "\u{1F468}‍\u{1F9B3}",
    },
    {
      id: "D",
      name: "Danielle",
      pronoun: "sie",
      clue: {
        text: "Sie war drei Spalten westlich von Gordon.",
        ...about(["G"], threeColumnsWestOfGordon),
      },
      colour: "#4338ca",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "E",
      name: "Edith",
      pronoun: "sie",
      clue: {
        text: "Sie saß entweder auf einem Stuhl oder auf dem Bett.",
        ...own((c) => c.is(c.cell, "chair") || c.is(c.cell, "bed")),
      },
      colour: "#7c3aed",
      face: "\u{1F469}",
    },
    {
      id: "F",
      name: "Fannie",
      pronoun: "sie",
      clue: { text: "Sie war in der zweiten Spalte.", ...column(2) },
      colour: "#9f1239",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "G",
      name: "Gordon",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person neben einem Tisch.",
        ...all(beside("table"), counting(onlyOneBesideATable)),
      },
      colour: "#ea580c",
      face: "\u{1F468}\u{1F3FF}",
    },
    {
      id: "H",
      name: "Helmut",
      pronoun: "er",
      clue: {
        text: "Er und eine Frau waren jeweils auf einem Handtuch.",
        ...all(on("towel"), counting(womanOnATowel)),
      },
      colour: "#6d28d9",
      face: "\u{1F468}",
    },
    {
      id: "O",
      name: "Orlaith",
      pronoun: "sie",
      clue: {
        text: "Das Opfer. Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#be123c",
      face: "\u{1F469}",
    },
  ],
  rules: [
    {
      text: "Genau eine Person saß auf einem Stuhl.",
      check: oneOnAChair,
      prune: notTooManySeated,
    },
  ],
  hints: [
    {
      text: "Brad, allein in der Küche, ist laut Gordons Hinweis nicht neben einem Tisch, also muss er in R3 C3 sein.",
      place: { B: { row: 2, col: 2 } },
    },
    {
      text: "Cem muss dann im Wohnzimmer mit einer Frau in R5 sein. Schließe die Stühle im Esszimmer in R5 aus.",
    },
    {
      text: "Gordon ist neben einem Tisch und Danielle ist drei Spalten westlich. Da Fannie in C2 ist und Brad in C3, kann Gordon nicht in C5 oder C6 sein, also muss er in R8 C4 sein, und Danielle ist in C1.",
      place: { G: { row: 7, col: 3 } },
    },
    {
      text: "Laut dem allgemeinen Hinweis schließe die anderen Stühle aus. Das setzt Edith auf das Bett.",
    },
    {
      text: "Helmut und eine Frau sind auf den Handtüchern in R7 und R9. Einer von ihnen muss in R7 C8 sein.",
    },
    {
      text: "In R5 befindet sich die Frau, die Cems Raum teilt, also ist R5 C5 besetzt. Das lokalisiert das andere Handtuchfeld in R9, das von Fannie besetzt sein muss, was Helmut lokalisiert. Danielle wurde auch in R4 C1 lokalisiert, was Cem lokalisiert.",
      place: {
        F: { row: 8, col: 1 },
        H: { row: 6, col: 7 },
        D: { row: 3, col: 0 },
        C: { row: 5, col: 8 },
      },
    },
    {
      text: "Amy muss die Frau im Wohnzimmer sein. Das lokalisiert Edith und Orlaith. Edith ist die Mörderin!",
      place: {
        A: { row: 4, col: 4 },
        E: { row: 1, col: 5 },
        O: { row: 0, col: 6 },
      },
    },
  ],
  solution: {
    A: { row: 4, col: 4 },
    B: { row: 2, col: 2 },
    C: { row: 5, col: 8 },
    D: { row: 3, col: 0 },
    E: { row: 1, col: 5 },
    F: { row: 8, col: 1 },
    G: { row: 7, col: 3 },
    H: { row: 6, col: 7 },
    O: { row: 0, col: 6 },
  },
};
