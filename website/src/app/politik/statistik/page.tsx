/**
 * Statistics page of "Das politische Talent".
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { StatsView } from "@/components/stats-view";

export const metadata: Metadata = {
  title: "Das politische Talent - Statistik",
  description: "Gespielte Runden und Erfolge von Das politische Talent.",
};

/**
 * Renders the statistics page.
 *
 * @returns the page element
 */
export default function PolitikStatistikPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <StatsView gameId="politik" />
    </main>
  );
}
