/**
 * Die Geisterfregatte: a barren island, a cliff and the sea around them,
 * where a ghost ship lay at the time of the murder - and then vanished.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/38.png`, no
 * solution sheet - the solved grid and the culprit are pencilled in on the
 * photographed page, and the solver proves it is the only solution).
 * Vanya is the victim; whoever was alone with her killed her. No estates in
 * this case.
 *
 * The map is six by six. The ghost frigate is not drawn: it lay somewhere in
 * the water as a block three fields wide and two high, not turned and not
 * over a boulder ({@link frigateAt}); finding where is part of the case.
 * Blood puddles can be stood on; the barrel, the crate and the boulders
 * cannot.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import { about, beside, counting, on, row, victim } from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** How wide and how high the ghost frigate is. */
const FRIGATE = { rows: 2, cols: 3 };

/**
 * The fields of the ghost frigate with its top left field here, or null
 * where it cannot lie - off the water or over a boulder.
 */
function frigateAt(c: Context, top: Cell): readonly Cell[] | null {
  const cells: Cell[] = [];
  for (let r = 0; r < FRIGATE.rows; r += 1) {
    for (let k = 0; k < FRIGATE.cols; k += 1) {
      cells.push({ row: top.row + r, col: top.col + k });
    }
  }
  const fits = cells.every(
    (cell) => c.areaOf(cell) === "W" && c.thingAt(cell) !== "boulder",
  );
  return fits ? cells : null;
}

/** Every place the ghost frigate could have lain. */
function frigates(c: Context): readonly (readonly Cell[])[] {
  const found: (readonly Cell[])[] = [];
  for (let r = 0; r < c.rows; r += 1) {
    for (let k = 0; k < c.cols; k += 1) {
      const cells = frigateAt(c, { row: r, col: k });
      if (cells !== null) {
        found.push(cells);
      }
    }
  }
  return found;
}

/** Whether somebody stands on one of these fields. */
function holds(c: Context, cells: readonly Cell[], id: string): boolean {
  const there = c.cellOf(id);
  return (
    there !== undefined &&
    cells.some((cell) => cell.row === there.row && cell.col === there.col)
  );
}

/** How many people stand on these fields. */
function peopleOn(c: Context, cells: readonly Cell[]): number {
  return c.people().filter((id) => holds(c, cells, id)).length;
}

/** Whether the ghost frigate could lie with Alvin on it, not alone. */
function alvinAboard(c: Context, cells: readonly Cell[]): boolean {
  return holds(c, cells, "A") && peopleOn(c, cells) > 1;
}

/** Whether the ghost frigate can lie so that every clue about it holds. */
function frigateFits(c: Context): boolean {
  return frigates(c).some(
    (cells) => alvinAboard(c, cells) && !holds(c, cells, "B"),
  );
}

