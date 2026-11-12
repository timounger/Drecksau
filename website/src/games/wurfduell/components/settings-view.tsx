/**
 * Wurfduell settings: how well the computer aims, the sound, the camera and
 * the aiming dots.
 *
 * @module
 * @remarks
 * Laid out like the settings pages of the other games - one card per
 * setting, a row of buttons to choose from, the way back in the corner.
 * Everything is remembered in this browser and applies from the next turn on.
 */
"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactElement } from "react";
import { DIFFICULTIES } from "@/games/wurfduell/engine/ai";
import { WURFDUELL_TEXTS as T } from "@/games/wurfduell/i18n/texts";
import {
  aimDotsSetting,
  cameraSetting,
  difficultySetting,
  mutedSetting,
  type CameraMode,
} from "@/games/wurfduell/settings/preferences";
import type { StoredValue } from "@/lib/storage/stored-value";

/** The camera modes, in button order. */
const CAMERA_MODES: readonly CameraMode[] = ["follow", "overview"];

/**
 * Renders the settings page.
 *
 * @returns the page element
 */
export function WurfduellSettingsView(): ReactElement {
  const difficulty = useStored(difficultySetting);
  const muted = useStored(mutedSetting);
  const camera = useStored(cameraSetting);
  const aimDots = useStored(aimDotsSetting);

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
          href="/wurfduell"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {T.backToGame}
        </Link>
      </header>

      <Setting
        title={T.difficultyTitle}
        hint={T.difficultyHint}
        options={DIFFICULTIES.map((level) => ({
          id: `difficulty-${level}`,
          label: T.difficulties[level],
          active: level === difficulty,
          choose: () => difficultySetting.save(level),
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
        title={T.cameraTitle}
        hint={T.cameraHint}
        options={CAMERA_MODES.map((mode) => ({
          id: `camera-${mode}`,
          label: T.cameraModes[mode],
          active: mode === camera,
          choose: () => cameraSetting.save(mode),
        }))}
      />
      <Setting
        title={T.aimDotsTitle}
        hint={T.aimDotsHint}
        options={[true, false].map((on) => ({
          id: on ? "dots-on" : "dots-off",
          label: on ? T.on : T.off,
          active: on === aimDots,
          choose: () => aimDotsSetting.save(on),
        }))}
      />

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {T.settingsNote}
      </p>
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
            data-testid={`wd-setting-${option.id}`}
            onClick={option.choose}
            className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-semibold ${
              option.active
                ? "border-indigo-500 bg-indigo-600 text-white"
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
