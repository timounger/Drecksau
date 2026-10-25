/**
 * Case 30, "The Case of the Definitely Dead President": the president
 * murdered in his office.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Occult Medium). The murderer lies,
 * everyone else tells the truth; there is no body clue - the liar is the
 * murderer. One clue needs Exhibit B: September 7 falls under Virgo. The
 * "marot cards" (murder plus tarot) are "Mortarot-Karten" here. The
 * photographed pages print neither hint nor solution; the solver found the
 * only one, and the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const THE_CASE_OF_THE_DEFINITELY_DEAD_PRESIDENT: Case = {
  id: "the-case-of-the-definitely-dead-president",
  number: 30,
  title: "Der Fall des definitiv toten Präsidenten",
  story:
    'Deductive Logico ging ins Büro des Präsidenten und sagte: "Ich habe einen Termin beim Präsidenten." Leider bekam er zur Antwort: "Der Präsident ist tot." Aber niemand hatte den Raum verlassen. Statt sich mit dem Präsidenten zu treffen, machte er sich also daran, seinen Mord aufzuklären.',
  series: "volume1",
  difficulty: "occult",
  suspects: [
    {
      id: "night",
      name: "Numerolog:in Night",
      icon: "\u{1F576}️",
      description:
        "Ein mathematisches und esoterisches Wunderkind. Night kennt nicht nur den Wert von Z, sondern auch die Bedeutung von Z.",
      heightCm: 175,
      hand: "left",
      eyes: "blue",
      hair: "darkBrown",
      sign: "pisces",
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
  ],
  locations: [
    {
      id: "book-ladder",
      name: "die Bücherleiter",
      icon: "\u{1FA9C}",
      description:
        'Hinaufklettern und ein Buch holen - oder einfach "Juhu!" rufend durch den Raum rollen.',
      indoors: true,
    },
    {
      id: "couch",
      name: "das Sofa",
      icon: "\u{1F6CB}️",
      description:
        "Ein Kunstledersofa, perfekt für ein Nickerchen mitten am Tag.",
      indoors: true,
    },
    {
      id: "desk",
      name: "der Schreibtisch",
      icon: "\u{1F5A5}️",
      description:
        "Bedeckt mit jeder Menge wichtiger Unterlagen und einem Computer aus den Achtzigern.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "watch",
      name: "eine hypnotische Taschenuhr",
      icon: "⏱️",
      description:
        "Wenn man tief in diese Uhr blickt, kann man die Uhrzeit ablesen.",
      weight: "light",
    },
    {
      id: "cards",
      name: "ein Satz Mortarot-Karten",
      icon: "\u{1F3B4}",
      description:
        "Mit diesen Tarotkarten im Mordstil kann man sich die Zukunft vorhersagen lassen.",
      weight: "light",
    },
    {
      id: "apparatus",
      name: "ein pseudowissenschaftlicher Apparat",
      icon: "⚛️",
      description:
        "Er misst quantonische Ströme, um deine inneren Blaxonen zu bestimmen.",
      weight: "heavy",
    },
  ],
  clues: [
    {
      text: "Die Person mit dem pseudowissenschaftlichen Apparat hat am 7. September Geburtstag. (Siehe Beweisstück B.)",
      holds: (scene) => scene.holder("apparatus").sign === "virgo",
    },
    {
      text: "Eine gründliche Suche förderte eine Wahrsagekarte zutage, die zwischen zwei Sitzkissen aus Kunstleder klemmte.",
      holds: (scene) =>
        scene.locationOf(scene.holder("cards").id).id === "couch",
    },
  ],
  statements: [
    {
      by: "night",
      text: "Hochalchemist Raven war hinter dem Schreibtisch des Präsidenten.",
      holds: (scene) => scene.locationOf("raven").id === "desk",
    },
    {
      by: "onyx",
      text: "Numerolog:in Night war auf der Bücherleiter.",
      holds: (scene) => scene.locationOf("night").id === "book-ladder",
    },
    {
      by: "raven",
      text: "Alchemistisch gesprochen: Ein pseudowissenschaftlicher Apparat war auf der Bücherleiter.",
      holds: (scene) =>
        scene.locationOf(scene.holder("apparatus").id).id === "book-ladder",
    },
  ],
  exhibits: ["astrology"],
  solution: {
    night: { weapon: "cards", location: "couch" },
    onyx: { weapon: "apparatus", location: "book-ladder" },
    raven: { weapon: "watch", location: "desk" },
  },
  murderer: "onyx",
  hints: [
    {
      text: 'Deductive Logico fand einen Zettel in seiner Tasche, auf dem stand: "Traue Hochalchemist Raven!"',
      book: true,
    },
    {
      text: "Der 7. September fällt laut Beweisstück B in die Jungfrau (23. August - 22. September). Jungfrau ist nur Kräuterkundige Onyx: Sie hatte den Apparat.",
      marks: [{ a: "onyx", b: "apparatus", value: "check" }],
    },
    {
      text: "Onyx sagt, Night war auf der Bücherleiter; Raven sagt, der Apparat - also Onyx - war dort. Beides kann nicht stimmen, also lügt Onyx oder Raven. Numerolog:in Night sagt die Wahrheit: Raven war am Schreibtisch.",
      marks: [
        { a: "onyx", b: "book-ladder", value: "check" },
        { a: "apparatus", b: "book-ladder", value: "check" },
        { a: "raven", b: "desk", value: "check" },
      ],
    },
    {
      text: "Lügt Hochalchemist Raven, sagt Onyx die Wahrheit: Night war auf der Leiter, Onyx also auf dem Sofa. Im Sofa klemmte aber die Karte, und Onyx hat den Apparat, nicht die Karten. Das geht nicht.",
      marks: [{ a: "night", b: "couch", value: "check" }],
    },
    {
      text: "Also lügt Kräuterkundige Onyx: Sie war mit dem Apparat auf der Bücherleiter. Night war mit den Mortarot-Karten auf dem Sofa, Raven mit der Taschenuhr am Schreibtisch. Onyx ist die Mörderin.",
      marks: [
        { a: "night", b: "cards", value: "check" },
        { a: "raven", b: "watch", value: "check" },
        { a: "watch", b: "desk", value: "check" },
        { a: "cards", b: "couch", value: "check" },
      ],
    },
  ],
};
