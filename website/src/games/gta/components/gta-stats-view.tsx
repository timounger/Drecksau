/**
 * The statistics of this game: what a city keeps of an afternoon.
 *
 * @module
 * @remarks
 * **The shared page does not fit here.** `components/stats-view` counts what
 * every game in the collection has - games begun, won, lost, how quick the
 * fastest win was - and that is exactly right for a round of Skyjo. This game
 * is not a round of anything: one does not finish Los Santos, one drives about
 * in it, and "won 12 %" is not a fact about an afternoon. So of the shared
 * numbers only the two that still mean something are shown - how long it has
 * been played, and when it was last touched - and everything else is counted
 * by the game itself in ../stats.
 */
"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactElement } from "react";
import { formatDateTime, formatDuration } from "@/i18n/format";
import { STATS_TEXTS } from "@/i18n/collection-texts";
import { GTA_TEXTS as T } from "@/games/gta/i18n/texts";
import {
  asKm,
  isEmptyCity,
  type CityStats,
} from "@/games/gta/stats/city-stats";
import {
  getCitySnapshot,
  getServerCitySnapshot,
  resetCity,
  subscribeCity,
} from "@/games/gta/stats/city-store";
import { clearSession } from "@/lib/storage/game-session";
import { EMPTY_STATS, type GameStats } from "@/lib/stats/game-stats";
import { resetStats } from "@/lib/stats/stats-storage";
import {
  getServerStatsSnapshot,
  getStatsSnapshot,
  invalidateStats,
  subscribeStats,
} from "@/lib/stats/stats-store";

/**
 * Renders the statistics page of this game.
 *
 * @returns the page element
 */
export function GtaStatsView(): ReactElement {
  const shared: GameStats =
    useSyncExternalStore(
      subscribeStats,
      getStatsSnapshot,
      getServerStatsSnapshot,
    ).gta ?? EMPTY_STATS;
  const city = useSyncExternalStore(
    subscribeCity,
    getCitySnapshot,
    getServerCitySnapshot,
  );
  const empty = isEmptyCity(city) && shared.totalPlayTimeMs === 0;

  const wipe = (): void => {
    if (!window.confirm(STATS_TEXTS.resetConfirm)) {
      return;
    }
    resetCity();
    resetStats("gta");
    // The running game goes too - counters at nought beside a game in progress
    // would contradict each other.
    clearSession("gta");
    invalidateStats();
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{T.statsTitle}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {T.statsLead}
          </p>
        </div>
        <Link
          href="/gta"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {STATS_TEXTS.backToGame}
        </Link>
      </header>

      <section
        data-testid="stats-gta"
        className="rounded-2xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40"
      >
        <header className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-semibold">{T.title}</h2>
          <button
            type="button"
            disabled={empty}
            onClick={wipe}
            className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-1 text-xs hover:bg-zinc-100 disabled:cursor-default disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {STATS_TEXTS.reset}
          </button>
        </header>

        {empty ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {STATS_TEXTS.nothingYet}
          </p>
        ) : (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
            <Metric
              name="totalPlayTime"
              label={T.statsPlayed}
              value={formatDuration(shared.totalPlayTimeMs)}
            />
            <Metric
              name="lastPlayed"
              label={T.statsLast}
              value={
                shared.lastPlayedAt === null
                  ? STATS_TEXTS.noValue
                  : formatDateTime(shared.lastPlayedAt)
              }
            />
            {NUMBERS.map((one) => (
              <Metric
                key={one.name}
                name={one.name}
                label={one.label}
                value={one.value(city)}
              />
            ))}
          </dl>
        )}
      </section>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">{T.statsNote}</p>
    </div>
  );
}

/**
 * Every counter of the city, in the order it is read in.
 *
 * @remarks
 * A table rather than a dozen blocks of JSX: which numbers there are is a
 * decision about the game, and it should be readable as a list of them.
 */
const NUMBERS: readonly {
  readonly name: string;
  readonly label: string;
  readonly value: (city: CityStats) => string;
}[] = [
  {
    name: "driven",
    label: T.statsDriven,
    value: (city) => T.statsKm(asKm(city.driven)),
  },
  {
    name: "walked",
    label: T.statsWalked,
    value: (city) => T.statsKm(asKm(city.walked)),
  },
  {
    name: "wrecked",
    label: T.statsWrecked,
    value: (city) => String(city.wrecked),
  },
  {
    name: "people",
    label: T.statsPeople,
    value: (city) => String(city.people),
  },
  { name: "cops", label: T.statsCops, value: (city) => String(city.cops) },
  {
    name: "stars",
    label: T.statsStars,
    value: (city) => "★".repeat(city.stars) || STATS_TEXTS.noValue,
  },
  {
    name: "earned",
    label: T.statsEarned,
    value: (city) => T.money(city.earned),
  },
  { name: "jobs", label: T.statsJobs, value: (city) => String(city.jobs) },
  {
    name: "districts",
    label: T.statsDistricts,
    value: (city) => `${String(city.districts)} / 4`,
  },
  {
    name: "busted",
    label: T.statsBusted,
    value: (city) => String(city.busted),
  },
  {
    name: "wasted",
    label: T.statsWasted,
    value: (city) => String(city.wasted),
  },
];

/** One labelled number. */
function Metric({
  name,
  label,
  value,
}: {
  readonly name: string;
  readonly label: string;
  readonly value: string;
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
