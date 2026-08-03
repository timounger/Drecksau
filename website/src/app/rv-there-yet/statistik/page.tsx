/**
 * "RV There Yet?" statistics page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { StatsView } from "@/components/stats-view";

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
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <StatsView gameId="rv-there-yet" />
    </main>
  );
}
