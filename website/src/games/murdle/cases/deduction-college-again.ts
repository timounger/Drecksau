/**
 * Case 64, "Deduction College": the librarian of Logico's old college, killed
 * while he did his research.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Hard Boiled), from the photos of the
 * book. Not the tutorial, which is also set at Deduction College. Mister
 * Shadow's card blacks out his height, eyes and hair.
 *
 * The book's clue sends the reader to Exhibit C, the labyrinth on the ancient
 * ruins, which the photos do not show. Without it two solutions are left:
 * Tuscany in the bookstore (second letter U) or Mister Shadow there (second
 * letter H). Case 65 begins "maybe this one was about him", so the librarian
 * was not killed to stop Logico - that is Tuscany's solution. The clue
 * therefore names the chamber, U, outright instead of pointing to the exhibit.
 * The hints are our own.
 */
import { REDACTED_HEIGHT, type Case } from "../engine/types";

/** The case. */
export const DEDUCTION_COLLEGE_AGAIN: Case = {
  id: "deduction-college-again",
  number: 64,
  title: "Wieder am Deduction College",
  story:
    "Wenn die Antworten, die Logico brauchte, in der Vergangenheit lagen, musste er wohl die Bücher wälzen. Also ging er an seine alte Hochschule, das Deduction College, um zu recherchieren. Aber jemand wollte ihn aufhalten. Entweder das, oder die Bibliothekarin wurde aus ganz anderen Gründen getötet.",
  series: "volume1",
  difficulty: "hardBoiled",
  suspects: [
    {
      id: "glaucous",
      name: "Dekan Glaucous",
      icon: "\u{1F454}",
      description:
        "Dekan irgendeines Fachbereichs am Deduction College. Was er so macht? Nun, unter anderem verwaltet er das Geld ...",
      heightCm: 168,
      hand: "right",
      eyes: "lightBrown",
      hair: "lightBrown",
      sign: "virgo",
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
      hair: "redacted",
      sign: "aquarius",
    },
    {
      id: "tuscany",
      name: "Rektorin Tuscany",
      icon: "\u{1F393}",
      description:
        "Als Leiterin des Deduction College hat sie genau deduziert, wie sie am besten verhindert, von einer Rivalin getötet zu werden. (Sie zuerst töten.)",
      heightCm: 165,
      hand: "left",
      eyes: "green",
      hair: "gray",
      sign: "libra",
    },
    {
      id: "saffron",
      name: "Miss Saffron",
      icon: "\u{1F380}",
      description:
        "Hinreißend und atemberaubend, aber vielleicht nicht die Hellste. Oder sie will, dass du das denkst. Oder sie will, dass du denkst, dass sie will, dass du das denkst.",
      heightCm: 157,
      hand: "left",
      eyes: "hazel",
      hair: "blond",
      sign: "libra",
    },
  ],
  locations: [
    {
      id: "bookstore",
      name: "die Buchhandlung",
      icon: "\u{1F4DA}",
      description:
        "Die größte Geldquelle auf dem Campus. Ein Schild wirbt mit drei Lehrbüchern für 750 Dollar.",
      indoors: true,
    },
    {
      id: "old-main",
      name: "das Alte Hauptgebäude",
      icon: "\u{1F3DB}️",
      description:
        "Das erste Gebäude auf dem Campus, das wichtigste und das am schlechtesten gepflegte. Die Farbe blättert von der Wand!",
      indoors: true,
    },
    {
      id: "stadium",
      name: "das Stadion",
      icon: "\u{1F3DF}️",
      description:
        "Auf dem Spielfeld liegt der allerbeste Kunstrasen, den man für Geld kaufen kann.",
      indoors: false,
    },
    {
      id: "arboretum",
      name: "das Arboretum",
      icon: "\u{1F333}",
      description:
        "Ein Baumgarten mitten auf dem Campus. Eichen, Kiefern - alle Bäume, die es gibt!",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "skull",
      name: "ein Kristallschädel",
      icon: "\u{1F480}",
      description:
        "Vielleicht der Schädel eines echten Außerirdischen, vielleicht nur ein Schwindel.",
      weight: "medium",
      material: "Kristall",
    },
    {
      id: "cord",
      name: "eine Abschlusskordel",
      icon: "\u{1F397}️",
      description:
        "Es wäre eine hohe akademische Ehre, mit so einer erdrosselt zu werden.",
      weight: "light",
      material: "Stoff",
    },
    {
      id: "pencil",
      name: "ein gespitzter Bleistift",
      icon: "✏️",
      description:
        "Damals noch mit echtem Blei. Ein Stich, und man starb an Bleivergiftung.",
      weight: "light",
      material: "Holz und Metall",
    },
    {
      id: "backpack",
      name: "ein schwerer Rucksack",
      icon: "\u{1F392}",
      description:
        "Endlich ein praktischer Nutzen für all die Logiklehrbücher.",
      weight: "heavy",
      material: "Stoff und Bücher",
    },
  ],
  motives: [
    { id: "point", name: "etwas beweisen", icon: "☝️" },
    { id: "stop", name: "Logico aufhalten", icon: "\u{1F6AB}" },
    { id: "good", name: "für das Allgemeinwohl", icon: "\u{1F932}" },
    { id: "diversion", name: "ein Ablenkungsmanöver", icon: "\u{1F449}" },
  ],
  clues: [
    {
      text: "Wer für ein Ablenkungsmanöver töten wollte, war im Stadion.",
      holds: (scene) =>
        scene.locationOf(scene.driven("diversion").id).id === "stadium",
    },
    {
      text: "Mister Shadow wollte nicht für das Allgemeinwohl töten.",
      holds: (scene) => scene.motiveOf("shadow")?.id !== "good",
    },
    {
      text: "Eine Jungfrau betrachtete eine Kiefer. Sie war hübsch.",
      holds: (scene) => scene.at("arboretum").sign === "virgo",
    },
    {
      text: "In dem Labyrinth, das in die alten Ruinen eingemeißelt ist, ist Kammer 1 mit der Kammer U verbunden - sie trägt den zweiten Buchstaben des Nachnamens der Person in der Buchhandlung.",
      holds: (scene) => scene.at("bookstore").id === "tuscany",
    },
    {
      text: "Logico fand im Alten Hauptgebäude eine Kristallscherbe.",
      holds: (scene) =>
        scene.locationOf(scene.holder("skull").id).id === "old-main",
    },
    {
      text: "Wer etwas beweisen wollte, war Rechtshänder.",
      holds: (scene) => scene.driven("point").hand === "right",
    },
    {
      text: "Eine Abschlusskordel lag draußen auf dem Boden.",
      holds: (scene) => !scene.locationOf(scene.holder("cord").id).indoors,
    },
    {
      text: "Miss Saffron wurde mit einem gespitzten Bleistift gesehen - vielleicht ist sie ja doch klug!",
      holds: (scene) => scene.weaponOf("saffron").id === "pencil",
    },
  ],
  body: {
    text: "Neben der Bibliothekarin wurde ein schwerer Rucksack gefunden.",
    weapon: "backpack",
  },
  exhibits: ["astrology"],
  solution: {
    glaucous: { weapon: "cord", location: "arboretum", motive: "point" },
    shadow: { weapon: "skull", location: "old-main", motive: "stop" },
    tuscany: { weapon: "backpack", location: "bookstore", motive: "good" },
    saffron: { weapon: "pencil", location: "stadium", motive: "diversion" },
  },
  murderer: "tuscany",
  hints: [
    {
      text: "Logico hörte einige Studierende aufgeregt von einer schattenhaften Gestalt im Alten Hauptgebäude rufen.",
      book: true,
    },
    {
      text: "Jungfrau ist nur Dekan Glaucous: Er war im Arboretum bei den Kiefern. Rechtshänder ist auch nur er - er wollte etwas beweisen.",
      marks: [{ a: "glaucous", b: "arboretum", value: "check" }],
    },
    {
      text: "Der zweite Buchstabe von Tuscany ist das U: Rektorin Tuscany war in der Buchhandlung.",
      marks: [{ a: "tuscany", b: "bookstore", value: "check" }],
    },
    {
      text: "Miss Saffron hatte den Bleistift, war also nicht im Alten Hauptgebäude, wo der Kristallschädel lag. Ihr bleibt das Stadion - und für Mister Shadow das Alte Hauptgebäude mit dem Kristallschädel.",
      marks: [
        { a: "saffron", b: "pencil", value: "check" },
        { a: "skull", b: "old-main", value: "check" },
        { a: "shadow", b: "skull", value: "check" },
        { a: "shadow", b: "old-main", value: "check" },
      ],
    },
    {
      text: "Die Abschlusskordel lag draußen. Im Stadion hatte Saffron den Bleistift, also lag die Kordel im Arboretum bei Glaucous. Tuscany bleibt der schwere Rucksack: Sie ist die Mörderin.",
      marks: [
        { a: "saffron", b: "stadium", value: "check" },
        { a: "pencil", b: "stadium", value: "check" },
        { a: "tuscany", b: "backpack", value: "check" },
      ],
    },
    {
      text: "Wer ein Ablenkungsmanöver wollte, war im Stadion: Saffron. Shadow wollte nicht für das Allgemeinwohl töten, also Logico aufhalten - und Tuscany tötete für das Allgemeinwohl.",
      marks: [
        { a: "saffron", b: "diversion", value: "check" },
        { a: "stadium", b: "diversion", value: "check" },
        { a: "shadow", b: "stop", value: "check" },
        { a: "tuscany", b: "good", value: "check" },
        { a: "glaucous", b: "cord", value: "check" },
        { a: "glaucous", b: "point", value: "check" },
        { a: "cord", b: "arboretum", value: "check" },
        { a: "cord", b: "point", value: "check" },
        { a: "arboretum", b: "point", value: "check" },
        { a: "skull", b: "stop", value: "check" },
        { a: "old-main", b: "stop", value: "check" },
        { a: "backpack", b: "bookstore", value: "check" },
        { a: "backpack", b: "good", value: "check" },
        { a: "bookstore", b: "good", value: "check" },
        { a: "pencil", b: "diversion", value: "check" },
      ],
    },
  ],
};
