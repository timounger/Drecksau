/**
 * Krakel Orakel online page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { KrakelOnlineScreen } from "@/games/krakel/components/krakel-online";

export const metadata: Metadata = {
  title: "Krakel Orakel - Online spielen",
  description: "Krakel Orakel online: zeichnen und raten mit 2 bis 6 Spielern.",
};

/**
 * Renders the Krakel Orakel online page.
 *
 * @returns the page element
 */
export default function KrakelOnlinePage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <KrakelOnlineScreen />
    </main>
  );
}
