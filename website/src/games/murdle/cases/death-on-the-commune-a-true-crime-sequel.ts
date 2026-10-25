/**
 * Case 60, "Death on the Commune: A True-Crime Sequel": a long-time cultist
 * killed at the ancient ruins on the edge of the commune.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Hard Boiled), from the photos of the
 * book. The membership clue and the rule for the members only count
 * together, so both carry what they say together: the Pisces killed by order
 * of the cult. The solver found the only solution, and the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const DEATH_ON_THE_COMMUNE_A_TRUE_CRIME_SEQUEL: Case = {
  id: "death-on-the-commune-a-true-crime-sequel",
  number: 60,
  title: "Tod in der Kommune: Die True-Crime-Fortsetzung",
  story:
    "Deductive Logico erinnerte sich an etwas über diese Kommune: Am Rand ihres Landes lagen uralte Ruinen. Also fuhr er wieder hinaus aufs Land - und dort gab es nicht nur uralte Ruinen, sondern auch einen Mord. Ein langjähriges Sektenmitglied war getötet worden.",
  series: "volume1",
  difficulty: "hardBoiled",
  suspects: [
    {
      id: "champagne",
      name: "Genosse Champagne",
      icon: "\u{1F942}",
      description:
        "Ein Kommunist, und zwar ein reicher. Genosse Champagne reist für sein Leben gern um die Welt und verbreitet die Botschaft des Kommunismus - am liebsten bei einem Glas vom feinsten Schaumwein.",
      heightCm: 180,
      hand: "left",
      eyes: "hazel",
      hair: "blond",
      sign: "capricorn",
    },
    {
      id: "tangerine",
      name: "Mx. Tangerine",
      icon: "\u{1F9E2}",
      description:
        "Der Beweis, dass auch nicht-binäre Menschen Mörder sein können: Kommunard:in, Landwirt:in und verdächtig.",
      heightCm: 165,
      hand: "left",
      eyes: "hazel",
      hair: "blond",
      sign: "pisces",
    },
    {
      id: "applegreen",
      name: "Assistentin Applegreen",
      icon: "\u{1F34F}",
      description:
        "Ihr Vater ist Schulleiter - und je mehr Zeit sie in dieser Kommune verbringt, desto weniger stolz ist er auf sie.",
      heightCm: 160,
      hand: "left",
      eyes: "blue",
      hair: "blond",
      sign: "virgo",
    },
    {
      id: "principal",
      name: "Schulleiter Applegreen",
      icon: "\u{1F468}\u{200D}\u{1F3EB}",
      description:
        "Ein strenger Schulleiter, was alles angeht - außer, mit einem Mord davonzukommen. Seine Hände sind immer voller Kreide.",
      heightCm: 180,
      hand: "right",
      eyes: "blue",
      hair: "bald",
      sign: "libra",
    },
  ],
  locations: [
    {
      id: "meeting-house",
      name: "das Versammlungshaus",
      icon: "\u{1F3E0}",
      description:
        "Hier finden die offiziellen Diskussionen statt - und hier wird absolut nichts erreicht.",
      indoors: true,
    },
    {
      id: "mill",
      name: "die alte Mühle",
      icon: "\u{1F33E}",
      description:
        "Ein großartiger Ort, um Korn zu mahlen oder Geheimnisse zu verstecken.",
      indoors: true,
    },
    {
      id: "ruins",
      name: "die alten Ruinen",
      icon: "\u{1F5FF}",
      description:
        "Haben sie eine religiöse Bedeutung? Vielleicht für die alten Götter ...",
      indoors: false,
    },
    {
      id: "library",
      name: "die Bibliothek",
      icon: "\u{1F4DA}",
      description:
        "Mehr Bücher, als du je gesehen hast. (Aber alle von einem einzigen Typen.)",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "pipe",
      name: "ein Aluminiumrohr",
      icon: "\u{1F527}",
      description: "Sicherer als Blei - außer, es trifft dich am Kopf.",
      weight: "heavy",
      material: "Metall",
    },
    {
      id: "clock",
      name: "eine antike Uhr",
      icon: "\u{1F570}️",
      description:
        "Tick, tack, tick, tack. Genau genommen bringt die Zeit uns alle langsam um.",
      weight: "heavy",
      material: "Holz und Metall",
    },
    {
      id: "magnifier",
      name: "eine Lupe",
      icon: "\u{1F50D}",
      description: "Damit findet man einen Hinweis oder spürt eine Wanze auf.",
      weight: "medium",
      material: "Metall und Glas",
    },
    {
      id: "sword",
      name: "ein altes Schwert",
      icon: "\u{1F5E1}️",
      description:
        "Damit kämpften die Bösen in irgendeinem alten Krieg. Es ist völlig verrostet.",
      weight: "heavy",
      material: "Metall",
    },
  ],
  motives: [
    { id: "cult", name: "auf Befehl eines Kults", icon: "\u{1F4DC}" },
    { id: "lesson", name: "jemandem eine Lektion erteilen", icon: "\u{1F34E}" },
    { id: "motivate", name: "Logico motivieren", icon: "\u{1F3A9}" },
    {
      id: "will",
      name: "eine Testamentsänderung verhindern",
      icon: "\u{1F4C4}",
    },
  ],
  clues: [
    {
      text: "Eine Lupe diente bei der offiziellen Diskussion als Requisite.",
      holds: (scene) =>
        scene.locationOf(scene.holder("magnifier").id).id === "meeting-house",
    },
    {
      text: "Schulleiter Applegreen hatte eine antike Uhr dabei, um die Zeit abzulesen.",
      holds: (scene) => scene.weaponOf("principal").id === "clock",
    },
    {
      text: "Wer das Aluminiumrohr hatte, wollte Logico motivieren.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("pipe").id)?.id === "motivate",
    },
    {
      text: "Wer in der Bibliothek war, war Rechtshänder.",
      holds: (scene) => scene.at("library").hand === "right",
    },
    {
      text: "Ein Steinbock drehte in der alten Mühle seine Runden.",
      holds: (scene) => scene.at("mill").sign === "capricorn",
    },
    {
      text: "Ein Fisch war Mitglied im Tiefen Brunnen der Weisheit.",
      // Only counts together with the next clue: the Pisces is Mx. Tangerine.
      holds: (scene) => scene.motiveOf("tangerine")?.id === "cult",
    },
    {
      text: "Alle Mitglieder des Tiefen Brunnens der Weisheit wollen auf Befehl ihres Kults töten.",
      holds: (scene) => scene.motiveOf("tangerine")?.id === "cult",
    },
    {
      text: "Wer dem langjährigen Sektenmitglied eine Lektion erteilen wollte, hielt eine mittelschwere Waffe in der Hand.",
      holds: (scene) =>
        scene.weaponOf(scene.driven("lesson").id).weight === "medium",
    },
  ],
  body: {
    text: "Die Leiche des langjährigen Sektenmitglieds lag ausgestreckt auf den alten Ruinen.",
    location: "ruins",
  },
  exhibits: ["astrology"],
  solution: {
    champagne: { weapon: "pipe", location: "mill", motive: "motivate" },
    tangerine: { weapon: "sword", location: "ruins", motive: "cult" },
    applegreen: {
      weapon: "magnifier",
      location: "meeting-house",
      motive: "lesson",
    },
    principal: { weapon: "clock", location: "library", motive: "will" },
  },
  murderer: "tangerine",
  hints: [
    {
      text: "Logico stellte sich vor, wie Irratino ihm aus der Hand las und ihm sagte, Genosse Champagne habe ein Aluminiumrohr gehabt.",
      book: true,
      marks: [{ a: "champagne", b: "pipe", value: "check" }],
    },
    {
      text: "Rechtshänder ist nur Schulleiter Applegreen: Er war in der Bibliothek - mit der antiken Uhr. Steinbock ist nur Genosse Champagne: Er war in der alten Mühle.",
      marks: [
        { a: "principal", b: "clock", value: "check" },
        { a: "principal", b: "library", value: "check" },
        { a: "clock", b: "library", value: "check" },
        { a: "champagne", b: "mill", value: "check" },
      ],
    },
    {
      text: "Fisch ist Mx. Tangerine. Als Mitglied im Tiefen Brunnen der Weisheit wollte Tangerine auf Befehl des Kults töten.",
      marks: [{ a: "tangerine", b: "cult", value: "check" }],
    },
    {
      text: "Mittelschwer ist nur die Lupe: Wer sie hatte, wollte eine Lektion erteilen - und die Lupe lag im Versammlungshaus. Tangerine (Kult) hatte sie also nicht und war nicht im Versammlungshaus.",
      marks: [
        { a: "magnifier", b: "meeting-house", value: "check" },
        { a: "magnifier", b: "lesson", value: "check" },
        { a: "meeting-house", b: "lesson", value: "check" },
        { a: "tangerine", b: "meeting-house", value: "cross" },
      ],
    },
    {
      text: "Für Tangerine bleiben damit nur die alten Ruinen, wo die Leiche lag. Assistentin Applegreen war im Versammlungshaus, mit der Lupe, und wollte eine Lektion erteilen.",
      marks: [
        { a: "tangerine", b: "ruins", value: "check" },
        { a: "applegreen", b: "magnifier", value: "check" },
        { a: "applegreen", b: "meeting-house", value: "check" },
        { a: "applegreen", b: "lesson", value: "check" },
      ],
    },
    {
      text: "Wer das Aluminiumrohr hatte, wollte Logico motivieren - das war nicht Tangerine (Kult). Also hatte Champagne das Rohr und wollte Logico motivieren, und Tangerine hatte das alte Schwert. Dem Schulleiter bleibt die Testamentsänderung.",
      marks: [
        { a: "pipe", b: "motivate", value: "check" },
        { a: "champagne", b: "motivate", value: "check" },
        { a: "tangerine", b: "sword", value: "check" },
        { a: "principal", b: "will", value: "check" },
        { a: "pipe", b: "mill", value: "check" },
        { a: "mill", b: "motivate", value: "check" },
        { a: "sword", b: "ruins", value: "check" },
        { a: "sword", b: "cult", value: "check" },
        { a: "ruins", b: "cult", value: "check" },
        { a: "clock", b: "will", value: "check" },
        { a: "library", b: "will", value: "check" },
      ],
    },
  ],
};
