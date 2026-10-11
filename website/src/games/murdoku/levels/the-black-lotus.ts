/**
 * Der Schwarze Lotus: a dining room, a guest room, a living room, a kitchen,
 * a bedroom and a bathroom of a villa in a luxury resort, with a murdered
 * guest.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/41. Der Schwarze Lotus.png`,
 * no solution sheet - the solver proves the one solution, with the culprit
 * pencilled in on the photographed page).
 * Osman is the victim; whoever was alone with him killed him.
 *
 * The armchairs are the chairs; they, the beds and the light framed rugs
 * (the squares in the bathroom among them) can be stood on. The dark tables
 * (the long dressers among them), the TVs and the plants cannot. A field is
 * in a corner of its room when the room's border runs along two of its sides
 * that meet: one above or below it, one to its left or right.
 */
import {
  all,
  alone,
  beside,
  cellsWhere,
  counting,
  inArea,
  not,
  on,
  own,
  victim,
} from "../engine/clues";
import { areaAt } from "../engine/rules";
import type { Cell, Context, Level } from "../engine/types";

/** What Hedda was not beside. */
const NOT_BESIDE: readonly string[] = ["chair", "plant", "bed", "table"];

/** Whether a field lies in a corner of its area, given the area of each field. */
function inCorner(areaOf: (cell: Cell) => string | null, cell: Cell): boolean {
  const area = areaOf(cell);
  const outside = (row: number, col: number): boolean =>
    areaOf({ row, col }) !== area;
  const vertical =
    outside(cell.row - 1, cell.col) || outside(cell.row + 1, cell.col);
  const horizontal =
    outside(cell.row, cell.col - 1) || outside(cell.row, cell.col + 1);
  return vertical && horizontal;
}

/** Whether nobody but the suspect sits on a chair. */
function onlyOneOnAChair(c: Context): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return id === c.self || there === undefined || !c.is(there, "chair");
  });
}

/** Everybody else in the suspect's area, with their fields. */
function othersInRoom(c: Context): readonly { id: string; cell: Cell }[] {
  const area = c.areaOf(c.cell) ?? "";
  return c.peopleIn(area).flatMap((id) => {
    const cell = c.cellOf(id);
    return id === c.self || cell === undefined ? [] : [{ id, cell }];
  });
}

/**
 * For the solver only: whether a partial placement can still be finished -
 * nobody but Benedikt on a chair, nobody with Amir, at most one with Osman.
 */
function stillPossible(c: Context): boolean {
  const placed = c.people().flatMap((id) => {
    const cell = c.cellOf(id);
    return cell === undefined ? [] : [{ id, area: c.areaOf(cell), cell }];
  });
  const company = (id: string): number => {
    const own = placed.find((one) => one.id === id);
    return own === undefined
      ? 0
      : placed.filter((one) => one.id !== id && one.area === own.area).length;
  };
  return (
    placed.every((one) => one.id === "B" || !c.is(one.cell, "chair")) &&
    company("A") === 0 &&
    company("O") <= 1
  );
}

