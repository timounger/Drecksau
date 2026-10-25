/**
 * Case 11, "The Case of the Coffee Shop Killer": a barista killed in
 * Logico's favourite coffee shop.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Elementary). One clue needs Exhibit
 * A: Logico's coffee cup once belonged to General Coffee. The bold last clue
 * names the weapon, not the place; the murderer is whoever had it. The sample prints the book's hint;
 * the solver found the only solution, and the other hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const THE_CASE_OF_THE_COFFEE_SHOP_KILLER: Case = {
  id: "the-case-of-the-coffee-shop-killer",
  number: 11,
  title: "Der Fall des Kaffeehaus-Killers",
  story:
    "Zurück zu Hause ging Deductive Logico in sein Lieblingscafé, um darüber nachzugrübeln, was mit Dame Obsidian geschehen war. Während er in Gedanken versunken war, verlor eine Barista ihr Leben. Retten konnte er sie nicht, aber ihren Mord aufklären schon.",
  series: "volume1",
  difficulty: "elementary",
  suspects: [
    {
      id: "coffee",
      name: "General Coffee",
      icon: "\u{1F396}\u{FE0F}",
      description:
        "Ein Espresso-Kenner, der seinen Kaffee so mag wie seinen Krieg: immer.",
      heightCm: 183,
      hand: "right",
      eyes: "darkBrown",
      hair: "bald",
    },
    {
      id: "raspberry",
      name: "Trainer Raspberry",
      icon: "\u{1F3C8}",
      description:
        "Einer der besten Trainer diesseits des Mississippi, egal auf welcher Seite man gerade steht. Manche sagen, er habe ein Spielproblem, aber er sagt nur, er liebe die Gefahr.",
      heightCm: 183,
      hand: "left",
      eyes: "blue",
      hair: "blond",
    },
    {
      id: "gainsboro",
      name: "Bookie-Gewinner Gainsboro",
      icon: "\u{1F453}",
      description:
        "Er hat den Bookington-Preis für seinen Roman gewonnen, und das erzählt er dir in den ersten zwei Minuten. Das Buch ist sechstausend Seiten lang und handelt von Erde.",
      heightCm: 183,
      hand: "left",
      eyes: "hazel",
      hair: "lightBrown",
    },
  ],
  locations: [
    {
      id: "courtyard",
      name: "der Innenhof",
      icon: "\u{1F333}",
      description:
        "Sonnengesprenkelte Tische und Stühle unter einer prächtigen Eiche. Ein toller Ort für ein Gespräch ... oder einen Mord.",
      indoors: false,
    },
    {
      id: "bean-room",
      name: "der Bohnenraum",
      icon: "\u{1FAD8}",
      description:
        "Voller Säcke über Säcke mit Bohnen. Der Duft ist so stark und köstlich, dass Logico die Bohnen am liebsten essen würde.",
      indoors: true,
    },
    {
      id: "counter",
      name: "die Theke",
      icon: "\u{1F6CE}\u{FE0F}",
      description:
        "Eine kleine Klingel sagt den Baristas, dass du da bist - damit sie anfangen können, dich zu ignorieren.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "brick",
      name: "ein gewöhnlicher Ziegelstein",
      icon: "\u{1F9F1}",
      description:
        "Einfach ein ganz normaler, gewöhnlicher Ziegelstein. Nichts Besonderes. Nur ein Ziegelstein.",
      weight: "heavy",
    },
    {
      id: "straw",
      name: "ein Metallstrohhalm",
      icon: "\u{1F964}",
      description:
        "Besser für den Planeten als ein Plastikstrohhalm, aber tödlicher!",
      weight: "heavy",
    },
    {
      id: "poisoned-coffee",
      name: "eine vergiftete Tasse Kaffee",
      icon: "☕",
      description:
        "Vergiftet mit Rizin, das aus Rizinusbohnen gewonnen wird. Genau genommen ist das also ein Zwei-Bohnen-Eintopf.",
      weight: "medium",
    },
  ],
  clues: [
    {
      text: "Bookie-Gewinner Gainsboro war nie im Innenhof gewesen, und wenn man ihn fragte, wollte er auch nie hin.",
      holds: (scene) => scene.locationOf("gainsboro").id !== "courtyard",
    },
    {
      text: "Trainer Raspberry hatte früher Spielzüge mit der Person eingeübt, die eine vergiftete Tasse Kaffee mitgebracht hatte.",
      holds: (scene) => scene.holder("poisoned-coffee").id !== "raspberry",
    },
    {
      text: "Logico fand einen Splitter eines gewöhnlichen Ziegelsteins, vergraben unter Bohnensäcken.",
      holds: (scene) =>
        scene.locationOf(scene.holder("brick").id).id === "bean-room",
    },
    {
      text: "Die Person an der Theke war der frühere Besitzer von Deductive Logicos Kaffeetasse. (Siehe Beweisstück A.)",
      holds: (scene) => scene.at("counter").id === "coffee",
    },
  ],
  body: {
    text: "Der Mord wurde mit einem Metallstrohhalm begangen.",
    weapon: "straw",
  },
  exhibits: ["detectiveKit"],
  solution: {
    coffee: { weapon: "poisoned-coffee", location: "counter" },
    raspberry: { weapon: "straw", location: "courtyard" },
    gainsboro: { weapon: "brick", location: "bean-room" },
  },
  murderer: "raspberry",
  hints: [
    {
      text: 'Das Telefon klingelte, und der Aushilfsbarista rief Logico herüber. Eine gespenstische Stimme flüsterte: "Laut Nostradamus hatte der Typ mit dem Bookie auch einen Ziegelstein."',
      book: true,
    },
    {
      text: "Logicos Kaffeetasse gehörte einst General Coffee (Beweisstück A): Er war an der Theke.",
      marks: [{ a: "coffee", b: "counter", value: "check" }],
    },
    {
      text: "Gainsboro war nicht im Innenhof und nicht an der Theke, also im Bohnenraum. Trainer Raspberry bleibt der Innenhof.",
      marks: [
        { a: "gainsboro", b: "bean-room", value: "check" },
        { a: "raspberry", b: "courtyard", value: "check" },
      ],
    },
    {
      text: "Der Ziegelsteinsplitter lag im Bohnenraum: Gainsboro hatte den Ziegelstein. Raspberry hatte nicht den vergifteten Kaffee, also den Metallstrohhalm. General Coffee bleibt der vergiftete Kaffee.",
      marks: [
        { a: "gainsboro", b: "brick", value: "check" },
        { a: "brick", b: "bean-room", value: "check" },
        { a: "raspberry", b: "straw", value: "check" },
        { a: "coffee", b: "poisoned-coffee", value: "check" },
      ],
    },
    {
      text: "Gemordet wurde mit dem Metallstrohhalm - den hatte Trainer Raspberry, im Innenhof.",
      marks: [
        { a: "straw", b: "courtyard", value: "check" },
        { a: "poisoned-coffee", b: "counter", value: "check" },
      ],
    },
  ],
};
