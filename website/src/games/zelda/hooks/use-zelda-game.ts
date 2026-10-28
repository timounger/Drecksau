/**
 * Runs the adventure: the fixed-rate game loop, the canvas, the controls, the
 * sounds, saving, and the statistics.
 *
 * @module
 * @remarks
 * The world is simulated in fixed steps of a sixtieth of a second, however
 * fast the screen refreshes, so a 144 Hz monitor does not make Link run
 * faster and a slow phone does not make the monsters lazy. Drawing happens
 * once per animation frame into a buffer of 240 x 160 logical pixels - one,
 * two or three buffer pixels to each, depending on how fine the art is - which
 * is then blown up by a whole number onto the visible canvas: the only way to
 * keep every pixel the same size while the picture scrolls.
 */
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  createSoundPlayer,
  type SoundPlayer,
} from "@/games/zelda/audio/sounds";
import {
  GAME_KEYS,
  PAUSE_KEY,
  applyKeys,
  clearKeys,
  createKeyQueue,
  createPointerState,
  createTouchControls,
  mouseCode,
  queueKey,
  readInput,
  type TouchState,
} from "@/games/zelda/components/input";
import {
  SCREEN_H,
  SCREEN_W,
  drawFrame,
  drawTexts,
} from "@/games/zelda/components/render";
import {
  artReady,
  loadArt,
  type Art,
  type Density,
} from "@/games/zelda/components/sprites";
import { revive, snapCamera, step } from "@/games/zelda/engine/engine";
import type {
  EnemyKind,
  GameState,
  ScreenPoint,
  StepReport,
} from "@/games/zelda/engine/types";
import { NO_INPUT } from "@/games/zelda/engine/types";
import { createGame, toSave } from "@/games/zelda/engine/world";
import { ZELDA_TEXTS } from "@/games/zelda/i18n/texts";
import {
  clearSave,
  loadMuted,
  loadPixelGraphics,
  loadSave,
  loadSlot,
  recordAdventure,
  saveMuted,
  savePixelGraphics,
  writeSave,
  writeSlot,
} from "@/games/zelda/stats/adventure-store";
import type { GameId } from "@/games/registry";
import {
  recordGameFinished,
  recordGameStarted,
  recordPlayTime,
} from "@/lib/stats/stats-recorder";
import { invalidateStats } from "@/lib/stats/stats-store";

/** Which game the statistics are filed under. */
const GAME_ID: GameId = "zelda";

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

/** How often play time and adventure numbers are written, in seconds. */
const FLUSH_EVERY = 10;

/** Room left for the page around the canvas when not fullscreen, CSS px. */
const PAGE_CHROME = 230;

/** Padding of the dark frame round the canvas, both sides together, CSS px. */
const FRAME_PADDING = 24;

/** Height of the touch buttons under the canvas on a phone, CSS px. */
const TOUCH_PAD_HEIGHT = 190;

/** Odd scales the finer art steps down to, to share a factor with it. */
const FINE_SCALE: Readonly<Record<number, number>> = { 5: 4, 7: 6 };

/** `MouseEvent.button` of the right mouse button. */
const RIGHT_BUTTON = 2;

/** Events that are worth saving the game for at once. */
const SAVE_NOW = new Set([
  "container",
  "secret",
  "victory",
  "item",
  "chest",
  "door",
  "switch",
  "buy",
]);

/** What the screen around the canvas needs to know. */
export type ZeldaScreen =
  "title" | "playing" | "paused" | "confirm" | "gameover";

/** What the in-game confirm dialog asks about. */
export type ZeldaQuestion = "newGame" | "load";

