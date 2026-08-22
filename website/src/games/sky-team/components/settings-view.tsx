/**
 * Sky Team settings: which seat you fly against the computer.
 *
 * @module
 * @remarks
 * The only choice there is, and a real one: the two seats do different jobs.
 * The pilot lowers the gear and works the brakes, the co-pilot the flaps, and
 * each has their own radio. Flying the other side is a different game, not a
 * different colour.
 */
"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactElement } from "react";
import { SKY_TEAM_TEXTS as T } from "@/games/sky-team/i18n/texts";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  updateSettings,
  subscribeSettings,
} from "@/games/sky-team/settings/settings-store";
import { COLLECTION_TEXTS, STATS_TEXTS } from "@/i18n/collection-texts";

/**
 * Renders the settings page.
 *
 * @returns the page element
 */
export function SkyTeamSettingsView(): ReactElement {
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
            Gilt nur in diesem Browser.
          </p>
        </div>
        <Link
          href="/sky-team"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {STATS_TEXTS.backToGame}
        </Link>
      </header>

      <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold">Dein Platz</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Die Pilotin fährt das Fahrwerk aus und bedient die Bremsen, der
          Co-Pilot die Landeklappen. Gilt ab dem nächsten Spiel.
        </p>
        <div className="flex gap-2">
          {[true, false].map((asPilot) => (
            <button
              key={String(asPilot)}
              type="button"
              data-testid={`sky-seat-${asPilot ? "pilot" : "copilot"}`}
              onClick={() => updateSettings({ asPilot })}
              className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-semibold ${
                settings.asPilot === asPilot
                  ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
                  : "border-zinc-300 dark:border-zinc-700"
              }`}
            >
              {asPilot ? T.pilot : T.copilot}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
