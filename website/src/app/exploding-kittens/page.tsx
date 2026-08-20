/**
 * Exploding Kittens - the game against the computer starts right here.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { ExplodingKittensGame } from "@/games/exploding-kittens/components/exploding-kittens-game";

export const metadata: Metadata = {
  title: "Exploding Kittens",
  description: "Das Kartenspiel Exploding Kittens gegen Computergegner.",
};

/**
 * Renders the game page.
 *
 * @returns the page element
 */
export default function ExplodingKittensPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <ExplodingKittensGame />
    </main>
  );
}
