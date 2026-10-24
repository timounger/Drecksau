/**
 * Der Markt: herbalist, armoury, statues, fruit and fish stalls, cattle and
 * horse pens along a market lane, with a murdered knight.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/13.png`, no solution
 * sheet - a solving attempt is pencilled in on the photographed page, and
 * the solver proves the solution is the only one). Valen is the victim;
 * whoever was alone with him killed him.
 *
 * The map is twelve by twelve with fields missing at the top right and the
 * bottom left. Horses and mud puddles can be stood on; plants and pigs
 * cannot, as the book's legend says, and neither can cows, tables, barrels,
 * crates, statues, weapon racks and pots. Every kind of object and animal
 * had at least one person beside it ({@link KINDS}).
 *
 * The book's estates: nobles (purple cards: Alden, Berthild, Cassia,
 * Damien) only in the crowned herbalist's, armoury, statues and horse pen,
 * villagers (wooden cards: Herward, Irene, Jacob, Kathelyn) only in the
 * other areas, knights (grey shields: Edgar, Florabel, Gunther, Valen)
 * anywhere.
 */
import {
  about,
  alone,
  all,
  beside,
  counting,
  inArea,
  on,
  own,
  ranks,
  victim,
} from "../engine/clues";
import { contextOf, isStandableFor } from "../engine/rules";
import type { Cell, Context, Level } from "../engine/types";

/** Every kind of object and animal on the map, each with somebody beside it. */
const KINDS: readonly string[] = [
  "pot",
  "barrel",
  "statue",
  "table",
  "weaponRack",
  "cow",
  "woodCrate",
  "pig",
  "horse",
  "plant",
];

/** Whom Alden was north of: the knights and the other nobles. */
const BELOW_ALDEN: readonly string[] = ["B", "C", "D", "E", "F", "G", "V"];

/** The four sides of a field. */
const STEPS: readonly Cell[] = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

/** The fields on either side of a field that are on the map. */
function sidesOf(c: Context, cell: Cell): readonly Cell[] {
  return STEPS.map((step) => ({
    row: cell.row + step.row,
    col: cell.col + step.col,
  })).filter((side) => c.inside(side));
}

/** Everybody standing on a thing of this id. */
function peopleOn(c: Context, what: string): readonly string[] {
  return c.people().filter((id) => {
    const there = c.cellOf(id);
    return there !== undefined && c.is(there, what);
  });
}

/** Whether exactly two things of one kind lie beside the suspect. */
function besideTwoAlike(c: Context): boolean {
  return KINDS.some((kind) => c.besideCount(c.cell, kind) === 2);
}

/** Whether the suspect's field borders an area where nobody stood. */
function besideAnEmptyArea(c: Context): boolean {
  return sidesOf(c, c.cell).some((side) => {
    const area = c.areaOf(side);
    return (
      area !== null &&
      area !== c.areaOf(c.cell) &&
      c.peopleIn(area).length === 0
    );
  });
}

/** Whether the suspect's field borders Damien's area. */
function besideDamiensArea(c: Context): boolean {
  const damien = c.cellOf("D");
  const area = damien === undefined ? null : c.areaOf(damien);
  return (
    area !== null &&
    area !== c.areaOf(c.cell) &&
    sidesOf(c, c.cell).some((side) => c.areaOf(side) === area)
  );
}

/** Whether the suspect stood south-west of the only person in a mud puddle. */
function southWestOfTheOneInMud(c: Context): boolean {
  const inMud = peopleOn(c, "mud");
  const one = inMud[0];
  const there = one === undefined ? undefined : c.cellOf(one);
  return (
    inMud.length === 1 &&
    there !== undefined &&
    c.cell.row > there.row &&
    c.cell.col < there.col
  );
}

/** Whether every kind of object and animal had somebody beside it. */
function everyKindAttended(c: Context): boolean {
  return KINDS.every((kind) =>
    c.people().some((id) => {
      const there = c.cellOf(id);
      return there !== undefined && c.beside(there, kind);
    }),
  );
}

/**
 * For the solver only: whether a partial placement can still be finished -
 * never two people on horses or in mud, nobody with Kathelyn, nobody of
 * Alden's row or north of him, never three with Valen, and neither Valen
 * nor Kathelyn in the lane, where Herward and Jacob always are.
 */
