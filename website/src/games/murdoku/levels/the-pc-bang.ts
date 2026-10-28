/**
 * Das PC-Bang: an entrance, a snack bar, a gaming area, a tournament room, a
 * washroom and a server room in Seoul, with a murdered gamer - and nobody
 * knows who is behind which gamertag.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 3 - Auf Weltreise/61. Das PC-Bang.png`,
 * no solution sheet - the solver proves the solution is the only one).
 * Ogre is the victim; whoever was alone with Ogre killed Ogre.
 *
 * The pawns are the nine gamertags. The page shows nine portraits, A to I,
 * and does not say which gamertag belongs to which: the tags are handed out
 * to the portraits in one check over the whole placement - some way of
 * handing them out must fit every clue about hoodies, headphones, dyed hair,
 * beards, caps, glasses and necklaces at once. The portraits, as drawn:
 * A glasses; B headphones and a hoodie; C glasses and dyed (purple) hair;
 * D a cap; E glasses and a hoodie; F a cap, a necklace and a moustache;
 * G headphones; H a tuft of beard under the lip; I dyed (blue) hair and a
 * necklace.
 *
 * The map is nine by nine. The chairs and the two rugs can be stood on; the
 * tables, the shelves, the computers, the bins and the plants cannot.
 */
import { all, beside, counting, inArea, on, victim } from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** The portraits and what each of them shows. */
const PORTRAITS: Readonly<Record<string, readonly string[]>> = {
  A: ["glasses"],
  B: ["headphones", "hoodie"],
  C: ["glasses", "dyedHair"],
  D: ["cap"],
  E: ["glasses", "hoodie"],
  F: ["cap", "necklace", "beard"],
  G: ["headphones"],
  H: ["beard"],
  I: ["dyedHair", "necklace"],
};

/** What each gamertag says about its own looks: traits it has, and has not. */
const LOOKS: Readonly<
  Record<string, { readonly has?: string; readonly lacks?: string }>
> = {
  J: { has: "hoodie" },
  P: { has: "headphones" },
  W: { has: "hoodie" },
  R: { has: "dyedHair" },
  L: { lacks: "beard" },
  S: { lacks: "cap" },
  M: { has: "cap" },
  Y: { has: "glasses" },
  O: {},
};

/** How many rows south of a headphone wearer Massmuta stood. */
const ROWS_SOUTH = 3;

/** The gamertags, in the order of the page. */
const TAGS: readonly string[] = Object.keys(LOOKS);

/** Every way of handing the portraits to the tags that fits their own looks. */
const CASTINGS: readonly Readonly<Record<string, string>>[] = castingsFrom(
  TAGS,
  Object.keys(PORTRAITS),
);

/** The tags that may wear headphones, under some casting. */
const HEADPHONES: readonly string[] = TAGS.filter((tag) =>
  CASTINGS.some((cast) => shows(cast, tag, "headphones")),
);

