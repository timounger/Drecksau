/**
 * The Sherlock Holmes puzzle collection on screen: the list of puzzles, and a
 * puzzle with its text, pictures, solution and clock.
 *
 * @module
 */
"use client";

import Link from "next/link";
import { useEffect, useState, type ReactElement } from "react";
import { GameHeader } from "@/components/game-header";
import { neighbours } from "@/games/sherlock/engine/puzzles";
import type { Puzzle } from "@/games/sherlock/engine/types";
import {
  LIST_MEMORY,
  PartBadge,
  keepScroll,
  usePuzzleFilter,
} from "@/games/sherlock/components/puzzle-filter";
import { PuzzleImages } from "@/games/sherlock/components/puzzle-parts";
import {
  ReadableParagraphs,
  SpeakButtons,
  SpeechSettings,
  isReadingWhole,
} from "@/games/sherlock/components/read-aloud-controls";
import {
  puzzleSegments,
  solutionSegments,
} from "@/games/sherlock/engine/read-aloud";
import { useReadAloud } from "@/games/sherlock/hooks/use-read-aloud";
import {
  useSherlock,
  type SherlockApi,
} from "@/games/sherlock/hooks/use-sherlock";
import { SHERLOCK_RULES } from "@/games/sherlock/i18n/rules";
import { SHERLOCK_TEXTS as T, titleOf } from "@/games/sherlock/i18n/texts";

/** A thousand, for milliseconds. */
const SECOND = 1000;

/** Sixty, for minutes. */
const MINUTE = 60;

/** How often the clock is redrawn, in milliseconds. */
const CLOCK_TICK_MS = 1000;

/** How wide a picture may be on screen at most. */
const IMAGE_MAX_WIDTH = "36rem";

/** A block read whole (the title) while it is read. */
const READING_WHOLE = "bg-yellow-200 dark:bg-yellow-600/60";

/** The look of a secondary button. */
const BUTTON =
  "cursor-pointer rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800";

/** The arrows beside the way back to the list. */
const STEP_BUTTON =
  "cursor-pointer rounded-full border border-amber-300 bg-white/80 px-2.5 py-1 text-sm font-bold text-amber-900 hover:bg-white disabled:cursor-default disabled:opacity-40 dark:border-amber-800 dark:bg-zinc-900/60 dark:text-amber-100 dark:hover:bg-zinc-900";

/**
 * The whole game.
 *
 * @returns the list of puzzles, or the open puzzle
 */
export function SherlockGame(): ReactElement {
  const game = useSherlock();
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4">
      <GameHeader rules={SHERLOCK_RULES} title={T.title} subtitle={T.subtitle}>
        <Link
          href="/sherlock/statistik"
          data-testid="sherlock-stats-link"
          className={BUTTON}
        >
          {T.statistics}
        </Link>
      </GameHeader>
      {game.puzzle === null ? (
        <PuzzleList game={game} />
      ) : (
        <PuzzleView key={game.puzzle.id} game={game} puzzle={game.puzzle} />
      )}
    </div>
  );
}

/**
 * A time as the clock shows it.
 *
 * @param ms - the time
 * @returns "4:07", or "1:04:07" from an hour on
 */
export function clockText(ms: number): string {
  const seconds = Math.floor(ms / SECOND);
  const minutes = Math.floor(seconds / MINUTE);
  const hours = Math.floor(minutes / MINUTE);
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours > 0
    ? `${String(hours)}:${pad(minutes % MINUTE)}:${pad(seconds % MINUTE)}`
    : `${String(minutes)}:${pad(seconds % MINUTE)}`;
}

