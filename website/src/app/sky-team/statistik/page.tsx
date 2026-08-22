/**
 * Sky Team statistics page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { StatsView } from "@/components/stats-view";

export const metadata: Metadata = {
  title: "Sky Team - Statistik",
  description: "Gespielte Landungen und Erfolge von Sky Team.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function SkyTeamStatistikPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <StatsView gameId="sky-team" />
    </main>
  );
}
