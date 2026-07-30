/**
 * Online Skyjo page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { SkyjoOnlineScreen } from "@/games/skyjo/components/skyjo-online";

export const metadata: Metadata = {
  title: "Skyjo - Online",
  description: "Skyjo online mit Freunden spielen.",
};

/**
 * Renders the online page.
 *
 * @returns the page element
 */
export default function SkyjoOnlinePage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <SkyjoOnlineScreen />
    </main>
  );
}
