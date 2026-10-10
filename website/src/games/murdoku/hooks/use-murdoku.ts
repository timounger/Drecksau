/**
 * The state of a Murdoku session: which case is open, the notes on it, and
 * what has been solved - kept in the browser so a case can be finished later.
 *
 * @module
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  EMPTY_BOARD,
  cellKey,
  crossed,
  noted,
  removed,
  standingOn,
  wiped,
  type Board,
} from "@/games/murdoku/engine/board";
import { settled, stepped } from "@/games/murdoku/engine/actions";
import { LEVELS } from "@/games/murdoku/engine/levels";
import {
  checked,
  culpritOf,
  isStandable,
  solutionOf,
} from "@/games/murdoku/engine/rules";
import type { Cell, Level, Placement } from "@/games/murdoku/engine/types";
import { readStored, storageKey, writeStored } from "@/lib/storage/local-store";
import {
  recordGameFinished,
  recordGameStarted,
  recordPlayTime,
} from "@/lib/stats/stats-recorder";
import { invalidateStats } from "@/lib/stats/stats-store";

/** Which game this is, for storage and statistics. */
const GAME_ID = "murdoku";

/** Where the progress is kept. */
const STORE_KEY = storageKey(GAME_ID, "cases");

/** Schema version of the stored progress - raise it on breaking changes. */
const STORE_VERSION = 2;

/** How many steps back "undo" can go. */
const HISTORY = 200;

/** A case that has been started and not yet finished. */
type Notes = {
  readonly board: Board;
  readonly startedAt: number;
  /** How many steps of the way to the solution have been shown. */
  readonly hints: number;
  /** Whether the solution has been looked at - then the case can no longer be won. */
  readonly peeked?: boolean;
  /** How long the case has been played so far - only while it was on screen. */
  readonly playedMs?: number;
};

/** What a case's solving has come to so far. */
export type CaseRecord = {
  /** How often it was solved. */
  readonly solves: number;
  /** The fastest solve. */
  readonly bestMs: number;
  /** The last solve. */
  readonly lastMs: number;
  /** All the time spent solving it, every solve together. */
  readonly totalMs: number;
};

/** Everything kept between visits. */
type Stored = {
  readonly solved: readonly string[];
  readonly open: Readonly<Record<string, Notes>>;
  /** Per case, how its solves went. */
  readonly records?: Readonly<Record<string, CaseRecord>>;
};

/** A gap longer than this between two looks at the clock is not counted - a tab left open. */
const MAX_GAP_MS = 60_000;

/** How often the time played is written down and counted, in milliseconds. */
const FLUSH_MS = 15_000;

/** How a case ended, once it has. */
export type Outcome =
  | { readonly kind: "right"; readonly who: string; readonly ms: number }
  | { readonly kind: "wrong"; readonly who: string };

/**
 * The answer to "Bestätigen": per suspect whether they stand right, and a
 * number that is new with every press, so the check is shown again even
 * when the answer is the same.
 */
export type Check = {
  readonly results: Readonly<Record<string, boolean>>;
  readonly nonce: number;
};

