/**
 * Kuhle Kühe settings page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { KuhleKueheSettingsView } from "@/games/kuhle-kuehe/components/settings-view";

export const metadata: Metadata = {
  title: "Kuhle Kühe - Einstellungen",
  description: "Wie viele mitwürfeln.",
};

/**
 * Renders the settings page.
 *
 * @returns the page element
 */
export default function KuhleKueheEinstellungenPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <KuhleKueheSettingsView />
    </main>
  );
}
