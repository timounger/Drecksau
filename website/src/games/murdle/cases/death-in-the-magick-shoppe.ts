/**
 * Case 93, "Death in the Magick Shoppe": the clerk of the Hollywood Mystery
 * Shoppe.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Impossible), from the photos of the
 * book. Motives and statements, no body clue - the liar is the murderer.
 * The Cult of the Black Cow and the High Order of the Dark Rain are rivals:
 * the second shortest suspect is in the cult, so they cannot have brought
 * the dagger of the order; both clues carry that one predicate. The
 * scrambled note reads "Whoever had an award was right-handed"; here it is
 * scrambled again in German, letter by letter within each word. The first
 * hint is the book's; the solver's only solution is the one the book
 * prints, and the other hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const DEATH_IN_THE_MAGICK_SHOPPE: Case = {
  id: "death-in-the-magick-shoppe",
  number: 93,
  title: "Tod im Zauberlädchen",
  story:
    "In einer Ecke versteckt fand Logico den Hollywood Mystery Shoppe, ein Warenhaus für Filmmagie. Es hat alles, was man fürs Filmgeschäft braucht: Zauberbücher, magische Pulver, Lichttechnik und einen toten Verkäufer. Wieder fragte er sich: Warum hatte Irratino ihn zu diesen Leuten geschickt?",
  series: "volume1",
  difficulty: "impossible",
  suspects: [
    {
      id: "azure",
      name: "Bischöfin Azure",
      icon: "⛪",
      description:
        "Eine Bischöfin der örtlichen Kirche. Man weiß, dass sie für ihre Freunde und für ihre Feinde betet. Natürlich bittet sie dabei um verschiedene Dinge ...",
      heightCm: 163,
      hand: "right",
      eyes: "lightBrown",
      hair: "darkBrown",
      sign: "gemini",
    },
    {
      id: "dusty",
      name: "Regisseur Dusty",
      icon: "\u{1F3AC}",
      description:
        "Ein echter Filmemacher. Er will ein Meisterwerk drehen. Dafür muss er vielleicht einen Mord begehen.",
      heightCm: 178,
      hand: "left",
      eyes: "hazel",
      hair: "bald",
      sign: "pisces",
    },
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
      id: "midnight",
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
  ],
  locations: [
    {
      id: "secret-room",
      name: "das Geheimzimmer",
      icon: "\u{1F441}️",
      description:
        "Ein geheimes Zimmer für magische Rituale und Fotoshootings.",
      indoors: true,
    },
    {
      id: "back-office",
      name: "das Hinterzimmer",
      icon: "\u{1F5C4}️",
      description:
        "Hier schreibt der Inhaber - ein Hollywood-Krimiautor - die meisten seiner Bücher.",
      indoors: true,
    },
    {
      id: "porch",
      name: "die Veranda",
      icon: "\u{1FAA7}",
      description:
        'Ein einladendes Schild verspricht Zubehör "für alle Ihre magischen Mysterienbedürfnisse".',
      indoors: false,
    },
    {
      id: "main-room",
      name: "der Verkaufsraum",
      icon: "\u{1F4DA}",
      description:
        "Hier kann man allerlei magisches Zubehör, Krimis und mehr kaufen.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "ball",
      name: "eine Kristallkugel",
      icon: "\u{1F52E}",
      description:
        "Wenn du hineinschaust, zeigt sie dir deine Zukunft - solange deine Zukunft eine Kristallkugel ist.",
      weight: "heavy",
      material: "Kristall",
    },
    {
      id: "award",
      name: "ein Filmpreis",
      icon: "\u{1F3C6}",
      description:
        "Einer der gewöhnlichsten Gegenstände in ganz Hollywood, wie es scheint.",
      weight: "medium",
      material: "Metall",
    },
    {
      id: "cane",
      name: "ein Stockdegen",
      icon: "\u{1F9AF}",
      description:
        "Scharf und versteckt. Sieht aus wie ein gewöhnlicher Stock.",
      weight: "medium",
      material: "Metall",
    },
    {
      id: "dagger",
      name: "ein verfluchter Dolch",
      icon: "\u{1F5E1}️",
      description:
        "Eine sterbende Herzogin verfluchte diesen Dolch, als sie damit ihrem eigenen Leben ein Ende setzte.",
      weight: "medium",
      material: "Metall und Juwelen",
    },
  ],
  motives: [
    { id: "crystal", name: "einen Kristall stehlen", icon: "\u{1F48E}" },
    { id: "occult", name: "das Okkulte fördern", icon: "✨" },
    { id: "industry", name: "im Auftrag der Branche", icon: "⚙️" },
    {
      id: "script",
      name: "helfen, ein Drehbuch zu verkaufen",
      icon: "\u{1F4C4}",
    },
  ],
  clues: [
    {
      text: "Wer die Kristallkugel hatte, hatte blonde Haare.",
      holds: (scene) => scene.holder("ball").hair === "blond",
    },
    {
      text: "Der zweitkleinste Verdächtige war im Kult der Schwarzen Kuh.",
      holds: (scene) => scene.holder("dagger").id !== "midnight",
    },
    {
      text: "Wer im Verkaufsraum war, war Rechtshänder.",
      holds: (scene) => scene.at("main-room").hand === "right",
    },
    {
      text: "Wer einen Kristall stehlen wollte, war im Hinterzimmer.",
      holds: (scene) =>
        scene.locationOf(scene.driven("crystal").id).id === "back-office",
    },
    {
      text: "Ein Mitglied des Hohen Ordens des Dunklen Regens brachte einen verfluchten Dolch mit.",
      holds: (scene) => scene.holder("dagger").id !== "midnight",
    },
    {
      text: "Der tote Verkäufer hatte vor seinem Tod eine verwürfelte Notiz geschrieben: RWE INNEE MLSEIIPFR TTEAH, ARW TCRSÄENHRDEH.",
      holds: (scene) => scene.holder("award").hand === "right",
    },
    {
      text: "Regisseur Dusty war in einem Raum, den er früher für Fotoshootings genutzt hatte.",
      holds: (scene) => scene.locationOf("dusty").id === "secret-room",
    },
    {
      text: "Wer den Stockdegen hatte, wollte im Auftrag der Branche töten.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("cane").id)?.id === "industry",
    },
    {
      text: "Niemand im Kult der Schwarzen Kuh war zugleich im Hohen Orden des Dunklen Regens: Die beiden waren verfeindet.",
      holds: (scene) => scene.holder("dagger").id !== "midnight",
    },
  ],
  statements: [
    {
      by: "azure",
      text: "Wer den verfluchten Dolch hatte, wollte helfen, ein Drehbuch zu verkaufen.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("dagger").id)?.id === "script",
    },
    {
      by: "dusty",
      text: "Ich war nicht im Hinterzimmer.",
      holds: (scene) => scene.locationOf("dusty").id !== "back-office",
    },
    {
      by: "champagne",
      text: "Ich war nicht im Verkaufsraum.",
      holds: (scene) => scene.locationOf("champagne").id !== "main-room",
    },
    {
      by: "midnight",
      text: "Hey, Regisseur Dusty war im Geheimzimmer.",
      holds: (scene) => scene.locationOf("dusty").id === "secret-room",
    },
  ],
  solution: {
    azure: { weapon: "award", location: "main-room", motive: "script" },
    dusty: { weapon: "dagger", location: "secret-room", motive: "occult" },
    champagne: { weapon: "ball", location: "back-office", motive: "crystal" },
    midnight: { weapon: "cane", location: "porch", motive: "industry" },
  },
  murderer: "azure",
  hints: [
    {
      text: 'Diesmal ging Irratino schon beim dritten Klingeln ran. "Tut mir leid, ich war am anderen Ende des Herrenhauses, als das Telefon klingelte. Wichtig: Regisseur Dusty hatte den verfluchten Dolch. Noch wichtiger: Gleich wirst du alles verstehen."',
      book: true,
      marks: [{ a: "dusty", b: "dagger", value: "check" }],
    },
    {
      text: 'Die Kristallkugel hatte der einzige Blonde, Genosse Champagne. Die Notiz, Wort für Wort entwürfelt: "WER EINEN FILMPREIS HATTE, WAR RECHTSHÄNDER." Rechtshänderin ist nur Bischöfin Azure - sie hatte den Filmpreis und war auch im Verkaufsraum, wo ein Rechtshänder war.',
      marks: [
        { a: "champagne", b: "ball", value: "check" },
        { a: "azure", b: "award", value: "check" },
        { a: "azure", b: "main-room", value: "check" },
        { a: "award", b: "main-room", value: "check" },
      ],
    },
    {
      text: "Der Zweitkleinste ist Onkel Midnight (1,73 m). Er ist im Kult der Schwarzen Kuh, also nicht im verfeindeten Orden - den Dolch des Ordens hatte er nicht. Also hatte Regisseur Dusty den Dolch und Onkel Midnight den Stockdegen: Er tötet im Auftrag der Branche.",
      marks: [
        { a: "midnight", b: "cane", value: "check" },
        { a: "midnight", b: "industry", value: "check" },
        { a: "cane", b: "industry", value: "check" },
      ],
    },
    {
      text: "Dusty war im Geheimzimmer (Fotoshootings). Wer einen Kristall stehlen wollte, war im Hinterzimmer - das ist nicht Midnight (Branche), also Champagne. Onkel Midnight bleibt die Veranda.",
      marks: [
        { a: "dusty", b: "secret-room", value: "check" },
        { a: "champagne", b: "back-office", value: "check" },
        { a: "champagne", b: "crystal", value: "check" },
        { a: "back-office", b: "crystal", value: "check" },
        { a: "midnight", b: "porch", value: "check" },
      ],
    },
    {
      text: "Probiere aus, wer lügt. Dusty (nicht im Hinterzimmer), Champagne (nicht im Verkaufsraum) und Midnight (Dusty im Geheimzimmer) sagen nachweislich die Wahrheit. Also lügt Bischöfin Azure - sie ist die Mörderin.",
    },
    {
      text: "Azures Aussage ist falsch: Dusty mit dem Dolch wollte kein Drehbuch verkaufen, sondern das Okkulte fördern. Azure wollte helfen, ein Drehbuch zu verkaufen - mit dem Filmpreis im Verkaufsraum.",
      marks: [
        { a: "azure", b: "script", value: "check" },
        { a: "dusty", b: "occult", value: "check" },
        { a: "dagger", b: "occult", value: "check" },
        { a: "award", b: "script", value: "check" },
        { a: "main-room", b: "script", value: "check" },
        { a: "dagger", b: "secret-room", value: "check" },
        { a: "secret-room", b: "occult", value: "check" },
        { a: "ball", b: "back-office", value: "check" },
        { a: "ball", b: "crystal", value: "check" },
        { a: "cane", b: "porch", value: "check" },
        { a: "porch", b: "industry", value: "check" },
      ],
    },
  ],
};
