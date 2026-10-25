/**
 * Case 84, "The Tour of Death": the tour guide of the Midnight Movie Studios
 * tour.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Impossible), from photos of the
 * book. Motives and statements, no body clue - the liar is the murderer. The
 * scrambled note reads "Whoever had a flag was definitely right-handed"; here
 * it is scrambled again in German, letter by letter within each word. The
 * monument to the studio's founder is the statue of Midnight I. The hints are
 * our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const THE_TOUR_OF_DEATH: Case = {
  id: "the-tour-of-death",
  number: 84,
  title: "Die Todestour",
  story:
    "Als Logico einen Parkplatz gefunden hatte, merkte er, dass er Stunden zu früh war, also machte er die Studiotour, um die Zeit totzuschlagen. Leider wurde nicht nur die Zeit totgeschlagen: Der Tourguide war ermordet worden. Und Logico ermittelte.",
  series: "volume1",
  difficulty: "impossible",
  suspects: [
    {
      id: "smoky",
      name: "Superfan Smoky",
      icon: "\u{1F913}",
      description:
        "Er kennt die Drehorte jedes Midnight-Krimis, aber nicht, wie man Freunde findet.",
      heightCm: 178,
      hand: "left",
      eyes: "black",
      hair: "darkBrown",
      sign: "virgo",
    },
    {
      id: "lapis",
      name: "Schwester Lapis",
      icon: "\u{1F9D5}",
      description:
        "Eine Nonne, die die Welt bereist und Gottes Werk auf Seine Kosten verrichtet. Ihr Habit ist aus Kaschmir, und ihre Gewohnheit ist das Geldausgeben.",
      heightCm: 157,
      hand: "right",
      eyes: "lightBrown",
      hair: "lightBrown",
      sign: "cancer",
    },
    {
      id: "copper",
      name: "Polizistin Copper",
      icon: "\u{1F46E}‍♀️",
      description:
        "Als Wachfrau im Studio ist sie streng genommen keine Polizistin, aber anschreien darf sie die Leute trotzdem.",
      heightCm: 165,
      hand: "right",
      eyes: "blue",
      hair: "blond",
      sign: "aries",
    },
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
  ],
  locations: [
    {
      id: "grill",
      name: "die Wasserturm-Bar & Grill",
      icon: "\u{1F354}",
      description:
        "Ein Themenrestaurant, das Getränke in Gläsern in Form des Wasserturms serviert.",
      indoors: true,
    },
    {
      id: "statue",
      name: "die Statue von Midnight I",
      icon: "\u{1F5FD}",
      description:
        "Ein Denkmal für den Gründer von Midnight Movies, den großen Midnight I.",
      indoors: false,
    },
    {
      id: "backlot",
      name: "die Stadtkulisse",
      icon: "\u{1F3D9}️",
      description:
        "Hier werden Stadtszenen unter freiem Himmel gedreht. Sauberer als jede echte Stadt es je war.",
      indoors: false,
    },
    {
      id: "checkin",
      name: "der Check-in-Stand der Studiotour",
      icon: "\u{1F3AB}",
      description: "Hier melden sich die Touristen zur Studiotour an.",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "extinguisher",
      name: "ein Feuerlöscher",
      icon: "\u{1F9EF}",
      description:
        "Damit kann man ein Feuer löschen - oder jemandem das Licht ausknipsen.",
      weight: "heavy",
      material: "Metall und Chemikalien",
    },
    {
      id: "flag",
      name: "eine Fahne",
      icon: "\u{1F3F4}",
      description:
        "Fahnen können auf viele Arten gefährlich sein. Zum Beispiel beim Erdrosseln.",
      weight: "light",
      material: "Polyester",
    },
    {
      id: "cart",
      name: "ein Golfwagen",
      icon: "\u{1F6FA}",
      description:
        "Um auf einem Studiogelände herumzukommen oder jemanden zu überfahren.",
      weight: "heavy",
      material: "Metall, Plastik und Gummi",
    },
    {
      id: "fake",
      name: "ein falscher Filmpreis",
      icon: "\u{1F3C6}",
      description:
        "Warum bringt man einen falschen mit, wenn überall echte herumstehen?",
      weight: "medium",
      material: "Metall",
    },
  ],
  motives: [
    {
      id: "contract",
      name: "den eigenen Vertrag neu verhandeln",
      icon: "\u{1F91D}",
    },
    { id: "industry", name: "in die Branche einsteigen", icon: "\u{1F513}" },
    { id: "affair", name: "eine Affäre vertuschen", icon: "\u{1F491}" },
    { id: "celebrity", name: "einen Promi treffen", icon: "\u{1F929}" },
  ],
  clues: [
    {
      text: "Schwester Lapis wollte schon immer einen Promi treffen.",
      holds: (scene) => scene.motiveOf("lapis")?.id === "celebrity",
    },
    {
      text: "Wer einen Golfwagen fuhr, wollte nicht in die Branche einsteigen.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("cart").id)?.id !== "industry",
    },
    {
      text: "Polizistin Copper wollte verzweifelt eine Affäre vertuschen.",
      holds: (scene) => scene.motiveOf("copper")?.id === "affair",
    },
    {
      text: "Ein falscher Filmpreis lehnte an einem Denkmal für den Gründer des Studios.",
      holds: (scene) =>
        scene.locationOf(scene.holder("fake").id).id === "statue",
    },
    {
      text: "Wer den eigenen Vertrag neu verhandeln wollte, war am Check-in-Stand der Studiotour.",
      holds: (scene) =>
        scene.locationOf(scene.driven("contract").id).id === "checkin",
    },
    {
      text: "Eine der unterbezahlten Produktionsassistentinnen gab Logico einen verwürfelten Zettel: WRE IED AENHF ETHTA AWR IETDIEGNU NSEECDHGHIRTA.",
      holds: (scene) => scene.holder("flag").hand === "right",
    },
    {
      text: "Herangezoomte Überwachungsaufnahmen zeigten: Wer in der Stadtkulisse war, hatte schwarze Augen.",
      holds: (scene) => scene.at("backlot").eyes === "black",
    },
  ],
  statements: [
    {
      by: "smoky",
      text: "Oh, wow! Polizistin Copper hatte einen falschen Filmpreis dabei.",
      holds: (scene) => scene.weaponOf("copper").id === "fake",
    },
    {
      by: "lapis",
      text: "Eine Jungfrau hatte keinen falschen Filmpreis dabei.",
      holds: (scene) => scene.holder("fake").sign !== "virgo",
    },
    {
      by: "copper",
      text: "Ich war nicht am Check-in-Stand der Studiotour.",
      holds: (scene) => scene.locationOf("copper").id !== "checkin",
    },
    {
      by: "raspberry",
      text: "Ich hatte keinen falschen Filmpreis dabei.",
      holds: (scene) => scene.weaponOf("raspberry").id !== "fake",
    },
  ],
  exhibits: ["astrology"],
  solution: {
    smoky: { weapon: "extinguisher", location: "backlot", motive: "industry" },
    lapis: { weapon: "fake", location: "statue", motive: "celebrity" },
    copper: { weapon: "flag", location: "grill", motive: "affair" },
    raspberry: { weapon: "cart", location: "checkin", motive: "contract" },
  },
  murderer: "smoky",
  hints: [
    {
      text: 'Nachdem sie über das Wetter gesprochen hatten, sprach Irratino über den Fall: "Schwester Lapis und Trainer Raspberry müssen beide die Wahrheit sagen, sonst lügt Superfan Smoky auch. Siehst du, jetzt bringst du mich schon dazu, logisch zu denken!"',
      book: true,
    },
    {
      text: "Schwarze Augen hat nur Superfan Smoky: Er war in der Stadtkulisse. Lapis will einen Promi treffen, Copper eine Affäre vertuschen.",
      marks: [
        { a: "smoky", b: "backlot", value: "check" },
        { a: "lapis", b: "celebrity", value: "check" },
        { a: "copper", b: "affair", value: "check" },
      ],
    },
    {
      text: "Wer neu verhandeln will, war am Check-in-Stand - nicht Smoky (Stadtkulisse). Also will Raspberry neu verhandeln und war am Check-in-Stand, Smoky will in die Branche.",
      marks: [
        { a: "smoky", b: "industry", value: "check" },
        { a: "raspberry", b: "checkin", value: "check" },
      ],
    },
    {
      text: "Der falsche Preis lag an der Statue. Smoky (die einzige Jungfrau) ist in der Stadtkulisse, Raspberry am Check-in-Stand, Copper nicht am Check-in-Stand - die Aussagen von Lapis, Raspberry und Copper stimmen. Also lügt Superfan Smoky.",
    },
    {
      text: 'Copper hat den falschen Preis also nicht - Lapis hat ihn, an der Statue, und Copper war in der Bar & Grill. Der Zettel, Wort für Wort entwürfelt: "WER DIE FAHNE HATTE WAR EINDEUTIG RECHTSHAENDIG" - das ist Copper.',
      marks: [
        { a: "lapis", b: "statue", value: "check" },
        { a: "copper", b: "grill", value: "check" },
        { a: "copper", b: "flag", value: "check" },
      ],
    },
    {
      text: "Der Golfwagen gehört nicht dem, der in die Branche will - also Raspberry, und Smoky bleibt der Feuerlöscher. Superfan Smoky war es mit dem Feuerlöscher in der Stadtkulisse, um in die Branche einzusteigen.",
      marks: [
        { a: "smoky", b: "extinguisher", value: "check" },
        { a: "raspberry", b: "cart", value: "check" },
        { a: "extinguisher", b: "industry", value: "check" },
        { a: "extinguisher", b: "backlot", value: "check" },
        { a: "backlot", b: "industry", value: "check" },
        { a: "lapis", b: "fake", value: "check" },
        { a: "fake", b: "statue", value: "check" },
        { a: "fake", b: "celebrity", value: "check" },
        { a: "statue", b: "celebrity", value: "check" },
        { a: "flag", b: "grill", value: "check" },
        { a: "flag", b: "affair", value: "check" },
        { a: "grill", b: "affair", value: "check" },
        { a: "raspberry", b: "contract", value: "check" },
        { a: "cart", b: "checkin", value: "check" },
        { a: "cart", b: "contract", value: "check" },
        { a: "checkin", b: "contract", value: "check" },
      ],
    },
  ],
};
