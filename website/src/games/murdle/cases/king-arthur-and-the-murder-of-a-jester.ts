/**
 * Case 67, "King Arthur and the Murder of a Jester": a court jester whose
 * murder reportedly started a decades-long war.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Hard Boiled), from the photos of the
 * book. The scrambled text reads "The Duke of Vermillion was seen with
 * Excalibur"; here it is scrambled again in German, letter by letter within
 * each word. The solver found the only solution, and the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const KING_ARTHUR_AND_THE_MURDER_OF_A_JESTER: Case = {
  id: "king-arthur-and-the-murder-of-a-jester",
  number: 67,
  title: "König Artus und der Mord am Hofnarren",
  story:
    "Deductive Logico tauchte tiefer in die Vergangenheit ein, in die früheste Geschichte, und stieß dort auf Bruchstücke einer weniger bekannten Legende von König Artus. Angeblich begann ein jahrzehntelanger Krieg mit dem Mord an einem Hofnarren - aber Logico fand, dass hier etwas faul war, und zwar nicht der Witz.",
  series: "volume1",
  difficulty: "hardBoiled",
  suspects: [
    {
      id: "lavender",
      name: "Lord Lavender",
      icon: "\u{1F3BC}",
      description:
        "Ein unerschütterlicher Ultra-Royalist am Hof und zugleich der Barde hinter Das Gespenst der Burg und Die Sternenkutsche.",
      heightCm: 175,
      hand: "right",
      eyes: "green",
      hair: "gray",
      sign: "virgo",
    },
    {
      id: "violet",
      name: "Lady Violet",
      icon: "\u{1F478}",
      description:
        "Die Entdeckerin der Veilcheninseln, die nach ihr benannt sind.",
      heightCm: 152,
      hand: "right",
      eyes: "blue",
      hair: "blond",
      sign: "virgo",
    },
    {
      id: "vermillion",
      name: "Der Herzog von Vermillion",
      icon: "\u{1F934}",
      description:
        "Der Urgroßvater hoch dreiundsiebzig des heutigen Herzogs von Vermillion.",
      heightCm: 175,
      hand: "left",
      eyes: "gray",
      hair: "white",
      sign: "pisces",
    },
    {
      id: "rulean",
      name: "Sir Rulean",
      icon: "\u{1F6E1}️",
      description:
        "Der alte Ritter, von dem der falsche Sir Rulean seinen Namen wahrscheinlich gestohlen hat.",
      heightCm: 173,
      hand: "right",
      eyes: "blue",
      hair: "red",
      sign: "leo",
    },
  ],
  locations: [
    {
      id: "avalon",
      name: "Avalon",
      icon: "\u{1F334}",
      description:
        "Eine magische und geheimnisvolle Insel - wie die meisten Inseln aus Legenden.",
      indoors: false,
    },
    {
      id: "ruins",
      name: "die alten Ruinen",
      icon: "\u{1F5FF}",
      description: "Schon zur Zeit der Artussagen standen diese Steine hier.",
      indoors: false,
    },
    {
      id: "camelot",
      name: "Camelot",
      icon: "\u{1F3F0}",
      description:
        "Der große Hof von König Artus, wo die Ungleichheit nur ein kleines bisschen geringer war als heute.",
      indoors: true,
    },
    {
      id: "lake",
      name: "der verzauberte See",
      icon: "\u{1F30A}",
      description:
        "In einem Teich wohnt eine Dame, die Schwerter nach Vorbeigehenden wirft. Das Leben war damals gefährlich.",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "wine",
      name: "eine Flasche Wein",
      icon: "\u{1F377}",
      description: "Vorsicht vor Flecken - das Rot geht nicht mehr raus.",
      weight: "medium",
      material: "Glas und Alkohol",
    },
    {
      id: "helmet",
      name: "ein antiker Helm",
      icon: "\u{1FA96}",
      description: "Er ist rostig und sieht großartig aus.",
      weight: "heavy",
      material: "Metall",
    },
    {
      id: "excalibur",
      name: "Excalibur",
      icon: "⚔️",
      description:
        "Das uralte Schwert der Legende. Entweder aus dem See geworfen oder aus einem Stein gezogen - so genau weiß man das nicht.",
      weight: "heavy",
      material: "Metall",
    },
    {
      id: "grail",
      name: "der Gral",
      icon: "\u{1F3C6}",
      description:
        "Der Heilige Gral oder vielleicht nur ein goldener Becher. Aber wertvoll so oder so!",
      weight: "medium",
      material: "Metall",
    },
  ],
  motives: [
    { id: "logical", name: "weil es logisch war", icon: "\u{1F9E0}" },
    { id: "body", name: "eine Leiche stehlen", icon: "\u{1F480}" },
    { id: "religion", name: "aus religiösen Gründen", icon: "\u{1F64F}" },
    { id: "dare", name: "als Mutprobe", icon: "❗" },
  ],
  clues: [
    {
      text: "Lord Lavender wurde beim Zechen mit einer Frau gesehen, die unter Wasser lebt.",
      holds: (scene) => scene.locationOf("lavender").id === "lake",
    },
    {
      text: "Wer den antiken Helm hatte, wollte nicht als Mutprobe töten.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("helmet").id)?.id !== "dare",
    },
    {
      text: "Wer den Gral hatte, hatte ein Motiv, aus religiösen Gründen zu töten.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("grail").id)?.id === "religion",
    },
    {
      text: "Ein Stück des Textes war verwürfelt: RDE ZOGHER NOV MILLIONVER DWURE TIM BACLIXUER HESGENE.",
      holds: (scene) => scene.holder("excalibur").id === "vermillion",
    },
    {
      text: "Die zweitkleinste verdächtige Person wurde in den alten Ruinen gesehen.",
      holds: (scene) => scene.locationOf("rulean").id === "ruins",
    },
    {
      text: "Wer die Flasche Wein hatte, trank genug, um eine Leiche stehlen zu wollen.",
      holds: (scene) => scene.motiveOf(scene.holder("wine").id)?.id === "body",
    },
    {
      text: "Lord Lavender wollte keine Leiche stehlen. Dafür war er sich zu fein!",
      holds: (scene) => scene.motiveOf("lavender")?.id !== "body",
    },
    {
      text: "Wer töten würde, weil es logisch war, war in Avalon und dachte dort logisch nach.",
      holds: (scene) =>
        scene.locationOf(scene.driven("logical").id).id === "avalon",
    },
  ],
  body: {
    text: "Die Leiche wurde in Camelot gefunden.",
    location: "camelot",
  },
  solution: {
    lavender: { weapon: "grail", location: "lake", motive: "religion" },
    violet: { weapon: "helmet", location: "avalon", motive: "logical" },
    vermillion: { weapon: "excalibur", location: "camelot", motive: "dare" },
    rulean: { weapon: "wine", location: "ruins", motive: "body" },
  },
  murderer: "vermillion",
  hints: [
    {
      text: 'Logico schlug das Buch zu und an einer zufälligen Stelle wieder auf, eine Technik, die Irratino "Bibliomantie" nannte, und erfuhr so, dass Sir Rulean in den alten Ruinen gewesen war.',
      book: true,
      marks: [{ a: "rulean", b: "ruins", value: "check" }],
    },
    {
      text: 'Der Text, Wort für Wort entwürfelt: "DER HERZOG VON VERMILLION WURDE MIT EXCALIBUR GESEHEN." Der Herzog hatte also Excalibur.',
      marks: [{ a: "vermillion", b: "excalibur", value: "check" }],
    },
    {
      text: "Die Frau unter Wasser ist die Dame im verzauberten See: Dort war Lord Lavender. Lady Violet (1,52 m) ist die Kleinste, Sir Rulean (1,73 m) der Zweitkleinste - er war in den alten Ruinen.",
      marks: [{ a: "lavender", b: "lake", value: "check" }],
    },
    {
      text: "Lavender wollte keine Leiche stehlen, hatte also nicht den Wein. Hätte er den Helm, wollte er nicht als Mutprobe töten, nicht logisch (er war nicht in Avalon) und nicht aus religiösen Gründen (die hat, wer den Gral hat) - das geht nicht. Lavender hatte den Gral und tötete aus religiösen Gründen.",
      marks: [
        { a: "wine", b: "body", value: "check" },
        { a: "helmet", b: "avalon", value: "check" },
        { a: "helmet", b: "logical", value: "check" },
        { a: "grail", b: "religion", value: "check" },
        { a: "avalon", b: "logical", value: "check" },
        { a: "lavender", b: "grail", value: "check" },
        { a: "lavender", b: "religion", value: "check" },
      ],
    },
    {
      text: "Wein und Helm bleiben für Violet und Rulean. Hätte Rulean den Helm, wollte er weder eine Mutprobe noch logisch handeln (er war nicht in Avalon) - und eine Leiche stehlen will, wer den Wein hat. Also hatte Rulean den Wein und wollte eine Leiche stehlen.",
      marks: [
        { a: "violet", b: "helmet", value: "check" },
        { a: "rulean", b: "wine", value: "check" },
        { a: "rulean", b: "body", value: "check" },
      ],
    },
    {
      text: "Violet hatte den Helm, also keine Mutprobe: Sie handelte logisch und war in Avalon. Für den Herzog von Vermillion bleiben die Mutprobe und Camelot - er ist der Mörder, mit Excalibur.",
      marks: [
        { a: "violet", b: "avalon", value: "check" },
        { a: "violet", b: "logical", value: "check" },
        { a: "vermillion", b: "camelot", value: "check" },
        { a: "vermillion", b: "dare", value: "check" },
        { a: "excalibur", b: "camelot", value: "check" },
        { a: "excalibur", b: "dare", value: "check" },
        { a: "camelot", b: "dare", value: "check" },
        { a: "grail", b: "lake", value: "check" },
        { a: "lake", b: "religion", value: "check" },
        { a: "wine", b: "ruins", value: "check" },
        { a: "ruins", b: "body", value: "check" },
      ],
    },
  ],
};
