/**
 * Case 25, "The Death of Justice": Dame Obsidian murdered in a luxurious jail.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Elementary). The jumbled message
 * reads "We all saw the lawyer indoors"; here it is jumbled again in German,
 * letter by letter within each word. One clue needs Exhibit A: the Detective
 * Code of the decoder ring; the card reads "The shortest suspect was relaxing
 * in the spa during the murder" and is encoded again in German. The photo of
 * the spa's card is blurred before "...DOORS"; it is heated and the case only
 * has a solution when it is indoors. The bold clue names the weapon; the murderer is whoever had it. The photographed pages print
 * neither hint nor solution; the solver found the only one, and the hints are
 * our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const THE_DEATH_OF_JUSTICE: Case = {
  id: "the-death-of-justice",
  number: 25,
  title: "Der Tod der Gerechtigkeit",
  story:
    "Kaum saß Dame Obsidian hinter Gittern, bekam Logico einen Anruf aus dem luxuriösen Gefängnis für Wirtschaftskriminelle, zu dem sie verurteilt worden war: Sie war selbst ermordet worden. War das Gerechtigkeit? War es Schicksal? Er wusste nur, dass es ein Rätsel war.",
  series: "volume1",
  difficulty: "elementary",
  suspects: [
    {
      id: "celadon",
      name: "Ministerin Celadon",
      icon: "\u{1FA96}",
      description:
        "Die Verteidigungsministerin - und persönlich verantwortlich für eine Reihe internationaler Zwischenfälle, von denen einige inzwischen nach ihr benannt sind.",
      heightCm: 168,
      hand: "left",
      eyes: "green",
      hair: "lightBrown",
    },
    {
      id: "aureolin",
      name: "Die unglaubliche Aureolin",
      icon: "\u{1FA84}",
      description:
        "Sie gibt Dame Obsidian die Schuld an ihrer Haft. Das ist verständlich, schließlich hat Dame Obsidian ihr die Sache angehängt.",
      heightCm: 168,
      hand: "left",
      eyes: "green",
      hair: "blond",
    },
    {
      id: "saffron",
      name: "Miss Saffron",
      icon: "\u{1F380}",
      description:
        "Auch Miss Saffron gibt Dame Obsidian die Schuld. Bei ihr weckt das allerdings etwas weniger Mitgefühl, denn sie war tatsächlich schuldig.",
      heightCm: 157,
      hand: "left",
      eyes: "hazel",
      hair: "blond",
    },
  ],
  locations: [
    {
      id: "spa",
      name: "das Spa",
      icon: "\u{1FAB7}",
      description:
        "Gebaut mit Geld vom GFV (Gefangenen-Feinkost-Verein), auch wenn die Heizung vom Steuerzahler bezahlt wird.",
      indoors: true,
    },
    {
      id: "parking-lot",
      name: "der Parkplatz",
      icon: "\u{1F17F}️",
      description:
        "Hier können Gefangene gegen Gebühr ihre Luxuswagen für die Dauer ihres Aufenthalts parken.",
      indoors: false,
    },
    {
      id: "suite",
      name: "eine Privatsuite",
      icon: "\u{1F6CF}️",
      description:
        "Wer genug Geld hat, kann sich eine Privatsuite gönnen, mit Großbildfernseher, Whirlpool und offener Bar.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "lawyer",
      name: "ein Anwalt für eine Viertelmillion Dollar",
      icon: "\u{1F468}‍\u{1F4BC}",
      description: "Die gefährlichste Waffe von allen. (Und die teuerste.)",
      weight: "heavy",
    },
    {
      id: "rope",
      name: "ein Seil aus Designerkleidung",
      icon: "\u{1F457}",
      description:
        "Für den Fall, dass man ein Seil braucht, aber nur Designerkleidung hat.",
      weight: "medium",
    },
    {
      id: "handcuffs",
      name: "ein Paar goldene Handschellen",
      icon: "\u{1F517}",
      description: "Damit treibt man die Metapher doch etwas zu weit, oder?",
      weight: "heavy",
    },
  ],
  clues: [
    {
      text: "Jemand steckte Logico einen Zettel zu, auf dem eine verwürfelte Nachricht stand: RWI LELA SHEAN DNE TANWAL NNIDERN.",
      holds: (scene) => scene.locationOf(scene.holder("lawyer").id).indoors,
    },
    {
      text: "Ministerin Celadon hatte ein Paar maßgefertigte goldene Handschellen.",
      holds: (scene) => scene.weaponOf("celadon").id === "handcuffs",
    },
    {
      text: "Der Detektivclub schickte Logico eine Karte im Detektivcode: WRV POVRMHGV KVIHLM VMGHKZMMGV HRXS DZVSIVMW WVH NLIWVH RN HKZ. (Siehe Beweisstück A.)",
      holds: (scene) => scene.locationOf("saffron").id === "spa",
    },
    {
      text: "Die unglaubliche Aureolin konnte sich die Privatsuite von ihrem Gehalt als Zauberin nicht leisten.",
      holds: (scene) => scene.locationOf("aureolin").id !== "suite",
    },
  ],
  body: {
    text: "Dame Obsidian wurde mit einem Seil aus Designerkleidung um den Hals gefunden.",
    weapon: "rope",
  },
  exhibits: ["detectiveKit"],
  solution: {
    celadon: { weapon: "handcuffs", location: "suite" },
    aureolin: { weapon: "rope", location: "parking-lot" },
    saffron: { weapon: "lawyer", location: "spa" },
  },
  murderer: "aureolin",
  hints: [
    {
      text: 'Deductive Logico bekam eine SMS, in der nur stand: "Hier bist du auf dich allein gestellt."',
      book: true,
    },
    {
      text: "Mit dem Decoderring (Beweisstück A) wird A zu Z, B zu Y und so weiter. Die Karte lautet: DIE KLEINSTE PERSON ENTSPANNTE SICH WAEHREND DES MORDES IM SPA. Die Kleinste ist Miss Saffron.",
    },
    {
      text: "Die unglaubliche Aureolin war nicht in der Privatsuite, also auf dem Parkplatz. Ministerin Celadon war in der Privatsuite.",
      marks: [
        { a: "aureolin", b: "parking-lot", value: "check" },
        { a: "celadon", b: "suite", value: "check" },
      ],
    },
    {
      text: 'Die Nachricht, Wort für Wort entwürfelt: "WIR ALLE SAHEN DEN ANWALT DRINNEN." Der Parkplatz ist draußen, also hatte Aureolin den Anwalt nicht. Celadon hatte die Handschellen - Miss Saffron hatte den Anwalt, Aureolin das Seil.',
      marks: [
        { a: "celadon", b: "handcuffs", value: "check" },
        { a: "aureolin", b: "rope", value: "check" },
        { a: "saffron", b: "lawyer", value: "check" },
      ],
    },
    {
      text: "Das Seil aus Designerkleidung lag um Dame Obsidians Hals: Die unglaubliche Aureolin erwürgte sie damit auf dem Parkplatz.",
      marks: [
        { a: "rope", b: "parking-lot", value: "check" },
        { a: "handcuffs", b: "suite", value: "check" },
        { a: "saffron", b: "spa", value: "check" },
        { a: "lawyer", b: "spa", value: "check" },
      ],
    },
  ],
};
