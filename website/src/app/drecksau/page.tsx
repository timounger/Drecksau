/**
 * Drecksau game page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { DrecksauGame } from "@/games/drecksau/components/drecksau-game";

export const metadata: Metadata = {
  title: "Drecksau",
  description: "Das Kartenspiel Drecksau gegen Computergegner.",
};

/**
 * Renders the Drecksau game page.
 *
 * @returns the page element
 */
export default function DrecksauPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <DrecksauGame />
    </main>
  );
}
