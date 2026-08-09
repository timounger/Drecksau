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
  restart,
  setLevel,
  step,
} from "@/games/panzerkiste/engine/engine";
import {
  createGame,
  totalEnemiesThroughLevel,
} from "@/games/panzerkiste/engine/setup";
import {
  HOMING_CHARGE_SECONDS,
  type GameState,
  type Input,
  type Phase,
} from "@/games/panzerkiste/engine/types";
import { draw } from "@/games/panzerkiste/components/render";
import { createSmoke, stepSmoke } from "@/games/panzerkiste/components/smoke";
import {
  createMuzzleFlashes,
  stepMuzzleFlashes,
} from "@/games/panzerkiste/components/muzzle-flash";
import {
  createTankExplosions,
  detectTankDeaths,
  spawnTankExplosion,
  stepTankExplosions,
} from "@/games/panzerkiste/components/tank-explosion";
import {
  createTouchControls,
  drawTouchControls,
} from "@/games/panzerkiste/components/touch-controls";
import { detectSounds } from "@/games/panzerkiste/audio/events";
import { createSoundPlayer } from "@/games/panzerkiste/audio/sounds";
import { gameVolume } from "@/games/panzerkiste/settings/sound-volume";
import {
  ROUND_BANNER_MS,
  type Banner,
} from "@/games/panzerkiste/components/round-banner";
import {
  canvasHeight,
  canvasWidth,
  unprojectFloor,
} from "@/games/panzerkiste/components/projection";
import {
  recordGameFinished,
  recordGameStarted,
  recordPlayTime,
} from "@/lib/stats/stats-recorder";
import { invalidateStats } from "@/lib/stats/stats-store";
import {
  recordLevelCleared,
  recordLevelReached,
  recordShots,
  recordWaveReached,
} from "@/games/panzerkiste/stats/mission-store";
import { isEndless } from "@/games/panzerkiste/engine/levels";
import type { GameId } from "@/games/registry";

/** Seed of the first mission - fixed so the prerender is stable. */
const INITIAL_SEED = 20260720;

/** Milliseconds in a second, for turning frame timestamps into seconds. */
const MS_PER_SECOND = 1000;

/** How long the fire button is held (ms) before the homing missile launches. */
const HOMING_CHARGE_MS = HOMING_CHARGE_SECONDS * MS_PER_SECOND;

/** Which game the statistics are recorded under. */
const GAME_ID: GameId = "panzerkiste";

/** How often accumulated play time is written to the statistics, in ms. */
const STATS_FLUSH_MS = 4000;

/** Longest single frame that still counts as play time, so a backgrounded tab
 * (rAF paused, then one huge frame on return) does not inflate the total. */
const MAX_FRAME_S = 0.1;

/** The heads-up facts the UI shows around the canvas. */
export type Hud = {
  readonly phase: Phase;
  readonly level: number;
  readonly lives: number;
  readonly enemies: number;
  readonly mines: number;
  /** Which wave is out in the endless arena; zero on every other level. */
  readonly wave: number;
  /** The furthest wave this mission has reached, for the board of the best. */
  readonly runWave: number;
  /** True while this mission may go on the board: nobody skipped a level. */
  readonly fair: boolean;
  /** True once the player has started (not on the "click to start" screen). */
  readonly running: boolean;
};

