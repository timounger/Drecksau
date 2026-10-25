/**
 * Case 91, "They Bill You Double for Dying": a lawyer at an entertainment law
 * firm.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Impossible). The sequel to case 22,
 * "Abgerechnet wird zum Schluss", and titled after it. Motives and
 * statements, no body clue - the liar is the murderer. The scrambled note
 * reads "The person who would kill out of frustration was in the archives";
 * here it is scrambled again in German, letter by letter within each word.
 * The book's hint comes first; the other hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const THEY_BILL_YOU_DOUBLE_FOR_DYING: Case = {
  id: "they-bill-you-double-for-dying",
  number: 91,
  title: "Abgerechnet wird zum Schluss - doppelt",
  story:
    "Logico fuhr zu einer Kanzlei für Unterhaltungsrecht, die man ihm empfohlen hatte. Doch als er dort ankam und die Größe der Lobby sah, wusste er sofort, dass sie zu teuer für ihn war. Zum Glück war gerade ein Anwalt ermordet worden, also bot er an, den Fall gegen einen Rabatt zu lösen.",
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
      id: "blaxton",
      name: "Schreiberling Blaxton",
      icon: "✍️",
      description:
        "Es war ihm ein wenig peinlich, hier seinem Bruder zu begegnen, denn er hatte seinen Nachnamen geändert.",
      heightCm: 183,
      hand: "right",
      eyes: "lightBrown",
      hair: "bald",
      sign: "sagittarius",
    },
    {
      id: "pine",
      name: "Richterin Pine",
      icon: "\u{1F469}‍⚖️",
      description:
        "Herrin des Gerichtssaals und von festem Glauben an die Gerechtigkeit beseelt - so, wie allein sie sie festlegt.",
      heightCm: 168,
      hand: "right",
      eyes: "darkBrown",
      hair: "black",
      sign: "taurus",
    },
    {
      id: "blackstone",
      name: "Blackstone, Esq.",
      icon: "⚖️",
      description:
        "Unglaublich begabt in der wichtigsten Fähigkeit eines Anwalts: eine Stelle in einer anderen Kanzlei zu finden, wenn man aus der ersten wegen Mordes geflogen ist.",
      heightCm: 183,
      hand: "right",
      eyes: "black",
      hair: "black",
      sign: "scorpio",
    },
  ],
  locations: [
    {
      id: "partners-office",
      name: "das Büro eines Partners",
      icon: "\u{1F5BC}️",
      description:
        "Fotos des Partners mit jedem Staatsoberhaupt der Welt, vor allem mit den schlimmen.",
      indoors: true,
    },
    {
      id: "archives",
      name: "das Archiv",
      icon: "\u{1F4DA}",
      description:
        "Uralte Gesetzbücher bis zurück zum Codex Hammurapi. Die gehören in ein Museum.",
      indoors: true,
    },
    {
      id: "break-room",
      name: "der Pausenraum",
      icon: "☕",
      description:
        "Ein Barista in Vollzeit, ein begehbarer Kühlschrank und ein Brunnen voller unbezahlbarem Wein.",
      indoors: true,
    },
    {
      id: "lobby",
      name: "die Lobby",
      icon: "⛲",
      description:
        "Neben dieser Lobby sieht die Lobby der anderen Kanzlei aus wie das Klo eines Gebrauchtwagenhändlers.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "paperwork",
      name: "ein riesiger Stapel Akten",
      icon: "\u{1F4C4}",
      description:
        "Vor allem Verträge über den Kauf von Land für die Drehorte von Murdle: Der Film.",
      weight: "heavy",
      material: "Papier",
    },
    {
      id: "cash",
      name: "ein Sack Bargeld",
      icon: "\u{1F4B0}",
      description:
        "Bestens geeignet für Bestechung oder ganz allgemein Korruption.",
      weight: "heavy",
      material: "Stoff und Papier",
    },
    {
      id: "pen",
      name: "ein goldener Füller",
      icon: "\u{1F58B}️",
      description: "Mit diesem Füller wurde die Magna Carta unterzeichnet.",
      weight: "light",
      material: "Metall und Tinte",
    },
    {
      id: "clock",
      name: "eine antike Uhr",
      icon: "\u{1F570}️",
      description:
        "Tick, tack, tick, tack. Genau genommen bringt uns die Zeit alle langsam um.",
      weight: "heavy",
      material: "Holz und Metall",
    },
  ],
  motives: [
    { id: "revenge", name: "Rache nehmen", icon: "⚔️" },
    {
      id: "real-estate",
      name: "im Rahmen eines Immobilienbetrugs",
      icon: "\u{1F3E0}",
    },
    { id: "frustration", name: "aus Frust", icon: "\u{1F620}" },
    {
      id: "percentage",
      name: "eine höhere Provision bekommen",
      icon: "\u{1F4AF}",
    },
  ],
  clues: [
    {
      text: "Wer im Rahmen eines Immobilienbetrugs töten wollte, hatte schwarze Haare.",
      holds: (scene) => scene.driven("real-estate").hair === "black",
    },
    {
      text: "Wer eine höhere Provision bekommen wollte, hatte hellbraune Augen.",
      holds: (scene) => scene.driven("percentage").eyes === "lightBrown",
    },
    {
      text: "Eine Sekretärin hatte schnell einen verwürfelten Zettel geschrieben und Logico gegeben: EWR UAS USFRT TNÖET WREÜD, WRA MI ICRAVH.",
      holds: (scene) =>
        scene.locationOf(scene.driven("frustration").id).id === "archives",
    },
    {
      text: "Wer den goldenen Füller hatte, wollte Rache nehmen.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("pen").id)?.id === "revenge",
    },
    {
      text: "Ein Schütze wurde gesehen, wie er mit dem Barista flirtete.",
      holds: (scene) => scene.locationOf("blaxton").id === "break-room",
    },
    {
      text: "Neben dem Bild eines Diktators war ein leises Ticken zu hören.",
      holds: (scene) =>
        scene.locationOf(scene.holder("clock").id).id === "partners-office",
    },
  ],
  statements: [
    {
      by: "argyle",
      text: "So sieht der Deal aus: Schreiberling Blaxton hatte einen Sack Bargeld dabei.",
      holds: (scene) => scene.weaponOf("blaxton").id === "cash",
    },
    {
      by: "blaxton",
      text: "Stellen Sie sich vor: Ein riesiger Stapel Akten war in der Lobby.",
      holds: (scene) =>
        scene.locationOf(scene.holder("paperwork").id).id === "lobby",
    },
    {
      by: "pine",
      text: "Von Rechts wegen: Wer die antike Uhr hatte, wollte eine höhere Provision bekommen.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("clock").id)?.id === "percentage",
    },
    {
      by: "blackstone",
      text: "Meine Aussage bekommen Sie jetzt, meine Rechnung später: Richterin Pine hatte einen riesigen Stapel Akten dabei.",
      holds: (scene) => scene.weaponOf("pine").id === "paperwork",
    },
  ],
  solution: {
    argyle: {
      weapon: "clock",
      location: "partners-office",
      motive: "percentage",
    },
    blaxton: { weapon: "pen", location: "break-room", motive: "revenge" },
    pine: { weapon: "paperwork", location: "lobby", motive: "real-estate" },
    blackstone: { weapon: "cash", location: "archives", motive: "frustration" },
  },
  murderer: "argyle",
  hints: [
    {
      text: 'Inspektor Irratino befragte einen Traum, den er geträumt hatte, und schickte Logico seine Erklärung per E-Mail: "Richterin Pine hatte einen riesigen Stapel Akten. - II"',
      book: true,
      marks: [{ a: "pine", b: "paperwork", value: "check" }],
    },
    {
      text: 'Der Zettel, Wort für Wort entwürfelt: "WER AUS FRUST TÖTEN WÜRDE, WAR IM ARCHIV." Blaxton ist der Schütze und war im Pausenraum - also nicht im Büro des Partners (dort tickt die Uhr) und nicht im Archiv (dort ist, wer aus Frust tötet).',
      marks: [
        { a: "blaxton", b: "break-room", value: "check" },
        { a: "clock", b: "partners-office", value: "check" },
        { a: "archives", b: "frustration", value: "check" },
      ],
    },
    {
      text: "Probiere, ob Argyle die Wahrheit sagt: Dann hat Blaxton das Bargeld, also nicht den Füller (Rache). Frust geht nicht (Archiv), Immobilienbetrug nicht (Glatze) - er will die höhere Provision. Dann lügt Pine, denn die Uhr hat nicht Blaxton. Blackstone und Blaxton sagen dann die Wahrheit: Pine hat die Akten in der Lobby. Argyle und Blackstone bleiben Uhr und Füller, Büro und Archiv - doch im Archiv ist, wer aus Frust tötet, und der hat weder die Uhr (Büro) noch den Füller (Rache). Widerspruch.",
      marks: [
        { a: "blaxton", b: "pen", value: "check" },
        { a: "blaxton", b: "revenge", value: "check" },
        { a: "pen", b: "revenge", value: "check" },
        { a: "pine", b: "lobby", value: "check" },
        { a: "paperwork", b: "lobby", value: "check" },
        { a: "argyle", b: "clock", value: "check" },
        { a: "argyle", b: "partners-office", value: "check" },
        { a: "blackstone", b: "archives", value: "check" },
        { a: "blackstone", b: "frustration", value: "check" },
      ],
    },
    {
      text: "Also lügt Agent Argyle - er ist der Mörder. Die anderen sagen die Wahrheit: Pine hat die Akten in der Lobby. Blaxton hat weder Bargeld noch Uhr noch Akten, also den goldenen Füller, und will Rache.",
    },
    {
      text: "Wer die Uhr hat, will laut Pine eine höhere Provision - und hat damit hellbraune Augen: Argyle, mit der antiken Uhr im Büro des Partners. Blackstone hat das Bargeld im Archiv und tötet aus Frust; Pine (schwarze Haare) will den Immobilienbetrug.",
      marks: [
        { a: "argyle", b: "percentage", value: "check" },
        { a: "clock", b: "percentage", value: "check" },
        { a: "partners-office", b: "percentage", value: "check" },
        { a: "blackstone", b: "cash", value: "check" },
        { a: "cash", b: "archives", value: "check" },
        { a: "cash", b: "frustration", value: "check" },
        { a: "pen", b: "break-room", value: "check" },
        { a: "break-room", b: "revenge", value: "check" },
        { a: "pine", b: "real-estate", value: "check" },
        { a: "paperwork", b: "real-estate", value: "check" },
        { a: "lobby", b: "real-estate", value: "check" },
      ],
    },
  ],
};
