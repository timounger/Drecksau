/**
 * Drives Panzerkiste from React: the animation loop, input and the canvas.
 *
 * @module
 * @remarks
 * The authoritative state lives in a ref and is advanced once per animation
 * frame, so the tight loop never waits on React. A small heads-up snapshot is
 * mirrored into React state only when it actually changes, so the HUD and the
 * overlays re-render without a 60-per-second render storm.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  advance,
  enemiesLeft,
  LEVEL_COUNT,
  minesLeft,
  playerTank,
  restart,
  setLevel,
  step,
} from "@/games/panzerkiste/engine/engine";
import { createGame } from "@/games/panzerkiste/engine/setup";
import type { GameState, Input, Phase } from "@/games/panzerkiste/engine/types";
import { draw } from "@/games/panzerkiste/components/render";
import {
  createTouchControls,
  drawTouchControls,
} from "@/games/panzerkiste/components/touch-controls";
import {
  canvasHeight,
  canvasWidth,
  unprojectFloor,
} from "@/games/panzerkiste/components/projection";

/** Seed of the first mission - fixed so the prerender is stable. */
const INITIAL_SEED = 20260720;

/** Milliseconds in a second, for turning frame timestamps into seconds. */
const MS_PER_SECOND = 1000;

/** The heads-up facts the UI shows around the canvas. */
export type Hud = {
  readonly phase: Phase;
  readonly level: number;
  readonly lives: number;
  readonly enemies: number;
  readonly mines: number;
  /** True once the player has started (not on the "click to start" screen). */
  readonly running: boolean;
};

/** What the game screen needs from the hook. */
export type PanzerkisteGame = {
  /** Attach to the game `<canvas>`. */
  readonly canvasRef: React.RefObject<HTMLCanvasElement | null>;
  readonly hud: Hud;
  /** Begins or resumes the loop (e.g. from a start button). */
  readonly start: () => void;
  /** Moves on to the next level after one is cleared. */
  readonly next: () => void;
  /** Starts the mission over from the first level. */
  readonly newMission: () => void;
  /** Jumps straight to the level before the current one and starts it. */
  readonly levelBack: () => void;
  /** Jumps straight to the level after the current one and starts it. */
  readonly levelForward: () => void;
  /** How many levels the mission has, for enabling the jump buttons. */
  readonly levelCount: number;
};

/** Keys that count as "move up/left/down/right". */
const UP_KEYS = new Set(["w", "arrowup"]);
const LEFT_KEYS = new Set(["a", "arrowleft"]);
const DOWN_KEYS = new Set(["s", "arrowdown"]);
const RIGHT_KEYS = new Set(["d", "arrowright"]);

/**
 * Runs one Panzerkiste mission.
 *
 * @returns the canvas ref, the HUD snapshot and the control actions
 */
