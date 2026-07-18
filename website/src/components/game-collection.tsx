/**
 * Start page: an overview of the games in the collection.
 *
 * @module
 * @remarks
 * Renders one card per entry in the games registry, so adding a game is just a
 * registry entry plus its own pages - nothing here changes.
 */
import Link from "next/link";
import type { ReactElement } from "react";
import { GAMES, type GameDefinition } from "@/games/registry";
import { COLLECTION_TEXTS } from "@/i18n/collection-texts";

/**
 * Renders the collection start page.
 *
 * @returns the overview element
 */
export function GameCollection(): ReactElement {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{COLLECTION_TEXTS.title}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {COLLECTION_TEXTS.subtitle}
          </p>
        </div>
        {/* Settings and statistics live inside each game, not here - every game
            keeps its own. */}
      </header>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map((game) => (
          <li key={game.id}>
            <GameCard game={game} />
          </li>
        ))}
        {/* Signals that the collection is meant to grow. */}
        <li>
          <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-200 p-5 text-center text-sm text-zinc-400 dark:border-zinc-800">
            <span className="text-3xl opacity-60">{"➕"}</span>
            {COLLECTION_TEXTS.moreSoon}
          </div>
        </li>
      </ul>
    </div>
  );
}

/** Props of {@link GameCard}. */
type GameCardProps = {
  readonly game: GameDefinition;
};

/** One clickable card leading into a game. */
function GameCard({ game }: GameCardProps): ReactElement {
  return (
    <Link
      href={game.href}
      data-testid={`game-card-${game.id}`}
      className="group flex h-full min-h-40 flex-col gap-3 rounded-2xl border border-zinc-200 bg-white/70 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50"
    >
      <span className="text-5xl leading-none">{game.emoji}</span>
      <div className="flex flex-1 flex-col">
        <h2 className="text-lg font-semibold">{game.name}</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {game.tagline}
        </p>
      </div>
      <span className="text-sm font-medium text-emerald-700 group-hover:underline dark:text-emerald-400">
        {COLLECTION_TEXTS.play} {"→"}
      </span>
    </Link>
  );
}
