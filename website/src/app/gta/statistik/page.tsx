/**
 * GTA statistics page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { GtaStatsView } from "@/games/gta/components/gta-stats-view";

export const metadata: Metadata = {
  title: "GTA - Statistik",
  description: "Gefahrene Kilometer, zerstörte Fahrzeuge und Spielzeit.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 * @remarks
 * **Its own view, not the shared one.** What every other game counts is
 * rounds, wins and losses; this one is a city one drives about in - see
 * ../../../games/gta/components/gta-stats-view.
 */
export default function GtaStatistikPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <GtaStatsView />
    </main>
  );
}
