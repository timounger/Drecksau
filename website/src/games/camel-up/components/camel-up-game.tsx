/**
 * Camel Up against the computer: the track, the panel and the log.
 *
 * @module
 * @remarks
 * This is the game's front page - opening `/camel-up` deals a race at once, the
 * way the other single-player games do. How many players sit at the table lives
 * in the settings, not here.
 */
"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactElement } from "react";
import { GameHeader } from "@/components/game-header";
import { CAMEL_UP_RULES } from "@/games/camel-up/i18n/rules";
import { useCamelUpGame } from "@/games/camel-up/hooks/use-camel-up-game";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  subscribeSettings,
} from "@/games/camel-up/settings/settings-store";
import { CAMEL_TEXTS as T } from "@/games/camel-up/i18n/texts";
import { CamelUpPanel } from "./camel-up-actions";
import { CamelUpScores } from "./camel-up-scores";
import { CamelUpTrack } from "./camel-up-track";

/** How many log lines are kept on screen. */
const LOG_LINES = 10;

/**
 * Renders the whole single-player screen.
 *
 * @returns the game element
 */
export function CamelUpGame(): ReactElement {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getServerSettingsSnapshot,
  );
  const { game, mySeat, busy, play, newGame } = useCamelUpGame(settings);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-4">
      <GameHeader
        rules={CAMEL_UP_RULES}
        title={T.title}
        subtitle={`${T.leg(game.leg)} · ${T.diceLeft(game.dice.length)}`}
      >
        <button
          type="button"
          onClick={newGame}
          className="cursor-pointer rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {T.newGame}
        </button>
        <NavLink href="/camel-up/online">{T.playOnline}</NavLink>
        <NavLink href="/camel-up/einstellungen">{T.settings}</NavLink>
        <NavLink href="/camel-up/statistik">{T.statistics}</NavLink>
      </GameHeader>

      {game.phase === "gameOver" && (
        <CamelUpScores game={game} onNewGame={newGame} />
      )}

      <CamelUpPanel game={game} mySeat={mySeat} onMove={play} busy={busy} />

      <CamelUpTrack game={game} mySeat={mySeat} />

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
