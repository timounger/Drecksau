/**
 * Zwillingshäuser: two houses built on the same plan in Kraków - each with a
 * bathroom, a living room, a garden, a bedroom and a kitchen - with a
 * murdered woman.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 3 - Auf Weltreise/75. Zwillingshäuser.png`,
 * no solution sheet - the solver proves the solution is the only one).
 * Otylia is the victim; whoever was alone with her killed her.
 *
 * **Every house is a grid of its own**: five by five, one person per row and
 * column of the house, five people in each. The engine knows one grid only,
 * so the houses are laid out corner to corner along the diagonal of a ten by
 * ten map: house A in rows and columns 1-5, house B in 6-10. Then one person
 * per row and column of the map is the same as one per row and column of
 * each house. Each room of house A has a twin of the same name in house B
 * ({@link HOUSE}); they are still two areas. "The field at the same position
 * in the other house" is five rows and five columns away.
 *
 * The beds and the armchairs - the chairs - can be stood on; the tables, the
 * TVs, the plant and the flowers cannot. A field is in a corner of its area
 * when the area's border runs along two of its sides that meet.
 */
import {
  about,
  all,
  beside,
  counting,
  inArea,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** The size of one house. */
const HOUSE = 5;

/** The men among the suspects. */
const MEN: readonly string[] = ["A", "F", "G", "H", "I"];

/** The corners of house A's grid. */
const CORNERS_OF_A: readonly Cell[] = [
  { row: 0, col: 0 },
  { row: 0, col: HOUSE - 1 },
  { row: HOUSE - 1, col: 0 },
  { row: HOUSE - 1, col: HOUSE - 1 },
];

/** The case. */
export const TWIN_HOUSES: Level = {
  id: "twin-houses",
  name: "Zwillingshäuser",
  series: { book: "worldTravel", number: 75 },
  story: "Die Mordfälle scheinen alle auf demselben Plan zu basieren.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "b",
      name: "Badezimmer (A)",
      at: "im Badezimmer von Haus A",
      ground: "floor",
      tint: "#b59c84",
      label: { row: 1, col: 0 },
    },
    {
      key: "w",
      name: "Wohnzimmer (A)",
      at: "im Wohnzimmer von Haus A",
      ground: "floor",
      tint: "#c2ab94",
      label: { row: 4, col: 1 },
    },
    {
      key: "g",
      name: "Garten (A)",
      at: "im Garten von Haus A",
      ground: "grass",
      tint: "#a9cf8f",
      label: { row: 0, col: 3 },
    },
    {
      key: "s",
      name: "Schlafzimmer (A)",
      at: "im Schlafzimmer von Haus A",
      ground: "floor",
      tint: "#d1bba4",
      label: { row: 3, col: 3 },
    },
    {
      key: "k",
      name: "Küche (A)",
      at: "in der Küche von Haus A",
      ground: "stone",
      tint: "#ddd6cc",
      label: { row: 4, col: 4 },
    },
    {
      key: "B",
      name: "Badezimmer (B)",
      at: "im Badezimmer von Haus B",
      ground: "floor",
      tint: "#b59c84",
      label: { row: 6, col: 5 },
    },
    {
      key: "W",
      name: "Wohnzimmer (B)",
      at: "im Wohnzimmer von Haus B",
      ground: "floor",
      tint: "#c2ab94",
      label: { row: 9, col: 6 },
    },
    {
      key: "G",
      name: "Garten (B)",
      at: "im Garten von Haus B",
      ground: "grass",
      tint: "#a9cf8f",
      label: { row: 5, col: 8 },
    },
    {
      key: "S",
      name: "Schlafzimmer (B)",
      at: "im Schlafzimmer von Haus B",
      ground: "floor",
      tint: "#d1bba4",
      label: { row: 8, col: 8 },
    },
    {
      key: "K",
      name: "Küche (B)",
      at: "in der Küche von Haus B",
      ground: "stone",
      tint: "#ddd6cc",
      label: { row: 9, col: 9 },
    },
  ],
  areaMap: [
    "bwggg.....",
    "bwssg.....",
    "wwssg.....",
    "wwssk.....",
    "wwwkk.....",
    ".....BWGGG",
    ".....BWSSG",
    ".....WWSSG",
    ".....WWSSK",
    ".....WWWKK",
  ],
  thingMap: [
    "p.f.......",
    "hae.f.....",
    "..ea......",
    "t.........",
    ".hh.a.....",
    ".....p.f..",
    ".....hae.f",
    ".......ea.",
    ".....t....",
    "......hh.a",
  ],
  things: {
    a: "table",
    e: "bed",
    f: "flowers",
    h: "chair",
    p: "plant",
    t: "tv",
  },
  pieces: [
    { at: { row: 1, col: 2 }, rows: 2, cols: 1 },
    { at: { row: 6, col: 7 }, rows: 2, cols: 1 },
  ],
  suspects: [
    {
      id: "A",
      name: "Andrzej",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person, die in einem der beiden Häuser auf einem Bett war.",
        ...all(on("bed"), counting(onlyOneOnABed)),
      },
      colour: "#7c2d12",
      face: "\u{1F468}",
    },
    {
      id: "B",
      name: "Bogna",
      pronoun: "sie",
      clue: { text: "Sie war in einem Garten.", ...inArea("g", "G") },
      colour: "#15803d",
      face: "\u{1F469}",
    },
    {
      id: "C",
      name: "Celinka",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Fernseher.", ...beside("tv") },
      colour: "#0369a1",
      face: "\u{1F471}\u{200D}\u{2640}\u{FE0F}",
    },
    {
      id: "D",
      name: "Dorota",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Tisch.", ...beside("table") },
      colour: "#334155",
      face: "\u{1F469}\u{200D}\u{1F9B3}",
    },
    {
      id: "E",
      name: "Elżbieta",
      pronoun: "sie",
      clue: {
        text: "Sie war in einer Ecke des Rasters von Haus A.",
        ...own(inCornerOfA),
      },
      colour: "#a21caf",
      face: "\u{1F475}",
    },
    {
      id: "F",
      name: "Filip",
      pronoun: "er",
      clue: {
        text: "Er war in Haus B. Er war nicht in einer Ecke seines Bereichs.",
        ...own((c) => inHouseB(c.cell) && !inCorner(c, c.cell)),
      },
      colour: "#a16207",
      face: "\u{1F468}\u{200D}\u{1F9B1}",
    },
    {
      id: "G",
      name: "Grzegorz",
      pronoun: "er",
      clue: { text: "Er war in einer Küche.", ...inArea("k", "K") },
      colour: "#1e3a8a",
      face: "\u{1F60E}",
    },
    {
      id: "H",
      name: "Hubi",
      pronoun: "er",
      clue: {
        text: "Er saß auf einem Stuhl. Er war im selben Haus wie Bogna.",
        ...all(on("chair"), about(["B"], sameHouseAsBogna)),
      },
      colour: "#6d28d9",
      face: "\u{1F9D1}",
    },
    {
      id: "I",
      name: "Ignacy",
      pronoun: "er",
      clue: {
        text: "Er war in einem Schlafzimmer. Das Feld an derselben Position im anderen Haus war nicht besetzt.",
        ...all(inArea("s", "S"), counting(twinFieldEmpty)),
      },
      colour: "#78716c",
      face: "\u{1F474}",
    },
    {
      id: "O",
      name: "Otylia",
      pronoun: "sie",
      clue: {
        text: "Das Opfer. Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#b91c1c",
      face: "\u{1F469}\u{200D}\u{1F9B1}",
    },
  ],
  rules: [
    {
      text: "In Haus A waren mehr Männer als in Haus B.",
      check: moreMenInA,
    },
  ],
  hints: [
    {
      text: "Haus A liegt in R1-R5 und C1-C5, Haus B in R6-R10 und C6-C10; jedes Haus hat eine Person pro Zeile und Spalte. Filip ist in Haus B. Damit in Haus A mehr Männer sind, darf von Andrzej, Grzegorz, Hubi und Ignacy höchstens einer in Haus B sein.",
    },
    {
      text: "Elżbieta war in einer Ecke von Haus A: R1 C1 ist eine Pflanze, R5 C5 ein Tisch - also R1 C5 oder R5 C1. In R1 C5 fände Bogna im Garten von Haus A keinen Platz (R1 C4 liegt in Zeile 1, R3 C5 in Spalte 5); in R5 C1 fände Hubi keinen Stuhl (R2 C1 in Spalte 1, R5 C2 und R5 C3 in Zeile 5). Bogna und Hubi sind also zusammen in Haus B - Hubi ist dort der eine Mann neben Filip, und Andrzej, Grzegorz und Ignacy sind in Haus A.",
    },
    {
      text: "In Haus A liegt Andrzej auf einem Bett in Spalte 3. Ignacy ist im Schlafzimmer, nicht auf dem Bett: R2 C4, R4 C3 oder R4 C4 - ohne Spalte 3 bleibt Spalte 4. Grzegorz in der Küche (R4 C5 oder R5 C4) steht also in R4 C5. Dann steht Ignacy in R2 C4, Andrzej liegt in R3 C3 und Elżbieta steht in R5 C1.",
      place: {
        G: { row: 3, col: 4 },
        I: { row: 1, col: 3 },
        A: { row: 2, col: 2 },
        E: { row: 4, col: 0 },
      },
    },
    {
      text: "In Haus A bleibt nur R1 C2 - dort ist kein Fernseher daneben, also ist Celinka in Haus B. In Zeile 7 von Haus B ist R7 C7 ein Tisch, R7 C8 ein Bett (nur Andrzej), R7 C9 das Feld an Ignacys Position (frei) und R7 C10 sind Blumen: Jemand sitzt in R7 C6. Celinka neben dem Fernseher in R9 C6 steht also in R9 C7 (R8 C6 und R10 C6 liegen in Spalte 6). Filip, nicht in einer Ecke, kann nach R8 C7, R9 C7, R10 C7 oder R6 C9 - ohne Spalte 7 bleibt R6 C9. Bogna im Garten steht in R8 C10.",
      place: {
        C: { row: 8, col: 6 },
        F: { row: 5, col: 8 },
        B: { row: 7, col: 9 },
      },
    },
    {
      text: "In Haus B bleiben R7 C6 und R10 C8 für Hubi und eine Frau. Dorota hat dort keinen Tisch neben sich - sie steht in Haus A in R1 C2, neben dem Tisch. Die Frau ist Otylia. Allein im Badezimmer hätte sie niemanden bei sich, also sitzt sie in R10 C8 im Wohnzimmer, allein mit Celinka, und Hubi in R7 C6. Celinka ist die Mörderin!",
      place: {
        D: { row: 0, col: 1 },
        H: { row: 6, col: 5 },
        O: { row: 9, col: 7 },
      },
    },
  ],
  solution: {
    A: { row: 2, col: 2 },
    B: { row: 7, col: 9 },
    C: { row: 8, col: 6 },
    D: { row: 0, col: 1 },
    E: { row: 4, col: 0 },
    F: { row: 5, col: 8 },
    G: { row: 3, col: 4 },
    H: { row: 6, col: 5 },
    I: { row: 1, col: 3 },
    O: { row: 9, col: 7 },
  },
};