/** What the screen gets from {@link useMurdoku}. */
export type MurdokuApi = {
  /** The open case, or null on the list of cases. */
  readonly level: Level | null;
  /** The ids of the cases solved so far. */
  readonly solved: ReadonlySet<string>;
  /** The ids of the cases begun and not finished. */
  readonly begun: ReadonlySet<string>;
  readonly board: Board;
  /** The suspect being pencilled in or placed, or null - then a tap crosses a field out. */
  readonly selected: string | null;
  readonly outcome: Outcome | null;
  /** How many steps of the way to the solution have been used in this case. */
  readonly hints: number;
  /** How many of them are showing right now - none, each time a case is opened. */
  readonly shownHints: number;
  readonly canUndo: boolean;
  /** Whether there is an undo at all - not online, where many write at once. */
  readonly undoable: boolean;
  /** Whether the solution is on the map right now, instead of the player's notes. */
  readonly peeking: boolean;
  /** Whether the solution of this case has been looked at, now or before. */
  readonly peeked: boolean;
  /** The culprit, while the solution is shown - otherwise null. */
  readonly culprit: string | null;
  open: (id: string) => void;
  toList: () => void;
  select: (id: string | null) => void;
  /** A tap on a field of the map: a pencil mark, a cross, or a pawn taken off. */
  tap: (cell: Cell) => void;
  /** A field held down: the chosen person - or the one pencilled in there - placed for certain. */
  hold: (cell: Cell) => void;
  /** A field right-clicked: every mark and cross in it wiped away. */
  clear: (cell: Cell) => void;
  undo: () => void;
  restart: () => void;
  /** Shows the next step of the way to the solution. */
  hint: () => void;
  /** Folds the steps shown away again. */
  hideHints: () => void;
  /** Shows every step of the way at once and carries them all out. */
  allHints: () => void;
  /** Carries out what a step of the way concludes: puts people down, crosses fields out. */
  applyHint: (index: number) => void;
  /** Puts the solution on the map. */
  reveal: () => void;
  /** Takes it off again - back to the player's own notes. */
  hideSolution: () => void;
  /** The last check, until the map changes - or null. */
  readonly check: Check | null;
  /** Checks the map: everybody placed, each right or wrong. */
  confirm: () => void;
  /** Whether "Nochmal" can start the case over. */
  readonly canReplay: boolean;
  /** Starts the case over - a fresh case once it was solved. */
  replay: () => void;
  /** How long the open case has been played, right now. */
  elapsed: () => number;
  /** Whether its clock is running - not once it is solved. */
  readonly running: boolean;
  /** Opens the next case, or null after the last one. */
  readonly next: (() => void) | null;
};

/**
 * Murdoku, as state.
 *
 * @returns the open case, the notes on it and what can be done with them
 */
