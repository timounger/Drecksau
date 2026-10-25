/**
 * Case 97, "Bungalow Moral Character": an extra in the bungalows of the
 * Midnight Movies lot.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Impossible), from the photos of the
 * book. Motives and statements, no body clue - the liar is the murderer.
 * The journalist's tip is in the Next Letter Code - each letter stands for
 * the one after it - and reads "Whoever wanted to win an award was
 * left-handed"; here it is encoded again in German the same way (Ä written
 * as AE). The first hint is the book's; the solver's only solution is the
 * one the book prints, and the other hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const BUNGALOW_MORAL_CHARACTER: Case = {
  id: "bungalow-moral-character",
  number: 97,
  title: "Bungalow der Doppelmoral",
  story:
    "Nachdem sie einen Mord auf dem Gelände aufgeklärt hatten, gingen Deductive Logico und Inspektor Irratino hinüber zu den Bungalows, um die vorübergehenden Bewohner nach den Ruinen zu befragen. Ein Vorwand für ihr Eindringen fiel ihnen nicht ein - aber zum Glück war bei ihrer Ankunft ein Statist getötet worden.",
  series: "volume1",
  difficulty: "impossible",
  suspects: [
    {
      id: "blaxton",
      name: "Schreiberling Blaxton",
      icon: "✍️",
      description:
        "Einer der bestbezahlten Drehbuchautoren Hollywoods - und einer der schlechtesten.",
      heightCm: 183,
      hand: "right",
      eyes: "lightBrown",
      hair: "bald",
      sign: "sagittarius",
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
    {
      id: "abalone",
      name: "A-Promi Abalone",
      icon: "\u{1F483}",
      description:
        "Die talentierteste und gefragteste Schauspielerin aller Zeiten - diesen Monat.",
      heightCm: 168,
      hand: "right",
      eyes: "hazel",
      hair: "red",
      sign: "libra",
    },
    {
      id: "midnight",
      name: "Onkel Midnight",
      icon: "\u{1F973}",
      description:
        "Als sein Vater starb, kaufte er sich eine Wüstenvilla mit Pool und setzte sich zur Ruhe. Er war siebzehn.",
      heightCm: 173,
      hand: "left",
      eyes: "blue",
      hair: "darkBrown",
      sign: "sagittarius",
    },
  ],
  locations: [
    {
      id: "bungalow-1",
      name: "Bungalow 1",
      icon: "1️⃣",
      description:
        "Für Anfänger unter den Autoren. Es hat ein Schlafzimmer, eine Küche und ein Bad - alles im selben Raum.",
      indoors: true,
    },
    {
      id: "bungalow-2",
      name: "Bungalow 2",
      icon: "2️⃣",
      description:
        "Wenn man dich in Bungalow 2 hochstuft, hast du es geschafft. Ein Kühlschrank in voller Größe? Wow.",
      indoors: true,
    },
    {
      id: "bungalow-3",
      name: "Bungalow 3",
      icon: "3️⃣",
      description:
        "Ein Bungalow für die Stars. Mit eigenem Balkon, und die Dusche hat zwei Duschköpfe.",
      indoors: true,
    },
    {
      id: "bungalow-4",
      name: "Bungalow 4",
      icon: "4️⃣",
      description:
        "Ein Luxusbungalow, der grundsätzlich nie bewohnt wird - damit auch die Stars wissen, wo ihr Platz ist.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "typewriter",
      name: "eine antike Schreibmaschine",
      icon: "⌨️",
      description:
        "Aus den 1920ern - für Hollywood-Verhältnisse also aus der Jungsteinzeit.",
      weight: "heavy",
      material: "Metall",
    },
    {
      id: "award",
      name: "ein Filmpreis",
      icon: "\u{1F3C6}",
      description:
        "Dieser hier ist für die beste Verfilmung eines Rätselbuchs. Sehr angesehen.",
      weight: "medium",
      material: "Metall",
    },
    {
      id: "screenplay",
      name: "ein Riesendrehbuch",
      icon: "\u{1F4D1}",
      description:
        "Es soll ein Franchise begründen, also hat es fünfzig zusätzliche Seiten, die unglaublich langweilig sind.",
      weight: "heavy",
      material: "Papier",
    },
    {
      id: "pen",
      name: "ein Füllfederhalter",
      icon: "\u{1F58B}️",
      description:
        "Damit kann man Schecks unterschreiben oder Hälse erstechen. Leider kleckst er.",
      weight: "light",
      material: "Metall und Tinte",
    },
  ],
  motives: [
    { id: "money", name: "für Geld", icon: "\u{1F4B0}" },
    { id: "revenge", name: "Rache nehmen", icon: "⚔️" },
    { id: "book", name: "ein wertvolles Buch stehlen", icon: "\u{1F4D5}" },
    { id: "win-award", name: "einen Preis gewinnen", icon: "\u{1F947}" },
  ],
  clues: [
    {
      text: "Wer das Riesendrehbuch hatte, wollte nicht für Geld töten.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("screenplay").id)?.id !== "money",
    },
    {
      text: "In einem Bungalow mit nur einem Raum wurde ein Tintenfleck entdeckt.",
      holds: (scene) =>
        scene.locationOf(scene.holder("pen").id).id === "bungalow-1",
    },
    {
      text: "Logico bekam einen Tipp von einer Journalistin, im Nächster-Buchstabe-Code: VDQ DHMDM OQDHR FDVHMMDM VNKKSD, VZQ KHMJRGZDMCDQ.",
      holds: (scene) => scene.driven("win-award").hand === "left",
    },
    {
      text: "Onkel Midnight wurde neben einem Kühlschrank in voller Größe gesehen.",
      holds: (scene) => scene.locationOf("midnight").id === "bungalow-2",
    },
    {
      text: "Entweder stand A-Promi Abalone unter zwei Duschköpfen, oder A-Promi Abalone hatte eine antike Schreibmaschine dabei.",
      holds: (scene) =>
        (scene.locationOf("abalone").id === "bungalow-3") !==
        (scene.weaponOf("abalone").id === "typewriter"),
    },
    {
      text: "Wer Rache nehmen wollte, war in Bungalow 4.",
      holds: (scene) =>
        scene.locationOf(scene.driven("revenge").id).id === "bungalow-4",
    },
  ],
  statements: [
    {
      by: "blaxton",
      text: "Stellen Sie sich vor: Ich war in Bungalow 4.",
      holds: (scene) => scene.locationOf("blaxton").id === "bungalow-4",
    },
    {
      by: "silverton",
      text: "Ich sage Ihnen, wie es ist: Eine antike Schreibmaschine war in Bungalow 2.",
      holds: (scene) =>
        scene.locationOf(scene.holder("typewriter").id).id === "bungalow-2",
    },
    {
      by: "abalone",
      text: "Reden Sie mit meinem Agenten - aber unter uns: Legende Silverton hatte eine antike Schreibmaschine dabei.",
      holds: (scene) => scene.weaponOf("silverton").id === "typewriter",
    },
    {
      by: "midnight",
      text: "Hey, ein Riesendrehbuch war in Bungalow 3.",
      holds: (scene) =>
        scene.locationOf(scene.holder("screenplay").id).id === "bungalow-3",
    },
  ],
  solution: {
    blaxton: { weapon: "award", location: "bungalow-4", motive: "revenge" },
    silverton: { weapon: "pen", location: "bungalow-1", motive: "money" },
    abalone: { weapon: "screenplay", location: "bungalow-3", motive: "book" },
    midnight: {
      weapon: "typewriter",
      location: "bungalow-2",
      motive: "win-award",
    },
  },
  murderer: "abalone",
  hints: [
    {
      text: 'Inspektor Irratino studierte das Tageshoroskop aller Beteiligten und verkündete dann: "Onkel Midnight war neben einem Kühlschrank in voller Größe."',
      book: true,
    },
    {
      text: 'Den Tipp entschlüsselst du, indem du jeden Buchstaben durch den nächsten im Alphabet ersetzt: "WER EINEN PREIS GEWINNEN WOLLTE, WAR LINKSHAENDER." Linkshänder ist nur Onkel Midnight. Er war in Bungalow 2 (Kühlschrank), der Füllfederhalter (Tinte) in Bungalow 1 - dem mit nur einem Raum.',
      marks: [{ a: "midnight", b: "win-award", value: "check" }],
    },
    {
      text: "Probiere aus, wer lügt. Silverton (Schreibmaschine in Bungalow 2, also bei Midnight) und Abalone (Silverton hatte die Schreibmaschine) widersprechen sich - einer von beiden lügt. Blaxton und Midnight sagen also die Wahrheit: Blaxton war in Bungalow 4 (Rache), das Riesendrehbuch in Bungalow 3.",
      marks: [
        { a: "midnight", b: "typewriter", value: "check" },
        { a: "blaxton", b: "revenge", value: "check" },
      ],
    },
    {
      text: "Lügt Silverton, hat er laut Abalone die Schreibmaschine. Dann hat Abalone keine, steht also unter den zwei Duschköpfen in Bungalow 3 - Silverton bliebe Bungalow 1, wo aber der Füllfederhalter liegt. Geht nicht. Also lügt A-Promi Abalone - sie ist die Mörderin.",
      marks: [{ a: "silverton", b: "pen", value: "check" }],
    },
    {
      text: "Midnight hat die Schreibmaschine in Bungalow 2. Abalone hat keine, also steht sie in Bungalow 3 mit dem Riesendrehbuch. Silverton hat den Füller in Bungalow 1, Blaxton den Filmpreis in Bungalow 4. Wer das Drehbuch hatte, wollte nicht für Geld töten: Abalone wollte ein wertvolles Buch stehlen, Silverton tötete für Geld.",
      marks: [
        { a: "abalone", b: "screenplay", value: "check" },
        { a: "blaxton", b: "award", value: "check" },
        { a: "silverton", b: "money", value: "check" },
        { a: "abalone", b: "book", value: "check" },
        { a: "blaxton", b: "bungalow-4", value: "check" },
        { a: "award", b: "bungalow-4", value: "check" },
        { a: "award", b: "revenge", value: "check" },
        { a: "bungalow-4", b: "revenge", value: "check" },
        { a: "silverton", b: "bungalow-1", value: "check" },
        { a: "pen", b: "bungalow-1", value: "check" },
        { a: "pen", b: "money", value: "check" },
        { a: "bungalow-1", b: "money", value: "check" },
        { a: "abalone", b: "bungalow-3", value: "check" },
        { a: "screenplay", b: "bungalow-3", value: "check" },
        { a: "screenplay", b: "book", value: "check" },
        { a: "bungalow-3", b: "book", value: "check" },
        { a: "midnight", b: "bungalow-2", value: "check" },
        { a: "typewriter", b: "bungalow-2", value: "check" },
        { a: "typewriter", b: "win-award", value: "check" },
        { a: "bungalow-2", b: "win-award", value: "check" },
      ],
    },
  ],
};
