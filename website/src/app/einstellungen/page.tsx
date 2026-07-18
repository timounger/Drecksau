/**
 * Settings page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { SettingsView } from "@/games/drecksau/components/settings-view";

export const metadata: Metadata = {
  title: "Einstellungen",
  description: "Animationen und weitere Einstellungen.",
};

/**
 * Renders the settings page.
 *
 * @returns the page element
 */
export default function EinstellungenPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <SettingsView />
    </main>
  );
}
