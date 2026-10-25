/**
 * Case 79, "Murder at the Movies": the usher of a movie theater.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Impossible), from photos of the
 * book. Motives and statements, no body clue - the liar is the murderer. The
 * scrambled clue reads "Hack Blaxton did not want to get a better seat"; here
 * it is scrambled again in German, letter by letter within each word. The
 * almonds give away the poisoned popcorn, the chocolate the stale candy bar.
 * The hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const MURDER_AT_THE_MOVIES: Case = {
  id: "murder-at-the-movies",
  number: 79,
  title: "Mord im Kino",
  story:
    "Deductive Logico hatte seit ein paar Tagen nichts von den Produzenten von Murdle: Der Film gehört, also sah er sich in einem Kino nahe seinem Hotel einen Krimi an. Als er seinen Platz nicht fand, suchte er den Platzanweiser. Und als er den Platzanweiser nicht fand, fand er heraus, dass er tot war.",
  series: "volume1",
  difficulty: "impossible",
  suspects: [
    {
      id: "pearl",
      name: "Pearl, AGE",
      icon: "\u{1F453}",
      description:
        "Cutterin (Amerikanische Gilde der Editoren) einiger der besten und einiger der erfolgreichsten Filme aller Zeiten - nur nie beides zugleich.",
      heightCm: 165,
      hand: "right",
      eyes: "blue",
      hair: "blond",
      sign: "aquarius",
    },
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
      id: "dusty",
      name: "Regisseur Dusty",
      icon: "\u{1F3AC}",
      description:
        "Ein echter Filmemacher. Ihm liegt die Kunst des Kinos am Herzen, sogar (oder gerade) mehr als ein Menschenleben.",
      heightCm: 178,
      hand: "left",
      eyes: "hazel",
      hair: "bald",
      sign: "pisces",
    },
  ],
  locations: [
    {
      id: "projection",
      name: "der Vorführraum",
      icon: "\u{1F4FD}️",
      description:
        "Aus naheliegenden Gründen ein klassischer Ort für einen Mord - besonders, wenn man den Film schon kennt und weiß, wann die lauten Stellen kommen.",
      indoors: true,
    },
    {
      id: "boxOffice",
      name: "die Kinokasse",
      icon: "\u{1F39F}️",
      description:
        "Die Karten sind teuer, aber nicht so teuer wie das Popcorn, und das ist nicht so teuer wie die Getränke.",
      indoors: true,
    },
    {
      id: "lobby",
      name: "das Foyer",
      icon: "\u{1F5BC}️",
      description:
        "Früher hing hier ein riesiger Kronleuchter. Aber er fiel immer wieder herunter und erschlug auf mysteriöse Weise Leute. Jetzt hängen hier nur noch gerahmte Plakate.",
      indoors: true,
    },
    {
      id: "theater",
      name: "der Kinosaal",
      icon: "\u{1F4FA}",
      description:
        "Aus rechtlichen Gründen dürfen wir nicht sagen, dass es ein IMAX ist. Aber wir dürfen auch nicht sagen, dass es keins ist.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "dagger",
      name: "ein Ritualdolch",
      icon: "\u{1F5E1}️",
      description: "Er ist aus Knochen. Hoffentlich keinem menschlichen!",
      weight: "medium",
      material: "Knochen",
    },
    {
      id: "award",
      name: "ein Filmpreis",
      icon: "\u{1F3C6}",
      description: "Hat eigentlich jeder so ein Ding?",
      weight: "medium",
      material: "Metall",
    },
    {
      id: "candy",
      name: "ein alter Schokoriegel",
      icon: "\u{1F36B}",
      description:
        "Hart wie ein Brecheisen - er liegt hier schon seit Lawrence von Arabien.",
      weight: "light",
      material: "Schokolade",
    },
    {
      id: "popcorn",
      name: "vergiftetes Popcorn",
      icon: "\u{1F37F}",
      description:
        "Frisch gepoppt und frisch vergiftet. Mit Mandelgeschmack und -duft!",
      weight: "medium",
      material: "Mais und Öl",
    },
  ],
  motives: [
    { id: "could", name: "sehen, ob man es kann", icon: "\u{1F441}️" },
    {
      id: "movie",
      name: "den eigenen Film gedreht bekommen",
      icon: "\u{1F3A5}",
    },
    { id: "seat", name: "einen besseren Platz bekommen", icon: "\u{1FA91}" },
    { id: "idea", name: "eine Idee stehlen", icon: "\u{1F4A1}" },
  ],
  clues: [
    {
      text: "Wer den alten Schokoriegel dabeihatte, war Linkshänder.",
      holds: (scene) => scene.holder("candy").hand === "left",
    },
    {
      text: "Der Filmvorführer gab Logico einen verwürfelten Hinweis: CIBSLNRGIHEER BAXNOLT ELTWLO NIEKNE NEBESERS ATLPZ.",
      holds: (scene) => scene.motiveOf("blaxton")?.id !== "seat",
    },
    {
      text: "In der Kinokasse war der Mandelgeruch überwältigend.",
      holds: (scene) =>
        scene.locationOf(scene.holder("popcorn").id).id === "boxOffice",
    },
    {
      text: "Wer einen Filmpreis hatte, wollte eine Idee stehlen.",
      holds: (scene) => scene.motiveOf(scene.holder("award").id)?.id === "idea",
    },
    {
      text: "Pearl, AGE, wurde gesehen, wie sie einen Ritualdolch in ihre Handtasche gleiten ließ.",
      holds: (scene) => scene.weaponOf("pearl").id === "dagger",
    },
    {
      text: "Tief im Inneren wollte Superfan Smoky sehen, ob er töten kann.",
      holds: (scene) => scene.motiveOf("smoky")?.id === "could",
    },
    {
      text: "Auf dem Boden des Kinosaals wurde ein Stück Schokolade gefunden.",
      holds: (scene) =>
        scene.locationOf(scene.holder("candy").id).id === "theater",
    },
  ],
  statements: [
    {
      by: "pearl",
      text: "Mir scheint, Schreiberling Blaxton hatte vergiftetes Popcorn dabei.",
      holds: (scene) => scene.weaponOf("blaxton").id === "popcorn",
    },
    {
      by: "blaxton",
      text: "Stellen Sie sich vor: Regisseur Dusty hatte einen Filmpreis dabei.",
      holds: (scene) => scene.weaponOf("dusty").id === "award",
    },
    {
      by: "smoky",
      text: "Regisseur Dusty hatte kein vergiftetes Popcorn dabei.",
      holds: (scene) => scene.weaponOf("dusty").id !== "popcorn",
    },
    {
      by: "dusty",
      text: "Ich bin sehr beschäftigt, aber ein Ritualdolch war im Vorführraum.",
      holds: (scene) =>
        scene.locationOf(scene.holder("dagger").id).id === "projection",
    },
  ],
  solution: {
    pearl: { weapon: "dagger", location: "lobby", motive: "seat" },
    blaxton: { weapon: "popcorn", location: "boxOffice", motive: "movie" },
    smoky: { weapon: "candy", location: "theater", motive: "could" },
    dusty: { weapon: "award", location: "projection", motive: "idea" },
  },
  murderer: "dusty",
  hints: [
    {
      text: '"Logico, schön, von dir zu hören. Ich glaube, wenn du nachsiehst, wirst du feststellen, dass in der Lobby ein Splitter echten Knochens gefunden wurde. Zumindest habe ich das festgestellt, als ich vom Hausarrest aus per Fernwahrnehmung nachgesehen habe."',
      book: true,
    },
    {
      text: 'Der Hinweis, Wort für Wort entwürfelt: "SCHREIBERLING BLAXTON WOLLTE KEINEN BESSEREN PLATZ". Pearl hat den Ritualdolch, Smoky will sehen, ob er es kann - also hat Smoky nicht den Filmpreis (dessen Besitzer will eine Idee stehlen).',
      marks: [
        { a: "blaxton", b: "seat", value: "cross" },
        { a: "pearl", b: "dagger", value: "check" },
        { a: "award", b: "idea", value: "check" },
      ],
    },
    {
      text: "Probiere aus, wer lügt. Lügt Pearl, hat Blaxton kein Popcorn - also den Preis oder den Schokoriegel; den Riegel hat ein Linkshänder, also den Preis. Laut Blaxton hätte aber Dusty den Preis. Geht nicht.",
      marks: [{ a: "blaxton", b: "popcorn", value: "check" }],
    },
    {
      text: "Lügt Blaxton, hat er laut Pearl das Popcorn, und Dusty hat keinen Preis - also den Schokoriegel, und Smoky bliebe der Preis. Geht nicht. Lügt Smoky, hätten Dusty und Blaxton beide das Popcorn. Geht auch nicht.",
      marks: [{ a: "smoky", b: "candy", value: "check" }],
    },
    {
      text: "Also lügt Regisseur Dusty: Blaxton hat das Popcorn (Kinokasse, Mandelgeruch), Dusty den Filmpreis, Smoky den Schokoriegel (Kinosaal). Der Dolch war nicht im Vorführraum - Pearl war im Foyer, Dusty im Vorführraum.",
      marks: [
        { a: "blaxton", b: "boxOffice", value: "check" },
        { a: "smoky", b: "theater", value: "check" },
        { a: "dusty", b: "award", value: "check" },
        { a: "candy", b: "theater", value: "check" },
        { a: "popcorn", b: "boxOffice", value: "check" },
        { a: "pearl", b: "lobby", value: "check" },
        { a: "dusty", b: "projection", value: "check" },
      ],
    },
    {
      text: "Dusty will eine Idee stehlen, Smoky sehen, ob er es kann, Blaxton keinen besseren Platz - also seinen Film gedreht bekommen; Pearl will den besseren Platz. Regisseur Dusty war es mit dem Filmpreis im Vorführraum, um eine Idee zu stehlen.",
      marks: [
        { a: "pearl", b: "seat", value: "check" },
        { a: "blaxton", b: "movie", value: "check" },
        { a: "dusty", b: "idea", value: "check" },
        { a: "award", b: "projection", value: "check" },
        { a: "projection", b: "idea", value: "check" },
        { a: "dagger", b: "lobby", value: "check" },
        { a: "dagger", b: "seat", value: "check" },
        { a: "lobby", b: "seat", value: "check" },
        { a: "popcorn", b: "movie", value: "check" },
        { a: "boxOffice", b: "movie", value: "check" },
        { a: "smoky", b: "could", value: "check" },
        { a: "candy", b: "could", value: "check" },
        { a: "theater", b: "could", value: "check" },
      ],
    },
  ],
};
