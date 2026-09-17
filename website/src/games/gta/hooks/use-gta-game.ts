/**
 * Drives GTA from React: the animation loop, the keys and the canvas.
 *
 * @module
 * @remarks
 * The city lives in a ref and is advanced once per animation frame, so the
 * tight loop never waits on React. Only a small heads-up snapshot is mirrored
 * into React state, and only when it actually changes - otherwise the HUD would
 * re-render sixty times a second for a money counter that did not move.
 */
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import { draw } from "@/games/gta/components/render";
import { actionAt } from "@/games/gta/components/gta-actions";
import { drawBank } from "@/games/gta/components/bank-render";
import { drawMint } from "@/games/gta/components/mint-render";
import { drawPrison } from "@/games/gta/components/prison-render";
import {
  createTouchControls,
  drawTouchControls,
  type TouchControls,
} from "@/games/gta/components/touch-controls";
import {
  VIEW_HEIGHT,
  VIEW_WIDTH,
  DEPTH,
  worldAt,
} from "@/games/gta/components/projection";
import { DEFAULT_ZOOM } from "@/games/gta/settings/app-settings";
import {
  getSettingsSnapshot,
  subscribeSettings,
} from "@/games/gta/settings/settings-store";
import {
  breakOut,
  counterAt,
  crewHere,
  hirePrice,
  hireable,
  respawn,
  step,
  type Counter,
} from "@/games/gta/engine/engine";
import { leftInBank } from "@/games/gta/engine/bank";
import {
  gateName,
  lit,
  manned,
  taskLine as worksTask,
} from "@/games/gta/engine/mint";
import { taskLine } from "@/games/gta/engine/prison";
import { DISTRICTS, createGame } from "@/games/gta/engine/setup";
import {
  autoSave,
  dropSave,
  listSaves,
  loadSave,
  readAuto,
  saveAs,
  type SaveSlot,
} from "@/games/gta/storage/saves";
import { DISTRICT_NAMES } from "@/games/gta/i18n/texts";
import {
  CITY_SEED,
  IDLE_INPUT,
  JOBS_PER_DISTRICT,
  type GameState,
  type Input,
  type Order,
  type Phase,
  type Vec,
} from "@/games/gta/engine/types";
import { carried, type WeaponKind } from "@/games/gta/engine/weapons";
import type { GameId } from "@/games/registry";
import {
  recordGameFinished,
  recordGameStarted,
  recordPlayTime,
} from "@/lib/stats/stats-recorder";
import { invalidateStats } from "@/lib/stats/stats-store";

/** This game's id for the statistics. */
const GAME_ID: GameId = "gta";

/** How often the game writes itself to disk while it runs, in milliseconds. */
const KEEP_EVERY_MS = 6000;

/** Longest slice of real time one frame may stand for, in seconds. */
const MAX_FRAME = 0.05;

/** How often the play time is booked, in milliseconds. */
const PLAY_TICK_MS = 5000;

/** Milliseconds in a second, for turning frame times into game seconds. */
const MS_PER_SECOND = 1000;

/**
 * How far the thumb stick has to be pushed for a direction to count.
 *
 * @remarks
 * The engine takes four keys, not an axis, so somewhere the one has to become
 * the other. A third of the way out: less than that and a thumb resting on the
 * stick walks, more and a phone feels slow to turn.
 */
const STICK_GATE = 0.34;

/** What the screen needs to know about the city. */
export type Heads = {
  readonly phase: Phase;
  readonly money: number;
  readonly respect: number;
  readonly stars: number;
  readonly health: number;
  readonly inCar: boolean;
  readonly jobText: string;
  readonly jobLeft: number | null;
  readonly owned: number;
  /** One line per quarter of town: what it is called and how it stands. */
  readonly quarters: readonly Quarter[];
  readonly log: readonly string[];
  /** How the escape stands, or null whenever the city is being played. */
  readonly escape: Escape | null;
  /** Which counter the player is standing at, or null for none. */
  readonly counter: Counter;
  /** How many men the player has taken on. */
  readonly crew: number;
  /** How many of them are standing with him. */
  readonly crewHere: number;
  /** Whoever is standing near enough to be taken on, or null. */
  readonly hire: Hire | null;
  /** How the job in the printing works stands, or null out in the city. */
  readonly works: Works | null;
  /** What is in the player's hand. */
  readonly weapon: WeaponKind;
  /** Whether that weapon has anything in it. */
  readonly armed: boolean;
  /** How many rounds of each weapon the belt holds. */
  readonly ammo: readonly number[];
  /** What is in the bag from a robbery and not yet safe. */
  readonly loot: number;
  /** How the hold-up stands, or null while nobody is inside a bank. */
  readonly raid: Robbery | null;
};

