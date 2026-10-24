/**
 * Die Eiszeit: a northern and a southern hut, the frozen lake, the carving
 * hall and the tundra round them, with a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/61.png`, no solution
 * sheet - the solved grid and the culprit are pencilled in on the
 * photographed page, and the solver proves it is the only solution).
 * Voruk is the victim; whoever was alone with him killed him.
 *
 * The cards show no estates and the map no crowns. Instead five kinds of
 * fields are framed and marked: a spear (a hunter - there were two), a fish
 * (the fisher), a stone axe (the toolmaker), a wolf (the wolf tamer) and a
 * basket of berries (the gatherer). Exactly as many people stood on the
 * fields of a trade as held it; nobody else stood on a marked field
 * ({@link TRADES}). Beds and the marked fields can be stood on; the holes in
 * the ice, the mammoth, boulders, bushes, bone piles and the fires cannot.
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

/** The marked fields and how many held each trade. */
const TRADES: readonly (readonly [string, number])[] = [
  ["spear", 2],
  ["fishingSpot", 1],
  ["stoneAxe", 1],
  ["wolf", 1],
  ["berries", 1],
];

/** The case. */
export const THE_ICE_AGE: Level = {
  id: "the-ice-age",
  name: "Die Eiszeit",
  series: { book: "timeTravel", number: 61 },
  story:
    "Treffender geht es nicht: Rache ist ein Gericht, das man kalt serviert.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "N",
      name: "Nordhütte",
      at: "in der Nordhütte",
      ground: "floor",
      tint: "#cdbfe6",
      label: { row: 5, col: 0 },
    },
    {
      key: "L",
      name: "See",
      at: "auf dem See",
      ground: "snow",
      tint: "#a9c8f0",
      label: { row: 6, col: 4 },
    },
    {
      key: "T",
      name: "Tundra",
      at: "in der Tundra",
      ground: "snow",
      tint: "#e2ecf6",
      label: { row: 9, col: 1 },
    },
    {
      key: "W",
      name: "Schnitzhalle",
      at: "in der Schnitzhalle",
      ground: "floor",
      tint: "#b4b4e2",
      label: { row: 11, col: 2 },
    },
    {
      key: "S",
      name: "Südhütte",
      at: "in der Südhütte",
      ground: "floor",
      tint: "#cdbfe6",
      label: { row: 11, col: 8 },
    },
  ],
  areaMap: [
    "NNNNNNNTTTTT",
    "NNNNNNTTTTTT",
    "NNNNLLTTTTTT",
    "NNNLLLLTTTTT",
    "NNNLLLLTTTTT",
    "NNLLLLLLTTTT",
    "TTTLLLLTTTTS",
    "TTTTTTTTTTSS",
    "TTTTTTTTTSSS",
    "TTTWWTTTSSSS",
    "TTWWWWTSSSSS",
    "TWWWWWWSSSSS",
  ],
  thingMap: [
    "hkkbbl....r.",
    ".f....hos.s.",
    ".bbk.n.....o",
    "bb...i..mm.s",
    "...n....mmo.",
    "...ni....o.s",
    "ra.....rs.s.",
    "aoaar.lh...b",
    ".a..a......b",
    "...kk......l",
    ".....a...bfk",
    "..h.aa...bkk",
  ],
  things: {
    a: "stoneAxe",
    b: "bed",
    f: "campfire",
    h: "bonePile",
    i: "iceHole",
    k: "berries",
    l: "wolf",
    m: "mammoth",
    n: "fishingSpot",
    o: "boulder",
    r: "shrub",
    s: "spear",
  },
  extraThings: {
    iceHole: {
      name: "Eisloch",
      emoji: "\u{1F573}\u{FE0F}",
      standable: false,
    },
  },
  pieces: [
    { at: { row: 0, col: 3 }, rows: 1, cols: 2 },
    { at: { row: 2, col: 1 }, rows: 1, cols: 2 },
    { at: { row: 3, col: 0 }, rows: 1, cols: 2 },
    { at: { row: 3, col: 8 }, rows: 2, cols: 2 },
    { at: { row: 7, col: 11 }, rows: 2, cols: 1 },
    { at: { row: 10, col: 9 }, rows: 2, cols: 1 },
  ],
  suspects: [
    {
      id: "A",
      name: "Akor",
      pronoun: "er",
      clue: { text: "Er war neben einem Feuer.", ...beside("campfire") },
      colour: "#b91c1c",
      face: "\u{1F474}\u{1F3FC}",
    },
    {
      id: "B",
      name: "Bruk",
      pronoun: "er",
      clue: {
        text: "Er war nördlich von Ishka. Er war neben einem Strauch.",
        ...all(
          beside("shrub"),
          about(["I"], (c) => {
            const ishka = c.cellOf("I");
            return ishka !== undefined && c.cell.row < ishka.row;
          }),
        ),
      },
      colour: "#15803d",
      face: "\u{1F43B}",
    },
    {
      id: "C",
      name: "Crog",
      pronoun: "er",
      clue: {
        text: "Er war neben einem Felsen. Jemand anderes war neben dem Mammut.",
        ...all(
          beside("boulder"),
          counting((c) =>
            c.people().some((one) => {
              const there = c.cellOf(one);
              return (
                one !== c.self &&
                there !== undefined &&
                c.beside(there, "mammoth")
              );
            }),
          ),
        ),
      },
      colour: "#0e7490",
      face: "\u{1F9D4}\u{1F3FD}",
    },
    {
      id: "D",
      name: "Duna",
      pronoun: "sie",
      clue: {
        text: "Sie war in der Nordhütte. Dort hatte jemand ein Handwerk.",
        ...all(
          inArea("N"),
          counting((c) =>
            c.peopleIn("N").some((one) => onTrade(c, c.cellOf(one))),
          ),
        ),
      },
      colour: "#6366f1",
      face: "\u{1F471}\u{1F3FC}\u{200D}\u{2640}\u{FE0F}",
    },
    {
      id: "E",
      name: "Eshna",
      pronoun: "sie",
      clue: {
        text: "Sie war westlich beider Jäger. Sie war östlich der Person, die Beeren sammelte.",
        ...counting(
          (c) =>
            peopleOn(c, "spear").every(
              (one) => (c.cellOf(one)?.col ?? -1) > c.cell.col,
            ) &&
            peopleOn(c, "berries").every(
              (one) => (c.cellOf(one)?.col ?? c.cols) < c.cell.col,
            ),
        ),
      },
      colour: "#a16207",
      face: "\u{1F469}\u{1F3FD}",
    },
    {
      id: "F",
      name: "Fahl",
      pronoun: "er",
      clue: { text: "Er war auf dem See.", ...inArea("L") },
      colour: "#be185d",
      face: "\u{1F9D4}\u{1F3FC}",
    },
    {
      id: "G",
      name: "Ganik",
      pronoun: "er",
      clue: {
        text: "Er hatte ein Handwerk. Er war nördlich aller anderen mit einem Handwerk.",
        ...all(
          own((c) => onTrade(c, c.cell)),
          counting((c) =>
            c.people().every((one) => {
              const there = c.cellOf(one);
              return (
                one === c.self ||
                !onTrade(c, there) ||
                (there?.row ?? 0) > c.cell.row
              );
            }),
          ),
        ),
      },
      colour: "#57534e",
      face: "\u{1F9D4}\u{1F3FF}",
    },
    {
      id: "H",
      name: "Havi",
      pronoun: "sie",
      clue: {
        text: "Sie war genau eine Zeile südlich von Kratu.",
        ...about(["K"], (c) => {
          const kratu = c.cellOf("K");
          return kratu !== undefined && c.cell.row === kratu.row + 1;
        }),
      },
      colour: "#7c3aed",
      face: "\u{1F469}\u{1F3FD}\u{200D}\u{1F9B1}",
    },
    {
      id: "I",
      name: "Ishka",
      pronoun: "er",
      clue: {
        text: "Er war der Werkzeugmacher oder ein Jäger.",
        ...own((c) => c.is(c.cell, "stoneAxe") || c.is(c.cell, "spear")),
      },
      colour: "#ea580c",
      face: "\u{1F468}\u{1F3FD}\u{200D}\u{1F9B2}",
    },
    {
      id: "J",
      name: "Juk",
      pronoun: "er",
      clue: { text: "Er war in der Schnitzhalle.", ...inArea("W") },
      colour: "#4338ca",
      face: "\u{1F474}\u{1F3FB}",
    },
    {
      id: "K",
      name: "Kratu",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person auf einem Bett.",
        ...all(
          on("bed"),
          counting((c) => peopleOn(c, "bed").length === 1),
        ),
      },
      colour: "#334155",
      face: "\u{1F9D4}\u{1F3FE}",
    },
    {
      id: "V",
      name: "Voruk",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F474}\u{1F3FC}",
    },
  ],
  rules: [
    {
      text: "Es gab zwei Jäger, einen Fischer, einen Werkzeugmacher, einen Wolfsbändiger und eine Person, die Beeren sammelte. Sie standen auf den Feldern ihres Handwerks, sonst niemand auf einem solchen Feld.",
      check: (c) =>
        TRADES.every(([what, count]) => peopleOn(c, what).length === count),
      prune: stillPossible,
    },
  ],
  hints: [
    {
      text: "Eshna steht östlich der Person, die Beeren sammelte, und westlich beider Jäger - in der Südhütte wurde also nicht gesammelt. Wer in R1 ein Handwerk hat, muss Ganik sein: Niemand stünde nördlich von ihm. Akor steht neben einem Feuer, nicht auf einem Bett (Kratus), nicht auf einem Beerenkorb: R2 C1, R2 C3 oder R10 C11. Damit bleibt der Speer in R2 C11 leer - wer dort jagte, nähme Akor R2 und C11.",
    },
    {
      text: "Bruk kann nicht der Werkzeugmacher sein: Ishka (südlich von ihm) müsste dann jagen, und südlich von R7 gibt es keinen Speer. Bruk und Crog stehen immer in der Tundra, Voruk also nie. Den Wolf in R1 C6 kann nur Ganik bändigen, den in R8 C7 nur Eshna (Havi steht nie in R8, weil in R7 kein Bett ist). In R10 C12 müsste Akor nach R2 - dann blieben ohne R2 und C12 für zwei Jäger nur die Speere in R7. Neben dem Mammut kann außer Crog nur Eshna oder Havi stehen.",
    },
    {
      text: "Angenommen, Eshna bändigte in R8 C7. Neben dem Mammut stünde dann Havi (R4 C8, R4 C11 oder R5 C8), Kratu in R3 oder R4 der Nordhütte. R10 bis R12 füllen Juk, Akor in R10 C11 und Ishka oder Voruk (ohne Akor wäre Voruk allein in der Südhütte). C11 gehört Akor, also steht Havi in C8; die Jäger belegen C9 und C12, und C10 bleibt Bruk (R1 C10), Crog (R7 C10) oder Voruk (R9 C10). Mit Bruk in R7 C9 jagt Crog in R4 C12, und Kratu hat keine Zeile. Mit Bruk in R1 C10 jagt Ganik in R2 C9, gesammelt wird in R3 C4, Kratu liegt in R4, Havi steht in R5 C8, Ishka jagt in R6 C12 - und kein Fisch bleibt frei. Also bändigt Ganik die Wölfe in R1 C6.",
      place: { G: { row: 0, col: 5 } },
    },
    {
      text: "Bruk steht damit in R7 C9 und jagt (R1 ist Ganiks Zeile, R8 C6 seine Spalte). Ishka steht südlich von ihm, also ist er der Werkzeugmacher. Für den zweiten Jäger bleibt nur R4 C12 - Crog oder Havi. Jagte Havi dort, läge Kratu in R3, Eshna stünde in R5 C8 am Mammut, Crog in R6 C11, und Fahl hätte im See keine Zeile mehr. Crog jagt in R4 C12. Kratu kann nun weder in R3 noch in R4 noch in C12 liegen: Er liegt in R11 C10, Havi steht in R12.",
      place: {
        B: { row: 6, col: 8 },
        C: { row: 3, col: 11 },
        K: { row: 10, col: 9 },
      },
    },
    {
      text: "Neben dem Mammut steht also Eshna, westlich von Bruk und nicht in Crogs Zeile: R5 C8. Juk ist in der Schnitzhalle, R11 und R12 sind besetzt - er sammelt die Beeren in R10. Akor steht daher in R2, Ishka auf einer Steinaxt in R8 oder R9.",
      place: { E: { row: 4, col: 7 } },
    },
    {
      text: "Für Duna, Fahl, Voruk und Ishka bleiben R3, R6, R8 und R9. Voruk ist nicht in der Tundra: R8 C11 oder R9 C11 in der Südhütte - Duna und Fahl teilen sich R3 und R6. Fischen kann nur Fahl, und R3 C6 liegt in Ganiks Spalte: Fahl steht in R6 C4, Duna in R3 C1, Akor in R2 C3, Juk in R10 C5, Ishka in R9 C2, Voruk in R8 C11 und Havi in R12 C7.",
      place: {
        F: { row: 5, col: 3 },
        D: { row: 2, col: 0 },
        A: { row: 1, col: 2 },
        J: { row: 9, col: 4 },
        I: { row: 8, col: 1 },
        V: { row: 7, col: 10 },
        H: { row: 11, col: 6 },
      },
    },
    {
      text: "Voruk war in der Südhütte allein mit Kratu. Kratu ist der Mörder!",
    },
  ],
  solution: {
    A: { row: 1, col: 2 },
    B: { row: 6, col: 8 },
    C: { row: 3, col: 11 },
    D: { row: 2, col: 0 },
    E: { row: 4, col: 7 },
    F: { row: 5, col: 3 },
    G: { row: 0, col: 5 },
    H: { row: 11, col: 6 },
    I: { row: 8, col: 1 },
    J: { row: 9, col: 4 },
    K: { row: 10, col: 9 },
    V: { row: 7, col: 10 },
  },
};

