/**
 * The short banners shown over the field: red at the start of a round, white
 * when a mission (a level) is completed.
 *
 * @module
 * @remarks
 * Both drop in for a couple of seconds and fade away on their own. The start
 * banner shows the mission number, the level's enemy count and the lives left;
 * the completion banner shows the total enemy tanks destroyed across all levels.
 * Both the single-player and the online screen render whichever is active; the
 * hooks decide when to raise one and hand over the facts to show.
 */
"use client";

import type { ReactElement } from "react";
import { PANZERKISTE_TEXTS } from "@/games/panzerkiste/i18n/texts";

/** A banner to flash over the field: a fresh round, or a completed mission. */
export type Banner =
  | {
      readonly kind: "start";
      /** The mission number, one-based. */
      readonly mission: number;
      /** How many enemy tanks the level holds. */
      readonly enemies: number;
      /** How many lives are left. */
      readonly lives: number;
      /** Rises each time, so the banner replays even for the same numbers. */
      readonly id: number;
    }
  | {
      readonly kind: "complete";
      /** Total enemy tanks destroyed across all levels so far. */
      readonly total: number;
      readonly id: number;
    };

/** How long a banner stays on screen, in milliseconds. */
export const ROUND_BANNER_MS = 2000;

/** The red look for the round-start banner. */
const START_LOOK = "border-2 border-red-400 bg-red-600/90 text-white shadow-xl";

/** The white look for the mission-completed banner. */
const COMPLETE_LOOK =
  "border-2 border-zinc-300 bg-white text-zinc-900 shadow-xl";

/**
 * Renders the active banner, or nothing when none is showing.
 *
 * @param props - the banner to show, or null
 * @returns the banner overlay, or null
 * @remarks
 * Sits inside the (relative) canvas wrapper and ignores pointer events, so play
 * continues underneath. The `key` restarts the drop-in/fade animation each time.
 */
export function BannerView({
  banner,
}: {
  banner: Banner | null;
}): ReactElement | null {
  if (banner === null) {
    return null;
  }
  const look = banner.kind === "complete" ? COMPLETE_LOOK : START_LOOK;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center pt-8"
    >
      <div
        key={banner.id}
        data-testid={`banner-${banner.kind}`}
        className={`flex flex-col items-center gap-1 rounded-2xl px-8 py-4 text-center ${look}`}
        style={{
          animation: `panzerkiste-banner ${ROUND_BANNER_MS}ms ease-out both`,
        }}
      >
        {banner.kind === "complete" ? (
          <>
            <span className="text-2xl font-black tracking-tight sm:text-3xl">
              {PANZERKISTE_TEXTS.missionComplete}
            </span>
            <span className="text-base font-semibold">
              {PANZERKISTE_TEXTS.destroyedTotal(banner.total)}
            </span>
          </>
        ) : (
          <>
            <span className="text-3xl font-black tracking-tight sm:text-4xl">
              {PANZERKISTE_TEXTS.mission(banner.mission)}
            </span>
            <span className="text-base font-semibold">
              {PANZERKISTE_TEXTS.enemiesLeft(banner.enemies)}
            </span>
            <span className="text-base font-semibold">
              {PANZERKISTE_TEXTS.lives(banner.lives)}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
