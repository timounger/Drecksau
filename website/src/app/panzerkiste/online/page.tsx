/**
 * Panzerkiste online co-op page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { PanzerkisteOnline } from "@/games/panzerkiste/components/panzerkiste-online";

export const metadata: Metadata = {
  title: "Panzerkiste - Online spielen",
  description: "Panzerkiste online im Koop mit einem Freund per Raumcode.",
};

/**
 * Renders the Panzerkiste online co-op page.
 *
 * @returns the page element
 */
export default function OnlinePage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <PanzerkisteOnline />
    </main>
  );
}
