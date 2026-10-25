/**
 * Case 40, "The Big-Money Big-Bank Murder": a teller killed in the biggest
 * bank Logico had ever seen.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Occult Medium), from the photos of
 * the book. There is no body clue - the liar is the murderer. One clue names
 * a star sign (Exhibit B). The label of the clock room is blurred in the
 * photo; it is taken as indoors (it holds the works of the outdoor clock),
 * which no clue depends on. Viscount Eminence is printed with black eyes and
 * black hair here (gray eyes and dark brown hair in case 14). The solver
 * found the only solution, and the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const THE_BIG_MONEY_BIG_BANK_MURDER: Case = {
  id: "the-big-money-big-bank-murder",
  number: 40,
  title: "Großes Geld, große Bank, großer Mord",
  story:
    '"Folge dem Geld!", sagte Inspektor Irratino, als er Deductive Logico zur größten Bank führte, die dieser je gesehen hatte. "Wo Geld ist, da ist auch Mord." Die Leiche des Kassierers bezeugte, wie wahr das war.',
  series: "volume1",
  difficulty: "occult",
  suspects: [
    {
      id: "vermillion",
      name: "Der Herzog von Vermillion",
      icon: "\u{1F934}",
      description:
        "Er lernt gerade, dass auch seine Frau Geheimnisse hat - denn sein Geld ist verschwunden.",
      heightCm: 175,
      hand: "left",
      eyes: "gray",
      hair: "white",
      sign: "pisces",
    },
    {
      id: "emerald",
      name: "Signor Emerald",
      icon: "\u{1F48E}",
      description:
        "Ein berühmter italienischer Juwelier. Signor Emerald hat die ganze Welt nach seltenen Edelsteinen bereist, die ihm ständig aus den Taschen fallen.",
      heightCm: 173,
      hand: "left",
      eyes: "lightBrown",
      hair: "black",
      sign: "sagittarius",
    },
    {
      id: "eminence",
      name: "Viscount Eminence",
      icon: "\u{1F474}",
      description:
        "Der älteste Mann, den du je gesehen hast. Man sagt, er erinnere sich an alles, was alle anderen vergessen haben.",
      heightCm: 157,
      hand: "left",
      eyes: "black",
      hair: "black",
      sign: "pisces",
    },
  ],
  locations: [
    {
      id: "clock-room",
      name: "der Uhrenraum",
      icon: "⚙️",
      description:
        "Zahnräder, Getriebe und Messing, die die Uhr draußen antreiben. Betreten auf eigene Gefahr!",
      indoors: true,
    },
    {
      id: "back-room",
      name: "das Hinterzimmer",
      icon: "\u{1F5A8}️",
      description:
        "Hier hinten steht eine Druckerpresse, und das Geld sieht komisch aus. Franklin hat einen Schnurrbart.",
      indoors: true,
    },
    {
      id: "vault",
      name: "der Tresorraum",
      icon: "\u{1F3E6}",
      description: "Schließfächer voller Bargeld, Gold und Geheimnisse.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "laptop",
      name: "ein Laptop",
      icon: "\u{1F4BB}",
      description:
        "Die Maschine, an der du arbeitest. Sie ist mit jeder Ablenkung verbunden, die es je gab.",
      weight: "medium",
    },
    {
      id: "globe",
      name: "ein Globus",
      icon: "\u{1F30D}",
      description: "Um die Weltherrschaft zu planen oder Getränke zu lagern.",
      weight: "heavy",
    },
    {
      id: "gloves",
      name: "Lederhandschuhe",
      icon: "\u{1F9E4}",
      description:
        "Hüte dich vor jemandem mit Lederhandschuhen. Sie haben schon eine Kuh getötet: Wer ist der Nächste?!",
      weight: "light",
    },
  ],
  clues: [
    {
      text: "Im Tresorraum wurde ein Handschuh aus Rindsleder gefunden.",
      holds: (scene) =>
        scene.locationOf(scene.holder("gloves").id).id === "vault",
    },
    {
      text: "Ein Schütze war im Uhrenraum.",
      holds: (scene) => scene.at("clock-room").sign === "sagittarius",
    },
  ],
  statements: [
    {
      by: "vermillion",
      text: "Ich war im Hinterzimmer.",
      holds: (scene) => scene.locationOf("vermillion").id === "back-room",
    },
    {
      by: "emerald",
      text: "Das verspreche ich Ihnen: Ein Globus war im Hinterzimmer.",
      holds: (scene) =>
        scene.locationOf(scene.holder("globe").id).id === "back-room",
    },
    {
      by: "eminence",
      text: "Unerhört! Ich habe keinen Globus mitgebracht!",
      holds: (scene) => scene.weaponOf("eminence").id !== "globe",
    },
  ],
  exhibits: ["astrology"],
  solution: {
    vermillion: { weapon: "laptop", location: "back-room" },
    emerald: { weapon: "globe", location: "clock-room" },
    eminence: { weapon: "gloves", location: "vault" },
  },
  murderer: "emerald",
  hints: [
    {
      text: 'Inspektor Irratino fiel in Trance und sprach mit getragener Stimme: "Viscount Eminence trug die Handschuhe, um seine bleichen, knochigen Hände zu verbergen."',
      book: true,
    },
    {
      text: "Schütze ist nur Signor Emerald (Beweisstück B): Er war im Uhrenraum.",
      marks: [{ a: "emerald", b: "clock-room", value: "check" }],
    },
    {
      text: "Probiere aus, wer lügt. Lügt der Herzog, war er im Tresorraum - mit den Handschuhen - und Viscount Eminence im Hinterzimmer. Emerald sagt dann die Wahrheit, also hatte Eminence den Globus. Dann lügt aber auch Eminence. Zwei Lügner gehen nicht.",
      marks: [
        { a: "vermillion", b: "back-room", value: "check" },
        { a: "eminence", b: "vault", value: "check" },
        { a: "emerald", b: "globe", value: "check" },
      ],
    },
    {
      text: "Also war der Herzog im Hinterzimmer und Viscount Eminence im Tresorraum, mit den Rindslederhandschuhen. Eminence hatte also keinen Globus - seine Aussage stimmt.",
      marks: [{ a: "eminence", b: "globe", value: "cross" }],
    },
    {
      text: "Damit lügt Signor Emerald - er ist der Mörder. Der Globus war nicht im Hinterzimmer, also nicht beim Herzog: Emerald hatte den Globus, der Herzog den Laptop.",
      marks: [
        { a: "vermillion", b: "laptop", value: "check" },
        { a: "laptop", b: "back-room", value: "check" },
      ],
    },
    {
      text: "Signor Emerald erschlug den Kassierer mit dem Globus im Uhrenraum.",
      marks: [
        { a: "globe", b: "clock-room", value: "check" },
        { a: "eminence", b: "gloves", value: "check" },
        { a: "gloves", b: "vault", value: "check" },
      ],
    },
  ],
};
