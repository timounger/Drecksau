/**
 * Case 73, "Kitschy Kitschy Killing": the sandwich chef of a little diner in
 * New Aegis.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Hard Boiled), from the photos of
 * the book. The title plays on "kitchy-kitchy-coo"; the German one on
 * "kille, kille". The scrambled clue reads "Anyone with a vial of poison
 * would kill out of jealousy"; here it is scrambled again in German, letter
 * by letter within each word. The solver found the only solution, and the
 * hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const KITSCHY_KITSCHY_KILLING: Case = {
  id: "kitschy-kitschy-killing",
  number: 73,
  title: "Kille, kille, Kitschmord",
  story:
    "Logico ging in ein nettes kleines Diner, dekoriert mit Andenken an die Stadt - ihre heißen Quellen, ihre alten Ruinen und ihre UFO-Absturzstelle. Er wollte ein Sandwich bestellen, erfuhr aber, dass das unmöglich sei: Der Sandwichkoch war ermordet worden.",
  series: "volume1",
  difficulty: "hardBoiled",
  suspects: [
    {
      id: "raspberry",
      name: "Trainer Raspberry",
      icon: "\u{1F3C8}",
      description:
        "Einer der besten Trainer diesseits des Mississippi - egal, auf welcher Seite man steht.",
      heightCm: 183,
      hand: "left",
      eyes: "blue",
      hair: "blond",
      sign: "aries",
    },
    {
      id: "coffee",
      name: "General Coffee",
      icon: "☕",
      description:
        "Ein Espressokenner, der seine Lieblingskaffeetasse schon lange vermisst. Wenn er herausfindet, wer sie genommen hat, bringt er ihn um.",
      heightCm: 183,
      hand: "right",
      eyes: "darkBrown",
      hair: "bald",
      sign: "sagittarius",
    },
    {
      id: "aubergine",
      name: "Chefköchin Aubergine",
      icon: "\u{1F469}‍\u{1F373}",
      description:
        "Man erzählt sich, sie habe einst ihren Mann getötet, gekocht und dann in ihrem Restaurant serviert. Das stimmt nicht, aber schon, dass man sich das über sie erzählt, sagt einiges.",
      heightCm: 157,
      hand: "right",
      eyes: "blue",
      hair: "blond",
      sign: "libra",
    },
    {
      id: "grey",
      name: "Earl Grey",
      icon: "\u{1F9D0}",
      description:
        "Er stammt aus einer langen Reihe von Earl Greys. Ja, wie der Tee. Nein, er gibt keine Autogramme. Aber einen Beutel schenkt er dir, wenn du fragst.",
      heightCm: 175,
      hand: "right",
      eyes: "lightBrown",
      hair: "white",
      sign: "capricorn",
    },
  ],
  locations: [
    {
      id: "kitchen",
      name: "die Küche",
      icon: "\u{1F373}",
      description:
        "Du willst ehrlich nicht sehen, wie hier das Essen gemacht wird.",
      indoors: true,
    },
    {
      id: "bathroom",
      name: "die Toilette",
      icon: "\u{1F6BD}",
      description:
        "So wenig du in die Küche willst - hier willst du erst recht nicht rein.",
      indoors: true,
    },
    {
      id: "booths",
      name: "die Sitznischen",
      icon: "\u{1F6CB}️",
      description:
        "Sicher, die Bänke sind aufgerissen und die Polsterung quillt heraus. Aber es ist eine Sitznische!",
      indoors: true,
    },
    {
      id: "patio",
      name: "die Terrasse",
      icon: "⛱️",
      description:
        "Von der Terrasse blickt man auf den Marktplatz und kann prima Leute beobachten.",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "knickknack",
      name: "ein Wandschmuck",
      icon: "\u{1F531}",
      description:
        "An der Wand hängt ein alter Nippes. Es ist irgendein altes Werkzeug.",
      weight: "heavy",
      material: "Metall",
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
    {
      id: "spoon",
      name: "ein Löffel",
      icon: "\u{1F944}",
      description:
        "Wenn eine Gabel grausamer ist als ein Messer, stell dir vor, wie schlimm es wäre, jemanden mit einem Löffel zu töten.",
      weight: "light",
      material: "Metall",
    },
    {
      id: "oil",
      name: "hyperallergenes Öl",
      icon: "\u{1FAD9}",
      description:
        "Du hast richtig gelesen. Jeder ist tödlich allergisch dagegen.",
      weight: "light",
      material: "Öl",
    },
  ],
  motives: [
    { id: "point", name: "etwas beweisen", icon: "☝️" },
    { id: "seat", name: "einen besseren Platz bekommen", icon: "\u{1FA91}" },
    { id: "party", name: "eine Party aufpeppen", icon: "\u{1F973}" },
    { id: "jealousy", name: "aus Eifersucht", icon: "\u{1FAAC}" },
  ],
  clues: [
    {
      text: "Wer eine Party aufpeppen wollte, war nicht in der Küche (obwohl Kochen eine großartige Art ist, eine Party aufzupeppen).",
      holds: (scene) =>
        scene.locationOf(scene.driven("party").id).id !== "kitchen",
    },
    {
      text: "Wer etwas beweisen wollte, war Rechtshänder.",
      holds: (scene) => scene.driven("point").hand === "right",
    },
    {
      text: "Ein Widder hatte ein altes Werkzeug. Das klingt wie eine Beleidigung, ist aber einfach eine Tatsache.",
      holds: (scene) => scene.holder("knickknack").sign === "aries",
    },
    {
      text: "Chefköchin Aubergine war Mitglied des Ordens des Stahls.",
      holds: (scene) =>
        (scene.weaponOf("aubergine").material ?? "").includes("Metall"),
    },
    {
      text: "Jemand hatte einen verwürfelten Hinweis auf die Plastikspeisekarte gekritzelt: EWR IEN EFHÄHCLNCS TFIG HTEAT EWÜRD USA RUSEHIFTCE TEÖNT.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("poison").id)?.id === "jealousy",
    },
    {
      text: "In der Toilette wurde ein Tropfen Öl entdeckt.",
      holds: (scene) =>
        scene.locationOf(scene.holder("oil").id).id === "bathroom",
    },
    {
      text: "Ein Schütze saß auf der Terrasse.",
      holds: (scene) => scene.at("patio").sign === "sagittarius",
    },
    {
      text: "Mitglieder des Ordens des Stahls trugen nur Waffen aus Metall.",
      holds: (scene) =>
        (scene.weaponOf("aubergine").material ?? "").includes("Metall"),
    },
    {
      text: "Wer einen besseren Platz bekommen wollte, war ein Steinbock.",
      holds: (scene) => scene.driven("seat").sign === "capricorn",
    },
  ],
  body: {
    text: "Der Mord wurde mit einem Löffel begangen.",
    weapon: "spoon",
  },
  solution: {
    raspberry: { weapon: "knickknack", location: "booths", motive: "party" },
    coffee: { weapon: "poison", location: "patio", motive: "jealousy" },
    aubergine: { weapon: "spoon", location: "kitchen", motive: "point" },
    grey: { weapon: "oil", location: "bathroom", motive: "seat" },
  },
  murderer: "aubergine",
  hints: [
    {
      text: "Deductive Logico nutzte eine der ältesten esoterischen Methoden überhaupt - sein Bauchgefühl - und stellte fest, dass die zweitkleinste verdächtige Person das hyperallergene Öl hatte.",
      book: true,
    },
    {
      text: 'Der Hinweis, Wort für Wort entwürfelt: "WER EIN FLÄSCHCHEN GIFT HATTE, WÜRDE AUS EIFERSUCHT TÖTEN."',
      marks: [{ a: "poison", b: "jealousy", value: "check" }],
    },
    {
      text: "Das alte Werkzeug ist der Wandschmuck - ihn hatte der einzige Widder, Trainer Raspberry. Aubergine gehört zum Orden des Stahls und trug nur Metall: Wandschmuck oder Löffel, also der Löffel.",
      marks: [
        { a: "raspberry", b: "knickknack", value: "check" },
        { a: "aubergine", b: "spoon", value: "check" },
      ],
    },
    {
      text: "Der einzige Schütze ist General Coffee: Er saß auf der Terrasse. Den besseren Platz wollte der einzige Steinbock, Earl Grey.",
      marks: [
        { a: "coffee", b: "patio", value: "check" },
        { a: "grey", b: "seat", value: "check" },
      ],
    },
    {
      text: "Coffee und Grey haben Gift und Öl. Das Öl war in der Toilette, Coffee aber auf der Terrasse: Coffee hatte das Gift und war eifersüchtig, Grey hatte das Öl in der Toilette.",
      marks: [
        { a: "coffee", b: "poison", value: "check" },
        { a: "grey", b: "bathroom", value: "check" },
        { a: "poison", b: "patio", value: "check" },
      ],
    },
    {
      text: "Raspberry und Aubergine bleiben Küche und Sitznischen, etwas beweisen und die Party. Etwas beweisen wollte ein Rechtshänder - nicht Raspberry. Also peppte Raspberry die Party auf und war nicht in der Küche, sondern in den Sitznischen.",
      marks: [
        { a: "raspberry", b: "booths", value: "check" },
        { a: "raspberry", b: "party", value: "check" },
        { a: "aubergine", b: "kitchen", value: "check" },
        { a: "aubergine", b: "point", value: "check" },
        { a: "kitchen", b: "point", value: "check" },
        { a: "booths", b: "party", value: "check" },
        { a: "raspberry", b: "point", value: "cross" },
      ],
    },
    {
      text: "Der Löffel war die Tatwaffe: Chefköchin Aubergine tötete in der Küche, um etwas zu beweisen.",
      marks: [
        { a: "spoon", b: "kitchen", value: "check" },
        { a: "spoon", b: "point", value: "check" },
        { a: "knickknack", b: "booths", value: "check" },
        { a: "knickknack", b: "party", value: "check" },
        { a: "coffee", b: "jealousy", value: "check" },
        { a: "patio", b: "jealousy", value: "check" },
        { a: "grey", b: "oil", value: "check" },
        { a: "oil", b: "bathroom", value: "check" },
        { a: "oil", b: "seat", value: "check" },
        { a: "bathroom", b: "seat", value: "check" },
      ],
    },
  ],
};
