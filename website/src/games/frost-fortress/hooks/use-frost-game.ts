/**
 * Frost Fortress in the browser: the frame loop, the camera, mouse, touch and
 * keys, saving and the statistics.
 *
 * @module
 * @remarks
 * The game is one mutable object that the loop changes sixty times a second.
 * React only hears about it a few times a second (`tick`), which is plenty for
 * the panels and keeps the frame free for drawing.
 */
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject,
} from "react";
import {
  createSoundPlayer,
  type SoundPlayer,
} from "@/games/frost-fortress/audio/sounds";
import {
  createEffects,
  type Effects,
} from "@/games/frost-fortress/components/effects";
import {
  createPainter,
  MAX_ZOOM,
  MIN_ZOOM,
  type Camera,
  type Painter,
} from "@/games/frost-fortress/components/render";
import {
  answerOffer,
  callWave,
  cancelResearch,
  collectAt,
  createGame,
  demolish,
  drainEvents,
  moveSite,
  placeProblem,
  placeStructure,
  repair,
  repairAll,
  setCheat,
  startExpedition,
  summonAllies,
  summonEnemies,
  toggleAutoExplore,
  startResearch,
  startUpgrade,
  step,
} from "@/games/frost-fortress/engine/engine";
import {
  hqCentre,
  MAP_COLS,
  MAP_ROWS,
  TILE,
} from "@/games/frost-fortress/engine/map";
import { storageLimit } from "@/games/frost-fortress/engine/modifiers";
import { RESEARCH } from "@/games/frost-fortress/engine/research";
import { structureAt } from "@/games/frost-fortress/engine/runtime";
import { fromSave, toSave } from "@/games/frost-fortress/engine/save";
import { STRUCTURES } from "@/games/frost-fortress/engine/structures";
import { badgeAt } from "@/games/frost-fortress/components/upgrade-badge";
import type {
  EnemyKind,
  Game,
  StructureKind,
} from "@/games/frost-fortress/engine/types";
import {
  autosaveSetting,
  edgeScrollSetting,
  mutedSetting,
  NORMAL_TOP,
  freeBuildSetting,
  numbersSetting,
  rangeSetting,
  speedSetting,
} from "@/games/frost-fortress/settings/preferences";
import { addFortressStats } from "@/games/frost-fortress/stats/fortress-stats";
import {
  clearAutosave,
  loadAutosave,
  loadManual,
  writeAutosave,
  writeManual,
  type Counted,
  type SavedGame,
} from "@/games/frost-fortress/storage/save-store";
import type { GameId } from "@/games/registry";
import {
  recordGameFinished,
  recordGameStarted,
  recordPlayTime,
} from "@/lib/stats/stats-recorder";
import { invalidateStats } from "@/lib/stats/stats-store";
import type { StoredValue } from "@/lib/storage/stored-value";

/** The game's id in the collection. */
const GAME_ID: GameId = "frost-fortress";

/** Milliseconds per second. */
const MS = 1000;

/** Longest frame that is simulated in one go, seconds (a tab coming back). */
const MAX_FRAME = 0.25;

/** How often the panels refresh, milliseconds. */
const HUD_EVERY = 150;

/** How often the game saves itself and the statistics are written, ms. */
const AUTOSAVE_EVERY = 30000;
const FLUSH_EVERY = 15000;

/** Camera pan speed with the keys, screen pixels per second. */
const PAN_SPEED = 700;

/** Width of the edge that scrolls the map, pixels. */
const EDGE = 22;

/** Wheel zoom sensitivity. */
const WHEEL_ZOOM = 0.0015;

/** A touch that moves less than this is a tap, pixels. */
const TAP_SLOP = 10;

/** How far beyond the map the camera may look, world units. */
const CAMERA_MARGIN_TILES = 4;
const CAMERA_MARGIN = TILE * CAMERA_MARGIN_TILES;

/** Real time one frame may spend simulating, ms - at 100x the game then just runs a little slower instead of freezing the page. */
const STEP_BUDGET_MS = 12;

/** Game seconds simulated between two looks at the clock. */
const STEP_CHUNK = 0.5;

/** Effects run a little slower than fast forward, so they stay readable. */
const EFFECT_PACE = 0.75;

/** Zoom at the start. */
const START_ZOOM = 1;

/** Device pixels per CSS pixel at most. */
const MOST_DOTS = 2;

/** Seconds the first wave comes after with the fast test flag. */
const FAST_WAVE = 8;

