/**
 * Case 61, "The Island of Bad Dreams": back on the island where Inspector
 * Irratino died.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Hard Boiled), from the photos of the
 * book. Mister Shadow's card blacks out his height and hair. The solver found
 * the only solution, and the hints are our own.
 */
import { REDACTED_HEIGHT, type Case } from "../engine/types";

/** The case. */
export const THE_ISLAND_OF_BAD_DREAMS: Case = {
  id: "the-island-of-bad-dreams",
  number: 61,
  title: "Die Insel der bösen Träume",
  story:
    "Deductive Logico wollte die Insel, auf der Inspektor Irratino gestorben war, nie wieder sehen. Aber sobald er die Augen schloss, sah er nichts anderes. Er musste zurück - und als er dort ankam, wartete ein weiterer Mord auf ihn und eine weitere geheimnisvolle Gestalt, die herumschlich.",
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
      eyes: "green",
      hair: "redacted",
      sign: "aquarius",
    },
    {
      id: "amaranth",
      name: "Président Amaranth",
      icon: "\u{1F1EB}\u{1F1F7}",
      description:
        "Ein waschechter französischer Président. Amaranth verbringt gern Zeit mit seinen Wählern - besonders mit einem gewissen einen Prozent von ihnen.",
      heightCm: 178,
      hand: "right",
      eyes: "gray",
      hair: "red",
      sign: "gemini",
    },
    {
      id: "slate",
      name: "Kapitänin Slate",
      icon: "\u{1F469}\u{200D}\u{1F680}",
      description:
        "Eine echte Astronautin. Die erste Frau, die die dunkle Seite des Mondes umrundet hat - und die erste, die verdächtigt wurde, ihren Kopiloten ermordet zu haben.",
      heightCm: 165,
      hand: "left",
      eyes: "darkBrown",
      hair: "darkBrown",
      sign: "aquarius",
    },
    {
      id: "midnight",
      name: "Midnight III",
      icon: "\u{1F576}️",
      description:
        "Das Filmemachen hat er von seinem Vater gelernt und das Geschäft von seinem Großvater. Aber im Morden ist er ein Naturtalent.",
      heightCm: 173,
      hand: "left",
      eyes: "darkBrown",
      hair: "darkBrown",
      sign: "libra",
    },
  ],
  locations: [
    {
      id: "woods",
      name: "der tote Wald",
      icon: "\u{1F333}",
      description:
        "Man spürt beinahe die uralten Ruinen, die in diesem toten Wald begraben liegen.",
      indoors: false,
    },
    {
      id: "ship",
      name: "das Kreuzfahrtwrack",
      icon: "\u{1F6A2}",
      description:
        "Einst ein schickes Kreuzfahrtschiff, jetzt ein verrostetes Wrack.",
      indoors: false,
    },
    {
      id: "church",
      name: "die verfallene Kirche",
      icon: "⛪",
      description: "Das Dach ist eingestürzt, und die Kirche ist entweiht.",
      indoors: true,
    },
    {
      id: "lighthouse",
      name: "der Leuchtturm auf der Klippe",
      icon: "\u{1F5FC}",
      description:
        "Das Feuer wurde inzwischen durch ein automatisches LED-Licht ersetzt, das deutlich billiger ist.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "axe",
      name: "eine Axt",
      icon: "\u{1FA93}",
      description:
        "Jemand hat sie auf der Insel zurückgelassen. Vielleicht aus gutem Grund.",
      weight: "medium",
      material: "Holz und Metall",
    },
    {
      id: "broom",
      name: "ein Besen",
      icon: "\u{1F9F9}",
      description:
        "Angeblich fliegen Hexen darauf, aber Logico hat damit immer nur gefegt.",
      weight: "medium",
      material: "Holz und Stroh",
    },
    {
      id: "skull",
      name: "ein Kristallschädel",
      icon: "\u{1F480}",
      description:
        "Vielleicht der Schädel eines echten Außerirdischen, vielleicht nur ein lustiges Kunstprojekt.",
      weight: "medium",
      material: "Kristall",
    },
    {
      id: "artifact",
      name: 'ein "außerirdisches" Artefakt',
      icon: "\u{1F47D}",
      description:
        "Vielleicht echt, wahrscheinlich gefälscht. Auf jeden Fall aus Plastik.",
      weight: "heavy",
      material: "Plastik",
    },
  ],
  motives: [
    { id: "deal", name: "ein Geschäft abschließen", icon: "\u{1F91D}" },
    { id: "face", name: "das Gesicht wahren", icon: "\u{1F642}" },
    { id: "grave", name: "ein Grab ausrauben", icon: "\u{1FAA6}" },
    { id: "war", name: "einen Krieg gewinnen helfen", icon: "\u{1F4A3}" },
  ],
  clues: [
    {
      text: "Wer helfen wollte, einen Krieg zu gewinnen, hatte eine Waffe aus Plastik.",
      holds: (scene) =>
        scene.weaponOf(scene.driven("war").id).material === "Plastik",
    },
    {
      text: "Ein Wassermann stand im Schein eines LED-Lichts. Es war nicht vorteilhaft.",
      holds: (scene) => scene.at("lighthouse").sign === "aquarius",
    },
    {
      text: "Kapitänin Slate wurde im toten Wald aufgefunden, wo sie wirres Zeug redete.",
      holds: (scene) => scene.locationOf("slate").id === "woods",
    },
    {
      text: "Midnight III wollte nicht das Gesicht wahren. Sein Gesicht war ihm egal.",
      holds: (scene) => scene.motiveOf("midnight")?.id !== "face",
    },
    {
      text: "Wer unter einem eingestürzten Dach stand, war Rechtshänder.",
      holds: (scene) => scene.at("church").hand === "right",
    },
    {
      text: "Eine Axt wurde neben einem verrosteten Rumpf gefunden.",
      holds: (scene) => scene.locationOf(scene.holder("axe").id).id === "ship",
    },
    {
      text: "Wer ein Grab ausrauben wollte, war Zwilling.",
      holds: (scene) => scene.driven("grave").sign === "gemini",
    },
    {
      text: "Ein Kristallschädel glitzerte draußen im Mondlicht.",
      holds: (scene) => !scene.locationOf(scene.holder("skull").id).indoors,
    },
  ],
  body: {
    text: "Neben der Leiche wurde ein Strohhalm gefunden.",
    weapon: "broom",
  },
  exhibits: ["astrology"],
  solution: {
    shadow: { weapon: "artifact", location: "lighthouse", motive: "war" },
    amaranth: { weapon: "broom", location: "church", motive: "grave" },
    slate: { weapon: "skull", location: "woods", motive: "face" },
    midnight: { weapon: "axe", location: "ship", motive: "deal" },
  },
  murderer: "amaranth",
  hints: [
    {
      text: "Logico ging mit der Wünschelrute über die Insel, wie Irratino es ihm beigebracht hatte, und fand eine Besenborste auf einem eingestürzten Dach.",
      book: true,
    },
    {
      text: "Kapitänin Slate war im toten Wald. Unter dem eingestürzten Dach der verfallenen Kirche stand ein Rechtshänder - das ist nur Président Amaranth.",
      marks: [
        { a: "slate", b: "woods", value: "check" },
        { a: "amaranth", b: "church", value: "check" },
      ],
    },
    {
      text: "Im Leuchtturm mit dem LED-Licht war ein Wassermann: Slate war im Wald, also war es Mister Shadow. Midnight III bleibt das Kreuzfahrtwrack - dort lag die Axt, also hatte er sie.",
      marks: [
        { a: "shadow", b: "lighthouse", value: "check" },
        { a: "midnight", b: "axe", value: "check" },
        { a: "midnight", b: "ship", value: "check" },
        { a: "axe", b: "ship", value: "check" },
      ],
    },
    {
      text: "Der Kristallschädel war draußen. Draußen sind nur der Wald und das Wrack, und im Wrack lag die Axt. Slate hatte also den Kristallschädel.",
      marks: [{ a: "slate", b: "skull", value: "check" }],
    },
    {
      text: "Zwilling ist nur Amaranth: Er wollte ein Grab ausrauben. Wer einen Krieg gewinnen helfen wollte, hatte das Plastik-Artefakt - also nicht Amaranth. Amaranth hatte den Besen, Shadow das Artefakt und den Krieg als Motiv.",
      marks: [
        { a: "amaranth", b: "grave", value: "check" },
        { a: "artifact", b: "war", value: "check" },
        { a: "shadow", b: "artifact", value: "check" },
        { a: "shadow", b: "war", value: "check" },
        { a: "amaranth", b: "broom", value: "check" },
      ],
    },
    {
      text: "Stroh gibt es nur am Besen: Président Amaranth ist der Mörder. Midnight III wollte nicht das Gesicht wahren, also ein Geschäft abschließen - und Slate das Gesicht wahren.",
      marks: [
        { a: "slate", b: "face", value: "check" },
        { a: "midnight", b: "deal", value: "check" },
        { a: "artifact", b: "lighthouse", value: "check" },
        { a: "lighthouse", b: "war", value: "check" },
        { a: "broom", b: "church", value: "check" },
        { a: "broom", b: "grave", value: "check" },
        { a: "church", b: "grave", value: "check" },
        { a: "skull", b: "woods", value: "check" },
        { a: "skull", b: "face", value: "check" },
        { a: "woods", b: "face", value: "check" },
        { a: "axe", b: "deal", value: "check" },
        { a: "ship", b: "deal", value: "check" },
      ],
    },
  ],
};