/** Whether a field lies in house B. */
function inHouseB(cell: Cell): boolean {
  return cell.row >= HOUSE;
}

/** Whether nobody but the suspect stood on a bed. */
function onlyOneOnABed(c: Context): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return id === c.self || there === undefined || !c.is(there, "bed");
  });
}

/** Whether the suspect stood in a corner of house A's grid. */
function inCornerOfA(c: Context): boolean {
  return CORNERS_OF_A.some(
    (corner) => corner.row === c.cell.row && corner.col === c.cell.col,
  );
}

/** Whether a field lies in a corner of its area. */
function inCorner(c: Context, cell: Cell): boolean {
  const area = c.areaOf(cell);
  const outside = (row: number, col: number): boolean =>
    c.areaOf({ row, col }) !== area;
  const vertical =
    outside(cell.row - 1, cell.col) || outside(cell.row + 1, cell.col);
  const horizontal =
    outside(cell.row, cell.col - 1) || outside(cell.row, cell.col + 1);
  return vertical && horizontal;
}

/** Whether Hubi stood in the same house as Bogna. */
function sameHouseAsBogna(c: Context): boolean {
  const bogna = c.cellOf("B");
  return bogna !== undefined && inHouseB(bogna) === inHouseB(c.cell);
}

/** Whether nobody stood on the field at Ignacy's position in the other house. */
function twinFieldEmpty(c: Context): boolean {
  const step = inHouseB(c.cell) ? -HOUSE : HOUSE;
  return (
    c.personAt({ row: c.cell.row + step, col: c.cell.col + step }) === null
  );
}

/** Whether more men stood in house A than in house B. */
function moreMenInA(c: Context): boolean {
  const inB = MEN.filter((id) => {
    const there = c.cellOf(id);
    return there !== undefined && inHouseB(there);
  }).length;
  return MEN.length - inB > inB;
}
