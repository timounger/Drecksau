/**
 * The Mind's own page: what the game is, and the way into it.
 *
 * @module
 * @remarks
 * There is no game against the computer here, and that is a rule of the game
 * rather than a gap. The Mind is played by feeling out how long the others are
 * hesitating; a computer partner would either know every hand - and then it is
 * not a game - or wait a made-up number of seconds, which is the same thing
 * with extra steps. So this page explains the game and sends people online.
 */
import Link from "next/link";
import type { ReactElement } from "react";
import { GameHeader } from "@/components/game-header";
import { MIND_RULES } from "@/games/the-mind/i18n/rules";
import { MIND_TEXTS as T } from "@/games/the-mind/i18n/texts";

/**
 * Renders the landing page content.
 *
 * @returns the landing element
 */
export function MindLanding(): ReactElement {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4">
      <GameHeader rules={MIND_RULES} title={T.title} subtitle={T.tagline} />

      <section className="flex flex-col gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5 dark:border-indigo-900/50 dark:bg-indigo-950/20">
        <h2 className="text-sm font-semibold">{T.rulesTitle}</h2>
        <ol className="flex flex-col gap-2 text-sm text-zinc-700 dark:text-zinc-200">
          {T.rules.map((rule, index) => (
            <li key={rule} className="flex gap-2">
              <span className="font-semibold text-indigo-600 dark:text-indigo-300">
                {index + 1}.
              </span>
              <span>{rule}</span>
            </li>
          ))}
        </ol>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {T.needPlayers}
        </p>
      </section>

      <p className="text-sm text-zinc-600 dark:text-zinc-300">{T.onlineOnly}</p>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/the-mind/online"
          className="cursor-pointer rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          {T.playOnline}
        </Link>
        <Link
          href="/the-mind/statistik"
          className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {T.statistics}
        </Link>
      </div>
    </div>
  );
}
