/**
 * Case 26, "The Murder of a Mailman": a mailman killed at the post office.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Occult Medium). The murderer lies,
 * everyone else tells the truth; there is no body clue - the liar is the
 * murderer. The photo of the mail truck's card is blurred where it says
 * indoors or outdoors; no clue asks, and it is taken as indoors. The
 * photographed pages print neither hint nor solution; the solver found the
 * only one, and the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const THE_MURDER_OF_A_MAILMAN: Case = {
  id: "the-murder-of-a-mailman",
  number: 26,
  title: "Der Briefträger klingelt nie mehr",
  story:
    "Deductive Logico wollte in sein Postfach schauen, doch statt eines Tantiemenschecks für Murdle fand er einen getöteten Briefträger - und die ganze Filiale war geschlossen. Weder Regen noch Sonnenschein halten die Post auf, dachte Logico, aber beim ersten Anzeichen von Mord machen sie dicht ...",
  series: "volume1",
  difficulty: "occult",
  suspects: [
    {
      id: "crimson",
      name: "Dr. Crimson",
      icon: "\u{1FA7A}",
      description:
        "Sie ist die klügste Ärztin, die sie je getroffen hat - sagt sie selbst, und wahrscheinlich hat sie recht. Ja, sie ernährt sich furchtbar, aber wenn sie einen Herzinfarkt bekommt, operiert sie sich eben selbst.",
      heightCm: 175,
      hand: "left",
      eyes: "green",
      hair: "red",
      sign: "aquarius",
    },
    {
      id: "honey",
      name: "Bürgermeister Honey",
      icon: "\u{1F3A9}",
      description:
        "Er weiß, wo die Leichen vergraben sind - und sorgt dafür, dass sie immer für ihn stimmen.",
      heightCm: 183,
      hand: "left",
      eyes: "hazel",
      hair: "lightBrown",
      sign: "scorpio",
    },
    {
      id: "coffee",
      name: "General Coffee",
      icon: "☕",
      description:
        "Ein Espressokenner, dem am Morgen der Duft von Kaffee lieber ist als der von Napalm.",
      heightCm: 183,
      hand: "right",
      eyes: "darkBrown",
      hair: "bald",
      sign: "sagittarius",
    },
  ],
  locations: [
    {
      id: "mail-truck",
      name: "ein Postauto",
      icon: "\u{1F69A}",
      description:
        "Praktisch unzerstörbar und deshalb ideal für Spritztouren - solange man nicht selbst das Benzin bezahlt.",
      indoors: true,
    },
    {
      id: "long-line",
      name: "die lange Schlange",
      icon: "\u{1F9CD}",
      description:
        "Leute, die in der Schlange stehen und darauf warten, ihre Briefe aufzugeben.",
      indoors: false,
    },
    {
      id: "sorting-room",
      name: "der Sortierraum",
      icon: "\u{1F4EC}",
      description:
        "Hier sortieren die Postangestellten Werbung, Rechnungen und Kataloge mit einer großen Maschine.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "letter-opener",
      name: "ein Brieföffner",
      icon: "\u{1F5E1}️",
      description:
        "Ein scharfes Messer für Leute, die ihre Briefe nicht einfach aufreißen wollen.",
      weight: "light",
    },
    {
      id: "stamp",
      name: "ein Stempel",
      icon: "\u{1F4EE}",
      description: "Ein Stempel zum Abstempeln von Briefmarken.",
      weight: "medium",
    },
    {
      id: "package",
      name: "ein schweres Paket",
      icon: "\u{1F381}",
      description:
        "Mit einer hübschen roten Schleife, die Blutflecken verbirgt.",
      weight: "heavy",
    },
  ],
  clues: [
    {
      text: 'Brieföffner sind im Sortierraum seit "dem Vorfall" verboten, und an diese Regel hat sich heute auch jeder gehalten.',
      holds: (scene) =>
        scene.locationOf(scene.holder("letter-opener").id).id !==
        "sorting-room",
    },
    {
      text: "Die Person mit dem schweren Paket schämte sich für ihre Glatze und wäre froh, wenn sie in den Hinweisen nicht erwähnt würde.",
      holds: (scene) => scene.holder("package").hair === "bald",
    },
  ],
  statements: [
    {
      by: "crimson",
      text: "Ich habe einen Stempel mitgebracht.",
      holds: (scene) => scene.weaponOf("crimson").id === "stamp",
    },
    {
      by: "honey",
      text: "Dr. Crimson war nicht im Postauto.",
      holds: (scene) => scene.locationOf("crimson").id !== "mail-truck",
    },
    {
      by: "coffee",
      text: "Ein Brieföffner war im Postauto.",
      holds: (scene) =>
        scene.locationOf(scene.holder("letter-opener").id).id === "mail-truck",
    },
  ],
  exhibits: ["astrology"],
  solution: {
    crimson: { weapon: "stamp", location: "sorting-room" },
    honey: { weapon: "letter-opener", location: "long-line" },
    coffee: { weapon: "package", location: "mail-truck" },
  },
  murderer: "coffee",
  hints: [
    {
      text: 'Logico sah endlich in seinen Briefkasten und fand einen mysteriösen roten Umschlag. Außen hatte jemand daraufgekritzelt: "Du kannst Bürgermeister Honey trauen."',
      book: true,
    },
    {
      text: "Eine Glatze hat nur General Coffee: Er hatte das schwere Paket. Brieföffner und Stempel teilen sich also Dr. Crimson und Bürgermeister Honey.",
      marks: [{ a: "coffee", b: "package", value: "check" }],
    },
    {
      text: "Probiere aus, wer lügt. Lügt Dr. Crimson, hatte sie den Brieföffner. Coffee sagt dann die Wahrheit: Der Brieföffner war im Postauto - also war Crimson dort. Honey sagt aber ebenso wahr, dass Crimson nicht im Postauto war. Das geht nicht.",
      marks: [{ a: "coffee", b: "mail-truck", value: "check" }],
    },
    {
      text: "Lügt Bürgermeister Honey, war Dr. Crimson im Postauto. Crimson sagt die Wahrheit und hatte den Stempel, Honey also den Brieföffner. Laut Coffee wäre der Brieföffner - und damit Honey - im Postauto, wo schon Crimson ist. Auch das geht nicht.",
      marks: [
        { a: "crimson", b: "stamp", value: "check" },
        { a: "honey", b: "letter-opener", value: "check" },
      ],
    },
    {
      text: "Also lügt General Coffee: Der Brieföffner war nicht im Postauto. Crimson hatte den Stempel, Honey den Brieföffner, und Crimson war nicht im Postauto. Dort war also Coffee.",
    },
    {
      text: "Brieföffner waren im Sortierraum verboten: Honey stand in der langen Schlange, Crimson war im Sortierraum. General Coffee ist der Mörder - mit dem schweren Paket im Postauto.",
      marks: [
        { a: "crimson", b: "sorting-room", value: "check" },
        { a: "honey", b: "long-line", value: "check" },
        { a: "letter-opener", b: "long-line", value: "check" },
        { a: "package", b: "mail-truck", value: "check" },
        { a: "stamp", b: "sorting-room", value: "check" },
      ],
    },
  ],
};
