/**
 * The adventure's own numbers, shown under the shared statistics.
 *
 * @module
 */
"use client";

import { useSyncExternalStore, type ReactElement } from "react";
import {
  favouritePrey,
  isEmptyAdventure,
  totalKills,
} from "@/games/zelda/stats/adventure-stats";
import {
  getAdventureSnapshot,
  getServerAdventureSnapshot,
  resetAdventure,
  subscribeAdventure,
} from "@/games/zelda/stats/adventure-store";
import { MONSTER_NAMES, ZELDA_STATS_TEXTS } from "@/games/zelda/i18n/texts";
import { STATS_TEXTS } from "@/i18n/collection-texts";

/**
 * Renders the adventure card.
 *
 * @returns the card
 */
export function AdventureStatsView(): ReactElement {
  const stats = useSyncExternalStore(
    subscribeAdventure,
    getAdventureSnapshot,
    getServerAdventureSnapshot,
  );
  const empty = isEmptyAdventure(stats);
  const prey = favouritePrey(stats);

  const reset = () => {
    if (window.confirm(STATS_TEXTS.resetConfirm)) {
      resetAdventure();
    }
  };

  return (
    <section
      data-testid="stats-zelda-adventure"
      className="rounded-2xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40"
    >
      <header className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-semibold">{ZELDA_STATS_TEXTS.title}</h2>
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
            name="monsters"
            label={ZELDA_STATS_TEXTS.monsters}
            value={String(totalKills(stats))}
          />
          <Metric
            name="rupees"
            label={ZELDA_STATS_TEXTS.rupees}
            value={String(stats.rupees)}
          />
          <Metric
            name="deaths"
            label={ZELDA_STATS_TEXTS.deaths}
            value={String(stats.deaths)}
          />
          <Metric
            name="cuts"
            label={ZELDA_STATS_TEXTS.cuts}
            value={String(stats.cuts)}
          />
          <Metric
            name="darknuts"
            label={ZELDA_STATS_TEXTS.darknuts}
            value={String(stats.kills.darknut)}
          />
          <Metric
            name="favourite"
            label={ZELDA_STATS_TEXTS.favourite}
            value={prey === null ? ZELDA_STATS_TEXTS.none : MONSTER_NAMES[prey]}
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
