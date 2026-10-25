/**
 * Case 66, "Vive la Révolution!": a minor royal killed in one of the many
 * French revolutions.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Hard Boiled), from the photos of the
 * book. The membership clue and the rule for the members only count
 * together, so both carry what they say together: Amiral Marine had the
 * political treatise.
 *
 * The book's clue sends the reader to Exhibit C, the labyrinth on the ancient
 * ruins, which the photos do not show. Only one choice leaves exactly one
 * solution: the L is connected with the E of Eminence - with A (Amaranth) or
 * C (Champagne) two solutions would be left each. The clue therefore names
 * the E outright instead of pointing to the exhibit. The hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const VIVE_LA_REVOLUTION: Case = {
  id: "vive-la-revolution",
  number: 66,
  title: "Vive la Révolution!",
  story:
    "Als Logico das Archiv studierte, fand er heraus, dass die uralten Ruinen in einer der vielen, vielen Französischen Revolutionen eine kleine Rolle bei einem sonst großen Ereignis gespielt hatten: Ein einzelner Mord in einer Revolution ist wie ein einzelner Funke in einem Feuer. Diesmal war ein unbedeutender Adliger getötet worden.",
  series: "volume1",
  difficulty: "hardBoiled",
  suspects: [
    {
      id: "amaranth",
      name: "Président Amaranth",
      icon: "\u{1F1EB}\u{1F1F7}",
      description:
        "Der legendäre Président Amaranth, mit dem der heutige Präsident den Namen teilt. Er verbringt gern Zeit mit seinen Wählern - besonders mit einer gewissen Klasse von ihnen.",
      heightCm: 178,
      hand: "right",
      eyes: "gray",
      hair: "red",
      sign: "gemini",
    },
    {
      id: "marine",
      name: "Amiral Marine",
      icon: "⚓",
      description:
        "Amiral Marine ist der Sohn eines Amiral Marine, der selbst der Sohn eines Amiral Marine war.",
      heightCm: 175,
      hand: "right",
      eyes: "blue",
      hair: "lightBrown",
      sign: "cancer",
    },
    {
      id: "eminence",
      name: "Viscount Eminence",
      icon: "\u{1F474}",
      description:
        "Das kann eigentlich nicht sein, aber die Geschichtsbücher legen nahe, dass das kein Vorfahre von Viscount Eminence ist, sondern derselbe Mann.",
      heightCm: 157,
      hand: "left",
      eyes: "gray",
      hair: "darkBrown",
      sign: "pisces",
    },
    {
      id: "champagne",
      name: "Genosse Champagne",
      icon: "\u{1F942}",
      description:
        "Wohlgemerkt nicht der heutige Genosse Champagne und auch kein Vorfahre. Nur ein anderer Genosse, der ebenfalls gern Schampus trinkt.",
      heightCm: 180,
      hand: "left",
      eyes: "hazel",
      hair: "blond",
      sign: "capricorn",
    },
  ],
  locations: [
    {
      id: "ruins",
      name: "die alten Ruinen",
      icon: "\u{1F5FF}",
      description:
        "Die Texte erwähnen diese Steine auf rätselhafte Weise, als ob sie etwas verbergen würden.",
      indoors: false,
    },
    {
      id: "barricades",
      name: "die Barrikaden",
      icon: "\u{1F6A7}",
      description:
        "Die Art Guerilla-Befestigung, über die man ein Musical schreiben kann.",
      indoors: false,
    },
    {
      id: "bastille",
      name: "die Bastille",
      icon: "\u{1F3F0}",
      description:
        "Zu jedem Zeitpunkt der französischen Geschichte hat man diese Festung entweder gestürmt oder verteidigt.",
      indoors: true,
    },
    {
      id: "seine",
      name: "die Seine",
      icon: "\u{1F30A}",
      description:
        "Damals ein unglaublich verschmutzter Fluss. Nicht daraus trinken, nicht darin schwimmen, nicht berühren, nicht ansehen.",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "treatise",
      name: "eine politische Abhandlung",
      icon: "\u{1F4D6}",
      description:
        "Das dichteste Fachchinesisch zur Rechtfertigung von Gewalt, das du je gelesen hast - da passt es, damit zu töten.",
      weight: "medium",
      material: "Papier",
    },
    {
      id: "ballot",
      name: "eine Wahlurne",
      icon: "\u{1F5F3}️",
      description: "Jede Stimme zählt - besonders beim Gewicht dieser Urne.",
      weight: "heavy",
      material: "Holz und Papier",
    },
    {
      id: "torch",
      name: "eine Fackel",
      icon: "\u{1F525}",
      description:
        "Eine Fackel der Freiheit oder der Tyrannei - je nachdem, wer sie hält.",
      weight: "medium",
      material: "Holz und Feuer",
    },
    {
      id: "scepter",
      name: "ein heiliges Zepter",
      icon: "\u{1FA84}",
      description:
        "Ein uraltes heiliges Zepter, verehrt von allen Franzosen. Ihm fehlt ein Edelstein.",
      weight: "heavy",
      material: "Glas und Giftstoffe",
    },
  ],
  motives: [
    {
      id: "stop",
      name: "die Revolution aufhalten",
      icon: "\u{1F6AB}",
    },
    { id: "king", name: "König werden", icon: "\u{1F451}" },
    { id: "good", name: "für das Allgemeinwohl", icon: "\u{1F932}" },
    { id: "revolution", name: "für die Revolution", icon: "☭" },
  ],
  clues: [
    {
      text: "Eine Fackel erhellte die Hallen einer großen Festung.",
      holds: (scene) =>
        scene.locationOf(scene.holder("torch").id).id === "bastille",
    },
    {
      text: "Wer die Revolution aufhalten wollte, schmiedete in den alten Ruinen Pläne.",
      holds: (scene) =>
        scene.locationOf(scene.driven("stop").id).id === "ruins",
    },
    {
      text: "Amiral Marine war Mitglied der Trinker des dunklen Weins.",
      // Only counts together with the rule for the members below.
      holds: (scene) => scene.weaponOf("marine").id === "treatise",
    },
    {
      text: "In dem Labyrinth, das in die alten Ruinen eingemeißelt ist, ist das L mit dem E verbunden - dem ersten Buchstaben des Nachnamens der Person, die für die Revolution töten wollte.",
      holds: (scene) => scene.driven("revolution").id === "eminence",
    },
    {
      text: "Bei den Barrikaden wurde eine mit Stimmzetteln vollgestopfte Urne gefunden: Demokratie in Aktion!",
      holds: (scene) =>
        scene.locationOf(scene.holder("ballot").id).id === "barricades",
    },
    {
      text: "Genosse Champagne war ein Mann des Volkes: Er wollte nicht König werden.",
      holds: (scene) => scene.motiveOf("champagne")?.id !== "king",
    },
    {
      text: "Wer die Fackel hatte, wollte nicht für die Revolution töten.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("torch").id)?.id !== "revolution",
    },
    {
      text: "Die zweitgrößte verdächtige Person trieb sich an einem giftigen Fluss herum.",
      holds: (scene) => scene.locationOf("amaranth").id === "seine",
    },
    {
      text: "Mitglieder der Trinker des dunklen Weins mussten jederzeit eine politische Abhandlung bei sich tragen.",
      holds: (scene) => scene.weaponOf("marine").id === "treatise",
    },
  ],
  body: {
    text: "Neben dem Opfer wurde ein einzelner Edelstein gefunden.",
    weapon: "scepter",
  },
  solution: {
    amaranth: { weapon: "scepter", location: "seine", motive: "king" },
    marine: { weapon: "treatise", location: "ruins", motive: "stop" },
    eminence: {
      weapon: "ballot",
      location: "barricades",
      motive: "revolution",
    },
    champagne: { weapon: "torch", location: "bastille", motive: "good" },
  },
  murderer: "amaranth",
  hints: [
    {
      text: "Logico studierte die Texte bis ins kleinste Detail, bis er einen seltsamen Hinweis auf die schlanken Finger von Viscount Eminence fand, die eine Wahlurne umklammerten.",
      book: true,
      marks: [{ a: "eminence", b: "ballot", value: "check" }],
    },
    {
      text: "Genosse Champagne (1,80 m) ist der Größte, Président Amaranth (1,78 m) der Zweitgrößte: Amaranth war an der Seine, dem giftigen Fluss.",
      marks: [{ a: "amaranth", b: "seine", value: "check" }],
    },
    {
      text: "Amiral Marine gehört zu den Trinkern des dunklen Weins, also hatte er die politische Abhandlung. Die Fackel war in der Bastille, die Wahlurne bei den Barrikaden - Marine war also in den alten Ruinen und wollte die Revolution aufhalten.",
      marks: [
        { a: "marine", b: "treatise", value: "check" },
        { a: "marine", b: "ruins", value: "check" },
        { a: "ballot", b: "barricades", value: "check" },
        { a: "torch", b: "bastille", value: "check" },
      ],
    },
    {
      text: "Amaranth an der Seine hatte weder die Fackel (Bastille) noch die Urne (Barrikaden), sondern das heilige Zepter, dem der Edelstein fehlt: Er ist der Mörder.",
      marks: [
        { a: "amaranth", b: "scepter", value: "check" },
        { a: "scepter", b: "seine", value: "check" },
      ],
    },
    {
      text: "E ist der Anfangsbuchstabe von Eminence: Viscount Eminence wollte für die Revolution töten. Wer die Fackel hatte, wollte das nicht - Eminence hatte also die Wahlurne bei den Barrikaden, Champagne die Fackel in der Bastille.",
      marks: [
        { a: "eminence", b: "barricades", value: "check" },
        { a: "champagne", b: "torch", value: "check" },
        { a: "champagne", b: "bastille", value: "check" },
      ],
    },
    {
      text: "Champagne wollte nicht König werden, also für das Allgemeinwohl töten. Amaranth wollte König werden.",
      marks: [
        { a: "champagne", b: "good", value: "check" },
        { a: "amaranth", b: "king", value: "check" },
        { a: "scepter", b: "king", value: "check" },
        { a: "seine", b: "king", value: "check" },
        { a: "marine", b: "stop", value: "check" },
        { a: "treatise", b: "ruins", value: "check" },
        { a: "treatise", b: "stop", value: "check" },
        { a: "ruins", b: "stop", value: "check" },
        { a: "eminence", b: "revolution", value: "check" },
        { a: "ballot", b: "revolution", value: "check" },
        { a: "barricades", b: "revolution", value: "check" },
        { a: "torch", b: "good", value: "check" },
        { a: "bastille", b: "good", value: "check" },
      ],
    },
  ],
};