/** Whether somebody stood on a marked field. */
function onTrade(c: Context, cell: Cell | undefined): boolean {
  return cell !== undefined && TRADES.some(([what]) => c.is(cell, what));
}

/** Everybody standing on a thing of this id or kind. */
function peopleOn(c: Context, what: string): readonly string[] {
  return c.people().filter((one) => {
    const there = c.cellOf(one);
    return there !== undefined && c.is(there, what);
  });
}

/**
 * For the solver only: whether a partial placement breaks nothing yet - no
 * more traders than there were and at most one on a bed, nobody with a trade
 * as far north as Ganik, Eshna between the gatherer and the hunters, at most
 * one with Voruk, and every free row, free column and open trade still with
 * a free field (south of Ganik, for a trade).
 */
function stillPossible(c: Context): boolean {
  const ganik = c.cellOf("G");
  const eshna = c.cellOf("E");
  const voruk = c.cellOf("V");
  const traders = c.people().filter((one) => onTrade(c, c.cellOf(one)));
  return (
    peopleOn(c, "bed").length <= 1 &&
    TRADES.every(([what, count]) => peopleOn(c, what).length <= count) &&
    (ganik === undefined ||
      traders.every(
        (one) => one === "G" || (c.cellOf(one)?.row ?? 0) > ganik.row,
      )) &&
    (eshna === undefined ||
      (peopleOn(c, "spear").every(
        (one) => (c.cellOf(one)?.col ?? 0) > eshna.col,
      ) &&
        peopleOn(c, "berries").every(
          (one) => (c.cellOf(one)?.col ?? 0) < eshna.col,
        ))) &&
    (voruk === undefined || c.peopleIn(c.areaOf(voruk) ?? "").length <= 2) &&
    linesFillable(c, ganik)
  );
}

/** For the solver only: whether every free row and column, and every open trade, still has a free field. */
function linesFillable(c: Context, ganik: Cell | undefined): boolean {
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
  const left = c.rows - taken.length;
  return (
    new Set(free.map((cell) => cell.row)).size >= left &&
    new Set(free.map((cell) => cell.col)).size >= left &&
    TRADES.every(([what, count]) => {
      const open = count - peopleOn(c, what).length;
      const room = free.filter(
        (cell) =>
          c.is(cell, what) && (ganik === undefined || cell.row > ganik.row),
      );
      return open <= 0 || new Set(room.map((cell) => cell.row)).size >= open;
    })
  );
}
