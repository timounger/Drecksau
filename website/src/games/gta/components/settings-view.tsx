/**
 * GTA settings: how close the camera stands.
 *
 * @module
 */
"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactElement } from "react";
import { GTA_TEXTS as T } from "@/games/gta/i18n/texts";
import { ZOOM_STEPS } from "@/games/gta/settings/app-settings";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  subscribeSettings,
  updateSettings,
} from "@/games/gta/settings/settings-store";
import { VIEW_WIDTH } from "@/games/gta/components/projection";
import { BLOCK_TILES, TILE } from "@/games/gta/engine/types";

/**
 * Renders the settings page.
 *
 * @returns the page element
 * @remarks
 * One setting, and the thing worth saying about it is what it costs: every step
 * closer is a step less of street you can see coming. So the page says, for
 * each step, how much city fits on the screen - in blocks, because that is the
 * unit this city is actually built in.
 */
export function GtaSettingsView(): ReactElement {
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
          href="/gta"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {T.backToGame}
        </Link>
      </header>

      <section className="flex flex-col gap-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div>
          <h2 className="text-sm font-semibold">{T.zoomLabel}</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {T.zoomHint}
          </p>
        </div>
        <div
          role="radiogroup"
          aria-label={T.zoomLabel}
          className="flex flex-wrap gap-1.5"
        >
          {ZOOM_STEPS.map((step) => (
            <button
              key={step}
              type="button"
              role="radio"
              aria-checked={step === settings.zoom}
              data-testid={`gta-zoom-${String(step).replace(".", "-")}`}
              onClick={() => updateSettings({ ...settings, zoom: step })}
              className={`flex h-16 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border text-sm font-semibold tabular-nums ${
                step === settings.zoom
                  ? "border-indigo-500 bg-indigo-600 text-white"
                  : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              }`}
            >
              <span>{`${String(step).replace(".", ",")}×`}</span>
              <span
                className={`text-[11px] font-normal ${
                  step === settings.zoom
                    ? "text-indigo-100"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {T.zoomBlocks(blocksAcross(step))}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

/**
 * How many blocks of city fit across the screen at a given zoom.
 *
 * @param zoom - the factor in question
 * @returns the width of the picture in blocks, to one decimal
 */
function blocksAcross(zoom: number): number {
  const block = TILE * BLOCK_TILES;
  return Math.round((VIEW_WIDTH / zoom / block) * TENTHS) / TENTHS;
}

/** Rounding to one decimal, which is as fine as "how much fits" gets. */
const TENTHS = 10;
