/**
 * Case 44, "Murder on the Stage": a director killed at a theater in the
 * woods.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Occult Medium), from the photos of
 * the book. There is no body clue - the liar is the murderer. "The weapon
 * that was poorly dulled" is the stage sword, by its card. The solver found
 * the only solution, and the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const MURDER_ON_THE_STAGE: Case = {
  id: "murder-on-the-stage",
  number: 44,
  title: "Mord auf der Bühne",
  story:
    "Deductive Logico und Inspektor Irratino sahen sich ein Stück in einem Theater im Wald an. Logico staunte, dass es ein interaktiver Mitmach-Krimi war - bis man ihm erklärte, dass es sich in Wahrheit um einen Tatort handelte. Der Regisseur war getötet worden.",
  series: "volume1",
  difficulty: "occult",
  suspects: [
    {
      id: "grey",
      name: "Earl Grey",
      icon: "\u{1F9D0}",
      description:
        "Er stammt aus einer langen Reihe von Earl Greys. Ja, wie der Tee. Nein, er gibt keine Autogramme. Aber einen Beutel schenkt er dir, wenn du fragst.",
      heightCm: 175,
      hand: "right",
      eyes: "lightBrown",
      hair: "white",
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
    {
      id: "pine",
      name: "Richterin Pine",
      icon: "\u{1F469}‍⚖️",
      description:
        "Herrin des Gerichtssaals und von festem Glauben an die Gerechtigkeit beseelt - so, wie allein sie sie festlegt.",
      heightCm: 168,
      hand: "right",
      eyes: "darkBrown",
      hair: "black",
      sign: "taurus",
    },
  ],
  locations: [
    {
      id: "stage",
      name: "die Bühne",
      icon: "\u{1F3AD}",
      description:
        "Gebaut aus dem Holz der umliegenden Bäume, jetzt in Brettform.",
      indoors: false,
    },
    {
      id: "front-tree",
      name: "der Empfangsbaum",
      icon: "\u{1F332}",
      description:
        "Wie ein Empfangstresen, nur als Baum. Er ist geschmückt, damit man weiß, wo man einchecken muss.",
      indoors: false,
    },
    {
      id: "backstage-woods",
      name: "der Wald hinter der Bühne",
      icon: "\u{1F333}",
      description:
        "Dunkel, unheimlich und perfekt für überraschende Auftritte.",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "program",
      name: "ein giftiges Programmheft",
      icon: "\u{1F4D6}",
      description:
        "Nicht nur die Biografien darin sind giftig, sondern auch die Druckerschwärze.",
      weight: "light",
    },
    {
      id: "popcorn",
      name: "vergiftetes Popcorn",
      icon: "\u{1F37F}",
      description: "Frisch gepoppt und frisch vergiftet. Mit Mandelgeschmack!",
      weight: "medium",
    },
    {
      id: "stage-sword",
      name: "ein Bühnenschwert",
      icon: "\u{1F5E1}️",
      description:
        "Zur Sicherheit der Darsteller ist es ein wenig abgestumpft. Aber nicht genug ...",
      weight: "medium",
    },
  ],
  clues: [
    {
      text: "Earl Grey hatte schreckliche Angst im Dunkeln, also würde er nie in den Wald hinter der Bühne gehen.",
      holds: (scene) => scene.locationOf("grey").id !== "backstage-woods",
    },
    {
      text: "Ein Stier hatte die Waffe, die nur schlecht abgestumpft war.",
      holds: (scene) => scene.holder("stage-sword").sign === "taurus",
    },
  ],
  statements: [
    {
      by: "grey",
      text: "Mein Wort als ehrenwerter Earl of Grey: Vergiftetes Popcorn war beim Empfangsbaum.",
      holds: (scene) =>
        scene.locationOf(scene.holder("popcorn").id).id === "front-tree",
    },
    {
      by: "lapis",
      text: "Ein giftiges Programmheft war auf der Bühne.",
      holds: (scene) =>
        scene.locationOf(scene.holder("program").id).id === "stage",
    },
    {
      by: "pine",
      text: "Ich weiß nur, dass Schwester Lapis auf der Bühne war.",
      holds: (scene) => scene.locationOf("lapis").id === "stage",
    },
  ],
  exhibits: ["astrology"],
  solution: {
    grey: { weapon: "program", location: "stage" },
    lapis: { weapon: "popcorn", location: "front-tree" },
    pine: { weapon: "stage-sword", location: "backstage-woods" },
  },
  murderer: "pine",
  hints: [
    {
      text: "Irratino ließ alle das Programmheft studieren und verkündete dann dank Handschriftanalyse, Richterin Pine sei im Wald hinter der Bühne gewesen.",
      book: true,
      marks: [{ a: "pine", b: "backstage-woods", value: "check" }],
    },
    {
      text: "Schlecht abgestumpft ist das Bühnenschwert. Stier ist nur Richterin Pine (Beweisstück B): Sie hatte das Bühnenschwert.",
      marks: [{ a: "pine", b: "stage-sword", value: "check" }],
    },
    {
      text: "Probiere aus, wer lügt. Lügt Earl Grey, sagen Lapis und Pine die Wahrheit: Lapis war auf der Bühne, und dort war das Programmheft - also bei Lapis. Grey hätte das Popcorn, nicht beim Empfangsbaum, nicht auf der Bühne und auch nicht im Wald. Das geht nicht.",
      marks: [
        { a: "grey", b: "program", value: "check" },
        { a: "popcorn", b: "front-tree", value: "check" },
      ],
    },
    {
      text: "Lügt Schwester Lapis, war sie laut Pine auf der Bühne. Das Programmheft war nicht auf der Bühne, also hatte Lapis das Popcorn - laut Grey beim Empfangsbaum. Das geht nicht.",
      marks: [
        { a: "lapis", b: "popcorn", value: "check" },
        { a: "lapis", b: "front-tree", value: "check" },
      ],
    },
    {
      text: "Also lügt Richterin Pine - sie ist die Mörderin. Lapis war nicht auf der Bühne, das Programmheft aber schon: Earl Grey hatte es auf der Bühne.",
    },
    {
      text: "Lapis hatte das Popcorn beim Empfangsbaum. Richterin Pine tötete den Regisseur mit dem Bühnenschwert im Wald hinter der Bühne.",
      marks: [
        { a: "stage-sword", b: "backstage-woods", value: "check" },
        { a: "grey", b: "stage", value: "check" },
        { a: "program", b: "stage", value: "check" },
      ],
    },
  ],
};
