/**
 * Heckmeck am Bratwurmeck - the game against the computer starts right here.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { HeckmeckGameScreen } from "@/games/heckmeck/components/heckmeck-game";

export const metadata: Metadata = {
  title: "Heckmeck am Bratwurmeck",
  description: "Das Würfelspiel Heckmeck am Bratwurmeck gegen Computergegner.",
};

/**
 * Renders the game page.
 *
 * @returns the page element
 */
export default function HeckmeckPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <HeckmeckGameScreen />
    </main>
  );
}
