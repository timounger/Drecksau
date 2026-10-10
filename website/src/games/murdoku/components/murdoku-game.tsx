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
import { EMPTY_BOARD } from "@/games/murdoku/engine/board";
import { DIFFICULTY_ORDER, LEVELS } from "@/games/murdoku/engine/levels";
import {
  cluePoints,
  groundAt,
  groundDef,
  isInside,
  sizeOf,
  thingAt,
  thingDef,
} from "@/games/murdoku/engine/rules";
import type { Difficulty, Level, Suspect } from "@/games/murdoku/engine/types";
import { CaseMap } from "@/games/murdoku/components/case-map";
import {
  useMurdoku,
  type Check,
  type MurdokuApi,
} from "@/games/murdoku/hooks/use-murdoku";
import { MURDOKU_RULES } from "@/games/murdoku/i18n/rules";
import {
  DIFFICULTY_NAMES,
  MURDOKU_TEXTS as T,
  TRAIT_NAMES,
  clueText,
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
        {game.level !== null && (
          <button
            type="button"
            data-testid="murdoku-to-list"
            onClick={game.toList}
            className={BUTTON}
          >
            {T.toCases}
          </button>
        )}
      </GameHeader>
      {game.level === null ? (
        <CaseList game={game} />
      ) : (
        <CaseView game={game} level={game.level} />
      )}
    </div>
  );
}

/** The cases to choose from - all of them, or one difficulty. */
function CaseList({ game }: { readonly game: MurdokuApi }): ReactElement {
  const [filter, setFilter] = useState<Difficulty | "all">("all");
  const shown = LEVELS.filter(
    (level) => filter === "all" || level.difficulty === filter,
  );
  return (
    <section className="flex flex-col gap-3" data-testid="murdoku-list">
      <h2 className="text-lg font-bold">{T.chooseCase}</h2>
      <div
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-label={T.difficulty}
        data-testid="murdoku-filter"
      >
        {(["all", ...DIFFICULTY_ORDER] as const).map((one) => {
          const count = LEVELS.filter(
            (level) => one === "all" || level.difficulty === one,
          ).length;
          return (
            <button
              key={one}
              type="button"
              aria-pressed={filter === one}
              data-testid={`murdoku-filter-${one}`}
              onClick={() => setFilter(one)}
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
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((level) => {
          const solved = game.solved.has(level.id);
          return (
            <li key={level.id}>
              <button
                type="button"
                data-testid={`murdoku-case-${level.id}`}
                onClick={() => game.open(level.id)}
                className="flex w-full cursor-pointer flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-4 text-left shadow-sm hover:border-sky-400 dark:border-zinc-800 dark:bg-zinc-900"
              >
                {/* What the map looks like, before one opens the case. */}
                <span className="block overflow-hidden rounded-xl">
                  <CaseMap level={level} board={EMPTY_BOARD} preview />
                </span>
                <span className="flex items-center justify-between gap-2">
                  <span className="text-base font-bold">{level.name}</span>
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800 dark:bg-sky-950 dark:text-sky-200">
                    {DIFFICULTY_NAMES[level.difficulty]}
                  </span>
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
 * @param props - the game, as either hook hands it over, and its case
 * @returns the case
 */
export function CaseView({
  game,
  level,
}: {
  readonly game: MurdokuApi;
  readonly level: Level;
}): ReactElement {
  // Solved, or the solution on the map: then only looking, no playing.
  const over = game.outcome?.kind === "right" || game.peeking;
  const picked = level.suspects.find((one) => one.id === game.selected);
  const complete = level.suspects.every(
    (one) => game.board.placement[one.id] !== undefined,
  );
  const reveal = useReveal(game.check, level.suspects);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
        <span className="flex-1">{level.story}</span>
        <CaseClock game={game} />
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
          {(level.rules ?? []).length > 0 && (
            <ul
              className="flex flex-col gap-1.5 rounded-2xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-950 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100"
              data-testid="murdoku-rules"
            >
              {(level.rules ?? []).map((rule) => (
                <li key={rule.text} className="flex gap-2">
                  <span aria-hidden="true">{"\u{1F50E}"}</span>
                  {rule.text}
                </li>
              ))}
            </ul>
          )}
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
              {T.gaveUp(
                level.suspects.find((one) => one.id === game.culprit)?.name ??
                  "?",
                level.culprit.name,
              )}
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
              title={complete ? undefined : T.confirmHint}
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
  const nameOf = (id: string) =>
    level.suspects.find((one) => one.id === id)?.name ?? "?";

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
                ? game.peeked
                  ? T.rightPeeked(nameOf(outcome.who), level.culprit.name)
                  : T.right(nameOf(outcome.who), level.culprit.name)
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
      <span className="text-base leading-none" aria-hidden="true">
        {def.emoji}
      </span>
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
                {T.revealText}
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
      <span className="text-xs leading-snug text-zinc-600 dark:text-zinc-300">
        {clueText(level, suspect)}
      </span>
    </button>
  );
}
