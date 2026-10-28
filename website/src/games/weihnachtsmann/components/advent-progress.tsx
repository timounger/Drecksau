/**
 * The Advent calendar under the picture: how many gates are done, which one
 * is next, and a little door for each of the 26.
 *
 * @module
 */
"use client";

import type { ReactElement } from "react";
import { GATE_COUNT } from "@/games/weihnachtsmann/engine/gates";
import type { Hud } from "@/games/weihnachtsmann/hooks/use-weihnachtsmann-game";
import { WM_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { MINIGAMES } from "@/games/weihnachtsmann/minigames";

/**
 * Renders the calendar strip.
 *
 * @param props - what the screen shows
 * @returns the strip
 */
export function AdventProgress({
  hud,
  compact = false,
  below = false,
}: {
  readonly hud: Hud;
  /** One thin row of 26 doors for a phone. */
  readonly compact?: boolean;
  /** Whether its height counts against the picture's (see the hook). */
  readonly below?: boolean;
}): ReactElement {
  const done = new Set(hud.gatesDone);
  const shut = new Set(hud.locked);
  const count = hud.gatesDone.length;
  return (
    <div
      data-testid="wm-advent"
      data-wm-below={below ? "" : undefined}
      className={
        compact
          ? "flex w-full flex-col gap-0.5 px-0.5 pt-1 pb-1"
          : "flex w-full flex-col gap-1 pt-2 sm:flex-row sm:items-center sm:gap-3"
      }
    >
      <div
        className={`flex shrink-0 items-baseline gap-2 ${compact ? "text-[11px]" : "text-xs"}`}
      >
        <span className="font-semibold text-amber-200">
          {WM_TEXTS.progressLabel}
        </span>
        <span data-testid="wm-advent-count" className="font-bold text-zinc-100">
          {count}/{GATE_COUNT} {WM_TEXTS.progressCount}
        </span>
        <span className="text-zinc-400">
          {hud.nextGate === null
            ? shut.size > 0
              ? WM_TEXTS.progressLocked
              : WM_TEXTS.progressAll
            : `${WM_TEXTS.progressNext} ${String(hud.nextGate)}`}
        </span>
      </div>
      <ol
        className={
          compact
            ? "grid flex-1 grid-cols-[repeat(26,minmax(0,1fr))] gap-px"
            : "grid flex-1 grid-cols-13 gap-0.5"
        }
      >
        {MINIGAMES.map((game) => {
          const won = done.has(game.number);
          const next = game.number === hud.nextGate;
          const locked = shut.has(game.number);
          const name = `${WM_TEXTS.gateLabel} ${String(game.number)} - ${game.title}`;
          return (
            <li
              key={game.number}
              data-locked={locked ? "" : undefined}
              title={
                locked
                  ? `${name} (${WM_TEXTS.gateLockedHint} ${String(game.number)}. ${WM_TEXTS.december})`
                  : name
              }
              className={`flex items-center justify-center rounded-sm border font-bold ${
                compact ? "h-4 text-[8px] tracking-tighter" : "h-5 text-[10px]"
              } ${
                locked
                  ? "border-zinc-800 bg-zinc-900/80 text-zinc-600"
                  : won
                    ? "border-amber-300 bg-amber-400/80 text-amber-950"
                    : next
                      ? "animate-pulse border-amber-300 bg-red-900/70 text-amber-100"
                      : "border-zinc-700 bg-red-950/50 text-zinc-300"
              }`}
            >
              {game.number}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
