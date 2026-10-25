/**
 * Case 9, "Hedge Your Bets, the Constable Cried": Dame Obsidian killed in her
 * hedge maze.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Elementary), from the photos of the
 * book. The photo blurs whether the fountain and the ruins are indoors; both
 * are outdoors here, like the ruins of case 7 - no clue asks. The solver found
 * the only solution, and the hints are our own.
 */
import type { Case, Scene, Suspect } from "../engine/types";

/** The case. */
export const HEDGE_YOUR_BETS_THE_CONSTABLE_CRIED: Case = {
  id: "hedge-your-bets-the-constable-cried",
  number: 9,
  title: "Alles auf eine Hecke setzen, rief die Wachtmeisterin",
  story:
    "Während Logico sich fragte, ob Dame Obsidian vielleicht doch unschuldig war, hörte er einen Schrei aus ihrem Heckenlabyrinth. Er rannte hinein, verirrte sich, fand den Weg und dann Dame Obsidian - von deren Unschuld er nun überzeugt war, denn sie war tot.",
  series: "volume1",
  difficulty: "elementary",
  suspects: [
    {
      id: "copper",
      name: "Wachtmeisterin Copper",
      icon: "\u{1F482}‍♀️",
      description:
        "Die eineiige Zwillingsschwester von Polizistin Copper. Als sich ihre Eltern scheiden ließen, zog sie über den Ozean. Aber die beiden haben so viel gemeinsam: dieselbe Größe, denselben Beruf, denselben Hang zur Gewalt.",
      heightCm: 165,
      hand: "right",
      eyes: "blue",
      hair: "blond",
    },
    {
      id: "lavender",
      name: "Lord Lavender",
      icon: "\u{1F3BC}",
      description:
        "Ein konservatives Mitglied des britischen Oberhauses und zugleich der Musicalkomponist hinter Hits wie Dogs und Mr. Moses Megastar.",
      heightCm: 175,
      hand: "right",
      eyes: "green",
      hair: "gray",
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
      id: "fountain",
      name: "der Springbrunnen",
      icon: "⛲",
      description:
        "Ein Springbrunnen in der Mitte des Labyrinths - wenn man ihn findet.",
      indoors: false,
    },
    {
      id: "tower",
      name: "der Aussichtsturm",
      icon: "\u{1F5FC}",
      description:
        "Von hier oben sieht man den ganzen Garten. Außerdem hängt an der Wand eine Karte, die (einige) Geheimnisse des Labyrinths verrät.",
      indoors: true,
    },
    {
      id: "ruins",
      name: "die alten Ruinen",
      icon: "\u{1F5FF}",
      description:
        "Schon wieder diese alten Ruinen! Sie standen hier lange vor dem Rest des Labyrinths.",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "shears",
      name: "eine Gartenschere",
      icon: "✂️",
      description:
        "Sie rostet schon ein bisschen und verliert vielleicht ein paar Schrauben.",
      weight: "medium",
    },
    {
      id: "flowerpot",
      name: "ein Blumentopf",
      icon: "\u{1FAB4}",
      description: "Wer damit mordet, möge die Blumen bitte vorher umtopfen.",
      weight: "medium",
    },
    {
      id: "tea",
      name: "vergifteter Tee",
      icon: "\u{1F375}",
      description:
        "Genieß einen schönen Schluck Tee, gefolgt von einem langen, langen Nickerchen.",
      weight: "light",
    },
  ],
  clues: [
    {
      text: "Vergifteter Tee war ganz sicher nicht bei den alten Ruinen und auch nicht am Springbrunnen.",
      holds: (scene) =>
        !["ruins", "fountain"].includes(
          scene.locationOf(scene.holder("tea").id).id,
        ),
    },
    {
      text: "Die größte verdächtige Person und die Person, die eine Gartenschere mitgebracht hatte, hatten eine gemeinsame Vergangenheit.",
      holds: (scene) => scene.holder("shears").id !== tallest(scene).id,
    },
    {
      text: "Ein Blumentopf war nicht bei den alten Ruinen. Oder doch? (Nein.)",
      holds: (scene) =>
        scene.locationOf(scene.holder("flowerpot").id).id !== "ruins",
    },
    {
      text: "Miss Saffron war süchtig nach dem Produkt eines Freundes, Earl Grey, und sie gab nur ein klein wenig Gift dazu.",
      holds: (scene) => scene.weaponOf("saffron").id === "tea",
    },
  ],
  body: {
    text: "Dame Obsidians Leiche wurde neben einer blutbespritzten Karte gefunden.",
    location: "tower",
  },
  solution: {
    copper: { weapon: "shears", location: "ruins" },
    lavender: { weapon: "flowerpot", location: "fountain" },
    saffron: { weapon: "tea", location: "tower" },
  },
  murderer: "saffron",
  hints: [
    {
      text: 'Als Logico sich im Labyrinth verirrt hatte, sah er nach oben: Jemand hatte eine Nachricht in die Wolken geschrieben - "Lavender schwamm im Springbrunnen!" Wer auch immer diese Botschaften schickte, hatte echte Mittel.',
      book: true,
      marks: [{ a: "lavender", b: "fountain", value: "check" }],
    },
    {
      text: "Earl Grey macht Tee: Miss Saffron hatte den vergifteten Tee.",
      marks: [{ a: "saffron", b: "tea", value: "check" }],
    },
    {
      text: "Der Tee war weder bei den Ruinen noch am Springbrunnen - Miss Saffron war im Aussichtsturm.",
      marks: [
        { a: "saffron", b: "tower", value: "check" },
        { a: "tea", b: "tower", value: "check" },
      ],
    },
    {
      text: "Die größte Person ist Lord Lavender (1,75 m). Er hatte die Gartenschere nicht, also den Blumentopf. Wachtmeisterin Copper hatte die Gartenschere.",
      marks: [{ a: "copper", b: "shears", value: "check" }],
    },
    {
      text: "Der Blumentopf war nicht bei den Ruinen: Lord Lavender war am Springbrunnen, Wachtmeisterin Copper bei den alten Ruinen.",
      marks: [
        { a: "copper", b: "ruins", value: "check" },
        { a: "lavender", b: "flowerpot", value: "check" },
        { a: "flowerpot", b: "fountain", value: "check" },
      ],
    },
    {
      text: "Die Karte hängt im Aussichtsturm - dort war Miss Saffron, mit dem vergifteten Tee.",
      marks: [{ a: "shears", b: "ruins", value: "check" }],
    },
  ],
};

/**
 * The tallest suspect of a scene.
 *
 * @param scene - one way it could have been
 * @returns the suspect no one is taller than
 */
function tallest(scene: Scene): Suspect {
  return Object.keys(scene.world)
    .map(scene.suspect)
    .reduce((best, one) => (one.heightCm > best.heightCm ? one : best));
}