function stillPossible(c: Context): boolean {
  const kathelyn = c.cellOf("K");
  const alden = c.cellOf("A");
  const valen = c.cellOf("V");
  return (
    peopleOn(c, "horse").length <= 1 &&
    peopleOn(c, "mud").length <= 1 &&
    (kathelyn === undefined ||
      c.peopleIn(c.areaOf(kathelyn) ?? "").length === 1) &&
    (alden === undefined ||
      BELOW_ALDEN.every((id) => {
        const there = c.cellOf(id);
        return there === undefined || there.row > alden.row;
      })) &&
    (valen === undefined ||
      (c.areaOf(valen) !== "W" &&
        c.peopleIn(c.areaOf(valen) ?? "").length <= 2)) &&
    (kathelyn === undefined || c.areaOf(kathelyn) !== "W") &&
    ireneStillFits(c) &&
    herwardStillFits(c) &&
    openingsStillThere(c)
  );
}

/** The fields each suspect's own clue and the estates allow, worked out once. */
const DOMAINS = new Map<string, readonly Cell[]>();

/** The fields a suspect's own clue and the estates allow. */
function domainOf(c: Context, id: string): readonly Cell[] {
  const known = DOMAINS.get(id);
  const cells: Cell[] = [];
  const suspect = c.level.suspects.find((one) => one.id === id);
  if (known === undefined && suspect !== undefined) {
    for (let row = 0; row < c.rows; row += 1) {
      for (let col = 0; col < c.cols; col += 1) {
        const cell = { row, col };
        const alone = contextOf(c.level, { [id]: cell }, id);
        const unary = suspect.clue.unary;
        if (
          isStandableFor(c.level, id, cell) &&
          (unary === undefined || unary(alone)) &&
          (c.level.rules ?? []).every(
            (rule) => rule.unary === undefined || rule.unary(suspect, alone),
          )
        ) {
          cells.push(cell);
        }
      }
    }
    DOMAINS.set(id, cells);
  }
  return known ?? cells;
}

/**
 * For the solver only: twelve people, twelve rows, twelve columns - every
 * free row and column still needs somebody unplaced who may stand in it;
 * every kind of object and animal still needs somebody beside it, and a mud
 * puddle somebody in it.
 */
function openingsStillThere(c: Context): boolean {
  const placed = c.people().flatMap((id) => {
    const there = c.cellOf(id);
    return there === undefined ? [] : [there];
  });
  const rowFree = (row: number) => placed.every((one) => one.row !== row);
  const colFree = (col: number) => placed.every((one) => one.col !== col);
  const options = c.level.suspects
    .filter((one) => c.cellOf(one.id) === undefined)
    .flatMap((one) =>
      domainOf(c, one.id).filter(
        (cell) => rowFree(cell.row) && colFree(cell.col),
      ),
    );
  const reachable = (test: (cell: Cell) => boolean) =>
    placed.some(test) || options.some(test);
  const lines = Array.from({ length: c.rows }, (_, at) => at);
  return (
    lines.every(
      (at) =>
        (!rowFree(at) || options.some((cell) => cell.row === at)) &&
        (!colFree(at) || options.some((cell) => cell.col === at)),
    ) &&
    KINDS.every((kind) => reachable((cell) => c.beside(cell, kind))) &&
    reachable((cell) => c.is(cell, "mud"))
  );
}

/** For the solver only: Irene south-west of whoever is already in mud. */
function ireneStillFits(c: Context): boolean {
  const irene = c.cellOf("I");
  return (
    irene === undefined ||
    peopleOn(c, "mud").every((id) => {
      const there = c.cellOf(id);
      return (
        there !== undefined && irene.row > there.row && irene.col < there.col
      );
    })
  );
}

/** For the solver only: an area beside Herward is still empty. */
function herwardStillFits(c: Context): boolean {
  const herward = c.cellOf("R");
  return (
    herward === undefined ||
    besideAnEmptyArea({ ...c, cell: herward, self: "R" })
  );
}

