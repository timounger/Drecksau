/**
 * The screen you play Dog against the computer on.
 *
 * @module
 */
"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactElement } from "react";
import { GameHeader } from "@/components/game-header";
import { PlayArea } from "@/games/dog/components/dog-play";
import { partnerOf, teamOf, teamPlay } from "@/games/dog/engine/board";
import { seatOnTurn } from "@/games/dog/engine/moves";
import { useDogGame } from "@/games/dog/hooks/use-dog-game";
import { DOG_RULES } from "@/games/dog/i18n/rules";
import { DOG_TEXTS as T } from "@/games/dog/i18n/texts";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  subscribeSettings,
} from "@/games/dog/settings/settings-store";
import { COLLECTION_TEXTS } from "@/i18n/collection-texts";

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
export function DogScreen(): ReactElement {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getServerSettingsSnapshot,
  );
  const { game, mySeat, play, newGame } = useDogGame(settings);
  const waiting = seatOnTurn(game);
  const over = game.phase === "gameOver";
  const mine = game.players[mySeat]?.name ?? "Du";
  const teams = teamPlay(game.seats);
  const mate = game.players[partnerOf(mySeat, game.seats)]?.name ?? "?";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-4">
      <GameHeader title={T.title} subtitle={T.tagline} rules={DOG_RULES}>
        <button
          type="button"
          data-testid="dog-new-game"
          onClick={newGame}
          className="cursor-pointer rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {T.newGame}
        </button>
        <Link href="/dog/online" className={LINK}>
          {T.online}
        </Link>
        <Link href="/dog/einstellungen" className={LINK}>
          {COLLECTION_TEXTS.settings}
        </Link>
        <Link href="/dog/statistik" className={LINK}>
          {COLLECTION_TEXTS.statistics}
        </Link>
      </GameHeader>

      {over && (
        <section
          data-testid="dog-over"
          className="flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/40"
        >
          <h2 className="text-lg font-bold">
            {T.won(
              game.winners.length > 1
                ? T.teamOf(
                    game.players[game.winners[0] ?? 0]?.name ?? "?",
                    game.players[game.winners[1] ?? 0]?.name ?? "?",
                  )
                : (game.players[game.winners[0] ?? 0]?.name ?? "?"),
            )}
          </h2>
          <button
            type="button"
            onClick={newGame}
            className="ml-auto cursor-pointer rounded-lg bg-zinc-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {T.newGame}
          </button>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <span data-testid="dog-turn" className="font-semibold">
          {over
            ? T.gameOver
            : game.phase === "passing"
              ? T.passing
              : waiting === mySeat
                ? T.yourTurn
                : T.waitingFor(game.players[waiting ?? 0]?.name ?? "?")}
        </span>
        <span className="text-zinc-500 dark:text-zinc-400">
          {T.round(game.round, game.handSize)}
        </span>
        <span className="ml-auto text-zinc-500 dark:text-zinc-400">
          {teams
            ? `${T.team(teamOf(mySeat, game.seats) + 1)}: ${T.teamOf(mine, mate)}`
            : `${T.soloTable} - ${T.players(game.seats)}`}
        </span>
      </div>

      {!over && <PlayArea game={game} mySeat={mySeat} onMove={play} />}

      <section className="rounded-2xl border border-zinc-200 p-3 text-xs dark:border-zinc-800">
        <h2 className="mb-1 font-semibold">{T.log}</h2>
        <ul data-testid="dog-log" className="flex flex-col gap-0.5">
          {game.log.slice(-LOG_LINES).map((line, at) => (
            <li
              key={`${String(at)}-${line}`}
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
