/**
 * The tutorial: Deductive Logico's very first case, at Deduction College.
 *
 * @module
 * @remarks
 * From "How to Solve" in Murdle: Volume 1 by G. T. Karber, pages 1-9. The
 * book walks through the whole solution; its steps are the hints here.
 */
import type { Case } from "../engine/types";

/** The case. */
export const DEDUCTION_COLLEGE: Case = {
  id: "deduction-college",
  number: null,
  title: "Der erste Fall am Deduction College",
  story:
    "Der Präsident der Studierendenvertretung wurde ermordet. Der junge Logico, damals im dritten Studienjahr am Deduction College, war sicher: Einer von drei Leuten war es.",
  series: "volume1",
  difficulty: "tutorial",
  suspects: [
    {
      id: "honey",
      name: "Bürgermeister Honey",
      icon: "\u{1F3A9}",
      description:
        "Er weiß, wo die Leichen vergraben sind - und sorgt dafür, dass sie immer für ihn stimmen.",
      heightCm: 183,
      hand: "left",
      eyes: "hazel",
      hair: "lightBrown",
    },
    {
      id: "glaucous",
      name: "Dekan Glaucous",
      icon: "\u{1F454}",
      description:
        "Dekan irgendeines Fachbereichs am Deduction College. Was er so macht? Nun, unter anderem verwaltet er das Geld ...",
      heightCm: 168,
      hand: "right",
      eyes: "lightBrown",
      hair: "lightBrown",
    },
    {
      id: "tuscany",
      name: "Rektorin Tuscany",
      icon: "\u{1F393}",
      description:
        "Als Leiterin des Deduction College hat sie genau deduziert, wie viel reiche Eltern für einen Abschluss ihrer Kinder in Logik zu zahlen bereit sind.",
      heightCm: 165,
      hand: "left",
      eyes: "green",
      hair: "blond",
    },
  ],
  locations: [
    {
      id: "stadium",
      name: "das Stadion",
      icon: "\u{1F3DF}️",
      description:
        "Auf dem Spielfeld liegt der allerbeste Kunstrasen, den man für Geld kaufen kann.",
      indoors: false,
    },
    {
      id: "bookstore",
      name: "die Buchhandlung",
      icon: "\u{1F4DA}",
      description:
        "Die größte Geldquelle auf dem Campus. Ein Schild wirbt mit zwei Lehrbüchern für 500 Dollar.",
      indoors: true,
    },
    {
      id: "old-main",
      name: "das Alte Hauptgebäude",
      icon: "\u{1F3DB}️",
      description:
        "Das erste Gebäude auf dem Campus und das am schlechtesten gepflegte. Die Farbe blättert von der Wand!",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "pencil",
      name: "ein gespitzter Bleistift",
      icon: "✏️",
      description:
        "Damals noch mit echtem Blei. Ein Stich, und man starb an Bleivergiftung.",
      weight: "light",
    },
    {
      id: "backpack",
      name: "ein schwerer Rucksack",
      icon: "\u{1F392}",
      description:
        "Endlich ein praktischer Nutzen für all die Logiklehrbücher (Leute damit verprügeln).",
      weight: "heavy",
    },
    {
      id: "cord",
      name: "eine Abschlusskordel",
      icon: "\u{1F397}️",
      description:
        "Es wäre eine hohe akademische Ehre, mit so einer erdrosselt zu werden.",
      weight: "light",
    },
  ],
  clues: [
    {
      text: "Wer im Stadion war, war Rechtshänder.",
      holds: (scene) => scene.at("stadium").hand === "right",
    },
    {
      text: "Wer den gespitzten Bleistift hatte, konnte die Person im Alten Hauptgebäude nicht ausstehen.",
      holds: (scene) => scene.holder("pencil").id !== scene.at("old-main").id,
    },
    {
      text: "Wer die Abschlusskordel hatte, hatte wunderschöne haselnussbraune Augen.",
      holds: (scene) => scene.holder("cord").eyes === "hazel",
    },
    {
      text: "Dekan Glaucous schien ständig jede Menge Logiklehrbücher mit sich herumzutragen.",
      holds: (scene) => scene.weaponOf("glaucous").id === "backpack",
    },
  ],
  body: {
    text: "Die Leiche wurde neben abblätternder Farbe gefunden.",
    location: "old-main",
  },
  solution: {
    honey: { weapon: "cord", location: "old-main" },
    glaucous: { weapon: "backpack", location: "stadium" },
    tuscany: { weapon: "pencil", location: "bookstore" },
  },
  murderer: "honey",
  hints: [
    {
      text: "Wer im Stadion war, war Rechtshänder - und Rechtshänder ist nur Dekan Glaucous. Er war also im Stadion: Haken setzen, den Rest seiner Zeile und Spalte ausstreichen.",
      book: true,
      marks: [{ a: "glaucous", b: "stadium", value: "check" }],
    },
    {
      text: "Wer den Bleistift hatte, konnte die Person im Alten Hauptgebäude nicht ausstehen - das sind also zwei verschiedene Leute. Der Bleistift war nicht im Alten Hauptgebäude.",
      book: true,
      marks: [{ a: "pencil", b: "old-main", value: "cross" }],
    },
    {
      text: "Haselnussbraune Augen hat nur Bürgermeister Honey: Er hatte die Abschlusskordel.",
      book: true,
      marks: [{ a: "honey", b: "cord", value: "check" }],
    },
    {
      text: "Logiklehrbücher? Die stehen in der Beschreibung des schweren Rucksacks. Dekan Glaucous hatte ihn - und damit bleibt für Rektorin Tuscany der Bleistift.",
      book: true,
      marks: [{ a: "tuscany", b: "pencil", value: "check" }],
    },
    {
      text: "Abblätternde Farbe gibt es laut Beschreibung im Alten Hauptgebäude. Dort geschah der Mord.",
      book: true,
    },
    {
      text: "Tuscany hatte den Bleistift, und der war nicht im Alten Hauptgebäude - also war sie in der Buchhandlung. Bleibt Bürgermeister Honey im Alten Hauptgebäude: Er ist der Mörder, mit der Abschlusskordel.",
      book: true,
      marks: [
        { a: "tuscany", b: "bookstore", value: "check" },
        { a: "pencil", b: "bookstore", value: "check" },
        { a: "honey", b: "old-main", value: "check" },
        { a: "cord", b: "old-main", value: "check" },
        { a: "glaucous", b: "backpack", value: "check" },
        { a: "backpack", b: "stadium", value: "check" },
      ],
    },
  ],
  outro:
    "Rektorin Tuscany war von seiner gründlichen Arbeit beeindruckt und gab ihm eine Eins plus. Bürgermeister Honey gewann die Wiederwahl trotzdem haushoch - dank seiner populistischen Tiraden gegen die Tyrannei der Logik.",
};
