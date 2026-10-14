/**
 * Ein volles Haus: eight rooms of a house from the bathroom to the basement,
 * with a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/70. Ein volles Haus.JPG`,
 * solution sheet `Lösungen 1-80/Lösung 69-72.JPG`).
 * Ove is the victim; whoever was alone with him killed him.
 *
 * The armchairs are the chairs; they and the two beds can be stood on. The
 * tables, the shelves, the TVs (the record players with the note) and the
 * plants cannot. Dan and Holly wear glasses, as the portraits show. A field
 * is beside a wall when one of its sides lies on a room border or on the
 * edge of the map. The room directly south of another is the one below it
 * on the page: the kitchen below the bathroom, the dining room below the
 * guest room, the study below the living room, the basement below the
 * kitchen and the dining room, the bedroom below the study.
 */
import { all, column, counting, own, victim } from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** The room directly south of each room, where there is one. */
const SOUTH_OF: Readonly<Record<string, string>> = {
  B: "K",
  G: "E",
  W: "A",
  K: "L",
  E: "L",
  A: "S",
};

/** How many rooms held nobody. */
const EMPTY_ROOMS = 4;

/** Whether a field has a wall on any side: a room border or the map's edge. */
function besideWall(c: Context, cell: Cell): boolean {
  const steps: readonly Cell[] = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
  ];
  return steps.some((step) => {
    const next = { row: cell.row + step.row, col: cell.col + step.col };
    return !c.inside(next) || c.areaOf(next) !== c.areaOf(cell);
  });
}

/** The others in the suspect's room. */
function roommates(c: Context): readonly string[] {
  return c.peopleIn(c.areaOf(c.cell) ?? "").filter((id) => id !== c.self);
}

/** Whether a TV stood in the suspect's room, in the suspect's row. */
function tvInRowOfRoom(c: Context): boolean {
  return c
    .cellsOf(c.areaOf(c.cell) ?? "")
    .some((cell) => cell.row === c.cell.row && c.is(cell, "tv"));
}

/** Whether somebody else in the suspect's room sat on a chair. */
function otherOnChair(c: Context): boolean {
  return roommates(c).some((id) => {
    const there = c.cellOf(id);
    return there !== undefined && c.is(there, "chair");
  });
}

/** Whether the suspect's room has a chair besides the suspect's own field. */
function chairToSpare(c: Context): boolean {
  return c
    .cellsOf(c.areaOf(c.cell) ?? "")
    .some(
      (cell) =>
        c.is(cell, "chair") &&
        (cell.row !== c.cell.row || cell.col !== c.cell.col),
    );
}

/** Whether the suspect's room reaches further south than the suspect. */
function roomSouthOfField(c: Context): boolean {
  return c
    .cellsOf(c.areaOf(c.cell) ?? "")
    .some((cell) => cell.row > c.cell.row && c.standable(cell));
}

/** Whether somebody with glasses was in the suspect's room, south of them. */
function glassesSouth(c: Context): boolean {
  return roommates(c).some((id) => {
    const there = c.cellOf(id);
    return (
      there !== undefined && c.has(id, "glasses") && there.row > c.cell.row
    );
  });
}

/** Whether the room directly south of the suspect's held somebody. */
function southRoomTaken(c: Context): boolean {
  const south = SOUTH_OF[c.areaOf(c.cell) ?? ""];
  return south !== undefined && c.peopleIn(south).length > 0;
}

/** Whether the suspect was alone with exactly two women. */
function aloneWithTwoWomen(c: Context): boolean {
  const others = roommates(c);
  return others.length === 2 && others.every((id) => c.has(id, "woman"));
}

/** Whether exactly four rooms held nobody. */
function fourEmptyRooms(c: Context): boolean {
  return (
    c.level.areas.filter((area) => c.peopleIn(area.key).length === 0).length ===
    EMPTY_ROOMS
  );
}

/** Everybody else in the room of a placed person, or nobody while unplaced. */
function othersWith(c: Context, id: string): readonly string[] {
  const there = c.cellOf(id);
  return there === undefined
    ? []
    : c.peopleIn(c.areaOf(there) ?? "").filter((other) => other !== id);
}

/**
 * For the solver: no more rooms taken than four empty ones leave, nobody but
 * two women with Fabienne, at most one other with Ove, and Christian's
 * glasses south of him once Dan and Holly stand.
 */
