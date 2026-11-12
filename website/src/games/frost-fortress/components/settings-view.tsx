/**
 * Frost Fortress settings: starting speed, sound, edge scrolling, damage
 * numbers and saving by itself.
 *
 * @module
 * @remarks
 * Laid out like the settings pages of the other games - one card per
 * setting, a row of buttons to choose from, the way back in the corner.
 */
"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactElement } from "react";
import { FROST_TEXTS as T } from "@/games/frost-fortress/i18n/texts";
import {
  autosaveSetting,
  edgeScrollSetting,
  mutedSetting,
  numbersSetting,
  freeBuildSetting,
  rangeSetting,
  RANGES,
  speedSetting,
  SPEEDS,
} from "@/games/frost-fortress/settings/preferences";
import type { StoredValue } from "@/lib/storage/stored-value";

/**
 * Renders the settings page.
 *
 * @returns the page element
 */
export function FrostSettingsView(): ReactElement {
  const speed = useStored(speedSetting);
  const muted = useStored(mutedSetting);
  const edge = useStored(edgeScrollSetting);
  const numbers = useStored(numbersSetting);
  const autosave = useStored(autosaveSetting);
  const range = useStored(rangeSetting);
  const freeBuild = useStored(freeBuildSetting);
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
          href="/frost-fortress"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {T.backToGame}
        </Link>
      </header>

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
      <Setting
        title={T.modeTitle}
        hint={T.modeHint}
        options={[false, true].map((free) => ({
          id: free ? "mode-free" : "mode-waves",
          label: free ? T.modeFree : T.modeWaves,
          active: free === freeBuild,
          choose: () => freeBuildSetting.save(free),
        }))}
      />
      <Setting
        title={T.rangeTitle}
        hint={T.rangeHint}
        options={RANGES.map((value) => ({
          id: `range-${value}`,
          label: value === 1 ? T.rangeNormal : T.rangeFactor(value),
          active: value === range,
          choose: () => rangeSetting.save(value),
        }))}
      />
      <Setting
        title={T.soundTitle}
        hint={T.soundHint}
        options={[false, true].map((off) => ({
          id: off ? "sound-off" : "sound-on",
          label: off ? T.soundOff : T.soundOn,
          active: off === muted,
          choose: () => mutedSetting.save(off),
        }))}
      />
      <Setting
        title={T.edgeTitle}
        hint={T.edgeHint}
        options={onOff("edge", edge, edgeScrollSetting)}
      />
      <Setting
        title={T.numbersTitle}
        hint={T.numbersHint}
        options={onOff("numbers", numbers, numbersSetting)}
      />
      <Setting
        title={T.autosaveTitle}
        hint={T.autosaveHint}
        options={onOff("autosave", autosave, autosaveSetting)}
      />
    </div>
  );
}

/** One choice of the page. */
type Option = {
  readonly id: string;
  readonly label: string;
  readonly active: boolean;
  readonly choose: () => void;
};

/** One setting: a heading, a line of explanation and its buttons. */
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
    <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      </div>
      <div
        role="radiogroup"
        aria-label={title}
        className="flex flex-wrap gap-1.5"
      >
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={option.active}
            data-testid={`ff-setting-${option.id}`}
            onClick={option.choose}
            className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-semibold ${
              option.active
                ? "border-sky-500 bg-sky-600 text-white"
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

/** Reads a remembered value without breaking hydration. */
function useStored<V>(store: StoredValue<V>): V {
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
}
