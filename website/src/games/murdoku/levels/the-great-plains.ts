/**
 * Die Großen Ebenen: two plains with a lake, a store, a hut and four
 * dwellings, one outlaw among the suspects and a murdered stranger.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/32.png`, no
 * solution sheet - the culprit is pencilled in on the photographed page,
 * and the solver proves the solution is the only one). Vince is the victim;
 * whoever was alone with him killed him. No estates in this case.
 *
 * Exactly one suspect is the outlaw, and the outlaw is a man - but not
 * Vince. Which man it is follows from the clues of Akecheta, Bran and
 * Dowanhowee ({@link outlawFits}). "Northwest of" means in a row further up
 * and a column further left. The page has no legend for the furniture: the
 * squares in the store at R1 C3 and R2 C1 and in the hut at R1 C11 are read
 * as chairs and the pieces at R1 C2 and R1 C12 as tables - only that
 * reading leaves one solution, the one with the pencilled culprit. Outside
 * the hut at R1 C10 stands a horse. Akecheta (a man's name) counts as a man.
 * The lake can be stood in; chairs and horses can be stood on; tables, the
 * time machine (in the store, as the sheriff's note says),
 * sacks, rocks, bisons, bushes, the fire and baskets cannot.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
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

/**
 * The men who can be the outlaw: not Vince, not Bran (six rows south of
 * him) and not Akecheta (who was not with him).
 */
const OUTLAWS: readonly string[] = ["F", "H", "I", "J", "K"];

/** The two plains. */
const PLAINS: readonly string[] = ["N", "P"];

/** Whether exactly one person stood beside a thing of this id. */
function onlyOneBeside(c: Context, what: string): boolean {
  return (
    c.people().filter((id) => {
      const there = c.cellOf(id);
      return there !== undefined && c.beside(there, what);
    }).length === 1
  );
}

/** Whether this man can be the outlaw, by the clues that name the outlaw. */
function outlawFits(c: Context, outlaw: string): boolean {
  const at = c.cellOf(outlaw);
  const akecheta = c.cellOf("A");
  const bran = c.cellOf("B");
  const dowanhowee = c.cellOf("D");
  return (
    at !== undefined &&
    akecheta !== undefined &&
    bran !== undefined &&
    dowanhowee !== undefined &&
    c.areaOf(akecheta) !== c.areaOf(at) &&
    bran.row === at.row + 6 &&
    dowanhowee.col === at.col - 3
  );
}

/** Whether one of the men other than Vince can be the outlaw. */
function someOutlaw(c: Context): boolean {
  return OUTLAWS.some((id) => outlawFits(c, id));
}

/** Whether some man who can be the outlaw stands where a test asks. */
function someOutlawWhere(c: Context, test: (at: Cell) => boolean): boolean {
  return OUTLAWS.some((id) => {
    const at = c.cellOf(id);
    return at !== undefined && test(at);
  });
}

/** Whether Georgia was the only woman in a plain, with exactly three men. */
function withThreeMen(c: Context): boolean {
  const area = c.areaOf(c.cell) ?? "";
  const there = c.peopleIn(area);
  return (
    PLAINS.includes(area) &&
    there.length === 4 &&
    there.filter((id) => c.has(id, "man")).length === 3
  );
}

/** Whether this man may still be the outlaw, as far as people stand. */
function outlawMayFit(c: Context, outlaw: string): boolean {
  const at = c.cellOf(outlaw);
  const akecheta = c.cellOf("A");
  const bran = c.cellOf("B");
  const dowanhowee = c.cellOf("D");
  return (
    at === undefined ||
    ((akecheta === undefined || c.areaOf(akecheta) !== c.areaOf(at)) &&
      (bran === undefined || bran.row === at.row + 6) &&
      (dowanhowee === undefined || dowanhowee.col === at.col - 3))
  );
}

/** How many people stand beside a thing of this id. */
function countBeside(c: Context, what: string): number {
  return c.people().filter((id) => {
    const there = c.cellOf(id);
    return there !== undefined && c.beside(there, what);
  }).length;
}

/**
 * For the solver only: whether the clues about counts of people can still
 * hold - nobody else beside the fire or a rock, nobody with Chapawee, no
 * crowded plain for Georgia, nobody crowding Vince, and still a man who can
 * be the outlaw.
 */
