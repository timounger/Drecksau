/**
 * Case 10, "Eat, Drink, and Be Merry, for a Jerk Just Died": a loud-mouthed
 * jerk killed in the village pub.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Elementary), from the photos of the
 * book. The photo blurs whether the center bar is indoors; in a pub it is - no
 * clue asks. The solver found the only solution, and the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const EAT_DRINK_AND_BE_MERRY_FOR_A_JERK_JUST_DIED: Case = {
  id: "eat-drink-and-be-merry-for-a-jerk-just-died",
  number: 10,
  title: "Esst, trinkt und seid fröhlich, denn ein Ekel ist gestorben",
  story:
    "Wegen eines Fehlers mit den Zeitzonen (dem schwierigsten Problem der gesamten deduktiven Analyse) verpasste Logico seinen Heimflug. Also ging er in den Dorfpub, wo alle den Tod eines großmäuligen Ekels feierten. Alle wollten wissen, wer es war (um ihm einen auszugeben), und Logico half gern.",
  series: "volume1",
  difficulty: "elementary",
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
    },
    {
      id: "champagne",
      name: "Genosse Champagne",
      icon: "\u{1F942}",
      description:
        "Ein Kommunist, und zwar ein reicher. Genosse Champagne reist für sein Leben gern um die Welt und teilt die Botschaft des Kommunismus mit den anderen Urlaubern.",
      heightCm: 180,
      hand: "left",
      eyes: "hazel",
      hair: "blond",
    },
    {
      id: "rose",
      name: "Großmeister Rose",
      icon: "♟️",
      description:
        "Ein Schachgroßmeister, der immer schon seinen nächsten Zug plant. Zum Beispiel, wie er seinen nächsten Gegner um die Ecke bringt! (1. e4)",
      heightCm: 170,
      hand: "left",
      eyes: "darkBrown",
      hair: "darkBrown",
    },
  ],
  locations: [
    {
      id: "bar",
      name: "die Theke in der Mitte",
      icon: "\u{1F378}",
      description:
        "Hier gibt es Freigetränke, um zu feiern, dass das Ekel tot ist.",
      indoors: true,
    },
    {
      id: "booth",
      name: "die Ecknische",
      icon: "\u{1F6CB}️",
      description:
        "In Schatten gehüllt. Hier sitzt man, wenn man nicht gesehen werden will.",
      indoors: true,
    },
    {
      id: "bathroom",
      name: "die enge Toilette",
      icon: "\u{1F6BD}",
      description:
        "So klein, als wäre sie für einen Billigflieger entworfen worden.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "corkscrew",
      name: "ein Korkenzieher",
      icon: "\u{1F300}",
      description:
        "Als Logico erst einmal anfing hinzusehen, sah er überall Waffen.",
      weight: "light",
    },
    {
      id: "wine",
      name: "eine Flasche Wein",
      icon: "\u{1F37E}",
      description: "Vorsicht vor Flecken: Rotwein geht nicht mehr raus.",
      weight: "medium",
    },
    {
      id: "crystal-ball",
      name: "eine Kristallkugel",
      icon: "\u{1F52E}",
      description:
        "Wenn du hineinschaust, sagt sie dir deine Zukunft voraus - solange deine Zukunft eine Kristallkugel ist.",
      weight: "heavy",
    },
  ],
  clues: [
    {
      text: "Ein roter Fleck wurde auf winzig kleinem Raum gefunden.",
      holds: (scene) =>
        scene.locationOf(scene.holder("wine").id).id === "bathroom",
    },
    {
      text: "Der Schachspieler misstraute der Person, die eine Flasche Wein mitgebracht hatte.",
      holds: (scene) => scene.holder("wine").id !== "rose",
    },
    {
      text: "Ein Korkenzieher war ganz sicher nicht an der Theke in der Mitte.",
      holds: (scene) =>
        scene.locationOf(scene.holder("corkscrew").id).id !== "bar",
    },
    {
      text: "Die verdächtige Person mit dem Korkenzieher hatte blonde Haare.",
      holds: (scene) => scene.holder("corkscrew").hair === "blond",
    },
  ],
  body: {
    text: "Direkt über der noch warmen Leiche des Ekels wurden Freigetränke ausgeschenkt!",
    location: "bar",
  },
  solution: {
    brownstone: { weapon: "wine", location: "bathroom" },
    champagne: { weapon: "corkscrew", location: "booth" },
    rose: { weapon: "crystal-ball", location: "bar" },
  },
  murderer: "rose",
  hints: [
    {
      text: 'Im beschlagenen Badezimmerspiegel stand geschrieben: "Laut meiner politischen Wünschelrute saß in der Ecknische ein Kommunist."',
      book: true,
    },
    {
      text: "Blonde Haare hat nur Genosse Champagne: Er hatte den Korkenzieher.",
      marks: [{ a: "champagne", b: "corkscrew", value: "check" }],
    },
    {
      text: "Der Schachspieler, Großmeister Rose, hatte den Wein nicht. Bruder Brownstone hatte die Flasche Wein, Rose die Kristallkugel.",
      marks: [
        { a: "rose", b: "wine", value: "cross" },
        { a: "brownstone", b: "wine", value: "check" },
        { a: "rose", b: "crystal-ball", value: "check" },
      ],
    },
    {
      text: "Der winzige Raum ist die enge Toilette: Dort war Bruder Brownstone mit dem Wein.",
      marks: [
        { a: "brownstone", b: "bathroom", value: "check" },
        { a: "wine", b: "bathroom", value: "check" },
      ],
    },
    {
      text: "Der Korkenzieher war nicht an der Theke: Genosse Champagne war in der Ecknische, Großmeister Rose an der Theke.",
      marks: [
        { a: "champagne", b: "booth", value: "check" },
        { a: "rose", b: "bar", value: "check" },
        { a: "corkscrew", b: "booth", value: "check" },
      ],
    },
    {
      text: "Freigetränke gibt es an der Theke - dort war Großmeister Rose, mit der Kristallkugel.",
      marks: [{ a: "crystal-ball", b: "bar", value: "check" }],
    },
  ],
};
