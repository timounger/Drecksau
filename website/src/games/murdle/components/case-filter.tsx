/**
 * Choosing a case: the search, the book chips, the difficulty chips, and the
 * labels beside a case's name - for the list at one screen and the host's
 * picker online.
 *
 * @module
 */
"use client";

import { useEffect, useState, type ReactElement } from "react";
import {
  CASES,
  DIFFICULTY_ORDER,
  SERIES_ORDER,
  byName,
  inOrder,
} from "@/games/murdle/engine/cases";
import type { Case, Difficulty, Series } from "@/games/murdle/engine/types";
import {
  DIFFICULTY_GLASSES,
  DIFFICULTY_NAMES,
  MURDLE_TEXTS as T,
  SERIES_NAMES,
  titleOf,
} from "@/games/murdle/i18n/texts";
import { readStored, storageKey, writeStored } from "@/lib/storage/local-store";

/** The colour of each book's label. */
const SERIES_BADGE: Readonly<Record<Series, string>> = {
  volume1: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
};

/** A chosen book chip, in its book's colour. */
const SERIES_CHIP: Readonly<Record<Series, string>> = {
  volume1: "border-red-700 bg-red-700 text-white",
};

/** The colour of each difficulty's label. */
const DIFFICULTY_BADGE: Readonly<Record<Difficulty, string>> = {
  tutorial: "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
  elementary:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  occult:
    "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
  hardBoiled:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  impossible: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
};

/** The look of every label beside a case's name. */
const BADGE = "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold";

/** The look of a chip that is not chosen. */
const CHIP_OFF =
  "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800";

/** The choices in the list's filters. */
export type ListChoices = {
  readonly filter: Difficulty | "all";
  readonly series: Series;
  readonly query: string;
  readonly hideSolved: boolean;
};

/** The list's filters and where it was scrolled to, kept while one plays a case. */
export type ListMemory = ListChoices & { readonly scroll: number };

/** The book the list starts with, the first time one comes. */
const FIRST_SERIES: Series = SERIES_ORDER[0] as Series;

/** Where the list's choices are kept in this browser, and their version. */
const CHOICES_KEY = storageKey("murdle", "list");
const CHOICES_VERSION = 1;

/**
 * The list's memory at one screen: back from a case, the list is as it was
 * left - same filters, same place. Only for this visit of the page.
 */
export const LIST_MEMORY: { current: ListMemory } = {
  current: {
    filter: "all",
    series: FIRST_SERIES,
    query: "",
    hideSolved: false,
    scroll: 0,
  },
};

/**
 * The labels beside a case's name: its book in that book's colour, and how
 * hard it is, with the book's magnifying glasses.
 *
 * @param props - the case
 * @returns the labels
 */
export function CaseLabels({ kase }: { readonly kase: Case }): ReactElement {
  return (
    <span className="flex min-w-0 flex-wrap gap-1">
      <span
        data-testid="murdle-category"
        className={`${BADGE} ${SERIES_BADGE[kase.series]}`}
      >
        {SERIES_NAMES[kase.series]}
      </span>
      <DifficultyBadge difficulty={kase.difficulty} />
    </span>
  );
}

/**
 * The label of a difficulty, with the book's magnifying glasses.
 *
 * @param props - the difficulty
 * @returns the label
 */
export function DifficultyBadge({
  difficulty,
}: {
  readonly difficulty: Difficulty;
}): ReactElement {
  return (
    <span
      data-testid="murdle-difficulty"
      className={`${BADGE} ${DIFFICULTY_BADGE[difficulty]}`}
    >
      {difficultyLabel(difficulty)}
    </span>
  );
}

/**
 * Keeps the list's choices for the next visit.
 *
 * @param choices - the filters as they are now
 */
export function keepChoices(choices: ListChoices): void {
  LIST_MEMORY.current = { ...LIST_MEMORY.current, ...choices };
  writeStored(CHOICES_KEY, CHOICES_VERSION, choices);
}

/**
 * The list's choices saved in this browser.
 *
 * @returns them, or null when there are none
 */
export function loadChoices(): ListChoices | null {
  return readStored(CHOICES_KEY, CHOICES_VERSION, isChoices);
}

/**
 * Keeps where the list is scrolled to, as a case is opened from it.
 */
export function keepScroll(): void {
  LIST_MEMORY.current = { ...LIST_MEMORY.current, scroll: window.scrollY };
}

/**
 * The filters over the cases - search, book and difficulty - and the cases
 * they let through, in their book's order. A search looks through every book,
 * whichever is chosen, and lists what it finds by name.
 *
 * @param solved - the cases solved here, for "Gelöste ausblenden"; null
 *   leaves that tick out
 * @param memory - the choices to start with, kept from the last visit
 * @param keep - where to keep the choices for the next visit
 * @param load - the choices saved in this browser, read once the page is up
 * @returns the filter controls and the cases to show
 */
