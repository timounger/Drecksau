/**
 * Scotland Yard settings page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { ScotlandYardSettingsView } from "@/games/scotland-yard/components/settings-view";

export const metadata: Metadata = {
  title: "Scotland Yard - Einstellungen",
  description:
    "Deine Seite, die Spielerzahl und die Variante gegen den Computer.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function ScotlandYardEinstellungenPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <ScotlandYardSettingsView />
    </main>
  );
}