/** The case. */
export const THE_BLACK_LOTUS: Level = {
  id: "the-black-lotus",
  name: "Der Schwarze Lotus",
  series: { book: "original", number: 41 },
  story:
    "Ich kann die Villen in diesem Luxusresort nicht empfehlen … hier läuft eine echte Mordserie.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "E",
      name: "Esszimmer",
      at: "im Esszimmer",
      ground: "stone",
      tint: "#dcdde6",
      label: { row: 4, col: 1 },
    },
    {
      key: "G",
      name: "Gästezimmer",
      at: "im Gästezimmer",
      ground: "floor",
      tint: "#e2e3ea",
      label: { row: 1, col: 4 },
    },
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#e6ecf0",
      label: { row: 4, col: 4 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "floor",
      tint: "#dedde8",
      label: { row: 8, col: 1 },
    },
    {
      key: "S",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "floor",
      tint: "#e4ebee",
      label: { row: 8, col: 3 },
    },
    {
      key: "B",
      name: "Badezimmer",
      at: "im Badezimmer",
      ground: "stone",
      tint: "#d8d9e2",
      label: { row: 7, col: 6 },
    },
  ],
  areaMap: [
    "....GGGG.",
    "EEEEGGGG.",
    "EEEEWWWW.",
    "EEEEWWWW.",
    "EEEEWWWW.",
    ".KKSSSBBB",
    ".KKSSSBBB",
    ".KKSSSBBB",
    ".KKSSS...",
  ],
  thingMap: [
    "....ttt..",
    "prrcrbb..",
    ".tt...p..",
    "pcc.pccp.",
    "rrrc..v..",
    "..t.rb..r",
    "..rcrb..p",
    "..t..v..r",
    "...ttt...",
  ],
  things: {
    b: "bed",
    c: "chair",
    p: "plant",
    r: "rug",
    t: "table",
    v: "tv",
  },
  pieces: [
    { at: { row: 0, col: 4 }, rows: 1, cols: 3 },
    { at: { row: 1, col: 1 }, rows: 1, cols: 2 },
    { at: { row: 1, col: 5 }, rows: 1, cols: 2 },
    { at: { row: 2, col: 1 }, rows: 1, cols: 2 },
    { at: { row: 4, col: 0 }, rows: 1, cols: 3 },
    { at: { row: 5, col: 4 }, rows: 2, cols: 1 },
    { at: { row: 5, col: 5 }, rows: 2, cols: 1 },
    { at: { row: 8, col: 3 }, rows: 1, cols: 3 },
  ],
  suspects: [
    {
      id: "A",
      name: "Amir",
      pronoun: "er",
      traits: ["glasses"],
      clue: { text: "Er war allein.", ...alone() },
      colour: "#b91c1c",
      face: "\u{1F474}",
    },
    {
      id: "B",
      name: "Benedikt",
      pronoun: "er",
      traits: ["glasses"],
      clue: {
        text: "Er war die einzige Person, die auf einem Stuhl saß.",
        ...all(on("chair"), counting(onlyOneOnAChair)),
      },
      colour: "#15803d",
      face: "\u{1F468}‍\u{1F9B3}",
    },
    {
      id: "C",
      name: "Carla",
      pronoun: "sie",
      clue: {
        text: "Sie war im Schlafzimmer oder im Gästezimmer.",
        ...inArea("S", "G"),
      },
      colour: "#0e7490",
      face: "\u{1F475}",
    },
    {
      id: "D",
      name: "Danielle",
      pronoun: "sie",
      traits: ["glasses"],
      clue: { text: "Sie war neben einem Bett.", ...beside("bed") },
      colour: "#6366f1",
      face: "\u{1F469}",
    },
    {
      id: "E",
      name: "Elma",
      pronoun: "sie",
      clue: {
        text: "In ihrem Raum war eine weitere Frau neben einem Tisch.",
        ...counting((c) =>
          othersInRoom(c).some(
            (other) =>
              c.has(other.id, "woman") && c.beside(other.cell, "table"),
          ),
        ),
      },
      colour: "#7c3aed",
      face: "\u{1F469}",
    },
    {
      id: "F",
      name: "Felipe",
      pronoun: "er",
      clue: { text: "Er stand nicht auf einem Teppich.", ...not(on("rug")) },
      colour: "#9f1239",
      face: "\u{1F9D4}",
    },
    {
      id: "G",
      name: "Grey",
      pronoun: "er",
      clue: {
        text: "In der Ecke seines Raumes war jemand mit Brille.",
        ...counting((c) =>
          othersInRoom(c).some(
            (other) =>
              c.has(other.id, "glasses") && inCorner(c.areaOf, other.cell),
          ),
        ),
        glow: (level) =>
          cellsWhere(level, (cell) =>
            inCorner((one) => areaAt(level, one)?.key ?? null, cell),
          ),
      },
      colour: "#ea580c",
      face: "\u{1F468}",
    },
    {
      id: "H",
      name: "Hedda",
      pronoun: "sie",
      clue: {
        text: "Sie war nicht neben einem Stuhl, einer Pflanze, einem Bett oder einem Tisch.",
        ...own((c) => NOT_BESIDE.every((what) => !c.beside(c.cell, what))),
      },
      colour: "#4338ca",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "O",
      name: "Osman",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F468}",
    },
  ],
  hints: [
    {
      text: "Neun Personen auf neun Reihen und neun Spalten: In jeder Reihe und jeder Spalte stand genau eine Person. In R1 ist nur R1 C8 frei - dort stand jemand. In R9 ist nur die Küche frei (R9 C2 oder R9 C3), in C9 nur die beiden Teppiche im Badezimmer (R6 C9 oder R8 C9).",
    },
    {
      text: "In R4 stehen nur Pflanzen und Stühle - frei ist sonst nur R4 C4. Benedikts übrige Stühle (R2 C4, R5 C4, R7 C4) liegen alle in C4. Säße er nicht in R4, bliebe für die Person in R4 nur R4 C4 - in seiner Spalte. Benedikt saß also in R4, auf R4 C2, R4 C3, R4 C6 oder R4 C7.",
      cross: [
        { row: 3, col: 3 },
        { row: 1, col: 3 },
        { row: 4, col: 3 },
        { row: 6, col: 3 },
      ],
    },
    {
      text: "Grey: In der Ecke seines Raumes war jemand mit Brille - Amir, Benedikt oder Danielle. Amir war allein, und kein Stuhl in R4 liegt in einer Ecke. Also stand Danielle in einer Ecke neben einem Bett, in Greys Raum: R2 C5 oder R2 C8 im Gästezimmer oder R6 C6 im Schlafzimmer.",
    },
    {
      text: "Wäre Danielle in R6 C6, wäre Grey im Schlafzimmer (R6 bis R8). Elma braucht eine weitere Frau neben einem Tisch: Im Schlafzimmer könnte das nur Carla sein - dafür ist dort mit Danielle und Grey kein Platz. Carla und Elma wären also im Gästezimmer, in R1 und R2. Die Person in C9 müsste in R8 stehen, Grey in R7 C5. Die Reihen R6 bis R8 wären voll, Hedda bliebe nur R9 C2, und Amir wäre allein im Badezimmer. Die Person in R2 nähme C7, und Benedikt, Felipe und Osman blieben C1, C3 und C4 in R3 bis R5 - alle im Esszimmer, Osman mit zwei anderen. Das geht nicht.",
      cross: [{ row: 5, col: 5 }],
    },
    {
      text: "Danielle war also im Gästezimmer, mit Grey. Stünde sie in R2 C8, bliebe Grey nur R1 C8 - in derselben Spalte. Danielle stand in R2 C5, Grey in R1 C8.",
      place: { D: { row: 1, col: 4 }, G: { row: 0, col: 7 } },
    },
    {
      text: "Das Gästezimmer ist voll. Carla war also im Schlafzimmer, und Elma - die eine weitere Frau neben einem Tisch braucht - auch, mit Carla neben dem Tisch in R9: R8 C4 oder R8 C5. C5 ist blockiert, also stand Carla in R8 C4.",
      place: { C: { row: 7, col: 3 } },
    },
    {
      text: "Die Person in C9 stand jetzt in R6 C9 (R8 gehört Carla). Elma bleibt im Schlafzimmer nur das Bett in R7 C6. Die Reihen R6 bis R8 sind voll, im Badezimmer war also nur die Person in R6 C9 - nicht Osman, der war mit jemandem zusammen. Felipe stand nicht auf einem Teppich, Hedda nicht neben der Pflanze, Benedikt saß in R4: Es war Amir.",
      place: { E: { row: 6, col: 5 }, A: { row: 5, col: 8 } },
    },
    {
      text: "Frei sind noch R3, R5 und R9. Hedda kann nur in der Küche oder im Badezimmer sein - es bleibt R9. R9 C3 liegt neben einem Tisch, also stand Hedda in R9 C2.",
      place: { H: { row: 8, col: 1 } },
    },
    {
      text: "Frei sind noch C1, C3 und C7. Säße Benedikt in R4 C3, blieben Felipe und Osman C1 und C7 - in C7 sind R3 und R5 Pflanze und Fernseher. Benedikt saß in R4 C7. In C3 ist nur noch R5 C3 frei, ein Teppich, auf dem Felipe nicht stand: Osman war in R5 C3, Felipe in R3 C1. Im Esszimmer war Osman allein mit Felipe - Felipe ist der Mörder!",
      place: {
        B: { row: 3, col: 6 },
        O: { row: 4, col: 2 },
        F: { row: 2, col: 0 },
      },
    },
  ],
  prune: stillPossible,
  solution: {
    A: { row: 5, col: 8 },
    B: { row: 3, col: 6 },
    C: { row: 7, col: 3 },
    D: { row: 1, col: 4 },
    E: { row: 6, col: 5 },
    F: { row: 2, col: 0 },
    G: { row: 0, col: 7 },
    H: { row: 8, col: 1 },
    O: { row: 4, col: 2 },
  },
};
