/**
 * Drecksau's end-of-game animation.
 *
 * @module
 * @remarks
 * The animation itself is {@link @/components/game-result-overlay}, shared with
 * the other games. What is Drecksau's own is the pair of words and the
 * animations setting, which is a per-game choice.
 */
"use client";

import { type ReactElement } from "react";
import { useSyncExternalStore } from "react";
import {
  GameResultOverlay as SharedResultOverlay,
  type GameOutcome,
} from "@/components/game-result-overlay";
import { UI_TEXTS } from "@/games/drecksau/i18n/translations";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  subscribeSettings,
} from "@/games/drecksau/settings/settings-store";

export type { GameOutcome };

/** What the big word says at the end of a game of Drecksau. */
const WORDS: Readonly<Record<GameOutcome, string>> = {
  won: UI_TEXTS.resultWon,
  lost: UI_TEXTS.resultLost,
};

/** Props of {@link GameResultOverlay}. */
export type GameResultOverlayProps = {
  /** The outcome to celebrate, or null while the game is still running. */
  readonly outcome: GameOutcome | null;
};

/**
 * Plays the end-of-game animation for a win or a loss.
 *
 * @param props - the outcome to show
 * @returns the overlay, or null when nothing is playing or animations are off
 */
export function GameResultOverlay({
  outcome,
}: GameResultOverlayProps): ReactElement | null {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getServerSettingsSnapshot,
  );

  return (
    <SharedResultOverlay
      outcome={outcome}
      words={WORDS}
      enabled={settings.areAnimationsEnabled}
    />
  );
}
