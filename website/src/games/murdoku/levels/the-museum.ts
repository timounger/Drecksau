/**
 * Das Museum: a war exhibition, a toilet, a culture exhibition, a lobby and
 * a gift shop, with a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/56. Das Museum.JPG`,
 * solution on `Lösungen 1-80/Lösung 53-56.JPG`).
 * Ozan is the victim; whoever was alone with him killed him.
 *
 * The armchairs are the chairs; they and the orange rugs can be stood on.
 * As the page says, the catapults, the vases and the weapon racks cannot;
 * nor can the tables, the shelves and the statues. Each statue stands under
 * a vase on the field above it. Step 6 of the printed solution puts the
 * occupied rug field of the toilet in "Z3 S6"; the rug lies in S7, as step 1
 * says, so the hint reads "Z3 S7".
 */
import {
  about,
  all,
  beside,
  counting,
  inArea,
  on,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** Whether the suspect stood north of somebody, by id. */
function northOf(id: string): (c: Context) => boolean {
  return (c: Context): boolean => {
    const there = c.cellOf(id);
    return there !== undefined && c.cell.row < there.row;
  };
}

/** Whether nobody but the suspect sat on a chair. */
function onlyOneOnAChair(c: Context): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return id === c.self || there === undefined || !c.is(there, "chair");
  });
}

/** Whether every room had exactly one person on a rug. */
function oneOnARugPerRoom(c: Context): boolean {
  return c.level.areas.every(
    (area) =>
      c.peopleIn(area.key).filter((id) => {
        const there = c.cellOf(id);
        return there !== undefined && c.is(there, "rug");
      }).length === 1,
  );
}

