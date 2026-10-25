/**
 * Case 82, "Murder in the Park": a tourist in the Great Park.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Impossible), from photos of the
 * book. Motives and statements, no body clue - the liar is the murderer. The
 * scrambled note reads "Mx. Tangerine was seen with a fire extinguisher";
 * here it is scrambled again in German, letter by letter within each word.
 * The Path of the Ancient Dead admits only Libras, so its member at the old
 * zoo (as cramped as a struggling actor's apartment) is a Libra - both clues
 * carry that predicate. The chipped rock lay by the giant H of the Hollywood
 * sign. The hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const MURDER_IN_THE_PARK: Case = {
  id: "murder-in-the-park",
  number: 82,
  title: "Mord im Park",
  story:
    "Um nach dem Mord auf der MysteryCon abzuschalten, beschloss Deductive Logico, einen schönen Tag im Großen Park zu verbringen. Aber die herrlichen Hügel, die Panoramablicke und die große historische Bedeutung genießen sich schlecht, wenn man einen Mord aufklären muss: Ein Tourist war getötet worden.",
  series: "volume1",
  difficulty: "impossible",
  suspects: [
    {
      id: "tangerine",
      name: "Mx. Tangerine",
      icon: "\u{1F9E2}",
      description:
        "Der Beweis, dass auch nicht-binäre Menschen Mörder sein können: Wanderer:in, Vogelbeobachter:in und verdächtig.",
      heightCm: 165,
      hand: "left",
      eyes: "hazel",
      hair: "blond",
      sign: "pisces",
    },
    {
      id: "pearl",
      name: "Pearl, AGE",
      icon: "\u{1F453}",
      description:
        "Cutterin (Amerikanische Gilde der Editoren) einiger der besten und einiger der erfolgreichsten Filme aller Zeiten - nur nie beides zugleich.",
      heightCm: 165,
      hand: "right",
      eyes: "blue",
      hair: "blond",
      sign: "aquarius",
    },
    {
      id: "lavender",
      name: "Lord Lavender",
      icon: "🎼",
      description:
        "Ein konservatives Mitglied des britischen Oberhauses und zugleich der Musicalkomponist hinter Hits wie Summend den Hügel hinab und Der Mann in Beige.",
      heightCm: 175,
      hand: "right",
      eyes: "green",
      hair: "gray",
      sign: "virgo",
    },
    {
      id: "tuscany",
      name: "Rektorin Tuscany",
      icon: "\u{1F393}",
      description:
        "Als Leiterin des Deduction College hat sie deduziert, dass das Wetter manchmal so perfekt ist, dass man einfach in den Park gehen muss.",
      heightCm: 165,
      hand: "left",
      eyes: "green",
      hair: "gray",
      sign: "libra",
    },
  ],
  locations: [
    {
      id: "greek",
      name: "das Griechische Theater",
      icon: "\u{1F3AD}",
      description:
        "Ein riesiges Freilufttheater, perfekt für ein Orchester oder eine skandinavische Wikingerband auf Tournee.",
      indoors: false,
    },
    {
      id: "zoo",
      name: "der alte Zoo",
      icon: "\u{1F3DA}️",
      description:
        "Hier wurden früher Tiere in engen, verdreckten Käfigen gehalten - nicht besser als die Wohnung eines erfolglosen Schauspielers heute.",
      indoors: false,
    },
    {
      id: "caves",
      name: "die berühmten Höhlen",
      icon: "\u{1F573}️",
      description:
        "Ein berühmter Schauspieler wurde nach einer Straße benannt, die nach diesen Höhlen benannt wurde.",
      indoors: false,
    },
    {
      id: "sign",
      name: "das Hollywood-Schild",
      icon: "\u{1F1ED}",
      description:
        "Wie jedes echte Stück Hollywood-Geschichte begann es als Immobilienbetrug.",
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
      id: "log",
      name: "ein Holzscheit",
      icon: "\u{1FAB5}",
      description:
        "Ein großer, schwerer Eichenklotz. Jemand hat den Baum getötet, damit der Baum jemanden töten kann.",
      weight: "heavy",
      material: "Holz",
    },
    {
      id: "helmet",
      name: "ein antiker Helm",
      icon: "\u{1FA96}",
      description: "Er ist rostig, und er sieht großartig aus.",
      weight: "heavy",
      material: "Metall",
    },
    {
      id: "rock",
      name: "ein Stein",
      icon: "\u{1FAA8}",
      description:
        "Wenn man keine andere Waffe findet - ein Stein liegt immer in der Nähe. Dieser hat eine markante Kerbe.",
      weight: "medium",
      material: "Stein",
    },
  ],
  motives: [
    { id: "could", name: "weil man es konnte", icon: "⛰️" },
    {
      id: "rival",
      name: "die Karriere eines Rivalen zerstören",
      icon: "\u{1F94A}",
    },
    { id: "blackmail", name: "einer Erpressung entkommen", icon: "✉️" },
    { id: "ruby", name: "einen Rubin stehlen", icon: "\u{1F48E}" },
  ],
  clues: [
    {
      text: "Wer einer Erpressung entkommen wollte, hatte graue Haare - vielleicht von der Erpressung.",
      holds: (scene) => scene.driven("blackmail").hair === "gray",
    },
    {
      text: "Neben einem riesigen H wurde eine interessant markante Kerbe entdeckt.",
      holds: (scene) => scene.locationOf(scene.holder("rock").id).id === "sign",
    },
    {
      text: "Der Pfad der Uralten Toten nahm nur Waagen auf.",
      holds: (scene) => scene.at("zoo").sign === "libra",
    },
    {
      text: "Bei einem ihrer seltenen öffentlichen Auftritte wurde Pearl, AGE, auf der Bühne eines Theaters gesehen.",
      holds: (scene) => scene.locationOf("pearl").id === "greek",
    },
    {
      text: "Ein Parkranger gab Logico einen verwürfelten Zettel: XM EANGRINET RUEDW TMI ENMIE SEEEUOEFHCLRR EHEGNSE.",
      holds: (scene) => scene.weaponOf("tangerine").id === "extinguisher",
    },
    {
      text: "Ein Mitglied des Pfads der Uralten Toten war an einem Ort, so groß wie die Wohnung eines erfolglosen Schauspielers.",
      holds: (scene) => scene.at("zoo").sign === "libra",
    },
    {
      text: "Wer einen antiken Helm hatte, wollte die Karriere eines Rivalen zerstören.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("helmet").id)?.id === "rival",
    },
  ],
  statements: [
    {
      by: "tangerine",
      text: "Wer das Holzscheit hatte, wollte einer Erpressung entkommen.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("log").id)?.id === "blackmail",
    },
    {
      by: "pearl",
      text: "Ein Fisch war nicht im alten Zoo.",
      holds: (scene) => scene.at("zoo").sign !== "pisces",
    },
    {
      by: "lavender",
      text: "Wer töten würde, weil er es konnte, war am Hollywood-Schild.",
      holds: (scene) =>
        scene.locationOf(scene.driven("could").id).id === "sign",
    },
    {
      by: "tuscany",
      text: "Als Akademikerin kann ich versichern: Mx. Tangerine war am Hollywood-Schild.",
      holds: (scene) => scene.locationOf("tangerine").id === "sign",
    },
  ],
  exhibits: ["astrology"],
  solution: {
    tangerine: { weapon: "extinguisher", location: "caves", motive: "ruby" },
    pearl: { weapon: "helmet", location: "greek", motive: "rival" },
    lavender: { weapon: "rock", location: "sign", motive: "could" },
    tuscany: { weapon: "log", location: "zoo", motive: "blackmail" },
  },
  murderer: "tuscany",
  hints: [
    {
      text: 'Während eines unangenehmen Videoanrufs deutete Inspektor Irratino eine Tarotlegung, die er gemacht hatte, und verkündete dann: "Rektorin Tuscany wurde mit einem Holzscheit gesehen."',
      book: true,
      marks: [{ a: "tuscany", b: "log", value: "check" }],
    },
    {
      text: 'Der Zettel, Wort für Wort entwürfelt: "MX TANGERINE WURDE MIT EINEM FEUERLOESCHER GESEHEN". Pearl stand auf der Bühne des Griechischen Theaters.',
      marks: [{ a: "pearl", b: "greek", value: "check" }],
    },
    {
      text: "Die einzige Waage ist Rektorin Tuscany: Sie ist das Mitglied des Pfads im alten Zoo. Der Stein mit der Kerbe lag am Hollywood-Schild.",
      marks: [
        { a: "tuscany", b: "zoo", value: "check" },
        { a: "rock", b: "sign", value: "check" },
      ],
    },
    {
      text: "Tangerine hat den Feuerlöscher, kann also nicht am Schild mit dem Stein sein. Tuscanys Aussage ist falsch - sie lügt und ist die Mörderin. Tangerine war in den Höhlen, Lord Lavender mit dem Stein am Schild.",
      marks: [
        { a: "tangerine", b: "extinguisher", value: "check" },
        { a: "tangerine", b: "caves", value: "check" },
        { a: "lavender", b: "rock", value: "check" },
      ],
    },
    {
      text: "Laut Lavender war, wer es konnte, am Schild - also Lavender selbst. Erpressung: graue Haare, also Tuscany. Laut Tangerine hatte, wer erpresst wurde, das Holzscheit - Tuscany. Pearl hat den Helm und will einen Rivalen zerstören, Tangerine den Rubin.",
      marks: [
        { a: "lavender", b: "could", value: "check" },
        { a: "tuscany", b: "blackmail", value: "check" },
        { a: "tangerine", b: "ruby", value: "check" },
        { a: "pearl", b: "helmet", value: "check" },
        { a: "pearl", b: "rival", value: "check" },
        { a: "helmet", b: "rival", value: "check" },
      ],
    },
    {
      text: "Rektorin Tuscany war es mit dem Holzscheit im alten Zoo, um einer Erpressung zu entkommen.",
      marks: [
        { a: "log", b: "zoo", value: "check" },
        { a: "log", b: "blackmail", value: "check" },
        { a: "zoo", b: "blackmail", value: "check" },
        { a: "extinguisher", b: "caves", value: "check" },
        { a: "extinguisher", b: "ruby", value: "check" },
        { a: "caves", b: "ruby", value: "check" },
        { a: "helmet", b: "greek", value: "check" },
        { a: "greek", b: "rival", value: "check" },
        { a: "lavender", b: "sign", value: "check" },
        { a: "rock", b: "could", value: "check" },
        { a: "sign", b: "could", value: "check" },
      ],
    },
  ],
};
