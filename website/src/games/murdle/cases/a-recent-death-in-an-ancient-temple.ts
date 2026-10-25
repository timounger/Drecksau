/**
 * Case 33, "A Recent Death in an Ancient Temple": an archeologist killed at
 * an excavation.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Occult Medium). The murderer lies,
 * everyone else tells the truth; there is no body clue - the liar is the
 * murderer. "A splintered piece of bone" is the skeleton arm. The
 * photographed pages print neither hint nor solution; the solver found the
 * only one, and the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const A_RECENT_DEATH_IN_AN_ANCIENT_TEMPLE: Case = {
  id: "a-recent-death-in-an-ancient-temple",
  number: 33,
  title: "Ein frischer Tod in einem uralten Tempel",
  story:
    "Das Ermittlungsinstitut finanzierte die Ausgrabung eines uralten Tempels, doch mitten in den Arbeiten wurde einer der Archäologen getötet. War es uralte Magie? Das Institut bestand darauf, dass Inspektor Irratino Logico begleitete - damit die Magie eine faire Chance bekam.",
  series: "volume1",
  difficulty: "occult",
  suspects: [
    {
      id: "irratino",
      name: "Inspektor Irratino",
      icon: "\u{1F9FF}",
      description:
        "Ein esoterischer Detektiv. Logico glaubt nur, was er beweisen kann - Irratino glaubt nur, was er nicht beweisen kann.",
      heightCm: 188,
      hand: "left",
      eyes: "green",
      hair: "darkBrown",
      sign: "aquarius",
    },
    {
      id: "azure",
      name: "Bischöfin Azure",
      icon: "⛪",
      description:
        "Eine Bischöfin der örtlichen Kirche. Man weiß, dass sie für ihre Freunde und für ihre Feinde betet. Natürlich bittet sie dabei um verschiedene Dinge ...",
      heightCm: 163,
      hand: "right",
      eyes: "lightBrown",
      hair: "darkBrown",
      sign: "gemini",
    },
    {
      id: "tuscany",
      name: "Rektorin Tuscany",
      icon: "\u{1F393}",
      description:
        "Als Leiterin des Deduction College hat sie deduziert, wie man am meisten Geld aus den Ehemaligen herausholt. (Erpressung.)",
      heightCm: 165,
      hand: "left",
      eyes: "green",
      hair: "gray",
      sign: "libra",
    },
  ],
  locations: [
    {
      id: "entrance",
      name: "der große Eingang",
      icon: "\u{1F6AA}",
      description:
        "Dank des Zahns der Zeit inzwischen eher ein bröckelnder Eingang.",
      indoors: false,
    },
    {
      id: "chamber",
      name: "die heilige Kammer",
      icon: "❓",
      description:
        "Wer weiß, was hinter diesen schweren Eisentüren geschehen ist?",
      indoors: true,
    },
    {
      id: "altar",
      name: "der Hochaltar",
      icon: "\u{1F56F}️",
      description: "Ein gewaltiger Steinaltar, behängt mit verrottendem Stoff.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "skull",
      name: "ein Kristallschädel",
      icon: "\u{1F480}",
      description:
        "Ganz aus Kristall. Vielleicht ein uralter Alienschädel, vielleicht nur ein lustiges Kunstprojekt.",
      weight: "medium",
    },
    {
      id: "arm",
      name: "ein Skelettarm",
      icon: "\u{1F9B4}",
      description:
        "Damit stirbt ein Mensch durch die Knochen eines Menschen, der schon tot ist.",
      weight: "medium",
    },
    {
      id: "dagger",
      name: "ein Ritualdolch",
      icon: "\u{1F5E1}️",
      description:
        "Er besteht aus einem uralten Metall, das Logico nicht bestimmen kann.",
      weight: "medium",
    },
  ],
  clues: [
    {
      text: "Rektorin Tuscany traute der Person nicht, die den Kristallschädel hatte.",
      holds: (scene) => scene.holder("skull").id !== "tuscany",
    },
    {
      text: "Logico entdeckte draußen einen Knochensplitter - nach dem Prinzip der Rationalität. (Er stolperte darüber.)",
      holds: (scene) => !scene.locationOf(scene.holder("arm").id).indoors,
    },
  ],
  statements: [
    {
      by: "irratino",
      text: "Ein Ritualdolch war am Hochaltar.",
      holds: (scene) =>
        scene.locationOf(scene.holder("dagger").id).id === "altar",
    },
    {
      by: "azure",
      text: "Ich habe einen Ritualdolch mitgebracht.",
      holds: (scene) => scene.weaponOf("azure").id === "dagger",
    },
    {
      by: "tuscany",
      text: "Bischöfin Azure war nicht in der heiligen Kammer.",
      holds: (scene) => scene.locationOf("azure").id !== "chamber",
    },
  ],
  exhibits: ["astrology"],
  solution: {
    irratino: { weapon: "skull", location: "chamber" },
    azure: { weapon: "arm", location: "entrance" },
    tuscany: { weapon: "dagger", location: "altar" },
  },
  murderer: "azure",
  hints: [
    {
      text: 'Irratino zeigte Deductive Logico heimlich den Kristallschädel, den er mitgebracht hatte. "Hilft dir das?"',
      book: true,
    },
    {
      text: "Draußen ist nur der große Eingang: Dort war der Skelettarm.",
      marks: [{ a: "arm", b: "entrance", value: "check" }],
    },
    {
      text: "Probiere aus, wer lügt. Lügt Inspektor Irratino, hatte Azure den Dolch und Tuscany (nicht den Schädel) den Arm - also war Tuscany am Eingang. Der Dolch war nicht am Altar, also war Azure in der heiligen Kammer. Das widerspricht Tuscanys Aussage.",
      marks: [
        { a: "azure", b: "entrance", value: "check" },
        { a: "azure", b: "chamber", value: "cross" },
      ],
    },
    {
      text: "Lügt Rektorin Tuscany, war Azure in der heiligen Kammer. Azure und Irratino sagen die Wahrheit: Azure hatte den Dolch, und der war am Hochaltar. Azure kann nicht an beiden Orten sein.",
    },
    {
      text: "Also lügt Bischöfin Azure: Sie hatte den Dolch nicht. Der Dolch war am Hochaltar, und Azure war nicht in der Kammer. Hätte Tuscany den Arm, wäre sie am Eingang, Azure hätte den Schädel und Irratino den Dolch am Altar - für Azure bliebe nur die Kammer. Also hatte Tuscany den Dolch am Hochaltar.",
      marks: [{ a: "tuscany", b: "altar", value: "check" }],
    },
    {
      text: "Azure war nicht in der Kammer, also am Eingang mit dem Skelettarm. Irratino hatte den Kristallschädel in der heiligen Kammer. Bischöfin Azure ist die Mörderin.",
      marks: [
        { a: "azure", b: "arm", value: "check" },
        { a: "skull", b: "chamber", value: "check" },
        { a: "irratino", b: "skull", value: "check" },
        { a: "irratino", b: "chamber", value: "check" },
        { a: "tuscany", b: "dagger", value: "check" },
        { a: "dagger", b: "altar", value: "check" },
      ],
    },
  ],
};
