/**
 * Runs the game: the fixed-rate loop, the canvas, the controls, the sounds,
 * saving and the play time - and the minigame behind an Advent gate, which
 * takes over the canvas while the map waits.
 *
 * @module
 * @remarks
 * The world is simulated in fixed steps of a sixtieth of a second, however
 * fast the screen refreshes. Drawing happens once per animation frame into a
 * buffer of 320 x 180 logical pixels at the art's density, which is then blown
 * up by a whole number onto the visible canvas - the only way to keep every
 * pixel the same size while the picture scrolls.
 */
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createSoundPlayer } from "@/games/weihnachtsmann/audio/sounds";
import {
  GAME_KEYS,
  NUDGE_STEPS,
  createControls,
  keyAction,
  readControls,
  type TouchState,
} from "@/games/weihnachtsmann/components/input";
import {
  drawBubbles,
  drawFrame,
} from "@/games/weihnachtsmann/components/render";
import {
  createFieldBuffer,
  drawSession,
  fieldPoint,
  type FieldView,
} from "@/games/weihnachtsmann/components/render-minigame";
import { SHEET_DENSITY } from "@/games/weihnachtsmann/components/sprite-atlas";
import { artReady, loadArt } from "@/games/weihnachtsmann/components/sprites";
import {
  VIEW_W,
  createGame,
  step,
  toSave,
} from "@/games/weihnachtsmann/engine/engine";
import {
  GATE_COUNT,
  entryAt,
  leaveGate,
  nextGate,
} from "@/games/weihnachtsmann/engine/gates";
import {
  calendarDay,
  gateLocked,
} from "@/games/weihnachtsmann/engine/calendar";
import { spotInReach } from "@/games/weihnachtsmann/engine/interact";
import {
  ACHIEVEMENTS,
  progressOf,
} from "@/games/weihnachtsmann/engine/achievements";
import { mapSize } from "@/games/weihnachtsmann/engine/map";
import { FIRST_CHARACTER } from "@/games/weihnachtsmann/engine/map-data";
import type {
  AchievementId,
  CalendarDay,
  Action,
  AnimalId,
  AreaId,
  Dir,
  GameMap,
  GameState,
  SaveData,
} from "@/games/weihnachtsmann/engine/types";
import {
  clearSave,
  loadSave,
  writeSave,
} from "@/games/weihnachtsmann/storage/save-store";
import { miniGame } from "@/games/weihnachtsmann/minigames";
import {
  createSession,
  type MiniSession,
} from "@/games/weihnachtsmann/minigames/kit/host";
import {
  MINI_KEYS,
  createPointerState,
  readMiniInput,
  type PointerState,
} from "@/games/weihnachtsmann/minigames/kit/input";
import { MINI_SOUNDS } from "@/games/weihnachtsmann/minigames/kit/sounds";
import { MINI_H, MINI_W } from "@/games/weihnachtsmann/minigames/types";
import type { GameId } from "@/games/registry";
import { recordPlayTime } from "@/lib/stats/stats-recorder";
import { invalidateStats } from "@/lib/stats/stats-store";

/** Which game the play time is filed under. */
const GAME_ID: GameId = "weihnachtsmann";

/** Simulation steps per second. */
const STEP_RATE = 60;

/** One simulation step, in seconds. */
const STEP = 1 / STEP_RATE;

/** Most steps caught up in one frame - after a stall, skip rather than race. */
const MAX_STEPS = 5;

/** Milliseconds per second. */
const MS = 1000;

/** How often the game is saved while playing, in seconds. */
const SAVE_EVERY = 5;

/** How often play time is written, in seconds. */
const FLUSH_EVERY = 10;

/** Room kept free under the frame so the page just fits, CSS px. */
const PAGE_MARGIN = 16;

/** Room the bars under the canvas take until they can be measured, CSS px. */
const BAR_HEIGHT = 120;

/** Padding of the dark frame round the canvas, both sides together, CSS px. */
const FRAME_PADDING = 24;

