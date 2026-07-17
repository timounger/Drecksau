/**
 * Online multiplayer page.
 *
 * @module
 */
import type { ReactElement } from "react";
import { OnlineGame } from "@/components/online-game";

/**
 * Renders the online multiplayer page.
 *
 * @returns the page element
 */
export default function OnlinePage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <OnlineGame />
    </main>
  );
}
