/**
 * Wurfduell - Einstellungen page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { WurfduellSettingsView } from "@/games/wurfduell/components/settings-view";

export const metadata: Metadata = {
  title: "Wurfduell - Einstellungen",
  description: "Computer-Gegner, Ton, Kamera und Zielhilfe im Wurfduell.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function Page(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <WurfduellSettingsView />
    </main>
  );
}