/** Smallest view the screen is fitted to before the scale drops, map px. */
const MIN_VIEW_W = 240;
const MIN_VIEW_H = 135;

/** Largest view shown, map px - beyond it the picture just gets bigger. */
const MAX_VIEW_W = 400;
const MAX_VIEW_H = 240;

/** Padding of the dark frame round the canvas on a phone, both sides, CSS px. */
const TOUCH_FRAME_PADDING = 8;

/** Which way each push towards a doorway points. */
const PUSHES: Readonly<Record<Dir, readonly [number, number]>> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

/** Seeds for minigame runs are drawn below this. */
const SEED_RANGE = 0x7fffffff;

/** The field fills the canvas until the first frame says otherwise. */
const NO_FIELD: FieldView = { x: 0, y: 0, scale: 1 };

/**
 * How the screen is laid out: with keyboard and mouse as ever, or for a
 * finger - the controls under the picture when the phone is upright, beside
 * it when it lies on its side.
 */
export type Layout = "desktop" | "portrait" | "landscape";

/** An open visit to a gate, with the gate's number. */
type GateVisit = { readonly session: MiniSession; readonly number: number };

/** What the screen around the canvas shows, updated when it changes. */
export type Hud = {
  /** Index of the character steered. */
  readonly active: number;
  /** Jordi's animal, or null. */
  readonly form: AnimalId | null;
  /** Which characters are in the air, by index. */
  readonly flying: readonly boolean[];
  /** Which place each character is in, by index. */
  readonly places: readonly AreaId[];
  /** The highlighted animal while the choice is open, or null. */
  readonly menuCursor: number | null;
  /** Numbers of the Advent gates won, in order. */
  readonly gatesDone: readonly number[];
  /** The gate to do next, or null when none is left for today. */
  readonly nextGate: number | null;
  /** The gates still shut for today (only in December). */
  readonly locked: readonly number[];
  /** The gate whose minigame is open, or null on the map. */
  readonly inGate: number | null;
  /** Whether the character steered stands in front of something to use. */
  readonly canUse: boolean;
  /** Which way leads through the doorway it stands in, or null. */
  readonly entry: Dir | null;
  /** The achievements unlocked, with when (epoch ms). */
  readonly achieved: readonly (readonly [AchievementId, number])[];
  /** How far each achievement has come, in the order of the list. */
  readonly progress: readonly number[];
};

/** What the hook hands the component. */
export type WeihnachtsmannGame = {
  readonly canvasRef: RefObject<HTMLCanvasElement | null>;
  readonly hud: Hud;
  /** Sends a command to the game. */
  readonly dispatch: (action: Action) => void;
  /** Updates what the on-screen pad holds. */
  readonly setTouch: (patch: Partial<TouchState>) => void;
  /** Pushes the character steered briefly through its doorway. */
  readonly enter: () => void;
  /** Leaves the open minigame at once, back to its gate. */
  readonly quitGate: () => void;
  /** How the screen is laid out, for a finger or not. */
  readonly layout: Layout;
  /** Puts everybody back at the start. */
  readonly reset: () => void;
};

/** The screen before anything is loaded. */
const FIRST_HUD: Hud = {
  active: 0,
  form: null,
  flying: [],
  places: [],
  menuCursor: null,
  gatesDone: [],
  locked: [],
  nextGate: 1,
  inGate: null,
  canUse: false,
  entry: null,
  achieved: [],
  progress: [],
};

/**
 * Sets up and runs the game.
 *
 * @param fullscreen - whether the game fills the screen, for sizing
 * @returns refs, what the screen shows and the actions
 */