/** What the screen shows while a bank is being held up. */
export type Robbery = {
  /** What is in the bag. */
  readonly taken: number;
  /** Whether the silent alarm has gone. */
  readonly alarm: boolean;
  /** Seconds until the police walk in. */
  readonly left: number;
  /** How many of the clerks still have their hands down. */
  readonly loose: number;
};

/** Somebody on a corner who would come along. */
export type Hire = {
  /** What he wants for the day, in euros - nothing, for your own. */
  readonly price: number;
  /** Whether he is one of yours. */
  readonly own: boolean;
};

/** What the screen shows while the printing works is being held. */
export type Works = {
  /** What the presses have run off so far. */
  readonly printed: number;
  /** How far the tunnel has got, from zero to one. */
  readonly tunnel: number;
  /** How many machines are running. */
  readonly presses: number;
  /** How many of the people in there have been taken. */
  readonly hostages: number;
  /** The three ways in, worst first. */
  readonly gates: readonly GateHead[];
  /** What to do next, in one line. */
  readonly task: string;
  /** Whether the lights - and the presses - are off. */
  readonly dark: boolean;
  /** Whether the mains have already been cut once. */
  readonly cut: boolean;
};

/** One of the three ways in, as the panel shows it. */
export type GateHead = {
  /** What it is called, in German. */
  readonly name: string;
  /** What is piled against it, from zero to one. */
  readonly barricade: number;
  /** How far they have got through it, from zero to one. */
  readonly push: number;
  /** Whether a squad is on it this moment. */
  readonly busy: boolean;
};

/** What the screen shows while the player is inside the jail. */
export type Escape = {
  /** What to do next, in one line. */
  readonly task: string;
  /** How often a warder has taken the player back to the cell. */
  readonly caught: number;
  /** How many prisoners are coming along. */
  readonly mates: number;
};

/** How one district stands, for the bar under the city. */
export type Quarter = {
  readonly name: string;
  readonly done: number;
  readonly needed: number;
  readonly owned: boolean;
};

/** What the game screen gets from the hook. */
export type GtaSession = {
  readonly heads: Heads;
  /** Hand the canvas over as soon as it exists. */
  readonly attach: (canvas: HTMLCanvasElement | null) => void;
  /** Where the mouse is over the canvas. */
  readonly onPointer: (event: PointerEvent<HTMLCanvasElement>) => void;
  /** The mouse button, down and up. */
  readonly onFire: (down: boolean) => void;
  /** The right button, once per press: one charge on the ground. */
  readonly onPlant: () => void;
  /** And the same button held down, which is the tank's machine gun. */
  readonly onSpray: (down: boolean) => void;

  /** Whether the other cheat is on: no damage, and one of everything. */
  readonly god: boolean;
  /** Switches that one. */
  readonly toggleGod: () => void;

  /** Start over. */
  readonly restart: () => void;
  /** Back on the street after hospital or the cells. */
  readonly carryOn: () => void;
  /** The other way out of the cells: through the wall. */
  readonly escape: () => void;
  /** The named games on disk, newest first. */
  readonly saves: readonly SaveSlot[];
  /** Writes the game as it stands under a name. */
  readonly save: (name: string) => void;
  /** Picks one of them up again. */
  readonly load: (at: number) => void;
  /** And throws one away. */
  readonly forget: (at: number) => void;
  /** What the player pressed at a counter - bought, refilled, robbed, ran. */
  readonly order: (order: Order) => void;
  /**
   * A press on the picture: a button if it hit one, the trigger otherwise.
   *
   * @returns true when a button took it, so the caller leaves the gun alone
   */
  readonly onPress: (event: PointerEvent<HTMLCanvasElement>) => boolean;
};

/**
 * The city the prerender shows, before the browser deals a real one.
 *
 * @remarks
 * Built once at module level rather than during a render: the page is
 * prerendered, so the first frame has to be the same on the server and in the
 * browser, and reading it out of a ref while rendering is exactly what React
 * asks nobody to do.
 */
const START = createGame(CITY_SEED);

/** What the heads-up display shows before the first frame. */
const START_HEADS = headsOf(START);

