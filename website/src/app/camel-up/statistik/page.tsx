/**
 * Camel Up statistics page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { StatsView } from "@/components/stats-view";

export const metadata: Metadata = {
  title: "Camel Up - Statistik",
  description: "Gespielte Rennen und Erfolge von Camel Up.",
};

/**
 * Renders the statistics page.
 *
 * @returns the page element
 */
export default function CamelUpStatistikPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <StatsView gameId="camel-up" />
    </main>
  );
}
