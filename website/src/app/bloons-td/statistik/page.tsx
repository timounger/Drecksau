/**
 * Die Statistikseite von Bloons TD.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { StatsView } from "@/components/stats-view";

export const metadata: Metadata = {
  title: "Bloons TD - Statistik",
  description: "Gespielte Partien und Spielzeiten von Bloons TD.",
};

/**
 * Rendert die Statistikseite.
 *
 * @returns die Seite
 */
export default function BloonsTdStatistikPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <StatsView gameId="bloons-td" />
    </main>
  );
}
