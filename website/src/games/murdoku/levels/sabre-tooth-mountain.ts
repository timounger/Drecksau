/**
 * Der Säbelzahnberg: the summit, the plateau, the ridge, the valley and the
 * lake of a stone-age mountain, with a murdered woman.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/56.png`, no solution
 * sheet - the solved grid is pencilled in on the small grid below the map,
 * the culprit under it, and the solver proves it is the only solution).
 * Vaka is the victim; whoever was alone with her killed her.
 *
 * The cards show no estates and the map no crowns. Instead four kinds of
 * fields are framed and marked: a fish (the fisher), a stone axe (the
 * toolmaker), a spear (the hunter) and a wolf (the wolf tamer, a woman). Each
 * trade was held by exactly one person, who stood on a field of it; nobody
 * else stood on a marked field ({@link TRADES}). Who held which trade, the
 * case does not say. The marked fields can be stood on; the sabre-tooth
 * cats, the boulder and the bushes cannot.
 */
import {
  about,
  alone,
  all,
  counting,
  not,
  own,
  row,
  victim,
} from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** The marked fields, one per trade. */
const TRADES: readonly string[] = ["fishingSpot", "stoneAxe", "spear", "wolf"];

/** The case. */
export const SABRE_TOOTH_MOUNTAIN: Level = {
  id: "sabre-tooth-mountain",
  name: "Der Säbelzahnberg",
  series: { book: "timeTravel", number: 56 },
  story:
    "Diese Katzen haben sieben Leben - aber das Opfer war nicht gerade das, was man katzenhaft nennt.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "S",
      name: "Gipfel",
      at: "auf dem Gipfel",
      ground: "stone",
      tint: "#ece4c8",
      label: { row: 1, col: 4 },
    },
    {
      key: "P",
      name: "Hochebene",
      at: "auf der Hochebene",
      ground: "stone",
      tint: "#e4dab4",
      label: { row: 4, col: 6 },
    },
    {
      key: "R",
      name: "Grat",
      at: "auf dem Grat",
      ground: "grass",
      tint: "#cfd08a",
      label: { row: 6, col: 4 },
    },
    {
      key: "V",
      name: "Tal",
      at: "im Tal",
      ground: "path",
      tint: "#b8977a",
      label: { row: 8, col: 0 },
    },
    {
      key: "L",
      name: "See",
      at: "im See",
      ground: "water",
      tint: "#9fcdf0",
      label: { row: 8, col: 7 },
    },
  ],
  areaMap: [
    "...SSS...",
    "..PPSSS..",
    "VRRPPPSP.",
    "VVRRPPPPP",
    "VVRRPPPPP",
    "VVRRRRRLL",
    "VVVVRRLLL",
    "VVVVVRLLL",
    "VVVVVVLLL",
  ],
  thingMap: [
    ".....w...",
    "...s.....",
    ".wz......",
    "..s.k..sz",
    "....s....",
    "..s...wff",
    "ba.w.sf..",
    "a..a..f..",
    ".ba.b.f..",
  ],
  things: {
    a: "stoneAxe",
    b: "shrub",
    f: "fishingSpot",
    k: "boulder",
    s: "spear",
    w: "wolf",
    z: "sabreTooth",
  },
  suspects: [
    {
      id: "A",
      name: "Awo",
      pronoun: "er",
      clue: {
        text: "Er war die nördlichste Person mit einem Handwerk.",
        ...all(
          own(onTrade),
          counting((c) =>
            c.people().every((one) => {
              const there = c.cellOf(one);
              return (
                there === undefined ||
                there.row >= c.cell.row ||
                !TRADES.some((what) => c.is(there, what))
              );
            }),
          ),
        ),
      },
      colour: "#b91c1c",
      face: "\u{1F9D4}\u{1F3FD}",
    },
    {
      id: "B",
      name: "Bask",
      pronoun: "er",
      clue: { text: "Er war nicht in der obersten Zeile.", ...not(row(1)) },
      colour: "#15803d",
      face: "\u{1F468}\u{1F3FD}",
    },
    {
      id: "C",
      name: "Caru",
      pronoun: "sie",
      clue: {
        text: "Sie war südlich von Bask.",
        ...about(["B"], (c) => {
          const bask = c.cellOf("B");
          return bask !== undefined && c.cell.row > bask.row;
        }),
      },
      colour: "#0e7490",
      face: "\u{1F469}\u{1F3FC}",
    },
    {
      id: "D",
      name: "Daska",
      pronoun: "sie",
      clue: {
        text: "Sie war im selben Bereich wie der Jäger oder der Werkzeugmacher.",
        ...counting((c) =>
          c.peopleIn(c.areaOf(c.cell) ?? "").some((one) => {
            const there = c.cellOf(one);
            return (
              one !== c.self &&
              there !== undefined &&
              (c.is(there, "spear") || c.is(there, "stoneAxe"))
            );
          }),
        ),
      },
      colour: "#6366f1",
      face: "\u{1F469}\u{1F3FD}",
    },
    {
      id: "E",
      name: "Efki",
      pronoun: "sie",
      clue: { text: "Sie war allein.", ...alone() },
      colour: "#a16207",
      face: "\u{1F469}\u{1F3FE}",
    },
    {
      id: "F",
      name: "Feek",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person neben einem Säbelzahntiger.",
        ...all(
          own((c) => c.beside(c.cell, "sabreTooth")),
          counting(
            (c) =>
              c.people().filter((one) => {
                const there = c.cellOf(one);
                return there !== undefined && c.beside(there, "sabreTooth");
              }).length === 1,
          ),
        ),
      },
      colour: "#be185d",
      face: "\u{1F9D4}\u{1F3FC}",
    },
    {
      id: "G",
      name: "Grek",
      pronoun: "er",
      clue: {
        text: "Er war südlich von Hawak.",
        ...about(["H"], (c) => {
          const hawak = c.cellOf("H");
          return hawak !== undefined && c.cell.row > hawak.row;
        }),
      },
      colour: "#57534e",
      face: "\u{1F9D4}\u{1F3FE}",
    },
    {
      id: "H",
      name: "Hawak",
      pronoun: "er",
      clue: {
        text: "Er war mit einem Mann und einer Frau zusammen. Sie war die Wolfsbändigerin.",
        ...counting(withManAndTamer),
      },
      colour: "#7c3aed",
      face: "\u{1F9D4}",
    },
    {
      id: "V",
      name: "Vaka",
      pronoun: "sie",
      clue: {
        text: "Das Opfer. Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F469}\u{1F3FB}",
    },
  ],
  rules: [
    {
      text: "Es gab einen Fischer, einen Werkzeugmacher, einen Jäger und eine Wolfsbändigerin. Jeder von ihnen stand auf einem Feld seines Handwerks, sonst niemand auf einem solchen Feld.",
      unary: (suspect, c) => !c.is(c.cell, "wolf") || suspect.pronoun === "sie",
      check: (c) => TRADES.every((what) => peopleOn(c, what).length === 1),
      prune: stillPossible,
    },
  ],
  hints: [
    {
      text: "Nur Feek steht neben einem Säbelzahntiger - der Wolf in R3 C2 bleibt also leer (die Wolfsbändigerin ist eine Frau). Auf R1 C6 hätte niemand nördlich von ihr Platz, also steht sie in R6 C7 oder R7 C4. Awo ist die nördlichste Person mit Handwerk: Fisch und Steinaxt liegen in R6 bis R9, südlich davon gibt es nur noch den Speer in R7 C6 - es passt nur, wenn Awo selbst der Jäger ist. Feek steht damit nicht auf einem Speer, sondern in R5 C9.",
      place: { F: { row: 4, col: 8 } },
    },
    {
      text: "Awo steht auf einem Speer: R4 C3 und R4 C8 liegen neben einem Säbelzahntiger, R5 C5 in Feeks Zeile, und von R7 C6 aus hätte die Wolfsbändigerin keinen Platz mehr südlich. In R2 C4 müsste sie nach R6 C7 - dann gäbe es keinen freien Fisch mehr (R6 und C7 besetzt). Awo steht in R6 C3, die Wolfsbändigerin in R7 C4.",
      place: { A: { row: 5, col: 2 } },
    },
    {
      text: "Der Werkzeugmacher: R7 C2 liegt in R7, R8 C4 in C4, R9 C3 in Awos Spalte - er steht in R8 C1. Der Fischer: R6 und C9 sind besetzt, R7 und R8 auch - er steht in R9 C7.",
    },
    {
      text: "Frei sind R1 bis R4 und C2, C5, C6, C8. In C2 bleibt nur R4 C2 (R3 C2 ist gesperrt), damit in R3 nur R3 C8, in R1 nur R1 C5 und in R2 nur R2 C6. Efki ist allein: Auf dem Grat steht Awo, im Tal stehen drei, auf dem Gipfel und der Hochebene je zwei - Efki ist die Fischerin in R9 C7.",
      place: { E: { row: 8, col: 6 } },
    },
    {
      text: "Daska ist beim Jäger oder beim Werkzeugmacher; Awo ist allein auf dem Grat, also ist sie im Tal. Dort war Hawak mit einem Mann und einer Frau, der Wolfsbändigerin - Daska steht in R7 C4. Grek steht südlich von Hawak: Hawak in R4 C2, Grek in R8 C1.",
      place: {
        D: { row: 6, col: 3 },
        H: { row: 3, col: 1 },
        G: { row: 7, col: 0 },
      },
    },
    {
      text: "Bask ist nicht in der obersten Zeile, Caru südlich von ihm: Bask steht in R2 C6, Caru in R3 C8, Vaka in R1 C5 - auf dem Gipfel allein mit Bask. Bask ist der Mörder!",
      place: {
        B: { row: 1, col: 5 },
        C: { row: 2, col: 7 },
        V: { row: 0, col: 4 },
      },
    },
  ],
  solution: {
    A: { row: 5, col: 2 },
    B: { row: 1, col: 5 },
    C: { row: 2, col: 7 },
    D: { row: 6, col: 3 },
    E: { row: 8, col: 6 },
    F: { row: 4, col: 8 },
    G: { row: 7, col: 0 },
    H: { row: 3, col: 1 },
    V: { row: 0, col: 4 },
  },
};