/** The case. */
export const THE_PC_BANG: Level = {
  id: "the-pc-bang",
  name: "Das PC-Bang",
  series: { book: "worldTravel", number: 61 },
  story:
    "Ein PC-Bang ist so etwas wie ein Internetcafé für Gamer. Kills gibt es dort reichlich - aber normalerweise nur auf dem Bildschirm.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "E",
      name: "Eingang",
      at: "im Eingang",
      ground: "floor",
      tint: "#9fb8b6",
      label: { row: 4, col: 0 },
    },
    {
      key: "S",
      name: "Snacks",
      at: "bei den Snacks",
      ground: "floor",
      tint: "#a99bc9",
      label: { row: 1, col: 4 },
    },
    {
      key: "G",
      name: "Gaming-Bereich",
      at: "im Gaming-Bereich",
      ground: "floor",
      tint: "#9d86c2",
      label: { row: 8, col: 4 },
    },
    {
      key: "T",
      name: "Turnierraum",
      at: "im Turnierraum",
      ground: "floor",
      tint: "#8f78b8",
      label: { row: 6, col: 7 },
    },
    {
      key: "W",
      name: "Waschraum",
      at: "im Waschraum",
      ground: "stone",
      tint: "#b3b6d6",
      label: { row: 8, col: 1 },
    },
    {
      key: "V",
      name: "Server",
      at: "im Server",
      ground: "floor",
      tint: "#7d6ba8",
      label: { row: 8, col: 7 },
    },
  ],
  areaMap: [
    "EEEESSSSS",
    "EEEESSSSS",
    "EEGGGGTTT",
    "EEGGGGTTT",
    "EEGGGGTTT",
    "WWGGGGTTT",
    "WWGGGGTTT",
    "WWWGGGTVV",
    "WWWGGGVVV",
  ],
  thingMap: [
    "....hhass",
    "......rr.",
    "pahhh...b",
    "hacccc.hc",
    "..cccc.hc",
    "h.hhhh.hc",
    "...rrr.hc",
    "p..hhh.s.",
    "ahbcccs.s",
  ],
  things: {
    a: "table",
    b: "bin",
    c: "computer",
    h: "chair",
    p: "plant",
    r: "rug",
    s: "shelf",
  },
  extraThings: {
    bin: { name: "Mülleimer", emoji: "\u{1F5D1}\u{FE0F}", standable: false },
    computer: { name: "Computer", emoji: "\u{1F4BB}", standable: false },
  },
  pieces: [
    { at: { row: 2, col: 1 }, rows: 2, cols: 1 },
    { at: { row: 1, col: 6 }, rows: 1, cols: 2 },
    { at: { row: 6, col: 3 }, rows: 1, cols: 3 },
  ],
  suspects: [
    {
      id: "J",
      name: "Jeejee",
      pronoun: "er",
      clue: {
        text: "Trägt einen Hoodie. Im Bereich Eingang.",
        ...inArea("E"),
      },
      colour: "#b45309",
      face: "\u{1F3AE}",
    },
    {
      id: "P",
      name: "Proxyrax",
      pronoun: "sie",
      clue: {
        text: "Trägt Kopfhörer. Die einzige Person auf einem Teppich.",
        ...all(on("rug"), counting(onlyOneOnARug)),
      },
      colour: "#0e7490",
      face: "\u{1F3AE}",
    },
    {
      id: "W",
      name: "Wraith",
      pronoun: "er",
      clue: {
        text: "Trägt einen Hoodie. Neben einem Regal.",
        ...beside("shelf"),
      },
      colour: "#334155",
      face: "\u{1F3AE}",
    },
    {
      id: "R",
      name: "Rageqt",
      pronoun: "sie",
      clue: {
        text: "Hat gefärbte Haare. Mit jemandem, der eine Halskette trug und nicht auf einem Stuhl saß.",
        ...counting(castingFits),
      },
      colour: "#be185d",
      face: "\u{1F3AE}",
    },
    {
      id: "L",
      name: "Lingrush",
      pronoun: "er",
      clue: {
        text: "Hat keinen Bart. Allein mit Wraith.",
        ...counting(aloneWithWraith),
      },
      colour: "#4d7c0f",
      face: "\u{1F3AE}",
    },
    {
      id: "S",
      name: "Sixpool",
      pronoun: "er",
      clue: { text: "Trägt keine Kappe." },
      colour: "#a16207",
      face: "\u{1F3AE}",
    },
    {
      id: "M",
      name: "Massmuta",
      pronoun: "er",
      clue: {
        text: "Trägt eine Kappe. Drei Zeilen südlich und eine Spalte westlich von jemandem mit Kopfhörern.",
        ...counting(castingFits),
      },
      colour: "#7c3aed",
      face: "\u{1F3AE}",
    },
    {
      id: "Y",
      name: "Ydra",
      pronoun: "er",
      clue: {
        text: "Trägt eine Brille. Neben einem Mülleimer.",
        ...beside("bin"),
      },
      colour: "#15803d",
      face: "\u{1F3AE}",
    },
    {
      id: "O",
      name: "Ogre",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Allein mit dem oder der Mörder*in.",
        ...victim(),
      },
      colour: "#b91c1c",
      face: "\u{1F3AE}",
    },
  ],
  rules: [
    {
      note: true,
      text: "Der Gamer-Kodex: Hier benutzt niemand echte Namen - alle nennen einander nur bei ihren Gamertags. Wir wissen nicht einmal, wer von ihnen das Opfer ist. Finde heraus, wer wer ist.",
    },
    {
      note: true,
      text: "Die Porträts: A Brille; B Kopfhörer, Hoodie; C Brille, gefärbte Haare; D Kappe; E Brille, Hoodie; F Kappe, Halskette, Bart; G Kopfhörer; H Bart; I gefärbte Haare, Halskette.",
    },
  ],
  hints: [
    {
      text: "Wraith war neben einem Regal: R2 C8 ist ein Teppich (dort darf nur Proxyrax stehen), also R2 C9, R8 C9 oder R9 C8. Im Server müsste Lingrush das andere Server-Feld nehmen - dann wären R8, R9, C8 und C9 belegt, und Ydra fände neben keinem Mülleimer (R3 C8, R8 C3, R9 C2) Platz. Wraith steht also in R2 C9, und Lingrush ist allein mit ihm bei den Snacks, in Zeile 1.",
      place: { W: { row: 1, col: 8 } },
    },
    {
      text: "Die Teppiche bei den Snacks liegen in Zeile 2 - Proxyrax steht auf dem Teppich in R7 im Gaming-Bereich. Massmuta war drei Zeilen südlich und eine Spalte westlich von jemandem mit Kopfhörern: Von Zeile 7 aus geht das nicht, und Jeejee (Hoodie, also vielleicht Porträt B) müsste in Zeile 1 oder 2 stehen - beide sind belegt. Also trägt Wraith die Kopfhörer (Porträt B), und Massmuta sitzt in R5 C8. Jeejee bleibt im Eingang nur R4 C1.",
      place: { M: { row: 4, col: 7 }, J: { row: 3, col: 0 } },
    },
    {
      text: "In Zeile 9 kann man nur auf R9 C2 und R9 C8 stehen; C8 ist Massmutas Spalte, also steht dort jemand in R9 C2. In Spalte 7 sind alle freien Felder im Turnierraum. Ydra kann nicht dorthin (kein Mülleimer in Reichweite), Rageqt auch nicht (dort sitzt nur Massmuta, auf einem Stuhl). Also steht Sixpool oder Ogre in Spalte 7.",
    },
    {
      text: "Rageqt war mit jemandem mit Halskette (Porträt F oder I), der nicht auf einem Stuhl saß. Massmuta sitzt; Ogre kann es nicht sein - beide wären allein, aber im Gaming-Bereich steht Proxyrax, und im Waschraum sind nur R8 C3 und R9 C2 frei, wo auch Ydra hin muss. Also ist es Sixpool, im selben Bereich wie Rageqt und nicht im Turnierraum. In Spalte 7 bleibt Ogre - allein im Turnierraum mit Massmuta.",
    },
    {
      text: "Rageqt und Sixpool waren im Gaming-Bereich (im Waschraum ist neben Ydra kein Platz für zwei). Sixpool sitzt nicht: frei bleibt in Zeile 3, 6 oder 8 nur R3 C6. Dann sitzt Lingrush in R1 C5, Proxyrax steht in R7 C4, Rageqt sitzt in R6 C3, Ydra in R9 C2 und Ogre steht in R8 C7. Wer wer ist: Ydra A, Wraith B, Rageqt C, Lingrush D, Jeejee E, Massmuta F, Proxyrax G, Ogre H, Sixpool I. Massmuta ist der Mörder!",
      place: {
        S: { row: 2, col: 5 },
        L: { row: 0, col: 4 },
        P: { row: 6, col: 3 },
        R: { row: 5, col: 2 },
        Y: { row: 8, col: 1 },
        O: { row: 7, col: 6 },
      },
    },
  ],
  prune: canStillFit,
  solution: {
    J: { row: 3, col: 0 },
    P: { row: 6, col: 3 },
    W: { row: 1, col: 8 },
    R: { row: 5, col: 2 },
    L: { row: 0, col: 4 },
    S: { row: 2, col: 5 },
    M: { row: 4, col: 7 },
    Y: { row: 8, col: 1 },
    O: { row: 7, col: 6 },
  },
};

