/**
 * The Mind - Einstellungen page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { MindSettingsView } from "@/games/the-mind/components/settings-view";

export const metadata: Metadata = {
  title: "The Mind - Einstellungen",
  description: "Wie viele gemeinsam schweigen.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function Page(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <MindSettingsView />
    </main>
  );
}
