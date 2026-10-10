/**
 * The Courtroom: a court in session, and a murdered witness of the trial.
 *
 * @module
 * @remarks
 * After the free sample case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Easy/TheCourtroom.png`, solution beside it).
 * Vanessa is the victim; whoever was alone with her killed her. Carpets are
 * ground, not things: the clue "on a carpet" asks for the ground map.
 */

import {
  all,
  beside,
  counting,
  inArea,
  not,
  on,
  onGround,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** Whether the only person sitting in a chair stands in the suspect's area - and is somebody else. */
function withTheOnlySitter(c: Context): boolean {
  const sitters = c.people().filter((id) => {
    const there = c.cellOf(id);
    return there !== undefined && c.is(there, "chair");
  });
  const sitter = sitters.length === 1 ? sitters[0] : undefined;
  const there = sitter === undefined ? undefined : c.cellOf(sitter);
  return (
    sitter !== undefined &&
    sitter !== c.self &&
    there !== undefined &&
    c.areaOf(there) === c.areaOf(c.cell)
  );
}

/** The case. */
export const THE_COURTROOM: Level = {
  id: "the-courtroom",
  name: "Der Gerichtssaal",
  difficulty: "easy",
  story:
    "Vanessa wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "O",
      name: "Richterzimmer",
      at: "im Richterzimmer",
      ground: "floor",
      tint: "#ece4d6",
      label: { row: 1, col: 0 },
    },
    {
      key: "J",
      name: "Richterbank",
      at: "an der Richterbank",
      ground: "floor",
      tint: "#e4e0dc",
      label: { row: 2, col: 3 },
    },
    {
      key: "S",
      name: "Sicherheitsbereich",
      at: "im Sicherheitsbereich",
      ground: "floor",
      tint: "#b8acc0",
      label: { row: 1, col: 7 },
    },
    {
      key: "P",
      name: "Anklage",
      at: "bei der Anklage",
      ground: "floor",
      tint: "#e8e2d8",
      label: { row: 6, col: 1 },
    },
    {
      key: "K",
      name: "Protokollführertisch",
      at: "am Protokollführertisch",
      ground: "floor",
      tint: "#e2ddd6",
      label: { row: 4, col: 3 },
    },
    {
      key: "W",
      name: "Zeugenstand",
      at: "im Zeugenstand",
      ground: "floor",
      tint: "#e6e0da",
      label: { row: 6, col: 3 },
    },
    {
      key: "D",
      name: "Verteidigung",
      at: "bei der Verteidigung",
      ground: "floor",
      tint: "#e8e2d8",
      label: { row: 5, col: 7 },
    },
    {
      key: "G",
      name: "Zuschauerraum",
      at: "im Zuschauerraum",
      ground: "floor",
      tint: "#f0ead8",
      label: { row: 8, col: 0 },
    },
    {
      key: "Y",
      name: "Geschworenenbank",
      at: "auf der Geschworenenbank",
      ground: "floor",
      tint: "#f2e6cc",
      label: { row: 8, col: 7 },
    },
  ],
  areaMap: [
    "OOOOOSSSS",
    "OOOJJJSSS",
    "PPPJJJDDD",
    "PPPKKKDDD",
    "PPPKKKDDD",
    "PPPWWWDDD",
    "GPPWWWDYY",
    "GGGGGGGYY",
    "GGGGGGGYY",
  ],
  groundMap: [
    "fffffffff",
    "ffffffccf",
    "fffffffff",
    "fffffffff",
    "fffffffff",
    "fcfffffff",
    "fcfcccfff",
    "ffffcffff",
    "ffffcffff",
  ],
  grounds: { f: "floor", c: "carpet" },
  thingMap: [
    "scsp..vtv",
    "tt..c....",
    "p..ttt...",
    ".ctc..tc.",
    ".cttt.t..",
    "..t.t.tc.",
    "t.t...ttt",
    "tc.c.c.tc",
    "..cc.cttc",
  ],
  things: {
    s: "shelf",
    c: "chair",
    p: "plant",
    v: "tv",
    t: "table",
  },
  suspects: [
    {
      id: "A",
      name: "Arthur",
      pronoun: "er",
      traits: ["glasses"],
      clue: { text: "Er war an der Richterbank.", ...inArea("J") },
      colour: "#b91c1c",
      face: "\u{1F474}",
    },
    {
      id: "B",
      name: "Benjamin",
      pronoun: "er",
      traits: ["glasses"],
      clue: {
        text: "Er war bei der einzigen Person, die auf einem Stuhl saß.",
        ...all(not(on("chair")), counting(withTheOnlySitter)),
      },
      colour: "#15803d",
      face: "\u{1F9D1}",
    },
    {
      id: "C",
      name: "Camila",
      pronoun: "sie",
      clue: { text: "Sie war im Zuschauerraum.", ...inArea("G") },
      colour: "#0e7490",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Daisy",
      pronoun: "sie",
      traits: ["glasses"],
      clue: { text: "Sie war auf einem Teppich.", ...onGround("carpet") },
      colour: "#6366f1",
      face: "\u{1F475}",
    },
    {
      id: "E",
      name: "Eliza",
      pronoun: "sie",
      clue: { text: "Sie war im Zeugenstand.", ...inArea("W") },
      colour: "#7c3aed",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "F",
      name: "Fritz",
      pronoun: "er",
      clue: { text: "Er war neben einem Tisch.", ...beside("table") },
      colour: "#9f1239",
      face: "\u{1F468}",
    },
    {
      id: "G",
      name: "Graham",
      pronoun: "er",
      clue: { text: "Er war im Sicherheitsbereich.", ...inArea("S") },
      colour: "#ea580c",
      face: "\u{1F9D4}",
    },
    {
      id: "H",
      name: "Howard",
      pronoun: "er",
      clue: { text: "Er war neben einer Pflanze.", ...beside("plant") },
      colour: "#4338ca",
      face: "\u{1F468}‍\u{1F9B3}",
    },
    {
      id: "V",
      name: "Vanessa",
      pronoun: "sie",
      traits: ["glasses"],
      clue: { text: "Sie war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F469}",
    },
  ],
  hints: [
    {
      text: "Arthur muss an der Richterbank sein, wegen Benjamins Hinweis aber nicht auf dem Stuhl. Er steht also in Reihe 2 - streiche den Rest von Reihe 2. Damit bleibt für Graham nur noch das letzte Feld im Sicherheitsbereich.",
      place: { G: { row: 0, col: 5 } },
    },
    {
      text: "Damit bleibt für Arthur nur noch ein Feld.",
      place: { A: { row: 1, col: 3 } },
    },
    {
      text: "Damit bleibt für Eliza nur noch das letzte Feld im Zeugenstand.",
      place: { E: { row: 6, col: 4 } },
    },
    {
      text: "Damit bleibt für Daisy nur noch das letzte Teppichfeld.",
      place: { D: { row: 5, col: 1 } },
    },
    {
      text: "Damit bleibt für Howard nur noch das letzte Feld neben einer Pflanze.",
      place: { H: { row: 3, col: 0 } },
    },
    {
      text: "Die Geschworenenbank hat nur eine Spalte. Benjamin und die sitzende Person können nur im Zuschauerraum sein. Camila ist im Zuschauerraum, also muss sie die Person bei Benjamin sein. Damit bleibt für Camila nur der Stuhl in Reihe 9, Spalte 3.",
      place: { C: { row: 8, col: 2 } },
    },
    {
      text: "Damit bleibt für Benjamin nur noch ein Feld.",
      place: { B: { row: 7, col: 6 } },
    },
    {
      text: "Damit bleibt für Fritz nur noch das letzte Feld neben einem Tisch.",
      place: { F: { row: 4, col: 7 } },
    },
    {
      text: "Für Vanessa bleibt das letzte Feld, allein mit Fritz. Fritz ist der Mörder!",
      place: { V: { row: 2, col: 8 } },
    },
  ],
  solution: {
    A: { row: 1, col: 3 },
    B: { row: 7, col: 6 },
    C: { row: 8, col: 2 },
    D: { row: 5, col: 1 },
    E: { row: 6, col: 4 },
    F: { row: 4, col: 7 },
    G: { row: 0, col: 5 },
    H: { row: 3, col: 0 },
    V: { row: 2, col: 8 },
  },
};
