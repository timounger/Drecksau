/**
 * Online Jammerlappen page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { JammerlappenOnlineScreen } from "@/games/jammerlappen/components/jammerlappen-online";

export const metadata: Metadata = {
  title: "Jammerlappen - Online",
  description: "Jammerlappen online mit Freunden spielen.",
};

/**
 * Renders the online page.
 *
 * @returns the page element
 */
export default function JammerlappenOnlinePage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <JammerlappenOnlineScreen />
    </main>
  );
}