/** Every bijection from the tags to the portraits that fits the tags' own looks. */
function castingsFrom(
  tags: readonly string[],
  portraits: readonly string[],
): readonly Readonly<Record<string, string>>[] {
  const found: Readonly<Record<string, string>>[] = [];
  const extend = (at: number, cast: Record<string, string>, free: string[]) => {
    if (at === tags.length) {
      found.push({ ...cast });
    } else {
      const tag = tags[at] ?? "";
      const look = LOOKS[tag] ?? {};
      free.forEach((portrait, index) => {
        const traits = PORTRAITS[portrait] ?? [];
        const fits =
          (look.has === undefined || traits.includes(look.has)) &&
          (look.lacks === undefined || !traits.includes(look.lacks));
        if (fits) {
          cast[tag] = portrait;
          extend(
            at + 1,
            cast,
            free.filter((_, other) => other !== index),
          );
        }
      });
    }
  };
  extend(0, {}, [...portraits]);
  return found;
}

/** Whether a tag, under a casting, shows a trait. */
function shows(
  cast: Readonly<Record<string, string>>,
  tag: string,
  trait: string,
): boolean {
  return (PORTRAITS[cast[tag] ?? ""] ?? []).includes(trait);
}

/**
 * Whether one casting fits Massmuta's and Rageqt's clues at once - the
 * check behind both.
 */
