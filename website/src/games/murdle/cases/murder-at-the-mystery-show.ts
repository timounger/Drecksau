/**
 * Case 92, "Murder at the Mystery Show": a small theater's Hollywood Mystery
 * Show.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Impossible). Motives and statements,
 * no body clue - the liar is the murderer. The book's hint comes first; the
 * other hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const MURDER_AT_THE_MYSTERY_SHOW: Case = {
  id: "murder-at-the-mystery-show",
  number: 92,
  title: "Mord bei der Krimi-Show",
  story:
    'Deductive Logico rief den einen Menschen an, von dem er wusste, dass er helfen konnte: Inspektor Irratino. Er fragte ihn, wie er aus Hollywood entkommen könne. Irratino sagte: "Beruhige dich und geh zu dieser Adresse." Dort fand Logico ein kleines Theater, das eine Hollywood-Krimi-Show aufführte. Als Profi löste er den Fall lange vor dem letzten Akt.',
  series: "volume1",
  difficulty: "impossible",
  suspects: [
    {
      id: "applegreen",
      name: "Assistentin Applegreen",
      icon: "\u{1F34F}",
      description:
        "Ihr Vater war stolz, dass sie endlich diese Kommune verlassen hatte - aber dann zog sie nach Hollywood ...",
      heightCm: 160,
      hand: "left",
      eyes: "blue",
      hair: "blond",
      sign: "virgo",
    },
    {
      id: "marengo",
      name: "Statistin Marengo",
      icon: "\u{1F464}",
      description:
        "An sie wirst du dich nie erinnern - deshalb ist sie eine gute Statistin und eine großartige Mörderin.",
      heightCm: 165,
      hand: "left",
      eyes: "lightBrown",
      hair: "darkBrown",
      sign: "gemini",
    },
    {
      id: "smoky",
      name: "Superfan Smoky",
      icon: "\u{1F913}",
      description:
        "Er kennt die Drehorte jedes Midnight-Krimis, aber nicht, wie man Freunde findet.",
      heightCm: 178,
      hand: "left",
      eyes: "black",
      hair: "darkBrown",
      sign: "virgo",
    },
    {
      id: "saffron",
      name: "Miss Saffron",
      icon: "\u{1F380}",
      description:
        "Umwerfend und atemberaubend, aber im Oberstübchen vielleicht nicht ganz da. Oder vielleicht will sie, dass du das denkst. Oder sie will, dass du denkst, dass sie das will.",
      heightCm: 157,
      hand: "left",
      eyes: "hazel",
      hair: "blond",
      sign: "libra",
    },
  ],
  locations: [
    {
      id: "audience",
      name: "das Publikum",
      icon: "\u{1F465}",
      description:
        "Ein lautes Publikum. Es schreit und pöbelt ständig dazwischen, und genau darum geht es wohl.",
      indoors: true,
    },
    {
      id: "lighting-booth",
      name: "die Lichtkabine",
      icon: "\u{1F39B}️",
      description:
        "Eine einzige Person steuert alle Lichter aus einer winzigen, engen Kabine voller Knöpfe und Schalter.",
      indoors: true,
    },
    {
      id: "stage",
      name: "die Bühne",
      icon: "\u{1F3AD}",
      description:
        "Auf der einen Seite spielt der Maestro Keyboard, auf der anderen serviert die Gastgeberin Drinks und tratscht mit dem Scryptkeeper.",
      indoors: true,
    },
    {
      id: "green-room",
      name: "das Künstlerzimmer",
      icon: "\u{1F535}",
      description:
        "Hier schminken sich die Schauspieler und nehmen Drogen. Eine einzige blaue Glühbirne beleuchtet den Raum - eher ein blaues Zimmer also.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "whiskey",
      name: "ein Krug Whiskey",
      icon: "\u{1F943}",
      description:
        "Wahrscheinlich die gefährlichste Waffe im ganzen Buch, wenn man die Langzeitfolgen mitzählt.",
      weight: "medium",
      material: "Metall und Gift",
    },
    {
      id: "rose",
      name: "eine künstliche Rose",
      icon: "\u{1F339}",
      description:
        "Der Plastikstiel ist stabil genug, um jemanden zu erdrosseln.",
      weight: "light",
      material: "Plastik",
    },
    {
      id: "prop-knife",
      name: 'ein "Requisiten"-Messer',
      icon: "\u{1F52A}",
      description:
        "Seltsamerweise ist es so scharf wie ein echtes Messer. Moment mal -",
      weight: "light",
      material: "Metall und Gummi",
    },
    {
      id: "ghost-light",
      name: "eine Geisterlampe",
      icon: "\u{1F4A1}",
      description:
        "Ein Aberglaube am Theater besagt, man solle immer ein Licht brennen lassen. Das ist dieses Licht.",
      weight: "heavy",
      material: "Metall und Glas",
    },
  ],
  motives: [
    { id: "industry", name: "im Auftrag der Branche", icon: "⚙️" },
    { id: "thematic", name: "aus thematischen Gründen", icon: "\u{1F3AD}" },
    { id: "diversion", name: "für ein Ablenkungsmanöver", icon: "\u{1F449}" },
    { id: "occult", name: "das Okkulte fördern", icon: "\u{1F52E}" },
  ],
  clues: [
    {
      text: "Eine Geisterlampe wurde unter einem blauen Licht gefunden.",
      holds: (scene) =>
        scene.locationOf(scene.holder("ghost-light").id).id === "green-room",
    },
    {
      text: 'Ein "Requisiten"-Messer kam nie auf die Bühne - was nicht gerade dafür spricht, dass es eine Requisite war.',
      holds: (scene) =>
        scene.locationOf(scene.holder("prop-knife").id).id !== "stage",
    },
    {
      text: "Miss Saffron hatte eine leichte Waffe.",
      holds: (scene) => scene.weaponOf("saffron").weight === "light",
    },
    {
      text: "Der zweitgrößte Verdächtige war der Einzige, der nicht zur Hollywood-Krimigesellschaft gehörte.",
      holds: () => true,
    },
    {
      text: "Wer den Krug Whiskey hatte, wollte ein Ablenkungsmanöver.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("whiskey").id)?.id === "diversion",
    },
    {
      text: "Wer das Okkulte fördern wollte, hatte dunkelbraune Haare.",
      holds: (scene) => scene.driven("occult").hair === "darkBrown",
    },
    {
      text: "Mitglieder der Hollywood-Krimigesellschaft dürfen nicht in die Nähe von Knöpfen.",
      holds: (scene) => scene.locationOf("marengo").id === "lighting-booth",
    },
    {
      text: "Wer im Auftrag der Branche töten wollte, war im Publikum.",
      holds: (scene) =>
        scene.locationOf(scene.driven("industry").id).id === "audience",
    },
  ],
  statements: [
    {
      by: "applegreen",
      text: "Ich habe mir Notizen gemacht: Der größte Verdächtige war auf der Bühne.",
      holds: (scene) => scene.locationOf("smoky").id === "stage",
    },
    {
      by: "marengo",
      text: "Ooh! Ich hatte einen Krug Whiskey dabei.",
      holds: (scene) => scene.weaponOf("marengo").id === "whiskey",
    },
    {
      by: "smoky",
      text: "Ich hatte keine Geisterlampe dabei.",
      holds: (scene) => scene.weaponOf("smoky").id !== "ghost-light",
    },
    {
      by: "saffron",
      text: "Was weiß ich schon? Also, Assistentin Applegreen war im Publikum.",
      holds: (scene) => scene.locationOf("applegreen").id === "audience",
    },
  ],
  solution: {
    applegreen: {
      weapon: "ghost-light",
      location: "green-room",
      motive: "thematic",
    },
    marengo: {
      weapon: "whiskey",
      location: "lighting-booth",
      motive: "diversion",
    },
    smoky: { weapon: "rose", location: "stage", motive: "occult" },
    saffron: { weapon: "prop-knife", location: "audience", motive: "industry" },
  },
  murderer: "saffron",
  hints: [
    {
      text: 'Später hörte Deductive Logico diese Sprachnachricht ab: "Logico, geht es dir gut? Hast du an den Knöpfen nach Whiskey gesucht? Eins unserer Medien hatte gerade eine Vision davon. Ich glaube an dich."',
      book: true,
    },
    {
      text: "Der Zweitgrößte ist Marengo (Smoky ist der Größte): Nur sie gehört nicht zur Krimigesellschaft. Alle anderen dürfen nicht an die Knöpfe - Marengo war in der Lichtkabine.",
      marks: [{ a: "marengo", b: "lighting-booth", value: "check" }],
    },
    {
      text: "Applegreen und Saffron können nicht beide recht haben: Wäre Smoky auf der Bühne und Applegreen im Publikum, bliebe Saffron das Künstlerzimmer mit der schweren Geisterlampe - sie hat aber eine leichte Waffe. Einer der beiden lügt, also sagen Marengo und Smoky die Wahrheit.",
      marks: [
        { a: "applegreen", b: "ghost-light", value: "check" },
        { a: "applegreen", b: "green-room", value: "check" },
        { a: "smoky", b: "stage", value: "check" },
        { a: "saffron", b: "audience", value: "check" },
        { a: "ghost-light", b: "green-room", value: "check" },
      ],
    },
    {
      text: "Marengo hat den Whiskey und will ein Ablenkungsmanöver. Das Okkulte will jemand mit dunkelbraunen Haaren - also Smoky. Die Geisterlampe hat weder Smoky (seine Aussage) noch Saffron (leicht) noch Marengo: Applegreen hat sie, im Künstlerzimmer.",
      marks: [
        { a: "marengo", b: "whiskey", value: "check" },
        { a: "marengo", b: "diversion", value: "check" },
        { a: "whiskey", b: "diversion", value: "check" },
        { a: "smoky", b: "occult", value: "check" },
      ],
    },
    {
      text: 'Damit war Applegreen nicht im Publikum: Miss Saffron lügt - sie ist die Mörderin. Applegreen sagt die Wahrheit, Smoky war auf der Bühne, Saffron im Publikum, also im Auftrag der Branche. Das Messer kam nie auf die Bühne: Saffron hat das "Requisiten"-Messer, Smoky die Rose. Applegreen tötete aus thematischen Gründen.',
      marks: [
        { a: "saffron", b: "industry", value: "check" },
        { a: "audience", b: "industry", value: "check" },
        { a: "smoky", b: "rose", value: "check" },
        { a: "saffron", b: "prop-knife", value: "check" },
        { a: "rose", b: "stage", value: "check" },
        { a: "applegreen", b: "thematic", value: "check" },
        { a: "ghost-light", b: "thematic", value: "check" },
        { a: "green-room", b: "thematic", value: "check" },
        { a: "whiskey", b: "lighting-booth", value: "check" },
        { a: "lighting-booth", b: "diversion", value: "check" },
        { a: "rose", b: "occult", value: "check" },
        { a: "stage", b: "occult", value: "check" },
        { a: "prop-knife", b: "audience", value: "check" },
        { a: "prop-knife", b: "industry", value: "check" },
      ],
    },
  ],
};
