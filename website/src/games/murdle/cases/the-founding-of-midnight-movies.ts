/**
 * Case 99, "The Founding of Midnight Movies": the original owner of the
 * land, long ago.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Impossible), from the photos of the
 * book. Motives and statements, no body clue - the liar is the murderer.
 * The first hint is the book's; the solver's only solution is the one the
 * book prints, and the other hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const THE_FOUNDING_OF_MIDNIGHT_MOVIES: Case = {
  id: "the-founding-of-midnight-movies",
  number: 99,
  title: "Die Gründung von Midnight Movies",
  story:
    "Plötzlich ergab für Deductive Logico alles einen Sinn. Mit Inspektor Irratinos Visualisierungstechniken konnte er in der Zeit zurückreisen (im Geiste) und die Gründung des Studios so klar sehen wie einen sepiagetönten Tag. Es war nicht aus Liebe zum Kino entstanden, sondern aus Gier. Denn der ursprüngliche Besitzer des Landes war ermordet worden.",
  series: "volume1",
  difficulty: "impossible",
  suspects: [
    {
      id: "midnight-i",
      name: "Midnight I",
      icon: "\u{1F4B5}",
      description:
        "Der Gründer von Midnight Movies. Ein Genie darin, Leute für weniger Geld härter arbeiten zu lassen. Und einer der gemeinsten Männer, die je gelebt haben.",
      heightCm: 180,
      hand: "right",
      eyes: "blue",
      hair: "darkBrown",
      sign: "gemini",
    },
    {
      id: "teenage",
      name: "Teenager Midnight",
      icon: "\u{1F3A9}",
      description:
        "Damals war er ein Teenager, und sein Vater hatte ihm gerade diesen lächerlichen Zylinder geschenkt.",
      heightCm: 188,
      hand: "right",
      eyes: "black",
      hair: "black",
      sign: "capricorn",
    },
    {
      id: "amaranth",
      name: "Président Amaranth",
      icon: "\u{1F1EB}\u{1F1F7}",
      description:
        "Ein waschechter französischer Président. Amaranth verbringt gern Zeit mit seinen Wählern - besonders mit einem gewissen einen Prozent von ihnen.",
      heightCm: 178,
      hand: "right",
      eyes: "gray",
      hair: "red",
      sign: "gemini",
    },
    {
      id: "chalk",
      name: "Vorsitzender Chalk",
      icon: "\u{1F474}",
      description:
        "Er hat das Verlagsgeschäft vor Jahren durchschaut und nie zurückgeblickt. E-Books nannte er eine Modeerscheinung, und er besitzt noch immer ein Telefon mit Wählscheibe. Er ist eine Milliarde Dollar schwer.",
      heightCm: 175,
      hand: "right",
      eyes: "blue",
      hair: "white",
      sign: "sagittarius",
    },
  ],
  locations: [
    {
      id: "derrick",
      name: "ein Bohrturm",
      icon: "\u{1F5FC}",
      description:
        "Mit diesem gewaltigen Bohrturm graben sie gerade einen weiteren Brunnen.",
      indoors: false,
    },
    {
      id: "pumpjack",
      name: "eine Pferdekopfpumpe",
      icon: "\u{1F3D7}️",
      description:
        "Sie arbeitet hart, nickt auf und ab und holt Öl aus dem Boden.",
      indoors: false,
    },
    {
      id: "ruins",
      name: "die alten Ruinen",
      icon: "\u{1F3DB}️",
      description:
        "Man sieht sie vom Rand der Felder aus, als Silhouette im Licht der untergehenden Sonne.",
      indoors: false,
    },
    {
      id: "offices",
      name: "die Büros",
      icon: "\u{1FA91}",
      description:
        "So stark klimatisiert, dass sie den Großteil der Energie verbrauchen, die hier gefördert wird.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "crowbar",
      name: "ein Brecheisen",
      icon: "\u{1FA9B}",
      description:
        "Ehrlich gesagt wird es öfter für Verbrechen benutzt als für irgendetwas anderes.",
      weight: "medium",
      material: "Metall",
    },
    {
      id: "rebar",
      name: "ein Stück Bewehrungsstahl",
      icon: "\u{1F529}",
      description:
        "Ein langes Stück Metall. Wenn das keine Waffe ist, dann gar nichts. Findet sich oft bei Zement.",
      weight: "medium",
      material: "Metall",
    },
    {
      id: "drum",
      name: "ein Ölfass",
      icon: "\u{1F6E2}️",
      description:
        "Eigentlich eher ein Kanister als ein Fass: Ein Ölfass-Solo hat noch keine Band gespielt.",
      weight: "heavy",
      material: "Metall und Öl",
    },
    {
      id: "shovel",
      name: "eine Schaufel",
      icon: "\u{1FA8F}",
      description:
        "Das Großartige am Morden mit einer Schaufel: Man kann damit auch ein Loch graben, um die Leiche zu verstecken.",
      weight: "medium",
      material: "Metall und Holz",
    },
  ],
  motives: [
    { id: "found", name: "ein Studio gründen", icon: "\u{1F3AC}" },
    { id: "union", name: "eine Gewerkschaft zerschlagen", icon: "\u{1F494}" },
    { id: "inherit", name: "ein Erbe antreten", icon: "\u{1F4B0}" },
    { id: "war", name: "helfen, einen Krieg zu gewinnen", icon: "\u{1F4A3}" },
  ],
  clues: [
    {
      text: "Entweder war Teenager Midnight an der Pferdekopfpumpe, oder Midnight I hatte eine Schaufel dabei.",
      holds: (scene) =>
        (scene.locationOf("teenage").id === "pumpjack") !==
        (scene.weaponOf("midnight-i").id === "shovel"),
    },
    {
      text: "Der kleinste Verdächtige hatte eine Rivalität mit dem, der ein Ölfass mitgebracht hatte.",
      holds: (scene) => scene.holder("drum").id !== "chalk",
    },
    {
      text: "Wer helfen wollte, einen Krieg zu gewinnen, war an der Pferdekopfpumpe.",
      holds: (scene) =>
        scene.locationOf(scene.driven("war").id).id === "pumpjack",
    },
    {
      text: "Président Amaranth entspannte sich in einem klimatisierten Raum.",
      holds: (scene) => scene.locationOf("amaranth").id === "offices",
    },
    {
      text: "Wer bei den alten Ruinen war, hatte dunkelbraune Haare.",
      holds: (scene) => scene.at("ruins").hair === "darkBrown",
    },
    {
      text: "Wer ein Studio gründen wollte, stand neben den alten Ruinen.",
      holds: (scene) =>
        scene.locationOf(scene.driven("found").id).id === "ruins",
    },
    {
      text: "Wer das Ölfass hatte, wollte ein Erbe antreten.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("drum").id)?.id === "inherit",
    },
  ],
  statements: [
    {
      by: "midnight-i",
      text: "Klar wie der Tag: Vorsitzender Chalk hatte ein Stück Bewehrungsstahl dabei.",
      holds: (scene) => scene.weaponOf("chalk").id === "rebar",
    },
    {
      by: "teenage",
      text: "Ich hatte kein Stück Bewehrungsstahl dabei.",
      holds: (scene) => scene.weaponOf("teenage").id !== "rebar",
    },
    {
      by: "amaranth",
      text: "Die Schaufel war bei den Ruinen.",
      holds: (scene) =>
        scene.locationOf(scene.holder("shovel").id).id === "ruins",
    },
    {
      by: "chalk",
      text: "Hmm ... Midnight I hatte eine Schaufel dabei.",
      holds: (scene) => scene.weaponOf("midnight-i").id === "shovel",
    },
  ],
  solution: {
    "midnight-i": { weapon: "shovel", location: "ruins", motive: "found" },
    teenage: { weapon: "drum", location: "derrick", motive: "inherit" },
    amaranth: { weapon: "rebar", location: "offices", motive: "union" },
    chalk: { weapon: "crowbar", location: "pumpjack", motive: "war" },
  },
  murderer: "midnight-i",
  hints: [
    {
      text: "Aus seiner historischen Lektüre wusste Logico, dass Vorsitzender Chalk helfen wollte, einen Krieg zu gewinnen.",
      book: true,
      marks: [{ a: "chalk", b: "war", value: "check" }],
    },
    {
      text: "Bei den Ruinen war jemand mit dunkelbraunen Haaren - nur Midnight I. Wer ein Studio gründen wollte, war dort: Midnight I. Président Amaranth war in den klimatisierten Büros. Teenager Midnight und Chalk teilen sich Bohrturm und Pferdekopfpumpe.",
      marks: [
        { a: "amaranth", b: "offices", value: "check" },
        { a: "teenage", b: "derrick", value: "check" },
        { a: "chalk", b: "pumpjack", value: "check" },
      ],
    },
    {
      text: "Wäre Teenager Midnight an der Pumpe, wollte er helfen, einen Krieg zu gewinnen, und Midnight I hätte keine Schaufel. Das Ölfass (Erbe) hätte dann weder Chalk (der Kleinste) noch Midnight I noch Teenager Midnight - also Amaranth. Dann lögen Amaranth (Schaufel bei den Ruinen) und Chalk (Midnight I hatte die Schaufel) beide. Geht nicht.",
      marks: [
        { a: "teenage", b: "drum", value: "check" },
        { a: "teenage", b: "inherit", value: "check" },
        { a: "drum", b: "inherit", value: "check" },
        { a: "shovel", b: "ruins", value: "check" },
      ],
    },
    {
      text: "Also war Chalk an der Pumpe (Krieg) und Teenager Midnight am Bohrturm, und Midnight I hatte die Schaufel bei den Ruinen. Amaranth und Chalk sagen damit die Wahrheit.",
    },
    {
      text: "Probiere aus, wer lügt. Sagt Midnight I die Wahrheit, hat Chalk den Stahl, und Teenager Midnight hat keinen - dann sagen alle vier die Wahrheit, aber der Mörder lügt. Also lügt Midnight I - er ist der Mörder.",
    },
    {
      text: "Chalk hatte keinen Stahl, und Teenager Midnight sagt die Wahrheit: Auch er hatte keinen. Den Stahl hatte Amaranth. Das Ölfass hatte nicht Chalk (der Kleinste), also Teenager Midnight - er wollte ein Erbe antreten. Chalk hatte das Brecheisen, und Amaranth wollte eine Gewerkschaft zerschlagen.",
      marks: [
        { a: "amaranth", b: "union", value: "check" },
        { a: "chalk", b: "crowbar", value: "check" },
        { a: "midnight-i", b: "shovel", value: "check" },
        { a: "midnight-i", b: "ruins", value: "check" },
        { a: "midnight-i", b: "found", value: "check" },
        { a: "shovel", b: "found", value: "check" },
        { a: "ruins", b: "found", value: "check" },
        { a: "drum", b: "derrick", value: "check" },
        { a: "derrick", b: "inherit", value: "check" },
        { a: "amaranth", b: "rebar", value: "check" },
        { a: "rebar", b: "offices", value: "check" },
        { a: "rebar", b: "union", value: "check" },
        { a: "offices", b: "union", value: "check" },
        { a: "crowbar", b: "pumpjack", value: "check" },
        { a: "crowbar", b: "war", value: "check" },
        { a: "pumpjack", b: "war", value: "check" },
      ],
    },
  ],
};
