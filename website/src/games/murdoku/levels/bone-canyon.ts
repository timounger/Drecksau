/**
 * Die Knochenschlucht: a graveyard, a field, the canyon, a quarry and a cave
 * of the stone age, with a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/59.png`, no solution
 * sheet - the solved grid is pencilled in on the photographed page, and the
 * solver proves it is the only solution). Veku is the victim; whoever was
 * alone with him killed him.
 *
 * The cards show no estates and the map no crowns. Instead two kinds of
 * fields are framed and marked: a wolf (a wolf tamer) and a stone axe (a
 * toolmaker). There were two of each: exactly two people stood on wolf
 * fields, exactly two on axe fields ({@link TRADES}). The marked fields can be
 * stood on; bone piles, boulders, trees and the fire cannot.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  about,
  all,
  beside,
  column,
  counting,
  inArea,
  on,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** The marked fields and how many held each trade. */
const TRADES: readonly (readonly [string, number])[] = [
  ["wolf", 2],
  ["stoneAxe", 2],
];

/** The case. */
export const BONE_CANYON: Level = {
  id: "bone-canyon",
  name: "Die Knochenschlucht",
  series: { book: "timeTravel", number: 59 },
  story:
    "Na ja, wenigstens muss man in diesem Fall die Leiche nicht von der Stelle bewegen.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "F",
      name: "Friedhof",
      at: "auf dem Friedhof",
      ground: "stone",
      tint: "#e4e2df",
      label: { row: 3, col: 0 },
    },
    {
      key: "P",
      name: "Feld",
      at: "auf dem Feld",
      ground: "stone",
      tint: "#ccd2dc",
      label: { row: 2, col: 4 },
    },
    {
      key: "S",
      name: "Schlucht",
      at: "in der Schlucht",
      ground: "sand",
      tint: "#ece6cc",
      label: { row: 4, col: 1 },
    },
    {
      key: "Q",
      name: "Steinbruch",
      at: "im Steinbruch",
      ground: "stone",
      tint: "#d4dce6",
      label: { row: 8, col: 0 },
    },
    {
      key: "C",
      name: "Höhle",
      at: "in der Höhle",
      ground: "water",
      tint: "#a9c9e6",
      label: { row: 8, col: 4 },
    },
  ],
  areaMap: [
    "FFPPPPPPP",
    "FFFPPPPPP",
    "FFFFPPPPP",
    "FFFSSSPPP",
    "SSSSSSSSS",
    "QQQSSSQQQ",
    "QQQQQQQQQ",
    "QQQQCCQQQ",
    "QQQQCCCQQ",
  ],
  thingMap: [
    "h..oh..hl",
    ".hl..h..o",
    "..h...th.",
    ".........",
    "....f.hl.",
    "oa.at.aoa",
    "aoh....t.",
    ".toa..t..",
    "..al.tlh.",
  ],
  things: {
    a: "stoneAxe",
    f: "campfire",
    h: "bonePile",
    l: "wolf",
    o: "boulder",
    t: "tree",
  },
  suspects: [
    {
      id: "A",
      name: "Argu",
      pronoun: "er",
      clue: {
        text: "In seinem Bereich hatte niemand ein Handwerk.",
        ...counting((c) =>
          c
            .peopleIn(c.areaOf(c.cell) ?? "")
            .every((one) => !onTrade(c, c.cellOf(one))),
        ),
      },
      colour: "#b91c1c",
      face: "\u{1F468}\u{1F3FC}\u{200D}\u{1F9B3}",
    },
    {
      id: "B",
      name: "Blik",
      pronoun: "er",
      clue: {
        text: "Ein Werkzeugmacher. Er war nicht im selben Bereich wie Gogg.",
        ...all(
          on("stoneAxe"),
          about(["G"], (c) => {
            const gogg = c.cellOf("G");
            return gogg !== undefined && c.areaOf(gogg) !== c.areaOf(c.cell);
          }),
        ),
      },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Crug",
      pronoun: "er",
      clue: {
        text: "Er war neben einem Knochenhaufen. Er war allein mit einer Frau, die Wölfe bändigte.",
        ...all(beside("bonePile"), counting(aloneWithTamer)),
      },
      colour: "#0e7490",
      face: "\u{1F471}\u{1F3FC}\u{200D}\u{2642}\u{FE0F}",
    },
    {
      id: "D",
      name: "Doma",
      pronoun: "sie",
      clue: { text: "Sie war auf dem Friedhof.", ...inArea("F") },
      colour: "#6366f1",
      face: "\u{1F469}\u{1F3FD}",
    },
    {
      id: "E",
      name: "Eka",
      pronoun: "sie",
      clue: { text: "Sie war in der letzten Spalte.", ...column(9) },
      colour: "#a16207",
      face: "\u{1F475}\u{1F3FC}",
    },
    {
      id: "F",
      name: "Fleki",
      pronoun: "sie",
      clue: {
        text: "Sie war im selben Bereich wie Gogg, südlich von ihm.",
        ...about(["G"], (c) => {
          const gogg = c.cellOf("G");
          return (
            gogg !== undefined &&
            c.areaOf(gogg) === c.areaOf(c.cell) &&
            c.cell.row > gogg.row
          );
        }),
      },
      colour: "#be185d",
      face: "\u{1F469}\u{1F3FC}",
    },
    {
      id: "G",
      name: "Gogg",
      pronoun: "er",
      clue: { text: "Er war neben einem Felsen.", ...beside("boulder") },
      colour: "#57534e",
      face: "\u{1F468}\u{1F3FD}",
    },
    {
      id: "H",
      name: "Hiko",
      pronoun: "er",
      clue: { text: "Er war in der Schlucht.", ...inArea("S") },
      colour: "#7c3aed",
      face: "\u{1F480}",
    },
    {
      id: "V",
      name: "Veku",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#d97706",
      face: "\u{1F9D4}\u{1F3FE}",
    },
  ],
  rules: [
    {
      text: "Es gab zwei Wolfsbändiger und zwei Werkzeugmacher. Sie standen auf den Feldern ihres Handwerks, sonst niemand auf einem solchen Feld.",
      check: (c) =>
        TRADES.every(([what, count]) => peopleOn(c, what).length === count),
      prune: stillPossible,
    },
  ],
  hints: [
    {
      text: "Crug war allein mit einer Frau, die Wölfe bändigte. In der Schlucht steht Hiko (ein Mann). Auf den Wölfen in R9 C4 und R9 C7 kann keine Frau allein mit ihm sein: Eka steht in C9, Doma auf dem Friedhof, und Fleki ist immer bei Gogg. Also ist Crug auf dem Friedhof mit Doma auf R2 C3 - oder auf dem Feld mit Eka auf R1 C9.",
    },
    {
      text: "Gogg steht neben einem Felsen. Auf dem Feld wäre Fleki bei ihm, Crug also mit Doma (R2 C3) auf dem Friedhof - dann fallen R1 C3 (C3) sowie R2 C4 und R2 C8 (R2) weg, und es bleibt nur C9, Ekas Spalte. Gogg steht im Steinbruch, und dort neben einem Felsen nur auf Steinäxten: Er ist Werkzeugmacher. Blik, der andere, ist nicht bei Gogg - er steht auf der einzigen Steinaxt außerhalb des Steinbruchs, R6 C4.",
      place: { B: { row: 5, col: 3 } },
    },
    {
      text: "Gogg steht nicht in R6 (Bliks Zeile) und nicht in R8 C4 (Bliks Spalte): R7 C1 oder R9 C3. Fleki steht südlich von ihm im Steinbruch, also steht Gogg in R7 C1.",
      place: { G: { row: 6, col: 0 } },
    },
    {
      text: "Angenommen, Crug wäre mit Eka (R1 C9) auf dem Feld. Argu (niemand mit Handwerk) und Veku (allein mit dem Mörder) passen weder in den Steinbruch noch in die Schlucht noch aufs Feld. In R8 oder R9 steht außer Fleki genau noch jemand - in der Höhle, und allein dort kann Veku nicht sein: Argu ist in der Höhle, Veku mit Doma auf dem Friedhof, beide in C2 und C3. Fleki bleibt nur R8 C8, und den zweiten Wolf muss Doma auf R2 C3 bändigen. Crug stünde in R3 C6, Veku in R4 C2 - und Hiko hätte in R5 kein Feld mehr. Also ist Crug auf dem Friedhof, und Doma bändigt Wölfe auf R2 C3.",
      place: { D: { row: 1, col: 2 } },
    },
    {
      text: "Der Friedhof ist voll (Crug in R1 C2 oder R3 C2, Doma). Argu kann weder in die Schlucht (Blik) noch in den Steinbruch (Gogg), Veku auch nicht (dort sind schon zwei): Beide sind auf dem Feld oder in der Höhle. Fleki steht in R8 C8, R8 C9 oder R9 C9. Stünde auch Eka im Steinbruch, dann in R9 C9 mit Fleki in R8 C8 - und für den zweiten Wolfsbändiger bliebe kein Wolf. Also steht neben Fleki Argu in R8/R9 in der Höhle; Veku ist auf dem Feld, und nur Eka kann dort bei ihm sein.",
    },
    {
      text: "Eka steht in C9, also Fleki in R8 C8 und Argu in R9 C5 (der Wolf in R9 C7 wäre ein Handwerk). Für Hiko und Veku bleiben C6 und C7: Hiko in R4 C6 oder R5 C6, also nicht auf dem Wolf in R5 C8 - den zweiten Wolf bändigt Eka in R1 C9. Crug steht in R3 C2, Veku in R4 C7, Hiko in R5 C6. Veku ist auf dem Feld allein mit Eka. Eka ist die Mörderin!",
      place: {
        F: { row: 7, col: 7 },
        A: { row: 8, col: 4 },
        E: { row: 0, col: 8 },
        C: { row: 2, col: 1 },
        V: { row: 3, col: 6 },
        H: { row: 4, col: 5 },
      },
    },
  ],
  solution: {
    A: { row: 8, col: 4 },
    B: { row: 5, col: 3 },
    C: { row: 2, col: 1 },
    D: { row: 1, col: 2 },
    E: { row: 0, col: 8 },
    F: { row: 7, col: 7 },
    G: { row: 6, col: 0 },
    H: { row: 4, col: 5 },
    V: { row: 3, col: 6 },
  },
};

