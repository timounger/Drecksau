/**
 * The Wurfduell-only numbers, shown under the shared statistics.
 *
 * @module
 */
"use client";

import { useSyncExternalStore, type ReactElement } from "react";
import { ABILITIES, characterById } from "@/games/wurfduell/engine/characters";
import {
  EMPTY_DUEL_STATS,
  abilitiesUsed,
  duelStatsStore,
  favouriteAbility,
  favouriteFighter,
} from "@/games/wurfduell/stats/duel-stats";
import { WURFDUELL_TEXTS as T } from "@/games/wurfduell/i18n/texts";
import { STATS_TEXTS } from "@/i18n/collection-texts";
import { formatPercent } from "@/i18n/format";
import { FighterPortrait } from "./portraits";

/**
 * Renders the throwing numbers.
 *
 * @returns the card element
 */
export function DuelStatsView(): ReactElement {
  const stats = useSyncExternalStore(
    duelStatsStore.subscribe,
    duelStatsStore.getSnapshot,
    duelStatsStore.getServerSnapshot,
  );
  const empty = stats.throws === 0 && stats.matches === 0;
  const favourite = favouriteFighter(stats);
  const ability = favouriteAbility(stats);

  const reset = () => {
    if (window.confirm(STATS_TEXTS.resetConfirm)) {
      duelStatsStore.save(EMPTY_DUEL_STATS);
    }
  };

  return (
    <section
      data-testid="stats-wurfduell-duel"
      className="rounded-2xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40"
    >
      <header className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-semibold">{T.duelStats}</h2>
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
        <div className="flex flex-wrap items-center gap-4">
          <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
            <Metric
              name="matches"
              label={T.statMatches}
              value={`${stats.wins} / ${stats.matches}`}
            />
            <Metric
              name="throws"
              label={T.statThrows}
              value={String(stats.throws)}
            />
            <Metric
              name="accuracy"
              label={T.statAccuracy}
              value={
                stats.throws === 0
                  ? STATS_TEXTS.noValue
                  : formatPercent(stats.hits / stats.throws)
              }
            />
            <Metric
              name="head-hits"
              label={T.statHeadHits}
              value={String(stats.headHits)}
            />
            <Metric
              name="flawless"
              label={T.statFlawless}
              value={String(stats.flawless)}
            />
            <Metric
              name="favourite"
              label={T.statFavourite}
              value={
                favourite === null
                  ? STATS_TEXTS.noValue
                  : characterById(favourite).name
              }
            />
            <Metric
              name="abilities"
              label={T.statAbilities}
              value={String(abilitiesUsed(stats))}
            />
            <Metric
              name="favourite-ability"
              label={T.statFavouriteAbility}
              value={
                ability === null
                  ? STATS_TEXTS.noValue
                  : `${ABILITIES[ability].icon} ${ABILITIES[ability].name}`
              }
            />
          </dl>
          {favourite !== null && (
            <FighterPortrait character={favourite} className="h-24 w-20" />
          )}
        </div>
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
