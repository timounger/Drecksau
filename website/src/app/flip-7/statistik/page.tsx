/**
 * Flip 7 statistics page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { StatsView } from "@/components/stats-view";

export const metadata: Metadata = {
  title: "Flip 7 - Statistik",
  description: "Gespielte Partien und Erfolge von Flip 7.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function Flip7StatistikPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <StatsView gameId="flip-7" />
    </main>
  );
}
