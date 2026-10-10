/**
 * Car Repair: a car workshop with reception, waiting area, storage and
 * garage, and a murdered customer.
 *
 * @module
 * @remarks
 * After the free case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Easy/CarRepair.png`, solution beside it).
 * Vaughn is the victim; whoever was alone with him killed him.
 */
import { alone, all, beside, inArea, on, victim } from "../engine/clues";
import type { Level } from "../engine/types";

/** The case. */
export const CAR_REPAIR: Level = {
  id: "car-repair",
  name: "Autoreparatur",
  difficulty: "veryEasy",
  series: { book: "online" },
  story:
    "Vaughn wurde ermordet! Finde heraus, wer es war. Der Mörder war allein mit dem Opfer in einem Bereich.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "R",
      name: "Empfang",
      at: "im Empfang",
      ground: "floor",
      tint: "#cfe3f3",
      label: { row: 2, col: 1 },
    },
    {
      key: "W",
      name: "Wartebereich",
      at: "im Wartebereich",
      ground: "floor",
      tint: "#bcd8f0",
      label: { row: 2, col: 4 },
    },
    {
      key: "S",
      name: "Lager",
      at: "im Lager",
      ground: "floor",
      tint: "#c9b3d6",
      label: { row: 1, col: 5 },
    },
    {
      key: "G",
      name: "Garage",
      at: "in der Garage",
      ground: "stone",
      tint: "#dbe9e6",
      label: { row: 5, col: 2 },
    },
  ],
  areaMap: ["RRRWSS", "RRRWWS", "RRRWWW", "RGGGGG", "GGGGGG", "GGGGGG"],
  thingMap: ["tct.ts", ".tt.p.", "..scc.", "...ss.", ".aao..", ".o.aa."],
  things: {
    t: "table",
    c: "chair",
    s: "shelf",
    p: "plant",
    a: "car",
    o: "oilSlick",
  },
  suspects: [
    {
      id: "A",
      name: "Anthony",
      pronoun: "er",
      clue: { text: "Er war in einem Auto.", ...on("car") },
      colour: "#b91c1c",
      face: "\u{1F471}‍♂️",
    },
    {
      id: "B",
      name: "Brock",
      pronoun: "er",
      traits: ["glasses"],
      clue: { text: "Er war auf einem Ölfleck.", ...on("oilSlick") },
      colour: "#15803d",
      face: "\u{1F468}",
    },
    {
      id: "C",
      name: "Crystal",
      pronoun: "sie",
      clue: { text: "Sie saß auf einem Stuhl.", ...on("seat") },
      colour: "#0e7490",
      face: "\u{1F469}‍\u{1F9B0}",
    },
    {
      id: "D",
      name: "Diane",
      pronoun: "sie",
      traits: ["glasses"],
      clue: {
        text: "Sie war allein im Wartebereich.",
        ...all(inArea("W"), alone()),
      },
      colour: "#6366f1",
      face: "\u{1F469}",
    },
    {
      id: "E",
      name: "Emilio",
      pronoun: "er",
      clue: { text: "Er war neben einem Regal.", ...beside("shelf") },
      colour: "#7c3aed",
      face: "\u{1F474}",
    },
    {
      id: "V",
      name: "Vaughn",
      pronoun: "er",
      clue: { text: "Er war allein mit dem Mörder.", ...victim() },
      colour: "#d97706",
      face: "\u{1F9D4}",
    },
  ],
  hints: [
    {
      text: "Da D allein im Wartebereich ist, kann C nur auf dem einzigen Stuhl am Empfang sitzen, in R1 C2.",
      place: { C: { row: 0, col: 1 } },
    },
    {
      text: "Das isoliert B auf dem letzten Feld mit Öllache.",
      place: { B: { row: 4, col: 3 } },
    },
    {
      text: "Das isoliert A auf dem letzten Feld in einem Auto.",
      place: { A: { row: 5, col: 4 } },
    },
    {
      text: "Das isoliert D auf dem letzten Feld im Wartebereich.",
      place: { D: { row: 2, col: 5 } },
    },
    {
      text: "Das isoliert E auf dem letzten Feld neben einem Regal, dann V auf dem letzten verbleibenden Feld.",
      place: { E: { row: 3, col: 2 }, V: { row: 1, col: 0 } },
    },
  ],
  solution: {
    A: { row: 5, col: 4 },
    B: { row: 4, col: 3 },
    C: { row: 0, col: 1 },
    D: { row: 2, col: 5 },
    E: { row: 3, col: 2 },
    V: { row: 1, col: 0 },
  },
};
