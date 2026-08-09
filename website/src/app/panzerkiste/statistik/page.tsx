/**
 * Panzerkiste statistics page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { StatsView } from "@/components/stats-view";
import { MissionStatsView } from "@/games/panzerkiste/components/mission-stats-view";
import { Leaderboard } from "@/games/panzerkiste/components/leaderboard";

export const metadata: Metadata = {
  title: "Panzerkiste - Statistik",
  description: "Gespielte Missionen, Erfolge und Spielzeiten von Panzerkiste.",
};

/**
 * Renders the Panzerkiste statistics page.
 *
 * @returns the page element
 */
export default function PanzerkisteStatistikPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <StatsView gameId="panzerkiste" />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pb-4">
        <MissionStatsView />
        {/* The board of everybody's furthest arena, under this browser's own
            numbers: the page is about how it is going, and that is both how it
            is going here and how it is going against everyone else. */}
        <Leaderboard />
      </div>
    </main>
  );
}
