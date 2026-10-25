/**
 * The state of a Murdle session: which case is open, the marks in its grid,
 * the accusations, and what has been solved - kept in the browser so a case
 * can be finished later.
 *
 * @module
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { caseById, neighboursOf } from "@/games/murdle/engine/cases";
import {
  NO_MARKS,
  solvedMarks,
  stepped,
  tapped,
  type Marks,
  type Square,
} from "@/games/murdle/engine/grid";
import { NO_DRAFT, isRight, solvedDraft } from "@/games/murdle/engine/solver";
import type { Accusation, Case, Draft } from "@/games/murdle/engine/types";
import { readStored, storageKey, writeStored } from "@/lib/storage/local-store";
import {
  recordGameFinished,
  recordGameStarted,
  recordPlayTime,
} from "@/lib/stats/stats-recorder";
import { invalidateStats } from "@/lib/stats/stats-store";

/** Which game this is, for storage and statistics. */
const GAME_ID = "murdle";

/** Where the progress is kept. */
const STORE_KEY = storageKey(GAME_ID, "cases");

/** Schema version of the stored progress - raise it on breaking changes. */
const STORE_VERSION = 1;

/** Where the settings are kept, and their version. */
const SETTINGS_KEY = storageKey(GAME_ID, "settings");
const SETTINGS_VERSION = 1;

/** How many steps back "undo" can go. */
const HISTORY = 200;

/** A gap longer than this between two looks at the clock is not counted - a tab left open. */
const MAX_GAP_MS = 60_000;

/** How often the time played is written down and counted, in milliseconds. */
const FLUSH_MS = 15_000;

/** A case that has been started and not yet finished. */
type Notes = {
  readonly marks: Marks;
  readonly startedAt: number;
  /** How many steps of help have been shown. */
  readonly hints: number;
  /** How many accusations were wrong. */
  readonly wrong: number;
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
  readonly records?: Readonly<Record<string, CaseRecord>>;
};

/** The player's settings. */
type Settings = {
  /** Whether a tick crosses out the rest of its row and column. */
  readonly autoCross: boolean;
};

/** The answer to the last accusation, new with every press. */
export type Verdict = {
  readonly right: boolean;
  readonly nonce: number;
};

/** What the screen gets from {@link useMurdle}. */
export type MurdleApi = {
  /** The open case, or null on the list of cases. */
  readonly kase: Case | null;
  readonly solved: ReadonlySet<string>;
  readonly begun: ReadonlySet<string>;
  /** The grid as it is shown - the solution while it is being looked at. */
  readonly marks: Marks;
  readonly autoCross: boolean;
  setAutoCross: (on: boolean) => void;
  open: (id: string) => void;
  toList: () => void;
  /** A tap on a square of the grid. */
  tap: (square: Square) => void;
  undo: () => void;
  readonly canUndo: boolean;
  /** Empties the grid. */
  restart: () => void;
  /** How many steps of help have been used in this case. */
  readonly hints: number;
  /** How many of them are showing. */
  readonly shownHints: number;
  hint: () => void;
  hideHints: () => void;
  /** Shows every step of help at once, fills the whole grid and the accusation form in. */
  allHints: () => void;
  /** Carries out what one step of help concludes, as one move. */
  applyHint: (index: number) => void;
  readonly peeking: boolean;
  readonly peeked: boolean;
  reveal: () => void;
  hideSolution: () => void;
  /** What the accusation form has chosen - shared online. */
  readonly draft: Draft;
  /** Chooses one part of the accusation. */
  setDraft: (field: keyof Draft, value: string) => void;
  /** Whether "Nochmal lösen" is offered after a solve. */
  readonly canReplay: boolean;
  /** Accuses: right solves the case, wrong only counts. */
  accuse: (accusation: Accusation) => void;
  readonly verdict: Verdict | null;
  /** How many accusations in this case were wrong. */
  readonly wrong: number;
  /** How long the solve took, once solved - null before. */
  readonly solvedMs: number | null;
  elapsed: () => number;
  readonly running: boolean;
  /** Opens the next case, or null after the last one. */
  readonly next: (() => void) | null;
  /** Starts the case over. */
  replay: () => void;
};