export function useCaseFilter(
  solved: ReadonlySet<string> | null,
  memory?: ListMemory,
  keep?: (choices: ListChoices) => void,
  load?: () => ListChoices | null,
): {
  readonly controls: ReactElement;
  readonly shown: readonly Case[];
} {
  const [filter, setFilter] = useState<Difficulty | "all">(
    memory?.filter ?? "all",
  );
  const [series, setSeries] = useState<Series>(memory?.series ?? FIRST_SERIES);
  const [query, setQuery] = useState(memory?.query ?? "");
  const [hideSolved, setHideSolved] = useState(memory?.hideSolved ?? false);
  // The saved choices only after the first drawing: the page the server sent
  // knows nothing of this browser.
  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    const saved = load?.();
    if (saved !== undefined && saved !== null) {
      setFilter(saved.filter);
      setSeries(saved.series);
      setQuery(saved.query);
      setHideSolved(saved.hideSolved);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  // A change by hand is kept - only then, so the saved choices are never
  // overwritten by the defaults before they are read.
  const change = (next: Partial<ListChoices>): void => {
    const choices = { filter, series, query, hideSolved, ...next };
    setFilter(choices.filter);
    setSeries(choices.series);
    setQuery(choices.query);
    setHideSolved(choices.hideSolved);
    keep?.(choices);
  };
  // The search and the tick narrow the cases first, so the counts on the
  // chips tell what a click on them would show.
  const needle = query.trim().toLowerCase();
  const found = CASES.filter(
    (kase) =>
      titleOf(kase).toLowerCase().includes(needle) &&
      (!hideSolved || solved === null || !solved.has(kase.id)),
  );
  const inSeries = found.filter((kase) => kase.series === series);
  const searching = needle !== "";
  const shown = searching
    ? found.toSorted(byName)
    : inSeries
        .filter((kase) => filter === "all" || kase.difficulty === filter)
        .toSorted(inOrder);
  // Only a difficulty the chosen book has gets a chip.
  const difficulties = DIFFICULTY_ORDER.filter((one) =>
    CASES.some((kase) => kase.series === series && kase.difficulty === one),
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
            data-testid="murdle-search"
            className="w-full rounded-lg border border-zinc-300 bg-white py-2 pr-9 pl-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          {query !== "" && (
            <button
              type="button"
              onClick={() => change({ query: "" })}
              aria-label={T.clearSearch}
              title={T.clearSearch}
              data-testid="murdle-search-clear"
              className="absolute top-1/2 right-2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-base leading-none text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
            >
              ×
            </button>
          )}
        </span>
        {solved !== null && (
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={hideSolved}
              onChange={(event) => change({ hideSolved: event.target.checked })}
              data-testid="murdle-hide-solved"
              className="h-4 w-4 cursor-pointer accent-amber-600"
            />
            {T.hideSolved}
          </label>
        )}
      </div>
      <div
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-label={T.series}
        data-testid="murdle-series"
      >
        {/* A book with no case yet stays out of sight until it has one. */}
        {SERIES_ORDER.filter((one) =>
          CASES.some((kase) => kase.series === one),
        ).map((one) => (
          <button
            key={one}
            type="button"
            aria-pressed={!searching && series === one}
            data-testid={`murdle-series-${one}`}
            onClick={() => {
              // Choosing a book leaves the search, to show it.
              change({ series: one, filter: "all", query: "" });
            }}
            className={`cursor-pointer rounded-full border px-3 py-1 text-sm font-semibold ${
              !searching && series === one ? SERIES_CHIP[one] : CHIP_OFF
            }`}
          >
            {`${SERIES_NAMES[one]} (${String(
              found.filter((kase) => kase.series === one).length,
            )})`}
          </button>
        ))}
      </div>
      {/* While searching, the difficulty chips would narrow what is not shown. */}
      {!searching && (
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label={T.difficulty}
          data-testid="murdle-filter"
        >
          {(["all", ...difficulties] as const).map((one) => (
            <button
              key={one}
              type="button"
              aria-pressed={filter === one}
              data-testid={`murdle-filter-${one}`}
              onClick={() => change({ filter: one })}
              className={`cursor-pointer rounded-full border px-3 py-1 text-sm font-semibold ${
                filter === one
                  ? "border-sky-600 bg-sky-600 text-white"
                  : CHIP_OFF
              }`}
            >
              {`${one === "all" ? T.allCases : difficultyLabel(one)} (${String(
                inSeries.filter(
                  (kase) => one === "all" || kase.difficulty === one,
                ).length,
              )})`}
            </button>
          ))}
        </div>
      )}
    </>
  );
  return { controls, shown };
}

/**
 * A difficulty's name with its magnifying glasses.
 *
 * @param difficulty - the difficulty
 * @returns its name, followed by as many glasses as the book prints
 */
export function difficultyLabel(difficulty: Difficulty): string {
  const glasses = "\u{1F50D}".repeat(DIFFICULTY_GLASSES[difficulty]);
  return glasses === ""
    ? DIFFICULTY_NAMES[difficulty]
    : `${DIFFICULTY_NAMES[difficulty]} ${glasses}`;
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
    (one.filter === "all" ||
      DIFFICULTY_ORDER.some((difficulty) => difficulty === one.filter)) &&
    SERIES_ORDER.some((series) => series === one.series) &&
    typeof one.query === "string" &&
    typeof one.hideSolved === "boolean"
  );
}