/** Seconds into the day that the night test flag jumps to. */
const NIGHT_CLOCK = 260;

/** Seconds a forced blizzard lasts. */
const STORM_HOLD = 900;

/** Nothing counted yet. */
const ZERO: Counted = { kills: 0, bosses: 0, built: 0, waves: 0 };

/** Seed range for new maps. */
const SEED_RANGE = 1_000_000_000;

/** A short note shown over the field. */
export type Toast = { readonly text: string; readonly at: number };

/** What the screen gets from the hook. */
export type FrostGame = {
  readonly canvasRef: RefObject<HTMLCanvasElement | null>;
  /** The running game - a mutable object, re-read on every `tick`. */
  readonly game: Game | null;
  readonly tick: number;
  readonly placing: StructureKind | null;
  /** The level what is placed is built at. */
  readonly placingLevel: number;
  readonly selected: number;
  readonly moving: number;
  readonly speed: number;
  readonly paused: boolean;
  readonly toast: Toast | null;
  readonly manualSavedAt: number | null;
  readonly choose: (kind: StructureKind | null, level?: number) => void;
  readonly cancel: () => void;
  readonly select: (id: number) => void;
  readonly upgrade: (id: number) => void;
  readonly repairOne: (id: number) => void;
  readonly repairEverything: () => void;
  readonly remove: (id: number) => void;
  readonly beginMove: (id: number) => void;
  readonly research: (id: string) => void;
  readonly stopResearch: () => void;
  readonly sendWave: () => void;
  /** Calls a group of one enemy kind. */
  readonly callEnemies: (kind: EnemyKind) => void;
  /** Calls allied soldiers to the headquarters. */
  readonly callAllies: () => void;
  readonly explore: () => void;
  /** Switches the automatic expeditions on or off. */
  readonly autoExplore: () => void;
  readonly trade: (accept: boolean) => void;
  readonly setSpeed: (speed: number) => void;
  /** Switches the cheat on or off. */
  readonly toggleCheat: () => void;
  readonly togglePause: () => void;
  readonly save: () => void;
  readonly load: () => void;
  readonly newGame: () => void;
  readonly focusHq: () => void;
};

/** Things the loop needs that are not React state. */
type Live = {
  camera: Camera;
  keys: Set<string>;
  mouse: { x: number; y: number; inside: boolean };
  hover: { col: number; row: number } | null;
  pointers: Map<
    number,
    { x: number; y: number; startX: number; startY: number }
  >;
  pan: boolean;
  pinch: number;
  wallFrom: { col: number; row: number } | null;
  dragSite: { id: number; moved: boolean } | null;
  placing: StructureKind | null;
  placingLevel: number;
  selected: number;
  moving: number;
  speed: number;
  paused: boolean;
  rich: boolean;
  playMs: number;
  startedAt: number;
  counted: Counted;
  finished: boolean;
};

/**
 * Runs Frost Fortress on a canvas.
 *
 * @returns the game and everything the panels can do with it
 */
