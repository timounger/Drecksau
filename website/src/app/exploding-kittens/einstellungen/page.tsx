/**
 * Exploding Kittens settings page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { ExplodingKittensSettingsView } from "@/games/exploding-kittens/components/settings-view";

export const metadata: Metadata = {
  title: "Exploding Kittens - Einstellungen",
  description: "Wie viele am Tisch sitzen und wie lang die Partie wird.",
};

/**
 * Renders the settings page.
 *
 * @returns the page element
 */
export default function ExplodingKittensEinstellungenPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <ExplodingKittensSettingsView />
    </main>
  );
}
