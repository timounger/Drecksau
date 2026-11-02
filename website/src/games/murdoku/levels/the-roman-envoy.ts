/**
 * Der römische Gesandte: the sea, the stands, the reception hall, the
 * desert, the courtyard, the arbour and the stable, with a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/72. Emisario Romano.png`,
 * Spanish edition, no solution sheet - only a few fields are crossed out in
 * pencil on the photographed page, and the solver proves the solution is
 * the only one). Voser is the victim; whoever was alone with him killed
 * him.
 *
 * The map is ten by ten. Some fields carry a hieroglyph: whoever stood on
 * Anubis was alone in the area, whoever stood on Ra was not, and no Roman
 * (the trait "roman") stood on either ({@link RULES}). A corner of an area
 * is a field with the area's edge on one side and on a side next to it
 * ({@link isCorner}). The rug in the reception hall is carpet underfoot, so
 * the Ra field on it is on the rug too. Chairs and horses can be stood on;
 * pillars, tables, the obelisk, the rock in the sea, weapon racks, palms
 * and the shrub cannot. The dark square in the arbour, half under the
 * sign, is a low table.
 */
import {
  beside,
  column,
  counting,
  on,
  onGround,
  own,
  victim,
} from "../engine/clues";
import type { Context, Level, Rule } from "../engine/types";

/** The rules of the case: alone on Anubis, never alone on Ra, no Romans on either. */
const RULES: readonly Rule[] = [
  {
    text: "Wer auf einer Anubis-Hieroglyphe stand, war allein in seinem Bereich.",
    check: (c) => everyOn(c, "anubis", (count) => count === 1),
  },
  {
    text: "Wer auf einer Ra-Hieroglyphe stand, war nicht allein in seinem Bereich.",
    check: (c) => everyOn(c, "ra", (count) => count > 1),
  },
  {
    text: "Auf Feldern mit einer Hieroglyphe standen keine Römer*innen.",
    unary: (suspect, c) =>
      !(suspect.traits ?? []).includes("roman") || !c.is(c.cell, "hieroglyph"),
  },
];

