/**
 * Doomscrolling: a flat with a dining room, a pantry, a bedroom, a kitchen, a
 * guest room, a bathroom and a living room - a screen in nearly every corner -
 * and a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Doomscrolling/Doomscrolling.png`, no
 * solution sheet - the solver proves the one solution, with the culprit
 * pencilled in on the photographed page).
 * Ortwin is the victim; whoever was alone with him killed him.
 *
 * The chairs and the beds can be stood on; the tables, shelves, TVs and plants
 * cannot.
 */
import { all, beside, counting, inArea, on, victim } from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** Whether nobody but the suspect sits on a chair. */
function onlyOneOnAChair(c: Context): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return id === c.self || there === undefined || !c.is(there, "chair");
  });
}

/** Whether the suspect's area held exactly the suspect and this other person. */
function aloneWith(id: string): (c: Context) => boolean {
  return (c: Context): boolean => {
    const there = c.peopleIn(c.areaOf(c.cell) ?? "");
    return there.length === 2 && there.includes(id);
  };
}

/** The case. */
export const DOOMSCROLLING: Level = {
  id: "doomscrolling",
  name: "Doomscrolling",
  series: { book: "original", number: 19 },
  story:
    "Das Opfer starb bei seiner Lieblingsbeschäftigung: auf einen Bildschirm starren. Ortwin wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "E",
      name: "Esszimmer",
      at: "im Esszimmer",
      ground: "floor",
      tint: "#c3d7ea",
      label: { row: 5, col: 0 },
    },
    {
      key: "S",
      name: "Speisekammer",
      at: "in der Speisekammer",
      ground: "stone",
      tint: "#c4e2ec",
      label: { row: 1, col: 3 },
    },
    {
      key: "L",
      name: "Schlafzimmer",
      at: "im Schlafzimmer",
      ground: "floor",
      tint: "#d9cdea",
      label: { row: 2, col: 5 },
    },
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "stone",
      tint: "#c7cdf0",
      label: { row: 5, col: 3 },
    },
    {
      key: "G",
      name: "Gästezimmer",
      at: "im Gästezimmer",
      ground: "stone",
      tint: "#bfe3dc",
      label: { row: 6, col: 5 },
    },
    {
      key: "B",
      name: "Badezimmer",
      at: "im Badezimmer",
      ground: "stone",
      tint: "#c6def0",
      label: { row: 8, col: 5 },
    },
    {
      key: "W",
      name: "Wohnzimmer",
      at: "im Wohnzimmer",
      ground: "floor",
      tint: "#c9dcea",
      label: { row: 8, col: 1 },
    },
  ],
  areaMap: [
    "EEESSLLLL",
    "EEESSLLLL",
    "EEEKKLLLL",
    "EEEKKKKLL",
    "EEEKKKKLL",
    "EEEKKGGLL",
    "WWWWWGGGG",
    "WWWWWBBGG",
    "WWWWWBBGG",
  ],
  thingMap: [
    "f..fsspb.",
    "stc.s..b.",
    "ct..f....",
    ".tc.tt..f",
    ".c...f...",
    "p.....t.f",
    "sftc....b",
    "......ctb",
    "pc.fsf..f",
  ],
  things: {
    b: "bed",
    c: "chair",
    f: "tv",
    p: "plant",
    s: "shelf",
    t: "table",
  },
  suspects: [
    {
      id: "A",
      name: "Arne",
      pronoun: "er",
      traits: ["glasses"],
      clue: {
        text: "Er war neben einem Fernseher und neben einem Regal.",
        ...all(beside("tv"), beside("shelf")),
      },
      colour: "#b91c1c",
      face: "\u{1F9D4}",
    },
    {
      id: "B",
      name: "Balthasar",
      pronoun: "er",
      traits: ["glasses"],
      clue: { text: "Er war neben einem Fernseher.", ...beside("tv") },
      colour: "#15803d",
      face: "\u{1F468}",
    },
    {
      id: "C",
      name: "Chanel",
      pronoun: "sie",
      clue: {
        text: "Sie war neben einem Fernseher und neben einem Stuhl.",
        ...all(beside("tv"), beside("chair")),
      },
      colour: "#0e7490",
      face: "\u{1F471}\u200D\u2640\uFE0F",
    },
    {
      id: "D",
      name: "Detlev",
      pronoun: "er",
      traits: ["glasses"],
      clue: { text: "Er war auf einem Bett.", ...on("bed") },
      colour: "#6366f1",
      face: "\u{1F9D4}",
    },
    {
      id: "E",
      name: "Eva",
      pronoun: "sie",
      traits: ["glasses"],
      clue: {
        text: "Sie war die einzige Person, die auf einem Stuhl saß.",
        ...all(on("chair"), counting(onlyOneOnAChair)),
      },
      colour: "#7c3aed",
      face: "\u{1F469}",
    },
    {
      id: "F",
      name: "Fatih",
      pronoun: "er",
      clue: {
        text: "Er war neben einem Fernseher und neben einem Tisch.",
        ...all(beside("tv"), beside("table")),
      },
      colour: "#9f1239",
      face: "\u{1F468}\u200D\u{1F9B3}",
    },
    {
      id: "G",
      name: "Gerald",
      pronoun: "er",
      clue: { text: "Er war neben einem Fernseher.", ...beside("tv") },
      colour: "#ea580c",
      face: "\u{1F468}",
    },
    {
      id: "H",
      name: "Helen",
      pronoun: "sie",
      traits: ["glasses"],
      clue: {
        text: "Sie war allein im Esszimmer mit Balthasar.",
        ...all(inArea("E"), counting(aloneWith("B"))),
      },
      colour: "#334155",
      face: "\u{1F469}",
    },
    {
      id: "O",
      name: "Ortwin",
      pronoun: "er",
      traits: ["glasses"],
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F468}",
    },
  ],
  hints: [
    {
      text: "Helen und Balthasar waren allein im Esszimmer, und Balthasar war neben einem Fernseher. Der einzige Fernseher im Esszimmer steht in R1 C1, in R2 C1 steht ein Regal - Balthasar war in R1 C2. Blockiere den Rest von R1 und C2.",
      place: { B: { row: 0, col: 1 } },
      cross: [
        { row: 0, col: 2 },
        { row: 0, col: 7 },
        { row: 0, col: 8 },
        { row: 4, col: 1 },
        { row: 5, col: 1 },
        { row: 7, col: 1 },
        { row: 8, col: 1 },
      ],
    },
    {
      text: "Arne war neben einem Fernseher und neben einem Regal. Ins Esszimmer darf niemand mehr; ein Feld neben beidem im selben Raum gibt es nur in der Speisekammer: R2 C4. Blockiere den Rest von R2 und C4.",
      place: { A: { row: 1, col: 3 } },
      cross: [
        { row: 1, col: 2 },
        { row: 1, col: 5 },
        { row: 1, col: 6 },
        { row: 1, col: 7 },
        { row: 1, col: 8 },
        { row: 2, col: 3 },
        { row: 3, col: 3 },
        { row: 4, col: 3 },
        { row: 5, col: 3 },
        { row: 6, col: 3 },
        { row: 7, col: 3 },
      ],
    },
    {
      text: "Eva saß als Einzige auf einem Stuhl. Die Stühle im Esszimmer sind tabu, R2 C3, R7 C4 und R9 C2 sind blockiert - Eva saß in R8 C7 im Badezimmer. Detlev war auf einem Bett: R1 C8, R2 C8 und R8 C9 sind blockiert, also R7 C9.",
      place: { E: { row: 7, col: 6 }, D: { row: 6, col: 8 } },
      cross: [
        { row: 7, col: 0 },
        { row: 7, col: 1 },
        { row: 7, col: 2 },
        { row: 7, col: 3 },
        { row: 7, col: 4 },
        { row: 7, col: 5 },
        { row: 7, col: 8 },
        { row: 1, col: 6 },
        { row: 2, col: 6 },
        { row: 3, col: 6 },
        { row: 4, col: 6 },
        { row: 6, col: 6 },
        { row: 8, col: 6 },
      ],
    },
    {
      text: "Chanel war neben einem Fernseher und neben einem Stuhl: R8 C2, R8 C4, R8 C6, R9 C3 oder R9 C7 - frei ist nur R9 C3. Fatih war neben einem Fernseher und neben einem Tisch: R5 C5 in der Küche oder R9 C8 im Gästezimmer. R9 ist vergeben, also R5 C5.",
      place: { C: { row: 8, col: 2 }, F: { row: 4, col: 4 } },
    },
    {
      text: "Frei sind nur noch R3, R4 und R6 in C1, C6 und C8. Helen war im Esszimmer, also in C1 - R3 C1 ist ein Stuhl, R6 C1 eine Pflanze: Helen war in R4 C1. Gerald war neben einem Fernseher: das geht nur in R6 C8 neben R6 C9. Ortwin bleibt R3 C6 - im Schlafzimmer allein mit Gerald. Gerald ist der Mörder!",
      place: {
        H: { row: 3, col: 0 },
        G: { row: 5, col: 7 },
        O: { row: 2, col: 5 },
      },
    },
  ],
  solution: {
    A: { row: 1, col: 3 },
    B: { row: 0, col: 1 },
    C: { row: 8, col: 2 },
    D: { row: 6, col: 8 },
    E: { row: 7, col: 6 },
    F: { row: 4, col: 4 },
    G: { row: 5, col: 7 },
    H: { row: 3, col: 0 },
    O: { row: 2, col: 5 },
  },
};
