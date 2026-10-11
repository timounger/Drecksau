/**
 * Trübsal und Tristesse: a bedroom, a dining room, a living room, a guest
 * room, a kitchen and a bathroom of a gloomy house, with a murdered guest.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/52. Trübsal und Tristesse.png`,
 * no solution sheet - the solver proves the one solution, with the culprit
 * pencilled in on the photographed page).
 * Oisín is the victim; whoever was alone with him killed him.
 *
 * The armchairs are the chairs; they, the beds and the light framed rugs
 * (the squares in the dining room and the bathroom) can be stood on. The
 * dark tables (the long dressers and the cabinet among them), the shelves,
 * the TVs and the plants cannot. A field is in a corner of its room when the
 * room's border runs along two of its sides that meet: one above or below
 * it, one to its left or right.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  about,
  alone,
  all,
  counting,
  inArea,
  on,
  victim,
} from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** Everybody else in the suspect's area, with their fields. */
function othersInRoom(c: Context): readonly { id: string; cell: Cell }[] {
  const area = c.areaOf(c.cell) ?? "";
  return c.peopleIn(area).flatMap((id) => {
    const cell = c.cellOf(id);
    return id === c.self || cell === undefined ? [] : [{ id, cell }];
  });
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

/** Whether nobody but the suspect lay on a bed. */
function onlyOneOnABed(c: Context): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return id === c.self || there === undefined || !c.is(there, "bed");
  });
}

/** Whether one row lies south of another's, by suspect id. */
function southOf(id: string): (c: Context) => boolean {
  return (c: Context): boolean => {
    const there = c.cellOf(id);
    return there !== undefined && c.cell.row > there.row;
  };
}

/**
 * For the solver only: whether a partial placement can still be finished -
 * nobody with Edgar, nobody but Dylan on a bed, at most one with Oisín.
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
  const waiting = c.level.suspects.filter(
    (one) => !placed.some((there) => there.id === one.id),
  );
  const free = (cell: Cell): boolean =>
    c.standable(cell) &&
    !placed.some(
      (there) => there.cell.row === cell.row || there.cell.col === cell.col,
    );
  // Whether somebody else in the suspect's room is, or still can be, such a one.
  const canHave = (
    id: string,
    test: (cell: Cell, other: string) => boolean,
  ): boolean => {
    const own = placed.find((one) => one.id === id);
    return (
      own === undefined ||
      placed.some(
        (one) =>
          one.id !== id && one.area === own.area && test(one.cell, one.id),
      ) ||
      c
        .cellsOf(own.area ?? "")
        .some(
          (cell) => free(cell) && waiting.some((other) => test(cell, other.id)),
        )
    );
  };
  return (
    placed.every((one) => one.id === "D" || !c.is(one.cell, "bed")) &&
    placed.every((one) => one.id === "E" || one.area !== "B") &&
    company("O") <= 1 &&
    canHave("A", (cell, other) => c.has(other, "woman") && c.is(cell, "rug")) &&
    canHave("B", (cell) => c.is(cell, "seat")) &&
    canHave("F", (cell) => inCorner(c, cell)) &&
    canHave("H", (cell) => c.beside(cell, "tv")) &&
    canHave("O", () => true)
  );
}

/** The other fields of a field's row and column on the nine by nine map. */
function restOf(row: number, col: number): readonly Cell[] {
  const size = 9;
  return Array.from({ length: size }, (_, at) => at).flatMap((at) => [
    ...(at === col ? [] : [{ row, col: at }]),
    ...(at === row ? [] : [{ row: at, col }]),
  ]);
}