export function useFrostGame(): FrostGame {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<Game | null>(null);
  const painterRef = useRef<Painter | null>(null);
  const effectsRef = useRef<Effects | null>(null);
  const soundRef = useRef<SoundPlayer | null>(null);
  const liveRef = useRef<Live>({
    camera: {
      x: (MAP_COLS * TILE) / 2,
      y: (MAP_ROWS * TILE) / 2,
      zoom: START_ZOOM,
    },
    keys: new Set(),
    mouse: { x: 0, y: 0, inside: false },
    hover: null,
    pointers: new Map(),
    pan: false,
    pinch: 0,
    wallFrom: null,
    dragSite: null,
    placing: null,
    placingLevel: 1,
    selected: 0,
    moving: 0,
    speed: 1,
    paused: false,
    rich: false,
    playMs: 0,
    startedAt: 0,
    counted: ZERO,
    finished: false,
  });
  const [game, setGame] = useState<Game | null>(null);
  const [tick, setTick] = useState(0);
  const [placing, setPlacing] = useState<StructureKind | null>(null);
  const [placingLevel, setPlacingLevel] = useState(1);
  const [selected, setSelected] = useState(0);
  const [moving, setMoving] = useState(0);
  const [speed, setSpeedState] = useState(1);
  const [paused, setPaused] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [manualSavedAt, setManualSavedAt] = useState<number | null>(null);
  const muted = useStored(mutedSetting);
  const numbers = useStored(numbersSetting);
  const edgeScroll = useStored(edgeScrollSetting);
  const autosave = useStored(autosaveSetting);
  const range = useStored(rangeSetting);
  const freeBuild = useStored(freeBuildSetting);
  const settingsRef = useRef({
    numbers,
    edgeScroll,
    autosave,
    range,
    freeBuild,
  });

  useEffect(() => {
    settingsRef.current = { numbers, edgeScroll, autosave, range, freeBuild };
  }, [numbers, edgeScroll, autosave, range, freeBuild]);

  useEffect(() => {
    soundRef.current?.setMuted(muted);
  }, [muted]);

  const refresh = useCallback(() => setTick((value) => value + 1), []);

  const notify = useCallback((text: string) => {
    setToast({ text, at: performance.now() });
  }, []);

  const syncSelection = useCallback(() => {
    const live = liveRef.current;
    setPlacing(live.placing);
    setPlacingLevel(live.placingLevel);
    setSelected(live.selected);
    setMoving(live.moving);
  }, []);

  /** Puts a game on screen: painter, effects, camera on the headquarters. */
  const adopt = useCallback(
    (next: Game, saved: SavedGame | null) => {
      const live = liveRef.current;
      gameRef.current = next;
      painterRef.current = createPainter(next.seed);
      effectsRef.current?.clear();
      const centre = hqCentre();
      live.camera.x = centre.col * TILE + TILE / 2;
      live.camera.y = centre.row * TILE + TILE / 2;
      live.placing = null;
      live.selected = 0;
      live.moving = 0;
      live.startedAt = saved?.startedAt ?? Date.now();
      // A test start in a later wave must not count the skipped waves.
      live.counted = saved?.counted ?? { ...ZERO, waves: next.wave.number };
      live.finished = saved?.finished ?? false;
      live.playMs = 0;
      setGame(next);
      syncSelection();
      refresh();
    },
    [refresh, syncSelection],
  );

  const snapshot = useCallback((): SavedGame | null => {
    const current = gameRef.current;
    const live = liveRef.current;
    return current === null
      ? null
      : {
          savedAt: Date.now(),
          game: toSave(current),
          startedAt: live.startedAt,
          counted: live.counted,
          finished: live.finished,
        };
  }, []);

  /** Writes play time and the game's own numbers to the statistics. */
  const flushStats = useCallback(() => {
    const current = gameRef.current;
    const live = liveRef.current;
    if (current !== null) {
      if (live.playMs > 0) {
        recordPlayTime(GAME_ID, live.playMs, Date.now());
        live.playMs = 0;
      }
      const waves = current.wave.number - (current.wave.active ? 1 : 0);
      const delta = {
        kills: current.stats.kills - live.counted.kills,
        bosses: current.stats.bosses - live.counted.bosses,
        built: current.stats.built - live.counted.built,
        waves: Math.max(0, waves - live.counted.waves),
      };
      const fell = current.over && !live.finished;
      const counts =
        delta.kills + delta.bosses + delta.built + delta.waves > 0 || fell;
      // A run with the cheat sets no records.
      if (counts && !current.cheated) {
        addFortressStats(delta, current.wave.number, fell);
      }
      if (counts) {
        live.counted = {
          ...current.stats,
          waves: Math.max(waves, live.counted.waves),
        };
      }
      if (fell) {
        live.finished = true;
        recordGameFinished(GAME_ID, {
          won: false,
          durationMs: Date.now() - live.startedAt,
          finishedAt: Date.now(),
        });
      }
      invalidateStats();
    }
  }, []);

  const writeAuto = useCallback(() => {
    const saved = snapshot();
    if (saved !== null && settingsRef.current.autosave) {
      writeAutosave(saved);
    }
  }, [snapshot]);

  const startNew = useCallback(() => {
    const next = createGame(Math.floor(Math.random() * SEED_RANGE));
    applyTestFlags(next, liveRef.current);
    recordGameStarted(GAME_ID, Date.now());
    adopt(next, null);
    invalidateStats();
  }, [adopt]);

  // Mount: sound, effects, and the saved game or a new one.
  useEffect(() => {
    soundRef.current = createSoundPlayer();
    soundRef.current.setMuted(mutedSetting.load());
    effectsRef.current = createEffects();
    const initialSpeed = speedSetting.load();
    liveRef.current.speed = initialSpeed;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the stored speed and save arrive after hydration
    setSpeedState(initialSpeed);
    setManualSavedAt(loadManual()?.savedAt ?? null);
    const saved = loadAutosave();
    if (saved !== null && !saved.game.over) {
      const restored = fromSave(saved.game);
      applyTestFlags(restored, liveRef.current);
      adopt(restored, saved);
    } else {
      startNew();
    }
  }, [adopt, startNew]);

  // Saving when the tab goes away.
  useEffect(() => {
    const away = () => {
      if (document.visibilityState === "hidden") {
        flushStats();
        writeAuto();
      }
    };
    const leave = () => {
      flushStats();
      writeAuto();
    };
    document.addEventListener("visibilitychange", away);
    window.addEventListener("pagehide", leave);
    return () => {
      document.removeEventListener("visibilitychange", away);
      window.removeEventListener("pagehide", leave);
    };
  }, [flushStats, writeAuto]);

  // The frame loop and the input.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d") ?? null;
    let cleanup: (() => void) | undefined;
    if (canvas !== null && ctx !== null) {
      const live = liveRef.current;
      let raf = 0;
      let last = performance.now();
      let hudAt = 0;
      let autoAt = performance.now();
      let flushAt = performance.now();
      let clock = 0;

      const size = () => {
        const dots = Math.min(MOST_DOTS, window.devicePixelRatio || 1);
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const pixelsX = Math.max(1, Math.round(width * dots));
        const pixelsY = Math.max(1, Math.round(height * dots));
        if (canvas.width !== pixelsX || canvas.height !== pixelsY) {
          canvas.width = pixelsX;
          canvas.height = pixelsY;
        }
        return { width, height, dots };
      };

      const toWorld = (sx: number, sy: number) => {
        const { width, height } = {
          width: canvas.clientWidth,
          height: canvas.clientHeight,
        };
        return {
          x: live.camera.x + (sx - width / 2) / live.camera.zoom,
          y: live.camera.y + (sy - height / 2) / live.camera.zoom,
        };
      };

      const tileAt = (sx: number, sy: number) => {
        const world = toWorld(sx, sy);
        return {
          col: Math.floor(world.x / TILE),
          row: Math.floor(world.y / TILE),
          x: world.x,
          y: world.y,
        };
      };

      const clampCamera = () => {
        const margin = CAMERA_MARGIN;
        live.camera.x = Math.min(
          MAP_COLS * TILE + margin,
          Math.max(-margin, live.camera.x),
        );
        live.camera.y = Math.min(
          MAP_ROWS * TILE + margin,
          Math.max(-margin, live.camera.y),
        );
      };

      const zoomAt = (sx: number, sy: number, factor: number) => {
        const before = toWorld(sx, sy);
        live.camera.zoom = Math.min(
          MAX_ZOOM,
          Math.max(MIN_ZOOM, live.camera.zoom * factor),
        );
        const after = toWorld(sx, sy);
        live.camera.x += before.x - after.x;
        live.camera.y += before.y - after.y;
        clampCamera();
      };

      const local = (event: PointerEvent | WheelEvent) => {
        const rect = canvas.getBoundingClientRect();
        return { x: event.clientX - rect.left, y: event.clientY - rect.top };
      };

      /** A click or tap on the field. */
      const press = (sx: number, sy: number, touch: boolean) => {
        const current = gameRef.current;
        if (current !== null && !current.over) {
          soundRef.current?.resume();
          const spot = tileAt(sx, sy);
          live.hover = { col: spot.col, row: spot.row };
          if (live.placing !== null) {
            const def = STRUCTURES[live.placing];
            const col = spot.col - Math.floor((def.width - 1) / 2);
            const row = spot.row - Math.floor((def.height - 1) / 2);
            const site = placeStructure(
              current,
              live.placing,
              col,
              row,
              live.placingLevel,
            );
            if (site === null) {
              soundRef.current?.cue("denied");
            } else if (touch) {
              // No hover on a touch screen: the ghost would sit on what was just built.
              live.hover = null;
            } else if (live.placing === "wall") {
              live.wallFrom = { col, row };
            }
          } else if (live.moving !== 0) {
            finishMove(current, spot.col, spot.row);
          } else if (upgradeByBadge(current, spot.x, spot.y)) {
            soundRef.current?.cue("click");
          } else if (!collectAt(current, spot.x, spot.y)) {
            const hit = structureAt(current, spot.col, spot.row);
            if (hit !== undefined && !hit.built && !touch) {
              live.dragSite = { id: hit.id, moved: false };
            }
            live.selected = hit?.id ?? 0;
            if (hit === undefined && !touch) {
              live.pan = true;
            }
            soundRef.current?.cue("click");
          }
          syncSelection();
          refresh();
        }
      };

      /** A click on an upgrade arrow upgrades at once. */
      const upgradeByBadge = (current: Game, x: number, y: number) => {
        const hit = badgeAt(current, x, y, live.camera.zoom);
        return hit !== undefined && startUpgrade(current, hit.id);
      };

      const finishMove = (current: Game, col: number, row: number) => {
        const id = live.moving;
        const site = current.structures.find((entry) => entry.id === id);
        if (site !== undefined) {
          const def = STRUCTURES[site.kind];
          const ok = moveSite(
            current,
            id,
            col - Math.floor((def.width - 1) / 2),
            row - Math.floor((def.height - 1) / 2),
          );
          if (ok) {
            live.moving = 0;
            live.selected = id;
          } else {
            soundRef.current?.cue("denied");
          }
        } else {
          live.moving = 0;
        }
      };

      const cancelAll = () => {
        live.placing = null;
        live.moving = 0;
        live.selected = 0;
        live.wallFrom = null;
        live.dragSite = null;
        syncSelection();
      };

      const down = (event: PointerEvent) => {
        const at = local(event);
        canvas.setPointerCapture(event.pointerId);
        if (event.pointerType === "touch") {
          live.pointers.set(event.pointerId, {
            x: at.x,
            y: at.y,
            startX: at.x,
            startY: at.y,
          });
          if (live.pointers.size === 2) {
            const [a, b] = [...live.pointers.values()];
            live.pinch = Math.hypot(a.x - b.x, a.y - b.y);
            live.pan = true;
          }
        } else if (event.button === 2) {
          cancelAll();
        } else if (event.button === 1) {
          live.pan = true;
        } else if (event.button === 0) {
          press(at.x, at.y, false);
        }
        event.preventDefault();
      };

      const move = (event: PointerEvent) => {
        const at = local(event);
        live.mouse = { x: at.x, y: at.y, inside: true };
        const spot = tileAt(at.x, at.y);
        if (event.pointerType === "touch") {
          const pointer = live.pointers.get(event.pointerId);
          if (pointer !== undefined) {
            const dx = at.x - pointer.x;
            const dy = at.y - pointer.y;
            pointer.x = at.x;
            pointer.y = at.y;
            if (live.pointers.size >= 2) {
              const [a, b] = [...live.pointers.values()];
              const distance = Math.hypot(a.x - b.x, a.y - b.y);
              if (live.pinch > 0) {
                zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, distance / live.pinch);
              }
              live.pinch = distance;
              live.camera.x -= dx / 2 / live.camera.zoom;
              live.camera.y -= dy / 2 / live.camera.zoom;
            } else if (
              live.pan ||
              Math.hypot(at.x - pointer.startX, at.y - pointer.startY) >
                TAP_SLOP
            ) {
              live.pan = true;
              live.camera.x -= dx / live.camera.zoom;
              live.camera.y -= dy / live.camera.zoom;
            }
            clampCamera();
          }
        } else {
          live.hover = { col: spot.col, row: spot.row };
          if (live.pan) {
            live.camera.x -= event.movementX / live.camera.zoom;
            live.camera.y -= event.movementY / live.camera.zoom;
            clampCamera();
          }
          const current = gameRef.current;
          if (
            live.wallFrom !== null &&
            current !== null &&
            live.placing === "wall"
          ) {
            layWalls(current, live.wallFrom, spot);
            live.wallFrom = { col: spot.col, row: spot.row };
          }
          if (live.dragSite !== null) {
            const site = current?.structures.find(
              (entry) => entry.id === live.dragSite?.id,
            );
            const inside =
              site !== undefined &&
              structureAt(current as Game, spot.col, spot.row)?.id === site.id;
            if (!inside && !live.dragSite.moved) {
              live.dragSite.moved = true;
              live.moving = live.dragSite.id;
              syncSelection();
            }
          }
        }
      };

      const layWalls = (
        current: Game,
        from: { col: number; row: number },
        to: { col: number; row: number },
      ) => {
        const steps = Math.max(
          Math.abs(to.col - from.col),
          Math.abs(to.row - from.row),
        );
        for (let index = 1; index <= steps; index += 1) {
          const col = Math.round(
            from.col + ((to.col - from.col) * index) / steps,
          );
          const row = Math.round(
            from.row + ((to.row - from.row) * index) / steps,
          );
          const level = live.placingLevel;
          if (placeProblem(current, "wall", col, row, 0, level) === null) {
            placeStructure(current, "wall", col, row, level);
          }
        }
      };

      const up = (event: PointerEvent) => {
        const at = local(event);
        if (event.pointerType === "touch") {
          const pointer = live.pointers.get(event.pointerId);
          live.pointers.delete(event.pointerId);
          const tap =
            pointer !== undefined &&
            !live.pan &&
            Math.hypot(at.x - pointer.startX, at.y - pointer.startY) <=
              TAP_SLOP;
          if (tap) {
            press(at.x, at.y, true);
          }
          if (live.pointers.size === 0) {
            live.pan = false;
            live.pinch = 0;
          }
        } else {
          const current = gameRef.current;
          if (
            live.dragSite !== null &&
            live.dragSite.moved &&
            current !== null
          ) {
            const spot = tileAt(at.x, at.y);
            finishMove(current, spot.col, spot.row);
            syncSelection();
          }
          live.dragSite = null;
          live.wallFrom = null;
          live.pan = false;
        }
        refresh();
      };

      const leave = () => {
        live.mouse.inside = false;
        if (live.pointers.size === 0) {
          live.hover =
            live.placing === null && live.moving === 0 ? null : live.hover;
        }
      };

      const wheel = (event: WheelEvent) => {
        const at = local(event);
        zoomAt(at.x, at.y, Math.exp(-event.deltaY * WHEEL_ZOOM));
        event.preventDefault();
      };

      const keyDown = (event: KeyboardEvent) => {
        const target = event.target as HTMLElement | null;
        const typing =
          target !== null &&
          (target.tagName === "INPUT" || target.tagName === "TEXTAREA");
        if (!typing) {
          const key = event.key.toLowerCase();
          live.keys.add(key);
          if (key === "escape") {
            cancelAll();
          } else if (key === " ") {
            live.paused = !live.paused;
            setPaused(live.paused);
            event.preventDefault();
          } else if (key === "1" || key === "2" || key === "3") {
            live.speed = Number(key);
            live.paused = false;
            setSpeedState(live.speed);
            setPaused(false);
          }
          if (key.startsWith("arrow")) {
            event.preventDefault();
          }
          soundRef.current?.resume();
        }
      };

      const keyUp = (event: KeyboardEvent) => {
        live.keys.delete(event.key.toLowerCase());
      };

      const blur = () => live.keys.clear();
      const menu = (event: Event) => event.preventDefault();

      canvas.addEventListener("pointerdown", down);
      canvas.addEventListener("pointermove", move);
      canvas.addEventListener("pointerup", up);
      canvas.addEventListener("pointercancel", up);
      canvas.addEventListener("pointerleave", leave);
      canvas.addEventListener("wheel", wheel, { passive: false });
      canvas.addEventListener("contextmenu", menu);
      window.addEventListener("keydown", keyDown);
      window.addEventListener("keyup", keyUp);
      window.addEventListener("blur", blur);

      const frame = (now: number) => {
        const dt = Math.min(MAX_FRAME, (now - last) / MS);
        last = now;
        clock += dt;
        const current = gameRef.current;
        const view = size();
        panByKeys(
          live,
          dt,
          view.width,
          view.height,
          settingsRef.current.edgeScroll,
        );
        clampCamera();
        if (current !== null) {
          current.rangeBoost = settingsRef.current.range;
          current.freeBuild = settingsRef.current.freeBuild;
          const running = !live.paused && !current.over;
          if (running) {
            const wasOver = current.over;
            const pace = current.cheat
              ? live.speed
              : Math.min(live.speed, NORMAL_TOP);
            simulate(current, dt * pace);
            live.playMs += dt * MS;
            if (live.rich) {
              const limit = storageLimit(current);
              for (const id of Object.keys(
                current.res,
              ) as (keyof Game["res"])[]) {
                current.res[id] = limit;
              }
            }
            if (!wasOver && current.over) {
              flushStats();
              writeAuto();
            }
          }
          const events = drainEvents(current);
          effectsRef.current?.add(events, settingsRef.current.numbers);
          soundRef.current?.play(events);
          if (events.some((event) => event.type === "waveClear")) {
            flushStats();
            writeAuto();
            autoAt = now;
          }
          effectsRef.current?.update(
            running ? dt * Math.max(1, live.speed * EFFECT_PACE) : 0,
          );
          const painter = painterRef.current;
          const effects = effectsRef.current;
          if (painter !== null && effects !== null) {
            painter.draw(
              ctx,
              current,
              {
                camera: live.camera,
                width: view.width,
                height: view.height,
                dots: view.dots,
                hover: live.hover,
                placing: live.placing,
                placingLevel: live.placingLevel,
                moving: live.moving,
                selected: live.selected,
                clock,
              },
              effects,
            );
          }
          if (
            live.selected !== 0 &&
            !current.structures.some((entry) => entry.id === live.selected)
          ) {
            live.selected = 0;
            syncSelection();
          }
          if (now - hudAt > HUD_EVERY) {
            hudAt = now;
            refresh();
          }
          if (now - autoAt > AUTOSAVE_EVERY) {
            autoAt = now;
            writeAuto();
          }
          if (now - flushAt > FLUSH_EVERY) {
            flushAt = now;
            flushStats();
          }
        }
        raf = window.requestAnimationFrame(frame);
      };
      raf = window.requestAnimationFrame(frame);

      cleanup = () => {
        window.cancelAnimationFrame(raf);
        canvas.removeEventListener("pointerdown", down);
        canvas.removeEventListener("pointermove", move);
        canvas.removeEventListener("pointerup", up);
        canvas.removeEventListener("pointercancel", up);
        canvas.removeEventListener("pointerleave", leave);
        canvas.removeEventListener("wheel", wheel);
        canvas.removeEventListener("contextmenu", menu);
        window.removeEventListener("keydown", keyDown);
        window.removeEventListener("keyup", keyUp);
        window.removeEventListener("blur", blur);
      };
    }
    return cleanup;
  }, [flushStats, refresh, syncSelection, writeAuto]);

  /** Runs a command on the game and refreshes the panels. */
  const act = useCallback(
    (
      command: (current: Game) => boolean | number | void,
      sound: "click" | "denied" | null = "click",
    ) => {
      const current = gameRef.current;
      if (current !== null && !current.over) {
        soundRef.current?.resume();
        const result = command(current);
        if (sound !== null) {
          soundRef.current?.cue(result === false ? "denied" : sound);
        }
        refresh();
      }
    },
    [refresh],
  );

  const choose = useCallback(
    (kind: StructureKind | null, level = 1) => {
      const live = liveRef.current;
      const same = live.placing === kind && live.placingLevel === level;
      live.placing = same ? null : kind;
      live.placingLevel = level;
      live.moving = 0;
      live.selected = 0;
      soundRef.current?.resume();
      soundRef.current?.cue("click");
      syncSelection();
    },
    [syncSelection],
  );

  const cancel = useCallback(() => {
    const live = liveRef.current;
    live.placing = null;
    live.moving = 0;
    live.selected = 0;
    syncSelection();
  }, [syncSelection]);

  const select = useCallback(
    (id: number) => {
      liveRef.current.selected = id;
      liveRef.current.placing = null;
      syncSelection();
    },
    [syncSelection],
  );

  const setSpeed = useCallback((value: number) => {
    const live = liveRef.current;
    live.speed = value;
    live.paused = false;
    setSpeedState(value);
    setPaused(false);
    soundRef.current?.resume();
  }, []);

  /** Back to normal speed when a game without the cheat runs at a cheat speed. */
  const calmSpeed = useCallback((current: Game) => {
    const live = liveRef.current;
    if (!current.cheat && live.speed > NORMAL_TOP) {
      live.speed = 1;
      setSpeedState(1);
    }
  }, []);

  const toggleCheat = useCallback(() => {
    const current = gameRef.current;
    if (current !== null && !current.over) {
      setCheat(current, !current.cheat);
      calmSpeed(current);
      soundRef.current?.cue("click");
      refresh();
    }
  }, [calmSpeed, refresh]);

  const togglePause = useCallback(() => {
    const live = liveRef.current;
    live.paused = !live.paused;
    setPaused(live.paused);
  }, []);

  const save = useCallback(() => {
    const saved = snapshot();
    if (saved !== null && writeManual(saved)) {
      setManualSavedAt(saved.savedAt);
      writeAutosave(saved);
      notify("saved");
    }
  }, [notify, snapshot]);

  const load = useCallback(() => {
    const saved = loadManual();
    if (saved !== null) {
      flushStats();
      const restored = fromSave(saved.game);
      adopt(restored, {
        ...saved,
        counted: {
          ...restored.stats,
          waves: restored.wave.number - (restored.wave.active ? 1 : 0),
        },
      });
      calmSpeed(restored);
      notify("loaded");
    }
  }, [adopt, calmSpeed, flushStats, notify]);

  const newGame = useCallback(() => {
    flushStats();
    clearAutosave();
    startNew();
    if (gameRef.current !== null) {
      calmSpeed(gameRef.current);
    }
  }, [calmSpeed, flushStats, startNew]);

  const focusHq = useCallback(() => {
    const centre = hqCentre();
    liveRef.current.camera.x = centre.col * TILE + TILE / 2;
    liveRef.current.camera.y = centre.row * TILE + TILE / 2;
  }, []);

  return {
    canvasRef,
    game,
    tick,
    placing,
    placingLevel,
    selected,
    moving,
    speed,
    paused,
    toast,
    manualSavedAt,
    choose,
    cancel,
    select,
    upgrade: (id) => act((current) => startUpgrade(current, id)),
    repairOne: (id) => act((current) => repair(current, id)),
    repairEverything: () => act((current) => repairAll(current) > 0),
    remove: (id) => {
      act((current) => demolish(current, id));
      cancel();
    },
    beginMove: (id) => {
      liveRef.current.moving = id;
      liveRef.current.placing = null;
      syncSelection();
    },
    research: (id) => act((current) => startResearch(current, id)),
    stopResearch: () => act((current) => cancelResearch(current)),
    sendWave: () => act((current) => callWave(current)),
    callEnemies: (kind) => act((current) => summonEnemies(current, kind)),
    callAllies: () => act((current) => summonAllies(current) > 0),
    explore: () => act((current) => startExpedition(current)),
    autoExplore: () => act((current) => toggleAutoExplore(current)),
    trade: (accept) =>
      act((current) => answerOffer(current, accept) || !accept),
    setSpeed,
    toggleCheat,
    togglePause,
    save,
    load,
    newGame,
    focusHq,
  };
}

