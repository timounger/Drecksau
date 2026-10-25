/**
 * Case 88, "The Real Murder at the Fake Estate": the actor playing Irratino.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Impossible). Motives and statements,
 * no body clue - the liar is the murderer. The scrambled observation reads
 * "Astrologer Azure had a hypnotic pocket watch"; here it is scrambled again
 * in German, letter by letter within each word. The Order of the Sacred Oil
 * is read as the book means it: its members are exactly those with a
 * medium-weight weapon (strictly, the clue only says every such person is a
 * member, which would leave the case open). The book's hint comes first; the
 * other hints are our own.
 */
import type { Case, Scene } from "../engine/types";

/** The case. */
export const THE_REAL_MURDER_AT_THE_FAKE_ESTATE: Case = {
  id: "the-real-murder-at-the-fake-estate",
  number: 88,
  title: "Ein echter Mord auf dem falschen Anwesen",
  story:
    "Als Logico das Set von Irratinos Elternhaus betrat, überkam ihn eine überwältigende Welle aus Traurigkeit und Trauer. Irratino an den Tod zu verlieren, war schwer gewesen, ihn an den Verrat zu verlieren, war schlimmer. Und die Gefühle wurden noch verwickelter, als der Schauspieler getötet wurde, der Irratino spielte.",
  series: "volume1",
  difficulty: "impossible",
  suspects: [
    {
      id: "vermillion",
      name: "Der Herzog von Vermillion",
      icon: "\u{1F934}",
      description:
        "Ehrlich gesagt hätte Silverton die Legende körperlich besser gepasst, um den Herzog zu spielen.",
      heightCm: 175,
      hand: "left",
      eyes: "gray",
      hair: "white",
      sign: "pisces",
    },
    {
      id: "obsidian",
      name: "Dame Obsidian",
      icon: "\u{1F452}",
      description:
        "Eine Schauspielerin, die Dame Obsidian spielt und Dame Obsidian - unglaublich - aufs Haar gleicht.",
      heightCm: 163,
      hand: "left",
      eyes: "green",
      hair: "black",
      sign: "leo",
    },
    {
      id: "brownstone",
      name: "Bruder Brownstone",
      icon: "\u{1F4FF}",
      description:
        "Den Großteil von Bruder Brownstones Handlung hat man aus dem Film geschnitten, jetzt ist er nur noch ein weiser Mönch und Mentor.",
      heightCm: 163,
      hand: "left",
      eyes: "darkBrown",
      hair: "darkBrown",
      sign: "capricorn",
    },
    {
      id: "azure",
      name: "Astrologin Azure",
      icon: "\u{1F52E}",
      description:
        "Astrologin Azure ist eine Art Sammelfigur für alle Leute vom Ermittlungsinstitut.",
      heightCm: 168,
      hand: "right",
      eyes: "hazel",
      hair: "lightBrown",
      sign: "cancer",
    },
  ],
  locations: [
    {
      id: "garage",
      name: "die Garage für fünfzig Autos",
      icon: "\u{1F697}",
      description:
        "Die Oldtimer sind alles Requisiten aus der Requisitenwerkstatt von Midnight.",
      indoors: true,
    },
    {
      id: "servants-quarters",
      name: "die Dienstbotenkammern",
      icon: "\u{1F6AA}",
      description: "Genau wie ihr Lohn: Beides ist klein.",
      indoors: true,
    },
    {
      id: "balcony",
      name: "der Balkon",
      icon: "\u{1F3DB}️",
      description:
        "Man blickt über das Gelände - aber eigentlich nur auf ein gemaltes Bild des Geländes. (Nur scheinbar draußen.)",
      indoors: true,
    },
    {
      id: "grounds",
      name: "das Gelände",
      icon: "\u{1F33F}",
      description:
        "Das Gras ist lang, dicht, gepflegt und unecht - wie das Haar des Mannes, der Irratino spielt. (Nur scheinbar draußen.)",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "watch",
      name: "eine hypnotische Taschenuhr",
      icon: "⏱️",
      description:
        "Wenn man tief in diese Uhr blickt, kann man die Uhrzeit ablesen.",
      weight: "light",
      material: "Metall",
    },
    {
      id: "dowsing-rod",
      name: "eine Wünschelrute",
      icon: "\u{1FA84}",
      description: "Damit findet man Wasser, Öl und Leichtgläubige.",
      weight: "medium",
      material: "Holz",
    },
    {
      id: "dagger",
      name: "ein Kristalldolch",
      icon: "\u{1F5E1}️",
      description:
        "Vielleicht hat er einen rituellen Zweck, vielleicht sieht er auch nur toll auf dem Kaminsims aus.",
      weight: "medium",
      material: "Metall und Juwelen",
    },
    {
      id: "tincture",
      name: "eine vergiftete Tinktur",
      icon: "\u{1F9EA}",
      description:
        "Laut Etikett heilt ein Tropfen alle Leiden. Zwei bringen einen um.",
      weight: "light",
      material: "Öl und Gift",
    },
  ],
  motives: [
    { id: "grave", name: "ein Grab ausrauben", icon: "\u{1F480}" },
    { id: "occult", name: "das Okkulte fördern", icon: "\u{1F52E}" },
    { id: "estate", name: "das Anwesen stehlen", icon: "\u{1F3F0}" },
    { id: "plot", name: "einen Plot ausprobieren", icon: "⚗️" },
  ],
  clues: [
    {
      text: "Der Herzog von Vermillion wollte ein Grab ausrauben. Das war ein lang gehegter Traum.",
      holds: (scene) => scene.motiveOf("vermillion")?.id === "grave",
    },
    {
      text: "Auf die Dispo hatte jemand eine verwürfelte Beobachtung geschrieben: TRONSALOGI UEARZ TEAHT NEEI TCSHYHPOENI UEHNARTCSH.",
      holds: (scene) => scene.weaponOf("azure").id === "watch",
    },
    {
      text: "Ein Mitglied des Ordens des Heiligen Öls war in der Garage für fünfzig Autos.",
      holds: (scene) => isMember(scene, scene.at("garage").id),
    },
    {
      text: "Alle mit einer mittelschweren Waffe waren Mitglieder des Ordens des Heiligen Öls.",
      holds: () => true,
    },
    {
      text: "Ein Mitglied des Ordens des Heiligen Öls wollte einen Plot ausprobieren.",
      holds: (scene) => isMember(scene, scene.driven("plot").id),
    },
    {
      text: "Eine Wünschelrute wurde neben einem wunderschönen gemalten Hintergrund entdeckt.",
      holds: (scene) =>
        scene.locationOf(scene.holder("dowsing-rod").id).id === "balcony",
    },
    {
      text: "Bruder Brownstone quetschte sich in eine Ecke, die so eng war, dass sie ihn an seine Zelle im Kloster erinnerte.",
      holds: (scene) =>
        scene.locationOf("brownstone").id === "servants-quarters",
    },
  ],
  statements: [
    {
      by: "vermillion",
      text: "Ein Löwe hatte eine Wünschelrute dabei.",
      holds: (scene) => scene.holder("dowsing-rod").sign === "leo",
    },
    {
      by: "obsidian",
      text: "Ein Gedanke: Ich hatte eine hypnotische Taschenuhr dabei.",
      holds: (scene) => scene.weaponOf("obsidian").id === "watch",
    },
    {
      by: "brownstone",
      text: "Im Namen Gottes: Wer das Anwesen stehlen wollte, war in den Dienstbotenkammern.",
      holds: (scene) =>
        scene.locationOf(scene.driven("estate").id).id === "servants-quarters",
    },
    {
      by: "azure",
      text: "Dame Obsidian hatte keine vergiftete Tinktur dabei.",
      holds: (scene) => scene.weaponOf("obsidian").id !== "tincture",
    },
  ],
  solution: {
    vermillion: { weapon: "dagger", location: "garage", motive: "grave" },
    obsidian: { weapon: "dowsing-rod", location: "balcony", motive: "plot" },
    brownstone: {
      weapon: "tincture",
      location: "servants-quarters",
      motive: "estate",
    },
    azure: { weapon: "watch", location: "grounds", motive: "occult" },
  },
  murderer: "obsidian",
  hints: [
    {
      text: 'Inspektor Irratino liebte die neuesten Nachrichten vom Einsatzort. "Der Typ, der mich spielt, ist tot? Sah er gut aus? Wusste er auch, dass Dame Obsidian auf dem Balkon war?"',
      book: true,
      marks: [{ a: "obsidian", b: "balcony", value: "check" }],
    },
    {
      text: 'Die Beobachtung, Wort für Wort entwürfelt: "ASTROLOGIN AZURE HATTE EINE HYPNOTISCHE TASCHENUHR." Dann ist Dame Obsidians Aussage falsch - sie lügt und ist die Mörderin. Alle anderen sagen die Wahrheit.',
      marks: [{ a: "azure", b: "watch", value: "check" }],
    },
    {
      text: "Der Herzog sagt die Wahrheit: Ein Löwe - Dame Obsidian - hatte die Wünschelrute, und die lag am gemalten Hintergrund, also auf dem Balkon. Brownstone war in den engen Dienstbotenkammern, und laut seiner Aussage wollte er das Anwesen stehlen. Der Herzog will ein Grab ausrauben.",
      marks: [
        { a: "obsidian", b: "dowsing-rod", value: "check" },
        { a: "dowsing-rod", b: "balcony", value: "check" },
        { a: "brownstone", b: "servants-quarters", value: "check" },
        { a: "brownstone", b: "estate", value: "check" },
        { a: "servants-quarters", b: "estate", value: "check" },
        { a: "vermillion", b: "grave", value: "check" },
      ],
    },
    {
      text: "Mitglieder des Ordens sind die mit einer mittelschweren Waffe: Wünschelrute und Kristalldolch. Einen Plot ausprobieren will ein Mitglied - der Herzog und Brownstone haben schon Motive, also ist es Obsidian. Azure will das Okkulte fördern.",
      marks: [
        { a: "obsidian", b: "plot", value: "check" },
        { a: "azure", b: "occult", value: "check" },
      ],
    },
    {
      text: "In der Garage war ein Mitglied: Dort sind nur noch der Herzog oder Azure (mit der leichten Taschenuhr) möglich, also der Herzog mit dem Kristalldolch. Brownstone hat die vergiftete Tinktur, Azure war auf dem Gelände. Dame Obsidian hatte die Wünschelrute auf dem Balkon und wollte einen Plot ausprobieren.",
      marks: [
        { a: "vermillion", b: "dagger", value: "check" },
        { a: "vermillion", b: "garage", value: "check" },
        { a: "dagger", b: "garage", value: "check" },
        { a: "brownstone", b: "tincture", value: "check" },
        { a: "azure", b: "grounds", value: "check" },
        { a: "dowsing-rod", b: "plot", value: "check" },
        { a: "balcony", b: "plot", value: "check" },
        { a: "dagger", b: "grave", value: "check" },
        { a: "garage", b: "grave", value: "check" },
        { a: "tincture", b: "servants-quarters", value: "check" },
        { a: "tincture", b: "estate", value: "check" },
        { a: "watch", b: "grounds", value: "check" },
        { a: "watch", b: "occult", value: "check" },
        { a: "grounds", b: "occult", value: "check" },
      ],
    },
  ],
};

/**
 * Whether a suspect belongs to the Order of the Sacred Oil - as the book
 * means it, whoever has a medium-weight weapon.
 *
 * @param scene - one way it could have been
 * @param id - the suspect
 * @returns whether they are a member
 */
function isMember(scene: Scene, id: string): boolean {
  return scene.weaponOf(id).weight === "medium";
}
