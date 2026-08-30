/**
 * The screen you play Arschloch against the computer on.
 *
 * @module
 */
"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactElement } from "react";
import { RulesButton } from "@/components/rules-button";
import { seatOnTurn } from "@/games/arschloch/engine/moves";
import { useArschlochGame } from "@/games/arschloch/hooks/use-arschloch-game";
import { ARSCHLOCH_RULES } from "@/games/arschloch/i18n/rules";
import { ARSCHLOCH_TEXTS as T } from "@/games/arschloch/i18n/texts";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  subscribeSettings,
} from "@/games/arschloch/settings/settings-store";
import { PlayArea } from "./arschloch-play";
import { ArschlochScores } from "./arschloch-scores";

/** How many log lines the screen shows. */
const LOG_LINES = 6;

/** The look of a link in the header. */
const LINK =
  "rounded-lg border border-zinc-300 px-3 py-1.5 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800";

/**
 * Renders the game against the computer.
 *
 * @returns the screen element
 */
export function ArschlochScreen(): ReactElement {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getServerSettingsSnapshot,
  );
  const { game, mySeat, play, newGame } = useArschlochGame(settings);
  const waiting = seatOnTurn(game);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-3 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{T.title}</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {T.tagline}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-sm">
          <RulesButton rules={ARSCHLOCH_RULES} />
          <Link href="/arschloch/einstellungen" className={LINK}>
            {T.settings}
          </Link>
          <Link href="/arschloch/statistik" className={LINK}>
            {T.stats}
          </Link>
          <Link href="/arschloch/online" className={LINK}>
            {T.online}
          </Link>
          <button
            type="button"
            onClick={newGame}
            data-testid="ar-new-game"
            className="cursor-pointer rounded-lg bg-indigo-600 px-3 py-1.5 font-semibold text-white hover:bg-indigo-700"
          >
            {T.newGame}
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span data-testid="ar-turn" className="font-semibold">
          {game.phase === "gameOver"
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

      {game.phase === "gameOver" ? (
        <ArschlochScores game={game} onNewGame={newGame} />
      ) : (
        <PlayArea game={game} mySeat={mySeat} onMove={play} />
      )}

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

      <Link href="/" className="text-xs text-zinc-500 dark:text-zinc-400">
        {T.back}
      </Link>
    </div>
  );
}
