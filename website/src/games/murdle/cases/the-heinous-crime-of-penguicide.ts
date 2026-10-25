/**
 * Case 43, "The Heinous Crime of Penguicide": an endangered penguin killed in
 * the frozen south.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Occult Medium), from the photos of
 * the book. There is no body clue - the liar is the murderer. "The
 * scientist/skier/suspect" is Mx. Tangerine, by their card. The solver found
 * the only solution, and the hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const THE_HEINOUS_CRIME_OF_PENGUICIDE: Case = {
  id: "the-heinous-crime-of-penguicide",
  number: 43,
  title: "Das scheußliche Verbrechen des Pinguizids",
  story:
    'Deductive Logico fand Inspektor Irratino weinend vor und fragte ihn, was los sei. "Ein vom Aussterben bedrohter Pinguin wurde getötet!", heulte der Inspektor. Logico packte ihn an der Schulter und sagte: "Wir werden seinen Mord aufklären."',
  series: "volume1",
  difficulty: "occult",
  suspects: [
    {
      id: "tuscany",
      name: "Rektorin Tuscany",
      icon: "\u{1F393}",
      description:
        "Als Leiterin des Deduction College wird sie für ihre Macht, ihr Wissen und die Tatsache respektiert, dass man sie nie erwischt hat.",
      heightCm: 165,
      hand: "left",
      eyes: "green",
      hair: "gray",
      sign: "libra",
    },
    {
      id: "duchess",
      name: "Die Herzogin von Vermillion",
      icon: "\u{1F475}",
      description:
        "Eine große alte Frau mit großen alten Geheimnissen. Wie oft soll ich dir das denn noch sagen?",
      heightCm: 175,
      hand: "left",
      eyes: "gray",
      hair: "white",
      sign: "pisces",
    },
    {
      id: "tangerine",
      name: "Mx. Tangerine",
      icon: "\u{1F9E2}",
      description:
        "Der Beweis, dass auch nicht-binäre Menschen Mörder sein können: Wissenschaftler:in, Skifahrer:in und verdächtig.",
      heightCm: 165,
      hand: "left",
      eyes: "hazel",
      hair: "blond",
      sign: "pisces",
    },
  ],
  locations: [
    {
      id: "ping-pong-room",
      name: "der Tischtennisraum",
      icon: "\u{1F3D3}",
      description:
        "Um Dampf abzulassen oder (passender) das Eis zu brechen. Es gibt Snacks!",
      indoors: true,
    },
    {
      id: "wastelands",
      name: "die gefrorene Einöde",
      icon: "❄️",
      description:
        "Eine weite, gnadenlose Wildnis - aber wenigstens hat man hier mal seine Ruhe.",
      indoors: false,
    },
    {
      id: "barracks",
      name: "die Unterkunft",
      icon: "\u{1F6CF}️",
      description: "Hier schlafen alle unter unglaublich kuscheligen Decken.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "hot-chocolate",
      name: "vergiftete heiße Schokolade",
      icon: "☕",
      description:
        "Trink aus - es ist das letzte Mal, dass dir warm ums Bäuchlein wird.",
      weight: "light",
    },
    {
      id: "ice-axe",
      name: "ein Eispickel",
      icon: "⛏️",
      description:
        "Zum Klettern, zum Töten und für alles andere, wofür man ein kleines Loch braucht.",
      weight: "medium",
    },
    {
      id: "icicle",
      name: "ein Eiszapfendolch",
      icon: "\u{1F9CA}",
      description:
        "Die perfekte Waffe. Man ersticht jemanden und hinterlässt nur eine Pfütze.",
      weight: "light",
    },
  ],
  clues: [
    {
      text: "Die verdächtige Person in der gefrorenen Einöde hatte weiße Haare.",
      holds: (scene) => scene.at("wastelands").hair === "white",
    },
    {
      text: "Die Wissenschaftler:in/Skifahrer:in/verdächtige Person hat keinen Eiszapfendolch mitgebracht.",
      holds: (scene) => scene.weaponOf("tangerine").id !== "icicle",
    },
  ],
  statements: [
    {
      by: "tuscany",
      text: "Als Inhaberin von sieben Doktortiteln sage ich nur: Ich war im Tischtennisraum.",
      holds: (scene) => scene.locationOf("tuscany").id === "ping-pong-room",
    },
    {
      by: "duchess",
      text: "Wollen Sie wissen, was ich denke? Rektorin Tuscany hat vergiftete heiße Schokolade mitgebracht.",
      holds: (scene) => scene.weaponOf("tuscany").id === "hot-chocolate",
    },
    {
      by: "tangerine",
      text: "Wenn ich etwas sagen müsste: Ein Eispickel war in der Unterkunft.",
      holds: (scene) =>
        scene.locationOf(scene.holder("ice-axe").id).id === "barracks",
    },
  ],
  exhibits: ["astrology"],
  solution: {
    tuscany: { weapon: "icicle", location: "ping-pong-room" },
    duchess: { weapon: "hot-chocolate", location: "wastelands" },
    tangerine: { weapon: "ice-axe", location: "barracks" },
  },
  murderer: "duchess",
  hints: [
    {
      text: 'Inspektor Irratino rief: "Warum, Gott?!", und hörte nichts. Also rief er: "Wie, Gott?!", und hörte: "Der Pinguin wurde vergiftet!"',
      book: true,
    },
    {
      text: "Weiße Haare hat nur die Herzogin von Vermillion: Sie war in der gefrorenen Einöde.",
      marks: [{ a: "duchess", b: "wastelands", value: "check" }],
    },
    {
      text: "Probiere aus, wer lügt. Lügt Rektorin Tuscany, war sie in der Unterkunft und Mx. Tangerine im Tischtennisraum. Dann sagen die anderen die Wahrheit: Tuscany hatte die Schokolade, und der Eispickel war in der Unterkunft - also auch bei Tuscany. Das geht nicht.",
      marks: [{ a: "ice-axe", b: "barracks", value: "check" }],
    },
    {
      text: "Also war Tuscany im Tischtennisraum und Mx. Tangerine in der Unterkunft.",
      marks: [
        { a: "tuscany", b: "ping-pong-room", value: "check" },
        { a: "tangerine", b: "barracks", value: "check" },
      ],
    },
    {
      text: "Lügt Mx. Tangerine, war der Eispickel nicht in der Unterkunft. Tangerine hätte dann weder Pickel noch Dolch, also die Schokolade - aber laut Herzogin hat Tuscany die Schokolade. Das geht nicht.",
      marks: [
        { a: "tangerine", b: "ice-axe", value: "check" },
        { a: "duchess", b: "hot-chocolate", value: "check" },
      ],
    },
    {
      text: "Also lügt die Herzogin von Vermillion - sie ist die Mörderin. Mx. Tangerine sagt die Wahrheit: Tangerine hatte den Eispickel in der Unterkunft.",
    },
    {
      text: "Tuscany hatte keine Schokolade, also den Eiszapfendolch. Die Herzogin tötete den Pinguin mit der vergifteten heißen Schokolade in der gefrorenen Einöde.",
      marks: [
        { a: "tuscany", b: "icicle", value: "check" },
        { a: "hot-chocolate", b: "wastelands", value: "check" },
        { a: "icicle", b: "ping-pong-room", value: "check" },
      ],
    },
  ],
};
