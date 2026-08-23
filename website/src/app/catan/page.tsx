/**
 * CATAN - das Spiel gegen den Computer beginnt hier.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { CatanGameScreen } from "@/games/catan/components/catan-game";

export const metadata: Metadata = {
  title: "CATAN",
  description: "Das Brettspiel CATAN gegen Computergegner.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function CatanPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <CatanGameScreen />
    </main>
  );
}
