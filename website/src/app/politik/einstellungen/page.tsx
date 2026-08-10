/**
 * Settings page of "Das politische Talent".
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { PolitikSettingsView } from "@/games/politik/components/settings-view";

export const metadata: Metadata = {
  title: "Das politische Talent - Einstellungen",
  description: "Wie viele Parteien am Tisch sitzen.",
};

/**
 * Renders the settings page.
 *
 * @returns the page element
 */
export default function PolitikEinstellungenPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <PolitikSettingsView />
    </main>
  );
}
