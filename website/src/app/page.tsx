/**
 * Landing page - hosts the game.
 *
 * @module
 */
import type { ReactElement } from "react";
import { DrecksauGame } from "@/components/drecksau-game";

/**
 * Renders the game page.
 *
 * @returns the page element
 */
export default function Home(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <DrecksauGame />
    </main>
  );
}
