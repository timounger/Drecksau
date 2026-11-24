/**
 * Das Fußballspiel: a stadium in São Paulo with a north and a south stand, the
 * two halves of the pitch, both goals and the car park - and a murdered fan.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 3 - Auf Weltreise/27. Das Fußballspiel.webp`,
 * no solution sheet - the solver proves the solution is the only one).
 * Odair is the victim; whoever was alone with him killed him.
 *
 * The map is ten by ten. The street lamps (the legend's thing) and the bins
 * cannot be stood on, as the empty grid on the page greys them out; the
 * seats, the cars and the mud puddles can. **The ball is a piece of its
 * own**: like every figure it takes a row and a column, but it is no person
 * ({@link Suspect.object}) - it keeps nobody company and is not the culprit.
 */
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
import type { Context, Level } from "../engine/types";

/** The ball's id. */
const BALL = "B";

/** Whether nobody but the suspect stood in a mud puddle. */
function onlyOneInMud(c: Context): boolean {
  return c
    .people()
    .filter((id) => id !== c.self)
    .every((id) => {
      const there = c.cellOf(id);
      return there === undefined || !c.is(there, "mud");
    });
}

/** Whether somebody else in the suspect's area stood beside a street lamp. */
function withSomebodyByALamp(c: Context): boolean {
  return c
    .peopleIn(c.areaOf(c.cell) ?? "")
    .filter((id) => id !== c.self)
    .some((id) => {
      const there = c.cellOf(id);
      return there !== undefined && c.beside(there, "streetLamp");
    });
}