/** The case. */
export const GLOOM_AND_DOOM: Level = {
  id: "gloom-and-doom",
  name: "Trübsal und Tristesse",
  series: { book: "original", number: 52 },
  story:
    "Praktischerweise sind schon alle passend für eine Beerdigung gekleidet.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "S",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "stone",
      tint: "#d9d0dc",
      label: { row: 3, col: 1 },
    },
    {
      key: "E",
      name: "Esszimmer",
      at: "im Esszimmer",
      ground: "floor",
      tint: "#c9c3dc",
      label: { row: 2, col: 5 },
    },
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "stone",
      tint: "#ecebdc",
      label: { row: 7, col: 0 },
    },
    {
      key: "G",
      name: "Gästezimmer",
      at: "im Gästezimmer",
      ground: "stone",
      tint: "#e2cfd6",
      label: { row: 5, col: 6 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "stone",
      tint: "#b9b0c2",
      label: { row: 8, col: 3 },
    },
    {
      key: "B",
      name: "Badezimmer",
      at: "im Badezimmer",
      ground: "floor",
      tint: "#ece2c8",
      label: { row: 8, col: 6 },
    },
  ],
  areaMap: [
    ".SSSEEEEE",
    "SSSSEEEE.",
    "SSSSEEEE.",
    "SSSSGGGGG",
    "WWWWGGGGG",
    "WWWWGGGG.",
    "WWWKKBBBB",
    "WWKKKBBBB",
    "..KKKBBBB",
  ],
  thingMap: [
    ".p.....r.",
    "bb.v.ttt.",
    "bb....cc.",
    ".s..b....",
    "cv..bs..p",
    "tttsc....",
    "c.p..c..r",
    ".p.t..s.t",
    ".....c..r",
  ],
  things: {
    b: "bed",
    c: "chair",
    p: "plant",
    r: "rug",
    s: "shelf",
    t: "table",
    v: "tv",
  },
  pieces: [
    { at: { row: 1, col: 0 }, rows: 1, cols: 2 },
    { at: { row: 2, col: 0 }, rows: 1, cols: 2 },
    { at: { row: 3, col: 4 }, rows: 2, cols: 1 },
    { at: { row: 1, col: 5 }, rows: 1, cols: 3 },
    { at: { row: 5, col: 0 }, rows: 1, cols: 3 },
  ],
  suspects: [
    {
      id: "A",
      name: "Adrianna",
      pronoun: "sie",
      clue: {
        text: "Eine weitere Frau war in ihrem Raum, die auf einem Teppich war.",
        ...counting((c) =>
          othersInRoom(c).some(
            (other) => c.has(other.id, "woman") && c.is(other.cell, "rug"),
          ),
        ),
      },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Bryan",
      pronoun: "er",
      clue: {
        text: "Er war in einem Raum mit jemandem, der auf einem Stuhl saß.",
        ...counting((c) =>
          othersInRoom(c).some((other) => c.is(other.cell, "seat")),
        ),
      },
      colour: "#15803d",
      face: "\u{1F9D1}",
    },
    {
      id: "C",
      name: "Conrad",
      pronoun: "er",
      clue: {
        text: "Er war südlich von Bryan.",
        ...about(["B"], southOf("B")),
      },
      colour: "#0e7490",
      face: "\u{1F9D1}",
    },
    {
      id: "D",
      name: "Dylan",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person auf einem Bett.",
        ...all(on("bed"), counting(onlyOneOnABed)),
      },
      colour: "#6366f1",
      face: "\u{1F468}",
    },
    {
      id: "E",
      name: "Edgar",
      pronoun: "er",
      clue: {
        text: "Er war allein im Badezimmer.",
        ...all(inArea("B"), alone()),
      },
      colour: "#7c3aed",
      face: "\u{1F468}",
    },
    {
      id: "F",
      name: "Filia",
      pronoun: "sie",
      clue: {
        text: "Jemand anderes in ihrem Raum war in einer Ecke.",
        ...counting((c) =>
          othersInRoom(c).some((other) => inCorner(c, other.cell)),
        ),
      },
      colour: "#9f1239",
      face: "\u{1F469}",
    },
    {
      id: "G",
      name: "Gionna",
      pronoun: "sie",
      clue: {
        text: "Sie war südlich von Conrad.",
        ...about(["C"], southOf("C")),
      },
      colour: "#ea580c",
      face: "\u{1F475}",
    },
    {
      id: "H",
      name: "Haven",
      pronoun: "sie",
      clue: {
        text: "Sie war in einem Raum mit jemandem, der neben einem Fernseher war.",
        ...counting((c) =>
          othersInRoom(c).some((other) => c.beside(other.cell, "tv")),
        ),
      },
      colour: "#4338ca",
      face: "\u{1F469}",
    },
    {
      id: "O",
      name: "Oisín",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F9D1}",
    },
  ],
  hints: [
    {
      text: "Adrianna war in einem Raum mit einer weiteren Frau auf einem Teppich. Die Teppiche liegen in R1 C8 im Esszimmer und in R7 C9 und R9 C9 im Badezimmer - dort war Edgar allein. Also war Adrianna im Esszimmer, und eine andere Frau stand in R1 C8. Gionna war südlich von Conrad, der südlich von Bryan war - nicht in R1. Haven war in einem Raum mit jemandem neben einem Fernseher - im Esszimmer steht keiner. Es war Filia. Blockiere den Rest von R1 und C8.",
      place: { F: { row: 0, col: 7 } },
      cross: restOf(0, 7),
    },
    {
      text: "Jemand anderes in Filias Raum war in einer Ecke. Die Ecken des Esszimmers sind R1 C5, R1 C9, R3 C5 und R3 C8 - R1 und C8 sind blockiert, es bleibt R3 C5. Adrianna war auch im Esszimmer: Stünde jemand anderes in R3 C5, blieben ihr nur R2 C5 oder Felder in R3 - dieselbe Spalte oder Reihe. Adrianna stand also selbst in R3 C5.",
      place: { A: { row: 2, col: 4 } },
      cross: restOf(2, 4),
    },
    {
      text: "Dylan war die einzige Person auf einem Bett. Die Betten in R3 und C5 sind blockiert - Dylan lag in R2 C1 oder R2 C2. Edgar war allein im Badezimmer. Die Spalten C6, C7 und C9 brauchen noch drei Personen: außer Edgar im Badezimmer geht das nur im Gästezimmer (R4 bis R6). Dort waren also zwei Personen. In R6 ist nur das Gästezimmer frei (im Wohnzimmer stehen dort Tisch und Regal): R6 C6 oder R6 C7.",
      cross: [
        { row: 3, col: 4 },
        { row: 4, col: 4 },
      ],
    },
    {
      text: "Haven war in einem Raum mit jemandem neben einem Fernseher. Neben dem Fernseher im Schlafzimmer sind R1 C4 und R3 C4 blockiert, und R2 gehört Dylan. Also war Haven im Wohnzimmer, und jemand stand in R5 C1 oder R5 C3 - Haven selbst in R7 C1, R7 C2 oder R8 C1. Bryan war in einem Raum mit jemandem, der auf einem Stuhl saß: Die Stühle im Esszimmer liegen in R3, der im Gästezimmer in C5, und im Badezimmer war Edgar allein - es bleiben R5 C1 und R7 C1 im Wohnzimmer. Bryan war im Wohnzimmer.",
    },
    {
      text: "Die beiden im Gästezimmer stehen in R4 und R6 (R5 gehört dem Wohnzimmer). In R7 bis R9 bleiben Edgar, Haven und eine weitere Person. Bryan war nördlich von Conrad, Conrad nördlich von Gionna: Stünde Bryan in R7 oder R8, wäre unter ihm kein Platz für beide. Bryan stand also in R5. Stünde Conrad in R7 bis R9, wäre südlich von ihm kein Platz für Gionna - Conrad stand in R6 im Gästezimmer, Gionna in R7 bis R9 und Oisín in R4 im Gästezimmer. Säße Bryan auf R5 C1, bliebe für einen anderen auf einem Stuhl nur R7 C1 in derselben Spalte - Bryan stand in R5 C3, und jemand saß in R7 C1.",
      place: { B: { row: 4, col: 2 } },
      cross: restOf(4, 2),
    },
    {
      text: "R7 C1 nimmt C1 - Dylan lag in R2 C2. Haven bleibt nur C1, also saß sie selbst in R7 C1. Gionna bleibt in C1 bis C4 nur C4: R9 C4 in der Küche. Edgar stand in R8 C6, Conrad in R6 C7 und Oisín in R4 C9. Im Gästezimmer war Oisín allein mit Conrad - Conrad ist der Mörder!",
      place: {
        D: { row: 1, col: 1 },
        H: { row: 6, col: 0 },
        G: { row: 8, col: 3 },
        E: { row: 7, col: 5 },
        C: { row: 5, col: 6 },
        O: { row: 3, col: 8 },
      },
    },
  ],
  prune: stillPossible,
  solution: {
    A: { row: 2, col: 4 },
    B: { row: 4, col: 2 },
    C: { row: 5, col: 6 },
    D: { row: 1, col: 1 },
    E: { row: 7, col: 5 },
    F: { row: 0, col: 7 },
    G: { row: 8, col: 3 },
    H: { row: 6, col: 0 },
    O: { row: 3, col: 8 },
  },
};
