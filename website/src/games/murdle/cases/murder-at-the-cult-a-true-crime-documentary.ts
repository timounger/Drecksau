/**
 * Case 35, "Murder at the Cult: A True-Crime Documentary": the supreme leader
 * of a commune murdered.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Occult Medium). The murderer lies,
 * everyone else tells the truth; there is no body clue - the liar is the
 * murderer. The book prints the ancient ruins as indoors here. The
 * photographed pages print neither hint nor solution; the solver found the
 * only one, and the hints are our own.
 */
import type { Case, Scene } from "../engine/types";

/** The case. */
export const MURDER_AT_THE_CULT_A_TRUE_CRIME_DOCUMENTARY: Case = {
  id: "murder-at-the-cult-a-true-crime-documentary",
  number: 35,
  title: "Mord in der Sekte: Eine True-Crime-Doku",
  story:
    "Inspektor Irratino und Deductive Logico fuhren mit dem Zug aufs Land, zu einer Kommune, über die Irratino in einem Fanzine gelesen hatte. Dort stellten sie fest, dass es eine Gesellschaft ohne Anführer war - allerdings nur, weil ihr oberster Anführer gerade ermordet worden war.",
  series: "volume1",
  difficulty: "occult",
  suspects: [
    {
      id: "applegreen",
      name: "Assistentin Applegreen",
      icon: "\u{1F34F}",
      description:
        "Sie ist aus dem Verlagswesen ausgestiegen und in diese Kommune gezogen. Ihr Vater ist im Moment nicht stolz.",
      heightCm: 160,
      hand: "left",
      eyes: "blue",
      hair: "blond",
      sign: "virgo",
    },
    {
      id: "flint",
      name: "Philologe Flint",
      icon: "\u{1F4DC}",
      description:
        "Über ein Wort lernt man viel aus seiner Etymologie - etwa, woher es kommt und ... hast du das schon mal gehört?",
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
        "Ein mathematisches und esoterisches Wunderkind. Night kennt nicht nur den Wert von E, sondern auch die Bedeutung von E.",
      heightCm: 175,
      hand: "left",
      eyes: "blue",
      hair: "darkBrown",
      sign: "pisces",
    },
  ],
  locations: [
    {
      id: "barracks",
      name: "die Baracken",
      icon: "\u{1F6CF}️",
      description:
        "Hier schlafen alle außer ihrem Anführer. (Ihr Anführer schläft nie.)",
      indoors: true,
    },
    {
      id: "library",
      name: "die Bibliothek",
      icon: "\u{1F4DA}",
      description:
        "Mehr Bücher, als du je gesehen hast. (Aber alle vom selben Typen.)",
      indoors: true,
    },
    {
      id: "ruins",
      name: "die uralten Ruinen",
      icon: "\u{1F3DB}️",
      description:
        "Sie scheinen einen zu hypnotisieren. In ihrer Nähe wird einem ganz schwummrig.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "wand",
      name: "ein Selenitstab",
      icon: "\u{1FA84}",
      description: "Zum Zaubern und zum Schädeleinschlagen.",
      weight: "medium",
    },
    {
      id: "ladle",
      name: "eine Suppenkelle",
      icon: "\u{1F944}",
      description: "Zum Suppeausteilen in der Kommune.",
      weight: "light",
    },
    {
      id: "apparatus",
      name: "ein pseudowissenschaftlicher Apparat",
      icon: "⚛️",
      description: "Wow, deine inneren Blaxonen schlagen ja voll aus!",
      weight: "heavy",
    },
  ],
  clues: [
    {
      text: "Die größte verdächtige Person hätte nicht in die Bibliothek gepasst: Die hatte niedrige Decken.",
      holds: (scene: Scene): boolean => {
        const tallest = Math.max(
          ...["applegreen", "flint", "night"].map(
            (id) => scene.suspect(id).heightCm,
          ),
        );
        return scene.at("library").heightCm !== tallest;
      },
    },
    {
      text: "Wer in den Baracken war, hatte grüne Augen.",
      holds: (scene) => scene.at("barracks").eyes === "green",
    },
  ],
  statements: [
    {
      by: "applegreen",
      text: "Ich habe keinen Selenitstab mitgebracht.",
      holds: (scene) => scene.weaponOf("applegreen").id !== "wand",
    },
    {
      by: "flint",
      text: "Ein pseudowissenschaftlicher Apparat war nicht bei den uralten Ruinen.",
      holds: (scene) =>
        scene.locationOf(scene.holder("apparatus").id).id !== "ruins",
    },
    {
      by: "night",
      text: "Den Zahlen nach habe ich einen Selenitstab mitgebracht.",
      holds: (scene) => scene.weaponOf("night").id === "wand",
    },
  ],
  exhibits: ["astrology"],
  solution: {
    applegreen: { weapon: "apparatus", location: "library" },
    flint: { weapon: "wand", location: "barracks" },
    night: { weapon: "ladle", location: "ruins" },
  },
  murderer: "night",
  hints: [
    {
      text: 'Inspektor Irratino deutete ein Rätsel, das ihm die Winde zugeflüstert hatten, und verkündete dann: "Philologe Flint hat einen Selenitstab mitgebracht."',
      book: true,
      marks: [{ a: "flint", b: "wand", value: "check" }],
    },
    {
      text: "Grüne Augen hat nur Philologe Flint: Er war in den Baracken.",
      marks: [{ a: "flint", b: "barracks", value: "check" }],
    },
    {
      text: "Die größte Person ist Numerolog:in Night (1,75 m) - nicht in der Bibliothek, also bei den uralten Ruinen. Assistentin Applegreen war in der Bibliothek.",
      marks: [
        { a: "night", b: "ruins", value: "check" },
        { a: "applegreen", b: "library", value: "check" },
      ],
    },
    {
      text: "Probiere aus, wer lügt. Lügt Applegreen, hatte sie den Stab - dann lügt auch Night. Lügt Flint, hatte Night bei den Ruinen den Apparat - dann lügt ebenfalls Night. Zwei Lügner gibt es nicht.",
    },
    {
      text: "Also lügt Numerolog:in Night: kein Stab. Laut Flint auch kein Apparat - Night hatte die Suppenkelle. Applegreen hatte keinen Stab, also den Apparat, und Flint den Stab. Night hat es getan - mit der Suppenkelle bei den uralten Ruinen.",
      marks: [
        { a: "night", b: "ladle", value: "check" },
        { a: "applegreen", b: "apparatus", value: "check" },
        { a: "ladle", b: "ruins", value: "check" },
        { a: "apparatus", b: "library", value: "check" },
        { a: "wand", b: "barracks", value: "check" },
      ],
    },
  ],
};
