/**
 * IMPERAVIS statistics page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { StatsView } from "@/components/stats-view";
import { ImperavisStatsView } from "@/games/imperavis/components/imperavis-stats-view";

export const metadata: Metadata = {
  title: "IMPERAVIS - Statistik",
  description:
    "Größte Stadt, höchste Schicht, gegründete Inseln, Gebäude, Schiffe und Handel in IMPERAVIS.",
};

/**
 * Renders the IMPERAVIS statistics page.
 *
 * @returns the page element
 */
export default function ImperavisStatistikPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <div>
        <StatsView gameId="imperavis" />
      </div>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pb-4">
        <ImperavisStatsView />
      </div>
    </main>
  );
}
