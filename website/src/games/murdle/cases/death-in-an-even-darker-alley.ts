/**
 * Case 70, "Death in an Even Darker Alley": another body, in an alley even
 * darker than the one of case 6.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Hard Boiled), from the photos of
 * the book. The book blacks out Mister Shadow's height, eyes and star sign,
 * and so does his card here (no sign at all, as there is no redacted one);
 * no clue asks for them. The
 * scrambled note reads "A golden age actor wanted to kill out of bloodlust
 * after being seen in a burnt-out car husk"; here it is scrambled again in
 * German, letter by letter within each word. The solver found the only
 * solution, and the hints are our own.
 */
import { REDACTED_HEIGHT, type Case } from "../engine/types";

/** The case. */
export const DEATH_IN_AN_EVEN_DARKER_ALLEY: Case = {
  id: "death-in-an-even-darker-alley",
  number: 70,
  title: "Tod in einer noch dunkleren Gasse",
  story:
    "Deductive Logico stolperte aus dem Zauberpalast, ohne eine Spur auf seiner Suche nach Erkenntnis (und - nicht vergessen! - Rache) gefunden zu haben. Stattdessen fand er sich in einer Gasse wieder, die noch dunkler war als die letzte. Und dort auf dem Boden lag (überrascht dich das noch?) eine weitere Leiche.",
  series: "volume1",
  difficulty: "hardBoiled",
  suspects: [
    {
      id: "blue",
      name: "Babyface Blue",
      icon: "\u{1F476}",
      description:
        "Das ist ganz bestimmt ein ausgewachsener Mann und nicht zwei Kinder in einem Trenchcoat. Er kann Erwachsenendinge tun: Filme ab 18 sehen, Bier kaufen und lange nach der Schlafenszeit draußen bleiben.",
      heightCm: 234,
      hand: "right",
      eyes: "blue",
      hair: "blond",
      sign: "gemini",
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
      id: "shadow",
      name: "Mister Shadow",
      icon: "\u{1F575}️",
      description:
        "Eine Silhouette im Schatten. Er bewegt sich wie der Wind und sieht aus wie die Nacht.",
      heightCm: REDACTED_HEIGHT,
      hand: "left",
      eyes: "redacted",
      hair: "darkBrown",
    },
    {
      id: "silverton",
      name: "Legende Silverton",
      icon: "\u{1F31F}",
      description:
        "Ein gefeierter Schauspieler des Goldenen Zeitalters, inzwischen in seinen goldenen Jahren.",
      heightCm: 193,
      hand: "right",
      eyes: "blue",
      hair: "silver",
      sign: "leo",
    },
  ],
  locations: [
    {
      id: "fence",
      name: "ein Metallzaun",
      icon: "⛓️",
      description: "Dein typischer Maschendrahtzaun. Was willst du mehr?",
      indoors: false,
    },
    {
      id: "car-husk",
      name: "ein ausgebranntes Autowrack",
      icon: "\u{1F697}",
      description:
        "Es sieht aus, als hätte jemand ein Auto in Stücke geschlagen und dann angezündet.",
      indoors: false,
    },
    {
      id: "dumpster",
      name: "ein Müllcontainer",
      icon: "\u{1F5D1}️",
      description: "Er riecht nicht gut. Nein, wirklich nicht.",
      indoors: false,
    },
    {
      id: "graffiti",
      name: "das ablenkende Graffiti",
      icon: "\u{1F3DB}️",
      description:
        "Das Wandbild vom Drachen auf dem Motorrad wurde mit einem unheilvollen Bild von Ruinen übermalt.",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "scimitar",
      name: "ein Krummsäbel",
      icon: "\u{1F5E1}\u{FE0F}",
      description:
        "Genau genommen nur ein verbogenes Schwert, aber Krummsäbel klingt einfach cooler.",
      weight: "medium",
      material: "Metall",
    },
    {
      id: "shovel",
      name: "eine Schaufel",
      icon: "\u{1FA8F}",
      description:
        "Das Tolle an einer Schaufel als Mordwaffe: Man kann damit auch ein Loch graben, um die Leiche zu verstecken.",
      weight: "medium",
      material: "Metall und Holz",
    },
    {
      id: "herring",
      name: "ein roter Hering",
      icon: "\u{1F41F}",
      description:
        "Wenn man ihn am Schwanz hält, bekommt man richtig Schwung dahinter.",
      weight: "medium",
      material: "Fisch",
    },
    {
      id: "poison",
      name: "ein Fläschchen Gift",
      icon: "\u{1F9EA}",
      description:
        "Dein typisches Fläschchen Gift. Unterschätze nie die Klassiker.",
      weight: "light",
      material: "Glas und Giftstoffen",
    },
  ],
  motives: [
    { id: "idea", name: "eine Idee stehlen", icon: "\u{1F4A1}" },
    { id: "bloodlust", name: "aus Blutdurst", icon: "\u{1FA78}" },
    { id: "lesson", name: "eine Lektion erteilen", icon: "\u{1F34E}" },
    {
      id: "witness",
      name: "einen Zeugen zum Schweigen bringen",
      icon: "\u{1F910}",
    },
  ],
  clues: [
    {
      text: "Wer den roten Hering hatte, hatte auch schwarze Haare.",
      holds: (scene) => scene.holder("herring").hair === "black",
    },
    {
      text: "Wer eine Idee stehlen wollte, hatte eine Waffe, die zumindest teilweise aus Metall war.",
      holds: (scene) =>
        (scene.weaponOf(scene.driven("idea").id).material ?? "").includes(
          "Metall",
        ),
    },
    {
      text: "Eine Klatschkolumnistin gab Logico eine verwürfelte Notiz: NIE ESRUECSILPAH SED ONGELDNE ETAZTLSRIE WRA MI GAUAEETNNBNRS UTRWCAOKA NDU LETWOL USA RSTUBDTLU TENTÖ.",
      holds: (scene) =>
        scene.locationOf("silverton").id === "car-husk" &&
        scene.motiveOf("silverton")?.id === "bloodlust",
    },
    {
      text: "Babyface Blue hatte sich an einem verbogenen Schwert geschnitten und fing an zu weinen.",
      holds: (scene) => scene.weaponOf("blue").id === "scimitar",
    },
    {
      text: "Legende Silverton hatte ein Fläschchen Gift.",
      holds: (scene) => scene.weaponOf("silverton").id === "poison",
    },
    {
      text: "Wer eine Idee stehlen wollte, war nicht beim ablenkenden Graffiti.",
      holds: (scene) =>
        scene.locationOf(scene.driven("idea").id).id !== "graffiti",
    },
    {
      text: "Wer am Metallzaun war, war Rechtshänder.",
      holds: (scene) => scene.at("fence").hand === "right",
    },
    {
      text: "Mister Shadow war nicht beim ablenkenden Graffiti.",
      holds: (scene) => scene.locationOf("shadow").id !== "graffiti",
    },
    {
      text: "Wer einen Zeugen zum Schweigen bringen wollte, war im Müllcontainer.",
      holds: (scene) =>
        scene.locationOf(scene.driven("witness").id).id === "dumpster",
    },
  ],
  body: {
    text: "Neben der Leiche wurde eine blutverschmierte Schaufel gefunden.",
    weapon: "shovel",
  },
  solution: {
    blue: { weapon: "scimitar", location: "fence", motive: "idea" },
    blackstone: { weapon: "herring", location: "graffiti", motive: "lesson" },
    shadow: { weapon: "shovel", location: "dumpster", motive: "witness" },
    silverton: { weapon: "poison", location: "car-husk", motive: "bloodlust" },
  },
  murderer: "shadow",
  hints: [
    {
      text: "Deductive Logico musste nicht die Geheimnisse des Okkulten bemühen, um zu sehen, dass die zwei übereinandergestapelten Kinder am Zaun lehnten.",
      book: true,
    },
    {
      text: 'Die Notiz, Wort für Wort entwürfelt: "EIN SCHAUSPIELER DES GOLDENEN ZEITALTERS WAR IM AUSGEBRANNTEN AUTOWRACK UND WOLLTE AUS BLUTDURST TÖTEN." Das ist Legende Silverton.',
      marks: [
        { a: "silverton", b: "car-husk", value: "check" },
        { a: "silverton", b: "bloodlust", value: "check" },
        { a: "car-husk", b: "bloodlust", value: "check" },
      ],
    },
    {
      text: "Die Waffen: Blue hat den Krummsäbel (das verbogene Schwert), Silverton das Gift, und schwarze Haare hat nur Blackstone - er hatte den roten Hering. Mister Shadow bleibt die Schaufel.",
      marks: [
        { a: "blue", b: "scimitar", value: "check" },
        { a: "blackstone", b: "herring", value: "check" },
        { a: "silverton", b: "poison", value: "check" },
        { a: "shadow", b: "shovel", value: "check" },
      ],
    },
    {
      text: "Mister Shadow war nicht am Graffiti, nicht am Metallzaun (er ist Linkshänder) und nicht im Autowrack (dort war Silverton). Er war im Müllcontainer - und wer dort war, wollte einen Zeugen zum Schweigen bringen.",
      marks: [{ a: "dumpster", b: "witness", value: "check" }],
    },
    {
      text: "Die Idee wollte jemand mit einer Metallwaffe stehlen: Krummsäbel oder Schaufel. Shadow will den Zeugen loswerden, also wollte Babyface Blue die Idee stehlen. Dann war Blue nicht am Graffiti, sondern am Metallzaun. Blackstone war am Graffiti und wollte eine Lektion erteilen.",
      marks: [
        { a: "scimitar", b: "idea", value: "check" },
        { a: "blue", b: "idea", value: "check" },
        { a: "shadow", b: "witness", value: "check" },
        { a: "blue", b: "fence", value: "check" },
        { a: "blackstone", b: "graffiti", value: "check" },
        { a: "blackstone", b: "lesson", value: "check" },
        { a: "graffiti", b: "lesson", value: "check" },
      ],
    },
    {
      text: "Die Schaufel lag bei der Leiche: Mister Shadow tötete im Müllcontainer, um einen Zeugen zum Schweigen zu bringen.",
      marks: [
        { a: "shadow", b: "dumpster", value: "check" },
        { a: "shovel", b: "dumpster", value: "check" },
        { a: "shovel", b: "witness", value: "check" },
        { a: "scimitar", b: "fence", value: "check" },
        { a: "fence", b: "idea", value: "check" },
        { a: "herring", b: "graffiti", value: "check" },
        { a: "herring", b: "lesson", value: "check" },
        { a: "poison", b: "car-husk", value: "check" },
        { a: "poison", b: "bloodlust", value: "check" },
      ],
    },
  ],
};
