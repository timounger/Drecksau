/**
 * Valentine's Day: a dining room, a living room, a bathroom, a study, a
 * kitchen, a guest room and a bedroom, with a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/35. Valentinstag.png`, no
 * solution sheet), with the culprit pencilled in on the photographed page.
 * Osmond is the victim; whoever was alone with him killed him.
 *
 * The armchairs are the chairs; they and the beds can be stood on. Tables
 * (the kitchen counter among them), shelves, plants and the TV
 * cannot.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  about,
  alone,
  all,
  beside,
  column,
  counting,
  inArea,
  on,
  row,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** Whether nobody but the suspect stands beside a shelf. */
function onlyOneBesideShelf(c: Context): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return id === c.self || there === undefined || !c.beside(there, "shelf");
  });
}

/** Whether the living room held Bastian, Harald and one woman, nobody else. */
function withHaraldAndAWoman(c: Context): boolean {
  const there = c.peopleIn("W");
  return (
    there.length === 3 &&
    there.includes("H") &&
    there.filter((id) => c.has(id, "woman")).length === 1
  );
}

/** Whether the suspect shared the room with one man only, both on chairs. */
function aloneWithASeatedMan(c: Context): boolean {
  const there = c.peopleIn(c.areaOf(c.cell) ?? "");
  const other = there.find((id) => id !== c.self);
  const otherCell = other === undefined ? undefined : c.cellOf(other);
  return (
    there.length === 2 &&
    other !== undefined &&
    c.has(other, "man") &&
    otherCell !== undefined &&
    c.is(otherCell, "chair")
  );
}

/** Whether a woman stood one column west and two rows north of the suspect. */
function womanNorthWest(c: Context): boolean {
  const there = c.personAt({ row: c.cell.row - 2, col: c.cell.col - 1 });
  return there !== null && c.has(there, "woman");
}

/**
 * For the solver only: whether a partial placement can still be completed -
 * the rooms' head counts and the shelves, checked as people are placed.
 */
function stillPossible(c: Context): boolean {
  const placed = c.people().flatMap((id) => {
    const cell = c.cellOf(id);
    return cell === undefined ? [] : [{ id, area: c.areaOf(cell), cell }];
  });
  const company = (id: string): readonly string[] => {
    const own = placed.find((one) => one.id === id);
    return own === undefined
      ? []
      : placed
          .filter((one) => one.id !== id && one.area === own.area)
          .map((one) => one.id);
  };
  const living = placed.filter((one) => one.area === "W").map((one) => one.id);
  const harald = c.cellOf("H");
  const northWest =
    harald === undefined
      ? undefined
      : { row: harald.row - 2, col: harald.col - 1 };
  const there = northWest === undefined ? null : c.personAt(northWest);
  return (
    company("G").length === 0 &&
    company("O").length <= 1 &&
    company("C").length <= 1 &&
    company("C").every((id) => {
      const cell = c.cellOf(id);
      return c.has(id, "man") && cell !== undefined && c.is(cell, "chair");
    }) &&
    living.length <= 3 &&
    living.filter((id) => c.has(id, "woman")).length <= 1 &&
    living.every((id) => id === "B" || id === "H" || c.has(id, "woman")) &&
    placed.every((one) => one.id === "A" || !c.beside(one.cell, "shelf")) &&
    (northWest === undefined ||
      (c.inside(northWest) &&
        c.standable(northWest) &&
        (there === null || c.has(there, "woman"))))
  );
}

