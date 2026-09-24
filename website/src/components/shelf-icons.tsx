/**
 * One drawn sign per shelf of the collection.
 *
 * @module
 * @remarks
 * **Drawn rather than taken from the emoji set**, for the reason the avatars
 * are: an emoji is a different picture on every system - a die that is a cube
 * here and a flat square there - and five signs that do not look like one set
 * are worse than no signs at all. These are five strokes of the same pen, in
 * the same box, in the colour of whatever text they sit beside.
 *
 * Which shelf gets which is the view's business and not the register's: the
 * register says what a category is called, this says what it looks like.
 */
import type { ReactElement } from "react";

/** The shared look of every sign: the same box, the same stroke. */
const ICON = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

/**
 * The sign belonging to one shelf.
 *
 * @param props - the shelf's id and how big to draw it
 * @returns the drawing, or nothing for a shelf that has none
 * @remarks
 * Nothing rather than a fallback shape: a sign that means "no sign" is one
 * more thing to read, and a heading is perfectly good on its own.
 */
export function ShelfIcon({
  id,
  size = "h-4 w-4",
}: {
  readonly id: string;
  readonly size?: string;
}): ReactElement | null {
  const draw = SIGNS[id];
  return draw === undefined ? null : (
    <svg {...ICON} className={`${size} shrink-0`}>
      {draw}
    </svg>
  );
}

/**
 * What each shelf is drawn as.
 *
 * @remarks
 * - **Kartenspiele**: two playing cards, the back one leaning out - one card
 *   alone reads as a sheet of paper - with a zigzag on the front one for a
 *   pip. Anything finer is a smudge at fourteen pixels.
 * - **Würfelspiele**: a die showing the three, its dots **filled** rather than
 *   stroked: a dot drawn as a stroke of no length is a dot that disappears
 *   when the chips draw it small.
 * - **Gemeinsam gegen das Spiel**: two figures side by side, the one thing
 *   that says "together" without a word.
 * - **Wort und Party**: a speech bubble.
 * - **Action und Taktik**: a target, which is both halves of that shelf at
 *   once - something to aim at and something to plan for.
 * - **Beliebt**: a flame, the same one every shop puts on its bestseller.
 * - **Neu**: a spark.
 */
const SIGNS: Readonly<Record<string, ReactElement>> = {
  karten: (
    <>
      <rect x="10" y="4" width="10" height="16" rx="2" />
      <path d="M7.4 6.6 4.6 16a2 2 0 0 0 1.4 2.5l1.6.4" />
      <path d="M15 8.6 13.4 12h2.9l-1.3 3.4" />
    </>
  ),
  wuerfel: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <circle cx="8.4" cy="8.4" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="15.6" cy="15.6" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  gemeinsam: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.5a3 3 0 0 1 0 5" />
      <path d="M17.5 14.2a5.5 5.5 0 0 1 3 4.8" />
    </>
  ),
  wort: (
    <>
      <path d="M20 14a3 3 0 0 1-3 3H9l-4 3v-3a3 3 0 0 1-1-2.2V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3Z" />
      <path d="M8.5 10.5h7M8.5 13.5h4" />
    </>
  ),
  action: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22" />
    </>
  ),
  beliebt: (
    <path d="M12 3s5 3.6 5 8a5 5 0 0 1-10 0c0-1.4.6-2.6 1.4-3.6.3 1 .9 1.8 1.6 2.2 0-2.6.9-5 2-6.6Z" />
  ),
  neu: (
    <>
      <path d="M12 3.5 13.6 9l5.4 1.6-5.4 1.7L12 17.5 10.4 12.3 5 10.6 10.4 9Z" />
      <path d="M18 16.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7Z" />
    </>
  ),
};
