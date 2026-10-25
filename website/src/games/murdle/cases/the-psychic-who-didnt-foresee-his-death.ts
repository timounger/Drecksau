/**
 * Case 41, "The Psychic Who Didn't Foresee His Death": a psychic killed at
 * the PRL.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Occult Medium), from the photos of
 * the book. There is no body clue - the liar is the murderer. One clue names
 * a birthday (February 1: Aquarius, Exhibit B); the "freshly dug hole" means
 * the grounds, full of holes from dowsing. The solver found the only
 * solution, and the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const THE_PSYCHIC_WHO_DIDNT_FORESEE_HIS_DEATH: Case = {
  id: "the-psychic-who-didnt-foresee-his-death",
  number: 41,
  title: "Der Hellseher, der seinen Tod nicht kommen sah",
  story:
    '"Das Institut hat vielversprechende Daten vom PRL gesehen", sagte Irratino und benutzte eine Abkürzung, die Logico nicht kannte. "Wenn sie beweisen können, dass dieser Hellseher echt ist, geben wir ihnen eine Million Dollar." Leider konnten sie nur beweisen, dass ihr Hellseher tot war.',
  series: "volume1",
  difficulty: "occult",
  suspects: [
    {
      id: "aureolin",
      name: "Die unglaubliche Aureolin",
      icon: "\u{1FA84}",
      description:
        "Sie nimmt gerade an einem Kunstprogramm für Häftlinge teil, in dem eingesperrte Zauberkünstler selbst ernannte Hellseher begutachten dürfen.",
      heightCm: 168,
      hand: "left",
      eyes: "green",
      hair: "blond",
      sign: "aries",
    },
    {
      id: "crimson",
      name: "Dr. Crimson",
      icon: "\u{1FA7A}",
      description:
        "Sie ist die klügste Ärztin, die sie je getroffen hat - sagt sie selbst, und wahrscheinlich hat sie recht. Ja, sie fliegt einmotorige Flugzeuge, aber wenn sie abstürzt, richtet sie sich die Knochen selbst.",
      heightCm: 175,
      hand: "left",
      eyes: "green",
      hair: "red",
      sign: "aquarius",
    },
    {
      id: "duchess",
      name: "Die Herzogin von Vermillion",
      icon: "\u{1F475}",
      description:
        "Eine große alte Frau mit großen alten Geheimnissen. Zum Beispiel, wie viel Geld sie dem PRL gegeben hat.",
      heightCm: 175,
      hand: "left",
      eyes: "gray",
      hair: "white",
      sign: "pisces",
    },
  ],
  locations: [
    {
      id: "grounds",
      name: "das Gelände",
      icon: "\u{1F33F}",
      description: "Voller Löcher von den Experimenten mit der Wünschelrute.",
      indoors: false,
    },
    {
      id: "roof",
      name: "das Dach",
      icon: "\u{1F3E2}",
      description:
        "Hier gab es erfolgreiche Experimente mit Astralreisen und gescheiterte mit echtem Schweben.",
      indoors: false,
    },
    {
      id: "isolation-chamber",
      name: "der Isolationstank",
      icon: "\u{1F6C1}",
      description:
        "Ein Wassertank in einem dunklen Raum. Darin kann man in der Zeit zurückreisen - oder sich einfach furchtbar langweilen.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "machine",
      name: "ein Beinahe-Perpetuum-mobile",
      icon: "⚙️",
      description:
        "Es läuft nicht ewig. Der Rekord dieses Exemplars liegt bei zwei Stunden.",
      weight: "heavy",
    },
    {
      id: "rod",
      name: "eine Wünschelrute",
      icon: "\u{1F531}",
      description: "Damit findet man Wasser, Öl und Dumme.",
      weight: "medium",
    },
    {
      id: "crystal-ball",
      name: "eine Kristallkugel",
      icon: "\u{1F52E}",
      description:
        "Wenn du hineinschaust, sagt sie dir deine Zukunft - solange deine Zukunft eine Kristallkugel ist.",
      weight: "heavy",
    },
  ],
  clues: [
    {
      text: "Ein Beinahe-Perpetuum-mobile wurde in einem frisch gegrabenen Loch gefunden.",
      holds: (scene) =>
        scene.locationOf(scene.holder("machine").id).id === "grounds",
    },
    {
      text: "Die verdächtige Person mit der Wünschelrute ist am 1. Februar geboren. (Siehe Beweisstück B.)",
      holds: (scene) => scene.holder("rod").sign === "aquarius",
    },
  ],
  statements: [
    {
      by: "aureolin",
      text: "Ehrenwort unter Zauberern: Ich habe keine Kristallkugel mitgebracht.",
      holds: (scene) => scene.weaponOf("aureolin").id !== "crystal-ball",
    },
    {
      by: "crimson",
      text: "Glauben Sie mir: Die unglaubliche Aureolin stand auf dem Dach.",
      holds: (scene) => scene.locationOf("aureolin").id === "roof",
    },
    {
      by: "duchess",
      text: "Ich habe mich im Isolationstank entspannt.",
      holds: (scene) => scene.locationOf("duchess").id === "isolation-chamber",
    },
  ],
  exhibits: ["astrology"],
  solution: {
    aureolin: { weapon: "machine", location: "grounds" },
    crimson: { weapon: "rod", location: "roof" },
    duchess: { weapon: "crystal-ball", location: "isolation-chamber" },
  },
  murderer: "crimson",
  hints: [
    {
      text: 'Der Inspektor nutzte seine geistigen Kräfte, um in diesem Fall eine neue Tatsache wahrzunehmen: "Die unglaubliche Aureolin hatte ein Beinahe-Perpetuum-mobile!" Beim Löffelverbiegen hatte er weniger Erfolg.',
      book: true,
      marks: [{ a: "aureolin", b: "machine", value: "check" }],
    },
    {
      text: "Der 1. Februar liegt im Wassermann (Beweisstück B). Wassermann ist nur Dr. Crimson: Sie hatte die Wünschelrute.",
      marks: [{ a: "crimson", b: "rod", value: "check" }],
    },
    {
      text: "Frisch gegrabene Löcher gibt es auf dem Gelände: Das Perpetuum mobile war dort.",
    },
    {
      text: "Probiere aus, wer lügt. Lügt Aureolin, hatte sie die Kristallkugel und die Herzogin das Perpetuum mobile - die Herzogin wäre also auf dem Gelände und nicht im Isolationstank. Dann lügt auch sie. Zwei Lügner gehen nicht.",
      marks: [
        { a: "aureolin", b: "grounds", value: "check" },
        { a: "duchess", b: "crystal-ball", value: "check" },
        { a: "duchess", b: "isolation-chamber", value: "check" },
        { a: "crystal-ball", b: "isolation-chamber", value: "check" },
      ],
    },
    {
      text: "Also sagt Aureolin die Wahrheit: Sie hatte das Perpetuum mobile und war auf dem Gelände. Die Herzogin hatte die Kristallkugel.",
    },
    {
      text: "Dann stimmt Dr. Crimsons Aussage nicht - Aureolin stand nicht auf dem Dach. Dr. Crimson lügt, sie ist die Mörderin.",
      marks: [{ a: "crimson", b: "roof", value: "check" }],
    },
    {
      text: "Die Herzogin sagt die Wahrheit: Sie war im Isolationstank. Dr. Crimson tötete den Hellseher mit der Wünschelrute auf dem Dach.",
      marks: [
        { a: "rod", b: "roof", value: "check" },
        { a: "machine", b: "grounds", value: "check" },
      ],
    },
  ],
};
