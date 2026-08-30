/**
 * Arschloch - das Spiel gegen den Computer beginnt hier.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { ArschlochScreen } from "@/games/arschloch/components/arschloch-game";

export const metadata: Metadata = {
  title: "Arschloch",
  description: "Das Kartenspiel Arschloch mit Skatkarten gegen den Computer.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function ArschlochPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <ArschlochScreen />
    </main>
  );
}
