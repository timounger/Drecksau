/**
 * Dog settings page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { DogSettingsView } from "@/games/dog/components/settings-view";

export const metadata: Metadata = {
  title: "Dog - Einstellungen",
  description: "Name am Brett und Tempo der Mitspieler.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function DogEinstellungenPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <DogSettingsView />
    </main>
  );
}
