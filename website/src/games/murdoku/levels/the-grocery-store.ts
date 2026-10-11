/**
 * The Grocery Store: the fridges, the meat counter, the snacks, the bakery,
 * the fruit and vegetables and the checkout, with a murdered shopper.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Der Lebensmittelladen/Der Lebensmittelladen.png`,
 * no solution sheet - the solver proves the one solution, with the culprit
 * pencilled in on the photographed page).
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
      text: "Kein Raum war leer, also sind neun Personen auf sechs Räume verteilt. Opal war mit genau einer Person zusammen, Gale mit genau zwei - die übrigen vier Räume hatten also je eine Person. Bäckerei und Obst & Gemüse liegen beide in C7 bis C9: Stünden drei Leute in einem davon, wäre der andere leer. Gales Dreiergruppe war also an der Kasse.",
    },
    {
      text: "Fatima saß auf einem Stuhl - die gibt es nur an der Kasse. Sie ist also die Frau in Gales Raum. Der weitere Mann kann nicht Emil (Fleisch), Hakim (Snacks oder Bäckerei) oder Dominic (R5) sein: Carsten war an der Kasse. Neben beiden Stühlen steht ein Tisch, also war Gale die Person, die nicht neben einem Tisch oder Regal war. Auf einem Teppich stand nur Alysha, also geht das an der Kasse nur in R7 C6. Blockiere den Rest von R7 und C6.",
      place: { G: { row: 6, col: 5 } },
      cross: [
        { row: 6, col: 0 },
        { row: 6, col: 1 },
        { row: 6, col: 2 },
        { row: 6, col: 3 },
        { row: 6, col: 4 },
        { row: 6, col: 7 },
        { row: 6, col: 8 },
        { row: 0, col: 5 },
        { row: 1, col: 5 },
        { row: 7, col: 5 },
        { row: 8, col: 5 },
      ],
    },
    {
      text: "Fatimas Stuhl in R9 C6 liegt in der gesperrten C6, also saß sie in R9 C1. Blockiere den Rest von R9 und C1.",
      place: { F: { row: 8, col: 0 } },
      cross: [
        { row: 8, col: 2 },
        { row: 8, col: 3 },
        { row: 8, col: 6 },
        { row: 8, col: 7 },
        { row: 1, col: 0 },
      ],
    },
    {
      text: "Die Kühlregale haben nur noch Felder in C2, also stand dort genau eine Person - nicht Opal, sie war zu zweit. Emil, Hakim und Dominic (R5 C2 ist ein Teppich) scheiden aus, und Beckie findet in C2 keine Ecke. Also war Alysha bei den Kühlregalen, auf dem Teppich in R5 C2 oder R6 C2 - und sonst stand niemand auf einem Teppich.",
    },
    {
      text: "Carsten, Gale und Fatima füllen R7 bis R9. Bei Obst & Gemüse bleiben ohne Teppich nur R5 C9 und R6 C9, beide in C9 - dort stand also genau eine Person, nicht Opal. Emil und Hakim scheiden aus, und Beckie (eine Ecke ist nur R5 C9) würde Dominic aus R5 verdrängen. Also war Dominic in R5 C9 - und Alysha in R6 C2. Blockiere ihre Reihen und Spalten.",
      place: { D: { row: 4, col: 8 }, A: { row: 5, col: 1 } },
      cross: [
        { row: 4, col: 1 },
        { row: 4, col: 2 },
        { row: 4, col: 3 },
        { row: 4, col: 4 },
        { row: 4, col: 7 },
        { row: 0, col: 8 },
        { row: 2, col: 8 },
        { row: 3, col: 8 },
        { row: 5, col: 8 },
        { row: 5, col: 3 },
        { row: 5, col: 4 },
        { row: 5, col: 7 },
        { row: 1, col: 1 },
        { row: 2, col: 1 },
        { row: 3, col: 1 },
      ],
    },
    {
      text: "Emil war in der Fleisch-Abteilung. Frei und ohne Teppich ist dort nur noch R2 C4. Blockiere den Rest von R2 und C4. Carsten war in R8 an der Kasse: R8 C4 ist gesperrt, also R8 C3.",
      place: { E: { row: 1, col: 3 }, C: { row: 7, col: 2 } },
      cross: [
        { row: 1, col: 2 },
        { row: 1, col: 4 },
        { row: 1, col: 6 },
        { row: 7, col: 3 },
        { row: 7, col: 6 },
        { row: 7, col: 7 },
        { row: 2, col: 2 },
        { row: 3, col: 2 },
      ],
    },
    {
      text: "Bei den Snacks bleibt nur R4 C5, dort stand also genau eine Person; Emil war in der Fleisch-Abteilung allein. Für Beckie, Hakim und Opal bleiben Snacks und Bäckerei - Opals Paar stand also in der Bäckerei. R4 C5 ist keine Ecke, also war Hakim bei den Snacks.",
      place: { H: { row: 3, col: 4 } },
      cross: [
        { row: 0, col: 4 },
        { row: 2, col: 4 },
      ],
    },
    {
      text: "Übrig sind R1 und R3 in C7 und C8, beide in der Bäckerei. Eine Ecke ist davon nur R1 C7 - dort war Beckie, Opal in R3 C8. In der Bäckerei war Opal allein mit Beckie - Beckie ist die Mörderin!",
      place: { B: { row: 0, col: 6 }, O: { row: 2, col: 7 } },
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
