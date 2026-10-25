/**
 * Case 27, "A Mysterious Murder in the Mysterious Woods": a hitchhiker
 * killed in the woods.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Occult Medium). The murderer lies,
 * everyone else tells the truth; there is no body clue - the liar is the
 * murderer. The photographed pages print neither hint nor solution; the
 * solver found the only one, and the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const A_MYSTERIOUS_MURDER_IN_THE_MYSTERIOUS_WOODS: Case = {
  id: "a-mysterious-murder-in-the-mysterious-woods",
  number: 27,
  title: "Ein mysteriöser Mord im mysteriösen Wald",
  story:
    "Die Fahrt durch den mysteriösen Wald jagte Deductive Logico Schauer über den Rücken - aber vielleicht lag das auch an der voll aufgedrehten Klimaanlage. Bald musste er anhalten: zum Teil, um den Mord an einem Anhalter aufzuklären, und zum Teil, weil sein Auto den Geist aufgab.",
  series: "volume1",
  difficulty: "occult",
  suspects: [
    {
      id: "raspberry",
      name: "Trainer Raspberry",
      icon: "\u{1F3C8}",
      description:
        "Einer der besten Trainer diesseits des Mississippi, egal auf welcher Seite man gerade steht.",
      heightCm: 183,
      hand: "left",
      eyes: "blue",
      hair: "blond",
      sign: "aries",
    },
    {
      id: "copper",
      name: "Polizistin Copper",
      icon: "\u{1F46E}‍♀️",
      description:
        "Das Beste daran, als Polizistin kriminell zu sein: Man spart sich den Mittelsmann und ermittelt gleich selbst nicht gegen die eigenen Verbrechen.",
      heightCm: 165,
      hand: "right",
      eyes: "blue",
      hair: "blond",
      sign: "aries",
    },
    {
      id: "rose",
      name: "Großmeister Rose",
      icon: "♟️",
      description:
        "Ein Schachgroßmeister, der immer schon seinen nächsten Zug plant. Zum Beispiel, wie er seinen nächsten Gegner um die Ecke bringt! (1. ... e5)",
      heightCm: 170,
      hand: "left",
      eyes: "darkBrown",
      hair: "darkBrown",
      sign: "scorpio",
    },
  ],
  locations: [
    {
      id: "skull-rock",
      name: "der Totenkopffelsen",
      icon: "\u{1F480}",
      description:
        "Ein Felsen, der aussieht wie ein Totenschädel. Ist das Natur, oder hat ihn jemand behauen?",
      indoors: false,
    },
    {
      id: "ruins",
      name: "die uralten Ruinen",
      icon: "\u{1F3DB}️",
      description:
        "Wo immer diese Steine auftauchen, weiß man: Ganz in der Nähe wird gerade jemand ermordet.",
      indoors: false,
    },
    {
      id: "road",
      name: "die einzige Straße",
      icon: "\u{1F6E3}️",
      description:
        "Eine kurvige, gewundene, halb asphaltierte Straße durch den Wald.",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "shovel",
      name: "eine Schaufel",
      icon: "\u{1FA8F}",
      description:
        "Ein Mehrzweckwerkzeug: Mit derselben Schaufel kann man jemanden töten und begraben!",
      weight: "medium",
    },
    {
      id: "dagger",
      name: "ein Ritualdolch",
      icon: "\u{1F5E1}️",
      description:
        "Er besteht aus einem uralten Metall, das Logico nicht bestimmen kann.",
      weight: "medium",
    },
    {
      id: "spider",
      name: "eine Giftspinne",
      icon: "\u{1F577}️",
      description:
        "Ihr ungewöhnliches Netz verrät, dass sie nicht aus diesem Wald stammt.",
      weight: "light",
    },
  ],
  clues: [
    {
      text: "Logico erhaschte einen Blick auf den Verdächtigen mit der Schaufel, sah aber nur, dass seine Augen nicht blau waren.",
      holds: (scene) => scene.holder("shovel").eyes !== "blue",
    },
    {
      text: "Eine Giftspinne war nicht auf der einzigen Straße.",
      holds: (scene) =>
        scene.locationOf(scene.holder("spider").id).id !== "road",
    },
  ],
  statements: [
    {
      by: "rose",
      text: "Man muss die Züge der Figuren studieren. Zum Beispiel war Polizistin Copper am Totenkopffelsen!",
      holds: (scene) => scene.locationOf("copper").id === "skull-rock",
    },
    {
      by: "raspberry",
      text: "Na, ich will verdammt sein: Eine Schaufel war bei den uralten Ruinen.",
      holds: (scene) =>
        scene.locationOf(scene.holder("shovel").id).id === "ruins",
    },
    {
      by: "copper",
      text: "Meine Aussage? Ich habe eine Giftspinne mitgebracht.",
      holds: (scene) => scene.weaponOf("copper").id === "spider",
    },
  ],
  exhibits: ["astrology"],
  solution: {
    raspberry: { weapon: "dagger", location: "ruins" },
    copper: { weapon: "spider", location: "skull-rock" },
    rose: { weapon: "shovel", location: "road" },
  },
  murderer: "raspberry",
  hints: [
    {
      text: 'In eine Eiche (die schon tot war) hatte jemand eine Nachricht geschnitzt: "Großmeister auf Straße!"',
      book: true,
      marks: [{ a: "rose", b: "road", value: "check" }],
    },
    {
      text: "Nicht blaue Augen hat nur Großmeister Rose (dunkelbraun): Er hatte die Schaufel. Dolch und Spinne teilen sich Raspberry und Copper.",
      marks: [{ a: "rose", b: "shovel", value: "check" }],
    },
    {
      text: "Probiere aus, wer lügt. Lügt Großmeister Rose, sagen die anderen die Wahrheit: Rose war bei den Ruinen, und Copper hatte die Giftspinne. Copper war nicht am Totenkopffelsen und nicht bei den Ruinen, also auf der Straße - mit der Spinne. Die war aber nicht auf der Straße. Das geht nicht.",
      marks: [
        { a: "copper", b: "spider", value: "check" },
        { a: "copper", b: "skull-rock", value: "check" },
      ],
    },
    {
      text: "Lügt Polizistin Copper, hatte Trainer Raspberry die Spinne. Rose sagt die Wahrheit: Copper war am Totenkopffelsen. Raspberry sagt die Wahrheit: Rose war bei den Ruinen. Für Raspberry und die Spinne bliebe nur die Straße. Auch das geht nicht.",
      marks: [{ a: "raspberry", b: "ruins", value: "check" }],
    },
    {
      text: "Also lügt Trainer Raspberry: Rose war nicht bei den Ruinen. Copper hatte die Spinne und war am Totenkopffelsen, Rose mit der Schaufel auf der Straße. Raspberry ist der Mörder - mit dem Ritualdolch bei den uralten Ruinen.",
      marks: [
        { a: "shovel", b: "road", value: "check" },
        { a: "raspberry", b: "dagger", value: "check" },
        { a: "dagger", b: "ruins", value: "check" },
        { a: "spider", b: "skull-rock", value: "check" },
      ],
    },
  ],
};
