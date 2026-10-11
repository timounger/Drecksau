/**
 * The Boss's Office: a floor of offices with a meeting room, a kitchen, a
 * reception and open workplaces, five office owners and a murdered guest.
 *
 * @module
 * @remarks
 * After the free case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Easy/Das Chefbüro.png`, no solution sheet; the
 * solver proves the case has exactly one solution). Vincent is the victim;
 * whoever was alone with him killed him.
 *
 * **Who owns an office is not printed - it is part of the puzzle.** Each of
 * the five offices (Büro A to D and the boss's office) has exactly one owner
 * among the people in it; the boss is the owner of the boss's office. The
 * clues of Aylin, Carter, Flora, Irene and Jolly speak of owners, so their
 * checks try every way to pick one owner per office from the people standing
 * there; the case's rule asks for one choice that meets all of them at once.
 * Chairs can be stood on; desks, tables, shelves, plants and waste-paper
 * baskets cannot.
 */
import {
  about,
  all,
  beside,
  cellsWhere,
  counting,
  inArea,
  not,
  on,
  row,
  victim,
} from "../engine/clues";
import { contextOf, isSolved } from "../engine/rules";
import type { Cell, Context, Level, Placement } from "../engine/types";

/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */

/** The five offices, each with one owner; the last is the boss's office. */
const OFFICES: readonly string[] = ["A", "B", "C", "D", "X"];

/** The boss's office. */
const BOSS_OFFICE = "X";

/** How many owners Jolly saw to her west. */
const OWNERS_WEST_OF_JOLLY = 3;

/** One owner per office, in the order of {@link OFFICES}. */
type Owners = readonly string[];

/** A test of one choice of owners. */
type OwnerTest = (c: Context, owners: Owners) => boolean;

/**
 * Every way to pick one owner per office from the people standing in it.
 *
 * @param c - the context, with everybody placed
 * @returns the choices - none while an office is empty
 */
function ownerChoices(c: Context): readonly Owners[] {
  return OFFICES.reduce<readonly Owners[]>(
    (choices, office) =>
      choices.flatMap((owners) =>
        c.peopleIn(office).map((id) => [...owners, id]),
      ),
    [[]],
  );
}

/** The row of somebody, or -1 while not placed. */
function rowOf(c: Context, id: string): number {
  return c.cellOf(id)?.row ?? -1;
}

/** The column of somebody, or -1 while not placed. */
function colOf(c: Context, id: string): number {
  return c.cellOf(id)?.col ?? -1;
}

/** Aylin: in the same office as the only woman among the owners, not her. */
const aylinsOwners: OwnerTest = (c, owners) => {
  const women = owners
    .map((id, at) => ({ id, office: OFFICES[at] }))
    .filter((one) => c.has(one.id, "woman"));
  const aylin = c.cellOf("A");
  return (
    women.length === 1 &&
    women[0]?.id !== "A" &&
    aylin !== undefined &&
    c.areaOf(aylin) === women[0]?.office
  );
};

/** Carter: not the boss himself. */
const cartersOwners: OwnerTest = (_c, owners) =>
  owners[OFFICES.indexOf(BOSS_OFFICE)] !== "C";

/** Flora: exactly one row south of an owner. */
const florasOwners: OwnerTest = (c, owners) =>
  owners.some((id) => rowOf(c, id) === rowOf(c, "F") - 1);

/** Irene: only one owner south of her. */
const irenesOwners: OwnerTest = (c, owners) =>
  owners.filter((id) => rowOf(c, id) > rowOf(c, "I")).length === 1;

/** Jolly: exactly three owners west of her. */
const jollysOwners: OwnerTest = (c, owners) =>
  owners.filter((id) => colOf(c, id) < colOf(c, "J")).length ===
  OWNERS_WEST_OF_JOLLY;

/** Every clue about owners, to be met by one and the same choice. */
const OWNER_TESTS: readonly OwnerTest[] = [
  aylinsOwners,
  cartersOwners,
  florasOwners,
  irenesOwners,
  jollysOwners,
];

