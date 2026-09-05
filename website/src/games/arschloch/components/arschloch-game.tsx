/**
 * The screen you play Arschloch against the computer on.
 *
 * @module
 */
"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactElement } from "react";
import { GameHeader } from "@/components/game-header";
import { seatOnTurn } from "@/games/arschloch/engine/moves";
import { useArschlochGame } from "@/games/arschloch/hooks/use-arschloch-game";
import { ARSCHLOCH_RULES } from "@/games/arschloch/i18n/rules";
import { ARSCHLOCH_TEXTS as T } from "@/games/arschloch/i18n/texts";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  subscribeSettings,
} from "@/games/arschloch/settings/settings-store";
import { COLLECTION_TEXTS } from "@/i18n/collection-texts";
import { PlayArea } from "./arschloch-play";
import { ArschlochScores } from "./arschloch-scores";

/** How many log lines are kept on screen. */
const LOG_LINES = 8;

/** The look of a link beside the game's own buttons. */
const LINK =
  "rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800";

/**
 * Renders a game against the computer.
 *
 * @returns the screen
 */
export function ArschlochScreen(): ReactElement {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getServerSettingsSnapshot,
  );
  const { game, mySeat, play, newGame } = useArschlochGame(settings);
  const waiting = seatOnTurn(game);
  const over = game.phase === "gameOver";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 p-4">
      <GameHeader title={T.title} subtitle={T.tagline} rules={ARSCHLOCH_RULES}>
        <button
          type="button"
          data-testid="ar-new-game"
          onClick={newGame}
          className="cursor-pointer rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {T.newGame}
        </button>
        <Link href="/arschloch/online" className={LINK}>
          {T.online}
        </Link>
        <Link href="/arschloch/einstellungen" className={LINK}>
          {COLLECTION_TEXTS.settings}
        </Link>
        <Link href="/arschloch/statistik" className={LINK}>
          {COLLECTION_TEXTS.statistics}
        </Link>
      </GameHeader>

      {over && <ArschlochScores game={game} onNewGame={newGame} />}

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <span data-testid="ar-turn" className="font-semibold">
          {over
            ? T.gameOver
            : game.phase === "roundOver"
              ? T.roundOver
              : waiting === mySeat
                ? T.yourTurn
                : T.waitingFor(game.players[waiting ?? 0].name)}
        </span>
        <span className="text-zinc-500 dark:text-zinc-400">
          {T.round(game.round, game.rounds)}
        </span>
      </div>

      {!over && <PlayArea game={game} mySeat={mySeat} onMove={play} />}

      <section className="rounded-2xl border border-zinc-200 p-3 text-xs dark:border-zinc-800">
        <h2 className="mb-1 font-semibold">{T.log}</h2>
        <ul data-testid="ar-log" className="flex flex-col gap-0.5">
          {game.log.slice(-LOG_LINES).map((line, at) => (
            <li
              key={`${at}-${line}`}
              className="text-zinc-600 dark:text-zinc-400"
            >
              {line}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
