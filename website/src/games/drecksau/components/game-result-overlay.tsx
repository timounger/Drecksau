/**
 * Big end-of-game animation: won with raining droplets, lost with dung.
 *
 * @module
 * @remarks
 * Plays once when the game ends, longer and larger than a card effect, then
 * fades on its own so the result banner and buttons underneath stay usable. It
 * never takes a click. Like the card effects, it respects the animations
 * setting.
 */
"use client";

import { UI_TEXTS } from "@/games/drecksau/i18n/translations";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  subscribeSettings,
} from "@/games/drecksau/settings/settings-store";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactElement,
} from "react";

/** How the game ended for the viewer. */
export type GameOutcome = "won" | "lost";

/** How long the whole end animation runs, in milliseconds - a proper finale. */
const GAME_OVER_DURATION_MS = 5000;

/** Look of each outcome: the centre icon, the raining icon, tint and word. */
const OUTCOMES: Readonly<
  Record<
    GameOutcome,
    {
      /** The big icon in the middle. */
      readonly icon: string;
      /** The icon raining down - a celebration for a win, dung for a loss. */
      readonly fallIcon: string;
      readonly tint: string;
      readonly word: string;
      readonly wordClass: string;
    }
  >
> = {
  won: {
    icon: "\u{1F3C6}", // trophy
    fallIcon: "\u{2728}", // sparkles
    tint: "bg-amber-300/30",
    word: UI_TEXTS.resultWon,
    wordClass: "text-amber-100",
  },
  lost: {
    icon: "\u{1F4A9}", // pile of poo
    fallIcon: "\u{1F4A9}",
    tint: "bg-amber-900/35",
    word: UI_TEXTS.resultLost,
    wordClass: "text-amber-100",
  },
};

/** How many icons rain down. */
const FALL_COUNT = 20;
/** Spread step across the width; coprime with 100 so they do not line up. */
const FALL_SPREAD_STEP_PERCENT = 97;
/** A full width, for wrapping the index based positions. */
const FULL_WIDTH_PERCENT = 100;
/** Fall timing, varied by index so not everything drops in lockstep. */
const FALL_MIN_MS = 1700;
const FALL_STEP_MS = 150;
const FALL_VARIANTS = 5;
const FALL_DELAY_STEP_MS = 120;
const FALL_DELAY_VARIANTS = 8;

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

  const [shown, setShown] = useState<{
    outcome: GameOutcome;
    id: number;
  } | null>(null);
  // The outcome we last animated, so the game ending triggers it exactly once.
  const lastOutcome = useRef<GameOutcome | null>(null);
  const idCounter = useRef(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (outcome === null) {
      // A new game cleared the result; arm for the next ending.
      lastOutcome.current = null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset/play once when the game ends
      setShown(null);
    } else if (outcome !== lastOutcome.current) {
      lastOutcome.current = outcome;
      idCounter.current += 1;
      setShown({ outcome, id: idCounter.current });
      timer = setTimeout(() => setShown(null), GAME_OVER_DURATION_MS);
    }

    return () => clearTimeout(timer);
  }, [outcome]);

  let overlay: ReactElement | null = null;

  if (shown !== null && settings.areAnimationsEnabled) {
    const look = OUTCOMES[shown.outcome];
    overlay = (
      // The key restarts the animation if a new game ends while one still plays.
      <div
        key={shown.id}
        aria-hidden="true"
        data-testid={`result-${shown.outcome}`}
        className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      >
        <span
          className={`absolute inset-0 ${look.tint}`}
          style={{
            animation: `drecksau-result-tint ${GAME_OVER_DURATION_MS}ms ease-out both`,
          }}
        />

        {range(FALL_COUNT).map((index) => (
          <span
            key={index}
            className="absolute top-0 text-4xl"
            style={{
              left: `${(index * FALL_SPREAD_STEP_PERCENT) % FULL_WIDTH_PERCENT}%`,
              // Repeats so it keeps raining for the whole (longer) finale
              // instead of stopping after the first drop.
              animation: `drecksau-drop ${FALL_MIN_MS + (index % FALL_VARIANTS) * FALL_STEP_MS}ms linear ${(index % FALL_DELAY_VARIANTS) * FALL_DELAY_STEP_MS}ms infinite`,
            }}
          >
            {look.fallIcon}
          </span>
        ))}

        <div
          className="flex flex-col items-center gap-2 drop-shadow-lg"
          style={{
            animation: `drecksau-result ${GAME_OVER_DURATION_MS}ms ease-out both`,
          }}
        >
          <span className="text-[7rem] leading-none sm:text-[9rem]">
            {look.icon}
          </span>
          <span
            className={`text-6xl font-black tracking-tight sm:text-8xl ${look.wordClass}`}
          >
            {look.word}
          </span>
        </div>
      </div>
    );
  }

  return overlay;
}

/** The numbers 0 to count - 1. */
function range(count: number): number[] {
  return Array.from({ length: count }, (unused, index) => index);
}
