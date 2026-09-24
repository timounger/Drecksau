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
  | "flip-7"
  | "sky-team"
  | "flash-point"
  | "the-game"
  | "risiko"
  | "monopoly"
  | "catan"
  | "bohnanza"
  | "arschloch"
  | "gta"
  | "dog";

/** The shelves the collection is sorted onto. */
export type GameCategory =
  "karten" | "wuerfel" | "gemeinsam" | "wort" | "action";

/**
 * The categories, in the order they are shown.
 *
 * @remarks
 * Every game sits on exactly one shelf. Two shelves for one game would mean a
 * player scrolling past the same card twice and wondering whether they had
 * missed something, and the question "which shelf is it on" would stop having
 * an answer.
 */
export const CATEGORIES: readonly {
  readonly id: GameCategory;
  readonly name: string;
}[] = [
  { id: "karten", name: "Kartenspiele" },
  { id: "wuerfel", name: "Würfelspiele" },
  { id: "gemeinsam", name: "Gemeinsam gegen das Spiel" },
  { id: "wort", name: "Wort und Party" },
  { id: "action", name: "Action und Taktik" },
];

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
  /** Which shelf it sits on in the overview. */
  readonly category: GameCategory;
  /**
   * The day it joined the collection, as `YYYY-MM-DD`.
   *
   * @remarks
   * Taken from when the game's folder first appeared in the repository, so it
   * is a fact rather than a guess. It is what "Neu" means - and it has to be
   * written down, because the order of the list below is only nearly the order
   * things were added and would quietly start lying the first time somebody
   * sorted it.
   */
  readonly addedOn: string;
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
    category: "karten",
    addedOn: "2026-07-18",
  },
  {
    id: "binokel",
    name: "Binokel",
    tagline: "Schwäbisches Stichspiel - Reizen, Melden, Stechen.",
    emoji: "\u{1F0CF}",
    href: "/binokel",
    category: "karten",
    addedOn: "2026-07-18",
  },
  {
    id: "panzerkiste",
    name: "Panzerkiste",
    tagline: "Zerstöre alle feindlichen Panzer - schießen, minen, ausweichen.",
    emoji: "\u{1F696}",
    href: "/panzerkiste",
    category: "action",
    addedOn: "2026-07-20",
  },
  {
    id: "krakel",
    name: "Krakel Orakel",
    tagline:
      "Alle malen gleichzeitig - streicht die Wörter, die keiner gemalt hat.",
    emoji: "\u{1F52E}",
    href: "/krakel",
    category: "wort",
    addedOn: "2026-07-28",
  },
  {
    id: "rv-there-yet",
    name: "RV There Yet?",
    tagline: "Bring das Wohnmobil über den Berg - notfalls mit der Seilwinde.",
    emoji: "\u{1F69A}",
    href: "/rv-there-yet",
    category: "gemeinsam",
    addedOn: "2026-08-03",
  },
  {
    id: "skyjo",
    name: "Skyjo",
    tagline: "Tausche deine Karten - die wenigsten Punkte gewinnen.",
    emoji: "\u{1F3B4}",
    href: "/skyjo",
    category: "karten",
    addedOn: "2026-07-30",
  },
  {
    id: "politik",
    name: "Das politische Talent",
    tagline: "Wahlkampf, Koalitionen, Wahlversprechen - wer regiert, gewinnt.",
    emoji: "\u{1F3DB}\u{FE0F}",
    href: "/politik",
    category: "action",
    addedOn: "2026-08-11",
  },
  {
    id: "camel-up",
    name: "Camel Up",
    tagline: "Fünf Kamele, ein Stapel - wer getragen wird, liegt vorn.",
    emoji: "\u{1F42B}",
    href: "/camel-up",
    category: "wuerfel",
    addedOn: "2026-08-14",
  },
  {
    id: "the-mind",
    name: "The Mind",
    tagline: "Gemeinsam aufsteigend ablegen - ohne ein Wort.",
    emoji: "\u{1F9E0}",
    href: "/the-mind",
    category: "gemeinsam",
    addedOn: "2026-08-14",
  },
  {
    id: "qwixx",
    name: "Qwixx",
    tagline: "Würfeln und ankreuzen - was du überspringst, ist weg.",
    emoji: "\u{270F}\u{FE0F}",
    href: "/qwixx",
    category: "wuerfel",
    addedOn: "2026-08-14",
  },
  {
    id: "heckmeck",
    name: "Heckmeck am Bratwurmeck",
    tagline: "Acht Würfel, sechzehn Chips - ohne Wurm zählt nichts.",
    emoji: "\u{1F41B}",
    href: "/heckmeck",
    category: "wuerfel",
    addedOn: "2026-08-14",
  },
  {
    id: "kuhle-kuehe",
    name: "Kuhle Kühe",
    tagline: "Baut die längsten Kühe und die größte Herde.",
    emoji: "\u{1F404}",
    href: "/kuhle-kuehe",
    category: "karten",
    addedOn: "2026-08-20",
  },
  {
    id: "kniffel",
    name: "Kniffel",
    tagline: "Fünf Würfel, drei Würfe, dreizehn Felder - jedes nur einmal.",
    emoji: "\u{1F3B2}",
    href: "/kniffel",
    category: "wuerfel",
    addedOn: "2026-08-14",
  },
  {
    id: "jammerlappen",
    name: "Jammerlappen",
    tagline: "Werd alle Karten los - der Letzte ist der Jammerlappen.",
    emoji: "\u{1F62D}",
    href: "/jammerlappen",
    category: "karten",
    addedOn: "2026-08-20",
  },
  {
    id: "exploding-kittens",
    name: "Exploding Kittens",
    tagline: "Zieh keine Bombe - wer als Letzter lebt, gewinnt.",
    emoji: "\u{1F4A5}",
    href: "/exploding-kittens",
    category: "karten",
    addedOn: "2026-08-20",
  },
  {
    id: "codenames",
    name: "Codenames",
    tagline: "Ein Wort, eine Zahl - und der Attentäter wartet.",
    emoji: "\u{1F575}\u{FE0F}",
    href: "/codenames",
    category: "wort",
    addedOn: "2026-08-20",
  },
  {
    id: "flash-point",
    name: "Flash Point",
    tagline: "Rettet die Opfer, bevor das Haus einstürzt.",
    emoji: "\u{1F692}",
    href: "/flash-point",
    category: "gemeinsam",
    addedOn: "2026-08-22",
  },
  {
    id: "sky-team",
    name: "Sky Team",
    tagline: "Landet das Flugzeug zu zweit - und schweigt dabei.",
    emoji: "\u{2708}\u{FE0F}",
    href: "/sky-team",
    category: "gemeinsam",
    addedOn: "2026-08-22",
  },
  {
    id: "flip-7",
    name: "Flip 7",
    tagline: "Sieben verschiedene Zahlen - oder eine zu viel.",
    emoji: "\u{1F522}",
    href: "/flip-7",
    category: "karten",
    addedOn: "2026-08-20",
  },
  {
    id: "gta",
    name: "GTA",
    tagline: "Los Santos von oben - fahren, liefern, überfallen, abhauen.",
    emoji: "\u{1F697}",
    href: "/gta",
    category: "action",
    addedOn: "2026-09-06",
  },
  {
    id: "dog",
    name: "Dog",
    tagline: "Den Letzten beißen die Hunde - mit Karten ins Ziel.",
    emoji: "\u{1F436}",
    href: "/dog",
    category: "karten",
    addedOn: "2026-09-11",
  },
  {
    id: "arschloch",
    name: "Arschloch",
    tagline: "Karten loswerden - der Letzte ist es.",
    emoji: "\u{1F0CF}",
    href: "/arschloch",
    category: "karten",
    addedOn: "2026-08-30",
  },
  {
    id: "the-game",
    name: "The Game",
    tagline: "98 Karten auf vier Reihen - und keiner darf Zahlen nennen.",
    emoji: "\u{2195}\u{FE0F}",
    href: "/the-game",
    category: "karten",
    addedOn: "2026-08-22",
  },
  {
    id: "risiko",
    name: "Risiko",
    tagline: "Gebiet für Gebiet die Welt erobern.",
    emoji: "\u{1F30D}",
    href: "/risiko",
    category: "action",
    addedOn: "2026-08-22",
  },
  {
    id: "monopoly",
    name: "Monopoly",
    tagline: "Kaufen, bauen, kassieren - bis nur noch einer zahlen kann.",
    emoji: "\u{1F3E0}",
    href: "/monopoly",
    category: "action",
    addedOn: "2026-08-23",
  },
  {
    id: "catan",
    name: "CATAN",
    tagline: "Siedeln, handeln, bauen - und die Insel unter euch aufteilen.",
    emoji: "\u{1F3DD}\u{FE0F}",
    href: "/catan",
    category: "action",
    addedOn: "2026-08-23",
  },
  {
    id: "bohnanza",
    name: "Bohnanza",
    tagline: "Anbauen, handeln, ernten - wer die meisten Taler hat, gewinnt.",
    emoji: "\u{1FAD8}",
    href: "/bohnanza",
    category: "karten",
    addedOn: "2026-08-26",
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
 * How many games "Neu" shows at most.
 *
 * @remarks
 * A cap rather than a time window: a quiet month would leave the shelf empty,
 * and a busy week would put half the collection on it. Nothing ages off this
 * shelf by itself - a game stays on it until three newer ones have pushed it
 * off, which for a collection that grows a game a week is about three weeks.
 *
 * **Three, which is one row.** Six filled two rows on a wide screen and one
 * and a half on a narrow one, and a shelf headed "Neu" whose second row is a
 * month old is not answering the question it asks. One row, the newest three,
 * and the rest of the page starts that much sooner.
 */
const NEW_LIMIT = 3;

/**
 * How old a game may be and still be news, in days.
 *
 * @remarks
 * A month, and it is measured **per game**: what is older does not go on the
 * shelf, whatever else is up there. The shelf then empties itself once
 * nothing has arrived for a month, which is the same rule seen from the other
 * end - and it is the rule the line under the heading claims, which is why it
 * is this one. A card two months old sitting under "Neu" because a newer one
 * happened to be beside it makes that line a lie.
 *
 * It comes back by itself with the next game.
 */
export const NEW_WINDOW_DAYS = 30;

/** Milliseconds in a day. */
const DAY_MS = 86_400_000;

/**
 * The games that joined the collection most recently.
 *
 * @param now - the moment to measure their age against
 * @param skip - games that are not to be counted as new, by id
 * @returns the games added within {@link NEW_WINDOW_DAYS}, newest first,
 *   never more than {@link NEW_LIMIT}; empty when none arrived that recently
 * @remarks
 * **What is shown elsewhere above is not news here.** The start page hands in
 * whatever stands on "Beliebt", and those games are left out altogether - not
 * merely hidden, but skipped before the three are counted out, so the shelf
 * shows the three newest games one has *not* already seen a hand's breadth
 * higher up the page. A card twice on one screen is a card one looks at twice
 * and wonders about.
 *
 * Cut on whole days. Five games added on the same afternoon are equally new,
 * and taking four of them because a limit fell in the middle would put one
 * game on a shelf and its twin off it for no reason a reader could see. So a
 * day is taken whole or not at all, and the shelf may come out a little
 * shorter than the limit.
 *
 * **The limit still holds at the end**, whole days or not: one day carrying
 * more games than the whole shelf is the one case where the day has to be cut
 * after all, and a shelf of three that shows five on that morning is not a
 * shelf of three. The ones kept are the first of that day as the register has
 * them - arbitrary, but the same on every visit, which is what matters when
 * the alternative is a row that changes size.
 */
export function newGames(
  now = Date.now(),
  skip: readonly string[] = [],
): readonly GameDefinition[] {
  const since = now - NEW_WINDOW_DAYS * DAY_MS;
  const byDay = [...ENTRIES]
    .filter((game) => !skip.includes(game.id) && addedAt(game.addedOn) > since)
    .sort((left, right) => right.addedOn.localeCompare(left.addedOn));
  const taken: GameDefinition[] = [];
  let at = 0;
  let full = false;
  while (at < byDay.length && !full) {
    const group = byDay.filter((game) => game.addedOn === byDay[at].addedOn);
    // A day that does not fit **ends** the shelf. Skipping it to reach for an
    // older, smaller day would fill the last place with a game that is not
    // among the newest at all.
    if (taken.length === 0 || taken.length + group.length <= NEW_LIMIT) {
      taken.push(...group);
      at += group.length;
    } else {
      full = true;
    }
  }
  return taken.slice(0, NEW_LIMIT);
}

/**
 * The day a game was added, as a moment.
 *
 * @param day - the date it carries, as `YYYY-MM-DD`
 * @returns the start of that day in UTC, in epoch milliseconds
 * @remarks
 * UTC, because the date is written down as a day and not as a moment: read in
 * local time, a game added on the first would be a few hours older or younger
 * depending on who is looking at it.
 */
function addedAt(day: string): number {
  return Date.parse(`${day}T00:00:00Z`);
}

/**
 * The games on one shelf, by name.
 *
 * @param category - which shelf
 * @returns its games, in the collection's usual order
 */
export function gamesIn(category: GameCategory): readonly GameDefinition[] {
  return GAMES.filter((game) => game.category === category);
}

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
