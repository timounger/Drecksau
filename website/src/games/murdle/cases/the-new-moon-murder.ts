/**
 * Case 31, "The New Moon Murder": a witch murdered at a witches' sabbath.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Occult Medium). The murderer lies,
 * everyone else tells the truth; there is no body clue - the liar is the
 * murderer. "Beneath an owl" means the thick forest (its card mentions the
 * owl); the Virgo comes from Exhibit B. The photographed pages print neither
 * hint nor solution; the solver found the only one, and the hints are our
 * own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const THE_NEW_MOON_MURDER: Case = {
  id: "the-new-moon-murder",
  number: 31,
  title: "Mord bei Neumond",
  story:
    "Für seinen ersten Fall schickte das Ermittlungsinstitut Deductive Logico in den finstersten Wald, den er je nicht gesehen hatte. Aus dem Schatten beobachtete er einen Hexensabbat und glaubte sich völlig verborgen. Umso verblüffter war er, als drei Hexen die Zeremonie unterbrachen, zu ihm herüberkamen und ihn baten, den Mord an ihrer Schwesterhexe aufzuklären.",
  series: "volume1",
  difficulty: "occult",
  suspects: [
    {
      id: "violet",
      name: "Lady Violet",
      icon: "\u{1F478}",
      description:
        "Die Erbin der Veilcheninseln, des größten rechtsfreien Gebiets der Welt.",
      heightCm: 152,
      hand: "right",
      eyes: "blue",
      hair: "blond",
      sign: "virgo",
    },
    {
      id: "mauve",
      name: "Vizepräsidentin Mauve",
      icon: "\u{1F97D}",
      description:
        "Eine Vizepräsidentin von TekCo Futures. Wenn sie dich bittet, ihr Metaversum zu betreten: Lauf!",
      heightCm: 173,
      hand: "right",
      eyes: "darkBrown",
      hair: "black",
      sign: "taurus",
    },
    {
      id: "vermillion",
      name: "Die Herzogin von Vermillion",
      icon: "\u{1F475}",
      description:
        "Eine große alte Frau mit großen alten Geheimnissen. Wenn sie die Mörderin ist, wäre es sicher nicht das erste Mal.",
      heightCm: 175,
      hand: "left",
      eyes: "gray",
      hair: "white",
      sign: "pisces",
    },
  ],
  locations: [
    {
      id: "fire",
      name: "das zentrale Feuer",
      icon: "\u{1F525}",
      description:
        "Fischers Fritz fischt frische Feuerfische. Sag das dreimal schnell.",
      indoors: false,
    },
    {
      id: "ruins",
      name: "die uralten Ruinen",
      icon: "\u{1F3DB}️",
      description:
        "Mit Moos bedeckt, aber noch immer erkennbar dieselben Ruinen.",
      indoors: false,
    },
    {
      id: "forest",
      name: "der dichte Wald",
      icon: "\u{1F332}",
      description:
        "Der Wald ist lieblich, dunkel und tief - eine Eule findet ihn einfach nur eulig.",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "cauldron",
      name: "ein Kessel",
      icon: "\u{1FAD5}",
      description:
        "Wer ihn hochheben kann, kann jemanden damit erschlagen. Oder man gibt ihm einfach einen Schluck.",
      weight: "heavy",
    },
    {
      id: "log",
      name: "ein Holzscheit",
      icon: "\u{1FAB5}",
      description:
        "Ein großes, schweres Eichenscheit. Jemand hat den Baum getötet, damit der Baum jemanden töten kann.",
      weight: "heavy",
    },
    {
      id: "broom",
      name: "ein Besen",
      icon: "\u{1F9F9}",
      description:
        "Man sagt, Hexen fliegen darauf, aber Logico hat damit bisher nur gefegt.",
      weight: "medium",
    },
  ],
  clues: [
    {
      text: "Eine Jungfrau stand unter einer Eule und organisierte wahrscheinlich gerade etwas - so sind die eben.",
      holds: (scene) => scene.at("forest").sign === "virgo",
    },
    {
      text: "Überraschenderweise war ein Kessel nicht im zentralen Feuer.",
      holds: (scene) =>
        scene.locationOf(scene.holder("cauldron").id).id !== "fire",
    },
  ],
  statements: [
    {
      by: "violet",
      text: "Glaubt nicht dem gemeinen Volk: Die Herzogin von Vermillion hat einen Besen mitgebracht.",
      holds: (scene) => scene.weaponOf("vermillion").id === "broom",
    },
    {
      by: "mauve",
      text: "Also, ich habe keinen Besen mitgebracht.",
      holds: (scene) => scene.weaponOf("mauve").id !== "broom",
    },
    {
      by: "vermillion",
      text: "Und ich habe kein Holzscheit mitgebracht.",
      holds: (scene) => scene.weaponOf("vermillion").id !== "log",
    },
  ],
  exhibits: ["astrology"],
  solution: {
    violet: { weapon: "broom", location: "forest" },
    mauve: { weapon: "log", location: "fire" },
    vermillion: { weapon: "cauldron", location: "ruins" },
  },
  murderer: "violet",
  hints: [
    {
      text: 'Deductive Logico funkte Inspektor Irratino an und bat ihn um Hilfe. "Ah, davon habe ich gerade geträumt!", sagte Irratino. "Mauve hatte ein Holzscheit!"',
      book: true,
      marks: [{ a: "mauve", b: "log", value: "check" }],
    },
    {
      text: "Die Eule wohnt im dichten Wald. Jungfrau ist nur Lady Violet - sie war dort.",
    },
    {
      text: "Probiere aus, wer lügt. Lügt Vizepräsidentin Mauve, hatte sie den Besen. Lady Violet sagt dann die Wahrheit: Die Herzogin hatte den Besen. Es gibt aber nur einen. Das geht nicht.",
      marks: [{ a: "violet", b: "broom", value: "check" }],
    },
    {
      text: "Lügt die Herzogin von Vermillion, hatte sie das Holzscheit. Laut Violet hatte sie aber den Besen. Auch das geht nicht.",
    },
    {
      text: "Also lügt Lady Violet: Die Herzogin hatte keinen Besen, Mauve auch nicht - Violet hatte ihn. Die Herzogin hatte kein Scheit, also den Kessel, und Mauve das Holzscheit.",
      marks: [{ a: "vermillion", b: "cauldron", value: "check" }],
    },
    {
      text: "Der Kessel war nicht im Feuer: Die Herzogin war bei den Ruinen, Mauve am Feuer. Lady Violet ist die Mörderin - mit dem Besen im dichten Wald.",
      marks: [
        { a: "mauve", b: "fire", value: "check" },
        { a: "vermillion", b: "ruins", value: "check" },
        { a: "cauldron", b: "ruins", value: "check" },
        { a: "violet", b: "forest", value: "check" },
        { a: "broom", b: "forest", value: "check" },
        { a: "log", b: "fire", value: "check" },
      ],
    },
  ],
};
