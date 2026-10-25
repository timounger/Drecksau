/**
 * Case 80, "The Cost of the Rent Is the Real Killer": the former tenant of
 * Logico's Hollywood apartment.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Impossible), from photos of the
 * book. Motives and statements, no body clue - the liar is the murderer. The
 * scrambled message reads "Executive Producer Steel had a golden bird"; here
 * it is scrambled again in German, letter by letter within each word. The
 * hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const THE_COST_OF_THE_RENT_IS_THE_REAL_KILLER: Case = {
  id: "the-cost-of-the-rent-is-the-real-killer",
  number: 80,
  title: "Die Miete ist der wahre Mörder",
  story:
    "Als klar war, dass Logico eine Weile in Tinseltown bleiben würde, nahm er sich eine Wohnung in einem schicken Hollywood-Apartmenthaus. Schnell erfuhr er, dass er sie nur so günstig bekommen hatte, weil der Vormieter ermordet worden war.",
  series: "volume1",
  difficulty: "impossible",
  suspects: [
    {
      id: "uncle",
      name: "Onkel Midnight",
      icon: "\u{1F973}",
      description:
        "Als sein Vater starb, kaufte er sich eine Wüstenvilla mit Pool und setzte sich zur Ruhe. Er war siebzehn.",
      heightCm: 173,
      hand: "left",
      eyes: "blue",
      hair: "darkBrown",
      sign: "sagittarius",
    },
    {
      id: "charcoal",
      name: "Boss Charcoal",
      icon: "\u{1F9D4}",
      description:
        "Ein Mafiaboss aus der guten alten Zeit, als ein Mafiaboss aus der guten alten Zeit noch etwas bedeutete.",
      heightCm: 180,
      hand: "right",
      eyes: "darkBrown",
      hair: "black",
      sign: "taurus",
    },
    {
      id: "crimson",
      name: "Dr. Crimson",
      icon: "\u{1FA7A}",
      description:
        "Nach eigener Aussage die klügste Ärztin, die sie je getroffen hat - und wahrscheinlich hat sie recht. Ja, sie raucht, aber wenn sie Krebs bekommt, findet sie eben ein Heilmittel.",
      heightCm: 175,
      hand: "left",
      eyes: "green",
      hair: "red",
      sign: "aquarius",
    },
    {
      id: "steel",
      name: "Chefproduzentin Steel",
      icon: "\u{1F4BC}",
      description:
        "Die reichste, klügste und gemeinste Produzentin Hollywoods. Vorerst.",
      heightCm: 168,
      hand: "right",
      eyes: "gray",
      hair: "white",
      sign: "aries",
    },
  ],
  locations: [
    {
      id: "gardens",
      name: "die Dachgärten",
      icon: "\u{1F33A}",
      description:
        "Wunderschöne Dachgärten, gepflegt von Gärtnern, die sich hier nie eine Wohnung leisten könnten.",
      indoors: false,
    },
    {
      id: "boiler",
      name: "der Heizungskeller",
      icon: "\u{1F525}",
      description:
        "Schon viele berühmte Stars fanden die unheilvolle Stimmung hier unheimlich.",
      indoors: true,
    },
    {
      id: "tiniest",
      name: "das winzigste Zimmer",
      icon: "\u{1F6AA}",
      description:
        "Früher eine Abstellkammer. Heute kostet es jeden Monat mehr, als dein Vater in seinem ganzen Leben gesehen hat.",
      indoors: true,
    },
    {
      id: "penthouse",
      name: "das Penthouse",
      icon: "\u{1F3D9}️",
      description:
        "Das oberste Stockwerk, wenn man die Dachgärten nicht mitzählt - und die Penthouse-Besitzer tun das nicht.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "scarf",
      name: "ein Würgeschal",
      icon: "\u{1F9E3}",
      description:
        "Im sonnigen Hollywood ist Würgen das Einzige, wofür man einen Schal braucht.",
      weight: "light",
      material: "Baumwolle",
    },
    {
      id: "typewriter",
      name: "eine antike Schreibmaschine",
      icon: "⌨️",
      description: "Aus den 1950ern - in Hollywood ist das die späte Klassik.",
      weight: "heavy",
      material: "Metall",
    },
    {
      id: "bird",
      name: "ein goldener Vogel",
      icon: "\u{1F9A9}",
      description: "Diese Flamingostatue ist ein Vermögen wert.",
      weight: "heavy",
      material: "Gold",
    },
    {
      id: "detector",
      name: "ein Geisterdetektor",
      icon: "\u{1F4DF}",
      description:
        "Geister findet er nicht besonders gut, aber Leute grillen kann er ziemlich gut.",
      weight: "medium",
      material: "Metall und Technik",
    },
  ],
  motives: [
    { id: "could", name: "sehen, ob man es kann", icon: "\u{1F441}️" },
    { id: "practice", name: "zur Übung", icon: "\u{1F3AF}" },
    { id: "cult", name: "einer Sekte beitreten", icon: "\u{1F3DB}️" },
    { id: "jealousy", name: "aus Eifersucht", icon: "\u{1FAAC}" },
  ],
  clues: [
    {
      text: "Wer eine antike Schreibmaschine hatte, wollte sehen, ob er töten kann.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("typewriter").id)?.id === "could",
    },
    {
      text: "Eine verwürfelte Nachricht war an die Toilettenwand gekritzelt: FEDTOUPINNZECHR STLEE TEATH EIENN EONNGEDL VOEGL.",
      holds: (scene) => scene.weaponOf("steel").id === "bird",
    },
    {
      text: "Wer aus Eifersucht töten würde, war Linkshänder.",
      holds: (scene) => scene.driven("jealousy").hand === "left",
    },
    {
      text: "Von einem Arztgehalt konnte sich Dr. Crimson nur das winzigste Zimmer leisten - und dort war sie.",
      holds: (scene) => scene.locationOf("crimson").id === "tiniest",
    },
    {
      text: "Wer zur Übung töten wollte, war nicht im Heizungskeller.",
      holds: (scene) =>
        scene.locationOf(scene.driven("practice").id).id !== "boiler",
    },
    {
      text: "Die Spurensicherung fand im Penthouse Spuren einer Waffe aus Baumwolle.",
      holds: (scene) =>
        scene.locationOf(scene.holder("scarf").id).id === "penthouse",
    },
    {
      text: "Ein Zeuge sah Boss Charcoal die Blumen im wunderschönen Garten genießen.",
      holds: (scene) => scene.locationOf("charcoal").id === "gardens",
    },
  ],
  statements: [
    {
      by: "uncle",
      text: "Na hör mal, ich würde höchstens zur Übung töten.",
      holds: (scene) => scene.motiveOf("uncle")?.id === "practice",
    },
    {
      by: "charcoal",
      text: "Chefproduzentin Steel hatte keine antike Schreibmaschine dabei.",
      holds: (scene) => scene.weaponOf("steel").id !== "typewriter",
    },
    {
      by: "crimson",
      text: "Eine antike Schreibmaschine war nicht im winzigsten Zimmer.",
      holds: (scene) =>
        scene.locationOf(scene.holder("typewriter").id).id !== "tiniest",
    },
    {
      by: "steel",
      text: "Boss Charcoal war nicht im winzigsten Zimmer.",
      holds: (scene) => scene.locationOf("charcoal").id !== "tiniest",
    },
  ],
  solution: {
    uncle: { weapon: "scarf", location: "penthouse", motive: "jealousy" },
    charcoal: { weapon: "typewriter", location: "gardens", motive: "could" },
    crimson: { weapon: "detector", location: "tiniest", motive: "practice" },
    steel: { weapon: "bird", location: "boiler", motive: "cult" },
  },
  murderer: "uncle",
  hints: [
    {
      text: 'Irratino beantwortete Logicos Sprachnachricht innerhalb von Sekunden. "Nach den Zahlen, die ich durchgerechnet habe, war die Person, die einer Sekte beitreten wollte, im Heizungskeller."',
      book: true,
      marks: [{ a: "boiler", b: "cult", value: "check" }],
    },
    {
      text: 'Die Nachricht, Wort für Wort entwürfelt: "CHEFPRODUZENTIN STEEL HATTE EINEN GOLDENEN VOGEL". Crimson ist im winzigsten Zimmer, Charcoal in den Dachgärten.',
      marks: [
        { a: "steel", b: "bird", value: "check" },
        { a: "charcoal", b: "gardens", value: "check" },
        { a: "crimson", b: "tiniest", value: "check" },
      ],
    },
    {
      text: "Der Schal lag im Penthouse - Steel hat den Vogel, also ist sie im Heizungskeller und Onkel Midnight mit dem Schal im Penthouse. Damit sagen Charcoal und Steel die Wahrheit.",
      marks: [
        { a: "uncle", b: "penthouse", value: "check" },
        { a: "steel", b: "boiler", value: "check" },
        { a: "bird", b: "boiler", value: "check" },
      ],
    },
    {
      text: "Probiere aus, wer lügt. Lügt Dr. Crimson, hat sie die Schreibmaschine und will sehen, ob sie es kann, und der Onkel will laut seiner Aussage üben. Dann bliebe für die Eifersucht kein Linkshänder. Geht nicht.",
    },
    {
      text: "Also lügt Onkel Midnight: Charcoal hat die Schreibmaschine und will sehen, ob er es kann; Crimson hat den Geisterdetektor. Zur Übung will weder Steel (Heizungskeller) noch der Onkel - also Crimson. Eifersüchtig ist ein Linkshänder: der Onkel. Steel will einer Sekte beitreten.",
      marks: [
        { a: "charcoal", b: "typewriter", value: "check" },
        { a: "crimson", b: "detector", value: "check" },
        { a: "crimson", b: "practice", value: "check" },
        { a: "steel", b: "cult", value: "check" },
      ],
    },
    {
      text: "Onkel Midnight war es mit dem Würgeschal im Penthouse, aus Eifersucht.",
      marks: [
        { a: "uncle", b: "scarf", value: "check" },
        { a: "uncle", b: "jealousy", value: "check" },
        { a: "scarf", b: "penthouse", value: "check" },
        { a: "scarf", b: "jealousy", value: "check" },
        { a: "penthouse", b: "jealousy", value: "check" },
        { a: "charcoal", b: "could", value: "check" },
        { a: "typewriter", b: "gardens", value: "check" },
        { a: "typewriter", b: "could", value: "check" },
        { a: "gardens", b: "could", value: "check" },
        { a: "detector", b: "tiniest", value: "check" },
        { a: "detector", b: "practice", value: "check" },
        { a: "tiniest", b: "practice", value: "check" },
        { a: "bird", b: "cult", value: "check" },
      ],
    },
  ],
};
