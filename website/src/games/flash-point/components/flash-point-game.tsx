/**
 * The offline screen: you, and colleagues the computer plays.
 *
 * @module
 * @remarks
 * Cooperative, so the computer is on your side. It walks to the nearest person
 * who needs carrying, gets them out, and hoses down whatever is between it and
 * there - a useful colleague rather than a clever one, which in a game where
 * everybody can see everything is the right sort.
 */
"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactElement } from "react";
import { GameHeader } from "@/components/game-header";
import { FlashPointBoard } from "@/games/flash-point/components/flash-point-board";
import { FlashPointScores } from "@/games/flash-point/components/flash-point-scores";
import { TOTAL_CUBES, activePlayer } from "@/games/flash-point/engine/state";
import { useFlashPointGame } from "@/games/flash-point/hooks/use-flash-point-game";
import { FLASH_POINT_RULES } from "@/games/flash-point/i18n/rules";
import { FLASH_POINT_TEXTS as T } from "@/games/flash-point/i18n/texts";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  subscribeSettings,
} from "@/games/flash-point/settings/settings-store";
import { COLLECTION_TEXTS } from "@/i18n/collection-texts";

/** How many log lines are kept on screen. */
const LOG_LINES = 8;

/**
 * Renders a call-out against the computer.
 *
 * @returns the screen
 */
export function FlashPointGame(): ReactElement {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getServerSettingsSnapshot,
  );
  const { game, mySeat, play, newGame } = useFlashPointGame(settings);
  const over = game.stage === "won" || game.stage === "lost";
  const me = activePlayer(game);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 p-4">
      <GameHeader
        title={T.title}
        subtitle={T.tagline}
        rules={FLASH_POINT_RULES}
      >
        <button
          type="button"
          data-testid="fp-new"
          onClick={newGame}
          className="cursor-pointer rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {T.playAgain}
        </button>
        <Link
          href="/flash-point/online"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Online spielen
        </Link>
        <Link
          href="/flash-point/einstellungen"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {COLLECTION_TEXTS.settings}
        </Link>
        <Link
          href="/flash-point/statistik"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {COLLECTION_TEXTS.statistics}
        </Link>
      </GameHeader>

      {over && <FlashPointScores game={game} onNewGame={newGame} />}

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <span data-testid="fp-turn" className="font-semibold">
          {game.active === mySeat ? T.yourTurn : T.waitingFor(me.name)}
        </span>
        <span className="text-zinc-500 dark:text-zinc-400">
          {T.apLeft}: {me.ap}
        </span>
        <span className="text-zinc-500 dark:text-zinc-400">
          {T.rescued(game.rescued)} / {T.dead(game.dead)}
        </span>
        <span className="text-zinc-500 dark:text-zinc-400">
          {T.cubes(game.cubes, TOTAL_CUBES)}
        </span>
        {me.carrying && (
          <span className="rounded-full bg-emerald-200 px-2 py-0.5 text-xs font-bold text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100">
            {T.carrying}
          </span>
        )}
      </div>

      <FlashPointBoard game={game} mySeat={mySeat} onMove={play} />

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
