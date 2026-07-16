/**
 * Settings page: switches for how the app behaves.
 *
 * @module
 */
"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactElement } from "react";
import { prefersReducedMotion } from "@/lib/settings/app-settings";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  subscribeSettings,
  updateSettings,
} from "@/lib/settings/settings-store";
import { SETTINGS_TEXTS } from "@/i18n/translations";

/**
 * Renders the settings page.
 *
 * @returns the page element
 */
export function SettingsView(): ReactElement {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getServerSettingsSnapshot,
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{SETTINGS_TEXTS.title}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {SETTINGS_TEXTS.subtitle}
          </p>
        </div>
        <Link
          href="/"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {SETTINGS_TEXTS.backToGame}
        </Link>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <label className="flex cursor-pointer items-start justify-between gap-4">
          <span>
            <span className="font-semibold">{SETTINGS_TEXTS.animations}</span>
            <span className="mt-1 block text-sm text-zinc-500 dark:text-zinc-400">
              {SETTINGS_TEXTS.animationsHint}
            </span>
          </span>
          <input
            type="checkbox"
            data-testid="toggle-animations"
            checked={settings.areAnimationsEnabled}
            onChange={(event) =>
              updateSettings({ areAnimationsEnabled: event.target.checked })
            }
            className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-emerald-500"
          />
        </label>

        {/* Only shown to people the default actually differs for. */}
        {prefersReducedMotion() && (
          <p className="mt-3 rounded-lg bg-zinc-100 p-2 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {SETTINGS_TEXTS.reducedMotionNotice}
          </p>
        )}
      </section>
    </div>
  );
}
