/**
 * Scotland Yard statistics page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { StatsView } from "@/components/stats-view";

export const metadata: Metadata = {
  title: "Scotland Yard - Statistik",
  description: "Gespielte Jagden, Siege und Spielzeit von Scotland Yard.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function ScotlandYardStatistikPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <StatsView gameId="scotland-yard" />
    </main>
  );
}
