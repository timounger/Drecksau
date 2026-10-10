/**
 * Murdoku on screen: the list of cases, and a case with its suspects, its map
 * and the accusation.
 *
 * @module
 */
"use client";

import Link from "next/link";
import { useRef, type ReactElement } from "react";
import { GameHeader } from "@/components/game-header";
import { EMPTY_BOARD } from "@/games/murdoku/engine/board";
import { LEVELS, THING_KEYS } from "@/games/murdoku/engine/levels";
import {
  cluePoints,
  solutionOf,
  verdictOf,
} from "@/games/murdoku/engine/rules";
import type { Level, Suspect, Thing } from "@/games/murdoku/engine/types";
import { CaseMap, THING_FACES } from "@/games/murdoku/components/case-map";
import { useMurdoku, type MurdokuApi } from "@/games/murdoku/hooks/use-murdoku";
import { MURDOKU_RULES } from "@/games/murdoku/i18n/rules";
import {
  DIFFICULTY_NAMES,
  MURDOKU_TEXTS as T,
  clueText,
  thingName,
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

/** The cases to choose from. */
function CaseList({ game }: { readonly game: MurdokuApi }): ReactElement {
  return (
    <section className="flex flex-col gap-3" data-testid="murdoku-list">
      <h2 className="text-lg font-bold">{T.chooseCase}</h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LEVELS.map((level, at) => {
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
                  <span className="text-base font-bold">
                    {`${String(at + 1)}. ${level.name}`}
                  </span>
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

  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
        {level.story}
      </p>

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
              onClear={game.clear}
              glow={
                picked === undefined
                  ? []
                  : cluePoints(level, picked, game.board.placement)
              }
            />
          </div>
          <Legend level={level} />
          <div className="flex flex-wrap gap-2">
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
            <button
              type="button"
              data-testid="murdoku-hint"
              onClick={game.hint}
              disabled={over || game.shownHints >= level.hints.length}
              className={BUTTON}
            >
              {game.shownHints === 0
                ? T.hint
                : `${T.hint} (${String(game.shownHints)}/${String(level.hints.length)})`}
            </button>
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
          <Accusation game={game} level={level} />
        </section>
      </div>
    </div>
  );
}

/**
 * What may be stood on and what may not - as the printed case shows it next
 * to the map, and only with what this map actually has.
 */
function Legend({ level }: { readonly level: Level }): ReactElement {
  const present = new Set<Thing>();
  for (const row of level.thingMap) {
    for (const key of row) {
      const thing = THING_KEYS[key];
      if (thing !== undefined) {
        present.add(thing);
      }
    }
  }
  const things = THING_ORDER.filter((thing) => present.has(thing));
  const water = level.areas.some((area) => area.ground === "water");
  const free = things.filter((thing) => STANDS_ON.has(thing));
  const blocked = things.filter((thing) => !STANDS_ON.has(thing));
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
          {water && (
            <span className="flex items-center gap-1">
              <span
                className="inline-block h-4 w-4 rounded-sm"
                style={{ backgroundColor: WATER_TINT }}
                aria-hidden="true"
              />
              {T.water}
            </span>
          )}
          {free.map((thing) => (
            <LegendItem key={thing} thing={thing} />
          ))}
        </span>
      </div>
      <div className="flex flex-col gap-1 rounded-xl bg-rose-50 px-3 py-2 dark:bg-rose-950/40">
        <span className="font-semibold text-rose-800 dark:text-rose-300">
          {T.cannotStand}
        </span>
        <span className="flex flex-wrap gap-x-3 gap-y-1">
          {blocked.map((thing) => (
            <LegendItem key={thing} thing={thing} />
          ))}
        </span>
      </div>
    </div>
  );
}

/** One thing in the legend: how it looks and what it is called. */
function LegendItem({ thing }: { readonly thing: Thing }): ReactElement {
  return (
    <span className="flex items-center gap-1">
      <span className="text-base leading-none" aria-hidden="true">
        {THING_FACES[thing]}
      </span>
      {thingName(thing)}
    </span>
  );
}

/** The things in the order the legend lists them. */
const THING_ORDER: readonly Thing[] = [
  "house",
  "boat",
  "tree",
  "shrub",
  "shark",
  "boar",
  "boulder",
  "cactus",
];

/** The things somebody may stand on. */
const STANDS_ON: ReadonlySet<Thing> = new Set<Thing>(["house", "boat"]);

/** The colour of water in the legend - the sea on the map. */
const WATER_TINT = "#a7d3f2";

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
  const verdict = verdictOf(level, suspect, game.board.placement);
  const victim = suspect.clue.kind === "victim";
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
        {verdict === "holds" && (
          <span className="text-emerald-600" aria-label="passt">
            {"✓"}
          </span>
        )}
        {verdict === "broken" && (
          <span className="text-red-600" aria-label="passt nicht">
            {"✗"}
          </span>
        )}
      </span>
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

/** "The thief is ..." - and what came of it. */
function Accusation({
  game,
  level,
}: {
  readonly game: MurdokuApi;
  readonly level: Level;
}): ReactElement {
  const outcome = game.outcome;
  const nameOf = (id: string) =>
    level.suspects.find((one) => one.id === id)?.name ?? "?";
  const over = outcome?.kind === "right" || game.peeking;
  const solvable = solutionOf(level) !== null;

  return (
    <div
      className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
      data-testid="murdoku-accusation"
    >
      <span className="text-sm font-bold">{T.accuse(level.culprit.name)}</span>
      {!solvable && (
        <span className="text-sm text-red-600">{T.noSolution}</span>
      )}
      {!over && (
        <>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {T.accuseHint}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {level.suspects
              .filter((one) => one.clue.kind !== "victim")
              .map((suspect) => (
                <button
                  key={suspect.id}
                  type="button"
                  data-testid={`murdoku-accuse-${suspect.id}`}
                  onClick={() => game.accuse(suspect.id)}
                  className="cursor-pointer rounded-full border px-3 py-1 text-sm font-semibold hover:brightness-95"
                  style={{ borderColor: suspect.colour, color: suspect.colour }}
                >
                  {suspect.name}
                </button>
              ))}
          </div>
        </>
      )}
      {outcome?.kind === "wrong" && (
        <p
          className="text-sm font-medium text-red-700 dark:text-red-400"
          data-testid="murdoku-result"
        >
          {T.wrong(nameOf(outcome.who))}
        </p>
      )}
      {outcome?.kind === "right" && (
        <p
          className="text-base font-bold text-emerald-700 dark:text-emerald-400"
          data-testid="murdoku-result"
        >
          {game.peeked
            ? T.rightPeeked(nameOf(outcome.who), level.culprit.name)
            : T.right(nameOf(outcome.who), level.culprit.name)}{" "}
          <span className="font-normal">
            {T.time(
              Math.floor(outcome.ms / SECOND / MINUTE),
              Math.floor(outcome.ms / SECOND) % MINUTE,
            )}
            {game.hints > 0 ? ` - ${T.hintsUsed(game.hints)}` : ""}
          </span>
        </p>
      )}
      {game.culprit !== null && (
        <p className="text-sm font-medium" data-testid="murdoku-result">
          {T.gaveUp(nameOf(game.culprit), level.culprit.name)}
        </p>
      )}
    </div>
  );
}
