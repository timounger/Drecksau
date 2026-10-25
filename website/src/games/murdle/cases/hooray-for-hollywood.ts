/**
 * Case 76, "Hooray for Hollywood!": a Hollywood historian made history.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Impossible). Motives and statements
 * together, no body clue - the liar is the murderer. The scrambled message
 * reads "Whoever was in the Magic Palace had a medium-weight weapon"; here it
 * is scrambled again in German, letter by letter within each word. The sample
 * prints neither hint nor solution; the solver found the only one, and the
 * hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const HOORAY_FOR_HOLLYWOOD: Case = {
  id: "hooray-for-hollywood",
  number: 76,
  title: "Hurra für Hollywood!",
  story:
    "Als Logico in Hollywood ankam, fiel es ihm schwer, sich zurechtzufinden. Und als er sich zurechtgefunden hatte, fiel es ihm schwer, einen Mord aufzuklären: Ein Hollywood-Historiker war selbst Geschichte.",
  series: "volume1",
  difficulty: "impossible",
  suspects: [
    {
      id: "steel",
      name: "Chefproduzentin Steel",
      icon: "\u{1F4BC}",
      description:
        "Die reichste, klügste und gemeinste Produzentin Hollywoods. Vorerst.",
      heightCm: 168,
      hand: "right",
      eyes: "gray",
      hair: "white",
      sign: "aries",
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
  ],
  locations: [
    {
      id: "studios",
      name: "die Midnight Movie Studios",
      icon: "\u{1F3AC}",
      description:
        "Einst das größte Studio Hollywoods. Hier entsteht Murdle: Der Film - vielleicht die Wende.",
      indoors: true,
    },
    {
      id: "park",
      name: "der Große Park",
      icon: "\u{1F333}",
      description:
        "Eigentlich nach einem Mörder benannt (schlag es nach), also nennen wir ihn einfach den Großen Park.",
      indoors: false,
    },
    {
      id: "agency",
      name: "die Argyle-Talentagentur",
      icon: "\u{1F4B0}",
      description:
        "Die mächtigste Institution der Hollywood-Geschichte, die nicht die Wasserversorgung kontrolliert.",
      indoors: true,
    },
    {
      id: "palace",
      name: "der Zauberpalast",
      icon: "✨",
      description:
        "Ein Nachtclub nur für Zauberer. Logico kennt ihn vor allem wegen seiner Morde.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "botox",
      name: "eine Botoxspritze",
      icon: "\u{1F489}",
      description:
        "Botox ist ein Gift - also lässt es sich auch als Waffe verwenden.",
      weight: "light",
      material: "Plastik und Gift",
    },
    {
      id: "film",
      name: "ein Filmstreifen",
      icon: "\u{1F39E}️",
      description:
        "Ironischerweise zeigt dieser Filmstreifen einen Mann, der erdrosselt wird.",
      weight: "light",
      material: "Plastik",
    },
    {
      id: "golf",
      name: "ein Golfschläger",
      icon: "\u{1F3CC}️",
      description:
        "Auch Studiobosse arbeiten hart. Man sehe sich nur an, wie viel geschäftliches Golf sie spielen.",
      weight: "medium",
      material: "Metall",
    },
    {
      id: "award",
      name: "ein Filmpreis",
      icon: "\u{1F3C6}",
      description: "Ein unglaublich angesehener Hollywood-Preis.",
      weight: "medium",
      material: "Metall",
    },
  ],
  motives: [
    { id: "tough", name: "beweisen, wie hart man ist", icon: "\u{1F4AA}" },
    {
      id: "movie",
      name: "den eigenen Film gedreht bekommen",
      icon: "\u{1F3A5}",
    },
    {
      id: "script",
      name: "helfen, ein Drehbuch zu verkaufen",
      icon: "\u{1F4C4}",
    },
    { id: "industry", name: "in die Branche einsteigen", icon: "\u{1F513}" },
  ],
  clues: [
    {
      text: "Superfan Smoky wollte in die Branche einsteigen.",
      holds: (scene) => scene.motiveOf("smoky")?.id === "industry",
    },
    {
      text: "Statistin Marengo wollte ihren Film gedreht bekommen. (Viel Glück!)",
      holds: (scene) => scene.motiveOf("marengo")?.id === "movie",
    },
    {
      text: "Wer beweisen wollte, wie hart er ist, war draußen.",
      holds: (scene) => !scene.locationOf(scene.driven("tough").id).indoors,
    },
    {
      text: "Die Spurensicherung fand einen Tropfen Botox in der mächtigsten Institution der Stadt, die nichts mit Wasser zu tun hat.",
      holds: (scene) =>
        scene.locationOf(scene.holder("botox").id).id === "agency",
    },
    {
      text: "Chefproduzentin Steel würde niemals, wirklich niemals, helfen wollen, ein Drehbuch zu verkaufen.",
      holds: (scene) => scene.motiveOf("steel")?.id !== "script",
    },
    {
      text: "Schreiberling Blaxton hatte einen Groll gegen die Person mit dem Golfschläger.",
      holds: (scene) => scene.holder("golf").id !== "blaxton",
    },
    {
      text: "Der Filmpreis war in der Hand einer rechtshändigen Person.",
      holds: (scene) => scene.holder("award").hand === "right",
    },
    {
      text: "Ein Fachkollege des Historikers drückte Logico eine verwürfelte Nachricht in die Hand: RWE MI BUSPAAEZRTLA ARW ATETH EENI LECHTIERTMSEW AWFFE.",
      holds: (scene) =>
        scene.weaponOf(scene.at("palace").id).weight === "medium",
    },
  ],
  statements: [
    {
      by: "steel",
      text: "Superfan Smoky hatte keinen Golfschläger dabei.",
      holds: (scene) => scene.weaponOf("smoky").id !== "golf",
    },
    {
      by: "blaxton",
      text: "Stellen Sie sich vor: Statistin Marengo war in der Argyle-Talentagentur.",
      holds: (scene) => scene.locationOf("marengo").id === "agency",
    },
    {
      by: "smoky",
      text: "Oh, wow! Ein Filmstreifen war in den Midnight Movie Studios.",
      holds: (scene) =>
        scene.locationOf(scene.holder("film").id).id === "studios",
    },
    {
      by: "marengo",
      text: "Ooh! Ein Golfschläger war im Großen Park.",
      holds: (scene) => scene.locationOf(scene.holder("golf").id).id === "park",
    },
  ],
  solution: {
    steel: { weapon: "golf", location: "park", motive: "tough" },
    blaxton: { weapon: "award", location: "palace", motive: "script" },
    smoky: { weapon: "botox", location: "agency", motive: "industry" },
    marengo: { weapon: "film", location: "studios", motive: "movie" },
  },
  murderer: "blaxton",
  hints: [
    {
      text: 'Deductive Logico führte ein unangenehmes Telefonat. "Ist es in Ordnung, dass du mich anrufst, während ich unter Hausarrest stehe? Wie auch immer, meine Teeblätter sagen, dass Steel im Großen Park war."',
      book: true,
      marks: [{ a: "steel", b: "park", value: "check" }],
    },
    {
      text: "Die Motive zuerst: Smoky will in die Branche, Marengo ihren Film. Steel will nicht helfen, ein Drehbuch zu verkaufen - also will sie beweisen, wie hart sie ist, und Blaxton hilft beim Drehbuchverkauf.",
      marks: [
        { a: "smoky", b: "industry", value: "check" },
        { a: "marengo", b: "movie", value: "check" },
        { a: "steel", b: "tough", value: "check" },
        { a: "blaxton", b: "script", value: "check" },
      ],
    },
    {
      text: "Wer hart sein wollte, war draußen - draußen ist nur der Große Park. Dort war Chefproduzentin Steel.",
    },
    {
      text: 'Die Nachricht, Wort für Wort entwürfelt: "WER IM ZAUBERPALAST WAR, HATTE EINE MITTELSCHWERE WAFFE." Die Botoxspritze lag in der Argyle-Talentagentur (mächtig, aber ohne Wasser).',
      marks: [{ a: "botox", b: "agency", value: "check" }],
    },
    {
      text: "Probiere aus, wer lügt. Lügt Steel, hätte Smoky den Golfschläger - aber laut Marengo war der Golfschläger im Park, also bei Steel. Lügt Marengo, hat Marengo selbst den Golfschläger (Steel, Smoky und Blaxton nicht) und wäre laut Blaxton in der Agentur, wo die Botoxspritze liegt. Beides geht nicht.",
      marks: [
        { a: "steel", b: "golf", value: "check" },
        { a: "golf", b: "park", value: "check" },
        { a: "smoky", b: "botox", value: "check" },
      ],
    },
    {
      text: "Lügt Smoky, stimmen die anderen: Steel hat den Golfschläger, Marengo die Botoxspritze in der Agentur, Blaxton den Preis (rechtshändig) im Zauberpalast. Dann bleibt Smoky mit dem Filmstreifen in den Studios - und seine Aussage wäre wahr. Geht auch nicht.",
      marks: [
        { a: "blaxton", b: "palace", value: "check" },
        { a: "film", b: "studios", value: "check" },
      ],
    },
    {
      text: "Also lügt Schreiberling Blaxton - er ist der Mörder. Steel hat den Golfschläger im Park, Blaxton den Filmpreis im Zauberpalast, Smoky die Botoxspritze in der Agentur und Marengo den Filmstreifen in den Studios.",
      marks: [
        { a: "blaxton", b: "award", value: "check" },
        { a: "marengo", b: "film", value: "check" },
        { a: "marengo", b: "studios", value: "check" },
        { a: "award", b: "palace", value: "check" },
        { a: "golf", b: "tough", value: "check" },
        { a: "park", b: "tough", value: "check" },
        { a: "award", b: "script", value: "check" },
        { a: "palace", b: "script", value: "check" },
        { a: "smoky", b: "agency", value: "check" },
        { a: "botox", b: "industry", value: "check" },
        { a: "agency", b: "industry", value: "check" },
        { a: "film", b: "movie", value: "check" },
        { a: "studios", b: "movie", value: "check" },
      ],
    },
  ],
};
