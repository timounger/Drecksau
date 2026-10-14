/**
 * Der Zirkus: the ring, the stands around it, the entrance, the stable and
 * the dressing room, with a murdered performer.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/75. Der Zirkus.JPG`,
 * solution in `Lösungen 1-80/Lösung 73-76.JPG`).
 * Oceane is the victim; whoever was alone with her killed her.
 *
 * Brenda, Carla and Daniel each played one of three circus roles - ring
 * acrobat, knife thrower and lion tamer - and nobody says who played which.
 * The roles are one check over the whole placement: some way of handing them
 * out must fit every role card, Gerald's and Heike's clues at once.
 *
 * The map has nine rows and twelve columns, so three columns stay empty. The
 * armchairs are the chairs; they, the horses and the rugs (the two in the
 * ring, the T at the entrance and the one in the stable) can be stood on.
 * The barrels, the lions, the weapon stands, the tables and the shelves
 * cannot.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  about,
  all,
  alone,
  counting,
  inArea,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** Every way of handing out the roles: acrobat, thrower, tamer. */
const CASTINGS: readonly (readonly string[])[] = [
  ["B", "C", "D"],
  ["B", "D", "C"],
  ["C", "B", "D"],
  ["C", "D", "B"],
  ["D", "B", "C"],
  ["D", "C", "B"],
];

/** Whether a field lies exactly one row north of a weapon stand. */
function northOfWeapons(c: Context, cell: Cell): boolean {
  const below = cell.row + 1;
  return Array.from({ length: c.cols }, (_, col) => ({ row: below, col })).some(
    (one) => c.inside(one) && c.is(one, "weaponRack"),
  );
}

/** The three whose roles are unknown. */
const PERFORMERS: readonly string[] = ["B", "C", "D"];

/** Whether a field fits at least one of the roles - for the performers only. */
function fitsARole(c: Context): boolean {
  return (
    c.is(c.cell, "rug") || northOfWeapons(c, c.cell) || c.beside(c.cell, "lion")
  );
}

/** Whether a column, counted from nought, holds a rug. */
function hasRug(c: Context, col: number): boolean {
  return Array.from({ length: c.rows }, (_, row) => ({ row, col })).some(
    (cell) => c.inside(cell) && c.is(cell, "rug"),
  );
}

/** Whether the roles can be handed out so that every role card and clue holds. */
function rolesFit(c: Context): boolean {
  const gerald = c.cellOf("G");
  const heike = c.cellOf("H");
  return CASTINGS.some(([acrobat, thrower, tamer]) => {
    const ring = c.cellOf(acrobat ?? "");
    const knives = c.cellOf(thrower ?? "");
    const lions = c.cellOf(tamer ?? "");
    return (
      ring !== undefined &&
      knives !== undefined &&
      lions !== undefined &&
      gerald !== undefined &&
      heike !== undefined &&
      c.is(ring, "rug") &&
      northOfWeapons(c, knives) &&
      c.beside(lions, "lion") &&
      gerald.col > lions.col &&
      heike.col === ring.col - 3
    );
  });
}

/** Whether nobody stood in a column, counted from nought. */
function emptyColumn(c: Context, col: number): boolean {
  return c.people().every((id) => c.cellOf(id)?.col !== col);
}

/** Whether a column, counted from nought, holds a barrel. */
function hasBarrel(c: Context, col: number): boolean {
  return Array.from({ length: c.rows }, (_, row) => ({ row, col })).some(
    (cell) => c.inside(cell) && c.is(cell, "barrel"),
  );
}

/** Eddie's clue: a barrel in his column, and every other column with one empty. */
function barrelsEmpty(c: Context): boolean {
  return (
    hasBarrel(c, c.cell.col) &&
    Array.from({ length: c.cols }, (_, col) => col).every(
      (col) => col === c.cell.col || !hasBarrel(c, col) || emptyColumn(c, col),
    )
  );
}

/** Whether somebody placed stands in a column, counted from nought. */
function taken(c: Context, col: number): boolean {
  return !emptyColumn(c, col);
}

/** Whether the people placed so far can still fit every column and role clue. */
function stillPossible(c: Context): boolean {
  const placed = new Set(c.people());
  const eddie = c.cellOf("E");
  const brenda = c.cellOf("B");
  const daniel = c.cellOf("D");
  const barrelsFine =
    eddie === undefined ||
    Array.from({ length: c.cols }, (_, col) => col).every(
      (col) => col === eddie.col || !hasBarrel(c, col) || emptyColumn(c, col),
    );
  const castKnown = ["B", "C", "D", "G", "H"].every((id) => placed.has(id));
  return (
    barrelsFine &&
    (brenda === undefined || !taken(c, brenda.col + 1)) &&
    (daniel === undefined ||
      (!taken(c, daniel.col - 1) &&
        c.peopleIn(c.areaOf(daniel) ?? "").length === 1)) &&
    (!castKnown || rolesFit(c))
  );
}

