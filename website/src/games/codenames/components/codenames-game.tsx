/**
 * Codenames against the computer: the board, the clue and the log.
 *
 * @module
 * @remarks
 * This is the game's front page - opening `/codenames` lays out a board at
 * once, the way the other single-player games do. There is no settings page,
 * because there is nothing to set: the table is you and three machines.
 */
"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { GameHeader } from "@/components/game-header";
import { useCodenamesGame } from "@/games/codenames/hooks/use-codenames-game";
import { CN_RULES } from "@/games/codenames/i18n/rules";
import { CN_TEXTS as T } from "@/games/codenames/i18n/texts";
import { CodenamesScores } from "./codenames-scores";
import { CodenamesTable } from "./codenames-table";

/** How many log lines are kept on screen. */
const LOG_LINES = 8;

/**
 * Renders the whole single-player screen.
 *
 * @returns the game element
 */
export function CodenamesGame(): ReactElement {
  const { game, mySeat, play, newGame } = useCodenamesGame();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 p-4">
      <GameHeader rules={CN_RULES} title={T.title} subtitle={T.tagline}>
        <button
          type="button"
          onClick={newGame}
          className="cursor-pointer rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {T.newGame}
        </button>
        <NavLink href="/codenames/online">{T.playOnline}</NavLink>
        <NavLink href="/codenames/statistik">{T.statistics}</NavLink>
      </GameHeader>

      {game.phase === "gameOver" && (
        <CodenamesScores game={game} mySeat={mySeat} onNewGame={newGame} />
      )}

      <CodenamesTable game={game} mySeat={mySeat} onMove={play} />

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
