/**
 * "RV There Yet?" statistics page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { StatsView } from "@/components/stats-view";
import { Leaderboard } from "@/games/rv-there-yet/components/leaderboard";

export const metadata: Metadata = {
  title: "RV There Yet? - Statistik",
  description: "Gefahrene Strecken und Erfolge von RV There Yet?.",
};

/**
 * Renders the "RV There Yet?" statistics page.
 *
 * @returns the page element
 */
export default function RvThereYetStatistikPage(): ReactElement {
  return (
    // Not a stretching column: the statistics card grows to fill one, which
    // would push the board of best times to the bottom of the window.
    <main className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <StatsView gameId="rv-there-yet" />
      {/* The board of everybody's best times, under this browser's own
          numbers: the page is about how the drive is going, and that is both
          how it is going here and how it is going against everyone else. */}
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pb-4">
        <Leaderboard />
      </div>
    </main>
  );
}
