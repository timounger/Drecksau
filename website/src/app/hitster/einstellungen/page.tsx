/**
 * Hitster settings page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { HitsterSettingsView } from "@/games/hitster/components/settings-view";

export const metadata: Metadata = {
  title: "Hitster - Einstellungen",
  description: "Computer-Gegner, ihre Stärke und das Ziel gegen den Computer.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function HitsterEinstellungenPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <HitsterSettingsView />
    </main>
  );
}
