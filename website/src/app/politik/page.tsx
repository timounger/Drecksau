/**
 * "Das politische Talent" - the game against the computer starts right here.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { PolitikGame } from "@/games/politik/components/politik-game";

export const metadata: Metadata = {
  title: "Das politische Talent",
  description:
    "Wahlkampf, Regierungsbildung und Wahlversprechen gegen Computergegner.",
};

/**
 * Renders the game page.
 *
 * @returns the page element
 */
export default function PolitikPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <PolitikGame />
    </main>
  );
}
