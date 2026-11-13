/**
 * IMPERAVIS game page.
 *
 * @module
 */
import type { Metadata } from "next";
import { Cinzel } from "next/font/google";
import type { ReactElement } from "react";
import { ImperavisGame } from "@/games/imperavis/components/imperavis-game";

/** The engraved capitals of the game's headings, loaded only on this page. */
const display = Cinzel({
  variable: "--font-imp-display",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "IMPERAVIS",
  description:
    "Inseln besiedeln, Produktionsketten aufbauen, Bürger versorgen und mit Schiffen Handel treiben - eine Aufbau- und Wirtschaftssimulation in 3D.",
};

/**
 * Renders the IMPERAVIS game page.
 *
 * @returns the page element
 */
export default function ImperavisPage(): ReactElement {
  return (
    <main
      className={`${display.variable} flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950`}
    >
      <ImperavisGame />
    </main>
  );
}
