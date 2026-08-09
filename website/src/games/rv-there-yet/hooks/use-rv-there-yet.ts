/**
 * Drives "RV There Yet?" from React: the loop, the input and the canvas.
 *
 * @module
 * @remarks
 * The world lives in a ref and is advanced once per animation frame, so the
 * loop never waits on React. Only the handful of facts the screen shows are
 * mirrored into state, and only when they actually change - otherwise every
 * frame would be a re-render.
 *
 * This is the solo game: one person on the map, and the browser owns the whole
 * world. The online co-op runs the same engine over the wire in
 * {@link ./use-rv-there-yet-online}.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  reachableAnchor,
  ropeCandidate,
  step,
} from "@/games/rv-there-yet/engine/engine";
import { sectionStep } from "@/games/rv-there-yet/engine/map";
import { fitCanvas } from "@/lib/screen/fit-canvas";
import { startAt, theMap } from "@/games/rv-there-yet/engine/setup";
import {
  loadSection,
  saveSection,
} from "@/games/rv-there-yet/settings/progress";
import {
  CANVAS_H,
  CANVAS_W,
  draw,
} from "@/games/rv-there-yet/components/render";
import {
  createControls,
  type TouchButton,
} from "@/games/rv-there-yet/hooks/controls";
import { hudOf, sameHud, type Hud } from "@/games/rv-there-yet/hooks/hud";
import type { GameState } from "@/games/rv-there-yet/engine/types";
import {
  NO_RUN,
  runAgain,
  runFrom,
  runOn,
  type Run,
} from "@/games/rv-there-yet/stats/run-clock";
import {
  recordGameFinished,
  recordGameStarted,
  recordPlayTime,
} from "@/lib/stats/stats-recorder";
import { invalidateStats } from "@/lib/stats/stats-store";
import type { GameId } from "@/games/registry";

/** Which game the statistics are recorded under. */
const GAME_ID: GameId = "rv-there-yet";

/** Milliseconds in a second, for turning frame timestamps into seconds. */
const MS_PER_SECOND = 1000;

/** How often gathered play time is written to the statistics, in ms. */
const STATS_FLUSH_MS = 4000;

/** How long the note about a reached section stays up, in ms. */
const NOTE_MS = 2600;

/** Longest single frame that still counts as play time, in seconds. */
const MAX_FRAME_S = 0.1;

/** Alone on the map, the one person is the first one. */
const ME = 0;

/** Where a brand-new game begins. */
const FIRST_SECTION = 0;

export type { Hud, TouchButton };

/** A short note shown over the canvas, or null. */
export type Note = {
  /** Which section was just driven past, counted from one. */
  readonly section: number;
  /** Changes with every note, so the same one can be shown twice. */
  readonly id: number;
};

/** What the game screen needs from the hook. */
export type RvThereYetGame = {
  readonly canvasRef: React.RefObject<HTMLCanvasElement | null>;
  readonly hud: Hud;
  /**
   * The drive as a whole, as it stood when it ended.
   *
   * @remarks
   * The world's clock begins again at every section; this one runs over all of
   * them, which is what a board of best times has to be measured on. Only
   * updated when a drive ends, because that is the only moment it is read.
   */
  readonly run: Run;
  /** The note about a section just reached, or null. */
  readonly note: Note | null;
  /** Begins or resumes the drive. */
  readonly start: () => void;
  /** Starts the current section over. */
  readonly again: () => void;
  /**
   * Starts the whole map over at the first section.
   *
   * @remarks
   * This also forgets the remembered progress - a new game means the next
   * visit begins at the beginning too, not back where the old run had got to.
   */
  readonly newGame: () => void;
  /** Jumps to the next section, wrapping around at the end. */
  readonly next: () => void;
  /** Jumps to the section before, wrapping around at the start. */
  readonly back: () => void;
  /** Presses or releases one of the on-screen buttons. */
  readonly touch: (button: TouchButton, down: boolean) => void;
  /** Puts a gear in, as the gear buttons do. */
  readonly shift: (gear: number) => void;
  /** Takes the thing in that bag slot into the hand. */
  readonly pick: (slot: number) => void;
};

/**
 * Runs one drive.
 *
 * @returns the canvas ref, the heads-up facts and the controls
 */
