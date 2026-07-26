/**
 * Panzerkiste statistics page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { StatsView } from "@/components/stats-view";

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
    </main>
  );
}
