/**
 * Monopoly settings page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { MonopolySettingsView } from "@/games/monopoly/components/settings-view";

export const metadata: Metadata = {
  title: "Monopoly - Einstellungen",
  description: "Wie viele am Tisch sitzen.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function MonopolyEinstellungenPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <MonopolySettingsView />
    </main>
  );
}