export function useWeihnachtsmannGame(fullscreen: boolean): WeihnachtsmannGame {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const fullscreenRef = useRef(fullscreen);
  const [controls] = useState(createControls);
  const [sound] = useState(createSoundPlayer);
  const [hud, setHud] = useState<Hud>(FIRST_HUD);
  const hudKeyRef = useRef("");
  const visitRef = useRef<GateVisit | null>(null);
  /** Where today's date comes from: the device, or "?datum=12-05" to try. */
  const todayRef = useRef<() => CalendarDay>(() => calendarDay(new Date()));
  const pointerRef = useRef<PointerState>(createPointerState());
  const fieldRef = useRef<FieldView>(NO_FIELD);
  const layout = useLayout();
  const layoutRef = useRef<Layout>(layout);

  useEffect(() => {
    fullscreenRef.current = fullscreen;
  }, [fullscreen]);

  useEffect(() => {
    layoutRef.current = layout;
    if (layout === "desktop") {
      // A stick or button held while the mouse took over would never let go.
      Object.assign(controls.touch, {
        moveX: 0,
        moveY: 0,
        action: false,
        alt: false,
      });
    }
  }, [layout, controls]);

  // Read what this browser remembers once, after hydration.
  useEffect(() => {
    stateRef.current = createGame(loadSave());
    const tried = triedDay(window.location.search);
    if (tried !== null) {
      todayRef.current = () => tried;
    }
  }, []);

  const dispatch = useCallback(
    (action: Action) => {
      // Every button press may be the first touch: audio needs one to start.
      sound.resume();
      if (visitRef.current === null) {
        stateRef.current?.actions.push(action);
      } else if (action.kind === "ability") {
        pointerRef.current.buttons.add("action");
      } else if (action.kind === "talk") {
        pointerRef.current.buttons.add("alt");
      } else if (action.kind === "cycle") {
        pointerRef.current.leave = true;
      }
    },
    [sound],
  );

  const setTouch = useCallback(
    (patch: Partial<TouchState>) => {
      Object.assign(controls.touch, patch);
    },
    [controls],
  );

  const enter = useCallback(() => {
    const state = stateRef.current;
    const dir = state === null ? null : entryAt(state);
    if (dir !== null) {
      const [x, y] = PUSHES[dir];
      Object.assign(controls.nudge, { x, y, steps: NUDGE_STEPS });
    }
  }, [controls]);

  const quitGate = useCallback(() => {
    visitRef.current?.session.quit();
  }, []);

  const reset = useCallback(() => {
    // Everybody goes back to the start; the Advent calendar keeps its gates
    // and the achievements stay unlocked.
    const old = stateRef.current;
    clearSave();
    visitRef.current = null;
    const fresh = createGame(old === null ? null : keptOf(toSave(old)));
    stateRef.current = fresh;
    writeSave(toSave(fresh));
  }, []);

  // Keyboard and mouse.
  useEffect(() => {
    const canvas = canvasRef.current;
    const down = (event: KeyboardEvent) => {
      sound.resume();
      const typing =
        event.target instanceof HTMLElement &&
        ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName);
      const dialogOpen = document.querySelector("dialog[open]") !== null;
      const state = stateRef.current;
      if (
        !typing &&
        !dialogOpen &&
        state !== null &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.metaKey
      ) {
        const inGate = visitRef.current !== null;
        const action =
          event.repeat || inGate
            ? null
            : keyAction(event.code, event.shiftKey, state.menu !== null);
        if (action !== null) {
          state.actions.push(action);
          event.preventDefault();
        }
        if (
          GAME_KEYS.has(event.code) ||
          (inGate && MINI_KEYS.has(event.code))
        ) {
          event.preventDefault();
          // Off any focused button, or Space would press it instead.
          if (document.activeElement instanceof HTMLButtonElement) {
            document.activeElement.blur();
          }
        }
        controls.held.add(event.code);
        if (!event.repeat) {
          controls.tapped.add(event.code);
        }
      }
    };
    const up = (event: KeyboardEvent) => {
      controls.held.delete(event.code);
    };
    const clear = () => {
      controls.held.clear();
      controls.tapped.clear();
    };
    const click = (event: MouseEvent) => {
      sound.resume();
      const state = stateRef.current;
      if (canvas !== null && state !== null && visitRef.current === null) {
        const box = canvas.getBoundingClientRect();
        const x =
          ((event.clientX - box.left) / Math.max(1, box.width)) * state.view.w;
        const y =
          ((event.clientY - box.top) / Math.max(1, box.height)) * state.view.h;
        state.actions.push({
          kind: "clickMap",
          x: x + state.camera.x,
          y: y + state.camera.y,
        });
      }
    };
    // The pointer inside a minigame: where it is, pressed or not, and taps.
    const pointer = pointerRef.current;
    const pointAt = (event: PointerEvent) =>
      canvas === null
        ? null
        : fieldPoint(canvas, fieldRef.current, event.clientX, event.clientY);
    const press = (event: PointerEvent) => {
      sound.resume();
      const point = pointAt(event);
      if (visitRef.current !== null && point !== null) {
        pointer.point = point;
        pointer.down = true;
        pointer.taps.push(point);
        event.preventDefault();
      }
    };
    const move = (event: PointerEvent) => {
      if (visitRef.current !== null) {
        pointer.point = pointAt(event);
      }
    };
    const release = () => {
      pointer.down = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    canvas?.addEventListener("click", click);
    canvas?.addEventListener("pointerdown", press);
    canvas?.addEventListener("pointermove", move);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
      canvas?.removeEventListener("click", click);
      canvas?.removeEventListener("pointerdown", press);
      canvas?.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, [controls, sound]);

  // The loop.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d") ?? null;
    const buffer = document.createElement("canvas");
    const bctx = buffer.getContext("2d");
    const field = createFieldBuffer();
    let cleanup = () => {};
    if (canvas !== null && ctx !== null && bctx !== null && field !== null) {
      cleanup = runLoop(canvas, ctx, buffer, bctx, field);
    }
    return cleanup;

    function runLoop(
      canvas: HTMLCanvasElement,
      ctx: CanvasRenderingContext2D,
      buffer: HTMLCanvasElement,
      bctx: CanvasRenderingContext2D,
      field: NonNullable<ReturnType<typeof createFieldBuffer>>,
    ): () => void {
      const art = loadArt();
      const pointer = pointerRef.current;
      let raf = 0;
      let last = performance.now();
      let acc = 0;
      let sinceSave = 0;
      let sinceFlush = 0;
      let playMs = 0;
      let lastActive = -1;
      let lastAchieved = -1;

      const flush = () => {
        if (playMs > 0) {
          recordPlayTime(GAME_ID, playMs, Date.now());
          invalidateStats();
          playMs = 0;
        }
      };

      const frame = (now: number) => {
        const state = stateRef.current;
        const elapsed = Math.min((now - last) / MS, STEP * MAX_STEPS);
        last = now;
        if (state !== null) {
          state.today = todayRef.current();
          state.now = Date.now();
          if (!document.hidden) {
            acc += elapsed;
            let steps = 0;
            while (acc >= STEP && steps < MAX_STEPS) {
              const visit = visitRef.current;
              if (visit !== null) {
                visit.session.step(readMiniInput(controls, pointer), STEP);
                if (visit.session.closed()) {
                  closeGate(state, visit);
                }
              } else {
                const read = readControls(controls, state.menu !== null);
                state.actions.push(...read.actions);
                step(state, read.input, STEP);
                if (state.gateOpen !== null) {
                  openGate(state, state.gateOpen);
                }
              }
              acc -= STEP;
              steps += 1;
            }
            for (const id of state.sounds.splice(0)) {
              sound.play(id);
            }
            playMs += elapsed * MS;
            sinceSave += elapsed;
            sinceFlush += elapsed;
          } else {
            acc = 0;
          }
          if (lastAchieved >= 0 && state.achieved.size !== lastAchieved) {
            // A new achievement is kept at once.
            writeSave(toSave(state));
          }
          lastAchieved = state.achieved.size;
          if (sinceSave > SAVE_EVERY || state.active !== lastActive) {
            sinceSave = 0;
            if (lastActive >= 0) {
              writeSave(toSave(state));
            }
            lastActive = state.active;
          }
          if (sinceFlush > FLUSH_EVERY) {
            sinceFlush = 0;
            flush();
          }
          // Sized to the outdoor map, so walking indoors keeps the canvas.
          const scale = fitScale(
            canvas,
            fullscreenRef.current,
            layoutRef.current,
            visitRef.current !== null,
            state.maps.outdoors,
          );
          // Whole map pixels, the last one cut off at the canvas's edge.
          const viewW = Math.ceil(canvas.width / scale);
          const viewH = Math.ceil(canvas.height / scale);
          if (state.view.w !== viewW || state.view.h !== viewH) {
            state.view.w = viewW;
            state.view.h = viewH;
            buffer.width = viewW * SHEET_DENSITY;
            buffer.height = viewH * SHEET_DENSITY;
          }
          const visit = visitRef.current;
          if (artReady(art) && visit !== null) {
            fieldRef.current = drawSession(
              ctx,
              field,
              visit.session,
              art,
              now / MS,
              layoutRef.current !== "desktop",
            );
          } else if (artReady(art)) {
            bctx.setTransform(SHEET_DENSITY, 0, 0, SHEET_DENSITY, 0, 0);
            bctx.imageSmoothingEnabled = false;
            drawFrame(bctx, state, art);
            // Below twice the logical size the buffer has to shrink; smooth
            // that rather than drop every other art pixel.
            ctx.imageSmoothingEnabled = scale < SHEET_DENSITY;
            ctx.drawImage(buffer, 0, 0, viewW * scale, viewH * scale);
            drawBubbles(ctx, state, scale, art);
          }
          publish(state);
        }
        raf = window.requestAnimationFrame(frame);
      };

      /** Opens the minigame of the gate just entered; the map waits. */
      const openGate = (state: GameState, number: number) => {
        const gate = state.maps.outdoors.gates.find(
          (candidate) => candidate.number === number,
        );
        controls.held.clear();
        controls.tapped.clear();
        pointer.taps.length = 0;
        visitRef.current = {
          number,
          session: createSession(miniGame(number), {
            style: gate?.style ?? "arch",
            who: state.chars[state.active].form ?? state.chars[state.active].id,
            done: state.gatesDone.has(number),
            doneCount: state.gatesDone.size,
            total: GATE_COUNT,
            seed: Math.floor(Math.random() * SEED_RANGE),
            sound: (id) => {
              sound.playRecipe(typeof id === "string" ? MINI_SOUNDS[id] : id);
            },
            onWin: () => {
              state.gatesDone.add(number);
              writeSave(toSave(state));
            },
          }),
        };
      };

      /** Back from a gate: the map goes on where it stopped. */
      const closeGate = (state: GameState, visit: GateVisit) => {
        visitRef.current = null;
        leaveGate(state, visit.session.won(), visit.number);
        controls.tapped.clear();
        writeSave(toSave(state));
      };

      /** Hands the screen around the canvas what changed. */
      const publish = (state: GameState) => {
        const done = [...state.gatesDone].sort((a, b) => a - b);
        const next: Hud = {
          active: state.active,
          form: state.chars.find((char) => char.id === "jordi")?.form ?? null,
          flying: state.chars.map((char) => char.flying),
          places: state.chars.map((char) => char.area),
          menuCursor: state.menu === null ? null : state.menu.cursor,
          gatesDone: done,
          nextGate: nextGate(state.gatesDone, state.today),
          locked: lockedGates(state),
          inGate: visitRef.current?.number ?? null,
          canUse: spotInReach(state) !== null,
          entry: entryAt(state),
          achieved: [...state.achieved],
          progress: ACHIEVEMENTS.map((def) => progressOf(state, def.id)),
        };
        const key = JSON.stringify(next);
        if (key !== hudKeyRef.current) {
          hudKeyRef.current = key;
          setHud(next);
        }
      };

      raf = window.requestAnimationFrame(frame);
      const leave = () => {
        if (stateRef.current !== null) {
          writeSave(toSave(stateRef.current));
        }
        flush();
      };
      window.addEventListener("pagehide", leave);
      return () => {
        window.cancelAnimationFrame(raf);
        window.removeEventListener("pagehide", leave);
        leave();
      };
    }
  }, [controls, sound]);

  return {
    canvasRef,
    hud,
    dispatch,
    setTouch,
    enter,
    quitGate,
    layout,
    reset,
  };
}

