/**
 * Skyjo statistics page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { StatsView } from "@/components/stats-view";

export const metadata: Metadata = {
  title: "Skyjo - Statistik",
  description: "Gespielte Runden und Erfolge von Skyjo.",
};

/**
 * Renders the Skyjo statistics page.
 *
 * @returns the page element
 */
export default function SkyjoStatistikPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <StatsView gameId="skyjo" />
    </main>
  );
}
