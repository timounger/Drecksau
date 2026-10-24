/**
 * Die Zwillingsinseln: two islands with the same six places - frigate,
 * cliff, dock, stash, forest and beach - a sloop and the sea, with a
 * murdered pirate.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/45.png`, no
 * solution sheet - the solved grid and the culprit are pencilled in on the
 * photographed page, and the solver proves it is the only solution).
 * Valora is the victim; whoever was alone with her killed her. No estates
 * in this case.
 *
 * The map is fourteen rows by twelve columns, so two rows stay empty. Each
 * place of the north island has a twin of the same name on the south island
 * ({@link TWINS}); they are still two areas. Rafts can be stood on;
 * barrels, crates, cannons, ropes, chests, palms, bushes, sharks and
 * boulders cannot.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  about,
  all,
  alone,
  beside,
  counting,
  inArea,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** The ships. */
const SHIPS: readonly string[] = ["a", "c", "f"];

/** The docks. */
const DOCKS: readonly string[] = ["m", "M"];

/** Each area with its namesake on the other island. */
const TWINS: Readonly<Record<string, string>> = {
  a: "f",
  f: "a",
  k: "K",
  K: "k",
  m: "M",
  M: "m",
  x: "X",
  X: "x",
  b: "B",
  B: "b",
  p: "P",
  P: "p",
};

/** The rows of the two cannons and of the two chests, from nought. */
const CANNON_ROWS: readonly number[] = [1, 8];
const CHEST_ROWS: readonly number[] = [3, 11];

/** Whether nobody stood in a row. */
function emptyRow(c: Context, row: number): boolean {
  return c.people().every((id) => c.cellOf(id)?.row !== row);
}

/**
 * Whether the suspect's row holds one of two things and the other one's row
 * is empty.
 */
function pairClue(c: Context, rows: readonly number[]): boolean {
  const other = rows.find((one) => one !== c.cell.row);
  return rows.includes(c.cell.row) && other !== undefined && emptyRow(c, other);
}

/** Whether somebody stood on a ship exactly one row north of the suspect. */
function boatOneRowNorth(c: Context): boolean {
  return c.people().some((id) => {
    const there = c.cellOf(id);
    return (
      there !== undefined &&
      there.row === c.cell.row - 1 &&
      SHIPS.includes(c.areaOf(there) ?? "")
    );
  });
}

/** Whether Brina stood in the twin of Igor's area. */
function twinOfIgor(c: Context): boolean {
  const igor = c.cellOf("I");
  const area = igor === undefined ? null : c.areaOf(igor);
  return area !== null && TWINS[area] === c.areaOf(c.cell);
}

/** Whether the other row of a pair is still free of anybody but its owner. */
function otherRowFree(
  c: Context,
  id: string,
  rows: readonly number[],
): boolean {
  const there = c.cellOf(id);
  const other = rows.find((one) => one !== there?.row);
  return there === undefined || other === undefined || emptyRow(c, other);
}

/** Whether the row north of Geoff is still free or holds somebody on a ship. */
function geoffStillFits(c: Context): boolean {
  const geoff = c.cellOf("G");
  return (
    geoff === undefined ||
    c.people().every((id) => {
      const there = c.cellOf(id);
      return (
        there === undefined ||
        there.row !== geoff.row - 1 ||
        SHIPS.includes(c.areaOf(there) ?? "")
      );
    })
  );
}

/**
 * For the solver: whether a partial placement can still be finished -
 * Annalise is still alone, the rows Fenn and Igor need empty still are, and
 * the row north of Geoff still fits.
 */
function stillPossible(c: Context): boolean {
  const annalise = c.cellOf("A");
  return (
    (annalise === undefined ||
      c.peopleIn(c.areaOf(annalise) ?? "").length === 1) &&
    otherRowFree(c, "F", CANNON_ROWS) &&
    otherRowFree(c, "I", CHEST_ROWS) &&
    geoffStillFits(c)
  );
}

