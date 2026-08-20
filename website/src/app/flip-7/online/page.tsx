/**
 * Online Flip 7 page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { Flip7OnlineScreen } from "@/games/flip-7/components/flip-7-online";

export const metadata: Metadata = {
  title: "Flip 7 - Online",
  description: "Flip 7 online mit Freunden spielen.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function Flip7OnlinePage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <Flip7OnlineScreen />
    </main>
  );
}
