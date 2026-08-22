/**
 * Online The Game page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { TheGameOnlineScreen } from "@/games/the-game/components/the-game-online";

export const metadata: Metadata = {
  title: "The Game - Online",
  description: "The Game online gemeinsam spielen.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function TheGameOnlinePage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <TheGameOnlineScreen />
    </main>
  );
}
