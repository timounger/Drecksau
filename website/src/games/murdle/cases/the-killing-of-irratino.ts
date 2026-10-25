/**
 * Case 50, "The Killing of Irratino": Inspector Irratino, struck down at the
 * lighthouse of the island.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Occult Medium), from the photos of
 * the book. There is no body clue - the liar is the murderer. The book spells
 * its message with the symbols of Exhibit B, each standing for the first
 * letter of its English name: SCORPIO HAD ROPE (the alchemical symbols for
 * Oil, Radium, Iron, Hematite, Dissolve and Earth among them). The German
 * names of those symbols cannot spell a German sentence, so here the message
 * is two symbols, as in case 46: the sign of Scorpio from Exhibit B and the
 * rope's own symbol. The label of "the light itself" is blurred in the photo;
 * at the top of the lighthouse it is taken as indoors, which no clue depends
 * on. The solver found the only solution, and the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const THE_KILLING_OF_IRRATINO: Case = {
  id: "the-killing-of-irratino",
  number: 50,
  title: "Der Mord an Irratino",
  story:
    "Als Deductive Logico aus dem toten Wald zurückging, sah er, dass jemand das Licht des Leuchtturms angezündet hatte! Und dann hörte er einen Schrei - unverkennbar den Schrei von Inspektor Irratino! Logico rannte zum Leuchtturm, aber er kam zu spät. Irratino war bewusstlos und schwer verletzt. Während sich die Schiffbrüchigen um ihn kümmerten, machte sich Logico daran, den Fall zu knacken.",
  series: "volume1",
  difficulty: "occult",
  suspects: [
    {
      id: "maroon",
      name: "Baron Maroon",
      icon: "\u{1F451}",
      description:
        "Ein unglaublich hochmütiger und nachtragender Mann. Niemand will den Baron kränken. Zumindest niemand, der noch lebt ...",
      heightCm: 188,
      hand: "right",
      eyes: "hazel",
      hair: "red",
      sign: "scorpio",
    },
    {
      id: "rulean",
      name: "Sir Rulean",
      icon: "\u{1F6E1}️",
      description:
        "Ein kultivierter Gentleman, der erst kürzlich zum Ritter geschlagen wurde - wenn man den schäbigen Papieren glaubt, die er bei sich trägt.",
      heightCm: 173,
      hand: "right",
      eyes: "blue",
      hair: "red",
      sign: "leo",
    },
    {
      id: "lapis",
      name: "Schwester Lapis",
      icon: "\u{1F9D5}",
      description:
        "Eine Nonne, die die Welt bereist und Gottes Werk auf Seine Kosten verrichtet. Ihr Habit ist aus Kaschmir, und ihre Gewohnheit ist das Geldausgeben.",
      heightCm: 157,
      hand: "right",
      eyes: "lightBrown",
      hair: "lightBrown",
      sign: "cancer",
    },
  ],
  locations: [
    {
      id: "light",
      name: "das Leuchtfeuer selbst",
      icon: "\u{1F525}",
      description:
        "Jetzt brennt es mit einem schrecklichen Feuer, das alle Seefahrer warnt: Bleibt weg!",
      indoors: true,
    },
    {
      id: "cove",
      name: "eine abgelegene Bucht",
      icon: "\u{1F980}",
      description:
        "Eine sandige Bucht, in der die Schiffbrüchigen Irratino auf eine Trage gelegt haben. Er ist noch zu benommen, um zu sprechen.",
      indoors: false,
    },
    {
      id: "generator",
      name: "der Generator",
      icon: "⚡",
      description: "Eine gewaltige Maschine, die die Insel mit Kohle versorgt.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "rock",
      name: "ein Stein",
      icon: "\u{1FAA8}",
      description:
        "Damit wurde der allererste Mord begangen - und wahrscheinlich auch der letzte.",
      weight: "medium",
    },
    {
      id: "oil",
      name: "eine Flasche Öl",
      icon: "\u{1F9F4}",
      description:
        "Genug Öl, um das Feuer am Brennen zu halten - oder um sie jemandem über den Kopf zu ziehen.",
      weight: "light",
    },
    {
      id: "rope",
      name: "ein Seemannstau",
      icon: "\u{1FAA2}",
      description:
        "Wer diese Leute gefesselt hat, kannte offensichtlich keine Seemannsknoten.",
      weight: "medium",
    },
  ],
  clues: [
    {
      text: "Sir Rulean konnte die Person, die eine Flasche Öl mitgebracht hat, noch nie leiden.",
      holds: (scene) => scene.holder("oil").id !== "rulean",
    },
    {
      text: "Eine Mitarbeiterin des Ermittlungsinstituts steckte Deductive Logico eine weitere Nachricht zu (siehe Beweisstück B): ♏ \u{1FAA2}",
      holds: (scene) => scene.holder("rope").sign === "scorpio",
    },
  ],
  statements: [
    {
      by: "maroon",
      text: "Schwester Lapis war nicht beim Leuchtfeuer selbst.",
      holds: (scene) => scene.locationOf("lapis").id !== "light",
    },
    {
      by: "rulean",
      text: "Eine Flasche Öl war beim Generator.",
      holds: (scene) =>
        scene.locationOf(scene.holder("oil").id).id === "generator",
    },
    {
      by: "lapis",
      text: "Ein Stein war nicht beim Generator.",
      holds: (scene) =>
        scene.locationOf(scene.holder("rock").id).id !== "generator",
    },
  ],
  exhibits: ["astrology"],
  solution: {
    maroon: { weapon: "rope", location: "generator" },
    rulean: { weapon: "rock", location: "light" },
    lapis: { weapon: "oil", location: "cove" },
  },
  murderer: "rulean",
  hints: [
    {
      text: "Deductive Logico erkannte die verschlüsselte Nachricht des Ermittlungsinstituts aus Fall 46 wieder: Eine Kreuzfahrt zum Sterben 2.",
      book: true,
    },
    {
      text: 'Die Nachricht: ♏ ist laut Beweisstück B der Skorpion, \u{1FAA2} das Symbol des Seemannstaus - "Der Skorpion hatte das Seemannstau." Skorpion ist nur Baron Maroon. (Im Buch ist die Nachricht mit den Symbolen aus Beweisstück B buchstabiert, nach den Anfangsbuchstaben ihrer englischen Namen: SCORPIO HAD ROPE.)',
      marks: [{ a: "maroon", b: "rope", value: "check" }],
    },
    {
      text: "Sir Rulean hatte die Flasche Öl nicht, also den Stein. Schwester Lapis hatte das Öl.",
      marks: [{ a: "rulean", b: "rock", value: "check" }],
    },
    {
      text: "Probiere aus, wer lügt. Lügt Baron Maroon, war Lapis beim Leuchtfeuer. Rulean sagt dann die Wahrheit: Das Öl - also Lapis - war beim Generator. Das geht nicht.",
    },
    {
      text: "Also war Lapis nicht beim Leuchtfeuer. Lügt Schwester Lapis, war der Stein - also Rulean - beim Generator. Rulean sagt dann die Wahrheit, und Lapis mit dem Öl wäre ebenfalls beim Generator. Das geht nicht.",
      marks: [{ a: "lapis", b: "light", value: "cross" }],
    },
    {
      text: "Also lügt Sir Rulean - er ist der Täter. Das Öl war nicht beim Generator: Lapis war in der abgelegenen Bucht. Lapis sagt die Wahrheit: Rulean mit dem Stein war nicht beim Generator, also beim Leuchtfeuer.",
      marks: [
        { a: "lapis", b: "cove", value: "check" },
        { a: "rulean", b: "light", value: "check" },
        { a: "rock", b: "light", value: "check" },
      ],
    },
    {
      text: "Baron Maroon war mit dem Seemannstau beim Generator. Sir Rulean schlug Irratino mit dem Stein beim Leuchtfeuer nieder.",
      marks: [
        { a: "maroon", b: "generator", value: "check" },
        { a: "rope", b: "generator", value: "check" },
        { a: "lapis", b: "oil", value: "check" },
        { a: "oil", b: "cove", value: "check" },
      ],
    },
  ],
};
