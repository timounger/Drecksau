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
  placed,
  removed,
  standingOn,
  wiped,
  type Board,
} from "@/games/murdoku/engine/board";
import { stepped } from "@/games/murdoku/engine/actions";
import { LEVELS } from "@/games/murdoku/engine/levels";
import {
  culpritOf,
  isStandable,
  solutionOf,
} from "@/games/murdoku/engine/rules";
import type { Cell, Level, Placement } from "@/games/murdoku/engine/types";
import { readStored, storageKey, writeStored } from "@/lib/storage/local-store";
import {
  recordGameFinished,
  recordGameStarted,
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
};

/** Everything kept between visits. */
type Stored = {
  readonly solved: readonly string[];
  readonly open: Readonly<Record<string, Notes>>;
};

/** How a case ended, once it has. */
export type Outcome =
  | { readonly kind: "right"; readonly who: string; readonly ms: number }
  | { readonly kind: "wrong"; readonly who: string };

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
  /** Carries out what a step of the way concludes: puts people down, crosses fields out. */
  applyHint: (index: number) => void;
  /** Puts the solution on the map. */
  reveal: () => void;
  /** Takes it off again - back to the player's own notes. */
  hideSolution: () => void;
  accuse: (id: string) => void;
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
  const [hints, setHints] = useState(0);
  const [shownHints, setShownHints] = useState(0);
  const [peeking, setPeeking] = useState(false);
  const [peeked, setPeeked] = useState(false);
  const startedAt = useRef(0);

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
        keep({
          ...stored,
          open: {
            ...stored.open,
            [level.id]: {
              board: next,
              startedAt: startedAt.current,
              hints: nextHints,
              peeked,
            },
          },
        });
      }
    },
    [board, hints, keep, level, peeked, stored],
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
        keep({
          solved:
            won && !peeked && !stored.solved.includes(level.id)
              ? [...stored.solved, level.id]
              : stored.solved,
          open,
        });
        setBoard(final);
        setSelected(null);
        setPeeking(false);
        if (!peeked) {
          const now = Date.now();
          recordGameFinished(GAME_ID, {
            won,
            durationMs: now - startedAt.current,
            finishedAt: now,
          });
          invalidateStats();
        }
      }
    },
    [keep, level, peeked, stored],
  );

  const open = useCallback(
    (id: string) => {
      const found = LEVELS.find((one) => one.id === id) ?? null;
      const notes = stored.open[id];
      setLevel(found);
      setHistory([]);
      setSelected(null);
      setOutcome(null);
      setShownHints(0);
      setPeeking(false);
      setPeeked(notes?.peeked ?? false);
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
    setLevel(null);
    setPeeking(false);
    setSelected(null);
    setOutcome(null);
  }, []);

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
      const marks = board.notes[cellKey(cell)] ?? [];
      const who = selected ?? (marks.length === 1 ? marks[0] : undefined);
      const over = outcome?.kind === "right" || peeking;
      if (
        !over &&
        level !== null &&
        who !== undefined &&
        isStandable(level, cell)
      ) {
        write(
          placed(board, who, cell, level.size, (one) =>
            isStandable(level, one),
          ),
        );
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
      keep({
        ...stored,
        open: {
          ...stored.open,
          [level.id]: {
            board: before,
            startedAt: startedAt.current,
            hints,
            peeked,
          },
        },
      });
    }
  }, [history, hints, keep, level, peeked, stored]);

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
            hints: next,
            peeked,
          },
        },
      });
    }
  }, [board, hints, keep, level, peeked, shownHints, stored]);

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
  }, [board, hints, keep, level, peeked, stored]);

  const hideSolution = useCallback(() => {
    setPeeking(false);
  }, []);

  const accuse = useCallback(
    (id: string) => {
      const solution = level === null ? null : solutionOf(level);
      if (level !== null && solution !== null) {
        const culprit = culpritIn(level, solution);
        if (id === culprit) {
          setOutcome({
            kind: "right",
            who: id,
            ms: Date.now() - startedAt.current,
          });
          finish(true, { placement: solution, notes: {}, crosses: [] });
        } else {
          setOutcome({ kind: "wrong", who: id });
        }
      }
    },
    [finish, level],
  );

  const solution = level === null ? null : solutionOf(level);
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
    applyHint,
    reveal,
    hideSolution,
    accuse,
  };
}

/** The culprit of a solved case - whoever shares the victim's area. */
function culpritIn(level: Level, solution: Placement): string {
  return culpritOf(level, solution) ?? "";
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
