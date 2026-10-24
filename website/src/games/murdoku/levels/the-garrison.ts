/**
 * Die Garnison: the barracks, the wall and the beach of a redcoat fort, the
 * harbour water with a sloop and a frigate, and a rocky ridge, with a
 * murdered soldier.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/40.png`, no
 * solution sheet and no culprit on the photographed page - the solver
 * proves the solution is the only one). Vassel is the victim; whoever was
 * alone with him killed him. No estates in this case.
 *
 * The map is nine by nine with one field missing at the bottom left of the
 * eighth row, two at the bottom left and two at the bottom right of the
 * ninth and one at the right of the eighth. The sea is the water with the
 * two ships on it; the land is the barracks, the wall, the beach and the
 * ridge. Beds can be stood on; barrels, cannons, ropes and boulders cannot.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  about,
  alone,
  all,
  beside,
  counting,
  inArea,
  on,
  row,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** The sea: the water and the two ships on it. */
const SEA: readonly string[] = ["W", "S", "F"];

/** The women of the case. */
const WOMEN: readonly string[] = ["B", "C", "E"];

/** Whether somebody stood in the sea. */
function atSea(c: Context, id: string): boolean {
  const there = c.cellOf(id);
  return there !== undefined && SEA.includes(c.areaOf(there) ?? "");
}

/** Whether Armstrong was the only one beside a cannon in his area. */
function onlyOneByCannon(c: Context): boolean {
  const area = c.areaOf(c.cell) ?? "";
  return c.peopleIn(area).every((id) => {
    const there = c.cellOf(id);
    return id === c.self || there === undefined || !c.beside(there, "cannon");
  });
}

