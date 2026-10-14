/**
 * Halloweenparty: a house with a bathroom, a dining room, a kitchen, a living
 * room, a garage and a hallway, a back yard with a swimming pool and a shed,
 * and a front garden full of pumpkins, with a murdered guest.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/77. Halloweenparty.JPG`,
 * solution in `Lösungen 1-80/Lösung 77-80.JPG`).
 * Orm is the victim; whoever was alone with him killed him.
 *
 * The armchairs are the chairs; they, the rugs and the swimming pool can be
 * stood on. The shrubs, the trees, the pumpkins, the tables, the shelves, the
 * TV and the plants cannot. A field is beside a wall of a room when a field
 * next to it lies in that room and its own field does not.
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
import type { Cell, Context, Level } from "../engine/types";

/** The fields left, right, above and below one, on the map or not. */
function around(cell: Cell): readonly Cell[] {
  return [
    { row: cell.row - 1, col: cell.col },
    { row: cell.row + 1, col: cell.col },
    { row: cell.row, col: cell.col - 1 },
    { row: cell.row, col: cell.col + 1 },
  ];
}

/** The others standing in the suspect's area. */
function others(c: Context): readonly string[] {
  return c.peopleIn(c.areaOf(c.cell) ?? "").filter((id) => id !== c.self);
}

/** Whether somebody stands on a field next to a thing of this id or kind. */
function standsBeside(c: Context, id: string, what: string): boolean {
  const there = c.cellOf(id);
  return there !== undefined && c.beside(there, what);
}

/** Whether somebody stands on a thing of this id or kind. */
function standsOn(c: Context, id: string, what: string): boolean {
  const there = c.cellOf(id);
  return there !== undefined && c.is(there, what);
}

/** Jeremy's clue: beside a wall with the kitchen on its other side. */
function besideKitchenWall(c: Context): boolean {
  return (
    c.areaOf(c.cell) !== "K" &&
    around(c.cell).some((next) => c.inside(next) && c.areaOf(next) === "K")
  );
}

/** Kerstin's clue: a pumpkin in her column, in another area. */
function pumpkinInColumnElsewhere(c: Context): boolean {
  return Array.from({ length: c.rows }, (_, row) => ({
    row,
    col: c.cell.col,
  })).some(
    (cell) =>
      c.inside(cell) &&
      c.is(cell, "pumpkin") &&
      c.areaOf(cell) !== c.areaOf(c.cell),
  );
}

/** Whether the suspect's own area holds a thing of this id or kind. */
function areaHas(what: string): (c: Context) => boolean {
  return (c: Context): boolean =>
    c.cellsOf(c.areaOf(c.cell) ?? "").some((cell) => c.is(cell, what));
}

/**
 * For the solver only: whether the people placed so far can still fit the
 * counting clues. What a clue forbids (a second person on a chair, a third
 * in the dining room or with the victim, somebody else beside Danika's
 * pumpkin) must not have happened yet; what a clue asks for (company, a
 * woman beside a tree, somebody on the rug or beside a table) must be there
 * already or still have a free field to come to. Every row and column still
 * free needs a free field too, as twelve people fill all twelve.
 */
