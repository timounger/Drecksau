/**
 * The pigs of one player, with name and turn marker.
 *
 * @module
 */
"use client";

import type { ReactElement, ReactNode } from "react";
import type { CardTheme } from "@/assets/cards/themes";
import { hasBeauty, showsDirty, type PigId, type Player } from "@/game/state";
import { UI_TEXTS } from "@/i18n/translations";
import { PigView } from "./pig-view";

/** Props of {@link PlayerBoard}. */
export type PlayerBoardProps = {
  readonly player: Player;
  /** True while this player is to move. */
  readonly isActive: boolean;
  /**
   * Whether this board belongs to the viewer.
   *
   * @remarks
   * Decides between "Deine Schweine" and the player's name, and whether the
   * hand count is shown (only for others). Defaults to {@link Player.isHuman},
   * which is right for the single-player game where the one human is the
   * viewer; online it is set explicitly, since there every seat is human.
   */
  readonly isSelf?: boolean;
  /** Pigs the currently selected card may be played at. */
  readonly targetPigIds: readonly PigId[];
  /** True with the expansion, where Schönsäue are a way to win too. */
  readonly showBeautyCount: boolean;
  /** The card design to draw. */
  readonly theme: CardTheme;
  /** Optional badge shown next to the name, e.g. an auto-play countdown. */
  readonly headerBadge?: ReactNode;
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
  isSelf,
  targetPigIds,
  showBeautyCount,
  theme,
  headerBadge,
  onSelectPig,
}: PlayerBoardProps): ReactElement {
  // In the single-player game the one human is the viewer; online it is passed.
  const self = isSelf ?? player.isHuman;
  // A pig under a Schönsau is not a Drecksau - hence showsDirty, not isDirty.
  const dirtyCount = player.pigs.filter(showsDirty).length;
  const beautyCount = player.pigs.filter(hasBeauty).length;

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
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          {self ? UI_TEXTS.yourPigs : player.name}
          {headerBadge}
        </h2>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {dirtyCount}/{player.pigs.length} {UI_TEXTS.dirtyPig}
          {/* With the expansion both counts are a way to win, so both show. */}
          {showBeautyCount &&
            ` · ${beautyCount}/${player.pigs.length} ${UI_TEXTS.beautyPig}`}
          {!self && ` · ${player.hand.length} ${UI_TEXTS.cardsLeft}`}
        </span>
      </header>

      {/* Never wraps: a player's pigs belong on one line. When the window is
          too narrow the pigs shrink instead - see PigView. */}
      <div data-testid="pig-row" className="flex gap-2">
        {player.pigs.map((pig) => (
          <PigView
            key={pig.id}
            pig={pig}
            theme={theme}
            isTargetable={targetPigIds.includes(pig.id)}
            onSelect={onSelectPig}
          />
        ))}
      </div>
    </section>
  );
}
