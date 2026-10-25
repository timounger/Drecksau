/**
 * Case 69, "The Magical Mystery Murder": the booker of the Magic Palace.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Hard Boiled), from the photos of
 * the book. The book blacks out Mister Shadow's height, eyes and hair, and
 * so does his card here; no clue asks for them.
 *
 * One clue needs Exhibit C, the labyrinth on the ancient ruins, which the
 * photos do not show: chamber 2 is joined to the initial of a suspect who
 * did not want to steal an idea. The initials are S, R, A and S, and the
 * letters of the labyrinth spell LUNAR ONE I (case 68) and AUREOLIN (case
 * 69) - so only R or A can be meant, and only A makes the case solvable. The
 * clue here therefore names the A outright. The scrambled note reads "A
 * Virgo had a furry white menace"; here it is scrambled again in German,
 * letter by letter within each word. The solver found the only solution,
 * and the hints are our own.
 */
import { REDACTED_HEIGHT, type Case } from "../engine/types";

/** The case. */
export const THE_MAGICAL_MYSTERY_MURDER: Case = {
  id: "the-magical-mystery-murder",
  number: 69,
  title: "Magical Mystery Mord",
  story:
    "Deductive Logico erkannte, dass AUREOLIN ein Anagramm der Buchstaben auf den alten Ruinen war - und das konnte kein Zufall sein. Also kaufte er Karten für den Zauberpalast, um sie zur Rede zu stellen. Doch als er ankam, war der Booker getötet worden. War es Aureolin? Oder gab es an diesem Abend zwei Mörder im Palast?",
  series: "volume1",
  difficulty: "hardBoiled",
  suspects: [
    {
      id: "shadow",
      name: "Mister Shadow",
      icon: "\u{1F575}️",
      description:
        "Eine Silhouette im Schatten. Er bewegt sich wie der Wind und sieht aus wie die Nacht.",
      heightCm: REDACTED_HEIGHT,
      hand: "left",
      eyes: "redacted",
      hair: "redacted",
      sign: "aquarius",
    },
    {
      id: "raven",
      name: "Hochalchemist Raven",
      icon: "⚗️",
      description:
        "Es gibt einen alten Witz, dass alle Alchemisten high sind. Raven hasst ihn.",
      heightCm: 173,
      hand: "right",
      eyes: "lightBrown",
      hair: "darkBrown",
      sign: "pisces",
    },
    {
      id: "aureolin",
      name: "Die unglaubliche Aureolin",
      icon: "\u{1FA84}",
      description:
        "Sie ist vor einer Weile aus dem Gefängnis gekommen - schließlich ist sie eine Meisterin der Entfesselung.",
      heightCm: 168,
      hand: "left",
      eyes: "green",
      hair: "blond",
      sign: "aries",
    },
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
  ],
  locations: [
    {
      id: "piano-room",
      name: "das Klavierzimmer",
      icon: "\u{1F3B9}",
      description:
        "In diesem geheimnisvollen Raum steht ein Klavier, das von selbst spielt! Ist es ein Geist - oder schlecht bezahlte Arbeit ohne Namensnennung?",
      indoors: true,
    },
    {
      id: "close-up",
      name: "der Close-up-Tisch",
      icon: "\u{1F590}️",
      description:
        "Hier sieht man Karten- und Münztricks ... und wer klug ist, auch nach seiner Brieftasche!",
      indoors: true,
    },
    {
      id: "main-stage",
      name: "die Hauptbühne",
      icon: "\u{1F3AD}",
      description:
        "Hier zeigen nur die besten oder bestvernetzten Zauberer Klassiker wie die Flucht aus der Milchkanne (danach ist überall Milch).",
      indoors: true,
    },
    {
      id: "parking-lot",
      name: "der Parkplatz",
      icon: "\u{1F17F}️",
      description: "Hier gibt es nur Parkservice, und der kostet ein Vermögen.",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "ace",
      name: "das Pik-Ass",
      icon: "♠️",
      description:
        "Fest genug geworfen, kann es eine Kehle aufschlitzen. Noch schlimmer: Man kann damit einen Kartentrick vorführen.",
      weight: "light",
      material: "Papier",
    },
    {
      id: "saw",
      name: "eine Säge",
      icon: "\u{1FA9A}",
      description:
        "Um eine Frau in zwei Hälften zu sägen - oder, ehrlich gesagt, um jeden in zwei Hälften zu sägen.",
      weight: "medium",
      material: "Metall und Holz",
    },
    {
      id: "rabbit",
      name: "ein abgerichtetes bösartiges Kaninchen",
      icon: "\u{1F407}",
      description:
        "Prüf deinen Hut, bevor du ihn aufsetzt. Vielleicht sitzt eine flauschige weiße Bedrohung darin.",
      weight: "medium",
      material: "Kaninchen",
    },
    {
      id: "liquor",
      name: "eine Flasche billiger Schnaps",
      icon: "\u{1F37E}",
      description:
        "Vergällt und tödlich, mit nur einem Hauch von Methanol im Abgang.",
      weight: "light",
      material: "Glas und Chemikalien",
    },
  ],
  motives: [
    { id: "idea", name: "eine Idee stehlen", icon: "\u{1F4A1}" },
    {
      id: "secret",
      name: "ein magisches Geheimnis schützen",
      icon: "\u{1F92B}",
    },
    { id: "code", name: "weil er den Kodex gebrochen hat", icon: "\u{1F494}" },
    { id: "ghost", name: "ein Geist hat es befohlen", icon: "\u{1F47B}" },
  ],
  clues: [
    {
      text: "Wer womöglich getötet hat, weil ein Geist es befohlen hat, war Rechtshänder.",
      holds: (scene) => scene.driven("ghost").hand === "right",
    },
    {
      text: "Logico fand eine Quittung über eine riesige Rechnung und eine verwürfelte Notiz: ENIE NUAGRJUF THETA EIEN LCSUAHFGIE ESESIW GUONEDRBH.",
      holds: (scene) => scene.holder("rabbit").sign === "virgo",
    },
    {
      text: "Im Labyrinth auf den alten Ruinen ist Kammer 2 mit dem A verbunden - dem Anfangsbuchstaben des Nachnamens eines Verdächtigen, der keine Idee stehlen wollte. (Im Buch: siehe Beweisstück C.)",
      holds: (scene) => scene.motiveOf("aureolin")?.id !== "idea",
    },
    {
      text: "Wer im Klavierzimmer war, hatte eine leichte Waffe.",
      holds: (scene) =>
        scene.weaponOf(scene.at("piano-room").id).weight === "light",
    },
    {
      text: "Hochalchemist Raven hatte eine mittelschwere Waffe mitgebracht.",
      holds: (scene) => scene.weaponOf("raven").weight === "medium",
    },
    {
      text: "Wer ein magisches Geheimnis schützen wollte, hatte eine Waffe aus Papier.",
      holds: (scene) =>
        scene.weaponOf(scene.driven("secret").id).material === "Papier",
    },
    {
      text: "Die unglaubliche Aureolin stand in einer Milchpfütze.",
      holds: (scene) => scene.locationOf("aureolin").id === "main-stage",
    },
    {
      text: "Wer töten würde, weil das Opfer den Kodex gebrochen hat, war am Close-up-Tisch.",
      holds: (scene) =>
        scene.locationOf(scene.driven("code").id).id === "close-up",
    },
  ],
  body: {
    text: "Der Booker war in zwei Hälften gesägt worden.",
    weapon: "saw",
  },
  solution: {
    shadow: { weapon: "liquor", location: "piano-room", motive: "idea" },
    raven: { weapon: "saw", location: "parking-lot", motive: "ghost" },
    aureolin: { weapon: "ace", location: "main-stage", motive: "secret" },
    smoky: { weapon: "rabbit", location: "close-up", motive: "code" },
  },
  murderer: "raven",
  hints: [
    {
      text: "Deductive Logico entdeckte mithilfe von Mortarot-Karten einen Haufen Sägespäne unter dem Auto von irgendwem. (Dann entdeckte er, dass Zauberkünstler Mortarot-Karten nicht mögen: Das ist eine ganz andere Art von Magie.)",
      book: true,
    },
    {
      text: 'Die Notiz, Wort für Wort entwürfelt: "EINE JUNGFRAU HATTE EINE FLAUSCHIGE WEISSE BEDROHUNG." Die einzige Jungfrau ist Superfan Smoky: Er hatte das Kaninchen.',
      marks: [{ a: "smoky", b: "rabbit", value: "check" }],
    },
    {
      text: "Rechtshänder ist nur Hochalchemist Raven - ihm hat ein Geist den Mord befohlen. Seine Waffe war mittelschwer, und das Kaninchen hat Smoky: Raven hatte die Säge.",
      marks: [
        { a: "raven", b: "ghost", value: "check" },
        { a: "raven", b: "saw", value: "check" },
      ],
    },
    {
      text: "Die Milchpfütze ist auf der Hauptbühne (die Flucht aus der Milchkanne): Dort stand Aureolin. Ins Klavierzimmer gehört eine leichte Waffe, also weder Raven noch Smoky. Und an den Close-up-Tisch gehört, wer den Kodex rächen wollte - nicht Raven. Raven war auf dem Parkplatz.",
      marks: [
        { a: "aureolin", b: "main-stage", value: "check" },
        { a: "close-up", b: "code", value: "check" },
        { a: "raven", b: "parking-lot", value: "check" },
      ],
    },
    {
      text: "Smoky mit dem mittelschweren Kaninchen war nicht im Klavierzimmer, also am Close-up-Tisch - er tötete wegen des gebrochenen Kodex. Mister Shadow bleibt das Klavierzimmer.",
      marks: [
        { a: "smoky", b: "close-up", value: "check" },
        { a: "smoky", b: "code", value: "check" },
        { a: "rabbit", b: "close-up", value: "check" },
        { a: "rabbit", b: "code", value: "check" },
        { a: "shadow", b: "piano-room", value: "check" },
      ],
    },
    {
      text: "Aureolin wollte laut dem Labyrinth keine Idee stehlen, also ein magisches Geheimnis schützen - mit dem Pik-Ass aus Papier. Mister Shadow wollte die Idee stehlen und hatte den billigen Schnaps.",
      marks: [
        { a: "aureolin", b: "ace", value: "check" },
        { a: "aureolin", b: "secret", value: "check" },
        { a: "ace", b: "secret", value: "check" },
        { a: "shadow", b: "liquor", value: "check" },
        { a: "shadow", b: "idea", value: "check" },
        { a: "liquor", b: "idea", value: "check" },
      ],
    },
    {
      text: "Der Booker wurde zersägt: Hochalchemist Raven tötete ihn mit der Säge auf dem Parkplatz, weil ein Geist es befohlen hat.",
      marks: [
        { a: "saw", b: "parking-lot", value: "check" },
        { a: "saw", b: "ghost", value: "check" },
        { a: "parking-lot", b: "ghost", value: "check" },
        { a: "liquor", b: "piano-room", value: "check" },
        { a: "piano-room", b: "idea", value: "check" },
        { a: "ace", b: "main-stage", value: "check" },
        { a: "main-stage", b: "secret", value: "check" },
      ],
    },
  ],
};