/** Whether the suspect stood on a marked field. */
function onTrade(c: Context): boolean {
  return TRADES.some((what) => c.is(c.cell, what));
}

/** Everybody standing on a thing of this id. */
function peopleOn(c: Context, what: string): readonly string[] {
  return c.people().filter((one) => {
    const there = c.cellOf(one);
    return there !== undefined && c.is(there, what);
  });
}

/** Whether exactly a man and a woman shared the area, the woman on a wolf field. */
function withManAndTamer(c: Context): boolean {
  const others = c
    .peopleIn(c.areaOf(c.cell) ?? "")
    .filter((one) => one !== c.self);
  const women = others.filter((one) => c.has(one, "woman"));
  const tamer = women[0];
  const there = tamer === undefined ? undefined : c.cellOf(tamer);
  return (
    others.length === 2 &&
    women.length === 1 &&
    there !== undefined &&
    c.is(there, "wolf")
  );
}

/**
 * For the solver only: whether a partial placement breaks nothing yet - at
 * most one person per trade, nobody but Feek beside a sabre-tooth cat, nobody
 * with Efki, at most two with Hawak or Vaka, no trade north of Awo, and
 * every free row, free column and open trade still has a free field.
 */
function stillPossible(c: Context): boolean {
  const company = (id: string) => {
    const there = c.cellOf(id);
    return there === undefined
      ? 0
      : c.peopleIn(c.areaOf(there) ?? "").length - 1;
  };
  const awo = c.cellOf("A");
  return (
    TRADES.every((what) => peopleOn(c, what).length <= 1) &&
    c.people().every((one) => {
      const there = c.cellOf(one);
      return (
        one === "F" || there === undefined || !c.beside(there, "sabreTooth")
      );
    }) &&
    linesFillable(c) &&
    company("E") === 0 &&
    company("H") <= 2 &&
    company("V") <= 1 &&
    (awo === undefined ||
      TRADES.every((what) =>
        peopleOn(c, what).every((one) => (c.cellOf(one)?.row ?? 0) >= awo.row),
      ))
  );
}

/** For the solver only: whether every free row and column still has a free field, and every trade nobody holds yet one south of Awo. */
function linesFillable(c: Context): boolean {
  const taken = c.people().flatMap((one) => {
    const there = c.cellOf(one);
    return there === undefined ? [] : [there];
  });
  const free: Cell[] = [];
  for (let r = 0; r < c.rows; r += 1) {
    for (let k = 0; k < c.cols; k += 1) {
      const cell = { row: r, col: k };
      if (
        c.standable(cell) &&
        !taken.some((there) => there.row === r || there.col === k)
      ) {
        free.push(cell);
      }
    }
  }
  const awo = c.cellOf("A");
  const rowsLeft = c.rows - taken.length;
  const rowsOpen = new Set(free.map((cell) => cell.row)).size;
  const colsOpen = new Set(free.map((cell) => cell.col)).size;
  return (
    rowsOpen >= rowsLeft &&
    colsOpen >= rowsLeft &&
    TRADES.every(
      (what) =>
        peopleOn(c, what).length === 1 ||
        free.some(
          (cell) =>
            c.is(cell, what) && (awo === undefined || cell.row > awo.row),
        ),
    )
  );
}
