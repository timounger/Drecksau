/**
 * "RV There Yet?" online co-op page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { RvThereYetOnlineScreen } from "@/games/rv-there-yet/components/rv-there-yet-online";

export const metadata: Metadata = {
  title: "RV There Yet? - Online spielen",
  description:
    "Zu zweit ein Wohnmobil über den Berg - einer lenkt, einer bedient die Seilwinde.",
};

/**
 * Renders the "RV There Yet?" online co-op page.
 *
 * @returns the page element
 */
export default function OnlinePage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <RvThereYetOnlineScreen />
    </main>
  );
}