function stillPossible(c: Context): boolean {
  const placed = c.people();
  const unplaced = c.level.suspects
    .map((one) => one.id)
    .filter((id) => !placed.includes(id));
  const rows = new Set(placed.map((id) => c.cellOf(id)?.row));
  const cols = new Set(placed.map((id) => c.cellOf(id)?.col));
  const lines = Array.from({ length: c.rows }, (_, line) => line);
  const free = (row: number, col: number): boolean =>
    !rows.has(row) && !cols.has(col) && c.standable({ row, col });
  const areaOfId = (id: string): string => {
    const there = c.cellOf(id);
    return there === undefined ? "" : (c.areaOf(there) ?? "");
  };
  // Whether somebody fitting `who` is in the area on a field passing `test`,
  // or can still come to one.
  const reachable = (
    area: string,
    who: (id: string) => boolean,
    test: (cell: Cell) => boolean,
  ): boolean =>
    c.peopleIn(area).some((id) => {
      const there = c.cellOf(id);
      return who(id) && there !== undefined && test(there);
    }) ||
    (unplaced.some(who) &&
      c.cellsOf(area).some((cell) => free(cell.row, cell.col) && test(cell)));
  const asks = (id: string, holds: (area: string) => boolean): boolean =>
    !placed.includes(id) || holds(areaOfId(id));
  const anyone = (): boolean => true;
  const woman = (id: string): boolean => c.has(id, "woman");
  const inDining = c.peopleIn("E");
  return (
    lines.every(
      (row) => rows.has(row) || lines.some((col) => free(row, col)),
    ) &&
    lines.every(
      (col) => cols.has(col) || lines.some((row) => free(row, col)),
    ) &&
    placed.filter((id) => standsOn(c, id, "chair")).length <= 1 &&
    inDining.length <= 2 &&
    asks(
      "G",
      () =>
        inDining.every((id) => id === "G" || woman(id)) &&
        reachable("E", (id) => id !== "G" && woman(id), anyone),
    ) &&
    asks(
      "O",
      (area) =>
        c.peopleIn(area).length <= 2 &&
        reachable(area, (id) => id !== "O", anyone),
    ) &&
    asks("D", (area) =>
      c
        .peopleIn(area)
        .every((id) => id === "D" || !standsBeside(c, id, "pumpkin")),
    ) &&
    asks("A", (area) => reachable(area, (id) => id !== "A", anyone)) &&
    asks("B", (area) =>
      reachable(
        area,
        (id) => id !== "B" && woman(id),
        (cell) => c.beside(cell, "tree"),
      ),
    ) &&
    asks("C", (area) =>
      reachable(
        area,
        (id) => id !== "C",
        (cell) => c.is(cell, "rug"),
      ),
    ) &&
    asks("H", (area) =>
      reachable(area, anyone, (cell) => c.beside(cell, "table")),
    )
  );
}