/** What the game screen needs from the hook. */
export type PanzerkisteGame = {
  /** Attach to the game `<canvas>`. */
  readonly canvasRef: React.RefObject<HTMLCanvasElement | null>;
  readonly hud: Hud;
  /** The banner to show over the field (round start or completion), or null. */
  readonly banner: Banner | null;
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
  /** Goes on into the arena from a won campaign, which still counts. */
  readonly toEndless: () => void;
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

  // A short banner shown at each round start and mission completion; cleared on
  // its own timer.
  const [banner, setBanner] = useState<Banner | null>(null);
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const bannerId = useRef(0);
  const flashBanner = useCallback((make: (id: number) => Banner) => {
    bannerId.current += 1;
    setBanner(make(bannerId.current));
    clearTimeout(bannerTimer.current);
    bannerTimer.current = setTimeout(() => setBanner(null), ROUND_BANNER_MS);
  }, []);
  const showStart = useCallback(
    (state: GameState) =>
      flashBanner((id) => ({
        kind: "start",
        mission: state.level + 1,
        enemies: enemiesLeft(state),
        lives: state.lives,
        id,
      })),
    [flashBanner],
  );
  const showComplete = useCallback(
    (total: number) => flashBanner((id) => ({ kind: "complete", total, id })),
    [flashBanner],
  );

  // Statistics for the current mission: whether its start was counted, the play
  // time gathered, the part not yet written to storage, and whether its outcome
  // was counted. A mission runs from the first level until it is won or lost;
  // dying and retrying a level is the same mission.
  const missionStats = useRef({
    recorded: false,
    playMs: 0,
    unflushedMs: 0,
    outcomeRecorded: false,
    /** Which level the tally below belongs to, or -1 before the first. */
    level: -1,
    /** The mission's play time when the current level began. */
    levelStartedAtMs: 0,
    /** How much of the engine's shot tally has already been written away. */
    bookedFired: 0,
    bookedHit: 0,
    /** The arena wave already noted, so each is booked once. */
    wave: 0,
  });

  /**
   * What the mission is worth to the board of the best.
   *
   * @remarks
   * `fair` starts true and never comes back: a mission that was fast-forwarded
   * with the level buttons is not one somebody fought their way through, and a
   * board that took those would only ever show whoever pressed hardest.
   */
  const runRef = useRef({ wave: 0, fair: true });

  /**
   * Writes the shots not yet booked into the mission statistics.
   *
   * @remarks
   * Booked as it goes, like the play time, rather than only when a mission
   * ends: most runs are abandoned rather than finished, and everything shot in
   * them would otherwise never be counted at all.
   */
  const flushShots = useCallback(() => {
    const state = stateRef.current;
    const booked = missionStats.current;
    const fired = state.shotsFired - booked.bookedFired;
    const hit = state.shotsHit - booked.bookedHit;
    if (fired > 0) {
      recordShots(fired, Math.max(0, hit));
      booked.bookedFired = state.shotsFired;
      booked.bookedHit = state.shotsHit;
    }
  }, []);

  /** Writes the play time gathered but not yet stored to the statistics. */
  const flushStatsTime = useCallback(() => {
    if (missionStats.current.unflushedMs > 0) {
      recordPlayTime(GAME_ID, missionStats.current.unflushedMs, Date.now());
      missionStats.current.unflushedMs = 0;
      invalidateStats();
    }
  }, []);

  /** Starts counting a fresh mission (books any leftover time from the last). */
  const beginMissionStats = useCallback(() => {
    flushStatsTime();
    missionStats.current = {
      recorded: false,
      playMs: 0,
      unflushedMs: 0,
      outcomeRecorded: false,
      level: -1,
      levelStartedAtMs: 0,
      bookedFired: 0,
      bookedHit: 0,
      wave: 0,
    };
    runRef.current = { wave: 0, fair: true };
  }, [flushStatsTime]);

  /** Mirrors the HUD into React state only when a shown value changes. */
  const syncHud = useCallback(() => {
    const nextHud = hudOf(stateRef.current, runningRef.current, runRef.current);
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
    // The fire button is charged by holding it: at HOMING_CHARGE_MS the secret
    // homing missile launches. These track the current hold.
    let fireDownAt: number | null = null;
    let homingLaunched = false;
    const onDown = (event: MouseEvent) => {
      event.preventDefault();
      aimAt(event);
      if (stateRef.current.phase === "cleared") {
        stateRef.current = advance(stateRef.current);
      } else if (!runningRef.current) {
        runningRef.current = true;
      } else if (stateRef.current.phase === "playing") {
        firePending.current = true;
        fireDownAt = performance.now();
        homingLaunched = false;
      }
      syncHud();
    };
    const onUp = () => {
      fireDownAt = null;
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
    window.addEventListener("mouseup", onUp);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    // Build this frame's input from the held keys, mouse, touch and pending edges.
    const readInput = (): Input => {
      const held = keys.current;
      const axis = (positive: Set<string>, negative: Set<string>) =>
        (anyHeld(held, positive) ? 1 : 0) - (anyHeld(held, negative) ? 1 : 0);
      const finger = touch.sample();
      const fireEdge = touch.consumeFire();
      const mineEdge = touch.consumeMine();
      let move = {
        x: axis(RIGHT_KEYS, LEFT_KEYS),
        y: axis(DOWN_KEYS, UP_KEYS),
      };
      let aim = mouse.current;
      if (finger.engaged) {
        // On a phone the left stick drives; a right tap aims and fires, a long
        // press lays a mine.
        move = finger.move;
        aim = finger.aim;
      }
      const fire = firePending.current || fireEdge;
      const layMine = minePending.current || mineEdge;
      // Held the fire button long enough: launch the homing missile once.
      let fireHoming = false;
      if (
        fireDownAt !== null &&
        !homingLaunched &&
        performance.now() - fireDownAt >= HOMING_CHARGE_MS
      ) {
        fireHoming = true;
        homingLaunched = true;
      }
      firePending.current = false;
      minePending.current = false;
      return { move, aim, fire, fireHoming, layMine };
    };

    // Sound effects, driven by comparing the state before and after each step.
    const sound = createSoundPlayer(gameVolume.load());
    // The slider lives outside this loop, so follow it while the game runs.
    const stopVolume = gameVolume.subscribe(() =>
      sound.setVolume(gameVolume.load()),
    );
    let soundPrev: GameState | null = null;
    let announcedStart = false;
    // View-only dust/smoke trailing the shells.
    const smoke = createSmoke();
    // View-only muzzle flashes at the barrel when a shell is fired.
    const flashes = createMuzzleFlashes();
    // View-only explosions where a tank is destroyed.
    const explosions = createTankExplosions();

    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = (now - last) / MS_PER_SECOND;
      last = now;

      resizeTo(canvas, stateRef.current);
      const playing =
        runningRef.current && stateRef.current.phase === "playing";
      if (playing) {
        if (!announcedStart) {
          announcedStart = true;
          sound.play("roundStart");
          showStart(stateRef.current);
        }
        if (!missionStats.current.recorded) {
          missionStats.current.recorded = true;
          recordGameStarted(GAME_ID, Date.now());
          invalidateStats();
        }
        if (missionStats.current.level !== stateRef.current.level) {
          missionStats.current.level = stateRef.current.level;
          missionStats.current.levelStartedAtMs = missionStats.current.playMs;
          // Counting from 1: "Level 3" on screen is level index 2.
          // Only campaign levels have a number worth recording; the arenas
          // keep their own count in the wave below.
          if (!isEndless(stateRef.current.level)) {
            recordLevelReached(stateRef.current.level + 1);
          }
        }
        if (missionStats.current.wave !== stateRef.current.wave) {
          missionStats.current.wave = stateRef.current.wave;
          runRef.current.wave = Math.max(
            runRef.current.wave,
            stateRef.current.wave,
          );
          recordWaveReached(stateRef.current.wave);
        }
        const input = readInput();
        stateRef.current = step(stateRef.current, input, dt);
        sound.setMoving(input.move.x !== 0 || input.move.y !== 0);
        // Count the played time, capped so a laggy/background frame cannot skew it.
        const playedMs = Math.min(dt, MAX_FRAME_S) * MS_PER_SECOND;
        missionStats.current.playMs += playedMs;
        missionStats.current.unflushedMs += playedMs;
        if (missionStats.current.unflushedMs >= STATS_FLUSH_MS) {
          flushStatsTime();
          flushShots();
        }
        syncHud();
      } else {
        sound.setMoving(false);
      }
      // Compare frames for one-shot sounds (also catches an out-of-loop advance).
      if (soundPrev !== null) {
        const cur = stateRef.current;
        for (const event of detectSounds(soundPrev, cur)) {
          sound.play(event);
        }
        // An explosion wherever a tank (mine, enemy or player) was just destroyed.
        for (const spot of detectTankDeaths(soundPrev, cur)) {
          spawnTankExplosion(explosions, spot);
        }
        // Any fresh level (advance, respawn, restart) resets the clock: banner.
        if (cur.time < soundPrev.time && cur.phase === "playing") {
          showStart(cur);
        }
        // The last enemy just fell: the mission (level) is complete.
        if (
          soundPrev.phase === "playing" &&
          (cur.phase === "cleared" || cur.phase === "won")
        ) {
          showComplete(totalEnemiesThroughLevel(cur.level));
          // Measured in play time, not wall clock: a pause is not part of how
          // long the level took you.
          recordLevelCleared(
            missionStats.current.playMs - missionStats.current.levelStartedAtMs,
          );
        }
        // The mission just ended (all levels won, or out of lives): count it once.
        if (
          soundPrev.phase === "playing" &&
          (cur.phase === "won" || cur.phase === "lost") &&
          !missionStats.current.outcomeRecorded
        ) {
          missionStats.current.outcomeRecorded = true;
          flushStatsTime();
          recordGameFinished(GAME_ID, {
            won: cur.phase === "won",
            durationMs: missionStats.current.playMs,
            finishedAt: Date.now(),
          });
          flushShots();
          invalidateStats();
        }
      }
      soundPrev = stateRef.current;
      // Show the blue aim cursor only while actually playing with the mouse in.
      const pointer =
        playing && mouseInside.current
          ? { ...mouse.current, ownId: "player" }
          : null;
      stepSmoke(smoke, stateRef.current.bullets, dt);
      stepMuzzleFlashes(flashes, stateRef.current.bullets, dt);
      stepTankExplosions(explosions, dt);
      draw(ctx, stateRef.current, pointer, smoke, flashes, explosions);
      drawTouchControls(ctx, touch.sample());
      raf = window.requestAnimationFrame(frame);
    };
    raf = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(raf);
      // Book the play time gathered so far before leaving the page.
      flushStatsTime();
      clearTimeout(bannerTimer.current);
      stopVolume();
      sound.dispose();
      touch.dispose();
      canvas.removeEventListener("mousemove", aimAt);
      canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [syncHud, showStart, showComplete, flushStatsTime, flushShots]);

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
    // A brand-new mission: start a fresh statistics run.
    beginMissionStats();
    stateRef.current = restart(stateRef.current);
    runningRef.current = true;
    syncHud();
  };
  const jumpBy = (delta: number, fair = false) => {
    // No ceiling: past the campaign every step forward is the next arena.
    runRef.current.fair = runRef.current.fair && fair;
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
    banner,
    start,
    next,
    newMission: restartMission,
    levelBack: () => jumpBy(-1),
    levelForward: () => jumpBy(1),
    toEndless: () => jumpBy(1, stateRef.current.phase === "won"),
    levelCount: LEVEL_COUNT,
  };
}

/** The HUD snapshot for a state. */
function hudOf(
  state: GameState,
  running: boolean,
  run: { readonly wave: number; readonly fair: boolean } = {
    wave: 0,
    fair: true,
  },
): Hud {
  return {
    phase: state.phase,
    level: state.level,
    lives: state.lives,
    enemies: enemiesLeft(state),
    mines: minesLeft(state),
    wave: state.wave,
    runWave: run.wave,
    fair: run.fair,
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
    a.wave === b.wave &&
    a.runWave === b.runWave &&
    a.fair === b.fair &&
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