export function useMurdoku(): MurdokuApi {
  const [stored, setStored] = useState<Stored>({ solved: [], open: {} });
  const [level, setLevel] = useState<Level | null>(null);
  const [board, setBoard] = useState<Board>(EMPTY_BOARD);
  const [history, setHistory] = useState<readonly Board[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [check, setCheck] = useState<Check | null>(null);
  const [hints, setHints] = useState(0);
  const [shownHints, setShownHints] = useState(0);
  const [peeking, setPeeking] = useState(false);
  const [peeked, setPeeked] = useState(false);
  const startedAt = useRef(0);
  // **The clock of the open case.** What was played before, and since when it
  // runs now - null while it stands still: solved, or the tab out of sight.
  // `counted` is how much of it the collection's statistics already have.
  const clock = useRef({ played: 0, since: null as number | null, counted: 0 });

  /** How long the open case has been played, up to now. */
  const elapsed = useCallback(() => {
    const now = Date.now();
    const since = clock.current.since;
    return (
      clock.current.played +
      (since === null ? 0 : Math.min(now - since, MAX_GAP_MS))
    );
  }, []);

  /** Books the time played since the last booking, for the statistics. */
  const count = useCallback(() => {
    const total = elapsed();
    const fresh = total - clock.current.counted;
    if (fresh > 0) {
      clock.current.counted = total;
      recordPlayTime(GAME_ID, fresh, Date.now());
      invalidateStats();
    }
  }, [elapsed]);

  /** Stops the clock where it is. */
  const halt = useCallback(() => {
    count();
    clock.current = { ...clock.current, played: elapsed(), since: null };
  }, [count, elapsed]);

  // The progress is read once after the first render, so the page the server
  // sent and the first one in the browser are the same.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const read = readStored(STORE_KEY, STORE_VERSION, isStored);
    if (read !== null) {
      setStored(read);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Out of sight, the clock stands still; back in sight, it runs on. Now
  // and then the time played is booked, so a closed tab loses little.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        halt();
      } else if (level !== null && outcome?.kind !== "right") {
        clock.current = { ...clock.current, since: Date.now() };
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    const timer = window.setInterval(count, FLUSH_MS);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(timer);
    };
  }, [count, halt, level, outcome]);

  /** Keeps the progress, in memory and in the browser. */
  const keep = useCallback((next: Stored) => {
    setStored(next);
    writeStored(STORE_KEY, STORE_VERSION, next);
  }, []);

  /** Writes the notes of the open case down, and moves them on. */
  const write = useCallback(
    (next: Board, nextHints: number = hints) => {
      if (level !== null) {
        setHistory((before) => [...before, board].slice(-HISTORY));
        setBoard(next);
        // A changed map is no longer the map that was checked.
        setCheck(null);
        keep({
          ...stored,
          open: {
            ...stored.open,
            [level.id]: {
              board: next,
              startedAt: startedAt.current,
              playedMs: elapsed(),
              hints: nextHints,
              peeked,
            },
          },
        });
      }
    },
    [board, elapsed, hints, keep, level, peeked, stored],
  );

  /** The case is over: off the list of open ones, onto the solved one if won. */
  const finish = useCallback(
    (won: boolean, final: Board) => {
      if (level !== null) {
        const open = Object.fromEntries(
          Object.entries(stored.open).filter(([id]) => id !== level.id),
        );
        // A case whose solution was looked at is not solved, even when the
        // culprit is named afterwards - and it was counted as lost already.
        halt();
        const took = clock.current.played;
        const before = stored.records?.[level.id];
        const fair = won && !peeked;
        keep({
          solved:
            fair && !stored.solved.includes(level.id)
              ? [...stored.solved, level.id]
              : stored.solved,
          open,
          records: fair
            ? {
                ...stored.records,
                [level.id]: {
                  solves: (before?.solves ?? 0) + 1,
                  bestMs: Math.min(before?.bestMs ?? took, took),
                  lastMs: took,
                  totalMs: (before?.totalMs ?? 0) + took,
                },
              }
            : stored.records,
        });
        setBoard(final);
        setSelected(null);
        setPeeking(false);
        if (!peeked) {
          recordGameFinished(GAME_ID, {
            won,
            durationMs: took,
            finishedAt: Date.now(),
          });
          invalidateStats();
        }
      }
    },
    [halt, keep, level, peeked, stored],
  );

  const open = useCallback(
    (id: string) => {
      const found = LEVELS.find((one) => one.id === id) ?? null;
      const notes = stored.open[id];
      setLevel(found);
      setHistory([]);
      setSelected(null);
      setOutcome(null);
      setCheck(null);
      setShownHints(0);
      setPeeking(false);
      setPeeked(notes?.peeked ?? false);
      // The clock picks up where the case was left - or starts at nought.
      const played = notes?.playedMs ?? 0;
      clock.current = { played, since: Date.now(), counted: played };
      if (notes === undefined) {
        // A fresh case counts as a game begun; picking one up again does not.
        startedAt.current = Date.now();
        setBoard(EMPTY_BOARD);
        setHints(0);
        recordGameStarted(GAME_ID, startedAt.current);
        invalidateStats();
      } else {
        startedAt.current = notes.startedAt;
        setBoard(notes.board);
        setHints(notes.hints);
      }
    },
    [stored],
  );

  const toList = useCallback(() => {
    halt();
    setLevel(null);
    setPeeking(false);
    setSelected(null);
    setOutcome(null);
  }, [halt]);

  const select = useCallback((id: string | null) => {
    setSelected(id);
  }, []);

  const tap = useCallback(
    (cell: Cell) => {
      const there = standingOn(board, cell);
      if (outcome?.kind === "right" || peeking) {
        // A finished case, or the solution on the map, is only looked at.
      } else if (level === null || !isStandable(level, cell)) {
        // Nobody can stand on a tree, a rock or an animal - so there is
        // nothing to mark, cross out or place there either.
      } else if (selected !== null) {
        // A tap only pencils in: "she might have been here". The person stays
        // chosen, so several fields can be marked in a row.
        write(noted(board, selected, cell));
      } else if (there !== null) {
        write(removed(board, there));
        setOutcome(null);
      } else {
        write(crossed(board, cell));
      }
    },
    [board, level, outcome, peeking, selected, write],
  );

  const hold = useCallback(
    (cell: Cell) => {
      const who = selected;
      const over = outcome?.kind === "right" || peeking;
      if (!over && level !== null && who !== null && isStandable(level, cell)) {
        write(settled(level, board, who, cell));
        setSelected(null);
        setOutcome(null);
      }
    },
    [board, level, outcome, peeking, selected, write],
  );

  const clear = useCallback(
    (cell: Cell) => {
      const key = cellKey(cell);
      const written =
        (board.notes[key] ?? []).length > 0 || board.crosses.includes(key);
      if (outcome?.kind !== "right" && !peeking && written) {
        write(wiped(board, cell));
      }
    },
    [board, outcome, peeking, write],
  );

  const undo = useCallback(() => {
    const before = history[history.length - 1];
    if (before !== undefined && level !== null) {
      setHistory(history.slice(0, -1));
      setBoard(before);
      setOutcome(null);
      setCheck(null);
      keep({
        ...stored,
        open: {
          ...stored.open,
          [level.id]: {
            board: before,
            startedAt: startedAt.current,
            playedMs: elapsed(),
            hints,
            peeked,
          },
        },
      });
    }
  }, [history, elapsed, hints, keep, level, peeked, stored]);

  const restart = useCallback(() => {
    write(EMPTY_BOARD);
    setSelected(null);
    setOutcome(null);
  }, [write]);

  // **A hint is a step of reasoning, not a position.** It shows the next
  // step of the way to the solution, as the solution sheet of the case gives
  // it - the player still has to put the people down.
  // The steps used before stay used, but they are folded away when a case is
  // opened again: they come back one per press, and only a step never seen
  // before counts as a new one.
  const hint = useCallback(() => {
    if (shownHints < hints) {
      setShownHints(shownHints + 1);
    } else if (level !== null && hints < level.hints.length) {
      const next = hints + 1;
      setHints(next);
      setShownHints(next);
      keep({
        ...stored,
        open: {
          ...stored.open,
          [level.id]: {
            board,
            startedAt: startedAt.current,
            playedMs: elapsed(),
            hints: next,
            peeked,
          },
        },
      });
    }
  }, [board, elapsed, hints, keep, level, peeked, shownHints, stored]);

  // **All at once**: every step shown and every step carried out, in one
  // write - one "undo" takes it all back.
  const allHints = useCallback(() => {
    const over = outcome?.kind === "right" || peeking;
    if (level !== null && !over) {
      const total = level.hints.length;
      const done = level.hints.reduce(
        (notes, step) => stepped(level, notes, step),
        board,
      );
      setHints(total);
      setShownHints(total);
      write(done, total);
      setSelected(null);
      setOutcome(null);
    }
  }, [board, level, outcome, peeking, write]);

  // **A step can be carried out.** It puts down who it names and crosses out
  // the fields it rules out - in one go, so one "undo" takes it back.
  const applyHint = useCallback(
    (index: number) => {
      const step = level?.hints[index];
      const over = outcome?.kind === "right" || peeking;
      if (level !== null && step !== undefined && !over) {
        write(stepped(level, board, step));
        setSelected(null);
        setOutcome(null);
      }
    },
    [board, level, outcome, peeking, write],
  );

  const hideHints = useCallback(() => {
    setShownHints(0);
  }, []);

  // **The solution can be looked at and put away again.** The player's own
  // notes stay as they were underneath. The first look counts the case as
  // lost - once seen, it can no longer be solved fairly - and that is kept,
  // so it stays lost after a reload too.
  const reveal = useCallback(() => {
    if (level !== null && solutionOf(level) !== null) {
      setPeeking(true);
      setSelected(null);
      setOutcome(null);
      if (!peeked) {
        setPeeked(true);
        keep({
          ...stored,
          open: {
            ...stored.open,
            [level.id]: {
              board,
              startedAt: startedAt.current,
              playedMs: elapsed(),
              hints,
              peeked: true,
            },
          },
        });
        const now = Date.now();
        recordGameFinished(GAME_ID, {
          won: false,
          durationMs: now - startedAt.current,
          finishedAt: now,
        });
        invalidateStats();
      }
    }
  }, [board, elapsed, hints, keep, level, peeked, stored]);

  const hideSolution = useCallback(() => {
    setPeeking(false);
  }, []);

  // **"Bestätigen" checks the whole map at once.** Each suspect is right or
  // wrong against the solution; when all are right the case is solved, and
  // the culprit is whoever was alone with the victim - nobody has to name him.
  const confirm = useCallback(() => {
    const results = level === null ? null : checked(level, board.placement);
    const solution = level === null ? null : solutionOf(level);
    if (level !== null && results !== null && solution !== null) {
      setCheck({ results, nonce: Date.now() });
      setSelected(null);
      if (Object.values(results).every(Boolean)) {
        setOutcome({
          kind: "right",
          who: culpritIn(level, solution),
          ms: elapsed(),
        });
        finish(true, board);
      }
    }
  }, [board, elapsed, finish, level]);

  const solution = level === null ? null : solutionOf(level);
  const at =
    level === null ? -1 : LEVELS.findIndex((one) => one.id === level.id);
  const following = at < 0 ? undefined : LEVELS[at + 1];
  return {
    level,
    solved: new Set(stored.solved),
    begun: new Set(Object.keys(stored.open)),
    // While the solution is shown, it is what the map shows.
    board:
      peeking && solution !== null
        ? { placement: solution, notes: {}, crosses: [] }
        : board,
    selected,
    outcome,
    hints,
    shownHints,
    canUndo: history.length > 0 && !peeking,
    undoable: true,
    peeking,
    peeked,
    culprit:
      peeking && level !== null && solution !== null
        ? culpritIn(level, solution)
        : null,
    open,
    toList,
    select,
    tap,
    hold,
    clear,
    undo,
    restart,
    hint,
    hideHints,
    allHints,
    applyHint,
    reveal,
    hideSolution,
    check,
    confirm,
    canReplay: true,
    elapsed,
    running: level !== null && outcome?.kind !== "right",
    next: following === undefined ? null : () => open(following.id),
    replay: () => {
      if (level !== null && outcome?.kind === "right") {
        // Solved: the case begins anew, as if picked from the list.
        open(level.id);
      } else {
        restart();
      }
      setCheck(null);
    },
  };
}