function stillPossible(c: Context): boolean {
  const georgia = c.cellOf("G");
  const plain = georgia === undefined ? "" : (c.areaOf(georgia) ?? "");
  const company = plain === "" ? [] : c.peopleIn(plain);
  const vince = c.cellOf("V");
  const withVince =
    vince === undefined ? [] : c.peopleIn(c.areaOf(vince) ?? "");
  return (
    withVince.length <= 2 &&
    OUTLAWS.some((id) => outlawMayFit(c, id)) &&
    countBeside(c, "campfire") <= 1 &&
    countBeside(c, "boulder") <= 1 &&
    c.peopleIn("S").length <= 1 &&
    company.length <= 4 &&
    company.filter((id) => !c.has(id, "man")).length <= 1
  );
}

/** The case. */
export const THE_GREAT_PLAINS: Level = {
  id: "the-great-plains",
  name: "Die Großen Ebenen",
  series: { book: "timeTravel", number: 32 },
  story:
    "Er wollte ein Zuhause, wo die Bisons leben - stattdessen bekam er einen Mord.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "C",
      name: "Laden",
      at: "im Laden",
      ground: "floor",
      tint: "#cdbfae",
      label: { row: 2, col: 1 },
    },
    {
      key: "H",
      name: "Hütte",
      at: "in der Hütte",
      ground: "floor",
      tint: "#cdbfae",
      label: { row: 1, col: 11 },
    },
    {
      key: "N",
      name: "Nördliche Ebene",
      at: "in der nördlichen Ebene",
      ground: "sand",
      tint: "#f3e7b5",
      label: { row: 5, col: 9 },
    },
    {
      key: "L",
      name: "See",
      at: "im See",
      ground: "water",
      label: { row: 6, col: 4 },
    },
    {
      key: "A",
      name: "Nördliche Wohnstätte",
      at: "in der nördlichen Wohnstätte",
      ground: "floor",
      tint: "#ecebe6",
      label: { row: 7, col: 5 },
      labelOverhang: true,
    },
    {
      key: "E",
      name: "Östliche Wohnstätte",
      at: "in der östlichen Wohnstätte",
      ground: "floor",
      tint: "#ecebe6",
      label: { row: 8, col: 10 },
    },
    {
      key: "W",
      name: "Westliche Wohnstätte",
      at: "in der westlichen Wohnstätte",
      ground: "floor",
      tint: "#ecebe6",
      label: { row: 10, col: 3 },
      labelOverhang: true,
    },
    {
      key: "S",
      name: "Südliche Wohnstätte",
      at: "in der südlichen Wohnstätte",
      ground: "floor",
      tint: "#ecebe6",
      label: { row: 11, col: 6 },
    },
    {
      key: "P",
      name: "Südliche Ebene",
      at: "in der südlichen Ebene",
      ground: "sand",
      tint: "#f0c9a4",
      label: { row: 11, col: 0 },
    },
  ],
  areaMap: [
    "CCCCCCNNNNHH",
    "CCCCCCNNNNHH",
    "CCCCNNNNNNHN",
    "NNNNNNNNNNNN",
    "NNNNNNNNNNNN",
    "NNLLLNNNNNNN",
    "NLLLLAANNEEE",
    "PLLPPAAPNEEE",
    "PPPPPPPPPEEE",
    "PPPWWPPPPPPP",
    "PPPWWPSSSPPP",
    "PPPPPPSSSPPP",
  ],
  thingMap: [
    ".tc.ms.r.hct",
    "c.....h.....",
    "............",
    "...h...x..h.",
    "ux..u....x..",
    "ru..........",
    "........rs..",
    "............",
    "....h..f...k",
    "...k........",
    "..h....k.h..",
    "............",
  ],
  things: {
    c: "chair",
    f: "campfire",
    h: "horse",
    k: "basket",
    m: "timeMachine",
    r: "boulder",
    s: "sack",
    t: "table",
    u: "shrub",
    x: "bison",
  },
  extraThings: {
    bison: {
      name: "Bison",
      emoji: "\u{1F9AC}",
      standable: false,
      kinds: ["animal"],
    },
  },
  suspects: [
    {
      id: "A",
      name: "Akecheta",
      pronoun: "er",
      traits: ["man"],
      clue: {
        text: "Er war nicht bei dem Gesetzlosen. Er war nordwestlich von Georgia.",
        ...all(
          about(["G"], (c) => {
            const georgia = c.cellOf("G");
            return (
              georgia !== undefined &&
              c.cell.row < georgia.row &&
              c.cell.col < georgia.col
            );
          }),
          about(OUTLAWS, (c) =>
            someOutlawWhere(c, (at) => c.areaOf(at) !== c.areaOf(c.cell)),
          ),
          counting(someOutlaw),
        ),
      },
      colour: "#b91c1c",
      face: "\u{1F468}\u{1F3FD}",
    },
    {
      id: "B",
      name: "Bran",
      pronoun: "er",
      traits: ["man"],
      clue: {
        text: "Er war genau sechs Zeilen südlich des Gesetzlosen.",
        ...all(
          own((c) => c.cell.row >= 6),
          about(OUTLAWS, (c) =>
            someOutlawWhere(c, (at) => at.row + 6 === c.cell.row),
          ),
          counting(someOutlaw),
        ),
      },
      colour: "#15803d",
      face: "\u{1F920}",
    },
    {
      id: "C",
      name: "Chapawee",
      pronoun: "sie",
      clue: {
        text: "Sie war allein in der südlichen Wohnstätte.",
        ...all(
          inArea("S"),
          counting((c) => c.peopleIn("S").length === 1),
        ),
      },
      colour: "#0e7490",
      face: "\u{1F469}\u{1F3FD}",
    },
    {
      id: "D",
      name: "Dowanhowee",
      pronoun: "sie",
      clue: {
        text: "Sie war genau drei Spalten westlich des Gesetzlosen.",
        ...all(
          own((c) => c.cell.col + 3 < c.cols),
          about(OUTLAWS, (c) =>
            someOutlawWhere(c, (at) => at.col - 3 === c.cell.col),
          ),
          counting(someOutlaw),
        ),
      },
      colour: "#6366f1",
      face: "\u{1F469}\u{1F3FD}",
    },
    {
      id: "E",
      name: "Ehawee",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person neben dem Lagerfeuer.",
        ...all(
          beside("campfire"),
          counting((c) => onlyOneBeside(c, "campfire")),
        ),
      },
      colour: "#a16207",
      face: "\u{1F469}\u{1F3FD}",
    },
    {
      id: "F",
      name: "Forrest",
      pronoun: "er",
      traits: ["man"],
      clue: { text: "Er saß auf einem Stuhl.", ...on("chair") },
      colour: "#be185d",
      face: "\u{1F9D4}",
    },
    {
      id: "G",
      name: "Georgia",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Frau in einer der Ebenen, mit genau drei Männern.",
        ...all(inArea(...PLAINS), counting(withThreeMen)),
      },
      colour: "#7c3aed",
      face: "\u{1F475}",
    },
    {
      id: "H",
      name: "Harrison",
      pronoun: "er",
      traits: ["man"],
      clue: {
        text: "Er war die einzige Person neben einem Felsen.",
        ...all(
          beside("boulder"),
          counting((c) => onlyOneBeside(c, "boulder")),
        ),
      },
      colour: "#0f766e",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "I",
      name: "Iktomi",
      pronoun: "er",
      traits: ["man"],
      clue: { text: "Er war neben einem Korb.", ...beside("basket") },
      colour: "#9333ea",
      face: "\u{1F468}\u{1F3FD}",
    },
    {
      id: "J",
      name: "Jackson",
      pronoun: "er",
      traits: ["man"],
      clue: { text: "Er war in der Hütte.", ...inArea("H") },
      colour: "#78716c",
      face: "\u{1F474}",
    },
    {
      id: "K",
      name: "Keith",
      pronoun: "er",
      traits: ["man"],
      clue: { text: "Er ritt auf einem Pferd.", ...on("horse") },
      colour: "#ca8a04",
      face: "\u{1F920}",
    },
    {
      id: "V",
      name: "Vince",
      pronoun: "er",
      traits: ["man"],
      clue: {
        text: "Das Opfer. Nicht der Gesetzlose. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#57534e",
      face: "\u{1F935}",
    },
  ],
  rules: [
    {
      text: "Unter den Verdächtigen ist genau ein Gesetzloser, und er ist ein Mann.",
      note: true,
    },
  ],
  prune: stillPossible,
  hints: [
    {
      text: "Alle Felder neben dem Lagerfeuer liegen in der südlichen Ebene - dort ist Ehawee. Georgia war die einzige Frau ihrer Ebene, also ist sie in der nördlichen Ebene, mit genau drei Männern. Harrison ist immer dort: Alle Felder neben einem Felsen liegen in der nördlichen Ebene.",
    },
    {
      text: "Welche Männer passen noch in die nördliche Ebene? Forrest sitzt im Laden oder in der Hütte, Iktomi steht in einer Wohnstätte, Jackson in der Hütte, Vince wäre dort mit drei anderen. Bran steht frühestens in Zeile 7 (sechs Zeilen südlich des Gesetzlosen), und seine Felder der nördlichen Ebene dort - R7 C1, R7 C8, R8 C9 - liegen neben einem Felsen, der gehört Harrison allein. Die drei Männer bei Georgia sind also Harrison, Akecheta und Keith.",
    },
    {
      text: "Akecheta war nicht beim Gesetzlosen, der Gesetzlose ist also nicht in der nördlichen Ebene: nicht Harrison, nicht Keith (seine Pferde für sechs Zeilen über Bran liegen alle dort). Iktomi steht zu weit im Süden, Bran und Vince scheiden aus. Bleiben Forrest auf dem Stuhl R1 C11 und Jackson in der Hütte. In Spalte 11 müsste Dowanhowee in Spalte 8 außerhalb der nördlichen Ebene stehen - nur R8 C8 und R10 C8, beide am Feuer, das Ehawee allein gehört. Also ist Jackson der Gesetzlose in R2 C12, Bran steht in Zeile 8 und Dowanhowee in Spalte 9: R9 C9 liegt am Feuer, R11 C9 und R12 C9 in Chapawees Wohnstätte - sie steht in R10 C9.",
      place: { J: { row: 1, col: 11 }, D: { row: 9, col: 8 } },
    },
    {
      text: "Ehawee am Feuer: R8 C8 ist Brans Zeile, R9 C9 Dowanhowees Spalte, R10 C8 ihre Zeile - R9 C7. Chapawee in der südlichen Wohnstätte: Spalte 7 ist Ehawees, Spalte 9 Dowanhowees, R11 C8 ein Korb - R12 C8. Iktomi neben einem Korb: R10 C5 ist Dowanhowees Zeile, R8 C12 Jacksons Spalte, R9 C11 Ehawees Zeile, und bei Chapawee darf niemand sein - R11 C4. Keith auf einem Pferd: frei ist nur noch R4 C11.",
      place: {
        E: { row: 8, col: 6 },
        C: { row: 11, col: 7 },
        I: { row: 10, col: 3 },
        K: { row: 3, col: 10 },
      },
    },
    {
      text: "Forrest auf einem Stuhl: R2 C1 ist Jacksons Zeile, R1 C11 Keiths Spalte - R1 C3. Harrison neben einem Felsen: Zeile 1 ist Forrests, R2 C8 Jacksons Zeile, R6 C9 Dowanhowees Spalte, R7 C8 Chapawees Spalte, R8 C9 Brans Zeile - R7 C1.",
      place: { F: { row: 0, col: 2 }, H: { row: 6, col: 0 } },
    },
    {
      text: "Frei sind Zeile 3, 5 und 6 (dazu Brans Zeile 8) und die Spalten 2, 5, 6 und 10. Vince ist nicht in der nördlichen Ebene: R3 C2 im Laden oder R6 C5 im See. Im See wäre er nur mit Bran in R8 C2 zu zweit - dann stünden Akecheta in Zeile 3 und Georgia in Zeile 5 in den Spalten 6 und 10, und R5 C10 ist ein Bison. Vince steht also in R3 C2 im Laden.",
      place: { V: { row: 2, col: 1 } },
    },
    {
      text: "Akecheta steht nordwestlich von Georgia, also in Zeile 5, Georgia in Zeile 6: R5 C5 ist ein Strauch, R5 C10 ein Bison - Akecheta steht in R5 C6, Georgia in R6 C10 und Bran in R8 C5. Vince ist im Laden allein mit Forrest. Forrest ist der Mörder!",
      place: {
        A: { row: 4, col: 5 },
        G: { row: 5, col: 9 },
        B: { row: 7, col: 4 },
      },
    },
  ],
  solution: {
    A: { row: 4, col: 5 },
    B: { row: 7, col: 4 },
    C: { row: 11, col: 7 },
    D: { row: 9, col: 8 },
    E: { row: 8, col: 6 },
    F: { row: 0, col: 2 },
    G: { row: 5, col: 9 },
    H: { row: 6, col: 0 },
    I: { row: 10, col: 3 },
    J: { row: 1, col: 11 },
    K: { row: 3, col: 10 },
    V: { row: 2, col: 1 },
  },
};
