/**
 * Short full screen animation for the card that was just played.
 *
 * @module
 */
"use client";

import {
  useSyncExternalStore,
  type CSSProperties,
  type ReactElement,
} from "react";
import type { ActionCardType } from "@/game/cards";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  subscribeSettings,
} from "@/lib/settings/settings-store";

/** The card whose effect is currently playing. */
export type CardEffect = {
  readonly type: ActionCardType;
  /** Rises with every effect, so the same card twice restarts the animation. */
  readonly id: number;
};

/** How long each effect runs, in milliseconds. */
export const EFFECT_DURATIONS_MS: Readonly<Record<ActionCardType, number>> = {
  mud: 900,
  rain: 1600,
  barn: 1000,
  lightning: 1000,
  lightningRod: 1000,
  farmerScrubs: 1200,
  barnDoor: 1100,
  beauty: 1100,
  dustOff: 900,
  luckyBird: 1100,
  // Defence cards never play actively, so these are never shown - present only
  // to keep the lookup exhaustive.
  extraMud: 0,
  lipstick: 0,
};

/** Longest effect - how long the trigger has to keep an effect alive. */
export const MAX_EFFECT_DURATION_MS = Math.max(
  ...Object.values(EFFECT_DURATIONS_MS),
);

/**
 * Tuning of the rain.
 *
 * @remarks
 * Picked by eye, not derived from anything. Every drop takes its values from
 * its index, so the pattern looks irregular without using randomness - which
 * would differ between the prerendered HTML and the browser.
 */
const RAIN = {
  /** Enough drops to read as rain, few enough to stay smooth. */
  dropCount: 44,
  /** Step across the width; coprime with 100 so drops do not line up. */
  spreadStepPercent: 97,
  /** Drop lengths run from this, in as many steps as `lengthVariants`. */
  minLengthPx: 14,
  lengthStepPx: 6,
  lengthVariants: 4,
  /** Fall times, so not every drop falls at the same speed. */
  minFallMs: 700,
  fallStepMs: 120,
  fallVariants: 5,
  /** Staggered start, so the rain sets in rather than appearing at once. */
  delayStepMs: 90,
  delayVariants: 9,
} as const;

/** Tuning of the mud splashes. */
const SPLAT = {
  /** Blobs bursting out of the centre. */
  count: 14,
  /** How far they fly, in pixels. */
  distancePx: 220,
  /** Slight stagger so they do not move as one block. */
  delayStepMs: 40,
  delayVariants: 3,
} as const;

/** Tuning of the rising bubbles and sparks. */
const RISE = {
  count: 12,
  /** Spread across the middle of the screen, in percent. */
  startPercent: 20,
  spreadStepPercent: 53,
  spreadWidthPercent: 60,
  delayStepMs: 80,
  delayVariants: 6,
} as const;

/** A full circle in radians, for spreading the blobs evenly. */
const FULL_TURN_RAD = 2 * Math.PI;

/** Percent of a full width - for wrapping the index based positions. */
const FULL_WIDTH_PERCENT = 100;

/** Props of {@link ActionEffectOverlay}. */
export type ActionEffectOverlayProps = {
  /** The effect to play, or null for none. */
  readonly effect: CardEffect | null;
};

/**
 * Plays the animation belonging to a card.
 *
 * @param props - the effect to play
 * @returns the overlay, or null when nothing is playing or animations are off
 * @remarks
 * Lies above everything but never takes a click, so the game stays playable
 * while an effect runs.
 */
export function ActionEffectOverlay({
  effect,
}: ActionEffectOverlayProps): ReactElement | null {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getServerSettingsSnapshot,
  );

  let overlay: ReactElement | null = null;

  if (effect !== null && settings.areAnimationsEnabled) {
    overlay = (
      // The key restarts the animation when the same card is played again.
      <div
        key={effect.id}
        aria-hidden="true"
        data-testid={`effect-${effect.type}`}
        className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      >
        {EFFECTS[effect.type]()}
      </div>
    );
  }

  return overlay;
}

/**
 * The animation of each card type.
 *
 * @remarks
 * A lookup instead of a long if-else chain, as the coding rules ask for.
 */