/**
 * How many real pixels the canvas may use per view pixel.
 *
 * @remarks
 * Two is the sharp-display case and where the eye stops thanking you. Beyond
 * that a phone with a very fine screen would be asked to paint four times the
 * area for a difference nobody sees.
 */
const SHARPEST = 2;

/** How many frames apart the canvas is measured against its box. */
const FIT_EVERY = 20;

/**
 * Gives the canvas as many real pixels as its box and the display allow.
 *
 * @param box - the canvas on screen
 * @remarks
 * The canvas is laid out by CSS - full width, fixed shape - and that says
 * nothing about how many pixels it holds. Without this it holds
 * {@link VIEW_WIDTH} of them however large it is drawn, and a picture stretched
 * over a wider box is a soft picture. Here it gets one buffer pixel per real
 * screen pixel, and the renderer scales into it.
 */
function fitCanvas(box: HTMLCanvasElement): void {
  const rect = box.getBoundingClientRect();
  const dense = Math.min(SHARPEST, window.devicePixelRatio || 1);
  const wide = Math.max(VIEW_WIDTH, Math.round(rect.width * dense));
  const high = Math.round((wide * VIEW_HEIGHT) / VIEW_WIDTH);
  if (box.width !== wide || box.height !== high) {
    box.width = wide;
    box.height = high;
  }
}

/** Which key does what. */
const KEYS: Readonly<Record<string, keyof Input>> = {
  KeyW: "up",
  ArrowUp: "up",
  KeyS: "down",
  ArrowDown: "down",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  Enter: "use",
  KeyE: "use",
  // The jetpack has no trigger and nothing to select: holding the space bar is
  // the whole of it.
  Space: "lift",
};

/**
 * Runs one game of GTA.
 *
 * @returns the heads-up numbers and the handles the screen needs
 */
