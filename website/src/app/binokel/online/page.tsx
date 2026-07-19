/**
 * Binokel online multiplayer page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { OnlineGame } from "@/games/binokel/components/online-game";

export const metadata: Metadata = {
  title: "Binokel - Online spielen",
  description: "Binokel online mit Freunden per Raumcode.",
};

/**
 * Renders the Binokel online multiplayer page.
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
