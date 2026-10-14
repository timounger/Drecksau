/**
 * Home Sweet Home: a garden, a living room, a kitchen, a garage, a lounge, an
 * entrance hall and a dining room, with a murdered home owner.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/63. Home Sweet Home.JPG`,
 * solution sheet `Lösungen 1-80/Lösung 61-64.JPG`).
 * Otto is the victim; whoever was alone with him killed him.
 *
 * The armchairs are the chairs; they, the rugs and the two windows - in the
 * wall between the garden and the kitchen, in front of the garden fields -
 * can be stood on. The tables, the shelves, the TVs and the plants cannot. A
 * field is in a corner of its room when the room's border runs along two of
 * its sides that meet.
 */
import { all, counting, inArea, on, own, victim } from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** Whether a field lies in a corner of its area. */
function inCorner(c: Context): boolean {
  const area = c.areaOf(c.cell);
  const outside = (row: number, col: number): boolean =>
    c.areaOf({ row, col }) !== area;
  const vertical =
    outside(c.cell.row - 1, c.cell.col) || outside(c.cell.row + 1, c.cell.col);
  const horizontal =
    outside(c.cell.row, c.cell.col - 1) || outside(c.cell.row, c.cell.col + 1);
  return vertical && horizontal;
}

/** Whether a TV stood in the suspect's row, in the suspect's area. */
function rowWithTv(c: Context): boolean {
  const area = c.areaOf(c.cell);
  return Array.from({ length: c.cols }, (_, col) => ({
    row: c.cell.row,
    col,
  })).some((cell: Cell) => c.areaOf(cell) === area && c.is(cell, "tv"));
}

/** Whether the suspect was alone in the area with somebody, by id. */
function aloneWith(id: string): (c: Context) => boolean {
  return (c: Context): boolean => {
    const there = c.peopleIn(c.areaOf(c.cell) ?? "");
    return there.length === 2 && there.includes(id);
  };
}

/** Whether nobody but the suspect sat on a chair. */
function onlyOneOnAChair(c: Context): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return id === c.self || there === undefined || !c.is(there, "chair");
  });
}

/** Whether every area held somebody. */
function noEmptyRoom(c: Context): boolean {
  return c.level.areas.every((area) => c.peopleIn(area.key).length > 0);
}

/** Whether exactly one person stood beside a shelf. */
function oneBesideAShelf(c: Context): boolean {
  return (
    c.people().filter((id) => {
      const there = c.cellOf(id);
      return there !== undefined && c.beside(there, "shelf");
    }).length === 1
  );
}

