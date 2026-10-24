/**
 * Die Höhlen unter der Erde: an underground pond, a carving room, a common
 * room, a taming room and the entrance, with a murdered man.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/51.png`, no solution
 * sheet - part of the solved grid is pencilled in on the photographed page,
 * and the solver proves the rest). The cards show no estates and no area has
 * a crown.
 * Velok is the victim; whoever was alone with him killed him.
 *
 * The marked fields - a fish for a fisher, an axe for a toolmaker, spears
 * for a hunter, a wolf for a wolf tamer - can be stood on, and so can the
 * beds. The legend says there was one person of each role, so exactly one
 * person stood on the fields of each mark. The rocks, the pile of bones and
 * the dead tree cannot be stood on.
 */
import { about, counting, inArea, on, victim } from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** The marked fields: one person each of these roles, on its fields. */
const ROLES: readonly string[] = ["fishingSpot", "stoneAxe", "spear", "wolf"];

/** How many people stand on a field of this thing. */
function standingOn(c: Context, what: string): number {
  return c.people().filter((id) => {
    const there = c.cellOf(id);
    return there !== undefined && c.is(there, what);
  }).length;
}

/** Whether a man on a spear field stands in one's own area. */
function withTheHunter(c: Context): boolean {
  const here = c.areaOf(c.cell);
  return c.people().some((id) => {
    const there = c.cellOf(id);
    return (
      id !== c.self &&
      there !== undefined &&
      c.areaOf(there) === here &&
      c.is(there, "spear") &&
      c.has(id, "man")
    );
  });
}

