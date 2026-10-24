/**
 * Der Hurrikan: four ships caught in a whirlpool, with a murdered pirate -
 * and the storm has torn off every name board.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/42.png`, no
 * solution sheet - the solved grid and the culprit are pencilled in on the
 * photographed page, and the solver proves it is the only solution).
 * Vanessa is the victim; whoever was alone with her killed her. No estates
 * in this case.
 *
 * The map is eight by eight with its four corners missing. The ships are
 * the Dolch, the Fortuna, the Fata Morgana and the Schlange, one each, in
 * some order ({@link namesFit}). Rafts can be stood on; barrels, the chest,
 * the crate, the rope and boulders cannot.
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

/** The four ships without a name. */
const SHIPS: readonly string[] = ["P", "Q", "R", "T"];

/** The four steps to a field's neighbours. */
const STEPS: readonly Cell[] = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

/** The ship somebody stood on, or null. */
function shipOf(c: Context, id: string): string | null {
  const there = c.cellOf(id);
  const area = there === undefined ? null : c.areaOf(there);
  return area !== null && SHIPS.includes(area) ? area : null;
}

/** The ships right next to a field, whatever its area. */
function shipsNextTo(c: Context, cell: Cell): readonly string[] {
  return STEPS.flatMap((step) => {
    const area = c.areaOf({
      row: cell.row + step.row,
      col: cell.col + step.col,
    });
    return area !== null && SHIPS.includes(area) ? [area] : [];
  });
}

/** The ships next to Cutter that somebody stood on. */
function busyShipsByCutter(c: Context): readonly string[] {
  const cutter = c.cellOf("C");
  return cutter === undefined
    ? []
    : shipsNextTo(c, cutter).filter((ship) => c.peopleIn(ship).length > 0);
}

/** The ships of the people standing anywhere north of Galley. */
function shipsNorthOfGalley(c: Context): readonly string[] {
  const galley = c.cellOf("G");
  return c.people().flatMap((id) => {
    const there = c.cellOf(id);
    const ship = shipOf(c, id);
    return galley !== undefined &&
      there !== undefined &&
      ship !== null &&
      there.row < galley.row
      ? [ship]
      : [];
  });
}

/**
 * Whether the ships can be named so that every clue holds: Arnie on the
 * Fortuna, Elle on the Fata Morgana, the Dolch next to Cutter and taken,
 * somebody on the Schlange north of Galley - four different ships.
 */
function namesFit(c: Context): boolean {
  const fortuna = shipOf(c, "A");
  const morgana = shipOf(c, "E");
  const free = (ship: string) => ship !== fortuna && ship !== morgana;
  const daggers = busyShipsByCutter(c).filter(free);
  const snakes = shipsNorthOfGalley(c).filter(free);
  return (
    fortuna !== null &&
    morgana !== null &&
    fortuna !== morgana &&
    daggers.some((dagger) => snakes.some((snake) => snake !== dagger))
  );
}

