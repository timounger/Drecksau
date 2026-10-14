/**
 * Der Bauernhof: a pasture, a shed, a farmhouse, a cowshed, a yard, a garden
 * and a pigsty, with a murdered farmer.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/79. Der Bauernhof.JPG`,
 * solved on `Lösungen 1-80/Lösung 77-80.JPG`).
 * Osgar is the victim; whoever was alone with him killed him.
 *
 * Cows and pigs cannot be stood on (the page says so), nor the bushes, the
 * tables (the L-shaped trough in the cowshed among them) and the shelves.
 * Mud puddles can (the page says so), and so can the horses - Holger sat on
 * one - the bed and the armchairs, which are the chairs. Cows, pigs and
 * horses are animals. The pasture, the yard and the garden are outside, the
 * other areas inside.
 *
 * The book draws the doors in the walls; the map has no doors in walls, so
 * each door stands on the field inside the room it opens from, where
 * "inside, in front of a door" is.
 */
import {
  about,
  all,
  alone,
  beside,
  counting,
  not,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** The areas outside; the others are inside. */
const OUTSIDE: readonly string[] = ["W", "Y", "G"];

/** Whether an area is outside. */
function isOutside(area: string | null): boolean {
  return OUTSIDE.includes(area ?? "");
}

/** Whether the suspect was alone with Joaquin and a woman east of her. */
function withJoaquinAndAWoman(c: Context): boolean {
  const others = c
    .peopleIn(c.areaOf(c.cell) ?? "")
    .filter((id) => id !== c.self);
  const woman = others.find((id) => id !== "J");
  const there = woman === undefined ? undefined : c.cellOf(woman);
  return (
    others.length === 2 &&
    others.includes("J") &&
    woman !== undefined &&
    c.has(woman, "woman") &&
    there !== undefined &&
    there.col > c.cell.col
  );
}

/**
 * Whether the suspect's area has fields for Joaquin (top or bottom row) and
 * for somebody east of her - what her clue needs of her own field.
 */
function roomForJoaquin(c: Context): boolean {
  const fields = c.cellsOf(c.areaOf(c.cell) ?? "").filter(c.standable);
  return (
    fields.some((cell) => cell.row === 0 || cell.row === c.rows - 1) &&
    fields.some((cell) => cell.col > c.cell.col)
  );
}

/** Whether the suspect and Kelly were one inside and one outside. */
function apartFromKelly(c: Context): boolean {
  const kelly = c.cellOf("K");
  return (
    kelly !== undefined &&
    isOutside(c.areaOf(kelly)) !== isOutside(c.areaOf(c.cell))
  );
}

/** Whether somebody else stood in the suspect's area. */
function notAlone(c: Context): boolean {
  return c.peopleIn(c.areaOf(c.cell) ?? "").length > 1;
}

/** Whether exactly one person stood in a mud puddle. */
function oneInMud(c: Context): boolean {
  return (
    c.people().filter((id) => {
      const there = c.cellOf(id);
      return there !== undefined && c.is(there, "mud");
    }).length === 1
  );
}

/** Everybody else in the area of somebody placed, or none while unplaced. */
function companyOf(c: Context, id: string): readonly string[] {
  const there = c.cellOf(id);
  return there === undefined
    ? []
    : c.peopleIn(c.areaOf(there) ?? "").filter((one) => one !== id);
}

/**
 * For the solver only: whether a partial placement can still come right -
 * at most one person in mud, Carola still alone, and nobody in Branka's area
 * but Joaquin and one more woman.
 */
function stillPossible(c: Context): boolean {
  const inMud = c.people().filter((id) => {
    const there = c.cellOf(id);
    return there !== undefined && c.is(there, "mud");
  });
  const branka = companyOf(c, "B");
  return (
    inMud.length <= 1 &&
    companyOf(c, "C").length === 0 &&
    branka.length <= 2 &&
    branka.filter((id) => id !== "J").length <= 1 &&
    branka.every((id) => c.has(id, "woman") || id === "J") &&
    (c.cellOf("B") === undefined ||
      c.cellOf("J") === undefined ||
      branka.includes("J"))
  );
}

/** The case. */
export const THE_FARM: Level = {
  id: "the-farm",
  name: "Der Bauernhof",
  series: { book: "original", number: 79 },
  story: "Vielleicht werden wir nie das Muhtiv des Mörders erfahren.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "W",
      name: "Weide",
      at: "auf der Weide",
      ground: "grass",
      tint: "#7fa36a",
      label: { row: 1, col: 0 },
    },
    {
      key: "S",
      name: "Schuppen",
      at: "im Schuppen",
      ground: "floor",
      tint: "#d7b3c6",
      label: { row: 2, col: 5 },
    },
    {
      key: "H",
      name: "Haus",
      at: "im Haus",
      ground: "floor",
      tint: "#e6c4b4",
      label: { row: 3, col: 8 },
    },
    {
      key: "K",
      name: "Kuhstall",
      at: "im Kuhstall",
      ground: "stone",
      tint: "#ecc9a0",
      label: { row: 6, col: 0 },
    },
    {
      key: "Y",
      name: "Hof",
      at: "im Hof",
      ground: "grass",
      tint: "#b5cf72",
      label: { row: 7, col: 7 },
    },
    {
      key: "G",
      name: "Garten",
      at: "im Garten",
      ground: "sand",
      tint: "#9b7b78",
      label: { row: 11, col: 0 },
    },
    {
      key: "Z",
      name: "Schweinestall",
      at: "im Schweinestall",
      ground: "stone",
      tint: "#ecc9a0",
      label: { row: 11, col: 8 },
    },
  ],
  areaMap: [
    "WWWWWSSSHHHH",
    "WWWWWSSSHHHH",
    "KKWWWSSSHHHH",
    "KKKWWYYYHHHH",
    "KKKKYYYYYHHY",
    "KKKKYYYYYYYY",
    "KKKYYYYYYYYY",
    "GGYYYYYYYYYY",
    "GGYYYYYZZZZZ",
    "GGGYYZZZZZZZ",
    "GGGYYYZZZZZZ",
    "GGYYYYZZZZZZ",
  ],
  thingMap: [
    "b...bsts...t",
    "...k....B.c.",
    ".....s.dB..s",
    "tkt.hb...c.t",
    "kt.d.....dd.",
    "t.kdm.mb.h.b",
    "tt.....kb...",
    ".b.m......p.",
    ".......p.d.t",
    "b....d...p.t",
    "bb....t....p",
    "..m.bh.p...p",
  ],
  things: {
    B: "bed",
    b: "shrub",
    c: "chair",
    d: "door",
    h: "horse",
    k: "cow",
    m: "mud",
    p: "pig",
    s: "shelf",
    t: "table",
  },
  extraThings: {
    shrub: {
      name: "Busch",
      emoji: "\u{1F33F}",
      standable: false,
      kinds: ["plant"],
    },
    cow: {
      name: "Kuh",
      emoji: "\u{1F404}",
      standable: false,
      kinds: ["animal"],
    },
    pig: {
      name: "Schwein",
      emoji: "\u{1F416}",
      standable: false,
      kinds: ["animal"],
    },
    horse: {
      name: "Pferd",
      emoji: "\u{1F40E}",
      standable: true,
      kinds: ["animal"],
    },
    door: { name: "Tür", emoji: "\u{1F6AA}", standable: true },
  },
  pieces: [
    { at: { row: 1, col: 8 }, rows: 2, cols: 1 },
    { at: { row: 8, col: 11 }, rows: 2, cols: 1 },
  ],
  shapes: [
    [
      { row: 5, col: 0 },
      { row: 6, col: 0 },
      { row: 6, col: 1 },
    ],
  ],
  // The doors, drawn in the walls beside the fields in front of them.
  windows: [
    { at: { row: 2, col: 7 }, side: "bottom", door: true },
    { at: { row: 4, col: 3 }, side: "right", door: true },
    { at: { row: 5, col: 3 }, side: "right", door: true },
    { at: { row: 4, col: 9 }, side: "bottom", door: true },
    { at: { row: 4, col: 10 }, side: "bottom", door: true },
    { at: { row: 8, col: 9 }, side: "top", door: true },
    { at: { row: 9, col: 5 }, side: "top", door: true },
  ],
  suspects: [
    {
      id: "A",
      name: "Ariana",
      pronoun: "sie",
      clue: {
        text: "Sie war drinnen. Sie war vor einer Tür.",
        ...all(
          own((c) => !isOutside(c.areaOf(c.cell))),
          on("door"),
        ),
      },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Branka",
      pronoun: "sie",
      clue: {
        text: "Sie war allein mit Joaquin und einer Frau, die östlich von ihr war.",
        ...all(own(roomForJoaquin), counting(withJoaquinAndAWoman)),
      },
      colour: "#15803d",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "C",
      name: "Carola",
      pronoun: "sie",
      clue: {
        text: "Sie war allein. Sie und Kelly waren weder beide drinnen noch beide draußen.",
        ...all(alone(), about(["K"], apartFromKelly)),
      },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Dylan",
      pronoun: "er",
      clue: { text: "Er saß auf einem Stuhl.", ...on("chair") },
      colour: "#6366f1",
      face: "\u{1F468}",
    },
    {
      id: "E",
      name: "Eli",
      pronoun: "er",
      clue: {
        text: "Er war neben einer Kuh. Er war nicht allein.",
        ...all(beside("cow"), counting(notAlone)),
      },
      colour: "#7c3aed",
      face: "\u{1F60E}",
    },
    {
      id: "F",
      name: "Filomena",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Regal.", ...beside("shelf") },
      colour: "#9f1239",
      face: "\u{1F475}",
    },
    {
      id: "G",
      name: "Gina",
      pronoun: "sie",
      clue: {
        text: "Sie war nicht neben einem Busch oder einem Tier.",
        ...all(not(beside("shrub")), not(beside("animal"))),
      },
      colour: "#ea580c",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "H",
      name: "Holger",
      pronoun: "er",
      clue: { text: "Er saß auf einem Pferd.", ...on("horse") },
      colour: "#4338ca",
      face: "\u{1F920}",
    },
    {
      id: "I",
      name: "Irene",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Schwein.", ...beside("pig") },
      colour: "#be185d",
      face: "\u{1F469}",
    },
    {
      id: "J",
      name: "Joaquin",
      pronoun: "er",
      clue: {
        text: "Er war entweder in der obersten oder der untersten Zeile.",
        ...own((c) => c.cell.row === 0 || c.cell.row === c.rows - 1),
      },
      colour: "#78716c",
      face: "\u{1F9D4}",
    },
    {
      id: "K",
      name: "Kelly",
      pronoun: "sie",
      clue: {
        text: "Sie war entweder in der ersten oder der letzten Spalte.",
        ...own((c) => c.cell.col === 0 || c.cell.col === c.cols - 1),
      },
      colour: "#8b5cf6",
      face: "\u{1F469}",
    },
    {
      id: "O",
      name: "Osgar",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F468}‍\u{1F33E}",
    },
  ],
  rules: [
    {
      text: "Die Weide, der Hof und der Garten sind draußen. Die anderen Räume sind drinnen.",
    },
    {
      text: "Genau eine Person war in einer Schlammpfütze.",
      check: oneInMud,
      prune: stillPossible,
    },
  ],
  hints: [
    {
      text: "Filomena ist in Z2 oder Z3, neben einem Regal, und Dylan ist in Z2 oder Z4. Es ist also unmöglich, dass Joaquin in Z1 allein mit Branka und einer anderen Frau ist, da nur zwei Personen auf die Weide passen, also ist Joaquin in Z12.",
    },
    {
      text: "Zwei Pferde bleiben für Holger. Schließe die sich überschneidenden Felder aus: Z4 S10, Z6 S5.",
      cross: [
        { row: 3, col: 9 },
        { row: 5, col: 4 },
      ],
    },
    {
      text: "Dylan ist auf dem letzten Stuhl, was Filomena lokalisiert.",
      place: { D: { row: 1, col: 10 }, F: { row: 2, col: 6 } },
    },
    {
      text: "Kelly kann nur draußen sein, also ist Carola drinnen, allein im Kuhstall oder im Schweinestall.",
    },
    {
      text: "Eli und Irene können nicht beide drinnen sein, sonst kann Carola nicht allein sein. Also ist entweder Eli auf der Weide (Z1 S4) oder im Hof (Z8 S8), oder Irene ist im Hof in Z8. So oder so, schließe Z8 S4 aus, wo sich alle Möglichkeiten überschneiden. Das lokalisiert Joaquin in der letzten Schlammpfütze (im Hof mit zwei Frauen), dann Holger auf dem Pferd auf der Weide.",
      place: { J: { row: 11, col: 2 }, H: { row: 3, col: 4 } },
    },
    {
      text: "Nur Kelly kann im Garten in S1 sein (nicht Osgar; niemand sonst könnte im Raum sein, und Osgar ist nicht allein), also kann die Person in S12 mit Joaquin und Branka nur Irene sein. Das lokalisiert Irene, dann Kelly.",
      place: { I: { row: 7, col: 11 }, K: { row: 8, col: 0 } },
    },
    {
      text: "Alle freien Felder in Z7 sind im Hof, also ist Branka in Z7. Schließe die anderen Felder im Hof aus.",
      place: { B: { row: 6, col: 5 } },
    },
    {
      text: "Eli ist nicht allein, also wenn er im Kuhstall ist, ist er in Z6 S2 mit jemandem in Z5 S4, und Carola ist allein im Schweinestall. Aber dann wäre entweder Z10 oder Z11 leer, also ist Eli in Z1 S4. Das lokalisiert Carola im letzten Feld in Z6. Jemand muss Z5 S10 besetzen (das letzte Feld in Z5), was Branka lokalisiert, dann Ariana, dann Gina und Osgar. Gina ist die Mörderin!",
      place: {
        E: { row: 0, col: 3 },
        C: { row: 5, col: 1 },
        A: { row: 4, col: 9 },
        G: { row: 10, col: 8 },
        O: { row: 9, col: 7 },
      },
    },
  ],
  solution: {
    A: { row: 4, col: 9 },
    B: { row: 6, col: 5 },
    C: { row: 5, col: 1 },
    D: { row: 1, col: 10 },
    E: { row: 0, col: 3 },
    F: { row: 2, col: 6 },
    G: { row: 10, col: 8 },
    H: { row: 3, col: 4 },
    I: { row: 7, col: 11 },
    J: { row: 11, col: 2 },
    K: { row: 8, col: 0 },
    O: { row: 9, col: 7 },
  },
};
