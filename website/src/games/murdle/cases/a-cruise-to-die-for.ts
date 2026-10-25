/**
 * Case 36, "A Cruise to Die For": a cargo ship in the Bermuda Triangle.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Occult Medium). The first case with
 * statements: the murderer lies, everyone else tells the truth. There is no
 * body clue - the liar is the murderer. The sample prints neither hint nor
 * solution; the solver found the only one, and the hints are our own.
 */
import type { Case, Scene } from "../engine/types";

/** The case. */
export const A_CRUISE_TO_DIE_FOR: Case = {
  id: "a-cruise-to-die-for",
  number: 36,
  title: "Eine Kreuzfahrt zum Sterben",
  story:
    "Deductive Logico freute sich auf eine Kreuzfahrt - bis sich herausstellte, dass es ein Frachtschiff im Bermudadreieck war. Als der Erste Offizier starb, war Irratino außer sich vor Freude. Endlich ein Beweis für das Übersinnliche!",
  series: "volume1",
  difficulty: "occult",
  suspects: [
    {
      id: "tangerine",
      name: "Mx. Tangerine",
      icon: "\u{1F9E2}",
      description:
        "Der Beweis, dass auch nicht-binäre Menschen Mörder sein können: Künstler:in, Dichter:in und verdächtig.",
      heightCm: 165,
      hand: "left",
      eyes: "hazel",
      hair: "blond",
      sign: "pisces",
    },
    {
      id: "navy",
      name: "Admiral Navy",
      icon: "\u{1F396}️",
      description:
        "Der erstgeborene Sohn eines Admiral Navy, der selbst der erstgeborene Sohn eines Admiral Navy war.",
      heightCm: 175,
      hand: "right",
      eyes: "blue",
      hair: "lightBrown",
      sign: "cancer",
    },
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
      sign: "aquarius",
    },
  ],
  locations: [
    {
      id: "quarters",
      name: "die Kapitänskajüte",
      icon: "\u{1F6CF}️",
      description: "Vollgehängt mit Postern der Lieblingswellen des Kapitäns.",
      indoors: true,
    },
    {
      id: "cargo-hold",
      name: "der Frachtraum",
      icon: "\u{1F4E6}",
      description:
        "Millionen Pfund Fracht, vor allem billige Elektronik und Fast Fashion.",
      indoors: true,
    },
    {
      id: "overboard",
      name: "über Bord",
      icon: "\u{1F30A}",
      description: "Hier wirst du womöglich auch noch von Haien ermordet.",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "rum",
      name: "vergifteter Rum",
      icon: "\u{1F37E}",
      description: "Johoho und 'ne Buddel voll Arsen.",
      weight: "medium",
    },
    {
      id: "rope",
      name: "ein Seemannstau",
      icon: "\u{1FAA2}",
      description: "Es franst schon in kleine weiße Fasern aus.",
      weight: "medium",
    },
    {
      id: "flare",
      name: "eine Leuchtfackel",
      icon: "\u{1F387}",
      description: "Wow, deine inneren Blaxonen schlagen ja voll aus!",
      weight: "light",
    },
  ],
  clues: [
    {
      text: "Sehr zu seiner Verlegenheit musste Admiral Navy um Hilfe rufen, als er über Bord ging.",
      holds: (scene) => scene.locationOf("navy").id === "overboard",
    },
    {
      text: "Die andere Person, die genauso groß ist wie Mx. Tangerine, wurde beim Spielen mit einer Leuchtfackel gesehen.",
      holds: (scene: Scene): boolean => {
        const holder = scene.holder("flare");
        return (
          holder.id !== "tangerine" &&
          holder.heightCm === scene.suspect("tangerine").heightCm
        );
      },
    },
  ],
  statements: [
    {
      by: "tangerine",
      text: "Ich war nicht im Frachtraum.",
      holds: (scene) => scene.locationOf("tangerine").id !== "cargo-hold",
    },
    {
      by: "navy",
      text: "Ein Seemannstau war in der Kapitänskajüte.",
      holds: (scene) =>
        scene.locationOf(scene.holder("rope").id).id === "quarters",
    },
    {
      by: "slate",
      text: "Was soll ich denn sagen? Ich war in der Kapitänskajüte.",
      holds: (scene) => scene.locationOf("slate").id === "quarters",
    },
  ],
  exhibits: ["astrology"],
  solution: {
    tangerine: { weapon: "rope", location: "quarters" },
    navy: { weapon: "rum", location: "overboard" },
    slate: { weapon: "flare", location: "cargo-hold" },
  },
  murderer: "slate",
  hints: [
    {
      text: 'Irratino blätterte durch sein Traumtagebuch und tippte wahllos auf einzelne Buchstaben. Am Ende ergaben sie: "Das Verbrechen geschah im Frachtraum."',
      book: true,
    },
    {
      text: "Admiral Navy ging über Bord - dort war er.",
      marks: [{ a: "navy", b: "overboard", value: "check" }],
    },
    {
      text: "Genauso groß wie Mx. Tangerine (1,65 m) ist nur Kapitänin Slate: Sie hatte die Leuchtfackel.",
      marks: [{ a: "slate", b: "flare", value: "check" }],
    },
    {
      text: "Probiere aus, wer lügt. Lügt Admiral Navy, sagen Tangerine und Slate die Wahrheit - dann wären beide in der Kapitänskajüte. Das geht nicht.",
      marks: [{ a: "tangerine", b: "quarters", value: "check" }],
    },
    {
      text: "Lügt Mx. Tangerine, war Tangerine im Frachtraum und Slate in der Kajüte. Dann stimmt Navys Aussage: Das Seil war in der Kajüte - also bei Slate. Aber Slate hat die Fackel. Auch das geht nicht.",
      marks: [{ a: "slate", b: "cargo-hold", value: "check" }],
    },
    {
      text: "Also lügt Kapitänin Slate - sie ist die Mörderin. Sie war im Frachtraum, Mx. Tangerine mit dem Seil in der Kajüte und Admiral Navy mit dem vergifteten Rum über Bord.",
      marks: [
        { a: "navy", b: "rum", value: "check" },
        { a: "rum", b: "overboard", value: "check" },
        { a: "tangerine", b: "rope", value: "check" },
        { a: "rope", b: "quarters", value: "check" },
        { a: "flare", b: "cargo-hold", value: "check" },
      ],
    },
  ],
};
