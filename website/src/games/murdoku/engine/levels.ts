/**
 * The cases.
 *
 * @module
 * @remarks
 * A case is drawn as two pictures of letters, one row per line: which area
 * each field belongs to, and what stands on it. That is the shape the printed
 * puzzle has, so a new case is copied off the page field by field and can be
 * checked against it by eye. The letters of the things are in {@link THING_KEYS}.
 *
 * Every case here has exactly one solution - checked with the solver in
 * ./rules - and the clues alone are enough to find it.
 */
import type { Cell, Level, Thing } from "./types";

/** Which letter in a thing map stands for which thing. */
export const THING_KEYS: Readonly<Record<string, Thing>> = {
  h: "house",
  b: "boat",
  t: "tree",
  s: "shrub",
  k: "shark",
  w: "boar",
  o: "boulder",
  c: "cactus",
};

/**
 * The fields of some columns that lie outside an area - what a step rules out
 * when it has shown that everybody in those columns stands in that area.
 *
 * @param areaMap - the case's area map
 * @param area - the area's key
 * @param columns - the first and last column, counted from nought
 * @returns every field of those columns that belongs to another area
 */
function outside(
  areaMap: readonly string[],
  area: string,
  columns: { readonly from: number; readonly to: number },
): readonly Cell[] {
  const found: Cell[] = [];
  areaMap.forEach((line, row) => {
    for (let col = columns.from; col <= columns.to; col += 1) {
      if (line[col] !== area) {
        found.push({ row, col });
      }
    }
  });
  return found;
}

/** Which area each field of Summer Isles belongs to. */
const SUMMER_AREAS: readonly string[] = [
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

/**
 * Summer Isles: four islands in a sea, and a stolen dog.
 *
 * @remarks
 * After the free sample case of Murdoku by Manuel Garand. Valeria is the dog;
 * whoever was alone with her took her.
 */
const SUMMER_ISLES: Level = {
  id: "summer-isles",
  name: "Sommerinseln",
  difficulty: "easy",
  story:
    "Eine Hündin wurde gestohlen! Finde heraus, wer es war. Der Dieb war allein mit ihr in einem Bereich.",
  culprit: { name: "der Dieb", dative: "dem Dieb" },
  size: 9,
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
      island: false,
      tint: "#a7d3f2",
      label: { row: 6, col: 5 },
    },
  ],
  areaMap: SUMMER_AREAS,
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
  suspects: [
    {
      id: "A",
      name: "Allegra",
      pronoun: "sie",
      clue: { kind: "on", thing: "house" },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Bjorn",
      pronoun: "er",
      clue: { kind: "on", thing: "boat" },
      colour: "#15803d",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "C",
      name: "Chase",
      pronoun: "er",
      clue: { kind: "in", area: "Q" },
      colour: "#0e7490",
      face: "\u{1F9D4}",
    },
    {
      id: "D",
      name: "Daisy",
      pronoun: "sie",
      clue: { kind: "besideSame", other: "H" },
      colour: "#6366f1",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "E",
      name: "Elizabeth",
      pronoun: "sie",
      clue: { kind: "beside", thing: "boar" },
      colour: "#7c3aed",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "F",
      name: "Francis",
      pronoun: "er",
      clue: { kind: "beside", thing: "shrub" },
      colour: "#9f1239",
      face: "\u{1F468}",
    },
    {
      id: "G",
      name: "Greg",
      pronoun: "er",
      clue: { kind: "column", col: 4 },
      colour: "#ea580c",
      face: "\u{1F474}",
    },
    {
      id: "H",
      name: "Harmony",
      pronoun: "sie",
      clue: { kind: "crowd", others: 3 },
      colour: "#4338ca",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "V",
      name: "Valeria",
      pronoun: "sie",
      clue: { kind: "victim" },
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
      cross: outside(SUMMER_AREAS, "R", { from: 4, to: 7 }),
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
};

/** Every case, in the order they are offered. */
export const LEVELS: readonly Level[] = [SUMMER_ISLES];
