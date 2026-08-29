/**
 * Monopoly settings: how many sit at the table.
 *
 * @module
 */
"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactElement } from "react";
import { MONOPOLY_TEXTS as T } from "@/games/monopoly/i18n/texts";
import { PLAYER_COUNTS } from "@/games/monopoly/settings/app-settings";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  subscribeSettings,
  updateSettings,
} from "@/games/monopoly/settings/settings-store";

/**
 * The two house rules, as the page lists them.
 *
 * @remarks
 * A list rather than two hand-written sections, so a third one is a line here
 * and nothing else. Both start switched on: they are what most tables play, and
 * the box says otherwise - the reasoning sits on the fields themselves, in
 * {@link MONOPOLY_TEXTS.parkingHint} and {@link MONOPOLY_TEXTS.goHint}.
 */
const HOUSE_RULES: readonly {
  readonly key: "parkingPot" | "doubleGo";
  readonly testId: string;
  readonly label: string;
  readonly hint: string;
}[] = [
  {
    key: "parkingPot",
    testId: "mo-parking-switch",
    label: T.parkingLabel,
    hint: T.parkingHint,
  },
  {
    key: "doubleGo",
    testId: "mo-double-go-switch",
    label: T.goLabel,
    hint: T.goHint,
  },
];

/**
 * Renders the settings page.
 *
 * @returns the page element
 */
export function MonopolySettingsView(): ReactElement {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getServerSettingsSnapshot,
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{T.settingsTitle}</h1>
        <Link
          href="/monopoly"
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
              data-testid={`mo-players-${count}`}
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
          <h2 className="text-sm font-semibold">{T.houseRules}</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {T.houseRulesHint}
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          {HOUSE_RULES.map((rule) => {
            const on = settings[rule.key];
            return (
              <button
                key={rule.key}
                type="button"
                role="switch"
                aria-checked={on}
                data-testid={rule.testId}
                onClick={() => updateSettings({ ...settings, [rule.key]: !on })}
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
                    {rule.label}
                  </span>
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                    {rule.hint}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Gilt für das nächste Spiel gegen den Computer. Online bestimmt die Runde
        selbst, wie viele mitspielen.
      </p>
    </div>
  );
}
