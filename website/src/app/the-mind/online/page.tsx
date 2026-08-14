/**
 * The Mind - Online page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { TheMindOnlineScreen } from "@/games/the-mind/components/the-mind-online";

export const metadata: Metadata = {
  title: "The Mind - Online",
  description: "The Mind online mit Freunden spielen.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function Page(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <TheMindOnlineScreen />
    </main>
  );
}
