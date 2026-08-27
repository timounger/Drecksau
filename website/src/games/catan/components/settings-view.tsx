/**
 * CATAN settings: how many sit at the table, and how long the game runs.
 *
 * @module
 * @remarks
 * Two settings, and only the second needs a word. The printed game ends at ten
 * points; a full table takes an evening to get there. Eight and twelve are the
 * usual ways of making it shorter or longer, and they change nothing else - the
 * board, the costs and the cards stay exactly as the box has them.
 */
"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactElement } from "react";
import { MODES, VARIANTS } from "@/games/catan/engine/state";
import { CATAN_TEXTS as T, VARIANT_TEXTS } from "@/games/catan/i18n/texts";
import { PLAYER_COUNTS, TARGETS } from "@/games/catan/settings/app-settings";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  subscribeSettings,
  updateSettings,
} from "@/games/catan/settings/settings-store";

/** What each target means for the length of a game. */
const TARGET_HINTS: Readonly<Record<number, string>> = {
  8: "Kurze Partie.",
  10: "Wie im Original.",
  12: "Lange Partie.",
};

/**
 * Renders the settings page.
 *
 * @returns the page element
 */
export function CatanSettingsView(): ReactElement {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getServerSettingsSnapshot,
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{T.title} - Einstellungen</h1>
        <Link
          href="/catan"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Zurück zum Spiel
        </Link>
      </header>

      <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div>
          <h2 className="text-sm font-semibold">{T.players}</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Zu dritt bleiben die weißen Figuren in der Schachtel. {T.crewHint}
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
              data-testid={`ct-players-${count}`}
              onClick={() =>
                updateSettings({ ...settings, playerCount: count })
              }
              className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-semibold ${
                count === settings.playerCount
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
                  : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              }`}
            >
              {count}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold">{T.target}</h2>
        <div
          role="radiogroup"
          aria-label={T.target}
          className="flex flex-col gap-1.5"
        >
          {TARGETS.map((target) => (
            <button
              key={target}
              type="button"
              role="radio"
              aria-checked={target === settings.target}
              data-testid={`ct-target-${target}`}
              onClick={() => updateSettings({ ...settings, target })}
              className={`cursor-pointer rounded-lg border px-3 py-2 text-left ${
                target === settings.target
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
                  : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              }`}
            >
              <span className="block text-sm font-semibold">
                {T.points(target)}
              </span>
              <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                {TARGET_HINTS[target] ?? ""}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* The mode comes before the variants, and looks different on purpose:
          it is a choice of *which game*, where the variants are switches on
          whichever game that is. Städte & Ritter replaces the development
          cards, the dice and the finish line, so it can never be one of the
          ticks below it. */}
      <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div>
          <h2 className="text-sm font-semibold">{T.modeTitle}</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {T.modeHint}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5" role="radiogroup">
          {MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={settings.mode === mode}
              data-testid={`ct-mode-${mode}`}
              onClick={() => updateSettings({ ...settings, mode })}
              className={`cursor-pointer rounded-lg border px-3 py-2 text-left text-sm ${
                settings.mode === mode
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
                  : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              }`}
            >
              <span className="font-semibold">{T.modeName(mode)}</span>
              <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                {T.modeText(mode)}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div>
          <h2 className="text-sm font-semibold">{T.variants}</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {T.variantsHint}
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          {VARIANTS.map((variant) => {
            const on = settings.variants.includes(variant);
            return (
              <button
                key={variant}
                type="button"
                role="switch"
                aria-checked={on}
                data-testid={`ct-variant-${variant}`}
                onClick={() =>
                  updateSettings({
                    ...settings,
                    variants: on
                      ? settings.variants.filter((each) => each !== variant)
                      : [...settings.variants, variant],
                  })
                }
                className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-left ${
                  on
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
                    : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                }`}
              >
                <span
                  aria-hidden
                  className={`mt-0.5 inline-block h-4 w-4 shrink-0 rounded border ${
                    on ? "border-indigo-500 bg-indigo-500" : "border-zinc-400"
                  }`}
                />
                <span>
                  <span className="block text-sm font-semibold">
                    {VARIANT_TEXTS[variant].label}
                  </span>
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                    {VARIANT_TEXTS[variant].hint}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Änderungen gelten ab dem nächsten neuen Spiel.
      </p>
    </div>
  );
}
