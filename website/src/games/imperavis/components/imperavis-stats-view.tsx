/**
 * The IMPERAVIS-only numbers, shown under the shared statistics.
 *
 * @module
 */
"use client";

import { useSyncExternalStore, type ReactElement } from "react";
import { TEXTS as T, TIER_NAMES } from "@/games/imperavis/i18n/texts";
import {
  EMPTY_IMPERAVIS_STATS,
  imperavisStatsStore,
} from "@/games/imperavis/stats/imperavis-stats";
import { STATS_TEXTS } from "@/i18n/collection-texts";

/**
 * Renders the city numbers.
 *
 * @returns the card element
 */
export function ImperavisStatsView(): ReactElement {
  const stats = useSyncExternalStore(
    imperavisStatsStore.subscribe,
    imperavisStatsStore.getSnapshot,
    imperavisStatsStore.getServerSnapshot,
  );
  const empty = stats.built === 0 && stats.peakPopulation === 0;
  const reset = () => {
    if (window.confirm(STATS_TEXTS.resetConfirm)) {
      imperavisStatsStore.save(EMPTY_IMPERAVIS_STATS);
    }
  };
  const metrics: readonly [string, string, string | number][] = [
    ["peak", T.statPeak, stats.peakPopulation],
    ["tier", T.statTier, TIER_NAMES[stats.peakTier] ?? "-"],
    ["founded", T.statFounded, stats.founded],
    ["built", T.statBuilt, stats.built],
    ["ships", T.statShips, stats.shipsBuilt],
    ["traded", T.statTraded, stats.traded],
  ];
  return (
    <section
      data-testid="stats-imperavis-city"
      className="rounded-2xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40"
    >
      <header className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-semibold">{T.statsTitle}</h2>
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
          {metrics.map(([id, label, value]) => (
            <div key={id} data-testid={`metric-${id}`}>
              <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                {label}
              </dt>
              <dd className="font-medium tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
