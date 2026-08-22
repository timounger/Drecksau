/**
 * Start page: an overview of the games in the collection.
 *
 * @module
 * @remarks
 * Shelves rather than one long list: seventeen cards in alphabetical order is a
 * catalogue, and a catalogue answers no question anybody actually arrives with.
 * The two shelves at the top answer the two that come up first - what is
 * everyone playing, and what is new - and the rest sort by what kind of evening
 * a game is.
 *
 * A game sits on exactly one category shelf, but may also appear on "Beliebt"
 * and "Neu" above it. Those two are the answer to a question, not a filing
 * place, so seeing a card there and again below is the point rather than a
 * repetition.
 *
 * Searching drops the shelves and shows one flat list. Somebody typing a name
 * knows what they are looking for, and putting the hits back into sections
 * would only make them hunt through the sections as well.
 */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactElement } from "react";
import {
  CATEGORIES,
  GAMES,
  gamesIn,
  newGames,
  type GameDefinition,
} from "@/games/registry";
import { GAME_LOGOS } from "@/games/game-logos";
import { COLLECTION_TEXTS } from "@/i18n/collection-texts";
import { POPULAR_DAYS, loadPlayTimes } from "@/online/popularity";

/** How many games the popular shelf holds. */
const POPULAR_LIMIT = 6;

/**
 * Renders the collection start page.
 *
 * @returns the overview element
 */
export function GameCollection(): ReactElement {
  const [query, setQuery] = useState("");
  const popular = usePopularGames();
  const needle = query.trim().toLowerCase();
  const matches =
    needle === ""
      ? GAMES
      : GAMES.filter((game) => game.name.toLowerCase().includes(needle));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 p-4">
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

      {needle !== "" ? (
        <Found matches={matches} />
      ) : (
        <Shelves popular={popular} />
      )}
    </div>
  );
}

/** What a search turned up, as one flat list. */
function Found({
  matches,
}: {
  readonly matches: readonly GameDefinition[];
}): ReactElement {
  return matches.length === 0 ? (
    <p className="text-sm text-zinc-500 dark:text-zinc-400">
      {COLLECTION_TEXTS.noResults}
    </p>
  ) : (
    <Grid games={matches} />
  );
}

/** The whole collection, sorted onto its shelves. */
function Shelves({
  popular,
}: {
  readonly popular: readonly GameDefinition[];
}): ReactElement {
  return (
    <div className="flex flex-col gap-8">
      {/* Only once anybody has played: an empty shelf headed "Beliebt" says
          nothing, and a shelf filled with a stand-in would be a lie. */}
      {popular.length > 0 && (
        <Shelf
          id="beliebt"
          title={COLLECTION_TEXTS.popular}
          hint={COLLECTION_TEXTS.popularHint(POPULAR_DAYS)}
          games={popular}
        />
      )}
      <Shelf
        id="neu"
        title={COLLECTION_TEXTS.newest}
        hint={COLLECTION_TEXTS.newestHint}
        games={newGames()}
      />
      {CATEGORIES.map((category) => (
        <Shelf
          key={category.id}
          id={category.id}
          title={category.name}
          games={gamesIn(category.id)}
        />
      ))}
      <p className="flex items-center gap-2 rounded-2xl border-2 border-dashed border-zinc-200 p-5 text-sm text-zinc-400 dark:border-zinc-800">
        <span className="text-2xl opacity-60">{"\u{2795}"}</span>
        {COLLECTION_TEXTS.moreSoon}
      </p>
    </div>
  );
}

/** One headed row of game cards. */
function Shelf({
  id,
  title,
  hint,
  games,
}: {
  readonly id: string;
  readonly title: string;
  /** A line under the heading saying what the shelf means, where that helps. */
  readonly hint?: string;
  readonly games: readonly GameDefinition[];
}): ReactElement {
  return (
    <section data-testid={`shelf-${id}`} className="flex flex-col gap-3">
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        {hint !== undefined && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
        )}
      </div>
      <Grid games={games} />
    </section>
  );
}

/** Cards, three across where there is room. */
function Grid({
  games,
}: {
  readonly games: readonly GameDefinition[];
}): ReactElement {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {games.map((game) => (
        <li key={game.id}>
          <GameCard game={game} />
        </li>
      ))}
    </ul>
  );
}

/**
 * The most played games of the last days, once the numbers have arrived.
 *
 * @returns the popular games, longest played first; empty until then
 * @remarks
 * Fetched after the page is up rather than before it: this is the start page,
 * and it must not wait on a network round trip to show a list it already has.
 * The shelf appears when the answer does. A failure leaves it absent, which is
 * the right outcome - a shelf that cannot say what is popular should not claim
 * to.
 */
function usePopularGames(): readonly GameDefinition[] {
  const [ranked, setRanked] = useState<readonly GameDefinition[]>([]);

  useEffect(() => {
    let stale = false;
    void loadPlayTimes().then(
      (times) => {
        if (!stale) {
          setRanked(
            [...GAMES]
              .filter((game) => (times.get(game.id) ?? 0) > 0)
              .sort(
                (left, right) =>
                  (times.get(right.id) ?? 0) - (times.get(left.id) ?? 0),
              )
              .slice(0, POPULAR_LIMIT),
          );
        }
      },
      () => undefined,
    );
    return () => {
      stale = true;
    };
  }, []);

  return ranked;
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
        <h3 className="text-lg font-semibold">{game.name}</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {game.tagline}
        </p>
      </div>
      <span className="text-sm font-medium text-emerald-700 group-hover:underline dark:text-emerald-400">
        {COLLECTION_TEXTS.play} {"\u{2192}"}
      </span>
    </Link>
  );
}
