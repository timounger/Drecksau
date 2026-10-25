/**
 * Murdle on screen: the list of cases, and a case with its cards, clues,
 * deduction grid and accusation.
 *
 * @module
 */
"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactElement } from "react";
import { GameHeader } from "@/components/game-header";
import { neighboursOf } from "@/games/murdle/engine/cases";
import { answerOf } from "@/games/murdle/engine/solver";
import type { Accusation, Case } from "@/games/murdle/engine/types";
import { CaseCards, CaseClues } from "@/games/murdle/components/case-cards";
import {
  CaseLabels,
  LIST_MEMORY,
  keepChoices,
  keepScroll,
  loadChoices,
  useCaseFilter,
} from "@/games/murdle/components/case-filter";
import { DeductionGrid } from "@/games/murdle/components/deduction-grid";
import { useMurdle, type MurdleApi } from "@/games/murdle/hooks/use-murdle";
import { MURDLE_RULES } from "@/games/murdle/i18n/rules";
import {
  MURDLE_TEXTS as T,
  capitalised,
  titleOf,
} from "@/games/murdle/i18n/texts";

/** A thousand, for milliseconds. */
const SECOND = 1000;

/** Sixty, for minutes. */
const MINUTE = 60;

/** How often the clock is redrawn, in milliseconds. */
const CLOCK_TICK_MS = 1000;

/** The look of a secondary button. */
const BUTTON =
  "cursor-pointer rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800";

/** The arrows beside the way back to the list. */
const STEP_BUTTON =
  "cursor-pointer rounded-full border border-amber-300 bg-white/80 px-2.5 py-1 text-sm font-bold text-amber-900 hover:bg-white disabled:cursor-default disabled:opacity-40 dark:border-amber-800 dark:bg-zinc-900/60 dark:text-amber-100 dark:hover:bg-zinc-900";

/** The look of an accusation's drop-down. */
const SELECT =
  "w-full rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900";

/**
 * The whole game.
 *
 * @returns the list of cases, or the open case
 */
