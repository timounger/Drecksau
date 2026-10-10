/**
 * The Botanical Garden: bonsai, flowers, cacti, a pond - and a murder.
 *
 * @module
 * @remarks
 * After the hard case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Hard/TheBotanicalGarden.png`, solution beside
 * it). Veronica was murdered; whoever was alone with her did it. The pond's
 * water can be stood in, its lily pads cannot.
 */

import {
  about,
  all,
  alone,
  beside,
  counting,
  inArea,
  on,
  onGround,
  victim,
} from "../engine/clues";
import type { Level } from "../engine/types";

/** The case. */
export const THE_BOTANICAL_GARDEN: Level = {
  id: "the-botanical-garden",
  name: "Botanischer Garten",
  difficulty: "hard",
  story:
    "Veronica wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "B",
      name: "Bonsai-Ausstellung",
      at: "in der Bonsai-Ausstellung",
      ground: "floor",
      tint: "#cfe5e0",
      label: { row: 3, col: 2 },
    },
    {
      key: "I",
      name: "Infoschalter",
      at: "am Infoschalter",
      ground: "floor",
      tint: "#e4d4ec",
      label: { row: 1, col: 6 },
    },
    {
      key: "A",
      name: "Arboretum",
      at: "im Arboretum",
      ground: "grass",
      tint: "#a7dfb5",
      label: { row: 5, col: 6 },
    },
    {
      key: "F",
      name: "Blumengarten",
      at: "im Blumengarten",
      ground: "grass",
      tint: "#e2d9ec",
      label: { row: 9, col: 1 },
    },
    {
      key: "G",
      name: "Pavillon",
      at: "im Pavillon",
      ground: "floor",
      tint: "#b9a3d6",
      label: { row: 8, col: 0 },
    },
    {
      key: "D",
      name: "Wüstenausstellung",
      at: "in der Wüstenausstellung",
      ground: "sand",
      tint: "#f3dfb8",
      label: { row: 11, col: 2 },
    },
    {
      key: "P",
      name: "Teich",
      at: "im Teich",
      ground: "water",
      tint: "#a9dde6",
      label: { row: 9, col: 8 },
    },
    {
      key: "R",
      name: "Ruhebereich",
      at: "im Ruhebereich",
      ground: "grass",
      tint: "#9edcc0",
      label: { row: 11, col: 8 },
    },
  ],
  areaMap: [
    "BBBBBAIIAAAA",
    "BBBBBAIIAAAA",
    "BBBBBAAAAAAA",
    "BBBBBAAAAAAA",
    "FFFFFAAAAAAA",
    "FFFFFAAAAAAA",
    "GGFFFRRRRRRR",
    "GGFFFRRRPPRR",
    "GGFFFRPPPPPR",
    "FFFFFRRPPPPR",
    "DDDDDRRRRRRR",
    "DDDDDRRRRRRR",
  ],
  groundMap: [
    "fffffgffpggg",
    "fffffgffpggg",
    "fffffgggpggg",
    "fffffggppggg",
    "gpgggggpgggg",
    "gppggggpgggg",
    "ffpggggpgggg",
    "ffppppppwwgg",
    "ffpggpwwwwwg",
    "ggpggppwwwwg",
    "sssssgpggggg",
    "sssssgpggggg",
  ],
  grounds: { f: "floor", g: "grass", p: "path", w: "water", s: "sand" },
  thingMap: [
    "c.bTT..c...t",
    "..b.Tt.T.ctt",
    "b......t.ct.",
    "cb...c.....t",
    "f.ff..t...tt",
    "f..cft...tt.",
    ".T..f.s.t.s.",
    "c........lTs",
    ".T..f..l...c",
    "ff.f....l..c",
    "k...ks..cTt.",
    ".k..........",
  ],
  things: {
    c: "chair",
    T: "table",
    b: "bonsai",
    t: "tree",
    f: "flowers",
    s: "shrub",
    k: "cactus",
    l: "lilyPad",
  },
  extraThings: {
    bonsai: {
      name: "Bonsai",
      emoji: "\u{1FAB4}",
      standable: false,
      kinds: ["plant"],
    },
    lilyPad: {
      name: "Seerosenblatt",
      emoji: "\u{1FAB7}",
      standable: false,
      kinds: ["plant"],
    },
  },
  suspects: [
    {
      id: "A",
      name: "Aveline",
      pronoun: "sie",
      clue: {
        text: "Sie war eine Reihe nördlich von Della.",
        ...about(["D"], (c) => c.cellOf("D")?.row === c.cell.row + 1),
      },
      colour: "#b91c1c",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "B",
      name: "Brielle",
      pronoun: "sie",
      clue: {
        text: "Sie saß auf einem Stuhl im Arboretum.",
        ...all(on("seat"), inArea("A")),
      },
      colour: "#15803d",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "C",
      name: "Collin",
      pronoun: "er",
      clue: { text: "Er war neben einem Tisch.", ...beside("table") },
      colour: "#0e7490",
      face: "\u{1F9D4}",
    },
    {
      id: "D",
      name: "Della",
      pronoun: "sie",
      clue: {
        text: "Sie war auf einem Weg. Sie war allein.",
        ...all(onGround("path"), alone()),
      },
      colour: "#6366f1",
      face: "\u{1F475}",
    },
    {
      id: "E",
      name: "Evelyn",
      pronoun: "sie",
      clue: {
        text: "Sie saß auf einem Stuhl. Sie war allein mit einem Mann.",
        ...all(
          on("seat"),
          counting((c) => {
            const here = c.peopleIn(c.areaOf(c.cell) ?? "");
            return (
              here.length === 2 &&
              here.some((one) => one !== c.self && c.has(one, "man"))
            );
          }),
        ),
      },
      colour: "#7c3aed",
      face: "\u{1F469}",
    },
    {
      id: "F",
      name: "Florian",
      pronoun: "er",
      clue: { text: "Er war allein.", ...alone() },
      colour: "#9f1239",
      face: "\u{1F9D4}",
    },
    {
      id: "G",
      name: "Gary",
      pronoun: "er",
      clue: { text: "Er war neben einem Bonsai.", ...beside("bonsai") },
      colour: "#ea580c",
      face: "\u{1F474}",
    },
    {
      id: "H",
      name: "Harlow",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Strauch.", ...beside("shrub") },
      colour: "#4338ca",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "I",
      name: "Idara",
      pronoun: "sie",
      clue: {
        text: "Sie saß auf einem Stuhl. Sie war allein.",
        ...all(on("seat"), alone()),
      },
      colour: "#0f766e",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "J",
      name: "Joss",
      pronoun: "er",
      clue: {
        text: "Er war neben einem Seerosenblatt.",
        ...beside("lilyPad"),
      },
      colour: "#a16207",
      face: "\u{1F468}",
    },
    {
      id: "K",
      name: "Kaela",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Kaktus.", ...beside("cactus") },
      colour: "#be185d",
      face: "\u{1F469}",
    },
    {
      id: "V",
      name: "Veronica",
      pronoun: "sie",
      clue: { text: "Sie war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F469}‍\u{1F9B1}",
    },
  ],
  hints: [
    {
      text: "Brielle ist im Arboretum, Gary muss in der Bonsai-Ausstellung sein und Harlow im Ruhebereich. Dann muss Della allein im Blumengarten sein. Die einzigen Bereiche, in denen Florian und Idara allein sein können, sind also der Infoschalter und der Pavillon.",
    },
    {
      text: "Mit wem kann Evelyn allein sein, während sie auf einem Stuhl sitzt? Nur mit Gary, in der Bonsai-Ausstellung. Evelyn ist in Spalte 1 - damit sitzt Idara auf dem Stuhl in Reihe 1, Spalte 8, und Evelyn steht fest.",
      place: { I: { row: 0, col: 7 }, E: { row: 3, col: 0 } },
    },
    {
      text: "Damit steht Florian im Pavillon fest, und Della muss in Spalte 3 sein. Damit steht Gary fest.",
      place: { F: { row: 7, col: 1 }, G: { row: 1, col: 3 } },
    },
    {
      text: "Damit steht Kaela fest.",
      place: { K: { row: 11, col: 4 } },
    },
    {
      text: "Damit bleibt für Brielle auch nur der letzte Stuhl im Arboretum.",
      place: { B: { row: 2, col: 9 } },
    },
    {
      text: "Damit bleibt für Collin nur das letzte Feld neben einem Tisch, und dann für Joss das Feld neben dem letzten Seerosenblatt.",
      place: { C: { row: 10, col: 8 }, J: { row: 8, col: 6 } },
    },
    {
      text: "Aveline muss auf dem letzten freien Feld in Reihe 5 stehen und Della dann in Reihe 6. Damit stehen beide fest.",
      place: { A: { row: 4, col: 5 }, D: { row: 5, col: 2 } },
    },
    {
      text: "Damit bleibt für Harlow nur das letzte Feld neben einem Strauch.",
      place: { H: { row: 6, col: 11 } },
    },
    {
      text: "Für Veronica bleibt das letzte Feld, im Teich allein mit Joss. Joss ist der Mörder!",
      place: { V: { row: 9, col: 10 } },
    },
  ],
  solution: {
    A: { row: 4, col: 5 },
    B: { row: 2, col: 9 },
    C: { row: 10, col: 8 },
    D: { row: 5, col: 2 },
    E: { row: 3, col: 0 },
    F: { row: 7, col: 1 },
    G: { row: 1, col: 3 },
    H: { row: 6, col: 11 },
    I: { row: 0, col: 7 },
    J: { row: 8, col: 6 },
    K: { row: 11, col: 4 },
    V: { row: 9, col: 10 },
  },
};
