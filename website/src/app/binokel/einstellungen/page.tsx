/**
 * Binokel settings page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { BinokelSettingsView } from "@/games/binokel/components/binokel-settings-view";

export const metadata: Metadata = {
  title: "Binokel - Einstellungen",
  description: "Mit oder ohne Siebener und weitere Binokel-Einstellungen.",
};

/**
 * Renders the Binokel settings page.
 *
 * @returns the page element
 */
export default function BinokelEinstellungenPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <BinokelSettingsView />
    </main>
  );
}
