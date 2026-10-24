/**
 * Rivalisierende Dörfer: seven huts on both banks of a river, the forest in
 * the west and the plain in the east, with a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/62.png`, no solution
 * sheet - parts of the solved grid are pencilled in on the photographed
 * page, and the solver proves it is the only solution).
 * Varg is the victim; whoever was alone with him killed him.
 *
 * The cards show no estates and the map no crowns. Instead three kinds of
 * fields are framed and marked: hunting gear (the hunter), a fish (the
 * fisher) and a basket of berries (the gatherer). There was exactly one of
 * each - exactly one person stood on a field of each kind
 * ({@link TRADES}). Five people were west of the river and five east of it,
 * so the other two stood in the river ({@link BANKS}). Beds, the river and
 * the marked fields can be stood on; trees, shrubs, the fires, the bone
 * piles, the animals and the time machine cannot.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  about,
  all,
  beside,
  cellsWhere,
  counting,
  inArea,
  not,
  on,
  own,
  row,
  victim,
} from "../engine/clues";
import type { Context, Level, Rule } from "../engine/types";

/** The huts. */
const HUTS: readonly string[] = ["A", "B", "C", "D", "E", "F", "G"];

/** The areas west of the river. */
const WEST: readonly string[] = ["A", "B", "C", "D", "W"];

/** The areas east of the river. */
const EAST: readonly string[] = ["E", "F", "G", "L"];

/** The marked fields: exactly one person stood on each kind. */
const TRADES: readonly Rule[] = [
  trade("Es gab einen Jäger: Genau eine Person stand auf Jagdwaffen.", "spear"),
  trade(
    "Es gab einen Fischer: Genau eine Person stand an einem Fischplatz.",
    "fishingSpot",
  ),
  trade(
    "Es gab einen Sammler: Genau eine Person stand auf einem Beerenkorb.",
    "berries",
  ),
];

/** Five people west of the river, five east of it. */
const BANKS: Rule = {
  text: "Fünf Personen waren westlich des Flusses und fünf östlich davon.",
  check: (c) => countIn(c, WEST) === 5 && countIn(c, EAST) === 5,
  prune: (c) =>
    countIn(c, WEST) <= 5 && countIn(c, EAST) <= 5 && countIn(c, ["R"]) <= 2,
};

