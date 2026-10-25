/**
 * Case 52, "A Return to the Institute": the only guard of the overgrown
 * Investigation Institute.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Hard Boiled), from the photos of the
 * book. The "fortune-telling tool" is the crystal ball, the "time-telling
 * device" the pocket watch. The photographed pages print neither hint nor
 * solution; the solver found the only one, and the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const A_RETURN_TO_THE_INSTITUTE: Case = {
  id: "a-return-to-the-institute",
  number: 52,
  title: "Rückkehr ans Institut",
  story:
    "Deductive Logico kehrte zum Ermittlungsinstitut zurück und fand das Gelände von Unkraut überwuchert. Seit Irratino fort war, kümmerte sich niemand mehr um den Ort, und es war still - zu still. Logico begriff, dass das daran lag, dass der einzige Wächter ermordet worden war.",
  series: "volume1",
  difficulty: "hardBoiled",
  suspects: [
    {
      id: "night",
      name: "Numerolog:in Night",
      icon: "🕶️",
      description:
        "Ein mathematisches und esoterisches Wunderkind. Night kennt nicht nur den Wert von V, sondern auch die Bedeutung von V.",
      heightCm: 175,
      hand: "left",
      eyes: "blue",
      hair: "darkBrown",
      sign: "pisces",
    },
    {
      id: "raven",
      name: "Hochalchemist Raven",
      icon: "⚗️",
      description:
        "Es gibt einen alten Witz, dass alle Alchemisten high sind. Raven hasst ihn.",
      heightCm: 173,
      hand: "right",
      eyes: "lightBrown",
      hair: "darkBrown",
      sign: "pisces",
    },
    {
      id: "onyx",
      name: "Kräuterkundige Onyx",
      icon: "🌿",
      description:
        "In ihrem Gewächshaus hat sie jede Pflanze gezogen, die man für die Koch-, die Zauber- und die Giftmischkunst braucht.",
      heightCm: 152,
      hand: "right",
      eyes: "darkBrown",
      hair: "black",
      sign: "virgo",
    },
    {
      id: "flint",
      name: "Philologe Flint",
      icon: "📜",
      description:
        "Über ein Wort lernt man viel aus seiner Etymologie - etwa, woher es kommt und was es früher bedeutet hat.",
      heightCm: 157,
      hand: "left",
      eyes: "green",
      hair: "blond",
      sign: "aquarius",
    },
  ],
  locations: [
    {
      id: "chateau",
      name: "das große Schloss",
      icon: "🏰",
      description:
        "Der Baum, der in seiner Mitte wächst, hat zu welken und zu sterben begonnen.",
      indoors: true,
    },
    {
      id: "tower",
      name: "der hohe Turm",
      icon: "♜",
      description:
        "Ein turmhoher Turm, eigens dafür gebaut, für Experimente Dinge herunterfallen zu lassen.",
      indoors: true,
    },
    {
      id: "minigolf",
      name: "der Minigolfplatz",
      icon: "⛳",
      description:
        "Achtzehn Löcher. Windmühlen, Höhlen und Loopings. Aber niemand will spielen.",
      indoors: false,
    },
    {
      id: "maze",
      name: "ein unmögliches Heckenlabyrinth",
      icon: "🌳",
      description:
        "Ständig müssen Leute aus dem Heckenlabyrinth gerettet werden.",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "dowsing-rod",
      name: "eine Wünschelrute",
      icon: "🪄",
      description: "Damit findet man Wasser, Öl und Leichtgläubige.",
      weight: "medium",
      material: "Holz",
    },
    {
      id: "pocket-watch",
      name: "eine hypnotische Taschenuhr",
      icon: "⏱️",
      description:
        "Wenn du tief in diese Uhr blickst, kannst du die Uhrzeit ablesen.",
      weight: "light",
      material: "Metall",
    },
    {
      id: "motion-machine",
      name: "ein Beinahe-Perpetuum-mobile",
      icon: "⚙️",
      description: "Es läuft nicht ewig. Dieses hier hat einen Tag geschafft.",
      weight: "heavy",
      material: "Metall",
    },
    {
      id: "crystal-ball",
      name: "eine Kristallkugel",
      icon: "🔮",
      description:
        "Wenn du hineinschaust, siehst du deine Zukunft - solange deine Zukunft eine Kristallkugel ist.",
      weight: "heavy",
      material: "Kristall",
    },
  ],
  motives: [
    { id: "tough", name: "beweisen, wie hart man ist", icon: "💪" },
    { id: "inherit", name: "ein Vermögen erben", icon: "💰" },
    { id: "love", name: "für die Liebe kämpfen", icon: "❤️" },
    { id: "could", name: "weil es ging", icon: "⛰️" },
  ],
  clues: [
    {
      text: "Die kleinste verdächtige Person hatte eine Wünschelrute dabei, um an Dinge heranzukommen.",
      holds: (scene) => scene.weaponOf("onyx").id === "dowsing-rod",
    },
    {
      text: "Hochalchemist Raven wurde hoch über dem Gelände herumhängend gesehen.",
      holds: (scene) => scene.locationOf("raven").id === "tower",
    },
    {
      text: "Wer ein Beinahe-Perpetuum-mobile hatte, wollte unbedingt für die Liebe kämpfen.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("motion-machine").id)?.id === "love",
    },
    {
      text: "Niemand mit blauen Augen war im großen Schloss.",
      holds: (scene) => scene.at("chateau").eyes !== "blue",
    },
    {
      text: "Ein Werkzeug zum Wahrsagen wurde neben einer winzigen Windmühle gefunden.",
      holds: (scene) =>
        scene.locationOf(scene.holder("crystal-ball").id).id === "minigolf",
    },
    {
      text: "Wer töten würde, weil es ging, war im großen Schloss.",
      holds: (scene) =>
        scene.locationOf(scene.driven("could").id).id === "chateau",
    },
    {
      text: "Der Wassermann wollte ein Vermögen erben.",
      holds: (scene) => scene.motiveOf("flint")?.id === "inherit",
    },
    {
      text: "Wer ein Gerät zum Ablesen der Uhrzeit hatte, wollte nicht beweisen, wie hart er ist.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("pocket-watch").id)?.id !== "tough",
    },
  ],
  body: {
    text: "Die Leiche des Wächters wurde zwischen verschlungenen Heckenreihen gefunden.",
    location: "maze",
  },
  solution: {
    night: { weapon: "crystal-ball", location: "minigolf", motive: "tough" },
    raven: { weapon: "motion-machine", location: "tower", motive: "love" },
    onyx: { weapon: "dowsing-rod", location: "chateau", motive: "could" },
    flint: { weapon: "pocket-watch", location: "maze", motive: "inherit" },
  },
  murderer: "flint",
  hints: [
    {
      text: 'Seltsam: Im beschlagenen Spiegel stand noch immer ein Hinweis. Er lautete: "Die zweitkleinste verdächtige Person hatte die hypnotische Taschenuhr."',
      book: true,
    },
    {
      text: "Die Kleinste ist Kräuterkundige Onyx (1,52 m): Sie hatte die Wünschelrute. Raven hing hoch über dem Gelände - im hohen Turm. Der Wassermann ist Philologe Flint: Flint wollte ein Vermögen erben.",
      marks: [
        { a: "onyx", b: "dowsing-rod", value: "check" },
        { a: "raven", b: "tower", value: "check" },
        { a: "flint", b: "inherit", value: "check" },
      ],
    },
    {
      text: "Im großen Schloss war niemand mit blauen Augen, also nicht Night, und Raven war im Turm. Wer dort war, tötete, weil es ging - Flint wollte erben, also war Onyx im Schloss und tötete, weil es ging.",
      marks: [{ a: "onyx", b: "chateau", value: "check" }],
    },
    {
      text: "Das Perpetuum mobile gehörte jemandem, der für die Liebe kämpfen wollte - nicht Onyx (Wünschelrute) und nicht Flint (erben). Night und Raven teilen sich also Liebe und Härte. Die Taschenuhr gehörte niemandem, der hart sein wollte, nicht dem Perpetuum-mobile-Menschen und nicht Onyx mit der Wünschelrute: Sie gehörte Flint.",
      marks: [
        { a: "raven", b: "love", value: "check" },
        { a: "flint", b: "pocket-watch", value: "check" },
      ],
    },
    {
      text: "Die Kristallkugel (das Werkzeug zum Wahrsagen) lag bei der Windmühle auf dem Minigolfplatz. Sie gehörte weder Onyx noch Flint, und Raven war im Turm: Night hatte sie auf dem Minigolfplatz und wollte beweisen, wie hart Night ist. Raven hatte das Perpetuum mobile und kämpfte für die Liebe.",
      marks: [
        { a: "crystal-ball", b: "minigolf", value: "check" },
        { a: "night", b: "minigolf", value: "check" },
        { a: "night", b: "tough", value: "check" },
        { a: "minigolf", b: "tough", value: "check" },
      ],
    },
    {
      text: "Für Flint bleibt das Heckenlabyrinth, wo die Leiche lag: Philologe Flint war es, mit der hypnotischen Taschenuhr, um ein Vermögen zu erben.",
      marks: [
        { a: "flint", b: "maze", value: "check" },
        { a: "pocket-watch", b: "maze", value: "check" },
        { a: "pocket-watch", b: "inherit", value: "check" },
        { a: "maze", b: "inherit", value: "check" },
        { a: "night", b: "crystal-ball", value: "check" },
        { a: "crystal-ball", b: "tough", value: "check" },
        { a: "raven", b: "motion-machine", value: "check" },
        { a: "motion-machine", b: "tower", value: "check" },
        { a: "motion-machine", b: "love", value: "check" },
        { a: "tower", b: "love", value: "check" },
        { a: "onyx", b: "could", value: "check" },
        { a: "dowsing-rod", b: "chateau", value: "check" },
        { a: "dowsing-rod", b: "could", value: "check" },
        { a: "chateau", b: "could", value: "check" },
      ],
    },
  ],
};