/** The case. */
export const THE_MUSEUM: Level = {
  id: "the-museum",
  name: "Das Museum",
  series: { book: "original", number: 56 },
  story:
    "Dieser Ort ist gefährlich. Kein Wachmann kennt die Vorsichtsmaßnahmen bei Katapulten.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "K",
      name: "Kriegsausstellung",
      at: "in der Kriegsausstellung",
      ground: "floor",
      tint: "#f3e3c8",
      label: { row: 1, col: 1 },
    },
    {
      key: "T",
      name: "Toilette",
      at: "in der Toilette",
      ground: "floor",
      tint: "#f1dfcf",
      label: { row: 3, col: 4 },
    },
    {
      key: "C",
      name: "Kulturausstellung",
      at: "in der Kulturausstellung",
      ground: "floor",
      tint: "#efdcd0",
      label: { row: 8, col: 0 },
      labelOverhang: true,
    },
    {
      key: "L",
      name: "Lobby",
      at: "in der Lobby",
      ground: "floor",
      tint: "#f3e3cf",
      label: { row: 8, col: 4 },
    },
    {
      key: "G",
      name: "Geschenkeladen",
      at: "im Geschenkeladen",
      ground: "floor",
      tint: "#ece0d4",
      label: { row: 8, col: 6 },
      labelOverhang: true,
    },
  ],
  areaMap: [
    "KKKKKKKKK",
    "KKKKKKKKK",
    "CCCTTTTKK",
    "CCCTTTTKK",
    "CCLLLLGGG",
    "CCLLLLGGG",
    "CCLLLLGGG",
    "CCLLLLGGG",
    "CCCLLLGGG",
  ],
  thingMap: [
    ".ktt.kw.t",
    "w.rrrrrr.",
    ".rvctcrrc",
    "vrs...rr.",
    "srrrr.hrh",
    "...vrvrr.",
    "v.c.r.rtc",
    "...trtrt.",
    "c..c...tt",
  ],
  things: {
    c: "chair",
    h: "shelf",
    k: "catapult",
    r: "rug",
    s: "statue",
    t: "table",
    v: "vase",
    w: "weaponRack",
  },
  extraThings: {
    vase: { name: "Vase", emoji: "\u{1F3FA}", standable: false },
  },
  pieces: [
    { at: { row: 0, col: 2 }, rows: 1, cols: 2 },
    { at: { row: 2, col: 1 }, rows: 3, cols: 1 },
    { at: { row: 2, col: 6 }, rows: 2, cols: 1 },
  ],
  shapes: [
    [
      { row: 1, col: 2 },
      { row: 1, col: 3 },
      { row: 1, col: 4 },
      { row: 1, col: 5 },
      { row: 1, col: 6 },
      { row: 1, col: 7 },
      { row: 2, col: 7 },
      { row: 3, col: 7 },
    ],
    [
      { row: 4, col: 2 },
      { row: 4, col: 3 },
      { row: 4, col: 4 },
      { row: 5, col: 4 },
      { row: 6, col: 4 },
      { row: 7, col: 4 },
    ],
    [
      { row: 4, col: 7 },
      { row: 5, col: 7 },
      { row: 5, col: 6 },
      { row: 6, col: 6 },
      { row: 7, col: 6 },
    ],
    [
      { row: 6, col: 7 },
      { row: 7, col: 7 },
      { row: 8, col: 7 },
      { row: 8, col: 8 },
    ],
  ],
  suspects: [
    {
      id: "A",
      name: "Audrey",
      pronoun: "sie",
      clue: {
        text: "Sie war nördlich von Gladys.",
        ...about(["G"], northOf("G")),
      },
      colour: "#b91c1c",
      face: "\u{1F469}",
    },
    {
      id: "B",
      name: "Belinda",
      pronoun: "sie",
      clue: {
        text: "Sie war neben einem Stuhl. Sie war in der Lobby.",
        ...all(beside("chair"), inArea("L")),
      },
      colour: "#15803d",
      face: "\u{1F469}",
    },
    {
      id: "C",
      name: "Carissa",
      pronoun: "sie",
      clue: {
        text: "Sie war in der Lobby. Sie war nördlich von Ozan.",
        ...all(inArea("L"), about(["O"], northOf("O"))),
      },
      colour: "#0e7490",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "D",
      name: "Dominic",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person, die auf einem Stuhl saß.",
        ...all(on("chair"), counting(onlyOneOnAChair)),
      },
      colour: "#6366f1",
      face: "\u{1F9D4}\u{1F3FF}",
    },
    {
      id: "E",
      name: "Elia",
      pronoun: "er",
      clue: { text: "Er war neben einem Katapult.", ...beside("catapult") },
      colour: "#7c3aed",
      face: "\u{1F474}",
    },
    {
      id: "F",
      name: "Frederick",
      pronoun: "er",
      clue: {
        text: "Er war neben einem Waffenständer.",
        ...beside("weaponRack"),
      },
      colour: "#7f1d1d",
      face: "\u{1F474}",
    },
    {
      id: "G",
      name: "Gladys",
      pronoun: "sie",
      clue: { text: "Sie war neben einer Statue.", ...beside("statue") },
      colour: "#ea580c",
      face: "\u{1F469}",
    },
    {
      id: "H",
      name: "Harold",
      pronoun: "er",
      clue: { text: "Er war neben einem Regal.", ...beside("shelf") },
      colour: "#4338ca",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "O",
      name: "Ozan",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#be123c",
      face: "\u{1F468}",
    },
  ],
  rules: [
    {
      text: "In jedem Raum war genau eine Person auf einem Teppich.",
      check: oneOnARugPerRoom,
    },
  ],
  hints: [
    {
      text: "Laut dem allgemeinen Hinweis ist jemand auf dem Teppich in der Toilette. Schließe den Rest von S7 aus.",
      cross: [
        { row: 0, col: 6 },
        { row: 1, col: 6 },
        { row: 4, col: 6 },
        { row: 5, col: 6 },
        { row: 6, col: 6 },
        { row: 7, col: 6 },
        { row: 8, col: 6 },
      ],
    },
    {
      text: "Harold kann jetzt nur auf zwei Feldern sein. Schließe das sich überschneidende Feld bei Z6 S8 aus.",
      cross: [{ row: 5, col: 7 }],
    },
    {
      text: "Das lässt nur ein verfügbares Feld auf dem Teppich im Geschenkeladen: Z5 S8. Dieses Feld muss besetzt sein.",
    },
    {
      text: "Die verbleibenden Felder auf dem Lobby-Teppich sind alle in S5. Jemand ist auf dem Teppich, also schließe den Rest von S5 aus.",
    },
    {
      text: "Das lässt nur ein verfügbares Feld in der obersten Zeile, in S1. Es muss besetzt sein.",
    },
    {
      text: "Das lokalisiert Gladys bei Z4 S2, also ist das besetzte Teppichfeld in der Toilette Z3 S7. Das muss Audrey sein (der nördlich von Gladys ist), da Frederick nur in Z1 S1 sein kann, was Elia in Z2 S6 lokalisiert.",
      place: {
        G: { row: 3, col: 1 },
        A: { row: 2, col: 6 },
        F: { row: 0, col: 0 },
        E: { row: 1, col: 5 },
      },
    },
    {
      text: "Niemand kann in Z7 S4 sein, da dies alle Stühle für Dominic blockieren würde. Das lässt nur ein Feld in S4, in der untersten Zeile, in dem Dominic sein muss. Schließe die anderen Stühle aus.",
      place: { D: { row: 8, col: 3 } },
      cross: [{ row: 6, col: 3 }],
    },
    {
      text: "Belinda ist in S3 der Lobby, neben dem Stuhl. Das lokalisiert Carissa im letzten verbleibenden Feld in Z7, dann Ozan (südlich von Carissa), dann Belinda und Harold. Harold ist der Mörder!",
      place: {
        C: { row: 6, col: 4 },
        O: { row: 7, col: 8 },
        B: { row: 5, col: 2 },
        H: { row: 4, col: 7 },
      },
    },
  ],
  solution: {
    A: { row: 2, col: 6 },
    B: { row: 5, col: 2 },
    C: { row: 6, col: 4 },
    D: { row: 8, col: 3 },
    E: { row: 1, col: 5 },
    F: { row: 0, col: 0 },
    G: { row: 3, col: 1 },
    H: { row: 4, col: 7 },
    O: { row: 7, col: 8 },
  },
};
