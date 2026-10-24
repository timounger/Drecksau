/**
 * Das Duell: a post office, a general store, a bank, a stable, a barber's
 * shop, a saloon, the jail and the sheriff's office round a dusty street,
 * two outlaws hiding among the suspects and a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/28.png`, no solution
 * sheet - the solved grid and the culprit are pencilled in on the
 * photographed page, and the solver proves it is the only solution). Vinny
 * is the victim; whoever was alone with him killed him. The case plays in
 * the Wild West, so there are no estates.
 *
 * **Who the outlaws are is not printed - it is part of the puzzle.** There
 * are exactly two, Vinny is none of them, and each was alone with somebody
 * who is no outlaw. Hugo was with an outlaw, and Kate stood exactly one
 * column west of one. The clues about the outlaws hold when some pair fits
 * them all ({@link someGang}).
 *
 * The doors sit in the walls between a building and the street; a field is
 * in front of a door when the door lies on one of its sides ({@link DOORS}).
 * Chairs and horses - two of them stand in the post office - can be stood
 * on; shelves, crates, cacti, plants and the tables cannot.
 */
import {
  about,
  alone,
  all,
  beside,
  column,
  counting,
  inArea,
  not,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** The doors: the two fields on either side of each. */
const DOORS: readonly (readonly [Cell, Cell])[] = [
  [
    { row: 1, col: 2 },
    { row: 1, col: 3 },
  ],
  [
    { row: 1, col: 7 },
    { row: 1, col: 8 },
  ],
  [
    { row: 5, col: 2 },
    { row: 5, col: 3 },
  ],
  [
    { row: 6, col: 8 },
    { row: 6, col: 9 },
  ],
  [
    { row: 8, col: 7 },
    { row: 8, col: 8 },
  ],
  [
    { row: 9, col: 1 },
    { row: 9, col: 2 },
  ],
];

/** Who may be an outlaw: everybody but Vinny. */
const MAYBE_OUTLAWS: readonly string[] = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
];

/** Every pair of outlaws. */
const GANGS: readonly (readonly string[])[] = MAYBE_OUTLAWS.flatMap(
  (first, at) => MAYBE_OUTLAWS.slice(at + 1).map((second) => [first, second]),
);

/** Whether a door lies on one of a field's sides. */
function beforeDoor(cell: Cell): boolean {
  return DOORS.some((door) =>
    door.some((one) => one.row === cell.row && one.col === cell.col),
  );
}

/** The people in somebody's area, without them. */
function companyOf(c: Context, id: string): readonly string[] {
  const there = c.cellOf(id);
  return there === undefined
    ? []
    : c.peopleIn(c.areaOf(there) ?? "").filter((other) => other !== id);
}

/** Whether every clue about the outlaws holds for this pair. */
function fits(c: Context, gang: readonly string[]): boolean {
  const kate = c.cellOf("K");
  return (
    kate !== undefined &&
    gang.every((id) => {
      const company = companyOf(c, id);
      return company.length === 1 && !gang.includes(company[0] ?? "");
    }) &&
    companyOf(c, "H").some((id) => gang.includes(id)) &&
    gang.some((id) => c.cellOf(id)?.col === kate.col + 1)
  );
}

/** Whether some pair of outlaws fits every clue about them. */
function someGang(c: Context): boolean {
  return GANGS.some((gang) => fits(c, gang));
}

/** Whether a field's row has a cactus in it. */
function cactusInRow(c: Context): boolean {
  return Array.from({ length: c.cols }, (_, col) => col).some((col) =>
    c.is({ row: c.cell.row, col }, "cactus"),
  );
}

/** Whether nobody but the suspect rode a horse. */
function onlyRider(c: Context): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return id === c.self || there === undefined || !c.is(there, "horse");
  });
}

/** Whether somebody stood in the jail. */
function somebodyInJail(c: Context): boolean {
  return c.peopleIn("C").length > 0;
}

/**
 * For the solver: whether nobody but one yet shares Vinny's area, nobody
 * yet shares Charlotte's, who was alone, and nobody but Dalton rides.
 *
 * @param c - the context, with the people placed so far
 * @returns false when the placement can no longer be finished
 */
function stillPossible(c: Context): boolean {
  const crowd = (id: string) => {
    const there = c.cellOf(id);
    return there === undefined ? 0 : c.peopleIn(c.areaOf(there) ?? "").length;
  };
  const riders = c.people().filter((id) => {
    const there = c.cellOf(id);
    return id !== "D" && there !== undefined && c.is(there, "horse");
  });
  return (
    crowd("V") <= 2 &&
    crowd("C") <= 1 &&
    crowd("H") <= 2 &&
    riders.length === 0 &&
    rowLeft(c, "E", "I", 1) &&
    rowLeft(c, "I", "E", -1) &&
    JAIL.some((cell) => cellLeft(c, cell)) &&
    GANGS.some((gang) => mayFit(c, gang))
  );
}

