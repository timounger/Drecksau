/**
 * The offline screen: you against the computer.
 *
 * @module
 */
"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactElement } from "react";
import { GameHeader } from "@/components/game-header";
import {
  GameResultOverlay,
  type GameOutcome,
} from "@/components/game-result-overlay";
import { HitsterTable } from "@/games/hitster/components/hitster-table";
import { useHitsterGame } from "@/games/hitster/hooks/use-hitster-game";
import { HITSTER_RULES } from "@/games/hitster/i18n/rules";
import {
  DIFFICULTY_NAMES,
  HITSTER_TEXTS as T,
} from "@/games/hitster/i18n/texts";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  subscribeSettings,
} from "@/games/hitster/settings/settings-store";
import { COLLECTION_TEXTS } from "@/i18n/collection-texts";

/** The big word the end animation puts on the screen. */
const RESULT_WORDS: Readonly<Record<GameOutcome, string>> = {
  won: T.won,
  lost: T.lost,
};

/** The look of the header's link buttons. */
const LINK_BUTTON =
  "rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800";

/**
 * Renders a game against the computer.
 *
 * @returns the screen
 */
export function HitsterGame(): ReactElement {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getServerSettingsSnapshot,
  );
  const { game, mine, play, newGame } = useHitsterGame(settings);
  const outcome: GameOutcome | null =
    game.phase !== "over" ? null : game.winner === mine ? "won" : "lost";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4">
      <GameHeader title={T.title} subtitle={T.tagline} rules={HITSTER_RULES}>
        <button
          type="button"
          data-testid="hit-new"
          onClick={newGame}
          className="cursor-pointer rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {T.newGame}
        </button>
        <Link href="/hitster/online" className={LINK_BUTTON}>
          Online spielen
        </Link>
        <Link href="/hitster/einstellungen" className={LINK_BUTTON}>
          {COLLECTION_TEXTS.settings}
        </Link>
        <Link href="/hitster/statistik" className={LINK_BUTTON}>
          {COLLECTION_TEXTS.statistics}
        </Link>
      </GameHeader>

      <GameResultOverlay outcome={outcome} words={RESULT_WORDS} />

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {game.players.length - 1} {T.computer} ·{" "}
        {DIFFICULTY_NAMES[game.difficulty]} · {T.cards(0, game.target).slice(2)}
      </p>

      {game.phase === "over" && (
        <button
          type="button"
          onClick={newGame}
          className="cursor-pointer self-start rounded-lg bg-fuchsia-600 px-4 py-2 text-sm font-semibold text-white hover:bg-fuchsia-700"
        >
          {T.newGame}
        </button>
      )}

      <HitsterTable game={game} mine={mine} onMove={play} />
    </div>
  );
}
