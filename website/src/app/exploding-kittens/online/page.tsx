/**
 * Online Exploding Kittens page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { ExplodingKittensOnlineScreen } from "@/games/exploding-kittens/components/exploding-kittens-online";

export const metadata: Metadata = {
  title: "Exploding Kittens - Online",
  description: "Exploding Kittens online mit Freunden spielen.",
};

/**
 * Renders the online page.
 *
 * @returns the page element
 */
export default function ExplodingKittensOnlinePage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <ExplodingKittensOnlineScreen />
    </main>
  );
}