export function MurdleGame(): ReactElement {
  const game = useMurdle();
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4">
      <GameHeader rules={MURDLE_RULES} title={T.title} subtitle={T.subtitle}>
        <Link
          href="/murdle/statistik"
          data-testid="murdle-stats-link"
          className={BUTTON}
        >
          {T.statistics}
        </Link>
        <Link
          href="/murdle/online"
          data-testid="murdle-online-link"
          className={BUTTON}
        >
          {T.playOnline}
        </Link>
      </GameHeader>
      {game.kase === null ? (
        <CaseList game={game} />
      ) : (
        <CaseView
          key={game.kase.id}
          game={game}
          kase={game.kase}
          onBack={game.toList}
          onOpen={game.open}
        />
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

/** The cases, with the search and the filters over them. */
function CaseList({ game }: { readonly game: MurdleApi }): ReactElement {
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
    <section className="flex flex-col gap-3" data-testid="murdle-list">
      <h2 className="text-lg font-bold">{T.chooseCase}</h2>
      {controls}
      {shown.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{T.noCases}</p>
      )}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((kase) => (
          <li key={kase.id}>
            <CaseTile game={game} kase={kase} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** One case in the list. */
function CaseTile({
  game,
  kase,
}: {
  readonly game: MurdleApi;
  readonly kase: Case;
}): ReactElement {
  const solved = game.solved.has(kase.id);
  return (
    <button
      type="button"
      data-testid={`murdle-case-${kase.id}`}
      onClick={() => {
        keepScroll();
        game.open(kase.id);
      }}
      className="flex h-full w-full cursor-pointer flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-4 text-left shadow-sm hover:border-amber-400 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <span className="flex gap-1 text-2xl" aria-hidden="true">
        {kase.suspects.map((one) => (
          <span key={one.id}>{one.icon}</span>
        ))}
      </span>
      <span className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <span className="text-base font-bold">{titleOf(kase)}</span>
        <CaseLabels kase={kase} />
      </span>
      <span className="line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">
        {kase.story}
      </span>
      <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
        {solved ? `✓ ${T.solved}` : game.begun.has(kase.id) ? T.resume : T.open}
      </span>
    </button>
  );
}

/**
 * One open case - at one screen, or online with everybody on the same grid.
 *
 * @param props - the game, as either hook hands it over, its case, and at one
 *   screen the way back to the list and to the cases beside it
 * @returns the case
 */
export function CaseView({
  game,
  kase,
  onBack,
  onOpen,
}: {
  readonly game: MurdleApi;
  readonly kase: Case;
  /** Back to the list of cases - only at one screen; online the room decides. */
  readonly onBack?: () => void;
  /** Another case, the one before or after - only at one screen too. */
  readonly onOpen?: (id: string) => void;
}): ReactElement {
  const [before, after] = neighboursOf(kase);
  const over = game.solvedMs !== null || game.peeking;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-bold" data-testid="murdle-case-name">
          {titleOf(kase)}
        </h2>
        <CaseLabels kase={kase} />
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
        <span className="min-w-[14rem] flex-1">{kase.story}</span>
        <span className="flex shrink-0 items-center gap-1">
          <CaseClock game={game} />
          {onBack !== undefined && onOpen !== undefined && (
            <>
              <button
                type="button"
                data-testid="murdle-previous"
                aria-label={T.previousCase}
                title={before === undefined ? undefined : titleOf(before)}
                disabled={before === undefined}
                onClick={() => before !== undefined && onOpen(before.id)}
                className={STEP_BUTTON}
              >
                {"←"}
              </button>
              <button
                type="button"
                data-testid="murdle-next-arrow"
                aria-label={T.nextCaseArrow}
                title={after === undefined ? undefined : titleOf(after)}
                disabled={after === undefined}
                onClick={() => after !== undefined && onOpen(after.id)}
                className={STEP_BUTTON}
              >
                {"→"}
              </button>
              <button
                type="button"
                data-testid="murdle-to-list"
                onClick={onBack}
                className="cursor-pointer rounded-full border border-amber-300 bg-white/80 px-3 py-1 text-sm font-semibold text-amber-900 hover:bg-white dark:border-amber-800 dark:bg-zinc-900/60 dark:text-amber-100 dark:hover:bg-zinc-900"
              >
                {T.toCases}
              </button>
            </>
          )}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <CaseCards kase={kase} />
        <div className="flex flex-col gap-4">
          <CaseClues kase={kase} />
          <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase dark:text-zinc-400">
              {T.grid}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {T.gridHelp}
            </p>
            <DeductionGrid
              kase={kase}
              marks={game.marks}
              disabled={over}
              onTap={(block, row, col) => game.tap({ block, row, col })}
            />
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={game.autoCross}
                onChange={(event) => game.setAutoCross(event.target.checked)}
                data-testid="murdle-auto-cross"
                className="h-4 w-4 cursor-pointer accent-amber-600"
              />
              {T.autoCross}
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={game.undo}
                disabled={!game.canUndo}
                data-testid="murdle-undo"
                className={BUTTON}
              >
                {T.undo}
              </button>
              <button
                type="button"
                onClick={game.restart}
                disabled={over}
                data-testid="murdle-restart"
                className={BUTTON}
              >
                {T.restart}
              </button>
            </div>
          </section>
          <AccusationForm game={game} kase={kase} />
          <div className="flex flex-wrap gap-2">
            <HintButton
              game={game}
              total={kase.hints.length}
              disabled={
                game.solvedMs !== null || game.shownHints >= kase.hints.length
              }
            />
            <RevealButton game={game} />
            {/* The case as a page of the book, in a tab of its own - printed
                or saved as a PDF from there. */}
            <Link
              href={`/murdle/drucken/${kase.id}/`}
              target="_blank"
              rel="noopener"
              prefetch={false}
              data-testid="murdle-print"
              title={T.printTitle}
              className={BUTTON}
            >
              {T.print}
            </Link>
          </div>
          {game.shownHints > 0 && <HintList game={game} kase={kase} />}
          {game.peeking && <SolutionTable kase={kase} />}
          <SolvedDialog game={game} kase={kase} />
        </div>
      </div>
    </div>
  );
}

/** How long "Tipp" has to be held to show every step and fill the grid, in milliseconds. */
const ALL_HINTS_MS = 1000;

/**
 * "Tipp": a click shows the next step, holding it for a second shows every
 * step and fills the whole grid in, as in Murdoku. A bar fills up while it is
 * held; the release after the hold is not a click as well.
 */
function HintButton({
  game,
  total,
  disabled,
}: {
  readonly game: MurdleApi;
  readonly total: number;
  readonly disabled: boolean;
}): ReactElement {
  const timer = useRef<number | null>(null);
  const held = useRef(false);
  const [holding, setHolding] = useState(false);
  const stop = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    setHolding(false);
  };
  return (
    <button
      type="button"
      data-testid="murdle-hint"
      disabled={disabled}
      title={T.hintHold}
      onPointerDown={() => {
        held.current = false;
        stop();
        setHolding(true);
        timer.current = window.setTimeout(() => {
          timer.current = null;
          held.current = true;
          setHolding(false);
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
      className={`${BUTTON} relative overflow-hidden select-none`}
    >
      {/* The bar that fills while the button is held. */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 bg-sky-200/70 dark:bg-sky-800/60"
        style={{
          width: holding ? "100%" : "0%",
          transition: holding
            ? `width ${String(ALL_HINTS_MS)}ms linear`
            : "none",
        }}
      />
      <span className="relative">
        {game.shownHints === 0
          ? T.hint
          : `${T.hint} (${String(game.shownHints)}/${String(total)})`}
      </span>
    </button>
  );
}

/** "Wer? Womit? Wo? (Warum?)" and the answer to it. */
function AccusationForm({
  game,
  kase,
}: {
  readonly game: MurdleApi;
  readonly kase: Case;
}): ReactElement {
  const choice = game.draft;
  const solved = game.solvedMs !== null;
  const shown: Accusation = solved
    ? answerOf(kase)
    : {
        suspect: choice.suspect,
        weapon: choice.weapon,
        location: choice.location,
        ...(kase.motives === undefined ? {} : { motive: choice.motive }),
      };
  const complete =
    shown.suspect !== "" &&
    shown.weapon !== "" &&
    shown.location !== "" &&
    shown.motive !== "";
  const fields: readonly {
    readonly key: keyof typeof choice;
    readonly label: string;
    readonly items: readonly {
      readonly id: string;
      readonly name: string;
      readonly icon: string;
    }[];
  }[] = [
    { key: "suspect", label: T.who, items: kase.suspects },
    { key: "weapon", label: T.what, items: kase.weapons },
    { key: "location", label: T.where, items: kase.locations },
    ...(kase.motives === undefined
      ? []
      : [{ key: "motive" as const, label: T.why, items: kase.motives }]),
  ];
  return (
    <section
      className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
      data-testid="murdle-accusation"
    >
      <h3 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase dark:text-zinc-400">
        {T.accusation}
      </h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field.key} className="flex flex-col gap-1">
            <span className="text-sm font-bold">{field.label}</span>
            <select
              value={shown[field.key] ?? ""}
              disabled={solved || game.peeking}
              onChange={(event) => game.setDraft(field.key, event.target.value)}
              data-testid={`murdle-accuse-${field.key}`}
              className={SELECT}
            >
              <option value="">{T.choose}</option>
              {field.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {`${item.icon} ${capitalised(item.name)}`}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          data-testid="murdle-accuse"
          disabled={!complete || solved || game.peeking}
          onClick={() => game.accuse(shown)}
          className="cursor-pointer rounded-lg bg-rose-700 px-4 py-1.5 text-sm font-semibold text-white hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {T.accuse}
        </button>
        {game.wrong > 0 && !solved && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {T.wrongCount(game.wrong)}
          </span>
        )}
      </div>
      {game.verdict !== null && !game.verdict.right && (
        <p
          key={game.verdict.nonce}
          role="status"
          data-testid="murdle-wrong"
          className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800 dark:bg-rose-950/50 dark:text-rose-200"
        >
          {T.wrong}
        </p>
      )}
    </section>
  );
}

/** The steps of help shown so far. */
function HintList({
  game,
  kase,
}: {
  readonly game: MurdleApi;
  readonly kase: Case;
}): ReactElement {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-950 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100">
      <ol
        data-testid="murdle-hints"
        className="flex list-decimal flex-col gap-1.5 pl-5"
      >
        {kase.hints.slice(0, game.shownHints).map((step, index) => {
          const live =
            (step.marks ?? []).length > 0 &&
            !game.peeking &&
            game.solvedMs === null;
          const content = (
            <>
              {step.book === true && (
                <span className="mr-1 rounded bg-sky-200 px-1 text-[11px] font-bold text-sky-900 dark:bg-sky-800 dark:text-sky-100">
                  {T.bookHint}
                </span>
              )}
              {step.text}
            </>
          );
          return (
            <li key={step.text}>
              {live ? (
                // A step that concludes squares can be carried out, as in
                // Murdoku. A div rather than a button: a button lines up with
                // its last line, and the list's number would sit below it.
                <div
                  role="button"
                  tabIndex={0}
                  data-testid={`murdle-hint-${String(index)}`}
                  onClick={() => game.applyHint(index)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      game.applyHint(index);
                    }
                  }}
                  title={T.applyHint}
                  className="cursor-pointer rounded-md hover:bg-sky-100 dark:hover:bg-sky-900/50"
                >
                  {content}{" "}
                  <span className="font-semibold whitespace-nowrap text-sky-700 dark:text-sky-300">
                    {`▶ ${T.applyHint}`}
                  </span>
                </div>
              ) : (
                content
              )}
            </li>
          );
        })}
      </ol>
      <button
        type="button"
        onClick={game.hideHints}
        className="cursor-pointer self-end text-xs font-semibold text-sky-700 hover:underline dark:text-sky-300"
      >
        {T.hideHints}
      </button>
    </div>
  );
}

/** The solution, as the book prints it: one line per suspect. */
function SolutionTable({ kase }: { readonly kase: Case }): ReactElement {
  const name = (items: readonly { id: string; name: string }[], id?: string) =>
    items.find((one) => one.id === id)?.name ?? "";
  return (
    <section
      className="flex flex-col gap-2 rounded-2xl border border-amber-400 bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100"
      data-testid="murdle-solution"
    >
      <h3 className="font-bold">{T.solution}</h3>
      <ul className="flex flex-col gap-1">
        {kase.suspects.map((suspect) => {
          const own = kase.solution[suspect.id];
          const parts = [
            suspect.name,
            name(kase.weapons, own.weapon),
            name(kase.locations, own.location),
            ...(kase.motives === undefined
              ? []
              : [name(kase.motives, own.motive)]),
          ];
          return (
            <li
              key={suspect.id}
              className={suspect.id === kase.murderer ? "font-bold" : ""}
            >
              {parts.join(" | ")}
              {suspect.id === kase.murderer ? ` - ${T.murderer}` : ""}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * The right accusation, spelled out question by question.
 *
 * @param kase - the case
 * @returns "Wer? Pater Mango - Womit? Eine Harpune - Wo? Das Dock"
 */
function confession(kase: Case): string {
  const answer = answerOf(kase);
  const suspect = kase.suspects.find((one) => one.id === answer.suspect);
  const weapon = kase.weapons.find((one) => one.id === answer.weapon);
  const location = kase.locations.find((one) => one.id === answer.location);
  const motive = kase.motives?.find((one) => one.id === answer.motive);
  return [
    `${T.who} ${suspect?.name ?? ""}`,
    `${T.what} ${capitalised(weapon?.name ?? "")}`,
    `${T.where} ${capitalised(location?.name ?? "")}`,
    ...(motive === undefined ? [] : [`${T.why} ${capitalised(motive.name)}`]),
  ].join(" - ");
}

/** The dialog after a right accusation. */
function SolvedDialog({
  game,
  kase,
}: {
  readonly game: MurdleApi;
  readonly kase: Case;
}): ReactElement {
  const dialog = useRef<HTMLDialogElement>(null);
  const nonce = game.verdict?.right === true ? game.verdict.nonce : null;
  const [dismissed, setDismissed] = useState<number | null>(null);
  const open = nonce !== null && nonce !== dismissed;
  useEffect(() => {
    if (open && dialog.current !== null && !dialog.current.open) {
      dialog.current.showModal();
    }
  }, [open]);
  const close = () => {
    setDismissed(nonce);
    dialog.current?.close();
  };
  return (
    <dialog
      ref={dialog}
      data-testid="murdle-solved-dialog"
      aria-labelledby="murdle-solved-title"
      onClose={() => setDismissed(nonce)}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl bg-white p-0 text-zinc-900 shadow-2xl backdrop:bg-zinc-950/30 dark:bg-zinc-900 dark:text-zinc-100"
    >
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-start gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-2xl dark:bg-emerald-950"
            aria-hidden="true"
          >
            {"\u{1F389}"}
          </span>
          <div className="flex flex-col gap-1">
            <h2 id="murdle-solved-title" className="text-lg font-bold">
              {T.solvedTitle}
            </h2>
            <p
              className="text-sm font-semibold"
              data-testid="murdle-solved-text"
            >
              {confession(kase)}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {`⏱ ${clockText(game.solvedMs ?? 0)}`}
              {game.hints > 0 ? ` - ${T.hintsUsed(game.hints)}` : ""}
              {game.wrong > 0 ? ` - ${T.wrongCount(game.wrong)}` : ""}
            </p>
            {kase.outro !== undefined && (
              <p className="text-sm text-zinc-600 italic dark:text-zinc-300">
                {kase.outro}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {game.next !== null && (
            <button
              type="button"
              data-testid="murdle-next"
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
              data-testid="murdle-replay"
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
            data-testid="murdle-close"
            onClick={close}
            autoFocus
            className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {T.close}
          </button>
        </div>
      </div>
    </dialog>
  );
}

/**
 * "Lösung zeigen" and "Lösung ausblenden" - with a question the first time.
 * After that the case is given up already, and the solution comes and goes
 * freely.
 */
function RevealButton({ game }: { readonly game: MurdleApi }): ReactElement {
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
        data-testid="murdle-reveal"
        onClick={press}
        disabled={game.solvedMs !== null}
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
        data-testid="murdle-reveal-dialog"
        aria-labelledby="murdle-reveal-title"
        onClick={(event) => {
          // A click on the dimmed backdrop lands on the dialog itself.
          if (event.target === dialog.current) {
            close();
          }
        }}
        className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-2xl bg-white p-0 text-zinc-900 shadow-2xl backdrop:bg-zinc-950/60 dark:bg-zinc-900 dark:text-zinc-100"
      >
        <div className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-1">
            <h2 id="murdle-reveal-title" className="text-lg font-bold">
              {T.revealTitle}
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              {T.revealText}
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={close}
              autoFocus
              className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {T.revealNo}
            </button>
            <button
              type="button"
              data-testid="murdle-reveal-yes"
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

/**
 * How long the case has been worked on - running while it is open, standing
 * still once it is solved.
 */
function CaseClock({ game }: { readonly game: MurdleApi }): ReactElement {
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
      data-testid="murdle-clock"
      title={T.clockTitle}
      className="shrink-0 rounded-full bg-white/80 px-3 py-1 font-mono text-sm font-bold text-amber-900 tabular-nums dark:bg-zinc-900/60 dark:text-amber-100"
    >
      {`⏱ ${clockText(game.solvedMs ?? game.elapsed())}`}
    </span>
  );
}
