/**
 * Settings of "Das politische Talent": how many parties sit at the table.
 *
 * @module
 */
"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactElement } from "react";
import { START_SEATS } from "@/games/politik/engine/state";
import { PLAYER_COUNTS } from "@/games/politik/settings/app-settings";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  subscribeSettings,
  updateSettings,
} from "@/games/politik/settings/settings-store";
import { POLITIK_TEXTS as T } from "@/games/politik/i18n/texts";

/**
 * Renders the settings page.
 *
 * @returns the page element
 */
export function PolitikSettingsView(): ReactElement {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getServerSettingsSnapshot,
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{T.settingsTitle}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {T.settingsSubtitle}
          </p>
        </div>
        <Link
          href="/politik"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {T.backToGame}
        </Link>
      </header>

      <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div>
          <h2 className="text-sm font-semibold">{T.playerCount}</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {T.playerCountHint}
          </p>
        </div>
        <div
          role="radiogroup"
          aria-label={T.playerCount}
          className="flex flex-wrap gap-1.5"
        >
          {PLAYER_COUNTS.map((count) => (
            <button
              key={count}
              type="button"
              role="radio"
              aria-checked={count === settings.playerCount}
              data-testid={`politik-players-${count}`}
              onClick={() => updateSettings({ playerCount: count })}
              className={`h-10 w-10 cursor-pointer rounded-lg border text-sm font-semibold tabular-nums ${
                count === settings.playerCount
                  ? "border-indigo-500 bg-indigo-600 text-white"
                  : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              }`}
            >
              {count}
            </button>
          ))}
        </div>
        <ul className="mt-1 flex flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400">
          {PLAYER_COUNTS.map((count) => (
            <li key={count}>
              <span className="font-medium">{count} Parteien:</span> je{" "}
              {START_SEATS[count]} Startsitze
              {count === PLAYER_COUNTS[PLAYER_COUNTS.length - 1] &&
                " und eine Ausrichtung mit 4 Themen"}
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {T.settingsNote}
      </p>
    </div>
  );
}
