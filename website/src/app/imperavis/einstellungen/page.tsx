/**
 * IMPERAVIS - Einstellungen page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { ImperavisSettingsView } from "@/games/imperavis/components/settings-view";

export const metadata: Metadata = {
  title: "IMPERAVIS - Einstellungen",
  description:
    "Ton, Schatten, Wettereffekte, automatisches Speichern und Starttempo in IMPERAVIS.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function Page(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <ImperavisSettingsView />
    </main>
  );
}
