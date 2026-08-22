/**
 * The Game settings: how many play, and how hard they want it.
 *
 * @module
 */
"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactElement } from "react";
import type { Variant } from "@/games/the-game/engine/state";
import { THE_GAME_TEXTS as T } from "@/games/the-game/i18n/texts";
import {
  PLAYER_COUNTS,
  VARIANTS,
  handSizeOf,
} from "@/games/the-game/settings/app-settings";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  subscribeSettings,
  updateSettings,
} from "@/games/the-game/settings/settings-store";

/** What each variant is called and what it changes. */
const VARIANT_TEXT: Readonly<
  Record<Variant, { readonly label: string; readonly hint: string }>
> = {
  normal: { label: T.variantNormal, hint: T.variantNormalHint },
  profi: { label: T.variantProfi, hint: T.variantProfiHint },
  profiPlus: { label: T.variantProfiPlus, hint: T.variantProfiPlusHint },
};

/**
 * Renders the settings page.
 *
 * @returns the page element
 */
export function TheGameSettingsView(): ReactElement {
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
            {T.handSizeNote(handSizeOf(settings))}
          </p>
        </div>
        <Link
          href="/the-game"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Zurück zum Spiel
        </Link>
      </header>

      <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div>
          <h2 className="text-sm font-semibold">{T.playersLabel}</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {T.playersHint}
          </p>
        </div>
        <div
          role="radiogroup"
          aria-label={T.playersLabel}
          className="flex flex-wrap gap-1.5"
        >
          {PLAYER_COUNTS.map((count) => (
            <button
              key={count}
              type="button"
              role="radio"
              aria-checked={count === settings.playerCount}
              data-testid={`tg-players-${count}`}
              onClick={() =>
                updateSettings({ ...settings, playerCount: count })
              }
              className={`h-10 cursor-pointer rounded-lg border px-3 text-sm font-semibold tabular-nums ${
                count === settings.playerCount
                  ? "border-indigo-500 bg-indigo-600 text-white"
                  : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              }`}
            >
              {count === 1 ? T.solo : count}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold">{T.variantLabel}</h2>
        <div
          role="radiogroup"
          aria-label={T.variantLabel}
          className="flex flex-col gap-1.5"
        >
          {VARIANTS.map((variant) => (
            <button
              key={variant}
              type="button"
              role="radio"
              aria-checked={variant === settings.variant}
              data-testid={`tg-variant-${variant}`}
              onClick={() => updateSettings({ ...settings, variant })}
              className={`cursor-pointer rounded-lg border px-3 py-2 text-left ${
                variant === settings.variant
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
                  : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              }`}
            >
              <span className="block text-sm font-semibold">
                {VARIANT_TEXT[variant].label}
              </span>
              <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                {VARIANT_TEXT[variant].hint}
              </span>
            </button>
          ))}
        </div>
      </section>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Gilt für das nächste Spiel gegen den Computer. Online bestimmt der
        Gastgeber.
      </p>
    </div>
  );
}