/** Where the open case is kept in the browser's history entry. */
const CASE_KEY = "murdleCase";

/**
 * Murdle, as state.
 *
 * @returns the open case, its grid and what can be done with it
 */
export function useMurdle(): MurdleApi {
  const [stored, setStored] = useState<Stored>({ solved: [], open: {} });
  const [autoCross, setAutoCross] = useAutoCross();
  const [draft, setDraftState] = useState<Draft>(NO_DRAFT);
  const [kase, setKase] = useState<Case | null>(null);
  const [marks, setMarks] = useState<Marks>(NO_MARKS);
  const [history, setHistory] = useState<readonly Marks[]>([]);
  const [hints, setHints] = useState(0);
  const [shownHints, setShownHints] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [peeking, setPeeking] = useState(false);
  const [peeked, setPeeked] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [solvedMs, setSolvedMs] = useState<number | null>(null);
  const startedAt = useRef(0);
  // **The clock of the open case.** What was played before, and since when it
  // runs now - null while it stands still: solved, or the tab out of sight.
  // `counted` is how much of it the collection's statistics already have.
  const clock = useRef({ played: 0, since: null as number | null, counted: 0 });

  const elapsed = useCallback(() => {
    const since = clock.current.since;
    return (
      clock.current.played +
      (since === null ? 0 : Math.min(Date.now() - since, MAX_GAP_MS))
    );
  }, []);

  const count = useCallback(() => {
    const total = elapsed();
    const fresh = total - clock.current.counted;
    if (fresh > 0) {
      clock.current.counted = total;
      recordPlayTime(GAME_ID, fresh, Date.now());
      invalidateStats();
    }
  }, [elapsed]);

  const halt = useCallback(() => {
    count();
    clock.current = { ...clock.current, played: elapsed(), since: null };
  }, [count, elapsed]);

  // Read once after the first render, so the page the server sent and the
  // first one in the browser are the same.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const read = readStored(STORE_KEY, STORE_VERSION, isStored);
    if (read !== null) {
      setStored(read);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Out of sight, the clock stands still; back in sight, it runs on.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        halt();
      } else if (kase !== null && solvedMs === null) {
        clock.current = { ...clock.current, since: Date.now() };
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    const timer = window.setInterval(count, FLUSH_MS);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(timer);
    };
  }, [count, halt, kase, solvedMs]);

  const keep = useCallback((next: Stored) => {
    setStored(next);
    writeStored(STORE_KEY, STORE_VERSION, next);
  }, []);

  /** Writes the notes of the open case down. */
  const note = useCallback(
    (change: Partial<Notes>) => {
      if (kase !== null) {
        keep({
          ...stored,
          open: {
            ...stored.open,
            [kase.id]: {
              marks,
              startedAt: startedAt.current,
              playedMs: elapsed(),
              hints,
              wrong,
              peeked,
              ...change,
            },
          },
        });
      }
    },
    [elapsed, hints, keep, kase, marks, peeked, stored, wrong],
  );

  const write = useCallback(
    (next: Marks, change: Partial<Notes> = {}) => {
      setHistory((before) => [...before, marks].slice(-HISTORY));
      setMarks(next);
      note({ marks: next, ...change });
    },
    [marks, note],
  );

  const show = useCallback(
    (id: string) => {
      const found = caseById(id);
      const notes = stored.open[id];
      setKase(found);
      setHistory([]);
      setShownHints(0);
      setPeeking(false);
      setVerdict(null);
      setSolvedMs(null);
      setDraftState(NO_DRAFT);
      setPeeked(notes?.peeked ?? false);
      const played = notes?.playedMs ?? 0;
      clock.current = { played, since: Date.now(), counted: played };
      if (notes === undefined) {
        // A fresh case counts as a game begun; picking one up again does not.
        startedAt.current = Date.now();
        setMarks(NO_MARKS);
        setHints(0);
        setWrong(0);
        recordGameStarted(GAME_ID, startedAt.current);
        invalidateStats();
      } else {
        startedAt.current = notes.startedAt;
        setMarks(notes.marks);
        setHints(notes.hints);
        setWrong(notes.wrong);
      }
    },
    [stored],
  );

  const leave = useCallback(() => {
    halt();
    setKase(null);
    setPeeking(false);
    setVerdict(null);
  }, [halt]);

  // An open case is a step in the browser's history, so its back button
  // leads to the list of cases first, not out of the game.
  const open = useCallback(
    (id: string) => {
      const state: unknown = window.history.state;
      const entry = { ...asRecord(state), [CASE_KEY]: id };
      if (caseIn(state) === null) {
        window.history.pushState(entry, "");
      } else {
        window.history.replaceState(entry, "");
      }
      show(id);
    },
    [show],
  );

  const toList = useCallback(() => {
    if (caseIn(window.history.state) === null) {
      leave();
    } else {
      window.history.back();
    }
  }, [leave]);

  useEffect(() => {
    const follow = (): void => {
      const id = caseIn(window.history.state);
      if (id === null) {
        leave();
      } else {
        show(id);
      }
    };
    window.addEventListener("popstate", follow);
    return () => window.removeEventListener("popstate", follow);
  }, [leave, show]);

  const over = solvedMs !== null || peeking;

  const tap = useCallback(
    (square: Square) => {
      if (kase !== null && !over) {
        write(tapped(kase, marks, square, autoCross));
      }
    },
    [autoCross, kase, marks, over, write],
  );

  const undo = useCallback(() => {
    const before = history[history.length - 1];
    if (before !== undefined && !over) {
      setHistory(history.slice(0, -1));
      setMarks(before);
      note({ marks: before });
    }
  }, [history, note, over]);

  const restart = useCallback(() => {
    if (!over) {
      write(NO_MARKS);
    }
  }, [over, write]);

  // The steps used before stay used, but they are folded away when a case is
  // opened again: they come back one per press, and only a step never seen
  // before counts as a new one.
  const hint = useCallback(() => {
    if (shownHints < hints) {
      setShownHints(shownHints + 1);
    } else if (kase !== null && hints < kase.hints.length) {
      const next = hints + 1;
      setHints(next);
      setShownHints(next);
      note({ hints: next });
    }
  }, [hints, kase, note, shownHints]);

  const hideHints = useCallback(() => setShownHints(0), []);

  // **All at once**, as in Murdoku: every step shown and the whole grid
  // filled in by the solution, in one write - one "Rückgängig" takes the grid
  // back. The steps count as used, but the case can still be solved and
  // counts like any other solve.
  const allHints = useCallback(() => {
    if (kase !== null && !over) {
      const total = kase.hints.length;
      setHints(total);
      setShownHints(total);
      write(solvedMarks(kase, kase.solution), { hints: total });
      // The form is filled in too - pressing "Anklagen" is left to the player.
      setDraftState(solvedDraft(kase));
    }
  }, [kase, over, write]);

  // **A step can be carried out**, as in Murdoku: the squares it concludes
  // are set in one write, so one "Rückgängig" takes it back.
  const applyHint = useCallback(
    (index: number) => {
      const step = kase?.hints[index];
      if (kase !== null && step?.marks !== undefined && !over) {
        write(stepped(kase, marks, step.marks, autoCross));
      }
    },
    [autoCross, kase, marks, over, write],
  );

  // **The solution can be looked at and put away again.** The first look
  // counts the case as lost - once seen, it can no longer be solved fairly.
  const reveal = useCallback(() => {
    if (kase !== null) {
      setPeeking(true);
      if (!peeked) {
        setPeeked(true);
        note({ peeked: true });
        const now = Date.now();
        recordGameFinished(GAME_ID, {
          won: false,
          durationMs: elapsed(),
          finishedAt: now,
        });
        invalidateStats();
      }
    }
  }, [elapsed, kase, note, peeked]);

  const hideSolution = useCallback(() => setPeeking(false), []);

  /** The case is solved: off the open ones, onto the solved ones if fair. */
  const finish = useCallback(() => {
    if (kase !== null) {
      halt();
      const took = clock.current.played;
      const before = stored.records?.[kase.id];
      const fair = !peeked;
      keep({
        solved:
          fair && !stored.solved.includes(kase.id)
            ? [...stored.solved, kase.id]
            : stored.solved,
        open: Object.fromEntries(
          Object.entries(stored.open).filter(([id]) => id !== kase.id),
        ),
        records: fair
          ? {
              ...stored.records,
              [kase.id]: {
                solves: (before?.solves ?? 0) + 1,
                bestMs: Math.min(before?.bestMs ?? took, took),
                lastMs: took,
                totalMs: (before?.totalMs ?? 0) + took,
              },
            }
          : stored.records,
      });
      setSolvedMs(took);
      setPeeking(false);
      if (fair) {
        recordGameFinished(GAME_ID, {
          won: true,
          durationMs: took,
          finishedAt: Date.now(),
        });
        invalidateStats();
      }
    }
  }, [halt, keep, kase, peeked, stored]);

  const accuse = useCallback(
    (accusation: Accusation) => {
      if (kase !== null && solvedMs === null) {
        const right = isRight(kase, accusation);
        setVerdict({ right, nonce: Date.now() });
        if (right) {
          finish();
        } else {
          setWrong(wrong + 1);
          note({ wrong: wrong + 1 });
        }
      }
    },
    [finish, kase, note, solvedMs, wrong],
  );

  const setDraft = useCallback(
    (field: keyof Draft, value: string) =>
      setDraftState((before) => ({ ...before, [field]: value })),
    [],
  );

  const following = kase === null ? undefined : neighboursOf(kase)[1];
  return {
    kase,
    solved: new Set(stored.solved),
    begun: new Set(Object.keys(stored.open)),
    marks: peeking && kase !== null ? solvedMarks(kase, kase.solution) : marks,
    autoCross,
    setAutoCross,
    open,
    toList,
    tap,
    undo,
    canUndo: history.length > 0 && !over,
    restart,
    hints,
    shownHints,
    hint,
    hideHints,
    allHints,
    applyHint,
    peeking,
    peeked,
    reveal,
    hideSolution,
    draft,
    setDraft,
    canReplay: true,
    accuse,
    verdict,
    wrong,
    solvedMs,
    elapsed,
    running: kase !== null && solvedMs === null,
    next: following === undefined ? null : () => open(following.id),
    replay: () => {
      if (kase !== null) {
        open(kase.id);
      }
    },
  };
}

