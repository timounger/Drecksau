/**
 * Zelda - ein kleines Abenteuer im Stil des Game Boy Advance.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { ZeldaGameScreen } from "@/games/zelda/components/zelda-game";

export const metadata: Metadata = {
  title: "Zelda",
  description:
    "Schwert, Bogen, Bomben - hol mit Link den Sonnenstein aus dem Moostempel.",
};

/**
 * Renders the game page.
 *
 * @returns the page
 */
export default function ZeldaPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <ZeldaGameScreen />
    </main>
  );
}
