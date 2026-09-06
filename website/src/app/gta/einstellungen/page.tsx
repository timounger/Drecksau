/**
 * GTA settings page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { GtaSettingsView } from "@/games/gta/components/settings-view";

export const metadata: Metadata = {
  title: "GTA - Einstellungen",
  description: "Wie nah die Kamera an der Straße steht.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function GtaEinstellungenPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <GtaSettingsView />
    </main>
  );
}
