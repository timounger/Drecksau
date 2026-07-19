/**
 * Binokel settings page: the deck choice and any future Binokel options.
 *
 * @module
 */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore, type ReactElement } from "react";
import { SUIT_IMAGES } from "@/games/binokel/assets/suit-images";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  TEAM_PLAYER_COUNTS,
} from "@/games/binokel/engine/setup";
import { DIFFICULTIES } from "@/games/binokel/engine/difficulty";
import {
  BINOKEL_TEXTS,
  DIFFICULTY_LABELS,
  SUIT_LABELS,
} from "@/games/binokel/i18n/binokel-texts";
import {
  getBinokelSettingsSnapshot,
  getServerBinokelSettingsSnapshot,
  subscribeBinokelSettings,
  updateBinokelSettings,
} from "@/games/binokel/settings/binokel-settings-store";

/** The supported table sizes, e.g. [3, 4, 5, 6]. */
const PLAYER_COUNTS = Array.from(
  { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
  (_, offset) => MIN_PLAYERS + offset,
);

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

  const teamsAvailable = TEAM_PLAYER_COUNTS.includes(settings.playerCount);

  /** Swaps a suit with its neighbour and stores the new order. */
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    const order = [...settings.suitOrder];
    [order[index], order[target]] = [order[target], order[index]];
    updateBinokelSettings({ ...settings, suitOrder: order });
  };

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
        <label className="flex cursor-pointer flex-col gap-1">
          <span className="font-semibold">{BINOKEL_TEXTS.difficulty}</span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {BINOKEL_TEXTS.difficultyHint}
          </span>
          <select
            data-testid="select-difficulty"
            value={settings.difficulty}
            onChange={(event) =>
              updateBinokelSettings({
                ...settings,
                difficulty: event.target.value as (typeof DIFFICULTIES)[number],
              })
            }
            className="mt-1 w-56 cursor-pointer rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {DIFFICULTIES.map((level) => (
              <option key={level} value={level}>
                {DIFFICULTY_LABELS[level]}
              </option>
            ))}
          </select>
        </label>
      </section>

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

        <label className="mt-4 flex cursor-pointer items-start justify-between gap-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <span>
            <span className="font-semibold">{BINOKEL_TEXTS.withDabb}</span>
            <span className="mt-1 block text-sm text-zinc-500 dark:text-zinc-400">
              {BINOKEL_TEXTS.withDabbHint}
            </span>
          </span>
          <input
            type="checkbox"
            data-testid="toggle-with-dabb"
            checked={settings.withDabb}
            onChange={(event) =>
              updateBinokelSettings({
                ...settings,
                withDabb: event.target.checked,
              })
            }
            className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-emerald-500"
          />
        </label>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h2 className="font-semibold">{BINOKEL_TEXTS.playerCountTitle}</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {BINOKEL_TEXTS.playerCountHint}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PLAYER_COUNTS.map((count) => (
            <button
              key={count}
              type="button"
              onClick={() =>
                updateBinokelSettings({ ...settings, playerCount: count })
              }
              data-testid={`player-count-${count}`}
              aria-pressed={settings.playerCount === count}
              className={[
                "cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium",
                settings.playerCount === count
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800",
              ].join(" ")}
            >
              {count}
            </button>
          ))}
        </div>

        <label
          className={`mt-4 flex items-start justify-between gap-4 border-t border-zinc-200 pt-4 dark:border-zinc-800 ${teamsAvailable ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
        >
          <span>
            <span className="font-semibold">{BINOKEL_TEXTS.teams}</span>
            <span className="mt-1 block text-sm text-zinc-500 dark:text-zinc-400">
              {BINOKEL_TEXTS.teamsHint}
            </span>
          </span>
          <input
            type="checkbox"
            data-testid="toggle-teams"
            disabled={!teamsAvailable}
            checked={teamsAvailable && settings.teams}
            onChange={(event) =>
              updateBinokelSettings({
                ...settings,
                teams: event.target.checked,
              })
            }
            className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-emerald-500 disabled:cursor-not-allowed"
          />
        </label>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h2 className="font-semibold">{BINOKEL_TEXTS.suitOrderTitle}</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {BINOKEL_TEXTS.suitOrderHint}
        </p>
        <ol className="mt-3 flex flex-col gap-2">
          {settings.suitOrder.map((suit, index) => (
            <li
              key={suit}
              data-testid={`suit-row-${suit}`}
              className="flex items-center gap-3 rounded-lg border border-zinc-200 p-2 dark:border-zinc-800"
            >
              <span className="w-4 text-center text-sm tabular-nums text-zinc-400">
                {index + 1}
              </span>
              <span className="relative block h-8 w-8 shrink-0 overflow-hidden rounded">
                <Image
                  src={SUIT_IMAGES[suit]}
                  alt=""
                  fill
                  sizes="32px"
                  className="object-contain"
                />
              </span>
              <span className="flex-1 text-sm font-medium">
                {SUIT_LABELS[suit]}
              </span>
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label={BINOKEL_TEXTS.moveUp}
                data-testid={`suit-up-${suit}`}
                className="cursor-pointer rounded-md border border-zinc-300 px-2 py-1 text-sm hover:bg-zinc-100 disabled:cursor-default disabled:opacity-30 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                {"↑"}
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === settings.suitOrder.length - 1}
                aria-label={BINOKEL_TEXTS.moveDown}
                data-testid={`suit-down-${suit}`}
                className="cursor-pointer rounded-md border border-zinc-300 px-2 py-1 text-sm hover:bg-zinc-100 disabled:cursor-default disabled:opacity-30 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                {"↓"}
              </button>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
