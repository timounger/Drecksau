/**
 * Kuhle Kühe against the computer: the dice, every sheet and the log.
 *
 * @module
 * @remarks
 * This is the game's front page - opening `/kuhle-kuehe` deals a game at once, the
 * way the other single-player games do.
 */
"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactElement } from "react";
import { GameHeader } from "@/components/game-header";
import { KUHLE_RULES } from "@/games/kuhle-kuehe/i18n/rules";
import { useKuhleKueheGame } from "@/games/kuhle-kuehe/hooks/use-kuhle-kuehe-game";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  subscribeSettings,
} from "@/games/kuhle-kuehe/settings/settings-store";
import { KUHLE_TEXTS as T } from "@/games/kuhle-kuehe/i18n/texts";
import { KuhleKueheScores } from "./kuhle-kuehe-scores";
import { KuhleKueheTable } from "./kuhle-kuehe-table";

/** How many log lines are kept on screen. */
const LOG_LINES = 8;

/**
 * Renders the whole single-player screen.
 *
 * @returns the game element
 */
export function KuhleKueheGame(): ReactElement {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getServerSettingsSnapshot,
  );
  const { game, mySeat, play, newGame } = useKuhleKueheGame(settings);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-4">
      <GameHeader rules={KUHLE_RULES} title={T.title} subtitle={T.tagline}>
        <button
          type="button"
          onClick={newGame}
          className="cursor-pointer rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {T.newGame}
        </button>
        <NavLink href="/kuhle-kuehe/online">{T.playOnline}</NavLink>
        <NavLink href="/kuhle-kuehe/einstellungen">{T.settings}</NavLink>
        <NavLink href="/kuhle-kuehe/statistik">{T.statistics}</NavLink>
      </GameHeader>

      {game.phase === "gameOver" && (
        <KuhleKueheScores game={game} onNewGame={newGame} />
      )}

      <KuhleKueheTable game={game} mySeat={mySeat} onMove={play} />

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
