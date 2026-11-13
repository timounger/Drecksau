/**
 * IMPERAVIS settings: sound, shadows, weather effects, autosave, the
 * camera at the screen edges and the starting speed.
 *
 * @module
 * @remarks
 * Laid out like the settings pages of the other games - one card per
 * setting, a row of buttons to choose from, the way back in the corner.
 */
"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactElement } from "react";
import { TEXTS as T } from "@/games/imperavis/i18n/texts";
import {
  autosaveSetting,
  edgeScrollSetting,
  mutedSetting,
  shadowsSetting,
  speedSetting,
  SPEEDS,
  weatherSetting,
} from "@/games/imperavis/settings/preferences";
import type { StoredValue } from "@/lib/storage/stored-value";

/**
 * Renders the settings page.
 *
 * @returns the page element
 */
export function ImperavisSettingsView(): ReactElement {
  const muted = useStored(mutedSetting);
  const shadows = useStored(shadowsSetting);
  const weather = useStored(weatherSetting);
  const autosave = useStored(autosaveSetting);
  const edgeScroll = useStored(edgeScrollSetting);
  const speed = useStored(speedSetting);
  const onOff = (id: string, value: boolean, store: StoredValue<boolean>) =>
    [true, false].map((on) => ({
      id: `${id}-${on ? "on" : "off"}`,
      label: on ? T.on : T.off,
      active: on === value,
      choose: () => store.save(on),
    }));

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
          href="/imperavis"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {T.backToGame}
        </Link>
      </header>
      <Setting
        title={T.soundTitle}
        hint={T.soundHint}
        options={[true, false].map((on) => ({
          id: `sound-${on ? "on" : "off"}`,
          label: on ? T.on : T.off,
          active: on === !muted,
          choose: () => mutedSetting.save(!on),
        }))}
      />
      <Setting
        title={T.shadowsTitle}
        hint={T.shadowsHint}
        options={onOff("shadows", shadows, shadowsSetting)}
      />
      <Setting
        title={T.weatherTitle}
        hint={T.weatherHint}
        options={onOff("weather", weather, weatherSetting)}
      />
      <Setting
        title={T.autosaveTitle}
        hint={T.autosaveHint}
        options={onOff("autosave", autosave, autosaveSetting)}
      />
      <Setting
        title={T.edgeTitle}
        hint={T.edgeHint}
        options={onOff("edge", edgeScroll, edgeScrollSetting)}
      />
      <Setting
        title={T.speedTitle}
        hint={T.speedHint}
        options={SPEEDS.map((value) => ({
          id: `speed-${value}`,
          label: `${value}x`,
          active: value === speed,
          choose: () => speedSetting.save(value),
        }))}
      />
    </div>
  );
}

/** One option of a setting. */
type Option = {
  readonly id: string;
  readonly label: string;
  readonly active: boolean;
  readonly choose: () => void;
};

/** One setting: a title, a hint and its options. */
function Setting({
  title,
  hint,
  options,
}: {
  readonly title: string;
  readonly hint: string;
  readonly options: readonly Option[];
}): ReactElement {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
      <h2 className="font-semibold">{title}</h2>
      <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">{hint}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            data-testid={`imp-setting-${option.id}`}
            aria-pressed={option.active}
            onClick={option.choose}
            className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm ${
              option.active
                ? "border-amber-500 bg-amber-100 font-semibold text-amber-950 dark:bg-amber-900/50 dark:text-amber-100"
                : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </section>
  );
}

/** Reads a stored value the hydration-safe way. */
function useStored<T>(store: StoredValue<T>): T {
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
}
