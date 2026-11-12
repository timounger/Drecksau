/**
 * The Frost Fortress-only numbers, shown under the shared statistics.
 *
 * @module
 */
"use client";

import { useSyncExternalStore, type ReactElement } from "react";
import { FROST_TEXTS as T } from "@/games/frost-fortress/i18n/texts";
import {
  EMPTY_FORTRESS_STATS,
  fortressStatsStore,
} from "@/games/frost-fortress/stats/fortress-stats";
import { STATS_TEXTS } from "@/i18n/collection-texts";

/**
 * Renders the fortress numbers.
 *
 * @returns the card element
 */
export function FortressStatsView(): ReactElement {
  const stats = useSyncExternalStore(
    fortressStatsStore.subscribe,
    fortressStatsStore.getSnapshot,
    fortressStatsStore.getServerSnapshot,
  );
  const empty = stats.bestWave === 0 && stats.kills === 0 && stats.built === 0;
  const reset = () => {
    if (window.confirm(STATS_TEXTS.resetConfirm)) {
      fortressStatsStore.save(EMPTY_FORTRESS_STATS);
    }
  };
  const metrics: readonly [string, string, number][] = [
    ["best-wave", T.statBestWave, stats.bestWave],
    ["waves", T.statWaves, stats.waves],
    ["kills", T.statKills, stats.kills],
    ["bosses", T.statBosses, stats.bosses],
    ["built", T.statBuilt, stats.built],
    ["fallen", T.statGames, stats.fallen],
  ];
  return (
    <section
      data-testid="stats-frost-fortress"
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
