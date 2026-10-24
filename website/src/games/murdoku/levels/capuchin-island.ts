/**
 * Die Kapuzinerinsel: a pirate island with a volcano, a forest, a hut, a pier
 * and a beach, four ships in the sea around it, and a murdered pirate.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/46.png`, no solution
 * sheet - most of the solved grid is pencilled in on the photographed page,
 * and the solver proves it is the only solution). The cards show no estates
 * and no area has a crown.
 * Vara is the victim; whoever was alone with her killed her.
 *
 * Monkeys and hammocks can be stood on; the lava, rocks, palms, barrels,
 * crates, ropes, the treasure chest, the time machine and the sharks cannot.
 * The sea, the galleon, the frigate and both sloops count as the sea, the
 * rest as land.
 */
import {
  all,
  beside,
  counting,
  inArea,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** The areas at sea: the open sea and the four ships. */
const SEA: readonly string[] = ["W", "G", "F", "A", "B"];

/** How many people stood at sea and how many on land. */
const PER_SIDE = 6;

/** How many of the people placed so far stood at sea, and how many on land. */
function sides(c: Context): { sea: number; land: number } {
  const atSea = c
    .people()
    .filter((id) => SEA.includes(c.areaOf(c.cellOf(id) ?? c.cell) ?? ""));
  return { sea: atSea.length, land: c.people().length - atSea.length };
}

/** Whether neither side holds more than six people yet. */
function bothSidesOpen(c: Context): boolean {
  const { sea, land } = sides(c);
  return sea <= PER_SIDE && land <= PER_SIDE;
}

/** The case. */
export const CAPUCHIN_ISLAND: Level = {
  id: "capuchin-island",
  name: "Die Kapuzinerinsel",
  series: { book: "timeTravel", number: 46 },
  story:
    "Diese Insel ist voller Taschendiebe. Allerdings nur, wenn man Obst in der Tasche hat.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "W",
      name: "Meer",
      at: "im Meer",
      ground: "water",
      tint: "#d4cdee",
      label: { row: 11, col: 5 },
    },
    {
      key: "O",
      name: "Hütte",
      at: "in der Hütte",
      ground: "floor",
      tint: "#d6d3d8",
      label: { row: 3, col: 3 },
    },
    {
      key: "S",
      name: "Wald",
      at: "im Wald",
      ground: "grass",
      tint: "#b9dce6",
      label: { row: 6, col: 7 },
    },
    {
      key: "G",
      name: "Galeone",
      at: "auf der Galeone",
      ground: "floor",
      tint: "#f3eed8",
      label: { row: 3, col: 9 },
    },
    {
      key: "V",
      name: "Vulkan",
      at: "im Vulkan",
      ground: "stone",
      tint: "#d9a6cf",
      label: { row: 6, col: 1 },
    },
    {
      key: "A",
      name: "Schaluppe A",
      at: "in Schaluppe A",
      ground: "floor",
      tint: "#f3eed8",
      label: { row: 7, col: 1 },
      labelOverhang: true,
    },
    {
      key: "M",
      name: "Steg",
      at: "auf dem Steg",
      ground: "floor",
      tint: "#e3c9d8",
      label: { row: 8, col: 2 },
    },
    {
      key: "F",
      name: "Fregatte",
      at: "auf der Fregatte",
      ground: "floor",
      tint: "#f3eed8",
      label: { row: 10, col: 1 },
    },
    {
      key: "P",
      name: "Strand",
      at: "am Strand",
      ground: "sand",
      tint: "#f6e6e6",
      label: { row: 9, col: 6 },
    },
    {
      key: "B",
      name: "Schaluppe B",
      at: "in Schaluppe B",
      ground: "floor",
      tint: "#f3eed8",
      label: { row: 11, col: 9 },
    },
  ],
  areaMap: [
    "WWWWWWWWWGGG",
    "WWWSSSSSWGGG",
    "WWWOOSSSSGGG",
    "WWWOOSSSSGGG",
    "WVVVVVSSSSSW",
    "WVVVVVVSSSSW",
    "WVVVVVVSSSSW",
    "WAAVVVVPPPSW",
    "WWMMMPPPPWWW",
    "WFFFMPPPWWWW",
    "WFFFPPPWWWWW",
    "WWWWWWWWWBBW",
  ],
  thingMap: [
    "r..........x",
    "....p....xm.",
    ".b.hhmc..t.o",
    "...b...p...x",
    "......hh....",
    "..lll....r..",
    "....l...p.m.",
    "....llm..m..",
    "..o..hh....r",
    ".........s..",
    "..b.hhb.....",
    "....s...b...",
  ],
  things: {
    b: "barrel",
    c: "chest",
    h: "hammock",
    l: "lava",
    m: "monkey",
    o: "rope",
    p: "palm",
    r: "boulder",
    s: "shark",
    t: "timeMachine",
    x: "woodCrate",
  },
  extraThings: {
    monkey: {
      name: "Affe",
      emoji: "\u{1F412}",
      standable: true,
      kinds: ["animal"],
    },
  },
  pieces: [
    { at: { row: 2, col: 3 }, rows: 1, cols: 2 },
    { at: { row: 4, col: 6 }, rows: 1, cols: 2 },
    { at: { row: 8, col: 5 }, rows: 1, cols: 2 },
    { at: { row: 10, col: 4 }, rows: 1, cols: 2 },
  ],
  // The lava, drawn as one glowing field per flow.
  shapes: [
    [
      { row: 5, col: 2 },
      { row: 5, col: 3 },
      { row: 5, col: 4 },
      { row: 6, col: 4 },
      { row: 7, col: 4 },
      { row: 7, col: 5 },
    ],
  ],
  suspects: [
    {
      id: "A",
      name: "Ashen",
      pronoun: "er",
      clue: { text: "Auf seinem Feld war ein Affe.", ...on("monkey") },
      colour: "#7c3aed",
      face: "\u{1F9D1}",
    },
    {
      id: "B",
      name: "Brass Jaw",
      pronoun: "er",
      clue: { text: "Er war auf der Fregatte.", ...inArea("F") },
      colour: "#a16207",
      face: "\u{1F468}‍\u{1F9B2}",
    },
    {
      id: "C",
      name: "Chuckie",
      pronoun: "er",
      clue: { text: "Er war neben einem Fass.", ...beside("barrel") },
      colour: "#334155",
      face: "\u{1F9D4}",
    },
    {
      id: "D",
      name: "Doryn",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Hai.", ...beside("shark") },
      colour: "#0e7490",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "E",
      name: "Elena",
      pronoun: "sie",
      clue: {
        text: "Sie war entweder auf dem Steg oder auf der Galeone.",
        ...inArea("M", "G"),
      },
      colour: "#b91c1c",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "F",
      name: "Fennick",
      pronoun: "er",
      clue: {
        text: "Er war allein mit einer Frau im Wald.",
        ...all(
          inArea("S"),
          counting((c) => {
            const others = c.peopleIn("S").filter((id) => id !== c.self);
            return others.length === 1 && c.has(others[0] ?? "", "woman");
          }),
        ),
      },
      colour: "#57534e",
      face: "\u{1F9D4}‍♂️",
    },
    {
      id: "G",
      name: "Guy",
      pronoun: "er",
      clue: { text: "Er war neben einem Felsen.", ...beside("boulder") },
      colour: "#ca8a04",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "H",
      name: "Helka",
      pronoun: "sie",
      clue: { text: "Sie war in einer Hängematte.", ...on("hammock") },
      colour: "#be185d",
      face: "\u{1F475}",
    },
    {
      id: "I",
      name: "Irik",
      pronoun: "er",
      clue: {
        text: "Er war auf der Galeone, neben dem Seil.",
        ...all(inArea("G"), beside("rope")),
      },
      colour: "#1d4ed8",
      face: "\u{1F468}",
    },
    {
      id: "J",
      name: "Jasmine",
      pronoun: "sie",
      clue: {
        text: "Sie war entweder in der Hütte oder auf einem Schiff.",
        ...own((c) =>
          ["O", "G", "F", "A", "B"].includes(c.areaOf(c.cell) ?? ""),
        ),
      },
      colour: "#15803d",
      face: "\u{1F469}",
    },
    {
      id: "K",
      name: "Kael",
      pronoun: "er",
      clue: {
        text: "Er war in einer Schaluppe.",
        ...inArea("A", "B"),
      },
      colour: "#4d7c0f",
      face: "\u{1F474}",
    },
    {
      id: "V",
      name: "Vara",
      pronoun: "sie",
      clue: {
        text: "Das Opfer. Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#9f1239",
      face: "\u{1F469}‍\u{1F9B3}",
    },
  ],
  rules: [
    {
      text: "Sechs Personen waren auf dem Meer (im Meer, auf der Galeone, der Fregatte oder einer Schaluppe) und sechs an Land.",
      // Search only: neither side may hold more than six.
      prune: bothSidesOpen,
      check: (c) => sides(c).sea === PER_SIDE,
    },
  ],
  hints: [
    {
      text: "Doryn steht neben einem Hai, Guy neben einem Felsen - und nicht im Wald, denn dort ist Fennick nur mit einer Frau. Beide stehen also im Meer. Vara kann darum nicht im Meer sein (sie wäre dort mit mindestens zwei Personen) und auch nicht in einer Schaluppe: Jede liegt in einer einzigen Zeile, dort ist man immer allein.",
    },
    {
      text: "Brass Jaw, Kael, Irik, Doryn und Guy sind sicher auf dem Meer - nur eine weitere Person darf noch dorthin. Spalte 1 füllen nur Chuckie (R3C1) oder Guy (R2C1), Spalte 12 nur jemand in R2C12 auf der Galeone oder Guy (R8C12, R10C12), Zeile 1 nur Guy (R1C2) oder jemand auf der Galeone. In R2C1 ließe Guy Spalte 12 leer, in Spalte 12 wären Chuckie und eine Person auf der Galeone zusammen sieben auf dem Meer. Guy steht in R1C2, Chuckie in R3C1.",
      place: { G: { row: 0, col: 1 }, C: { row: 2, col: 0 } },
    },
    {
      text: "Chuckie ist die sechste Person auf dem Meer, alle übrigen sind an Land. Jasmine ist also in der Hütte: R3C4 und R3C5 sind Chuckies Zeile, sie steht in R4C5. Irik steht neben dem Seil nicht in Chuckies Zeile, also in R2C12. Elena ist auf dem Steg, R9C5 ist Jasmines Spalte: R9C4. Brass Jaw bleibt auf der Fregatte nur R10C3.",
      place: {
        J: { row: 3, col: 4 },
        I: { row: 1, col: 11 },
        E: { row: 8, col: 3 },
        B: { row: 9, col: 2 },
      },
    },
    {
      text: "Schaluppe A liegt in den Spalten von Guy und Brass Jaw, Kael ist also in Schaluppe B in Zeile 12. Doryn bleibt neben einem Hai nur R11C10, Kael damit R12C11. Ashen steht an Land auf einem Affen, R8C10 ist Doryns Spalte: R8C7.",
      place: {
        D: { row: 10, col: 9 },
        K: { row: 11, col: 10 },
        A: { row: 7, col: 6 },
      },
    },
    {
      text: "Helka liegt in einer Hängematte: R11C6 ist Doryns Zeile, R5C7 Ashens Spalte - sie liegt in R5C8 im Wald. Fennick ist mit ihr allein im Wald; frei sind nur noch Zeile 6 und 7 und Spalte 6 und 9, im Wald bleibt R6C9.",
      place: { H: { row: 4, col: 7 }, F: { row: 5, col: 8 } },
    },
    {
      text: "Vara steht auf dem letzten Feld, R7C6 im Vulkan - allein mit Ashen. Ashen ist der Mörder!",
      place: { V: { row: 6, col: 5 } },
    },
  ],
  solution: {
    A: { row: 7, col: 6 },
    B: { row: 9, col: 2 },
    C: { row: 2, col: 0 },
    D: { row: 10, col: 9 },
    E: { row: 8, col: 3 },
    F: { row: 5, col: 8 },
    G: { row: 0, col: 1 },
    H: { row: 4, col: 7 },
    I: { row: 1, col: 11 },
    J: { row: 3, col: 4 },
    K: { row: 11, col: 10 },
    V: { row: 6, col: 5 },
  },
};
