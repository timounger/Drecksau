/**
 * Hitster - the music quiz against the computer starts right here.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { HitsterGame } from "@/games/hitster/components/hitster-game";

export const metadata: Metadata = {
  title: "Hitster",
  description:
    "Hör den Song, schätz das Jahr und bau deine Zeitleiste - hier gegen den Computer.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function HitsterPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <HitsterGame />
    </main>
  );
}
