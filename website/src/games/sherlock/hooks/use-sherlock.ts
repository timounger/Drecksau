/**
 * The state of the Sherlock Holmes puzzle collection: which puzzle is open,
 * which are solved, whose solution has been looked at and how long each took
 * - kept in the browser.
 *
 * @module
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { byId } from "@/games/sherlock/engine/puzzles";
import type { Puzzle } from "@/games/sherlock/engine/types";
import { readStored, storageKey, writeStored } from "@/lib/storage/local-store";
import {
  recordGameFinished,
  recordGameStarted,
  recordPlayTime,
} from "@/lib/stats/stats-recorder";
import { invalidateStats } from "@/lib/stats/stats-store";

/** Which game this is, for storage and statistics. */
const GAME_ID = "sherlock";

/** Where the progress is kept. */
const STORE_KEY = storageKey(GAME_ID, "puzzles");

/** Schema version of the stored progress - raise it on breaking changes. */
const STORE_VERSION = 1;

/** A gap longer than this between two looks at the clock is not counted - a tab left open. */
const MAX_GAP_MS = 60_000;

/** How often the time played is written down and counted, in milliseconds. */
const FLUSH_MS = 15_000;

/** Where the open puzzle is kept in the browser's history entry. */
const PUZZLE_KEY = "sherlockPuzzle";

/** Everything kept between visits. */
export type SherlockProgress = {
  /** The puzzles marked as solved. */
  readonly solved: readonly string[];
  /** The puzzles whose solution has been looked at. */
  readonly revealed: readonly string[];
  /** The time spent on each puzzle opened so far, in milliseconds. */
  readonly played: Readonly<Record<string, number>>;
};

/** What the screen gets from {@link useSherlock}. */
export type SherlockApi = {
  /** The open puzzle, or null on the list. */
  readonly puzzle: Puzzle | null;
  readonly solved: ReadonlySet<string>;
  readonly revealed: ReadonlySet<string>;
  /** The puzzles opened at least once. */
  readonly begun: ReadonlySet<string>;
  open: (id: string) => void;
  toList: () => void;
  /** Marks the open puzzle solved, or unsolved again. */
  toggleSolved: () => void;
  /** Whether the solution of the open puzzle is showing. */
  readonly peeking: boolean;
  reveal: () => void;
  hideSolution: () => void;
  /** How long the open puzzle has been worked on. */
  elapsed: () => number;
  /** Whether its clock runs. */
  readonly running: boolean;
};

/** Nothing solved, nothing opened. */
const NO_PROGRESS: SherlockProgress = { solved: [], revealed: [], played: {} };

/**
 * The puzzle collection, as state.
 *
 * @returns the open puzzle, the progress and what can be done with it
 */
