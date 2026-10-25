/**
 * "Murdle" statistics page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { StatsView } from "@/components/stats-view";
import { MurdleStats } from "@/games/murdle/components/murdle-stats";

export const metadata: Metadata = {
  title: "Murdle - Statistik",
  description:
    "Gelöste Fälle, Bestzeiten je Fall und die Spielzeit von Murdle.",
};

/**
 * Renders the "Murdle" statistics page.
 *
 * @returns the page element
 */
export default function MurdleStatistikPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* In a frame of its own, so the collection's numbers do not stretch
          over the whole height and push the cases to the bottom. */}
      <div>
        <StatsView gameId="murdle" />
      </div>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pb-4">
        <MurdleStats />
      </div>
    </main>
  );
}
