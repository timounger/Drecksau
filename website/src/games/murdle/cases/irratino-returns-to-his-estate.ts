/**
 * Case 38, "Irratino Returns to His Estate": one of Irratino's many uncles
 * killed on the family estate.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Occult Medium), from the photos of
 * the book. There is no body clue - the liar is the murderer. One clue names
 * a star sign (Exhibit B). The solver found the only solution, and the hints
 * are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const IRRATINO_RETURNS_TO_HIS_ESTATE: Case = {
  id: "irratino-returns-to-his-estate",
  number: 38,
  title: "Irratino kehrt auf sein Anwesen zurück",
  story:
    "Während sie in Deductive Logicos Heimatstadt waren, hatte Irratino ein Fax aus seiner eigenen bekommen. Er musste sofort kommen - einer seiner (vielen) Onkel war gestorben. Er war ermordet worden, und sie mussten herausfinden, wer es war, um das Testament zu regeln.",
  series: "volume1",
  difficulty: "occult",
  suspects: [
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
      id: "vermillion",
      name: "Der Herzog von Vermillion",
      icon: "\u{1F934}",
      description:
        "Wie seine Frau steckt er voller Geheimnisse. Sogar voller Geheimnisse vor seiner Frau.",
      heightCm: 175,
      hand: "left",
      eyes: "gray",
      hair: "white",
      sign: "pisces",
    },
    {
      id: "azure",
      name: "Astrologin Azure",
      icon: "\u{1F52E}",
      description:
        "Eine Sterndeuterin voller Staunen und Fragen nach der genauen Zeit und dem genauen Ort deiner Geburt.",
      heightCm: 168,
      hand: "right",
      eyes: "hazel",
      hair: "lightBrown",
      sign: "cancer",
    },
  ],
  locations: [
    {
      id: "grounds",
      name: "der Park",
      icon: "\u{1F33F}",
      description: "Das Gras ist lang, dicht und gepflegt, wie Irratinos Haar.",
      indoors: false,
    },
    {
      id: "garage",
      name: "die Garage für fünfzig Autos",
      icon: "\u{1F698}",
      description:
        "Irratinos Urgroßvater hielt hier seine Turnierponys. Heute reicht es nur noch für Oldtimer.",
      indoors: true,
    },
    {
      id: "bedroom",
      name: "das riesige Schlafzimmer",
      icon: "\u{1F6CF}️",
      description:
        "Dieses Schlafzimmer ist größer als Logicos ganzes Wohnhaus.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "ouija",
      name: "ein Ouija-Brett",
      icon: "\u{1F47B}",
      description:
        "Das mächtigste magische Artefakt, das man im Spielzeugladen kaufen kann.",
      weight: "light",
    },
    {
      id: "dagger",
      name: "ein Kristalldolch",
      icon: "\u{1F5E1}️",
      description:
        "Vielleicht hat er einen rituellen Zweck - vielleicht sieht er aber auch einfach toll auf dem Kaminsims aus.",
      weight: "medium",
    },
    {
      id: "codebook",
      name: "ein schweres Codebuch",
      icon: "\u{1F4D6}",
      description:
        "Voller Schlüsselwörter und Chiffren. Damit kann man Codes knacken - oder Schädel.",
      weight: "heavy",
    },
  ],
  clues: [
    {
      text: "Die verdächtige Person in der Garage für fünfzig Autos hatte nicht den Kristalldolch.",
      holds: (scene) => scene.weaponOf(scene.at("garage").id).id !== "dagger",
    },
    {
      text: "Ein Steinbock hatte ein Ouija-Brett. (So sind Steinböcke eben.)",
      holds: (scene) => scene.holder("ouija").sign === "capricorn",
    },
  ],
  statements: [
    {
      by: "brownstone",
      text: "Im Namen Gottes: Der Herzog von Vermillion hat ein schweres Codebuch mitgebracht.",
      holds: (scene) => scene.weaponOf("vermillion").id === "codebook",
    },
    {
      by: "vermillion",
      text: "Astrologin Azure war nicht im Park.",
      holds: (scene) => scene.locationOf("azure").id !== "grounds",
    },
    {
      by: "azure",
      text: "Seht in die Sterne! Sie sagen, ein schweres Codebuch war im Park.",
      holds: (scene) =>
        scene.locationOf(scene.holder("codebook").id).id === "grounds",
    },
  ],
  exhibits: ["astrology"],
  solution: {
    brownstone: { weapon: "ouija", location: "grounds" },
    vermillion: { weapon: "codebook", location: "garage" },
    azure: { weapon: "dagger", location: "bedroom" },
  },
  murderer: "azure",
  hints: [
    {
      text: 'Inspektor Irratino deutete eine Vision, die er gehabt hatte, und verkündete dann: "Unter einem riesigen Bett wurde ein Kristalldolch gefunden."',
      book: true,
    },
    {
      text: "Steinbock ist nur Bruder Brownstone (Beweisstück B): Er hatte das Ouija-Brett.",
      marks: [{ a: "brownstone", b: "ouija", value: "check" }],
    },
    {
      text: "Probiere aus, wer lügt. Lügt Bruder Brownstone, hatte der Herzog den Dolch und Azure das Codebuch. Dann sagen beide die Wahrheit: Azure war nicht im Park, das Codebuch aber schon. Das geht nicht.",
      marks: [{ a: "vermillion", b: "codebook", value: "check" }],
    },
    {
      text: "Also sagt Brownstone die Wahrheit: Der Herzog hatte das Codebuch, Astrologin Azure den Kristalldolch.",
      marks: [{ a: "azure", b: "dagger", value: "check" }],
    },
    {
      text: "Lügt der Herzog, war Azure im Park. Azure sagt dann die Wahrheit, und das Codebuch des Herzogs wäre auch im Park. Das geht nicht.",
    },
    {
      text: "Also lügt Astrologin Azure - sie ist die Mörderin. Das Codebuch war nicht im Park, und Azure war laut Herzog auch nicht dort: Bruder Brownstone war im Park.",
      marks: [{ a: "brownstone", b: "grounds", value: "check" }],
    },
    {
      text: "Wer in der Garage war, hatte nicht den Dolch - also war der Herzog in der Garage und Azure im riesigen Schlafzimmer. Dort tötete sie den Onkel mit dem Kristalldolch.",
      marks: [
        { a: "vermillion", b: "garage", value: "check" },
        { a: "azure", b: "bedroom", value: "check" },
        { a: "ouija", b: "grounds", value: "check" },
        { a: "codebook", b: "garage", value: "check" },
        { a: "dagger", b: "bedroom", value: "check" },
      ],
    },
  ],
};
