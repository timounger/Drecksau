/**
 * Flash Point settings: how big the crew is.
 *
 * @module
 * @remarks
 * The only choice, and a real one. Every extra pair of hands is four more
 * action points a round - and also one more turn before the fire gets another
 * roll, which cuts both ways.
 */
"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactElement } from "react";
import { CREW_SIZES } from "@/games/flash-point/settings/app-settings";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  subscribeSettings,
  updateSettings,
} from "@/games/flash-point/settings/settings-store";
import { COLLECTION_TEXTS, STATS_TEXTS } from "@/i18n/collection-texts";

/**
 * Renders the settings page.
 *
 * @returns the page element
 */
export function FlashPointSettingsView(): ReactElement {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getServerSettingsSnapshot,
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4">
      <header className="flex items-start gap-3">
        <div className="mr-auto">
          <h1 className="text-2xl font-bold">{COLLECTION_TEXTS.settings}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {STATS_TEXTS.subtitle}
          </p>
        </div>
        <Link
          href="/flash-point"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {STATS_TEXTS.backToGame}
        </Link>
      </header>

      <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold">Größe der Mannschaft</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Du plus Kollegen, die der Computer spielt. Jede weitere Person bringt
          vier Aktionspunkte - und einen Zug mehr, bevor das Feuer wieder
          würfelt. Gilt ab dem nächsten Einsatz.
        </p>
        <div className="flex flex-wrap gap-2">
          {CREW_SIZES.map((crew) => (
            <button
              key={crew}
              type="button"
              data-testid={`fp-crew-${crew}`}
              onClick={() => updateSettings({ crew })}
              className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-semibold ${
                settings.crew === crew
                  ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
                  : "border-zinc-300 dark:border-zinc-700"
              }`}
            >
              {crew}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
