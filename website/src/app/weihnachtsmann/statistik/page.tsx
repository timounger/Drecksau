/**
 * The Weihnachtsmann statistics page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { StatsView } from "@/components/stats-view";

export const metadata: Metadata = {
  title: "Weihnachtsmann & Co. KG - Statistik",
  description: "Spielzeit von Weihnachtsmann & Co. KG.",
};

/**
 * Renders the statistics page.
 *
 * @returns the page
 */
export default function WeihnachtsmannStatistikPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <div>
        <StatsView gameId="weihnachtsmann" />
      </div>
    </main>
  );
}
