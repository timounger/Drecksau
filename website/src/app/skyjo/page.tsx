/**
 * Skyjo game page - the game against the computer starts right here.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { SkyjoGame } from "@/games/skyjo/components/skyjo-game";

export const metadata: Metadata = {
  title: "Skyjo",
  description: "Das Kartenspiel Skyjo gegen Computergegner.",
};

/**
 * Renders the Skyjo game page.
 *
 * @returns the page element
 */
export default function SkyjoPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <SkyjoGame />
    </main>
  );
}