/**
 * Runs the game on in chunks until the time is used up or the frame's budget
 * is spent.
 *
 * @param game - the game, changed
 * @param seconds - game seconds to simulate
 */
function simulate(game: Game, seconds: number): void {
  const started = performance.now();
  let left = seconds;
  while (left > 0 && performance.now() - started < STEP_BUDGET_MS) {
    const chunk = Math.min(STEP_CHUNK, left);
    step(game, chunk);
    left -= chunk;
  }
}

/** Moves the camera with the keys and, if allowed, at the screen edge. */
function panByKeys(
  live: Live,
  dt: number,
  width: number,
  height: number,
  edge: boolean,
): void {
  const keys = live.keys;
  let dx = 0;
  let dy = 0;
  if (keys.has("a") || keys.has("arrowleft")) dx -= 1;
  if (keys.has("d") || keys.has("arrowright")) dx += 1;
  if (keys.has("w") || keys.has("arrowup")) dy -= 1;
  if (keys.has("s") || keys.has("arrowdown")) dy += 1;
  if (edge && live.mouse.inside && live.pointers.size === 0 && !live.pan) {
    if (live.mouse.x < EDGE) dx -= 1;
    if (live.mouse.x > width - EDGE) dx += 1;
    if (live.mouse.y < EDGE) dy -= 1;
    if (live.mouse.y > height - EDGE) dy += 1;
  }
  live.camera.x += (Math.sign(dx) * PAN_SPEED * dt) / live.camera.zoom;
  live.camera.y += (Math.sign(dy) * PAN_SPEED * dt) / live.camera.zoom;
}

