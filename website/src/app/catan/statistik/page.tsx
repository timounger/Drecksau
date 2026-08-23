/**
 * CATAN statistics page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { StatsView } from "@/components/stats-view";

export const metadata: Metadata = {
  title: "CATAN - Statistik",
  description: "Gespielte Partien und Erfolge von CATAN.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function CatanStatistikPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <StatsView gameId="catan" />
    </main>
  );
}
