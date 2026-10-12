/**
 * Scotland Yard - the chase against the computer starts right here.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { ScotlandYardGame } from "@/games/scotland-yard/components/scotland-yard-game";

export const metadata: Metadata = {
  title: "Scotland Yard",
  description:
    "Jage Mister X quer durch London - oder flieh als Mister X vor den Detektiven, hier gegen den Computer.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function ScotlandYardPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <ScotlandYardGame />
    </main>
  );
}
