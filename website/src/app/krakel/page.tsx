/**
 * Krakel Orakel start page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { KrakelLanding } from "@/games/krakel/components/krakel-landing";

export const metadata: Metadata = {
  title: "Krakel Orakel",
  description:
    "Alle malen gleichzeitig - und streichen dann gemeinsam die Wörter, die niemand gemalt hat.",
};

/**
 * Renders the Krakel Orakel start page.
 *
 * @returns the page element
 */
export default function KrakelPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <KrakelLanding />
    </main>
  );
}
