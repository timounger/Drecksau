/**
 * Risiko settings page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { RisikoSettingsView } from "@/games/risiko/components/settings-view";

export const metadata: Metadata = {
  title: "Risiko - Einstellungen",
  description: "Spielvariante und Anzahl der Spieler.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function RisikoEinstellungenPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <RisikoSettingsView />
    </main>
  );
}