/**
 * The player's own setting whether a tick crosses out its row and column -
 * kept in this browser, at one screen and online alike.
 *
 * @returns the setting and the way to change it
 */
export function useAutoCross(): readonly [boolean, (on: boolean) => void] {
  const [autoCross, setValue] = useState(true);
  // Read once after the first render, like the progress.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const kept = readStored(SETTINGS_KEY, SETTINGS_VERSION, isSettings);
    if (kept !== null) {
      setValue(kept.autoCross);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  const change = useCallback((on: boolean) => {
    setValue(on);
    writeStored(SETTINGS_KEY, SETTINGS_VERSION, { autoCross: on });
  }, []);
  return [autoCross, change];
}

/**
 * What has been solved, read back for the statistics page.
 *
 * @returns the ids of the solved cases and each case's record
 */
export function loadMurdleRecords(): {
  readonly solved: readonly string[];
  readonly records: Readonly<Record<string, CaseRecord>>;
} {
  const read = readStored(STORE_KEY, STORE_VERSION, isStored);
  return {
    solved: (read?.solved ?? []).filter((id) => caseById(id) !== null),
    records: read?.records ?? {},
  };
}

/**
 * A history entry's state as a plain record, to add the case to it.
 */
function asRecord(state: unknown): Readonly<Record<string, unknown>> {
  return typeof state === "object" && state !== null
    ? (state as Record<string, unknown>)
    : {};
}

/**
 * The case a history entry has open, or null on the list.
 */
function caseIn(state: unknown): string | null {
  const id = asRecord(state)[CASE_KEY];
  return typeof id === "string" ? id : null;
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
    Number.isInteger(notes.wrong) &&
    (notes.peeked === undefined || typeof notes.peeked === "boolean") &&
    typeof notes.marks === "object" &&
    notes.marks !== null &&
    Object.values(notes.marks).every((one) => one === "x" || one === "check")
  );
}

/** Whether a value read back is the settings. */
function isSettings(value: unknown): value is Settings {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Settings).autoCross === "boolean"
  );
}
