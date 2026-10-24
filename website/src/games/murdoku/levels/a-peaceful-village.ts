/**
 * Ein friedliches Dorf: three huts, the trodden ground between them and the
 * forest round the village, with a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/57.png`, no solution
 * sheet - the solved grid and the culprit are pencilled in on the
 * photographed page, and the solver proves it is the only solution).
 * Vik is the victim; whoever was alone with him killed him.
 *
 * The cards show no estates and the map no crowns. Instead three kinds of
 * fields are framed and marked: a basket of berries (the gatherer), a stone
 * axe (the toolmaker) and a wolf (the wolf tamer). Each trade was held by
 * exactly one person, who stood on a field of it; nobody else stood on a
 * marked field ({@link TRADES}). Who held which trade, the case does not say.
 * Beds and the marked fields can be stood on; trees, bushes, the fire and the
 * bone piles cannot.
 */
import {
  about,
  alone,
  all,
  beside,
  counting,
  inArea,
  not,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** The marked fields, one per trade. */
const TRADES: readonly string[] = ["berries", "stoneAxe", "wolf"];

/** The case. */
export const A_PEACEFUL_VILLAGE: Level = {
  id: "a-peaceful-village",
  name: "Ein friedliches Dorf",
  series: { book: "timeTravel", number: 57 },
  story: "Diese Nachbarn teilen alles: Essen, Feuer, Alibis …",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "N",
      name: "Nordhütte",
      at: "in der Nordhütte",
      ground: "floor",
      tint: "#efe2d2",
      label: { row: 2, col: 1 },
    },
    {
      key: "T",
      name: "Platz",
      at: "auf dem Platz",
      ground: "path",
      tint: "#d9bfc4",
      label: { row: 6, col: 3 },
    },
    {
      key: "K",
      name: "Kleine Hütte",
      at: "in der Kleinen Hütte",
      ground: "floor",
      tint: "#efe2d2",
      label: { row: 5, col: 1 },
    },
    {
      key: "G",
      name: "Große Hütte",
      at: "in der Großen Hütte",
      ground: "floor",
      tint: "#efe2d2",
      label: { row: 6, col: 6 },
    },
    {
      key: "B",
      name: "Wald",
      at: "im Wald",
      ground: "grass",
      tint: "#bfe0c4",
      label: { row: 8, col: 4 },
    },
  ],
  areaMap: [
    "BBNNNTTBB",
    "BNNNNTGGB",
    "BNNNNTGGB",
    "BTTTTTGGB",
    "BKKKTTGGB",
    "BKKKTTGGB",
    "BBKTTGGBB",
    "BBBBBBBBB",
    "BBBBBBBBB",
  ],
  thingMap: [
    "t.kk..l..",
    ".lbb..awt",
    ".......a.",
    "...l...b.",
    "k.b.f..bt",
    "rwb......",
    "k......t.",
    ".t...tkrk",
    "t.lt...k.",
  ],
  things: {
    a: "stoneAxe",
    b: "bed",
    f: "campfire",
    k: "berries",
    l: "wolf",
    r: "shrub",
    t: "tree",
    w: "bonePile",
  },
  pieces: [
    { at: { row: 1, col: 2 }, rows: 1, cols: 2 },
    { at: { row: 3, col: 7 }, rows: 2, cols: 1 },
    { at: { row: 4, col: 2 }, rows: 2, cols: 1 },
  ],
  suspects: [
    {
      id: "A",
      name: "Aya",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Strauch.", ...beside("shrub") },
      colour: "#b91c1c",
      face: "\u{1F469}\u{1F3FD}",
    },
    {
      id: "B",
      name: "Brok",
      pronoun: "er",
      clue: { text: "Er war auf einem Bett.", ...on("bed") },
      colour: "#15803d",
      face: "\u{1F474}\u{1F3FC}",
    },
    {
      id: "C",
      name: "Crako",
      pronoun: "er",
      clue: {
        text: "Er hatte ein Handwerk. Er war genau eine Zeile südlich der Person, die Beeren sammelte.",
        ...all(
          own(onTrade),
          counting((c) =>
            peopleOn(c, "berries").some(
              (one) => c.cellOf(one)?.row === c.cell.row - 1,
            ),
          ),
        ),
      },
      colour: "#0e7490",
      face: "\u{1F468}\u{1F3FE}\u{200D}\u{1F9B1}",
    },
    {
      id: "D",
      name: "Darg",
      pronoun: "er",
      clue: {
        text: "Er war im Wald. Er war östlich von Crako.",
        ...all(
          inArea("B"),
          about(["C"], (c) => {
            const crako = c.cellOf("C");
            return crako !== undefined && c.cell.col > crako.col;
          }),
        ),
      },
      colour: "#6366f1",
      face: "\u{1F468}\u{1F3FD}",
    },
    {
      id: "E",
      name: "Emko",
      pronoun: "er",
      clue: { text: "Er war neben dem Feuer.", ...beside("campfire") },
      colour: "#a16207",
      face: "\u{1F9D4}\u{1F3FD}",
    },
    {
      id: "F",
      name: "Fleya",
      pronoun: "sie",
      clue: {
        text: "Sie war in einer Hütte. Sie hatte kein Handwerk.",
        ...all(inArea("N", "K", "G"), not(own(onTrade))),
      },
      colour: "#be185d",
      face: "\u{1F471}\u{1F3FC}\u{200D}\u{2640}\u{FE0F}",
    },
    {
      id: "G",
      name: "Greka",
      pronoun: "sie",
      clue: { text: "Sie war allein.", ...alone() },
      colour: "#57534e",
      face: "\u{1F469}\u{1F3FE}",
    },
    {
      id: "H",
      name: "Hok",
      pronoun: "er",
      clue: {
        text: "Er war südlich von Darg.",
        ...about(["D"], (c) => {
          const darg = c.cellOf("D");
          return darg !== undefined && c.cell.row > darg.row;
        }),
      },
      colour: "#7c3aed",
      face: "\u{1F468}\u{1F3FD}",
    },
    {
      id: "V",
      name: "Vik",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F9D4}\u{1F3FE}",
    },
  ],
  rules: [
    {
      text: "Es gab eine Person, die Beeren sammelte, einen Werkzeugmacher und einen Wolfsbändiger. Jeder von ihnen stand auf einem Feld seines Handwerks, sonst niemand auf einem solchen Feld.",
      check: (c) => TRADES.every((what) => peopleOn(c, what).length === 1),
      prune: (c) => TRADES.every((what) => peopleOn(c, what).length <= 1),
    },
  ],
  hints: [
    {
      text: "Jedes Feld neben einem Strauch ist ein Beerenkorb - Aya sammelte die Beeren. Crako hatte ein anderes Handwerk und stand genau eine Zeile südlich von ihr. Aya kann in R5, R7, R8 oder R9 stehen; eine Steinaxt oder ein Wolf direkt darunter gibt es nur in R9 C3. Crako steht in R9 C3, Aya in R8 C7 oder R8 C9.",
      place: { C: { row: 8, col: 2 } },
    },
    {
      text: "Wer steht in C1? Nur Waldfelder in R2 bis R4 bleiben (die Beerenkörbe gehören Aya, R8 ist ihre Zeile). Im Wald stehen schon Aya und Crako - Greka (allein) und Vik (allein mit dem Mörder) also nicht, und Darg steht östlich von Crako. Es bleibt Hok in C1, R2 bis R4. Darg steht nördlich von ihm im Wald östlich von C3: R1 C8, R1 C9 oder R3 C9.",
    },
    {
      text: "Den Werkzeugmacher kann nur Greka oder Vik geben (alle anderen sind festgelegt) - auf R2 C7 oder R3 C8. Mit Darg in R3 C9 bliebe nur R2 C7, und Aya hätte weder C7 noch C9. Mit Darg in R1 C8 ebenfalls R2 C7 - dann hätte Brok kein Bett mehr (R2 C4 in R2, die anderen in C3 oder C8). Darg steht in R1 C9, Aya in R8 C7.",
      place: { D: { row: 0, col: 8 }, A: { row: 7, col: 6 } },
    },
    {
      text: "Die Steinaxt in R2 C7 liegt in Ayas Spalte, also steht der Werkzeugmacher in R3 C8. Brok liegt damit auf dem Bett in R2 C4, und Hok steht in R4 C1.",
      place: { B: { row: 1, col: 3 }, H: { row: 3, col: 0 } },
    },
    {
      text: "Frei sind R5 bis R7 und C2, C5, C6. Fleya ist in einer Hütte ohne Handwerk: R5 C2 oder R7 C6. Wäre Greka der Werkzeugmacher, allein in der Großen Hütte, müsste Fleya nach R5 C2, Emko nach R6 C5 und Vik nach R7 C6 - zu Greka. Also ist Vik der Werkzeugmacher in R3 C8.",
      place: { V: { row: 2, col: 7 } },
    },
    {
      text: "Greka ist allein: Auf dem Platz steht Emko, in der Großen Hütte Vik - sie steht in R5 C2. Fleya steht in R7 C6, Emko in R6 C5 neben dem Feuer. Vik ist in der Großen Hütte allein mit Fleya. Fleya ist die Mörderin!",
      place: {
        G: { row: 4, col: 1 },
        F: { row: 6, col: 5 },
        E: { row: 5, col: 4 },
      },
    },
  ],
  solution: {
    A: { row: 7, col: 6 },
    B: { row: 1, col: 3 },
    C: { row: 8, col: 2 },
    D: { row: 0, col: 8 },
    E: { row: 5, col: 4 },
    F: { row: 6, col: 5 },
    G: { row: 4, col: 1 },
    H: { row: 3, col: 0 },
    V: { row: 2, col: 7 },
  },
};

/** Whether the suspect stood on a marked field. */
function onTrade(c: Context): boolean {
  return TRADES.some((what) => c.is(c.cell, what));
}

/** Everybody standing on a thing of this id. */
function peopleOn(c: Context, what: string): readonly string[] {
  return c.people().filter((one) => {
    const there = c.cellOf(one);
    return there !== undefined && c.is(there, what);
  });
}
