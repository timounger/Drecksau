/**
 * Scotland Yard online - Mister X and the detectives, each on their own device.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { ScotlandYardOnlineScreen } from "@/games/scotland-yard/components/scotland-yard-online";

export const metadata: Metadata = {
  title: "Scotland Yard online",
  description:
    "Mister X gegen die Detektive - jede:r am eigenen Gerät, Mister X bleibt verborgen.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function ScotlandYardOnlinePage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <ScotlandYardOnlineScreen />
    </main>
  );
}
