/**
 * Online Monopoly page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { MonopolyOnlineScreen } from "@/games/monopoly/components/monopoly-online";

export const metadata: Metadata = {
  title: "Monopoly - Online",
  description: "Monopoly online mit Freunden spielen.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function MonopolyOnlinePage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <MonopolyOnlineScreen />
    </main>
  );
}