/**
 * Whether some choice of owners passes a test.
 *
 * @param test - the test
 * @returns a check for a clue
 */
function someOwners(test: OwnerTest): (c: Context) => boolean {
  return (c) => ownerChoices(c).some((owners) => test(c, owners));
}

/** Whether somebody stands in the kitchen on a chair. */
function sitsInKitchen(c: Context, id: string): boolean {
  const there = c.cellOf(id);
  return there !== undefined && c.areaOf(there) === "K" && c.is(there, "seat");
}

/** A field with what the lookahead asks of it, worked out once. */
type Spot = { readonly cell: Cell; readonly area: string };

/** Each suspect's fields by their own clue alone, worked out once. */
const OWN_FIELDS = new Map<string, readonly Spot[]>();

/** Every field anybody can stand on, worked out once. */
const STANDABLE: Spot[] = [];

/**
 * A field with its area.
 *
 * @param c - any context of the case
 * @param cell - the field
 * @returns the field and its area
 */
function spotOf(c: Context, cell: Cell): Spot {
  return { cell, area: c.areaOf(cell) ?? "" };
}

/**
 * Every field anybody can stand on, cached.
 *
 * @param c - any context of the case
 * @returns the fields
 */
function standableSpots(c: Context): readonly Spot[] {
  if (STANDABLE.length === 0) {
    STANDABLE.push(
      ...cellsWhere(c.level, (cell) => c.standable(cell)).map((cell) =>
        spotOf(c, cell),
      ),
    );
  }
  return STANDABLE;
}

/**
 * The fields a suspect's own clue allows, cached.
 *
 * @param c - any context of the case
 * @param id - the suspect
 * @returns the fields
 */
function ownFields(c: Context, id: string): readonly Spot[] {
  const known = OWN_FIELDS.get(id);
  const unary = c.level.suspects.find((one) => one.id === id)?.clue.unary;
  const fields =
    known ??
    standableSpots(c).filter(
      (spot) =>
        unary === undefined ||
        unary(contextOf(c.level, { [id]: spot.cell }, id)),
    );
  OWN_FIELDS.set(id, fields);
  return fields;
}

/** Whether a field has another one than itself among some fields. */
function another(cells: readonly Cell[], cell: Cell): boolean {
  return cells.some((at) => at.row !== cell.row || at.col !== cell.col);
}

/** Whether a count lies between what is certain and what is possible. */
function reachable(
  spots: readonly (readonly Cell[])[],
  test: (cell: Cell) => boolean,
  wanted: number,
): boolean {
  const surely = spots.filter((one) => one.every(test)).length;
  const maybe = spots.filter((one) => one.some(test)).length;
  return surely <= wanted && wanted <= maybe;
}

/**
 * Whether every suspect of a list can get a line of their own - a row, or a
 * column - out of the lines their fields offer (a bipartite matching).
 */
function matchable(options: readonly (readonly number[])[]): boolean {
  const holder = new Map<number, number>();
  const claim = (who: number, seen: Set<number>): boolean =>
    (options[who] ?? []).some((line) => {
      const owner = holder.get(line);
      const free =
        !seen.has(line) &&
        (seen.add(line), owner === undefined || claim(owner, seen));
      if (free) {
        holder.set(line, who);
      }
      return free;
    });
  return options.every((_, who) => claim(who, new Set<number>()));
}

/**
 * Whether one choice of owners meets every clue about owners at once.
 *
 * @param c - the context, with everybody placed
 * @returns true when there is such a choice
 */
function ownersAgree(c: Context): boolean {
  return ownerChoices(c).some((owners) =>
    OWNER_TESTS.every((test) => test(c, owners)),
  );
}

/** From how few people left on, the lookahead tries every way to finish. */
const FINISH_FROM = 5;