/** Whether somebody stood on a marked field. */
function onTrade(
  c: Context,
  cell: { row: number; col: number } | undefined,
): boolean {
  return cell !== undefined && TRADES.some(([what]) => c.is(cell, what));
}

/** Everybody standing on a thing of this id. */
function peopleOn(c: Context, what: string): readonly string[] {
  return c.people().filter((one) => {
    const there = c.cellOf(one);
    return there !== undefined && c.is(there, what);
  });
}

/** Whether exactly one other shared the area: a woman on a wolf field. */
function aloneWithTamer(c: Context): boolean {
  const others = c
    .peopleIn(c.areaOf(c.cell) ?? "")
    .filter((one) => one !== c.self);
  const other = others[0];
  const there = other === undefined ? undefined : c.cellOf(other);
  return (
    others.length === 1 &&
    other !== undefined &&
    c.has(other, "woman") &&
    there !== undefined &&
    c.is(there, "wolf")
  );
}

/**
 * For the solver only: whether a partial placement breaks nothing yet - no
 * more traders than there were, nobody with a trade in Argu's area, at most
 * one other with Crug or Veku.
 */
function stillPossible(c: Context): boolean {
  const areaPeople = (id: string) => {
    const there = c.cellOf(id);
    return there === undefined ? [] : c.peopleIn(c.areaOf(there) ?? "");
  };
  return (
    TRADES.every(([what, count]) => peopleOn(c, what).length <= count) &&
    areaPeople("A").every((one) => !onTrade(c, c.cellOf(one))) &&
    areaPeople("C").length <= 2 &&
    areaPeople("V").length <= 2
  );
}