export function usePanzerkiste(): PanzerkisteGame {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<GameState>(createGame(INITIAL_SEED));
  const runningRef = useRef(false);

  const keys = useRef(new Set<string>());
  const mouse = useRef({ x: 0, y: 0 });
  const mouseInside = useRef(false);
  const firePending = useRef(false);
  const minePending = useRef(false);

  const [hud, setHud] = useState<Hud>(() =>
    hudOf(createGame(INITIAL_SEED), false),
  );
  const hudRef = useRef(hud);

  /** Mirrors the HUD into React state only when a shown value changes. */
  const syncHud = useCallback(() => {
    const nextHud = hudOf(stateRef.current, runningRef.current);
    if (!sameHud(nextHud, hudRef.current)) {
      hudRef.current = nextHud;
      setHud(nextHud);
    }
  }, []);

  // Set up the canvas, the input listeners and the animation loop once.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d") ?? null;
    if (canvas === null || ctx === null) {
      return;
    }

    const aimAt = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const cx = ((event.clientX - rect.left) / rect.width) * canvas.width;
      const cy = ((event.clientY - rect.top) / rect.height) * canvas.height;
      // The turret aims at the floor spot under the cursor, so undo the tilt.
      mouse.current = unprojectFloor(cx, cy);
      mouseInside.current = true;
    };
    const onLeave = () => {
      mouseInside.current = false;
    };
    const onDown = (event: MouseEvent) => {
      event.preventDefault();
      aimAt(event);
      if (stateRef.current.phase === "cleared") {
        stateRef.current = advance(stateRef.current);
      } else if (!runningRef.current) {
        runningRef.current = true;
      } else if (stateRef.current.phase === "playing") {
        firePending.current = true;
      }
      syncHud();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (isGameKey(key)) {
        event.preventDefault();
      }
      // A fresh space press lays one mine (auto-repeat does not stack).
      if (key === " " && !keys.current.has(" ") && runningRef.current) {
        minePending.current = true;
      }
      keys.current.add(key);
    };
    const onKeyUp = (event: KeyboardEvent) =>
      keys.current.delete(event.key.toLowerCase());
    const onBlur = () => keys.current.clear();

    // Twin-stick touch controls for phones; idle (never engaged) on desktop.
    const touch = createTouchControls(canvas);

    canvas.addEventListener("mousemove", aimAt);
    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("contextmenu", (event) => event.preventDefault());
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    // Build this frame's input from the held keys, mouse, touch and pending edges.
    const readInput = (): Input => {
      const held = keys.current;
      const axis = (positive: Set<string>, negative: Set<string>) =>
        (anyHeld(held, positive) ? 1 : 0) - (anyHeld(held, negative) ? 1 : 0);
      const finger = touch.sample();
      const mineEdge = touch.consumeMine();
      let move = {
        x: axis(RIGHT_KEYS, LEFT_KEYS),
        y: axis(DOWN_KEYS, UP_KEYS),
      };
      let aim = mouse.current;
      if (finger.engaged) {
        // On a phone the sticks replace keyboard and mouse; the turret aims a
        // touch away from the tank, in the stick's direction.
        move = finger.move;
        const own = playerTank(stateRef.current);
        if (own !== null) {
          aim = { x: own.x + finger.aimDir.x, y: own.y + finger.aimDir.y };
        }
      }
      const fire = firePending.current || finger.fire;
      const layMine = minePending.current || mineEdge;
      firePending.current = false;
      minePending.current = false;
      return { move, aim, fire, layMine };
    };

    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = (now - last) / MS_PER_SECOND;
      last = now;

      resizeTo(canvas, stateRef.current);
      const playing =
        runningRef.current && stateRef.current.phase === "playing";
      if (playing) {
        stateRef.current = step(stateRef.current, readInput(), dt);
        syncHud();
      }
      // Show the blue aim cursor only while actually playing with the mouse in.
      const pointer = playing && mouseInside.current ? mouse.current : null;
      draw(ctx, stateRef.current, pointer);
      drawTouchControls(ctx, touch.sample());
      raf = window.requestAnimationFrame(frame);
    };
    raf = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(raf);
      touch.dispose();
      canvas.removeEventListener("mousemove", aimAt);
      canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [syncHud]);

  const start = () => {
    runningRef.current = true;
    syncHud();
  };
  const next = () => {
    stateRef.current = advance(stateRef.current);
    runningRef.current = true;
    syncHud();
  };
  const restartMission = () => {
    stateRef.current = restart(stateRef.current);
    runningRef.current = true;
    syncHud();
  };
  const jumpBy = (delta: number) => {
    stateRef.current = setLevel(
      stateRef.current,
      stateRef.current.level + delta,
    );
    runningRef.current = true;
    syncHud();
  };

  return {
    canvasRef,
    hud,
    start,
    next,
    newMission: restartMission,
    levelBack: () => jumpBy(-1),
    levelForward: () => jumpBy(1),
    levelCount: LEVEL_COUNT,
  };
}

/** The HUD snapshot for a state. */
function hudOf(state: GameState, running: boolean): Hud {
  return {
    phase: state.phase,
    level: state.level,
    lives: state.lives,
    enemies: enemiesLeft(state),
    mines: minesLeft(state),
    running,
  };
}

/** Whether two HUD snapshots show the same thing. */
function sameHud(a: Hud, b: Hud): boolean {
  return (
    a.phase === b.phase &&
    a.level === b.level &&
    a.lives === b.lives &&
    a.enemies === b.enemies &&
    a.mines === b.mines &&
    a.running === b.running
  );
}

/** Sizes the canvas to the tilted arena the state needs (once per level size). */
function resizeTo(canvas: HTMLCanvasElement, state: GameState): void {
  const width = Math.round(canvasWidth(state.cols));
  const height = Math.round(canvasHeight(state.rows));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

/** Whether any of the given keys is currently held. */
function anyHeld(held: Set<string>, keys: Set<string>): boolean {
  let found = false;
  for (const key of keys) {
    if (held.has(key)) {
      found = true;
    }
  }
  return found;
}

/** Whether a key is one the game consumes, so the page should not scroll. */
function isGameKey(key: string): boolean {
  return (
    key === " " ||
    UP_KEYS.has(key) ||
    LEFT_KEYS.has(key) ||
    DOWN_KEYS.has(key) ||
    RIGHT_KEYS.has(key)
  );
}
