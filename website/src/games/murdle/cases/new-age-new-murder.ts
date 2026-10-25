/**
 * Case 71, "New Age, New Murder!": the deputy mayor of the hippie town of
 * New Aegis.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Hard Boiled), from the photos of
 * the book. The graffiti in the Next Letter Code reads "A selenite wand was
 * seen indoors"; here it is written in German in the same code (each letter
 * stands for the next one, umlauts written out). The solver found the only
 * solution, and the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const NEW_AGE_NEW_MURDER: Case = {
  id: "new-age-new-murder",
  number: 71,
  title: "New Age, neuer Mord!",
  story:
    'New Aegis war eine entspannte Hippiestadt mit breiten Straßen, schrägen Läden und einer florierenden Touristen-Erleuchtungs-Industrie. Irratino hätte diesen Ort geliebt, also liebte Logico ihn auch ein bisschen. Auch wenn er sich bei der Werbung mit "wissenschaftlich erwiesener spiritueller Transzendenz, garantiert" nicht so sicher war. Wie passte zum Beispiel dazu, dass der stellvertretende Bürgermeister ermordet worden war?',
  series: "volume1",
  difficulty: "hardBoiled",
  suspects: [
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
    {
      id: "gainsboro",
      name: "Bookie-Gewinner Gainsboro",
      icon: "\u{1F453}",
      description:
        "Er hat den Bookington-Preis für seinen Roman gewonnen, und das erzählt er dir in den ersten zwei Minuten. Das Buch ist sechstausend Seiten lang und handelt von Erde.",
      heightCm: 183,
      hand: "left",
      eyes: "hazel",
      hair: "lightBrown",
      sign: "gemini",
    },
    {
      id: "honey",
      name: "Bürgermeister Honey",
      icon: "\u{1F3A9}",
      description:
        "Das ist tatsächlich ein dritter, identischer Bürgermeister Honey. Ganz bestimmt kein Mehrfachmörder.",
      heightCm: 183,
      hand: "left",
      eyes: "hazel",
      hair: "lightBrown",
      sign: "scorpio",
    },
    {
      id: "goddess",
      name: "Die Kristallgöttin",
      icon: "\u{1F48E}",
      description:
        "Ihre Anhänger halten sie für ein göttliches Wesen - deshalb geben sie ihr Geld.",
      heightCm: 175,
      hand: "left",
      eyes: "blue",
      hair: "white",
      sign: "leo",
    },
  ],
  locations: [
    {
      id: "restaurant",
      name: "ein kitschiges Restaurant",
      icon: "\u{1F354}",
      description:
        "Ein Restaurant im Stil der Prä-Astronautik mit Gerichten wie dem UFOmelett.",
      indoors: true,
    },
    {
      id: "square",
      name: "der Marktplatz",
      icon: "⛲",
      description:
        "Hier steht ein Brunnen, den man mit der Wünschelrute entdeckt hat. (Er ist trocken.)",
      indoors: false,
    },
    {
      id: "crystal-shop",
      name: "ein Kristallladen",
      icon: "\u{1F52E}",
      description:
        "Hier gibt es nur die feinsten und teuersten Kristalle. Gute Schwingungen garantiert.",
      indoors: true,
    },
    {
      id: "ufo-site",
      name: "eine UFO-Absturzstelle",
      icon: "\u{1F6F8}",
      description:
        "Die Goldgrube der Stadt. Ein Touristenziel, das dem Eiffelturm Konkurrenz macht (zumindest laut den Broschüren).",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "wand",
      name: "ein Selenitstab",
      icon: "\u{1FA84}",
      description: "Zum Zaubern und zum Schädeleinschlagen.",
      weight: "medium",
      material: "Kristall",
    },
    {
      id: "dowsing-rod",
      name: "eine Wünschelrute",
      icon: "\u{1F531}",
      description: "Damit findet man Wasser, Öl und Dumme.",
      weight: "medium",
      material: "Holz",
    },
    {
      id: "spoon",
      name: "ein verbogener Löffel",
      icon: "\u{1F944}",
      description:
        "Wurde er von den geheimnisvollen Kräften des Geistes verbogen - oder, als du nicht hingesehen hast?",
      weight: "light",
      material: "Metall",
    },
    {
      id: "candle",
      name: "eine Gebetskerze",
      icon: "\u{1F56F}️",
      description:
        "Wenn du gebetet hast, dass jemand stirbt: Dein Wunsch ging in Erfüllung.",
      weight: "medium",
      material: "Wachs",
    },
  ],
  motives: [
    {
      id: "trippin",
      name: "auf einem Trip, Mann",
      icon: "\u{1F635}‍\u{1F4AB}",
    },
    { id: "jealousy", name: "aus Eifersucht", icon: "\u{1FAAC}" },
    { id: "secret", name: "ein Geheimnis schützen", icon: "\u{1F92B}" },
    {
      id: "experiment",
      name: "als wissenschaftliches Experiment",
      icon: "\u{1F52C}",
    },
  ],
  clues: [
    {
      text: "Die Person mit der Gebetskerze hat womöglich auf einem Trip getötet, Mann.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("candle").id)?.id === "trippin",
    },
    {
      text: "Ein Löwe hatte den verbogenen Löffel. (Typisch.)",
      holds: (scene) => scene.holder("spoon").sign === "leo",
    },
    {
      text: "Ein Schütze hatte die Gebetskerze. (Natürlich.)",
      holds: (scene) => scene.holder("candle").sign === "sagittarius",
    },
    {
      text: "Entweder war Bürgermeister Honey an einer UFO-Absturzstelle, oder Bookie-Gewinner Gainsboro war in einem kitschigen Restaurant.",
      holds: (scene) =>
        (scene.locationOf("honey").id === "ufo-site") !==
        (scene.locationOf("gainsboro").id === "restaurant"),
    },
    {
      text: "Wer womöglich aus Eifersucht tötet, wurde drinnen gesehen.",
      holds: (scene) => scene.locationOf(scene.driven("jealousy").id).indoors,
    },
    {
      text: "Wer als wissenschaftliches Experiment töten wollte, war auf dem Marktplatz.",
      holds: (scene) =>
        scene.locationOf(scene.driven("experiment").id).id === "square",
    },
    {
      text: "Bookie-Gewinner Gainsboro hasste Kitsch: Er würde niemals, wirklich niemals, ein kitschiges Restaurant betreten, nicht einmal für einen Mord.",
      holds: (scene) => scene.locationOf("gainsboro").id !== "restaurant",
    },
    {
      text: "Jemand hatte den Nächster-Buchstabe-Code für ein gesprühtes Graffiti benutzt: DHM RDKDMHSRSZA VTQCD CQHMMDM FDRDGDM.",
      holds: (scene) => scene.locationOf(scene.holder("wand").id).indoors,
    },
  ],
  body: {
    text: "Neben der Leiche des stellvertretenden Bürgermeisters wurde eine blutige Wünschelrute gefunden.",
    weapon: "dowsing-rod",
  },
  solution: {
    midnight: { weapon: "candle", location: "restaurant", motive: "trippin" },
    gainsboro: { weapon: "wand", location: "crystal-shop", motive: "jealousy" },
    honey: { weapon: "dowsing-rod", location: "ufo-site", motive: "secret" },
    goddess: { weapon: "spoon", location: "square", motive: "experiment" },
  },
  murderer: "honey",
  hints: [
    {
      text: 'Inspektor Irratino hatte Logico einmal erzählt, dies sei ein vollständiger Satz: "Wenn hinter Fliegen Fliegen fliegen, fliegen Fliegen Fliegen nach." Außerdem hatte er gesagt: Sollte Logico je einen Fall in New Aegis haben, solle er im trockenen Brunnen nach Metall suchen.',
      book: true,
    },
    {
      text: "Im Nächster-Buchstabe-Code steht jeder Buchstabe für den nächsten im Alphabet: D wird E, H wird I und so weiter. Das Graffiti lautet: EIN SELENITSTAB WURDE DRINNEN GESEHEN.",
    },
    {
      text: "Der einzige Löwe ist die Kristallgöttin: Sie hatte den Löffel. Der einzige Schütze ist Onkel Midnight: Er hatte die Gebetskerze - und tötete womöglich auf einem Trip.",
      marks: [
        { a: "goddess", b: "spoon", value: "check" },
        { a: "midnight", b: "candle", value: "check" },
        { a: "midnight", b: "trippin", value: "check" },
        { a: "candle", b: "trippin", value: "check" },
      ],
    },
    {
      text: "Gainsboro war nie im kitschigen Restaurant. Damit ist die zweite Hälfte des Entweder-oder falsch, also war Bürgermeister Honey an der UFO-Absturzstelle.",
      marks: [
        { a: "gainsboro", b: "restaurant", value: "cross" },
        { a: "honey", b: "ufo-site", value: "check" },
      ],
    },
    {
      text: "Honey und Gainsboro haben Selenitstab und Wünschelrute. Der Selenitstab war drinnen, Honey aber draußen an der Absturzstelle: Gainsboro hatte den Stab, Honey die Wünschelrute. Gainsboro war drinnen, aber nicht im Restaurant - also im Kristallladen.",
      marks: [
        { a: "gainsboro", b: "wand", value: "check" },
        { a: "honey", b: "dowsing-rod", value: "check" },
        { a: "gainsboro", b: "crystal-shop", value: "check" },
      ],
    },
    {
      text: "Midnight und die Kristallgöttin teilen sich Restaurant und Marktplatz. Auf dem Marktplatz war, wer experimentieren wollte - Midnight ist auf einem Trip. Also war Midnight im Restaurant, die Göttin auf dem Marktplatz mit dem Experiment.",
      marks: [
        { a: "midnight", b: "restaurant", value: "check" },
        { a: "goddess", b: "square", value: "check" },
        { a: "square", b: "experiment", value: "check" },
      ],
    },
    {
      text: "Eifersucht war drinnen: nicht bei Honey an der Absturzstelle. Gainsboro war eifersüchtig, und Honey wollte ein Geheimnis schützen.",
      marks: [
        { a: "honey", b: "jealousy", value: "cross" },
        { a: "honey", b: "secret", value: "check" },
      ],
    },
    {
      text: "Die blutige Wünschelrute verrät ihn: Bürgermeister Honey tötete an der UFO-Absturzstelle, um ein Geheimnis zu schützen.",
      marks: [
        { a: "dowsing-rod", b: "ufo-site", value: "check" },
        { a: "dowsing-rod", b: "secret", value: "check" },
        { a: "ufo-site", b: "secret", value: "check" },
        { a: "candle", b: "restaurant", value: "check" },
        { a: "restaurant", b: "trippin", value: "check" },
        { a: "gainsboro", b: "jealousy", value: "check" },
        { a: "wand", b: "crystal-shop", value: "check" },
        { a: "wand", b: "jealousy", value: "check" },
        { a: "crystal-shop", b: "jealousy", value: "check" },
        { a: "goddess", b: "experiment", value: "check" },
        { a: "spoon", b: "square", value: "check" },
        { a: "spoon", b: "experiment", value: "check" },
      ],
    },
  ],
};
