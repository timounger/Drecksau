/**
 * Monopoly statistics page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { StatsView } from "@/components/stats-view";

export const metadata: Metadata = {
  title: "Monopoly - Statistik",
  description: "Gespielte Partien und Erfolge von Monopoly.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function MonopolyStatistikPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <StatsView gameId="monopoly" />
    </main>
  );
}
