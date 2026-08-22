/**
 * Online Risiko page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { RisikoOnlineScreen } from "@/games/risiko/components/risiko-online";

export const metadata: Metadata = {
  title: "Risiko - Online",
  description: "Risiko online mit Freunden spielen.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function RisikoOnlinePage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <RisikoOnlineScreen />
    </main>
  );
}
