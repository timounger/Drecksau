/**
 * Case 15, "The Perplexing Problem of the Parrot": Blackbeard's parrot
 * murdered in one of Dame Obsidian's pirate novels.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Elementary). Two clues go by height,
 * so the suspects are a constant the clues can rank. The sample prints
 * neither hint nor solution; the solver found the only one, and the hints are
 * our own.
 */
import type { Case, Suspect } from "../engine/types";

/** The suspects, ranked by height in two clues. */
const SUSPECTS: readonly Suspect[] = [
  {
    id: "blackbeard",
    name: "Schwarzbart",
    icon: "\u{1F3F4}\u{200D}\u{2620}\u{FE0F}",
    description: "Berühmt, gefürchtet, respektiert - wegen des Barts.",
    heightCm: 213,
    hand: "right",
    eyes: "black",
    hair: "black",
  },
  {
    id: "bluebeard",
    name: "Blaubart",
    icon: "\u{1F9D4}",
    description:
      "Eigentlich ein französischer Frauenmörder und überhaupt kein Pirat.",
    heightCm: 198,
    hand: "left",
    eyes: "blue",
    hair: "blue",
  },
  {
    id: "nobeard",
    name: "Keinbart",
    icon: "\u{1FA92}",
    description:
      "Früher hieß er Rotbart, aber dann hat er sich rasiert. Ein Teilzeitpirat.",
    heightCm: 175,
    hand: "right",
    eyes: "green",
    hair: "red",
  },
];

/** The case. */
export const THE_PERPLEXING_PROBLEM_OF_THE_PARROT: Case = {
  id: "the-perplexing-problem-of-the-parrot",
  number: 15,
  title: "Das perplexe Papageienproblem",
  story:
    "Arrr! Der nächste Obsidian-Roman spielte in der Welt der Piraten, voller Nervenkitzel, Gänsehaut und bunter Bärte. Logico war gefesselt von der Wendung im ersten Akt, als Schwarzbarts Papagei ermordet wurde. Oh Mann, dachte Logico, wer sich mit Schwarzbart anlegt, steckt in Schwierigkeiten!",
  series: "volume1",
  difficulty: "elementary",
  suspects: SUSPECTS,
  locations: [
    {
      id: "whirlpool",
      name: "der Große Strudel",
      icon: "\u{1F300}",
      description:
        "Offenbar ist da ein großes Loch im Meer, und das ganze Wasser läuft ab.",
      indoors: false,
    },
    {
      id: "cove",
      name: "die Piratenbucht",
      icon: "\u{1F980}",
      description:
        "Hier trinken alle Piraten und planen, wo sie ihren Schatz vergraben. (Vielleicht bei den alten Ruinen ...)",
      indoors: false,
    },
    {
      id: "ship",
      name: "das Piratenschiff",
      icon: "⛵",
      description:
        "Jo-ho-ho, ein Piratenleben für mich - und, unvermeidlich, auch ein Piratentod.",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "cannon",
      name: "eine Kanone",
      icon: "\u{1F4A3}",
      description:
        "Normalerweise tötet man damit mehr als eine Person (oder einen Papagei), aber Ausnahmen sind möglich.",
      weight: "heavy",
    },
    {
      id: "scimitar",
      name: "ein Krummsäbel",
      icon: "\u{1F5E1}\u{FE0F}",
      description:
        "Genau genommen nur ein verbogenes Schwert, aber Krummsäbel klingt einfach cool.",
      weight: "medium",
    },
    {
      id: "map",
      name: "eine falsche Schatzkarte",
      icon: "\u{1F5FA}\u{FE0F}",
      description: "Diese Karte führt geradewegs in eine Fallgrube.",
      weight: "light",
    },
  ],
  clues: [
    {
      text: "Entweder hatte Blaubart einen Krummsäbel mitgebracht, oder eine falsche Schatzkarte war auf dem Piratenschiff.",
      holds: (scene) =>
        scene.weaponOf("bluebeard").id === "scimitar" ||
        scene.locationOf(scene.holder("map").id).id === "ship",
    },
    {
      text: "Die zweitgrößte verdächtige Person wurde dort gesehen, wo ein Pirat lebt und stirbt.",
      holds: (scene) => scene.at("ship").id === tallest(2),
    },
    {
      text: "Die falsche Schatzkarte drehte sich draußen auf dem Meer in riesigen Kreisen und löste sich im Salzwasser auf.",
      holds: (scene) =>
        scene.locationOf(scene.holder("map").id).id === "whirlpool",
    },
    {
      text: "Die kleinste verdächtige Person misstraute der Person mit der Kanone.",
      holds: (scene) => scene.holder("cannon").id !== tallest(SUSPECTS.length),
    },
  ],
  body: {
    text: "Der Papagei trieb im Wasser der Piratenbucht.",
    location: "cove",
  },
  solution: {
    blackbeard: { weapon: "cannon", location: "cove" },
    bluebeard: { weapon: "scimitar", location: "ship" },
    nobeard: { weapon: "map", location: "whirlpool" },
  },
  murderer: "blackbeard",
  hints: [
    {
      text: 'Logico blätterte ans Ende des Buches und fand einen Hinweis, den jemand hineingeschrieben hatte: "In Kapitel 5 steht, dass die Piratenbucht zur Selbstverteidigung eine Kanone hatte!"',
      book: true,
      marks: [{ a: "cannon", b: "cove", value: "check" }],
    },
    {
      text: "Die Schatzkarte trieb im Großen Strudel, also nicht auf dem Piratenschiff. Damit muss Blaubart den Krummsäbel gehabt haben.",
      marks: [
        { a: "map", b: "whirlpool", value: "check" },
        { a: "bluebeard", b: "scimitar", value: "check" },
      ],
    },
    {
      text: "Zweitgrößter ist Blaubart (1,98 m): Er war auf dem Piratenschiff, wo ein Pirat lebt und stirbt.",
      marks: [{ a: "bluebeard", b: "ship", value: "check" }],
    },
    {
      text: "Kleinster ist Keinbart (1,75 m): Er hatte nicht die Kanone, also die Schatzkarte - und war damit im Großen Strudel. Schwarzbart bleiben die Kanone und die Piratenbucht.",
      marks: [
        { a: "nobeard", b: "map", value: "check" },
        { a: "nobeard", b: "whirlpool", value: "check" },
        { a: "blackbeard", b: "cannon", value: "check" },
        { a: "blackbeard", b: "cove", value: "check" },
      ],
    },
    {
      text: "Der Papagei trieb in der Piratenbucht - dort war Schwarzbart, mit der Kanone.",
      marks: [{ a: "scimitar", b: "ship", value: "check" }],
    },
  ],
};

/**
 * A suspect by their rank in height.
 *
 * @param rank - 1 for the tallest, the number of suspects for the shortest
 * @returns their id
 */
function tallest(rank: number): string {
  const ranked = [...SUSPECTS].sort(
    (one, other) => other.heightCm - one.heightCm,
  );
  return ranked[rank - 1]?.id ?? "";
}