/**
 * Test shortcuts from the address: `?ff=night,storm,rich,tech,fast,wave8`.
 *
 * @remarks
 * Only for trying things out - nothing on screen points to them.
 */
function applyTestFlags(game: Game, live: Live): void {
  const flags =
    typeof window === "undefined"
      ? []
      : (new URLSearchParams(window.location.search).get("ff") ?? "").split(
          ",",
        );
  for (const flag of flags) {
    if (flag === "night") {
      game.weather.clock = NIGHT_CLOCK;
    } else if (flag === "storm") {
      game.weather.storm = 1;
      game.weather.stormGoal = 1;
      game.weather.stormLeft = STORM_HOLD;
    } else if (flag === "rich") {
      live.rich = true;
    } else if (flag === "tech") {
      game.research.done = RESEARCH.map((entry) => entry.id);
    } else if (flag === "fast") {
      game.wave.countdown = Math.min(game.wave.countdown, FAST_WAVE);
    } else if (flag.startsWith("wave")) {
      const wave = Number(flag.slice("wave".length));
      if (Number.isInteger(wave) && wave > 1) {
        game.wave.number = wave - 1;
        game.wave.countdown = FAST_WAVE;
      }
    }
  }
}

/** Reads a remembered value without breaking hydration. */
function useStored<V>(store: StoredValue<V>): V {
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
}
