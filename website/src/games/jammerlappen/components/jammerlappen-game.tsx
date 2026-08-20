/**
 * Jammerlappen against the computer: the pot, every row and the log.
 *
 * @module
 * @remarks
 * This is the game's front page - opening `/jammerlappen` deals a round at
 * once, the way the other single-player games do.
 */
"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactElement } from "react";
import { GameHeader } from "@/components/game-header";
import { useJammerlappenGame } from "@/games/jammerlappen/hooks/use-jammerlappen-game";
import { JAMMER_RULES } from "@/games/jammerlappen/i18n/rules";
import { JAMMER_TEXTS as T } from "@/games/jammerlappen/i18n/texts";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  subscribeSettings,
} from "@/games/jammerlappen/settings/settings-store";
import { JammerlappenScores } from "./jammerlappen-scores";
import { JammerlappenTable } from "./jammerlappen-table";

/** How many log lines are kept on screen. */
const LOG_LINES = 8;

/**
 * Renders the whole single-player screen.
 *
 * @returns the game element
 */
export function JammerlappenGame(): ReactElement {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getServerSettingsSnapshot,
  );
  const { game, mySeat, play, newGame } = useJammerlappenGame(settings);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-4">
      <GameHeader rules={JAMMER_RULES} title={T.title} subtitle={T.tagline}>
        <button
          type="button"
          onClick={newGame}
          className="cursor-pointer rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {T.newGame}
        </button>
        <NavLink href="/jammerlappen/online">{T.playOnline}</NavLink>
        <NavLink href="/jammerlappen/einstellungen">{T.settings}</NavLink>
        <NavLink href="/jammerlappen/statistik">{T.statistics}</NavLink>
      </GameHeader>

      {game.phase === "gameOver" && (
        <JammerlappenScores game={game} mySeat={mySeat} onNewGame={newGame} />
      )}

      <JammerlappenTable game={game} mySeat={mySeat} onMove={play} />

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
