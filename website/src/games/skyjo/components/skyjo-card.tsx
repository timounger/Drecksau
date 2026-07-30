/**
 * A single Skyjo card, face up, face down or cleared.
 *
 * @module
 * @remarks
 * The colours follow the printed cards: the deeper the blue the better the
 * card, the redder the worse. Nobody has to read the number to see how a
 * layout is doing - which is exactly how the real game reads across the table.
 */
import type { ReactElement } from "react";
import type { Slot } from "@/games/skyjo/engine/state";

/** The colour band a value falls into, worst last. */
const BANDS: readonly { readonly upTo: number; readonly className: string }[] =
  [
    { upTo: -1, className: "bg-blue-800 text-white border-blue-900" },
    { upTo: 0, className: "bg-sky-400 text-sky-950 border-sky-500" },
    { upTo: 4, className: "bg-green-500 text-green-950 border-green-600" },
    { upTo: 8, className: "bg-yellow-400 text-yellow-950 border-yellow-500" },
    { upTo: Infinity, className: "bg-red-500 text-white border-red-600" },
  ];

/** How a card is drawn. */
export type CardSize = "small" | "large";

/** Size classes per variant: the own layout is bigger than the opponents'. */
const SIZES: Readonly<Record<CardSize, string>> = {
  small: "h-9 w-7 text-xs sm:h-11 sm:w-8 sm:text-sm",
  large: "h-14 w-11 text-base sm:h-16 sm:w-12 sm:text-lg",
};

/** Props of {@link SkyjoCard}. */
export type SkyjoCardProps = {
  readonly slot: Slot;
  readonly size?: CardSize;
  /** Whether this card can be clicked right now. */
  readonly selectable?: boolean;
  readonly onSelect?: () => void;
  /** Marks the card as the one just played, for a short highlight. */
  readonly highlighted?: boolean;
};

/**
 * Renders one card of a layout.
 *
 * @param props - the slot and how it may be used
 * @returns the card element
 */
export function SkyjoCard({
  slot,
  size = "small",
  selectable = false,
  onSelect,
  highlighted = false,
}: SkyjoCardProps): ReactElement {
  const base = `flex items-center justify-center rounded-md border-2 font-bold tabular-nums transition ${SIZES[size]}`;

  if (slot.state === "gone") {
    return (
      <span
        aria-label="abgeraeumt"
        className={`${base} border-dashed border-zinc-300 bg-transparent text-transparent dark:border-zinc-700`}
      />
    );
  }

  const face =
    slot.state === "down"
      ? "border-zinc-400 bg-zinc-300 text-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-500"
      : bandFor(slot.value);
  const ring = highlighted ? " ring-2 ring-indigo-500 ring-offset-1" : "";

  if (!selectable) {
    return (
      <span className={`${base} ${face}${ring}`}>
        {slot.state === "down" ? "?" : slot.value}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`${base} ${face}${ring} cursor-pointer hover:scale-105 hover:ring-2 hover:ring-indigo-400`}
    >
      {slot.state === "down" ? "?" : slot.value}
    </button>
  );
}

/**
 * A loose card, such as the pile tops or the card in hand.
 *
 * @param props - the value to show, or null for an empty pile
 * @returns the card element
 */
export function LooseCard({
  value,
  size = "large",
}: {
  readonly value: number | null;
  readonly size?: CardSize;
}): ReactElement {
  return value === null ? (
    <span
      className={`flex items-center justify-center rounded-md border-2 border-dashed border-zinc-300 text-xs text-zinc-400 dark:border-zinc-700 ${SIZES[size]}`}
    >
      –
    </span>
  ) : (
    <SkyjoCard slot={{ state: "up", value }} size={size} />
  );
}

/** The colour classes for a face-up value. */
function bandFor(value: number): string {
  return (
    BANDS.find((band) => value <= band.upTo)?.className ??
    BANDS[BANDS.length - 1].className
  );
}
