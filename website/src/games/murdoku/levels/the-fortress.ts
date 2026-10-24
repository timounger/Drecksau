/**
 * Die Festung: chambers, barracks, armoury, treasury, the knights' hall and two
 * towers of a castle, with a murdered knight.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/6. Die Festung.png`, no solution
 * sheet - the culprit is pencilled in on the photographed page, and the
 * solver proves it is the only solution). Otmar is the victim; whoever was
 * alone with him killed him.
 *
 * The map is nine by nine. Beds, chairs and rugs can be stood on; shelves,
 * tables, barrels, crates and weapon racks cannot. A barrel stands on the
 * runner in the knights' hall.
 *
 * The book's estates: nobles (purple cards: Gernot, Herbert) only in the
 * crowned chambers and treasury, villagers (wooden cards: Donna, Ellen,
 * Ferdinand) only in the other areas, knights (grey shields: Anton, Briar,
 * Conrad, Otmar) anywhere.
 */
import {
  about,
  all,
  beside,
  counting,
  inArea,
  not,
  on,
  ranks,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** The villagers, whom Anton was south of. */
const VILLAGERS: readonly string[] = ["D", "E", "F"];

/** Whether exactly one person stood on a thing of this id or kind. */
function onlyOneOn(c: Context, what: string): boolean {
  return (
    c.people().filter((id) => {
      const there = c.cellOf(id);
      return there !== undefined && c.is(there, what);
    }).length === 1
  );
}

/** The case. */
export const THE_FORTRESS: Level = {
  id: "the-fortress",
  name: "Die Festung",
  series: { book: "timeTravel", number: 6 },
  story:
    "Hält Feinde hervorragend draußen - hilft nur leider wenig, wenn sie schon drinnen sind.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "K",
      name: "Gemächer",
      at: "in den Gemächern",
      ground: "floor",
      tint: "#ddd3f0",
      label: { row: 3, col: 1 },
    },
    {
      key: "B",
      name: "Kaserne",
      at: "in der Kaserne",
      ground: "stone",
      tint: "#d4dbe6",
      label: { row: 3, col: 7 },
    },
    {
      key: "G",
      name: "Rittersaal",
      at: "im Rittersaal",
      ground: "stone",
      tint: "#e6e4ea",
      label: { row: 8, col: 3 },
    },
    {
      key: "A",
      name: "Waffenkammer",
      at: "in der Waffenkammer",
      ground: "floor",
      tint: "#c7d6ea",
      label: { row: 5, col: 1 },
    },
    {
      key: "T",
      name: "Schatzkammer",
      at: "in der Schatzkammer",
      ground: "floor",
      tint: "#ddd3f0",
      label: { row: 5, col: 6 },
    },
    {
      key: "W",
      name: "Westturm",
      at: "im Westturm",
      ground: "stone",
      tint: "#c9ced8",
      label: { row: 8, col: 0 },
    },
    {
      key: "O",
      name: "Ostturm",
      at: "im Ostturm",
      ground: "stone",
      tint: "#c9ced8",
      label: { row: 8, col: 6 },
    },
  ],
  areaMap: [
    "KKK...BBB",
    "KKKGGGBBB",
    "KKKGGGBBB",
    ".KKGGGBB.",
    ".AAGGGTT.",
    ".AAGGGTT.",
    "WWWGGGOOO",
    "WWWGGGOOO",
    "WWWGGGOOO",
  ],
  thingMap: [
    "sb....rbb",
    "sb.cttrbb",
    "c...rkrbb",
    "..t.kcr..",
    ".w..r..s.",
    "..wcr.x..",
    "w..ktt..x",
    ".rrrrc..w",
    "...srs...",
  ],
  things: {
    b: "bed",
    c: "chair",
    k: "barrel",
    r: "rug",
    s: "shelf",
    t: "table",
    w: "weaponRack",
    x: "woodCrate",
  },
  pieces: [
    { at: { row: 0, col: 1 }, rows: 2, cols: 1 },
    { at: { row: 0, col: 7 }, rows: 1, cols: 2 },
    { at: { row: 1, col: 7 }, rows: 1, cols: 2 },
    { at: { row: 2, col: 7 }, rows: 1, cols: 2 },
    { at: { row: 1, col: 4 }, rows: 1, cols: 2 },
    { at: { row: 6, col: 4 }, rows: 1, cols: 2 },
    { at: { row: 0, col: 6 }, rows: 4, cols: 1 },
    { at: { row: 7, col: 1 }, rows: 1, cols: 2 },
  ],
  // The runner of the knights' hall, one rug from R3 down to R9 - under the
  // table in R7 and round the corner into R8 C4.
  shapes: [
    [
      { row: 2, col: 4 },
      { row: 3, col: 4 },
      { row: 4, col: 4 },
      { row: 5, col: 4 },
      { row: 6, col: 4 },
      { row: 7, col: 4 },
      { row: 7, col: 3 },
      { row: 8, col: 4 },
    ],
  ],
  suspects: [
    {
      id: "A",
      traits: ["knight"],
      name: "Anton",
      pronoun: "er",
      clue: {
        text: "Er war südlich von allen Dorfbewohner*innen.",
        ...about(VILLAGERS, (c) =>
          VILLAGERS.every((id) => {
            const there = c.cellOf(id);
            return there !== undefined && c.cell.row > there.row;
          }),
        ),
      },
      colour: "#57534e",
      face: "\u{1F482}",
    },
    {
      id: "B",
      traits: ["knight"],
      name: "Briar",
      pronoun: "sie",
      clue: { text: "Sie war nicht neben einem Bett.", ...not(beside("bed")) },
      colour: "#15803d",
      face: "\u{1F469}",
    },
    {
      id: "C",
      traits: ["knight"],
      name: "Conrad",
      pronoun: "er",
      clue: { text: "Er war auf einem Bett.", ...on("bed") },
      colour: "#0e7490",
      face: "\u{1F468}‍\u{1F9B1}",
    },
    {
      id: "D",
      traits: ["villager"],
      name: "Donna",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person auf einem Teppich.",
        ...all(
          on("rug"),
          counting((c) => onlyOneOn(c, "rug")),
        ),
      },
      colour: "#b91c1c",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "E",
      traits: ["villager"],
      name: "Ellen",
      pronoun: "sie",
      clue: { text: "Sie war im Rittersaal.", ...inArea("G") },
      colour: "#a16207",
      face: "\u{1F9D5}",
    },
    {
      id: "F",
      traits: ["villager"],
      name: "Ferdinand",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person, die auf einem Stuhl saß.",
        ...all(
          on("chair"),
          counting((c) => onlyOneOn(c, "chair")),
        ),
      },
      colour: "#ea580c",
      face: "\u{1F9D4}",
    },
    {
      id: "G",
      traits: ["noble"],
      name: "Gernot",
      pronoun: "er",
      clue: {
        text: "Er war genau eine Spalte östlich von Ellen.",
        ...about(["E"], (c) => {
          const ellen = c.cellOf("E");
          return ellen !== undefined && c.cell.col === ellen.col + 1;
        }),
      },
      colour: "#7c3aed",
      face: "\u{1F934}",
    },
    {
      id: "H",
      traits: ["noble"],
      name: "Herbert",
      pronoun: "er",
      clue: { text: "Er war neben einem Regal.", ...beside("shelf") },
      colour: "#6366f1",
      face: "\u{1F474}",
    },
    {
      id: "O",
      traits: ["knight"],
      name: "Otmar",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#334155",
      face: "\u{1F468}",
    },
  ],
  rules: [
    ranks(
      "Adlige (\u{1F451}) waren nur in den Gemächern oder in der Schatzkammer, Dorfbewohner nur in den anderen Bereichen, Ritter überall.",
      ["K", "T"],
    ),
  ],
  hints: [
    {
      text: "Gernot ist adlig, also in den Gemächern (C1-C3) oder in der Schatzkammer (C7-C8). Er steht genau eine Spalte östlich von Ellen, die im Rittersaal (C4-C6) ist - also in C7 der Schatzkammer. R6 C7 ist eine Kiste: Gernot steht in R5 C7, Ellen in C6.",
      place: { G: { row: 4, col: 6 } },
    },
    {
      text: "Ellen steht in C6 des Rittersaals. R2 und R7 sind Tische, R3 ein Fass, R9 ein Regal, und auf den Stühlen in R4 und R8 sitzt nur Ferdinand. R5 ist Gernots Zeile - Ellen steht in R6 C6.",
      place: { E: { row: 5, col: 5 } },
    },
    {
      text: "Ferdinand ist Dorfbewohner und sitzt auf einem Stuhl - nicht in den Gemächern. R4 C6 und R8 C6 liegen in Ellens Spalte, R6 C4 in ihrer Zeile: Ferdinand sitzt in R2 C4.",
      place: { F: { row: 1, col: 3 } },
    },
    {
      text: "Herbert ist adlig und steht neben einem Regal. In der Schatzkammer bleibt R6 C8 (Ellens Zeile), in den Gemächern R1 C2, R2 C2 (Ferdinands Zeile) und R3 C1 (ein Stuhl, der nur Ferdinand gehört). Herbert steht in R1 C2.",
      place: { H: { row: 0, col: 1 } },
    },
    {
      text: "Neun Personen, neun Zeilen: Auch in R4 steht jemand. Frei sind C1, C3, C5, C8 und C9 - in R4 ist nur C8 betretbar. Conrad liegt auf einem Bett: R1 und R2 sind besetzt, R3 C8 liegt in derselben Spalte - Conrad liegt in R3 C9.",
      place: { C: { row: 2, col: 8 } },
    },
    {
      text: "Wer steht in R4 C8? Nicht Briar (neben einem Bett), nicht Donna (kein Teppich), nicht Anton (er muss südlich von Ellen sein). Es ist Otmar - allein mit Conrad in der Kaserne.",
      place: { O: { row: 3, col: 7 } },
    },
    {
      text: "Übrig sind R7 bis R9 und C1, C3, C5. In R7 ist nur R7 C3 betretbar und dort liegt kein Teppich; Anton steht südlich von Donna, also nicht in R7. Briar steht in R7 C3, Donna auf dem Teppich in R8 C5, Anton in R9 C1. Conrad ist der Mörder!",
      place: {
        B: { row: 6, col: 2 },
        D: { row: 7, col: 4 },
        A: { row: 8, col: 0 },
      },
    },
  ],
  solution: {
    A: { row: 8, col: 0 },
    B: { row: 6, col: 2 },
    C: { row: 2, col: 8 },
    D: { row: 7, col: 4 },
    E: { row: 5, col: 5 },
    F: { row: 1, col: 3 },
    G: { row: 4, col: 6 },
    H: { row: 0, col: 1 },
    O: { row: 3, col: 7 },
  },
};