/** The case. */
export const THE_CIRCUS: Level = {
  id: "the-circus",
  name: "Der Zirkus",
  series: { book: "original", number: 75 },
  story:
    "Normalerweise kommt man in den Zirkus, um todesmutigen Kunststücken zuzusehen, nicht todbringenden.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "T",
      name: "Tribüne",
      at: "auf der Tribüne",
      ground: "floor",
      tint: "#b98bb4",
      label: { row: 8, col: 4 },
    },
    {
      key: "M",
      name: "Manege",
      at: "in der Manege",
      ground: "floor",
      tint: "#e8664c",
      label: { row: 7, col: 4 },
    },
    {
      key: "E",
      name: "Eingang",
      at: "im Eingang",
      ground: "floor",
      tint: "#8a5fb0",
      label: { row: 5, col: 8 },
      labelOverhang: true,
    },
    {
      key: "S",
      name: "Stall",
      at: "im Stall",
      ground: "floor",
      tint: "#dca08c",
      label: { row: 2, col: 11 },
      labelEnd: true,
    },
    {
      key: "G",
      name: "Garderobe",
      at: "in der Garderobe",
      ground: "floor",
      tint: "#d8a8d0",
      label: { row: 8, col: 10 },
      labelOverhang: true,
    },
  ],
  areaMap: [
    ".TTTTTT...SS",
    ".TTMMMTT.SSS",
    "TTMMMMMTTSSS",
    "TMMMMMMMEE..",
    "TMMMMMMMEEGG",
    "TMMMMMMMEEGG",
    "TTMMMMMTTGGG",
    ".TTMMMTT.GGG",
    "..TTTTT..GGG",
  ],
  thingMap: [
    "..tccct...ht",
    ".ccrfrcc...h",
    "tc.rrr.c.r.t",
    "c..h.l.wr...",
    "........rrs.",
    "tf.l...fr...",
    ".cfrrr.ctt.w",
    "..crrr.c.tt.",
    "..cc.cc....s",
  ],
  things: {
    c: "chair",
    f: "barrel",
    h: "horse",
    l: "lion",
    r: "rug",
    s: "shelf",
    t: "table",
    w: "weaponRack",
  },
  extraThings: {
    horse: {
      name: "Pferd",
      emoji: "\u{1F40E}",
      standable: true,
      kinds: ["seat", "animal"],
    },
  },
  pieces: [
    { at: { row: 1, col: 3 }, rows: 2, cols: 3, thing: "rug" },
    { at: { row: 6, col: 3 }, rows: 2, cols: 3 },
  ],
  shapes: [
    [
      { row: 3, col: 8 },
      { row: 4, col: 8 },
      { row: 5, col: 8 },
      { row: 4, col: 9 },
    ],
    [
      { row: 6, col: 9 },
      { row: 7, col: 9 },
      { row: 7, col: 10 },
    ],
  ],
  suspects: [
    {
      id: "A",
      name: "Arnold",
      pronoun: "er",
      clue: {
        text: "Der Zirkusdirektor. Er saß auf einem Pferd.",
        ...on("horse"),
      },
      colour: "#7f1d1d",
      face: "\u{1F468}‍\u{1F3A9}",
    },
    {
      id: "B",
      name: "Brenda",
      pronoun: "sie",
      clue: {
        text: "(Rolle unbekannt.) Die Spalte direkt östlich von ihr war leer.",
        ...counting((c) => emptyColumn(c, c.cell.col + 1)),
      },
      colour: "#15803d",
      face: "\u{1F469}",
    },
    {
      id: "C",
      name: "Carla",
      pronoun: "sie",
      clue: {
        text: "(Rolle unbekannt.) Sie war 4 Zeilen südlich von Eddie.",
        ...about(["E"], (c) => c.cell.row === (c.cellOf("E")?.row ?? -9) + 4),
      },
      colour: "#0e7490",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "D",
      name: "Daniel",
      pronoun: "er",
      clue: {
        text: "(Rolle unbekannt.) Er war allein. Die Spalte direkt westlich von ihm war leer.",
        ...all(
          alone(),
          counting((c) => emptyColumn(c, c.cell.col - 1)),
        ),
      },
      colour: "#4f46e5",
      face: "\u{1F9D4}",
    },
    {
      id: "E",
      name: "Eddie",
      pronoun: "er",
      clue: {
        text: "Der Clown. Irgendwo in seiner Spalte war ein Fass. Alle anderen Spalten mit einem Fass waren leer.",
        ...all(
          own((c) => hasBarrel(c, c.cell.col)),
          counting(barrelsEmpty),
        ),
      },
      colour: "#6b21a8",
      face: "\u{1F921}",
    },
    {
      id: "F",
      name: "Frederick",
      pronoun: "er",
      clue: {
        text: "Der Feuerschlucker. Er war in der Garderobe.",
        ...inArea("G"),
      },
      colour: "#9f1239",
      face: "\u{1F468}",
    },
    {
      id: "G",
      name: "Gerald",
      pronoun: "er",
      clue: {
        text: "Zuschauer. Er saß auf einem Stuhl, östlich des Löwenbändigers.",
        ...all(on("chair"), counting(rolesFit)),
      },
      colour: "#ea580c",
      face: "\u{1F468}\u{1F3FE}",
    },
    {
      id: "H",
      name: "Heike",
      pronoun: "sie",
      clue: {
        text: "Zuschauerin. Sie saß 3 Spalten westlich des Ringakrobaten.",
        ...all(
          on("seat"),
          own((c) => hasRug(c, c.cell.col + 3)),
          counting(rolesFit),
        ),
      },
      colour: "#1d4ed8",
      face: "\u{1F475}",
    },
    {
      id: "O",
      name: "Oceane",
      pronoun: "sie",
      clue: {
        text: "Das Opfer. Sie war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#be123c",
      face: "\u{1F469}",
    },
  ],
  rules: [
    {
      text: "Wir wissen nicht, welche Zirkusrolle Brenda, Carla und Daniel letzte Nacht gespielt haben. Um das Rätsel zu lösen, musst du herausfinden, wer von ihnen der Ringakrobat, der Messerwerfer und der Löwenbändiger war.",
      unary: (suspect, c) => !PERFORMERS.includes(suspect.id) || fitsARole(c),
      check: rolesFit,
      prune: stillPossible,
    },
    { text: "Der Ringakrobat war auf einem Teppich.", check: rolesFit },
    {
      text: "Der Messerwerfer war genau eine Zeile nördlich eines Waffenständers.",
      check: rolesFit,
    },
    { text: "Der Löwenbändiger war neben einem Löwen.", check: rolesFit },
  ],
  hints: [
    {
      text: "Vier Spalten haben Fässer; Eddie ist in einer, und die anderen sind leer. Jede andere Spalte ist besetzt. Heike ist die einzige Person, die in S1 sein kann; sie sitzt in Z4. (Brenda, Carla und Daniel können nicht in S1 sein, da keine der drei nicht zugewiesenen Zirkusrollen dort sein kann.)",
      place: { H: { row: 3, col: 0 } },
    },
    {
      text: "Der Ringakrobat, drei Spalten östlich von Heike, ist in S4, auf dem Teppich. Der Löwenbändiger ist im selben Raum, also muss Daniel, der allein ist, der Messerwerfer sein.",
    },
    {
      text: "Arnold, auf einem Pferd, ist nicht in S4 und muss im Stall sein, und wir wissen, dass Frederick in der Garderobe ist, also kann Daniel nur allein im Eingang in Z6 sein, eine Zeile nördlich des Waffenständers in S12. Die einzigen leeren Spalten haben Fässer, also lokalisiert das Daniel in S9 mit S8 leer.",
      place: { D: { row: 5, col: 8 } },
    },
    {
      text: "Der Löwenbändiger kann nur in S6 oder S7 sein; Gerald ist auf einem Stuhl östlich des Löwenbändigers, also ist der Löwenbändiger in S6 und Gerald in S7. Brenda ist dann der Ringakrobat (und S5 ist leer) und Carla ist der Löwenbändiger.",
    },
    {
      text: "Das lokalisiert Carla in Z5. Eddie ist vier Zeilen darüber, was ihn in Z1 S2 lokalisiert; S3 ist leer.",
      place: { C: { row: 4, col: 5 }, E: { row: 0, col: 1 } },
    },
    {
      text: "Das lokalisiert Arnold auf dem letzten Pferd, dann Gerald. Das lokalisiert Frederick in der Garderobe, dann Oceane. Arnold ist der Mörder!",
      place: {
        A: { row: 1, col: 11 },
        G: { row: 8, col: 6 },
        B: { row: 7, col: 3 },
        F: { row: 6, col: 10 },
        O: { row: 2, col: 9 },
      },
    },
  ],
  solution: {
    A: { row: 1, col: 11 },
    B: { row: 7, col: 3 },
    C: { row: 4, col: 5 },
    D: { row: 5, col: 8 },
    E: { row: 0, col: 1 },
    F: { row: 6, col: 10 },
    G: { row: 8, col: 6 },
    H: { row: 3, col: 0 },
    O: { row: 2, col: 9 },
  },
};
