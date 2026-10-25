/**
 * Case 96, "Breaking and Investigating": the security guard of the Midnight
 * Movies lot.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Impossible), from the photos of the
 * book. Motives and statements, no body clue - the liar is the murderer.
 *
 * Two clues need Exhibit D, the map of Midnight Movie Studios, which the
 * photos do not show. "The building directly north of the luxury theatre"
 * is named outright as the prop shop - the place the book's solution puts
 * the marot cards. "The building directly east of the studio tour check-in"
 * is named outright as the luxury theatre: without that clue, the case has
 * two solutions (Midnight III or Steel in the luxury theatre), and only the
 * luxury theatre tells them apart - the bungalows would not. Members of the Order of Buried Talents all wanted
 * recognition, and everyone with an award joined it; both clues carry that
 * one predicate. The scrambled message reads "The person with a magnifying
 * glass wanted to take over Hollywood"; here it is scrambled again in
 * German, letter by letter within each word. The first hint is the book's;
 * the solver's only solution is the one the book prints, and the other
 * hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const BREAKING_AND_INVESTIGATING: Case = {
  id: "breaking-and-investigating",
  number: 96,
  title: "Einbruch und Ermittlung",
  story:
    "Deductive Logico und Inspektor Irratino schlichen sich mit einem alten Trick aufs Studiogelände: Lügen. Sie verkleideten sich als Mechaniker, klebten sich falsche Schnurrbärte an und spazierten einfach hinein. Irgendwann begriffen sie, warum es so leicht gewesen war: Der Wachmann war getötet worden.",
  series: "volume1",
  difficulty: "impossible",
  suspects: [
    {
      id: "midnight-iii",
      name: "Midnight III",
      icon: "\u{1F576}️",
      description:
        "Er findet, dass sein Vater das Studio ruiniert, weil er sich zwischen Filmemachen und Geldmachen aufteilt.",
      heightCm: 173,
      hand: "left",
      eyes: "darkBrown",
      hair: "darkBrown",
      sign: "libra",
    },
    {
      id: "celadon",
      name: "Ministerin Celadon",
      icon: "\u{1FA96}",
      description:
        "Die Verteidigungsministerin - und persönlich verantwortlich für eine Reihe von Kriegsverbrechen, von denen einige inzwischen nach ihr benannt sind.",
      heightCm: 168,
      hand: "left",
      eyes: "green",
      hair: "lightBrown",
      sign: "leo",
    },
    {
      id: "president",
      name: "Präsident Midnight",
      icon: "\u{1F3A9}",
      description:
        "Der Chef von Midnight Movies. Ihm liegen Kunst und Geschäft am Herzen, aber ganz sicher nicht in dieser Reihenfolge.",
      heightCm: 188,
      hand: "right",
      eyes: "black",
      hair: "black",
      sign: "capricorn",
    },
    {
      id: "steel",
      name: "Chefproduzentin Steel",
      icon: "\u{1F4BC}",
      description:
        "Die reichste, klügste und gemeinste Produzentin Hollywoods. Vorerst.",
      heightCm: 168,
      hand: "right",
      eyes: "gray",
      hair: "white",
      sign: "aries",
    },
  ],
  locations: [
    {
      id: "theater",
      name: "das Luxuskino",
      icon: "\u{1F3A6}",
      description:
        "Hier wird das Material für Manager vorgeführt, die nicht Regie führen können, aber irgendwie Anmerkungen machen.",
      indoors: true,
    },
    {
      id: "bungalows",
      name: "die Bungalows",
      icon: "\u{1F3E0}",
      description:
        "Hier wohnen die Stars, während sie an einem Film arbeiten - so muss das Studio keine Hotelzimmer bezahlen.",
      indoors: true,
    },
    {
      id: "prop-shop",
      name: "die Requisitenwerkstatt",
      icon: "\u{1F3A8}",
      description:
        "Hier entstehen all die falschen Messer, falschen Autos und falschen Tränen.",
      indoors: true,
    },
    {
      id: "stage",
      name: "die verschlossene Bühne",
      icon: "\u{1F512}",
      description:
        "Niemand weiß, was hier drin ist. Sie ist seit Jahren verschlossen.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "cards",
      name: "ein Satz Marot-Karten",
      icon: "\u{1F0CF}",
      description:
        "Mit diesen Tarotkarten im Mordstil kannst du deine Zukunft lesen.",
      weight: "light",
      material: "Papier",
    },
    {
      id: "award",
      name: "ein Filmpreis",
      icon: "\u{1F3C6}",
      description:
        "Inzwischen war Logico überzeugt, dass man sie als Briefbeschwerer benutzen könnte.",
      weight: "medium",
      material: "Metall",
    },
    {
      id: "c-stand",
      name: "ein C-Stativ",
      icon: "\u{1F4A1}",
      description: "Zum Halten von Scheinwerfern. Oder zum Schädeleinschlagen.",
      weight: "heavy",
      material: "Metall",
    },
    {
      id: "glass",
      name: "eine Lupe",
      icon: "\u{1F50D}",
      description:
        "Damit kann man einen Hinweis finden oder jemandem eins überziehen.",
      weight: "medium",
      material: "Metall und Glas",
    },
  ],
  motives: [
    {
      id: "recognition",
      name: "die verdiente Anerkennung bekommen",
      icon: "\u{1F31F}",
    },
    { id: "promote", name: "einen Film bewerben", icon: "\u{1F4E3}" },
    { id: "revenge", name: "Rache nehmen", icon: "⚔️" },
    { id: "hollywood", name: "Hollywood übernehmen", icon: "\u{1F3AC}" },
  ],
  clues: [
    {
      text: "Wer einen Film bewerben wollte, war in den Bungalows.",
      holds: (scene) =>
        scene.locationOf(scene.driven("promote").id).id === "bungalows",
    },
    {
      text: "Eine Wahrsagekarte wurde im Gebäude direkt nördlich des Luxuskinos entdeckt - laut dem Lageplan der Midnight Movie Studios ist das die Requisitenwerkstatt. (Im Buch: siehe Beweisstück D.)",
      holds: (scene) =>
        scene.locationOf(scene.holder("cards").id).id === "prop-shop",
    },
    {
      text: "Alle im Orden der Vergrabenen Talente wollten die Anerkennung bekommen, die sie verdienten.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("award").id)?.id === "recognition",
    },
    {
      text: "Analysten fanden an der Kleidung von Midnight III Spuren einer Waffe aus Metall.",
      holds: (scene) =>
        (scene.weaponOf("midnight-iii").material ?? "").includes("Metall"),
    },
    {
      text: "In den Papieren des Wachmanns fand man eine verwürfelte Nachricht: RWE EDI UEPL ATEHT, LTOLEW OLWOHDYOL EERENMBÜHN.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("glass").id)?.id === "hollywood",
    },
    {
      text: "Ein Steinbock hatte das C-Stativ. (Das C stand für Capricornus, den Steinbock.)",
      holds: (scene) => scene.holder("c-stand").sign === "capricorn",
    },
    {
      text: "Alle mit einem Filmpreis traten dem Orden der Vergrabenen Talente bei.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("award").id)?.id === "recognition",
    },
    {
      text: "Wer im Gebäude direkt östlich des Check-ins der Studiotour war - laut dem Lageplan das Luxuskino -, war Rechtshänder. (Im Buch: siehe Beweisstück D.)",
      holds: (scene) => scene.at("theater").hand === "right",
    },
  ],
  statements: [
    {
      by: "midnight-iii",
      text: "Ich war nicht im Luxuskino.",
      holds: (scene) => scene.locationOf("midnight-iii").id !== "theater",
    },
    {
      by: "celadon",
      text: "Eine Lupe war auf der verschlossenen Bühne.",
      holds: (scene) =>
        scene.locationOf(scene.holder("glass").id).id === "stage",
    },
    {
      by: "president",
      text: "Midnight III hatte keine Lupe dabei.",
      holds: (scene) => scene.weaponOf("midnight-iii").id !== "glass",
    },
    {
      by: "steel",
      text: "Hören Sie: Ich wollte Hollywood übernehmen.",
      holds: (scene) => scene.motiveOf("steel")?.id === "hollywood",
    },
  ],
  exhibits: ["astrology"],
  solution: {
    "midnight-iii": {
      weapon: "award",
      location: "stage",
      motive: "recognition",
    },
    celadon: { weapon: "cards", location: "prop-shop", motive: "revenge" },
    president: { weapon: "c-stand", location: "bungalows", motive: "promote" },
    steel: { weapon: "glass", location: "theater", motive: "hollywood" },
  },
  murderer: "celadon",
  hints: [
    {
      text: 'Inspektor Irratino ermittelte mit einer Wünschelrute, dass ein Filmpreis auf der verschlossenen Bühne war. "Hm, diese Bühne sollten wir uns wirklich genauer ansehen, Logico."',
      book: true,
      marks: [{ a: "award", b: "stage", value: "check" }],
    },
    {
      text: "Der einzige Steinbock, Präsident Midnight, hatte das C-Stativ. Die Marot-Karten (Wahrsagekarten) lagen in der Requisitenwerkstatt. Midnight III hatte eine Waffe aus Metall: den Filmpreis oder die Lupe. Im Luxuskino war ein Rechtshänder - Präsident Midnight oder Steel.",
      marks: [
        { a: "president", b: "c-stand", value: "check" },
        { a: "cards", b: "prop-shop", value: "check" },
        { a: "midnight-iii", b: "award", value: "check" },
        { a: "steel", b: "theater", value: "check" },
      ],
    },
    {
      text: 'Die Nachricht, Wort für Wort entwürfelt: "WER DIE LUPE HATTE, WOLLTE HOLLYWOOD ÜBERNEHMEN." Wer den Filmpreis hatte, wollte Anerkennung (Orden der Vergrabenen Talente).',
      marks: [
        { a: "award", b: "recognition", value: "check" },
        { a: "glass", b: "hollywood", value: "check" },
      ],
    },
    {
      text: "Probiere aus, wer lügt. Lügt Midnight III, war er im Luxuskino - als Linkshänder geht das nicht. Lügt der Präsident, hat Midnight III die Lupe und will Hollywood übernehmen - aber laut Steel will sie das. Geht nicht.",
      marks: [
        { a: "midnight-iii", b: "theater", value: "cross" },
        { a: "steel", b: "glass", value: "check" },
        { a: "steel", b: "hollywood", value: "check" },
      ],
    },
    {
      text: "Lügt Steel, stimmt der Rest: Midnight III hat den Filmpreis (Anerkennung), die Lupe hat nicht Steel, also Celadon, und die steht auf der Bühne. Steel hat die Karten in der Werkstatt, der Präsident ist im Luxuskino, Midnight III in den Bungalows - dort war aber, wer einen Film bewerben wollte. Geht nicht. Also lügt Ministerin Celadon - sie ist die Mörderin.",
      marks: [
        { a: "midnight-iii", b: "stage", value: "check" },
        { a: "midnight-iii", b: "recognition", value: "check" },
        { a: "stage", b: "recognition", value: "check" },
        { a: "president", b: "bungalows", value: "check" },
        { a: "president", b: "promote", value: "check" },
        { a: "bungalows", b: "promote", value: "check" },
      ],
    },
    {
      text: "Midnight III hat den Filmpreis (Anerkennung), Steel die Lupe (Hollywood), Celadon die Karten in der Werkstatt. Die Lupe war nicht auf der Bühne, Midnight III nicht im Luxuskino. Werben muss der Präsident (Celadon ist nicht in den Bungalows): Er war in den Bungalows, Steel im Luxuskino, Midnight III auf der Bühne - und Celadon wollte Rache.",
      marks: [
        { a: "glass", b: "theater", value: "check" },
        { a: "celadon", b: "revenge", value: "check" },
        { a: "celadon", b: "cards", value: "check" },
        { a: "celadon", b: "prop-shop", value: "check" },
        { a: "cards", b: "revenge", value: "check" },
        { a: "prop-shop", b: "revenge", value: "check" },
        { a: "c-stand", b: "bungalows", value: "check" },
        { a: "c-stand", b: "promote", value: "check" },
        { a: "theater", b: "hollywood", value: "check" },
      ],
    },
  ],
};
