/**
 * Choosing a puzzle: the search, the chips of the book's parts, "Gelöste
 * ausblenden" and the label of a part - with the choices kept in the browser.
 *
 * @module
 */
"use client";

import { useEffect, useState, type ReactElement } from "react";
import { PART_ORDER, PUZZLES } from "@/games/sherlock/engine/puzzles";
import type { Part, Puzzle } from "@/games/sherlock/engine/types";
import { SHERLOCK_TEXTS as T, partLabel } from "@/games/sherlock/i18n/texts";
import { readStored, storageKey, writeStored } from "@/lib/storage/local-store";

/** The colour of each part's label. */
const PART_BADGE: Readonly<Record<Part, string>> = {
  elementary:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  straightforward: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
  cunning: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  fiendish: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
};

/** A chosen part chip, in its part's colour. */
const PART_CHIP: Readonly<Record<Part | "all", string>> = {
  all: "border-zinc-800 bg-zinc-800 text-white dark:border-zinc-200 dark:bg-zinc-200 dark:text-zinc-900",
  elementary: "border-emerald-700 bg-emerald-700 text-white",
  straightforward: "border-sky-700 bg-sky-700 text-white",
  cunning: "border-amber-700 bg-amber-700 text-white",
  fiendish: "border-rose-700 bg-rose-700 text-white",
};

/** The look of a chip that is not chosen. */
const CHIP_OFF =
  "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800";

/** The choices in the list's filters. */
export type ListChoices = {
  readonly part: Part | "all";
  readonly query: string;
  readonly hideSolved: boolean;
};

/** The list's filters and where it was scrolled to, kept while a puzzle is open. */
type ListMemory = ListChoices & { readonly scroll: number };

/** Where the list's choices are kept in this browser, and their version. */
const CHOICES_KEY = storageKey("sherlock", "list");
const CHOICES_VERSION = 1;

/**
 * The list's memory for this visit of the page: back from a puzzle, the list
 * is as it was left - same filters, same place.
 */
export const LIST_MEMORY: { current: ListMemory } = {
  current: { part: "all", query: "", hideSolved: false, scroll: 0 },
};

/**
 * The label of a part, in its colour and with its magnifying glasses.
 *
 * @param props - the part
 * @returns the label
 */
export function PartBadge({ part }: { readonly part: Part }): ReactElement {
  return (
    <span
      data-testid="sherlock-part"
      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${PART_BADGE[part]}`}
    >
      {partLabel(part)}
    </span>
  );
}

/**
 * Keeps where the list is scrolled to, as a puzzle is opened from it.
 */
export function keepScroll(): void {
  LIST_MEMORY.current = { ...LIST_MEMORY.current, scroll: window.scrollY };
}

/**
 * The filters over the puzzles - search, part and "Gelöste ausblenden" - and
 * the puzzles they let through, by number. The search looks at the German
 * title, the English original and the text.
 *
 * @param solved - the puzzles solved here, for "Gelöste ausblenden"
 * @returns the filter controls and the puzzles to show
 */
export function usePuzzleFilter(solved: ReadonlySet<string>): {
  readonly controls: ReactElement;
  readonly shown: readonly Puzzle[];
} {
  const memory = LIST_MEMORY.current;
  const [part, setPart] = useState<Part | "all">(memory.part);
  const [query, setQuery] = useState(memory.query);
  const [hideSolved, setHideSolved] = useState(memory.hideSolved);
  // The saved choices only after the first drawing: the page the server sent
  // knows nothing of this browser.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const saved = readStored(CHOICES_KEY, CHOICES_VERSION, isChoices);
    if (saved !== null) {
      setPart(saved.part);
      setQuery(saved.query);
      setHideSolved(saved.hideSolved);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  // A change by hand is kept - only then, so the saved choices are never
  // overwritten by the defaults before they are read.
  const change = (next: Partial<ListChoices>): void => {
    const choices = { part, query, hideSolved, ...next };
    setPart(choices.part);
    setQuery(choices.query);
    setHideSolved(choices.hideSolved);
    LIST_MEMORY.current = { ...LIST_MEMORY.current, ...choices };
    writeStored(CHOICES_KEY, CHOICES_VERSION, choices);
  };
  // The search and the tick narrow the puzzles first, so the counts on the
  // chips tell what a click on them would show.
  const needle = query.trim().toLowerCase();
  const found = PUZZLES.filter(
    (puzzle) =>
      matches(puzzle, needle) && (!hideSolved || !solved.has(puzzle.id)),
  );
  const shown = found.filter(
    (puzzle) => part === "all" || puzzle.part === part,
  );
  const controls = (
    <>
      <div className="flex flex-wrap items-center gap-3">
        {/* A cross in the field clears the search, as does Escape. */}
        <span className="relative w-full max-w-sm">
          <input
            type="text"
            value={query}
            onChange={(event) => change({ query: event.target.value })}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                change({ query: "" });
              }
            }}
            placeholder={T.search}
            aria-label={T.search}
            data-testid="sherlock-search"
            className="w-full rounded-lg border border-zinc-300 bg-white py-2 pr-9 pl-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          {query !== "" && (
            <button
              type="button"
              onClick={() => change({ query: "" })}
              aria-label={T.clearSearch}
              title={T.clearSearch}
              data-testid="sherlock-search-clear"
              className="absolute top-1/2 right-2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-base leading-none text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
            >
              ×
            </button>
          )}
        </span>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={hideSolved}
            onChange={(event) => change({ hideSolved: event.target.checked })}
            data-testid="sherlock-hide-solved"
            className="h-4 w-4 cursor-pointer accent-amber-600"
          />
          {T.hideSolved}
        </label>
      </div>
      <div
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-label={T.parts}
        data-testid="sherlock-parts"
      >
        {(["all", ...PART_ORDER] as const).map((one) => (
          <button
            key={one}
            type="button"
            aria-pressed={part === one}
            data-testid={`sherlock-part-${one}`}
            onClick={() => change({ part: one })}
            className={`cursor-pointer rounded-full border px-3 py-1 text-sm font-semibold ${
              part === one ? PART_CHIP[one] : CHIP_OFF
            }`}
          >
            {`${one === "all" ? T.allPuzzles : partLabel(one)} (${String(
              found.filter((puzzle) => one === "all" || puzzle.part === one)
                .length,
            )})`}
          </button>
        ))}
      </div>
    </>
  );
  return { controls, shown };
}

/**
 * Whether a puzzle is found by a search.
 *
 * @param puzzle - the puzzle
 * @param needle - the search, trimmed and in lower case; empty finds all
 * @returns whether its title, English title or text contains the search
 */
function matches(puzzle: Puzzle, needle: string): boolean {
  return (
    needle === "" ||
    [puzzle.title, puzzle.original, ...puzzle.text].some((part) =>
      part.toLowerCase().includes(needle),
    )
  );
}

/**
 * Whether a stored value is a set of the list's choices.
 */
function isChoices(value: unknown): value is ListChoices {
  const one: Readonly<Record<string, unknown>> =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};
  return (
    (one.part === "all" || PART_ORDER.some((part) => part === one.part)) &&
    typeof one.query === "string" &&
    typeof one.hideSolved === "boolean"
  );
}
