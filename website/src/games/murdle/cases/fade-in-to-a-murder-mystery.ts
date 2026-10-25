/**
 * Case 45, "Fade In to a Murder Mystery": a ticket taker killed at a drive-in
 * theater said to be haunted.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Occult Medium), from the photos of
 * the book. There is no body clue - the liar is the murderer. "The
 * drive-thru" is the box office, by its card. Superfan Smoky is printed with
 * dark brown eyes and black hair here (black eyes and dark brown hair in case
 * 76). The solver found the only solution, and the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const FADE_IN_TO_A_MURDER_MYSTERY: Case = {
  id: "fade-in-to-a-murder-mystery",
  number: 45,
  title: "Aufblende zum Mordrätsel",
  story:
    "Nachdem Deductive Logico um kein Live-Theater mehr gebeten hatte, nahm Inspektor Irratino ihn mit zu einem Krimi in einem Autokino, in dem es angeblich spukte. Doch soweit Logico sehen konnte, war es ein ganz normales Autokino. Irgendetwas Unheimliches musste es doch geben. Vielleicht die Tatsache, dass der Kartenabreißer getötet worden war.",
  series: "volume1",
  difficulty: "occult",
  suspects: [
    {
      id: "ivory",
      name: "Lektorin Ivory",
      icon: "\u{1F339}",
      description:
        "Die größte Liebesroman-Lektorin aller Zeiten. Sie hat das Genre Enemies to Lovers erfunden und als Erste einen nackten Mann auf ein Buchcover gebracht.",
      heightCm: 168,
      hand: "left",
      eyes: "lightBrown",
      hair: "gray",
      sign: "scorpio",
    },
    {
      id: "smoky",
      name: "Superfan Smoky",
      icon: "\u{1F913}",
      description:
        "Er kennt die Drehorte jedes Midnight-Krimis, aber nicht, wie man Freunde findet.",
      heightCm: 178,
      hand: "left",
      eyes: "darkBrown",
      hair: "black",
      sign: "virgo",
    },
    {
      id: "silverton",
      name: "Legende Silverton",
      icon: "\u{1F31F}",
      description:
        "Ein gefeierter Schauspieler des Goldenen Zeitalters, inzwischen in seinen goldenen Jahren.",
      heightCm: 193,
      hand: "right",
      eyes: "blue",
      hair: "silver",
      sign: "leo",
    },
  ],
  locations: [
    {
      id: "screen",
      name: "die Leinwand",
      icon: "\u{1F3AC}",
      description:
        "Wenn dir der Film nicht gefällt, schalte deine Scheinwerfer an, dann ist er ausgeblichen.",
      indoors: false,
    },
    {
      id: "concession-stand",
      name: "der Imbissstand",
      icon: "\u{1F964}",
      description: "Hier gibt es das Übliche: Limo, Kohl, ein rohes Ei. Egal!",
      indoors: false,
    },
    {
      id: "box-office",
      name: "die Kasse",
      icon: "\u{1F3AB}",
      description:
        "Sie ist ein Drive-in-Schalter. Abgerechnet wird pro Auto, also kommen viele Clowns.",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "spare-tire",
      name: "ein Ersatzreifen",
      icon: "\u{1F6DE}",
      description: "Wo das Gummi auf deinen Kopf trifft!",
      weight: "heavy",
    },
    {
      id: "shovel",
      name: "eine Schaufel",
      icon: "\u{1FA8F}",
      description:
        "Ein Mehrzweckwerkzeug: Töte jemanden und begrabe ihn mit derselben Schaufel!",
      weight: "medium",
    },
    {
      id: "popcorn",
      name: "vergiftetes Popcorn",
      icon: "\u{1F37F}",
      description: "Frisch gepoppt und frisch vergiftet. Mit Mandelgeschmack!",
      weight: "medium",
    },
  ],
  clues: [
    {
      text: "Eine schwere Waffe wurde am Drive-in-Schalter zurückgelassen.",
      holds: (scene) =>
        scene.weaponOf(scene.at("box-office").id).weight === "heavy",
    },
    {
      text: "Superfan Smoky hat früher die Person gestalkt, die vergiftetes Popcorn mitgebracht hat.",
      holds: (scene) => scene.holder("popcorn").id !== "smoky",
    },
  ],
  statements: [
    {
      by: "ivory",
      text: "Nun, Legende Silverton hat eine Schaufel mitgebracht.",
      holds: (scene) => scene.weaponOf("silverton").id === "shovel",
    },
    {
      by: "smoky",
      text: "Oh, wow! Lektorin Ivory war am Imbissstand.",
      holds: (scene) => scene.locationOf("ivory").id === "concession-stand",
    },
    {
      by: "silverton",
      text: "Ich sage Ihnen, wie es ist: Ich war bei der Leinwand.",
      holds: (scene) => scene.locationOf("silverton").id === "screen",
    },
  ],
  exhibits: ["astrology"],
  solution: {
    ivory: { weapon: "shovel", location: "concession-stand" },
    smoky: { weapon: "spare-tire", location: "box-office" },
    silverton: { weapon: "popcorn", location: "screen" },
  },
  murderer: "ivory",
  hints: [
    {
      text: "Inspektor Irratino deutete eine Tarotkarte, die er gezogen hatte, und verkündete dann: Lektorin Ivory sei gesehen worden, wie sie neben einem ganz und gar nicht ekligen rohen Ei herumhing.",
      book: true,
    },
    {
      text: "Der Drive-in-Schalter ist die Kasse. Schwer ist nur der Ersatzreifen: Er war an der Kasse.",
      marks: [{ a: "spare-tire", b: "box-office", value: "check" }],
    },
    {
      text: "Probiere aus, wer lügt. Lügt Legende Silverton, war er nicht bei der Leinwand. Ivory war laut Smoky am Imbissstand, also wäre Silverton an der Kasse mit dem Ersatzreifen - laut Ivory hatte er aber die Schaufel. Das geht nicht.",
      marks: [
        { a: "silverton", b: "screen", value: "check" },
        { a: "ivory", b: "shovel", value: "check" },
        { a: "ivory", b: "concession-stand", value: "check" },
        { a: "smoky", b: "spare-tire", value: "check" },
        { a: "smoky", b: "box-office", value: "check" },
        { a: "shovel", b: "concession-stand", value: "check" },
      ],
    },
    {
      text: "Lügt Superfan Smoky, war Silverton laut eigener Aussage bei der Leinwand, mit der Schaufel. Ivory war nicht am Imbissstand, also an der Kasse mit dem Reifen - und Smoky bliebe das Popcorn. Aber Smoky hat den Popcorn-Bringer gestalkt, hatte es also nicht. Das geht nicht.",
      marks: [{ a: "smoky", b: "popcorn", value: "cross" }],
    },
    {
      text: "Also lügt Lektorin Ivory - sie ist die Mörderin. Ivory war am Imbissstand, Silverton bei der Leinwand, Superfan Smoky an der Kasse mit dem Ersatzreifen.",
    },
    {
      text: "Silverton hatte keine Schaufel, also das Popcorn. Lektorin Ivory tötete den Kartenabreißer mit der Schaufel am Imbissstand.",
      marks: [
        { a: "silverton", b: "popcorn", value: "check" },
        { a: "popcorn", b: "screen", value: "check" },
      ],
    },
  ],
};
