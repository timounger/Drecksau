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
    "Mach aus einer Kritzelei ein Bild - die anderen raten den Begriff.",
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
