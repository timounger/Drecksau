/**
 * Case 28, "Investigation at the Investigation Institute": the groundskeeper
 * of the Investigation Institute killed on its grounds.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Occult Medium). The murderer lies,
 * everyone else tells the truth; there is no body clue - the liar is the
 * murderer. "The seventeenth hole" is the miniature golf course; the Libra
 * comes from Exhibit B. The photographed pages print neither hint nor
 * solution; the solver found the only one, and the hints are our own.
 */
import type { Case, Scene } from "../engine/types";

/** The case. */
export const INVESTIGATION_AT_THE_INVESTIGATION_INSTITUTE: Case = {
  id: "investigation-at-the-investigation-institute",
  number: 28,
  title: "Ermittlungen am Ermittlungsinstitut",
  story:
    "Als Deductive Logico auf dem Gelände des Ermittlungsinstituts ankam, staunte er über dessen Budget: ein Heckenlabyrinth, eine Sternwarte, sogar eine Minigolfanlage! Davon hätte man die Hälfte aller Detektive der Welt anheuern können. Warum ausgerechnet ihn? Und wer hatte den Platzwart getötet?",
  series: "volume1",
  difficulty: "occult",
  suspects: [
    {
      id: "cloud",
      name: "Kryptozoologe Cloud",
      icon: "☁️",
      description:
        "Er kennt jede Sichtung von Bigfoot, Yeti und Sasquatch - und auch den Unterschied zwischen ihnen.",
      heightCm: 170,
      hand: "right",
      eyes: "gray",
      hair: "white",
      sign: "scorpio",
    },
    {
      id: "onyx",
      name: "Kräuterkundige Onyx",
      icon: "\u{1F33F}",
      description:
        "In ihrem Gewächshaus hat sie jede Pflanze gezogen, die man für die Koch-, die Zauber- und die Giftmischkunst braucht.",
      heightCm: 152,
      hand: "right",
      eyes: "darkBrown",
      hair: "black",
      sign: "virgo",
    },
    {
      id: "aubergine",
      name: "Chefköchin Aubergine",
      icon: "\u{1F469}‍\u{1F373}",
      description:
        "Man erzählt sich, sie habe einst ihren Mann getötet, gekocht und dann in ihrem Restaurant serviert. Das stimmt nicht, aber schon, dass man sich das über sie erzählt, sagt einiges.",
      heightCm: 157,
      hand: "right",
      eyes: "blue",
      hair: "blond",
      sign: "libra",
    },
  ],
  locations: [
    {
      id: "hedge-maze",
      name: "ein unmögliches Heckenlabyrinth",
      icon: "\u{1F9E9}",
      description:
        "Entworfen vom legendären M. C. Escher - also viel Glück beim Rausfinden.",
      indoors: false,
    },
    {
      id: "observatory",
      name: "die Sternwarte",
      icon: "\u{1F52D}",
      description:
        "Zum Sternegucken, für einen romantischen Abend oder für einen Mord.",
      indoors: true,
    },
    {
      id: "mini-golf",
      name: "die Minigolfanlage",
      icon: "⛳",
      description:
        "Achtzehn Löcher mit Windmühlen, Höhlen und Loopings. Das volle Programm!",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "machine",
      name: "eine Quasi-Perpetuum-mobile-Maschine",
      icon: "⚙️",
      description: "Sie läuft nicht ewig. Eher so zwei, drei Minuten.",
      weight: "heavy",
    },
    {
      id: "dowsing-rod",
      name: "eine Wünschelrute",
      icon: "\u{1FAB5}",
      description: "Damit findet man Wasser, Öl und Leichtgläubige.",
      weight: "medium",
    },
    {
      id: "oil",
      name: "hyperallergenes Öl",
      icon: "\u{1F6E2}️",
      description: "Richtig gelesen: Jeder ist tödlich allergisch dagegen.",
      weight: "light",
    },
  ],
  clues: [
    {
      text: "Die zweitgrößte verdächtige Person brachte hyperallergenes Öl mit.",
      holds: (scene: Scene): boolean => {
        const heights = ["cloud", "onyx", "aubergine"]
          .map((id) => scene.suspect(id).heightCm)
          .sort((left, right) => right - left);
        return scene.holder("oil").heightCm === heights[1];
      },
    },
    {
      text: "Wie sich herausstellte, war zur Tatzeit eine Waage am siebzehnten Loch.",
      holds: (scene) => scene.at("mini-golf").sign === "libra",
    },
  ],
  statements: [
    {
      by: "cloud",
      text: "Eine Wünschelrute war nicht in einem Heckenlabyrinth.",
      holds: (scene) =>
        scene.locationOf(scene.holder("dowsing-rod").id).id !== "hedge-maze",
    },
    {
      by: "onyx",
      text: "Eine Quasi-Perpetuum-mobile-Maschine war nicht in der Sternwarte.",
      holds: (scene) =>
        scene.locationOf(scene.holder("machine").id).id !== "observatory",
    },
    {
      by: "aubergine",
      text: "Kräuterkundige Onyx hat eine Quasi-Perpetuum-mobile-Maschine mitgebracht.",
      holds: (scene) => scene.weaponOf("onyx").id === "machine",
    },
  ],
  exhibits: ["astrology"],
  solution: {
    cloud: { weapon: "machine", location: "hedge-maze" },
    onyx: { weapon: "dowsing-rod", location: "observatory" },
    aubergine: { weapon: "oil", location: "mini-golf" },
  },
  murderer: "aubergine",
  hints: [
    {
      text: "Am Institut gab es eine Person, deren Aufgabe es war, Rätsel hellseherisch zu lösen, und diese Person erklärte selbstsicher, Kräuterkundige Onyx sei in der Sternwarte gewesen.",
      book: true,
      marks: [{ a: "onyx", b: "observatory", value: "check" }],
    },
    {
      text: "Die Größen: Cloud 1,70 m, Aubergine 1,57 m, Onyx 1,52 m. Die Zweitgrößte ist Chefköchin Aubergine: Sie hatte das Öl.",
    },
    {
      text: "Das siebzehnte Loch gehört zur Minigolfanlage. Waage ist nur Aubergine - sie war dort. Cloud und Onyx teilen sich Labyrinth und Sternwarte, Maschine und Wünschelrute.",
      marks: [
        { a: "onyx", b: "dowsing-rod", value: "check" },
        { a: "dowsing-rod", b: "observatory", value: "check" },
      ],
    },
    {
      text: "Probiere aus, wer lügt. Lügt Kräuterkundige Onyx, war die Maschine in der Sternwarte. Aubergine sagt die Wahrheit: Onyx hatte die Maschine, war also in der Sternwarte - und Cloud mit der Wünschelrute im Labyrinth. Dann lügt auch Cloud. Zwei Lügner gibt es nicht.",
    },
    {
      text: "Lügt Kryptozoologe Cloud, war die Wünschelrute im Labyrinth. Laut Aubergine hatte Onyx die Maschine, also Cloud die Rute im Labyrinth und Onyx die Maschine in der Sternwarte. Dann lügt auch Onyx. Auch das geht nicht.",
    },
    {
      text: "Also lügt Chefköchin Aubergine: Onyx hatte die Wünschelrute, Cloud die Maschine. Die Rute war nicht im Labyrinth, also war Onyx in der Sternwarte und Cloud im Labyrinth. Aubergine ist die Mörderin - mit hyperallergenem Öl auf der Minigolfanlage.",
      marks: [
        { a: "aubergine", b: "mini-golf", value: "check" },
        { a: "cloud", b: "machine", value: "check" },
        { a: "cloud", b: "hedge-maze", value: "check" },
        { a: "machine", b: "hedge-maze", value: "check" },
        { a: "aubergine", b: "oil", value: "check" },
        { a: "oil", b: "mini-golf", value: "check" },
      ],
    },
  ],
};
