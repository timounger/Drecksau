/**
 * Jammerlappen settings page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { JammerlappenSettingsView } from "@/games/jammerlappen/components/settings-view";

export const metadata: Metadata = {
  title: "Jammerlappen - Einstellungen",
  description: "Wie viele am Tisch sitzen.",
};

/**
 * Renders the settings page.
 *
 * @returns the page element
 */
export default function JammerlappenEinstellungenPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <JammerlappenSettingsView />
    </main>
  );
}
