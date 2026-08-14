/**
 * The Mind page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { TheMindGame } from "@/games/the-mind/components/the-mind-game";

export const metadata: Metadata = {
  title: "The Mind",
  description: "Das Kartenspiel The Mind mit Computerpartnern.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function Page(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <TheMindGame />
    </main>
  );
}
