/**
 * The panel over the field once somebody is knocked out: the end scene with
 * both fighters, who won and how, the score at this table, and the rematch
 * button.
 *
 * @module
 */
"use client";

import type { ReactElement } from "react";
import type { DuelGame } from "@/games/wurfduell/engine/types";
import { WURFDUELL_TEXTS as T } from "@/games/wurfduell/i18n/texts";
import { EndScene } from "./end-scene";

/** Props of {@link MatchOverPanel}. */
export type MatchOverPanelProps = {
  readonly game: DuelGame;
  readonly names: readonly string[];
  /** The seat looking at it, or null at a shared device. */
  readonly viewer: number | null;
  readonly onRematch: () => void;
  readonly rematchLabel: string;
  /** Disables the button while waiting for the other side. */
  readonly waiting?: boolean;
  /** One more line, e.g. that the opponent wants a rematch. */
  readonly note?: string | null;
  readonly onLeave: () => void;
  readonly leaveLabel: string;
};

/**
 * Renders the end of a match.
 *
 * @param props - the match and the buttons
 * @returns the panel
 */
export function MatchOverPanel({
  game,
  names,
  viewer,
  onRematch,
  rematchLabel,
  waiting = false,
  note = null,
  onLeave,
  leaveLabel,
}: MatchOverPanelProps): ReactElement {
  const winner = game.winner ?? 0;
  const winnerFighter = game.players[winner].character;
  const loserFighter = game.players[1 - winner].character;
  let title = T.winnerIs(names[winner] ?? "");
  if (viewer !== null) {
    const lost = game.endReason === "resign" ? T.resignedTitle : T.lostTitle;
    title = viewer === winner ? T.wonTitle : lost;
  }
  return (
    <div className="z-20 mt-2 flex items-center justify-center rounded-2xl lg:absolute lg:inset-0 lg:mt-0 lg:bg-black/45 lg:p-3">
      <div
        data-testid="wd-over"
        className="flex w-full max-w-xl flex-col items-center gap-2 rounded-2xl bg-white/95 p-3 text-center shadow-xl dark:bg-zinc-900/95"
      >
        {winnerFighter !== null && loserFighter !== null && (
          <EndScene
            winner={winnerFighter}
            loser={loserFighter}
            knockout={game.endReason === "ko"}
          />
        )}
        <p
          className="text-2xl font-black sm:text-3xl"
          data-testid="wd-over-title"
        >
          {title}
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          {T.winnerIs(names[winner] ?? "")}{" "}
          {game.endReason === "resign" ? T.byResign : T.byKnockout}
        </p>
        <p className="text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
          {T.lifeLeft(game.players[winner].hp, game.players[winner].maxHp)}
        </p>
        <p
          className="text-sm font-semibold tabular-nums"
          data-testid="wd-score"
        >
          {T.scoreLabel}: {names[0]}{" "}
          {T.score(game.players[0].wins, game.players[1].wins)} {names[1]}
        </p>
        {note !== null && (
          <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
            {note}
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            data-testid="wd-rematch"
            disabled={waiting}
            onClick={onRematch}
            className="cursor-pointer rounded-xl bg-amber-500 px-4 py-2 font-bold text-white hover:bg-amber-600 disabled:cursor-default disabled:opacity-60"
          >
            {rematchLabel}
          </button>
          <button
            type="button"
            data-testid="wd-leave"
            onClick={onLeave}
            className="cursor-pointer rounded-xl border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {leaveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
