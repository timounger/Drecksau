/**
 * The pigs of one player, with name and turn marker.
 *
 * @module
 */
"use client";

import type { ReactElement } from "react";
import type { PigId, Player } from "@/game/state";
import { UI_TEXTS } from "@/i18n/translations";
import { PigView } from "./pig-view";

/** Props of {@link PlayerBoard}. */
export type PlayerBoardProps = {
  readonly player: Player;
  /** True while this player is to move. */
  readonly isActive: boolean;
  /** Pigs the currently selected card may be played at. */
  readonly targetPigIds: readonly PigId[];
  readonly onSelectPig: (pigId: PigId) => void;
};

/**
 * Renders the pig row of a player.
 *
 * @param props - the player and the current targeting state
 * @returns the board element
 */
export function PlayerBoard({
  player,
  isActive,
  targetPigIds,
  onSelectPig,
}: PlayerBoardProps): ReactElement {
  const dirtyCount = player.pigs.filter((pig) => pig.isDirty).length;

  return (
    <section
      className={[
        "rounded-2xl border p-3 transition",
        isActive
          ? "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20"
          : "border-zinc-200 bg-white/60 dark:border-zinc-800 dark:bg-zinc-900/40",
      ].join(" ")}
    >
      <header className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">
          {player.isHuman ? UI_TEXTS.yourPigs : player.name}
        </h2>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {dirtyCount}/{player.pigs.length} {UI_TEXTS.dirtyPig}
          {!player.isHuman && ` · ${player.hand.length} ${UI_TEXTS.cardsLeft}`}
        </span>
      </header>

      {/* Never wraps: a player's pigs belong on one line. When the window is
          too narrow the pigs shrink instead - see PigView. */}
      <div data-testid="pig-row" className="flex gap-2">
        {player.pigs.map((pig) => (
          <PigView
            key={pig.id}
            pig={pig}
            isTargetable={targetPigIds.includes(pig.id)}
            onSelect={onSelectPig}
          />
        ))}
      </div>
    </section>
  );
}
