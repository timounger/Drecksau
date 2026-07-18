/**
 * Statistics of every game, with a reset per game.
 *
 * @module
 */
"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactElement } from "react";
import {
  GAMES,
  gameById,
  type GameDefinition,
  type GameId,
} from "@/games/registry";
import { clearSession } from "@/lib/storage/game-session";
import {
  abandonedGames,
  averagePlayTimeMs,
  isEmptyStats,
  winRate,
  type GameStats,
} from "@/lib/stats/game-stats";
import {
  getServerStatsSnapshot,
  getStatsSnapshot,
  invalidateStats,
  subscribeStats,
} from "@/lib/stats/stats-store";
import { resetStats } from "@/lib/stats/stats-storage";
import { formatDateTime, formatDuration, formatPercent } from "@/i18n/format";
import { STATS_TEXTS } from "@/i18n/collection-texts";

/** Props of {@link StatsView}. */
export type StatsViewProps = {
  /** Show only this game's statistics; omit to show every game. */
  readonly gameId?: GameId;
};

/**
 * Renders the statistics page, either for one game or the whole collection.
 *
 * @param props - the game to scope to, if any
 * @returns the page element
 */
export function StatsView({ gameId }: StatsViewProps = {}): ReactElement {
  const statsByGame = useSyncExternalStore(
    subscribeStats,
    getStatsSnapshot,
    getServerStatsSnapshot,
  );

  const handleReset = (id: GameId) => {
    if (window.confirm(STATS_TEXTS.resetConfirm)) {
      resetStats(id);
      // The running game goes too - counters at zero next to a game in
      // progress would contradict each other.
      clearSession(id);
      invalidateStats();
    }
  };

  const games = gameId === undefined ? GAMES : [gameById(gameId)];
  const backHref = gameId === undefined ? "/" : gameById(gameId).href;
  const backLabel =
    gameId === undefined ? STATS_TEXTS.backToOverview : STATS_TEXTS.backToGame;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{STATS_TEXTS.title}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {STATS_TEXTS.subtitle}
          </p>
        </div>
        <Link
          href={backHref}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {backLabel}
        </Link>
      </header>

      {games.map((game) => (
        <GameStatsCard
          key={game.id}
          game={game}
          stats={statsByGame[game.id]}
          onReset={() => handleReset(game.id)}
        />
      ))}
    </div>
  );
}

/** Props of {@link GameStatsCard}. */
type GameStatsCardProps = {
  readonly game: GameDefinition;
  readonly stats: GameStats;
  readonly onReset: () => void;
};

/** One card with all numbers of a single game. */
function GameStatsCard({
  game,
  stats,
  onReset,
}: GameStatsCardProps): ReactElement {
  const isEmpty = isEmptyStats(stats);

  return (
    <section
      data-testid={`stats-${game.id}`}
      className="rounded-2xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40"
    >
      <header className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-semibold">{game.name}</h2>
        <button
          type="button"
          disabled={isEmpty}
          onClick={onReset}
          className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-1 text-xs hover:bg-zinc-100 disabled:cursor-default disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {STATS_TEXTS.reset}
        </button>
      </header>

      {isEmpty ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {STATS_TEXTS.nothingYet}
        </p>
      ) : (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
          <Metric
            name="startedGames"
            label={STATS_TEXTS.startedGames}
            value={String(stats.startedGames)}
          />
          <Metric
            name="finishedGames"
            label={STATS_TEXTS.finishedGames}
            value={String(stats.finishedGames)}
          />
          <Metric
            name="abandonedGames"
            label={STATS_TEXTS.abandonedGames}
            value={String(abandonedGames(stats))}
          />
          <Metric
            name="wins"
            label={STATS_TEXTS.wins}
            value={String(stats.wins)}
          />
          <Metric
            name="losses"
            label={STATS_TEXTS.losses}
            value={String(stats.losses)}
          />
          <Metric
            name="winRate"
            label={STATS_TEXTS.winRate}
            value={optional(winRate(stats), formatPercent)}
          />
          <Metric
            name="totalPlayTime"
            label={STATS_TEXTS.totalPlayTime}
            value={formatDuration(stats.totalPlayTimeMs)}
          />
          <Metric
            name="averagePlayTime"
            label={STATS_TEXTS.averagePlayTime}
            value={optional(averagePlayTimeMs(stats), formatDuration)}
          />
          <Metric
            name="fastestWin"
            label={STATS_TEXTS.fastestWin}
            value={optional(stats.fastestWinMs, formatDuration)}
          />
          <Metric
            name="lastPlayed"
            label={STATS_TEXTS.lastPlayed}
            value={optional(stats.lastPlayedAt, formatDateTime)}
          />
        </dl>
      )}
    </section>
  );
}

/** One labelled number. */
function Metric({
  name,
  label,
  value,
}: {
  name: string;
  label: string;
  value: string;
}): ReactElement {
  return (
    <div>
      <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd
        data-testid={`metric-${name}`}
        className="text-lg font-semibold tabular-nums"
      >
        {value}
      </dd>
    </div>
  );
}

/** Formats a value that may not exist yet. */
function optional(
  value: number | null,
  format: (value: number) => string,
): string {
  return value === null ? STATS_TEXTS.noValue : format(value);
}
