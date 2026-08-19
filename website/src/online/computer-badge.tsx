/**
 * The mark on a seat the computer took over.
 *
 * @module
 * @remarks
 * When somebody closes the tab, the host keeps their seat playing rather than
 * letting the table stall - see the auto-play timer in `use-online-room`. The
 * others need to know that, and for two different reasons: so a seat that keeps
 * playing instantly is not mistaken for a rude human, and so nobody waits for a
 * chat reply from a browser that is gone.
 *
 * Kept here rather than in each game because it means the same thing at every
 * table, and a mark that looked different from one game to the next would have
 * to be learnt twice.
 */
import type { ReactElement } from "react";

/** German label of the badge. */
const LABEL = "Computer";

/**
 * A small pill saying this seat is being played by the computer.
 *
 * @returns the badge element
 */
export function ComputerBadge(): ReactElement {
  return (
    <span
      data-testid="computer-badge"
      title="Der Spieler hat den Tisch verlassen - der Computer spielt weiter."
      className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
    >
      {"\u{1F916}"} {LABEL}
    </span>
  );
}
