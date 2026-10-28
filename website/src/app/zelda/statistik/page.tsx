/**
 * The Zelda statistics page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { StatsView } from "@/components/stats-view";
import { AdventureStatsView } from "@/games/zelda/components/adventure-stats-view";

export const metadata: Metadata = {
  title: "Zelda - Statistik",
  description:
    "Besiegte Monster, gesammelte Rubine, Ohnmachten und Spielzeit von Zelda.",
};

/**
 * Renders the statistics page.
 *
 * @returns the page
 */
export default function ZeldaStatistikPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <div>
        <StatsView gameId="zelda" />
      </div>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pb-4">
        <AdventureStatsView />
      </div>
    </main>
  );
}
