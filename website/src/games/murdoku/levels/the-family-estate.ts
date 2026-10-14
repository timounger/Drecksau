/**
 * The Family Estate: a guest room, a bathroom, a dining room, a kitchen, a
 * bedroom, a cellar and a store room, with a murdered heir.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Das Familienanwesen/Das Familienanwesen.png`,
 * solution sheet `Das Murdoku-Orginal/Lösungen 1-80/Lösung 09-12.JPG`).
 * Osvaldo is the victim; whoever was alone with him killed him.
 *
 * The armchairs and the beds can be stood on; the plants, the dark tables, the
 * wardrobe, the shelves and the radio cannot. Sitting on a chair means being
 * on an armchair. A field is "in a corner of the room" when walls - a room
 * border or the edge of the map - run along two adjacent sides of it.
 */
import { all, beside, inArea, not, on, own, victim } from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** The case. */
export const THE_FAMILY_ESTATE: Level = {
  id: "the-family-estate",
  name: "Das Familienanwesen",
  series: { book: "original", number: 12 },
  story:
    "Nichts bringt das Schlechteste in Menschen so gut zum Vorschein wie der Streit ums Testament.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "G",
      name: "Gästezimmer",
      at: "im Gästezimmer",
      ground: "floor",
      tint: "#e4e4dc",
      label: { row: 1, col: 1 },
    },
    {
      key: "B",
      name: "Badezimmer",
      at: "im Badezimmer",
      ground: "stone",
      tint: "#d6d6de",
      label: { row: 1, col: 6 },
    },
    {
      key: "E",
      name: "Esszimmer",
      at: "im Esszimmer",
      ground: "floor",
      tint: "#e8e6e0",
      label: { row: 5, col: 1 },
    },
    {
      key: "U",
      name: "Küche",
      at: "in der Küche",
      ground: "stone",
      tint: "#dcdcd8",
      label: { row: 5, col: 4 },
    },
    {
      key: "S",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "floor",
      tint: "#e6e4e2",
      label: { row: 5, col: 6 },
    },
    {
      key: "K",
      name: "Keller",
      at: "im Keller",
      ground: "stone",
      tint: "#dedcdc",
      label: { row: 8, col: 3 },
    },
    {
      key: "L",
      name: "Lagerraum",
      at: "im Lagerraum",
      ground: "stone",
      tint: "#b8b8bc",
      label: { row: 8, col: 7 },
    },
  ],
  areaMap: [
    "GGGGGBBBB",
    "GGGGGBBBB",
    "EEEGGSSSS",
    "EEEEESSSS",
    "EEEEUUSSS",
    "EEEEUUSSS",
    "KKKKKKKLL",
    "KKKKKKKLL",
    "KKKKKKKLL",
  ],
  thingMap: [
    "..tbtp.cw",
    "...b....w",
    "c.c.....p",
    ".tt....bs",
    "pc.ct..bs",
    ".........",
    "....c....",
    "sc.c....s",
    "s.r.tpcs.",
  ],
  things: {
    b: "bed",
    c: "chair",
    p: "plant",
    r: "radio",
    s: "shelf",
    t: "table",
    w: "wardrobe",
  },
  extraThings: {
    radio: { name: "Radio", emoji: "\u{1F4FB}", standable: false },
    wardrobe: {
      name: "Schrank",
      emoji: "\u{1F6AA}",
      standable: false,
      kinds: ["furniture"],
    },
  },
  pieces: [
    { at: { row: 0, col: 3 }, rows: 2, cols: 1 },
    { at: { row: 0, col: 8 }, rows: 2, cols: 1 },
    { at: { row: 3, col: 1 }, rows: 1, cols: 2 },
    { at: { row: 3, col: 7 }, rows: 2, cols: 1 },
  ],
  suspects: [
    {
      id: "A",
      name: "Adam",
      pronoun: "er",
      clue: {
        text: "Er war im Lagerraum. Er war nicht neben einem Regal.",
        ...all(inArea("L"), not(beside("shelf"))),
      },
      colour: "#b91c1c",
      face: "\u{1F9D4}",
    },
    {
      id: "B",
      name: "Belinda",
      pronoun: "sie",
      clue: {
        text: "Sie saß auf einem Stuhl im Keller.",
        ...all(on("chair"), inArea("K")),
      },
      colour: "#15803d",
      face: "\u{1F469}",
    },
    {
      id: "C",
      name: "Clemens",
      pronoun: "er",
      clue: { text: "Er war im Badezimmer.", ...inArea("B") },
      colour: "#0e7490",
      face: "\u{1F9D4}",
    },
    {
      id: "D",
      name: "Dario",
      pronoun: "er",
      clue: { text: "Er war im Schlafzimmer.", ...inArea("S") },
      colour: "#6366f1",
      face: "\u{1F468}",
    },
    {
      id: "E",
      name: "Edwin",
      pronoun: "er",
      clue: { text: "Er war auf einem Bett.", ...on("bed") },
      colour: "#7c3aed",
      face: "\u{1F468}",
    },
    {
      id: "F",
      name: "Farah",
      pronoun: "sie",
      clue: { text: "Sie war im Gästezimmer.", ...inArea("G") },
      colour: "#9f1239",
      face: "\u{1F469}‍\u{1F9B3}",
    },
    {
      id: "G",
      name: "Greg",
      pronoun: "er",
      clue: { text: "Er war neben einer Pflanze.", ...beside("plant") },
      colour: "#ea580c",
      face: "\u{1F468}",
    },
    {
      id: "H",
      name: "Helena",
      pronoun: "sie",
      clue: {
        text: "Sie war im Keller, in einer Ecke des Raumes.",
        ...all(
          inArea("K"),
          own((c) => isCorner(c, c.cell)),
        ),
      },
      colour: "#4338ca",
      face: "\u{1F469}",
    },
    {
      id: "O",
      name: "Osvaldo",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F9D4}",
    },
  ],
  rules: [],
  hints: [
    {
      text: "Es gibt nur ein Feld im Lagerraum, das nicht neben einem Regal ist, also muss Adam dort sein: Zeile 7, Spalte 8.",
      place: { A: { row: 6, col: 7 } },
    },
    { text: "Das platziert Edwin auf dem Bett im Gästezimmer, in Spalte 4." },
    {
      text: "Das lokalisiert auch Helena in der Südostecke des Kellers.",
      place: { H: { row: 8, col: 6 } },
    },
    {
      text: "Das lokalisiert Belinda auf dem letzten Stuhl im Keller und lokalisiert auch Clemens im Badezimmer, dann Edwin auf dem Bett.",
      place: {
        B: { row: 7, col: 1 },
        C: { row: 1, col: 5 },
        E: { row: 0, col: 3 },
      },
    },
    {
      text: "Das lokalisiert Dario im Schlafzimmer, dann Greg im letzten Feld neben einer Pflanze.",
      place: { D: { row: 5, col: 8 }, G: { row: 3, col: 0 } },
    },
    {
      text: "Das lokalisiert Osvaldo im Esszimmer mit Greg. Greg ist der Mörder!",
      place: { O: { row: 4, col: 2 } },
    },
  ],
  solution: {
    A: { row: 6, col: 7 },
    B: { row: 7, col: 1 },
    C: { row: 1, col: 5 },
    D: { row: 5, col: 8 },
    E: { row: 0, col: 3 },
    F: { row: 2, col: 4 },
    G: { row: 3, col: 0 },
    H: { row: 8, col: 6 },
    O: { row: 4, col: 2 },
  },
};

/**
 * The sides of a field that lie on a wall: a room border or the map's edge.
 *
 * @returns the steps towards those sides
 */
function wallsOf(c: Context, cell: Cell): readonly Cell[] {
  const steps: readonly Cell[] = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
  ];
  return steps.filter((step) => {
    const next = { row: cell.row + step.row, col: cell.col + step.col };
    return !c.inside(next) || c.areaOf(next) !== c.areaOf(cell);
  });
}

/** Whether a field has walls on two adjacent sides - a corner of its room. */
function isCorner(c: Context, cell: Cell): boolean {
  const walls = wallsOf(c, cell);
  return (
    walls.some((step) => step.row !== 0) && walls.some((step) => step.col !== 0)
  );
}
