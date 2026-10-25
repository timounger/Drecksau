/**
 * Case 63, "The Body in the Snowdrift": Brother Brownstone, killed before he
 * could tell Logico something of grave importance.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Hard Boiled), from the photos of the
 * book. The suspect Bruder Brownstone is the victim's brother, not a monk.
 * The solver found the only solution, and the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const THE_BODY_IN_THE_SNOWDRIFT: Case = {
  id: "the-body-in-the-snowdrift",
  number: 63,
  title: "Die Leiche in der Schneewehe",
  story:
    "Deductive Logico bekam einen Brief aus einem Kloster. Bruder Brownstone wollte mit ihm über etwas von todernster Bedeutung sprechen. Doch als Logico im Kloster ankam, war Bruder Brownstone bereits ermordet worden!",
  series: "volume1",
  difficulty: "hardBoiled",
  suspects: [
    {
      id: "mango",
      name: "Pater Mango",
      icon: "✝️",
      description:
        "Pater Mango hätte noch jahrelang gern Priester in der Kirche bleiben können. Sie hatte nur eine Regel: sich nicht beim Morden erwischen lassen. Jetzt sitzt er in diesem Kloster fest.",
      heightCm: 178,
      hand: "left",
      eyes: "darkBrown",
      hair: "bald",
      sign: "taurus",
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
    {
      id: "brownstone",
      name: "Bruder Brownstone",
      icon: "\u{1F9D4}",
      description:
        "Der Bruder von Bruder Brownstone. Ein Bruder der Kirche ist er nicht - nur eben Brownstones Bruder.",
      heightCm: 163,
      hand: "left",
      eyes: "darkBrown",
      hair: "darkBrown",
      sign: "capricorn",
    },
  ],
  locations: [
    {
      id: "courtyard",
      name: "der Innenhof",
      icon: "⛲",
      description:
        "Gerade liegt dort eine Schneewehe, aber normalerweise ist es da ganz hübsch.",
      indoors: false,
    },
    {
      id: "library",
      name: "die verbotene Bibliothek",
      icon: "\u{1F4D5}",
      description: "Hier stehen die Bücher, die die Mönche nicht lesen dürfen.",
      indoors: true,
    },
    {
      id: "chapel",
      name: "die Kapelle",
      icon: "⛪",
      description: "Hier hört man die Mönche gut beten und schlecht singen.",
      indoors: true,
    },
    {
      id: "cliffs",
      name: "die Klippen",
      icon: "\u{1F3D4}️",
      description:
        "Warum bauen die Leute eigentlich immer an Klippen? Und immer über spitzen Felsen?",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "beads",
      name: "eine Gebetskette",
      icon: "\u{1F4FF}",
      description:
        "Eine Gebetskette aus Elfenbein, bedeckt mit winzigen eingravierten Symbolen.",
      weight: "light",
      material: "Elfenbein",
    },
    {
      id: "candle",
      name: "eine Gebetskerze",
      icon: "\u{1F56F}️",
      description: "Wer dafür gebetet hat, dass jemand stirbt, wurde erhört.",
      weight: "medium",
      material: "Wachs",
    },
    {
      id: "wine",
      name: "Messwein",
      icon: "\u{1F377}",
      description:
        "Seine Hingabe zeigt man am besten, indem man viel von diesem heiligen Rotwein trinkt.",
      weight: "medium",
      material: "Glas und Wein",
    },
    {
      id: "oil",
      name: "eine Flasche heiliges Öl",
      icon: "\u{1F6E2}️",
      description:
        "Kein Massageöl oder so. Es ist Erdöl. Aber trotzdem heilig.",
      weight: "light",
      material: "Öl und Giftstoffe",
    },
  ],
  motives: [
    { id: "father", name: "den Vater rächen", icon: "\u{1F468}" },
    { id: "tough", name: "beweisen, wie hart man ist", icon: "\u{1F4AA}" },
    { id: "madness", name: "aus Wahnsinn", icon: "\u{1F92A}" },
    { id: "religion", name: "aus religiösen Gründen", icon: "\u{1F64F}" },
  ],
  clues: [
    {
      text: "Wer aus Wahnsinn töten würde, war Rechtshänder.",
      holds: (scene) => scene.driven("madness").hand === "right",
    },
    {
      text: "Wer die Flasche heiliges Öl hatte, wollte den Vater rächen. Es war nämlich das heilige Öl des Vaters.",
      holds: (scene) => scene.motiveOf(scene.holder("oil").id)?.id === "father",
    },
    {
      text: "Ein Stier liebte den Messwein. Vielleicht zu sehr.",
      holds: (scene) => scene.holder("wine").sign === "taurus",
    },
    {
      text: "Die Gebetskette durfte nicht nach draußen, und niemand brach diese Regel.",
      holds: (scene) => scene.locationOf(scene.holder("beads").id).indoors,
    },
    {
      text: "Diakonin Verdigris wurde draußen umherirrend gesehen.",
      holds: (scene) => !scene.locationOf("verdigris").indoors,
    },
    {
      text: "Eine mit winzigen eingravierten Symbolen bedeckte Waffe brachte die Person mit, die aus religiösen Gründen töten wollte.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("beads").id)?.id === "religion",
    },
    {
      text: "Wer auf den Klippen war, hatte hellbraune Augen.",
      holds: (scene) => scene.at("cliffs").eyes === "lightBrown",
    },
    {
      text: "Die zweitgrößte verdächtige Person lauschte schiefem Gesang.",
      holds: (scene) => scene.locationOf("brownstone").id === "chapel",
    },
  ],
  body: {
    text: "Die Leiche wurde in einer Schneewehe gefunden.",
    location: "courtyard",
  },
  exhibits: ["astrology"],
  solution: {
    mango: { weapon: "wine", location: "library", motive: "tough" },
    verdigris: { weapon: "oil", location: "courtyard", motive: "father" },
    lapis: { weapon: "candle", location: "cliffs", motive: "madness" },
    brownstone: { weapon: "beads", location: "chapel", motive: "religion" },
  },
  murderer: "verdigris",
  hints: [
    {
      text: 'Eines Tages sang einer der Mönche in Kapuzenkutten: "Ein heiliger roter Fleck war auf verbotenen Büchern." Erkannte Logico die Stimme?',
      book: true,
    },
    {
      text: "Hellbraune Augen hat nur Schwester Lapis: Sie war auf den Klippen. Rechtshänderin ist auch nur sie - sie würde aus Wahnsinn töten.",
      marks: [{ a: "lapis", b: "cliffs", value: "check" }],
    },
    {
      text: "Diakonin Verdigris war draußen, die Klippen hatte Lapis - also war Verdigris im Innenhof mit der Schneewehe. Sie ist die Mörderin.",
      marks: [{ a: "verdigris", b: "courtyard", value: "check" }],
    },
    {
      text: "Pater Mango (1,78 m) ist der Größte, Bruder Brownstone (1,63 m) der Zweitgrößte: Brownstone hörte in der Kapelle den schiefen Gesang. Für Mango bleibt die verbotene Bibliothek.",
      marks: [
        { a: "brownstone", b: "chapel", value: "check" },
        { a: "mango", b: "library", value: "check" },
      ],
    },
    {
      text: "Stier ist nur Pater Mango: Er hatte den Messwein. Die Gebetskette war drinnen, also nicht bei Verdigris oder Lapis - Brownstone hatte sie. Sie ist mit Symbolen bedeckt: Brownstone wollte aus religiösen Gründen töten.",
      marks: [
        { a: "mango", b: "wine", value: "check" },
        { a: "brownstone", b: "beads", value: "check" },
        { a: "brownstone", b: "religion", value: "check" },
      ],
    },
    {
      text: "Wer das heilige Öl hatte, wollte den Vater rächen - nicht Lapis (Wahnsinn). Also hatte Verdigris das Öl und wollte ihren Vater rächen, und Lapis die Gebetskerze. Mango wollte beweisen, wie hart er ist.",
      marks: [
        { a: "lapis", b: "madness", value: "check" },
        { a: "verdigris", b: "father", value: "check" },
        { a: "lapis", b: "candle", value: "check" },
        { a: "mango", b: "tough", value: "check" },
        { a: "wine", b: "library", value: "check" },
        { a: "wine", b: "tough", value: "check" },
        { a: "library", b: "tough", value: "check" },
        { a: "verdigris", b: "oil", value: "check" },
        { a: "oil", b: "courtyard", value: "check" },
        { a: "oil", b: "father", value: "check" },
        { a: "courtyard", b: "father", value: "check" },
        { a: "candle", b: "cliffs", value: "check" },
        { a: "candle", b: "madness", value: "check" },
        { a: "cliffs", b: "madness", value: "check" },
        { a: "beads", b: "chapel", value: "check" },
        { a: "beads", b: "religion", value: "check" },
        { a: "chapel", b: "religion", value: "check" },
      ],
    },
  ],
};
