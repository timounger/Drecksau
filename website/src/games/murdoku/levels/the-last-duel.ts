/**
 * Das letzte Duell: an ice hockey rink with its stands, the players' and
 * penalty benches, two changing rooms, a snack bar and a fan shop, with a
 * murdered referee.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/80. Das letzte Duell.JPG`,
 * solved on `Lösungen 1-80/Lösung 77-80.JPG`).
 * Odoardo is the victim; whoever was alone with him killed him.
 *
 * The team of a suspect is the side of the rink: columns 1 to 6 are the
 * Yetis, columns 7 to 12 the Wolves (the rule under the magnifier). The
 * stadium seats are the chairs and can be stood on; the tables (the L-shaped
 * one in the snack bar and the T-shaped counter in the fan shop among them),
 * the TVs and the shelves cannot. A field is in a corner of its area when
 * the area's border runs along two of its sides that meet: one above or
 * below it, one to its left or right.
 */
import {
  about,
  all,
  alone,
  beside,
  counting,
  inArea,
  not,
  on,
  own,
  victim,
} from "../engine/clues";
import { contextOf } from "../engine/rules";
import type { Cell, Context, Level } from "../engine/types";

/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */

/** The first column of the Wolves' side, from nought. */
const WOLVES_FROM = 6;