/** The case. */
export const TWIN_ISLANDS: Level = {
  id: "twin-islands",
  name: "Die Zwillingsinseln",
  series: { book: "timeTravel", number: 45 },
  story: "Hier spielt jemand ein doppeltes Spiel.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "a",
      name: "Fregatte (Nord)",
      at: "auf der Fregatte im Norden",
      ground: "floor",
      tint: "#e8dcc4",
      label: { row: 1, col: 1 },
    },
    {
      key: "c",
      name: "Schaluppe",
      at: "auf der Schaluppe",
      ground: "floor",
      tint: "#e8dcc4",
      label: { row: 0, col: 7 },
    },
    {
      key: "k",
      name: "Klippe (Nord)",
      at: "auf der Klippe im Norden",
      ground: "stone",
      tint: "#d9d2ea",
      label: { row: 1, col: 5 },
    },
    {
      key: "m",
      name: "Steg (Nord)",
      at: "auf dem Steg im Norden",
      ground: "floor",
      tint: "#e6d2d6",
      label: { row: 5, col: 1 },
    },
    {
      key: "x",
      name: "Versteck (Nord)",
      at: "im Versteck im Norden",
      ground: "grass",
      tint: "#c4dadf",
      label: { row: 4, col: 2 },
    },
    {
      key: "b",
      name: "Wald (Nord)",
      at: "im Wald im Norden",
      ground: "grass",
      tint: "#cfe6d6",
      label: { row: 5, col: 3 },
    },
    {
      key: "p",
      name: "Strand (Nord)",
      at: "am Strand im Norden",
      ground: "sand",
      tint: "#f4f1ea",
      label: { row: 5, col: 8 },
    },
    {
      key: "f",
      name: "Fregatte (Süd)",
      at: "auf der Fregatte im Süden",
      ground: "floor",
      tint: "#e8dcc4",
      label: { row: 10, col: 0 },
    },
    {
      key: "K",
      name: "Klippe (Süd)",
      at: "auf der Klippe im Süden",
      ground: "stone",
      tint: "#d9d2ea",
      label: { row: 12, col: 7 },
    },
    {
      key: "M",
      name: "Steg (Süd)",
      at: "auf dem Steg im Süden",
      ground: "floor",
      tint: "#e6d2d6",
      label: { row: 9, col: 9 },
    },
    {
      key: "X",
      name: "Versteck (Süd)",
      at: "im Versteck im Süden",
      ground: "grass",
      tint: "#c4dadf",
      label: { row: 11, col: 6 },
    },
    {
      key: "B",
      name: "Wald (Süd)",
      at: "im Wald im Süden",
      ground: "grass",
      tint: "#cfe6d6",
      label: { row: 10, col: 8 },
    },
    {
      key: "P",
      name: "Strand (Süd)",
      at: "am Strand im Süden",
      ground: "sand",
      tint: "#f4f1ea",
      label: { row: 11, col: 1 },
    },
    {
      key: "W",
      name: "Wasser",
      at: "im Wasser",
      ground: "water",
      label: { row: 13, col: 6 },
    },
  ],
  areaMap: [
    "WaaaWWWccWWW",
    "WaaakkkkkWWW",
    "WWmmxbbkppWW",
    "WmmxxbbbpppW",
    "WmxxxbbbbppW",
    "WmbbbbbpppWW",
    "WWWWWbbpWWWW",
    "WWWWWWWWWWWW",
    "ffWBBBBBBMWW",
    "ffPPBBBBBMMW",
    "ffPPBXXBBBMW",
    "WPPBBXXXKKMW",
    "WWPBBXKKKKWW",
    "WWWWWWWWWWWW",
  ],
  thingMap: [
    "............",
    "..onrc..r.s.",
    "............",
    "f.c.tp.u...b",
    ".....r...c..",
    "............",
    ".s..........",
    "...........r",
    ".n..pu.up..f",
    "....b...u...",
    "ob.....p....",
    "..b.pt......",
    ".......cr...",
    "f...s....r..",
  ],
  things: {
    b: "barrel",
    c: "woodCrate",
    f: "raft",
    n: "cannon",
    o: "rope",
    p: "palm",
    r: "boulder",
    s: "shark",
    t: "chest",
    u: "bush",
  },
  extraThings: {
    bush: {
      name: "Busch",
      emoji: "\u{1F33F}",
      standable: false,
      kinds: ["plant"],
    },
  },
  suspects: [
    {
      id: "A",
      name: "Annalise",
      pronoun: "sie",
      clue: {
        text: "Sie war allein auf einem Boot.",
        ...all(inArea(...SHIPS), alone()),
      },
      colour: "#b91c1c",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "B",
      name: "Brina",
      pronoun: "sie",
      clue: {
        text: "Sie war nicht bei Igor, aber ihre Bereiche hatten denselben Namen.",
        ...about(["I"], twinOfIgor),
      },
      colour: "#15803d",
      face: "\u{1F469}",
    },
    {
      id: "C",
      name: "Corin",
      pronoun: "sie",
      clue: { text: "Sie war neben einer Kiste.", ...beside("woodCrate") },
      colour: "#0e7490",
      face: "\u{1F469}\u{1F3FD}",
    },
    {
      id: "D",
      name: "Delphine",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Felsen.", ...beside("boulder") },
      colour: "#6366f1",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "E",
      name: "Evander",
      pronoun: "er",
      clue: { text: "Er war neben einem Seil.", ...beside("rope") },
      colour: "#a16207",
      face: "\u{1F468}",
    },
    {
      id: "F",
      name: "Fenn",
      pronoun: "er",
      clue: {
        text: "In seiner Zeile war eine Kanone. Die andere Kanone war in einer leeren Zeile.",
        ...all(
          own((c) => CANNON_ROWS.includes(c.cell.row)),
          counting((c) => pairClue(c, CANNON_ROWS)),
        ),
      },
      colour: "#be185d",
      face: "\u{1F468}‍\u{1F9B1}",
    },
    {
      id: "G",
      name: "Geoff",
      pronoun: "er",
      clue: {
        text: "Er war genau eine Zeile südlich von jemandem auf einem Boot.",
        ...counting(boatOneRowNorth),
      },
      colour: "#7c3aed",
      face: "\u{1F468}‍\u{1F9B3}",
    },
    {
      id: "H",
      name: "Harker",
      pronoun: "er",
      clue: { text: "Er war auf einem Floß.", ...on("raft") },
      colour: "#334155",
      face: "\u{1F474}",
    },
    {
      id: "I",
      name: "Igor",
      pronoun: "er",
      clue: {
        text: "In seiner Zeile war eine Schatztruhe. Die andere Schatztruhe war in einer leeren Zeile.",
        ...all(
          own((c) => CHEST_ROWS.includes(c.cell.row)),
          counting((c) => pairClue(c, CHEST_ROWS)),
        ),
      },
      colour: "#ea580c",
      face: "\u{1F935}",
    },
    {
      id: "J",
      name: "Jasper",
      pronoun: "er",
      clue: { text: "Er war neben einem Fass.", ...beside("barrel") },
      colour: "#0f766e",
      face: "\u{1F468}\u{1F3FB}",
    },
    {
      id: "K",
      name: "Kade",
      pronoun: "sie",
      clue: { text: "Sie war auf einem Steg.", ...inArea(...DOCKS) },
      colour: "#4338ca",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "V",
      name: "Valora",
      pronoun: "sie",
      clue: {
        text: "Das Opfer. Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#57534e",
      face: "\u{1F469}\u{1F3FC}",
    },
  ],
  prune: stillPossible,
  hints: [
    {
      text: "Fenn steht in Zeile 2 oder 9, und die andere dieser Zeilen bleibt leer; Igor steht in Zeile 4 oder 12, und die andere bleibt leer. In diesen vier Zeilen steht also sonst niemand. Harker steht auf einem Floß: R4 C1 und R9 C12 scheiden aus - er steht in R14 C1.",
      place: { H: { row: 13, col: 0 } },
    },
    {
      text: "Evander steht neben einem Seil: R2 C2 liegt in Zeile 2, R10 C1 in Harkers Spalte - er steht in R1 C3 auf der nördlichen Fregatte. Annalise war allein auf einem Boot: nicht bei Evander, nicht auf der Schaluppe (Zeile 1), nicht in Zeile 9 und nicht in C1 - sie steht in R10 C2 auf der südlichen Fregatte.",
      place: { E: { row: 0, col: 2 }, A: { row: 9, col: 1 } },
    },
    {
      text: "Geoff steht genau eine Zeile südlich von jemandem auf einem Boot: Unter Zeile 1 läge Zeile 2, unter R9 C1 Harkers Spalte - also unter Annalise, in Zeile 11. Kade steht auf einem Steg: R3 C3 ist Evanders, R5 C2 und R6 C2 sind Annalises Spalte, der südliche Steg liegt in den Zeilen 9 bis 12 - sie steht in R3 C4. Jasper steht neben einem Fass: R3 C12 ist Kades Zeile, Zeile 10 bis 12 sind vergeben, R13 C3 ist Evanders Spalte - er steht in R5 C12.",
      place: { K: { row: 2, col: 3 }, J: { row: 4, col: 11 } },
    },
    {
      text: "Brina steht im gleichnamigen Bereich der anderen Insel wie Igor (das Wasser hat keinen Zwilling). Für sie sind nur noch die Zeilen 6, 7, 8 und 13 frei. Im Norden (Wald oder Strand in Zeile 6 oder 7) müsste Igor in Zeile 12 im südlichen Wald oder Strand stehen - dort ist nichts frei. Also steht Brina in Zeile 13 im Süden und Igor in Zeile 4 im Norden, und das passt nur im Wald: Igor in R4 C7, Brina in R13 C5. Zeile 12 bleibt leer.",
      place: { I: { row: 3, col: 6 }, B: { row: 12, col: 4 } },
    },
    {
      text: "Corin steht neben einer Kiste: Es bleibt nur R6 C10. Delphine steht neben einem Felsen: Es bleibt nur R8 C11. Fenn hat in Zeile 2 und 9 nur noch R2 C8 - Zeile 9 bleibt leer.",
      place: {
        C: { row: 5, col: 9 },
        D: { row: 7, col: 10 },
        F: { row: 1, col: 7 },
      },
    },
    {
      text: "Geoff und Valora bleiben C6 und C9, Geoff in Zeile 11, Valora in Zeile 7. In R7 C9 stünde Valora im Wasser mit Jasper und Delphine - zu dritt. Sie steht in R7 C6 im nördlichen Wald, Geoff in R11 C9. Valora war allein mit Igor. Igor ist der Mörder!",
      place: { V: { row: 6, col: 5 }, G: { row: 10, col: 8 } },
    },
  ],
  solution: {
    A: { row: 9, col: 1 },
    B: { row: 12, col: 4 },
    C: { row: 5, col: 9 },
    D: { row: 7, col: 10 },
    E: { row: 0, col: 2 },
    F: { row: 1, col: 7 },
    G: { row: 10, col: 8 },
    H: { row: 13, col: 0 },
    I: { row: 3, col: 6 },
    J: { row: 4, col: 11 },
    K: { row: 2, col: 3 },
    V: { row: 6, col: 5 },
  },
};
