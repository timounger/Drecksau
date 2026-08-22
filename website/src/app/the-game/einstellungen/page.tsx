/**
 * The Game settings page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { TheGameSettingsView } from "@/games/the-game/components/settings-view";

export const metadata: Metadata = {
  title: "The Game - Einstellungen",
  description: "Wie viele mitspielen und wie schwer es sein soll.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function TheGameEinstellungenPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <TheGameSettingsView />
    </main>
  );
}