export function useSherlock(): SherlockApi {
  const [stored, setStored] = useState<SherlockProgress>(NO_PROGRESS);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [peeking, setPeeking] = useState(false);
  const [running, setRunning] = useState(false);
  // The latest progress and puzzle, for the callbacks that write them down.
  const latest = useRef<{ stored: SherlockProgress; id: string | null }>({
    stored: NO_PROGRESS,
    id: null,
  });
  // **The clock of the open puzzle.** What was played before, and since when
  // it runs now - null while it stands still: solved, or the tab out of sight.
  // `counted` is how much of it the collection's statistics already have.
  const clock = useRef({ played: 0, since: null as number | null, counted: 0 });

  const elapsed = useCallback(() => {
    const since = clock.current.since;
    return (
      clock.current.played +
      (since === null ? 0 : Math.min(Date.now() - since, MAX_GAP_MS))
    );
  }, []);

  const keep = useCallback((next: SherlockProgress) => {
    latest.current = { ...latest.current, stored: next };
    setStored(next);
    writeStored(STORE_KEY, STORE_VERSION, next);
  }, []);

  /** Counts the fresh time for the collection and writes it to the puzzle. */
  const flush = useCallback(() => {
    const id = latest.current.id;
    if (id !== null) {
      const total = elapsed();
      const fresh = total - clock.current.counted;
      if (fresh > 0) {
        clock.current.counted = total;
        recordPlayTime(GAME_ID, fresh, Date.now());
        invalidateStats();
        const before = latest.current.stored;
        keep({ ...before, played: { ...before.played, [id]: total } });
      }
    }
  }, [elapsed, keep]);

  const halt = useCallback(() => {
    flush();
    clock.current = { ...clock.current, played: elapsed(), since: null };
  }, [elapsed, flush]);

  // Read once after the first render, so the page the server sent and the
  // first one in the browser are the same.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const read = readStored(STORE_KEY, STORE_VERSION, isProgress);
    if (read !== null) {
      latest.current = { ...latest.current, stored: read };
      setStored(read);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Out of sight, the clock stands still; back in sight, it runs on.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        halt();
      } else if (running) {
        clock.current = { ...clock.current, since: Date.now() };
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    const timer = window.setInterval(flush, FLUSH_MS);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(timer);
    };
  }, [flush, halt, running]);

  const show = useCallback(
    (id: string) => {
      halt();
      const found = byId(id);
      const before = latest.current.stored;
      const played = before.played[id];
      const solved = before.solved.includes(id);
      latest.current = { ...latest.current, id: found?.id ?? null };
      clock.current = {
        played: played ?? 0,
        since: found === null || solved ? null : Date.now(),
        counted: played ?? 0,
      };
      setPuzzle(found);
      setPeeking(false);
      setRunning(found !== null && !solved);
      if (found !== null && played === undefined) {
        // A fresh puzzle counts as a game begun; picking one up again does not.
        recordGameStarted(GAME_ID, Date.now());
        invalidateStats();
        keep({ ...before, played: { ...before.played, [id]: 0 } });
      }
    },
    [halt, keep],
  );

  const leave = useCallback(() => {
    halt();
    latest.current = { ...latest.current, id: null };
    setPuzzle(null);
    setPeeking(false);
    setRunning(false);
  }, [halt]);

  // An open puzzle is a step in the browser's history, so its back button
  // leads to the list first, not out of the game.
  const open = useCallback(
    (id: string) => {
      const state: unknown = window.history.state;
      const entry = { ...asRecord(state), [PUZZLE_KEY]: id };
      if (puzzleIn(state) === null) {
        window.history.pushState(entry, "");
      } else {
        window.history.replaceState(entry, "");
      }
      show(id);
    },
    [show],
  );

  const toList = useCallback(() => {
    if (puzzleIn(window.history.state) === null) {
      leave();
    } else {
      window.history.back();
    }
  }, [leave]);

  useEffect(() => {
    const follow = (): void => {
      const id = puzzleIn(window.history.state);
      if (id === null) {
        leave();
      } else {
        show(id);
      }
    };
    window.addEventListener("popstate", follow);
    return () => window.removeEventListener("popstate", follow);
  }, [leave, show]);

  const toggleSolved = useCallback(() => {
    const id = latest.current.id;
    if (id !== null) {
      const wasSolved = latest.current.stored.solved.includes(id);
      if (wasSolved) {
        const before = latest.current.stored;
        keep({ ...before, solved: before.solved.filter((one) => one !== id) });
        clock.current = { ...clock.current, since: Date.now() };
        setRunning(true);
      } else {
        halt();
        const before = latest.current.stored;
        keep({
          ...before,
          solved: [...before.solved, id],
          played: { ...before.played, [id]: clock.current.played },
        });
        setRunning(false);
        recordGameFinished(GAME_ID, {
          won: true,
          durationMs: clock.current.played,
          finishedAt: Date.now(),
        });
        invalidateStats();
      }
    }
  }, [halt, keep]);

  const reveal = useCallback(() => {
    const id = latest.current.id;
    if (id !== null) {
      setPeeking(true);
      const before = latest.current.stored;
      if (!before.revealed.includes(id)) {
        keep({ ...before, revealed: [...before.revealed, id] });
      }
    }
  }, [keep]);

  const hideSolution = useCallback(() => setPeeking(false), []);

  return {
    puzzle,
    solved: new Set(stored.solved),
    revealed: new Set(stored.revealed),
    begun: new Set(Object.keys(stored.played)),
    open,
    toList,
    toggleSolved,
    peeking,
    reveal,
    hideSolution,
    elapsed,
    running,
  };
}

/**
 * The progress read back, for the statistics page - only puzzles that exist.
 *
 * @returns what is solved, revealed and how long each puzzle took
 */
export function loadSherlockProgress(): SherlockProgress {
  const read = readStored(STORE_KEY, STORE_VERSION, isProgress) ?? NO_PROGRESS;
  const known = (id: string) => byId(id) !== null;
  return {
    solved: read.solved.filter(known),
    revealed: read.revealed.filter(known),
    played: Object.fromEntries(
      Object.entries(read.played).filter(([id]) => known(id)),
    ),
  };
}

/**
 * A history entry's state as a plain record, to add the puzzle to it.
 */
function asRecord(state: unknown): Readonly<Record<string, unknown>> {
  return typeof state === "object" && state !== null
    ? (state as Record<string, unknown>)
    : {};
}

/**
 * The puzzle a history entry has open, or null on the list.
 */
function puzzleIn(state: unknown): string | null {
  const id = asRecord(state)[PUZZLE_KEY];
  return typeof id === "string" ? id : null;
}

/** Whether a value read back is the stored progress. */
function isProgress(value: unknown): value is SherlockProgress {
  const one = value as SherlockProgress;
  const ids = (list: unknown) =>
    Array.isArray(list) && list.every((id) => typeof id === "string");
  return (
    typeof value === "object" &&
    value !== null &&
    ids(one.solved) &&
    ids(one.revealed) &&
    typeof one.played === "object" &&
    one.played !== null &&
    Object.values(one.played).every((ms) => Number.isFinite(ms))
  );
}
