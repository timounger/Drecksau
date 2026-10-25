/**
 * Case 29, "Oh No, Not in the Chateau!": a body in the president's chateau.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Occult Medium). The murderer lies,
 * everyone else tells the truth; there is no body clue - the liar is the
 * murderer. "Beside a basketball goal" means the ballroom; the Aquarius
 * comes from Exhibit B. The photographed pages print neither hint nor
 * solution; the solver found the only one, and the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const OH_NO_NOT_IN_THE_CHATEAU: Case = {
  id: "oh-no-not-in-the-chateau",
  number: 29,
  title: "Oh nein, nicht im Château!",
  story:
    '"Hallo!", rief Logico. "Ich habe einen Termin beim Präsidenten!" Niemand antwortete, und er sah sich um. Auch das Château schien von Escher entworfen zu sein: Treppen und Flure wanden sich umeinander, und jede freie Fläche war mit Büchern bedeckt. Das am wenigsten Unerwartete war wohl die Leiche.',
  series: "volume1",
  difficulty: "occult",
  suspects: [
    {
      id: "umber",
      name: "Soziologin Umber",
      icon: "\u{1F4CA}",
      description:
        "Als Vertreterin der harten Wissenschaften fordert sie alle ständig auf, ihre Vorannahmen zu hinterfragen - und fragt, ob sie schon Weber gelesen haben.",
      heightCm: 163,
      hand: "left",
      eyes: "blue",
      hair: "blond",
      sign: "leo",
    },
    {
      id: "flint",
      name: "Philologe Flint",
      icon: "\u{1F4DC}",
      description:
        "Über ein Wort lernt man viel aus seiner Etymologie - etwa, woher es kommt und was es früher bedeutet hat.",
      heightCm: 157,
      hand: "left",
      eyes: "green",
      hair: "blond",
      sign: "aquarius",
    },
    {
      id: "night",
      name: "Numerolog:in Night",
      icon: "\u{1F576}️",
      description:
        "Ein mathematisches und esoterisches Wunderkind. Night kennt nicht nur den Wert von X, sondern auch die Bedeutung von X.",
      heightCm: 175,
      hand: "left",
      eyes: "blue",
      hair: "darkBrown",
      sign: "pisces",
    },
  ],
  locations: [
    {
      id: "driveway",
      name: "die Auffahrt",
      icon: "\u{1F5FF}",
      description:
        "Riesige Steinstatuen verschiedener Tiere säumen die elegante Zufahrt zum Château.",
      indoors: false,
    },
    {
      id: "attic",
      name: "der arkane Dachboden",
      icon: "\u{1F578}️",
      description:
        "Angeblich spukt es hier. Garantiert liegt hier ein Haufen alter Kram.",
      indoors: true,
    },
    {
      id: "ballroom",
      name: "der Ballsaal",
      icon: "\u{1F57A}",
      description: "Für große Feste und auch für Basketballspiele.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "dagger",
      name: "ein verfluchter Dolch",
      icon: "\u{1F5E1}️",
      description:
        "Eine sterbende Herzogin verfluchte diesen Dolch, als sie sich mit ihm das Leben nahm.",
      weight: "medium",
    },
    {
      id: "wand",
      name: "ein Selenitstab",
      icon: "\u{1FA84}",
      description: "Zum Zaubern und zum Schädeleinschlagen.",
      weight: "medium",
    },
    {
      id: "pin",
      name: "eine exklusive Anstecknadel",
      icon: "\u{1F4CD}",
      description:
        "Wer diese Nadel am Revers trägt, gehört zu einer Geheimgesellschaft.",
      weight: "light",
    },
  ],
  clues: [
    {
      text: "Ein Wassermann stand neben einem Basketballkorb.",
      holds: (scene) => scene.at("ballroom").sign === "aquarius",
    },
    {
      text: "Numerolog:in Night hatte errechnet, dass der Selenitstab einer unheilvollen Zahl entsprach, und rührte ihn deshalb nicht an.",
      holds: (scene) => scene.weaponOf("night").id !== "wand",
    },
  ],
  statements: [
    {
      by: "umber",
      text: "Ich kann nur sagen: Ich habe einen verfluchten Dolch mitgebracht.",
      holds: (scene) => scene.weaponOf("umber").id === "dagger",
    },
    {
      by: "flint",
      text: "Wenn man den Ursprung der Wörter bedenkt, könnte man sagen: Ich trug eine exklusive Anstecknadel.",
      holds: (scene) => scene.weaponOf("flint").id === "pin",
    },
    {
      by: "night",
      text: "Den Zahlen nach war eine exklusive Anstecknadel auf dem arkanen Dachboden.",
      holds: (scene) => scene.locationOf(scene.holder("pin").id).id === "attic",
    },
  ],
  exhibits: ["astrology"],
  solution: {
    umber: { weapon: "dagger", location: "driveway" },
    flint: { weapon: "wand", location: "ballroom" },
    night: { weapon: "pin", location: "attic" },
  },
  murderer: "flint",
  hints: [
    {
      text: 'Im beschlagenen Badezimmerspiegel stand ein hilfreicher Hinweis: "Traue der Soziologin!"',
      book: true,
    },
    {
      text: "Ein Basketballkorb steht im Ballsaal. Wassermann ist nur Philologe Flint - er war dort.",
    },
    {
      text: "Probiere aus, wer lügt. Lügt Numerolog:in Night, sagen Umber und Flint die Wahrheit: Umber hatte den Dolch, Flint die Nadel. Für Night bliebe der Selenitstab, den Night nicht anrührte. Das geht nicht.",
      marks: [
        { a: "umber", b: "dagger", value: "check" },
        { a: "night", b: "wand", value: "cross" },
      ],
    },
    {
      text: "Lügt Soziologin Umber, hatte Flint die Nadel. Night hatte nicht den Stab, also den Dolch, und Umber den Stab. Night sagt die Wahrheit: Die Nadel war auf dem Dachboden - Flint ist aber im Ballsaal. Auch das geht nicht.",
      marks: [
        { a: "flint", b: "ballroom", value: "check" },
        { a: "night", b: "attic", value: "check" },
      ],
    },
    {
      text: "Also lügt Philologe Flint. Umber hatte den Dolch, Night (nicht den Stab) die Nadel - und die war auf dem Dachboden, also war Night dort und Umber in der Auffahrt. Flint ist der Mörder - mit dem Selenitstab im Ballsaal.",
      marks: [
        { a: "umber", b: "driveway", value: "check" },
        { a: "dagger", b: "driveway", value: "check" },
        { a: "flint", b: "wand", value: "check" },
        { a: "wand", b: "ballroom", value: "check" },
        { a: "night", b: "pin", value: "check" },
        { a: "pin", b: "attic", value: "check" },
      ],
    },
  ],
};
