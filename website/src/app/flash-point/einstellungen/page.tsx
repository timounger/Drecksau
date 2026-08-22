/**
 * Flash Point settings page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { FlashPointSettingsView } from "@/games/flash-point/components/settings-view";

export const metadata: Metadata = {
  title: "Flash Point - Einstellungen",
  description: "Wie groß die Mannschaft ist.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function FlashPointEinstellungenPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <FlashPointSettingsView />
    </main>
  );
}
