/**
 * Case 12, "The Mysterious Mystery Bookshop Mystery": the owner of a mystery
 * bookshop killed.
 *
 * @module
 * @remarks
 * From Murdle: Volume 1 by G. T. Karber (Elementary). The bold last clue
 * names the weapon, not the place; the murderer is whoever had it. The sample prints the book's hint;
 * the solver found the only solution, and the other hints are our own.
 */
import type { Case } from "../engine/types";

/** The case. */
export const THE_MYSTERIOUS_MYSTERY_BOOKSHOP_MYSTERY: Case = {
  id: "the-mysterious-mystery-bookshop-mystery",
  number: 12,
  title: "Das mysteriöse Mysterium im Mystery-Buchladen",
  story:
    "Deductive Logico beschloss, das Rätsel um Dame Obsidian zu ergründen, indem er die Rätsel von Dame Obsidian ergründete, und ging deshalb in eine Krimibuchhandlung in der Nähe. Doch das erste Rätsel, auf das er dort stieß, war der Tod des Buchhändlers.",
  series: "volume1",
  difficulty: "elementary",
  suspects: [
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
    },
    {
      id: "champagne",
      name: "Genosse Champagne",
      icon: "\u{1F37E}",
      description:
        "Ein Kommunist - und ein reicher. Genosse Champagne liebt nichts mehr, als um die Welt zu reisen und die Botschaft des Kommunismus mit anderen Urlaubern zu teilen.",
      heightCm: 180,
      hand: "left",
      eyes: "hazel",
      hair: "blond",
    },
    {
      id: "dusty",
      name: "Regisseur Dusty",
      icon: "\u{1F3AC}",
      description:
        "Ein echter Filmemacher. Ihm geht es nur darum, seinen Film zu drehen. Koste es, was es wolle.",
      heightCm: 178,
      hand: "left",
      eyes: "hazel",
      hair: "bald",
    },
  ],
  locations: [
    {
      id: "discount-rack",
      name: "das Restpostenregal",
      icon: "\u{1F3F7}\u{FE0F}",
      description:
        "Hier findet man viele tolle Bücher - und bald ein halb gelöstes Exemplar von Murdle.",
      indoors: true,
    },
    {
      id: "front-counter",
      name: "die Kasse",
      icon: "\u{1F9FE}",
      description:
        "Hier kauft man die Bücher tatsächlich - oder einen der kleinen Schnickschnacks, die es hier zu kaufen gibt.",
      indoors: true,
    },
    {
      id: "rare-books-room",
      name: "das Raritätenzimmer",
      icon: "\u{1F4DA}",
      description:
        "Eine einzige Erstausgabe von Dame Obsidian kostet mehr, als Logicos Vater in seinem ganzen Leben verdient hat.",
      indoors: true,
    },
  ],
  weapons: [
    {
      id: "tote-bag",
      name: "ein Stoffbeutel",
      icon: "\u{1F45C}",
      description:
        "Bibliophile Mafiosi erledigen mit diesen Leinenbeuteln ihre Aufträge. Man kann auch Bücher darin tragen.",
      weight: "medium",
    },
    {
      id: "bone-folder",
      name: "ein Falzbein",
      icon: "\u{1F9B4}",
      description:
        "Ja, es ist aus Tierknochen. Aber nur weil man schon einmal getötet hat, heißt das nicht, dass man wieder tötet.",
      weight: "light",
    },
    {
      id: "paperback",
      name: "ein Taschenbuch",
      icon: "\u{1F4D5}",
      description:
        "Zu leicht, um jemanden damit niederzuschlagen, aber die Tinte ist so billig, dass sie giftig ist.",
      weight: "medium",
    },
  ],
  clues: [
    {
      text: "Ein Stoffbeutel wurde nicht beim Restpostenregal gefunden.",
      holds: (scene) =>
        scene.locationOf(scene.holder("tote-bag").id).id !== "discount-rack",
    },
    {
      text: "Ein Fleck giftiger Tinte wurde an der Kasse gefunden.",
      holds: (scene) =>
        scene.locationOf(scene.holder("paperback").id).id === "front-counter",
    },
    {
      text: "Ein Ladendiebstahlspiegel fing die Augen der Person im Raritätenzimmer ein: Sie waren dunkelbraun.",
      holds: (scene) => scene.at("rare-books-room").eyes === "darkBrown",
    },
    {
      text: "Beim Restpostenregal gab es keine Filmbücher, also war Regisseur Dusty nicht dort.",
      holds: (scene) => scene.locationOf("dusty").id !== "discount-rack",
    },
  ],
  body: {
    text: "Im Körper des Buchhändlers steckte ein Splitter Tierknochen.",
    weapon: "bone-folder",
  },
  solution: {
    slate: { weapon: "tote-bag", location: "rare-books-room" },
    champagne: { weapon: "bone-folder", location: "discount-rack" },
    dusty: { weapon: "paperback", location: "front-counter" },
  },
  murderer: "champagne",
  hints: [
    {
      text: 'Logico ging spazieren, um den Kopf freizubekommen, und sah ein Graffito auf der Straße: "Die Zeichen sind eindeutig: Kapitänin Slate war im Raritätenzimmer."',
      book: true,
      marks: [{ a: "slate", b: "rare-books-room", value: "check" }],
    },
    {
      text: "Dunkelbraune Augen hat nur Kapitänin Slate: Sie war im Raritätenzimmer.",
    },
    {
      text: "Regisseur Dusty war nicht beim Restpostenregal, also an der Kasse. Genosse Champagne bleibt das Restpostenregal.",
      marks: [
        { a: "dusty", b: "front-counter", value: "check" },
        { a: "champagne", b: "discount-rack", value: "check" },
      ],
    },
    {
      text: "Die giftige Tinte des Taschenbuchs war an der Kasse: Dusty hatte das Taschenbuch. Der Stoffbeutel war nicht beim Restpostenregal, also nicht bei Champagne - Slate hatte den Stoffbeutel, Champagne das Falzbein.",
      marks: [
        { a: "dusty", b: "paperback", value: "check" },
        { a: "paperback", b: "front-counter", value: "check" },
        { a: "slate", b: "tote-bag", value: "check" },
        { a: "champagne", b: "bone-folder", value: "check" },
        { a: "bone-folder", b: "discount-rack", value: "check" },
      ],
    },
    {
      text: "Der Knochensplitter stammt vom Falzbein - das hatte Genosse Champagne, beim Restpostenregal.",
      marks: [{ a: "tote-bag", b: "rare-books-room", value: "check" }],
    },
  ],
};
