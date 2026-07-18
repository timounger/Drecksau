/**
 * Binokel game page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { BinokelGame } from "@/games/binokel/components/binokel-game";

export const metadata: Metadata = {
  title: "Binokel",
  description: "Schwaebisches Stichspiel gegen Computergegner.",
};

/**
 * Renders the Binokel game page.
 *
 * @returns the page element
 */
export default function BinokelPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <BinokelGame />
    </main>
  );
}
