/**
 * The slider that sets how loud the car radio is.
 *
 * @module
 * @remarks
 * The same control as Panzerkiste's, down to the store it reads: a site with
 * two games should not have two ideas of what a volume knob looks like.
 * Nought is mute, which is why there is no separate switch for it.
 */
"use client";

import { useSyncExternalStore, type ReactElement } from "react";
import { gameVolume } from "@/games/gta/settings/sound-volume";
import { GTA_TEXTS as T } from "@/games/gta/i18n/texts";

/** Steps between silence and full, so the slider lands on round numbers. */
const STEPS = 20;

/** Turning 0..1 into whole percent for the label. */
const PERCENT = 100;

/**
 * Renders the volume slider.
 *
 * @returns the slider element
 */
export function VolumeSlider(): ReactElement {
  const volume = useSyncExternalStore(
    gameVolume.subscribe,
    gameVolume.getSnapshot,
    gameVolume.getServerSnapshot,
  );
  const percent = Math.round(volume * PERCENT);

  return (
    <label
      title={T.volumeTitle}
      className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white/60 px-3 py-1 dark:border-zinc-800 dark:bg-zinc-900/40"
    >
      <span aria-hidden="true">{volume === 0 ? "\u{1F507}" : "\u{1F50A}"}</span>
      <span className="sr-only">{T.volumeLabel}</span>
      <input
        type="range"
        min={0}
        max={STEPS}
        step={1}
        value={Math.round(volume * STEPS)}
        data-testid="gta-volume"
        onChange={(event) => {
          gameVolume.save(Number(event.target.value) / STEPS);
        }}
        className="h-1 w-24 cursor-pointer accent-indigo-600"
      />
      <span className="w-10 text-right text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
        {volume === 0 ? T.volumeMuted : T.volumePercent(percent)}
      </span>
    </label>
  );
}
