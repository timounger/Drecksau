/**
 * Die Statistikseite von Bloons TD.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { StatsView } from "@/components/stats-view";
import { LeaderboardPicker } from "@/games/bloons-td/components/leaderboard";

export const metadata: Metadata = {
  title: "Bloons TD - Statistik",
  description:
    "Gespielte Partien, Spielzeiten und die Bestenliste von Bloons TD.",
};

/**
 * Rendert die Statistikseite.
 *
 * @returns die Seite
 */
export default function BloonsTdStatistikPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* In einem eigenen Rahmen, damit die Statistik sich nicht über die
          ganze Höhe streckt und die Bestenliste ans untere Ende schiebt. */}
      <div>
        <StatsView gameId="bloons-td" />
      </div>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pb-4">
        {/* Die Bestenliste aller, unter den eigenen Zahlen dieses Browsers. */}
        <LeaderboardPicker />
      </div>
    </main>
  );
}
