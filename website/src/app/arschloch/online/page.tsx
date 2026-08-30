/**
 * Online Arschloch page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { ArschlochOnlineScreen } from "@/games/arschloch/components/arschloch-online";

export const metadata: Metadata = {
  title: "Arschloch - Online",
  description: "Arschloch online gegen andere spielen.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function ArschlochOnlinePage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <ArschlochOnlineScreen />
    </main>
  );
}