export function useGtaGame(): GtaSession {
  const world = useRef<GameState>(START);
  const [saves, setSaves] = useState<readonly SaveSlot[]>([]);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const keys = useRef<Input>(IDLE_INPUT);
  const useEdge = useRef(false);
  // Where the mouse points, in canvas pixels, and whether the button is down.
  // Kept in refs for the same reason the keys are: the loop reads them sixty
  // times a second and must not wait on a render to see them.
  const pointer = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const firing = useRef(false);
  // A click can go down and up between two pictures. The held flag alone would
  // lose it, so the press is also remembered until one frame has spent it.
  const fireEdge = useRef(false);
  // The thumbs, on a phone. Made when the canvas first turns up and taken down
  // with the loop; on a keyboard it stays idle and draws nothing.
  const touch = useRef<TouchControls | null>(null);
  const touched = useRef<HTMLCanvasElement | null>(null);
  // The right button is an edge, not a state: one press, one charge on the
  // ground - see layCharge in the engine.
  const plantEdge = useRef(false);
  // And held, for the gun on the tank.
  const spraying = useRef(false);
  // What was pressed in the panel at a counter, spent by the next frame.
  const pending = useRef<Order | null>(null);
  // Shift, held. There is no button for it any more: a key one holds is not a
  // mode one switches on, and the page had two cheat buttons where one would
  // do.
  const held = useRef(false);
  // The other cheat, and the wheel. The wheel is counted up between frames and
  // spent by the loop, so a flick of it is never lost between two pictures.
  const godOn = useRef(false);
  const [god, setGod] = useState(false);
  const wheel = useRef(0);
  // How close the camera stands, kept in a ref and fed by the settings store:
  // the loop reads it every frame, so moving the slider on the settings page
  // shows up in the next picture rather than the next game.
  const zoom = useRef(DEFAULT_ZOOM);
  // Whether the day runs at all - read from the settings the same way the zoom
  // is, so switching it on shows up in the next frame.
  const daylight = useRef(false);
  const [heads, setHeads] = useState<Heads>(START_HEADS);
  const started = useRef(false);
  const counted = useRef(false);

  /** One notch of the wheel, one weapon - and the page stays where it is. */
  const onWheel = useCallback((event: globalThis.WheelEvent): void => {
    event.preventDefault();
    wheel.current += event.deltaY > 0 ? 1 : -1;
  }, []);

  const attach = useCallback(
    (element: HTMLCanvasElement | null) => {
      const before = canvas.current;
      if (before !== null) {
        before.removeEventListener("wheel", onWheel);
      }
      canvas.current = element;
      if (element !== null) {
        fitCanvas(element);
        // Listened for by hand, and not passively: React attaches its own wheel
        // handler passively, and a passive handler is not allowed to stop the
        // page scrolling. Turning the wheel to change weapon while the page
        // slides out from under the game is not a trade worth making.
        element.addEventListener("wheel", onWheel, { passive: false });
      }
    },
    [onWheel],
  );

  /** Hands Shift to the loop. */
  const applyRun = useCallback(() => {
    keys.current = { ...keys.current, boost: held.current };
  }, []);

  /** The other button: nothing hurts, and the belt is full. */
  const toggleGod = useCallback(() => {
    godOn.current = !godOn.current;
    setGod(godOn.current);
  }, []);

  /** The wheel over the canvas: one notch, one weapon. */
  /** Follows the mouse over the canvas, in view pixels. */
  const onPointer = useCallback((event: PointerEvent<HTMLCanvasElement>) => {
    // A finger is handled by the touch controller, which knows about sticks
    // and buttons. Letting the pointer events through as well would mean every
    // tap on the stick also swung the fist.
    if (event.pointerType === "touch") {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    pointer.current = {
      x: ((event.clientX - rect.left) / rect.width) * VIEW_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * VIEW_HEIGHT,
    };
  }, []);

  /** The trigger. */
  const onFire = useCallback((down: boolean) => {
    firing.current = down;
    fireEdge.current = fireEdge.current || down;
  }, []);

  /** The other button: put one down. */
  const onPlant = useCallback(() => {
    plantEdge.current = true;
  }, []);

  /**
   * And the same button held: the machine gun on the tank.
   *
   * @remarks
   * Both readings of one button, and they do not fight: the edge lays a charge
   * on foot, where the held flag does nothing, and the held flag works the gun
   * from the driver's seat, where the edge does nothing. Which of the two the
   * press means is decided by whether one is sitting in a tank.
   */
  const onSpray = useCallback((down: boolean) => {
    spraying.current = down;
  }, []);

  /** Something pressed at a counter: it rides along with the next frame. */
  const order = useCallback((asked: Order) => {
    pending.current = asked;
  }, []);

  /**
   * A press on the picture.
   *
   * @remarks
   * The buttons are drawn into the picture, so they have to be taken out of it
   * again before the press reaches the weapon. Whoever presses "Pistole 600 €"
   * is buying a pistol, not swinging at the shopkeeper.
   */
  const pressAt = useCallback((at: Vec): boolean => {
    const hit = actionAt(world.current, VIEW_WIDTH, VIEW_HEIGHT, at);
    if (hit !== null) {
      pending.current = hit;
    }
    return hit !== null;
  }, []);

  /** The same, for a mouse: the event carries the place. */
  const onPress = useCallback(
    (event: PointerEvent<HTMLCanvasElement>): boolean => {
      const rect = event.currentTarget.getBoundingClientRect();
      return pressAt({
        x: ((event.clientX - rect.left) / rect.width) * VIEW_WIDTH,
        y: ((event.clientY - rect.top) / rect.height) * VIEW_HEIGHT,
      });
    },
    [pressAt],
  );

  /** Writes the game under a name, and shows the new list. */
  const save = useCallback((name: string) => {
    setSaves(saveAs(name, world.current));
  }, []);

  /** Reads one back and carries on from it. */
  const load = useCallback((at: number) => {
    const game = loadSave(at);
    if (game !== null) {
      world.current = game;
      setHeads(headsOf(game));
      autoSave(game);
    }
  }, []);

  /** Throws one away. */
  const forget = useCallback((at: number) => {
    setSaves(dropSave(at));
  }, []);

  const restart = useCallback(() => {
    world.current = createGame(CITY_SEED);
    counted.current = false;
    setHeads(headsOf(world.current));
    recordGameStarted(GAME_ID, Date.now());
    invalidateStats();
  }, []);

  const carryOn = useCallback(() => {
    world.current = respawn(world.current);
    setHeads(headsOf(world.current));
  }, []);

  const escape = useCallback(() => {
    world.current = breakOut(world.current);
    setHeads(headsOf(world.current));
  }, []);

  // The keys. Held down means held down, so the arrow keys are taken off the
  // page: a car game that scrolls the page while you steer is not a car game.
  useEffect(() => {
    // Shift is read off every key event rather than kept as a key of its own:
    // the browser tells us with each one whether it is down, and that also
    // catches the case where it was let go while the window was elsewhere.
    const onDown = (event: KeyboardEvent) => {
      const key = KEYS[event.code];
      held.current = event.shiftKey;
      applyRun();
      if (key !== undefined) {
        event.preventDefault();
        if (key === "use" && !keys.current.use) {
          useEdge.current = true;
        }
        keys.current = { ...keys.current, [key]: true };
      }
    };
    const onUp = (event: KeyboardEvent) => {
      const key = KEYS[event.code];
      held.current = event.shiftKey;
      applyRun();
      if (key !== undefined) {
        keys.current = { ...keys.current, [key]: false };
      }
    };
    // Alt-tabbing away with Shift held would otherwise leave the run on.
    const onBlur = () => {
      held.current = false;
      applyRun();
    };
    const onResize = () => {
      const box = canvas.current;
      if (box !== null) {
        fitCanvas(box);
      }
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("resize", onResize);
    };
  }, [applyRun]);

  // The camera setting, now and whenever it changes - here and in other tabs.
  useEffect(() => {
    const read = () => {
      const settings = getSettingsSnapshot();
      zoom.current = settings.zoom;
      daylight.current = settings.dayNight;
    };
    read();
    return subscribeSettings(read);
  }, []);

  // The loop itself.
  useEffect(() => {
    if (!started.current) {
      started.current = true;
      world.current = createGame(CITY_SEED);
      recordGameStarted(GAME_ID, Date.now());
      invalidateStats();
    }
    let frame = 0;
    let frames = 0;
    let last = performance.now();
    let played = last;
    let kept = played;
    let first = true;
    const tick = (now: number) => {
      if (first) {
        first = false;
        // Whatever was last played, picked up here rather than during the
        // render: the page is prerendered and the server has no disk to read.
        const saved = readAuto();
        if (saved !== null) {
          world.current = saved;
        }
        setSaves(listSaves());
      }
      const dt = Math.min(MAX_FRAME, (now - last) / MS_PER_SECOND);
      last = now;
      frames += 1;
      // Getting in and out is one press, not a held key: the edge is caught in
      // the handler and spent here, or a single tap would swap seats every
      // frame the key is down.
      // The mouse is a point in the picture; the engine wants a point in the
      // city. The picture is tilted, so that is the projection run backwards -
      // the same one the renderer uses, or the shot would miss the crosshair.
      const box = canvas.current;
      // The thumbs live on the canvas, so they are made as soon as there is
      // one - and made again if React ever hands us a different one.
      if (box !== null && touched.current !== box) {
        touch.current?.dispose();
        touch.current = createTouchControls(box, pressAt);
        touched.current = box;
      }
      const finger = touch.current?.sample() ?? null;
      const looking = finger?.aim ?? null;
      const point =
        finger !== null && finger.engaged && looking !== null
          ? looking
          : pointer.current;
      const aim = worldAt(
        world.current.player,
        VIEW_WIDTH,
        VIEW_HEIGHT,
        point.x,
        point.y,
        zoom.current,
      );
      const push = finger?.move ?? { x: 0, y: 0 };
      // The stick, turned from the screen into the city. Only the depth of the
      // view is undone: the picture squashes north and south, so a thumb
      // pushed straight down wants a heading that is more southerly than the
      // same push read flat - otherwise the car goes where the thumb points on
      // the **screen** rather than where it points on the **map**.
      const reach = Math.hypot(push.x, push.y);
      const steer =
        reach > STICK_GATE ? { x: push.x, y: push.y / DEPTH } : null;
      const input: Input = {
        ...keys.current,
        steer,
        up: keys.current.up || push.y < -STICK_GATE,
        down: keys.current.down || push.y > STICK_GATE,
        left: keys.current.left || push.x < -STICK_GATE,
        right: keys.current.right || push.x > STICK_GATE,
        use: useEdge.current || (touch.current?.consumeUse() ?? false),
        plant: plantEdge.current || (touch.current?.consumePlant() ?? false),
        spray: spraying.current || (touch.current?.sprayHeld() ?? false),
        aim,
        fire:
          firing.current ||
          fireEdge.current ||
          (finger?.firing ?? false) ||
          (touch.current?.consumeTap() ?? false),
        wheel: wheel.current + (touch.current?.consumeWheel() ?? 0),
        god: godOn.current,
        order: pending.current,
      };
      pending.current = null;
      useEdge.current = false;
      plantEdge.current = false;
      fireEdge.current = false;
      wheel.current = 0;
      world.current = step(world.current, input, dt);
      const ctx = box?.getContext("2d") ?? null;
      if (box !== null && ctx !== null) {
        // The box can change size without the window firing anything at us -
        // a sidebar opening, the page zooming, the first layout after mount.
        // A few times a second is often enough to catch that.
        if (frames % FIT_EVERY === 0) {
          fitCanvas(box);
        }
        // Everything is drawn in view pixels; this one line turns those into
        // however many real pixels the display has to offer.
        const sharpness = box.width / VIEW_WIDTH;
        ctx.setTransform(sharpness, 0, 0, sharpness, 0, 0);
        // Two worlds, two pictures. The jail shares the projection and the
        // figures with the city and nothing else - see ./prison-render.
        if (world.current.phase === "prison") {
          drawPrison(ctx, world.current, VIEW_WIDTH, VIEW_HEIGHT, zoom.current);
        } else if (world.current.phase === "mint") {
          drawMint(ctx, world.current, VIEW_WIDTH, VIEW_HEIGHT, zoom.current);
        } else if (world.current.phase === "bank") {
          drawBank(ctx, world.current, VIEW_WIDTH, VIEW_HEIGHT, zoom.current);
        } else {
          draw(
            ctx,
            world.current,
            VIEW_WIDTH,
            VIEW_HEIGHT,
            zoom.current,
            daylight.current,
          );
        }
        if (finger !== null) {
          drawTouchControls(ctx, finger);
        }
      }
      const next = headsOf(world.current);
      setHeads((current) => (same(current, next) ? current : next));
      if (now - kept > KEEP_EVERY_MS) {
        // The city keeps itself: closing the tab is not losing the afternoon.
        autoSave(world.current);
        kept = now;
      }
      if (now - played > PLAY_TICK_MS) {
        recordPlayTime(GAME_ID, now - played, Date.now());
        invalidateStats();
        played = now;
      }
      if (world.current.phase === "won" && !counted.current) {
        counted.current = true;
        recordGameFinished(GAME_ID, {
          won: true,
          durationMs: world.current.time * MS_PER_SECOND,
          finishedAt: Date.now(),
        });
        invalidateStats();
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      autoSave(world.current);
      cancelAnimationFrame(frame);
      touch.current?.dispose();
      touch.current = null;
      touched.current = null;
    };
    // pressAt never changes - it is a callback with no dependencies - but the
    // loop uses it to build the touch controls, so it is listed rather than
    // silenced.
  }, [pressAt]);

  return {
    heads,
    attach,
    onPointer,
    onFire,
    onPlant,
    onSpray,
    god,
    toggleGod,
    restart,
    carryOn,
    escape,
    order,
    onPress,
    saves,
    save,
    load,
    forget,
  };
}

/** The numbers the screen shows, pulled out of the city. */
function headsOf(state: GameState): Heads {
  const job = state.job;
  const owned = Object.values(state.districts).filter(
    (district) => district.owned,
  ).length;
  return {
    phase: state.phase,
    money: state.player.money,
    respect: state.player.respect,
    stars: state.player.stars,
    health: Math.round(state.player.health),
    inCar: state.player.car !== null,
    jobText: job === null ? "" : jobLine(job.kind, job.loaded, job.pay),
    jobLeft:
      job?.until === null || job === null
        ? null
        : Math.max(0, Math.round(job.until - state.time)),
    owned,
    quarters: DISTRICTS.map((district) => ({
      name: DISTRICT_NAMES[district] ?? district,
      done: Math.min(JOBS_PER_DISTRICT, state.districts[district].done),
      needed: JOBS_PER_DISTRICT,
      owned: state.districts[district].owned,
    })),
    log: state.log,
    counter: counterAt(state),
    crew: state.crew.length,
    crewHere: crewHere(state),
    hire: hireOf(state),
    works:
      state.mint === null
        ? null
        : {
            printed: Math.round(state.mint.printed),
            tunnel: state.mint.tunnel,
            presses: manned(state.mint),
            hostages: state.mint.staff.filter((one) => one.taken).length,
            gates: state.mint.gates.map((gate) => ({
              name: gateName(gate.kind),
              barricade: gate.barricade,
              push: gate.push,
              busy: gate.busy,
            })),
            task: worksTask(state.mint),
            dark: !lit(state.mint),
            cut: state.mint.cut,
          },
    weapon: state.player.weapon,
    armed: carried(state.player.ammo, state.player.weapon),
    ammo: state.player.ammo,
    loot: state.player.loot,
    raid:
      state.bank === null
        ? null
        : {
            taken: Math.round(state.bank.taken),
            alarm: state.bank.alarm,
            left: Math.ceil(leftInBank(state.bank)),
            loose: state.bank.staff.filter((one) => !one.held).length,
          },
    escape:
      state.prison === null
        ? null
        : {
            task: taskLine(state.prison),
            caught: state.prison.caught,
            mates: state.prison.mates.length,
          },
  };
}

/** Whoever is within reach to be taken on, and what he wants. */
function hireOf(state: GameState): Hire | null {
  const man = hireable(state);
  return man === null
    ? null
    : { price: hirePrice(man), own: man.kind === "mine" };
}

/**
 * Whether two pictures of the printing works would look the same.
 *
 * @param a - one of them
 * @param b - the other
 * @returns true when nothing the panel shows has moved
 * @remarks
 * Rounded, because everything in there is a rate: the printed pile grows by a
 * hundred and fifty a second and the doors by hundredths, and a panel that were
 * rebuilt on every frame would be a panel nobody could read.
 */
function sameWorks(a: Works | null, b: Works | null): boolean {
  return (
    a?.printed === b?.printed &&
    steps(a?.tunnel, TUNNEL_STEPS) === steps(b?.tunnel, TUNNEL_STEPS) &&
    a?.presses === b?.presses &&
    a?.hostages === b?.hostages &&
    a?.task === b?.task &&
    a?.dark === b?.dark &&
    a?.cut === b?.cut &&
    (a?.gates ?? []).every(
      (gate, at) =>
        gate.busy === b?.gates[at]?.busy &&
        steps(gate.push, GATE_STEPS) ===
          steps(b?.gates[at]?.push, GATE_STEPS) &&
        steps(gate.barricade, GATE_STEPS) ===
          steps(b?.gates[at]?.barricade, GATE_STEPS),
    )
  );
}

/** A share of one, in however many steps the panel shows it. */
function steps(share: number | undefined, over: number): number {
  return Math.round((share ?? 0) * over);
}

/** How finely the tunnel bar is read: whole per cent. */
const TUNNEL_STEPS = 100;

/** And the doors, which are short bars and need less. */
const GATE_STEPS = 50;

/** What the job bar says. */
function jobLine(
  kind: GameState["job"] extends null ? never : string,
  loaded: boolean,
  pay: number,
): string {
  const words: Readonly<Record<string, [string, string]>> = {
    courier: ["Paket abholen", "Paket abliefern"],
    taxi: ["Fahrgast abholen", "Fahrgast absetzen"],
    steal: ["Wagen abholen", "Wagen abliefern"],
  };
  const pair = words[kind] ?? ["Auftrag", "Auftrag"];
  return `${loaded ? pair[1] : pair[0]} - ${pay} €`;
}

/** Whether two heads-up snapshots say the same thing. */
function same(a: Heads, b: Heads): boolean {
  return (
    a.phase === b.phase &&
    a.money === b.money &&
    a.respect === b.respect &&
    a.stars === b.stars &&
    a.health === b.health &&
    a.inCar === b.inCar &&
    a.jobText === b.jobText &&
    a.jobLeft === b.jobLeft &&
    a.owned === b.owned &&
    a.quarters.every(
      (quarter, at) =>
        quarter.done === b.quarters[at]?.done &&
        quarter.owned === b.quarters[at]?.owned,
    ) &&
    a.counter === b.counter &&
    a.crew === b.crew &&
    a.crewHere === b.crewHere &&
    a.hire?.price === b.hire?.price &&
    a.hire?.own === b.hire?.own &&
    sameWorks(a.works, b.works) &&
    a.weapon === b.weapon &&
    a.armed === b.armed &&
    a.loot === b.loot &&
    a.ammo === b.ammo &&
    a.raid?.taken === b.raid?.taken &&
    a.raid?.alarm === b.raid?.alarm &&
    a.raid?.left === b.raid?.left &&
    a.raid?.loose === b.raid?.loose &&
    a.escape?.task === b.escape?.task &&
    a.escape?.caught === b.escape?.caught &&
    a.escape?.mates === b.escape?.mates &&
    a.log === b.log
  );
}