/** The case. */
export const THE_ROMAN_ENVOY: Level = {
  id: "the-roman-envoy",
  name: "Der römische Gesandte",
  series: { book: "timeTravel", number: 72 },
  story: "Hier führen alle Wege zu diplomatischen Kopfschmerzen.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "M",
      name: "Meer",
      at: "im Meer",
      ground: "water",
      label: { row: 1, col: 3 },
    },
    {
      key: "T",
      name: "Tribüne",
      at: "auf der Tribüne",
      ground: "stone",
      tint: "#e4e2dc",
      label: { row: 2, col: 2 },
    },
    {
      key: "S",
      name: "Empfangssaal",
      at: "im Empfangssaal",
      ground: "stone",
      tint: "#ebe9e4",
      label: { row: 6, col: 1 },
    },
    {
      key: "W",
      name: "Wüste",
      at: "in der Wüste",
      ground: "sand",
      tint: "#efe7b0",
      label: { row: 4, col: 8 },
    },
    {
      key: "P",
      name: "Innenhof",
      at: "im Innenhof",
      ground: "grass",
      tint: "#cfe6d4",
      label: { row: 9, col: 2 },
    },
    {
      key: "L",
      name: "Laube",
      at: "in der Laube",
      ground: "stone",
      tint: "#f1d3d3",
      label: { row: 9, col: 5 },
    },
    {
      key: "E",
      name: "Stall",
      at: "im Stall",
      ground: "stone",
      tint: "#c9c9c9",
      label: { row: 9, col: 8 },
    },
  ],
  areaMap: [
    "MMMMMMWWWW",
    "MMMMMMWWWW",
    "MTTTTTWWWW",
    "TTSSSSWWWW",
    "TSSSSSWWWW",
    "TSSSSSWEEE",
    "TSSSSSWEEE",
    "TPPPPLLEEE",
    "PPPPPLLLEE",
    "PPPPPLLLEE",
  ],
  groundMap: [
    "wwwwwwssss",
    "wwwwwwssss",
    "wffffffsss",
    "fffffffsss",
    "fffcffssss",
    "fffcffssss",
    "fffcffffff",
    "fggggfffff",
    "gggggfffff",
    "gggggfffff",
  ],
  grounds: { w: "water", s: "sand", f: "stone", g: "grass", c: "carpet" },
  // The rug in the reception hall, as the page draws it.
  carpets: [
    [
      { row: 4, col: 3 },
      { row: 5, col: 3 },
      { row: 6, col: 3 },
    ],
  ],
  thingMap: [
    "..........",
    ".aaaxao..r",
    ".pr.rpc...",
    "prt..t...r",
    "rtc.t.....",
    "..rrc.r...",
    "rct..w..h.",
    "p...lwc..h",
    ".s.r...r..",
    "l.....t...",
  ],
  things: {
    a: "anubis",
    c: "chair",
    h: "horse",
    l: "palm",
    o: "obelisk",
    p: "pillar",
    r: "ra",
    s: "shrub",
    t: "table",
    w: "weaponRack",
    x: "boulder",
  },
  extraThings: {
    obelisk: { name: "Obelisk", emoji: "\u{1F5FC}", standable: false },
    pillar: { name: "Säule", emoji: "\u{1F3DB}\u{FE0F}", standable: false },
  },
  suspects: [
    {
      id: "A",
      name: "Augustus",
      pronoun: "er",
      traits: ["roman"],
      clue: {
        text: "Er war in der zweiten Spalte.",
        ...column(2),
      },
      colour: "#b91c1c",
      face: "\u{1F474}",
    },
    {
      id: "B",
      name: "Balbus",
      pronoun: "er",
      traits: ["roman"],
      clue: { text: "Er saß auf einem Pferd.", ...on("horse") },
      colour: "#57534e",
      face: "\u{1F482}",
    },
    {
      id: "C",
      name: "Cassius",
      pronoun: "er",
      traits: ["roman"],
      clue: {
        text: "Er war in einer Ecke seines Bereichs.",
        ...own((c) => isCorner(c)),
      },
      colour: "#a16207",
      face: "\u{1FA96}",
    },
    {
      id: "D",
      name: "Domitia",
      pronoun: "sie",
      traits: ["roman"],
      clue: {
        text: "Sie stand auf dem Teppich.",
        ...onGround("carpet"),
      },
      colour: "#7c3aed",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "E",
      name: "Enebet",
      pronoun: "sie",
      clue: { text: "Sie war neben einer Säule.", ...beside("pillar") },
      colour: "#0e7490",
      face: "\u{1F478}",
    },
    {
      id: "F",
      name: "Fenuku",
      pronoun: "er",
      clue: {
        text: "Er war neben einem Feld mit einer Hieroglyphe.",
        ...beside("hieroglyph"),
      },
      colour: "#ea580c",
      face: "\u{1F468}",
    },
    {
      id: "G",
      name: "Gallus",
      pronoun: "er",
      traits: ["roman"],
      clue: {
        text: "In seinem Bereich war noch eine weitere römische Person.",
        ...counting((c) =>
          c
            .peopleIn(c.areaOf(c.cell) ?? "")
            .some((id) => id !== c.self && c.has(id, "roman")),
        ),
      },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "H",
      name: "Hatshep",
      pronoun: "sie",
      clue: { text: "Sie saß auf einem Stuhl.", ...on("chair") },
      colour: "#be185d",
      face: "\u{1F469}\u{1F3FD}",
    },
    {
      id: "I",
      name: "Ipuy",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Tisch.", ...beside("table") },
      colour: "#4338ca",
      face: "\u{1F469}",
    },
    {
      id: "V",
      name: "Voser",
      pronoun: "er",
      clue: {
        text: "Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#334155",
      face: "\u{1F9D4}‍♂️",
    },
  ],
  rules: RULES,
  prune: stillPossible,
  hints: [
    {
      text: "Enebet steht neben einer Säule: Auf der Tribüne sind das nur Ra-Felder, sie war dort also nicht allein. Augustus hat Spalte 2, Domitia auf dem Teppich Spalte 4. Auf der Tribüne bleiben damit nur Zeile 3 (R3C3, R3C5) und Spalte 1 (R5C1, R6C1, R7C1) - Enebet und ihre Begleitung teilen sich Zeile 3 und Spalte 1. Römer stehen auf keiner Hieroglyphe, R6C1 ist keine Ecke, und Gallus fände dort keinen zweiten Römer: Die Begleitung ist Fenuku (nur R6C1) oder Voser.",
    },
    {
      text: "Die Zeilen 3, 5, 6, 7 und 8 füllen also Balbus (R7C9 oder R8C10), Domitia (R5C4 oder R7C4), Enebet, ihre Begleitung und Hatshep - ihre Stühle R3C7 und R7C2 scheiden aus, es bleiben R5C3, R6C5 und R8C7. Augustus, Cassius, Gallus, Ipuy und Fenuku oder Voser stehen in den Zeilen 1, 2, 4, 9 und 10: Augustus in R1C2 oder R10C2, Ipuy auf R4C5, R9C7, R10C6 oder R10C8.",
    },
    {
      text: "Voser ist nicht Enebets Begleitung. Sonst müssten Augustus, Cassius, Fenuku, Gallus und Ipuy die Zeilen 1, 2, 4, 9 und 10 füllen, Zeile 2 könnten nur Fenuku oder Gallus nehmen, und Gallus fände seinen zweiten Römer dort nur in der Wüste (Cassius auf R1C7 oder R1C10), im Stall, im Innenhof oder in der Laube. Spielt man diese Fälle durch, lässt sich keiner zu Ende legen. Fenuku steht also in R6C1, Enebet in Zeile 3.",
      place: { F: { row: 5, col: 0 } },
    },
    {
      text: "In den Zeilen 5, 7 und 8 stehen Balbus, Domitia und Hatshep. Mit Hatshep auf R5C3 stünde Domitia in R7C4, Balbus in R8C10 und Enebet in R3C5. Die Zeilen 2 und 4 könnten dann nur Gallus und Voser füllen; Gallus bräuchte in der Wüste Cassius auf R1C7, Augustus stünde in R10C2 - und für Ipuy bliebe nur R9C7, in der Spalte von Cassius. Also sitzt Hatshep auf R8C7, Domitia steht in R5C4, Balbus in R7C9.",
      place: {
        H: { row: 7, col: 6 },
        D: { row: 4, col: 3 },
        B: { row: 6, col: 8 },
      },
    },
    {
      text: "Ipuy steht in R4C5: Sonst stünde sie in Zeile 10 (R9C7 liegt in Hatsheps Spalte), Augustus damit in R1C2 - und Cassius fände in den Zeilen 1, 2, 4, 9 und 10 keine freie Ecke mehr. Enebet steht damit in R3C3.",
      place: { I: { row: 3, col: 4 }, E: { row: 2, col: 2 } },
    },
    {
      text: "Frei sind noch die Spalten 6, 8 und 10 für Cassius, Gallus und Voser, und Zeile 2 nehmen nur Gallus oder Voser - beide in der Wüste. Voser bräuchte dort genau eine weitere Person: nur Cassius auf R1C10. Dann stünde Augustus in R10C2, und Gallus fände in Zeile 9 keinen zweiten Römer. Also steht Gallus in R2C8, Cassius als zweiter Römer in der Wüstenecke R1C10, Augustus in R10C2 und Voser in R9C6 - allein in der Laube mit Hatshep. Hatshep ist die Mörderin!",
      place: {
        G: { row: 1, col: 7 },
        C: { row: 0, col: 9 },
        A: { row: 9, col: 1 },
        V: { row: 8, col: 5 },
      },
    },
  ],
  solution: {
    A: { row: 9, col: 1 },
    B: { row: 6, col: 8 },
    C: { row: 0, col: 9 },
    D: { row: 4, col: 3 },
    E: { row: 2, col: 2 },
    F: { row: 5, col: 0 },
    G: { row: 1, col: 7 },
    H: { row: 7, col: 6 },
    I: { row: 3, col: 4 },
    V: { row: 8, col: 5 },
  },
};

/** Whether the head count of the area holds for everybody on a thing of this id. */
function everyOn(
  c: Context,
  thing: string,
  test: (count: number) => boolean,
): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return (
      there === undefined ||
      !c.is(there, thing) ||
      test(c.peopleIn(c.areaOf(there) ?? "").length)
    );
  });
}

/** Whether the suspect's field is a corner of its area: the edge on two sides that meet. */
function isCorner(c: Context): boolean {
  const area = c.areaOf(c.cell);
  const out = (row: number, col: number) =>
    c.areaOf({ row: c.cell.row + row, col: c.cell.col + col }) !== area;
  return (out(-1, 0) || out(1, 0)) && (out(0, -1) || out(0, 1));
}

/**
 * For the solver: whether a partial placement can still be finished.
 * Whoever stands on Anubis stays alone, and Voser's area never holds more
 * than two.
 */
function stillPossible(c: Context): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    const count =
      there === undefined ? 0 : c.peopleIn(c.areaOf(there) ?? "").length;
    return (
      there === undefined ||
      ((!c.is(there, "anubis") || count === 1) && (id !== "V" || count <= 2))
    );
  });
}
