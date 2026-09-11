/**
 * Dog settings: what you are called, and how many sit at the table.
 *
 * @module
 */
"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactElement } from "react";
import { DOG_TEXTS as T } from "@/games/dog/i18n/texts";
import {
  MAX_NAME,
  PLAYER_COUNTS,
  isTeamTable,
} from "@/games/dog/settings/app-settings";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  subscribeSettings,
  updateSettings,
} from "@/games/dog/settings/settings-store";

/**
 * Renders the settings page.
 *
 * @returns the page element
 */
export function DogSettingsView(): ReactElement {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getServerSettingsSnapshot,
  );
  const teams = isTeamTable(settings.playerCount);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Dog - Einstellungen</h1>
        <Link
          href="/dog"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Zurück zum Spiel
        </Link>
      </header>

      <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div>
          <h2 className="text-sm font-semibold">Spieler</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Zu viert und zu sechst wird in Teams gespielt: Wer gegenübersitzt,
            ist dein Partner, und gewonnen habt ihr erst zusammen. Zu zweit, zu
            dritt und zu fünft spielt jeder für sich - dann hat jeder fünf
            Figuren, von denen eine schon auf dem Startfeld steht, und wer
            nichts ziehen kann, tauscht eine Karte statt auszusetzen.
          </p>
        </div>
        <div
          role="radiogroup"
          aria-label="Spieleranzahl"
          className="flex flex-wrap gap-1.5"
        >
          {PLAYER_COUNTS.map((count) => (
            <button
              key={count}
              type="button"
              role="radio"
              aria-checked={settings.playerCount === count}
              data-testid={`dog-players-${String(count)}`}
              onClick={() =>
                updateSettings({ ...settings, playerCount: count })
              }
              className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm ${
                settings.playerCount === count
                  ? "border-zinc-900 bg-zinc-900 font-semibold text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                  : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              }`}
            >
              {count}
            </button>
          ))}
        </div>
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
          {teams ? T.teamTable : `${T.soloTable} - ${T.fivePieces}`}
        </p>
      </section>

      <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div>
          <h2 className="text-sm font-semibold">Dein Name</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Steht an deiner Ecke des Bretts. Du spielst immer Grün und sitzt
            oben.
          </p>
        </div>
        <input
          type="text"
          value={settings.name}
          maxLength={MAX_NAME}
          data-testid="dog-name"
          onChange={(event) =>
            updateSettings({ ...settings, name: event.target.value })
          }
          className="w-56 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </section>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">{T.tagline}</p>
    </div>
  );
}
