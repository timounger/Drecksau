/**
 * Heckmeck settings page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { HeckmeckSettingsView } from "@/games/heckmeck/components/settings-view";

export const metadata: Metadata = {
  title: "Heckmeck - Einstellungen",
  description: "Wie viele um die Würmer würfeln.",
};

/**
 * Renders the settings page.
 *
 * @returns the page element
 */
export default function HeckmeckEinstellungenPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <HeckmeckSettingsView />
    </main>
  );
}
