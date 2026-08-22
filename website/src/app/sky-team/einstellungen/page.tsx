/**
 * Sky Team settings page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { SkyTeamSettingsView } from "@/games/sky-team/components/settings-view";

export const metadata: Metadata = {
  title: "Sky Team - Einstellungen",
  description: "Welchen Platz du gegen den Computer fliegst.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function SkyTeamEinstellungenPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <SkyTeamSettingsView />
    </main>
  );
}
