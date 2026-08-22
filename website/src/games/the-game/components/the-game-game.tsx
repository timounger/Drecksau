/**
 * The offline screen: you, and partners the computer plays.
 *
 * @module
 * @remarks
 * Cooperative, so the computer is on your side - and cannot see your hand. That
 * is not politeness, it is the game: the whole tension of this rulebook is that
 * nobody may say what they hold. See {@link ./engine/ai}.
 */
"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactElement } from "react";
import { GameHeader } from "@/components/game-header";
import { TheGameScores } from "@/games/the-game/components/the-game-scores";
import {
  TheGameStatus,
  TheGameTable,
} from "@/games/the-game/components/the-game-table";
import { useTheGame } from "@/games/the-game/hooks/use-the-game";
import { THE_GAME_RULES } from "@/games/the-game/i18n/rules";
import { THE_GAME_TEXTS as T } from "@/games/the-game/i18n/texts";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  subscribeSettings,
} from "@/games/the-game/settings/settings-store";
import { COLLECTION_TEXTS } from "@/i18n/collection-texts";

/** How many log lines are kept on screen. */
const LOG_LINES = 8;

/**
 * Renders a game against the computer.
 *
 * @returns the screen
 */
export function TheGameScreen(): ReactElement {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getServerSettingsSnapshot,
  );
  const { game, mySeat, play, newGame } = useTheGame(settings);
  const over = game.phase !== "playing";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 p-4">
      <GameHeader title={T.title} subtitle={T.tagline} rules={THE_GAME_RULES}>
        <button
          type="button"
          data-testid="tg-new"
          onClick={newGame}
          className="cursor-pointer rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {T.playAgain}
        </button>
        <Link
          href="/the-game/online"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Online spielen
        </Link>
        <Link
          href="/the-game/einstellungen"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {COLLECTION_TEXTS.settings}
        </Link>
        <Link
          href="/the-game/statistik"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {COLLECTION_TEXTS.statistics}
        </Link>
      </GameHeader>

      {over && <TheGameScores game={game} onNewGame={newGame} />}

      <TheGameStatus game={game} mySeat={mySeat} />
      <TheGameTable game={game} mySeat={over ? null : mySeat} onMove={play} />

      <section className="flex flex-col gap-1 rounded-2xl border border-zinc-200 p-3 text-xs dark:border-zinc-800">
        <h2 className="text-sm font-semibold">{T.log}</h2>
        <ul className="flex flex-col gap-0.5 text-zinc-600 dark:text-zinc-300">
          {game.log.slice(-LOG_LINES).map((line, index) => (
            <li key={`${index}-${line}`}>{line}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
