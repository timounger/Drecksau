/**
 * Dog - das Spiel gegen den Computer beginnt hier.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { DogScreen } from "@/games/dog/components/dog-game";

export const metadata: Metadata = {
  title: "Dog",
  description:
    "Das Brettspiel Dog mit Karten statt Wuerfeln - zu zweit gegen zwei.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function DogPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <DogScreen />
    </main>
  );
}
