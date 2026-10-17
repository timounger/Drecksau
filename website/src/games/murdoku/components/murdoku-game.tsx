/**
 * Murdoku on screen: the list of cases, and a case with its suspects, its map
 * and the check of the map.
 *
 * @module
 */
"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactElement } from "react";
import { GameHeader } from "@/components/game-header";
import { readStored, storageKey, writeStored } from "@/lib/storage/local-store";
import {
  DIFFICULTY_ORDER,
  byName,
  inOrder,
  neighboursOf,
  LEVELS,
  SERIES_ORDER,
} from "@/games/murdoku/engine/levels";
import {
  cluePoints,
  groundAt,
  groundDef,
  isInside,
  sizeOf,
  thingAt,
  thingDef,
} from "@/games/murdoku/engine/rules";
import type {
  Difficulty,
  Level,
  Series,
  Suspect,
} from "@/games/murdoku/engine/types";
import {
  CaseMap,
  CasePreview,
  DRAWN_THINGS,
  DrawnThing,
} from "@/games/murdoku/components/case-map";
import {
  useMurdoku,
  type Check,
  type MurdokuApi,
} from "@/games/murdoku/hooks/use-murdoku";
import { emphasise } from "@/games/murdoku/i18n/emphasis";
import { MURDOKU_RULES } from "@/games/murdoku/i18n/rules";
import {
  DIFFICULTY_NAMES,
  MURDOKU_TEXTS as T,
  SERIES_NAMES,
  TRAIT_NAMES,
  clueText,
  revealedText,
  solvedText,
  titleOf,
} from "@/games/murdoku/i18n/texts";

/** A thousand, for milliseconds. */
const SECOND = 1000;

/** Sixty, for minutes. */
const MINUTE = 60;

/** The look of a secondary button. */
const BUTTON =
  "cursor-pointer rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800";

/**
 * The whole game.
 *
 * @returns the list of cases, or the open case
 */
export function MurdokuGame(): ReactElement {
  const game = useMurdoku();
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4">
      <GameHeader rules={MURDOKU_RULES} title={T.title} subtitle={T.subtitle}>
        <Link
          href="/murdoku/statistik"
          data-testid="murdoku-stats-link"
          className={BUTTON}
        >
          {T.statistics}
        </Link>
        <Link
          href="/murdoku/online"
          data-testid="murdoku-online-link"
          className={BUTTON}
        >
          {T.playOnline}
        </Link>
      </GameHeader>
      {game.level === null ? (
        <CaseList game={game} />
      ) : (
        <CaseView
          game={game}
          level={game.level}
          onBack={game.toList}
          onOpen={game.open}
        />
      )}
    </div>
  );
}

/** The colour of each book's label - each book its own, none like the difficulty's blue. */
const SERIES_BADGE: Readonly<Record<Series, string>> = {
  original:
    "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
  timeTravel:
    "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200",
  worldTravel: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200",
  beyondGrave:
    "bg-emerald-800 text-emerald-50 dark:bg-emerald-900 dark:text-emerald-100",
  family: "bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-200",
  online:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
  contest: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
};

/** A chosen series chip, in its book's colour - neutral for the cases from no book. */
const SERIES_CHIP: Readonly<Record<SeriesChoice, string>> = {
  none: "border-zinc-700 bg-zinc-700 text-white dark:border-zinc-300 dark:bg-zinc-300 dark:text-zinc-900",
  original: "border-violet-600 bg-violet-600 text-white",
  timeTravel: "border-orange-600 bg-orange-600 text-white",
  worldTravel: "border-cyan-600 bg-cyan-600 text-white",
  beyondGrave: "border-emerald-800 bg-emerald-800 text-white",
  family: "border-pink-600 bg-pink-600 text-white",
  online: "border-yellow-500 bg-yellow-500 text-zinc-900",
  contest: "border-red-600 bg-red-600 text-white",
};

/** The look of every label beside a case's name. */
const BADGE = "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold";

/**
 * The labels beside a case's name: where it comes from in that collection's
 * colour, and how hard it is in blue - whichever of the two it has.
 *
 * @param props - the case
 * @returns the labels
 */
export function CategoryBadge({
  level,
}: {
  readonly level: Level;
}): ReactElement {
  return (
    <span className="flex shrink-0 flex-wrap justify-end gap-1">
      {level.series !== undefined && (
        <span
          data-testid="murdoku-category"
          className={`${BADGE} ${SERIES_BADGE[level.series.book]}`}
        >
          {SERIES_NAMES[level.series.book]}
        </span>
      )}
      {level.difficulty !== undefined && (
        <span
          data-testid="murdoku-difficulty"
          className={`${BADGE} bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200`}
        >
          {DIFFICULTY_NAMES[level.difficulty]}
        </span>
      )}
    </span>
  );
}

