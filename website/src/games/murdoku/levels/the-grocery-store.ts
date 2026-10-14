/**
 * The Grocery Store: the fridges, the meat counter, the snacks, the bakery,
 * the fruit and vegetables and the checkout, with a murdered shopper.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Der Lebensmittelladen/Der Lebensmittelladen.png`,
 * solution on `Das Murdoku-Orginal/Lösungen 1-80/Lösung 29-32.JPG`).
 * Opal is the victim; whoever was alone with her killed her.
 *
 * The blue rugs and the two armchairs at the checkout can be stood on; the
 * counters and tables with the goods on them and the fridge shelves cannot. A
 * field is "in a corner" of its room when walls - an area border or the edge
 * of the map - run along two adjacent sides of it.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import { all, counting, inArea, on, own, row, victim } from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** The people standing in the suspect's own area, the suspect left out. */
function othersInRoom(c: Context): readonly string[] {
  return c.peopleIn(c.areaOf(c.cell) ?? "").filter((id) => id !== c.self);
}

/** The case. */
export const THE_GROCERY_STORE: Level = {
  id: "the-grocery-store",
  name: "Der Lebensmittelladen",
  series: { book: "original", number: 29 },
  story: "Sie hatte keine Ahnung, dass ihr Verfallsdatum erreicht war.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "R",
      name: "Kühlregale",
      at: "bei den Kühlregalen",
      ground: "stone",
      tint: "#d4e6f0",
      label: { row: 5, col: 0 },
    },
    {
      key: "F",
      name: "Fleisch",
      at: "in der Fleisch-Abteilung",
      ground: "floor",
      tint: "#f6e2dc",
      label: { row: 5, col: 2 },
    },
    {
      key: "S",
      name: "Snacks",
      at: "in der Snacks-Abteilung",
      ground: "floor",
      tint: "#f4d6c8",
      label: { row: 5, col: 4 },
    },
    {
      key: "B",
      name: "Bäckerei",
      at: "in der Bäckerei",
      ground: "stone",
      tint: "#eef2f2",
      label: { row: 3, col: 7 },
    },
    {
      key: "G",
      name: "Obst & Gemüse",
      at: "bei Obst & Gemüse",
      ground: "stone",
      tint: "#dcefe2",
      label: { row: 8, col: 6 },
    },
    {
      key: "K",
      name: "Kasse",
      at: "an der Kasse",
      ground: "floor",
      tint: "#f6dcc0",
      label: { row: 8, col: 2 },
    },
  ],
  areaMap: [
    "RRFFSSBBB",
    "RRFFSSBBB",
    "RRFFSSBBB",
    "RRFFSSBBB",
    "RRFFSSGGG",
    "RRFFSSGGG",
    "KKKKKKGGG",
    "KKKKKKGGG",
    "KKKKKKGGG",
  ],
  thingMap: [
    "ttttr....",
    "..r.r..tt",
    "s.rtrt...",
    "s.rt.ttt.",
    "sr...ttr.",
    "srt..ttr.",
    "..rr..tr.",
    "tt..t..rt",
    "ctrrtc..t",
  ],
  things: { c: "chair", r: "rug", s: "shelf", t: "table" },
  shapes: [
    [
      { row: 7, col: 0 },
      { row: 7, col: 1 },
      { row: 8, col: 1 },
    ],
  ],
  pieces: [
    { at: { row: 0, col: 0 }, rows: 1, cols: 2 },
    { at: { row: 0, col: 2 }, rows: 1, cols: 2 },
    { at: { row: 0, col: 4 }, rows: 3, cols: 1 },
    { at: { row: 1, col: 2 }, rows: 3, cols: 1 },
    { at: { row: 1, col: 7 }, rows: 1, cols: 2 },
    { at: { row: 2, col: 3 }, rows: 2, cols: 1 },
    { at: { row: 2, col: 5 }, rows: 4, cols: 1 },
    { at: { row: 3, col: 6 }, rows: 1, cols: 2 },
    { at: { row: 4, col: 1 }, rows: 2, cols: 1 },
    { at: { row: 4, col: 6 }, rows: 3, cols: 1 },
    { at: { row: 4, col: 7 }, rows: 4, cols: 1 },
    { at: { row: 6, col: 2 }, rows: 1, cols: 2 },
    { at: { row: 7, col: 4 }, rows: 2, cols: 1 },
    { at: { row: 7, col: 8 }, rows: 2, cols: 1 },
    { at: { row: 8, col: 2 }, rows: 1, cols: 2 },
  ],
  suspects: [
    {
      id: "A",
      name: "Alysha",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person auf einem Teppich.",
        ...all(
          on("rug"),
          counting(
            (c) =>
              c.people().filter((id) => {
                const at = c.cellOf(id);
                return at !== undefined && c.is(at, "rug");
              }).length === 1,
          ),
        ),
      },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Beckie",
      pronoun: "sie",
      clue: {
        text: "Sie war in einer Ecke ihres Raumes.",
        ...own((c) => isCorner(c, c.cell)),
      },
      colour: "#15803d",
      face: "\u{1F469}",
    },
    {
      id: "C",
      name: "Carsten",
      pronoun: "er",
      clue: {
        text: "In seinem Raum war jemand anderes, der nicht neben einem Tisch oder einem Regal war.",
        ...counting((c) =>
          othersInRoom(c).some((id) => {
            const at = c.cellOf(id);
            return (
              at !== undefined &&
              !c.beside(at, "table") &&
              !c.beside(at, "shelf")
            );
          }),
        ),
      },
      colour: "#0e7490",
      face: "\u{1F9D4}",
    },
    {
      id: "D",
      name: "Dominic",
      pronoun: "er",
      clue: { text: "Er war in der fünften Zeile.", ...row(5) },
      colour: "#6366f1",
      face: "\u{1F468}",
    },
    {
      id: "E",
      name: "Emil",
      pronoun: "er",
      clue: { text: "Er war in der Fleisch-Abteilung.", ...inArea("F") },
      colour: "#7c3aed",
      face: "\u{1F9D4}",
    },
    {
      id: "F",
      name: "Fatima",
      pronoun: "sie",
      clue: { text: "Sie saß auf einem Stuhl.", ...on("chair") },
      colour: "#9f1239",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "G",
      name: "Gale",
      pronoun: "er",
      clue: {
        text: "In seinem Raum waren ein weiterer Mann und eine Frau.",
        ...counting((c) => {
          const others = othersInRoom(c);
          return (
            others.length === 2 &&
            others.filter((id) => c.has(id, "man")).length === 1
          );
        }),
      },
      colour: "#ea580c",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "H",
      name: "Hakim",
      pronoun: "er",
      clue: {
        text: "Er war in der Snacks-Abteilung oder in der Bäckerei.",
        ...inArea("S", "B"),
      },
      colour: "#4338ca",
      face: "\u{1F9D4}",
    },
    {
      id: "O",
      name: "Opal",
      pronoun: "sie",
      clue: {
        text: "Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F469}",
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
      text: "Fatima kann nur im Kassenbereich sein, auf einem der beiden Stühle.",
    },
    {
      text: "Da kein Raum leer war, kann nur der Kassenbereich drei Personen aufnehmen, also muss Gale mit Fatima und einem Mann dort sein, der nur Carsten sein kann.",
    },
    {
      text: "Das lokalisiert Gale, der laut Carstens Hinweis nicht neben einem Tisch war oder laut Alyshas Hinweis nicht auf einem Teppich. Das lokalisiert Fatima.",
      place: { G: { row: 6, col: 5 }, F: { row: 8, col: 0 } },
    },
    {
      text: "Alysha ist die einzige Person, die im Tiefkühlbereich sein kann. Weil Dominic in Zeile 5 ist, lokalisiert das Alysha.",
      place: { A: { row: 5, col: 1 } },
    },
    {
      text: "Nur Dominic kann im Obst- & Gemüse-Bereich sein, in Spalte 9.",
      place: { D: { row: 4, col: 8 } },
    },
    {
      text: "Das lokalisiert Beckie in der Bäckerei und Emil im Fleischbereich, was Carsten lokalisiert.",
      place: {
        B: { row: 0, col: 6 },
        E: { row: 1, col: 3 },
        C: { row: 7, col: 2 },
      },
    },
    {
      text: "Hakim kann nicht in der Bäckerei sein, sonst wäre Opal allein im Snackbereich. Das lokalisiert Hakim und Opal. Beckie ist die Mörderin!",
      place: { H: { row: 3, col: 4 }, O: { row: 2, col: 7 } },
    },
  ],
  solution: {
    A: { row: 5, col: 1 },
    B: { row: 0, col: 6 },
    C: { row: 7, col: 2 },
    D: { row: 4, col: 8 },
    E: { row: 1, col: 3 },
    F: { row: 8, col: 0 },
    G: { row: 6, col: 5 },
    H: { row: 3, col: 4 },
    O: { row: 2, col: 7 },
  },
};

/**
 * The sides of a field that lie on a wall: an area border or the map's edge.
 *
 * @returns the steps towards those sides
 */
function wallsOf(c: Context, cell: Cell): readonly Cell[] {
  const steps: readonly Cell[] = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
  ];
  return steps.filter((step) => {
    const next = { row: cell.row + step.row, col: cell.col + step.col };
    return !c.inside(next) || c.areaOf(next) !== c.areaOf(cell);
  });
}

/** Whether a field has walls on two adjacent sides - a corner of its area. */
function isCorner(c: Context, cell: Cell): boolean {
  const walls = wallsOf(c, cell);
  return (
    walls.some((step) => step.row !== 0) && walls.some((step) => step.col !== 0)
  );
}