/** The fields of the jail somebody can stand on. */
const JAIL: readonly Cell[] = [
  { row: 8, col: 10 },
  { row: 9, col: 11 },
];

/**
 * For the solver: whether a field is taken, or its row and column are free.
 *
 * @param c - the context, with the people placed so far
 * @param cell - the field
 * @returns false when nobody can stand there any more
 */
function cellLeft(c: Context, cell: Cell): boolean {
  return (
    c.personAt(cell) !== null ||
    c.people().every((id) => {
      const there = c.cellOf(id);
      return (
        there === undefined ||
        (there.row !== cell.row && there.col !== cell.col)
      );
    })
  );
}

/**
 * For the solver: once one of Emil and Isaac stands, the row the other needs
 * must still be free.
 *
 * @param c - the context, with the people placed so far
 * @param placed - who stands
 * @param other - who is still to come
 * @param step - how many rows from the one to the other
 * @returns false when the other can no longer be placed
 */
function rowLeft(
  c: Context,
  placed: string,
  other: string,
  step: number,
): boolean {
  const there = c.cellOf(placed);
  return (
    there === undefined ||
    c.cellOf(other) !== undefined ||
    c.people().every((id) => c.cellOf(id)?.row !== there.row + step)
  );
}

/**
 * For the solver: whether the people placed so far leave this pair of
 * outlaws possible - nobody else yet beside an outlaw but one who is none,
 * Hugo's company only an outlaw, an outlaw left for Kate's eastern column.
 *
 * @param c - the context, with the people placed so far
 * @param gang - the pair
 * @returns false when the pair can no longer be the outlaws
 */
function mayFit(c: Context, gang: readonly string[]): boolean {
  const kate = c.cellOf("K");
  const hugoCompany = c.cellOf("H") === undefined ? [] : companyOf(c, "H");
  const placedGang = gang.filter((id) => c.cellOf(id) !== undefined);
  return (
    placedGang.every((id) => {
      const company = companyOf(c, id);
      return (
        company.length <= 1 && company.every((other) => !gang.includes(other))
      );
    }) &&
    hugoCompany.every((id) => gang.includes(id)) &&
    (kate === undefined ||
      gang.some((id) => {
        const there = c.cellOf(id);
        return there === undefined || there.col === kate.col + 1;
      }))
  );
}

