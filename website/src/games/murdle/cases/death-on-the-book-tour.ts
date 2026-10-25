/**
 * Case 19, "Death on the Book Tour": a bookseller killed on Logico's book
 * tour.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Elementary). One clue needs Exhibit
 * A: Logico's Detective Club member number is 6KLM. The photographed pages
 * print neither hint nor solution; the solver found the only one, and the
 * hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const DEATH_ON_THE_BOOK_TOUR: Case = {
  id: "death-on-the-book-tour",
  number: 19,
  title: "Tod auf der Lesereise",
  story:
    "Deductive Logicos Verlag schickte ihn auf Lesereise, um für Murdle zu werben. Einen der Termine musste der Verlag allerdings absagen, weil ein Buchhändler von einem seiner anderen Autoren ermordet worden war. Aus verlegerischer Ethik durfte man Logico aber nicht sagen, welcher Termin ausfiel. Das musste er selbst herausfinden.",
  series: "volume1",
  difficulty: "elementary",
  suspects: [
    {
      id: "tuscany",
      name: "Rektorin Tuscany",
      icon: "\u{1F393}",
      description:
        "Als Leiterin des Deduction College hat sie die besten Methoden deduziert, mit einem Mord davonzukommen. Natürlich nur in der Theorie!",
      heightCm: 165,
      hand: "left",
      eyes: "green",
      hair: "gray",
    },
    {
      id: "celadon",
      name: "Ministerin Celadon",
      icon: "\u{1FA96}",
      description:
        "Die Verteidigungsministerin - und persönlich verantwortlich für eine Reihe von Kriegsverbrechen, von denen einige inzwischen nach ihr benannt sind.",
      heightCm: 168,
      hand: "left",
      eyes: "green",
      hair: "lightBrown",
    },
    {
      id: "mauve",
      name: "Vizepräsidentin Mauve",
      icon: "\u{1F97D}",
      description:
        "Eine Vizepräsidentin von TekCo Futures. Wenn sie dich bittet, ihr Metaversum zu betreten: Lehne entschieden ab.",
      heightCm: 173,
      hand: "right",
      eyes: "darkBrown",
      hair: "black",
    },
  ],
  locations: [
    {
      id: "hollywood",
      name: "Hollywood",
      icon: "\u{1F3AC}",
      description:
        "Tinseltown, die Stadt der Engel, La La Land, die Traumfabrik.",
      indoors: false,
    },
    {
      id: "tektopia",
      name: "Tektopia",
      icon: "\u{1F3D9}️",
      description:
        "Ein Milliardär hat mitten in der Wüste eine vollautomatische Stadt gebaut. Sein Ziel: das Essen zu disruptieren. Es wird ihm gelingen.",
      indoors: false,
    },
    {
      id: "drakonia",
      name: "die Republik Drakonia",
      icon: "\u{1F3F0}",
      description:
        "Früher die Heilige Republik Drakonia, heute die Freie Republik Drakonia.",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "laptop",
      name: "ein Laptop",
      icon: "\u{1F4BB}",
      description:
        "Die Maschine, an der du arbeitest. Außerdem ist sie mit jeder Ablenkung verbunden, die es je gab.",
      weight: "medium",
    },
    {
      id: "candle",
      name: "eine vergiftete Kerze",
      icon: "\u{1F56F}️",
      description:
        "Zündest du diese Kerze an, stirbt jeder im Raum. Aber sie duftet herrlich nach Lavendel.",
      weight: "medium",
    },
    {
      id: "sextant",
      name: "ein Sextant",
      icon: "\u{1F9ED}",
      description:
        "Raus aus der Gosse mit den Gedanken - und denk wie ein Seemann.",
      weight: "medium",
    },
  ],
  clues: [
    {
      text: "Jeder in der Traumfabrik hat einen Laptop.",
      holds: (scene) =>
        scene.weaponOf(scene.at("hollywood").id).id === "laptop",
    },
    {
      text: "In der Republik Drakonia war kein Sextant - richtig, nicht ein einziger im ganzen Land.",
      holds: (scene) =>
        scene.locationOf(scene.holder("sextant").id).id !== "drakonia",
    },
    {
      text: "Ministerin Celadon weigerte sich, Hollywood zu besuchen, solange seine Filme das Militär nicht besser behandeln.",
      holds: (scene) => scene.locationOf("celadon").id !== "hollywood",
    },
    {
      text: "Den Sextanten hatte jemand, dessen Nachname mit einem der Buchstaben in Deductive Logicos Mitgliedsnummer im Detektivclub beginnt. (Siehe Beweisstück A.)",
      holds: (scene) => scene.holder("sextant").id === "mauve",
    },
  ],
  body: {
    text: "Die Leiche roch nach Lavendel.",
    location: "drakonia",
  },
  exhibits: ["detectiveKit"],
  solution: {
    tuscany: { weapon: "laptop", location: "hollywood" },
    celadon: { weapon: "candle", location: "drakonia" },
    mauve: { weapon: "sextant", location: "tektopia" },
  },
  murderer: "celadon",
  hints: [
    {
      text: 'Deductive Logico bekam einen mysteriösen Anruf, und die Person flüsterte: "Die Stadt, die das Essen disruptieren wird, hat zum Glück einen Sextanten." Was für ein bizarrer Scherzanruf.',
      book: true,
    },
    {
      text: "Logicos Mitgliedsnummer im Detektivclub ist 6KLM (Beweisstück A). Nur der Nachname von Vizepräsidentin Mauve beginnt mit einem dieser Buchstaben: Sie hatte den Sextanten.",
      marks: [{ a: "mauve", b: "sextant", value: "check" }],
    },
    {
      text: "Die Traumfabrik ist Hollywood: Wer dort war, hatte den Laptop. Mauve mit dem Sextanten war also nicht in Hollywood - und in Drakonia gab es keinen Sextanten. Mauve war in Tektopia.",
      marks: [
        { a: "laptop", b: "hollywood", value: "check" },
        { a: "mauve", b: "tektopia", value: "check" },
      ],
    },
    {
      text: "Ministerin Celadon mied Hollywood, also war sie in der Republik Drakonia. Rektorin Tuscany war in Hollywood, mit dem Laptop.",
      marks: [
        { a: "celadon", b: "drakonia", value: "check" },
        { a: "tuscany", b: "laptop", value: "check" },
        { a: "tuscany", b: "hollywood", value: "check" },
      ],
    },
    {
      text: "Celadon bleibt die vergiftete Kerze, und die duftet nach Lavendel: Ministerin Celadon tötete mit ihr in der Republik Drakonia.",
      marks: [
        { a: "celadon", b: "candle", value: "check" },
        { a: "candle", b: "drakonia", value: "check" },
        { a: "sextant", b: "tektopia", value: "check" },
      ],
    },
  ],
};
