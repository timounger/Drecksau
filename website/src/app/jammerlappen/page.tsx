/**
 * Jammerlappen - the game against the computer starts right here.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { JammerlappenGame } from "@/games/jammerlappen/components/jammerlappen-game";

export const metadata: Metadata = {
  title: "Jammerlappen",
  description: "Das Kartenspiel Jammerlappen gegen Computergegner.",
};

/**
 * Renders the game page.
 *
 * @returns the page element
 */
export default function JammerlappenPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <JammerlappenGame />
    </main>
  );
}
