/**
 * The Game - das Spiel gegen den Computer beginnt hier.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { TheGameScreen } from "@/games/the-game/components/the-game-game";

export const metadata: Metadata = {
  title: "The Game",
  description: "Das kooperative Kartenspiel The Game gegen Computerpartner.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function TheGamePage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <TheGameScreen />
    </main>
  );
}
