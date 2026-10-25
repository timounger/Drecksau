/**
 * A puzzle as a printed page: number, title, part, the text and its pictures,
 * and the solution on a page of its own after it - to print, or to save as a
 * PDF from the browser's print dialog.
 *
 * @module
 */
"use client";

import type { ReactElement } from "react";
import { PrintHeader, PrintSheet } from "@/components/print-sheet";
import { byId } from "@/games/sherlock/engine/puzzles";
import {
  Paragraphs,
  PuzzleImages,
} from "@/games/sherlock/components/puzzle-parts";
import {
  SHERLOCK_TEXTS as T,
  partLabel,
  titleOf,
} from "@/games/sherlock/i18n/texts";

/** How wide a picture may be on paper at most. */
const IMAGE_MAX_WIDTH = "150mm";

/** The look of a section heading. */
const HEADING = "text-[10px] font-bold tracking-widest text-zinc-500 uppercase";

/**
 * The printed pages of one puzzle. Opens the print dialog once drawn.
 *
 * @param props - the puzzle's id
 * @returns the pages, or nothing for an unknown puzzle
 */
export function PuzzlePrintSheet({
  id,
}: {
  readonly id: string;
}): ReactElement | null {
  const puzzle = byId(id);
  return puzzle === null ? null : (
    <PrintSheet testId="sherlock-print-sheet">
      <PrintHeader
        game={T.title}
        label={`${T.number(puzzle.number)} · ${partLabel(puzzle.part)}`}
        title={titleOf(puzzle)}
        story={`${T.original}: ${puzzle.original}`}
      />
      {puzzle.english === true && (
        <p className="self-start rounded border border-zinc-300 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
          {T.englishNote}
        </p>
      )}
      <Paragraphs lines={puzzle.text} className="text-[13px] leading-relaxed" />
      {puzzle.images !== undefined && puzzle.images.length > 0 && (
        <PuzzleImages images={puzzle.images} maxWidth={IMAGE_MAX_WIDTH} />
      )}
      {/* The solution on a page of its own, so the puzzle can be handed out
          without it. */}
      <section
        className="flex break-before-page flex-col gap-2 border-t-2 border-zinc-900 pt-2 print:border-t-0 print:pt-0"
        data-testid="sherlock-print-solution"
      >
        <span className={HEADING}>{`${T.title} · ${titleOf(puzzle)}`}</span>
        <h2 className="text-xl font-extrabold">{T.solution}</h2>
        <Paragraphs
          lines={puzzle.solution}
          className="text-[13px] leading-relaxed"
        />
      </section>
    </PrintSheet>
  );
}
