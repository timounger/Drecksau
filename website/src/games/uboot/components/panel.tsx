/**
 * Die Unterseiten, die im Spielfenster selbst aufgehen.
 *
 * @module
 * @remarks
 * Werkstatt, Enzyklopädie und Erfolge sind keine eigenen Seiten, sondern
 * Blätter, die über der Seekarte aufgehen: Es gibt nur ein Fenster, und alles
 * passiert darin.
 *
 * Die Kopfzeile ist für alle drei dieselbe und immer gleich belegt: **links
 * der Weg zurück**, in der Mitte, worauf man schaut, **rechts die Werkzeuge**
 * des Blattes. Ein Zurück, das mal links und mal rechts steht, ist eines, das
 * man jedes Mal suchen muss.
 */
"use client";

import type { ReactElement, ReactNode } from "react";
import { UBOOT_TEXTS } from "@/games/uboot/i18n/texts";

/** Which sheet is open, if any. */
export type PanelKind = "upgrades" | "encyclopedia" | "trophies" | "settings";

/** Props of {@link Panel}. */
export type PanelProps = {
  /** One character for the heading. */
  readonly icon: string;
  readonly title: string;
  /** The way back to the chart. */
  readonly onClose: () => void;
  /** What belongs to this sheet alone, on the right of the heading. */
  readonly tools?: ReactNode;
  readonly children: ReactNode;
};

/**
 * Renders a sheet over the game window.
 *
 * @param props - what it is called, what is on it and what it brings along
 * @returns the sheet element
 */
export function Panel({
  icon,
  title,
  onClose,
  tools,
  children,
}: PanelProps): ReactElement {
  return (
    <div
      data-testid="uboot-panel"
      className="absolute inset-0 z-40 flex flex-col rounded-2xl bg-zinc-50 dark:bg-zinc-950"
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
        <button
          type="button"
          data-testid="uboot-panel-close"
          onClick={onClose}
          className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-1 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {"←"} {UBOOT_TEXTS.back2}
        </button>
        <span aria-hidden="true" className="ml-1 text-xl">
          {icon}
        </span>
        <h2 className="mr-auto text-lg font-bold">{title}</h2>
        {tools}
      </div>
      {/* The window is a fixed size, so anything longer than it scrolls inside
          rather than pushing the frame about. */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3">{children}</div>
    </div>
  );
}
