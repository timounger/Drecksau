/**
 * Case 85, "Quiet on Set . . . Too Quiet!": the effects supervisor of
 * Murdle: The Movie.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Impossible). Motives and statements,
 * no body clue - the liar is the murderer. Two clues need Exhibit D, the map
 * of Midnight Movie Studios, which is not photographed: the northwest sound
 * stage is A and the northeast one is B (the letters in reading order, as the
 * book's solution confirms). The clues say so in brackets. The book's hint
 * comes first; the other hints are our own.
 */
import type { Case } from "../engine/types";

/** The sound stage in the northwest of the studio map (Exhibit D). */
const NORTHWEST_STAGE = "stage-a";

/** The sound stage in the northeast of the studio map (Exhibit D). */
const NORTHEAST_STAGE = "stage-b";

/** The case. */
export const QUIET_ON_SET_TOO_QUIET: Case = {
  id: "quiet-on-set-too-quiet",
  number: 85,
  title: "Ruhe am Set ... zu ruhig!",
  story:
    "Die Dreharbeiten zu Murdle: Der Film hatten begonnen. Das Studio kaufte zwar Land für Drehorte auf, gedreht wurde aber der ganze Film in den Tonbühnen auf dem Gelände. Leider musste die Produktion unterbrochen werden, als der Leiter der Spezialeffekte getötet wurde.",
  series: "volume1",
  difficulty: "impossible",
  suspects: [
    {
      id: "charcoal",
      name: "Boss Charcoal",
      icon: "\u{1F9D4}",
      description:
        "Ein Mafiaboss aus der guten alten Zeit, als ein Mafiaboss aus der guten alten Zeit noch etwas bedeutete.",
      heightCm: 180,
      hand: "right",
      eyes: "darkBrown",
      hair: "black",
      sign: "taurus",
    },
    {
      id: "president",
      name: "Präsident Midnight",
      icon: "\u{1F3A9}",
      description:
        "Der Chef von Midnight Movies. Ihm geht es um Filme und um Geld, aber ganz sicher nicht in dieser Reihenfolge.",
      heightCm: 188,
      hand: "right",
      eyes: "black",
      hair: "black",
      sign: "capricorn",
    },
    {
      id: "abalone",
      name: "A-Promi Abalone",
      icon: "\u{1F483}",
      description:
        "Die talentierteste und gefragteste Schauspielerin aller Zeiten - zumindest diesen Monat.",
      heightCm: 168,
      hand: "right",
      eyes: "hazel",
      hair: "red",
      sign: "libra",
    },
    {
      id: "midnight",
      name: "Midnight III",
      icon: "\u{1F576}️",
      description:
        "Er behauptet, Detektive seien die nächsten Superhelden und Krimis der nächste große Kassenschlager.",
      heightCm: 173,
      hand: "left",
      eyes: "darkBrown",
      hair: "darkBrown",
      sign: "libra",
    },
  ],
  locations: [
    {
      id: "stage-a",
      name: "Tonbühne A",
      icon: "\u{1F170}️",
      description:
        "Darin steht ein Nachbau der geheimnisvollen Höhlen, in denen Logico Irratino gefasst hat.",
      indoors: true,
    },
    {
      id: "stage-b",
      name: "Tonbühne B",
      icon: "\u{1F171}️",
      description:
        "Darin steht ein Nachbau von Logicos Büro. Allerdings weniger ordentlich, als er es hielt.",
      indoors: true,
    },
    {
      id: "stage-c",
      name: "Tonbühne C",
      icon: "\u{1F3E0}",
      description:
        "Darin steht ein Nachbau von Irratinos Elternhaus. Allerdings weniger unordentlich, als er es hielt.",
      indoors: true,
    },
    {
      id: "stage-d",
      name: "Tonbühne D",
      icon: "\u{1F7E9}",
      description: "Komplett mit Greenscreens ausgekleidet.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "prop-knife",
      name: 'ein "Requisiten"-Messer',
      icon: "\u{1F52A}",
      description: "Seltsamerweise ist es so scharf wie ein echtes Messer.",
      weight: "light",
      material: "Metall und Gummi",
    },
    {
      id: "sandbag",
      name: "ein Sandsack",
      icon: "\u{1F45D}",
      description:
        "Man kann ihn schwingen oder fallen lassen. So oder so ist es seine Aufgabe, schwer zu sein.",
      weight: "heavy",
      material: "Sand und Segeltuch",
    },
    {
      id: "c-stand",
      name: "ein C-Stand",
      icon: "\u{1F526}",
      description: "Hält Scheinwerfer. Oder trifft Schädel.",
      weight: "heavy",
      material: "Metall",
    },
    {
      id: "cable",
      name: "ein Stromkabel",
      icon: "\u{1F50C}",
      description:
        "Zum Stromschlag verpassen, Erdrosseln oder sogar Zuschlagen. Ein echtes Mehrzweckwerkzeug.",
      weight: "medium",
      material: "Metall und Gummi",
    },
  ],
  motives: [
    {
      id: "studio",
      name: "ein Studio übernehmen",
      icon: "\u{1F3A5}",
    },
    { id: "award", name: "einen Preis gewinnen", icon: "\u{1F3C6}" },
    { id: "part", name: "eine Rolle stehlen", icon: "\u{1F3AD}" },
    {
      id: "bad-movie",
      name: "aus einem schlechten Film rauskommen",
      icon: "\u{1F44E}",
    },
  ],
  clues: [
    {
      text: "Wer aus einem schlechten Film rauskommen wollte, hatte eine schwere Waffe.",
      holds: (scene) =>
        scene.weaponOf(scene.driven("bad-movie").id).weight === "heavy",
    },
    {
      text: "Der Kult des Dunklen Schimmers nimmt nur Leute mit dunkelbraunen Augen auf.",
      holds: () => true,
    },
    {
      text: "Der zweitkleinste Verdächtige hatte keinen C-Stand dabei.",
      holds: (scene) => scene.weaponOf("midnight").id !== "c-stand",
    },
    {
      text: "Ein Mitglied des Kults des Dunklen Schimmers war in der nordöstlichen Tonbühne. (Laut Lageplan in Beweisstück D ist das Tonbühne B.)",
      holds: (scene) => scene.at(NORTHEAST_STAGE).eyes === "darkBrown",
    },
    {
      text: "A-Promi Abalone war von grünen Wänden umgeben.",
      holds: (scene) => scene.locationOf("abalone").id === "stage-d",
    },
    {
      text: 'Boss Charcoal hatte ein "Requisiten"-Messer.',
      holds: (scene) => scene.weaponOf("charcoal").id === "prop-knife",
    },
    {
      text: "Ein Mitglied des Kults des Dunklen Schimmers wollte eine Rolle stehlen.",
      holds: (scene) => scene.driven("part").eyes === "darkBrown",
    },
    {
      text: "Präsident Midnight wollte einen Preis gewinnen.",
      holds: (scene) => scene.motiveOf("president")?.id === "award",
    },
    {
      text: "Wer ein Studio übernehmen wollte, war in der nordwestlichen Tonbühne. (Laut Lageplan in Beweisstück D ist das Tonbühne A.)",
      holds: (scene) =>
        scene.locationOf(scene.driven("studio").id).id === NORTHWEST_STAGE,
    },
  ],
  statements: [
    {
      by: "charcoal",
      text: "Hören Sie zu: Ein Sandsack war in Tonbühne D.",
      holds: (scene) =>
        scene.locationOf(scene.holder("sandbag").id).id === "stage-d",
    },
    {
      by: "president",
      text: "Ich war nicht in Tonbühne B.",
      holds: (scene) => scene.locationOf("president").id !== "stage-b",
    },
    {
      by: "abalone",
      text: "Reden Sie mit meinem Agenten, aber unter uns: Boss Charcoal war in Tonbühne A.",
      holds: (scene) => scene.locationOf("charcoal").id === "stage-a",
    },
    {
      by: "midnight",
      text: "Wenn ich mich einklinken darf: Wer den C-Stand hatte, wollte einen Preis gewinnen.",
      holds: (scene) =>
        scene.motiveOf(scene.holder("c-stand").id)?.id === "award",
    },
  ],
  solution: {
    charcoal: { weapon: "prop-knife", location: "stage-b", motive: "part" },
    president: { weapon: "c-stand", location: "stage-c", motive: "award" },
    abalone: { weapon: "sandbag", location: "stage-d", motive: "bad-movie" },
    midnight: { weapon: "cable", location: "stage-a", motive: "studio" },
  },
  murderer: "abalone",
  hints: [
    {
      text: "Deductive Logico bekam eine Marot-Karte mit der Post, und inzwischen kannte er das Marot gut genug, um zu wissen, was sie bedeutete: Boss Charcoal wollte eine Rolle stehlen. Und Irratino dachte an ihn.",
      book: true,
      marks: [{ a: "charcoal", b: "part", value: "check" }],
    },
    {
      text: "Im Kult sind nur Leute mit dunkelbraunen Augen: Boss Charcoal und Midnight III. Abalone steht in Tonbühne D (grüne Wände), also nicht im Nordwesten - sie will kein Studio übernehmen, und eine Rolle stehlen will ein Kultmitglied. Präsident Midnight will einen Preis. Also will Abalone aus dem schlechten Film raus und hat eine schwere Waffe. Charcoal und Midnight III teilen sich Rolle und Studio.",
      marks: [
        { a: "president", b: "award", value: "check" },
        { a: "abalone", b: "bad-movie", value: "check" },
        { a: "midnight", b: "studio", value: "check" },
      ],
    },
    {
      text: "Den C-Stand hat weder Charcoal (Messer) noch Midnight III (der Zweitkleinste). Lügt Midnight III, hat Präsident Midnight den C-Stand nicht, also Abalone - dann liegt der Sandsack nicht in Tonbühne D, und auch Charcoal lügt. Zwei Lügner gehen nicht: Midnight III sagt die Wahrheit. Der Präsident hat den C-Stand, Abalone den Sandsack in Tonbühne D, Midnight III das Stromkabel - und Charcoals Aussage stimmt auch.",
      marks: [
        { a: "president", b: "c-stand", value: "check" },
        { a: "abalone", b: "sandbag", value: "check" },
        { a: "midnight", b: "cable", value: "check" },
      ],
    },
    {
      text: "Lügt der Präsident, wäre er in Tonbühne B, im Nordosten - dort ist aber ein Kultmitglied. Also lügt A-Promi Abalone: Sie ist die Mörderin, und Charcoal war nicht in Tonbühne A.",
    },
    {
      text: "Charcoal ist damit nicht im Nordwesten und will kein Studio übernehmen, sondern eine Rolle stehlen - er steht im Nordosten, Tonbühne B. Midnight III will das Studio und steht in Tonbühne A, der Präsident in Tonbühne C. Abalone hatte den Sandsack in Tonbühne D und wollte aus dem schlechten Film raus.",
      marks: [
        { a: "sandbag", b: "bad-movie", value: "check" },
        { a: "charcoal", b: "prop-knife", value: "check" },
        { a: "charcoal", b: "stage-b", value: "check" },
        { a: "prop-knife", b: "stage-b", value: "check" },
        { a: "prop-knife", b: "part", value: "check" },
        { a: "stage-b", b: "part", value: "check" },
        { a: "president", b: "stage-c", value: "check" },
        { a: "c-stand", b: "stage-c", value: "check" },
        { a: "c-stand", b: "award", value: "check" },
        { a: "stage-c", b: "award", value: "check" },
        { a: "abalone", b: "stage-d", value: "check" },
        { a: "sandbag", b: "stage-d", value: "check" },
        { a: "stage-d", b: "bad-movie", value: "check" },
        { a: "midnight", b: "stage-a", value: "check" },
        { a: "cable", b: "stage-a", value: "check" },
        { a: "cable", b: "studio", value: "check" },
        { a: "stage-a", b: "studio", value: "check" },
      ],
    },
  ],
};
