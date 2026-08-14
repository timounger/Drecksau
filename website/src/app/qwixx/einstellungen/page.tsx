/**
 * Qwixx settings page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { QwixxSettingsView } from "@/games/qwixx/components/settings-view";

export const metadata: Metadata = {
  title: "Qwixx - Einstellungen",
  description: "Wie viele mitwürfeln.",
};

/**
 * Renders the settings page.
 *
 * @returns the page element
 */
export default function QwixxEinstellungenPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <QwixxSettingsView />
    </main>
  );
}
