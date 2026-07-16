/**
 * The games this site offers.
 *
 * @module
 * @remarks
 * Everything that has to work per game - saved state, statistics, the entries
 * on the statistics page - is keyed by {@link GameId} and reads its label from
 * here. Adding a game means adding one entry plus its own engine; the storage
 * and statistics layers need no change.
 */

/** Identifies a game for storage and statistics. Never reuse an old id. */
export type GameId = "drecksau";

/** One game of the collection. */
export type GameDefinition = {
  readonly id: GameId;
  /** Shown in the UI - German, like all user facing texts. */
  readonly name: string;
  /** Route of the game page. */
  readonly href: string;
};

/** All games, in the order they are listed. */
export const GAMES: readonly GameDefinition[] = [
  { id: "drecksau", name: "Drecksau", href: "/" },
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