/**
 * Whether a placement can be finished into a solution, trying the fields
 * left to the people not yet placed.
 *
 * @param level - the case
 * @param placement - where people stand so far
 * @param left - the people not yet placed, with the fields left to them
 * @returns true when some way to place them all solves the case
 */
function finishable(
  level: Level,
  placement: Placement,
  left: readonly (readonly [string, readonly Cell[]])[],
): boolean {
  const [first, ...rest] = left;
  return first === undefined
    ? ownersAgree(contextOf(level, placement, "A")) &&
        isSolved(level, placement)
    : first[1].some((cell) => {
        const next = rest
          .map(
            ([id, cells]) =>
              [
                id,
                cells.filter(
                  (at) => at.row !== cell.row && at.col !== cell.col,
                ),
              ] as const,
          )
          .sort((x, y) => x[1].length - y[1].length);
        return (
          (next[0]?.[1].length ?? 1) > 0 &&
          finishable(level, { ...placement, [first[0]]: cell }, next)
        );
      });
}

/**
 * For the solver only: whether a partial placement can still be finished -
 * every suspect not yet placed keeps a field that fits their own clue, the
 * owner clues, Monica's being alone and a free row and column, the rows and
 * columns can be shared out, and Omar still gets Aylin or Jolly sitting in
 * the kitchen. The owner of an office could stand on a placed person's field
 * in it, or on any free field in it.
 */
function stillPossible(c: Context): boolean {
  const placed = c.people();
  const taken = placed.map((id) => c.cellOf(id) ?? { row: -1, col: -1 });
  const rowTaken = new Set(taken.map((at) => at.row));
  const colTaken = new Set(taken.map((at) => at.col));
  const isFree = (cell: Cell) =>
    !rowTaken.has(cell.row) && !colTaken.has(cell.col);
  const waiting = c.level.suspects
    .map((one) => one.id)
    .filter((id) => !placed.includes(id));
  const freeSpots =
    waiting.length > 0
      ? standableSpots(c).filter((spot) => isFree(spot.cell))
      : [];
  const placedIn = OFFICES.map((office) =>
    taken.filter((at) => c.areaOf(at) === office),
  );
  const freeIn = OFFICES.map((office) =>
    freeSpots.filter((spot) => spot.area === office).map((spot) => spot.cell),
  );
  const spots = OFFICES.map((_, at) => [
    ...(placedIn[at] ?? []),
    ...(freeIn[at] ?? []),
  ]);
  // Where the owners could stand once somebody not yet placed takes a field.
  const spotsWith = (cell: Cell, area: string) =>
    OFFICES.map((office, at) => [
      ...(placedIn[at] ?? []),
      ...(freeIn[at] ?? []).filter(
        (free) => free.row !== cell.row && free.col !== cell.col,
      ),
      ...(office === area ? [cell] : []),
    ]);
  const ownersFit = (id: string, spot: Spot) => {
    const { cell, area } = spot;
    const owners = placed.includes(id) ? spots : spotsWith(cell, area);
    const tests: Readonly<Record<string, () => boolean>> = {
      A: () => another(owners[OFFICES.indexOf(area)] ?? [], cell),
      C: () => another(owners[OFFICES.indexOf(BOSS_OFFICE)] ?? [], cell),
      F: () => owners.some((one) => one.some((at) => at.row === cell.row - 1)),
      I: () => reachable(owners, (at) => at.row > cell.row, 1),
      J: () =>
        reachable(owners, (at) => at.col < cell.col, OWNERS_WEST_OF_JOLLY),
    };
    return tests[id]?.() ?? true;
  };
  const victimCell = c.cellOf("V");
  const victimArea = victimCell === undefined ? null : c.areaOf(victimCell);
  const withVictim = placed.filter(
    (id) =>
      id !== "V" &&
      victimArea !== null &&
      c.areaOf(c.cellOf(id) ?? { row: -1, col: -1 }) === victimArea,
  ).length;
  const dillard = c.cellOf("D");
  const hans = c.cellOf("H");
  const aylinMaySitInKitchen =
    sitsInKitchen(c, "A") ||
    (c.cellOf("A") === undefined &&
      ownFields(c, "A").some(
        (spot) => spot.area === "K" && c.is(spot.cell, "seat"),
      ));
  const fits = (id: string, spot: Spot) =>
    (spot.area !== "R" || id === "M") &&
    ((id !== "F" && id !== "K") || spot.area !== "W") &&
    (id === "V" ||
      spot.area !== victimArea ||
      withVictim === (placed.includes(id) ? 1 : 0)) &&
    (id !== "V" ||
      placed.filter(
        (other) =>
          other !== "V" &&
          c.areaOf(c.cellOf(other) ?? { row: -1, col: -1 }) === spot.area,
      ).length <= 1) &&
    (id !== "H" ||
      dillard === undefined ||
      Math.abs(dillard.col - spot.cell.col) !== 1) &&
    (id !== "D" ||
      hans === undefined ||
      Math.abs(hans.col - spot.cell.col) !== 1) &&
    (id !== "J" ||
      aylinMaySitInKitchen ||
      (spot.area === "K" && c.is(spot.cell, "seat"))) &&
    ownersFit(id, spot);
  const waitingOk = () => {
    const live = new Map(
      waiting.map((id) => [
        id,
        ownFields(c, id).filter((spot) => isFree(spot.cell) && fits(id, spot)),
      ]),
    );
    const fields = [...live.values()];
    const sitsInKitchenSoon = (id: string) =>
      sitsInKitchen(c, id) ||
      (live.get(id) ?? []).some(
        (spot) => spot.area === "K" && c.is(spot.cell, "seat"),
      );
    const occupiable = OFFICES.every(
      (office, at) =>
        (placedIn[at] ?? []).length > 0 ||
        fields.some((one) => one.some((spot) => spot.area === office)),
    );
    return (
      fields.every((one) => one.length > 0) &&
      occupiable &&
      ["A", "J"].some(sitsInKitchenSoon) &&
      matchable(fields.map((one) => one.map((spot) => spot.cell.row))) &&
      matchable(fields.map((one) => one.map((spot) => spot.cell.col))) &&
      (waiting.length > FINISH_FROM ||
        finishable(
          c.level,
          c.placement,
          [...live.entries()]
            .map(([id, one]) => [id, one.map((spot) => spot.cell)] as const)
            .sort((a, b) => a[1].length - b[1].length),
        ))
    );
  };
  const placedOk = [c.self, ...placed.filter((id) => id !== c.self)].every(
    (id) => fits(id, spotOf(c, c.cellOf(id) ?? { row: -1, col: -1 })),
  );
  return spots.every((one) => one.length > 0) && placedOk && waitingOk();
}