function castingFits(c: Context): boolean {
  const massmuta = c.cellOf("M");
  const rageqt = c.cellOf("R");
  return (
    massmuta !== undefined &&
    rageqt !== undefined &&
    CASTINGS.some(
      (cast) =>
        TAGS.some((tag) => {
          const there = c.cellOf(tag);
          return (
            tag !== "M" &&
            there !== undefined &&
            shows(cast, tag, "headphones") &&
            massmuta.row === there.row + ROWS_SOUTH &&
            massmuta.col === there.col - 1
          );
        }) &&
        TAGS.some((tag) => {
          const there = c.cellOf(tag);
          return (
            tag !== "R" &&
            there !== undefined &&
            shows(cast, tag, "necklace") &&
            c.areaOf(there) === c.areaOf(rageqt) &&
            !c.is(there, "chair")
          );
        }),
    )
  );
}

/**
 * For the solver only: Lingrush and Wraith share an area, and Massmuta
 * stands three rows south and one column west of a possible headphone wearer.
 */
function canStillFit(c: Context): boolean {
  const lingrush = c.cellOf("L");
  const wraith = c.cellOf("W");
  const massmuta = c.cellOf("M");
  const placed = HEADPHONES.map((tag) => c.cellOf(tag));
  return (
    (lingrush === undefined ||
      wraith === undefined ||
      c.areaOf(lingrush) === c.areaOf(wraith)) &&
    (massmuta === undefined ||
      placed.some((cell) => cell === undefined) ||
      placed.some(
        (cell) =>
          cell !== undefined &&
          massmuta.row === cell.row + ROWS_SOUTH &&
          massmuta.col === cell.col - 1,
      ))
  );
}

/** Whether nobody but the suspect stood on a rug. */
function onlyOneOnARug(c: Context): boolean {
  return c.people().every((id) => {
    const there = c.cellOf(id);
    return id === c.self || there === undefined || !c.is(there, "rug");
  });
}

/** Whether Lingrush and Wraith were the only two in Lingrush's area. */
function aloneWithWraith(c: Context): boolean {
  const here = c.peopleIn(c.areaOf(c.cell) ?? "");
  return here.length === 2 && here.includes("W");
}
