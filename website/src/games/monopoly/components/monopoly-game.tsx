/**
 * The offline screen: you against the computer.
 *
 * @module
 * @remarks
 * The board takes the width and everything that is a **number** stands beside
 * it - who is where, what you own, what a trade would look like. In Monopoly
 * you look at the board to see what is happening and at the numbers to decide
 * what to do about it, and the two want different amounts of room.
 */
"use client";

import Link from "next/link";
import { useState, useSyncExternalStore, type ReactElement } from "react";
import { GameHeader } from "@/components/game-header";
import { MonopolyCentre } from "@/games/monopoly/components/monopoly-actions";
import { MonopolyBoard } from "@/games/monopoly/components/monopoly-board";
import {
  MonopolyEstate,
  MonopolyPlayers,
} from "@/games/monopoly/components/monopoly-panels";
import { MonopolyScores } from "@/games/monopoly/components/monopoly-scores";
import { MonopolyTrade } from "@/games/monopoly/components/monopoly-trade";
import { useMonopolyGame } from "@/games/monopoly/hooks/use-monopoly-game";
import { PHASE_NAMES } from "@/games/monopoly/i18n/phases";
import { MONOPOLY_RULES } from "@/games/monopoly/i18n/rules";
import { MONOPOLY_TEXTS as T } from "@/games/monopoly/i18n/texts";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  subscribeSettings,
} from "@/games/monopoly/settings/settings-store";
import { COLLECTION_TEXTS } from "@/i18n/collection-texts";

/** How many log lines are kept on screen. */
const LOG_LINES = 8;

/**
 * Renders a game against the computer.
 *
 * @returns the screen
 */
export function MonopolyGameScreen(): ReactElement {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getServerSettingsSnapshot,
  );
  const { game, mySeat, play, newGame } = useMonopolyGame(settings);
  const [picked, setPicked] = useState<number | null>(null);
  const over = game.phase === "gameOver";

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4">
      <GameHeader title={T.title} subtitle={T.tagline} rules={MONOPOLY_RULES}>
        <button
          type="button"
          data-testid="mo-new"
          onClick={newGame}
          className="cursor-pointer rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {T.playAgain}
        </button>
        <Link
          href="/monopoly/online"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Online spielen
        </Link>
        <Link
          href="/monopoly/einstellungen"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {COLLECTION_TEXTS.settings}
        </Link>
        <Link
          href="/monopoly/statistik"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {COLLECTION_TEXTS.statistics}
        </Link>
      </GameHeader>

      {over && (
        <MonopolyScores game={game} mySeat={mySeat} onNewGame={newGame} />
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <span data-testid="mo-turn" className="font-semibold">
          {over
            ? T.overNow
            : game.active === mySeat
              ? T.yourTurn
              : T.waitingFor(game.players[game.active].name)}
        </span>
        {!over && (
          <span
            data-testid="mo-phase"
            className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-semibold dark:bg-zinc-700"
          >
            {PHASE_NAMES[game.phase]}
          </span>
        )}
        <span className="text-zinc-500 dark:text-zinc-400">
          {T.cash(game.players[mySeat]?.cash ?? 0)}
        </span>
      </div>

      <div className="flex flex-col gap-4 xl:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <MonopolyBoard
            game={game}
            mySeat={mySeat}
            picked={picked}
            open={[]}
            onPick={setPicked}
          >
            <MonopolyCentre
              game={game}
              mySeat={over ? null : mySeat}
              onMove={play}
            />
          </MonopolyBoard>
        </div>
        <aside className="flex w-full flex-col gap-3 xl:w-96">
          {/* Your own deeds first, then everybody else's standing. What you
            own is what you act on - build, mortgage, offer - and the standings
            are only there to be read. A panel you press buttons in should not
            sit below one you never touch. */}
          {!over && (
            <MonopolyEstate game={game} mySeat={mySeat} onMove={play} />
          )}
          <MonopolyPlayers game={game} mySeat={mySeat} />
          {!over && <MonopolyTrade game={game} mySeat={mySeat} onMove={play} />}
        </aside>
      </div>

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