/** The case. */
export const THE_HURRICANE: Level = {
  id: "the-hurricane",
  name: "Der Hurrikan",
  series: { book: "timeTravel", number: 42 },
  story: "Bei diesem Fall wird sich dir alles im Kopf drehen.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "P",
      name: "???",
      at: "auf dem unbekannten Schiff im Nordwesten",
      ground: "floor",
      tint: "#e8dcc4",
      label: { row: 1, col: 1 },
    },
    {
      key: "Q",
      name: "???",
      at: "auf dem unbekannten Schiff im Westen",
      ground: "floor",
      tint: "#e8dcc4",
      label: { row: 4, col: 2 },
    },
    {
      key: "R",
      name: "???",
      at: "auf dem unbekannten Schiff im Norden",
      ground: "floor",
      tint: "#e8dcc4",
      label: { row: 3, col: 5 },
    },
    {
      key: "T",
      name: "???",
      at: "auf dem unbekannten Schiff im Süden",
      ground: "floor",
      tint: "#e8dcc4",
      label: { row: 7, col: 3 },
    },
    {
      key: "W",
      name: "Wasser",
      at: "im Wasser",
      ground: "water",
      label: { row: 7, col: 6 },
    },
  ],
  areaMap: [
    ".WWWRRR.",
    "PPWWRRRW",
    "WWWWRRRW",
    "WWWWRRRW",
    "WQQWWWWW",
    "WWWWWWWW",
    "WWTTTWWW",
    ".WTTTWW.",
  ],
  thingMap: [
    ".b....t.",
    "...f....",
    "....c.op",
    "..p.....",
    "..b.....",
    ".......f",
    "......p.",
    "..b..b..",
  ],
  things: {
    b: "barrel",
    c: "woodCrate",
    f: "raft",
    o: "rope",
    p: "boulder",
    t: "chest",
  },
  suspects: [
    {
      id: "A",
      name: "Arnie",
      pronoun: "er",
      clue: { text: "Er war auf der Fortuna.", ...inArea(...SHIPS) },
      colour: "#b91c1c",
      face: "\u{1F466}",
    },
    {
      id: "B",
      name: "Blackhand",
      pronoun: "er",
      clue: { text: "Er war neben einem Fass.", ...beside("barrel") },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Cutter",
      pronoun: "er",
      clue: {
        text: "Er war im Wasser, neben dem Dolch, auf dem jemand war.",
        ...all(
          inArea("W"),
          own((c) => shipsNextTo(c, c.cell).length > 0),
          counting((c) => busyShipsByCutter(c).length > 0),
        ),
      },
      colour: "#0e7490",
      face: "\u{1F468}\u{1F3FB}",
    },
    {
      id: "D",
      name: "Delma",
      pronoun: "sie",
      clue: {
        text: "Sie war genau zwei Zeilen nördlich von Elle.",
        ...about(["E"], (c) => {
          const elle = c.cellOf("E");
          return elle !== undefined && c.cell.row === elle.row - 2;
        }),
      },
      colour: "#6366f1",
      face: "\u{1F469}\u{1F3FE}",
    },
    {
      id: "E",
      name: "Elle",
      pronoun: "sie",
      clue: {
        text: "Sie war auf der Fata Morgana. Sie war nördlich von Cutter und südlich von Arnie.",
        ...all(
          inArea(...SHIPS),
          about(["A", "C"], (c) => {
            const arnie = c.cellOf("A");
            const cutter = c.cellOf("C");
            return (
              arnie !== undefined &&
              cutter !== undefined &&
              c.cell.row < cutter.row &&
              c.cell.row > arnie.row
            );
          }),
        ),
      },
      colour: "#a16207",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "F",
      name: "Fletcher",
      pronoun: "er",
      clue: { text: "Er war auf einem Floß.", ...on("raft") },
      colour: "#be185d",
      face: "\u{1F468}\u{1F3FF}",
    },
    {
      id: "G",
      name: "Galley",
      pronoun: "sie",
      clue: {
        text: "Sie war südlich von jemandem, der auf der Schlange war.",
        ...counting((c) => shipsNorthOfGalley(c).length > 0),
      },
      colour: "#7c3aed",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "V",
      name: "Vanessa",
      pronoun: "sie",
      clue: {
        text: "Das Opfer. Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#57534e",
      face: "\u{1F469}",
    },
  ],
  rules: [
    {
      text: "Der Strudel hat die Namensschilder abgerissen: Die vier Schiffe sind der Dolch, die Fortuna, die Fata Morgana und die Schlange - aber welches ist welches? Finde es heraus.",
      check: namesFit,
    },
  ],
  hints: [
    {
      text: "Jeder der vier Namen gehört zu einem besetzten Schiff: Arnie ist auf der Fortuna, Elle auf der Fata Morgana, auf dem Dolch war jemand, und auf der Schlange stand jemand nördlich von Galley. Auf dem Schiff im Westen ist nur R5 C2 frei, also steht dort jemand. Auf dem Schiff im Nordwesten bleibt dann nur R2 C1 (C2 ist besetzt). Fletcher steht auf einem Floß: R2 C4 liegt in Zeile 2 - er steht in R6 C8.",
      place: { F: { row: 5, col: 7 } },
    },
    {
      text: "Elle ist auf einem Schiff, Arnie auf einem anderen nördlich von ihr, Cutter im Wasser südlich von ihr neben dem Dolch - einem dritten Schiff. Auf dem Schiff im Süden gäbe es neben Cutter (Zeile 8) nur ihr eigenes Schiff. Auf dem großen Schiff im Norden stünde Arnie in R2 C1, Delma zwei Zeilen nördlich in R1 und Elle damit in R3 C6; Cutter fände außerhalb von C1, C2, C6 und C8 und der Zeilen 2, 5 und 6 kein Wasserfeld neben einem Schiff. Elle steht also in R5 C2 auf dem Schiff im Westen, der Fata Morgana.",
      place: { E: { row: 4, col: 1 } },
    },
    {
      text: "Delma steht zwei Zeilen nördlich von Elle, in Zeile 3. Cutter steht im Wasser südlich von Elle neben einem anderen Schiff: Zeile 6 ist Fletchers, C2 Elles Spalte, R8 C6 ein Fass - er steht in R7 C6, neben dem Schiff im Süden. Das ist der Dolch.",
      place: { C: { row: 6, col: 5 } },
    },
    {
      text: "Vanessa war allein mit ihrem Mörder. Im Wasser stehen Cutter und Fletcher, auf der Fata Morgana steht Elle allein. Im Nordwesten passt nur eine Person (R2 C1), auf dem Dolch auch, denn Zeile 7 ist Cutters. Vanessa steht also mit genau einer weiteren Person auf dem großen Schiff, in Zeile 1 und 4 (Zeile 3 ist Delmas, R3 C6 Cutters Spalte). R2 C1, der Dolch und diese beiden Plätze gehören Arnie, Blackhand, Galley und Vanessa.",
    },
    {
      text: "Blackhand steht neben einem Fass - von diesen Plätzen nur auf dem Dolch, in R8 C4. Stünde Arnie auf dem großen Schiff, wäre es die Fortuna, und Galley stünde allein in R2 C1 auf der Schlange - nördlich von ihr wäre dort niemand. Also steht Arnie in R2 C1 auf der Fortuna, und das große Schiff ist die Schlange, mit Galley südlich von Vanessa.",
      place: { B: { row: 7, col: 3 }, A: { row: 1, col: 0 } },
    },
    {
      text: "Vanessa steht in Zeile 1 auf dem großen Schiff: R1 C5 (C6 ist Cutters Spalte, R1 C7 die Truhe). Galley steht in Zeile 4: R4 C5 ist Vanessas, R4 C6 Cutters Spalte - R4 C7. Delma steht in R3 C3 (C1 ist Arnies, C4 Blackhands Spalte). Vanessa war allein mit Galley. Galley ist die Mörderin!",
      place: {
        V: { row: 0, col: 4 },
        G: { row: 3, col: 6 },
        D: { row: 2, col: 2 },
      },
    },
  ],
  solution: {
    A: { row: 1, col: 0 },
    B: { row: 7, col: 3 },
    C: { row: 6, col: 5 },
    D: { row: 2, col: 2 },
    E: { row: 4, col: 1 },
    F: { row: 5, col: 7 },
    G: { row: 3, col: 6 },
    V: { row: 0, col: 4 },
  },
};