/** The case. */
export const THE_DUEL: Level = {
  id: "the-duel",
  name: "Das Duell",
  series: { book: "timeTravel", number: 28 },
  story:
    'Die letzten Worte des Opfers waren: "Diese Stadt ist nicht groß genug für uns beide." Und so entstanden die Vorstädte.',
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "P",
      name: "Postamt",
      at: "im Postamt",
      ground: "floor",
      tint: "#cfcbd0",
      label: { row: 2, col: 1 },
    },
    {
      key: "T",
      name: "Gemischtwarenladen",
      at: "im Gemischtwarenladen",
      ground: "floor",
      tint: "#d8d4d4",
      label: { row: 6, col: 0 },
      labelOverhang: true,
    },
    {
      key: "N",
      name: "Bank",
      at: "in der Bank",
      ground: "floor",
      tint: "#d8d4d4",
      label: { row: 11, col: 1 },
    },
    {
      key: "X",
      name: "Draußen",
      at: "draußen",
      ground: "sand",
      tint: "#f2efc8",
      label: { row: 11, col: 6 },
    },
    {
      key: "E",
      name: "Stall",
      at: "im Stall",
      ground: "stone",
      tint: "#b7bccb",
      label: { row: 5, col: 7 },
    },
    {
      key: "R",
      name: "Barbier",
      at: "beim Barbier",
      ground: "floor",
      tint: "#bfc5d6",
      label: { row: 2, col: 10 },
    },
    {
      key: "S",
      name: "Saloon",
      at: "im Saloon",
      ground: "floor",
      tint: "#cfcbd0",
      label: { row: 7, col: 10 },
    },
    {
      key: "C",
      name: "Gefängnis",
      at: "im Gefängnis",
      ground: "stone",
      tint: "#b2bccf",
      label: { row: 9, col: 10 },
    },
    {
      key: "O",
      name: "Büro des Sheriffs",
      at: "im Büro des Sheriffs",
      ground: "stone",
      tint: "#bcc4d4",
      label: { row: 11, col: 8 },
    },
  ],
  areaMap: [
    "PPPXXXXXRRRR",
    "PPPXXXXXRRRR",
    "PPPPXXEEERRR",
    "TTTTXXXEESSS",
    "TTTTXXXEESSS",
    "TTTXXXEEESSS",
    "TTTXXXXXXSSS",
    "NNNXXXXXXSSS",
    "NNNXXXXXOOCC",
    "NNXXXXXXOOCC",
    "NNNXXXXXOOOO",
    "NNNXXXXXOOOO",
  ],
  thingMap: [
    "ph.pkkpx....",
    "px.......chc",
    "x......p....",
    "h.hh......cc",
    "..........tt",
    "h.......p.c.",
    "..h...p...tt",
    "lt...p.kp...",
    ".ttp.......x",
    "......p.t.x.",
    "l.c.k...t...",
    "c....p.....h",
  ],
  things: {
    c: "chair",
    h: "shelf",
    k: "cactus",
    l: "plant",
    p: "horse",
    t: "table",
    x: "woodCrate",
  },
  pieces: [
    { at: { row: 4, col: 10 }, rows: 1, cols: 2 },
    { at: { row: 6, col: 10 }, rows: 1, cols: 2 },
    { at: { row: 9, col: 8 }, rows: 2, cols: 1 },
  ],
  // The bank counter, round a corner.
  shapes: [
    [
      { row: 7, col: 1 },
      { row: 8, col: 1 },
      { row: 8, col: 2 },
    ],
  ],
  windows: [
    { at: { row: 1, col: 2 }, side: "right", door: true },
    { at: { row: 1, col: 7 }, side: "right", door: true },
    { at: { row: 5, col: 2 }, side: "right", door: true },
    { at: { row: 6, col: 8 }, side: "right", door: true },
    { at: { row: 8, col: 7 }, side: "right", door: true },
    { at: { row: 9, col: 1 }, side: "right", door: true },
  ],
  suspects: [
    {
      id: "A",
      name: "Adeline",
      pronoun: "sie",
      clue: {
        text: "Sie war nicht draußen. In ihrer Zeile war ein Kaktus.",
        ...all(not(inArea("X")), own(cactusInRow)),
      },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Bobby",
      pronoun: "er",
      clue: {
        text: "Er saß im Saloon auf einem Stuhl.",
        ...all(inArea("S"), on("chair")),
      },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Charlotte",
      pronoun: "sie",
      clue: {
        text: "Sie war allein. Sie war neben einem Regal.",
        ...all(alone(), beside("shelf")),
      },
      colour: "#0e7490",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "D",
      name: "Dalton",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person, die auf einem Pferd ritt.",
        ...all(on("horse"), counting(onlyRider)),
      },
      colour: "#6366f1",
      face: "\u{1F474}",
    },
    {
      id: "E",
      name: "Emil",
      pronoun: "er",
      clue: {
        text: "Er war genau eine Zeile nördlich von Isaac. Er war nicht im Gefängnis.",
        ...all(
          not(inArea("C")),
          about(["I"], (c) => {
            const isaac = c.cellOf("I");
            return isaac !== undefined && c.cell.row === isaac.row - 1;
          }),
        ),
      },
      colour: "#a16207",
      face: "\u{1F468}",
    },
    {
      id: "F",
      name: "Fred",
      pronoun: "er",
      clue: {
        text: "Er war westlich von Vinny.",
        ...about(["V"], (c) => {
          const vinny = c.cellOf("V");
          return vinny !== undefined && c.cell.col < vinny.col;
        }),
      },
      colour: "#9f1239",
      face: "\u{1F9D4}‍♂️",
    },
    {
      id: "G",
      name: "Geraldine",
      pronoun: "sie",
      clue: {
        text: "Sie war vor einer Tür. Sie war nicht draußen.",
        ...all(
          not(inArea("X")),
          own((c) => beforeDoor(c.cell)),
        ),
      },
      colour: "#be185d",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "H",
      name: "Hugo",
      pronoun: "er",
      clue: { text: "Er war bei einem Gesetzlosen.", ...counting(someGang) },
      colour: "#0f766e",
      face: "\u{1F935}",
    },
    {
      id: "I",
      name: "Isaac",
      pronoun: "er",
      clue: { text: "Er war in der ersten Spalte.", ...column(1) },
      colour: "#334155",
      face: "\u{1F920}",
    },
    {
      id: "J",
      name: "Jake",
      pronoun: "er",
      clue: {
        text: "Er war im Büro des Sheriffs. Jemand war im Gefängnis.",
        ...all(inArea("O"), counting(somebodyInJail)),
      },
      colour: "#57534e",
      face: "\u{1F46E}",
    },
    {
      id: "K",
      name: "Kate",
      pronoun: "sie",
      clue: {
        text: "Sie war genau eine Spalte westlich eines Gesetzlosen.",
        ...counting(someGang),
      },
      colour: "#7c3aed",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "V",
      name: "Vinny",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Kein Gesetzloser. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F9D4}",
    },
  ],
  rules: [
    {
      text: "Es gab genau zwei Gesetzlose. Beide waren allein mit jemandem, der kein Gesetzloser war.",
      check: someGang,
      prune: stillPossible,
    },
  ],
  hints: [
    {
      text: "In C11 und C12 stehen Bobby (Stuhl im Saloon) und wer im Gefängnis ist - mehr Platz gibt es dort nicht. Im Gefängnis ist also genau eine Person, allein: nicht Vinny und nicht Hugo, die beide Gesellschaft haben. Fred hätte östlich von sich keine Spalte für Vinny frei, und sonst passt niemand hinein. Es ist Kate - in R10 C12 hätte sie keine Spalte östlich, also steht sie in R9 C11, und der Gesetzlose östlich von ihr ist Bobby in R4 C12.",
      place: { K: { row: 8, col: 10 }, B: { row: 3, col: 11 } },
    },
    {
      text: "Bobby ist nicht allein; im Saloon ist für seine Begleitung nur C10 frei (R5 bis R8). Jake ist im Büro des Sheriffs in C9 oder C10 - also in R12 C9 (R9 C9 ist Kates Zeile). Isaac steht in C1: Auf den Pferden in R1 C1 und R2 C1 reitet nur Dalton, mit R5 C1 stünde Emil in Bobbys Zeile, mit R10 C1 in Kates, und R12 ist Jakes Zeile. Isaac steht in R7 C1, Emil in R6.",
      place: { J: { row: 11, col: 8 }, I: { row: 6, col: 0 } },
    },
    {
      text: "Charlotte war allein neben einem Regal: Im Laden steht Isaac, R2 C10 braucht Bobbys Begleitung, R2 C12 ist Bobbys Spalte - sie steht in R1 C3. Geraldine steht vor einer Tür, nicht draußen: R2 C3 (Charlottes Postamt), R2 C9 (Jakes Spalte), R6 C3 (Charlottes Spalte) und R7 C10 (Isaacs Zeile) fallen weg, also R10 C2. Adeline bleibt nur C10 (R8 C10 oder R11 C10) - und C10 gehört Bobbys Begleitung: Adeline steht in R8 C10.",
      place: {
        C: { row: 0, col: 2 },
        G: { row: 9, col: 1 },
        A: { row: 7, col: 9 },
      },
    },
    {
      text: "Dalton reitet als Einziger: Alle Pferde außer R3 C8 liegen in besetzten Zeilen oder Spalten. Dalton reitet in R3 C8.",
      place: { D: { row: 2, col: 7 } },
    },
    {
      text: "Frei sind R2, R5, R6 und R11 in C4 bis C7 - alles draußen bis auf R5 C4 im Laden und R6 C7 im Stall. Hugo ist mit einem Gesetzlosen allein, nicht mit Bobby (Adeline ist schon bei ihm). Wäre es draußen, könnte Vinny nur in R5 C4 stehen - und Fred hätte westlich von ihr keine freie Spalte. Hugo steht in R5 C4 bei Isaac, dem zweiten Gesetzlosen.",
      place: { H: { row: 4, col: 3 } },
    },
    {
      text: "Fred und Vinny stehen draußen in R2 und R11. Stünde Emil auch draußen, wäre Vinny nicht allein mit einer Person: Emil steht in R6 C7 im Stall. Fred ist westlich von Vinny, also in C5 - R11 C5 ist ein Kaktus, er steht in R2 C5, und Vinny in R11 C6, allein mit Fred draußen. Fred ist der Mörder!",
      place: {
        E: { row: 5, col: 6 },
        F: { row: 1, col: 4 },
        V: { row: 10, col: 5 },
      },
    },
  ],
  solution: {
    A: { row: 7, col: 9 },
    B: { row: 3, col: 11 },
    C: { row: 0, col: 2 },
    D: { row: 2, col: 7 },
    E: { row: 5, col: 6 },
    F: { row: 1, col: 4 },
    G: { row: 9, col: 1 },
    H: { row: 4, col: 3 },
    I: { row: 6, col: 0 },
    J: { row: 11, col: 8 },
    K: { row: 8, col: 10 },
    V: { row: 10, col: 5 },
  },
};