/** The choices in the list's filters. */
type ListChoices = {
  readonly filter: Difficulty | "all";
  readonly series: SeriesChoice;
  readonly query: string;
  readonly hideSolved: boolean;
};

/** The list's filters and where it was scrolled to, kept while one plays a case. */
type ListMemory = ListChoices & { readonly scroll: number };

/** The collection the list starts with, the first time one comes. */
const FIRST_SERIES: SeriesChoice = "original";

/**
 * The list's memory at one screen: back from a case, the list is as it was
 * left - same filters, same place. Only for this visit of the page.
 */
const LIST_MEMORY: { current: ListMemory } = {
  current: {
    filter: "all",
    series: FIRST_SERIES,
    query: "",
    hideSolved: false,
    scroll: 0,
  },
};

/**
 * Keeps the list's choices for the next visit.
 *
 * @param choices - the filters as they are now
 */
function keepChoices(choices: ListChoices): void {
  LIST_MEMORY.current = { ...LIST_MEMORY.current, ...choices };
  writeStored(CHOICES_KEY, CHOICES_VERSION, choices);
}

/** Where the list's choices are kept in this browser, and their version. */
const CHOICES_KEY = storageKey("murdoku", "list");
const CHOICES_VERSION = 1;

/**
 * Whether a stored value is a set of the list's choices.
 *
 * @param value - what was stored
 * @returns whether it can be used
 */
function isChoices(value: unknown): value is ListChoices {
  const one: Readonly<Record<string, unknown>> =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};
  return (
    (one.filter === "all" ||
      DIFFICULTY_ORDER.some((difficulty) => difficulty === one.filter)) &&
    (one.series === "none" ||
      SERIES_ORDER.some((series) => series === one.series)) &&
    typeof one.query === "string" &&
    typeof one.hideSolved === "boolean"
  );
}

/**
 * The list's choices saved in this browser.
 *
 * @returns them, or null when there are none
 */
function loadChoices(): ListChoices | null {
  return readStored(CHOICES_KEY, CHOICES_VERSION, isChoices);
}

/**
 * Keeps where the list is scrolled to, as a case is opened from it.
 */
function keepScroll(): void {
  LIST_MEMORY.current = { ...LIST_MEMORY.current, scroll: window.scrollY };
}

/** What the series chips choose: one book, or the cases from no book. */
type SeriesChoice = Series | "none";

/**
 * Whether a case belongs to what the series chips chose.
 *
 * @param level - the case
 * @param choice - one book, or none
 * @returns whether it is shown
 */
function isInSeries(level: Level, choice: SeriesChoice): boolean {
  return choice === "none"
    ? level.series === undefined
    : level.series?.book === choice;
}

/**
 * The words on a series chip.
 *
 * @param choice - one book, or none
 * @returns its label
 */
function seriesLabel(choice: SeriesChoice): string {
  return choice === "none" ? T.noSeries : SERIES_NAMES[choice];
}

/** The arrows beside the way back to the list. */
const STEP_BUTTON =
  "cursor-pointer rounded-full border border-rose-300 bg-white/80 px-2.5 py-1 text-sm font-bold text-rose-900 hover:bg-white disabled:cursor-default disabled:opacity-40 dark:border-rose-800 dark:bg-zinc-900/60 dark:text-rose-100 dark:hover:bg-zinc-900";

