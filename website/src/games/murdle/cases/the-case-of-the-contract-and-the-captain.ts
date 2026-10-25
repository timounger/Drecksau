/**
 * Case 17, "The Case of the Contract & the Captain": a sailor killed on the
 * yacht of a legendary publisher.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Elementary). Two clues go by height,
 * so the suspects are a constant the clues can rank. The scrambled message
 * reads "Whoever was on the deck was left-handed"; here it is scrambled again
 * in German, letter by letter within each word. The bold last clue names the
 * weapon, not the place; the murderer is whoever had it. The sample prints neither hint nor
 * solution; the solver found the only one, and the hints are our own.
 */
import type { Case, Suspect } from "../engine/types";

/** The suspects, ranked by height in two clues. */
const SUSPECTS: readonly Suspect[] = [
  {
    id: "gainsboro",
    name: "Bookie-Gewinner Gainsboro",
    icon: "\u{1F453}",
    description:
      "Er hat den Bookington-Preis für seinen Roman gewonnen, und das erzählt er dir in den ersten zwei Minuten. Das Buch ist sechstausend Seiten lang und handelt von Erde.",
    heightCm: 183,
    hand: "left",
    eyes: "hazel",
    hair: "lightBrown",
  },
  {
    id: "chalk",
    name: "Verleger Chalk",
    icon: "☎️",
    description:
      'Er hat das Verlagsgeschäft schon vor Jahren durchschaut und nie zurückgeblickt. E-Books nannte er eine "Modeerscheinung", und er besitzt noch immer ein Wählscheibentelefon. Er ist eine Milliarde Dollar schwer.',
    heightCm: 175,
    hand: "right",
    eyes: "blue",
    hair: "white",
  },
  {
    id: "ink",
    name: "Agentin Ink",
    icon: "\u{1F58B}\u{FE0F}",
    description:
      "Eine Agentin mit einem Herz aus Gold - und einem Sinn für Gold. Wenn du gern lebst, leg dich nicht mit ihr an.",
    heightCm: 165,
    hand: "right",
    eyes: "darkBrown",
    hair: "black",
  },
];