/**
 * Tells whether the screen is played by finger, and which way the phone is
 * held.
 *
 * @returns the layout to show
 * @remarks
 * A coarse pointer means a finger from the start; the first touch anywhere
 * switches to the touch layout as well, since some phones and tablets report
 * a fine pointer. A mouse press goes back, unless the main pointer is coarse.
 */
function useLayout(): Layout {
  const [touch, setTouch] = useState(false);
  const [landscape, setLandscape] = useState(false);
  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)");
    const measure = () => {
      setLandscape(window.innerWidth > window.innerHeight);
    };
    const seen = (event: PointerEvent) => {
      if (event.pointerType === "touch") {
        setTouch(true);
      } else if (event.pointerType === "mouse" && !coarse.matches) {
        setTouch(false);
      }
    };
    const touched = () => {
      setTouch(true);
    };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only capability check
    setTouch(coarse.matches);
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("pointerdown", seen, true);
    window.addEventListener("touchstart", touched, {
      capture: true,
      passive: true,
    });
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("pointerdown", seen, true);
      window.removeEventListener("touchstart", touched, true);
    };
  }, []);
  let layout: Layout = "desktop";
  if (touch) {
    layout = landscape ? "landscape" : "portrait";
  }
  return layout;
}

/**
 * Sizes the canvas and picks how much of the map it shows.
 *
 * @param canvas - the visible canvas
 * @param fullscreen - whether the game fills the screen
 * @param layout - for keyboard and mouse, or for a finger (upright or on its
 *   side), which decides the room left round the canvas
 * @param inGate - whether a minigame is open: upright on a phone the canvas
 *   then takes the field's shape, so nothing is wasted above and below it
 * @param map - the map, so the view is never larger than it
 * @returns canvas pixels per logical pixel
 * @remarks
 * The scale is a whole number **of device pixels**, and an even one where
 * possible, since the art has two pixels to each logical pixel: then every
 * art pixel is the same square. Instead of shrinking the picture to a scale
 * that fits, the view grows or shrinks a little: the largest even scale that
 * still shows {@link MIN_VIEW_W} x {@link MIN_VIEW_H} wins, and the view fills
 * the room at that scale - with keyboard and mouse all of it, the last map
 * pixel cut at the edge; on a phone up to {@link MAX_VIEW_W} x
 * {@link MAX_VIEW_H}. Only
 * touched when the size really changes, because setting a canvas's size
 * clears it. On a phone with at least two device pixels per CSS pixel an odd
 * scale is fine too: the art pixels are too small to look uneven.
 */
