/**
 * The Family Estate: a guest room, a bathroom, a dining room, a kitchen, a
 * bedroom, a cellar and a store room, with a murdered heir.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Das Familienanwesen/Das Familienanwesen.png`,
 * no solution sheet - the solver proves the one solution, with the culprit
 * pencilled in on the photographed page).
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
    "Nichts bringt das Schlechteste in Menschen so gut zum Vorschein wie der Streit ums Testament. Osvaldo wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
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
      traits: ["glasses"],
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
      traits: ["glasses"],
      clue: { text: "Er war im Schlafzimmer.", ...inArea("S") },
      colour: "#6366f1",
      face: "\u{1F468}",
    },
    {
      id: "E",
      name: "Edwin",
      pronoun: "er",
      traits: ["glasses"],
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
      traits: ["glasses"],
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
      text: "Adam war im Lagerraum, aber nicht neben einem Regal. Die Regale stehen in R8 C9 und R9 C8; R7 C9, R8 C8 und R9 C9 liegen alle neben einem davon. Nur R7 C8 bleibt - dort war Adam. Blockiere den Rest von R7 und C8.",
      place: { A: { row: 6, col: 7 } },
      cross: [
        { row: 6, col: 0 },
        { row: 6, col: 1 },
        { row: 6, col: 2 },
        { row: 6, col: 3 },
        { row: 6, col: 4 },
        { row: 6, col: 5 },
        { row: 6, col: 6 },
        { row: 6, col: 8 },
        { row: 0, col: 7 },
        { row: 1, col: 7 },
        { row: 2, col: 7 },
        { row: 3, col: 7 },
        { row: 4, col: 7 },
        { row: 5, col: 7 },
        { row: 7, col: 7 },
        { row: 8, col: 7 },
      ],
    },
    {
      text: "Helena war in einer Ecke des Kellers. Die Ecken sind R7 C1, R7 C7, R9 C1 (ein Regal) und R9 C7. R7 ist gesperrt, also war Helena auf dem Sessel in R9 C7. Blockiere den Rest von R9 und C7.",
      place: { H: { row: 8, col: 6 } },
      cross: [
        { row: 8, col: 0 },
        { row: 8, col: 1 },
        { row: 8, col: 2 },
        { row: 8, col: 3 },
        { row: 8, col: 4 },
        { row: 8, col: 5 },
        { row: 8, col: 8 },
        { row: 0, col: 6 },
        { row: 1, col: 6 },
        { row: 2, col: 6 },
        { row: 3, col: 6 },
        { row: 4, col: 6 },
        { row: 5, col: 6 },
        { row: 7, col: 6 },
      ],
    },
    {
      text: "Edwin war auf einem Bett. Das Bett im Schlafzimmer liegt in der gesperrten C8, also lag Edwin auf dem Bett im Gästezimmer in C4 - in R1 oder R2. Blockiere den Rest von C4.",
      cross: [
        { row: 2, col: 3 },
        { row: 3, col: 3 },
        { row: 4, col: 3 },
        { row: 5, col: 3 },
        { row: 7, col: 3 },
      ],
    },
    {
      text: "Belinda saß auf einem Stuhl im Keller. Der Sessel in R7 C5 liegt in der gesperrten R7, R8 C4 in Edwins C4 und R9 C7 ist Helenas Platz. Belinda saß in R8 C2. Blockiere den Rest von R8 und C2.",
      place: { B: { row: 7, col: 1 } },
      cross: [
        { row: 7, col: 0 },
        { row: 7, col: 2 },
        { row: 7, col: 4 },
        { row: 7, col: 5 },
        { row: 7, col: 8 },
        { row: 0, col: 1 },
        { row: 1, col: 1 },
        { row: 2, col: 1 },
        { row: 3, col: 1 },
        { row: 4, col: 1 },
        { row: 5, col: 1 },
      ],
    },
    {
      text: "Clemens war im Badezimmer. Frei sind dort nur noch C6 und C9; in C9 steht der Schrank und in R1 C6 eine Pflanze. Clemens war in R2 C6. Blockiere den Rest von R2 und C6. Damit lag Edwin in R1 C4 - blockiere den Rest von R1.",
      place: { C: { row: 1, col: 5 }, E: { row: 0, col: 3 } },
      cross: [
        { row: 1, col: 0 },
        { row: 1, col: 2 },
        { row: 1, col: 3 },
        { row: 1, col: 4 },
        { row: 1, col: 8 },
        { row: 0, col: 5 },
        { row: 2, col: 5 },
        { row: 3, col: 5 },
        { row: 4, col: 5 },
        { row: 5, col: 5 },
        { row: 0, col: 0 },
        { row: 0, col: 2 },
        { row: 0, col: 4 },
        { row: 0, col: 8 },
      ],
    },
    {
      text: "Dario war im Schlafzimmer. C6, C7 und C8 sind gesperrt, in C9 stehen in R3 bis R5 eine Pflanze und zwei Regale. Dario war in R6 C9. Blockiere den Rest von R6 und C9.",
      place: { D: { row: 5, col: 8 } },
      cross: [
        { row: 5, col: 0 },
        { row: 5, col: 2 },
        { row: 5, col: 4 },
        { row: 2, col: 8 },
        { row: 3, col: 8 },
        { row: 4, col: 8 },
      ],
    },
    {
      text: "Farah war im Gästezimmer. R1, R2 und C4 sind gesperrt, also bleibt nur R3 C5. Blockiere den Rest von R3 und C5.",
      place: { F: { row: 2, col: 4 } },
      cross: [
        { row: 2, col: 0 },
        { row: 2, col: 2 },
        { row: 3, col: 4 },
        { row: 4, col: 4 },
      ],
    },
    {
      text: "Frei sind nur noch R4 C1, R4 C3 (Tisch), R5 C1 (Pflanze) und R5 C3. Greg war neben einer Pflanze: R4 C1 neben der Pflanze in R5 C1, R5 C3 liegt neben keiner. Osvaldo blieb R5 C3 - im Esszimmer allein mit Greg. Greg ist der Mörder!",
      place: { G: { row: 3, col: 0 }, O: { row: 4, col: 2 } },
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
