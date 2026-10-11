/**
 * Das verlassene Museum: an abandoned museum with an exhibition, a main
 * gallery, a toilet, a vault, a foyer, a café and a security area, and a
 * murdered visitor.
 *
 * @module
 * @remarks
 * After the free case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Easy/Das verlassene Museum.png`, no solution
 * sheet - the solver proves the single solution). George was "either beside
 * a statue or beside some rubble" - read as exactly one of the two. Vicky is
 * the victim; whoever was alone with her killed her.
 */
import {
  about,
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
import type { Context, Level } from "../engine/types";

/** Whether the suspect stands exactly one column west of George. */
function oneColumnWestOfGeorge(c: Context): boolean {
  const george = c.cellOf("G");
  return george !== undefined && george.col === c.cell.col + 1;
}

/** Whether the suspect stands south of Alysson. */
function southOfAlysson(c: Context): boolean {
  const alysson = c.cellOf("A");
  return alysson !== undefined && alysson.row < c.cell.row;
}

/** Whether the suspect shares the area with exactly one other person, a man. */
function aloneWithAMan(c: Context): boolean {
  const others = c
    .peopleIn(c.areaOf(c.cell) ?? "")
    .filter((id) => id !== c.self);
  return others.length === 1 && c.has(others[0] ?? "", "man");
}

/** Whether a man sat on a chair in the suspect's area. */
function manSittingInArea(c: Context): boolean {
  return c.peopleIn(c.areaOf(c.cell) ?? "").some((id) => {
    const there = c.cellOf(id);
    return (
      id !== c.self &&
      there !== undefined &&
      c.has(id, "man") &&
      c.is(there, "seat")
    );
  });
}

/** Whether the suspect is beside a statue or beside rubble, but not both. */
function statueOrRubble(c: Context): boolean {
  return c.beside(c.cell, "statue") !== c.beside(c.cell, "rubble");
}

/** The case. */
export const THE_ABANDONED_MUSEUM: Level = {
  id: "the-abandoned-museum",
  name: "Das verlassene Museum",
  difficulty: "hard",
  series: { book: "online" },
  story:
    "Vicky wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "A",
      name: "Ausstellung",
      at: "in der Ausstellung",
      ground: "floor",
      tint: "#b3abcf",
      label: { row: 3, col: 2 },
    },
    {
      key: "G",
      name: "Hauptgalerie",
      at: "in der Hauptgalerie",
      ground: "floor",
      tint: "#bcd3dc",
      label: { row: 3, col: 6 },
    },
    {
      key: "T",
      name: "Toilette",
      at: "in der Toilette",
      ground: "floor",
      tint: "#a9c4c4",
      label: { row: 4, col: 0 },
    },
    {
      key: "R",
      name: "Tresorraum",
      at: "im Tresorraum",
      ground: "carpet",
      tint: "#e6d3c3",
      label: { row: 8, col: 0 },
    },
    {
      key: "F",
      name: "Foyer",
      at: "im Foyer",
      ground: "floor",
      tint: "#e3e3f6",
      label: { row: 8, col: 3 },
    },
    {
      key: "C",
      name: "Café",
      at: "im Café",
      ground: "floor",
      tint: "#d3e0f7",
      label: { row: 6, col: 7 },
    },
    {
      key: "S",
      name: "Sicherheitsbereich",
      at: "im Sicherheitsbereich",
      ground: "stone",
      tint: "#9fc4c4",
      label: { row: 8, col: 5 },
    },
  ],
  areaMap: [
    "AAAAAGGGG",
    "AAAAAGGGG",
    "TTAAAGGGG",
    "TTAAAGGGG",
    "TTFFFCCCC",
    "RRFFFCCCC",
    "RRFFFCCCC",
    "RRFFFSSSS",
    "RRFFFSSSS",
  ],
  thingMap: [
    ".xxxtax.a",
    ".........",
    ".t.x....t",
    "xc.xxaa..",
    ".......ct",
    ".sa.....s",
    "..c.actc.",
    "sac.x..vv",
    "....xt.ct",
  ],
  things: {
    x: "rubble",
    t: "table",
    a: "statue",
    c: "chair",
    s: "shelf",
    v: "tv",
  },
  suspects: [
    {
      id: "A",
      name: "Alysson",
      pronoun: "sie",
      clue: {
        text: "Sie war genau eine Spalte westlich von George.",
        ...about(["G"], oneColumnWestOfGeorge),
      },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Brenda",
      pronoun: "sie",
      clue: {
        text: "Sie saß auf einem Stuhl. Sie war allein mit einem Mann.",
        ...all(on("seat"), counting(aloneWithAMan)),
      },
      colour: "#15803d",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "C",
      name: "Cynthia",
      pronoun: "sie",
      clue: {
        text: "Sie war in der ersten Spalte. Sie war südlich von Alysson.",
        ...all(column(1), about(["A"], southOfAlysson)),
      },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Dylan",
      pronoun: "er",
      clue: { text: "Er war neben einem Tisch.", ...beside("table") },
      colour: "#6366f1",
      face: "\u{1F468}",
    },
    {
      id: "E",
      name: "Elsa",
      pronoun: "sie",
      clue: {
        text: "In ihrem Bereich saß ein Mann auf einem Stuhl.",
        ...counting(manSittingInArea),
      },
      colour: "#7c3aed",
      face: "\u{1F469}",
    },
    {
      id: "F",
      name: "Freya",
      pronoun: "sie",
      clue: { text: "Sie war neben einer Statue.", ...beside("statue") },
      colour: "#9f1239",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "G",
      name: "George",
      pronoun: "er",
      clue: {
        text: "Er war entweder neben einer Statue oder etwas Schutt.",
        ...own(statueOrRubble),
      },
      colour: "#ea580c",
      face: "\u{1F474}",
    },
    {
      id: "H",
      name: "Hugh",
      pronoun: "er",
      clue: {
        text: "Er war neben etwas Schutt. Er war nicht im Foyer.",
        ...all(beside("rubble"), not(inArea("F"))),
      },
      colour: "#4338ca",
      face: "\u{1F9D4}",
    },
    {
      id: "V",
      name: "Vicky",
      pronoun: "sie",
      clue: { text: "Das Opfer. Sie war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F469}‍\u{1F9B0}",
    },
  ],
  hints: [
    {
      text: "In R1 sind nur R1 C1 und R1 C8 frei. C1 gehört Cynthia, und sie kann nicht in R1 sein, denn Alysson war nördlich von ihr. Also steht jemand auf R1 C8. Sperre den Rest von R1 und C8.",
      cross: [
        { row: 0, col: 0 },
        { row: 1, col: 7 },
        { row: 2, col: 7 },
        { row: 3, col: 7 },
        { row: 4, col: 7 },
        { row: 5, col: 7 },
        { row: 6, col: 7 },
        { row: 8, col: 7 },
      ],
    },
    {
      text: "Frei sind nur noch die Stühle R4 C2, R7 C3, R8 C3 und R7 C6. Die übrigen Felder der Toilette liegen in C1, Cynthias Spalte, oder in C2 unter dem Stuhl - wer auf R4 C2 sitzt, teilt die Toilette höchstens mit Cynthia. Brenda und der sitzende Mann in Elsas Bereich brauchen also einen Stuhl im Foyer und R7 C6 im Café. Im Foyer könnte nur George sitzen, auf R7 C3 - dieselbe Reihe wie R7 C6. Also sitzt Dylan neben dem Tisch auf R7 C6, und Brenda sitzt im Foyer auf R8 C3.",
      place: { D: { row: 6, col: 5 }, B: { row: 7, col: 2 } },
    },
    {
      text: "Brenda war allein mit einem Mann im Foyer. Hugh war nicht im Foyer, also ist es George. Alysson war genau eine Spalte westlich von ihm, und C3 ist durch Brenda gesperrt - George ist in C5. Dort ist nur R6 C5 neben der Statue frei.",
      place: { G: { row: 5, col: 4 } },
    },
    {
      text: "Elsa muss zu Dylan ins Café: frei ist dort nur noch R5 C7. Alysson ist in C4, nicht im Foyer, also auf R2 C4.",
      place: { E: { row: 4, col: 6 }, A: { row: 1, col: 3 } },
    },
    {
      text: "In C9 ist nur noch R4 C9 frei. Dort ist weder eine Statue noch Schutt daneben, und es liegt nicht in C1 - das kann nur V sein.",
      place: { V: { row: 3, col: 8 } },
    },
    {
      text: "Hugh braucht Schutt neben sich: übrig bleibt nur R1 C8. Freya kommt damit nur noch auf R9 C2 neben die Statue, und Cynthia auf R3 C1. V war allein mit H in der Hauptgalerie, Hugh ist der Mörder!",
      place: {
        H: { row: 0, col: 7 },
        F: { row: 8, col: 1 },
        C: { row: 2, col: 0 },
      },
    },
  ],
  solution: {
    A: { row: 1, col: 3 },
    B: { row: 7, col: 2 },
    C: { row: 2, col: 0 },
    D: { row: 6, col: 5 },
    E: { row: 4, col: 6 },
    F: { row: 8, col: 1 },
    G: { row: 5, col: 4 },
    H: { row: 0, col: 7 },
    V: { row: 3, col: 8 },
  },
};
