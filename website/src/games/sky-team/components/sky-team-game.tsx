/**
 * The offline screen: one seat yours, the other the computer's.
 *
 * @module
 * @remarks
 * Sky Team is a game about two people who may not speak reading each other's
 * placements. A computer partner can be given the second seat and the same
 * blindness - it is never handed your dice - but it cannot be given the thing
 * the game is actually made of, which is somebody trying to work out what you
 * meant. This mode is practice; the game is upstairs, under **Online spielen**.
 */
"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactElement } from "react";
import { GameHeader } from "@/components/game-header";
import { SkyTeamCockpit } from "@/games/sky-team/components/sky-team-cockpit";
import { SkyTeamScores } from "@/games/sky-team/components/sky-team-scores";
import { useSkyTeamGame } from "@/games/sky-team/hooks/use-sky-team-game";
import { SKY_TEAM_RULES } from "@/games/sky-team/i18n/rules";
import { SKY_TEAM_TEXTS as T } from "@/games/sky-team/i18n/texts";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  subscribeSettings,
} from "@/games/sky-team/settings/settings-store";
import { COLLECTION_TEXTS } from "@/i18n/collection-texts";

/** How many log lines are kept on screen. */
const LOG_LINES = 10;

/**
 * Renders a landing against the computer.
 *
 * @returns the screen
 */
export function SkyTeamGame(): ReactElement {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getServerSettingsSnapshot,
  );
  const { game, mySeat, play, newGame } = useSkyTeamGame(settings);
  const over = game.stage === "won" || game.stage === "lost";
  const waiting = game.stage === "roundEnd";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 p-4">
      <GameHeader title={T.title} subtitle={T.tagline} rules={SKY_TEAM_RULES}>
        <button
          type="button"
          data-testid="sky-new"
          onClick={newGame}
          className="cursor-pointer rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {T.playAgain}
        </button>
        <Link
          href="/sky-team/online"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Online spielen
        </Link>
        <Link
          href="/sky-team/einstellungen"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {COLLECTION_TEXTS.settings}
        </Link>
        <Link
          href="/sky-team/statistik"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {COLLECTION_TEXTS.statistics}
        </Link>
      </GameHeader>

      {over && <SkyTeamScores game={game} onNewGame={newGame} />}

      {!over && (
        <p data-testid="sky-turn" className="text-sm font-semibold">
          {game.active === mySeat || waiting
            ? T.yourTurn
            : T.waitingFor(game.players[game.active].name)}
        </p>
      )}

      {waiting && (
        <button
          type="button"
          data-testid="sky-next"
          onClick={() => play({ kind: "next" })}
          className="cursor-pointer self-start rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          {T.nextRound}
        </button>
      )}

      <SkyTeamCockpit game={game} mySeat={mySeat} onMove={play} />

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
