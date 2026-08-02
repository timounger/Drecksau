/**
 * The slider that sets how loud Panzerkiste's own sounds are.
 *
 * @module
 * @remarks
 * Game sounds only. A player who turns the tanks down still hears their
 * partner: the voice chat plays through its own elements and never looks at
 * this value.
 */
"use client";

import { useSyncExternalStore, type ReactElement } from "react";
import { gameVolume } from "@/games/panzerkiste/settings/sound-volume";
import { PANZERKISTE_TEXTS } from "@/games/panzerkiste/i18n/texts";

/** Steps the slider offers between silence and full, so it lands on round numbers. */
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
      title={PANZERKISTE_TEXTS.volumeTitle}
      className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white/60 px-3 py-1 dark:border-zinc-800 dark:bg-zinc-900/40"
    >
      <span aria-hidden="true">{volume === 0 ? "\u{1F507}" : "\u{1F50A}"}</span>
      <span className="sr-only">{PANZERKISTE_TEXTS.volumeLabel}</span>
      <input
        type="range"
        min={0}
        max={STEPS}
        step={1}
        value={Math.round(volume * STEPS)}
        data-testid="panzerkiste-volume"
        onChange={(event) =>
          gameVolume.save(Number(event.target.value) / STEPS)
        }
        className="h-1 w-24 cursor-pointer accent-emerald-600"
      />
      <span className="w-10 text-right text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
        {volume === 0
          ? PANZERKISTE_TEXTS.volumeMuted
          : PANZERKISTE_TEXTS.volumePercent(percent)}
      </span>
    </label>
  );
}