function fitScale(
  canvas: HTMLCanvasElement,
  fullscreen: boolean,
  layout: Layout,
  inGate: boolean,
  map: GameMap,
): number {
  const dots = window.devicePixelRatio > 0 ? window.devicePixelRatio : 1;
  const holder = canvas.closest("[data-wm-frame]");
  const room =
    layout === "desktop"
      ? deskRoom(holder, fullscreen, canvas)
      : touchRoom(holder, layout, inGate);
  const wide = room.w * dots;
  const high = room.h * dots;
  const most = Math.max(
    1,
    Math.floor(Math.min(wide / MIN_VIEW_W, high / MIN_VIEW_H)),
  );
  // On a sharp phone screen an odd scale shows no uneven art pixels, and the
  // even one below would waste a third of the width.
  const evenOnly = layout === "desktop" || dots < SHEET_DENSITY;
  const scale =
    most >= SHEET_DENSITY && evenOnly ? most - (most % SHEET_DENSITY) : most;
  const size = mapSize(map);
  // With keyboard and mouse the canvas fills the room exactly, whatever the
  // window's shape: the view is cut at the edge, half a map pixel if need be.
  const desk = layout === "desktop";
  const width = desk
    ? Math.floor(Math.min(size.w * scale, wide))
    : Math.floor(Math.min(MAX_VIEW_W, size.w, wide / scale)) * scale;
  const height = desk
    ? Math.floor(Math.min(size.h * scale, high))
    : Math.floor(Math.min(MAX_VIEW_H, size.h, high / scale)) * scale;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${String(width / dots)}px`;
    canvas.style.height = `${String(height / dots)}px`;
  }
  return scale;
}

/**
 * The room for the canvas with keyboard and mouse: the frame's width, and the
 * window's height less what sits above the canvas on the page and what sits
 * under it in the frame (calendar, character bar) - so the picture, the
 * calendar and the bar fit in the window together.
 */
function deskRoom(
  holder: Element | null,
  fullscreen: boolean,
  canvas: HTMLCanvasElement,
): { readonly w: number; readonly h: number } {
  const frame = holder?.getBoundingClientRect() ?? null;
  const box = canvas.getBoundingClientRect();
  const above = fullscreen ? 0 : box.top + window.scrollY;
  const below = frame === null ? BAR_HEIGHT : frame.bottom - box.bottom;
  return {
    w: (holder?.clientWidth ?? VIEW_W) - FRAME_PADDING,
    h: Math.max(MIN_VIEW_H, window.innerHeight - above - below - PAGE_MARGIN),
  };
}

/**
 * The room for the canvas on a phone: the frame less the controls beside the
 * picture (`data-wm-side`), and one screen's height less what sits under it
 * (`data-wm-below`) - so picture, controls and bar fit on the screen at once.
 */
function touchRoom(
  holder: Element | null,
  layout: Layout,
  inGate: boolean,
): { readonly w: number; readonly h: number } {
  const sum = (selector: string, side: "offsetWidth" | "offsetHeight") =>
    [...(holder?.querySelectorAll<HTMLElement>(selector) ?? [])].reduce(
      (total, element) => total + element[side],
      0,
    );
  const beside =
    layout === "landscape" ? sum("[data-wm-side]", "offsetWidth") : 0;
  const w = (holder?.clientWidth ?? VIEW_W) - TOUCH_FRAME_PADDING - beside;
  const h = Math.max(
    MIN_VIEW_H,
    window.innerHeight -
      TOUCH_FRAME_PADDING -
      sum("[data-wm-below]", "offsetHeight"),
  );
  return {
    w,
    h: inGate && layout === "portrait" ? Math.min(h, (w * MINI_H) / MINI_W) : h,
  };
}

/** "?datum=12-05": month and day to try the December locks with. */
const TRIED_DAY = /^(\d{1,2})-(\d{1,2})$/;

/**
 * A day given in the address to try the Advent locks, e.g. "?datum=12-05".
 *
 * @param search - the address's query string
 * @returns the day, or null when none (or nonsense) is given
 */
function triedDay(search: string): CalendarDay | null {
  const match = TRIED_DAY.exec(new URLSearchParams(search).get("datum") ?? "");
  const month = Number(match?.[1] ?? 0);
  const day = Number(match?.[2] ?? 0);
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- months and days of a month
  const valid = month >= 1 && month <= 12 && day >= 1 && day <= 31;
  return valid ? { month, day } : null;
}

/**
 * The gates shut for today.
 *
 * @param state - the game
 * @returns their numbers, lowest first
 */
function lockedGates(state: GameState): number[] {
  return Array.from({ length: GATE_COUNT }, (_, i) => i + 1).filter((number) =>
    gateLocked(state, number),
  );
}

/**
 * What survives "Neu aufstellen": the gates won and the achievements, with
 * everybody back at their start places.
 *
 * @param save - the game as it stands
 * @returns a save holding only what is kept
 */
function keptOf(save: SaveData): SaveData {
  return {
    active: FIRST_CHARACTER,
    chars: [],
    gates: save.gates,
    achievements: save.achievements,
    progress: save.progress,
    counts: save.counts,
  };
}
