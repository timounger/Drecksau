/**
 * GTA statistics page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { StatsView } from "@/components/stats-view";

export const metadata: Metadata = {
  title: "GTA - Statistik",
  description: "Gespielte Partien und Erfolge von GTA.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function GtaStatistikPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <StatsView gameId="gta" />
    </main>
  );
}
