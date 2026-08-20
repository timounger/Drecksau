/**
 * Flip 7 settings page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { Flip7SettingsView } from "@/games/flip-7/components/settings-view";

export const metadata: Metadata = {
  title: "Flip 7 - Einstellungen",
  description: "Wie viele am Tisch sitzen.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function Flip7EinstellungenPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <Flip7SettingsView />
    </main>
  );
}
