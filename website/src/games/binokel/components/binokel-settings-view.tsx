/**
 * Binokel settings page: the deck choice and any future Binokel options.
 *
 * @module
 */
"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactElement } from "react";
import { BINOKEL_TEXTS } from "@/games/binokel/i18n/binokel-texts";
import {
  getBinokelSettingsSnapshot,
  getServerBinokelSettingsSnapshot,
  subscribeBinokelSettings,
  updateBinokelSettings,
} from "@/games/binokel/settings/binokel-settings-store";

/**
 * Renders the Binokel settings page.
 *
 * @returns the page element
 */
export function BinokelSettingsView(): ReactElement {
  const settings = useSyncExternalStore(
    subscribeBinokelSettings,
    getBinokelSettingsSnapshot,
    getServerBinokelSettingsSnapshot,
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{BINOKEL_TEXTS.settingsTitle}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {BINOKEL_TEXTS.settingsSubtitle}
          </p>
        </div>
        <Link
          href="/binokel"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {BINOKEL_TEXTS.backToGame}
        </Link>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <label className="flex cursor-pointer items-start justify-between gap-4">
          <span>
            <span className="font-semibold">{BINOKEL_TEXTS.withSevens}</span>
            <span className="mt-1 block text-sm text-zinc-500 dark:text-zinc-400">
              {BINOKEL_TEXTS.withSevensHint}
            </span>
          </span>
          <input
            type="checkbox"
            data-testid="toggle-with-sevens"
            checked={settings.withSevens}
            onChange={(event) =>
              updateBinokelSettings({
                ...settings,
                withSevens: event.target.checked,
              })
            }
            className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-emerald-500"
          />
        </label>
      </section>
    </div>
  );
}
