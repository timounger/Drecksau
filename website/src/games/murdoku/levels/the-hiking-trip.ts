/**
 * The Hiking Trip: a mountain with its summit, trails, woods, a grove, a lake
 * and a ranger's hut.
 *
 * @module
 * @remarks
 * After the Murdoku case by Manuel Garand
 * (`game_instructions/Murdoku/Hard/TheHikingTrip.png`, solution beside it).
 * The map has an irregular outline; the fields beside the summit are off it.
 * Caps and glasses come from the portraits.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data:
   rows, columns and counts straight off the printed page. */
import {
  about,
  all,
  alone,
  beside,
  counting,
  inArea,
  on,
  own,
  row,
  victim,
} from "../engine/clues";
import type { Cell, Context, Level } from "../engine/types";

/** Whether everybody in an area has a trait. */
function allThere(c: Context, area: string, trait: string): boolean {
  return c.peopleIn(area).every((id) => c.has(id, trait));
}

/** The case. */
export const THE_HIKING_TRIP: Level = {
  id: "the-hiking-trip",
  name: "Die Wanderung",
  difficulty: "hard",
  story:
    "Vincenza wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "S",
      name: "Gipfel",
      at: "auf dem Gipfel",
      ground: "stone",
      tint: "#dde6ef",
      label: { row: 1, col: 5 },
    },
    {
      key: "R",
      name: "Rangerhütte",
      at: "in der Rangerhütte",
      ground: "floor",
      tint: "#d8b4c8",
      label: { row: 2, col: 10 },
    },
    {
      key: "P",
      name: "Kiefernwald",
      at: "im Kiefernwald",
      ground: "grass",
      tint: "#8fbf9a",
      label: { row: 4, col: 2 },
    },
    {
      key: "W",
      name: "Windiger Pfad",
      at: "auf dem Windigen Pfad",
      ground: "path",
      tint: "#e3cbb4",
      label: { row: 13, col: 0 },
    },
    {
      key: "B",
      name: "Bärenwald",
      at: "im Bärenwald",
      ground: "grass",
      tint: "#9cc9a5",
      label: { row: 10, col: 3 },
    },
    {
      key: "T",
      name: "Felsenpfad",
      at: "auf dem Felsenpfad",
      ground: "stone",
      tint: "#b8c0dc",
      label: { row: 13, col: 6 },
    },
    {
      key: "G",
      name: "Hain",
      at: "im Hain",
      ground: "grass",
      tint: "#a6d1ae",
      label: { row: 6, col: 10 },
    },
    {
      key: "O",
      name: "Imbissstand",
      at: "am Imbissstand",
      ground: "floor",
      tint: "#ead9c6",
      label: { row: 13, col: 3 },
    },
    {
      key: "L",
      name: "See",
      at: "im See",
      ground: "water",
      label: { row: 13, col: 10 },
    },
  ],
  areaMap: [
    "....SSSSSS..",
    "..SSSSSSSSRR",
    "..SSSWWWTTRR",
    "PPPSSWBBBTGG",
    "PPPPPWBBBTGG",
    "PPPWWWBBBTGG",
    "PPWWBBBBBTGG",
    "PPWBBBBBBTTG",
    "PWWBBBBBBBTG",
    "PWBBBBBBBBTL",
    "PWBBBBBBBTTL",
    "PWOOOOBBTTLL",
    "WWOOOOBBTLLL",
    "WWOOOOTTTLLL",
  ],
  thingMap: [
    ".....o.o....",
    "..o......b.c",
    "....o.......",
    ".t....sbt...",
    "..........s.",
    "t.s...tst...",
    "s.......s.ss",
    "st..s..tb..o",
    "t....t..ts.s",
    "..ttb...o...",
    "t.t...ts....",
    "..c..d......",
    "..dd..t....o",
    "d....c......",
  ],
  things: {
    o: "boulder",
    b: "bear",
    c: "chair",
    t: "tree",
    s: "shrub",
    d: "table",
  },
  suspects: [
    {
      id: "A",
      name: "Aubrey",
      pronoun: "sie",
      traits: ["cap"],
      clue: {
        text: "Sie war auf dem Windigen Pfad, alle dort trugen eine Kappe.",
        ...all(
          inArea("W"),
          counting((c) => allThere(c, "W", "cap")),
        ),
      },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Brianna",
      pronoun: "sie",
      traits: ["cap"],
      clue: {
        text: "Sie war genau zwei Reihen nördlich von Finlay.",
        ...about(["F"], (c) => (c.cellOf("F") as Cell).row - c.cell.row === 2),
      },
      colour: "#15803d",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "C",
      name: "Clark",
      pronoun: "er",
      traits: ["glasses"],
      clue: {
        text: "Er war auf dem Felsenpfad, alle dort trugen eine Brille.",
        ...all(
          inArea("T"),
          counting((c) => allThere(c, "T", "glasses")),
        ),
      },
      colour: "#0e7490",
      face: "\u{1F468}",
    },
    {
      id: "D",
      name: "Danika",
      pronoun: "sie",
      clue: {
        text: "Sie war allein im Kiefernwald.",
        ...all(inArea("P"), alone()),
      },
      colour: "#6366f1",
      face: "\u{1F475}",
    },
    {
      id: "E",
      name: "Elias",
      pronoun: "er",
      clue: { text: "Er war in der Rangerhütte.", ...inArea("R") },
      colour: "#7c3aed",
      face: "\u{1F9D4}",
    },
    {
      id: "F",
      name: "Finlay",
      pronoun: "er",
      traits: ["glasses"],
      clue: {
        text: "In seiner Spalte war ein Bär, genau 4 Reihen nördlich von ihm.",
        ...own((c) => c.is({ row: c.cell.row - 4, col: c.cell.col }, "bear")),
      },
      colour: "#9f1239",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "G",
      name: "Gavin",
      pronoun: "er",
      clue: { text: "Er war neben einem Felsen.", ...beside("boulder") },
      colour: "#ea580c",
      face: "\u{1F468}",
    },
    {
      id: "H",
      name: "Hank",
      pronoun: "er",
      traits: ["cap"],
      clue: {
        text: "Er war in der untersten Reihe. In seinem Bereich waren mindestens 3 Personen.",
        ...all(
          row(14),
          counting((c) => c.peopleIn(c.areaOf(c.cell) ?? "").length >= 3),
        ),
      },
      colour: "#4338ca",
      face: "\u{1F474}",
    },
    {
      id: "I",
      name: "Iris",
      pronoun: "sie",
      clue: { text: "Sie saß auf einem Stuhl.", ...on("chair") },
      colour: "#0f766e",
      face: "\u{1F469}",
    },
    {
      id: "J",
      name: "Joe",
      pronoun: "er",
      traits: ["glasses"],
      clue: { text: "Er war neben einem Bären.", ...beside("bear") },
      colour: "#a16207",
      face: "\u{1F9D1}",
    },
    {
      id: "K",
      name: "Kobe",
      pronoun: "er",
      clue: { text: "Er war im Hain.", ...inArea("G") },
      colour: "#be185d",
      face: "\u{1F471}",
    },
    {
      id: "V",
      name: "Vincenza",
      pronoun: "sie",
      traits: ["cap", "glasses"],
      clue: { text: "Sie war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F469}‍\u{1F9B0}",
    },
  ],
  rules: [
    {
      text: "Es gibt zwei leere Reihen. In jeder leeren Reihe ist ein Bär.",
      check: (c: Context): boolean => {
        const taken = new Set(
          c.people().map((id) => (c.cellOf(id) as Cell).row),
        );
        const empty = Array.from({ length: c.rows }, (_, at) => at).filter(
          (at) => !taken.has(at),
        );
        return (
          empty.length === 2 &&
          empty.every((at) =>
            Array.from({ length: c.cols }, (_, col) => col).some((col) =>
              c.is({ row: at, col }, "bear"),
            ),
          )
        );
      },
    },
  ],
  hints: [
    {
      text: "Kobe ist im Hain, in Spalte 11 oder 12, und Elias in der Rangerhütte, ebenfalls in Spalte 11 oder 12. Sperre den Rest der Spalten 11 und 12. Iris kann nicht auf dem Stuhl in der untersten Reihe sitzen (dort steht schon Hank) - damit bleibt für Iris nur der letzte freie Stuhl.",
      place: { I: { row: 11, col: 2 } },
    },
    {
      text: "Jetzt gibt es nur noch einen Bären, vier Reihen über dem Finlay stehen kann: den Bären in Reihe 2, Spalte 10. Damit steht Finlay in Reihe 6 und Brianna zwei Reihen über ihm, in Reihe 4.",
    },
    {
      text: "Finlay kann nicht im Hain sein (Elias und Kobe belegen schon Spalte 11 und 12). Er kann auch nicht auf dem Windigen Pfad sein (dort bräuchte er eine Kappe, laut Aubreys Hinweis). Damit steht Finlay in Reihe 6, Spalte 10.",
      place: { F: { row: 5, col: 9 } },
    },
    {
      text: "Damit bleibt für Kobe nur das letzte freie Feld im Hain.",
      place: { K: { row: 4, col: 11 } },
    },
    {
      text: "Damit bleibt für Clark nur das letzte freie Feld auf dem Felsenpfad (Hank muss in Reihe 14 stehen).",
      place: { C: { row: 12, col: 8 } },
    },
    {
      text: "In Spalte 1 ist nur noch ein Feld frei - dort steht Danika.",
      place: { D: { row: 9, col: 0 } },
    },
    {
      text: "Hank trägt keine Brille und kann also nicht auf dem Felsenpfad sein (laut Clarks Hinweis). Damit steht Hank in Reihe 14, Spalte 2.",
      place: { H: { row: 13, col: 1 } },
    },
    {
      text: "Zwei Reihen enthalten eine Person und einen Bären: Reihe 4 und 10. Die beiden anderen Reihen mit Bären müssen laut der allgemeinen Regel leer sein (Reihe 2 und 8). Damit steht Elias fest.",
      place: { E: { row: 2, col: 10 } },
      cross: Array.from({ length: 12 }, (_, col) => [
        { row: 1, col },
        { row: 7, col },
      ]).flat(),
    },
    {
      text: "Damit bleibt für Aubrey das letzte Feld auf dem Windigen Pfad, und Gavin steht neben dem letzten Felsen.",
      place: { A: { row: 6, col: 3 }, G: { row: 0, col: 6 } },
    },
    {
      text: "Joe muss neben dem Bären in Spalte 5 stehen und Brianna in Spalte 6. Damit stehen Brianna, Vincenza und Joe fest. Vincenza war allein mit Joe im Bärenwald - Joe ist der Mörder!",
      place: {
        B: { row: 3, col: 5 },
        V: { row: 8, col: 7 },
        J: { row: 10, col: 4 },
      },
    },
  ],
  solution: {
    A: { row: 6, col: 3 },
    B: { row: 3, col: 5 },
    C: { row: 12, col: 8 },
    D: { row: 9, col: 0 },
    E: { row: 2, col: 10 },
    F: { row: 5, col: 9 },
    G: { row: 0, col: 6 },
    H: { row: 13, col: 1 },
    I: { row: 11, col: 2 },
    J: { row: 10, col: 4 },
    K: { row: 4, col: 11 },
    V: { row: 8, col: 7 },
  },
};
