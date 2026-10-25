/**
 * Case 4, "The Last Train to Murder": a conductor killed on a racing train.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Elementary), from the photos of the
 * book. Its body clue names the weapon, not the place ("stabbed to death" -
 * the knife); the murderer is whoever had it. The solver found the only solution, and the hints are
 * our own.
 */
import type { Case, Scene, Suspect } from "../engine/types";

/** The case. */
export const THE_LAST_TRAIN_TO_MURDER: Case = {
  id: "the-last-train-to-murder",
  number: 4,
  title: "Der letzte Zug zum Mord",
  story:
    "Zurück auf dem Festland nahm Deductive Logico einen Zug. Leider nahm jemand anderes dem Schaffner das Leben. Nun raste der Zug über die Gleise, und niemand wusste, was zu tun war - außer Logico: Er wusste, dass er den Fall knacken musste.",
  series: "volume1",
  difficulty: "elementary",
  suspects: [
    {
      id: "mauve",
      name: "Vizepräsidentin Mauve",
      icon: "\u{1F97D}",
      description:
        "Eine Vizepräsidentin von TekCo Futures. Wenn sie dich bittet, ihr Metaversum zu betreten, lehne höflich ab.",
      heightCm: 173,
      hand: "right",
      eyes: "darkBrown",
      hair: "black",
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
    },
    {
      id: "bone",
      name: "Philosoph Bone",
      icon: "\u{1F978}",
      description:
        "Ein schneidiger, düsterer Philosoph. Er hat die ethische Theorie begründet, dass er für seine Taten nicht verantwortlich ist, aber für sie bezahlt werden sollte.",
      heightCm: 155,
      hand: "right",
      eyes: "lightBrown",
      hair: "bald",
    },
  ],
  locations: [
    {
      id: "locomotive",
      name: "die Lokomotive",
      icon: "\u{1F682}",
      description:
        "Der ohrenbetäubende Lärm der Dampfmaschine hindert Deductive Logico am Denken.",
      indoors: true,
    },
    {
      id: "caboose",
      name: "der Schlusswagen",
      icon: "\u{1F683}",
      description:
        "Vom Ende des Zuges aus sieht man, woher man kommt - und was man hinter sich lässt ...",
      indoors: true,
    },
    {
      id: "roof",
      name: "das Dach",
      icon: "\u{1F32C}️",
      description:
        "Bei all dem Wind und dem Rauch aus dem Schornstein verliert man hier oben leicht die Orientierung.",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "knife",
      name: "ein importiertes italienisches Messer",
      icon: "\u{1F52A}",
      description:
        "Es sieht aus, als wäre es mit Geld nicht aufzuwiegen. Und das stimmt sogar: Es ist nichts wert.",
      weight: "light",
    },
    {
      id: "luggage",
      name: "ein Lederkoffer",
      icon: "\u{1F9F3}",
      description:
        "Dieser Koffer ist scheußlich. An der Kuh sah das Leder viel besser aus.",
      weight: "heavy",
    },
    {
      id: "newspaper",
      name: "eine zusammengerollte Zeitung (mit einem Brecheisen darin)",
      icon: "\u{1F5DE}️",
      description: "Du denkst, das ist bloß eine Zeitung! Aber dann ... zack!",
      weight: "medium",
    },
  ],
  clues: [
    {
      text: "Eine Seite aus dem Kleinanzeigenteil wurde nahe der Hitze einer Dampfmaschine gefunden.",
      holds: (scene) =>
        scene.locationOf(scene.holder("newspaper").id).id === "locomotive",
    },
    {
      text: "Chefköchin Aubergine und die Person, die einen Lederkoffer mitgebracht hatte, hatten eine gemeinsame Vergangenheit.",
      holds: (scene) => scene.holder("luggage").id !== "aubergine",
    },
    {
      text: "Die größte verdächtige Person setzte nie einen Fuß in den Schlusswagen.",
      holds: (scene) => scene.locationOf(tallest(scene).id).id !== "caboose",
    },
    {
      text: "Philosoph Bone wurde gesehen, wie er draußen herumlief.",
      holds: (scene) => !scene.locationOf("bone").indoors,
    },
  ],
  body: {
    text: "Der Schaffner war erstochen worden.",
    weapon: "knife",
  },
  solution: {
    mauve: { weapon: "newspaper", location: "locomotive" },
    aubergine: { weapon: "knife", location: "caboose" },
    bone: { weapon: "luggage", location: "roof" },
  },
  murderer: "aubergine",
  hints: [
    {
      text: 'Logico bekam ein seltsames Telegramm. Als er den Morsecode geknackt hatte, las er: "Leylinien verraten. Stopp. Vizepräsidentin Mauve. Stopp. Neben der Lokomotive. Stopp."',
      book: true,
    },
    {
      text: "Philosoph Bone war draußen - und draußen ist nur das Dach.",
      marks: [{ a: "bone", b: "roof", value: "check" }],
    },
    {
      text: "Die größte Person ist Vizepräsidentin Mauve (1,73 m). Sie war nicht im Schlusswagen, also in der Lokomotive. Für Chefköchin Aubergine bleibt der Schlusswagen.",
      marks: [{ a: "aubergine", b: "caboose", value: "check" }],
    },
    {
      text: "Die Kleinanzeigen stehen in der Zeitung, die Dampfmaschine ist in der Lokomotive: Vizepräsidentin Mauve hatte die zusammengerollte Zeitung.",
      marks: [
        { a: "mauve", b: "newspaper", value: "check" },
        { a: "mauve", b: "locomotive", value: "check" },
        { a: "newspaper", b: "locomotive", value: "check" },
      ],
    },
    {
      text: "Aubergine hatte nicht den Lederkoffer, also das Messer. Philosoph Bone hatte den Lederkoffer.",
      marks: [
        { a: "aubergine", b: "knife", value: "check" },
        { a: "bone", b: "luggage", value: "check" },
      ],
    },
    {
      text: "Erstochen wird man mit dem Messer - das hatte Chefköchin Aubergine, im Schlusswagen.",
      marks: [
        { a: "knife", b: "caboose", value: "check" },
        { a: "luggage", b: "roof", value: "check" },
      ],
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
