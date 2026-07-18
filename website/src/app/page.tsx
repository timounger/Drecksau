/**
 * Start page - the game collection overview.
 *
 * @module
 */
import type { ReactElement } from "react";
import { GameCollection } from "@/components/game-collection";

/**
 * Renders the start page.
 *
 * @returns the page element
 */
export default function Home(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <GameCollection />
    </main>
  );
}
