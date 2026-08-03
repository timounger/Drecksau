/**
 * The Krakel Orakel start page: a short how-to and the way into the online game.
 *
 * @module
 * @remarks
 * Krakel Orakel is played with others, so its own page is a landing that
 * explains the game and sends players into the online mode or the statistics.
 */
import Link from "next/link";
import { GameHeader } from "@/components/game-header";
import type { ReactElement } from "react";
import { KRAKEL_TEXTS } from "@/games/krakel/i18n/texts";

/**
 * Renders the landing page content.
 *
 * @returns the landing element
 */
export function KrakelLanding(): ReactElement {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4">
      <GameHeader title={KRAKEL_TEXTS.title} subtitle={KRAKEL_TEXTS.subtitle} />

      <section className="flex flex-col gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5 dark:border-indigo-900/50 dark:bg-indigo-950/20">
        <h2 className="text-sm font-semibold">{KRAKEL_TEXTS.rulesTitle}</h2>
        <ol className="flex flex-col gap-2 text-sm text-zinc-700 dark:text-zinc-200">
          {KRAKEL_TEXTS.rules.map((rule, index) => (
            <li key={rule} className="flex gap-2">
              <span className="font-semibold text-indigo-600 dark:text-indigo-300">
                {index + 1}.
              </span>
              <span>{rule}</span>
            </li>
          ))}
        </ol>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {KRAKEL_TEXTS.needPlayers}
        </p>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/krakel/online"
          className="cursor-pointer rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          {KRAKEL_TEXTS.playOnline}
        </Link>
        <Link
          href="/krakel/statistik"
          className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {KRAKEL_TEXTS.statistics}
        </Link>
      </div>
    </div>
  );
}