/** The culprit of a solved case - whoever shares the victim's area. */
function culpritIn(level: Level, solution: Placement): string {
  return culpritOf(level, solution) ?? "";
}

/**
 * What has been solved, read back for the statistics page.
 *
 * @returns the ids of the solved cases and each case's record
 */
export function loadMurdokuRecords(): {
  readonly solved: readonly string[];
  readonly records: Readonly<Record<string, CaseRecord>>;
} {
  const read = readStored(STORE_KEY, STORE_VERSION, isStored);
  return { solved: read?.solved ?? [], records: read?.records ?? {} };
}

/** Whether a value read back is the stored progress. */
function isStored(value: unknown): value is Stored {
  const stored = value as Stored;
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray(stored.solved) &&
    stored.solved.every((id) => typeof id === "string") &&
    typeof stored.open === "object" &&
    stored.open !== null &&
    Object.values(stored.open).every(isNotes)
  );
}

/** Whether a value read back is the notes on one case. */
function isNotes(value: unknown): value is Notes {
  const notes = value as Notes;
  return (
    typeof value === "object" &&
    value !== null &&
    Number.isFinite(notes.startedAt) &&
    Number.isInteger(notes.hints) &&
    (notes.peeked === undefined || typeof notes.peeked === "boolean") &&
    typeof notes.board === "object" &&
    notes.board !== null &&
    Array.isArray(notes.board.crosses) &&
    typeof notes.board.notes === "object" &&
    notes.board.notes !== null &&
    typeof notes.board.placement === "object" &&
    notes.board.placement !== null &&
    Object.values(notes.board.placement).every(
      (cell) => Number.isInteger(cell?.row) && Number.isInteger(cell?.col),
    )
  );
}