/** Whether a field is on the Yetis' side. */
function isYeti(cell: Cell): boolean {
  return cell.col < WOLVES_FROM;
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

/** Whether nobody in the suspect's area sat on a chair. */
function nobodySeated(c: Context): boolean {
  return c.peopleIn(c.areaOf(c.cell) ?? "").every((id) => {
    const there = c.cellOf(id);
    return there === undefined || !c.is(there, "chair");
  });
}

/** Whether the suspect was alone with two women of opposing teams. */
function withTwoRivalWomen(c: Context): boolean {
  const others = c
    .peopleIn(c.areaOf(c.cell) ?? "")
    .filter((id) => id !== c.self);
  const fields = others.flatMap((id) => {
    const there = c.cellOf(id);
    return there === undefined ? [] : [there];
  });
  return (
    others.length === 2 &&
    others.every((id) => c.has(id, "woman")) &&
    fields.length === 2 &&
    isYeti(fields[0]) !== isYeti(fields[1])
  );
}

/**
 * Whether the suspect's area has fields on both sides of the rink - what two
 * women of opposing teams beside him need of his own field.
 */
function roomForRivals(c: Context): boolean {
  const fields = c.cellsOf(c.areaOf(c.cell) ?? "").filter(c.standable);
  return fields.some(isYeti) && fields.some((cell) => !isYeti(cell));
}

/** Whether the suspect stood exactly four columns west of Harry. */
function fourWestOfHarry(c: Context): boolean {
  return c.cellOf("H")?.col === c.cell.col + 4;
}

/** Whether the suspect stood north-west of both Harry and Kim. */
function northWestOfHarryAndKim(c: Context): boolean {
  return ["H", "K"].every((id) => {
    const there = c.cellOf(id);
    return (
      there !== undefined && there.row > c.cell.row && there.col > c.cell.col
    );
  });
}

/** Whether the suspect was alone with Gino, on the other team. */
function aloneWithRivalGino(c: Context): boolean {
  const gino = c.cellOf("G");
  const company = c.peopleIn(c.areaOf(c.cell) ?? "");
  return (
    gino !== undefined &&
    company.length === 2 &&
    company.includes("G") &&
    isYeti(gino) !== isYeti(c.cell)
  );
}

/** Whether the suspect was on Julia's team. */
function sameTeamAsJulia(c: Context): boolean {
  const julia = c.cellOf("J");
  return julia !== undefined && isYeti(julia) === isYeti(c.cell);
}

/** Everybody else in the area of somebody placed, or none while unplaced. */
function companyOf(c: Context, id: string): readonly string[] {
  const there = c.cellOf(id);
  return there === undefined
    ? []
    : c.peopleIn(c.areaOf(there) ?? "").filter((one) => one !== id);
}

/** The women of the case, by id. */
const WOMEN: readonly string[] = ["A", "F", "I", "J", "K"];

/** Once all women stand, whether Dietmar has two of them, one per team. */
function dietmarStillPossible(c: Context, dietmar: readonly string[]): boolean {
  const women = dietmar.flatMap((id) => {
    const there = c.cellOf(id);
    return there === undefined ? [] : [there];
  });
  return (
    c.cellOf("D") === undefined ||
    WOMEN.some((id) => c.cellOf(id) === undefined) ||
    (women.length === 2 && isYeti(women[0]) !== isYeti(women[1]))
  );
}

/** Once Harry stands, whether Gino still has a free ice field north-west of him. */
function ginoStillPossible(c: Context): boolean {
  const harry = c.cellOf("H");
  const taken = c.people().flatMap((id) => {
    const there = c.cellOf(id);
    return there === undefined ? [] : [there];
  });
  return (
    harry === undefined ||
    c.cellOf("G") !== undefined ||
    c
      .cellsOf("E")
      .some(
        (cell) =>
          cell.row < harry.row &&
          cell.col < harry.col &&
          !taken.some(
            (there) => there.row === cell.row || there.col === cell.col,
          ),
      )
  );
}

/** The fields each suspect's own clue allows, worked out once. */
const domains = new Map<string, readonly Cell[]>();

/** The fields a suspect's own clue allows. */
function domainOf(c: Context, id: string): readonly Cell[] {
  const known = domains.get(id);
  const unary = c.level.suspects.find((one) => one.id === id)?.clue.unary;
  const cells: Cell[] = [];
  if (known === undefined) {
    for (let row = 0; row < c.rows; row += 1) {
      for (let col = 0; col < c.cols; col += 1) {
        const cell = { row, col };
        if (
          c.standable(cell) &&
          (unary === undefined || unary(contextOf(c.level, { [id]: cell }, id)))
        ) {
          cells.push(cell);
        }
      }
    }
    domains.set(id, cells);
  }
  return known ?? cells;
}

/** Whether each list can get a line of its own - a matching, found greedily with augmenting paths. */
function linesShareOut(lists: readonly (readonly number[])[]): boolean {
  const owner = new Map<number, number>();
  const take = (who: number, seen: Set<number>): boolean =>
    (lists[who] ?? []).some((line) => {
      const holder = owner.get(line);
      const fits =
        !seen.has(line) &&
        (seen.add(line), holder === undefined || take(holder, seen));
      if (fits) {
        owner.set(line, who);
      }
      return fits;
    });
  return lists.every((_, who) => take(who, new Set<number>()));
}

/** Whether every suspect still to place can get a free row and a free column of their own. */
function linesLeft(c: Context): boolean {
  const placed = c.people();
  const taken = placed.flatMap((id) => {
    const there = c.cellOf(id);
    return there === undefined ? [] : [there];
  });
  const free = c.level.suspects
    .filter((one) => !placed.includes(one.id))
    .map((one) =>
      domainOf(c, one.id).filter(
        (cell) =>
          !taken.some(
            (there) => there.row === cell.row || there.col === cell.col,
          ),
      ),
    );
  return (
    free.every((cells) => cells.length > 0) &&
    linesShareOut(
      free.map((cells) => [...new Set(cells.map((at) => at.row))]),
    ) &&
    linesShareOut(free.map((cells) => [...new Set(cells.map((at) => at.col))]))
  );
}

/**
 * For the solver only: whether a partial placement can still come right -
 * Ben still alone, Odoardo with one other at most, nobody seated with Anna,
 * only two women with Dietmar, only Gino with Harry, and a row and a column
 * left for everybody.
 */
function stillPossible(c: Context): boolean {
  const dietmar = companyOf(c, "D");
  const harry = companyOf(c, "H");
  return (
    companyOf(c, "B").length === 0 &&
    companyOf(c, "O").length <= 1 &&
    companyOf(c, "A").every((id) => {
      const there = c.cellOf(id);
      return there === undefined || !c.is(there, "chair");
    }) &&
    dietmar.length <= 2 &&
    dietmar.every((id) => c.has(id, "woman")) &&
    harry.every((id) => id === "G") &&
    (c.cellOf("H") === undefined ||
      c.cellOf("G") === undefined ||
      harry.includes("G")) &&
    dietmarStillPossible(c, dietmar) &&
    ginoStillPossible(c) &&
    linesLeft(c)
  );
}

/** The case. */
export const THE_LAST_DUEL: Level = {
  id: "the-last-duel",
  name: "Das letzte Duell",
  series: { book: "original", number: 80 },
  story:
    "Wenn Odoardo noch am Leben wäre, müsste er eine Strafe für Stockschlag vergeben.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "N",
      name: "Tribüne (Nord)",
      at: "auf der Tribüne (Nord)",
      ground: "floor",
      tint: "#c9d3ea",
      label: { row: 1, col: 3 },
    },
    {
      key: "Y",
      name: "Spielerbank Yetis",
      at: "auf der Spielerbank Yetis",
      ground: "floor",
      tint: "#cfe8ee",
      label: { row: 2, col: 2 },
      labelOverhang: true,
    },
    {
      key: "W",
      name: "Spielerbank Wölfe",
      at: "auf der Spielerbank Wölfe",
      ground: "floor",
      tint: "#cfe8ee",
      label: { row: 2, col: 7 },
      labelOverhang: true,
    },
    {
      key: "U",
      name: "Umkleide Yetis",
      at: "in der Umkleide Yetis",
      ground: "floor",
      tint: "#cdbfe0",
      label: { row: 5, col: 0 },
      labelOverhang: true,
    },
    {
      key: "E",
      name: "Eisfläche",
      at: "auf der Eisfläche",
      ground: "floor",
      tint: "#f2f5f8",
      label: { row: 6, col: 5 },
    },
    {
      key: "V",
      name: "Umkleide Wölfe",
      at: "in der Umkleide Wölfe",
      ground: "floor",
      tint: "#cdbfe0",
      label: { row: 6, col: 10 },
      labelOverhang: true,
    },
    {
      key: "P",
      name: "Strafbank",
      at: "auf der Strafbank",
      ground: "floor",
      tint: "#cfe8ee",
      label: { row: 7, col: 5 },
    },
    {
      key: "S",
      name: "Tribüne (Süd)",
      at: "auf der Tribüne (Süd)",
      ground: "floor",
      tint: "#c9d3ea",
      label: { row: 8, col: 0 },
      labelOverhang: true,
    },
    {
      key: "I",
      name: "Imbiss",
      at: "im Imbiss",
      ground: "floor",
      tint: "#cfe8ee",
      label: { row: 11, col: 0 },
    },
    {
      key: "F",
      name: "Fanshop",
      at: "im Fanshop",
      ground: "floor",
      tint: "#cdbfe0",
      label: { row: 11, col: 7 },
    },
  ],
  areaMap: [
    "NNNNNNNNNNNN",
    "NNNNNNNNNNNN",
    "NNYYYNNWWWNN",
    "UUEEEEEEEENN",
    "UUEEEEEEEEVV",
    "UUEEEEEEEEVV",
    "SSEEEEEEEEVV",
    "SSSPPPPPPSSS",
    "SSSSSSSSSSFF",
    "IIISSSSSFFFF",
    "IIIIIIFFFFFF",
    "IIIIIIFFFFFF",
  ],
  thingMap: [
    "f.cc.c.cccc.",
    "t.ccccccc..s",
    "..ccc..c.c..",
    ".t........c.",
    "..........c.",
    "t..........s",
    "cc..........",
    ".ccccc.ccc.c",
    ".c..ccc.cc.s",
    "tftctftcttt.",
    "..cttc...ts.",
    "..cctct..tts",
  ],
  things: {
    c: "chair",
    f: "tv",
    s: "shelf",
    t: "table",
  },
  shapes: [
    [
      { row: 10, col: 3 },
      { row: 10, col: 4 },
      { row: 11, col: 4 },
    ],
    [
      { row: 9, col: 8 },
      { row: 9, col: 9 },
      { row: 9, col: 10 },
      { row: 10, col: 9 },
      { row: 11, col: 9 },
      { row: 11, col: 10 },
    ],
  ],
  suspects: [
    {
      id: "A",
      name: "Anna",
      pronoun: "sie",
      clue: {
        text: "Das Maskottchen der Yetis. Niemand in ihrem Raum saß.",
        ...all(
          own((c) => isYeti(c.cell)),
          counting(nobodySeated),
        ),
      },
      colour: "#b91c1c",
      face: "\u{1F43B}‍❄️",
    },
    {
      id: "B",
      name: "Ben",
      pronoun: "er",
      clue: {
        text: "Er war allein in einer der Umkleiden.",
        ...all(inArea("U", "V"), alone()),
      },
      colour: "#15803d",
      face: "\u{1F468}",
    },
    {
      id: "C",
      name: "Chris",
      pronoun: "er",
      clue: {
        text: "Er saß auf einem Stuhl auf einer der Spielerbänke.",
        ...all(on("chair"), inArea("Y", "W")),
      },
      colour: "#0e7490",
      face: "\u{1F9D1}",
    },
    {
      id: "D",
      name: "Dietmar",
      pronoun: "er",
      clue: {
        text: "Er war allein mit zwei Frauen. Diese Frauen waren in gegnerischen Teams.",
        ...all(own(roomForRivals), counting(withTwoRivalWomen)),
      },
      colour: "#6366f1",
      face: "\u{1F60E}",
    },
    {
      id: "E",
      name: "Eugen",
      pronoun: "er",
      clue: {
        text: "Er war genau vier Spalten westlich von Harry.",
        ...about(["H"], fourWestOfHarry),
      },
      colour: "#7c3aed",
      face: "\u{1F935}",
    },
    {
      id: "F",
      name: "Freya",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Fernseher.", ...beside("tv") },
      colour: "#9f1239",
      face: "\u{1F475}",
    },
    {
      id: "G",
      name: "Gino",
      pronoun: "er",
      clue: {
        text: "Er war nordwestlich von sowohl Harry als auch Kim.",
        ...about(["H", "K"], northWestOfHarryAndKim),
      },
      colour: "#ea580c",
      face: "\u{1F9D4}",
    },
    {
      id: "H",
      name: "Harry",
      pronoun: "er",
      clue: {
        text: "Er war allein mit Gino auf der Eisfläche. Sie waren in gegnerischen Teams.",
        ...all(inArea("E"), counting(aloneWithRivalGino)),
      },
      colour: "#4338ca",
      face: "\u{1F468}",
    },
    {
      id: "I",
      name: "Isabella",
      pronoun: "sie",
      clue: {
        text: "Das Maskottchen der Wölfe. Sie war neben einem Regal.",
        ...all(
          own((c) => !isYeti(c.cell)),
          beside("shelf"),
        ),
      },
      colour: "#be185d",
      face: "\u{1F43A}",
    },
    {
      id: "J",
      name: "Julia",
      pronoun: "sie",
      clue: {
        text: "Sie war in einer Ecke. Sie saß nicht.",
        ...all(
          own((c) => inCorner(c, c.cell)),
          not(on("chair")),
        ),
      },
      colour: "#78716c",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "K",
      name: "Kim",
      pronoun: "sie",
      clue: {
        text: "Sie war in Spalte 6 oder 7. Sie und Julia waren im selben Team.",
        ...all(
          own((c) => c.cell.col === 5 || c.cell.col === 6),
          about(["J"], sameTeamAsJulia),
        ),
      },
      colour: "#8b5cf6",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "O",
      name: "Odoardo",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F468}",
    },
  ],
  rules: [
    {
      text: "Alle Verdächtigen in den Spalten 1 bis 6 waren im Team Yetis (als Fan, Maskottchen oder Spieler). Alle Verdächtigen in den Spalten 7 bis 12 waren im Team Wölfe.",
      prune: stillPossible,
    },
  ],
  hints: [
    {
      text: "Dietmar, mit Frauen aus beiden Teams, muss auf der Tribüne (N oder S) sein. Auf der Tribüne (S) kann Dietmar nicht mit Anna sein (nur Z8 & Z9 haben Felder ohne Stuhl) oder mit Isabella (kein Regal), und Freya, Julia und Kim können alle nur in Z9 sein. Dietmar und die Frauen müssen auf der Tribüne (N) sein.",
    },
    {
      text: "Chris sitzt in Z3; schließe den Rest von Z3 aus. Das Tribüne-(N)-Trio ist in Z1/Z2/Z4; schließe den Rest von Z4 aus. Isabella (neben einem Regal in S11 oder S12) und die Person in Z4 besetzen S11 und S12. Ben muss in der Yetis-Umkleide sein.",
      place: { C: { row: 2, col: 2 } },
    },
    {
      text: "Gino, nordwestlich von Harry, muss auch in Z5 oder Z6 sein. Das setzt Harry in Z7. Gino muss ein Yeti sein, Harry ein Wolf. Schließe die Wolfsseite in Z5 und Z6 aus, und die Yetiseite (und Wolfs-Umkleide) in Z7.",
    },
    {
      text: "Eugen, vier Spalten westlich von Harry, ist in S3-S6, beim Team Yetis. Freya ist auch ein Yeti (alle Felder neben Fernsehern sind in S1-S6). Wir kennen fünf Yetis (Anna, Ben, Eugen, Freya, Gino); nur einer fehlt. Julia und Kim, im selben Team, müssen Wölfe sein, also ist Kim in S7. Die einzigen stuhllosen Ecken, in denen ein Wolf sein kann, sind in S11 & S12, die von Isabella und der Person in Z4 besetzt sind, die Julia sein muss (in S12).",
      place: { J: { row: 3, col: 11 } },
    },
    {
      text: "Die andere Frau mit Dietmar ist ein Yeti, also ist Isabella nicht auf der Tribüne (N), was Isabella im Fanshop lokalisiert. Das setzt Freya in S2 (in Z1 oder Z11), was Ben lokalisiert.",
      place: { I: { row: 8, col: 10 }, B: { row: 4, col: 0 } },
    },
    {
      text: "Yeti Anna, nicht auf einem Stuhl, kann nur auf der Tribüne (N) sein. Das lokalisiert Anna und Dietmar, dann Freya in Z11, dann Kim in Z8. Eugen und Harry müssen in S4 und S8 sein; das lokalisiert Harry, Chris und Gino, dann Eugen und Odoardo. Isabella ist die Mörderin!",
      place: {
        A: { row: 0, col: 4 },
        D: { row: 1, col: 9 },
        F: { row: 10, col: 1 },
        K: { row: 7, col: 6 },
        H: { row: 6, col: 7 },
        G: { row: 5, col: 5 },
        E: { row: 9, col: 3 },
        O: { row: 11, col: 8 },
      },
    },
  ],
  solution: {
    A: { row: 0, col: 4 },
    B: { row: 4, col: 0 },
    C: { row: 2, col: 2 },
    D: { row: 1, col: 9 },
    E: { row: 9, col: 3 },
    F: { row: 10, col: 1 },
    G: { row: 5, col: 5 },
    H: { row: 6, col: 7 },
    I: { row: 8, col: 10 },
    J: { row: 3, col: 11 },
    K: { row: 7, col: 6 },
    O: { row: 11, col: 8 },
  },
};
