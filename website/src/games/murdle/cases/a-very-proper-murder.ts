/**
 * Case 14, "A Very Proper Murder": the richest man in Dame Obsidian's
 * Victorian London killed.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Elementary). The label of the
 * Investigation Institute is faded in the photo; like the other two places it
 * is indoors. The sample prints the book's hint; the solver found the only
 * solution, and the other hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const A_VERY_PROPER_MURDER: Case = {
  id: "a-very-proper-murder",
  number: 14,
  title: "Ein überaus feiner Mord",
  story:
    "Als Nächstes las Logico ein Buch, das im viktorianischen London spielte - der Hauptstadt des Whodunits! Es beruhte offensichtlich auf gründlicher Recherche, aber die Dame spielte alle großen Hits: blutige Briefe, ein Schuhabdruck im Schnee und der Mord am reichsten Mann der Stadt, dem Tausendär Lord Lavender.",
  series: "volume1",
  difficulty: "elementary",
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
    },
    {
      id: "grey",
      name: "Earl Grey",
      icon: "\u{1F9D0}",
      description:
        "Er stammt aus einer kürzeren (aber immer noch langen) Reihe von Earl Greys. Und dieser Earl Grey gibt Autogramme - aber die Teebeutel kosten extra.",
      heightCm: 175,
      hand: "right",
      eyes: "lightBrown",
      hair: "white",
    },
    {
      id: "eminence",
      name: "Viscount Eminence",
      icon: "\u{1F474}",
      description:
        "Der älteste Mann, den du je gesehen hast. Man sagt, er habe alle seine Söhne überlebt und sei vor seinem Vater geboren worden.",
      heightCm: 157,
      hand: "left",
      eyes: "gray",
      hair: "darkBrown",
    },
  ],
  locations: [
    {
      id: "institute",
      name: "das Ermittlungsinstitut",
      icon: "\u{1F3DB}\u{FE0F}",
      description:
        "Eine kürzlich gegründete Organisation, die den Spiritismus und verwandte Phänomene untersucht.",
      indoors: true,
    },
    {
      id: "mansion",
      name: "ein möglicherweise verwunschenes Herrenhaus",
      icon: "\u{1F47B}",
      description:
        "Hier sehen die Leute ständig Geister, besonders am Ofen im Keller.",
      indoors: true,
    },
    {
      id: "coffee-house",
      name: "ein Kaffeehaus",
      icon: "☕",
      description:
        "Hier trinkt man Kaffee und bespricht die neuesten schaurigen Vorfälle.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "knife",
      name: "ein Messer",
      icon: "\u{1F52A}",
      description:
        "Kein berühmtes Messer. Nur ein ganz normales. Aber vielleicht wird es ja bald berühmt!",
      weight: "medium",
    },
    {
      id: "plague",
      name: "die Pest",
      icon: "\u{1F9A0}",
      description:
        "Na ja, nicht die Pest, aber eine von denen, die gerade umgehen.",
      weight: "light",
    },
    {
      id: "scepter",
      name: "ein juwelenbesetztes Zepter",
      icon: "⚜️",
      description:
        "Teil der Kronjuwelen und, wie die meisten von ihnen, aus einem anderen Land gestohlen.",
      weight: "heavy",
    },
  ],
  clues: [
    {
      text: "Ein Messer wurde im Hauptquartier einer kürzlich gegründeten Organisation gefunden.",
      holds: (scene) =>
        scene.locationOf(scene.holder("knife").id).id === "institute",
    },
    {
      text: "Viscount Eminence hasste Geister, deshalb war er nicht einmal in der Nähe des möglicherweise verwunschenen Herrenhauses gewesen.",
      holds: (scene) => scene.locationOf("eminence").id !== "mansion",
    },
    {
      text: "Baron Maroons Liebesaffäre mit der Person, die die Pest mitgebracht hatte, war der wichtigste Nebenstrang der Handlung.",
      holds: (scene) => scene.holder("plague").id !== "maroon",
    },
    {
      text: "Fingerabdrücke auf dem juwelenbesetzten Zepter bewiesen, dass es eine linkshändige verdächtige Person gehalten hatte.",
      holds: (scene) => scene.holder("scepter").hand === "left",
    },
  ],
  body: {
    text: "Lord Lavenders Leiche wurde neben einer zerbrochenen Kaffeetasse gefunden.",
    location: "coffee-house",
  },
  solution: {
    maroon: { weapon: "knife", location: "institute" },
    grey: { weapon: "plague", location: "mansion" },
    eminence: { weapon: "scepter", location: "coffee-house" },
  },
  murderer: "eminence",
  hints: [
    {
      text: 'Auf die Impressumsseite hatte jemand gekritzelt: "Baron Maroon war das erste Mitglied des Ermittlungsinstituts."',
      book: true,
      marks: [{ a: "maroon", b: "institute", value: "check" }],
    },
    {
      text: "Linkshänder ist nur Viscount Eminence: Er hatte das Zepter.",
      marks: [{ a: "eminence", b: "scepter", value: "check" }],
    },
    {
      text: "Baron Maroon hatte nicht die Pest, also das Messer. Earl Grey bleibt die Pest.",
      marks: [
        { a: "maroon", b: "knife", value: "check" },
        { a: "grey", b: "plague", value: "check" },
      ],
    },
    {
      text: "Das Messer lag im Ermittlungsinstitut: Dort war Baron Maroon. Viscount Eminence mied das Herrenhaus, also war er im Kaffeehaus, und Earl Grey im Herrenhaus.",
      marks: [
        { a: "knife", b: "institute", value: "check" },
        { a: "grey", b: "mansion", value: "check" },
        { a: "eminence", b: "coffee-house", value: "check" },
      ],
    },
    {
      text: "Die zerbrochene Kaffeetasse lag im Kaffeehaus - dort war Viscount Eminence, mit dem Zepter.",
      marks: [
        { a: "scepter", b: "coffee-house", value: "check" },
        { a: "plague", b: "mansion", value: "check" },
      ],
    },
  ],
};
