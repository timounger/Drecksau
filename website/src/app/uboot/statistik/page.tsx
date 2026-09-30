/**
 * "U-Boot" statistics page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { StatsView } from "@/components/stats-view";

export const metadata: Metadata = {
  title: "U-Boot - Statistik",
  description: "Tauchfahrten, geschaffte Kurse und Spielzeit von U-Boot.",
};

/**
 * Renders the "U-Boot" statistics page.
 *
 * @returns the page element
 */
export default function UbootStatistikPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <StatsView gameId="uboot" />
    </main>
  );
}
