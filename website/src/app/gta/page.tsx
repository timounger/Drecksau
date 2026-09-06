/**
 * GTA - Los Santos von oben.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { GtaScreen } from "@/games/gta/components/gta-game";

export const metadata: Metadata = {
  title: "GTA",
  description:
    "Top-Down-Stadtspiel: fahren, liefern und der Polizei entkommen.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function GtaPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <GtaScreen />
    </main>
  );
}