/** The case. */
export const RIVAL_VILLAGES: Level = {
  id: "rival-villages",
  name: "Rivalisierende Dörfer",
  series: { book: "timeTravel", number: 62 },
  story:
    "Manches hat sich über die Jahre nicht geändert: Die Leute können laute Nachbarn nicht ausstehen.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "A",
      name: "Hütte 1",
      at: "in Hütte 1",
      ground: "floor",
      tint: "#e2cdc0",
      label: { row: 1, col: 0 },
    },
    {
      key: "B",
      name: "Hütte 2",
      at: "in Hütte 2",
      ground: "floor",
      tint: "#e2cdc0",
      label: { row: 1, col: 4 },
    },
    {
      key: "C",
      name: "Hütte 3",
      at: "in Hütte 3",
      ground: "floor",
      tint: "#e2cdc0",
      label: { row: 4, col: 1 },
    },
    {
      key: "D",
      name: "Hütte 4",
      at: "in Hütte 4",
      ground: "floor",
      tint: "#e2cdc0",
      label: { row: 4, col: 4 },
    },
    {
      key: "E",
      name: "Hütte 5",
      at: "in Hütte 5",
      ground: "floor",
      tint: "#e2cdc0",
      label: { row: 8, col: 11 },
    },
    {
      key: "F",
      name: "Hütte 6",
      at: "in Hütte 6",
      ground: "floor",
      tint: "#e2cdc0",
      label: { row: 11, col: 7 },
    },
    {
      key: "G",
      name: "Hütte 7",
      at: "in Hütte 7",
      ground: "floor",
      tint: "#e2cdc0",
      label: { row: 11, col: 11 },
    },
    {
      key: "W",
      name: "Wald",
      at: "im Wald",
      ground: "grass",
      tint: "#ece8c4",
      label: { row: 11, col: 2 },
    },
    {
      key: "R",
      name: "Fluss",
      at: "im Fluss",
      ground: "water",
      label: { row: 11, col: 5 },
    },
    {
      key: "L",
      name: "Ebene",
      at: "in der Ebene",
      ground: "grass",
      tint: "#d4ebb4",
      label: { row: 11, col: 9 },
    },
  ],
  areaMap: [
    "AAWBBRRLLLLL",
    "AWWBBRRLLLLL",
    "WWWWWRRLLLLL",
    "CWWDDDRLLLLL",
    "CCWDDDRRLLLL",
    "WWWWWWWRLLLL",
    "WWWWWWWRLLEE",
    "WWWWWWRRLLLE",
    "WWWWWRRLLLLE",
    "WWWWRRFFLLLL",
    "WWWWRRFFFLGG",
    "WWWWRRFFLLGG",
  ],
  thingMap: [
    "bb.b...k..ks",
    "...bo.pskk.k",
    "..f.p..kksks",
    "b.o.o..p.k.x",
    "b...bb......",
    "......h.p...",
    "th.hth....bb",
    ".w.....p.o..",
    "h..tp.p..f..",
    ".thw..o.....",
    ".h.t.p..o..b",
    "m.....bb...b",
  ],
  things: {
    b: "bed",
    f: "campfire",
    h: "spear",
    k: "berries",
    o: "bonePile",
    p: "fishingSpot",
    m: "timeMachine",
    s: "shrub",
    t: "tree",
    w: "boar",
    x: "sabreTooth",
  },
  pieces: [
    { at: { row: 0, col: 0 }, rows: 1, cols: 2 },
    { at: { row: 0, col: 3 }, rows: 2, cols: 1 },
    { at: { row: 3, col: 0 }, rows: 2, cols: 1 },
    { at: { row: 4, col: 4 }, rows: 1, cols: 2 },
    { at: { row: 6, col: 10 }, rows: 1, cols: 2 },
    { at: { row: 10, col: 11 }, rows: 2, cols: 1 },
    { at: { row: 11, col: 6 }, rows: 1, cols: 2 },
  ],
  suspects: [
    {
      id: "A",
      name: "Aarv",
      pronoun: "er",
      clue: {
        text: "Er war mehr als zwei Spalten von Gark entfernt.",
        ...about(["G"], (c) => {
          const gark = c.cellOf("G");
          return gark !== undefined && Math.abs(c.cell.col - gark.col) > 2;
        }),
      },
      colour: "#b91c1c",
      face: "\u{1F474}",
    },
    {
      id: "B",
      name: "Baru",
      pronoun: "er",
      clue: {
        text: "Er war allein in einer Hütte. Er war nicht auf einem Bett.",
        ...all(
          inArea(...HUTS),
          not(on("bed")),
          counting((c) => c.peopleIn(c.areaOf(c.cell) ?? "").length === 1),
        ),
      },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Cloha",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Feuer.", ...beside("campfire") },
      colour: "#0e7490",
      face: "\u{1F475}",
    },
    {
      id: "D",
      name: "Dehak",
      pronoun: "sie",
      clue: { text: "Sie war auf einem Bett.", ...on("bed") },
      colour: "#7c3aed",
      face: "\u{1F469}",
    },
    {
      id: "E",
      name: "Esak",
      pronoun: "sie",
      clue: { text: "Sie war in der obersten Zeile.", ...row(1) },
      colour: "#ea580c",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "F",
      name: "Felk",
      pronoun: "er",
      clue: {
        text: "Er war mit einer Frau in einer Hütte.",
        ...all(
          inArea(...HUTS),
          counting((c) =>
            c
              .peopleIn(c.areaOf(c.cell) ?? "")
              .some((id) => id !== c.self && c.has(id, "woman")),
          ),
        ),
      },
      colour: "#be185d",
      face: "\u{1F468}",
    },
    {
      id: "G",
      name: "Gark",
      pronoun: "er",
      clue: {
        text: "Er war genau eine Zeile südlich des Sammlers.",
        ...all(
          own((c) => rowAboveHas(c, "berries")),
          counting((c) => oneRowSouthOf(c, "berries")),
        ),
      },
      colour: "#4338ca",
      face: "\u{1F9D1}",
    },
    {
      id: "H",
      name: "Huak",
      pronoun: "er",
      clue: {
        text: "Er war genau eine Zeile südlich des Jägers.",
        ...all(
          own((c) => rowAboveHas(c, "spear")),
          counting((c) => oneRowSouthOf(c, "spear")),
        ),
      },
      colour: "#a16207",
      face: "\u{1F9D4}‍♂️",
    },
    {
      id: "I",
      name: "Igha",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Baum.", ...beside("tree") },
      colour: "#db2777",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "J",
      name: "Jahak",
      pronoun: "er",
      clue: {
        text: "Er war neben dem Säbelzahntiger.",
        ...beside("sabreTooth"),
      },
      colour: "#334155",
      face: "\u{1F466}",
    },
    {
      id: "K",
      name: "Klah",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Strauch.", ...beside("shrub") },
      colour: "#65a30d",
      face: "\u{1F467}",
    },
    {
      id: "V",
      name: "Varg",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#57534e",
      face: "\u{1F468}‍\u{1F9B1}",
    },
  ],
  rules: [...TRADES, BANKS],
  prune: stillPossible,
  hints: [
    {
      text: "Jede Zeile und jede Spalte hat genau eine Person. Spalte 1-4 liegen ganz westlich des Flusses, Spalte 9-12 ganz östlich. Bei fünf Personen im Westen und fünf im Osten stehen in Spalte 5-8 also genau eine Person im Westen, eine im Osten und die beiden übrigen im Fluss.",
    },
    {
      text: "Felk braucht eine Frau in seiner Hütte. Cloha, Igha und Klah stehen nie in einer Hütte, Esak nur in Zeile 1 (Hütte 1 oder 2). In einer Hütte im Osten müsste also Dehak auf dem Bett bei ihm sein: In Hütte 5 oder 7 belegten die beiden Spalte 11 und 12, und Jahak (R4C11 oder R5C12) hätte keine Spalte mehr; in Hütte 6 stünden zwei Personen aus dem Osten in Spalte 7-8. Felk steht also in einer Hütte im Westen, in Zeile 1-5.",
    },
    {
      text: "In Zeile 1-5 stehen schon Esak, Klah (Zeile 2-4), Jahak (Zeile 4-5) und Gark (südlich des Sammlers, Zeile 2-5) - mit Felk sind diese Zeilen voll. Felks Frau ist Esak: Er steht in R2C1 mit ihr in R1C2 oder in R2C4 mit ihr in R1C5. Auf einem Beerenkorb (Zeile 1-4) kann damit nur Klah stehen - sie ist die Sammlerin, in Zeile 3 (Zeile 2 ist Felks; in Zeile 4 stünde Gark in Zeile 5, und Jahak fände keine Zeile). Gark steht in Zeile 4, Jahak in R5C12.",
      place: { J: { row: 4, col: 11 } },
    },
    {
      text: "Cloha steht am Feuer im Osten, Baru allein in einer Hütte im Osten und Dehak auf einem Bett im Osten - mit Jahak und Klah sind das die fünf im Osten. Niemand sonst steht in der Ebene. Spalte 10 kann darum nur Cloha füllen: R10C10. Spalte 9 nur Klah: R3C9.",
      place: { C: { row: 9, col: 9 }, K: { row: 2, col: 8 } },
    },
    {
      text: "Spalte 11 füllt Dehak (R7C11) oder Baru (R11C11, R12C11). Mit Dehak in R7C11 stünde Baru in Hütte 6 in Zeile 11 - dann hätte der Jäger keine Zeile mehr, unter der Huak frei stehen könnte. Also liegt Dehak auf dem Bett in Hütte 6 in Zeile 12, und Baru steht in R11C11.",
      place: { B: { row: 10, col: 10 } },
    },
    {
      text: "Frei sind Zeile 4 (Gark) und 6-9. In Spalte 5-8 stehen neben Dehak zwei Personen im Fluss; in diesen Zeilen hat Spalte 5 kein Flussfeld und Spalte 6 nur R9C6. Läge Dehak in R12C8, kämen die Flussfelder aus Spalte 6 und 7, also auch R9C6 - und der Fischer hätte keinen Platz: R8C8 läge in Dehaks Spalte, R9C5 und R9C7 in Zeile 9. Also liegt Dehak in R12C7, im Fluss stehen R9C6 und ein Feld in Spalte 8 - und der Fischer steht in R8C8.",
      place: { D: { row: 11, col: 6 } },
    },
    {
      text: "Der Jäger steht in Zeile 7 (R6C7 liegt in Dehaks Spalte), Huak darunter in R8C8. Mit Esak in R1C2 bliebe dem Jäger nur R7C4, und Gark fände in Zeile 4 keine Spalte. Also: Esak R1C5, Felk R2C4, Jäger R7C2, Gark R4C1 - es bleiben R6C3 und R9C6. Neben einem Baum steht nur Igha in R7C2; Aarv steht mehr als zwei Spalten von Gark entfernt in R9C6. Varg steht in R6C3 im Wald - allein mit Igha. Igha ist die Mörderin!",
      place: {
        H: { row: 7, col: 7 },
        E: { row: 0, col: 4 },
        F: { row: 1, col: 3 },
        G: { row: 3, col: 0 },
        I: { row: 6, col: 1 },
        A: { row: 8, col: 5 },
        V: { row: 5, col: 2 },
      },
    },
  ],
  solution: {
    A: { row: 8, col: 5 },
    B: { row: 10, col: 10 },
    C: { row: 9, col: 9 },
    D: { row: 11, col: 6 },
    E: { row: 0, col: 4 },
    F: { row: 1, col: 3 },
    G: { row: 3, col: 0 },
    H: { row: 7, col: 7 },
    I: { row: 6, col: 1 },
    J: { row: 4, col: 11 },
    K: { row: 2, col: 8 },
    V: { row: 5, col: 2 },
  },
};

