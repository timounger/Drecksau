/**
 * Arschloch settings page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { ArschlochSettingsView } from "@/games/arschloch/components/settings-view";

export const metadata: Metadata = {
  title: "Arschloch - Einstellungen",
  description: "Wie viele mitspielen und ueber wie viele Runden.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function ArschlochEinstellungenPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <ArschlochSettingsView />
    </main>
  );
}
