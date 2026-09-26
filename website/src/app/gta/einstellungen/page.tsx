/**
 * GTA settings page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { GtaSettingsView } from "@/games/gta/components/settings-view";
import { music } from "@/games/gta/media/folders";

export const metadata: Metadata = {
  title: "GTA - Einstellungen",
  description: "Wie nah die Kamera an der Straße steht.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 * @remarks
 * **The music is read here** rather than in the view: the credit has to name
 * every file in the two folders, and only the server can look in a folder -
 * see ../../../games/gta/media/folders.
 */
export default function GtaEinstellungenPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <GtaSettingsView music={music()} />
    </main>
  );
}
