/**
 * Case 8, "The Butler Did It (Die)": Dame Obsidian's butler killed in her
 * house.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Elementary), from the photos of the
 * book. Its "either ... or" clue is exclusive: exactly one half holds. The
 * solver found the only solution, and the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const THE_BUTLER_DID_IT_DIE: Case = {
  id: "the-butler-did-it-die",
  number: 8,
  title: "Der Butler war's (tot)",
  story:
    "Gleich nach dem letzten Fall gab es einen weiteren Mord in Dame Obsidians Haus! Damit sah sie noch schuldiger aus, fand Logico. Zumal ausgerechnet ihr Butler ermordet worden war. Was für ein Mensch bringt den Butler von jemand anderem um?",
  series: "volume1",
  difficulty: "elementary",
  suspects: [
    {
      id: "obsidian",
      name: "Dame Obsidian",
      icon: "\u{1F452}",
      description:
        "Zum Hintergrund: Eine Woche nachdem Dame Obsidians zweiter Ehemann verschwunden war, ließ sie ihren Garten zupflastern. Die Zeitungen hatten ihren Spaß damit. Aber ihre Verkaufszahlen verdoppelten sich.",
      heightCm: 163,
      hand: "left",
      eyes: "green",
      hair: "black",
    },
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
    },
    {
      id: "saffron",
      name: "Miss Saffron",
      icon: "\u{1F380}",
      description:
        "Hinreißend und charmant, aber vielleicht nicht die Hellste. Oder sie will, dass du das denkst. Oder sie will, dass du denkst, dass sie will, dass du das denkst.",
      heightCm: 157,
      hand: "left",
      eyes: "hazel",
      hair: "blond",
    },
  ],
  locations: [
    {
      id: "attic",
      name: "der unheimliche Dachboden",
      icon: "\u{1F578}️",
      description:
        "Nichts als Spinnweben, Erbstücke der Familie und Gemälde, in denen es spukt.",
      indoors: true,
    },
    {
      id: "bedroom",
      name: "das große Schlafzimmer",
      icon: "\u{1F6CF}️",
      description:
        "Das Bett ist so groß, dass das Schlafzimmer um es herum gebaut werden musste.",
      indoors: true,
    },
    {
      id: "grounds",
      name: "das Gelände",
      icon: "\u{1F33F}",
      description:
        "Eine akribisch gepflegte, sattgrüne, fünf Zentimeter hohe Monokultur.",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "magnifying-glass",
      name: "eine Lupe",
      icon: "\u{1F50D}",
      description:
        "Damit kann man einen Hinweis finden, das Kleingedruckte lesen oder ein kleines Feuer entfachen.",
      weight: "medium",
    },
    {
      id: "clock",
      name: "eine antike Uhr",
      icon: "\u{1F570}️",
      description:
        "Tick, tack, tick, tack. Genau genommen bringt uns die Zeit alle langsam um.",
      weight: "heavy",
    },
    {
      id: "axe",
      name: "eine Axt",
      icon: "\u{1FA93}",
      description:
        "Mit dieser Axt kann man einen Baum fällen. Oder einen Menschen!",
      weight: "medium",
    },
  ],
  clues: [
    {
      text: "Entweder hatte Miss Saffron eine Axt mitgebracht, oder eine Axt war im großen Schlafzimmer.",
      holds: (scene) =>
        (scene.holder("axe").id === "saffron") !==
        (scene.locationOf(scene.holder("axe").id).id === "bedroom"),
    },
    {
      text: "Sir Rulean hatte sich vor der Person versteckt, die eine Axt mitgebracht hatte.",
      holds: (scene) => scene.holder("axe").id !== "rulean",
    },
    {
      text: "Eine antike Uhr war ganz sicher nicht auf dem Gelände: Es war eine Uhr für drinnen.",
      holds: (scene) =>
        scene.locationOf(scene.holder("clock").id).id !== "grounds",
    },
    {
      text: "Miss Saffron wurde gesehen, wie sie mit einer Waffe das Kleingedruckte in den Anzeigen eines Klatschmagazins las.",
      holds: (scene) => scene.weaponOf("saffron").id === "magnifying-glass",
    },
  ],
  body: {
    text: "Blut war auf ein Erbstück der Familie gespritzt.",
    location: "attic",
  },
  solution: {
    obsidian: { weapon: "axe", location: "bedroom" },
    rulean: { weapon: "clock", location: "attic" },
    saffron: { weapon: "magnifying-glass", location: "grounds" },
  },
  murderer: "rulean",
  hints: [
    {
      text: 'Der Ersatzbutler reichte Logico einen Zettel: "Nach einer Karte, die ich aus dem Mortarot (dem Mord-Tarot) gezogen habe, hatte Sir Rulean eine antike Uhr."',
      book: true,
      marks: [{ a: "rulean", b: "clock", value: "check" }],
    },
    {
      text: "Das Kleingedruckte liest man mit der Lupe: Miss Saffron hatte die Lupe.",
      marks: [{ a: "saffron", b: "magnifying-glass", value: "check" }],
    },
    {
      text: "Sir Rulean versteckte sich vor der Person mit der Axt, hatte sie also nicht. Dame Obsidian hatte die Axt, Sir Rulean die antike Uhr.",
      marks: [
        { a: "rulean", b: "axe", value: "cross" },
        { a: "obsidian", b: "axe", value: "check" },
      ],
    },
    {
      text: "Miss Saffron hatte keine Axt - also war die Axt im großen Schlafzimmer. Dort war Dame Obsidian.",
      marks: [{ a: "axe", b: "bedroom", value: "check" }],
    },
    {
      text: "Die Uhr war nicht auf dem Gelände: Sir Rulean war auf dem Dachboden, Miss Saffron auf dem Gelände.",
      marks: [
        { a: "rulean", b: "attic", value: "check" },
        { a: "saffron", b: "grounds", value: "check" },
        { a: "clock", b: "attic", value: "check" },
      ],
    },
    {
      text: "Erbstücke liegen auf dem unheimlichen Dachboden - dort war Sir Rulean, mit der antiken Uhr.",
      marks: [
        { a: "obsidian", b: "bedroom", value: "check" },
        { a: "magnifying-glass", b: "grounds", value: "check" },
      ],
    },
  ],
};
