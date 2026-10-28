/**
 * Die Kreuzung: a copy shop, a street, a restaurant, a boulevard, a chai
 * stall and a kirana shop in India, with a murdered passer-by.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 3 - Auf Weltreise/59. Die Kreuzung.png`,
 * no solution sheet - the solver proves the solution is the only one).
 * Owais is the victim; whoever was alone with him killed him.
 *
 * The map is ten by ten. Every car covers two fields. The cars on the
 * boulevard face east, as in the other books: the west field is the back
 * seat. The cars seen from above face south (the long bonnet is at the
 * bottom): the north field is the back seat. Cars, scooters and chairs can be
 * stood on; the TVs, shelves, tables and plants cannot. The strip of road
 * east of the kirana shop belongs to the boulevard.
 */
import {
  about,
  alone,
  all,
  beside,
  counting,
  inArea,
  on,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** The case. */
export const THE_CROSSING: Level = {
  id: "the-crossing",
  name: "Die Kreuzung",
  series: { book: "worldTravel", number: 59 },
  story: "Erst nach links und rechts schauen, dann Beweise sammeln.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "C",
      name: "Copyshop",
      at: "im Copyshop",
      ground: "floor",
      tint: "#e2c98f",
      label: { row: 3, col: 1 },
    },
    {
      key: "S",
      name: "Straße",
      at: "auf der Straße",
      ground: "stone",
      tint: "#b4b2bd",
      label: { row: 3, col: 4 },
    },
    {
      key: "R",
      name: "Restaurant",
      at: "im Restaurant",
      ground: "floor",
      tint: "#d2a87e",
      label: { row: 3, col: 7 },
    },
    {
      key: "B",
      name: "Boulevard",
      at: "auf dem Boulevard",
      ground: "stone",
      tint: "#a9a7b4",
      label: { row: 5, col: 4 },
    },
    {
      key: "D",
      name: "Chai-Dhaba",
      at: "im Chai-Dhaba",
      ground: "floor",
      tint: "#dcc283",
      label: { row: 8, col: 0 },
    },
    {
      key: "K",
      name: "Kirana-Laden",
      at: "im Kirana-Laden",
      ground: "floor",
      tint: "#e6cf94",
      label: { row: 9, col: 5 },
    },
  ],
  areaMap: [
    "CCCCSSRRRR",
    "CCCCSSRRRR",
    "CCCCSSRRRR",
    "CCCCSSRRRR",
    "BBBBBBBBBB",
    "BBBBBBBBBB",
    "DDDKKKKKBB",
    "DDDKKKKKBB",
    "DDKKKKKKBB",
    "KKKKKKKKBB",
  ],
  thingMap: [
    "...t.m..h.",
    "st.hmbhpah",
    "th.tbcah.p",
    "aa..c.h...",
    ".m.bcmbc..",
    "..bcbcm.m.",
    "saa...ss..",
    "...aa.shbm",
    "t.....s.cb",
    "...ss....c",
  ],
  things: {
    a: "table",
    b: "carBack",
    c: "carFront",
    h: "chair",
    m: "scooter",
    p: "plant",
    s: "shelf",
    t: "tv",
  },
  extraThings: {
    carFront: {
      name: "Auto (vorn)",
      emoji: "\u{1F697}",
      standable: true,
      kinds: ["car"],
    },
    carBack: {
      name: "Auto (hinten)",
      emoji: "\u{1F697}",
      standable: true,
      kinds: ["car"],
    },
    scooter: { name: "Motorroller", emoji: "\u{1F6F5}", standable: true },
  },
  pieces: [
    { at: { row: 3, col: 0 }, rows: 1, cols: 2 },
    { at: { row: 6, col: 1 }, rows: 1, cols: 2 },
    { at: { row: 7, col: 3 }, rows: 1, cols: 2 },
    { at: { row: 1, col: 5 }, rows: 2, cols: 1, thing: "car" },
    { at: { row: 2, col: 4 }, rows: 2, cols: 1, thing: "car" },
    { at: { row: 4, col: 3 }, rows: 1, cols: 2, thing: "car" },
    { at: { row: 4, col: 6 }, rows: 1, cols: 2, thing: "car" },
    { at: { row: 5, col: 2 }, rows: 1, cols: 2, thing: "car" },
    { at: { row: 5, col: 4 }, rows: 1, cols: 2, thing: "car" },
    { at: { row: 7, col: 8 }, rows: 2, cols: 1, thing: "car" },
    { at: { row: 8, col: 9 }, rows: 2, cols: 1, thing: "car" },
  ],
  // The scooters on the streets that run north and south face south.
  turned: [
    { row: 0, col: 5 },
    { row: 1, col: 4 },
    { row: 7, col: 9 },
  ],
  suspects: [
    {
      id: "A",
      name: "Arsalan",
      pronoun: "er",
      clue: { text: "Er war auf einem Motorroller.", ...on("scooter") },
      colour: "#b45309",
      face: "\u{1F9D4}",
    },
    {
      id: "B",
      name: "Bilal",
      pronoun: "er",
      clue: { text: "Er war neben einem Fernseher.", ...beside("tv") },
      colour: "#6d28d9",
      face: "\u{1F60E}",
    },
    {
      id: "C",
      name: "Chandni",
      pronoun: "sie",
      clue: { text: "Sie saß vorn in einem Auto.", ...on("carFront") },
      colour: "#0369a1",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Durdana",
      pronoun: "sie",
      clue: { text: "Sie saß hinten in einem Auto.", ...on("carBack") },
      colour: "#4d7c0f",
      face: "\u{1F469}\u{200D}\u{1F9B1}",
    },
    {
      id: "E",
      name: "Eshal",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Regal.", ...beside("shelf") },
      colour: "#be185d",
      face: "\u{1F475}",
    },
    {
      id: "F",
      name: "Furqan",
      pronoun: "er",
      clue: { text: "Er war neben einer Pflanze.", ...beside("plant") },
      colour: "#78716c",
      face: "\u{1F474}",
    },
    {
      id: "G",
      name: "Gulnaz",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person, die auf einem Stuhl saß.",
        ...all(on("chair"), counting(onlyOneOnAChair)),
      },
      colour: "#c2410c",
      face: "\u{1F469}\u{1F3FE}\u{200D}\u{1F9B1}",
    },
    {
      id: "H",
      name: "Haroon",
      pronoun: "er",
      clue: {
        text: "Er war neben dem Tisch im Kirana-Laden.",
        ...all(inArea("K"), beside("table")),
      },
      colour: "#a16207",
      face: "\u{1F468}",
    },
    {
      id: "I",
      name: "Ishrat",
      pronoun: "sie",
      clue: {
        text: "Sie war allein. Sie war südöstlich von Arsalan.",
        ...all(alone(), about(["A"], southEastOfArsalan)),
      },
      colour: "#9f1239",
      face: "\u{1F469}\u{200D}\u{1F373}",
    },
    {
      id: "O",
      name: "Owais",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#b91c1c",
      face: "\u{1F468}\u{200D}\u{1F9B2}",
    },
  ],
  hints: [
    {
      text: "Die Zeilen 5 und 6 gehören ganz zum Boulevard - dort sind also mindestens zwei Personen, und Ishrat, die allein war, war nicht auf dem Boulevard. Im Restaurant war immer Furqan (nur dort gibt es Pflanzen), im Kirana-Laden Haroon. Ishrat war also im Copyshop, auf der Straße oder im Chai-Dhaba.",
    },
    {
      text: "Ishrat war südöstlich von Arsalans Motorroller. Südöstlich von R5 C6, R6 C7, R6 C9 und R8 C10 liegen nur Boulevard und Kirana-Laden; südöstlich von R1 C6 nur Restaurant, Boulevard und Kirana-Laden, südöstlich von R2 C5 dazu nur die Straße, wo Arsalan selbst wäre. Also stand Arsalan in R5 C2, und Ishrat steht im Chai-Dhaba in R8 C3 (R7 C3 ist ein Tisch).",
      place: { A: { row: 4, col: 1 }, I: { row: 7, col: 2 } },
    },
    {
      text: "Bilal war neben einem Fernseher. Im Chai-Dhaba war Ishrat allein, und auf einem Stuhl saß nur Gulnaz. Im Copyshop bleiben R1 C2, R1 C3, R2 C3, R3 C3 und R4 C4 - C2 ist Arsalans, C3 Ishrats Spalte. Bilal steht in R4 C4.",
      place: { B: { row: 3, col: 3 } },
    },
    {
      text: "Haroon war neben dem Tisch in R8 C4/C5: C4 ist Bilals Spalte, R8 Ishrats Zeile - er steht in C5, in R7 oder R9. Damit bleiben Durdana nur die Rücksitze R2 C6 und R9 C10, und Chandni die Vordersitze R3 C6, R6 C6, R9 C9 und R10 C10.",
    },
    {
      text: "In Zeile 6 kann nur Chandni (R6 C6) oder Owais stehen. Wäre es Owais, wäre er auf dem Boulevard allein mit Arsalan - Chandni und Durdana müssten dann in R3 C6 und R2 C6 sitzen, beide in Spalte 6. Also sitzt Chandni in R6 C6, Durdana in R9 C10, und Haroon steht in R7 C5.",
      place: {
        C: { row: 5, col: 5 },
        D: { row: 8, col: 9 },
        H: { row: 6, col: 4 },
      },
    },
    {
      text: "Frei sind die Zeilen 1, 2, 3 und 10 und die Spalten 1, 7, 8 und 9. Eshal kann nur noch nach R1 C1 oder R10 C7. In R10 C7 müsste Owais Spalte 1 in R1 C1 nehmen, und Furqan und Gulnaz fänden in den Zeilen 2 und 3 keine zwei Felder. Also steht Eshal in R1 C1, Furqan in R3 C9, Gulnaz sitzt in R2 C7 - und Owais steht in R10 C8 im Kirana-Laden, allein mit Haroon. Haroon ist der Mörder!",
      place: {
        E: { row: 0, col: 0 },
        F: { row: 2, col: 8 },
        G: { row: 1, col: 6 },
        O: { row: 9, col: 7 },
      },
    },
  ],
  solution: {
    A: { row: 4, col: 1 },
    B: { row: 3, col: 3 },
    C: { row: 5, col: 5 },
    D: { row: 8, col: 9 },
    E: { row: 0, col: 0 },
    F: { row: 2, col: 8 },
    G: { row: 1, col: 6 },
    H: { row: 6, col: 4 },
    I: { row: 7, col: 2 },
    O: { row: 9, col: 7 },
  },
};

/** Whether nobody but the suspect sat on a chair. */
function onlyOneOnAChair(c: Context): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return id === c.self || there === undefined || !c.is(there, "chair");
  });
}

/** Whether the suspect stood south-east of Arsalan. */
function southEastOfArsalan(c: Context): boolean {
  const arsalan = c.cellOf("A");
  return (
    arsalan !== undefined &&
    c.cell.row > arsalan.row &&
    c.cell.col > arsalan.col
  );
}
