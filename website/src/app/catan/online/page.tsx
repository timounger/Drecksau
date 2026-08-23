/**
 * Online CATAN page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { CatanOnlineScreen } from "@/games/catan/components/catan-online";

export const metadata: Metadata = {
  title: "CATAN - Online",
  description: "CATAN online mit Freunden spielen.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function CatanOnlinePage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <CatanOnlineScreen />
    </main>
  );
}