/** The case. */
export const THE_GHOST_FRIGATE: Level = {
  id: "the-ghost-frigate",
  name: "Die Geisterfregatte",
  series: { book: "timeTravel", number: 38 },
  story: "Nicht einmal ein Geisterschiff sollte einen Tatort verlassen.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "I",
      name: "Öde Insel",
      at: "auf der öden Insel",
      ground: "sand",
      island: true,
      label: { row: 0, col: 3 },
    },
    {
      key: "K",
      name: "Klippe",
      at: "auf der Klippe",
      ground: "stone",
      tint: "#d9d2ea",
      label: { row: 5, col: 0 },
      labelOverhang: true,
    },
    {
      key: "W",
      name: "Wasser",
      at: "im Wasser",
      ground: "water",
      label: { row: 5, col: 4 },
    },
  ],
  areaMap: ["WWWIII", "WWWWWI", "KWWWWI", "KKWWWW", "KKWWWW", "KKWWWW"],
  thingMap: [".....b", "....od", "......", "od....", "......", "oco..."],
  things: {
    b: "barrel",
    c: "woodCrate",
    d: "blood",
    o: "boulder",
  },
  suspects: [
    {
      id: "A",
      name: "Alvin",
      pronoun: "er",
      clue: {
        text: "Er war in der Geisterfregatte. Er war nicht allein.",
        ...counting((c) => frigates(c).some((cells) => alvinAboard(c, cells))),
      },
      colour: "#b91c1c",
      face: "\u{1F9D4}",
    },
    {
      id: "B",
      name: "Blanka",
      pronoun: "sie",
      clue: {
        text: "Sie war in der untersten Zeile. Sie war nicht in der Geisterfregatte.",
        ...row(6),
      },
      colour: "#15803d",
      face: "\u{1F469}",
    },
    {
      id: "C",
      name: "Celeste",
      pronoun: "sie",
      clue: {
        text: "Sie war auf derselben Diagonale wie Blanka.",
        ...about(["B"], (c) => {
          const blanka = c.cellOf("B");
          return (
            blanka !== undefined &&
            Math.abs(blanka.row - c.cell.row) ===
              Math.abs(blanka.col - c.cell.col)
          );
        }),
      },
      colour: "#0e7490",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "D",
      name: "Dusty",
      pronoun: "er",
      clue: { text: "Er war neben dem Fass.", ...beside("barrel") },
      colour: "#6366f1",
      face: "\u{1F468}\u{1F3FE}",
    },
    {
      id: "E",
      name: "Enoch",
      pronoun: "er",
      clue: { text: "Er war auf einer Blutlache.", ...on("blood") },
      colour: "#a16207",
      face: "\u{1F468}‍\u{1F9B3}",
    },
    {
      id: "V",
      name: "Vanya",
      pronoun: "sie",
      clue: {
        text: "Das Opfer. Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#57534e",
      face: "\u{1F469}‍\u{1F9B2}",
    },
  ],
  rules: [
    {
      text: "Die Geisterfregatte (3 x 2 Felder) lag zur Tatzeit im Wasser und verschwand dann: nicht gedreht, nicht über einem Felsen. Wer auf ihren Feldern stand, war in der Geisterfregatte.",
      check: frigateFits,
    },
  ],
  hints: [
    {
      text: "Alvin war in der Geisterfregatte und nicht allein: Mit ihm stand eine zweite Person darin, in einer anderen Zeile. Dusty (auf der Insel), Enoch (auf einer Blutlache) und Blanka scheiden aus - es ist Celeste oder Vanya. Stünde Enoch in R2 C6, stünden Dusty in R1 C5 und Blanka in R6 C4; für die beiden blieben nur Wasserfelder in C1 bis C3 der Zeilen 3 bis 5, und keine Lage der Fregatte fasst zwei davon in verschiedenen Spalten. Enoch steht also auf der Blutlache in R4 C2.",
      place: { E: { row: 3, col: 1 } },
    },
    {
      text: "Die Fregatte braucht zwei freie Zeilen untereinander - nicht R4 (Enoch) und nicht R6 (Blanka): R1/R2 oder R2/R3. In R1/R2 hätte Dusty keine Zeile mehr, denn er steht neben dem Fass in R1 C5 oder R2 C6. Die Fregatte liegt also über R2-R3 C2-C4, Alvin und seine Begleitung stehen in C3 und C4, und Dusty steht in R1 C5.",
      place: { D: { row: 0, col: 4 } },
    },
    {
      text: "Blanka steht in der untersten Zeile: C1 bis C3 sind Felsen oder die Kiste, C4 ist in der Fregatte besetzt, C5 ist Dustys Spalte - sie steht in R6 C6. Die letzte Person steht im letzten freien Feld, R5 C1.",
      place: { B: { row: 5, col: 5 } },
    },
    {
      text: "Celeste steht auf Blankas Diagonale. R5 C1 liegt nicht darauf, also ist sie Alvins Begleitung in der Fregatte, auf R3 C3. Alvin steht in R2 C4.",
      place: { C: { row: 2, col: 2 }, A: { row: 1, col: 3 } },
    },
    {
      text: "Vanya steht in R5 C1 auf der Klippe - allein mit Enoch. Enoch ist der Mörder!",
      place: { V: { row: 4, col: 0 } },
    },
  ],
  solution: {
    A: { row: 1, col: 3 },
    B: { row: 5, col: 5 },
    C: { row: 2, col: 2 },
    D: { row: 0, col: 4 },
    E: { row: 3, col: 1 },
    V: { row: 4, col: 0 },
  },
};
