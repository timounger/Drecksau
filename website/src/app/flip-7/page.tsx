/**
 * Flip 7 - the game against the computer starts right here.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { Flip7Game } from "@/games/flip-7/components/flip-7-game";

export const metadata: Metadata = {
  title: "Flip 7",
  description: "Das Kartenspiel Flip 7 gegen Computergegner.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function Flip7Page(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <Flip7Game />
    </main>
  );
}
