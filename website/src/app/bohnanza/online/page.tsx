/**
 * Online Bohnanza page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { BohnanzaOnlineScreen } from "@/games/bohnanza/components/bohnanza-online";

export const metadata: Metadata = {
  title: "Bohnanza - Online",
  description: "Bohnanza online mit Freunden spielen.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function BohnanzaOnlinePage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <BohnanzaOnlineScreen />
    </main>
  );
}
