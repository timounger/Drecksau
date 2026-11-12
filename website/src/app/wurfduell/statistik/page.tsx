/**
 * Wurfduell statistics page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { StatsView } from "@/components/stats-view";
import { DuelStatsView } from "@/games/wurfduell/components/duel-stats-view";

export const metadata: Metadata = {
  title: "Wurfduell - Statistik",
  description: "Partien, Siege, Treffer-Quote und Lieblingsfigur im Wurfduell.",
};

/**
 * Renders the Wurfduell statistics page.
 *
 * @returns the page element
 */
export default function WurfduellStatistikPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <StatsView gameId="wurfduell" />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pb-4">
        <DuelStatsView />
      </div>
    </main>
  );
}
