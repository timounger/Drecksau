/**
 * The Mind page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { MindLanding } from "@/games/the-mind/components/the-mind-landing";

export const metadata: Metadata = {
  title: "The Mind",
  description:
    "Gemeinsam aufsteigend ablegen - ohne ein Wort. Nur im Online-Modus.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function Page(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <MindLanding />
    </main>
  );
}