/** The case. */
export const HOME_SWEET_HOME: Level = {
  id: "home-sweet-home",
  name: "Home Sweet Home",
  series: { book: "original", number: 63 },
  story:
    "Man sagt, Zuhause ist dort, wo man ganz man selbst sein kann … und hier wollte wohl jemand ein Mörder sein.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#f3d3a8",
      label: { row: 5, col: 2 },
    },
    {
      key: "G",
      name: "Garten",
      at: "im Garten",
      ground: "grass",
      tint: "#a9cfa6",
      label: { row: 1, col: 4 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "floor",
      tint: "#e6b29a",
      label: { row: 5, col: 7 },
    },
    {
      key: "R",
      name: "Garage",
      at: "in der Garage",
      ground: "floor",
      tint: "#c9ab88",
      label: { row: 8, col: 0 },
    },
    {
      key: "L",
      name: "Lounge",
      at: "in der Lounge",
      ground: "floor",
      tint: "#efc1b0",
      label: { row: 8, col: 2 },
    },
    {
      key: "E",
      name: "Eingangsbereich",
      at: "im Eingangsbereich",
      ground: "floor",
      tint: "#f6dfa8",
      label: { row: 6, col: 4 },
    },
    {
      key: "S",
      name: "Esszimmer",
      at: "im Esszimmer",
      ground: "floor",
      tint: "#f3c58e",
      label: { row: 8, col: 7 },
    },
  ],
  areaMap: [
    "WWWWGGGGG",
    "WWWWGGGGG",
    "WWWWWKKKK",
    "WWWWWKKKK",
    "WWWWWKKKK",
    "RRWWWKKKK",
    "RRLLEEESS",
    "RRLLEEESS",
    "RRLLEEESS",
  ],
  thingMap: [
    "p...p.p.p",
    "..c..twwp",
    "v.c.....t",
    "v.csc.tpt",
    "...rrrtt.",
    ".r.rrr...",
    ".r......c",
    "s.pt.p.tc",
    "s.c...ctc",
  ],
  things: {
    c: "chair",
    p: "plant",
    r: "rug",
    s: "shelf",
    t: "table",
    v: "tv",
    w: "window",
  },
  extraThings: {
    window: { name: "Fenster", emoji: "\u{1FA9F}", standable: true },
  },
  windows: [
    { at: { row: 1, col: 6 }, side: "bottom" },
    { at: { row: 1, col: 7 }, side: "bottom" },
  ],
  pieces: [
    { at: { row: 2, col: 8 }, rows: 2, cols: 1 },
    { at: { row: 4, col: 3 }, rows: 2, cols: 2 },
    { at: { row: 4, col: 5 }, rows: 2, cols: 1 },
    { at: { row: 5, col: 1 }, rows: 2, cols: 1 },
    { at: { row: 7, col: 7 }, rows: 2, cols: 1 },
  ],
  shapes: [
    [
      { row: 3, col: 6 },
      { row: 4, col: 6 },
      { row: 4, col: 7 },
    ],
  ],
  suspects: [
    {
      id: "A",
      name: "Andrea",
      pronoun: "sie",
      clue: { text: "Sie war in einer Ecke.", ...own(inCorner) },
      colour: "#c2410c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Bianca",
      pronoun: "sie",
      clue: {
        text: "Sie war in derselben Zeile wie ein Fernseher, im selben Raum.",
        ...own(rowWithTv),
      },
      colour: "#15803d",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "C",
      name: "Cynthia",
      pronoun: "sie",
      clue: {
        text: "Sie war allein mit Bianca.",
        ...counting(aloneWith("B")),
      },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Domi",
      pronoun: "er",
      clue: { text: "Er war in der Küche.", ...inArea("K") },
      colour: "#6366f1",
      face: "\u{1F474}",
    },
    {
      id: "E",
      name: "Elijah",
      pronoun: "er",
      clue: { text: "Er war in der Lounge.", ...inArea("L") },
      colour: "#7c3aed",
      face: "\u{1F468}",
    },
    {
      id: "F",
      name: "Felicia",
      pronoun: "sie",
      clue: { text: "Sie war vor einem Fenster.", ...on("window") },
      colour: "#9f1239",
      face: "\u{1F469}\u{1F3FE}‍\u{1F9B1}",
    },
    {
      id: "G",
      name: "Guido",
      pronoun: "er",
      clue: { text: "Er war auf einem Teppich.", ...on("rug") },
      colour: "#ea580c",
      face: "\u{1F468}\u{1F3FE}",
    },
    {
      id: "H",
      name: "Henriette",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person, die auf einem Stuhl saß.",
        ...all(on("chair"), counting(onlyOneOnAChair)),
      },
      colour: "#4338ca",
      face: "\u{1F469}",
    },
    {
      id: "O",
      name: "Otto",
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
    { text: "Es gab keinen leeren Raum.", check: noEmptyRoom },
    {
      text: "Genau eine Person war neben einem Regal.",
      check: oneBesideAShelf,
    },
  ],
  hints: [
    {
      text: "Kein Raum ist leer, also sind alle vier Räume am unteren Rand des Gitters besetzt. Die vier Personen darin machen alle in den unteren vier Zeilen aus, mit nur einem Verdächtigen in jedem Raum.",
      cross: [
        { row: 5, col: 2 },
        { row: 5, col: 3 },
        { row: 5, col: 4 },
        { row: 5, col: 5 },
        { row: 5, col: 6 },
        { row: 5, col: 7 },
        { row: 5, col: 8 },
      ],
    },
    {
      text: "Die Person in der Garage muss in Z6 sein; schließe den Rest der Zeile und die anderen Garagenfelder aus.",
      cross: [
        { row: 6, col: 0 },
        { row: 6, col: 1 },
        { row: 7, col: 1 },
        { row: 8, col: 1 },
      ],
    },
    {
      text: "Nur zwei Personen können in der Eingangsbereich oder im Esszimmer sein: Andrea und Henriette. Einer von ihnen muss in Z8 sein; das kann nur Henriette sein, was sie in S9 lokalisiert. Schließe alle anderen Stühle aus.",
      place: { H: { row: 7, col: 8 } },
      cross: [
        { row: 1, col: 2 },
        { row: 2, col: 2 },
        { row: 3, col: 2 },
        { row: 3, col: 4 },
        { row: 8, col: 2 },
        { row: 8, col: 6 },
      ],
    },
    {
      text: "Bianca oder Cynthia ist in S4, neben dem letzten Regal. Das lokalisiert Elijah in der Lounge, dann Andrea im Eingangsbereich. Nur Guido kann der Verdächtige in der Garage sein, auf dem Teppich.",
      place: {
        E: { row: 6, col: 2 },
        A: { row: 8, col: 4 },
        G: { row: 5, col: 1 },
      },
    },
    {
      text: "Bianca ist in derselben Zeile wie ein Fernseher; das lokalisiert sie in Z3 S4, was Felicia in Z2 am Fenster setzt.",
      place: { B: { row: 2, col: 3 }, F: { row: 1, col: 6 } },
    },
    {
      text: "Das lokalisiert Cynthia im Wohnzimmer, dann Domi in der Küche.",
      place: { C: { row: 4, col: 0 }, D: { row: 3, col: 5 } },
    },
    {
      text: "Das lokalisiert Felicia und Otto. Felicia ist die Mörderin!",
      place: { O: { row: 0, col: 7 } },
    },
  ],
  solution: {
    A: { row: 8, col: 4 },
    B: { row: 2, col: 3 },
    C: { row: 4, col: 0 },
    D: { row: 3, col: 5 },
    E: { row: 6, col: 2 },
    F: { row: 1, col: 6 },
    G: { row: 5, col: 1 },
    H: { row: 7, col: 8 },
    O: { row: 0, col: 7 },
  },
};
