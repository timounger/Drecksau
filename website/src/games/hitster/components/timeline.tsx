/**
 * A timeline: the song cards of one player, oldest first, with the gaps
 * between them to put a new card in.
 *
 * @module
 */
"use client";

import type { ReactElement } from "react";
import { SONGS } from "@/games/hitster/engine/songs";

/** A token or card marked in a gap. */
export type GapMark = {
  readonly slot: number;
  readonly label: string;
  readonly tone: "placed" | "challenge";
};

/** The colour of a card by its decade - the box prints them in colours too. */
const DECADE_COLOURS: readonly string[] = [
  "bg-rose-200 text-rose-950",
  "bg-orange-200 text-orange-950",
  "bg-amber-200 text-amber-950",
  "bg-lime-200 text-lime-950",
  "bg-emerald-200 text-emerald-950",
  "bg-cyan-200 text-cyan-950",
  "bg-sky-200 text-sky-950",
  "bg-violet-200 text-violet-950",
];

/** The first decade the colours start from. */
const FIRST_DECADE = 1950;

/** Years in a decade. */
const DECADE = 10;

/**
 * Renders a timeline.
 *
 * @param props - the songs, which gaps can be tapped, and what is marked
 * @returns the row of cards and gaps
 */
export function Timeline({
  songs,
  pickable,
  onPick,
  marks,
  compact = false,
}: {
  readonly songs: readonly number[];
  /** The gaps a tap goes to; none when nothing is to be picked. */
  readonly pickable: readonly number[];
  readonly onPick: (slot: number) => void;
  readonly marks: readonly GapMark[];
  readonly compact?: boolean;
}): ReactElement {
  const gap = (slot: number) => {
    const here = marks.filter((one) => one.slot === slot);
    const open = pickable.includes(slot);
    return (
      <div
        key={`gap-${String(slot)}`}
        className="flex shrink-0 flex-col items-center justify-center gap-1"
      >
        {open && (
          <button
            type="button"
            data-testid={`hit-slot-${String(slot)}`}
            onClick={() => onPick(slot)}
            className="flex h-16 w-9 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-fuchsia-500 text-xl font-bold text-fuchsia-600 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950/40"
            aria-label={`Lücke ${String(slot + 1)}`}
          >
            +
          </button>
        )}
        {here.map((mark) => (
          <span
            key={`${mark.tone}-${mark.label}`}
            className={`max-w-20 truncate rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              mark.tone === "placed"
                ? "bg-fuchsia-600 text-white"
                : "bg-amber-400 text-amber-950"
            }`}
          >
            {mark.label}
          </span>
        ))}
        {!open && here.length === 0 && <span className="w-1" />}
      </div>
    );
  };
  return (
    <div className="flex items-stretch gap-1 overflow-x-auto pb-1">
      {gap(0)}
      {songs.map((song, index) => (
        <div key={song} className="flex items-stretch gap-1">
          <SongCard song={song} compact={compact} />
          {gap(index + 1)}
        </div>
      ))}
    </div>
  );
}

/**
 * One song card, year up.
 *
 * @param props - the song, and whether to draw it small
 * @returns the card
 */
export function SongCard({
  song,
  compact = false,
}: {
  readonly song: number;
  readonly compact?: boolean;
}): ReactElement {
  const one = SONGS[song];
  const year = one?.year ?? 0;
  const colour =
    DECADE_COLOURS[
      Math.min(
        DECADE_COLOURS.length - 1,
        Math.max(0, Math.floor((year - FIRST_DECADE) / DECADE)),
      )
    ];
  return (
    <div
      className={`flex shrink-0 flex-col items-center justify-center rounded-lg text-center shadow-sm ${colour} ${
        compact ? "h-14 w-16 px-1" : "h-24 w-28 px-1.5"
      }`}
      title={one === undefined ? undefined : `${one.artist} - ${one.title}`}
    >
      <span className={`font-black ${compact ? "text-base" : "text-2xl"}`}>
        {year}
      </span>
      {!compact && one !== undefined && (
        <>
          <span className="line-clamp-1 text-[10px] font-semibold">
            {one.artist}
          </span>
          <span className="line-clamp-2 text-[10px] leading-tight">
            {one.title}
          </span>
        </>
      )}
    </div>
  );
}