/** The side length of the square map. */
const SIZE = 16;

/**
 * The fields of a row or a column, counted from nought, except some.
 *
 * @param kind - a row or a column
 * @param line - which one
 * @param keep - the fields left out, by their place along the line
 * @returns the fields
 */
function lineExcept(
  kind: "row" | "col",
  line: number,
  keep: readonly number[],
): readonly Cell[] {
  return Array.from({ length: SIZE }, (_, at) => at)
    .filter((at) => !keep.includes(at))
    .map((at) =>
      kind === "row" ? { row: line, col: at } : { row: at, col: line },
    );
}

/** The case. */
export const THE_BOSS_OFFICE: Level = {
  id: "the-boss-office",
  name: "Das Chefbüro",
  difficulty: "expert",
  series: { book: "online" },
  story:
    "Vincent wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "R",
      name: "Besprechungsraum",
      at: "im Besprechungsraum",
      ground: "floor",
      tint: "#dbeaf2",
      label: { row: 3, col: 1 },
    },
    {
      key: "A",
      name: "Büro A",
      at: "in Büro A",
      ground: "floor",
      tint: "#e3f0f7",
      label: { row: 3, col: 8 },
    },
    {
      key: "B",
      name: "Büro B",
      at: "in Büro B",
      ground: "floor",
      tint: "#e3f0f7",
      label: { row: 3, col: 13 },
    },
    {
      key: "W",
      name: "Arbeitsplätze",
      at: "im Bereich Arbeitsplätze",
      ground: "stone",
      tint: "#bccdd6",
      label: { row: 9, col: 12 },
    },
    {
      key: "E",
      name: "Empfang",
      at: "im Empfang",
      ground: "floor",
      tint: "#e4e2ec",
      label: { row: 9, col: 1 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "floor",
      tint: "#c9c6de",
      label: { row: 9, col: 6 },
    },
    {
      key: "F",
      name: "Flur",
      at: "im Flur",
      ground: "floor",
      tint: "#cfe3e6",
      label: { row: 15, col: 0 },
    },
    {
      key: "C",
      name: "Büro C",
      at: "in Büro C",
      ground: "floor",
      tint: "#e3f0f7",
      label: { row: 15, col: 4 },
    },
    {
      key: "D",
      name: "Büro D",
      at: "in Büro D",
      ground: "floor",
      tint: "#e3f0f7",
      label: { row: 15, col: 9 },
    },
    {
      key: "X",
      name: "Chefbüro",
      at: "im Chefbüro",
      ground: "floor",
      tint: "#d6d0e8",
      label: { row: 15, col: 13 },
    },
  ],
  areaMap: [
    "RRRRRRAAAAABBBBB",
    "RRRRRRAAAAABBBBB",
    "RRRRRRAAAAABBBBB",
    "RRRRRRAAAAABBBBB",
    "WWWWWWWWWWWWWWWW",
    "WWWWWWWWWWWWWWWW",
    "EEEEKKKKKKWWWWWW",
    "EEEEKKKKKKWWWWWW",
    "EEEEKKKKKKWWWWWW",
    "EEEEKKKKKKWWWWWW",
    "FFFFFFFFFFFFXXXX",
    "FFFFFFFFFFFFXXXX",
    "FFCCCCCDDDDDXXXX",
    "FFCCCCCDDDDDXXXX",
    "FFCCCCCDDDDDXXXX",
    "FFCCCCCDDDDDXXXX",
  ],
  thingMap: [
    "pcccc.d.c.s..cpd",
    ".tttt.ddd.sp.ddd",
    "pcccc.w........p",
    ".....w.ccw...ccw",
    "....ss.........p",
    "w...........c.c.",
    "...sttstttw.tttt",
    "..t.c....t.....s",
    "c.tct........c.c",
    "p...c.ctcw..tttt",
    "...........p..cd",
    ".ps..........ddd",
    ".s..c.wc..cw.cc.",
    "...............p",
    "p..ddd.ddd.....s",
    "..sdc..d.c.pswss",
  ],
  things: {
    c: "chair",
    d: "desk",
    p: "plant",
    s: "shelf",
    t: "table",
    w: "wastebasket",
  },
  extraThings: {
    desk: {
      name: "Schreibtisch",
      emoji: "\u{1F5C4}️",
      standable: false,
      kinds: ["furniture"],
    },
    wastebasket: {
      name: "Papierkorb",
      emoji: "\u{1F5D1}️",
      standable: false,
    },
  },
  // The table round the corner in the kitchen and the corner desks in the
  // offices, as the page draws them.
  shapes: [
    [
      { row: 6, col: 7 },
      { row: 6, col: 8 },
      { row: 6, col: 9 },
      { row: 7, col: 9 },
    ],
    [
      { row: 0, col: 6 },
      { row: 1, col: 6 },
      { row: 1, col: 7 },
      { row: 1, col: 8 },
    ],
    [
      { row: 0, col: 15 },
      { row: 1, col: 15 },
      { row: 1, col: 14 },
      { row: 1, col: 13 },
    ],
    [
      { row: 10, col: 15 },
      { row: 11, col: 15 },
      { row: 11, col: 14 },
      { row: 11, col: 13 },
    ],
    [
      { row: 15, col: 3 },
      { row: 14, col: 3 },
      { row: 14, col: 4 },
      { row: 14, col: 5 },
    ],
    [
      { row: 15, col: 7 },
      { row: 14, col: 7 },
      { row: 14, col: 8 },
      { row: 14, col: 9 },
    ],
  ],
  pieces: [
    { at: { row: 1, col: 1 }, rows: 1, cols: 4 },
    { at: { row: 6, col: 4 }, rows: 1, cols: 2 },
    { at: { row: 6, col: 12 }, rows: 1, cols: 4 },
    { at: { row: 7, col: 2 }, rows: 2, cols: 1 },
    { at: { row: 9, col: 12 }, rows: 1, cols: 4 },
  ],
  suspects: [
    {
      id: "A",
      name: "Aylin",
      pronoun: "sie",
      clue: {
        text: "Sie war neben einem Papierkorb. Sie war im selben Bereich wie die einzige Bürobesitzerin.",
        ...all(
          beside("wastebasket"),
          inArea(...OFFICES),
          counting(someOwners(aylinsOwners)),
        ),
      },
      colour: "#b91c1c",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "B",
      name: "Beatriz",
      pronoun: "sie",
      clue: {
        text: "Sie war im Bereich Arbeitsplätze. Sie war nicht bei Flora oder Kaleb.",
        ...all(
          inArea("W"),
          about(["F", "K"], (c) =>
            ["F", "K"].every((id) => {
              const there = c.cellOf(id);
              return there === undefined || c.areaOf(there) !== "W";
            }),
          ),
        ),
      },
      colour: "#ea580c",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "C",
      name: "Carter",
      pronoun: "er",
      clue: {
        text: "Er saß nicht auf einem Stuhl. Er war beim Chef.",
        ...all(
          not(on("seat")),
          inArea(BOSS_OFFICE),
          counting(someOwners(cartersOwners)),
        ),
      },
      colour: "#15803d",
      face: "\u{1F468}",
    },
    {
      id: "D",
      name: "Dillard",
      pronoun: "er",
      clue: { text: "Er war neben einer Pflanze.", ...beside("plant") },
      colour: "#0e7490",
      face: "\u{1F474}",
    },
    {
      id: "E",
      name: "Esther",
      pronoun: "sie",
      clue: {
        text: "Sie saß auf einem Stuhl in einem Büro. Sie war nicht im Chefbüro.",
        ...all(on("seat"), inArea("A", "B", "C", "D")),
      },
      colour: "#6366f1",
      face: "\u{1F469}\u{1F3FE}",
    },
    {
      id: "F",
      name: "Flora",
      pronoun: "sie",
      clue: {
        text: "Sie war genau eine Reihe südlich von einem Bürobesitzer.",
        ...counting(someOwners(florasOwners)),
      },
      colour: "#be185d",
      face: "\u{1F475}",
    },
    {
      id: "G",
      name: "Grant",
      pronoun: "er",
      clue: {
        text: "Er saß auf einem Stuhl in der obersten Reihe.",
        ...all(on("seat"), row(1)),
      },
      colour: "#a16207",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "H",
      name: "Hans",
      pronoun: "er",
      clue: {
        text: "Seine Spalte grenzte nicht an die Spalte von Dillard.",
        ...about(["D"], (c) => Math.abs(c.cell.col - colOf(c, "D")) !== 1),
      },
      colour: "#4338ca",
      face: "\u{1F468}\u{1F3FD}",
    },
    {
      id: "I",
      name: "Irene",
      pronoun: "sie",
      clue: {
        text: "Sie war im Flur. Nur ein Bürobesitzer war südlich von ihr.",
        ...all(inArea("F"), counting(someOwners(irenesOwners))),
      },
      colour: "#7c3aed",
      face: "\u{1F469}",
    },
    {
      id: "J",
      name: "Jolly",
      pronoun: "sie",
      clue: {
        text: "Genau drei Bürobesitzer waren westlich von ihr.",
        ...counting(someOwners(jollysOwners)),
      },
      colour: "#0f766e",
      face: "\u{1F469}\u{1F3FB}",
    },
    {
      id: "K",
      name: "Kaleb",
      pronoun: "er",
      clue: { text: "Er war neben einem Regal.", ...beside("shelf") },
      colour: "#65a30d",
      face: "\u{1F9D4}",
    },
    {
      id: "L",
      name: "Leroy",
      pronoun: "er",
      clue: {
        text: "Er war in der untersten Reihe. Er saß nicht auf einem Stuhl.",
        ...all(row(16), not(on("seat"))),
      },
      colour: "#c2410c",
      face: "\u{1F468}\u{1F3FB}",
    },
    {
      id: "M",
      name: "Monica",
      pronoun: "sie",
      clue: {
        text: "Sie war allein im Besprechungsraum.",
        ...all(
          inArea("R"),
          counting((c) => c.peopleIn("R").length === 1),
        ),
      },
      colour: "#9f1239",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "N",
      name: "Nina",
      pronoun: "sie",
      clue: {
        text: "Sie war nicht im Bereich Arbeitsplätze.",
        ...not(inArea("W")),
      },
      colour: "#1d4ed8",
      face: "\u{1F469}\u{1F3FC}",
    },
    {
      id: "O",
      name: "Omar",
      pronoun: "er",
      clue: {
        text: "Er war in der Küche mit Aylin oder Jolly, die auf einem Stuhl saß.",
        ...all(
          inArea("K"),
          about(["A", "J"], (c) =>
            ["A", "J"].some((id) => sitsInKitchen(c, id)),
          ),
        ),
      },
      colour: "#334155",
      face: "\u{1F468}\u{1F3FF}",
    },
    {
      id: "V",
      name: "Vincent",
      pronoun: "er",
      clue: { text: "Er war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F9D4}",
    },
  ],
  rules: [
    {
      text: "Es gibt fünf Bürobesitzer. Alle Besitzer befinden sich in ihrem eigenen Büro, auch der Chef.",
      check: ownersAgree,
      prune: stillPossible,
    },
    {
      text: "Der Chef kann sowohl als „der Chef“ als auch als „Bürobesitzer“ bezeichnet werden.",
    },
  ],
  hints: [
    {
      text: "Schauen wir uns den Hinweis von O an. Er ist in der Küche mit A oder J, aber A muss bei einem Bürobesitzer sein, also ist sie in einem Büro. A kann nicht in der Küche sein. Damit ist J auf einem Stuhl in der Küche. J ist östlich von drei Bürobesitzern, die laut dem allgemeinen Hinweis alle in verschiedenen Bereichen sind. Links von C11 gibt es genau drei Büros, damit J also östlich von allen ist, muss J auf dem Stuhl in R10 C9 sein.",
      place: { J: { row: 9, col: 8 } },
    },
    {
      text: "Laut dem Hinweis von J befindet sich damit ein Bürobesitzer in C8, in Büro D. Blockiere den Rest von C8. Ein weiterer Bürobesitzer westlich von J muss in R4 C7 in Büro A sein. Blockiere den Rest von R4 und C7. Der dritte Bürobesitzer ist irgendwo in Büro C.",
      cross: [
        ...lineExcept("col", 7, [12]),
        ...lineExcept("row", 3, [6]),
        ...lineExcept("col", 6, [3]),
      ],
    },
    {
      text: "Da M allein im Besprechungsraum ist, ist der einzige mögliche Stuhl in R1 für G in Büro B. Damit bleibt für G nur R1 C14.",
      place: { G: { row: 0, col: 13 } },
    },
    {
      text: "L muss in R16 sein, und nicht auf einem Stuhl. Die einzigen übrigen Stühle für E sind in R13, in Büro C oder Büro D. Blockiere den Rest von R13.",
      cross: [...lineExcept("row", 12, [4, 7, 10])],
    },
    {
      text: "I ist im Flur und nördlich von genau einem Bürobesitzer, kann also nicht in R11 oder R12 sein, da sonst mindestens zwei Bürobesitzer südlich von ihr wären: der in Büro C und der in Büro D. Damit ist I in R14 oder R15 im Flur.",
    },
    {
      text: "Betrachten wir R13, R14, R15 und R16. Laut dem Hinweis von A gibt es genau eine Bürobesitzerin, also kann diese Person nicht allein sein. E ist entweder bei jemandem, der Bürobesitzer ist, oder bei A. Außerdem muss es einen weiteren Bürobesitzer in Büro C oder Büro D geben, wo E nicht ist. Insgesamt sind in Büro C und Büro D also drei Personen, dazu I, die in R14 oder R15 sein muss. Im Chefbüro ist in R13 oder darunter für niemanden mehr Platz.",
    },
    {
      text: "Laut dem Hinweis von C müssen zwei Personen im Chefbüro sein. Sie sind auf den zwei übrigen Feldern. C, der nicht auf einem Stuhl sitzt, ist in R12 C13, und der noch unbekannte Chef ist in R11 C15.",
      place: { C: { row: 11, col: 12 } },
    },
    {
      text: "Wo kann F sein? Sie kann nicht eine Reihe südlich von E sein. Wäre E Bürobesitzerin, müsste auch A in den Bereich von E passen, aber AEFIL passen nicht alle in R13-R14-R15-R16. Laut dem Hinweis von J ist die Person in R4 C7 ein Bürobesitzer. Wäre F in R4 C7, müsste A in R3 C8 neben dem Papierkorb sein, aber A und F können nicht beide Besitzerinnen desselben Büros sein. F muss also in R2 sein, eine Reihe südlich von G, dem Besitzer von Büro B. Damit bleibt für F nur das letzte freie Feld in R2, R2 C10.",
      place: { F: { row: 1, col: 9 } },
    },
    {
      text: "Damit ist M in R3, im Besprechungsraum. Laut dem Hinweis von J ist ein Bürobesitzer in R4 C7, also kann A, die bei der einzigen Bürobesitzerin sein muss, nicht selbst in R4 C7 sein. Damit bleibt für A nur das einzige übrige Feld neben einem Papierkorb in einem Büro, R14 C12. E muss die Bürobesitzerin in diesem Bereich sein. Laut dem Hinweis von J muss sie westlich von J sein, in R13 C8.",
      place: { A: { row: 13, col: 11 }, E: { row: 12, col: 7 } },
    },
    {
      text: "Laut dem Hinweis von B ist sie nicht bei F oder K, damit bleibt für K nur R7 C3. Damit ist auch M festgelegt. L ist dann der Besitzer von Büro C. Damit bleibt für L nur R16 C6, und für I das Feld nördlich von L, R15 C2. Damit bleibt für O nur das letzte Feld in der Küche.",
      place: {
        K: { row: 6, col: 2 },
        M: { row: 2, col: 3 },
        L: { row: 15, col: 5 },
        I: { row: 14, col: 1 },
        O: { row: 7, col: 4 },
        B: { row: 4, col: 10 },
        D: { row: 5, col: 15 },
        H: { row: 3, col: 6 },
        N: { row: 8, col: 0 },
        V: { row: 10, col: 14 },
      },
    },
  ],
  solution: {
    A: { row: 13, col: 11 },
    B: { row: 4, col: 10 },
    C: { row: 11, col: 12 },
    D: { row: 5, col: 15 },
    E: { row: 12, col: 7 },
    F: { row: 1, col: 9 },
    G: { row: 0, col: 13 },
    H: { row: 3, col: 6 },
    I: { row: 14, col: 1 },
    J: { row: 9, col: 8 },
    K: { row: 6, col: 2 },
    L: { row: 15, col: 5 },
    M: { row: 2, col: 3 },
    N: { row: 8, col: 0 },
    O: { row: 7, col: 4 },
    V: { row: 10, col: 14 },
  },
};
