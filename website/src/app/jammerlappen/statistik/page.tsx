/**
 * Jammerlappen statistics page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { StatsView } from "@/components/stats-view";

export const metadata: Metadata = {
  title: "Jammerlappen - Statistik",
  description: "Gespielte Partien und Erfolge von Jammerlappen.",
};

/**
 * Renders the statistics page.
 *
 * @returns the page element
 */
export default function JammerlappenStatistikPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <StatsView gameId="jammerlappen" />
    </main>
  );
}
