/**
 * CATAN settings page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { CatanSettingsView } from "@/games/catan/components/settings-view";

export const metadata: Metadata = {
  title: "CATAN - Einstellungen",
  description: "Anzahl der Spieler und Siegpunkte.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function CatanEinstellungenPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <CatanSettingsView />
    </main>
  );
}