function stillPossible(c: Context): boolean {
  const withFabienne = othersWith(c, "F");
  const christian = c.cellOf("C");
  const glassesOpen =
    christian === undefined ||
    c.cellOf("D") === undefined ||
    c.cellOf("H") === undefined;
  return (
    c.level.areas.filter((area) => c.peopleIn(area.key).length > 0).length <=
      c.level.areas.length - EMPTY_ROOMS &&
    withFabienne.length <= 2 &&
    withFabienne.every((id) => c.has(id, "woman")) &&
    othersWith(c, "O").length <= 1 &&
    (glassesOpen ||
      glassesSouth({ ...c, self: "C", cell: christian ?? c.cell }))
  );
}

/** The case. */
export const A_FULL_HOUSE: Level = {
  id: "a-full-house",
  name: "Ein volles Haus",
  series: { book: "original", number: 70 },
  story: "Dieser Ort ist vollgepackt mit potenziellen Tätern!",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "B",
      name: "Badezimmer",
      at: "im Badezimmer",
      ground: "floor",
      tint: "#d9cdee",
      label: { row: 2, col: 0 },
    },
    {
      key: "G",
      name: "Gästezimmer",
      at: "im Gästezimmer",
      ground: "floor",
      tint: "#e4e0ec",
      label: { row: 2, col: 2 },
    },
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#f6e2dc",
      label: { row: 3, col: 7 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "floor",
      tint: "#ddcdec",
      label: { row: 5, col: 0 },
    },
    {
      key: "E",
      name: "Esszimmer",
      at: "im Esszimmer",
      ground: "floor",
      tint: "#f0dce0",
      label: { row: 6, col: 3 },
    },
    {
      key: "A",
      name: "Arbeitszimmer",
      at: "im Arbeitszimmer",
      ground: "floor",
      tint: "#f6ead6",
      label: { row: 5, col: 7 },
      labelEnd: true,
    },
    {
      key: "L",
      name: "Keller",
      at: "im Keller",
      ground: "stone",
      tint: "#e6e2f0",
      label: { row: 8, col: 1 },
    },
    {
      key: "S",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "floor",
      tint: "#cfc8d8",
      label: { row: 8, col: 5 },
    },
  ],
  areaMap: [
    "BBGGGWWWW",
    "BBGGGWWWW",
    "BBGGGWWWW",
    "KKEEEWWWW",
    "KKEEEAAAA",
    "KKEEESAAA",
    "LLEEESSSS",
    "LLLLLSSSS",
    "LLLLLSSSS",
  ],
  thingMap: [
    "p.bbc..s.",
    ".c..c....",
    ".....t.pt",
    "tt.c..cc.",
    ".sctp..ss",
    "...tc.c..",
    ".......p.",
    "tt.tpbb.v",
    "...v...t.",
  ],
  things: {
    b: "bed",
    c: "chair",
    p: "plant",
    s: "shelf",
    t: "table",
    v: "tv",
  },
  pieces: [
    { at: { row: 0, col: 2 }, rows: 1, cols: 2 },
    { at: { row: 3, col: 0 }, rows: 1, cols: 2 },
    { at: { row: 4, col: 3 }, rows: 2, cols: 1 },
    { at: { row: 7, col: 0 }, rows: 1, cols: 2 },
    { at: { row: 7, col: 5 }, rows: 1, cols: 2 },
  ],
  suspects: [
    {
      id: "A",
      name: "Amelia",
      pronoun: "sie",
      clue: {
        text: "In ihrem Raum war ein Fernseher, in derselben Zeile.",
        ...own(tvInRowOfRoom),
      },
      colour: "#c2410c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Birte",
      pronoun: "sie",
      clue: {
        text: "Jemand anders in ihrem Raum saß auf einem Stuhl.",
        ...all(own(chairToSpare), counting(otherOnChair)),
      },
      colour: "#15803d",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "C",
      name: "Christian",
      pronoun: "er",
      clue: {
        text: "Jemand mit Brille war in seinem Raum, südlich von ihm.",
        ...all(own(roomSouthOfField), counting(glassesSouth)),
      },
      colour: "#0e7490",
      face: "\u{1F468}",
    },
    {
      id: "D",
      name: "Dan",
      pronoun: "er",
      traits: ["glasses"],
      clue: {
        text: "Der Raum direkt südlich von seinem war besetzt.",
        ...all(
          own((c) => SOUTH_OF[c.areaOf(c.cell) ?? ""] !== undefined),
          counting(southRoomTaken),
        ),
      },
      colour: "#4338ca",
      face: "\u{1F913}",
    },
    {
      id: "E",
      name: "Evan",
      pronoun: "er",
      clue: {
        text: "Er war nicht neben einer Wand.",
        ...own((c) => !besideWall(c, c.cell)),
      },
      colour: "#6d28d9",
      face: "\u{1F468}‍\u{1F9B0}",
    },
    {
      id: "F",
      name: "Fabienne",
      pronoun: "sie",
      clue: {
        text: "Sie war allein mit zwei Frauen.",
        ...counting(aloneWithTwoWomen),
      },
      colour: "#7f1d1d",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "G",
      name: "Gus",
      pronoun: "er",
      clue: {
        text: "Er war entweder auf einem Stuhl oder auf einem Bett.",
        ...own((c) => c.is(c.cell, "chair") || c.is(c.cell, "bed")),
      },
      colour: "#ea580c",
      face: "\u{1F474}",
    },
    {
      id: "H",
      name: "Holly",
      pronoun: "sie",
      traits: ["glasses"],
      clue: { text: "Sie war in der zweiten Spalte.", ...column(2) },
      colour: "#1d4ed8",
      face: "\u{1F469}‍\u{1F9B3}",
    },
    {
      id: "O",
      name: "Ove",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war im letzten verbleibenden Feld.",
        ...victim(),
      },
      colour: "#be123c",
      face: "\u{1F9D4}",
    },
  ],
  rules: [
    {
      text: "Es gab genau vier leere Räume.",
      check: fourEmptyRooms,
      prune: stillPossible,
    },
  ],
  hints: [
    {
      text: "Fabienne ist allein mit zwei Frauen. Amelia und Birte sind in verschiedenen Räumen (kein Raum hat sowohl Fernseher als auch Stuhl), also ist Holly eine der Frauen mit Fabienne, und sie müssen im Keller sein (und Amelia ist mit ihnen).",
    },
    {
      text: "Amelia ist in Z9; das lokalisiert Holly, dann Fabienne. Schließe Z9 im Schlafzimmer aus.",
      place: { H: { row: 6, col: 1 }, F: { row: 7, col: 2 } },
      cross: [
        { row: 8, col: 5 },
        { row: 8, col: 6 },
        { row: 8, col: 8 },
      ],
    },
    {
      text: "Christian muss mit Dan zusammen sein. Der Raum unter ihnen ist besetzt, also können sie nicht im Gästezimmer oder Arbeitszimmer sein (sie würden alle Positionen im Raum darunter blockieren), oder im Esszimmer (sie würden Z4/Z6 besetzen, und dann gäbe es niemanden, der allein in der Küche oder im Arbeitszimmer in Z5 sein könnte). Sie sind im Wohnzimmer.",
    },
    {
      text: "Das Arbeitszimmer unter Dan ist besetzt. Evan kann nicht darin sein, also ist Birte und/oder Gus dort. So oder so sitzt jemand auf dem Stuhl. Das lässt zwei Felder in Z3, im Gästezimmer; eines muss besetzt sein. Also sind Badezimmer, Küche, Esszimmer und Schlafzimmer die leeren Räume.",
    },
    {
      text: "Das lokalisiert Amelia in S1. Evan muss in Z2 sein (in S4 oder S8), Christian in Z1, Dan in Z4. Das lokalisiert Birte und Gus im Arbeitszimmer, dann Ove. Evan ist der Mörder!",
      place: {
        A: { row: 8, col: 0 },
        B: { row: 4, col: 5 },
        C: { row: 0, col: 8 },
        D: { row: 3, col: 7 },
        E: { row: 1, col: 3 },
        G: { row: 5, col: 6 },
        O: { row: 2, col: 4 },
      },
    },
  ],
  solution: {
    A: { row: 8, col: 0 },
    B: { row: 4, col: 5 },
    C: { row: 0, col: 8 },
    D: { row: 3, col: 7 },
    E: { row: 1, col: 3 },
    F: { row: 7, col: 2 },
    G: { row: 5, col: 6 },
    H: { row: 6, col: 1 },
    O: { row: 2, col: 4 },
  },
};
