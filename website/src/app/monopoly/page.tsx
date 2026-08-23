/**
 * Monopoly - das Spiel gegen den Computer beginnt hier.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { MonopolyGameScreen } from "@/games/monopoly/components/monopoly-game";

export const metadata: Metadata = {
  title: "Monopoly",
  description: "Das Brettspiel Monopoly gegen Computergegner.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function MonopolyPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <MonopolyGameScreen />
    </main>
  );
}
