/**
 * The Panzerkiste-only numbers, shown under the shared statistics.
 *
 * @module
 * @remarks
 * A card of its own rather than extra rows in the shared one: levels and shells
 * mean nothing to a card game, and the shared statistics are deliberately
 * ignorant of any particular game.
 */
"use client";

import { useSyncExternalStore, type ReactElement } from "react";
import {
  accuracy,
  averageLevelMs,
  isEmptyMissionStats,
} from "@/games/panzerkiste/stats/mission-stats";
import {
  getMissionStatsSnapshot,
  getServerMissionStatsSnapshot,
  resetMissionStats,
  subscribeMissionStats,
} from "@/games/panzerkiste/stats/mission-store";
import { PANZERKISTE_TEXTS } from "@/games/panzerkiste/i18n/texts";
import { STATS_TEXTS } from "@/i18n/collection-texts";
import { formatDuration, formatPercent } from "@/i18n/format";

/**
 * Renders the mission numbers.
 *
 * @returns the card element
 */
export function MissionStatsView(): ReactElement {
  const stats = useSyncExternalStore(
    subscribeMissionStats,
    getMissionStatsSnapshot,
    getServerMissionStatsSnapshot,
  );
  const empty = isEmptyMissionStats(stats);
  const hits = accuracy(stats);
  const perLevel = averageLevelMs(stats);

  const reset = () => {
    if (window.confirm(STATS_TEXTS.resetConfirm)) {
      resetMissionStats();
    }
  };

  return (
    <section
      data-testid="stats-panzerkiste-missions"
      className="rounded-2xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40"
    >
      <header className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-semibold">{PANZERKISTE_TEXTS.missionStats}</h2>
        <button
          type="button"
          disabled={empty}
          onClick={reset}
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
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
          <Metric
            name="best-level"
            label={PANZERKISTE_TEXTS.bestLevel}
            value={String(stats.bestLevel)}
          />
          <Metric
            name="levels-cleared"
            label={PANZERKISTE_TEXTS.levelsCleared}
            value={String(stats.levelsCleared)}
          />
          <Metric
            name="best-wave"
            label={PANZERKISTE_TEXTS.bestWave}
            value={String(stats.bestWave)}
          />
          <Metric
            name="accuracy"
            label={PANZERKISTE_TEXTS.accuracy}
            value={hits === null ? STATS_TEXTS.noValue : formatPercent(hits)}
          />
          <Metric
            name="shots"
            label={PANZERKISTE_TEXTS.shots}
            value={`${stats.shotsHit} / ${stats.shotsFired}`}
          />
          <Metric
            name="average-level"
            label={PANZERKISTE_TEXTS.averageLevel}
            value={
              perLevel === null ? STATS_TEXTS.noValue : formatDuration(perLevel)
            }
          />
          <Metric
            name="fastest-level"
            label={PANZERKISTE_TEXTS.fastestLevel}
            value={
              stats.fastestLevelMs === null
                ? STATS_TEXTS.noValue
                : formatDuration(stats.fastestLevelMs)
            }
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
  readonly name: string;
  readonly label: string;
  readonly value: string;
}): ReactElement {
  return (
    <div data-testid={`metric-${name}`}>
      <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}
