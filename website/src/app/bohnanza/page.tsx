/**
 * Bohnanza - the game against the computer starts right here.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { BohnanzaGameScreen } from "@/games/bohnanza/components/bohnanza-game";

export const metadata: Metadata = {
  title: "Bohnanza",
  description: "Das Kartenspiel Bohnanza gegen Computergegner.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function BohnanzaPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <BohnanzaGameScreen />
    </main>
  );
}