/** The case. */
export const VALENTINES_DAY: Level = {
  id: "valentines-day",
  name: "Valentinstag",
  series: { book: "original", number: 35 },
  story:
    "Liebe bis der Tod sie scheidet? Sieht aus, als hätte jemand beschlossen, den Prozess zu beschleunigen.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "E",
      name: "Esszimmer",
      at: "im Esszimmer",
      ground: "floor",
      tint: "#f3dcd2",
      label: { row: 4, col: 0 },
    },
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "stone",
      tint: "#f2d4d4",
      label: { row: 2, col: 5 },
    },
    {
      key: "B",
      name: "Badezimmer",
      at: "im Badezimmer",
      ground: "stone",
      tint: "#f4eeee",
      label: { row: 4, col: 2 },
    },
    {
      key: "A",
      name: "Arbeitszimmer",
      at: "im Arbeitszimmer",
      ground: "stone",
      tint: "#f2cfc0",
      label: { row: 6, col: 4 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "stone",
      tint: "#f3e0e0",
      label: { row: 6, col: 1 },
    },
    {
      key: "G",
      name: "Gästezimmer",
      at: "im Gästezimmer",
      ground: "floor",
      tint: "#f0d8d0",
      label: { row: 8, col: 2 },
    },
    {
      key: "S",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "floor",
      tint: "#f2e2d6",
      label: { row: 8, col: 5 },
    },
  ],
  areaMap: [
    "EEEWWWWWW",
    "EEEWWWWWW",
    "EEEWWWWWW",
    "EEBBAAAWW",
    "EEBBAAAWW",
    "KKKKAAAWW",
    "KKKKAAASS",
    "GGGGGSSSS",
    "GGGGGSSSS",
  ],
  thingMap: [
    ".spcttm..",
    "ct...c...",
    "ctc.p...s",
    ".c.cc....",
    "p...t.s..",
    "ttt...s..",
    "....c...b",
    "bb..c...b",
    "pc..s..ps",
  ],
  things: {
    b: "bed",
    c: "chair",
    m: "tv",
    p: "plant",
    s: "shelf",
    t: "table",
  },
  pieces: [
    { at: { row: 0, col: 4 }, rows: 1, cols: 2 },
    { at: { row: 1, col: 1 }, rows: 2, cols: 1 },
    { at: { row: 5, col: 0 }, rows: 1, cols: 3 },
    { at: { row: 7, col: 0 }, rows: 1, cols: 2 },
    { at: { row: 6, col: 8 }, rows: 2, cols: 1 },
  ],
  suspects: [
    {
      id: "A",
      name: "Aaliyah",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person neben einem Regal.",
        ...all(beside("shelf"), counting(onlyOneBesideShelf)),
      },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Bastian",
      pronoun: "er",
      clue: {
        text: "Er war im Wohnzimmer mit Harald und einer Frau.",
        ...all(inArea("W"), counting(withHaraldAndAWoman)),
      },
      colour: "#15803d",
      face: "\u{1F468}‍\u{1F9B3}",
    },
    {
      id: "C",
      name: "Carly",
      pronoun: "sie",
      clue: {
        text: "Sie war allein mit einem Mann. Beide saßen auf einem Stuhl.",
        ...all(on("chair"), counting(aloneWithASeatedMan)),
      },
      colour: "#0e7490",
      face: "\u{1F475}",
    },
    {
      id: "D",
      name: "Dave",
      pronoun: "er",
      clue: { text: "Er war in der vierten Zeile.", ...row(4) },
      colour: "#6366f1",
      face: "\u{1F468}",
    },
    {
      id: "E",
      name: "Eli",
      pronoun: "er",
      clue: { text: "Er war in der dritten Spalte.", ...column(3) },
      colour: "#7c3aed",
      face: "\u{1F468}‍\u{1F9B0}",
    },
    {
      id: "F",
      name: "Felicity",
      pronoun: "sie",
      clue: { text: "Sie war neben einer Pflanze.", ...beside("plant") },
      colour: "#9f1239",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "G",
      name: "Gabriella",
      pronoun: "sie",
      clue: { text: "Sie war allein.", ...alone() },
      colour: "#ea580c",
      face: "\u{1F469}",
    },
    {
      id: "H",
      name: "Harald",
      pronoun: "er",
      clue: {
        text: "Eine Frau war in dem Feld, das eine Spalte westlich und zwei Zeilen nördlich von ihm lag.",
        ...about(["A", "C", "F", "G"], womanNorthWest),
      },
      colour: "#4338ca",
      face: "\u{1F468}",
    },
    {
      id: "O",
      name: "Osmond",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F468}",
    },
  ],
  prune: stillPossible,
  hints: [
    {
      text: "Harald war mit Bastian im Wohnzimmer, und eine Frau stand eine Spalte westlich und zwei Reihen nördlich von ihm. Stünde er in R3, läge dort in R1 eine Pflanze, ein Tisch oder der Fernseher (R3 C5 ist selbst eine Pflanze, R3 C9 ein Regal) - Harald war in R4 bis R6, in C8 oder C9. Die Frau stand also in R2 bis R4, in C7 oder C8. R4 gehört Dave, R2 und R3 liegen im Wohnzimmer, und dort war nur eine Frau. Carly war allein mit einem Mann, Gabriella ganz allein - beide nicht dort. Felicity war neben einer Pflanze - keines dieser Felder. Es bleibt Aaliyah, die neben einem Regal stand: nur R3 C8. Harald stand in R5 C9.",
      place: { A: { row: 2, col: 7 }, H: { row: 4, col: 8 } },
    },
    {
      text: "Im Wohnzimmer waren nur Bastian, Harald und Aaliyah. Wer stand in R1? R1 C1 liegt neben einem Regal - dort hätte nur Aaliyah sein dürfen. R1 C2 ist ein Regal, R1 C3 eine Pflanze, R1 C5 und R1 C6 sind Tische, R1 C7 ist der Fernseher, C8 und C9 sind besetzt. Bleibt der Stuhl in R1 C4 im Wohnzimmer: Dort saß Bastian.",
      place: { B: { row: 0, col: 3 } },
    },
    {
      text: "Carly saß auf einem Stuhl, allein mit einem sitzenden Mann, also nicht im Wohnzimmer. R3 und R5 sind besetzt, R4 gehört Dave, R8 C5 liegt neben einem Regal. Ihr bleiben R2 C1, R7 C5 und R9 C2. In R9 C2 gäbe es keinen freien zweiten Stuhl, in R7 C5 nur R4 C6 für Dave - dann bliebe R6 leer (Tische, ein Regal, ein Feld neben einem Regal, besetzte Spalten). Also saß Carly in R2 C1 und Dave in R4 C2.",
      place: { C: { row: 1, col: 0 }, D: { row: 3, col: 1 } },
    },
    {
      text: "Felicity war neben einer Pflanze. Frei sind nur noch R6 bis R9 in C3, C5, C6 und C7 - neben einer Pflanze liegt davon nur R9 C7. Felicity war in R9 C7.",
      place: { F: { row: 8, col: 6 } },
    },
    {
      text: "In R6 ist R6 C3 ein Tisch, R6 C6 liegt neben einem Regal und R6 C7 ist eines - frei ist nur R6 C5 im Arbeitszimmer. Eli war in C3, in R7 oder R8. Stünde er in R8, wären R6 C5 und R7 C6 beide im Arbeitszimmer besetzt - Gabriella wäre nicht allein. Also war Eli in R7 C3, und Gabriella und Osmond teilen R6 C5 und R8 C6. Im Schlafzimmer ist Felicity - Gabriella war allein in R6 C5, Osmond in R8 C6 allein mit Felicity. Felicity ist die Mörderin!",
      place: {
        E: { row: 6, col: 2 },
        G: { row: 5, col: 4 },
        O: { row: 7, col: 5 },
      },
    },
  ],
  solution: {
    A: { row: 2, col: 7 },
    B: { row: 0, col: 3 },
    C: { row: 1, col: 0 },
    D: { row: 3, col: 1 },
    E: { row: 6, col: 2 },
    F: { row: 8, col: 6 },
    G: { row: 5, col: 4 },
    H: { row: 4, col: 8 },
    O: { row: 7, col: 5 },
  },
};
