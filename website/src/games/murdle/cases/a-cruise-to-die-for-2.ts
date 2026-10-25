/**
 * Case 46, "A Cruise to Die For 2": a first mate killed on an
 * all-expenses-paid cruise.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Occult Medium), from the photos of
 * the book. There is no body clue - the liar is the murderer. The book spells
 * its message with the symbols of Exhibit B, each standing for the first
 * letter of its English name: TAURUS HAD SPEAR (the alchemical symbols for
 * Uranus, Radium, Hematite, Dissolve and Earth among them). The German names
 * of those symbols cannot spell a German sentence, so here the message is
 * two symbols: the sign of Taurus from Exhibit B and the fishing spear's own
 * symbol. The solver found the only solution, and the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const A_CRUISE_TO_DIE_FOR_2: Case = {
  id: "a-cruise-to-die-for-2",
  number: 46,
  title: "Eine Kreuzfahrt zum Sterben 2",
  story:
    "Inspektor Irratino ließ die (neue) Numerologin des Instituts die Zahlen durchrechnen, und sie fand heraus, dass eine Kreuzfahrt mit Vollpension billiger war, als ständig überallhin zu fliegen. Und so nahm Irratino Deductive Logico endlich mit auf diese Kreuzfahrt. Ihre liebste Erinnerung daran: wie sie den Mord am Ersten Offizier aufklärten.",
  series: "volume1",
  difficulty: "occult",
  suspects: [
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
      id: "mauve",
      name: "Vizepräsidentin Mauve",
      icon: "\u{1F97D}",
      description:
        "Eine Vizepräsidentin von TekCo Futures. Wenn sie dich bittet, ihr Metaversum zu betreten - mein Gott! Lauf sofort weg!",
      heightCm: 173,
      hand: "right",
      eyes: "darkBrown",
      hair: "black",
      sign: "taurus",
    },
    {
      id: "applegreen",
      name: "Schulleiter Applegreen",
      icon: "\u{1F468}\u{200D}\u{1F3EB}",
      description:
        "Seine Tochter hat ihren gut bezahlten Job im Verlag gekündigt und ist in eine Kommune gezogen. Man könnte also sagen, er macht diese Kreuzfahrt zur Entspannung.",
      heightCm: 180,
      hand: "right",
      eyes: "blue",
      hair: "blond",
      sign: "libra",
    },
  ],
  locations: [
    {
      id: "deck",
      name: "das Deck",
      icon: "\u{1F6A2}",
      description:
        "Hier oben kann man Cribbage spielen, aber niemand scheint genau zu wissen, was Cribbage eigentlich ist.",
      indoors: false,
    },
    {
      id: "dining-hall",
      name: "der Speisesaal",
      icon: "\u{1F37D}️",
      description: "Wahrscheinlich der beste Speisesaal auf dem ganzen Schiff.",
      indoors: true,
    },
    {
      id: "quarters",
      name: "die Kapitänskajüte",
      icon: "\u{1F6CF}️",
      description:
        "Der Kapitän hält seine Tür verschlossen, damit niemand sieht, wie viel Platz er hat.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "blowfish",
      name: "ein giftiger Kugelfisch",
      icon: "\u{1F421}",
      description:
        "Sorgfältig zubereitet kann man ihn gefahrlos essen. Noch sorgfältiger zubereitet kann er töten.",
      weight: "light",
    },
    {
      id: "spear",
      name: "ein Fischspeer",
      icon: "\u{1F531}",
      description:
        "Touristen können dafür bezahlen, dass der Fisch schon vorne dranhängt.",
      weight: "medium",
    },
    {
      id: "wheel",
      name: "das Steuerrad",
      icon: "☸️",
      description:
        "Das Schlimmste daran, damit zu töten: Jetzt läuft das Schiff auf Grund.",
      weight: "medium",
    },
  ],
  clues: [
    {
      text: "Das Ermittlungsinstitut konnte Irratino eine Nachricht zum Fall funken (siehe Beweisstück B): ♉ \u{1F531}",
      holds: (scene) => scene.holder("spear").sign === "taurus",
    },
    {
      text: "Giftige Kugelfische waren im Speisesaal nicht erlaubt.",
      holds: (scene) =>
        scene.locationOf(scene.holder("blowfish").id).id !== "dining-hall",
    },
  ],
  statements: [
    {
      by: "navy",
      text: "Schulleiter Applegreen war auf dem Deck.",
      holds: (scene) => scene.locationOf("applegreen").id === "deck",
    },
    {
      by: "mauve",
      text: "Admiral Navy hat das Steuerrad mitgebracht.",
      holds: (scene) => scene.weaponOf("navy").id === "wheel",
    },
    {
      by: "applegreen",
      text: "Das Steuerrad war in der Kapitänskajüte.",
      holds: (scene) =>
        scene.locationOf(scene.holder("wheel").id).id === "quarters",
    },
  ],
  exhibits: ["astrology"],
  solution: {
    navy: { weapon: "wheel", location: "dining-hall" },
    mauve: { weapon: "spear", location: "quarters" },
    applegreen: { weapon: "blowfish", location: "deck" },
  },
  murderer: "applegreen",
  hints: [
    {
      text: 'Inspektor Irratino studierte den Code genau und sagte: "Das ist ein typischer Code des Ermittlungsinstituts: Jedes Symbol steht für den Anfangsbuchstaben seiner Bedeutung."',
      book: true,
    },
    {
      text: 'Die Nachricht: ♉ ist laut Beweisstück B der Stier, \u{1F531} das Symbol des Fischspeers - "Der Stier hatte den Fischspeer." Stier ist nur Vizepräsidentin Mauve. (Im Buch ist die Nachricht mit den Symbolen aus Beweisstück B buchstabiert, nach den Anfangsbuchstaben ihrer englischen Namen: TAURUS HAD SPEAR.)',
      marks: [{ a: "mauve", b: "spear", value: "check" }],
    },
    {
      text: "Probiere aus, wer lügt. Lügt Mauve, hatte Admiral Navy den Kugelfisch und Applegreen das Steuerrad. Dann sagen beide anderen die Wahrheit: Applegreen war auf dem Deck, das Steuerrad aber in der Kapitänskajüte. Das geht nicht.",
      marks: [
        { a: "navy", b: "wheel", value: "check" },
        { a: "applegreen", b: "blowfish", value: "check" },
        { a: "applegreen", b: "deck", value: "check" },
      ],
    },
    {
      text: "Also sagt Mauve die Wahrheit: Admiral Navy hatte das Steuerrad, Schulleiter Applegreen den Kugelfisch.",
    },
    {
      text: "Lügt Admiral Navy, war Applegreen nicht auf dem Deck. Applegreen sagt dann die Wahrheit: Navy war mit dem Steuerrad in der Kajüte, Applegreen bliebe nur der Speisesaal - mit dem Kugelfisch, der dort nicht erlaubt war. Das geht nicht.",
      marks: [
        { a: "navy", b: "dining-hall", value: "check" },
        { a: "wheel", b: "dining-hall", value: "check" },
      ],
    },
    {
      text: "Also lügt Schulleiter Applegreen - er ist der Mörder. Navy sagt die Wahrheit: Applegreen war auf dem Deck. Das Steuerrad war nicht in der Kajüte, also war Navy im Speisesaal und Mauve in der Kapitänskajüte.",
      marks: [{ a: "mauve", b: "quarters", value: "check" }],
    },
    {
      text: "Schulleiter Applegreen tötete den Ersten Offizier mit dem giftigen Kugelfisch auf dem Deck.",
      marks: [
        { a: "blowfish", b: "deck", value: "check" },
        { a: "spear", b: "quarters", value: "check" },
      ],
    },
  ],
};
