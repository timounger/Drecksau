/**
 * The two panels that interrupt play: a level cleared, and the end.
 *
 * @module
 * @remarks
 * Cooperative, so there is no ranking and nothing to compare. What there is
 * instead is how far you got together - and after a cleared level, whether it
 * came with anything.
 */
"use client";

import type { ReactElement } from "react";
import type { MindGame, MindMove } from "@/games/the-mind/engine/state";
import { MIND_TEXTS as T } from "@/games/the-mind/i18n/texts";

/** Props of {@link MindLevelPanel}. */
export type MindLevelPanelProps = {
  readonly game: MindGame;
  readonly onMove: (move: MindMove) => void;
};

/**
 * Renders the panel between two levels.
 *
 * @param props - the finished level and where the next move goes
 * @returns the panel element
 */
export function MindLevelPanel({
  game,
  onMove,
}: MindLevelPanelProps): ReactElement {
  return (
    <section
      data-testid="mind-level-over"
      className="flex flex-col gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30"
    >
      <h2 className="text-lg font-bold">{T.levelDone(game.level)}</h2>
      {game.lastReward !== null && (
        <p className="text-sm font-medium">
          {game.lastReward.gift === "life" ? T.rewardLife : T.rewardShuriken}
        </p>
      )}
      <button
        type="button"
        data-testid="mind-next-level"
        onClick={() => onMove({ kind: "nextLevel" })}
        className="cursor-pointer self-start rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        {T.nextLevel}
      </button>
    </section>
  );
}

/** Props of {@link MindScores}. */
export type MindScoresProps = {
  readonly game: MindGame;
  /** Starts a fresh game, or null where the screen offers no such button. */
  readonly onNewGame: (() => void) | null;
};

/**
 * Renders the closing panel.
 *
 * @param props - the finished game and the way into the next one
 * @returns the result element
 */
export function MindScores({ game, onNewGame }: MindScoresProps): ReactElement {
  return (
    <section
      data-testid="mind-scores"
      className={`flex flex-col gap-3 rounded-2xl border p-4 ${
        game.won
          ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
          : "border-zinc-300 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/60"
      }`}
    >
      <h2 className="text-lg font-bold">
        {game.won ? T.wonTitle : T.lostTitle}
      </h2>
      <p className="text-sm">
        {game.won ? T.wonLine(game.levels) : T.lostLine(game.level)}
      </p>
      {onNewGame !== null && (
        <button
          type="button"
          onClick={onNewGame}
          className="cursor-pointer self-start rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {T.playAgain}
        </button>
      )}
    </section>
  );
}
