/**
 * Case 7, "A Quaint Little Village Slaying": a vicar killed in Dame
 * Obsidian's village.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Elementary), from the photos of the
 * book. Its body clue names the weapon, not the place (strangled with yarn);
 * the murderer is whoever had it. The solver found the only solution, and the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const A_QUAINT_LITTLE_VILLAGE_SLAYING: Case = {
  id: "a-quaint-little-village-slaying",
  number: 7,
  title: "Ein beschaulicher kleiner Dorfmord",
  story:
    'Deductive Logico reiste in Dame Obsidians beschauliches kleines Dorf und lernte dort sofort ein neues Wort: "Vikar". Er wusste nicht, was es bedeutete, aber er wusste, wie man es in einem Satz verwendet, etwa: "Der Vikar wurde ermordet, und ich finde heraus, wer es war."',
  series: "volume1",
  difficulty: "elementary",
  suspects: [
    {
      id: "obsidian",
      name: "Dame Obsidian",
      icon: "\u{1F452}",
      description:
        "Eines ihrer berühmtesten Bücher handelt von einer Krimiautorin, die einer unschuldigen Zauberin einen Mord anhängt. Verdächtig!",
      heightCm: 163,
      hand: "left",
      eyes: "green",
      hair: "black",
    },
    {
      id: "verdigris",
      name: "Diakonin Verdigris",
      icon: "\u{1F453}",
      description:
        "Eine Diakonin der Kirche. Sie verwaltet die Spenden der Gemeinde und manchmal auch deren Geheimnisse.",
      heightCm: 160,
      hand: "left",
      eyes: "blue",
      hair: "gray",
    },
    {
      id: "grey",
      name: "Earl Grey",
      icon: "\u{1F9D0}",
      description:
        "Er stammt aus einer langen Reihe von Earl Greys. Ja, wie der Tee. Nein, er gibt keine Autogramme. Aber einen Beutel schenkt er dir, wenn du fragst.",
      heightCm: 175,
      hand: "right",
      eyes: "lightBrown",
      hair: "white",
    },
  ],
  locations: [
    {
      id: "manor",
      name: "das Herrenhaus",
      icon: "\u{1F3F0}",
      description:
        "Das der Dame. Es hängt voller riesiger Porträts vieler Generationen toter reicher weißer Männer.",
      indoors: true,
    },
    {
      id: "chapel",
      name: "die Kapelle",
      icon: "⛪",
      description:
        "Eine winzige Kirche voller Buntglasfenster und Geheimnisse.",
      indoors: true,
    },
    {
      id: "ruins",
      name: "die alten Ruinen",
      icon: "\u{1F5FF}",
      description:
        "Schon wieder diese Steinsäulen! In jede ist ein seltsames Labyrinth eingemeißelt.",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "cyanide",
      name: "ein Fläschchen Zyankali",
      icon: "☠️",
      description:
        "Ein Gift, das nach Mandeln duftet. Es vertreibt aber auch Kopfschmerzen (zum Beispiel den Ehemann).",
      weight: "light",
    },
    {
      id: "shears",
      name: "eine Gartenschere",
      icon: "✂️",
      description:
        "Gärtnern ist ein tolles Hobby. Aber ehrlich gesagt kommt man leichter an gute Tomaten, wenn man dafür tötet.",
      weight: "medium",
    },
    {
      id: "yarn",
      name: "Wolle",
      icon: "\u{1F9F6}",
      description:
        "Wenn man merkt, dass man eine Masche verloren hat, könnte man auch einfach jemanden erdrosseln.",
      weight: "light",
    },
  ],
  clues: [
    {
      text: "Logico roch Mandeln unter einem Buntglasfenster.",
      holds: (scene) =>
        scene.locationOf(scene.holder("cyanide").id).id === "chapel",
    },
    {
      text: "Dame Obsidian war nicht in ihrem Herrenhaus. Und auch in keinem anderen Herrenhaus.",
      holds: (scene) => scene.locationOf("obsidian").id !== "manor",
    },
    {
      text: "Ja, er besaß ein Teeimperium, aber Earl Grey hat nie gegärtnert, und mit einer Gartenschere in der Hand ließe er sich nicht einmal tot erwischen.",
      holds: (scene) => scene.holder("shears").id !== "grey",
    },
    {
      text: "Diakonin Verdigris besuchte die alten Ruinen, um für einen Artikel über die heidnischen Bräuche der Gegend vor der Ankunft der Kirche zu recherchieren.",
      holds: (scene) => scene.locationOf("verdigris").id === "ruins",
    },
  ],
  body: {
    text: "Der Vikar wurde erdrosselt - höchst peinlich - mit einem Knäuel Wolle.",
    weapon: "yarn",
  },
  solution: {
    obsidian: { weapon: "cyanide", location: "chapel" },
    verdigris: { weapon: "shears", location: "ruins" },
    grey: { weapon: "yarn", location: "manor" },
  },
  murderer: "grey",
  hints: [
    {
      text: 'Ein Botenjunge drückte Logico einen Zettel in die Hand, auf dem nur stand: "Ich habe in eine Flamme gestarrt und die Wahrheit erschaut: Die Diakonin hatte die Gartenschere!"',
      book: true,
      marks: [{ a: "verdigris", b: "shears", value: "check" }],
    },
    {
      text: "Diakonin Verdigris war bei den alten Ruinen.",
      marks: [{ a: "verdigris", b: "ruins", value: "check" }],
    },
    {
      text: "Dame Obsidian war nicht im Herrenhaus, also in der Kapelle. Earl Grey bleibt das Herrenhaus.",
      marks: [
        { a: "obsidian", b: "chapel", value: "check" },
        { a: "grey", b: "manor", value: "check" },
      ],
    },
    {
      text: "Nach Mandeln riecht das Zyankali, Buntglasfenster hat die Kapelle: Dame Obsidian hatte das Zyankali.",
      marks: [
        { a: "obsidian", b: "cyanide", value: "check" },
        { a: "cyanide", b: "chapel", value: "check" },
      ],
    },
    {
      text: "Earl Grey hatte keine Gartenschere, also die Wolle. Diakonin Verdigris hatte die Gartenschere.",
      marks: [{ a: "grey", b: "yarn", value: "check" }],
    },
    {
      text: "Erdrosselt wurde der Vikar mit Wolle - die hatte Earl Grey, im Herrenhaus.",
      marks: [
        { a: "yarn", b: "manor", value: "check" },
        { a: "shears", b: "ruins", value: "check" },
      ],
    },
  ],
};