/** The rule of one kind of marked field: exactly one person stood on one. */
function trade(text: string, thing: string): Rule {
  return {
    text,
    check: (c) => countOn(c, thing) === 1,
    prune: (c) =>
      countOn(c, thing) === 1 ||
      (countOn(c, thing) === 0 && freeCellWith(c, thing)),
  };
}

/** How many people stood on a thing of this id. */
function countOn(c: Context, thing: string): number {
  return c.people().filter((id) => {
    const there = c.cellOf(id);
    return there !== undefined && c.is(there, thing);
  }).length;
}

/** Whether a field with this thing is still in a free row and a free column. */
function freeCellWith(c: Context, thing: string): boolean {
  const taken = c
    .people()
    .map((id) => c.cellOf(id))
    .filter((there) => there !== undefined);
  return cellsWhere(c.level, (cell) => c.is(cell, thing)).some((cell) =>
    taken.every((there) => there.row !== cell.row && there.col !== cell.col),
  );
}

/** How many people stood in these areas. */
function countIn(c: Context, areas: readonly string[]): number {
  return areas.reduce((sum, key) => sum + c.peopleIn(key).length, 0);
}

/** Whether the suspect stood one row south of whoever stood on this thing. */
function oneRowSouthOf(c: Context, thing: string): boolean {
  return c.people().some((id) => {
    const there = c.cellOf(id);
    return (
      there !== undefined && c.is(there, thing) && there.row === c.cell.row - 1
    );
  });
}

