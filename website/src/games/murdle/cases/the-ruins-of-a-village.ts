/**
 * Case 56, "The Ruins of a Village": the missing shopkeep of the quaint
 * little village of case 7.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Hard Boiled), from the photos of the
 * book. Mister Shadow's card blacks out his height and his hair; no clue
 * needs them. The bold clue names the weapon; the murderer is whoever had it.
 * The photographed pages print neither hint nor solution; the solver found
 * the only one, and the hints are our own.
 */
import { REDACTED_HEIGHT } from "../engine/types";
import type { Case } from "../engine/types";

/** The case. */
export const THE_RUINS_OF_A_VILLAGE: Case = {
  id: "the-ruins-of-a-village",
  number: 56,
  title: "Ein Dorf in Trümmern",
  story:
    "Deductive Logico kehrte in das beschauliche kleine Dorf zurück, in dem er Dame Obsidian zum ersten Mal gefolgt war. Inzwischen stand die Hälfte der Häuser zum Verkauf. Die andere Hälfte stand leer. Eine geheimnisvolle Gestalt lief durch den Ort, und niemand wusste, wo der Ladenbesitzer war. Dann fand Logico eine Tatwaffe - und wusste, was mit dem Ladenbesitzer geschehen war.",
  series: "volume1",
  difficulty: "hardBoiled",
  suspects: [
    {
      id: "shadow",
      name: "Mister Shadow",
      icon: "🕵️",
      description:
        "Eine Silhouette im Schatten. Er bewegt sich wie der Wind und sieht aus wie die Nacht.",
      heightCm: REDACTED_HEIGHT,
      hand: "left",
      eyes: "green",
      hair: "redacted",
      sign: "aquarius",
    },
    {
      id: "mango",
      name: "Pater Mango",
      icon: "✝️",
      description:
        "Er hat ein Armutsgelübde abgelegt, fährt aber BMW. Er hat Gehorsam gelobt, hat aber fünfundzwanzig Angestellte. Und er hat Keuschheit gelobt - deshalb ist er im Urlaub.",
      heightCm: 178,
      hand: "left",
      eyes: "darkBrown",
      hair: "bald",
      sign: "taurus",
    },
    {
      id: "lavender",
      name: "Lord Lavender",
      icon: "🎼",
      description:
        "Ein konservatives Mitglied des britischen Oberhauses und zugleich der Musicalkomponist hinter Hits wie Der Schatten des Orchesters: Alles stirbt.",
      heightCm: 175,
      hand: "right",
      eyes: "green",
      hair: "gray",
      sign: "virgo",
    },
    {
      id: "copper",
      name: "Polizistin Copper",
      icon: "👮‍♀️",
      description:
        "Das Beste daran, als Polizistin kriminell zu sein: Man spart sich den Mittelsmann und ermittelt einfach nicht gegen die eigenen Verbrechen.",
      heightCm: 165,
      hand: "right",
      eyes: "blue",
      hair: "blond",
      sign: "aries",
    },
  ],
  locations: [
    {
      id: "development",
      name: "das Neubaugebiet",
      icon: "🏗️",
      description:
        "Dieses Neubaugebiet wird die Gemeinde entweder wiederbeleben oder ruinieren - je nachdem, wen man fragt.",
      indoors: false,
    },
    {
      id: "ruins",
      name: "die alten Ruinen",
      icon: "🗿",
      description: "Ob sie wohl eine Art Leuchtfeuer waren?",
      indoors: false,
    },
    {
      id: "chapel",
      name: "die Kapelle",
      icon: "⛪",
      description: "Eine winzige Kirche mit Buntglasfenstern und Geheimnissen.",
      indoors: true,
    },
    {
      id: "garden",
      name: "der malerische Garten",
      icon: "🌸",
      description:
        "Ein malerischer kleiner Garten für Kräuter und Blumen. Aber in letzter Zeit sind dort neue Erdhügel aufgetaucht - von verdächtiger Größe und Form.",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "yarn",
      name: "Wolle",
      icon: "🧶",
      description:
        "Wenn man merkt, dass man eine Masche verloren hat, könnte man manchmal einfach jemanden erwürgen.",
      weight: "light",
      material: "Wolle",
    },
    {
      id: "flintlock",
      name: "eine antike Steinschlosspistole",
      icon: "🔫",
      description: "Sie zu laden dauert nur fünfundzwanzig Minuten.",
      weight: "medium",
      material: "Holz und Metall",
    },
    {
      id: "needle",
      name: "eine Stricknadel",
      icon: "🪡",
      description:
        "Damit kann man einen Pullover stricken. Oder eine Garrotte.",
      weight: "light",
      material: "Metall",
    },
    {
      id: "cyanide",
      name: "ein Fläschchen Zyankali",
      icon: "☠️",
      description:
        "Gift mit Mandelduft in einem malerischen kleinen Fläschchen.",
      weight: "light",
      material: "Glas und Chemikalien",
    },
  ],
  motives: [
    { id: "idea", name: "eine Idee stehlen", icon: "💡" },
    { id: "scam", name: "für einen Immobilienbetrug", icon: "🏠" },
    { id: "body", name: "eine Leiche stehlen", icon: "💀" },
    { id: "bear", name: "einen Bären verscheuchen", icon: "🐻" },
  ],
  clues: [
    {
      text: "Wer die Wolle hatte, war Rechtshänder.",
      holds: (scene) => scene.holder("yarn").hand === "right",
    },
    {
      text: "Lord Lavender war nicht im malerischen Garten gewesen.",
      holds: (scene) => scene.locationOf("lavender").id !== "garden",
    },
    {
      text: "Wer eine Idee stehlen wollte, hatte grüne Augen.",
      holds: (scene) => scene.driven("idea").eyes === "green",
    },
    {
      text: "Pater Mango wurde gesehen, wie er unter einem Buntglasfenster herumlungerte.",
      holds: (scene) => scene.locationOf("mango").id === "chapel",
    },
    {
      text: "Wer eine Leiche stehlen wollte, war in den alten Ruinen.",
      holds: (scene) =>
        scene.locationOf(scene.driven("body").id).id === "ruins",
    },
    {
      text: "Wer im Neubaugebiet war, hatte eine mittelschwere Waffe.",
      holds: (scene) =>
        scene.weaponOf(scene.at("development").id).weight === "medium",
    },
    {
      text: "Wer für einen Immobilienbetrug töten würde, war Wassermann.",
      holds: (scene) => scene.driven("scam").sign === "aquarius",
    },
    {
      text: "Wer einen Bären verscheuchen will, braucht eine Waffe aus Metall.",
      holds: (scene) =>
        scene.weaponOf(scene.driven("bear").id).material?.includes("Metall") ===
        true,
    },
  ],
  body: {
    text: "Logico fand eine Stricknadel, die voller Blut war.",
    weapon: "needle",
  },
  solution: {
    shadow: { weapon: "cyanide", location: "garden", motive: "scam" },
    mango: { weapon: "needle", location: "chapel", motive: "bear" },
    lavender: { weapon: "flintlock", location: "development", motive: "idea" },
    copper: { weapon: "yarn", location: "ruins", motive: "body" },
  },
  murderer: "mango",
  hints: [
    {
      text: "Logico wusste aus seiner Zeit mit Irratino ganz intuitiv, dass die Polizistin diejenige mit der Wolle war.",
      book: true,
      marks: [{ a: "copper", b: "yarn", value: "check" }],
    },
    {
      text: "Der einzige Wassermann ist Mister Shadow: Er wollte für einen Immobilienbetrug töten. Grüne Augen haben Shadow und Lord Lavender - also wollte Lavender eine Idee stehlen.",
      marks: [
        { a: "shadow", b: "scam", value: "check" },
        { a: "lavender", b: "idea", value: "check" },
      ],
    },
    {
      text: "Pater Mango lungerte unter einem Buntglasfenster - in der Kapelle. Leiche und Bär bleiben für Mango und Polizistin Copper. Wer die Leiche stehlen wollte, war in den Ruinen, Mango aber in der Kapelle: Copper wollte die Leiche stehlen und war in den Ruinen, Mango wollte einen Bären verscheuchen.",
      marks: [
        { a: "mango", b: "chapel", value: "check" },
        { a: "mango", b: "bear", value: "check" },
        { a: "copper", b: "ruins", value: "check" },
        { a: "copper", b: "body", value: "check" },
        { a: "ruins", b: "body", value: "check" },
        { a: "chapel", b: "bear", value: "check" },
      ],
    },
    {
      text: "Lavender war nicht im Garten, nicht in der Kapelle und nicht in den Ruinen, also im Neubaugebiet - mit einer mittelschweren Waffe, und die einzige ist die Steinschlosspistole. Shadow war im malerischen Garten.",
      marks: [
        { a: "lavender", b: "flintlock", value: "check" },
        { a: "lavender", b: "development", value: "check" },
        { a: "flintlock", b: "development", value: "check" },
        { a: "shadow", b: "garden", value: "check" },
      ],
    },
    {
      text: "Mango brauchte für den Bären Metall: Die Pistole hat Lavender, also hatte Mango die Stricknadel. Die Wolle hatte ein Rechtshänder - Copper. Shadow blieb das Zyankali.",
      marks: [
        { a: "mango", b: "needle", value: "check" },
        { a: "needle", b: "bear", value: "check" },
        { a: "shadow", b: "cyanide", value: "check" },
      ],
    },
    {
      text: "Die blutige Stricknadel war die Tatwaffe: Pater Mango war es, mit der Stricknadel, in der Kapelle, um einen Bären zu verscheuchen.",
      marks: [
        { a: "needle", b: "chapel", value: "check" },
        { a: "cyanide", b: "garden", value: "check" },
        { a: "cyanide", b: "scam", value: "check" },
        { a: "garden", b: "scam", value: "check" },
        { a: "flintlock", b: "idea", value: "check" },
        { a: "development", b: "idea", value: "check" },
        { a: "yarn", b: "ruins", value: "check" },
        { a: "yarn", b: "body", value: "check" },
      ],
    },
  ],
};