/** The case. */
export const THE_FOOTBALL_MATCH: Level = {
  id: "the-football-match",
  name: "Das Fußballspiel",
  series: { book: "worldTravel", number: 27 },
  story:
    "Wer auch immer dafür verantwortlich ist, kann mit viel mehr als einer roten Karte rechnen.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "N",
      name: "Nordtribüne",
      at: "auf der Nordtribüne",
      ground: "stone",
      tint: "#7fb3b8",
      label: { row: 1, col: 4 },
    },
    {
      key: "W",
      name: "Westhälfte",
      at: "in der Westhälfte",
      ground: "grass",
      tint: "#b8d8c0",
      label: { row: 6, col: 2 },
    },
    {
      key: "E",
      name: "Osthälfte",
      at: "in der Osthälfte",
      ground: "grass",
      tint: "#b3d4bc",
      label: { row: 6, col: 7 },
    },
    {
      key: "X",
      name: "Westtor",
      at: "im Westtor",
      ground: "grass",
      tint: "#d4e8da",
      label: { row: 5, col: 0 },
    },
    {
      key: "Y",
      name: "Osttor",
      at: "im Osttor",
      ground: "grass",
      tint: "#d4e8da",
      label: { row: 5, col: 8 },
    },
    {
      key: "S",
      name: "Südtribüne",
      at: "auf der Südtribüne",
      ground: "stone",
      tint: "#79acb2",
      label: { row: 9, col: 6 },
    },
    {
      key: "P",
      name: "Parkplatz",
      at: "auf dem Parkplatz",
      ground: "stone",
      tint: "#b3c6da",
      label: { row: 9, col: 3 },
    },
  ],
  areaMap: [
    "NNNNNNNNNN",
    "NNNNNNNNNN",
    "WWWWWEEEEE",
    "XXWWWEEEYY",
    "XXWWWEEEYY",
    "XXWWWEEEYY",
    "WWWWWEEEEE",
    "SSSSSSSSSS",
    "PPPPPSSSSS",
    "PPPPPSSSSS",
  ],
  thingMap: [
    "l.ccl.cl..",
    "c.cccccbc.",
    "..mm......",
    "m.........",
    ".....m.m.m",
    "...m......",
    "..........",
    "..cc.cc.cb",
    "...aa..c.l",
    "aa......cc",
  ],
  things: {
    a: "car",
    b: "bin",
    c: "chair",
    l: "streetLamp",
    m: "mud",
  },
  extraThings: {
    bin: { name: "Mülleimer", emoji: "\u{1F5D1}\u{FE0F}", standable: false },
    streetLamp: { name: "Laterne", emoji: "\u{1F3EE}", standable: false },
  },
  pieces: [
    { at: { row: 8, col: 3 }, rows: 1, cols: 2 },
    { at: { row: 9, col: 0 }, rows: 1, cols: 2 },
  ],
  suspects: [
    {
      id: "A",
      name: "Alice",
      pronoun: "sie",
      clue: { text: "Sie war in einem Auto.", ...on("car") },
      colour: "#ca8a04",
      face: "\u{1F64B}\u{1F3FD}\u{200D}\u{2640}\u{FE0F}",
    },
    {
      id: BALL,
      name: "Der Ball",
      pronoun: "er",
      object: true,
      clue: {
        text: "Er war in der Osthälfte. Wie jede Figur belegt der Ball eine eigene Zeile und Spalte. Er ist nicht der Mörder. Er ist nur ein Ball.",
        ...inArea("E"),
      },
      colour: "#334155",
      face: "\u{26BD}",
    },
    {
      id: "C",
      name: "Catarina",
      pronoun: "sie",
      clue: {
        text: "Sie war genau zwei Spalten westlich des Balls.",
        ...about([BALL], (c) => {
          const ball = c.cellOf(BALL);
          return ball !== undefined && c.cell.col === ball.col - 2;
        }),
      },
      colour: "#15803d",
      face: "\u{1F469}\u{1F3FC}",
    },
    {
      id: "D",
      name: "Diogo",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person in einer Schlammpfütze.",
        ...all(on("mud"), counting(onlyOneInMud)),
      },
      colour: "#6d28d9",
      face: "\u{1F468}\u{1F3FD}\u{200D}\u{1F9B1}",
    },
    {
      id: "E",
      name: "Eduardo",
      pronoun: "er",
      clue: {
        text: "Er war allein in der Westhälfte.",
        ...all(inArea("W"), alone()),
      },
      colour: "#eab308",
      face: "\u{1F468}\u{1F3FC}\u{200D}\u{1F9B2}",
    },
    {
      id: "F",
      name: "Frederico",
      pronoun: "er",
      clue: {
        text: "Er war neben einem Mülleimer.",
        ...own((c) => c.beside(c.cell, "bin")),
      },
      colour: "#4338ca",
      face: "\u{1F9D4}\u{1F3FF}",
    },
    {
      id: "G",
      name: "Guilherme",
      pronoun: "er",
      clue: {
        text: "Er war allein im Westtor.",
        ...all(inArea("X"), alone()),
      },
      colour: "#a16207",
      face: "\u{1F9D4}\u{1F3FD}",
    },
    {
      id: "H",
      name: "Heloísa",
      pronoun: "sie",
      clue: {
        text: "Sie war auf der Nordtribüne und saß nicht auf einem Stuhl. Sie war mit jemandem zusammen, der neben einer Laterne war.",
        ...all(
          inArea("N"),
          own((c) => !c.is(c.cell, "chair")),
          counting(withSomebodyByALamp),
        ),
      },
      colour: "#0f766e",
      face: "\u{1F469}\u{1F3FD}",
    },
    {
      id: "I",
      name: "Ismael",
      pronoun: "er",
      clue: {
        text: "Er war im Osttor. Er war genau eine Zeile nördlich des Balls.",
        ...all(
          inArea("Y"),
          about([BALL], (c) => {
            const ball = c.cellOf(BALL);
            return ball !== undefined && c.cell.row === ball.row - 1;
          }),
        ),
      },
      colour: "#1d4ed8",
      face: "\u{1F468}\u{1F3FE}",
    },
    {
      id: "O",
      name: "Odair",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#b91c1c",
      face: "\u{1F9D4}\u{1F3FB}",
    },
  ],
  hints: [
    {
      text: "Das Spielfeld hat fünf Zeilen (3 bis 7), und fünf Figuren müssen darauf: der Ball, Eduardo, Guilherme, Ismael - und Diogo, denn alle Pfützen liegen auf dem Feld. In der Westhälfte und im Westtor sind Eduardo und Guilherme allein, also steht Diogo in einer der Pfützen in Zeile 5. Alle anderen stehen neben dem Spielfeld.",
    },
    {
      text: "Ismael steht im Osttor eine Zeile nördlich des Balls. Zeile 5 gehört Diogo, also steht Ismael in Zeile 6 und der Ball in Zeile 7. Guilherme bleibt im Westtor nur Zeile 4 - und die Pfütze dort gehört nicht ihm: R4 C2.",
      place: { G: { row: 3, col: 1 } },
    },
    {
      text: "Auf der Nordtribüne ist Heloísa mit genau einer Person, die neben einer Laterne steht. Frederico stünde dort neben dem Mülleimer in R2 C7 oder R2 C9 - neben keiner Laterne. Er steht also auf der Südtribüne: R8 C9. Ismael damit in R6 C10.",
      place: { F: { row: 7, col: 8 }, I: { row: 5, col: 9 } },
    },
    {
      text: "Heloísa sitzt nicht auf einem Stuhl. In freien Spalten bleibt ihr nur R1 C6. Diogo steht damit in R5 C8, der Ball in R7 C7 - und Catarina zwei Spalten westlich davon in Spalte 5.",
      place: {
        H: { row: 0, col: 5 },
        D: { row: 4, col: 7 },
        B: { row: 6, col: 6 },
      },
    },
    {
      text: "Eduardo steht allein in der Westhälfte in Zeile 3, ohne Pfütze und nicht in Catarinas Spalte 5: R3 C1. Alice war in einem Auto - in den freien Spalten bleibt nur R9 C4.",
      place: { E: { row: 2, col: 0 }, A: { row: 8, col: 3 } },
    },
    {
      text: "Heloísas Begleitung auf der Nordtribüne steht neben einer Laterne in Zeile 2: Das ist Catarina in R2 C5. Für Odair bleibt R10 C3 auf dem Parkplatz - allein mit Alice. Alice ist die Mörderin!",
      place: { C: { row: 1, col: 4 }, O: { row: 9, col: 2 } },
    },
  ],
  solution: {
    A: { row: 8, col: 3 },
    B: { row: 6, col: 6 },
    C: { row: 1, col: 4 },
    D: { row: 4, col: 7 },
    E: { row: 2, col: 0 },
    F: { row: 7, col: 8 },
    G: { row: 3, col: 1 },
    H: { row: 0, col: 5 },
    I: { row: 5, col: 9 },
    O: { row: 9, col: 2 },
  },
};
