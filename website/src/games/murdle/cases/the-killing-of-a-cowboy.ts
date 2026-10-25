/**
 * Case 13, "The Killing of a Cowboy": a rancher killed in one of Dame
 * Obsidian's Westerns.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Elementary). The book prints plain
 * "brown" eyes for Corporal Coffee; they are dark brown here, as General
 * Coffee's are. The bold last clue names the weapon, not the place; the murderer is whoever had it. The
 * sample prints the book's hint; the solver found the only solution, and the
 * other hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const THE_KILLING_OF_A_COWBOY: Case = {
  id: "the-killing-of-a-cowboy",
  number: 13,
  title: "Der Mord an einem Cowboy",
  story:
    "Dame Obsidian hatte Krimis an vielen Orten und in vielen Epochen spielen lassen, und Logico war fest entschlossen, sie alle zu lesen. Der erste war ein Western, voller falscher Fährten, schwarzer Hüte und mit einer Wendung, die eines Lassos würdig war. Ein Rancher war getötet worden, und die Verdächtigen schienen echten Menschen nachempfunden zu sein.",
  series: "volume1",
  difficulty: "elementary",
  suspects: [
    {
      id: "raspberry",
      name: "Cowboy Raspberry",
      icon: "\u{1F920}",
      description:
        "Einer der besten Cowboys diesseits des Mississippi, egal auf welcher Seite man gerade steht. Manche sagen, er habe ein Problem mit Viehdiebstahl, aber er sagt nur, er liebe die Gefahr.",
      heightCm: 183,
      hand: "left",
      eyes: "blue",
      hair: "blond",
    },
    {
      id: "pine",
      name: "Richterin Pine",
      icon: "⚖️",
      description:
        "Herrin über das Landgericht und felsenfest überzeugt von ihrer eigenen Form der Gerechtigkeit im Grenzland.",
      heightCm: 168,
      hand: "right",
      eyes: "darkBrown",
      hair: "black",
    },
    {
      id: "coffee",
      name: "Korporal Coffee",
      icon: "\u{1F396}\u{FE0F}",
      description:
        "Wer damals Kaffee mochte, mochte ihn schwarz. Und der Korporal mochte Kaffee.",
      heightCm: 183,
      hand: "right",
      eyes: "darkBrown",
      hair: "bald",
    },
  ],
  locations: [
    {
      id: "saloon",
      name: "der Saloon",
      icon: "\u{1F37A}",
      description:
        "Der schlechteste Saloon, den jeder, der je dort war, je besucht hatte.",
      indoors: true,
    },
    {
      id: "watering-hole",
      name: "die Wasserstelle",
      icon: "\u{1F4A7}",
      description:
        "Hier gibt es das sauberste Wasser im ganzen Westen. Es ist dunkelbraun.",
      indoors: false,
    },
    {
      id: "hotel",
      name: 'das "Hotel"',
      icon: "\u{1F3E8}",
      description:
        'Ein "Hotel" mit gewissen "Annehmlichkeiten", darunter die Abrechnung "pro Stunde".',
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "knife",
      name: "ein Stechmesser",
      icon: "\u{1F52A}",
      description:
        "Genau die Sorte Messer, die sich perfekt zum Stechen eignet.",
      weight: "medium",
    },
    {
      id: "cactus",
      name: "ein Kaktus",
      icon: "\u{1F335}",
      description:
        "Vorsicht vor den Stacheln - und vor jedem, der dich damit schlägt.",
      weight: "medium",
    },
    {
      id: "moonshine",
      name: "gepanschter Schwarzgebrannter",
      icon: "\u{1F943}",
      description:
        "Der bringt dich um, so viel ist sicher. Schon der Geruch ist gefährlich.",
      weight: "medium",
    },
  ],
  clues: [
    {
      text: "Im dunkelbraunen Wasser weichten ein paar Stacheln ein.",
      holds: (scene) =>
        scene.locationOf(scene.holder("cactus").id).id === "watering-hole",
    },
    {
      text: "Richterin Pine misstraute der Person, die ein Stechmesser mitgebracht hatte. (Verständlich.)",
      holds: (scene) => scene.holder("knife").id !== "pine",
    },
    {
      text: 'Korporal Coffee war nie im "Hotel" gewesen.',
      holds: (scene) => scene.locationOf("coffee").id !== "hotel",
    },
    {
      text: "Wer den Kaktus hatte, hatte blaue Augen.",
      holds: (scene) => scene.holder("cactus").eyes === "blue",
    },
  ],
  body: {
    text: "Der Rancher wurde mit gepanschtem Schwarzgebranntem ermordet.",
    weapon: "moonshine",
  },
  solution: {
    raspberry: { weapon: "cactus", location: "watering-hole" },
    pine: { weapon: "moonshine", location: "hotel" },
    coffee: { weapon: "knife", location: "saloon" },
  },
  murderer: "pine",
  hints: [
    {
      text: 'Jemand hatte gegen Ende eine Notiz an den Rand gekritzelt: "Korporal Coffee hatte ein Stechmesser." Logico ärgerte sich, dass jemand in das Buch geschrieben hatte, aber der Tipp half.',
      book: true,
      marks: [{ a: "coffee", b: "knife", value: "check" }],
    },
    {
      text: "Blaue Augen hat nur Cowboy Raspberry: Er hatte den Kaktus. Die Stacheln lagen in der Wasserstelle, also war er dort.",
      marks: [{ a: "raspberry", b: "cactus", value: "check" }],
    },
    {
      text: 'Korporal Coffee war nicht im "Hotel", also im Saloon. Richterin Pine bleibt das "Hotel".',
      marks: [
        { a: "coffee", b: "saloon", value: "check" },
        { a: "pine", b: "hotel", value: "check" },
      ],
    },
    {
      text: "Pine hatte nicht das Stechmesser, also den Schwarzgebrannten. Korporal Coffee bleibt das Stechmesser.",
      marks: [{ a: "pine", b: "knife", value: "cross" }],
    },
    {
      text: 'Gemordet wurde mit dem Schwarzgebrannten - den hatte Richterin Pine, im "Hotel".',
      marks: [
        { a: "raspberry", b: "watering-hole", value: "check" },
        { a: "cactus", b: "watering-hole", value: "check" },
        { a: "pine", b: "moonshine", value: "check" },
        { a: "moonshine", b: "hotel", value: "check" },
        { a: "knife", b: "saloon", value: "check" },
      ],
    },
  ],
};
