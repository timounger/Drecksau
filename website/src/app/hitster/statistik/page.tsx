/**
 * Hitster statistics page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { StatsView } from "@/components/stats-view";

export const metadata: Metadata = {
  title: "Hitster - Statistik",
  description: "Gespielte Partien, Siege und Spielzeit von Hitster.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function HitsterStatistikPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <StatsView gameId="hitster" />
    </main>
  );
}
