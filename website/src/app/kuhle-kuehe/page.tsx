/**
 * Kuhle Kühe - the game against the computer starts right here.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { KuhleKueheGame } from "@/games/kuhle-kuehe/components/kuhle-kuehe-game";

export const metadata: Metadata = {
  title: "Kuhle Kühe",
  description: "Das Würfelspiel Kuhle Kühe gegen Computergegner.",
};

/**
 * Renders the game page.
 *
 * @returns the page element
 */
export default function KuhleKuehePage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <KuhleKueheGame />
    </main>
  );
}
