/**
 * Case 16, "Fifteen Percent of Murder": a powerful agent dead in his office
 * at Dame Obsidian's literary agency.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Elementary). One clue is written in
 * the Detective Code of Exhibit A (A becomes Z, B becomes Y, ...). It reads
 * "Agent Ink had a medium-weight weapon"; here it is the German sentence,
 * encoded the same way. The balcony's label is faded in the photo; it is
 * outdoors. The sample prints neither hint nor solution; the solver found the
 * only one, and the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const FIFTEEN_PERCENT_OF_MURDER: Case = {
  id: "fifteen-percent-of-murder",
  number: 16,
  title: "Fünfzehn Prozent Mord",
  story:
    "Deductive Logico ging zu Dame Obsidians Literaturagentur, um nach einer Leiche zu suchen. Er fand auch eine, aber nicht die von Dame Obsidian. Es war die Leiche eines mächtigen Agenten, tot in seinem Büro.",
  series: "volume1",
  difficulty: "elementary",
  suspects: [
    {
      id: "ivory",
      name: "Lektorin Ivory",
      icon: "\u{1F339}",
      description:
        "Die größte Liebesroman-Lektorin aller Zeiten. Sie hat das Genre Enemies to Lovers erfunden und als Erste einen nackten Mann auf ein Buchcover gebracht.",
      heightCm: 168,
      hand: "left",
      eyes: "lightBrown",
      hair: "gray",
    },
    {
      id: "applegreen",
      name: "Assistentin Applegreen",
      icon: "\u{1F34F}",
      description:
        "Ihr Vater ist Schulleiter, und sie macht ihn stolz. Aber weißt du, was sie nicht macht? Genug Geld.",
      heightCm: 160,
      hand: "left",
      eyes: "blue",
      hair: "blond",
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
  ],
  locations: [
    {
      id: "balcony",
      name: "der Balkon",
      icon: "\u{1F3D9}\u{FE0F}",
      description:
        "Vom Balkon aus blickt man über die Stadt, die man beherrscht.",
      indoors: false,
    },
    {
      id: "best-office",
      name: "das beste Büro",
      icon: "\u{1F3E2}",
      description:
        "Der bestverdienende Agent des Monats bekommt dieses Büro. Der schlechteste wird gefeuert.",
      indoors: true,
    },
    {
      id: "submissions-room",
      name: "das Zimmer für unverlangte Einsendungen",
      icon: "\u{1F525}",
      description: "Es dient zugleich als Verbrennungsofen.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "typewriter",
      name: "eine antike Schreibmaschine",
      icon: "⌨️",
      description:
        "Man kann seine Themen subtil anschlagen - oder sie einem damit über den Kopf hauen.",
      weight: "heavy",
    },
    {
      id: "stack",
      name: "ein riesiger Bücherstapel",
      icon: "\u{1F4DA}",
      description:
        "Den kann man umstoßen und jemanden darunter begraben. Aber er ist schwer herumzutragen.",
      weight: "heavy",
    },
    {
      id: "ream",
      name: "ein Ries Papier",
      icon: "\u{1F4C4}",
      description:
        "Mit diesen leeren Seiten kann man jemandem tausend Papierschnitte verpassen - oder einen einzigen Papierschlag.",
      weight: "medium",
    },
  ],
  clues: [
    {
      text: "Lektorin Ivory und die Person, die einen riesigen Bücherstapel mitgebracht hatte, kannten sich seit Jahren.",
      holds: (scene) => scene.holder("stack").id !== "ivory",
    },
    {
      text: "Assistentin Applegreen durfte nicht auf den Balkon.",
      holds: (scene) => scene.locationOf("applegreen").id !== "balcony",
    },
    {
      text: "Logico erhielt einen Hinweis vom Detektivclub, geschrieben in dessen Geheimcode: ZTVMGRM RMP SZGGV VRMV NRGGVOHXSDVIV DZUUV. (Siehe Beweisstück A.)",
      holds: (scene) => scene.weaponOf("ink").weight === "medium",
    },
    {
      text: "Wer im Zimmer für unverlangte Einsendungen war, musste Rechtshänder sein, denn sonst verbrennt man sich.",
      holds: (scene) => scene.at("submissions-room").hand === "right",
    },
  ],
  body: {
    text: "Der Agent, der in seinem Büro starb, war in jenem Monat der bestverdienende Agent gewesen.",
    location: "best-office",
  },
  exhibits: ["detectiveKit"],
  solution: {
    ivory: { weapon: "typewriter", location: "balcony" },
    applegreen: { weapon: "stack", location: "best-office" },
    ink: { weapon: "ream", location: "submissions-room" },
  },
  murderer: "applegreen",
  hints: [
    {
      text: 'Logico hörte, wie ein Agent im Nebenzimmer ins Telefon schrie: "Hören Sie auf anzurufen! Niemand kennt einen Deductive Logico! Und niemanden interessiert, dass Lektorin Ivory auf dem Balkon war!"',
      book: true,
      marks: [{ a: "ivory", b: "balcony", value: "check" }],
    },
    {
      text: 'Mit dem Decoderring aus Beweisstück A (A wird zu Z, B zu Y ...) heißt die Nachricht: "AGENTIN INK HATTE EINE MITTELSCHWERE WAFFE". Mittelschwer ist nur das Ries Papier.',
    },
    {
      text: "Rechtshänderin ist nur Agentin Ink: Sie war im Zimmer für unverlangte Einsendungen.",
      marks: [{ a: "ink", b: "submissions-room", value: "check" }],
    },
    {
      text: "Applegreen durfte nicht auf den Balkon, also war sie im besten Büro. Lektorin Ivory bleibt der Balkon.",
      marks: [{ a: "applegreen", b: "best-office", value: "check" }],
    },
    {
      text: "Ivory hatte nicht den Bücherstapel, also die Schreibmaschine. Applegreen bleibt der Bücherstapel.",
      marks: [
        { a: "ivory", b: "typewriter", value: "check" },
        { a: "applegreen", b: "stack", value: "check" },
      ],
    },
    {
      text: "Das beste Büro gehörte dem bestverdienenden Agenten - dort war Assistentin Applegreen, mit dem Bücherstapel.",
      marks: [
        { a: "stack", b: "best-office", value: "check" },
        { a: "typewriter", b: "balcony", value: "check" },
        { a: "ink", b: "ream", value: "check" },
        { a: "ream", b: "submissions-room", value: "check" },
      ],
    },
  ],
};
