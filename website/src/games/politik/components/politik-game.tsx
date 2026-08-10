/**
 * "Das politische Talent" against the computer: the board, the panel and the log.
 *
 * @module
 * @remarks
 * This is the game's front page - opening `/politik` deals a game at once, the
 * way the other single-player games do. How many parties sit at the table lives
 * in the settings, not here.
 */
"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactElement } from "react";
import { GameHeader } from "@/components/game-header";
import { THEME_ICONS, THEME_LABELS } from "@/games/politik/engine/cards";
import {
  CYCLES,
  ROUNDS_PER_CYCLE,
  type PolitikGame as PolitikGameState,
} from "@/games/politik/engine/state";
import { usePolitikGame } from "@/games/politik/hooks/use-politik-game";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  subscribeSettings,
} from "@/games/politik/settings/settings-store";
import { POLITIK_TEXTS as T } from "@/games/politik/i18n/texts";
import { PolitikBoard } from "./politik-board";
import { PolitikPanel } from "./politik-actions";
import { PolitikScores } from "./politik-scores";

/** How many log lines are kept on screen. */
const LOG_LINES = 10;

/**
 * Renders the whole single-player screen.
 *
 * @returns the game element
 */
export function PolitikGame(): ReactElement {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getServerSettingsSnapshot,
  );
  const { game, mySeat, busy, play, newGame } = usePolitikGame(settings);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-4">
      <GameHeader title={T.title} subtitle={<Subtitle game={game} />}>
        <button
          type="button"
          onClick={newGame}
          className="cursor-pointer rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {T.newGame}
        </button>
        <NavLink href="/politik/online">{T.playOnline}</NavLink>
        <NavLink href="/politik/einstellungen">{T.settings}</NavLink>
        <NavLink href="/politik/statistik">{T.statistics}</NavLink>
      </GameHeader>

      {game.phase === "gameOver" && (
        <PolitikScores game={game} onNewGame={newGame} />
      )}

      <PolitikPanel game={game} mySeat={mySeat} onMove={play} busy={busy} />

      <PolitikBoard game={game} mySeat={mySeat} />

      <section className="rounded-2xl border border-zinc-200 p-3 text-xs dark:border-zinc-800">
        <h2 className="mb-1 font-semibold">{T.log}</h2>
        <ol className="flex flex-col gap-0.5 text-zinc-600 dark:text-zinc-300">
          {game.log.slice(-LOG_LINES).map((line, index) => (
            <li key={`${index}-${line}`}>{line}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}

/** Where the game stands: which cycle, which phase, which theme. */
function Subtitle({ game }: { readonly game: PolitikGameState }): ReactElement {
  const phases = {
    candidate: T.phaseCandidate,
    campaign: game.cycle > CYCLES ? T.finalCampaign : T.phaseCampaign,
    coalition: T.phaseCoalition,
    ballot: T.phaseBallot,
    action: T.roundOf(game.round, ROUNDS_PER_CYCLE),
    gameOver: T.phaseGameOver,
  };
  return (
    <>
      {T.cycleRound(game.cycle, CYCLES)} · {phases[game.phase]} ·{" "}
      {T.currentTheme}: {THEME_ICONS[game.theme]} {THEME_LABELS[game.theme]}
    </>
  );
}

/** A link in the game's header bar. */
function NavLink({
  href,
  children,
}: {
  readonly href: string;
  readonly children: string;
}): ReactElement {
  return (
    <Link
      href={href}
      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
    >
      {children}
    </Link>
  );
}
