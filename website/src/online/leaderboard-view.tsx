/**
 * The board of the best ten, and the field for putting a name on a place.
 *
 * @module
 * @remarks
 * The same board in two places in every game that has one: on the panel at the
 * end of a run, where it says whether what was just done takes a place, and on
 * the statistics page, where it is simply there to be looked at.
 *
 * The wording and the way a result is written belong to the game and are
 * handed in; everything else - fetching, ranking, the medals, the name field -
 * is the same everywhere and lives here.
 *
 * It fetches once when it appears. A board that listened for changes would
 * shuffle under the reader's eyes for the sake of a stranger finishing
 * somewhere else, and there is nothing to be done about a place that moves
 * while you are reading it.
 */
"use client";

import { useCallback, useEffect, useState, type ReactElement } from "react";
import {
  NAME_LIMIT,
  bestOf,
  loadScores,
  makesTheBoard,
  saveScore,
  type Board,
  type Score,
} from "@/online/leaderboard";
import { loadPlayerName, savePlayerName } from "@/online/player-name";

/** The medals of the first three places. */
const MEDALS = ["\u{1F947}", "\u{1F948}", "\u{1F949}"] as const;

/** How a place looks: gold, silver, bronze, or one of the rest. */
const PLACE_STYLE = [
  "border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
  "border-zinc-400 bg-zinc-100 text-zinc-900 dark:bg-zinc-800/60 dark:text-zinc-100",
  "border-orange-400 bg-orange-50 text-orange-900 dark:bg-orange-950/40 dark:text-orange-100",
] as const;

/** How the board is getting on. */
type Loading = "loading" | "ready" | "failed";

/** What the board needs to know about the run just finished, if any. */
export type BoardRun = {
  /** What was achieved, in whatever the board ranks. */
  readonly value: number;
  /** True while the run was one that counts for the board. */
  readonly counts: boolean;
};

/** Everything the board says, in the game's own words. */
export type BoardTexts = {
  readonly title: string;
  readonly subtitle: string;
  readonly loading: string;
  readonly failed: string;
  readonly empty: string;
  readonly yours: string;
  /** Why the run just finished does not count. */
  readonly partial: string;
  readonly madeIt: (place: number) => string;
  readonly entered: string;
  readonly missed: string;
  readonly namePlaceholder: string;
  readonly enter: string;
  readonly entering: string;
};

/** Props of {@link LeaderboardView}. */
export type LeaderboardViewProps = {
  /** Which board: where it lives and which way it reads. */
  readonly board: Board;
  /** What it says. */
  readonly texts: BoardTexts;
  /** How a result is written out. */
  readonly format: (value: number) => string;
  /** The prefix of the test ids, so each game keeps its own. */
  readonly testId: string;
  /** The run just finished, or null on the statistics page. */
  readonly run?: BoardRun | null;
};

/**
 * The board, with the name field when there is a place to be had.
 *
 * @param props - the board, its words, and the run just finished if any
 * @returns the board element
 */
