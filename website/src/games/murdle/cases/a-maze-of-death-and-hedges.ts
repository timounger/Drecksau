/**
 * Case 58, "A Maze of Death and Hedges": the gardener of Dame Obsidian's
 * abandoned manor house, dead in its overgrown hedge maze.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Hard Boiled), from the photos of the
 * book. The book prints Lord Lavender's hair as blond here; it stays gray as
 * in the other cases - no clue asks for it. The tea bag is the poisoned tea.
 * The bold clue names the weapon; the murderer is whoever had it. The
 * photographed pages print neither hint nor solution; the solver found the
 * only one, and the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const A_MAZE_OF_DEATH_AND_HEDGES: Case = {
  id: "a-maze-of-death-and-hedges",
  number: 58,
  title: "Auf Leben und Hecke",
  story:
    "Deductive Logico ging durch das Heckenlabyrinth am verlassenen Herrenhaus von Dame Obsidian. Wie die Hecken am Ermittlungsinstitut waren auch diese verwildert, und die Wege waren nicht mehr gerade. Wie sich herausstellte, war der Gärtner ermordet worden.",
  series: "volume1",
  difficulty: "hardBoiled",
  suspects: [
    {
      id: "eminence",
      name: "Viscount Eminence",
      icon: "👴",
      description:
        "Der älteste Mann, den du je gesehen hast. Man sagt, er sei schon alt gewesen, als dein Großvater geboren wurde, und er werde noch alt sein, wenn deine Enkel sterben.",
      heightCm: 157,
      hand: "left",
      eyes: "gray",
      hair: "darkBrown",
      sign: "pisces",
    },
    {
      id: "lavender",
      name: "Lord Lavender",
      icon: "🎼",
      description:
        "Ein konservatives Mitglied des britischen Oberhauses und zugleich der Musicalkomponist hinter Hits wie Mary und der wunderbare schwarz-weiße Hosenanzug und Mirta.",
      heightCm: 175,
      hand: "right",
      eyes: "green",
      hair: "gray",
      sign: "virgo",
    },
    {
      id: "vermillion",
      name: "Die Herzogin von Vermillion",
      icon: "👵",
      description:
        "Eine große, alte Frau mit großen, alten Geheimnissen. Wenn sie die Mörderin ist, dann wäre es nicht das erste Mal.",
      heightCm: 175,
      hand: "left",
      eyes: "gray",
      hair: "white",
      sign: "pisces",
    },
    {
      id: "maroon",
      name: "Baron Maroon",
      icon: "👑",
      description:
        "Ein unglaublich hochmütiger und nachtragender Mann. Niemand will den Baron kränken. Zumindest niemand, der noch lebt ...",
      heightCm: 188,
      hand: "right",
      eyes: "hazel",
      hair: "red",
      sign: "scorpio",
    },
  ],
  locations: [
    {
      id: "tower",
      name: "der Aussichtsturm",
      icon: "♜",
      description:
        "Von hier oben über dem Garten sieht man alles. Außerdem hängt eine Karte des Labyrinths an der Wand.",
      indoors: true,
    },
    {
      id: "ruins",
      name: "die alten Ruinen",
      icon: "🗿",
      description:
        "Da sie schon vorher verfielen, hatten sie gegenüber dem Rest des Labyrinths einen Vorsprung.",
      indoors: false,
    },
    {
      id: "fountain",
      name: "der Brunnen",
      icon: "⛲",
      description:
        "Ein Springbrunnen in der Mitte des Labyrinths. Er ist knochentrocken.",
      indoors: false,
    },
    {
      id: "garden",
      name: "der geheime Garten",
      icon: "🌺",
      description:
        "Ein geheimer Garten in der Mitte des Labyrinths mit jeder Blume, die man nennen kann, und Hunderten, die man nicht nennen kann.",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "tea",
      name: "vergifteter Tee",
      icon: "🍵",
      description:
        "Genieß einen schönen Schluck Tee, gefolgt von einem langen, langen Nickerchen.",
      weight: "heavy",
      material: "Keramik, Wasser und Blätter",
    },
    {
      id: "shears",
      name: "eine Gartenschere",
      icon: "✂️",
      description:
        "Damit kann man eine Hecke stutzen - oder jemandem ein paar Lebensjahre.",
      weight: "medium",
      material: "Metall",
    },
    {
      id: "brick",
      name: "ein gewöhnlicher Ziegelstein",
      icon: "🧱",
      description:
        "Einfach ein ganz normaler, gewöhnlicher Ziegelstein. Nichts Besonderes. Nur ein Ziegelstein.",
      weight: "heavy",
      material: "Ton",
    },
    {
      id: "flowerpot",
      name: "ein Blumentopf",
      icon: "🪴",
      description: "Wer damit tötet, möge bitte vorher die Blumen umtopfen.",
      weight: "medium",
      material: "Keramik",
    },
  ],
  motives: [
    { id: "secret", name: "ein Geheimnis bewahren", icon: "🤫" },
    { id: "book", name: "ein wertvolles Buch stehlen", icon: "📕" },
    { id: "feel", name: "wissen, wie sich Töten anfühlt", icon: "💀" },
    { id: "experiment", name: "als wissenschaftliches Experiment", icon: "🔬" },
  ],
  clues: [
    {
      text: "Die Spurensicherung fand bei den alten Ruinen Spuren einer Waffe aus Metall.",
      holds: (scene) =>
        scene.locationOf(scene.holder("shears").id).id === "ruins",
    },
    {
      text: "Wer ein wertvolles Buch stehlen wollte, war Linkshänder.",
      holds: (scene) => scene.driven("book").hand === "left",
    },
    {
      text: "Wer wissen wollte, wie sich Töten anfühlt, hatte dunkelbraune Haare.",
      holds: (scene) => scene.driven("feel").hair === "darkBrown",
    },
    {
      text: "Im geheimen Garten wurde ein einzelnes rotes Haar gefunden.",
      holds: (scene) => scene.at("garden").hair === "red",
    },
    {
      text: "Wer als wissenschaftliches Experiment töten wollte, war Jungfrau.",
      holds: (scene) => scene.driven("experiment").sign === "virgo",
    },
    {
      text: 'Ein Informant sagte Logico: "Ein Teebeutel war drinnen." Genauer wurde er nicht.',
      holds: (scene) => scene.locationOf(scene.holder("tea").id).indoors,
    },
    {
      text: "Die verdächtige Person, die genauso groß war wie die Herzogin von Vermillion, war nicht im Aussichtsturm.",
      holds: (scene) => scene.locationOf("lavender").id !== "tower",
    },
    {
      text: "Die Herzogin von Vermillion hatte einen Ziegelstein mitgebracht, den sie kaum tragen konnte.",
      holds: (scene) => scene.weaponOf("vermillion").id === "brick",
    },
  ],
  body: {
    text: "Der Mord wurde mit einem Blumentopf begangen.",
    weapon: "flowerpot",
  },
  solution: {
    eminence: { weapon: "tea", location: "tower", motive: "feel" },
    lavender: { weapon: "shears", location: "ruins", motive: "experiment" },
    vermillion: { weapon: "brick", location: "fountain", motive: "book" },
    maroon: { weapon: "flowerpot", location: "garden", motive: "secret" },
  },
  murderer: "maroon",
  hints: [
    {
      text: 'Logico stellte sich vor, wo Irratino eine Nachricht versteckt hätte, und dann, wie diese Nachricht gelautet hätte. Vielleicht so: "Die Herzogin von Vermillion war im Brunnen."',
      book: true,
      marks: [{ a: "vermillion", b: "fountain", value: "check" }],
    },
    {
      text: "Rote Haare hat nur Baron Maroon: Er war im geheimen Garten. Dunkelbraune Haare hat nur Viscount Eminence: Er wollte wissen, wie sich Töten anfühlt. Die einzige Jungfrau ist Lord Lavender: Er tötete als wissenschaftliches Experiment.",
      marks: [
        { a: "maroon", b: "garden", value: "check" },
        { a: "eminence", b: "feel", value: "check" },
        { a: "lavender", b: "experiment", value: "check" },
      ],
    },
    {
      text: "Das Buch wollte ein Linkshänder stehlen - Eminence hat schon ein Motiv, also die Herzogin von Vermillion. Maroon blieb: ein Geheimnis bewahren. Die Herzogin hatte den Ziegelstein.",
      marks: [
        { a: "vermillion", b: "book", value: "check" },
        { a: "maroon", b: "secret", value: "check" },
        { a: "vermillion", b: "brick", value: "check" },
      ],
    },
    {
      text: "Die einzige Metallwaffe ist die Gartenschere: Sie war bei den Ruinen. Der Teebeutel war drinnen - im Aussichtsturm. Genauso groß wie die Herzogin (1,75 m) ist Lavender, und er war nicht im Turm.",
      marks: [{ a: "shears", b: "ruins", value: "check" }],
    },
    {
      text: "Im Turm mit dem Tee war also weder Lavender noch Maroon (Garten) noch die Herzogin (Ziegelstein): Eminence hatte den Tee im Turm. Die Gartenschere bei den Ruinen hatte Lavender, die Herzogin war am Brunnen.",
      marks: [
        { a: "eminence", b: "tea", value: "check" },
        { a: "lavender", b: "shears", value: "check" },
        { a: "lavender", b: "ruins", value: "check" },
      ],
    },
    {
      text: "Für Maroon bleibt der Blumentopf, die Tatwaffe: Baron Maroon war es, mit dem Blumentopf, im geheimen Garten, um ein Geheimnis zu bewahren.",
      marks: [
        { a: "maroon", b: "flowerpot", value: "check" },
        { a: "flowerpot", b: "garden", value: "check" },
        { a: "flowerpot", b: "secret", value: "check" },
        { a: "garden", b: "secret", value: "check" },
        { a: "eminence", b: "tower", value: "check" },
        { a: "tea", b: "tower", value: "check" },
        { a: "tea", b: "feel", value: "check" },
        { a: "tower", b: "feel", value: "check" },
        { a: "shears", b: "experiment", value: "check" },
        { a: "ruins", b: "experiment", value: "check" },
        { a: "brick", b: "fountain", value: "check" },
        { a: "brick", b: "book", value: "check" },
        { a: "fountain", b: "book", value: "check" },
      ],
    },
  ],
};
