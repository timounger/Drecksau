/**
 * Case 62, "You Can Go Home Again": an insurance adjuster killed in Logico's
 * home town.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Hard Boiled), from the photos of the
 * book. The membership clue and the rule for the members only count
 * together, so both carry what they say together: whoever was in the mall did
 * not have the aluminum pipe. The solver found the only solution, and the
 * hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const YOU_CAN_GO_HOME_AGAIN: Case = {
  id: "you-can-go-home-again",
  number: 62,
  title: "Es führt doch ein Weg zurück",
  story:
    "Deductive Logico dachte darüber nach, aufzugeben, wieder nach Hause zu ziehen und Versicherungsgutachter zu werden. Und tatsächlich war in der Stadt gerade eine Stelle frei geworden: Ein Versicherungsgutachter war getötet worden. Während er ermittelte, überlegte Logico, ob er den Job wollte.",
  series: "volume1",
  difficulty: "hardBoiled",
  suspects: [
    {
      id: "honey",
      name: "Ex-Bürgermeister Honey",
      icon: "\u{1F3A9}",
      description:
        "Ja, als er Bürgermeister war, hat er jemanden ermordet. Aber nachdem er zurückgetreten war, hat sich die Sache von selbst erledigt.",
      heightCm: 183,
      hand: "left",
      eyes: "hazel",
      hair: "lightBrown",
      sign: "scorpio",
    },
    {
      id: "copper",
      name: "Polizistin Copper",
      icon: "\u{1F46E}‍♀️",
      description:
        "Seit sie diesen Menschen getötet hat, sind ihre Chancen auf eine Stelle als Polizistin leicht gesunken.",
      heightCm: 165,
      hand: "right",
      eyes: "blue",
      hair: "blond",
      sign: "aries",
    },
    {
      id: "blue-sky",
      name: "Mr. Ordinary Blue Sky",
      icon: "\u{1FA86}",
      description:
        "Ein ganz gewöhnlicher Amerikaner mit starkem russischem Akzent. Nicht weiter beachten.",
      heightCm: 188,
      hand: "left",
      eyes: "darkBrown",
      hair: "black",
      sign: "aries",
    },
    {
      id: "crimson",
      name: "Dr. Crimson",
      icon: "\u{1FA7A}",
      description:
        "Sie ist die klügste Ärztin, die sie je getroffen hat - sagt sie selbst, und wahrscheinlich hat sie recht. Aber als Mörderin findet selbst sie keinen Weg, woanders eine Stelle zu bekommen.",
      heightCm: 175,
      hand: "left",
      eyes: "green",
      hair: "red",
      sign: "aquarius",
    },
  ],
  locations: [
    {
      id: "car-lot",
      name: "der Gebrauchtwagenhandel",
      icon: "\u{1F697}",
      description:
        "Der Verkäufer versichert dir, dass die Autos nicht explodieren - und dass sie ohne Gewähr verkauft werden.",
      indoors: true,
    },
    {
      id: "mall",
      name: "das heruntergekommene Einkaufszentrum",
      icon: "\u{1F6CD}️",
      description:
        "Der Brunnen ist ausgetrocknet, und nur zwei Läden haben noch offen: ein Kredithai und einer, der Gold ankauft.",
      indoors: true,
    },
    {
      id: "factory",
      name: "die alte Fabrik",
      icon: "\u{1F3ED}",
      description:
        "Früher wurden hier Geräte und Apparate gebaut, aber heute sind alle Geräte und Apparate Apps.",
      indoors: true,
    },
    {
      id: "secondhand-shop",
      name: "der Secondhandladen",
      icon: "\u{1F455}",
      description:
        "Das meiste hier sieht eher nach dritter Hand aus, sogar die Motten.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "fork",
      name: "eine Gabel",
      icon: "\u{1F374}",
      description: "Viel grausiger als ein Messer, wenn man darüber nachdenkt.",
      weight: "light",
      material: "Metall",
    },
    {
      id: "anchor",
      name: "ein antiker Anker",
      icon: "⚓",
      description:
        "Er ist mit Moos bewachsen, und die Kette ist rostig: Sieht ziemlich cool aus.",
      weight: "heavy",
      material: "Metall",
    },
    {
      id: "pipe",
      name: "ein Aluminiumrohr",
      icon: "\u{1F527}",
      description: "Sicherer als Blei - außer, es trifft dich am Kopf.",
      weight: "heavy",
      material: "Metall",
    },
    {
      id: "brick",
      name: "ein gewöhnlicher Ziegelstein",
      icon: "\u{1F9F1}",
      description:
        "Einfach ein ganz normaler, gewöhnlicher Ziegelstein. Nichts Besonderes. Nur ein Ziegelstein.",
      weight: "medium",
      material: "Ziegel",
    },
  ],
  motives: [
    { id: "money", name: "für Geld", icon: "\u{1F4B0}" },
    { id: "secret", name: "ein Geheimnis schützen", icon: "\u{1F92B}" },
    {
      id: "insult",
      name: "eine Beleidigung heimzahlen",
      icon: "\u{1F92C}",
    },
    { id: "blackout", name: "im Vollrausch", icon: "\u{1F37E}" },
  ],
  clues: [
    {
      text: "Mr. Ordinary Blue Sky wollte ein Geheimnis schützen. Aber was könnte sein Geheimnis sein?",
      holds: (scene) => scene.motiveOf("blue-sky")?.id === "secret",
    },
    {
      text: "Wer im heruntergekommenen Einkaufszentrum war, war Mitglied der Untergrundmacht.",
      // Only counts together with the rule for the members below.
      holds: (scene) => scene.weaponOf(scene.at("mall").id).id !== "pipe",
    },
    {
      text: "Wer den gewöhnlichen Ziegelstein hatte, war Rechtshänder. (Es war ein rechtshändiger Ziegelstein.)",
      holds: (scene) => scene.holder("brick").hand === "right",
    },
    {
      text: "Ein Skorpion hatte die Gabel. Skorpione sammeln Gabeln.",
      holds: (scene) => scene.holder("fork").sign === "scorpio",
    },
    {
      text: "Ein Wassermann stand neben einem Fahrzeug, von dem man ihm versichert hatte, dass es nicht explodieren würde.",
      holds: (scene) => scene.at("car-lot").sign === "aquarius",
    },
    {
      text: "Der Ziegelstein war eindeutig in der alten Fabrik gewesen.",
      holds: (scene) =>
        scene.locationOf(scene.holder("brick").id).id === "factory",
    },
    {
      text: "Mitglieder der Untergrundmacht durften kein Aluminium anfassen.",
      holds: (scene) => scene.weaponOf(scene.at("mall").id).id !== "pipe",
    },
    {
      text: "Wer den antiken Anker hatte, wollte eine Beleidigung heimzahlen.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("anchor").id)?.id === "insult",
    },
    {
      text: "Wer im Vollrausch getötet haben könnte, war Rechtshänder.",
      holds: (scene) => scene.driven("blackout").hand === "right",
    },
  ],
  body: {
    text: "Die Leiche des Versicherungsgutachters war mit Motten übersät.",
    location: "secondhand-shop",
  },
  exhibits: ["astrology"],
  solution: {
    honey: { weapon: "fork", location: "mall", motive: "money" },
    copper: { weapon: "brick", location: "factory", motive: "blackout" },
    "blue-sky": {
      weapon: "pipe",
      location: "secondhand-shop",
      motive: "secret",
    },
    crimson: { weapon: "anchor", location: "car-lot", motive: "insult" },
  },
  murderer: "blue-sky",
  hints: [
    {
      text: 'Die Tageszeitung war durch eine Wochenzeitung ersetzt worden, dann durch eine Monatszeitung, dann durch eine Website und dann durch einen Blog. Und der Blog hatte gerade einen Kommentar ohne Quellenangabe veröffentlicht: "Ein Nachbar hat gesehen, wie Mr. Ordinary Blue Sky ein Aluminiumrohr trug."',
      book: true,
      marks: [{ a: "blue-sky", b: "pipe", value: "check" }],
    },
    {
      text: "Rechtshänderin ist nur Polizistin Copper: Sie hatte den Ziegelstein und war damit in der alten Fabrik. Auch wer im Vollrausch getötet haben könnte, war Rechtshänder - also wieder Copper.",
      marks: [
        { a: "copper", b: "brick", value: "check" },
        { a: "copper", b: "factory", value: "check" },
        { a: "brick", b: "factory", value: "check" },
        { a: "copper", b: "blackout", value: "check" },
      ],
    },
    {
      text: "Skorpion ist nur Ex-Bürgermeister Honey: Er hatte die Gabel. Wassermann ist nur Dr. Crimson: Sie stand beim Gebrauchtwagenhandel.",
      marks: [
        { a: "honey", b: "fork", value: "check" },
        { a: "crimson", b: "car-lot", value: "check" },
      ],
    },
    {
      text: "Blue Sky wollte ein Geheimnis schützen, also hatte er nicht den Anker (Beleidigung). Er hatte das Aluminiumrohr, und Crimson den Anker - sie wollte eine Beleidigung heimzahlen. Honey bleibt das Geld.",
      marks: [
        { a: "blue-sky", b: "secret", value: "check" },
        { a: "anchor", b: "insult", value: "check" },
        { a: "crimson", b: "anchor", value: "check" },
        { a: "crimson", b: "insult", value: "check" },
        { a: "honey", b: "money", value: "check" },
      ],
    },
    {
      text: "Wer im Einkaufszentrum war, gehört zur Untergrundmacht und durfte kein Aluminium anfassen - also war Blue Sky mit dem Rohr nicht dort. Er war im Secondhandladen, bei den Motten und der Leiche. Honey war im Einkaufszentrum.",
      marks: [
        { a: "blue-sky", b: "mall", value: "cross" },
        { a: "honey", b: "mall", value: "check" },
        { a: "fork", b: "mall", value: "check" },
        { a: "fork", b: "money", value: "check" },
        { a: "mall", b: "money", value: "check" },
        { a: "brick", b: "blackout", value: "check" },
        { a: "factory", b: "blackout", value: "check" },
        { a: "blue-sky", b: "secondhand-shop", value: "check" },
        { a: "pipe", b: "secondhand-shop", value: "check" },
        { a: "pipe", b: "secret", value: "check" },
        { a: "secondhand-shop", b: "secret", value: "check" },
        { a: "anchor", b: "car-lot", value: "check" },
        { a: "car-lot", b: "insult", value: "check" },
      ],
    },
  ],
};
