/**
 * Case 94, "A Ritual Killing": a member of the Hollywood Mystery Society,
 * killed in the dark.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Impossible), from the photos of the
 * book. Motives and statements, no body clue - the liar is the murderer.
 * Only members of the Order of the Rose & Key wanted to make good art, and
 * Assistant Applegreen is not one; both clues carry that one predicate. The
 * scrambled message reads "Whoever would kill because the vibes were off was
 * a Virgo"; here it is scrambled again in German, letter by letter within
 * each word. The first hint is the book's; the solver's only solution is
 * the one the book prints, and the other hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const A_RITUAL_KILLING: Case = {
  id: "a-ritual-killing",
  number: 94,
  title: "Ein Ritualmord",
  story:
    "Dann führten fünf Mitglieder der Hollywood Mystery Society Logico in das geheime Hinterzimmer. Sie löschten alle Lichter und begannen zu singen und zu tanzen - eine Art magisches Ritual. Plötzlich: ein Schrei! Als das Licht anging, war einer von ihnen tot.",
  series: "volume1",
  difficulty: "impossible",
  suspects: [
    {
      id: "marengo",
      name: "Statistin Marengo",
      icon: "\u{1F464}",
      description:
        "An sie wirst du dich nie erinnern - deshalb ist sie eine gute Statistin und eine großartige Mörderin.",
      heightCm: 165,
      hand: "left",
      eyes: "lightBrown",
      hair: "darkBrown",
      sign: "gemini",
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
    {
      id: "applegreen",
      name: "Assistentin Applegreen",
      icon: "\u{1F34F}",
      description:
        "Vielleicht macht sie ihren Vater eines Tages wieder stolz. Oder vielleicht ermordet sie jemanden.",
      heightCm: 160,
      hand: "left",
      eyes: "blue",
      hair: "blond",
      sign: "virgo",
    },
    {
      id: "tangerine",
      name: "Mx. Tangerine",
      icon: "\u{1F9E2}",
      description:
        "Der Beweis, dass auch nicht-binäre Menschen Mörder sein können: Künstler:in, Dichter:in und verdächtig.",
      heightCm: 165,
      hand: "left",
      eyes: "hazel",
      hair: "blond",
      sign: "pisces",
    },
  ],
  locations: [
    {
      id: "bathroom",
      name: "das Badezimmer",
      icon: "\u{1F6BD}",
      description:
        "Auch ein geheimer Ritualraum braucht ein Badezimmer (so will es die Bauordnung).",
      indoors: true,
    },
    {
      id: "entrance",
      name: "der Geheimeingang",
      icon: "\u{1F4DA}",
      description:
        "Er liegt hinter einem Bücherregal im Hollywood Mystery Shoppe. Man muss nur das richtige Buch ziehen.",
      indoors: true,
    },
    {
      id: "sigil",
      name: "das Bodensiegel",
      icon: "\u{1F52F}",
      description:
        "Ein Gewirr aus wilden Linien und Kreisen auf dem Boden, mit okkulter Bedeutung.",
      indoors: true,
    },
    {
      id: "altar",
      name: "der Altar",
      icon: "\u{1F6D0}",
      description:
        "Hier steht der Leiter des Rituals und führt durch die Zeremonie.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "wine",
      name: "eine Flasche Wein",
      icon: "\u{1F377}",
      description: "Vorsicht vor Flecken - der Rotwein geht nicht mehr raus.",
      weight: "medium",
      material: "Glas und Alkohol",
    },
    {
      id: "flag",
      name: "eine Rosenflagge",
      icon: "\u{1F3F4}",
      description: "Auf der Flagge ist eine rote Rose auf schwarzem Grund.",
      weight: "light",
      material: "Leinwand",
    },
    {
      id: "award",
      name: "ein Filmpreis",
      icon: "\u{1F3C6}",
      description:
        "Sie benutzen ihn bei ihren Ritualen. Irgendeine Kraft hat er tatsächlich.",
      weight: "medium",
      material: "Metall",
    },
    {
      id: "candle",
      name: "eine schwere Kerze",
      icon: "\u{1F56F}️",
      description: "Sie ist schwer und bringt doch Licht in den Raum.",
      weight: "heavy",
      material: "Wachs",
    },
  ],
  motives: [
    {
      id: "vibes",
      name: "weil die Schwingungen nicht stimmten",
      icon: "☮️",
    },
    { id: "industry", name: "im Auftrag der Branche", icon: "⚙️" },
    { id: "art", name: "gute Kunst machen", icon: "\u{1F3A8}" },
    { id: "hollywood", name: "Hollywood übernehmen", icon: "\u{1F3AC}" },
  ],
  clues: [
    {
      text: "Entweder war jemand, der im Auftrag der Branche töten wollte, im Geheimeingang, oder ein Filmpreis war dort.",
      holds: (scene) =>
        (scene.motiveOf(scene.at("entrance").id)?.id === "industry") !==
        (scene.weaponOf(scene.at("entrance").id).id === "award"),
    },
    {
      text: "Wer die Rosenflagge hatte, wollte Hollywood übernehmen.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("flag").id)?.id === "hollywood",
    },
    {
      text: "Im Badezimmer wurde ein roter Fleck entdeckt.",
      holds: (scene) =>
        scene.locationOf(scene.holder("wine").id).id === "bathroom",
    },
    {
      text: "Nur Mitglieder des Ordens von Rose & Schlüssel wollten gute Kunst machen.",
      holds: (scene) => scene.motiveOf("applegreen")?.id !== "art",
    },
    {
      text: "Ein Mitglied hatte hastig eine Nachricht hingekritzelt: RWE ÖTNTE ÜDEWR, IELW EDI NNHEUIGSGNCW ICNHT TENMITMS, AWR IENE UGNUAFJR.",
      holds: (scene) => scene.driven("vibes").sign === "virgo",
    },
    {
      text: "Statistin Marengo hat das Bodensiegel nie betreten.",
      holds: (scene) => scene.locationOf("marengo").id !== "sigil",
    },
    {
      text: "Auf dem Altar wurde ein Tropfen Wachs entdeckt.",
      holds: (scene) =>
        scene.locationOf(scene.holder("candle").id).id === "altar",
    },
    {
      text: "Assistentin Applegreen war nicht im Orden von Rose & Schlüssel.",
      holds: (scene) => scene.motiveOf("applegreen")?.id !== "art",
    },
  ],
  statements: [
    {
      by: "marengo",
      text: "Ooh! Superfan Smoky hatte eine Flasche Wein dabei.",
      holds: (scene) => scene.weaponOf("smoky").id === "wine",
    },
    {
      by: "smoky",
      text: "Oh, wow! Eine Flasche Wein war im Badezimmer.",
      holds: (scene) =>
        scene.locationOf(scene.holder("wine").id).id === "bathroom",
    },
    {
      by: "applegreen",
      text: "Kurz gesagt: Ich hatte eine Flagge dabei.",
      holds: (scene) => scene.weaponOf("applegreen").id === "flag",
    },
    {
      by: "tangerine",
      text: "Wer die Flasche Wein hatte, könnte getötet haben, weil die Schwingungen nicht stimmten.",
      holds: (scene) => scene.motiveOf(scene.holder("wine").id)?.id === "vibes",
    },
  ],
  exhibits: ["astrology"],
  solution: {
    marengo: { weapon: "award", location: "entrance", motive: "art" },
    smoky: { weapon: "wine", location: "bathroom", motive: "vibes" },
    applegreen: { weapon: "candle", location: "altar", motive: "industry" },
    tangerine: { weapon: "flag", location: "sigil", motive: "hollywood" },
  },
  murderer: "applegreen",
  hints: [
    {
      text: 'Logico bekam eine Nachricht von Irratino: "Logico! Ich habe deinen Anruf bekommen! Pass auf dich auf! Und denk dran: Wer die schwere Kerze hatte, wollte im Auftrag der Branche töten!"',
      book: true,
      marks: [{ a: "candle", b: "industry", value: "check" }],
    },
    {
      text: 'Der rote Fleck heißt: Der Wein war im Badezimmer, der Wachstropfen: Die Kerze war am Altar. Die Nachricht, Wort für Wort entwürfelt: "WER TÖTEN WÜRDE, WEIL DIE SCHWINGUNGEN NICHT STIMMTEN, WAR EINE JUNGFRAU." Jungfrauen sind Smoky und Applegreen.',
      marks: [
        { a: "wine", b: "bathroom", value: "check" },
        { a: "candle", b: "altar", value: "check" },
        { a: "smoky", b: "vibes", value: "check" },
      ],
    },
    {
      text: "Probiere aus, wer lügt. Smokys Aussage (Wein im Badezimmer) stimmt sicher. Lügt Marengo, hätte Applegreen die Flagge und wollte Hollywood übernehmen; den Wein hätte Marengo oder Tangerine - und laut Tangerine wollte der Weinbesitzer wegen der Schwingungen töten. Das muss eine Jungfrau sein. Geht nicht.",
      marks: [
        { a: "smoky", b: "wine", value: "check" },
        { a: "smoky", b: "bathroom", value: "check" },
        { a: "tangerine", b: "hollywood", value: "check" },
        { a: "wine", b: "vibes", value: "check" },
      ],
    },
    {
      text: "Lügt Tangerine, stimmen die anderen: Smoky hat den Wein, Applegreen die Flagge (Hollywood). Wegen der Schwingungen muss dann eine Jungfrau töten - Smoky darf es nicht sein, Applegreen will Hollywood. Geht auch nicht. Also lügt Assistentin Applegreen - sie ist die Mörderin.",
    },
    {
      text: "Smoky hat den Wein im Badezimmer und tötet wegen der Schwingungen. Applegreen hat keine Flagge, also will sie nicht Hollywood übernehmen; Kunst darf sie nicht (kein Ordensmitglied) - sie handelt im Auftrag der Branche.",
      marks: [
        { a: "bathroom", b: "vibes", value: "check" },
        { a: "applegreen", b: "industry", value: "check" },
      ],
    },
    {
      text: "Wäre Applegreen im Geheimeingang, dürfte der Filmpreis nicht dort sein - sie hätte aber Preis oder Kerze, und die Kerze ist am Altar. Also war der Preis im Geheimeingang, ohne Applegreen: Sie hatte die Kerze am Altar. Marengo (nicht am Bodensiegel) hatte den Preis im Geheimeingang und wollte gute Kunst machen, Tangerine die Flagge am Bodensiegel.",
      marks: [
        { a: "applegreen", b: "candle", value: "check" },
        { a: "applegreen", b: "altar", value: "check" },
        { a: "award", b: "entrance", value: "check" },
        { a: "marengo", b: "entrance", value: "check" },
        { a: "marengo", b: "art", value: "check" },
        { a: "tangerine", b: "sigil", value: "check" },
        { a: "entrance", b: "art", value: "check" },
        { a: "marengo", b: "award", value: "check" },
        { a: "award", b: "art", value: "check" },
        { a: "altar", b: "industry", value: "check" },
        { a: "tangerine", b: "flag", value: "check" },
        { a: "flag", b: "sigil", value: "check" },
        { a: "flag", b: "hollywood", value: "check" },
        { a: "sigil", b: "hollywood", value: "check" },
      ],
    },
  ],
};
