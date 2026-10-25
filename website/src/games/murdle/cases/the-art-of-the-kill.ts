/**
 * Case 3, "The Art of the Kill": an experimental artist killed in an art
 * museum.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Elementary), from the photos of the
 * book. Its "either ... or" clue is exclusive: exactly one half holds - read
 * inclusively, the case would have two solutions. The solver found the only
 * one, and the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const THE_ART_OF_THE_KILL: Case = {
  id: "the-art-of-the-kill",
  number: 3,
  title: "Die Kunst des Tötens",
  story:
    "Deductive Logico besuchte ein Kunstmuseum, was ihn ziemlich verwirrte. Kein Mord war je so rätselhaft gewesen wie manche dieser Gemälde. Umso erleichterter war er, als ein experimenteller Künstler unter mysteriösen Umständen getötet wurde: endlich etwas, das er verstand.",
  series: "volume1",
  difficulty: "elementary",
  suspects: [
    {
      id: "slate",
      name: "Kapitänin Slate",
      icon: "\u{1F469}‍\u{1F680}",
      description:
        "Eine echte Astronautin. Die erste Frau, die die dunkle Seite des Mondes umrundet hat - und die erste, die verdächtigt wurde, ihren Kopiloten ermordet zu haben.",
      heightCm: 165,
      hand: "left",
      eyes: "darkBrown",
      hair: "darkBrown",
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
    },
    {
      id: "blackstone",
      name: "Blackstone, Esq.",
      icon: "⚖️",
      description:
        "Unglaublich begabt in der wichtigsten Disziplin eines Anwalts: sich bezahlen zu lassen.",
      heightCm: 183,
      hand: "right",
      eyes: "black",
      hair: "black",
    },
  ],
  locations: [
    {
      id: "rooftop-garden",
      name: "der Dachgarten",
      icon: "\u{1FAB4}",
      description:
        "Ein Dachgarten! Mit Tauben! Und man darf die Tauben füttern! Sehr cool.",
      indoors: false,
    },
    {
      id: "entry-hall",
      name: "die Eingangshalle",
      icon: "\u{1F3DB}️",
      description:
        "Laut einer Gedenktafel an der Wand ist sogar die Architektur der Eingangshalle Kunst.",
      indoors: true,
    },
    {
      id: "art-studio",
      name: "ein Atelier",
      icon: "\u{1F3A8}",
      description: "Ganz hinten im Museum, übersät mit Flyern für Malkurse.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "wine",
      name: "ein Glas vergifteter Wein",
      icon: "\u{1F377}",
      description: "Dein typisches Glas vergifteter Wein. Ein Krimiklassiker.",
      weight: "light",
    },
    {
      id: "statue",
      name: "eine abstrakte Statue",
      icon: "\u{1F5FF}",
      description:
        "Egal wie lange er sie anstarrte, Logico verstand sie nicht.",
      weight: "heavy",
    },
    {
      id: "vase",
      name: "eine seltene Vase",
      icon: "\u{1F3FA}",
      description:
        "Logico überlegte, dass genau genommen jede handgemachte Vase selten ist, weil es sie nur ein einziges Mal gibt.",
      weight: "heavy",
    },
  ],
  clues: [
    {
      text: "Blackstone, Esq., misstraute der Person, die eine abstrakte Statue mitgebracht hatte.",
      holds: (scene) => scene.holder("statue").id !== "blackstone",
    },
    {
      text: "Kapitänin Slate hatte ein Glas vergifteten Wein mitgebracht.",
      holds: (scene) => scene.weaponOf("slate").id === "wine",
    },
    {
      text: "Eine abstrakte Statue war nicht im Atelier. (Manchmal wirkte die Kunst der Studierenden abstrakt, aber nur, weil sie schlecht war.)",
      holds: (scene) =>
        scene.locationOf(scene.holder("statue").id).id !== "art-studio",
    },
    {
      text: "Entweder stand Blackstone, Esq., auf Flyern für Malkurse, oder Kapitänin Slate war im Dachgarten.",
      holds: (scene) =>
        (scene.locationOf("blackstone").id === "art-studio") !==
        (scene.locationOf("slate").id === "rooftop-garden"),
    },
  ],
  body: {
    text: "Die Leiche des experimentellen Künstlers wurde unter einer Gedenktafel an der Wand gefunden.",
    location: "entry-hall",
  },
  solution: {
    slate: { weapon: "wine", location: "entry-hall" },
    azure: { weapon: "statue", location: "rooftop-garden" },
    blackstone: { weapon: "vase", location: "art-studio" },
  },
  murderer: "slate",
  hints: [
    {
      text: 'An der Wand klebte nur ein Blatt Druckerpapier, darauf stand: "Logico! Unsere Medien sagen, eine abstrakte Statue stand neben einer Taube." Wenigstens verstand er diesmal, was gemeint war.',
      book: true,
    },
    {
      text: "Kapitänin Slate hatte den vergifteten Wein. Blackstone, Esq., misstraute der Person mit der Statue - er selbst hatte sie also nicht. Ihm bleibt die seltene Vase, Bischöfin Azure die abstrakte Statue.",
      marks: [
        { a: "slate", b: "wine", value: "check" },
        { a: "blackstone", b: "statue", value: "cross" },
        { a: "azure", b: "statue", value: "check" },
      ],
    },
    {
      text: "Die Statue war nicht im Atelier: Bischöfin Azure war nicht dort.",
    },
    {
      text: "Entweder - oder heißt: Genau eins von beiden stimmt. Wäre Slate im Dachgarten, dürfte Blackstone nicht im Atelier sein - dann wäre Azure mit der Statue dort. Das geht nicht. Also war Slate nicht im Dachgarten, und Blackstone stand auf den Flyern im Atelier.",
      marks: [
        { a: "azure", b: "rooftop-garden", value: "check" },
        { a: "blackstone", b: "art-studio", value: "check" },
        { a: "statue", b: "rooftop-garden", value: "check" },
      ],
    },
    {
      text: "Kapitänin Slate war damit in der Eingangshalle, Bischöfin Azure im Dachgarten.",
      marks: [{ a: "slate", b: "entry-hall", value: "check" }],
    },
    {
      text: "Die Gedenktafel hängt in der Eingangshalle - dort war Kapitänin Slate, mit dem vergifteten Wein.",
      marks: [
        { a: "wine", b: "entry-hall", value: "check" },
        { a: "blackstone", b: "vase", value: "check" },
        { a: "vase", b: "art-studio", value: "check" },
      ],
    },
  ],
};
