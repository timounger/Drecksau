/**
 * Case 72, "Prism or Prison?": the crystal salesman of New Aegis.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Hard Boiled), from the photos of
 * the book. The scrambled note reads "Supreme Master Cobalt was found
 * outdoors"; here it is scrambled again in German, letter by letter within
 * each word. The solver found the only solution, and the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const PRISM_OR_PRISON: Case = {
  id: "prism-or-prison",
  number: 72,
  title: "Kristall oder Knast?",
  story:
    "Deductive Logico betrat den Kristallladen, und sein erster Gedanke war, dass er Inspektor Irratino ein Geschenk mitbringen sollte. Sein zweiter Gedanke war Traurigkeit, weil er das nie wieder tun könnte. Sein dritter Gedanke war, dass der Kristallverkäufer tot war.",
  series: "volume1",
  difficulty: "hardBoiled",
  suspects: [
    {
      id: "cobalt",
      name: "Oberster Meister Cobalt",
      icon: "\u{1F9D9}",
      description:
        "Er hat einen langen weißen Bart und trägt lange weiße Gewänder.",
      heightCm: 175,
      hand: "right",
      eyes: "blue",
      hair: "silver",
      sign: "aquarius",
    },
    {
      id: "night",
      name: "Numerolog:in Night",
      icon: "\u{1F576}️",
      description:
        "Ein mathematisches und esoterisches Wunderkind. Night kennt nicht nur den Wert von H, sondern auch die Bedeutung von H.",
      heightCm: 175,
      hand: "left",
      eyes: "blue",
      hair: "darkBrown",
      sign: "pisces",
    },
    {
      id: "blackstone",
      name: "Blackstone, Esq.",
      icon: "⚖️",
      description:
        "Unglaublich begabt in der wichtigsten Fähigkeit eines Anwalts: sich bezahlen zu lassen.",
      heightCm: 183,
      hand: "right",
      eyes: "black",
      hair: "black",
      sign: "scorpio",
    },
    {
      id: "seashell",
      name: "Dr. Seashell, Zahnarzt",
      icon: "\u{1F9B7}",
      description:
        "Er ist Hobbyphysiker mit einer neuen Theorie des Universums - und nebenbei praktizierender Zahnarzt.",
      heightCm: 170,
      hand: "right",
      eyes: "green",
      hair: "gray",
      sign: "pisces",
    },
  ],
  locations: [
    {
      id: "sage",
      name: "die Salbeiabteilung",
      icon: "\u{1F33F}",
      description:
        "Nachhaltig geerntete kulturelle Aneignung. (Aber es wirkt!)",
      indoors: true,
    },
    {
      id: "safe",
      name: "der riesige Tresor",
      icon: "\u{1F512}",
      description:
        "Das Geld liegt in der Kasse. Hier drin sind nur noch mehr Kristalle.",
      indoors: true,
    },
    {
      id: "rooftop-bar",
      name: "die Dachterrassenbar",
      icon: "\u{1F379}",
      description:
        "Auf dem Dach des Kristallladens ist eine Bar, in der man kristallveredelte Cocktails trinken kann.",
      indoors: false,
    },
    {
      id: "meditation",
      name: "der Meditationsplatz im Freien",
      icon: "\u{1F9D8}",
      description:
        "Ein Ort, um in Ruhe darüber zu meditieren, wie viel Geld man hier ausgeben will.",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "dagger",
      name: "ein Kristalldolch",
      icon: "\u{1F5E1}️",
      description:
        "Vielleicht hat er einen rituellen Zweck - vielleicht sieht er auch nur toll auf dem Kaminsims aus.",
      weight: "medium",
      material: "Kristall",
    },
    {
      id: "marot",
      name: "ein Satz Marotkarten",
      icon: "\u{1F0CF}",
      description:
        "Mit diesen Tarotkarten zum Thema Mord kannst du deine Zukunft lesen.",
      weight: "light",
      material: "Papier",
    },
    {
      id: "crystal-ball",
      name: "eine Kristallkugel",
      icon: "\u{1F52E}",
      description:
        "Wenn du hineinschaust, sagt sie dir deine Zukunft - solange deine Zukunft eine Kristallkugel ist.",
      weight: "heavy",
      material: "Kristall",
    },
    {
      id: "channeled-text",
      name: "ein gechannelter Text",
      icon: "\u{1F4D6}",
      description:
        "Dieses Buch ist länger als Gainsboros Meisterwerk und wurde angeblich von Geistern geschrieben.",
      weight: "heavy",
      material: "Papier",
    },
  ],
  motives: [
    { id: "money", name: "für Geld", icon: "\u{1F4B0}" },
    { id: "vibes", name: "weil die Schwingungen nicht stimmten", icon: "☮️" },
    { id: "love", name: "die eigene Liebe beweisen", icon: "❤️" },
    { id: "crystal", name: "einen Kristall stehlen", icon: "\u{1F536}" },
  ],
  clues: [
    {
      text: "Wer einen Kristalldolch hatte, wollte die eigene Liebe beweisen.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("dagger").id)?.id === "love",
    },
    {
      text: "Alle Mitglieder des Ordens der Heiligen Erde trugen ein Exemplar eines gechannelten Texts bei sich.",
      holds: (scene) => scene.weaponOf("seashell").id === "channeled-text",
    },
    {
      text: "Die Spurensicherung stellte fest, dass in der Salbeiabteilung eine Waffe aus Papier war.",
      holds: (scene) =>
        scene.weaponOf(scene.at("sage").id).material === "Papier",
    },
    {
      text: "Wer töten würde, weil die Schwingungen nicht stimmten, hatte blaue Augen.",
      holds: (scene) => scene.driven("vibes").eyes === "blue",
    },
    {
      text: "Eine verwürfelte Notiz hielt fest, wo sich ein Verdächtiger aufhielt: TEBSREOR STREEMI OCLABT RUDWE REUNDSSA UEGDEFNN.",
      holds: (scene) => !scene.locationOf("cobalt").indoors,
    },
    {
      text: "Die Person, die genauso groß ist wie Oberster Meister Cobalt, war in die Person verliebt, die einen Satz Marotkarten mitgebracht hatte.",
      holds: (scene) => scene.holder("marot").id !== "night",
    },
    {
      text: "Dr. Seashell, Zahnarzt, war Mitglied des Ordens der Heiligen Erde.",
      holds: (scene) => scene.weaponOf("seashell").id === "channeled-text",
    },
    {
      text: "Wer einen Kristall stehlen wollte, versprühte auch echte Fische-Schwingungen.",
      holds: (scene) => scene.driven("crystal").sign === "pisces",
    },
    {
      text: "Wer am Meditationsplatz im Freien war, hatte eine schwere Waffe.",
      holds: (scene) =>
        scene.weaponOf(scene.at("meditation").id).weight === "heavy",
    },
    {
      text: "Ein Fisch war buchstäblich im riesigen Tresor.",
      holds: (scene) => scene.at("safe").sign === "pisces",
    },
    {
      text: "Analysten entdeckten Spuren einer Waffe aus Kristall an der Kleidung von Blackstone, Esq.",
      holds: (scene) => scene.weaponOf("blackstone").material === "Kristall",
    },
  ],
  body: {
    text: "Der Kristallverkäufer wurde mit einer Kristallkugel getötet. Ist das Ironie?",
    weapon: "crystal-ball",
  },
  solution: {
    cobalt: { weapon: "marot", location: "rooftop-bar", motive: "vibes" },
    night: { weapon: "dagger", location: "safe", motive: "love" },
    blackstone: {
      weapon: "crystal-ball",
      location: "meditation",
      motive: "money",
    },
    seashell: { weapon: "channeled-text", location: "sage", motive: "crystal" },
  },
  murderer: "blackstone",
  hints: [
    {
      text: "Deductive Logico erhaschte in einem der Kristalle den Schimmer einer Vision, und sie verriet ihm, dass Oberster Meister Cobalt neben einem köstlichen Cocktail gesehen worden war.",
      book: true,
    },
    {
      text: 'Die Notiz, Wort für Wort entwürfelt: "OBERSTER MEISTER COBALT WURDE DRAUSSEN GEFUNDEN." Cobalt war also draußen.',
    },
    {
      text: "Dr. Seashell gehört zum Orden der Heiligen Erde, und dessen Mitglieder tragen den gechannelten Text: Seashell hatte ihn. Blackstone hatte eine Waffe aus Kristall - Dolch oder Kugel.",
      marks: [{ a: "seashell", b: "channeled-text", value: "check" }],
    },
    {
      text: "Genauso groß wie Cobalt ist nur Night, und Night war in die Person mit den Marotkarten verliebt - hatte sie also nicht. Seashell und Blackstone auch nicht: Cobalt hatte die Marotkarten.",
      marks: [{ a: "cobalt", b: "marot", value: "check" }],
    },
    {
      text: "In der Salbeiabteilung war eine Papierwaffe: die Karten oder der Text. Cobalt war draußen, also war Seashell mit dem Text in der Salbeiabteilung. Im Tresor war ein Fisch - Night oder Seashell, also Night.",
      marks: [
        { a: "channeled-text", b: "sage", value: "check" },
        { a: "seashell", b: "sage", value: "check" },
        { a: "night", b: "safe", value: "check" },
      ],
    },
    {
      text: "Cobalt mit den leichten Karten war nicht am Meditationsplatz (schwere Waffe), sondern in der Dachterrassenbar. Blackstone war am Meditationsplatz - mit der schweren Kristallkugel. Night hatte den Dolch und wollte die eigene Liebe beweisen.",
      marks: [
        { a: "cobalt", b: "rooftop-bar", value: "check" },
        { a: "blackstone", b: "crystal-ball", value: "check" },
        { a: "blackstone", b: "meditation", value: "check" },
        { a: "crystal-ball", b: "meditation", value: "check" },
        { a: "night", b: "love", value: "check" },
      ],
    },
    {
      text: "Den Kristall wollte ein Fisch stehlen: Seashell. Blaue Augen für die Schwingungen hat Cobalt, nicht Blackstone. Blackstone tötete für Geld.",
      marks: [
        { a: "seashell", b: "crystal", value: "check" },
        { a: "cobalt", b: "vibes", value: "check" },
        { a: "blackstone", b: "money", value: "check" },
      ],
    },
    {
      text: "Die Kristallkugel war die Tatwaffe: Blackstone, Esq., tötete am Meditationsplatz im Freien, für Geld.",
      marks: [
        { a: "crystal-ball", b: "money", value: "check" },
        { a: "meditation", b: "money", value: "check" },
        { a: "marot", b: "rooftop-bar", value: "check" },
        { a: "marot", b: "vibes", value: "check" },
        { a: "rooftop-bar", b: "vibes", value: "check" },
        { a: "night", b: "dagger", value: "check" },
        { a: "dagger", b: "safe", value: "check" },
        { a: "dagger", b: "love", value: "check" },
        { a: "safe", b: "love", value: "check" },
        { a: "channeled-text", b: "crystal", value: "check" },
        { a: "sage", b: "crystal", value: "check" },
      ],
    },
  ],
};
