/**
 * "Murdoku" statistics page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { StatsView } from "@/components/stats-view";
import { MurdokuStats } from "@/games/murdoku/components/murdoku-stats";

export const metadata: Metadata = {
  title: "Murdoku - Statistik",
  description:
    "Gelöste Fälle, Bestzeiten je Fall und die Spielzeit von Murdoku.",
};

/**
 * Renders the "Murdoku" statistics page.
 *
 * @returns the page element
 */
export default function MurdokuStatistikPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* In a frame of its own, so the collection's numbers do not stretch
          over the whole height and push the cases to the bottom. */}
      <div>
        <StatsView gameId="murdoku" />
      </div>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pb-4">
        <MurdokuStats />
      </div>
    </main>
  );
}
