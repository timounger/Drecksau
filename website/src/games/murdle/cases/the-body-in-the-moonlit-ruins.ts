/**
 * Case 48, "The Body in the Moonlit Ruins": the second first mate, killed in
 * a ruined church on the island.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Occult Medium), from the photos of
 * the book. There is no body clue - the liar is the murderer. One clue names
 * a birthday (December 25: Capricorn, Exhibit B). The solver found the only
 * solution, and the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const THE_BODY_IN_THE_MOONLIT_RUINS: Case = {
  id: "the-body-in-the-moonlit-ruins",
  number: 48,
  title: "Die Leiche in den mondbeschienenen Ruinen",
  story:
    "Als die Nacht über die Insel hereinbrach, trennten sich Logico und Irratino, um mehr Gelände abzusuchen - nach Hinweisen und nach einer Möglichkeit, per Funk Hilfe zu rufen. Logico stieß auf eine verfallene Kirche, in Mondlicht getaucht. Dann stolperte er über eine Leiche. Es war der zweite Erste Offizier.",
  series: "volume1",
  difficulty: "occult",
  suspects: [
    {
      id: "bone",
      name: "Philosoph Bone",
      icon: "\u{1F978}",
      description:
        "Ein schneidiger, düsterer Philosoph. Er hat die ethische Theorie begründet, dass er für seine Taten nicht verantwortlich ist, aber für sie bezahlt werden sollte.",
      heightCm: 155,
      hand: "right",
      eyes: "lightBrown",
      hair: "bald",
      sign: "taurus",
    },
    {
      id: "brownstone",
      name: "Bruder Brownstone",
      icon: "\u{1F4FF}",
      description:
        "Ein Mönch, der sein Leben der Kirche gewidmet hat - genauer gesagt dem Geldverdienen für sie.",
      heightCm: 163,
      hand: "left",
      eyes: "darkBrown",
      hair: "darkBrown",
      sign: "capricorn",
    },
    {
      id: "lapis",
      name: "Schwester Lapis",
      icon: "\u{1F9D5}",
      description:
        "Eine Nonne, die die Welt bereist und Gottes Werk auf Seine Kosten verrichtet. Ihr Habit ist aus Kaschmir, und ihre Gewohnheit ist das Geldausgeben.",
      heightCm: 157,
      hand: "right",
      eyes: "lightBrown",
      hair: "lightBrown",
      sign: "cancer",
    },
  ],
  locations: [
    {
      id: "pews",
      name: "die überfluteten Kirchenbänke",
      icon: "\u{1FA91}",
      description: "Das Holz der Bänke ist morsch und verzogen.",
      indoors: true,
    },
    {
      id: "organ",
      name: "die überwucherte Orgel",
      icon: "\u{1F3B9}",
      description:
        "Ranken und Unkraut haben die Orgel überwuchert, und aus den Pfeifen krabbeln Käfer.",
      indoors: true,
    },
    {
      id: "altar",
      name: "der geborstene Altar",
      icon: "\u{1F56F}️",
      description:
        "Mitten durch den steinernen Altar zieht sich ein riesiger Riss.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "rock",
      name: "ein Stein",
      icon: "\u{1FAA8}",
      description:
        "Wenn man keine andere Waffe findet - ein Stein liegt immer in der Nähe. Dieser hier ist angeschlagen.",
      weight: "medium",
    },
    {
      id: "beads",
      name: "eine Gebetskette",
      icon: "\u{1F4FF}",
      description:
        "Elfenbeinerne Gebetsperlen, bedeckt mit winzigen eingravierten Symbolen.",
      weight: "light",
    },
    {
      id: "relic",
      name: "eine heilige Reliquie",
      icon: "\u{1F5FF}",
      description:
        "Das Totem eines längst vergessenen Gottes mit einem furchterregenden Antlitz.",
      weight: "medium",
    },
  ],
  clues: [
    {
      text: "Philosoph Bone hat nie einen Fuß zwischen die überfluteten Kirchenbänke gesetzt: Er wollte keine nassen Füße bekommen.",
      holds: (scene) => scene.locationOf("bone").id !== "pews",
    },
    {
      text: "Die verdächtige Person am geborstenen Altar ist am 25. Dezember geboren. (Siehe Beweisstück B.)",
      holds: (scene) => scene.at("altar").sign === "capricorn",
    },
  ],
  statements: [
    {
      by: "bone",
      text: "Schwester Lapis hat keinen Stein mitgebracht.",
      holds: (scene) => scene.weaponOf("lapis").id !== "rock",
    },
    {
      by: "brownstone",
      text: "Eine heilige Reliquie war nicht bei der überwucherten Orgel.",
      holds: (scene) =>
        scene.locationOf(scene.holder("relic").id).id !== "organ",
    },
    {
      by: "lapis",
      text: "Philosoph Bone hat einen Stein mitgebracht.",
      holds: (scene) => scene.weaponOf("bone").id === "rock",
    },
  ],
  exhibits: ["astrology"],
  solution: {
    bone: { weapon: "beads", location: "organ" },
    brownstone: { weapon: "rock", location: "altar" },
    lapis: { weapon: "relic", location: "pews" },
  },
  murderer: "lapis",
  hints: [
    {
      text: 'Inspektor Irratino deutete einen Traum, den er geträumt hatte, und verkündete dann: "Schwester Lapis hat eine heilige Reliquie mitgebracht."',
      book: true,
      marks: [{ a: "lapis", b: "relic", value: "check" }],
    },
    {
      text: "Der 25. Dezember liegt im Steinbock (Beweisstück B). Steinbock ist nur Bruder Brownstone: Er war am geborstenen Altar.",
      marks: [{ a: "brownstone", b: "altar", value: "check" }],
    },
    {
      text: "Philosoph Bone war nicht bei den überfluteten Bänken, also bei der Orgel. Schwester Lapis war bei den Kirchenbänken.",
      marks: [
        { a: "bone", b: "organ", value: "check" },
        { a: "lapis", b: "pews", value: "check" },
      ],
    },
    {
      text: "Probiere aus, wer lügt. Lügt Bone, hatte Lapis den Stein. Brownstone sagt dann die Wahrheit: Die Reliquie war nicht bei der Orgel, also hatte Bone die Gebetskette - und nicht den Stein. Dann lügt auch Lapis. Zwei Lügner gehen nicht.",
      marks: [
        { a: "bone", b: "beads", value: "check" },
        { a: "brownstone", b: "rock", value: "check" },
        { a: "beads", b: "organ", value: "check" },
      ],
    },
    {
      text: "Also hatte Lapis keinen Stein. Lügt Bruder Brownstone, hatte Bone (an der Orgel) die Reliquie. Lapis sagt dann die Wahrheit, und Bone hätte den Stein. Das geht nicht.",
      marks: [{ a: "lapis", b: "rock", value: "cross" }],
    },
    {
      text: "Also lügt Schwester Lapis - sie ist die Mörderin. Bone hatte keinen Stein und, laut Brownstone, keine Reliquie: Er hatte die Gebetskette.",
    },
    {
      text: "Lapis hatte keinen Stein, also die Reliquie; Brownstone hatte den Stein. Schwester Lapis tötete den zweiten Ersten Offizier mit der heiligen Reliquie bei den überfluteten Kirchenbänken.",
      marks: [
        { a: "relic", b: "pews", value: "check" },
        { a: "rock", b: "altar", value: "check" },
      ],
    },
  ],
};
