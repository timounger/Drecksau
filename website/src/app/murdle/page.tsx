/**
 * "Murdle" game page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { MurdleGame } from "@/games/murdle/components/murdle-game";

export const metadata: Metadata = {
  title: "Murdle",
  description:
    "Kriminalfälle zum Selberlösen - wer war es, womit, wo und warum? Mit Deduktionsraster wie im Buch.",
};

/**
 * Renders the "Murdle" game page.
 *
 * @returns the page element
 */
export default function MurdlePage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <MurdleGame />
    </main>
  );
}