export function useRvThereYet(): RvThereYetGame {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<GameState>(startAt(0));
  const runningRef = useRef(false);
  const controlsRef = useRef(createControls());

  const [hud, setHud] = useState<Hud>(() =>
    hudOf(startAt(0), { ready: -1, candidate: -1, running: false, me: ME }),
  );

  // A short note when a section is driven past; cleared on its own timer.
  const [note, setNote] = useState<Note | null>(null);
  const noteTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const noteId = useRef(0);
  const showNote = useCallback((section: number) => {
    noteId.current += 1;
    setNote({ section, id: noteId.current });
    clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => setNote(null), NOTE_MS);
  }, []);
  const hudRef = useRef(hud);
  const syncHud = useCallback(
    (state: GameState, ready: number, candidate: number) => {
      const next = hudOf(state, {
        ready,
        candidate,
        running: runningRef.current,
        me: ME,
      });
      if (!sameHud(next, hudRef.current)) {
        hudRef.current = next;
        setHud(next);
      }
    },
    [],
  );

  // Statistics of the current drive: whether its start and its outcome were
  // counted, and the play time not yet written away.
  const tally = useRef({ recorded: false, ended: false, unflushedMs: 0 });
  /**
   * The clock of the whole drive, for the board of best times.
   *
   * @remarks
   * A ref and not state: it changes sixty times a second and is only ever read
   * when the flag comes up. What the screen gets is a copy, taken then.
   */
  const runRef = useRef<Run>(NO_RUN);
  const [run, setRun] = useState<Run>(NO_RUN);
  /** The section already written to storage, so it is saved only on change. */
  const savedSection = useRef(0);

  const flushTime = useCallback(() => {
    const spent = tally.current.unflushedMs;
    if (spent > 0) {
      tally.current.unflushedMs = 0;
      recordPlayTime(GAME_ID, spent, Date.now());
      invalidateStats();
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d") ?? null;
    if (canvas === null || ctx === null) {
      return;
    }
    const controls = controlsRef.current;
    const stopListening = controls.listen(window);

    let raf = 0;
    let last = performance.now();
    let sinceFlush = 0;

    const frame = (now: number) => {
      const dt = (now - last) / MS_PER_SECOND;
      last = now;
      const route = theMap();
      const mine = stateRef.current.people[ME];

      if (runningRef.current && stateRef.current.phase === "driving") {
        stateRef.current = step(
          stateRef.current,
          route,
          [controls.read(mine.inside)],
          dt,
        );
        tally.current.unflushedMs += Math.min(dt, MAX_FRAME_S) * MS_PER_SECOND;
        runRef.current = runOn(runRef.current, Math.min(dt, MAX_FRAME_S));
        sinceFlush += dt * MS_PER_SECOND;
        if (sinceFlush >= STATS_FLUSH_MS) {
          sinceFlush = 0;
          flushTime();
        }
        if (stateRef.current.section !== savedSection.current) {
          // Reached by driving, not by jumping - the jump sets this itself.
          // Passing the mark that begins section n means section n is **done**,
          // so that is the number worth saying out loud.
          showNote(stateRef.current.section);
          savedSection.current = stateRef.current.section;
          saveSection(savedSection.current);
        }
        const over = stateRef.current.phase !== "driving";
        if (over && !tally.current.ended) {
          tally.current.ended = true;
          // Handed to the screen only now: this is the one moment anybody
          // wants to know how long the whole thing took.
          setRun(runRef.current);
          flushTime();
          recordGameFinished(GAME_ID, {
            // The bear is the one way this drive is lost.
            won: stateRef.current.phase === "arrived",
            durationMs: stateRef.current.time * MS_PER_SECOND,
            finishedAt: Date.now(),
          });
          invalidateStats();
        }
      } else {
        controls.forget();
      }

      const ready = reachableAnchor(
        stateRef.current.people[ME],
        stateRef.current,
        route,
      );
      const candidate = ropeCandidate(stateRef.current, route);
      syncHud(stateRef.current, ready, candidate);
      // As many pixels as the screen really gives it, so the picture is sharp
      // full screen as well; the drawing below stays in the logical grid.
      const dots = fitCanvas(canvas, CANVAS_W, CANVAS_H);
      ctx.setTransform(dots, 0, 0, dots, 0, 0);
      draw(ctx, stateRef.current, route, candidate, ready, ME);
      raf = window.requestAnimationFrame(frame);
    };
    raf = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(raf);
      flushTime();
      stopListening();
      clearTimeout(noteTimer.current);
    };
  }, [syncHud, flushTime, showNote]);

  const beginDrive = useCallback(
    (section: number, again = false) => {
      runRef.current = again ? runAgain(runRef.current) : runFrom(section);
      stateRef.current = startAt(section);
      savedSection.current = stateRef.current.section;
      saveSection(savedSection.current);
      setNote(null);
      tally.current = { recorded: true, ended: false, unflushedMs: 0 };
      runningRef.current = true;
      recordGameStarted(GAME_ID, Date.now());
      invalidateStats();
      syncHud(stateRef.current, -1, -1);
    },
    [syncHud],
  );

  const start = useCallback(() => {
    if (!runningRef.current) {
      beginDrive(stateRef.current.section);
    }
  }, [beginDrive]);

  // Pick up where the last visit left off. Storage only exists in the browser,
  // so this cannot happen while the page is being prerendered.
  useEffect(() => {
    const stored = loadSection();
    savedSection.current = stored;
    if (stored !== stateRef.current.section && !runningRef.current) {
      stateRef.current = startAt(stored);
      syncHud(stateRef.current, -1, -1);
    }
  }, [syncHud]);

  return {
    canvasRef,
    hud,
    run,
    note,
    start,
    // Beginning a section again after a crash is the same drive carrying on:
    // the clock is not put back, because a section driven twice took twice as
    // long and a board that forgave that would reward crashing on purpose.
    again: () => beginDrive(stateRef.current.section, true),
    newGame: () => beginDrive(FIRST_SECTION),
    next: () => beginDrive(sectionStep(stateRef.current.section, 1)),
    back: () => beginDrive(sectionStep(stateRef.current.section, -1)),
    shift: (gear: number) => controlsRef.current.shift(gear),
    pick: (slot: number) => controlsRef.current.pick(slot),
    touch: (button, down) => controlsRef.current.press(button, down),
  };
}

/** The size of the canvas, so the screen and the renderer agree. */
export const CANVAS_SIZE = { width: CANVAS_W, height: CANVAS_H } as const;