/**
 * The filters over the cases - search, series and, for a series that has
 * them, difficulties - and the cases they let through, in their
 * collection's order. A search looks through every collection, whichever
 * is chosen, and lists what it finds by name. Used by the list at one
 * screen and by the host online.
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
  readonly shown: readonly Level[];
} {
  const [filter, setFilter] = useState<Difficulty | "all">(
    memory?.filter ?? "all",
  );
  const [series, setSeries] = useState<SeriesChoice>(
    memory?.series ?? FIRST_SERIES,
  );
  const [query, setQuery] = useState(memory?.query ?? "");
  const [hideSolved, setHideSolved] = useState(memory?.hideSolved ?? false);
  // What was chosen is kept for the next time the list is shown.
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
  // difficulty chips tell what a click on them would show.
  const needle = query.trim().toLowerCase();
  const found = LEVELS.filter(
    (level) =>
      titleOf(level).toLowerCase().includes(needle) &&
      (!hideSolved || solved === null || !solved.has(level.id)),
  );
  const inSeries = found.filter((level) => isInSeries(level, series));
  const searching = needle !== "";
  // While searching, the difficulty chips would narrow what is not shown.
  const graded =
    !searching &&
    LEVELS.some(
      (level) => isInSeries(level, series) && level.difficulty !== undefined,
    );
  const shown = searching
    ? found.toSorted(byName)
    : inSeries
        .filter(
          (level) => !graded || filter === "all" || level.difficulty === filter,
        )
        .toSorted(inOrder);
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
            data-testid="murdoku-search"
            className="w-full rounded-lg border border-zinc-300 bg-white py-2 pr-9 pl-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          {query !== "" && (
            <button
              type="button"
              onClick={() => change({ query: "" })}
              aria-label={T.clearSearch}
              title={T.clearSearch}
              data-testid="murdoku-search-clear"
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
              data-testid="murdoku-hide-solved"
              className="h-4 w-4 cursor-pointer accent-sky-600"
            />
            {T.hideSolved}
          </label>
        )}
      </div>
      <div
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-label={T.series}
        data-testid="murdoku-series"
      >
        {/* A series with no case yet stays out of sight until it has one. */}
        {([...SERIES_ORDER, "none"] as const)
          .filter((one) => LEVELS.some((level) => isInSeries(level, one)))
          .map((one) => {
            const count = found.filter((level) =>
              isInSeries(level, one),
            ).length;
            return (
              <button
                key={one}
                type="button"
                aria-pressed={!searching && series === one}
                data-testid={`murdoku-series-${one}`}
                onClick={() => {
                  // Choosing a collection leaves the search, to show it.
                  change({ series: one, filter: "all", query: "" });
                }}
                className={`cursor-pointer rounded-full border px-3 py-1 text-sm font-semibold ${
                  !searching && series === one
                    ? SERIES_CHIP[one]
                    : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                }`}
              >
                {`${seriesLabel(one)} (${String(count)})`}
              </button>
            );
          })}
      </div>
      {/* Only a series whose cases have difficulties gets the difficulty
          chips - for a book they would all read the same. */}
      {graded && (
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label={T.difficulty}
          data-testid="murdoku-filter"
        >
          {(["all", ...DIFFICULTY_ORDER] as const).map((one) => {
            const count = inSeries.filter(
              (level) => one === "all" || level.difficulty === one,
            ).length;
            return (
              <button
                key={one}
                type="button"
                aria-pressed={filter === one}
                data-testid={`murdoku-filter-${one}`}
                onClick={() => change({ filter: one })}
                className={`cursor-pointer rounded-full border px-3 py-1 text-sm font-semibold ${
                  filter === one
                    ? "border-sky-600 bg-sky-600 text-white"
                    : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                }`}
              >
                {`${one === "all" ? T.allCases : DIFFICULTY_NAMES[one]} (${String(count)})`}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
  return { controls, shown };
}

function CaseList({ game }: { readonly game: MurdokuApi }): ReactElement {
  const { controls, shown } = useCaseFilter(
    game.solved,
    LIST_MEMORY.current,
    keepChoices,
    loadChoices,
  );
  // Back to where the list was left, once it is drawn.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() =>
      window.scrollTo(0, LIST_MEMORY.current.scroll),
    );
    return () => window.cancelAnimationFrame(frame);
  }, []);
  return (
    <section className="flex flex-col gap-3" data-testid="murdoku-list">
      <h2 className="text-lg font-bold">{T.chooseCase}</h2>
      {controls}
      {shown.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{T.noCases}</p>
      )}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((level) => {
          const solved = game.solved.has(level.id);
          return (
            <li key={level.id}>
              <button
                type="button"
                data-testid={`murdoku-case-${level.id}`}
                onClick={() => {
                  keepScroll();
                  game.open(level.id);
                }}
                className="flex h-full w-full cursor-pointer flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-4 text-left shadow-sm hover:border-sky-400 dark:border-zinc-800 dark:bg-zinc-900"
              >
                {/* What the map looks like, before one opens the case. */}
                <CasePreview level={level} />
                <span className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                  <span className="text-base font-bold">{titleOf(level)}</span>
                  <CategoryBadge level={level} />
                </span>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {level.story}
                </span>
                <span className="text-sm font-semibold text-sky-700 dark:text-sky-400">
                  {solved
                    ? `✓ ${T.solved}`
                    : game.begun.has(level.id)
                      ? T.resume
                      : T.open}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * One open case - at one screen, or online with everybody on the same map.
 *
 * @param props - the game, as either hook hands it over, its case, and at one
 *   screen the way back to the list and to the cases beside it
 * @returns the case
 */
export function CaseView({
  game,
  level,
  onBack,
  onOpen,
}: {
  readonly game: MurdokuApi;
  readonly level: Level;
  /** Back to the list of cases - only at one screen; online the room decides. */
  readonly onBack?: () => void;
  /** Another case, the one before or after - only at one screen too. */
  readonly onOpen?: (id: string) => void;
}): ReactElement {
  const [before, after] = neighboursOf(level);
  // Solved, or the solution on the map: then only looking, no playing.
  const over = game.outcome?.kind === "right" || game.peeking;
  const picked = level.suspects.find((one) => one.id === game.selected);
  const complete = level.suspects.every(
    (one) => game.board.placement[one.id] !== undefined,
  );
  const reveal = useReveal(game.check, level.suspects);

  return (
    <div className="flex flex-col gap-4">
      {/* Which case this is - here as well as in the list, so it is never
          a guess, online neither. */}
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-bold" data-testid="murdoku-case-name">
          {titleOf(level)}
        </h2>
        <CategoryBadge level={level} />
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
        <span className="flex-1">{level.story}</span>
        <CaseClock game={game} />
        {onBack !== undefined && onOpen !== undefined && (
          <span className="flex shrink-0 items-center gap-1">
            {/* The arrows side by side, the way back at the far right. */}
            <button
              type="button"
              data-testid="murdoku-previous"
              aria-label={T.previousCase}
              title={before === undefined ? undefined : titleOf(before)}
              disabled={before === undefined}
              onClick={() => before !== undefined && onOpen(before.id)}
              className={STEP_BUTTON}
            >
              {"\u2190"}
            </button>
            <button
              type="button"
              data-testid="murdoku-next"
              aria-label={T.nextCaseArrow}
              title={after === undefined ? undefined : titleOf(after)}
              disabled={after === undefined}
              onClick={() => after !== undefined && onOpen(after.id)}
              className={STEP_BUTTON}
            >
              {"\u2192"}
            </button>
            <button
              type="button"
              data-testid="murdoku-to-list"
              onClick={onBack}
              className="cursor-pointer rounded-full border border-rose-300 bg-white/80 px-3 py-1 text-sm font-semibold text-rose-900 hover:bg-white dark:border-rose-800 dark:bg-zinc-900/60 dark:text-rose-100 dark:hover:bg-zinc-900"
            >
              {T.toCases}
            </button>
          </span>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            {T.suspects}
          </h2>
          <ul className="grid grid-cols-2 gap-2">
            {level.suspects.map((suspect) => (
              <li key={suspect.id}>
                <SuspectCard
                  level={level}
                  suspect={suspect}
                  game={game}
                  disabled={over}
                />
              </li>
            ))}
          </ul>
          {/* What the printed case says under its suspects, with the magnifier. */}
          {(level.rules ?? []).some((rule) => rule.note !== true) && (
            <ul
              className="flex flex-col gap-1.5 rounded-2xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-950 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100"
              data-testid="murdoku-rules"
            >
              {(level.rules ?? [])
                .filter((rule) => rule.note !== true)
                .map((rule) => (
                  <li key={rule.text} className="flex gap-2">
                    <span aria-hidden="true">{"\u{1F50E}"}</span>
                    <span>
                      <Emphasised level={level} text={rule.text} />
                    </span>
                  </li>
                ))}
            </ul>
          )}
          {/* The detective's post-its: a word on the side, not a rule. */}
          {(level.rules ?? [])
            .filter((rule) => rule.note === true)
            .map((rule) => (
              <p
                key={rule.text}
                className="relative max-w-md rotate-[-1deg] self-start bg-yellow-200 p-3 pt-4 text-sm text-yellow-950 shadow-md dark:bg-yellow-300 dark:text-yellow-950"
                data-testid="murdoku-note"
              >
                <span
                  aria-hidden="true"
                  className="absolute -top-2 left-1/2 -translate-x-1/2"
                >
                  {"\u{1F4CC}"}
                </span>
                {rule.text}
              </p>
            ))}
        </section>

        <section className="flex flex-col gap-3">
          {/* On a phone the cards are far above the map - so the pawns are
              here again, small, right where they are put down. */}
          {!over && (
            <div
              className="flex flex-wrap gap-1.5 lg:hidden"
              data-testid="murdoku-pawns"
            >
              {level.suspects.map((suspect) => (
                <PawnButton key={suspect.id} suspect={suspect} game={game} />
              ))}
            </div>
          )}
          <div className="mx-auto w-full max-w-[640px]">
            <CaseMap
              level={level}
              board={game.board}
              onTap={game.tap}
              onHold={game.hold}
              canHold={game.selected !== null}
              onClear={game.clear}
              verdicts={reveal.verdicts}
              glow={picked === undefined ? [] : cluePoints(level, picked)}
            />
          </div>
          <Legend level={level} />
          {game.culprit !== null && (
            <p className="text-sm font-medium" data-testid="murdoku-result">
              {revealedText(level, game.culprit)}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {/* **Bestätigen** checks the map - only once everybody, the
                victim too, stands somewhere. */}
            <button
              type="button"
              data-testid="murdoku-confirm"
              onClick={game.confirm}
              disabled={!complete || over}
              title={
                complete
                  ? undefined
                  : level.treasure === undefined
                    ? T.confirmHint
                    : T.confirmTreasureHint
              }
              className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {T.confirm}
            </button>
            {game.undoable && (
              <button
                type="button"
                onClick={game.undo}
                disabled={!game.canUndo || over}
                className={BUTTON}
              >
                {T.undo}
              </button>
            )}
            <button
              type="button"
              onClick={game.restart}
              disabled={over}
              className={BUTTON}
            >
              {T.restart}
            </button>
            <HintButton
              game={game}
              total={level.hints.length}
              disabled={over || game.shownHints >= level.hints.length}
            />
            <RevealButton
              game={game}
              disabled={game.outcome?.kind === "right"}
            />
          </div>
          {game.shownHints > 0 && (
            <div className="flex flex-col gap-1 rounded-2xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-950 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100">
              <ol
                data-testid="murdoku-hints"
                className="flex list-decimal flex-col gap-1.5 pl-5"
              >
                {level.hints.slice(0, game.shownHints).map((step, index) => {
                  const acts =
                    step.place !== undefined || step.cross !== undefined;
                  const live =
                    acts && !game.peeking && game.outcome?.kind !== "right";
                  return (
                    <li key={step.text}>
                      {acts ? (
                        // A step that concludes something can be carried out.
                        // A div rather than a button: a button lines up with
                        // its last line, and the number of the list sat
                        // below the step instead of beside it.
                        <div
                          role="button"
                          tabIndex={live ? 0 : -1}
                          aria-disabled={!live}
                          data-testid={`murdoku-hint-${String(index)}`}
                          onClick={() => {
                            if (live) {
                              game.applyHint(index);
                            }
                          }}
                          onKeyDown={(event) => {
                            if (
                              live &&
                              (event.key === "Enter" || event.key === " ")
                            ) {
                              event.preventDefault();
                              game.applyHint(index);
                            }
                          }}
                          title={T.applyHint}
                          className={`rounded-md ${live ? "cursor-pointer hover:bg-sky-100 dark:hover:bg-sky-900/50" : ""}`}
                        >
                          {step.text}{" "}
                          {live && (
                            <span className="font-semibold whitespace-nowrap text-sky-700 dark:text-sky-300">
                              {`▶ ${T.applyHint}`}
                            </span>
                          )}
                        </div>
                      ) : (
                        step.text
                      )}
                    </li>
                  );
                })}
              </ol>
              <button
                type="button"
                data-testid="murdoku-hide-hints"
                onClick={game.hideHints}
                className="cursor-pointer self-end text-xs font-semibold text-sky-700 hover:underline dark:text-sky-300"
              >
                {T.hideHints}
              </button>
            </div>
          )}
          <ResultDialog game={game} level={level} done={reveal.done} />
        </section>
      </div>
    </div>
  );
}

/** How long each pawn waits for its ring after "Bestätigen", in milliseconds. */
const REVEAL_STEP_MS = 280;

/**
 * The answer to "Bestätigen", one pawn after another.
 *
 * @param check - the answer, or null before any
 * @param suspects - everybody, in the order they are ringed - A first
 * @returns the rings shown so far, and whether all are shown
 */
function useReveal(
  check: Check | null,
  suspects: readonly Suspect[],
): {
  readonly verdicts: Readonly<Record<string, boolean>>;
  readonly done: boolean;
} {
  const [shown, setShown] = useState({ nonce: -1, count: 0 });
  const nonce = check?.nonce ?? null;
  const total = suspects.length;
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    if (nonce !== null) {
      let count = 0;
      const timer = window.setInterval(() => {
        count += 1;
        setShown({ nonce, count });
        if (count >= total) {
          window.clearInterval(timer);
        }
      }, REVEAL_STEP_MS);
      cleanup = () => window.clearInterval(timer);
    }
    return cleanup;
  }, [nonce, total]);
  const count = check !== null && shown.nonce === check.nonce ? shown.count : 0;
  return {
    verdicts:
      check === null
        ? {}
        : Object.fromEntries(
            suspects
              .slice(0, count)
              .map((one) => [one.id, check.results[one.id] === true]),
          ),
    done: check !== null && count >= total,
  };
}

/**
 * What came of "Bestätigen", once every pawn has its ring: solved, with the
 * culprit named - or how many stand wrong, and the choice to start over or to
 * go on correcting.
 */
function ResultDialog({
  game,
  level,
  done,
}: {
  readonly game: MurdokuApi;
  readonly level: Level;
  readonly done: boolean;
}): ReactElement {
  const dialog = useRef<HTMLDialogElement>(null);
  const [dismissed, setDismissed] = useState<number | null>(null);
  const check = game.check;
  const nonce = check?.nonce ?? null;
  const open = done && nonce !== null && nonce !== dismissed;
  useEffect(() => {
    if (open && dialog.current !== null && !dialog.current.open) {
      dialog.current.showModal();
    }
  }, [open]);
  const close = () => {
    setDismissed(nonce);
    dialog.current?.close();
  };
  const results = Object.values(check?.results ?? {});
  const wrong = results.filter((one) => !one).length;
  const solved = check !== null && wrong === 0;
  const outcome = game.outcome;

  return (
    <dialog
      ref={dialog}
      data-testid="murdoku-result-dialog"
      aria-labelledby="murdoku-result-title"
      onClose={() => setDismissed(nonce)}
      className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-2xl bg-white p-0 text-zinc-900 shadow-2xl backdrop:bg-zinc-950/30 dark:bg-zinc-900 dark:text-zinc-100"
    >
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-start gap-3">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl ${
              solved
                ? "bg-emerald-100 dark:bg-emerald-950"
                : "bg-rose-100 dark:bg-rose-950"
            }`}
            aria-hidden="true"
          >
            {solved ? "\u{1F389}" : "\u{1F50D}"}
          </span>
          <div className="flex flex-col gap-1">
            <h2 id="murdoku-result-title" className="text-lg font-bold">
              {solved ? T.solvedTitle : T.wrongTitle}
            </h2>
            <p
              className="text-sm text-zinc-600 dark:text-zinc-300"
              data-testid="murdoku-result-text"
            >
              {solved && outcome?.kind === "right"
                ? solvedText(level, outcome.who, game.peeked)
                : T.wrongCount(wrong, results.length)}
            </p>
            {solved && outcome?.kind === "right" && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {clockText(outcome.ms)}
                {game.hints > 0 ? ` - ${T.hintsUsed(game.hints)}` : ""}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {solved && game.next !== null && (
            <button
              type="button"
              data-testid="murdoku-next"
              onClick={() => {
                close();
                game.next?.();
              }}
              className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {T.nextCase}
            </button>
          )}
          {game.canReplay && (
            <button
              type="button"
              data-testid="murdoku-replay"
              onClick={() => {
                close();
                game.replay();
              }}
              className="cursor-pointer rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              {T.replay}
            </button>
          )}
          <button
            type="button"
            data-testid="murdoku-edit"
            onClick={close}
            autoFocus
            className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {solved ? T.close : T.edit}
          </button>
        </div>
      </div>
    </dialog>
  );
}

/** How often the clock is redrawn, in milliseconds. */
const CLOCK_TICK_MS = 1000;

/**
 * How long the case has been worked on - running while it is open, standing
 * still once it is solved.
 */
function CaseClock({ game }: { readonly game: MurdokuApi }): ReactElement {
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
  const ms = game.outcome?.kind === "right" ? game.outcome.ms : game.elapsed();
  return (
    <span
      data-testid="murdoku-clock"
      title={T.clockTitle}
      className="shrink-0 rounded-full bg-white/80 px-3 py-1 font-mono text-sm font-bold text-rose-900 tabular-nums dark:bg-zinc-900/60 dark:text-rose-100"
    >
      {`\u23F1 ${clockText(ms)}`}
    </span>
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

/**
 * What may be stood on and what may not - as the printed case shows it next
 * to the map, and only with what this map actually has.
 */
function Legend({ level }: { readonly level: Level }): ReactElement {
  const { rows, cols } = sizeOf(level);
  const things = new Set<string>();
  const grounds = new Set<string>();
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cell = { row, col };
      const thing = thingAt(level, cell);
      if (thing !== null) {
        things.add(thing);
      }
      if (isInside(level, cell)) {
        grounds.add(groundAt(level, cell));
      }
    }
  }
  const free = [...things].filter((id) => thingDef(level, id).standable);
  const blocked = [...things].filter((id) => !thingDef(level, id).standable);
  return (
    <div
      className="grid gap-2 text-xs sm:grid-cols-2"
      data-testid="murdoku-legend"
    >
      <div className="flex flex-col gap-1 rounded-xl bg-emerald-50 px-3 py-2 dark:bg-emerald-950/40">
        <span className="font-semibold text-emerald-800 dark:text-emerald-300">
          {T.canStand}
        </span>
        <span className="flex flex-wrap gap-x-3 gap-y-1">
          {[...grounds]
            .filter((id) => groundDef(id).standable !== false)
            .map((id) => (
              <span key={id} className="flex items-center gap-1">
                <span
                  className="inline-block h-4 w-4 rounded-sm border border-zinc-300 dark:border-zinc-600"
                  style={{ backgroundColor: groundDef(id).colour }}
                  aria-hidden="true"
                />
                {groundDef(id).name}
              </span>
            ))}
          {free.map((id) => (
            <LegendItem key={id} level={level} thing={id} />
          ))}
        </span>
      </div>
      <div className="flex flex-col gap-1 rounded-xl bg-rose-50 px-3 py-2 dark:bg-rose-950/40">
        <span className="font-semibold text-rose-800 dark:text-rose-300">
          {T.cannotStand}
        </span>
        <span className="flex flex-wrap gap-x-3 gap-y-1">
          {[...grounds]
            .filter((id) => groundDef(id).standable === false)
            .map((id) => (
              <span key={id} className="flex items-center gap-1">
                <span
                  className="inline-block h-4 w-4 rounded-sm border border-zinc-300 dark:border-zinc-600"
                  style={{ backgroundColor: groundDef(id).colour }}
                  aria-hidden="true"
                />
                {groundDef(id).name}
              </span>
            ))}
          {blocked.map((id) => (
            <LegendItem key={id} level={level} thing={id} />
          ))}
        </span>
      </div>
    </div>
  );
}

/** One thing in the legend: how it looks and what it is called. */
function LegendItem({
  level,
  thing,
}: {
  readonly level: Level;
  readonly thing: string;
}): ReactElement {
  const def = thingDef(level, thing);
  return (
    <span className="flex items-center gap-1">
      {DRAWN_THINGS.has(thing) ? (
        // Drawn as on the map, not an emoji.
        <svg viewBox="0 0 100 100" className="h-5 w-5" aria-hidden="true">
          <DrawnThing thing={thing} x={0} y={0} width={100} height={100} />
        </svg>
      ) : (
        <span className="text-base leading-none" aria-hidden="true">
          {def.emoji}
        </span>
      )}
      {def.name}
    </span>
  );
}

/** How long "Tipp" has to be held to show and carry out every step, in milliseconds. */
const ALL_HINTS_MS = 1000;

/**
 * "Tipp": a click shows the next step of the way, holding it for a second
 * shows every step and carries them all out. The release after the hold is
 * not a click as well.
 */
function HintButton({
  game,
  total,
  disabled,
}: {
  readonly game: MurdokuApi;
  readonly total: number;
  readonly disabled: boolean;
}): ReactElement {
  const timer = useRef<number | null>(null);
  const held = useRef(false);
  const stop = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };
  return (
    <button
      type="button"
      data-testid="murdoku-hint"
      disabled={disabled}
      title={T.hintHold}
      onPointerDown={() => {
        held.current = false;
        stop();
        timer.current = window.setTimeout(() => {
          timer.current = null;
          held.current = true;
          game.allHints();
        }, ALL_HINTS_MS);
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(event) => event.preventDefault()}
      onClick={() => {
        if (!held.current) {
          game.hint();
        }
        held.current = false;
      }}
      className={`${BUTTON} select-none`}
    >
      {game.shownHints === 0
        ? T.hint
        : `${T.hint} (${String(game.shownHints)}/${String(total)})`}
    </button>
  );
}

/**
 * "Lösung zeigen" and "Lösung ausblenden" - with a proper question the first
 * time, in the page's own look rather than the browser's grey box. After that
 * the case is given up already, and the solution comes and goes freely.
 */
function RevealButton({
  game,
  disabled,
}: {
  readonly game: MurdokuApi;
  readonly disabled: boolean;
}): ReactElement {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = () => dialog.current?.close();
  const press = () => {
    if (game.peeking) {
      game.hideSolution();
    } else if (game.peeked) {
      game.reveal();
    } else {
      dialog.current?.showModal();
    }
  };
  return (
    <>
      <button
        type="button"
        data-testid="murdoku-reveal"
        onClick={press}
        disabled={disabled}
        className={
          game.peeking
            ? "cursor-pointer rounded-lg border border-amber-400 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-900 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-200"
            : BUTTON
        }
      >
        {game.peeking ? T.hideSolution : T.reveal}
      </button>
      <dialog
        ref={dialog}
        data-testid="murdoku-reveal-dialog"
        aria-labelledby="murdoku-reveal-title"
        onClick={(event) => {
          // A click on the dimmed backdrop lands on the dialog itself.
          if (event.target === dialog.current) {
            close();
          }
        }}
        className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-2xl bg-white p-0 text-zinc-900 shadow-2xl backdrop:bg-zinc-950/60 backdrop:backdrop-blur-sm dark:bg-zinc-900 dark:text-zinc-100"
      >
        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-start gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-2xl dark:bg-amber-950"
              aria-hidden="true"
            >
              {"\u{1F50E}"}
            </span>
            <div className="flex flex-col gap-1">
              <h2 id="murdoku-reveal-title" className="text-lg font-bold">
                {T.revealTitle}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                {game.level?.treasure === undefined
                  ? T.revealText
                  : T.revealTreasureText}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              data-testid="murdoku-reveal-no"
              onClick={close}
              autoFocus
              className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {T.revealNo}
            </button>
            <button
              type="button"
              data-testid="murdoku-reveal-yes"
              onClick={() => {
                close();
                game.reveal();
              }}
              className="cursor-pointer rounded-lg border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/50"
            >
              {T.revealYes}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

/** A suspect as a small round button, for the row above the map. */
function PawnButton({
  suspect,
  game,
}: {
  readonly suspect: Suspect;
  readonly game: MurdokuApi;
}): ReactElement {
  const chosen = game.selected === suspect.id;
  const placed = game.board.placement[suspect.id] !== undefined;
  return (
    <button
      type="button"
      aria-pressed={chosen}
      aria-label={suspect.name}
      onClick={() => game.select(chosen ? null : suspect.id)}
      className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-[3px] text-base font-extrabold text-white transition ${
        chosen ? "scale-110 border-amber-400 shadow-lg" : "border-white shadow"
      } ${placed && !chosen ? "opacity-45" : ""}`}
      style={{ backgroundColor: suspect.colour }}
    >
      {suspect.id}
    </button>
  );
}

/** A suspect, with face, name and clue - tapped to be placed. */
/**
 * A clue's text with its key words in bold, as the printed pages set them.
 *
 * @param props - the case and the text
 * @returns the text
 */
function Emphasised({
  level,
  text,
}: {
  readonly level: Level;
  readonly text: string;
}): ReactElement {
  return (
    <>
      {emphasise(level, text).map((part, at) =>
        part.strong ? (
          <strong key={`${String(at)}-${part.text}`} className="font-bold">
            {part.text}
          </strong>
        ) : (
          <span key={`${String(at)}-${part.text}`}>{part.text}</span>
        ),
      )}
    </>
  );
}

function SuspectCard({
  level,
  suspect,
  game,
  disabled,
}: {
  readonly level: Level;
  readonly suspect: Suspect;
  readonly game: MurdokuApi;
  readonly disabled: boolean;
}): ReactElement {
  const chosen = game.selected === suspect.id;
  const placed = game.board.placement[suspect.id] !== undefined;
  const victim = suspect.clue.victim === true;
  const treasure = level.treasure === suspect.id;
  return (
    <button
      type="button"
      data-testid={`murdoku-suspect-${suspect.id}`}
      aria-pressed={chosen}
      disabled={disabled}
      onClick={() => game.select(chosen ? null : suspect.id)}
      className={`flex h-full w-full cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 p-2 text-center transition disabled:cursor-default ${
        chosen
          ? "border-amber-400 bg-amber-50 shadow-md dark:bg-amber-950/40"
          : victim
            ? "border-rose-200 bg-rose-50 hover:border-rose-300 dark:border-rose-900 dark:bg-rose-950/30"
            : treasure
              ? "border-amber-300 bg-amber-50 hover:border-amber-400 dark:border-amber-800 dark:bg-amber-950/30"
              : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900"
      }`}
    >
      <span className="relative">
        <span
          className="flex h-14 w-14 items-center justify-center rounded-full text-3xl shadow-inner"
          style={{ backgroundColor: `${suspect.colour}33` }}
          aria-hidden="true"
        >
          {suspect.face}
        </span>
        <span
          className={`absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-xs font-extrabold text-white ${placed ? "" : "opacity-40"}`}
          style={{ backgroundColor: suspect.colour }}
        >
          {suspect.id}
        </span>
      </span>
      <span className="flex items-center gap-1 text-sm font-bold">
        {suspect.name}
        {/* Only that the person stands somewhere - not whether it is right;
            that is what "Bestätigen" is for. */}
        {placed && (
          <span className="text-emerald-600" aria-label={T.placed}>
            {"✓"}
          </span>
        )}
      </span>
      {/* What the portrait would show and the clues ask about - a cap,
          glasses, being a zookeeper. Without the printed faces it has to
          be said. */}
      {(suspect.traits ?? []).length > 0 && (
        <span className="flex flex-wrap justify-center gap-1">
          {(suspect.traits ?? []).map((trait) => (
            <span
              key={trait}
              className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              {TRAIT_NAMES[trait] ?? trait}
            </span>
          ))}
        </span>
      )}
      {victim && (
        <span className="text-[11px] font-bold tracking-wide text-rose-700 uppercase dark:text-rose-300">
          {T.victim}
        </span>
      )}
      {treasure && (
        <span className="text-[11px] font-bold tracking-wide text-amber-700 uppercase dark:text-amber-300">
          {T.treasure}
        </span>
      )}
      <span className="text-xs leading-snug text-zinc-600 dark:text-zinc-300">
        <Emphasised level={level} text={clueText(level, suspect)} />
      </span>
    </button>
  );
}
