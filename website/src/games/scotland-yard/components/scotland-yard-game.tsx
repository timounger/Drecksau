/**
 * The offline screen: you against the computer, as Mister X or as the
 * detectives.
 *
 * @module
 */
"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactElement } from "react";
import { GameHeader } from "@/components/game-header";
import {
  GameResultOverlay,
  type GameOutcome,
} from "@/components/game-result-overlay";
import { ScotlandYardTable } from "@/games/scotland-yard/components/scotland-yard-table";
import { ScotlandYardResult } from "@/games/scotland-yard/components/scotland-yard-result";
import { viewFor } from "@/games/scotland-yard/engine/view";
import { useScotlandYardGame } from "@/games/scotland-yard/hooks/use-scotland-yard-game";
import { SCOTLAND_YARD_RULES } from "@/games/scotland-yard/i18n/rules";
import {
  ROLE_NAMES,
  SCOTLAND_YARD_TEXTS as T,
  VARIANT_NAMES,
} from "@/games/scotland-yard/i18n/texts";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  subscribeSettings,
} from "@/games/scotland-yard/settings/settings-store";
import { COLLECTION_TEXTS } from "@/i18n/collection-texts";

/** The big word the end animation puts on the screen. */
const RESULT_WORDS: Readonly<Record<GameOutcome, string>> = {
  won: T.won,
  lost: T.lost,
};

/** The look of the header's link buttons. */
const LINK_BUTTON =
  "rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800";

/**
 * Renders a game against the computer.
 *
 * @returns the screen
 */
export function ScotlandYardGame(): ReactElement {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getServerSettingsSnapshot,
  );
  const { game, role, mine, play, newGame } = useScotlandYardGame(settings);
  const view = viewFor(game, mine[0] ?? null);
  const outcome: GameOutcome | null =
    game.phase !== "over" ? null : game.winner === role ? "won" : "lost";

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4">
      <GameHeader
        title={T.title}
        subtitle={T.tagline}
        rules={SCOTLAND_YARD_RULES}
      >
        <button
          type="button"
          data-testid="sy-new"
          onClick={newGame}
          className="cursor-pointer rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {T.newGame}
        </button>
        <Link href="/scotland-yard/online" className={LINK_BUTTON}>
          Online spielen
        </Link>
        <Link href="/scotland-yard/einstellungen" className={LINK_BUTTON}>
          {COLLECTION_TEXTS.settings}
        </Link>
        <Link href="/scotland-yard/statistik" className={LINK_BUTTON}>
          {COLLECTION_TEXTS.statistics}
        </Link>
      </GameHeader>

      <GameResultOverlay outcome={outcome} words={RESULT_WORDS} />

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {VARIANT_NAMES[game.variant]} · {T.you}:{" "}
        {role === "misterX" ? game.misterX.name : ROLE_NAMES.detectives} ·{" "}
        {game.players.length} Spieler
      </p>

      {game.phase === "over" && (
        <ScotlandYardResult game={game} onNewGame={newGame} />
      )}

      <ScotlandYardTable
        view={view}
        mine={mine}
        showHiding={settings.showHidingPlaces}
        onMove={play}
      />
    </div>
  );
}
