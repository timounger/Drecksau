/**
 * Case 1, "Murder in Hollywood": a dinner party in the Hollywood Hills.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Elementary). The book prints its hint
 * and its solution; the screening room and the bathroom are "outdoors" there,
 * and so they are here.
 */
import type { Case } from "../engine/types";

/** The case. */
export const MURDER_IN_HOLLYWOOD: Case = {
  id: "murder-in-hollywood",
  number: 1,
  title: "Mord in Hollywood",
  story:
    "Als Deductive Logico zu einem feinen Abendessen in einer Villa in den Hollywood Hills eingeladen wurde, dachte er, er hätte es endlich geschafft. Leider war er nicht der Ehrengast: Er sollte den Mord am Ehrengast aufklären.",
  series: "volume1",
  difficulty: "elementary",
  suspects: [
    {
      id: "aureolin",
      name: "Die unglaubliche Aureolin",
      icon: "\u{1FA84}",
      description:
        "Eine Zauberin, die die Nummer mit dem zersägten Ehemann perfektioniert hat. Danach ließ sie seine Leiche verschwinden.",
      heightCm: 168,
      hand: "left",
      eyes: "green",
      hair: "blond",
    },
    {
      id: "midnight",
      name: "Midnight III",
      icon: "\u{1F576}️",
      description:
        "Der Enkel des Gründers von Midnight Movies - und nach eigener Aussage ein Selfmade-Mann.",
      heightCm: 173,
      hand: "left",
      eyes: "darkBrown",
      hair: "darkBrown",
    },
    {
      id: "obsidian",
      name: "Dame Obsidian",
      icon: "\u{1F452}",
      description:
        "Eine Krimiautorin, deren Bücher sich öfter verkauft haben als die Bibel und Shakespeare zusammen.",
      heightCm: 163,
      hand: "left",
      eyes: "green",
      hair: "black",
    },
  ],
  locations: [
    {
      id: "bathroom",
      name: "das riesige Badezimmer",
      icon: "\u{1F6C1}",
      description: "Ein Badezimmer, das größer ist als Deductive Logicos Haus.",
      indoors: false,
    },
    {
      id: "bedroom",
      name: "das Schlafzimmer",
      icon: "\u{1F6CF}️",
      description:
        "Ein ungemachtes Kingsize-Bett steht in einem blitzsauberen weißen Raum.",
      indoors: true,
    },
    {
      id: "screening-room",
      name: "der Vorführraum",
      icon: "\u{1F4FA}",
      description:
        "Rote Samtsitze und eine Popcornmaschine machen ihn zum ultimativen Kinoerlebnis.",
      indoors: false,
    },
  ],
  weapons: [
    {
      id: "fork",
      name: "eine Gabel",
      icon: "\u{1F374}",
      description:
        "Eigentlich viel grausiger als ein Messer, wenn man darüber nachdenkt.",
      weight: "light",
    },
    {
      id: "pipe",
      name: "ein Aluminiumrohr",
      icon: "\u{1F529}",
      description: "Sicherer als Blei - außer es trifft dich am Kopf.",
      weight: "medium",
    },
    {
      id: "candle",
      name: "eine schwere Kerze",
      icon: "\u{1F56F}️",
      description:
        "Schwer genug, um zu töten, und trotzdem hellt sie den Raum auf.",
      weight: "medium",
    },
  ],
  clues: [
    {
      text: "Die unglaubliche Aureolin vertraute der Person, die eine Gabel mitgebracht hatte.",
      holds: (scene) => scene.holder("fork").id !== "aureolin",
    },
    {
      text: "Midnight III fuchtelte noch mit einem Aluminiumrohr herum, als Logico eintraf.",
      holds: (scene) => scene.weaponOf("midnight").id === "pipe",
    },
    {
      text: "Eine schwere Kerze wurde nicht im Schlafzimmer gefunden.",
      holds: (scene) =>
        scene.locationOf(scene.holder("candle").id).id !== "bedroom",
    },
    {
      text: "Dame Obsidian wurde versteckt unter roten Samtsitzen gefunden.",
      holds: (scene) => scene.locationOf("obsidian").id === "screening-room",
    },
  ],
  body: {
    text: "Die Leiche wurde in einer Marmorwanne gefunden.",
    location: "bathroom",
  },
  solution: {
    aureolin: { weapon: "candle", location: "bathroom" },
    midnight: { weapon: "pipe", location: "bedroom" },
    obsidian: { weapon: "fork", location: "screening-room" },
  },
  murderer: "aureolin",
  hints: [
    {
      text: 'Während Logico ermittelte, klingelte in der Villa das Telefon. Eine selbstsichere Stimme sagte: "Ich habe gerade Runen geworfen, Logico, und sie sagen: Dame Obsidian aß mit einer Gabel." Bevor Logico fragen konnte, wer da sprach, war aufgelegt.',
      book: true,
      marks: [{ a: "obsidian", b: "fork", value: "check" }],
    },
    {
      text: "Midnight III hatte das Aluminiumrohr. Die unglaubliche Aureolin vertraute der Person mit der Gabel - sie selbst hatte sie also nicht. Ihr bleibt die schwere Kerze, Dame Obsidian die Gabel.",
      marks: [
        { a: "midnight", b: "pipe", value: "check" },
        { a: "aureolin", b: "fork", value: "cross" },
      ],
    },
    {
      text: "Rote Samtsitze stehen im Vorführraum: Dort war Dame Obsidian.",
      marks: [{ a: "obsidian", b: "screening-room", value: "check" }],
    },
    {
      text: "Die Kerze war nicht im Schlafzimmer. Die unglaubliche Aureolin war also im Badezimmer, Midnight III im Schlafzimmer.",
      marks: [
        { a: "candle", b: "bedroom", value: "cross" },
        { a: "aureolin", b: "bathroom", value: "check" },
        { a: "midnight", b: "bedroom", value: "check" },
      ],
    },
    {
      text: "Die Marmorwanne steht im Badezimmer - und dort war die unglaubliche Aureolin, mit der schweren Kerze.",
      marks: [
        { a: "aureolin", b: "candle", value: "check" },
        { a: "candle", b: "bathroom", value: "check" },
        { a: "pipe", b: "bedroom", value: "check" },
        { a: "fork", b: "screening-room", value: "check" },
      ],
    },
  ],
  outro:
    'Die unglaubliche Aureolin beteuerte immer wieder ihre Unschuld, doch Deductive Logicos Argumenten konnte sie nichts entgegensetzen. Er hatte nachweislich recht. Sie gestand so gut wie, als sie rief: "Keine Zelle kann mich halten!"',
};
