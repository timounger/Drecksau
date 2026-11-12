/**
 * Frost Fortress statistics page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { StatsView } from "@/components/stats-view";
import { FortressStatsView } from "@/games/frost-fortress/components/fortress-stats-view";

export const metadata: Metadata = {
  title: "Frost Fortress - Statistik",
  description:
    "Höchste Welle, besiegte Gegner und Bosse, gebaute Anlagen und Spielzeit in Frost Fortress.",
};

/**
 * Renders the Frost Fortress statistics page.
 *
 * @returns the page element
 */
export default function FrostFortressStatistikPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <div>
        <StatsView gameId="frost-fortress" />
      </div>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pb-4">
        <FortressStatsView />
      </div>
    </main>
  );
}
