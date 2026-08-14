/**
 * Kniffel page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { KniffelGameScreen } from "@/games/kniffel/components/kniffel-game";

export const metadata: Metadata = {
  title: "Kniffel",
  description: "Das Würfelspiel Kniffel gegen Computergegner.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function Page(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <KniffelGameScreen />
    </main>
  );
}