/** The case. */
export const HALLOWEEN_PARTY: Level = {
  id: "halloween-party",
  name: "Halloweenparty",
  series: { book: "original", number: 77 },
  story: "Erst lösen wir den Mord, dann bewerten wir die Kostüme.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "P",
      name: "Swimmingpool",
      at: "im Swimmingpool",
      ground: "water",
      label: { row: 1, col: 1 },
      labelOverhang: true,
    },
    {
      key: "H",
      name: "Hinterhof",
      at: "im Hinterhof",
      ground: "stone",
      label: { row: 2, col: 5 },
    },
    {
      key: "S",
      name: "Schuppen",
      at: "im Schuppen",
      ground: "floor",
      tint: "#8f8288",
      label: { row: 1, col: 9 },
    },
    {
      key: "B",
      name: "Badezimmer",
      at: "im Badezimmer",
      ground: "floor",
      tint: "#f2c66d",
      label: { row: 7, col: 0 },
      labelOverhang: true,
    },
    {
      key: "E",
      name: "Esszimmer",
      at: "im Esszimmer",
      ground: "floor",
      tint: "#f6d28a",
      label: { row: 7, col: 4 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "floor",
      tint: "#f6dcc0",
      label: { row: 6, col: 9 },
    },
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#f2c66d",
      label: { row: 9, col: 7 },
      labelOverhang: true,
    },
    {
      key: "G",
      name: "Garage",
      at: "in der Garage",
      ground: "floor",
      tint: "#b9aec8",
      label: { row: 9, col: 1 },
    },
    {
      key: "D",
      name: "Diele",
      at: "in der Diele",
      ground: "floor",
      tint: "#f6d28a",
      label: { row: 10, col: 5 },
    },
    {
      key: "T",
      name: "Garten",
      at: "im Garten",
      ground: "stone",
      label: { row: 11, col: 3 },
    },
  ],
  areaMap: [
    "PPPPPHHHHSSS",
    "PPPPPHHHHSSS",
    "HHHHHHHHHHHH",
    "HHHEEEEHHHHH",
    "HBBEEEEKKKKH",
    "BBBEEEEKKKKK",
    "BBBEEEEKKKKK",
    "BBBEEEEWWWWW",
    "GGGDDDDWWWWW",
    "GGGDDDDWWWWW",
    "TTTTDDDTTTTT",
    "TTTTTTTTTTTT",
  ],
  thingMap: [
    ".....unu....",
    "..........ts",
    ".c.....uc...",
    "..n...pnu...",
    "..tptc..ttt.",
    "kcrctcp....t",
    "tpr.t.st...t",
    "tc.....pt.v.",
    "ss.......rrc",
    "s..tk.p.cccp",
    "k..krrrk.nku",
    ".n...uuu...n",
  ],
  things: {
    c: "chair",
    k: "pumpkin",
    n: "tree",
    p: "plant",
    r: "rug",
    s: "shelf",
    t: "table",
    u: "shrub",
    v: "tv",
  },
  extraThings: {
    pumpkin: { name: "Kürbis", emoji: "\u{1F383}", standable: false },
  },
  pieces: [
    { at: { row: 6, col: 0 }, rows: 2, cols: 1 },
    { at: { row: 4, col: 4 }, rows: 3, cols: 1 },
    { at: { row: 4, col: 8 }, rows: 1, cols: 3 },
    { at: { row: 5, col: 11 }, rows: 2, cols: 1 },
    { at: { row: 5, col: 2 }, rows: 2, cols: 1 },
    { at: { row: 8, col: 9 }, rows: 1, cols: 2 },
    { at: { row: 10, col: 4 }, rows: 1, cols: 3 },
  ],
  suspects: [
    {
      id: "A",
      name: "Andy",
      pronoun: "er",
      clue: {
        text: "Er war neben einem Regal. Er war nicht allein.",
        ...all(
          beside("shelf"),
          counting((c) => others(c).length > 0),
        ),
      },
      colour: "#b45309",
      face: "\u{1F9DF}",
    },
    {
      id: "B",
      name: "Bruno",
      pronoun: "er",
      clue: {
        text: "Eine Frau war neben einem Baum in seinem Raum.",
        ...all(
          own(areaHas("tree")),
          counting((c) =>
            others(c).some(
              (id) => c.has(id, "woman") && standsBeside(c, id, "tree"),
            ),
          ),
        ),
      },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Carissa",
      pronoun: "sie",
      clue: {
        text: "Jemand anderes war auf dem Teppich in ihrem Raum.",
        ...all(
          own(areaHas("rug")),
          counting((c) => others(c).some((id) => standsOn(c, id, "rug"))),
        ),
      },
      colour: "#0e7490",
      face: "\u{1F608}",
    },
    {
      id: "D",
      name: "Danika",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person neben einem Kürbis in ihrem Raum.",
        ...all(
          beside("pumpkin"),
          counting(
            (c) => !others(c).some((id) => standsBeside(c, id, "pumpkin")),
          ),
        ),
      },
      colour: "#4f46e5",
      face: "\u{1F478}\u{1F3FE}",
    },
    {
      id: "E",
      name: "Esther",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Tisch.", ...beside("table") },
      colour: "#6b21a8",
      face: "\u{1F9D9}‍♀️",
    },
    {
      id: "F",
      name: "Frank",
      pronoun: "er",
      clue: {
        text: "Er war entweder im Schuppen oder im Swimmingpool.",
        ...inArea("S", "P"),
      },
      colour: "#7f1d1d",
      face: "\u{1F920}",
    },
    {
      id: "G",
      name: "Gerald",
      pronoun: "er",
      clue: {
        text: "Er war allein mit einer Frau im Esszimmer.",
        ...all(
          inArea("E"),
          counting((c) => {
            const rest = others(c);
            return rest.length === 1 && rest.every((id) => c.has(id, "woman"));
          }),
        ),
      },
      colour: "#ea580c",
      face: "\u{1F480}",
    },
    {
      id: "H",
      name: "Heinrich",
      pronoun: "er",
      clue: {
        text: "Mindestens eine Person war neben einem Tisch in seinem Raum.",
        ...all(
          own(areaHas("table")),
          counting((c) =>
            c
              .peopleIn(c.areaOf(c.cell) ?? "")
              .some((id) => standsBeside(c, id, "table")),
          ),
        ),
      },
      colour: "#3730a3",
      face: "\u{1F9D1}‍\u{1F680}",
    },
    {
      id: "I",
      name: "Iris",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person, die auf einem Stuhl saß.",
        ...all(
          on("chair"),
          counting(
            (c) =>
              !c
                .people()
                .some((id) => id !== c.self && standsOn(c, id, "chair")),
          ),
        ),
      },
      colour: "#be123c",
      face: "\u{1F47C}",
    },
    {
      id: "J",
      name: "Jeremy",
      pronoun: "er",
      clue: {
        text: "Er war neben einer Wand. Der Raum auf der anderen Seite war die Küche.",
        ...own(besideKitchenWall),
      },
      colour: "#a8a29e",
      face: "\u{1F9DB}",
    },
    {
      id: "K",
      name: "Kerstin",
      pronoun: "sie",
      clue: {
        text: "In ihrer Spalte war ein Kürbis, in einem anderen Raum.",
        ...own(pumpkinInColumnElsewhere),
      },
      colour: "#57534e",
      face: "\u{1F478}",
    },
    {
      id: "O",
      name: "Orm",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F3C8}",
    },
  ],
  prune: stillPossible,
  hints: [
    {
      text: "Bruno kann nur im Garten sein, entweder mit Danika oder Kerstin. (Keine Felder neben Bäumen im Hinterhof sind in Spalten mit Kürbissen.) Schließe den Dielenteppich aus.",
      cross: [
        { row: 10, col: 4 },
        { row: 10, col: 5 },
        { row: 10, col: 6 },
      ],
    },
    {
      text: "Nur zwei Teppiche bleiben. Jemand ist laut Carissas Hinweis auf einem Teppich, also schließe das überschneidende Feld in der Garage aus.",
      cross: [{ row: 8, col: 2 }],
    },
    {
      text: "Das lokalisiert Andy neben dem Regal im Schuppen (nicht im Esszimmer laut Geralds Hinweis). Jemand ist mit Andy in Z2 S10; das muss Frank sein.",
      place: { A: { row: 0, col: 11 }, F: { row: 1, col: 9 } },
    },
    {
      text: "Das lokalisiert Jeremy im Hinterhof, im letzten Feld neben einer Küchenwand. (Jeremy kann auch nicht im Esszimmer sein.) Carissa muss in S2 mit jemandem auf dem Teppich sein; schließe den Rest von S3 aus. Carissa kann laut Iris' Hinweis nicht auf einem Stuhl sein, was Carissa in Z5 S2 lokalisiert.",
      place: { J: { row: 3, col: 10 }, C: { row: 4, col: 1 } },
    },
    {
      text: "Jemand muss im letzten Feld sein, das in Z11 übrig ist; schließe den Rest von S9 aus. Iris muss in Z6 sitzen mit Gerald im Esszimmer. Das lokalisiert die Person auf dem Teppich. Schließe den Rest von Z7 aus.",
    },
    {
      text: "Das lokalisiert Esther, dann Iris, Bruno und Danika, dann Gerald. Heinrich muss mit Carissa zusammen sein, auf dem Teppich. Orm kann nicht allein im Wohnzimmer sein, also ist Kerstin dort, und Orm ist in Z3 S1. Jeremy ist der Mörder!",
      place: {
        E: { row: 8, col: 3 },
        I: { row: 5, col: 5 },
        B: { row: 11, col: 4 },
        D: { row: 10, col: 8 },
        G: { row: 7, col: 6 },
        H: { row: 6, col: 2 },
        K: { row: 9, col: 7 },
        O: { row: 2, col: 0 },
      },
    },
  ],
  solution: {
    A: { row: 0, col: 11 },
    B: { row: 11, col: 4 },
    C: { row: 4, col: 1 },
    D: { row: 10, col: 8 },
    E: { row: 8, col: 3 },
    F: { row: 1, col: 9 },
    G: { row: 7, col: 6 },
    H: { row: 6, col: 2 },
    I: { row: 5, col: 5 },
    J: { row: 3, col: 10 },
    K: { row: 9, col: 7 },
    O: { row: 2, col: 0 },
  },
};
