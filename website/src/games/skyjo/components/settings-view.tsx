/**
 * Skyjo settings: table size and how hard the computer plays.
 *
 * @module
 */
"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactElement } from "react";
import { DIFFICULTIES } from "@/games/skyjo/engine/difficulty";
import { PLAYER_COUNTS } from "@/games/skyjo/settings/app-settings";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  subscribeSettings,
  updateSettings,
} from "@/games/skyjo/settings/settings-store";
import { DIFFICULTY_LABELS, SKYJO_TEXTS as T } from "@/games/skyjo/i18n/texts";

/**
 * Renders the settings page.
 *
 * @returns the page element
 */
export function SkyjoSettingsView(): ReactElement {
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
          href="/skyjo"
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
              data-testid={`skyjo-players-${count}`}
              onClick={() =>
                updateSettings({ ...settings, playerCount: count })
              }
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
      </section>

      <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div>
          <h2 className="text-sm font-semibold">{T.difficulty}</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {T.difficultyHint}
          </p>
        </div>
        <div
          role="radiogroup"
          aria-label={T.difficulty}
          className="flex flex-wrap gap-1.5"
        >
          {DIFFICULTIES.map((level) => (
            <button
              key={level}
              type="button"
              role="radio"
              aria-checked={level === settings.difficulty}
              data-testid={`skyjo-difficulty-${level}`}
              onClick={() => updateSettings({ ...settings, difficulty: level })}
              className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-semibold ${
                level === settings.difficulty
                  ? "border-indigo-500 bg-indigo-600 text-white"
                  : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              }`}
            >
              {DIFFICULTY_LABELS[level]}
            </button>
          ))}
        </div>
        <ul className="mt-1 flex flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400">
          {DIFFICULTIES.map((level) => (
            <li key={level}>
              <span className="font-medium">{DIFFICULTY_LABELS[level]}:</span>{" "}
              {T.difficultyBlurb[level]}
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
