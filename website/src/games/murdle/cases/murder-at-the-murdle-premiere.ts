/**
 * Case 100, "Murder at the Murdle Premiere": the vice president of Midnight
 * Movies, on the night Murdle: The Movie opens.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Impossible), from the photos of the
 * book. Motives and statements, no body clue - the liar is the murderer.
 * The Academy of Moving Images only admits black hair, and whoever was at
 * the concessions stand is a member; both clues carry that one predicate.
 *
 * Three coded messages:
 * - The Investigation Institute's report (Exhibit B) is a row of symbols,
 *   each standing for the first letter of what it shows in the book's
 *   primer (oil, brimstone, Sagittarius, iron, ..., Aquarius, nitre, earth,
 *   Taurus, Virgo, Gemini): "Obsidian wanted revenge". The primer of this
 *   app has only the star signs, so the symbols cannot be re-encoded in
 *   German; the clue describes the report, and a hint gives its reading.
 * - The filmgoer's note, scrambled letter by letter within each word, reads
 *   "President Midnight wanted to hold onto power"; scrambled again in
 *   German.
 * - The Detective Club's message in the detective code (A to Z, B to Y,
 *   Exhibit A) reads "The second shortest suspect was seen with an award";
 *   encoded again in German (Ä written as AE).
 *
 * One clue needs Exhibit C, the labyrinth on the ancient ruins, which the
 * photos do not show: the letter joined to the O is not the initial of the
 * suspect who wants to take over a studio. The initials are M, M, O and I.
 * M is ruled out by the book's solution (Midnight III takes over), O is the
 * O itself, and without the clue the case has three solutions - only I makes
 * it solvable (and O and I begin OIL, the secret of the ruins). The clue
 * here therefore names the I outright. The first hint is the book's; the
 * solver's only solution is the one the book prints, and the other hints
 * are our own.
 */
import type { Case, Scene } from "../engine/types";