/**
 * For the solver: whether a partial placement can still be finished. Baru
 * stays alone, Varg's area never holds more than two, Felk has a woman with
 * him once all women stand, and whoever stands in the row above Gark (Huak)
 * must be the gatherer (the hunter) - there is exactly one person per row.
 */
function stillPossible(c: Context): boolean {
  const baru = c.cellOf("B");
  const varg = c.cellOf("V");
  const felk = c.cellOf("F");
  const women = c.level.suspects
    .filter((one) => one.pronoun === "sie")
    .map((one) => one.id);
  return (
    (felk === undefined ||
      women.some((id) => c.cellOf(id) === undefined) ||
      women.some((id) => {
        const there = c.cellOf(id);
        return there !== undefined && c.areaOf(there) === c.areaOf(felk);
      })) &&
    (baru === undefined || c.peopleIn(c.areaOf(baru) ?? "").length === 1) &&
    (varg === undefined || c.peopleIn(c.areaOf(varg) ?? "").length <= 2) &&
    aboveFits(c, "G", "berries") &&
    aboveFits(c, "H", "spear")
  );
}

/** Whether whoever stands in the row above this suspect, if anybody, is on such a thing. */
function aboveFits(c: Context, id: string, thing: string): boolean {
  const own = c.cellOf(id);
  const above =
    own === undefined
      ? undefined
      : c
          .people()
          .map((one) => c.cellOf(one))
          .find((there) => there !== undefined && there.row === own.row - 1);
  return (
    (own === undefined || own.row > 0) &&
    (above === undefined || c.is(above, thing))
  );
}

/** Whether the row above the suspect's field has a thing of this id - where the one they are south of must stand. */
function rowAboveHas(c: Context, thing: string): boolean {
  return Array.from({ length: c.cols }, (_, col) => ({
    row: c.cell.row - 1,
    col,
  })).some((cell) => c.inside(cell) && c.is(cell, thing));
}
