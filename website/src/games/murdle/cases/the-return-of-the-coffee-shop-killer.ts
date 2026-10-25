/**
 * Case 42, "The Return of the Coffee Shop Killer": a barista killed in a
 * coffee shop full of occult phenomena.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Occult Medium), from the photos of
 * the book. There is no body clue - the liar is the murderer. The suspect
 * "who tips well" is General Coffee, by his card. The label of the parking
 * lot is blurred in the photo; it is outdoors, which no clue depends on. The
 * solver found the only solution, and the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const THE_RETURN_OF_THE_COFFEE_SHOP_KILLER: Case = {
  id: "the-return-of-the-coffee-shop-killer",
  number: 42,
  title: "Die Rückkehr des Kaffeehaus-Killers",
  story:
    "Deductive Logico erzählte Inspektor Irratino, er kenne einen Ort voller okkulter Phänomene, und nahm ihn mit in ein Café. Doch kaum waren sie dort, fanden sie die Barista tot auf.",
  series: "volume1",
  difficulty: "occult",
  suspects: [
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
    {
      id: "rose",
      name: "Großmeister Rose",
      icon: "♟️",
      description:
        "Ein Schachgroßmeister, der immer schon seinen nächsten Zug plant. Zum Beispiel, welchen Latte er als Nächstes nimmt. (2. Dh5)",
      heightCm: 170,
      hand: "left",
      eyes: "darkBrown",
      hair: "darkBrown",
      sign: "scorpio",
    },
    {
      id: "coffee",
      name: "General Coffee",
      icon: "☕",
      description:
        "Ein Espresso-Kenner, der schon mehrere Menschen ermordet hat, aber immer noch in dieses Café darf, weil er so gut Trinkgeld gibt. (Merkt euch das!)",
      heightCm: 183,
      hand: "right",
      eyes: "darkBrown",
      hair: "bald",
      sign: "sagittarius",
    },
  ],
  locations: [
    {
      id: "parking-lot",
      name: "der Parkplatz",
      icon: "\u{1F697}",
      description:
        "Einen Drive-in gibt es nicht, denn das hier ist ein feines Café. Die Leute müssen aus ihren Autos steigen, um Kaffee zu trinken.",
      indoors: false,
    },
    {
      id: "bathroom",
      name: "die Toilette",
      icon: "\u{1F6BD}",
      description:
        "Es ist ein Café, also gibt es natürlich eine Toilette. Hier sind immer die Papierhandtücher alle.",
      indoors: true,
    },
    {
      id: "courtyard",
      name: "der Innenhof",
      icon: "\u{1F333}",
      description:
        "Sonnengesprenkelte Tische und Stühle unter einer prächtigen Eiche. Ein schöner Ort für ein Gespräch ... oder einen Mord.",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "butter-knife",
      name: "ein Buttermesser",
      icon: "\u{1F52A}",
      description: "Ehrlich gesagt eine peinliche Art, umgebracht zu werden.",
      weight: "light",
    },
    {
      id: "straw",
      name: "ein Metallstrohhalm",
      icon: "\u{1F964}",
      description:
        "Besser für den Planeten als ein Plastikstrohhalm, aber tödlicher!",
      weight: "light",
    },
    {
      id: "pot",
      name: "eine kochend heiße Kanne",
      icon: "☕",
      description:
        "Heiß und schwer! Unter Mördern nennt man das ein Doppelprogramm.",
      weight: "heavy",
    },
  ],
  clues: [
    {
      text: "Die verdächtige Person, die gut Trinkgeld gibt, saß im Innenhof.",
      holds: (scene) => scene.locationOf("coffee").id === "courtyard",
    },
    {
      text: "Die größte verdächtige Person hatte die Person mit dem Buttermesser im Verdacht.",
      holds: (scene) => scene.holder("butter-knife").id !== "coffee",
    },
  ],
  statements: [
    {
      by: "lapis",
      text: "Großmeister Rose war nicht auf dem Parkplatz.",
      holds: (scene) => scene.locationOf("rose").id !== "parking-lot",
    },
    {
      by: "rose",
      text: "Ein Metallstrohhalm war auf der Toilette.",
      holds: (scene) =>
        scene.locationOf(scene.holder("straw").id).id === "bathroom",
    },
    {
      by: "coffee",
      text: "Hmm ... ein Buttermesser war im Innenhof.",
      holds: (scene) =>
        scene.locationOf(scene.holder("butter-knife").id).id === "courtyard",
    },
  ],
  exhibits: ["astrology"],
  solution: {
    lapis: { weapon: "butter-knife", location: "parking-lot" },
    rose: { weapon: "straw", location: "bathroom" },
    coffee: { weapon: "pot", location: "courtyard" },
  },
  murderer: "coffee",
  hints: [
    {
      text: "Irratino studierte den Kaffeesatz am Boden eines Bechers und folgerte zweierlei: 1. General Coffee hatte eine kochend heiße Kanne, und 2. hier brauchte man bessere Kaffeefilter.",
      book: true,
      marks: [{ a: "coffee", b: "pot", value: "check" }],
    },
    {
      text: "Gut Trinkgeld gibt laut seiner Karte General Coffee: Er saß im Innenhof.",
      marks: [{ a: "coffee", b: "courtyard", value: "check" }],
    },
    {
      text: "Die größte Person ist General Coffee (1,83 m). Er hatte jemand anderen mit dem Buttermesser im Verdacht - also hatte er es nicht selbst.",
    },
    {
      text: "General Coffee sagt, das Buttermesser sei im Innenhof gewesen. Dort war aber nur er, und er hatte es nicht. Seine Aussage ist falsch: Er lügt, er ist der Mörder.",
    },
    {
      text: "Schwester Lapis sagt die Wahrheit: Rose war nicht auf dem Parkplatz, also auf der Toilette, und Lapis auf dem Parkplatz.",
      marks: [
        { a: "lapis", b: "parking-lot", value: "check" },
        { a: "rose", b: "bathroom", value: "check" },
      ],
    },
    {
      text: "Rose sagt die Wahrheit: Der Metallstrohhalm war auf der Toilette, also bei ihm. Lapis hatte das Buttermesser, und General Coffee tötete die Barista mit der kochend heißen Kanne im Innenhof.",
      marks: [
        { a: "rose", b: "straw", value: "check" },
        { a: "straw", b: "bathroom", value: "check" },
        { a: "lapis", b: "butter-knife", value: "check" },
        { a: "pot", b: "courtyard", value: "check" },
        { a: "butter-knife", b: "parking-lot", value: "check" },
      ],
    },
  ],
};