/** The case. */
export const THE_GARRISON: Level = {
  id: "the-garrison",
  name: "Die Garnison",
  series: { book: "timeTravel", number: 40 },
  story:
    "Diese Rotröcke schießen auf Piraten, sobald sie einen sehen. Oder riechen.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "B",
      name: "Kaserne",
      at: "in der Kaserne",
      ground: "floor",
      tint: "#dfe6ec",
      label: { row: 2, col: 0 },
    },
    {
      key: "M",
      name: "Mauer",
      at: "auf der Mauer",
      ground: "stone",
      tint: "#d4d8de",
      label: { row: 4, col: 2 },
    },
    {
      key: "P",
      name: "Strand",
      at: "am Strand",
      ground: "sand",
      label: { row: 1, col: 7 },
    },
    {
      key: "W",
      name: "Wasser",
      at: "im Wasser",
      ground: "water",
      label: { row: 6, col: 3 },
    },
    {
      key: "S",
      name: "Schaluppe",
      at: "auf der Schaluppe",
      ground: "floor",
      tint: "#e8dcc4",
      label: { row: 5, col: 2 },
    },
    {
      key: "F",
      name: "Fregatte",
      at: "auf der Fregatte",
      ground: "floor",
      tint: "#e8dcc4",
      label: { row: 7, col: 5 },
    },
    {
      key: "K",
      name: "Felsgrat",
      at: "auf dem Felsgrat",
      ground: "stone",
      tint: "#c9ced8",
      label: { row: 8, col: 3 },
    },
  ],
  areaMap: [
    "BBBBBMPPP",
    "BBBBBMMPP",
    "BBBBBMMPW",
    "MMMMMMMWW",
    "WMMMMWWWW",
    "WWSSWWWWW",
    "WWWWWFFFW",
    ".WWKKFFF.",
    "..KKKKK..",
  ],
  thingMap: [
    "dbd.....b",
    "d.d.b..n.",
    "..o......",
    "b..b..n.r",
    ".n..n....",
    "r........",
    "......n..",
    "....r.ob.",
    "...r.r...",
  ],
  things: {
    b: "barrel",
    d: "bed",
    n: "cannon",
    o: "rope",
    r: "boulder",
  },
  // The two beds, two fields each.
  pieces: [
    { at: { row: 0, col: 0 }, rows: 2, cols: 1 },
    { at: { row: 0, col: 2 }, rows: 2, cols: 1 },
  ],
  suspects: [
    {
      id: "A",
      name: "Armstrong",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person neben einer Kanone in seinem Bereich.",
        ...all(beside("cannon"), counting(onlyOneByCannon)),
      },
      colour: "#b91c1c",
      face: "\u{1F482}",
    },
    {
      id: "B",
      name: "Bethany",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Fass.", ...beside("barrel") },
      colour: "#15803d",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "C",
      name: "Cornelia",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Frau auf der Mauer.",
        ...all(
          inArea("M"),
          counting((c) =>
            c.peopleIn("M").every((id) => id === c.self || !WOMEN.includes(id)),
          ),
        ),
      },
      colour: "#0e7490",
      face: "\u{1F469}\u{1F3FE}",
    },
    {
      id: "D",
      name: "Dirk",
      pronoun: "er",
      clue: { text: "Er war auf einem Bett.", ...on("bed") },
      colour: "#6366f1",
      face: "\u{1F468}",
    },
    {
      id: "E",
      name: "Eve",
      pronoun: "sie",
      clue: {
        text: "Sie war genau zwei Spalten westlich von Gareth.",
        ...about(["G"], (c) => {
          const gareth = c.cellOf("G");
          return gareth !== undefined && c.cell.col === gareth.col - 2;
        }),
      },
      colour: "#a16207",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "F",
      name: "Francesco",
      pronoun: "er",
      clue: {
        text: "Er war allein. Entweder er oder Eve war im Meer; die andere Person war an Land.",
        ...all(
          alone(),
          about(["E"], (c) => atSea(c, c.self) !== atSea(c, "E")),
        ),
      },
      colour: "#be185d",
      face: "\u{1F9D4}",
    },
    {
      id: "G",
      name: "Gareth",
      pronoun: "er",
      clue: { text: "Er war in der untersten Zeile.", ...row(9) },
      colour: "#7c3aed",
      face: "\u{1F468}‍\u{1F9B1}",
    },
    {
      id: "H",
      name: "Hans",
      pronoun: "er",
      clue: { text: "Er war am Strand.", ...inArea("P") },
      colour: "#334155",
      face: "\u{1F468}‍\u{1F9B2}",
    },
    {
      id: "V",
      name: "Vassel",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#57534e",
      face: "\u{1F474}",
    },
  ],
  hints: [
    {
      text: "Kaserne (Dirk), Mauer (Cornelia), Strand (Hans) und Felsgrat (Gareth in der untersten Zeile) sind nie leer. Francesco war allein, also war er im Meer - im Wasser oder auf einem Schiff -, und Eve war an Land. Eve steht zwei Spalten westlich von Gareth (C3, C5 oder C7), also in C1, C3 oder C5: nicht auf der Mauer (dort ist Cornelia die einzige Frau), nicht am Strand und nicht auf dem Felsgrat (R9 ist Gareths Zeile, R8 C4 die falsche Spalte). Eve steht in der Kaserne.",
    },
    {
      text: "Dirk (auf einem Bett), Eve (in der Kaserne) und Hans (am Strand) füllen die Zeilen 1 bis 3. Bethany steht neben einem Fass, aber nicht auf der Mauer: Außerhalb der Zeilen 1 bis 3 bleibt nur R7 C8 auf der Fregatte.",
      place: { B: { row: 6, col: 7 } },
    },
    {
      text: "Armstrong steht neben einer Kanone - außerhalb der Zeilen 1 bis 3 nur auf der Mauer, denn R7 C6 liegt in Bethanys Zeile. Cornelia ist auch auf der Mauer, beide in Zeile 4 und 5. Als Einziger neben einer Kanone in seinem Bereich lässt Armstrong ihr nur R4 C3, das einzige freie Mauerfeld dort ohne Kanone daneben. Armstrong steht in Zeile 5 neben einer Kanone, nicht in C3: R5 C4.",
      place: { C: { row: 3, col: 2 }, A: { row: 4, col: 3 } },
    },
    {
      text: "Dirk liegt auf einem Bett in C1 (C3 ist Cornelias Spalte). Eve bleibt nur C5, also steht Gareth in R9 C7. Hans: R1 C7 liegt in Gareths Spalte, R1 C8 und R3 C8 in Bethanys - er steht in R2 C9. Damit liegt Dirk in R1 C1 und Eve steht in R3 C5.",
      place: {
        D: { row: 0, col: 0 },
        E: { row: 2, col: 4 },
        G: { row: 8, col: 6 },
        H: { row: 1, col: 8 },
      },
    },
    {
      text: "Frei sind nur noch die Zeilen 6 und 8 und die Spalten 2 und 6. R6 C6 und R8 C2 liegen beide im Wasser - dort wäre Francesco nicht allein. Also steht Francesco allein in R6 C2 im Wasser und Vassel in R8 C6 auf der Fregatte - allein mit Bethany. Bethany ist die Mörderin!",
      place: { F: { row: 5, col: 1 }, V: { row: 7, col: 5 } },
    },
  ],
  solution: {
    A: { row: 4, col: 3 },
    B: { row: 6, col: 7 },
    C: { row: 3, col: 2 },
    D: { row: 0, col: 0 },
    E: { row: 2, col: 4 },
    F: { row: 5, col: 1 },
    G: { row: 8, col: 6 },
    H: { row: 1, col: 8 },
    V: { row: 7, col: 5 },
  },
};
