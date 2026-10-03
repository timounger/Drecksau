/**
 * Die Online-Seite von "U-Boot": der Endlosmodus zu zweit.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { UbootOnline } from "@/games/uboot/components/uboot-online";

export const metadata: Metadata = {
  title: "U-Boot - Online spielen",
  description:
    "Der Endlosmodus von U-Boot im Koop: zu zweit per Raumcode so tief wie möglich.",
};

/**
 * Rendert die Online-Seite.
 *
 * @returns die Seite
 */
export default function OnlinePage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <UbootOnline />
    </main>
  );
}
