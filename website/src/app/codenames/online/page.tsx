/**
 * Online Codenames page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { CodenamesOnlineScreen } from "@/games/codenames/components/codenames-online";

export const metadata: Metadata = {
  title: "Codenames - Online",
  description: "Codenames online mit Freunden spielen, ab vier Spielern.",
};

/**
 * Renders the online page.
 *
 * @returns the page element
 */
export default function CodenamesOnlinePage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <CodenamesOnlineScreen />
    </main>
  );
}
