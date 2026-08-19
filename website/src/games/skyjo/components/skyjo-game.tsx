/**
 * Skyjo against the computer: the table, the result panel and the game log.
 *
 * @module
 * @remarks
 * This is the game's front page - opening `/skyjo` deals a game at once, the
 * way the other single-player games do. Table size and how hard the opponents
 * play live in the settings, not here.
 */
"use client";

import Link from "next/link";
import { GameHeader } from "@/components/game-header";
import { SKYJO_RULES } from "@/games/skyjo/i18n/rules";
import { useSyncExternalStore, type ReactElement } from "react";
import { useSkyjoGame } from "@/games/skyjo/hooks/use-skyjo-game";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  subscribeSettings,
} from "@/games/skyjo/settings/settings-store";
import { DIFFICULTY_LABELS, SKYJO_TEXTS as T } from "@/games/skyjo/i18n/texts";
import { SkyjoScores } from "./skyjo-scores";
import { SkyjoTable } from "./skyjo-table";

/** How many log lines are kept on screen. */
const LOG_LINES = 8;

/**
 * Renders the whole single-player screen.
 *
 * @returns the game element
 */
export function SkyjoGame(): ReactElement {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getServerSettingsSnapshot,
  );
  const { game, mySeat, busy, play, newGame } = useSkyjoGame(settings);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 p-4">
      <GameHeader
        rules={SKYJO_RULES}
        title={T.title}
        subtitle={`${T.round(game.round)} · ${DIFFICULTY_LABELS[settings.difficulty]}`}
      >
        <button
          type="button"
          onClick={newGame}
          className="cursor-pointer rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {T.newGame}
        </button>
        <NavLink href="/skyjo/online">{T.playOnline}</NavLink>
        <NavLink href="/skyjo/einstellungen">{T.settings}</NavLink>
        <NavLink href="/skyjo/statistik">{T.statistics}</NavLink>
      </GameHeader>

      {(game.phase === "roundOver" || game.phase === "gameOver") && (
        <SkyjoScores
          game={game}
          onNext={
            game.phase === "roundOver"
              ? () => play({ kind: "nextRound" })
              : null
          }
          onNewGame={game.phase === "gameOver" ? newGame : null}
        />
      )}

      <SkyjoTable game={game} mySeat={mySeat} onMove={play} busy={busy} />

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
