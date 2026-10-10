/**
 * Summer Isles: four islands in a sea, and a stolen dog.
 *
 * @module
 * @remarks
 * After the free sample case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Easy/SummerIsles.png`, solution beside it).
 * Valeria is the dog; whoever was alone with her took her.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data:
   rows, columns and counts straight off the printed page. */
import {
  about,
  all,
  beside,
  column,
  counting,
  inArea,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** Which area each field belongs to. */
const AREAS: readonly string[] = [
  "BBBBSSSSS",
  "BBBSSRRSS",
  "BBBSRRRRS",
  "BBBSRRRRS",
  "SSSSRRRRS",
  "QQQSRSSSS",
  "QQQSSSNNS",
  "QQQSSNNNN",
  "QQQQSNNNN",
];

/** The fields of some columns, counted from 0, that lie outside an area. */
function outside(area: string, from: number, to: number): readonly Cell[] {
  const found: Cell[] = [];
  AREAS.forEach((line, row) => {
    for (let col = from; col <= to; col += 1) {
      if (line[col] !== area) {
        found.push({ row, col });
      }
    }
  });
  return found;
}

/** The kinds of thing next to a field, in its area. */
function kindsBeside(c: Context, cell: Cell): readonly string[] {
  return c.neighbours(cell).flatMap((next) => {
    const thing = c.thingAt(next);
    return thing === null ? [] : [thing];
  });
}

/** The case. */
export const SUMMER_ISLES: Level = {
  id: "summer-isles",
  name: "Sommerinseln",
  difficulty: "easy",
  story:
    "Eine Hündin wurde gestohlen! Finde heraus, wer es war. Der Dieb war allein mit ihr in einem Bereich.",
  culprit: { name: "der Dieb", dative: "dem Dieb" },
  areas: [
    {
      key: "B",
      name: "Vogelinsel",
      at: "auf der Vogelinsel",
      ground: "grass",
      island: true,
      tint: "#bfe8a6",
      label: { row: 3, col: 0 },
    },
    {
      key: "R",
      name: "Wildschweininsel",
      at: "auf der Wildschweininsel",
      ground: "grass",
      island: true,
      tint: "#c9eeb0",
      label: { row: 4, col: 5 },
    },
    {
      key: "Q",
      name: "Eichhörncheninsel",
      at: "auf der Eichhörncheninsel",
      ground: "grass",
      island: true,
      tint: "#a8dcc0",
      label: { row: 8, col: 0 },
    },
    {
      key: "N",
      name: "Schlangeninsel",
      at: "auf der Schlangeninsel",
      ground: "sand",
      island: true,
      tint: "#f6edc8",
      label: { row: 8, col: 6 },
    },
    {
      key: "S",
      name: "Meer",
      at: "im Meer",
      ground: "water",
      label: { row: 6, col: 5 },
    },
  ],
  areaMap: AREAS,
  thingMap: [
    ".o.hk.b..",
    "h.....o..",
    ".....s...",
    "..s......",
    "..k.w..h.",
    ".....b..o",
    ".to....c.",
    "t..b....c",
    "..t...c..",
  ],
  things: {
    h: "house",
    b: "boat",
    t: "tree",
    s: "shrub",
    k: "shark",
    w: "boar",
    o: "boulder",
    c: "cactus",
  },
  suspects: [
    {
      id: "A",
      name: "Allegra",
      pronoun: "sie",
      clue: { text: "Sie war in einem Haus.", ...on("house") },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Bjorn",
      pronoun: "er",
      clue: { text: "Er war auf einem Boot.", ...on("boat") },
      colour: "#15803d",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "C",
      name: "Chase",
      pronoun: "er",
      clue: { text: "Er war auf der Eichhörncheninsel.", ...inArea("Q") },
      colour: "#0e7490",
      face: "\u{1F9D4}",
    },
    {
      id: "D",
      name: "Daisy",
      pronoun: "sie",
      clue: {
        text: "Sie war neben derselben Art Gegenstand (oder Tier) wie Harmony.",
        ...all(
          own((c) => kindsBeside(c, c.cell).length > 0),
          about(["H"], (c) => {
            const there = c.cellOf("H");
            const hers = there === undefined ? [] : kindsBeside(c, there);
            return kindsBeside(c, c.cell).some((one) => hers.includes(one));
          }),
        ),
      },
      colour: "#6366f1",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "E",
      name: "Elizabeth",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Wildschwein.", ...beside("boar") },
      colour: "#7c3aed",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "F",
      name: "Francis",
      pronoun: "er",
      clue: { text: "Er war neben einem Strauch.", ...beside("shrub") },
      colour: "#9f1239",
      face: "\u{1F468}",
    },
    {
      id: "G",
      name: "Greg",
      pronoun: "er",
      clue: { text: "Er war in der fünften Spalte.", ...column(5) },
      colour: "#ea580c",
      face: "\u{1F474}",
    },
    {
      id: "H",
      name: "Harmony",
      pronoun: "sie",
      clue: {
        text: "Sie war auf einer Insel mit drei anderen Personen.",
        ...all(
          own((c) => c.areaOf(c.cell) !== "S"),
          counting((c) => c.peopleIn(c.areaOf(c.cell) ?? "").length === 4),
        ),
      },
      colour: "#4338ca",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "V",
      name: "Valeria",
      pronoun: "sie",
      clue: { text: "Sie war allein mit dem Dieb.", ...victim() },
      colour: "#d97706",
      face: "\u{1F415}",
    },
  ],
  hints: [
    {
      text: "Greg ist der Einzige in der fünften Spalte. Elizabeth kann also nicht in Spalte 5 stehen - damit bleibt ihr nur das letzte Feld neben dem Wildschwein.",
      place: { E: { row: 4, col: 5 } },
    },
    {
      text: "Die einzige Insel, auf der vier Personen Platz haben (Harmonys Hinweis), ist die Wildschweininsel: Greg, Elizabeth, Francis oder Daisy - und Harmony. Valeria kann nicht dort sein, sie war mit nur einer Person allein. Alle vier stehen zwischen Spalte 5 und 8: Streiche in diesen vier Spalten alles außerhalb der Wildschweininsel.",
      cross: outside("R", 4, 7),
    },
    {
      text: "Damit bleibt für Bjorn nur noch ein Boot.",
      place: { B: { row: 7, col: 3 } },
    },
    {
      text: "Und für Allegra nur noch ein Haus.",
      place: { A: { row: 1, col: 0 } },
    },
    {
      text: "Harmony ist auf der Wildschweininsel, und Daisy steht neben derselben Art Gegenstand wie sie. Ob Harmony neben einem Haus, einem Felsen oder einem Strauch steht: Daisy muss in Spalte 2 oder 3 stehen. Chase steht ebenfalls in Spalte 2 oder 3. Francis kann dann nur noch neben dem Strauch stehen - in Reihe 3, Spalte 7.",
      place: { F: { row: 2, col: 6 } },
    },
    {
      text: "Damit bleibt für Harmony nur noch ein Feld.",
      place: { H: { row: 3, col: 7 } },
    },
    {
      text: "Damit bleibt auch für Daisy nur ein Feld, neben einem Haus - und für Greg.",
      place: { D: { row: 0, col: 2 }, G: { row: 5, col: 4 } },
    },
    {
      text: "Damit bleibt für Chase nur noch ein Feld.",
      place: { C: { row: 8, col: 1 } },
    },
    {
      text: "Für Valeria bleibt das letzte Feld, allein im Meer mit Bjorn. Bjorn ist der Dieb!",
      place: { V: { row: 6, col: 8 } },
    },
  ],
  solution: {
    A: { row: 1, col: 0 },
    B: { row: 7, col: 3 },
    C: { row: 8, col: 1 },
    D: { row: 0, col: 2 },
    E: { row: 4, col: 5 },
    F: { row: 2, col: 6 },
    G: { row: 5, col: 4 },
    H: { row: 3, col: 7 },
    V: { row: 6, col: 8 },
  },
};