/** The case. */
export const UNDERGROUND_CAVES: Level = {
  id: "underground-caves",
  name: "Die Höhlen unter der Erde",
  series: { book: "timeTravel", number: 51 },
  story:
    "Was für schöne Höhlenmalereien. Die großen roten Flecken sind sehr ausdrucksstark.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "W",
      name: "Unterirdischer Teich",
      at: "im unterirdischen Teich",
      ground: "water",
      tint: "#bcd9e6",
      label: { row: 1, col: 2 },
    },
    {
      key: "T",
      name: "Schnitzraum",
      at: "im Schnitzraum",
      ground: "stone",
      tint: "#cfc8dc",
      label: { row: 5, col: 0 },
    },
    {
      key: "K",
      name: "Gemeinschaftsraum",
      at: "im Gemeinschaftsraum",
      ground: "stone",
      tint: "#d6cfe2",
      label: { row: 4, col: 3 },
    },
    {
      key: "D",
      name: "Zähmraum",
      at: "im Zähmraum",
      ground: "stone",
      tint: "#ccc6d6",
      label: { row: 5, col: 6 },
      labelEnd: true,
    },
    {
      key: "E",
      name: "Eingang",
      at: "im Eingang",
      ground: "stone",
      tint: "#a9c6c4",
      label: { row: 6, col: 0 },
    },
  ],
  areaMap: [
    "WWWWWWW",
    "WTWWWWW",
    "TTKKWWW",
    "TTKKKDD",
    "TTTKKKD",
    "TTTEKKD",
    "EEEEEEE",
  ],
  thingMap: [
    "..f..f.",
    ".f.f..f",
    "r..s...",
    "wsdd.wb",
    "ara...w",
    "rsa.ddw",
    "..t.s..",
  ],
  things: {
    a: "stoneAxe",
    b: "bonePile",
    d: "bed",
    f: "fishingSpot",
    r: "boulder",
    s: "spear",
    t: "deadTree",
    w: "wolf",
  },
  extraThings: {
    deadTree: {
      name: "Toter Baum",
      emoji: "\u{1FAB5}",
      standable: false,
      kinds: ["plant", "tree"],
    },
  },
  pieces: [
    { at: { row: 3, col: 2 }, rows: 1, cols: 2 },
    { at: { row: 5, col: 4 }, rows: 1, cols: 2 },
  ],
  suspects: [
    {
      id: "A",
      name: "Arok",
      pronoun: "er",
      clue: { text: "Er war im Zähmraum.", ...inArea("D") },
      colour: "#57534e",
      face: "\u{1F9D4}",
    },
    {
      id: "B",
      name: "Branuk",
      pronoun: "er",
      clue: {
        text: "Er ist der Fischer: Er stand auf einem Feld mit einem Fisch.",
        ...on("fishingSpot"),
      },
      colour: "#1d4ed8",
      face: "\u{1F474}",
    },
    {
      id: "C",
      name: "Clega",
      pronoun: "sie",
      clue: {
        text: "Sie ist die Werkzeugmacherin: Sie stand auf einem Feld mit einer Axt.",
        ...on("stoneAxe"),
      },
      colour: "#be185d",
      face: "\u{1F469}",
    },
    {
      id: "D",
      name: "Daki",
      pronoun: "sie",
      clue: { text: "Sie war im Schnitzraum.", ...inArea("T") },
      colour: "#a16207",
      face: "\u{1F469}‍\u{1F9B1}",
    },
    {
      id: "E",
      name: "Evka",
      pronoun: "sie",
      clue: {
        text: "Sie war mit dem Jäger zusammen, und der war ein Mann.",
        ...counting(withTheHunter),
      },
      colour: "#15803d",
      face: "\u{1F467}",
    },
    {
      id: "F",
      name: "Fegu",
      pronoun: "er",
      clue: {
        text: "Clega war genau zwei Spalten westlich von ihm.",
        ...about(["C"], (c) => c.cellOf("C")?.col === c.cell.col - 2),
      },
      colour: "#ca8a04",
      face: "\u{1F468}‍\u{1F9B1}",
    },
    {
      id: "V",
      name: "Velok",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#9f1239",
      face: "\u{1F468}",
    },
  ],
  rules: [
    {
      text: "Es gab genau einen Fischer, eine Werkzeugmacherin, einen Jäger und einen Wolfszähmer: Auf den Fischfeldern, den Axtfeldern, den Speerfeldern und den Wolfsfeldern stand jeweils genau eine Person.",
      // Search only: no role may be taken twice.
      prune: (c) => ROLES.every((what) => standingOn(c, what) <= 1),
      check: (c) => ROLES.every((what) => standingOn(c, what) === 1),
    },
  ],
  hints: [
    {
      text: "Im Zähmraum kann man nur auf den Wölfen stehen (R4C7 ist ein Knochenhaufen) - Arok ist also der Wolfszähmer, in R4C6, R5C7 oder R6C7. Jede Rolle gab es nur einmal: Fische gehören Branuk, Äxte Clega, Speere dem Jäger, einem Mann. Daki bleibt im Schnitzraum nur das unmarkierte Feld R3C2.",
      place: { D: { row: 2, col: 1 } },
    },
    {
      text: "Der Jäger steht auf Speeren: R3C4 ist Dakis Zeile, R4C2 und R6C2 ihre Spalte - er steht in R7C5 im Eingang. Evka ist bei ihm im Eingang, aber nicht in seiner Zeile: R6C4.",
      place: { E: { row: 5, col: 3 } },
    },
    {
      text: "Clega steht auf einer Axt, R6C3 ist Evkas Zeile: R5C1 oder R5C3. Arok bleibt damit nur der Wolf in R4C6.",
      place: { A: { row: 3, col: 5 } },
    },
    {
      text: "Fegu ist zwei Spalten östlich von Clega, in Spalte 3 oder 5. In Spalte 3 bliebe ihm nur R2C3 (R1C3 ist Branuks Fisch) - dann hätte Branuk keinen Fisch mehr frei. Also ist Clega in R5C3 und Fegu in Spalte 5. Dort steht der Jäger in R7C5 - das ist Fegu.",
      place: { C: { row: 4, col: 2 }, F: { row: 6, col: 4 } },
    },
    {
      text: "Branuk steht auf einem Fisch: R1C3 ist Clegas Spalte, R1C6 Aroks, R2C4 Evkas - er steht in R2C7. Velok steht auf dem letzten Feld, R1C1 im Teich - allein mit Branuk. Branuk ist der Mörder!",
      place: { B: { row: 1, col: 6 }, V: { row: 0, col: 0 } },
    },
  ],
  solution: {
    A: { row: 3, col: 5 },
    B: { row: 1, col: 6 },
    C: { row: 4, col: 2 },
    D: { row: 2, col: 1 },
    E: { row: 5, col: 3 },
    F: { row: 6, col: 4 },
    V: { row: 0, col: 0 },
  },
};
