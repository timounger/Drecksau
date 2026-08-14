/**
 * The Mind with computer partners: the table, the panels and the log.
 *
 * @module
 * @remarks
 * This is the game's front page - opening `/the-mind` deals a game at once, the
 * way the other single-player games do.
 */
"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactElement } from "react";
import { GameHeader } from "@/components/game-header";
import { useMindGame } from "@/games/the-mind/hooks/use-the-mind-game";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  subscribeSettings,
} from "@/games/the-mind/settings/settings-store";
import { MIND_TEXTS as T } from "@/games/the-mind/i18n/texts";
import { MindLevelPanel, MindScores } from "./the-mind-scores";
import { MindTable } from "./the-mind-table";

/** How many log lines are kept on screen. */
const LOG_LINES = 8;

/**
 * Renders the whole single-player screen.
 *
 * @returns the game element
 */
export function TheMindGame(): ReactElement {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getServerSettingsSnapshot,
  );
  const { game, mySeat, play, newGame } = useMindGame(settings);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 p-4">
      <GameHeader title={T.title} subtitle={T.level(game.level, game.levels)}>
        <button
          type="button"
          onClick={newGame}
          className="cursor-pointer rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {T.newGame}
        </button>
        <NavLink href="/the-mind/online">{T.playOnline}</NavLink>
        <NavLink href="/the-mind/einstellungen">{T.settings}</NavLink>
        <NavLink href="/the-mind/statistik">{T.statistics}</NavLink>
      </GameHeader>

      {game.phase === "gameOver" && (
        <MindScores game={game} onNewGame={newGame} />
      )}
      {game.phase === "levelOver" && (
        <MindLevelPanel game={game} onMove={play} />
      )}

      <MindTable game={game} mySeat={mySeat} onMove={play} />

      <section className="rounded-2xl border border-zinc-200 p-3 text-xs dark:border-zinc-800">
        <h2 className="mb-1 font-semibold">{T.log}</h2>
        <ol className="flex flex-col gap-0.5 text-zinc-600 dark:text-zinc-300">
          {game.log.slice(-LOG_LINES).map((line, index) => (
            <li key={`${index}-${line}`}>{line}</li>
          ))}
        </ol>
      </section>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        <strong>{T.silenceTitle}:</strong> {T.silenceHint}
      </p>
    </div>
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
