/**
 * The offline screen: you against the computer.
 *
 * @module
 * @remarks
 * The layout follows what a turn actually needs: the map takes the width, and
 * everything that is a *number* - the standings, the hand, the last roll -
 * stands beside it, because in Risk you look at the map to decide and at the
 * numbers to check.
 */
"use client";

import Link from "next/link";
import { useState, useSyncExternalStore, type ReactElement } from "react";
import { GameHeader } from "@/components/game-header";
import { RisikoBoard } from "@/games/risiko/components/risiko-board";
import {
  RisikoBattle,
  RisikoCards,
  RisikoStandings,
} from "@/games/risiko/components/risiko-panels";
import { RisikoScores } from "@/games/risiko/components/risiko-scores";
import { incomeOf } from "@/games/risiko/engine/state";
import { useRisikoGame } from "@/games/risiko/hooks/use-risiko-game";
import { RISIKO_RULES } from "@/games/risiko/i18n/rules";
import { RISIKO_TEXTS as T } from "@/games/risiko/i18n/texts";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  subscribeSettings,
} from "@/games/risiko/settings/settings-store";
import { COLLECTION_TEXTS } from "@/i18n/collection-texts";
import { PHASE_NAMES } from "@/games/risiko/i18n/phases";

/** How many log lines are kept on screen. */
const LOG_LINES = 7;

/**
 * Renders a game against the computer.
 *
 * @returns the screen
 */
export function RisikoGameScreen(): ReactElement {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getServerSettingsSnapshot,
  );
  const { game, mySeat, play, newGame } = useRisikoGame(settings);
  const [picked, setPicked] = useState<readonly string[]>([]);
  const over = game.phase === "gameOver";
  const onTurn = game.players[game.active];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4">
      <GameHeader title={T.title} subtitle={T.tagline} rules={RISIKO_RULES}>
        <button
          type="button"
          data-testid="rk-new"
          onClick={newGame}
          className="cursor-pointer rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {T.playAgain}
        </button>
        <Link
          href="/risiko/online"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Online spielen
        </Link>
        <Link
          href="/risiko/einstellungen"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {COLLECTION_TEXTS.settings}
        </Link>
        <Link
          href="/risiko/statistik"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {COLLECTION_TEXTS.statistics}
        </Link>
      </GameHeader>

      {over && <RisikoScores game={game} mySeat={mySeat} onNewGame={newGame} />}

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <span data-testid="rk-turn" className="font-semibold">
          {over
            ? T.overNow
            : game.active === mySeat
              ? T.yourTurn
              : T.waitingFor(onTurn.name)}
        </span>
        {!over && (
          <span
            data-testid="rk-phase"
            className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-semibold dark:bg-zinc-700"
          >
            {PHASE_NAMES[game.phase]}
          </span>
        )}
        {game.phase === "reinforce" && (
          <span className="text-zinc-500 dark:text-zinc-400">
            {T.income(incomeOf(game, game.active))}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4 xl:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <RisikoBoard
            game={game}
            mySeat={over ? null : mySeat}
            onMove={play}
          />
          <RisikoBattle game={game} mySeat={mySeat} />
        </div>
        <aside className="flex w-full flex-col gap-3 xl:w-80">
          <RisikoStandings game={game} mySeat={mySeat} />
          <RisikoCards
            game={game}
            mySeat={mySeat}
            picked={picked}
            onPick={(card) =>
              setPicked((all) =>
                all.includes(card)
                  ? all.filter((each) => each !== card)
                  : [...all, card],
              )
            }
            onTrade={(cards) => {
              setPicked([]);
              play({ kind: "trade", cards });
            }}
          />
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