export function LeaderboardView({
  board,
  texts,
  format,
  testId,
  run = null,
}: LeaderboardViewProps): ReactElement {
  const [scores, setScores] = useState<readonly Score[]>([]);
  const [state, setState] = useState<Loading>("loading");
  const [name, setName] = useState("");
  const [entered, setEntered] = useState<Score | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    loadScores(board)
      .then((found) => {
        if (alive) {
          setScores(found);
          setState("ready");
        }
      })
      .catch(() => {
        if (alive) {
          setState("failed");
        }
      })
      .finally(() => {
        // The name the player last went by online, so the field comes up
        // filled in. Read here rather than at the first render because
        // storage is a browser thing and that render happens on the server.
        if (alive) {
          setName((chosen) => (chosen === "" ? loadPlayerName() : chosen));
        }
      });
    return () => {
      alive = false;
    };
  }, [board]);

  const places = bestOf(
    board,
    entered === null ? scores : [...scores, entered],
  );
  const wanted =
    run !== null &&
    run.counts &&
    entered === null &&
    state === "ready" &&
    makesTheBoard(board, scores, run.value);
  const place = places.findIndex((each) => each === entered) + 1;

  const enter = useCallback(() => {
    const chosen = name.trim();
    if (run === null || chosen === "" || saving) {
      return;
    }
    const score: Score = { name: chosen, value: run.value, at: Date.now() };
    setSaving(true);
    savePlayerName(chosen);
    saveScore(board, score)
      .then(() => setEntered(score))
      .catch(() => setState("failed"))
      .finally(() => setSaving(false));
  }, [board, name, run, saving]);

  return (
    <section
      data-testid={`${testId}-board`}
      className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white/80 p-3 text-left text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-100"
    >
      <header className="mb-2">
        <h2 className="text-base font-bold">{texts.title}</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {texts.subtitle}
        </p>
      </header>

      {state === "loading" && (
        <p className="text-sm text-zinc-500">{texts.loading}</p>
      )}
      {state === "failed" && (
        <p className="text-sm text-red-600 dark:text-red-400">{texts.failed}</p>
      )}
      {state === "ready" && places.length === 0 && (
        <p className="text-sm text-zinc-500">{texts.empty}</p>
      )}

      {places.length > 0 && (
        <ol className="flex flex-col gap-1">
          {places.map((score, index) => (
            <Place
              key={`${score.name}-${score.value}-${score.at}`}
              score={score}
              index={index}
              mine={score === entered}
              format={format}
              testId={testId}
            />
          ))}
        </ol>
      )}

      {run !== null && state === "ready" && (
        <Yours
          run={run}
          texts={texts}
          format={format}
          testId={testId}
          wanted={wanted}
          place={place}
          entered={entered !== null}
          name={name}
          saving={saving}
          onName={setName}
          onEnter={enter}
        />
      )}
    </section>
  );
}

/** One place on the board. */
function Place({
  score,
  index,
  mine,
  format,
  testId,
}: {
  readonly score: Score;
  readonly index: number;
  readonly mine: boolean;
  readonly format: (value: number) => string;
  readonly testId: string;
}): ReactElement {
  const medal: string | undefined = MEDALS[index];
  const style =
    PLACE_STYLE[index] ?? "border-transparent text-zinc-700 dark:text-zinc-300";
  return (
    <li
      data-testid={`${testId}-place-${index + 1}`}
      className={`flex items-center gap-2 rounded-lg border px-2 py-1 text-sm ${style} ${
        mine ? "ring-2 ring-emerald-500" : ""
      }`}
    >
      <span className="w-8 shrink-0 text-right font-bold tabular-nums">
        {medal ?? `${index + 1}.`}
      </span>
      <span className="min-w-0 flex-1 truncate font-medium">{score.name}</span>
      <span className="shrink-0 font-mono tabular-nums">
        {format(score.value)}
      </span>
    </li>
  );
}

/** What the board says about the run just finished. */
function Yours({
  run,
  texts,
  format,
  testId,
  wanted,
  place,
  entered,
  name,
  saving,
  onName,
  onEnter,
}: {
  readonly run: BoardRun;
  readonly texts: BoardTexts;
  readonly format: (value: number) => string;
  readonly testId: string;
  readonly wanted: boolean;
  readonly place: number;
  readonly entered: boolean;
  readonly name: string;
  readonly saving: boolean;
  readonly onName: (name: string) => void;
  readonly onEnter: () => void;
}): ReactElement {
  return (
    <div className="mt-3 border-t border-zinc-200 pt-2 dark:border-zinc-700">
      <p className="flex items-center justify-between gap-2 text-sm font-semibold">
        <span>{texts.yours}</span>
        <span className="font-mono tabular-nums">{format(run.value)}</span>
      </p>
      {!run.counts && (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {texts.partial}
        </p>
      )}
      {entered && (
        <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          {place > 0 ? texts.madeIt(place) : texts.entered}
        </p>
      )}
      {run.counts && !wanted && !entered && (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {texts.missed}
        </p>
      )}
      {wanted && (
        <form
          className="mt-2 flex flex-wrap items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            onEnter();
          }}
        >
          <input
            data-testid={`${testId}-board-name`}
            value={name}
            onChange={(event) => onName(event.target.value)}
            maxLength={NAME_LIMIT}
            placeholder={texts.namePlaceholder}
            className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800"
          />
          <button
            type="submit"
            disabled={saving || name.trim() === ""}
            className="cursor-pointer rounded-lg bg-emerald-600 px-3 py-1 text-sm font-semibold text-white disabled:cursor-default disabled:opacity-50"
          >
            {saving ? texts.entering : texts.enter}
          </button>
        </form>
      )}
    </div>
  );
}
