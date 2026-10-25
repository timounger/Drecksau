/**
 * Case 49, "Death in the Dead Woods": a woman killed in the dead woods of the
 * island.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Occult Medium), from the photos of
 * the book. There is no body clue - the liar is the murderer. The scrambled
 * message reads "Tuscany had the rock"; here it is scrambled again in German,
 * letter by letter within each word. The solver found the only solution, and
 * the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const DEATH_IN_THE_DEAD_WOODS: Case = {
  id: "death-in-the-dead-woods",
  number: 49,
  title: "Tod im toten Wald",
  story:
    "Logico mochte diese Insel nicht. Irgendetwas stimmte nicht mit ihr. Irgendetwas stimmte nicht mit der Art, wie sie hierhergekommen waren. Und irgendetwas stimmte nicht mit Irratino, der keines dieser Rätsel zu genießen schien. Logico machte einen Spaziergang und sah, wie jemand in den toten Wald huschte. Er folgte ihr - doch als er sie einholte, war sie tot!",
  series: "volume1",
  difficulty: "occult",
  suspects: [
    {
      id: "tuscany",
      name: "Rektorin Tuscany",
      icon: "\u{1F393}",
      description:
        "Als Leiterin des Deduction College kennt sie jede erdenkliche Art, wie ein Mensch sterben kann. Die meisten davon in der Theorie.",
      heightCm: 165,
      hand: "left",
      eyes: "green",
      hair: "gray",
      sign: "libra",
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
      id: "grey",
      name: "Earl Grey",
      icon: "\u{1F9D0}",
      description:
        "Er stammt aus einer langen Reihe von Earl Greys. Ja, wie der Tee. Nein, er gibt keine Autogramme. Aber einen Beutel schenkt er dir, wenn du fragst.",
      heightCm: 175,
      hand: "right",
      eyes: "lightBrown",
      hair: "white",
      sign: "capricorn",
    },
  ],
  locations: [
    {
      id: "ancient-ruins",
      name: "die uralten Ruinen",
      icon: "\u{1F3DB}️",
      description:
        "Sie scheinen von einer unbeschreiblichen Aura zu pulsieren.",
      indoors: false,
    },
    {
      id: "gnarled-tree",
      name: "der knorrige Baum",
      icon: "\u{1F333}",
      description:
        "In unmöglichen Winkeln verbogen und verdreht. Er sieht aus wie eine Hexe.",
      indoors: false,
    },
    {
      id: "moving-cave",
      name: "die wandernde Höhle",
      icon: "⛰️",
      description:
        "Jedes Mal, wenn man diese Höhle findet, scheint sie an einer anderen Stelle zu sein.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "candle",
      name: "eine Gebetskerze",
      icon: "\u{1F56F}️",
      description:
        "Falls du dafür gebetet hast, dass jemand stirbt: Dein Wunsch ist in Erfüllung gegangen.",
      weight: "medium",
    },
    {
      id: "monkey",
      name: "ein dressierter Affe",
      icon: "\u{1F412}",
      description:
        "Er lauert im Wald ... Vielleicht beobachtet er uns gerade jetzt.",
      weight: "heavy",
    },
    {
      id: "rock",
      name: "ein Stein",
      icon: "\u{1FAA8}",
      description:
        "Ein ganz gewöhnlicher Stein. Aber seltsamerweise nicht von dieser Insel. Angeschlagen.",
      weight: "medium",
    },
  ],
  clues: [
    {
      text: "Man würde denken, der Affe sitze oben in dem knorrigen Baum: Da liegt man falsch.",
      holds: (scene) =>
        scene.locationOf(scene.holder("monkey").id).id !== "gnarled-tree",
    },
    {
      text: "Jemand gab Logico hastig eine wichtige, durcheinandergewürfelte Nachricht: UNACSYT TEHTA NDE NITSE.",
      holds: (scene) => scene.weaponOf("tuscany").id === "rock",
    },
  ],
  statements: [
    {
      by: "tuscany",
      text: "Als Akademikerin kann ich Ihnen sagen: Sir Rulean hat eine Gebetskerze mitgebracht.",
      holds: (scene) => scene.weaponOf("rulean").id === "candle",
    },
    {
      by: "rulean",
      text: "Eine Gebetskerze war bei den uralten Ruinen.",
      holds: (scene) =>
        scene.locationOf(scene.holder("candle").id).id === "ancient-ruins",
    },
    {
      by: "grey",
      text: "Ich war nicht bei den uralten Ruinen.",
      holds: (scene) => scene.locationOf("grey").id !== "ancient-ruins",
    },
  ],
  exhibits: ["astrology"],
  solution: {
    tuscany: { weapon: "rock", location: "ancient-ruins" },
    rulean: { weapon: "candle", location: "gnarled-tree" },
    grey: { weapon: "monkey", location: "moving-cave" },
  },
  murderer: "rulean",
  hints: [
    {
      text: "Inspektor Irratino benahm sich seltsam. Doch als Logico nachfragte, sagte er, er sehe eigentlich nur per Fernwahrnehmung einen Tropfen Wachs an einem knorrigen Baum.",
      book: true,
    },
    {
      text: 'Die Nachricht, Wort für Wort entwürfelt: "TUSCANY HATTE DEN STEIN." Rektorin Tuscany hatte den Stein.',
      marks: [{ a: "tuscany", b: "rock", value: "check" }],
    },
    {
      text: "Probiere aus, wer lügt. Lügt Tuscany, hatte Sir Rulean den Affen und Earl Grey die Gebetskerze. Rulean sagt dann die Wahrheit: Die Kerze war bei den Ruinen - also auch Grey. Dann lügt auch Grey. Zwei Lügner gehen nicht.",
      marks: [
        { a: "rulean", b: "candle", value: "check" },
        { a: "grey", b: "monkey", value: "check" },
      ],
    },
    {
      text: "Also sagt Tuscany die Wahrheit: Sir Rulean hatte die Gebetskerze, Earl Grey den dressierten Affen.",
    },
    {
      text: "Lügt Earl Grey, war er bei den Ruinen. Rulean sagt dann die Wahrheit, und Ruleans Kerze wäre auch bei den Ruinen. Das geht nicht.",
    },
    {
      text: "Also lügt Sir Rulean - er ist der Mörder. Seine Kerze war nicht bei den Ruinen, und Grey war laut eigener Aussage auch nicht dort: Tuscany war bei den uralten Ruinen.",
      marks: [{ a: "tuscany", b: "ancient-ruins", value: "check" }],
    },
    {
      text: "Der Affe war nicht beim knorrigen Baum, also war Grey in der wandernden Höhle. Sir Rulean tötete die Frau mit der Gebetskerze beim knorrigen Baum.",
      marks: [
        { a: "grey", b: "moving-cave", value: "check" },
        { a: "monkey", b: "moving-cave", value: "check" },
        { a: "rulean", b: "gnarled-tree", value: "check" },
        { a: "candle", b: "gnarled-tree", value: "check" },
        { a: "rock", b: "ancient-ruins", value: "check" },
      ],
    },
  ],
};
