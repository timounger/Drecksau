/**
 * Online Camel Up page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { CamelUpOnlineScreen } from "@/games/camel-up/components/camel-up-online";

export const metadata: Metadata = {
  title: "Camel Up - Online",
  description: "Camel Up online mit Freunden spielen.",
};

/**
 * Renders the online page.
 *
 * @returns the page element
 */
export default function CamelUpOnlinePage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <CamelUpOnlineScreen />
    </main>
  );
}
