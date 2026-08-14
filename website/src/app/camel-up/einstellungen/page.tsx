/**
 * Camel Up settings page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { CamelUpSettingsView } from "@/games/camel-up/components/settings-view";

export const metadata: Metadata = {
  title: "Camel Up - Einstellungen",
  description: "Wie viele am Rennen wetten.",
};

/**
 * Renders the settings page.
 *
 * @returns the page element
 */
export default function CamelUpEinstellungenPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <CamelUpSettingsView />
    </main>
  );
}
