/**
 * Case 39, "The Case of the Haunted Hotel": a housekeeper killed in a hotel
 * that was said to be haunted.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Occult Medium), from the photos of
 * the book. There is no body clue - the liar is the murderer. One clue names
 * a birthday (October 13: Libra, Exhibit B). The label of the grand entrance
 * is blurred in the photo; with its guest book it is taken as indoors, which
 * no clue depends on. Lord Lavender's hair is printed blond here (gray in
 * case 9). The solver found the only solution, and the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const THE_CASE_OF_THE_HAUNTED_HOTEL: Case = {
  id: "the-case-of-the-haunted-hotel",
  number: 39,
  title: "Der Fall des Spukhotels",
  story:
    "Deductive Logico und Inspektor Irratino wollten in einem Hotel einchecken, in dem es angeblich spukte. Doch als sie ankamen, war es ein ganz reizendes Hotel, wenn auch etwas altmodisch. Es gab nur ein Problem: Die Hausdame war ermordet worden.",
  series: "volume1",
  difficulty: "occult",
  suspects: [
    {
      id: "lavender",
      name: "Lord Lavender",
      icon: "\u{1F3BC}",
      description:
        "Ein konservatives Mitglied des britischen Oberhauses und zugleich der Musicalkomponist hinter Hits wie Gute Stiefschwestern und Sunrise Ave.",
      heightCm: 175,
      hand: "right",
      eyes: "green",
      hair: "blond",
      sign: "virgo",
    },
    {
      id: "saffron",
      name: "Miss Saffron",
      icon: "\u{1F380}",
      description:
        "Hinreißend und charmant, aber vielleicht nicht die Hellste. Oder sie will, dass du das denkst. Oder sie will, dass du denkst, dass sie will, dass du das denkst.",
      heightCm: 157,
      hand: "left",
      eyes: "hazel",
      hair: "blond",
      sign: "libra",
    },
    {
      id: "violet",
      name: "Lady Violet",
      icon: "\u{1F478}",
      description:
        "Die Erbin der Veilcheninseln, des größten rechtsfreien Gebiets der Welt.",
      heightCm: 152,
      hand: "right",
      eyes: "blue",
      hair: "blond",
      sign: "virgo",
    },
  ],
  locations: [
    {
      id: "entrance",
      name: "der große Eingang",
      icon: "\u{1F6AA}",
      description: "Im Gästebuch checken viele Leute ein, aber keiner aus.",
      indoors: true,
    },
    {
      id: "boiler-room",
      name: "der Heizungskeller",
      icon: "\u{1F525}",
      description:
        "Angeblich der Raum, in dem es am meisten spukt. Ganz sicher der Raum mit dem meisten Kohlenmonoxid.",
      indoors: true,
    },
    {
      id: "ballroom",
      name: "der Ballsaal",
      icon: "\u{1F483}",
      description: "Jede Menge schöne Paare, die zu klassischem Jazz tanzen.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "muffin",
      name: "ein vergifteter Muffin",
      icon: "\u{1F9C1}",
      description:
        "Nicht nur vergiftet, sondern auch steinhart. Man kann ihn also auf zwei Arten benutzen.",
      weight: "light",
    },
    {
      id: "laundry-bag",
      name: "ein Wäschesack voller Messer",
      icon: "\u{1F52A}",
      description: "Manchmal muss man seine Messer eben waschen.",
      weight: "heavy",
    },
    {
      id: "pen",
      name: "ein goldener Füller",
      icon: "\u{1F58B}️",
      description:
        "Ein Füller aus massivem Gold (samt Tinte). Er kostet mehr als ein Haus.",
      weight: "medium",
    },
  ],
  clues: [
    {
      text: "Die verdächtige Person mit dem Wäschesack voller Messer ist am 13. Oktober geboren. (Siehe Beweisstück B.)",
      holds: (scene) => scene.holder("laundry-bag").sign === "libra",
    },
    {
      text: "Die größte verdächtige Person wurde im Heizungskeller gesehen, wie sie eine Art Beschwörungsformel murmelte.",
      holds: (scene) => scene.locationOf("lavender").id === "boiler-room",
    },
  ],
  statements: [
    {
      by: "lavender",
      text: "Lady Violet war nicht im großen Eingang.",
      holds: (scene) => scene.locationOf("violet").id !== "entrance",
    },
    {
      by: "saffron",
      text: "Ich weiß nicht, ob das etwas bedeutet, aber ein vergifteter Muffin war im Ballsaal.",
      holds: (scene) =>
        scene.locationOf(scene.holder("muffin").id).id === "ballroom",
    },
    {
      by: "violet",
      text: "Als Lady sage ich nur so viel: Ein goldener Füller war im großen Eingang.",
      holds: (scene) =>
        scene.locationOf(scene.holder("pen").id).id === "entrance",
    },
  ],
  exhibits: ["astrology"],
  solution: {
    lavender: { weapon: "pen", location: "boiler-room" },
    saffron: { weapon: "laundry-bag", location: "entrance" },
    violet: { weapon: "muffin", location: "ballroom" },
  },
  murderer: "violet",
  hints: [
    {
      text: 'Irratino hielt in seinem Zimmer eine Séance ab. Als er wieder herauskam, sagte er: "Der Mord geschah im Ballsaal."',
      book: true,
    },
    {
      text: "Der 13. Oktober liegt in der Waage (Beweisstück B). Waage ist nur Miss Saffron: Sie hatte den Wäschesack voller Messer.",
      marks: [{ a: "saffron", b: "laundry-bag", value: "check" }],
    },
    {
      text: "Die größte Person ist Lord Lavender (1,75 m): Er war im Heizungskeller.",
      marks: [{ a: "lavender", b: "boiler-room", value: "check" }],
    },
    {
      text: "Probiere aus, wer lügt. Lügt Lord Lavender, war Lady Violet im Eingang und Miss Saffron im Ballsaal. Saffron sagt dann die Wahrheit: Der Muffin war im Ballsaal - aber Saffron hat den Wäschesack. Das geht nicht.",
      marks: [
        { a: "saffron", b: "entrance", value: "check" },
        { a: "violet", b: "ballroom", value: "check" },
        { a: "muffin", b: "ballroom", value: "check" },
      ],
    },
    {
      text: "Also sagt Lavender die Wahrheit: Violet war im Ballsaal, Saffron im großen Eingang.",
    },
    {
      text: "Lügt Miss Saffron, war der Muffin nicht im Ballsaal, also bei Lavender, und Violet hatte den Füller. Violet sagt dann die Wahrheit: Der Füller war im Eingang - aber Violet war im Ballsaal. Das geht nicht.",
      marks: [
        { a: "lavender", b: "pen", value: "check" },
        { a: "violet", b: "muffin", value: "check" },
      ],
    },
    {
      text: "Also lügt Lady Violet - sie ist die Mörderin. Im Eingang war Saffron mit dem Wäschesack, also stimmt Violets Aussage tatsächlich nicht. Saffron sagt die Wahrheit: Der Muffin war im Ballsaal, bei Violet. Lavender hatte den Füller.",
      marks: [
        { a: "laundry-bag", b: "entrance", value: "check" },
        { a: "pen", b: "boiler-room", value: "check" },
      ],
    },
  ],
};
