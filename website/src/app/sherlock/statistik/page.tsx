/**
 * "Sherlock Holmes - Rätselsammlung" statistics page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { StatsView } from "@/components/stats-view";
import { SherlockStats } from "@/games/sherlock/components/sherlock-stats";

export const metadata: Metadata = {
  title: "Sherlock Holmes - Statistik",
  description:
    "Gelöste Rätsel je Teil, angesehene Lösungen und die Spielzeit der Sherlock-Holmes-Rätselsammlung.",
};

/**
 * Renders the "Sherlock Holmes - Rätselsammlung" statistics page.
 *
 * @returns the page element
 */
export default function SherlockStatistikPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* In a frame of its own, so the collection's numbers do not stretch
          over the whole height and push the parts to the bottom. */}
      <div>
        <StatsView gameId="sherlock" />
      </div>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pb-4">
        <SherlockStats />
      </div>
    </main>
  );
}
