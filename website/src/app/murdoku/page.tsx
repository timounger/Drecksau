/**
 * "Murdoku" game page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { MurdokuGame } from "@/games/murdoku/components/murdoku-game";

export const metadata: Metadata = {
  title: "Murdoku",
  description:
    "Ein Kriminalrätsel wie ein Sudoku - finde, wo jeder stand, und wer mit dem Opfer allein war.",
};

/**
 * Renders the "Murdoku" game page.
 *
 * @returns the page element
 */
export default function MurdokuPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <MurdokuGame />
    </main>
  );
}
