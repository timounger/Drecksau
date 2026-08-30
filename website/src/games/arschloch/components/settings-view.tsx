/**
 * Arschloch settings: how many play, and over how many rounds.
 *
 * @module
 */
"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactElement } from "react";
import { ROUND_COUNTS } from "@/games/arschloch/engine/state";
import { ARSCHLOCH_TEXTS as T } from "@/games/arschloch/i18n/texts";
import { PLAYER_COUNTS } from "@/games/arschloch/settings/app-settings";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  subscribeSettings,
  updateSettings,
} from "@/games/arschloch/settings/settings-store";

/**
 * Renders the settings page.
 *
 * @returns the page element
 */
export function ArschlochSettingsView(): ReactElement {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getServerSettingsSnapshot,
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{T.settings}</h1>
        <Link
          href="/arschloch"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Zurück zum Spiel
        </Link>
      </header>

      <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div>
          <h2 className="text-sm font-semibold">{T.players}</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {T.playersHint}
          </p>
        </div>
        <div
          role="radiogroup"
          aria-label={T.players}
          className="flex flex-wrap gap-1.5"
        >
          {PLAYER_COUNTS.map((count) => (
            <button
              key={count}
              type="button"
              role="radio"
              aria-checked={count === settings.playerCount}
              data-testid={`ar-players-${count}`}
              onClick={() =>
                updateSettings({ ...settings, playerCount: count })
              }
              className={pillOf(count === settings.playerCount)}
            >
              {count}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div>
          <h2 className="text-sm font-semibold">{T.roundsLabel}</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {T.roundsHint}
          </p>
        </div>
        <div
          role="radiogroup"
          aria-label={T.roundsLabel}
          className="flex flex-wrap gap-1.5"
        >
          {ROUND_COUNTS.map((rounds) => (
            <button
              key={rounds}
              type="button"
              role="radio"
              aria-checked={rounds === settings.rounds}
              data-testid={`ar-rounds-${rounds}`}
              onClick={() => updateSettings({ ...settings, rounds })}
              className={pillOf(rounds === settings.rounds)}
            >
              {rounds}
            </button>
          ))}
        </div>
      </section>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Gilt für das nächste Spiel gegen den Computer. Online bestimmt die Runde
        selbst, wie viele mitspielen.
      </p>
    </div>
  );
}

/** The look of one choice, picked or not. */
function pillOf(picked: boolean): string {
  return `h-10 w-10 cursor-pointer rounded-lg border text-sm font-semibold tabular-nums ${
    picked
      ? "border-indigo-500 bg-indigo-600 text-white"
      : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
  }`;
}