/** The case. */
export const THE_CASE_OF_THE_CONTRACT_AND_THE_CAPTAIN: Case = {
  id: "the-case-of-the-contract-and-the-captain",
  number: 17,
  title: "Der Fall vom Kontrakt und dem Kapitän",
  story:
    "Auf der Jacht des legendären Verlegers Chalk unterschrieb Logico einen Vertrag für eine Buchreihe und machte sich daran, den Mord an einem Matrosen aufzuklären, den er ins Buch aufnehmen durfte. Oder zumindest würde er das, sobald er ihn gelöst hätte.",
  series: "volume1",
  difficulty: "elementary",
  suspects: SUSPECTS,
  locations: [
    {
      id: "deck",
      name: "das Deck",
      icon: "\u{1F6E5}\u{FE0F}",
      description:
        "Blick hinaus aufs Meer - aber nicht zu weit, sonst schubst dich noch jemand.",
      indoors: false,
    },
    {
      id: "engine-room",
      name: "der Maschinenraum",
      icon: "⚙️",
      description:
        "Das ist eine grüne Jacht: Sie fährt mit einem Atomreaktor. Wenn die Uranstäbe verbraucht sind, wirft man sie einfach ins Meer.",
      indoors: true,
    },
    {
      id: "dining-hall",
      name: "der Speisesaal",
      icon: "\u{1F37D}\u{FE0F}",
      description:
        "Man hat einen preisgekrönten Koch billig angeheuert, weil er an Land nicht mehr arbeiten darf.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "anchor",
      name: "ein antiker Anker",
      icon: "⚓",
      description:
        "Er ist mit Moos bedeckt, und die Kette ist rostig: Er sieht großartig aus.",
      weight: "heavy",
    },
    {
      id: "pen",
      name: "ein goldener Füller",
      icon: "\u{1F58A}\u{FE0F}",
      description:
        "Zum Unterschreiben von Verträgen und zum Erstechen von Konkurrenten. Sogar die Tinte ist golden.",
      weight: "light",
    },
    {
      id: "shark",
      name: "ein Babyhai",
      icon: "\u{1F988}",
      description:
        "Einfach werfen und los: Wirf ihn auf deine Feinde und sieh zu, wie die Milchzähne loslegen.",
      weight: "medium",
    },
  ],
  clues: [
    {
      text: "Die zweitgrößte verdächtige Person war nie im Maschinenraum gewesen.",
      holds: (scene) => scene.locationOf(tallest(2)).id !== "engine-room",
    },
    {
      text: "Jemand mit offensichtlicher Seekrankheit hatte diesen verwürfelten Hinweis aufgeschrieben: RWE FAU EMD EDKC NASTD WRA IHNDNSLÄGKI.",
      holds: (scene) => scene.at("deck").hand === "left",
    },
    {
      text: "Bookie-Gewinner Gainsboro war neidisch auf die Person mit dem goldenen Füller. Warum habe ich keinen goldenen Füller mitgebracht?, fragte er sich.",
      holds: (scene) => scene.holder("pen").id !== "gainsboro",
    },
    {
      text: "Auf der Jacht galt im Speisesaal ein strenges Ankerverbot, und niemand hätte dagegen verstoßen, nicht einmal für einen Mord.",
      holds: (scene) =>
        scene.locationOf(scene.holder("anchor").id).id !== "dining-hall",
    },
    {
      text: "Die größte verdächtige Person hatte keinen antiken Anker mitgebracht.",
      holds: (scene) => scene.holder("anchor").id !== tallest(1),
    },
  ],
  body: {
    text: "Ein winziger, spitzer Zahn steckte im Körper des Matrosen.",
    weapon: "shark",
  },
  solution: {
    gainsboro: { weapon: "shark", location: "deck" },
    chalk: { weapon: "pen", location: "dining-hall" },
    ink: { weapon: "anchor", location: "engine-room" },
  },
  murderer: "gainsboro",
  hints: [
    {
      text: 'Ein weiteres Boot fuhr vorbei, und am Fahnenmast hing ein Banner: "Wie die Karten des Mortarot sind diese Buchstaben durchgemischt. Das erste Wort heißt WER."',
      book: true,
    },
    {
      text: 'Entwürfelt heißt die Nachricht: "WER AUF DEM DECK STAND WAR LINKSHÄNDIG". Linkshänder ist nur Gainsboro: Er war auf dem Deck.',
      marks: [{ a: "gainsboro", b: "deck", value: "check" }],
    },
    {
      text: "Zweitgrößter ist Verleger Chalk (1,75 m): nicht im Maschinenraum, also im Speisesaal. Agentin Ink bleibt der Maschinenraum.",
      marks: [
        { a: "chalk", b: "dining-hall", value: "check" },
        { a: "ink", b: "engine-room", value: "check" },
      ],
    },
    {
      text: "Größter ist Gainsboro (1,83 m): Er hatte keinen Anker und auch nicht den goldenen Füller - also den Babyhai.",
      marks: [{ a: "gainsboro", b: "shark", value: "check" }],
    },
    {
      text: "Im Speisesaal gab es keinen Anker, also hatte Chalk den goldenen Füller und Agentin Ink den Anker.",
      marks: [
        { a: "chalk", b: "pen", value: "check" },
        { a: "ink", b: "anchor", value: "check" },
        { a: "pen", b: "dining-hall", value: "check" },
      ],
    },
    {
      text: "Der winzige Zahn stammt vom Babyhai - den hatte Gainsboro, auf dem Deck.",
      marks: [
        { a: "shark", b: "deck", value: "check" },
        { a: "anchor", b: "engine-room", value: "check" },
      ],
    },
  ],
};

/**
 * A suspect by their rank in height.
 *
 * @param rank - 1 for the tallest, the number of suspects for the shortest
 * @returns their id
 */
function tallest(rank: number): string {
  const ranked = [...SUSPECTS].sort(
    (one, other) => other.heightCm - one.heightCm,
  );
  return ranked[rank - 1]?.id ?? "";
}