/** The puzzles, with the search and the filters over them. */
function PuzzleList({ game }: { readonly game: SherlockApi }): ReactElement {
  const { controls, shown } = usePuzzleFilter(game.solved);
  // Back to where the list was left, once it is drawn.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() =>
      window.scrollTo(0, LIST_MEMORY.current.scroll),
    );
    return () => window.cancelAnimationFrame(frame);
  }, []);
  return (
    <section className="flex flex-col gap-3" data-testid="sherlock-list">
      <h2 className="text-lg font-bold">{T.choosePuzzle}</h2>
      {controls}
      {shown.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {T.noPuzzles}
        </p>
      )}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((puzzle) => (
          <li key={puzzle.id}>
            <PuzzleTile game={game} puzzle={puzzle} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** One puzzle in the list. */
function PuzzleTile({
  game,
  puzzle,
}: {
  readonly game: SherlockApi;
  readonly puzzle: Puzzle;
}): ReactElement {
  const solved = game.solved.has(puzzle.id);
  return (
    <button
      type="button"
      data-testid={`sherlock-puzzle-${puzzle.id}`}
      onClick={() => {
        keepScroll();
        game.open(puzzle.id);
      }}
      className="flex h-full w-full cursor-pointer flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-4 text-left shadow-sm hover:border-amber-400 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <span className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <span className="flex min-w-0 flex-col">
          <span className="text-base font-bold">{titleOf(puzzle)}</span>
          <span className="text-xs text-zinc-500 italic dark:text-zinc-400">
            {puzzle.original}
          </span>
        </span>
        <PartBadge part={puzzle.part} />
      </span>
      <span className="line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">
        {puzzle.text[0] ?? ""}
      </span>
      <span className="mt-auto flex flex-wrap items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
        {solved
          ? `✓ ${T.solved}`
          : game.begun.has(puzzle.id)
            ? T.resume
            : T.open}
        {puzzle.english === true && (
          <span className="rounded bg-zinc-100 px-1.5 text-[11px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            EN
          </span>
        )}
        {(puzzle.images?.length ?? 0) > 0 && (
          <span aria-hidden="true" className="text-xs">
            {"\u{1F5BC}️"}
          </span>
        )}
      </span>
    </button>
  );
}

/** One open puzzle. */
function PuzzleView({
  game,
  puzzle,
}: {
  readonly game: SherlockApi;
  readonly puzzle: Puzzle;
}): ReactElement {
  const [before, after] = neighbours(puzzle);
  const solved = game.solved.has(puzzle.id);
  // Keyed by the puzzle: another puzzle or the list unmounts this view, and
  // the reader falls silent with it.
  const reader = useReadAloud();
  const puzzleParts = puzzleSegments(puzzle);
  const solutionParts = solutionSegments(puzzle);
  const titleRead = isReadingWhole(reader, "title");
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2
            className={`rounded-md text-xl font-bold transition-colors duration-150 ${
              titleRead ? READING_WHOLE : ""
            }`}
            data-testid="sherlock-title"
            data-reading={titleRead ? "true" : undefined}
          >
            {titleOf(puzzle)}
          </h2>
          <PartBadge part={puzzle.part} />
          {solved && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
              {`✓ ${T.solved}`}
            </span>
          )}
        </div>
        <span
          className="text-sm text-zinc-500 italic dark:text-zinc-400"
          data-testid="sherlock-original"
        >
          {`${T.original}: ${puzzle.original}`}
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-2 text-sm dark:border-amber-900 dark:bg-amber-950/40">
        <PuzzleClock game={game} />
        <span className="flex items-center gap-1">
          <button
            type="button"
            data-testid="sherlock-previous"
            aria-label={T.previous}
            title={before === undefined ? T.previous : titleOf(before)}
            disabled={before === undefined}
            onClick={() => before !== undefined && game.open(before.id)}
            className={STEP_BUTTON}
          >
            {"←"}
          </button>
          <button
            type="button"
            data-testid="sherlock-next"
            aria-label={T.next}
            title={after === undefined ? T.next : titleOf(after)}
            disabled={after === undefined}
            onClick={() => after !== undefined && game.open(after.id)}
            className={STEP_BUTTON}
          >
            {"→"}
          </button>
          <button
            type="button"
            data-testid="sherlock-to-list"
            onClick={game.toList}
            className="cursor-pointer rounded-full border border-amber-300 bg-white/80 px-3 py-1 text-sm font-semibold text-amber-900 hover:bg-white dark:border-amber-800 dark:bg-zinc-900/60 dark:text-amber-100 dark:hover:bg-zinc-900"
          >
            {T.toList}
          </button>
        </span>
      </div>

      {reader.supported && (
        <div
          className="flex flex-wrap items-start gap-2"
          data-testid="sherlock-reader"
        >
          <SpeakButtons
            reader={reader}
            target="puzzle"
            label={T.speak}
            segments={() => puzzleParts}
          />
          <SpeechSettings reader={reader} />
        </div>
      )}

      <article className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {puzzle.english === true && (
          <p
            data-testid="sherlock-english"
            className="self-start rounded-lg bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-800 dark:bg-sky-950/50 dark:text-sky-200"
          >
            {T.englishNote}
          </p>
        )}
        <ReadableParagraphs
          reader={reader}
          segments={puzzleParts}
          testId="sherlock-text"
          className="text-[15px] leading-relaxed"
        />
        {puzzle.images !== undefined && puzzle.images.length > 0 && (
          <PuzzleImages
            images={puzzle.images}
            maxWidth={IMAGE_MAX_WIDTH}
            reading={puzzle.images.findIndex((unused, at) =>
              isReadingWhole(reader, `image-${String(at)}`),
            )}
          />
        )}
      </article>

      <div className="flex flex-wrap gap-2">
        <RevealButton
          game={game}
          onHide={() => {
            if (reader.target === "solution") {
              reader.stop();
            }
            game.hideSolution();
          }}
        />
        <button
          type="button"
          data-testid="sherlock-solved"
          aria-pressed={solved}
          title={solved ? T.markUnsolvedTitle : T.markSolvedTitle}
          onClick={game.toggleSolved}
          className={
            solved
              ? "cursor-pointer rounded-lg border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
              : "cursor-pointer rounded-lg border border-emerald-600 px-3 py-1.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/50"
          }
        >
          {solved ? `✓ ${T.markSolved}` : T.markSolved}
        </button>
        {/* The puzzle as a page, in a tab of its own - printed or saved as a
            PDF from there. */}
        <Link
          href={`/sherlock/drucken/${puzzle.id}/`}
          target="_blank"
          rel="noopener"
          prefetch={false}
          data-testid="sherlock-print"
          title={T.printTitle}
          className={BUTTON}
        >
          {T.print}
        </Link>
      </div>

      {game.peeking && (
        <section
          className="flex flex-col gap-2 rounded-2xl border border-amber-400 bg-amber-50 p-4 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100"
          data-testid="sherlock-solution"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3
              className={`rounded-md font-bold transition-colors duration-150 ${
                isReadingWhole(reader, "solution-title") ? READING_WHOLE : ""
              }`}
            >
              {T.solution}
            </h3>
            <span className="flex flex-wrap gap-2">
              <SpeakButtons
                reader={reader}
                target="solution"
                label={T.speakSolution}
                segments={() => solutionParts}
              />
            </span>
          </div>
          <ReadableParagraphs
            reader={reader}
            segments={solutionParts}
            testId="sherlock-solution-text"
            className="text-[15px] leading-relaxed"
          />
        </section>
      )}
    </div>
  );
}