/** What the hook hands the component. */
export type ZeldaGame = {
  readonly canvasRef: RefObject<HTMLCanvasElement | null>;
  readonly frameRef: RefObject<HTMLDivElement | null>;
  /** Updates what the on-screen buttons hold. */
  readonly setTouch: (patch: Partial<TouchState>) => void;
  readonly screen: ZeldaScreen;
  /** What the confirm dialog asks, while the screen is "confirm". */
  readonly question: ZeldaQuestion | null;
  /** Answers the confirm dialog with yes. */
  readonly confirm: () => void;
  /** Answers the confirm dialog with no and goes back. */
  readonly cancel: () => void;
  readonly hasSave: boolean;
  /** When the game was last saved by hand, ms since 1970 - or null. */
  readonly slotAt: number | null;
  readonly muted: boolean;
  /** Starts playing - the saved game if there is one. */
  readonly start: () => void;
  /** Throws the save away and starts from the village with three hearts. */
  readonly newGame: () => void;
  /** After a game over: wake up in the village with what you had. */
  readonly continueGame: () => void;
  /** Leaves the pause menu and plays on. */
  readonly resumeGame: () => void;
  /** Saves the running game by hand, beside the autosave. */
  readonly saveGame: () => void;
  /** Goes back to the game saved by hand. */
  readonly loadGame: () => void;
  readonly toggleMute: () => void;
  /** Whether the plain pixel art is shown instead of the finer art. */
  readonly pixel: boolean;
  /** Switches between the finer art and the plain pixels. */
  readonly toggleGraphics: () => void;
  /** Whether the cheat is on: no damage, everything full, faster. */
  readonly cheat: boolean;
  readonly toggleCheat: () => void;
};

/** Counts gathered between two writes to the statistics. */
type Pending = {
  kills: EnemyKind[];
  rupees: number;
  deaths: number;
  cuts: number;
  playMs: number;
};

/**
 * Sets up and runs the game.
 *
 * @param fullscreen - whether the game fills the screen, for sizing
 * @returns refs, the screen phase and the actions
 */
