/**
 * "Sherlock Holmes - Rätselsammlung" game page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { SherlockGame } from "@/games/sherlock/components/sherlock-game";

export const metadata: Metadata = {
  title: "Sherlock Holmes - Rätselsammlung",
  description:
    "Rätsel rund um Sherlock Holmes und Dr. Watson - Logik, Zahlen, Wörter und kleine Fälle, mit Lösung zum Nachlesen.",
};

/**
 * Renders the "Sherlock Holmes - Rätselsammlung" game page.
 *
 * @returns the page element
 */
export default function SherlockPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <SherlockGame />
    </main>
  );
}
