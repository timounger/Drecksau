/**
 * Kniffel - Einstellungen page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { KniffelSettingsView } from "@/games/kniffel/components/settings-view";

export const metadata: Metadata = {
  title: "Kniffel - Einstellungen",
  description: "Wie viele einen Block ausfüllen.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function Page(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <KniffelSettingsView />
    </main>
  );
}
