/**
 * The games this site offers.
 *
 * @module
 * @remarks
 * Everything that has to work per game - saved state, statistics, the entries
 * on the statistics page, the cards on the start page - is keyed by
 * {@link GameId} and reads its label from here. Adding a game means adding one
 * entry plus its own engine and pages; the storage, statistics and overview
 * layers need no change.
 */

/** Identifies a game for storage and statistics. Never reuse an old id. */
export type GameId =
  | "drecksau"
  | "binokel"
  | "panzerkiste"
  | "krakel"
  | "skyjo"
  | "rv-there-yet"
  | "politik"
  | "camel-up"
  | "the-mind"
  | "qwixx"
  | "heckmeck"
  | "kniffel"
  | "kuhle-kuehe"
  | "jammerlappen"
  | "exploding-kittens"
  | "codenames"
  | "flip-7";

/** One game of the collection. */
export type GameDefinition = {
  readonly id: GameId;
  /** Shown in the UI - German, like all user facing texts. */
  readonly name: string;
  /** One line for the overview card. */
  readonly tagline: string;
  /** Cover icon on the overview card, until real artwork replaces it. */
  readonly emoji: string;
  /** Route of the game's own page. */
  readonly href: string;
};

/**
 * Every game there is, in the order they happened to be added.
 *
 * @remarks
 * Not the order anything is shown in - that is {@link GAMES}. New entries go
 * on the end, where they are easy to add and impossible to put in the wrong
 * place.
 */
const ENTRIES: readonly GameDefinition[] = [
  {
    id: "drecksau",
    name: "Drecksau",
    tagline: "Wer zuerst nur noch Drecksäue hat, gewinnt.",
    emoji: "\u{1F437}",
    href: "/drecksau",
  },
  {
    id: "binokel",
    name: "Binokel",
    tagline: "Schwäbisches Stichspiel - Reizen, Melden, Stechen.",
    emoji: "\u{1F0CF}",
    href: "/binokel",
  },
  {
    id: "panzerkiste",
    name: "Panzerkiste",
    tagline: "Zerstöre alle feindlichen Panzer - schießen, minen, ausweichen.",
    emoji: "\u{1F696}",
    href: "/panzerkiste",
  },
  {
    id: "krakel",
    name: "Krakel Orakel",
    tagline:
      "Alle malen gleichzeitig - streicht die Wörter, die keiner gemalt hat.",
    emoji: "\u{1F52E}",
    href: "/krakel",
  },
  {
    id: "rv-there-yet",
    name: "RV There Yet?",
    tagline: "Bring das Wohnmobil über den Berg - notfalls mit der Seilwinde.",
    emoji: "\u{1F69A}",
    href: "/rv-there-yet",
  },
  {
    id: "skyjo",
    name: "Skyjo",
    tagline: "Tausche deine Karten - die wenigsten Punkte gewinnen.",
    emoji: "\u{1F3B4}",
    href: "/skyjo",
  },
  {
    id: "politik",
    name: "Das politische Talent",
    tagline: "Wahlkampf, Koalitionen, Wahlversprechen - wer regiert, gewinnt.",
    emoji: "\u{1F3DB}\u{FE0F}",
    href: "/politik",
  },
  {
    id: "camel-up",
    name: "Camel Up",
    tagline: "Fünf Kamele, ein Stapel - wer getragen wird, liegt vorn.",
    emoji: "\u{1F42B}",
    href: "/camel-up",
  },
  {
    id: "the-mind",
    name: "The Mind",
    tagline: "Gemeinsam aufsteigend ablegen - ohne ein Wort.",
    emoji: "\u{1F9E0}",
    href: "/the-mind",
  },
  {
    id: "qwixx",
    name: "Qwixx",
    tagline: "Würfeln und ankreuzen - was du überspringst, ist weg.",
    emoji: "\u{270F}\u{FE0F}",
    href: "/qwixx",
  },
  {
    id: "heckmeck",
    name: "Heckmeck am Bratwurmeck",
    tagline: "Acht Würfel, sechzehn Chips - ohne Wurm zählt nichts.",
    emoji: "\u{1F41B}",
    href: "/heckmeck",
  },
  {
    id: "kuhle-kuehe",
    name: "Kuhle Kühe",
    tagline: "Baut die längsten Kühe und die größte Herde.",
    emoji: "\u{1F404}",
    href: "/kuhle-kuehe",
  },
  {
    id: "kniffel",
    name: "Kniffel",
    tagline: "Fünf Würfel, drei Würfe, dreizehn Felder - jedes nur einmal.",
    emoji: "\u{1F3B2}",
    href: "/kniffel",
  },
  {
    id: "jammerlappen",
    name: "Jammerlappen",
    tagline: "Werd alle Karten los - der Letzte ist der Jammerlappen.",
    emoji: "\u{1F62D}",
    href: "/jammerlappen",
  },
  {
    id: "exploding-kittens",
    name: "Exploding Kittens",
    tagline: "Zieh keine Bombe - wer als Letzter lebt, gewinnt.",
    emoji: "\u{1F4A5}",
    href: "/exploding-kittens",
  },
  {
    id: "codenames",
    name: "Codenames",
    tagline: "Ein Wort, eine Zahl - und der Attentäter wartet.",
    emoji: "\u{1F575}\u{FE0F}",
    href: "/codenames",
  },
  {
    id: "flip-7",
    name: "Flip 7",
    tagline: "Sieben verschiedene Zahlen - oder eine zu viel.",
    emoji: "\u{1F522}",
    href: "/flip-7",
  },
];

/**
 * All games, by name - the order they are listed everywhere.
 *
 * @remarks
 * Sorted here rather than at each place that shows a list, so the overview,
 * the statistics page and anything added later cannot drift apart. And sorted
 * rather than hand-ordered, because a hand-kept order is one more thing to get
 * right when a game is added, and the ninth one would have been added to the
 * end without anybody noticing.
 *
 * Compared the German way, so a future "Ärger" lands with the A rather than
 * after Z.
 */
export const GAMES: readonly GameDefinition[] = [...ENTRIES].sort(
  (left, right) => left.name.localeCompare(right.name, "de"),
);

/**
 * Looks up a game by its id.
 *
 * @param id - the game to look for
 * @returns the definition
 * @throws if the id is not registered
 */
export function gameById(id: GameId): GameDefinition {
  const game = GAMES.find((candidate) => candidate.id === id);
  if (game === undefined) {
    throw new Error(`unknown game: ${id}`);
  }
  return game;
}
