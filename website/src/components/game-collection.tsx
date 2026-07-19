/**
 * Start page: an overview of the games in the collection.
 *
 * @module
 * @remarks
 * Renders one card per entry in the games registry, so adding a game is just a
 * registry entry plus its own pages - nothing here changes. A search box filters
 * the cards live by name.
 */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactElement } from "react";
import { GAMES, type GameDefinition } from "@/games/registry";
import { GAME_LOGOS } from "@/games/game-logos";
import { COLLECTION_TEXTS } from "@/i18n/collection-texts";

/**
 * Renders the collection start page.
 *
 * @returns the overview element
 */
export function GameCollection(): ReactElement {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const matches =
    needle === ""
      ? GAMES
      : GAMES.filter((game) => game.name.toLowerCase().includes(needle));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-4">
      <header className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold">{COLLECTION_TEXTS.title}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {COLLECTION_TEXTS.subtitle}
          </p>
        </div>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={COLLECTION_TEXTS.searchPlaceholder}
          aria-label={COLLECTION_TEXTS.searchPlaceholder}
          data-testid="game-search"
          className="w-full max-w-sm rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </header>

      {matches.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {COLLECTION_TEXTS.noResults}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((game) => (
            <li key={game.id}>
              <GameCard game={game} />
            </li>
          ))}
          {/* The "more to come" tile only makes sense in the full, unfiltered list. */}
          {needle === "" && (
            <li>
              <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-200 p-5 text-center text-sm text-zinc-400 dark:border-zinc-800">
                <span className="text-3xl opacity-60">{"➕"}</span>
                {COLLECTION_TEXTS.moreSoon}
              </div>
            </li>
          )}
        </ul>
      )}
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
      <span className="relative block h-16 w-16 overflow-hidden rounded-xl">
        <Image
          src={GAME_LOGOS[game.id]}
          alt=""
          fill
          sizes="64px"
          className="object-cover"
        />
      </span>
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
