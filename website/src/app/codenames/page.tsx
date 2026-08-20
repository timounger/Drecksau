/**
 * Codenames - the game against the computer starts right here.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { CodenamesGame } from "@/games/codenames/components/codenames-game";

export const metadata: Metadata = {
  title: "Codenames",
  description: "Das Wortspiel Codenames gegen Computergegner.",
};

/**
 * Renders the game page.
 *
 * @returns the page element
 */
export default function CodenamesPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <CodenamesGame />
    </main>
  );
}
