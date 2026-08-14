/**
 * Camel Up - the race against the computer starts right here.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { CamelUpGame } from "@/games/camel-up/components/camel-up-game";

export const metadata: Metadata = {
  title: "Camel Up",
  description: "Das Kamelrennen Camel Up gegen Computergegner.",
};

/**
 * Renders the game page.
 *
 * @returns the page element
 */
export default function CamelUpPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <CamelUpGame />
    </main>
  );
}
