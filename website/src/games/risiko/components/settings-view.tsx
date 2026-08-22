/**
 * Risiko settings: which of the box's three games, and how many play it.
 *
 * @module
 * @remarks
 * The two settings are not independent, and the screen says so rather than
 * letting somebody pick a contradiction: the two-player variant is played by
 * two, and the other two want three to five. Picking a variant therefore
 * rewrites the seat count if it has to.
 */
"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactElement } from "react";
import type { Variant } from "@/games/risiko/engine/state";
import { RISIKO_TEXTS as T } from "@/games/risiko/i18n/texts";
import {
  VARIANTS,
  clampPlayers,
  seatsFor,
} from "@/games/risiko/settings/app-settings";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  subscribeSettings,
  updateSettings,
} from "@/games/risiko/settings/settings-store";

/** What each variant is called and what it changes. */
const VARIANT_TEXT: Readonly<
  Record<Variant, { readonly label: string; readonly hint: string }>
> = {
  grundspiel: { label: T.variantBasic, hint: T.variantBasicHint },
  klassisch: { label: T.variantClassic, hint: T.variantClassicHint },
  zweispieler: { label: T.variantTwo, hint: T.variantTwoHint },
};

/**
 * Renders the settings page.
 *
 * @returns the page element
 */
export function RisikoSettingsView(): ReactElement {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getServerSettingsSnapshot,
  );
  const seats = seatsFor(settings.variant);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{T.settingsTitle}</h1>
        <Link
          href="/risiko"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Zurück zum Spiel
        </Link>
      </header>

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
              data-testid={`rk-variant-${variant}`}
              onClick={() =>
                updateSettings({
                  variant,
                  playerCount: clampPlayers(settings.playerCount, variant),
                })
              }
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

      <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div>
          <h2 className="text-sm font-semibold">{T.playersLabel}</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {seats.length === 1 ? T.playersFixed : T.playersHint}
          </p>
        </div>
        <div
          role="radiogroup"
          aria-label={T.playersLabel}
          className="flex flex-wrap gap-1.5"
        >
          {seats.map((count) => (
            <button
              key={count}
              type="button"
              role="radio"
              aria-checked={count === settings.playerCount}
              disabled={seats.length === 1}
              data-testid={`rk-players-${count}`}
              onClick={() =>
                updateSettings({ ...settings, playerCount: count })
              }
              className={`h-10 w-10 cursor-pointer rounded-lg border text-sm font-semibold tabular-nums disabled:cursor-not-allowed disabled:opacity-60 ${
                count === settings.playerCount
                  ? "border-indigo-500 bg-indigo-600 text-white"
                  : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              }`}
            >
              {count}
            </button>
          ))}
        </div>
      </section>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Gilt für das nächste Spiel gegen den Computer. Online bestimmt der
        Gastgeber - zu zweit wird immer die 2-Spieler-Variante gespielt.
      </p>
    </div>
  );
}
