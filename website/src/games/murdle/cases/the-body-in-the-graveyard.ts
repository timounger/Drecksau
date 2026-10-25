/**
 * Case 34, "The Body in the Graveyard": the caretaker killed in a graveyard
 * Irratino chose by astrology.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Occult Medium). The murderer lies,
 * everyone else tells the truth; there is no body clue - the liar is the
 * murderer. "A giant pyramid" is the mausoleum, "a finger bone" the skeleton
 * arm. The photo of the columbarium's card is blurred where it says indoors
 * or outdoors; no clue asks, and it is taken as outdoors. The photographed
 * pages print neither hint nor solution; the solver found the only one, and
 * the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const THE_BODY_IN_THE_GRAVEYARD: Case = {
  id: "the-body-in-the-graveyard",
  number: 34,
  title: "Die Leiche auf dem Friedhof",
  story:
    'Als Nächstes wollte Inspektor Irratino auf einen Friedhof. Welchen sie besuchen sollten, bestimmte er per Astrologie - eine Methode, die Deductive Logico verabscheute. Als sie ankamen, war der Friedhofswärter gerade getötet worden. Inspektor Irratino stieß Deductive Logico mit dem Ellbogen an: "Siehst du!"',
  series: "volume1",
  difficulty: "occult",
  suspects: [
    {
      id: "rulean",
      name: "Sir Rulean",
      icon: "\u{1F6E1}️",
      description:
        "Ein kultivierter Gentleman, der erst kürzlich zum Ritter geschlagen wurde - wenn man den schäbigen Papieren glaubt, die er bei sich trägt.",
      heightCm: 173,
      hand: "right",
      eyes: "blue",
      hair: "red",
      sign: "leo",
    },
    {
      id: "eminence",
      name: "Viscount Eminence",
      icon: "\u{1F474}",
      description:
        "Der älteste Mann, den du je gesehen hast. Man sagt, er sei schon alt gewesen, als die Alten noch jung waren.",
      heightCm: 157,
      hand: "left",
      eyes: "black",
      hair: "black",
      sign: "pisces",
    },
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
  ],
  locations: [
    {
      id: "columbarium",
      name: "das Kolumbarium",
      icon: "⚱️",
      description:
        "Ein Gewölbe oder eine Wand, in der Asche aufbewahrt wird. (Jetzt kennst du ein neues Wort.)",
      indoors: false,
    },
    {
      id: "mausoleum",
      name: "das riesige Mausoleum",
      icon: "\u{1F53A}",
      description:
        "Die reichen Mitglieder der Familie Midnight liegen alle in diesem pyramidenförmigen Grab.",
      indoors: true,
    },
    {
      id: "gift-shop",
      name: "der Souvenirladen",
      icon: "\u{1F381}",
      description:
        "Hier gibt es kleine Grabstein-Nippesfiguren oder ein Plüschtier des Maskottchens, Mr. Skull.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "arm",
      name: "ein Skelettarm",
      icon: "\u{1F9B4}",
      description:
        "Damit stirbt ein Mensch durch die Knochen eines Menschen, der schon tot ist.",
      weight: "medium",
    },
    {
      id: "poison",
      name: "ein Fläschchen tödliches Gift",
      icon: "\u{1F9EA}",
      description:
        "Keine Sorge, es ist sicher verschlossen mit - Moment, wo ist der Korken?!",
      weight: "light",
    },
    {
      id: "beads",
      name: "eine Gebetskette",
      icon: "\u{1F64F}",
      description:
        "Elfenbeinerne Gebetsperlen, bedeckt mit winzigen eingravierten Symbolen.",
      weight: "medium",
    },
  ],
  clues: [
    {
      text: "Deductive Logicos Spurensicherung fand einen Tropfen Gift in einer riesigen Pyramide.",
      holds: (scene) =>
        scene.locationOf(scene.holder("poison").id).id === "mausoleum",
    },
    {
      text: "Inspektor Irratino fand einen Fingerknochen im Kolumbarium. Ein untrügliches Zeichen!",
      holds: (scene) =>
        scene.locationOf(scene.holder("arm").id).id === "columbarium",
    },
  ],
  statements: [
    {
      by: "rulean",
      text: "Ich habe eine Gebetskette mitgebracht.",
      holds: (scene) => scene.weaponOf("rulean").id === "beads",
    },
    {
      by: "eminence",
      text: "Ja, nun, ich habe einen Skelettarm mitgebracht.",
      holds: (scene) => scene.weaponOf("eminence").id === "arm",
    },
    {
      by: "brownstone",
      text: "Bei der Ehre meines Ordens: Ich war nicht im Souvenirladen.",
      holds: (scene) => scene.locationOf("brownstone").id !== "gift-shop",
    },
  ],
  exhibits: ["astrology"],
  solution: {
    rulean: { weapon: "beads", location: "gift-shop" },
    eminence: { weapon: "poison", location: "mausoleum" },
    brownstone: { weapon: "arm", location: "columbarium" },
  },
  murderer: "eminence",
  hints: [
    {
      text: 'Inspektor Irratino deutete ein Zeichen, das er in den Sternen gesehen hatte, und verkündete dann: "Bruder Brownstone sagt die Wahrheit."',
      book: true,
    },
    {
      text: "Die riesige Pyramide ist das Mausoleum: Dort war das Gift. Der Fingerknochen gehört zum Skelettarm - der war im Kolumbarium. Die Gebetskette war also im Souvenirladen.",
      marks: [
        { a: "poison", b: "mausoleum", value: "check" },
        { a: "arm", b: "columbarium", value: "check" },
        { a: "beads", b: "gift-shop", value: "check" },
      ],
    },
    {
      text: "Probiere aus, wer lügt. Lügt Sir Rulean, sagen die anderen die Wahrheit: Eminence hatte den Arm, Rulean nicht die Kette, also das Gift. Brownstone bliebe die Kette im Souvenirladen. Das widerspricht seiner Aussage.",
      marks: [{ a: "eminence", b: "poison", value: "check" }],
    },
    {
      text: "Lügt Bruder Brownstone, war er im Souvenirladen, hatte also die Gebetskette. Rulean sagt aber die Wahrheit: Er hatte die Kette. Das geht nicht.",
    },
    {
      text: "Also lügt Viscount Eminence: Er hatte den Arm nicht. Rulean hatte die Kette und war im Souvenirladen, Brownstone den Arm im Kolumbarium. Viscount Eminence ist der Mörder - mit dem Fläschchen Gift im Mausoleum.",
      marks: [
        { a: "rulean", b: "gift-shop", value: "check" },
        { a: "brownstone", b: "columbarium", value: "check" },
        { a: "eminence", b: "mausoleum", value: "check" },
        { a: "rulean", b: "beads", value: "check" },
        { a: "brownstone", b: "arm", value: "check" },
      ],
    },
  ],
};
