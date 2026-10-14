/**
 * Doomscrolling: a flat with a dining room, a pantry, a bedroom, a kitchen, a
 * guest room, a bathroom and a living room - a screen in nearly every corner -
 * and a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Leicht/Doomscrolling/Doomscrolling.png`,
 * solution sheet
 * `game_instructions/Murdoku/Das Murdoku-Orginal/Lösungen 1-80/Lösung 17-20.JPG`).
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
    "Das Opfer starb bei seiner Lieblingsbeschäftigung: auf einen Bildschirm starren.",
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
  pieces: [
    { at: { row: 0, col: 7 }, rows: 2, cols: 1 },
    { at: { row: 1, col: 1 }, rows: 3, cols: 1 },
    { at: { row: 3, col: 4 }, rows: 1, cols: 2 },
    { at: { row: 6, col: 8 }, rows: 2, cols: 1 },
  ],
  suspects: [
    {
      id: "A",
      name: "Arne",
      pronoun: "er",
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
      clue: { text: "Er war auf einem Bett.", ...on("bed") },
      colour: "#6366f1",
      face: "\u{1F9D4}",
    },
    {
      id: "E",
      name: "Eva",
      pronoun: "sie",
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
      text: "Arne kann nur in der Speisekammer sein, in Zeile 2, Spalte 4.",
      place: { A: { row: 1, col: 3 } },
    },
    {
      text: "Balthasar ist laut Helens Hinweis im Esszimmer. Das lokalisiert ihn in Zeile 1, Spalte 2.",
      place: { B: { row: 0, col: 1 } },
    },
    { text: "Das setzt Detlev auf das verbleibende Bett in Spalte 9." },
    {
      text: "Das lokalisiert auch Eva (die laut Helens Hinweis nicht im Esszimmer ist) auf dem letzten verfügbaren Stuhl, in Zeile 8, Spalte 7.",
      place: { E: { row: 7, col: 6 } },
    },
    {
      text: "Das lokalisiert Detlev und lokalisiert auch Chanel im Wohnzimmer.",
      place: { D: { row: 6, col: 8 }, C: { row: 8, col: 2 } },
    },
    {
      text: "Das lokalisiert Fatih in der Küche. Das lokalisiert Helen im letzten Feld im Esszimmer ohne Stuhl. Das lokalisiert Gerald im Schlafzimmer, dann Ortwin. Gerald ist der Mörder!",
      place: {
        F: { row: 4, col: 4 },
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
