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
export type GameId = "drecksau";

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

/** All games, in the order they are listed on the start page. */
export const GAMES: readonly GameDefinition[] = [
  {
    id: "drecksau",
    name: "Drecksau",
    tagline: "Wer zuerst nur noch Drecksäue hat, gewinnt.",
    emoji: "\u{1F437}",
    href: "/drecksau",
  },
];

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
