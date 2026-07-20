/**
 * Panzerkiste game page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { PanzerkisteGame } from "@/games/panzerkiste/components/panzerkiste-game";

export const metadata: Metadata = {
  title: "Panzerkiste",
  description:
    "Zerstöre alle feindlichen Panzer - schießen, minen, ausweichen.",
};

/**
 * Renders the Panzerkiste game page.
 *
 * @returns the page element
 */
export default function PanzerkistePage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <PanzerkisteGame />
    </main>
  );
}
