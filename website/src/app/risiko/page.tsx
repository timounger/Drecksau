/**
 * Risiko - das Spiel gegen den Computer beginnt hier.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { RisikoGameScreen } from "@/games/risiko/components/risiko-game";

export const metadata: Metadata = {
  title: "Risiko",
  description: "Das Brettspiel Risiko gegen Computergegner.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function RisikoPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <RisikoGameScreen />
    </main>
  );
}
