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
import { checkpointStep } from "@/games/rv-there-yet/engine/map";
import { startAt, theMap } from "@/games/rv-there-yet/engine/setup";
import {
  loadCheckpoint,
  saveCheckpoint,
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

/** How long the note about a reached checkpoint stays up, in ms. */
const NOTE_MS = 2600;

/** Longest single frame that still counts as play time, in seconds. */
const MAX_FRAME_S = 0.1;

/** Alone on the map, the one person is the first one. */
const ME = 0;

export type { Hud, TouchButton };

/** A short note shown over the canvas, or null. */
export type Note = {
  /** Which checkpoint was just driven past, counted from one. */
  readonly checkpoint: number;
  /** Changes with every note, so the same one can be shown twice. */
  readonly id: number;
};

/** What the game screen needs from the hook. */
export type RvThereYetGame = {
  readonly canvasRef: React.RefObject<HTMLCanvasElement | null>;
  readonly hud: Hud;
  /** The note about a checkpoint just reached, or null. */
  readonly note: Note | null;
  /** Begins or resumes the drive. */
  readonly start: () => void;
  /** Starts the current checkpoint over. */
  readonly again: () => void;
  /** Jumps to the next checkpoint, wrapping around at the end. */
  readonly next: () => void;
  /** Jumps to the checkpoint before, wrapping around at the start. */
  readonly back: () => void;
  /** Presses or releases one of the on-screen buttons. */
  readonly touch: (button: TouchButton, down: boolean) => void;
  /** Puts a gear in, as the gear buttons do. */
  readonly shift: (gear: number) => void;
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

  // A short note when a checkpoint is driven past; cleared on its own timer.
  const [note, setNote] = useState<Note | null>(null);
  const noteTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const noteId = useRef(0);
  const showNote = useCallback((checkpoint: number) => {
    noteId.current += 1;
    setNote({ checkpoint, id: noteId.current });
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
  /** The checkpoint already written to storage, so it is saved only on change. */
  const savedCheckpoint = useRef(0);

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
        sinceFlush += dt * MS_PER_SECOND;
        if (sinceFlush >= STATS_FLUSH_MS) {
          sinceFlush = 0;
          flushTime();
        }
        if (stateRef.current.checkpoint !== savedCheckpoint.current) {
          // Reached by driving, not by jumping - the jump sets this itself.
          showNote(stateRef.current.checkpoint + 1);
          savedCheckpoint.current = stateRef.current.checkpoint;
          saveCheckpoint(savedCheckpoint.current);
        }
        if (stateRef.current.phase === "arrived" && !tally.current.ended) {
          tally.current.ended = true;
          flushTime();
          recordGameFinished(GAME_ID, {
            won: true,
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
    (checkpoint: number) => {
      stateRef.current = startAt(checkpoint);
      savedCheckpoint.current = stateRef.current.checkpoint;
      saveCheckpoint(savedCheckpoint.current);
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
      beginDrive(stateRef.current.checkpoint);
    }
  }, [beginDrive]);

  // Pick up where the last visit left off. Storage only exists in the browser,
  // so this cannot happen while the page is being prerendered.
  useEffect(() => {
    const stored = loadCheckpoint();
    savedCheckpoint.current = stored;
    if (stored !== stateRef.current.checkpoint && !runningRef.current) {
      stateRef.current = startAt(stored);
      syncHud(stateRef.current, -1, -1);
    }
  }, [syncHud]);

  return {
    canvasRef,
    hud,
    note,
    start,
    again: () => beginDrive(stateRef.current.checkpoint),
    next: () => beginDrive(checkpointStep(stateRef.current.checkpoint, 1)),
    back: () => beginDrive(checkpointStep(stateRef.current.checkpoint, -1)),
    shift: (gear: number) => controlsRef.current.shift(gear),
    touch: (button, down) => controlsRef.current.press(button, down),
  };
}

/** The size of the canvas, so the screen and the renderer agree. */
export const CANVAS_SIZE = { width: CANVAS_W, height: CANVAS_H } as const;
