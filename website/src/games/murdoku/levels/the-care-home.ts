/**
 * The Care Home: a kitchen, a dining hall, a lift, a hallway, a common room
 * and a reception, with a murdered resident.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Das Murdoku-Orginal/31. Das Seniorenheim.png`,
 * solution on `Lösungen 1-80/Lösung 29-32.JPG`).
 * Ossian is the victim; whoever was alone with him killed him.
 *
 * The armchairs and the rugs can be stood on; the tables (the kitchen
 * counter, the game table and the reception desk among them), the shelf, the
 * TVs and the plants cannot. Sitting on a chair means being on an armchair.
 */
import {
  all,
  beside,
  counting,
  inArea,
  on,
  own,
  row,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** Whether nobody but the suspect stood on a thing of this id. */
function onlyOneOn(what: string): (c: Context) => boolean {
  return (c: Context): boolean =>
    c.people().every((id) => {
      const there = c.cellOf(id);
      return id === c.self || there === undefined || !c.is(there, what);
    });
}

/** Whether a TV stands in the field's area. */
function tvInRoom(c: Context): boolean {
  return c.cellsOf(c.areaOf(c.cell) ?? "").some((cell) => c.is(cell, "tv"));
}

/** Whether no woman stood in the suspect's area. */
function noWomanInRoom(c: Context): boolean {
  return c.peopleIn(c.areaOf(c.cell) ?? "").every((id) => !c.has(id, "woman"));
}

/** Whether the hallway held exactly the suspect and Frankie. */
function aloneWithFrankie(c: Context): boolean {
  const there = c.peopleIn("F");
  return there.length === 2 && there.includes("F");
}

/** The case. */
export const THE_CARE_HOME: Level = {
  id: "the-care-home",
  name: "Das Seniorenheim",
  series: { book: "original", number: 31 },
  story:
    "Ich billige nicht, was er getan hat, aber Hut ab vor dem Mörder, dass er so aktiv bleibt!",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "K",
      name: "Küche",
      at: "in der Küche",
      ground: "stone",
      tint: "#e2e0ec",
      label: { row: 1, col: 0 },
    },
    {
      key: "S",
      name: "Speisesaal",
      at: "im Speisesaal",
      ground: "stone",
      tint: "#c4dcef",
      label: { row: 8, col: 0 },
    },
    {
      key: "A",
      name: "Aufzug",
      at: "im Aufzug",
      ground: "floor",
      tint: "#dfeef0",
      label: { row: 4, col: 3 },
    },
    {
      key: "F",
      name: "Flur",
      at: "im Flur",
      ground: "stone",
      tint: "#ecd3e3",
      label: { row: 6, col: 5 },
    },
    {
      key: "G",
      name: "Gemeinschaftsraum",
      at: "im Gemeinschaftsraum",
      ground: "floor",
      tint: "#cfe6ea",
      label: { row: 4, col: 7 },
    },
    {
      key: "E",
      name: "Empfang",
      at: "im Empfang",
      ground: "stone",
      tint: "#cfe8d6",
      label: { row: 8, col: 4 },
    },
  ],
  areaMap: [
    "KKKKKFFGG",
    "KKKKKFFGG",
    "KSSKKFFGG",
    "SSSAAFFGG",
    "SSSAAFFGG",
    "SSSFFFFFF",
    "SSSFFFFFF",
    "SSSSEEEEE",
    "SSSSEEEEE",
  ],
  thingMap: [
    "ts..t..cf",
    "...ttprt.",
    ".....trtc",
    "crrr.p.rr",
    "tt.r.rr..",
    ".....rrcp",
    "ctr.....r",
    "ctc...rtc",
    "p.....rtf",
  ],
  things: {
    c: "chair",
    f: "tv",
    p: "plant",
    r: "rug",
    s: "shelf",
    t: "table",
  },
  pieces: [
    { at: { row: 1, col: 6 }, rows: 2, cols: 1 },
    { at: { row: 1, col: 7 }, rows: 2, cols: 1 },
    { at: { row: 3, col: 1 }, rows: 1, cols: 2 },
    { at: { row: 3, col: 3 }, rows: 2, cols: 1 },
    { at: { row: 3, col: 7 }, rows: 1, cols: 2 },
    { at: { row: 4, col: 0 }, rows: 1, cols: 2 },
    { at: { row: 4, col: 5 }, rows: 2, cols: 2 },
    { at: { row: 6, col: 1 }, rows: 2, cols: 1 },
    { at: { row: 7, col: 6 }, rows: 2, cols: 1 },
    { at: { row: 7, col: 7 }, rows: 2, cols: 1 },
  ],
  suspects: [
    {
      id: "A",
      name: "Andy",
      pronoun: "er",
      clue: {
        text: "In seinem Raum war ein Fernseher.",
        ...own(tvInRoom),
      },
      colour: "#b91c1c",
      face: "\u{1F474}",
    },
    {
      id: "B",
      name: "Berta",
      pronoun: "sie",
      clue: { text: "Sie war in der obersten Zeile.", ...row(1) },
      colour: "#15803d",
      face: "\u{1F475}",
    },
    {
      id: "C",
      name: "Clark",
      pronoun: "er",
      clue: {
        text: "Er war im Flur, allein mit Frankie.",
        ...all(inArea("F"), counting(aloneWithFrankie)),
      },
      colour: "#0e7490",
      face: "\u{1F468}‍\u{1F9B3}",
    },
    {
      id: "D",
      name: "Dominik",
      pronoun: "er",
      clue: {
        text: "In seinem Raum war keine Frau.",
        ...counting(noWomanInRoom),
      },
      colour: "#6366f1",
      face: "\u{1F9D4}",
    },
    {
      id: "E",
      name: "Emir",
      pronoun: "er",
      clue: {
        text: "Er war die einzige Person, die auf einem Stuhl saß.",
        ...all(on("chair"), counting(onlyOneOn("chair"))),
      },
      colour: "#7c3aed",
      face: "\u{1F468}‍\u{1F9B2}",
    },
    {
      id: "F",
      name: "Frankie",
      pronoun: "er",
      clue: { text: "Er war neben einer Pflanze.", ...beside("plant") },
      colour: "#9f1239",
      face: "\u{1F474}",
    },
    {
      id: "G",
      name: "Greta",
      pronoun: "sie",
      clue: { text: "Sie war im Gemeinschaftsraum.", ...inArea("G") },
      colour: "#ea580c",
      face: "\u{1F475}",
    },
    {
      id: "H",
      name: "Harriet",
      pronoun: "sie",
      clue: {
        text: "Sie war die einzige Person auf einem Teppich.",
        ...all(on("rug"), counting(onlyOneOn("rug"))),
      },
      colour: "#4338ca",
      face: "\u{1F469}‍\u{1F9B3}",
    },
    {
      id: "O",
      name: "Ossian",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F9D4}",
    },
  ],
  rules: [
    {
      text: "Es gab keinen leeren Raum.",
      check: (c) =>
        c.level.areas.every((area) => c.peopleIn(area.key).length > 0),
    },
  ],
  hints: [
    {
      text: "Nur Harriet kann auf einem Teppich sein, und nur Emir kann auf einem Stuhl sitzen.",
    },
    {
      text: "Berta ist in Z1, aber nicht auf dem Stuhl und nicht im Flur (wo Frankie und Clark allein sind), also ist sie in der Küche. Schließe die anderen Felder in Z1 aus.",
      cross: [
        { row: 0, col: 5 },
        { row: 0, col: 6 },
        { row: 0, col: 7 },
      ],
    },
    {
      text: "Frankie und Clark sind nicht auf einem Stuhl oder Teppich im Flur. Das lokalisiert Frankie im einzigen verbleibenden Feld im Flur neben einer Pflanze.",
      place: { F: { row: 3, col: 6 } },
    },
    {
      text: "Da kein Raum leer ist, ist jemand im Aufzug in Z5. Das lokalisiert Greta (die nicht auf einem Stuhl ist) im Gemeinschaftsraum.",
      place: { G: { row: 1, col: 8 } },
    },
    {
      text: "Es gibt nur ein Feld in S8, was Clark lokalisiert. Der Rest des Flurs ist leer.",
      place: { C: { row: 6, col: 7 } },
    },
    {
      text: "Das lokalisiert Harriet auf dem letzten Teppichfeld. Das lokalisiert Berta, dann Emir auf dem letzten Stuhl. Das einzige verfügbare Feld in S6 ist im Empfang; Andy, in einem Raum mit Fernseher, muss dort sein.",
      place: {
        H: { row: 4, col: 3 },
        B: { row: 0, col: 2 },
        E: { row: 7, col: 0 },
        A: { row: 8, col: 5 },
      },
    },
    {
      text: "Das lokalisiert Dominik und Ossian. Berta ist die Mörderin!",
      place: { D: { row: 5, col: 1 }, O: { row: 2, col: 4 } },
    },
  ],
  solution: {
    A: { row: 8, col: 5 },
    B: { row: 0, col: 2 },
    C: { row: 6, col: 7 },
    D: { row: 5, col: 1 },
    E: { row: 7, col: 0 },
    F: { row: 3, col: 6 },
    G: { row: 1, col: 8 },
    H: { row: 4, col: 3 },
    O: { row: 2, col: 4 },
  },
};
