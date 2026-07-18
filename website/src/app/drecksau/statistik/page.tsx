/**
 * Drecksau statistics page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { StatsView } from "@/components/stats-view";

export const metadata: Metadata = {
  title: "Drecksau - Statistik",
  description: "Gespielte Partien, Siege und Spielzeiten von Drecksau.",
};

/**
 * Renders the Drecksau statistics page.
 *
 * @returns the page element
 */
export default function DrecksauStatistikPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <StatsView gameId="drecksau" />
    </main>
  );
}
