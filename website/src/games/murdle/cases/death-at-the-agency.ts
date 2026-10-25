/**
 * Case 90, "Death at the Agency": a client of a talent agency in the Black
 * Tower.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Impossible). Motives and statements,
 * no body clue - the liar is the murderer. The scrambled report reads "Agent
 * Argyle was seen in the mail room with an award because he wanted to take
 * over a studio"; here it is scrambled again in German, letter by letter
 * within each word. The book's hint comes first; the other hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const DEATH_AT_THE_AGENCY: Case = {
  id: "death-at-the-agency",
  number: 90,
  title: "Tod in der Agentur",
  story:
    "Ein wenig erschüttert von all den Morden im Studio ging Deductive Logico zu einer Talentagentur in einem Gebäude namens Schwarzer Turm, um zu sehen, ob er aus seinem Vertrag herauskam. Dort entdeckte er, dass ein Klient getötet worden war. Das schien niemanden zu stören, denn der hatte seit Jahren keinen Film mit Gewinn gemacht.",
  series: "volume1",
  difficulty: "impossible",
  suspects: [
    {
      id: "argyle",
      name: "Agent Argyle",
      icon: "\u{1F454}",
      description:
        "Anders als Agent Ink hat Argyle kein Herz aus Gold. Eigentlich überhaupt kein Herz.",
      heightCm: 193,
      hand: "right",
      eyes: "lightBrown",
      hair: "darkBrown",
      sign: "virgo",
    },
    {
      id: "celadon",
      name: "Ministerin Celadon",
      icon: "\u{1FA96}",
      description:
        "Die Verteidigungsministerin - und persönlich verantwortlich für eine Reihe gescheiterter Staaten, von denen einige inzwischen nach ihr benannt sind.",
      heightCm: 168,
      hand: "left",
      eyes: "green",
      hair: "lightBrown",
      sign: "leo",
    },
    {
      id: "president",
      name: "Präsident Midnight",
      icon: "\u{1F3A9}",
      description:
        "Der Chef von Midnight Movies. Ihm geht es um seine Söhne und um sein Vermächtnis, aber nicht in dieser Reihenfolge.",
      heightCm: 188,
      hand: "right",
      eyes: "black",
      hair: "black",
      sign: "capricorn",
    },
    {
      id: "blaxton",
      name: "Schreiberling Blaxton",
      icon: "✍️",
      description:
        "Einer der bestbezahlten Drehbuchautoren Hollywoods - und einer der schlechtesten.",
      heightCm: 183,
      hand: "right",
      eyes: "lightBrown",
      hair: "bald",
      sign: "sagittarius",
    },
  ],
  locations: [
    {
      id: "mail-room",
      name: "die Poststelle",
      icon: "✉️",
      description:
        "Hier fängt man an. Und wer klug ist, fängt an, die Briefe seiner Rivalen zu öffnen.",
      indoors: true,
    },
    {
      id: "balcony",
      name: "der Balkon",
      icon: "\u{1F3DB}️",
      description: "Hier blickt man auf die Stadt hinab, die man beherrscht.",
      indoors: true,
    },
    {
      id: "lobby",
      name: "die Lobby",
      icon: "⛲",
      description:
        "Ihre Lobby ist doppelt so groß wie die jeder Literaturagentur. Die Stimme hallt wie in einer Höhle.",
      indoors: true,
    },
    {
      id: "best-office",
      name: "das beste Büro",
      icon: "\u{1F5C4}️",
      description:
        "Der Agent mit dem besten Umsatz des Monats bekommt dieses Büro. Der schlechteste wird getötet.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "knife",
      name: "ein Stahlmesser",
      icon: "\u{1F52A}",
      description:
        "Um Leuten in den Rücken zu fallen und ihnen die Klienten zu stehlen.",
      weight: "medium",
      material: "Metall",
    },
    {
      id: "award",
      name: "ein Filmpreis",
      icon: "\u{1F3C6}",
      description:
        "Ein offensichtlich nicht ganz so angesehener Hollywood-Preis.",
      weight: "medium",
      material: "Metall",
    },
    {
      id: "gloves",
      name: "Lederhandschuhe",
      icon: "\u{1F9E4}",
      description:
        "Hüte dich vor denen, die Lederhandschuhe tragen. Eine Kuh haben sie schon getötet: Wer ist der Nächste?!",
      weight: "light",
      material: "Leder",
    },
    {
      id: "contract",
      name: "ein tausendseitiger Vertrag",
      icon: "\u{1F4C4}",
      description:
        "Unterschreib und verschreib deine Rechte, dein Leben und deine Zukunft.",
      weight: "heavy",
      material: "Papier",
    },
  ],
  motives: [
    { id: "point", name: "etwas beweisen", icon: "\u{1F446}" },
    {
      id: "witness",
      name: "einen Zeugen zum Schweigen bringen",
      icon: "\u{1F910}",
    },
    { id: "studio", name: "ein Studio übernehmen", icon: "\u{1F3A5}" },
    { id: "religion", name: "aus religiösen Gründen", icon: "\u{1F64F}" },
  ],
  clues: [
    {
      text: "Wer das Stahlmesser hatte, wollte nichts beweisen.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("knife").id)?.id !== "point",
    },
    {
      text: "Ministerin Celadon gehörte zum Orden des Schwarzen Todes.",
      holds: () => true,
    },
    {
      text: "Ein Rindslederhandschuh wurde in einem höhlenartigen Raum gefunden.",
      holds: (scene) =>
        scene.locationOf(scene.holder("gloves").id).id === "lobby",
    },
    {
      text: "Wer einen Zeugen zum Schweigen bringen wollte, war auf dem Balkon.",
      holds: (scene) =>
        scene.locationOf(scene.driven("witness").id).id === "balcony",
    },
    {
      text: "Alle Mitglieder des Ordens des Schwarzen Todes hatten ein Motiv, aus religiösen Gründen zu töten.",
      holds: (scene) => scene.motiveOf("celadon")?.id === "religion",
    },
    {
      text: "Jemand ohne Haare hatte ein Dokument dabei, mit dem man sein Leben verschreibt.",
      holds: (scene) => scene.holder("contract").hair === "bald",
    },
    {
      text: "Über einen der Verdächtigen wurde ein ausführlicher Bericht verfasst, dann hastig auf einen Zettel gekritzelt und Logico zugesteckt: GEATN RLAEYG RUEWD IMT MEENI MRISEFPLI NI ERD TELOSESPTL ESGEEHN, WLIE RE ENI SIDOTU MNENRHÜEEB TLELWO.",
      holds: (scene) =>
        scene.weaponOf("argyle").id === "award" &&
        scene.locationOf("argyle").id === "mail-room" &&
        scene.motiveOf("argyle")?.id === "studio",
    },
  ],
  statements: [
    {
      by: "argyle",
      text: "Ein tausendseitiger Vertrag war nicht in der Lobby.",
      holds: (scene) =>
        scene.locationOf(scene.holder("contract").id).id !== "lobby",
    },
    {
      by: "celadon",
      text: "Schreiberling Blaxton hatte keine Lederhandschuhe dabei.",
      holds: (scene) => scene.weaponOf("blaxton").id !== "gloves",
    },
    {
      by: "president",
      text: "Als Präsident sage ich: Ministerin Celadon war im besten Büro.",
      holds: (scene) => scene.locationOf("celadon").id === "best-office",
    },
    {
      by: "blaxton",
      text: "Präsident Midnight war nicht in der Poststelle.",
      holds: (scene) => scene.locationOf("president").id !== "mail-room",
    },
  ],
  solution: {
    argyle: { weapon: "award", location: "mail-room", motive: "studio" },
    celadon: { weapon: "gloves", location: "lobby", motive: "religion" },
    president: { weapon: "knife", location: "balcony", motive: "witness" },
    blaxton: { weapon: "contract", location: "best-office", motive: "point" },
  },
  murderer: "president",
  hints: [
    {
      text: 'Irratino hinterließ Logico eine Sprachnachricht, die rätselhaft klang: "Der größte Verdächtige war bei einem Haufen Briefe. Ich weiß das, weil ich eine Vision hatte, wie er auf die Briefe hinabblickte. Ich hatte auch Visionen von dir, Logico ..."',
      book: true,
    },
    {
      text: 'Der Zettel, Wort für Wort entwürfelt: "AGENT ARGYLE WURDE MIT EINEM FILMPREIS IN DER POSTSTELLE GESEHEN, WEIL ER EIN STUDIO ÜBERNEHMEN WOLLTE." Celadon ist im Orden, also will sie aus religiösen Gründen töten. Blaxton hat eine Glatze und den tausendseitigen Vertrag.',
      marks: [
        { a: "argyle", b: "award", value: "check" },
        { a: "argyle", b: "mail-room", value: "check" },
        { a: "argyle", b: "studio", value: "check" },
        { a: "celadon", b: "religion", value: "check" },
        { a: "award", b: "mail-room", value: "check" },
        { a: "award", b: "studio", value: "check" },
        { a: "mail-room", b: "studio", value: "check" },
        { a: "blaxton", b: "contract", value: "check" },
      ],
    },
    {
      text: "Prüfe die Aussagen: Der Vertrag ist bei Blaxton, die Handschuhe liegen in der höhlenartigen Lobby - Argyles Aussage stimmt also, und Celadons auch. In der Poststelle ist Argyle, also stimmt auch Blaxtons Aussage. Bleibt Präsident Midnight: Er lügt und ist der Mörder.",
      marks: [{ a: "celadon", b: "lobby", value: "check" }],
    },
    {
      text: "Celadon war also nicht im besten Büro - und nicht auf dem Balkon, denn dort ist, wer einen Zeugen zum Schweigen bringen will. Sie war in der Lobby und hatte die Lederhandschuhe. Der Präsident hat das Stahlmesser und will deshalb nichts beweisen, sondern einen Zeugen zum Schweigen bringen.",
      marks: [
        { a: "balcony", b: "witness", value: "check" },
        { a: "gloves", b: "lobby", value: "check" },
        { a: "president", b: "knife", value: "check" },
        { a: "president", b: "witness", value: "check" },
        { a: "knife", b: "witness", value: "check" },
      ],
    },
    {
      text: "Präsident Midnight war mit dem Stahlmesser auf dem Balkon, um einen Zeugen zum Schweigen zu bringen. Blaxton war im besten Büro und wollte etwas beweisen.",
      marks: [
        { a: "president", b: "balcony", value: "check" },
        { a: "knife", b: "balcony", value: "check" },
        { a: "blaxton", b: "best-office", value: "check" },
        { a: "blaxton", b: "point", value: "check" },
        { a: "best-office", b: "point", value: "check" },
        { a: "celadon", b: "gloves", value: "check" },
        { a: "gloves", b: "religion", value: "check" },
        { a: "lobby", b: "religion", value: "check" },
        { a: "contract", b: "best-office", value: "check" },
        { a: "contract", b: "point", value: "check" },
      ],
    },
  ],
};