export function useZeldaGame(fullscreen: boolean): ZeldaGame {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const screenRef = useRef<ZeldaScreen>("title");
  const soundsRef = useRef<SoundPlayer | null>(null);
  const runRef = useRef({ finished: false, began: 0 });
  const pendingRef = useRef<Pending>({
    kills: [],
    rupees: 0,
    deaths: 0,
    cuts: 0,
    playMs: 0,
  });
  const fullscreenRef = useRef(fullscreen);
  const [touchControls] = useState(createTouchControls);
  const [pointer] = useState(createPointerState);
  const [screen, setScreen] = useState<ZeldaScreen>("title");
  const [hasSave, setHasSave] = useState(false);
  const [question, setQuestion] = useState<ZeldaQuestion | null>(null);
  /** The codes of the keys and mouse buttons held, as the steps see them. */
  const keysRef = useRef(new Set<string>());
  /** Presses and releases not yet handed to a step - none gets lost. */
  const queueRef = useRef(createKeyQueue());
  /** The screen the confirm dialog goes back to on no. */
  const backRef = useRef<ZeldaScreen>("title");
  const [slotAt, setSlotAt] = useState<number | null>(null);
  const [muted, setMuted] = useState(false);
  const [cheat, setCheat] = useState(false);
  /** The cheat for the loop, which is set up once. */
  const cheatRef = useRef(false);
  const [pixel, setPixel] = useState(false);
  /** The graphics switch for the loop. */
  const pixelRef = useRef(false);

  useEffect(() => {
    fullscreenRef.current = fullscreen;
  }, [fullscreen]);

  const show = useCallback((next: ZeldaScreen) => {
    screenRef.current = next;
    setScreen(next);
  }, []);

  // Read what this browser remembers once, after hydration.
  useEffect(() => {
    const save = loadSave();
    const quiet = loadMuted();
    pixelRef.current = loadPixelGraphics();
    stateRef.current = createGame(save);
    snapCamera(stateRef.current);
    soundsRef.current = createSoundPlayer(quiet);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- storage is only readable after hydration
    setHasSave(save !== null);
    setSlotAt(loadSlot()?.at ?? null);
    setMuted(quiet);
    setPixel(pixelRef.current);
  }, []);

  const flush = useCallback(() => {
    const pending = pendingRef.current;
    if (pending.playMs > 0) {
      recordPlayTime(GAME_ID, pending.playMs, Date.now());
      invalidateStats();
    }
    if (
      pending.kills.length > 0 ||
      pending.rupees > 0 ||
      pending.deaths > 0 ||
      pending.cuts > 0
    ) {
      recordAdventure(pending);
    }
    pendingRef.current = {
      kills: [],
      rupees: 0,
      deaths: 0,
      cuts: 0,
      playMs: 0,
    };
  }, []);

  const beginRun = useCallback(() => {
    runRef.current = { finished: false, began: Date.now() };
    recordGameStarted(GAME_ID, Date.now());
    invalidateStats();
  }, []);

  const start = useCallback(() => {
    soundsRef.current?.resume();
    stateRef.current ??= createGame(loadSave());
    snapCamera(stateRef.current);
    beginRun();
    show("playing");
  }, [beginRun, show]);

  /** Opens the confirm dialog; the game stands still behind it. */
  const ask = useCallback(
    (about: ZeldaQuestion) => {
      const state = stateRef.current;
      if (screenRef.current === "playing" && state !== null) {
        writeSave(toSave(state));
      }
      if (screenRef.current !== "confirm") {
        backRef.current = screenRef.current;
      }
      clearKeys(queueRef.current, keysRef.current);
      setQuestion(about);
      show("confirm");
    },
    [show],
  );

  const startNew = useCallback(() => {
    flush();
    clearSave();
    stateRef.current = createGame(null);
    snapCamera(stateRef.current);
    writeSave(toSave(stateRef.current));
    setHasSave(true);
    soundsRef.current?.resume();
    beginRun();
    show("playing");
  }, [beginRun, flush, show]);

  const newGame = useCallback(() => {
    if (hasSave || screenRef.current !== "title") {
      ask("newGame");
    } else {
      startNew();
    }
  }, [ask, hasSave, startNew]);

  const continueGame = useCallback(() => {
    const state = stateRef.current;
    if (state !== null) {
      soundsRef.current?.resume();
      revive(state);
      writeSave(toSave(state));
      beginRun();
      show("playing");
    }
  }, [beginRun, show]);

  const resumeGame = useCallback(() => {
    soundsRef.current?.resume();
    show("playing");
  }, [show]);

  const saveGame = useCallback(() => {
    const state = stateRef.current;
    if (state !== null) {
      const at = Date.now();
      writeSlot({ at, save: toSave(state) });
      setSlotAt(at);
    }
  }, []);

  const loadSlotNow = useCallback(() => {
    const slot = loadSlot();
    const fresh = backRef.current === "title";
    if (slot !== null) {
      flush();
      stateRef.current = createGame(slot.save);
      snapCamera(stateRef.current);
      writeSave(toSave(stateRef.current));
      setHasSave(true);
      soundsRef.current?.resume();
      if (fresh) {
        beginRun();
      }
      show("playing");
    }
  }, [beginRun, flush, show]);

  const loadGame = useCallback(() => {
    if (screenRef.current === "title") {
      backRef.current = "title";
      loadSlotNow();
    } else {
      ask("load");
    }
  }, [ask, loadSlotNow]);

  const confirm = useCallback(() => {
    setQuestion(null);
    if (question === "newGame") {
      startNew();
    } else if (question === "load") {
      loadSlotNow();
    }
  }, [loadSlotNow, question, startNew]);

  const cancel = useCallback(() => {
    setQuestion(null);
    show(backRef.current);
  }, [show]);

  // Esc answers no; the key handler is set up once, so it reads this ref.
  const cancelRef = useRef(cancel);
  useEffect(() => {
    cancelRef.current = cancel;
  }, [cancel]);

  const toggleCheat = useCallback(() => {
    cheatRef.current = !cheatRef.current;
    setCheat(cheatRef.current);
  }, []);

  const toggleGraphics = useCallback(() => {
    pixelRef.current = !pixelRef.current;
    savePixelGraphics(pixelRef.current);
    setPixel(pixelRef.current);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((was) => {
      const next = !was;
      saveMuted(next);
      soundsRef.current?.setMuted(next);
      if (!next) {
        soundsRef.current?.resume();
      }
      return next;
    });
  }, []);

  // Keyboard and mouse: remember what is held; keep the page from scrolling
  // on game keys. Esc pauses and opens the save menu, and closes it again.
  // While the inventory is open, a click is handed over with its place on
  // the picture instead of counting as A or B.
  useEffect(() => {
    const keys = keysRef.current;
    const queue = queueRef.current;
    const hold = (code: string) => {
      queueKey(queue, code, true);
    };
    const letGo = (code: string) => {
      queueKey(queue, code, false);
    };
    const canvas = canvasRef.current;
    const down = (event: KeyboardEvent) => {
      const typing =
        event.target instanceof HTMLElement &&
        ["INPUT", "TEXTAREA"].includes(event.target.tagName);
      const dialogOpen = document.querySelector("dialog[open]") !== null;
      const free = !typing && !dialogOpen;
      const openMenu = stateRef.current?.menu ?? null;
      if (event.code === PAUSE_KEY && free && !event.repeat) {
        if (screenRef.current === "playing" && openMenu !== null) {
          // Esc closes the inventory first, like I does.
          event.preventDefault();
          const state = stateRef.current;
          if (state !== null) {
            state.menu = null;
          }
          soundsRef.current?.play("menu");
        } else if (screenRef.current === "playing") {
          event.preventDefault();
          clearKeys(queue, keys);
          const state = stateRef.current;
          if (state !== null) {
            writeSave(toSave(state));
          }
          show("paused");
        } else if (screenRef.current === "paused") {
          event.preventDefault();
          show("playing");
        } else if (screenRef.current === "confirm") {
          event.preventDefault();
          cancelRef.current();
        }
      } else if (
        screenRef.current === "playing" &&
        GAME_KEYS.has(event.code) &&
        free
      ) {
        event.preventDefault();
        hold(event.code);
      }
    };
    const up = (event: KeyboardEvent) => {
      letGo(event.code);
    };
    const press = (event: MouseEvent) => {
      if (screenRef.current === "playing" && canvas !== null) {
        event.preventDefault();
        const menuOpen = (stateRef.current?.menu ?? null) !== null;
        if (!menuOpen) {
          hold(mouseCode(event.button));
        } else if (event.button === 0 || event.button === RIGHT_BUTTON) {
          pointer.clicks.push({
            ...screenPoint(canvas, event),
            button: event.button === RIGHT_BUTTON ? "b" : "a",
          });
        }
      }
    };
    const move = (event: MouseEvent) => {
      if (canvas !== null) {
        pointer.hover = screenPoint(canvas, event);
      }
    };
    const leave = () => {
      pointer.hover = null;
    };
    const release = (event: MouseEvent) => {
      letGo(mouseCode(event.button));
    };
    const noMenu = (event: MouseEvent) => {
      event.preventDefault();
    };
    const clear = () => {
      clearKeys(queue, keys);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("mouseup", release);
    window.addEventListener("blur", clear);
    canvas?.addEventListener("mousedown", press);
    canvas?.addEventListener("mousemove", move);
    canvas?.addEventListener("mouseleave", leave);
    canvas?.addEventListener("contextmenu", noMenu);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("mouseup", release);
      window.removeEventListener("blur", clear);
      canvas?.removeEventListener("mousedown", press);
      canvas?.removeEventListener("mousemove", move);
      canvas?.removeEventListener("mouseleave", leave);
      canvas?.removeEventListener("contextmenu", noMenu);
    };
  }, [pointer, show]);

  // The loop.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d") ?? null;
    const buffer = document.createElement("canvas");
    const bctx = buffer.getContext("2d");
    let cleanup = () => {};
    if (canvas !== null && ctx !== null && bctx !== null) {
      cleanup = runLoop(canvas, ctx, buffer, bctx);
    }
    return cleanup;

    function runLoop(
      canvas: HTMLCanvasElement,
      ctx: CanvasRenderingContext2D,
      buffer: HTMLCanvasElement,
      bctx: CanvasRenderingContext2D,
    ): () => void {
      // The plain art always loads - it stands in while finer art arrives.
      const arts = new Map<Density, Art>([[1, loadArt(1)]]);
      const artFor = (density: Density): Art => {
        let art = arts.get(density);
        if (art === undefined) {
          art = loadArt(density);
          arts.set(density, art);
        }
        return art;
      };
      let raf = 0;
      let last = performance.now();
      let acc = 0;
      let sinceSave = 0;
      let sinceFlush = 0;

      const handle = (state: GameState, report: StepReport) => {
        for (const event of report.events) {
          soundsRef.current?.play(event);
        }
        const pending = pendingRef.current;
        pending.kills.push(...report.kills);
        pending.rupees += report.rupees;
        pending.cuts += report.cuts;
        if (report.events.includes("save")) {
          // The inventory's save button: the same slot as the pause menu's.
          const at = Date.now();
          writeSlot({ at, save: toSave(state) });
          setSlotAt(at);
        }
        if (report.events.includes("victory") && !runRef.current.finished) {
          runRef.current.finished = true;
          recordGameFinished(GAME_ID, {
            won: true,
            durationMs: Date.now() - runRef.current.began,
            finishedAt: Date.now(),
          });
          invalidateStats();
        }
        if (report.events.includes("die")) {
          pending.deaths += 1;
          if (!runRef.current.finished) {
            runRef.current.finished = true;
            recordGameFinished(GAME_ID, {
              won: false,
              durationMs: Date.now() - runRef.current.began,
              finishedAt: Date.now(),
            });
          }
          flush();
          writeSave(toSave(state));
          show("gameover");
        } else if (report.events.some((event) => SAVE_NOW.has(event))) {
          writeSave(toSave(state));
        }
      };

      const frame = (now: number) => {
        const state = stateRef.current;
        const elapsed = Math.min((now - last) / MS, STEP * MAX_STEPS);
        last = now;
        if (state !== null) {
          // Every frame, so a new or loaded game keeps the switch.
          state.cheat = cheatRef.current;
          if (screenRef.current === "playing" && !document.hidden) {
            acc += elapsed;
            let steps = 0;
            while (acc >= STEP && steps < MAX_STEPS) {
              applyKeys(queueRef.current, keysRef.current);
              const input = readInput(
                keysRef.current,
                touchControls.current(),
                pointer,
              );
              handle(state, step(state, input, STEP, ZELDA_TEXTS.victory));
              acc -= STEP;
              steps += 1;
            }
            pendingRef.current.playMs += elapsed * MS;
            sinceSave += elapsed;
            sinceFlush += elapsed;
            if (sinceSave > SAVE_EVERY && state.phase === "playing") {
              sinceSave = 0;
              writeSave(toSave(state));
            }
            if (sinceFlush > FLUSH_EVERY) {
              sinceFlush = 0;
              flush();
            }
          } else {
            acc = 0;
            state.prev = NO_INPUT;
            pointer.clicks.length = 0;
          }
          const fine = !pixelRef.current;
          const scale = fitScale(canvas, fullscreenRef.current, fine);
          const wanted = artFor(fine ? densityFor(scale) : 1);
          const art = artReady(wanted) ? wanted : artFor(1);
          if (artReady(art)) {
            const k = art.density;
            if (buffer.width !== SCREEN_W * k) {
              buffer.width = SCREEN_W * k;
              buffer.height = SCREEN_H * k;
            }
            bctx.setTransform(k, 0, 0, k, 0, 0);
            bctx.imageSmoothingEnabled = false;
            drawFrame(bctx, state, art, now / MS);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(buffer, 0, 0, SCREEN_W * scale, SCREEN_H * scale);
            drawTexts(ctx, state, scale);
          }
        }
        raf = window.requestAnimationFrame(frame);
      };
      raf = window.requestAnimationFrame(frame);

      const leave = () => {
        if (stateRef.current !== null && screenRef.current === "playing") {
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
  }, [flush, pointer, show, touchControls]);

  return {
    canvasRef,
    frameRef,
    setTouch: touchControls.set,
    screen,
    question,
    confirm,
    cancel,
    hasSave,
    slotAt,
    muted,
    start,
    newGame,
    continueGame,
    resumeGame,
    saveGame,
    loadGame,
    toggleMute,
    pixel,
    toggleGraphics,
    cheat,
    toggleCheat,
  };
}

/**
 * How fine the art should be for a canvas scale: as fine as divides the
 * scale, so the buffer is blown up by a whole number.
 *
 * @param scale - canvas pixels per logical pixel
 * @returns the art density
 */
function densityFor(scale: number): Density {
  let density: Density = 1;
  /* eslint-disable @typescript-eslint/no-magic-numbers -- the art densities
     themselves, tried finest first */
  if (scale % 3 === 0) {
    density = 3;
  } else if (scale % 2 === 0) {
    density = 2;
  }
  /* eslint-enable @typescript-eslint/no-magic-numbers */
  return density;
}

/**
 * Where a mouse event lies on the 240 x 160 picture.
 *
 * @param canvas - the visible canvas
 * @param event - the mouse event
 * @returns the point in screen pixels
 * @remarks
 * The canvas is the picture blown up by a whole number, so its box on the
 * page maps straight onto the picture.
 */
function screenPoint(
  canvas: HTMLCanvasElement,
  event: MouseEvent,
): ScreenPoint {
  const box = canvas.getBoundingClientRect();
  const width = box.width > 0 ? box.width : SCREEN_W;
  const height = box.height > 0 ? box.height : SCREEN_H;
  return {
    x: ((event.clientX - box.left) / width) * SCREEN_W,
    y: ((event.clientY - box.top) / height) * SCREEN_H,
  };
}

/**
 * Sizes the canvas to the largest whole multiple of 240 x 160 that fits.
 *
 * @param canvas - the visible canvas
 * @param fullscreen - whether the game fills the screen
 * @param fine - the finer art is shown: odd scales above 3 step down to one
 *   it divides
 * @returns canvas pixels per logical pixel
 * @remarks
 * Whole multiples **of device pixels**, so on a phone with three device
 * pixels per CSS pixel the picture may be 4 x (320 CSS px wide) rather than
 * a blurry 4.6. Only touched when the size really changes, because setting a
 * canvas's size clears it.
 */
function fitScale(
  canvas: HTMLCanvasElement,
  fullscreen: boolean,
  fine: boolean,
): number {
  const dots = window.devicePixelRatio > 0 ? window.devicePixelRatio : 1;
  const holder = canvas.closest("[data-zelda-frame]");
  const touchPad = window.matchMedia("(pointer: coarse)").matches
    ? TOUCH_PAD_HEIGHT
    : 0;
  const wide = (holder?.clientWidth ?? SCREEN_W) - FRAME_PADDING;
  const high = fullscreen
    ? window.innerHeight - touchPad
    : Math.max(SCREEN_H, window.innerHeight - PAGE_CHROME - touchPad);
  const most = Math.max(
    1,
    Math.floor(Math.min((wide * dots) / SCREEN_W, (high * dots) / SCREEN_H)),
  );
  const scale = fine ? (FINE_SCALE[most] ?? most) : most;
  const width = SCREEN_W * scale;
  const height = SCREEN_H * scale;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width / dots}px`;
    canvas.style.height = `${height / dots}px`;
  }
  return scale;
}