/** The case. */
export const THE_MARKET: Level = {
  id: "the-market",
  name: "Der Markt",
  series: { book: "timeTravel", number: 13 },
  story: "Erst jetzt merke ich, wie sehr ich Einkaufszentren vermisse.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "H",
      name: "Kräuterladen",
      at: "im Kräuterladen",
      ground: "floor",
      tint: "#ddd3f0",
      label: { row: 3, col: 2 },
    },
    {
      key: "A",
      name: "Waffenkammer",
      at: "in der Waffenkammer",
      ground: "floor",
      tint: "#c7cdea",
      label: { row: 3, col: 7 },
    },
    {
      key: "S",
      name: "Statuen",
      at: "bei den Statuen",
      ground: "stone",
      tint: "#c9c3d8",
      label: { row: 8, col: 1 },
    },
    {
      key: "W",
      name: "Gang",
      at: "im Gang",
      ground: "path",
      tint: "#ece6c8",
      label: { row: 11, col: 10 },
    },
    {
      key: "F",
      name: "Obststand",
      at: "am Obststand",
      ground: "stone",
      tint: "#d6d6cc",
      label: { row: 7, col: 7 },
    },
    {
      key: "P",
      name: "Fischstand",
      at: "am Fischstand",
      ground: "stone",
      tint: "#d0d6d0",
      label: { row: 7, col: 10 },
    },
    {
      key: "G",
      name: "Viehpferch",
      at: "im Viehpferch",
      ground: "stone",
      tint: "#c9ccc6",
      label: { row: 10, col: 7 },
    },
    {
      key: "C",
      name: "Pferdekoppel",
      at: "in der Pferdekoppel",
      ground: "floor",
      tint: "#d3c3ea",
      label: { row: 10, col: 10 },
    },
  ],
  areaMap: [
    "HHHWWAAAAAA.",
    "HHHWWAAAAAA.",
    "HHHWWAAAAAA.",
    "HHHWWAAAAAA.",
    "SSSWWWWWWWW.",
    "SSSWFFFFFWPP",
    "SSSWFFFFFWPP",
    "SSSWFFFFFWPP",
    "SSSWGGGGGWCC",
    "..WWGGGGGWCC",
    "..WWGGGGGWCC",
    "..WWWWWWWWWW",
  ],
  thingMap: [
    "p....o......",
    ".pt.hw..tw..",
    ".pt...w.tx..",
    "pp...wx.w...",
    "tst.m.....h.",
    ".....k......",
    "s.s..t.tk...",
    "....xttt.m.o",
    "sss.xxv.x.th",
    "....v.v.v.ht",
    ".....gtv...h",
    "..xgh..m....",
  ],
  things: {
    g: "pig",
    h: "horse",
    k: "barrel",
    m: "mud",
    o: "pot",
    p: "plant",
    s: "statue",
    t: "table",
    v: "cow",
    w: "weaponRack",
    x: "woodCrate",
  },
  pieces: [
    { at: { row: 1, col: 2 }, rows: 2, cols: 1 },
    { at: { row: 1, col: 8 }, rows: 2, cols: 1 },
  ],
  shapes: [
    [
      { row: 6, col: 5 },
      { row: 7, col: 5 },
      { row: 7, col: 6 },
      { row: 7, col: 7 },
      { row: 6, col: 7 },
    ],
  ],
  suspects: [
    {
      id: "A",
      traits: ["noble"],
      name: "Alden",
      pronoun: "er",
      clue: {
        text: "Er war nördlich aller Ritter und der übrigen Adligen.",
        ...about(BELOW_ALDEN, (c) =>
          BELOW_ALDEN.every((id) => {
            const there = c.cellOf(id);
            return there !== undefined && c.cell.row < there.row;
          }),
        ),
      },
      colour: "#7c3aed",
      face: "\u{1F474}",
    },
    {
      id: "B",
      traits: ["noble"],
      name: "Berthild",
      pronoun: "sie",
      clue: {
        text: "Sie war östlich von Gunther.",
        ...about(["G"], (c) => {
          const gunther = c.cellOf("G");
          return gunther !== undefined && c.cell.col > gunther.col;
        }),
      },
      colour: "#be185d",
      face: "\u{1F478}",
    },
    {
      id: "C",
      traits: ["noble"],
      name: "Cassia",
      pronoun: "sie",
      clue: {
        text: "Sie war genau eine Zeile nördlich von Irene.",
        ...about(["I"], (c) => {
          const irene = c.cellOf("I");
          return irene !== undefined && c.cell.row === irene.row - 1;
        }),
      },
      colour: "#4338ca",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "D",
      traits: ["noble"],
      name: "Damien",
      pronoun: "er",
      clue: {
        text: "Er war neben genau zwei gleichen Gegenständen oder Tieren.",
        ...own(besideTwoAlike),
      },
      colour: "#6366f1",
      face: "\u{1F934}",
    },
    {
      id: "E",
      traits: ["knight"],
      name: "Edgar",
      pronoun: "er",
      clue: {
        text: "Er war neben mindestens einem Tier (Pferd, Schwein oder Kuh).",
        ...beside("animal"),
      },
      colour: "#57534e",
      face: "\u{1F9D4}",
    },
    {
      id: "F",
      traits: ["knight"],
      name: "Florabel",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person, die auf einem Pferd ritt.",
        ...all(
          on("horse"),
          counting((c) => peopleOn(c, "horse").length === 1),
        ),
      },
      colour: "#ea580c",
      face: "\u{1F482}‍♀️",
    },
    {
      id: "G",
      traits: ["knight"],
      name: "Gunther",
      pronoun: "er",
      clue: { text: "Er war neben einem Tisch.", ...beside("table") },
      colour: "#0e7490",
      face: "\u{1F482}",
    },
    {
      id: "R",
      traits: ["villager"],
      name: "Herward",
      pronoun: "er",
      clue: {
        text: "Er war im Gang, neben einem leeren Bereich.",
        ...all(inArea("W"), counting(besideAnEmptyArea)),
      },
      colour: "#a16207",
      face: "\u{1F474}",
    },
    {
      id: "I",
      traits: ["villager"],
      name: "Irene",
      pronoun: "sie",
      clue: {
        text: "Sie war südwestlich der einzigen Person in einer Schlammpfütze.",
        ...counting(southWestOfTheOneInMud),
      },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "J",
      traits: ["villager"],
      name: "Jacob",
      pronoun: "er",
      clue: {
        text: "Er war im Gang, neben Damiens Bereich.",
        ...all(inArea("W"), about(["D"], besideDamiensArea)),
      },
      colour: "#15803d",
      face: "\u{1F9D4}‍♂️",
    },
    {
      id: "K",
      traits: ["villager"],
      name: "Kathelyn",
      pronoun: "sie",
      clue: { text: "Sie war allein.", ...alone() },
      colour: "#db2777",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "V",
      traits: ["knight"],
      name: "Valen",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#334155",
      face: "\u{1F468}‍\u{1F9B1}",
    },
  ],
  rules: [
    ranks(
      "Adlige (\u{1F451}) waren nur im Kräuterladen, in der Waffenkammer, bei den Statuen oder in der Pferdekoppel, Dorfbewohner nur in den anderen Bereichen, Ritter überall.",
      ["H", "A", "S", "C"],
    ),
    {
      text: "Jede Art von Gegenstand und Tier hatte mindestens eine Person neben sich.",
      check: everyKindAttended,
      prune: stillPossible,
    },
  ],
  hints: [
    {
      text: "Neben jeder Art von Gegenstand und Tier steht jemand. Pflanzen gibt es nur im Kräuterladen, Statuen nur bei den Statuen, Waffenständer nur in der Waffenkammer, Fässer nur am Obststand, Kühe nur im Viehpferch - diese Bereiche sind besetzt, der Gang auch (Herward, Jacob). Leer sein können nur Fischstand oder Pferdekoppel. Valen ist nie im Gang: Dort wäre er nicht mit genau einer Person allein.",
    },
    {
      text: "Irene steht südwestlich der einzigen Person in einer Schlammpfütze, also nicht selbst darin - und südlich von R12 C8 ist nichts. In R5 C5 kann niemand stehen: Adlige und Valen nicht im Gang, Kathelyn wäre dort nicht allein, Herward hätte keinen leeren Bereich neben sich, Jacob keinen Bereich Damiens, Edgar kein Tier, Gunther keinen Tisch, Florabel kein Pferd. Aus denselben Gründen bleibt für R8 C10 nur Herward: Er steht dort, und der Fischstand neben ihm ist leer.",
      place: { R: { row: 7, col: 9 } },
    },
    {
      text: "Neben einem Topf steht jemand - der Fischstand ist leer, also steht jemand in R1 C7 der Waffenkammer. Ein Adliger oder Ritter in R1 kann nur Alden sein. Irene steht südwestlich von Herward, also ab R9, und Cassia eine Zeile darüber in einem gekrönten Bereich: R8 ist Herwards Zeile, R9 bei den Statuen ist voller Statuen, und auf ein Pferd darf nur Florabel - Cassia steht in R11 C11. Irene steht in R12 westlich von C10: R12 C5 ist ein Pferd, R12 C7 Aldens Spalte, R12 C8 eine Schlammpfütze - es bleiben R12 C6 und R12 C9.",
      place: { A: { row: 0, col: 6 }, C: { row: 10, col: 10 } },
    },
    {
      text: "In C12 muss jemand stehen: R6 C12 und R7 C12 liegen im leeren Fischstand, R8 C12 ist ein Topf, R10 C12 ein Tisch, R11 C12 und R12 C12 liegen in Cassias und Irenes Zeile. Es bleibt das Pferd in R9 C12 - dort reitet Florabel. R5 hat nur Gangfelder frei: R5 C4, C6, C8 und C9, keines neben einem Tier oder Tisch. Adlige und Valen sind nie im Gang, Kathelyn wäre dort nicht allein, Irene steht in R12, Florabel reitet - in R5 steht Jacob.",
      place: { F: { row: 8, col: 11 } },
    },
    {
      text: "Neben einem Fass steht jemand: R6 C7 ist Aldens Spalte, R8 C9 Herwards Zeile - also steht jemand in R6 C5 oder R6 C9. Neben einer Statue steht jemand: R6 ist damit belegt, R8 ist Herwards Zeile - es bleibt R7 C2. Gunther steht neben einem Tisch: R1 ist Aldens Zeile, R6 und R7 sind belegt, R8 C9 ist Herwards Zeile, der Tisch im Viehpferch steht zwischen Kühen und Schwein, die der Koppel nur neben Pferden. Es bleiben R2 C8, R3 C8 und R4 C3. Berthild ist adlig und östlich von Gunther - östlich von C8 läge sie in Aldens Zeile oder in Herwards, Cassias oder Florabels Spalte. Gunther steht in R4 C3.",
      place: { G: { row: 3, col: 2 } },
    },
    {
      text: "Damien steht neben genau zwei gleichen Dingen: im Kräuterladen in R2 C1 oder R3 C1 (zwei Pflanzen), bei den Statuen in R7 C2 (R8 ist Herwards Zeile), in der Waffenkammer nur in R2 C7 - Aldens Spalte; R3 C6 hat drei Waffenständer. Jacob in R5 grenzt an Damiens Bereich, aber nie an den Kräuterladen: Damien steht in R7 C2, Jacob in R5 C4, dem einzigen Feld neben den Statuen.",
      place: { D: { row: 6, col: 1 }, J: { row: 4, col: 3 } },
    },
    {
      text: "Übrig sind Berthild, Edgar, Kathelyn und Valen für R2, R3, R6 und R10. Kathelyn ist allein, also nicht im Gang oder im leeren Fischstand. Stünde sie im Viehpferch, müsste Valen in R6 am Fass stehen (Berthild ist adlig, Edgar hätte dort kein Tier) - allein am Obststand. Also steht Kathelyn in R6. In C1 bleiben R2 C1 und R3 C1 im Kräuterladen: Berthild wäre dort nicht östlich von Gunther, Edgar hätte kein Tier - dort steht Valen. Neben einem Waffenständer steht jemand: R1 und R4 sind belegt, R2 C7 ist Aldens Spalte, R2 C11 Cassias - es bleiben R3 C6 und R3 C8, und dorthin kann nur Berthild. Valen steht in R2 C1, allein mit Gunther.",
      place: { V: { row: 1, col: 0 } },
    },
    {
      text: "Edgar bleibt nur R10, neben Kühen: R10 C6 oder R10 C8. C5 kann nur noch Kathelyn füllen: R6 C5 (R3 C5 ist Berthilds Zeile). Berthild und Edgar teilen sich C6 und C8, Irene steht also in R12 C9. Neben einer Kiste steht jemand: R3 C11 ist Cassias Spalte, R4 Gunthers Zeile, R7 Damiens, R9 Florabels, R11 Cassias - es bleibt R10 C6. Edgar steht dort, Berthild in R3 C8. Gunther ist der Mörder!",
      place: {
        K: { row: 5, col: 4 },
        E: { row: 9, col: 5 },
        I: { row: 11, col: 8 },
        B: { row: 2, col: 7 },
      },
    },
  ],
  solution: {
    A: { row: 0, col: 6 },
    B: { row: 2, col: 7 },
    C: { row: 10, col: 10 },
    D: { row: 6, col: 1 },
    E: { row: 9, col: 5 },
    F: { row: 8, col: 11 },
    G: { row: 3, col: 2 },
    R: { row: 7, col: 9 },
    I: { row: 11, col: 8 },
    J: { row: 4, col: 3 },
    K: { row: 5, col: 4 },
    V: { row: 1, col: 0 },
  },
};
