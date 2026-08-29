/**
 * The offline screen: you against the computer.
 *
 * @module
 * @remarks
 * The island takes the width, because everything you decide in Catan you decide
 * by looking at the board - which numbers you touch, where a road can still go,
 * where the robber is standing. Beside it stands everything that is a *count*:
 * your cards, your development cards, and what everybody else is showing. The
 * bar between the two is the turn itself.
 */
"use client";

import Link from "next/link";
import { useState, useSyncExternalStore, type ReactElement } from "react";
import { GameHeader } from "@/components/game-header";
import { CatanActions } from "@/games/catan/components/catan-actions";
import { CatanBoard } from "@/games/catan/components/catan-board";
import {
  CatanCards,
  CatanHand,
  CatanStandings,
} from "@/games/catan/components/catan-panels";
import { CatanHaul } from "@/games/catan/components/catan-handel";
import { CatanFind } from "@/games/catan/components/catan-entdecker";
import { CatanSea } from "@/games/catan/components/catan-seefahrer";
import { CatanRaid } from "@/games/catan/components/catan-barbaren";
import { CatanGold } from "@/games/catan/components/catan-fluesse";
import { CatanVote } from "@/games/catan/components/catan-tross";
import {
  CatanBarbarians,
  CatanFish,
  CatanProgress,
  CatanTableau,
} from "@/games/catan/components/catan-ritter";
import { CatanScores } from "@/games/catan/components/catan-scores";
import { CatanTrade } from "@/games/catan/components/catan-trade";
import { actingSeat } from "@/games/catan/engine/state";
import { useCatanGame } from "@/games/catan/hooks/use-catan-game";
import { useForcedMove } from "@/games/catan/hooks/use-forced-move";
import { PHASE_NAMES } from "@/games/catan/i18n/phases";
import { CATAN_RULES } from "@/games/catan/i18n/rules";
import { CATAN_TEXTS as T } from "@/games/catan/i18n/texts";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  subscribeSettings,
} from "@/games/catan/settings/settings-store";
import { COLLECTION_TEXTS } from "@/i18n/collection-texts";

/** How many log lines are kept on screen. */
const LOG_LINES = 7;

/**
 * Renders a game against the computer.
 *
 * @returns the screen
 */
export function CatanGameScreen(): ReactElement {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getServerSettingsSnapshot,
  );
  const { game, mySeat, play, newGame } = useCatanGame(settings);
  useForcedMove(game, mySeat, play);
  // CATAN für Zwei: which neutral colour the free piece goes in. Screen state
  // rather than game state - it is a half-made choice, and nobody else's
  // business until the piece is actually down.
  const [neutralColour, setNeutralColour] = useState<number | null>(null);
  // Städte & Ritter: which knight is being sent somewhere. Screen state, like
  // the neutral colour - a half-made move nobody else needs to know about.
  const [marching, setMarching] = useState<number | null>(null);
  const [riding, setRiding] = useState<number | null>(null);
  const [sailingShip, setSailing] = useState<number | null>(null);
  const over = game.phase === "gameOver";
  const onTurn = game.players[actingSeat(game)];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4">
      <GameHeader title={T.title} subtitle={T.tagline} rules={CATAN_RULES}>
        <button
          type="button"
          data-testid="ct-new"
          onClick={newGame}
          className="cursor-pointer rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {T.playAgain}
        </button>
        <Link
          href="/catan/online"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {T.online}
        </Link>
        <Link
          href="/catan/einstellungen"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {COLLECTION_TEXTS.settings}
        </Link>
        <Link
          href="/catan/statistik"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {COLLECTION_TEXTS.statistics}
        </Link>
      </GameHeader>

      {over && <CatanScores game={game} mySeat={mySeat} onNewGame={newGame} />}

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <span data-testid="ct-turn" className="font-semibold">
          {over
            ? T.overNow
            : actingSeat(game) === mySeat
              ? T.yourTurn
              : T.waitingFor(onTurn.name)}
        </span>
        {!over && (
          <span
            data-testid="ct-phase"
            className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-semibold dark:bg-zinc-700"
          >
            {PHASE_NAMES[game.phase]}
          </span>
        )}
        <span className="ml-auto text-xs opacity-60">
          {T.target}: {game.target}
        </span>
      </div>

      <div className="flex flex-col gap-4 xl:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <CatanBoard
            game={game}
            mySeat={over ? null : mySeat}
            onMove={play}
            neutralColour={neutralColour}
            marching={marching}
            riding={riding}
            onRide={setRiding}
            sailingShip={sailingShip}
            onSail={setSailing}
          />
          <CatanActions
            game={game}
            mySeat={mySeat}
            onMove={play}
            neutralColour={neutralColour}
            onNeutralColour={setNeutralColour}
            marching={marching}
            onMarch={setMarching}
            riding={riding}
          />
        </div>
        <aside className="flex w-full flex-col gap-3 xl:w-80">
          <CatanStandings game={game} mySeat={mySeat} />
          <CatanHand game={game} mySeat={mySeat} />
          <CatanFish game={game} mySeat={mySeat} onMove={play} />
          <CatanVote game={game} mySeat={mySeat} onMove={play} />
          <CatanSea
            game={game}
            mySeat={mySeat}
            sailingShip={sailingShip}
            onMove={play}
          />
          <CatanFind game={game} mySeat={mySeat} />
          <CatanRaid game={game} mySeat={mySeat} />
          <CatanHaul game={game} mySeat={mySeat} onMove={play} />
          <CatanGold game={game} mySeat={mySeat} onMove={play} />
          <CatanBarbarians game={game} />
          <CatanTableau game={game} mySeat={mySeat} onMove={play} />
          <CatanProgress game={game} mySeat={mySeat} onMove={play} />
          <CatanTrade game={game} mySeat={mySeat} onMove={play} />
          <CatanCards game={game} mySeat={mySeat} onMove={play} />
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