const EFFECTS: Readonly<Record<ActionCardType, () => ReactElement>> = {
  // Rain over the whole screen, plus a cool wash of colour.
  rain: () => (
    <>
      <Tint className="bg-sky-400/20" durationMs={EFFECT_DURATIONS_MS.rain} />
      {range(RAIN.dropCount).map((index) => (
        <span
          key={index}
          // Deep blue, not pale: the board behind is nearly white, and pale
          // drops on a blue wash simply disappear.
          className="absolute top-0 w-[3px] rounded-full bg-sky-600/70"
          style={{
            left: `${(index * RAIN.spreadStepPercent) % FULL_WIDTH_PERCENT}%`,
            height: `${RAIN.minLengthPx + (index % RAIN.lengthVariants) * RAIN.lengthStepPx}px`,
            animation: `drecksau-drop ${RAIN.minFallMs + (index % RAIN.fallVariants) * RAIN.fallStepMs}ms linear ${(index % RAIN.delayVariants) * RAIN.delayStepMs}ms both`,
          }}
        />
      ))}
    </>
  ),

  // Mud: blobs burst out of the middle.
  mud: () => (
    <Burst
      durationMs={EFFECT_DURATIONS_MS.mud}
      className="h-5 w-5 rounded-full bg-[#7a5238]"
    />
  ),

  // Lightning: hard flashes and a bolt.
  lightning: () => (
    <>
      <span
        className="absolute inset-0 bg-white"
        style={{
          animation: `drecksau-flash ${EFFECT_DURATIONS_MS.lightning}ms ease-out both`,
        }}
      />
      <Symbol durationMs={EFFECT_DURATIONS_MS.lightning}>{"\u{26A1}"}</Symbol>
    </>
  ),

  // The stall drops onto the pig.
  barn: () => (
    <span
      className="absolute inset-0 flex items-center justify-center text-8xl"
      style={{
        animation: `drecksau-drop-in ${EFFECT_DURATIONS_MS.barn}ms cubic-bezier(0.3, 1.4, 0.5, 1) both`,
      }}
    >
      {"\u{1F3E0}"}
    </span>
  ),

  // Sparks fly up the rod.
  lightningRod: () => (
    <>
      <Symbol durationMs={EFFECT_DURATIONS_MS.lightningRod}>
        {"\u{1F517}"}
      </Symbol>
      <Rising
        durationMs={EFFECT_DURATIONS_MS.lightningRod}
        className="h-2 w-2 rounded-full bg-amber-300"
      />
    </>
  ),

  // The farmer scrubs: foam rises.
  farmerScrubs: () => (
    <>
      <Tint
        className="bg-cyan-200/30"
        durationMs={EFFECT_DURATIONS_MS.farmerScrubs}
      />
      <Symbol durationMs={EFFECT_DURATIONS_MS.farmerScrubs}>
        {"\u{1F9FD}"}
      </Symbol>
      <Rising
        durationMs={EFFECT_DURATIONS_MS.farmerScrubs}
        className="h-4 w-4 rounded-full border border-white/70 bg-white/50"
      />
    </>
  ),

  // The Schönsau: a pink shimmer and sparkles rising.
  beauty: () => (
    <>
      <Tint
        className="bg-fuchsia-300/25"
        durationMs={EFFECT_DURATIONS_MS.beauty}
      />
      <Symbol durationMs={EFFECT_DURATIONS_MS.beauty}>{"\u{1F484}"}</Symbol>
      <Rising
        durationMs={EFFECT_DURATIONS_MS.beauty}
        className="h-3 w-3 rounded-full bg-fuchsia-400/80"
      />
    </>
  ),

  // Aus dem Staub: the beauty is blown away in a puff of dust.
  dustOff: () => (
    <Burst
      durationMs={EFFECT_DURATIONS_MS.dustOff}
      className="h-4 w-4 rounded-full bg-zinc-400/70"
    />
  ),

  // The lucky bird flies past.
  luckyBird: () => (
    <>
      <Tint
        className="bg-emerald-200/25"
        durationMs={EFFECT_DURATIONS_MS.luckyBird}
      />
      <Symbol durationMs={EFFECT_DURATIONS_MS.luckyBird}>{"\u{1F426}"}</Symbol>
    </>
  ),

  // The door gets nailed shut.
  barnDoor: () => (
    <span
      className="absolute inset-0 flex items-center justify-center text-8xl"
      style={{
        animation: `drecksau-hammer ${EFFECT_DURATIONS_MS.barnDoor}ms ease-in-out both`,
        transformOrigin: "80% 80%",
      }}
    >
      {"\u{1F528}"}
    </span>
  ),

  // Defence cards never play actively, so their overlay is never rendered.
  extraMud: () => <></>,
  lipstick: () => <></>,
};

/** A short wash of colour over the screen. */
function Tint({
  className,
  durationMs,
}: {
  className: string;
  durationMs: number;
}): ReactElement {
  return (
    <span
      className={`absolute inset-0 ${className}`}
      style={{ animation: `drecksau-tint ${durationMs}ms ease-out both` }}
    />
  );
}

/** The symbol in the middle of the screen. */
function Symbol({
  children,
  durationMs,
}: {
  children: string;
  durationMs: number;
}): ReactElement {
  return (
    <span
      className="absolute inset-0 flex items-center justify-center text-8xl drop-shadow-lg"
      style={{ animation: `drecksau-pop ${durationMs}ms ease-out both` }}
    >
      {children}
    </span>
  );
}

/** Particles bursting out of the centre, evenly spread. */
function Burst({
  durationMs,
  className,
}: {
  durationMs: number;
  className: string;
}): ReactElement {
  return (
    <span className="absolute inset-0 flex items-center justify-center">
      {range(SPLAT.count).map((index) => {
        // Evenly around the circle, so the splash looks round.
        const radians = (index / SPLAT.count) * FULL_TURN_RAD;
        const style = {
          "--dx": `${Math.round(Math.cos(radians) * SPLAT.distancePx)}px`,
          "--dy": `${Math.round(Math.sin(radians) * SPLAT.distancePx)}px`,
          animation: `drecksau-splat ${durationMs}ms ease-out ${(index % SPLAT.delayVariants) * SPLAT.delayStepMs}ms both`,
        } as CSSProperties;
        return (
          <span key={index} className={`absolute ${className}`} style={style} />
        );
      })}
    </span>
  );
}

/** Particles drifting upward from the lower half. */
function Rising({
  durationMs,
  className,
}: {
  durationMs: number;
  className: string;
}): ReactElement {
  return (
    <>
      {range(RISE.count).map((index) => (
        <span
          key={index}
          className={`absolute bottom-0 ${className}`}
          style={{
            left: `${RISE.startPercent + ((index * RISE.spreadStepPercent) % RISE.spreadWidthPercent)}%`,
            animation: `drecksau-rise ${durationMs}ms ease-out ${(index % RISE.delayVariants) * RISE.delayStepMs}ms both`,
          }}
        />
      ))}
    </>
  );
}

/** The numbers 0 to count - 1. */
function range(count: number): number[] {
  return Array.from({ length: count }, (unused, index) => index);
}