/** The case. */
export const MURDER_AT_THE_MURDLE_PREMIERE: Case = {
  id: "murder-at-the-murdle-premiere",
  number: 100,
  title: "Mord bei der Murdle-Premiere",
  story:
    'Am Abend, bevor Murdle: Der Film im Luxuskino der Midnight Movie Studios Premiere feierte, bekam Deductive Logico einen Anruf. "Ich weiß, wer Irratino etwas angehängt hat!", sagte eine geheimnisvolle Stimme - doch als Logico fragte, wer, war die Leitung tot. Am nächsten Abend kamen Logico und Irratino im Smoking zur Premiere und erfuhren, dass der Vizepräsident von Midnight Movies getötet worden war. In seiner Tasche fand Logico einen Zettel mit seiner Telefonnummer. Wenn Logico diesen Mord aufklären konnte, würde er das ganze Rätsel auf einmal lösen.',
  series: "volume1",
  difficulty: "impossible",
  suspects: [
    {
      id: "midnight-iii",
      name: "Midnight III",
      icon: "\u{1F576}️",
      description:
        "Der Enkel des Gründers. Wird ihm sein Plan gelingen, Midnight Movies in sein Goldenes Zeitalter zurückzuführen?",
      heightCm: 173,
      hand: "left",
      eyes: "darkBrown",
      hair: "darkBrown",
      sign: "libra",
    },
    {
      id: "president",
      name: "Präsident Midnight",
      icon: "\u{1F3A9}",
      description:
        "Der Chef von Midnight Movies. Würde er Dutzende ermorden, nur um an der Macht zu bleiben?",
      heightCm: 188,
      hand: "right",
      eyes: "black",
      hair: "black",
      sign: "capricorn",
    },
    {
      id: "obsidian",
      name: "Dame Obsidian",
      icon: "\u{1F452}",
      description:
        "Hat die größte Krimiautorin der Welt ihrem Werk einfach noch ein paar Morde hinzugefügt?",
      heightCm: 163,
      hand: "left",
      eyes: "green",
      hair: "black",
      sign: "leo",
    },
    {
      id: "irratino",
      name: "Inspektor Irratino",
      icon: "\u{1F9FF}",
      description:
        "Der esoterische Detektiv. Aber war alles, was er je gesagt hat, eine Lüge?",
      heightCm: 188,
      hand: "left",
      eyes: "green",
      hair: "darkBrown",
      sign: "aquarius",
    },
  ],
  locations: [
    {
      id: "stage",
      name: "die Bühne",
      icon: "\u{1F3AD}",
      description:
        "Wer hier zu einem Film eingeladen wird, bezahlt dafür, indem er sich danach die Fragerunde auf der Bühne anhören muss.",
      indoors: true,
    },
    {
      id: "seating",
      name: "die Plüschsitze",
      icon: "\u{1F4BA}",
      description:
        "Rote Samtsitze wie in alten Zeiten. Auf ihnen klebt Kaugummi aus alten Zeiten.",
      indoors: true,
    },
    {
      id: "exit",
      name: "der Notausgang",
      icon: "\u{1F6AA}",
      description:
        "Er ist schwer zu finden, denn das Studio hat die Notbeleuchtung abgeklebt, damit das Kino perfekt dunkel ist.",
      indoors: true,
    },
    {
      id: "concessions",
      name: "der Imbissstand",
      icon: "\u{1F37F}",
      description:
        "Alles am Imbiss ist gratis und deshalb lächerlich winzig. Nimm dir eine Handvoll Popcorn und einen Deckel voll Limo.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "award",
      name: "ein Filmpreis",
      icon: "\u{1F3C6}",
      description:
        "Das Wichtigste in ganz Hollywood. Und außerdem bedeutungslos.",
      weight: "medium",
      material: "Metall",
    },
    {
      id: "herring",
      name: "ein roter Hering",
      icon: "\u{1F41F}",
      description:
        "Wenn du ihn am Schwanz hältst, bekommst du richtig Schwung dahinter.",
      weight: "medium",
      material: "Fisch",
    },
    {
      id: "wand",
      name: "ein Selenitstab",
      icon: "\u{1FA84}",
      description: "Zum Zaubern und zum Schädeleinschlagen.",
      weight: "medium",
      material: "Kristall",
    },
    {
      id: "wine",
      name: "eine Flasche Wein",
      icon: "\u{1F377}",
      description: "Vorsicht vor Flecken - der Rotwein geht nicht mehr raus.",
      weight: "medium",
      material: "Glas und Alkohol",
    },
  ],
  motives: [
    { id: "power", name: "an der Macht bleiben", icon: "✊" },
    { id: "studio", name: "ein Studio übernehmen", icon: "\u{1F3AC}" },
    { id: "revenge", name: "Rache nehmen", icon: "⚔️" },
    { id: "oil", name: "nach Öl bohren", icon: "\u{1F6E2}️" },
  ],
  clues: [
    {
      text: "Im Labyrinth auf der Seite der alten Ruinen ist das O mit dem I verbunden - und das I ist nicht der Anfangsbuchstabe des Nachnamens des Verdächtigen, der ein Studio übernehmen will. (Im Buch: siehe Beweisstück C.)",
      holds: (scene) => scene.driven("studio").id !== "irratino",
    },
    {
      text: "Wer am Imbissstand war, war Mitglied der Akademie der Bewegten Bilder.",
      holds: (scene) => academyFits(scene),
    },
    {
      text: "Das Ermittlungsinstitut gab seinen Bericht heraus - eine Reihe von Symbolen aus Inspektor Irratinos Fibel, jedes für den Anfangsbuchstaben dessen, was es darstellt. (Im Buch: siehe Beweisstück B.)",
      holds: (scene) => scene.motiveOf("obsidian")?.id === "revenge",
    },
    {
      text: "Ein Selenitstab lag neben altem Kaugummi, und einen roten Hering hätte niemand auf die Bühne gelassen.",
      holds: (scene) =>
        scene.locationOf(scene.holder("wand").id).id === "seating" &&
        scene.locationOf(scene.holder("herring").id).id !== "stage",
    },
    {
      text: "Entweder wollte, wer einen Filmpreis hatte, nach Öl bohren, oder Dame Obsidian hatte eine Flasche Wein dabei.",
      holds: (scene) =>
        (scene.motiveOf(scene.holder("award").id)?.id === "oil") !==
        (scene.weaponOf("obsidian").id === "wine"),
    },
    {
      text: "Die Akademie der Bewegten Bilder nimmt nur Menschen mit schwarzen Haaren auf.",
      holds: (scene) => academyFits(scene),
    },
    {
      text: "Ein Kinobesucher kritzelte seine Gedanken auf einen Zettel und gab ihn Logico: RENIPTSÄD NDTIHMIG OLTWEL ICSH NA EDR ACMHT NLTAEH.",
      holds: (scene) => scene.motiveOf("president")?.id === "power",
    },
    {
      text: "Endlich meldete sich der Detektivclub bei Logico und schickte ihm eine Nachricht in seinem traditionellen Code: WVI ADVRGPOVRMHGV EVIWZVXSGRTV DFIWV NRG VRMVN URONKIVRH TVHVSVM. (Siehe Beweisstück A.)",
      holds: (scene) => scene.weaponOf("midnight-iii").id === "award",
    },
  ],
  statements: [
    {
      by: "midnight-iii",
      text: "Wenn ich mich einmischen darf: Mein Vater hatte einen Selenitstab dabei.",
      holds: (scene) => scene.weaponOf("president").id === "wand",
    },
    {
      by: "president",
      text: "Mein Sohn wollte das Studio übernehmen.",
      holds: (scene) => scene.motiveOf("midnight-iii")?.id === "studio",
    },
    {
      by: "obsidian",
      text: "Wer Rache nehmen wollte, war am Imbissstand.",
      holds: (scene) =>
        scene.locationOf(scene.driven("revenge").id).id === "concessions",
    },
    {
      by: "irratino",
      text: "Präsident Midnight war nicht am Imbissstand.",
      holds: (scene) => scene.locationOf("president").id !== "concessions",
    },
  ],
  exhibits: ["detectiveKit", "astrology"],
  solution: {
    "midnight-iii": { weapon: "award", location: "stage", motive: "studio" },
    president: { weapon: "herring", location: "exit", motive: "power" },
    obsidian: { weapon: "wine", location: "concessions", motive: "revenge" },
    irratino: { weapon: "wand", location: "seating", motive: "oil" },
  },
  murderer: "midnight-iii",
  hints: [
    {
      text: "Inspektor Irratino wusste, dass das Ermittlungsinstitut den Anfangsbuchstaben dessen benutzte, was jedes Symbol darstellte, und Deductive Logico wusste, dass der Detektivclub seinen üblichen Detektivcode verwendete. Und beide wussten, dass dies der Fall ihres Lebens war.",
      book: true,
    },
    {
      text: 'Der Detektivcode (A wird zu Z, B zu Y ...) ergibt: "DER ZWEITKLEINSTE VERDAECHTIGE WURDE MIT EINEM FILMPREIS GESEHEN." Der Zweitkleinste ist Midnight III (1,73 m) - er hatte den Filmpreis. Der Zettel, Wort für Wort entwürfelt: "PRÄSIDENT MIDNIGHT WOLLTE SICH AN DER MACHT HALTEN."',
      marks: [
        { a: "midnight-iii", b: "award", value: "check" },
        { a: "president", b: "power", value: "check" },
      ],
    },
    {
      text: 'Der Bericht des Instituts: Die Symbole stehen im Buch für Öl (Oil), Schwefel (Brimstone), Schütze (Sagittarius), Eisen (Iron) und so weiter - ihre englischen Anfangsbuchstaben ergeben "OBSIDIAN WANTED REVENGE": Dame Obsidian wollte Rache nehmen.',
      marks: [{ a: "obsidian", b: "revenge", value: "check" }],
    },
    {
      text: "Ein Studio will laut Labyrinth nicht Irratino übernehmen - also Midnight III, und Irratino will nach Öl bohren. Wer den Filmpreis hat (Midnight III), will also nicht bohren: Laut dem Entweder-oder hatte Dame Obsidian die Flasche Wein.",
      marks: [
        { a: "midnight-iii", b: "studio", value: "check" },
        { a: "obsidian", b: "wine", value: "check" },
      ],
    },
    {
      text: "Der Selenitstab lag bei den Plüschsitzen (Kaugummi). Präsident Midnight und Irratino teilen sich Stab und Hering. Die Aussage des Präsidenten (sein Sohn will das Studio) stimmt. Am Imbissstand war jemand mit schwarzen Haaren - der Präsident oder Obsidian.",
      marks: [
        { a: "wand", b: "seating", value: "check" },
        { a: "president", b: "herring", value: "check" },
        { a: "obsidian", b: "concessions", value: "check" },
      ],
    },
    {
      text: "Probiere aus, wer lügt. Lügt Irratino, war der Präsident am Imbissstand - dann wäre die Rächerin Obsidian nicht dort, und auch Obsidian löge. Lügt Obsidian, war sie nicht am Imbissstand, also der Präsident - dann löge auch Irratino. Beides geht nicht. Also lügt Midnight III - er ist der Mörder.",
    },
    {
      text: "Sein Vater hatte also keinen Selenitstab, sondern den roten Hering - den hatte Irratino nicht, er hatte den Stab bei den Plüschsitzen. Obsidian war mit dem Wein am Imbissstand, der Hering durfte nicht auf die Bühne: Der Präsident war am Notausgang, Midnight III mit dem Filmpreis auf der Bühne.",
      marks: [
        { a: "midnight-iii", b: "stage", value: "check" },
        { a: "president", b: "exit", value: "check" },
        { a: "award", b: "stage", value: "check" },
        { a: "herring", b: "exit", value: "check" },
        { a: "wine", b: "concessions", value: "check" },
        { a: "award", b: "studio", value: "check" },
        { a: "stage", b: "studio", value: "check" },
        { a: "herring", b: "power", value: "check" },
        { a: "exit", b: "power", value: "check" },
        { a: "wine", b: "revenge", value: "check" },
        { a: "concessions", b: "revenge", value: "check" },
        { a: "irratino", b: "wand", value: "check" },
        { a: "irratino", b: "seating", value: "check" },
        { a: "irratino", b: "oil", value: "check" },
        { a: "wand", b: "oil", value: "check" },
        { a: "seating", b: "oil", value: "check" },
      ],
    },
  ],
};

/**
 * Whether the Academy of Moving Images fits: whoever was at the concessions
 * stand is a member, so has black hair.
 *
 * @param scene - one way it could have been
 * @returns whether the one at the concessions stand has black hair
 */
function academyFits(scene: Scene): boolean {
  return scene.at("concessions").hair === "black";
}