/**
 * "Lösung ansehen" and "Lösung ausblenden" - the solution shows at once,
 * no question asked.
 */
function RevealButton({
  game,
  onHide,
}: {
  readonly game: SherlockApi;
  /** Puts the solution away - and stops reading it out. */
  readonly onHide: () => void;
}): ReactElement {
  return (
    <button
      type="button"
      data-testid="sherlock-reveal"
      onClick={game.peeking ? onHide : game.reveal}
      className={
        game.peeking
          ? "cursor-pointer rounded-lg border border-amber-400 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-900 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-200"
          : BUTTON
      }
    >
      {game.peeking ? T.hideSolution : T.reveal}
    </button>
  );
}

/**
 * How long the puzzle has been worked on - running while it is open,
 * standing still once it is solved.
 */
function PuzzleClock({ game }: { readonly game: SherlockApi }): ReactElement {
  const [, setTick] = useState(0);
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    if (game.running) {
      const timer = window.setInterval(
        () => setTick((one) => one + 1),
        CLOCK_TICK_MS,
      );
      cleanup = () => window.clearInterval(timer);
    }
    return cleanup;
  }, [game.running]);
  return (
    <span
      data-testid="sherlock-clock"
      title={T.clockTitle}
      className="shrink-0 rounded-full bg-white/80 px-3 py-1 font-mono text-sm font-bold text-amber-900 tabular-nums dark:bg-zinc-900/60 dark:text-amber-100"
    >
      {`⏱ ${clockText(game.elapsed())}`}
    </span>
  );
}
