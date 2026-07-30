/**
 * Skyjo settings page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { SkyjoSettingsView } from "@/games/skyjo/components/settings-view";

export const metadata: Metadata = {
  title: "Skyjo - Einstellungen",
  description: "Spielerzahl und Schwierigkeit der Computergegner.",
};

/**
 * Renders the Skyjo settings page.
 *
 * @returns the page element
 */
export default function SkyjoEinstellungenPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <SkyjoSettingsView />
    </main>
  );
}
