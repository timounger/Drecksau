/**
 * Sky Team online - two seats, two devices, one landing.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { SkyTeamOnlineScreen } from "@/games/sky-team/components/sky-team-online";

export const metadata: Metadata = {
  title: "Sky Team online",
  description: "Landet das Flugzeug zu zweit - jede:r am eigenen Gerät.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function SkyTeamOnlinePage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <SkyTeamOnlineScreen />
    </main>
  );
}
