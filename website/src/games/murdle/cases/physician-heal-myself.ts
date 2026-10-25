/**
 * Case 5, "Physician, Heal Myself!": a patient killed at a private hospital.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Elementary), from the photos of the
 * book. The solver found the only solution, and the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const PHYSICIAN_HEAL_MYSELF: Case = {
  id: "physician-heal-myself",
  number: 5,
  title: "Arzt, heile mich selbst!",
  story:
    "Als Deductive Logico in einer Privatklinik wieder zu sich kam, wusste er, dass seine Verletzungen nicht halb so wehtun würden wie die Rechnung. Doch seine Chirurgin, Dr. Crimson, bot ihm einen Handel an: Wenn er den Mord an einem anderen Patienten aufklärte, bekäme er zwei Prozent Rabatt. Er schlug sofort ein.",
  series: "volume1",
  difficulty: "elementary",
  suspects: [
    {
      id: "copper",
      name: "Polizistin Copper",
      icon: "\u{1F46E}‍♀️",
      description:
        "Das Beste daran, als Polizistin kriminell zu sein: Man spart sich den Mittelsmann und ermittelt einfach nicht gegen die eigenen Verbrechen.",
      heightCm: 165,
      hand: "right",
      eyes: "blue",
      hair: "blond",
    },
    {
      id: "crimson",
      name: "Dr. Crimson",
      icon: "\u{1FA7A}",
      description:
        "Nach eigener Aussage die klügste Ärztin, die sie je getroffen hat - und wahrscheinlich hat sie recht. Ja, sie raucht, aber wenn sie Krebs bekommt, findet sie eben ein Heilmittel.",
      heightCm: 175,
      hand: "left",
      eyes: "green",
      hair: "red",
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
    },
  ],
  locations: [
    {
      id: "parking-lot",
      name: "der Parkplatz",
      icon: "\u{1F17F}️",
      description:
        "Ein riesiger Parkplatz, auf dem uniformierte Parkdiener Luxuslimousinen einparken.",
      indoors: false,
    },
    {
      id: "roof",
      name: "das Dach",
      icon: "\u{1F3E5}",
      description:
        "Riesige Klimaanlagen und andere Industriegeräte bedecken das Dach und bieten jede Menge hervorragender Verstecke.",
      indoors: false,
    },
    {
      id: "gift-shop",
      name: "der Geschenkeladen",
      icon: "\u{1F381}",
      description:
        "Dieses Krankenhaus ist so schick, dass man im Geschenkeladen Schmuck kaufen kann. Aber keine Sorge: Es gibt auch ein Regal mit reduzierter Ware.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "acid",
      name: "eine Phiole Säure",
      icon: "\u{1F9EA}",
      description:
        "Laut Etikett sollte man davon keinen Schluck nehmen, so verlockend es auch scheint.",
      weight: "light",
    },
    {
      id: "microscope",
      name: "ein schweres Mikroskop",
      icon: "\u{1F52C}",
      description:
        "Die Objektträger sind so winzig, aber das Mikroskop ist so schwer!",
      weight: "heavy",
    },
    {
      id: "scalpel",
      name: "ein chirurgisches Skalpell",
      icon: "\u{1FA92}",
      description:
        "Irgendwie wirkt es gerade dadurch, dass es so klein ist, gefährlicher.",
      weight: "light",
    },
  ],
  clues: [
    {
      text: "Eine Phiole Säure war ganz sicher nicht auf dem Dach. (Dort gab es Säuresensoren.)",
      holds: (scene) => scene.locationOf(scene.holder("acid").id).id !== "roof",
    },
    {
      text: "Die verdächtige Person im Geschenkeladen hatte hellbraune Augen.",
      holds: (scene) => scene.at("gift-shop").eyes === "lightBrown",
    },
    {
      text: "Polizistin Copper hatte eine Waffe mit einem Etikett, auf dem NICHT TRINKEN stand.",
      holds: (scene) => scene.weaponOf("copper").id === "acid",
    },
    {
      text: "Überraschenderweise hatte Dr. Crimson ihr chirurgisches Skalpell nicht mitgebracht (und auch sonst keins).",
      holds: (scene) => scene.holder("scalpel").id !== "crimson",
    },
  ],
  body: {
    text: "Die Leiche des Patienten wurde unter einer Luxuslimousine gefunden.",
    location: "parking-lot",
  },
  solution: {
    copper: { weapon: "acid", location: "parking-lot" },
    crimson: { weapon: "microscope", location: "roof" },
    lapis: { weapon: "scalpel", location: "gift-shop" },
  },
  murderer: "copper",
  hints: [
    {
      text: 'Aus einer Laune heraus sah Logico in sein eigenes Horoskop und fand darin eine merkwürdige Nachricht: "Logico! Ich hatte eine Vision: Dr. Crimson stand auf dem Dach!" Von wem kamen diese Botschaften nur?',
      book: true,
      marks: [{ a: "crimson", b: "roof", value: "check" }],
    },
    {
      text: "NICHT TRINKEN steht auf der Säure: Polizistin Copper hatte die Phiole Säure.",
      marks: [{ a: "copper", b: "acid", value: "check" }],
    },
    {
      text: "Dr. Crimson hatte kein Skalpell, also das schwere Mikroskop. Schwester Lapis hatte das Skalpell.",
      marks: [
        { a: "crimson", b: "microscope", value: "check" },
        { a: "lapis", b: "scalpel", value: "check" },
      ],
    },
    {
      text: "Hellbraune Augen hat nur Schwester Lapis - sie war im Geschenkeladen.",
      marks: [{ a: "lapis", b: "gift-shop", value: "check" }],
    },
    {
      text: "Die Säure war nicht auf dem Dach: Polizistin Copper war auf dem Parkplatz, Dr. Crimson auf dem Dach.",
      marks: [
        { a: "copper", b: "parking-lot", value: "check" },
        { a: "acid", b: "parking-lot", value: "check" },
      ],
    },
    {
      text: "Luxuslimousinen parken auf dem Parkplatz - dort war Polizistin Copper, mit der Phiole Säure.",
      marks: [
        { a: "microscope", b: "roof", value: "check" },
        { a: "scalpel", b: "gift-shop", value: "check" },
      ],
    },
  ],
};
