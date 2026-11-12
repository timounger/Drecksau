/**
 * Wurfduell game page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { WurfduellGame } from "@/games/wurfduell/components/wurfduell-game";

export const metadata: Metadata = {
  title: "Wurfduell",
  description:
    "Zwei Figuren bewerfen sich mit Tomaten, Torten und Kanonenkugeln - wer zuerst k.o. ist, verliert.",
};

/**
 * Renders the Wurfduell game page.
 *
 * @returns the page element
 */
export default function WurfduellPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <WurfduellGame />
    </main>
  );
}
