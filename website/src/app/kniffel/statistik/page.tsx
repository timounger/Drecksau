/**
 * Kniffel statistics page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { StatsView } from "@/components/stats-view";

export const metadata: Metadata = {
  title: "Kniffel - Statistik",
  description: "Gespielte Partien und Erfolge von Kniffel.",
};

/**
 * Renders the statistics page.
 *
 * @returns the page element
 */
export default function KniffelStatistikPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <StatsView gameId="kniffel" />
    </main>
  );
}
