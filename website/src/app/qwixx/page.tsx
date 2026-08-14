/**
 * Qwixx - the game against the computer starts right here.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { QwixxGame } from "@/games/qwixx/components/qwixx-game";

export const metadata: Metadata = {
  title: "Qwixx",
  description: "Das Würfelspiel Qwixx gegen Computergegner.",
};

/**
 * Renders the game page.
 *
 * @returns the page element
 */
export default function QwixxPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <QwixxGame />
    </main>
  );
}
