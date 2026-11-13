/**
 * The game loop and everything around it: the fixed-step simulation, the
 * 3D view (loaded on demand), commands, tools and selection, shortcuts,
 * control groups, orders to units, sound, the menu, saving and loading,
 * autosave and the statistics.
 *
 * @module
 * @remarks
 * The game itself is a mutable object in a ref that the loop steps; React
 * only learns of it a few times a second through a tick counter, so the
 * panels stay cheap while the view draws at full rate.
 */
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { BUILDING, BUILDINGS } from "@/games/imperavis/engine/buildings-data";
import { setCheat } from "@/games/imperavis/engine/cheat";
import { refreshDerived } from "@/games/imperavis/engine/derived";
import { applyCommand } from "@/games/imperavis/engine/commands";
import {
  createGame,
  DEFAULT_SETTINGS,
  stepGame,
  TICK,
} from "@/games/imperavis/engine/game";
import { ignite } from "@/games/imperavis/engine/incidents";
import { HUMAN, islandsOf } from "@/games/imperavis/engine/players";
import { createShip } from "@/games/imperavis/engine/ships";
import { RESEARCH } from "@/games/imperavis/engine/research-data";
import { GOOD_IDS } from "@/games/imperavis/engine/goods";
import {
  checkPlacement,
  QUARTER_TURNS,
} from "@/games/imperavis/engine/placement";
import { planRoad } from "@/games/imperavis/engine/roads";
import { startTutorial } from "@/games/imperavis/engine/tutorial";
import { fromSave, toSave } from "@/games/imperavis/engine/save";
import type {
  BuildingKind,
  Command,
  Game,
  GameEvent,
  GameSettings,
  MapSize,
  PlayerCommand,
  ShipKind,
} from "@/games/imperavis/engine/types";
import {
  createSoundPlayer,
  type SoundPlayer,
} from "@/games/imperavis/audio/sounds";
import {
  ANSWER_TEXTS,
  REFUSAL_TEXTS,
  TEXTS as T,
} from "@/games/imperavis/i18n/texts";
import { HUD } from "@/games/imperavis/i18n/hud-texts";
import { tutorialLockText } from "@/games/imperavis/i18n/tutorial-texts";
import type { InputAction } from "@/games/imperavis/render/input";
import type {
  Hint,
  Hit,
  OrderTarget,
  Pick,
  Tool,
  View,
  ViewOptions,
} from "@/games/imperavis/render/view";
import {
  autosaveSetting,
  edgeScrollSetting,
  mutedSetting,
  shadowsSetting,
  CHEAT_SPEEDS,
  NORMAL_TOP,
  speedSetting,
  SPEEDS,
  weatherSetting,
} from "@/games/imperavis/settings/preferences";
import { describe, emptyWatch, keep, watch, type Watch } from "./news";
import {
  alive,
  boxPick,
  centreOf,
  clickPick,
  nextUnit,
  pickOf,
  planOrders,
  unitsOf,
  type Units,
} from "./orders";
import { addImperavisStats } from "@/games/imperavis/stats/imperavis-stats";
import {
  loadAutosave,
  loadSlot,
  SLOTS,
  unreadableSaves,
  writeAutosave,
  writeSlot,
  type SavedGame,
} from "@/games/imperavis/storage/save-store";
import type { GameId } from "@/games/registry";
import { recordGameStarted, recordPlayTime } from "@/lib/stats/stats-recorder";
import { invalidateStats } from "@/lib/stats/stats-store";

/** The game's id for storage and statistics. */
const GAME_ID: GameId = "imperavis";

/** Milliseconds between two updates of the panels. */
const UI_EVERY = 250;

/** Milliseconds between two automatic saves. */
const AUTOSAVE_EVERY = 120000;

/** Milliseconds between two writes of play time and numbers. */
const STATS_EVERY = 60000;

/** Most simulation steps per frame, so a slow frame cannot snowball. */
const MAX_STEPS = 24;

/** Longest frame counted for the simulation, in seconds. */
const MAX_FRAME = 0.1;

/**
 * Longest frame counted for the view, in seconds: the camera keeps its
 * speed per second even when frames come slowly.
 */
const MAX_VIEW_FRAME = 0.5;

/** Milliseconds a message stays, by its weight; alerts stay until confirmed. */
const MESSAGE_MS: Readonly<Record<MessageLevel, number>> = {
  info: 6000,
  warning: 10000,
  alert: Number.POSITIVE_INFINITY,
};

/** Most passing messages shown at once (alerts come on top). */
const MESSAGES = 4;

/** Most alerts kept at once; older ones go when more come. */
const ALERTS = 4;

/** Milliseconds of simulation one frame may spend at the cheat speeds. */
const STEP_BUDGET_MS = 12;

/** Milliseconds in a second. */
const MS = 1000;

/** Seeds are drawn below this. */
const SEED_RANGE = 1000000;

/** Battle noise above which a shot is heard. */
const NEAR_BATTLE = 0.3;

/** Gold and goods the test flag "rich" adds. */
const RICH_GOLD = 50000;
const RICH_GOODS = 150;

/** Milliseconds the mouse rests on a thing of the map before its tooltip. */
const TIP_DELAY = 450;

/** Milliseconds a map tooltip outlives a short slip off its thing. */
const TIP_GRACE = 220;

/** Milliseconds within which a second press of a group key looks at it. */
const DOUBLE_PRESS = 400;

/** How much a message matters: alerts stay until they are confirmed. */
export type MessageLevel = "info" | "warning" | "alert";

/** A message in the corner. */
export type Message = {
  readonly id: number;
  readonly text: string;
  readonly at: number;
  readonly level: MessageLevel;
  /** Where it happened, in tiles, to look at it; or null. */
  readonly where: { readonly x: number; readonly y: number } | null;
};

/** What a message says, before it gets its number and time. */
export type News = {
  readonly text: string;
  readonly level: MessageLevel;
  readonly where: Message["where"];
};

/** Where the screen is. */
export type Phase = "menu" | "loading" | "playing" | "error";

/** What the screen around the map does for the keys. */
export type ScreenKeys = {
  /** Closes the open window (build window, administration, world map). */
  readonly closeWindow: () => boolean;
  /** Opens or closes the build menu at its last category. */
  readonly toggleBuildMenu: () => void;
};

/** A thing of the map under a resting mouse, at client pixels. */
export type HoverTip = {
  readonly hit: Hit;
  readonly x: number;
  readonly y: number;
};

/** Everything the screen needs. */
export type ImperavisApi = {
  readonly phase: Phase;
  readonly game: Game | null;
  /** Grows a few times a second; panels re-render on it. */
  readonly tick: number;
  readonly canvasRef: RefObject<HTMLCanvasElement | null>;
  readonly speed: number;
  /** The speeds offered right now (the cheat adds faster ones). */
  readonly speeds: readonly number[];
  readonly tool: Tool;
  readonly selection: Pick;
  readonly hint: Hint | null;
  readonly messages: readonly Message[];
  readonly menuOpen: boolean;
  /** The thing of the map whose tooltip shows, or null. */
  readonly hoverTip: HoverTip | null;
  readonly fps: number;
  readonly hasAutosave: boolean;
  readonly slots: readonly (SavedGame | null)[];
  /** Stored games this version cannot load (autosave is slot 0). */
  readonly unreadable: readonly number[];
  /** Whether the cheat mode is on (in the menu: for the next new game). */
  readonly cheat: boolean;
  /** Switches the cheat mode. */
  toggleCheat(): void;
  newGame(seed: number, size: MapSize, settings: GameSettings): void;
  continueGame(): void;
  loadFrom(slot: number): void;
  saveTo(slot: number): void;
  toMenu(): void;
  setMenuOpen(open: boolean): void;
  setSpeed(speed: number): void;
  setTool(tool: Tool): void;
  select(pick: Pick): void;
  command(command: Command): boolean;
  focus(x: number, y: number): void;
  /** Takes a message away (confirms an alert). */
  dismiss(id: number): void;
  /** What the camera sees on the water, for the minimap; empty without view. */
  viewArea(): readonly { readonly x: number; readonly y: number }[];
  /**
   * Lets the screen take part in the keys (Esc and B).
   *
   * @param keys - what the screen does, or null when it goes
   */
  bindScreen(keys: ScreenKeys | null): void;
  /** The control groups (screen state, not saved), by number key. */
  groups(): ReadonlyMap<number, Units>;
};

/** Test shortcuts from the address bar, `?imp=autostart,found,rich,seed=7,size=small`. */
type Flags = {
  debug: boolean;
  autostart: boolean;
  found: boolean;
  rich: boolean;
  /** Forces the guided start, also with `found` and `rich`. */
  tutorial: boolean;
  scholar: boolean;
  peace: boolean;
  ai: number | null;
  seed: number | null;
  size: MapSize | null;
};

/**
 * Runs IMPERAVIS.
 *
 * @returns the state and actions of the screen
 */
export function useImperavis(): ImperavisApi {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<Game | null>(null);
  const viewRef = useRef<View | null>(null);
  const soundRef = useRef<SoundPlayer | null>(null);
  const speedRef = useRef(1);
  const startedRef = useRef(0);
  const countedRef = useRef({ built: 0, founded: 0, shipsBuilt: 0, traded: 0 });
  const playRef = useRef(0);
  const flagsRef = useRef<Flags>({
    debug: false,
    autostart: false,
    found: false,
    rich: false,
    tutorial: false,
    scholar: false,
    peace: false,
    ai: null,
    seed: null,
    size: null,
  });
  const [phase, setPhase] = useState<Phase>("menu");
  const [game, setGame] = useState<Game | null>(null);
  const [tick, setTick] = useState(0);
  const [speed, setSpeedState] = useState(1);
  const [tool, setToolState] = useState<Tool>({ type: "select" });
  const [selection, setSelection] = useState<Pick>({ type: "none" });
  const [hint, setHint] = useState<Hint | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [menuOpen, setMenuOpenState] = useState(false);
  const [hoverTip, setHoverTip] = useState<HoverTip | null>(null);
  const [fps, setFps] = useState(0);
  const [hasAutosave, setHasAutosave] = useState(false);
  const [slots, setSlots] = useState<(SavedGame | null)[]>([]);
  const [unreadable, setUnreadable] = useState<number[]>([]);
  const [cheat, setCheatState] = useState(false);
  const cheatRef = useRef(false);
  const toolRef = useRef<Tool>(tool);
  const selectionRef = useRef<Pick>({ type: "none" });
  const menuRef = useRef(false);
  const screenRef = useRef<ScreenKeys | null>(null);
  const actionRef = useRef<(action: InputAction) => void>(() => undefined);
  const groupsRef = useRef(new Map<number, Units>());
  const lastGroupRef = useRef({ slot: 0, at: 0 });
  const lastSpeedRef = useRef(1);
  const tipRef = useRef<{ shown: HoverTip | null; timer: number }>({
    shown: null,
    timer: 0,
  });
  const messageId = useRef(0);
  const watchRef = useRef<Watch>(emptyWatch());

  const tell = useCallback((news: News) => {
    messageId.current += 1;
    const message: Message = { ...news, id: messageId.current, at: Date.now() };
    // The same news twice in a row is one message.
    setMessages((list) =>
      list.some((item) => item.text === news.text)
        ? list
        : keep(list, message, MESSAGES, ALERTS),
    );
  }, []);

  const say = useCallback(
    (text: string) => tell({ text, level: "info", where: null }),
    [tell],
  );

  const dismiss = useCallback((id: number) => {
    setMessages((list) => list.filter((message) => message.id !== id));
  }, []);

  const refreshSaves = useCallback(() => {
    setHasAutosave(loadAutosave() !== null);
    setSlots(Array.from({ length: SLOTS }, (_, index) => loadSlot(index + 1)));
    setUnreadable(unreadableSaves());
  }, []);

  const snapshot = useCallback((): SavedGame | null => {
    const game = gameRef.current;
    return game === null
      ? null
      : {
          savedAt: Date.now(),
          startedAt: startedRef.current,
          game: toSave(game),
        };
  }, []);

  const flushStats = useCallback(() => {
    const game = gameRef.current;
    if (game !== null) {
      if (playRef.current > 0) {
        recordPlayTime(GAME_ID, playRef.current, Date.now());
        playRef.current = 0;
      }
      const counted = countedRef.current;
      const stats = game.players[HUMAN].stats;
      const delta = {
        built: Math.max(0, stats.built - counted.built),
        founded: Math.max(0, stats.founded - counted.founded),
        shipsBuilt: Math.max(0, stats.shipsBuilt - counted.shipsBuilt),
        traded: Math.max(0, stats.traded - counted.traded),
      };
      // A game with the cheat ever on counts its play time, not its records.
      if (!game.cheated) {
        addImperavisStats(delta, {
          peakPopulation: stats.peakPopulation,
          peakTier: stats.peakTier,
        });
      }
      countedRef.current = {
        built: stats.built,
        founded: stats.founded,
        shipsBuilt: stats.shipsBuilt,
        traded: stats.traded,
      };
      invalidateStats();
    }
  }, []);

  const writeAuto = useCallback(() => {
    const saved = snapshot();
    if (saved !== null && autosaveSetting.load()) {
      writeAutosave(saved);
    }
  }, [snapshot]);

  /** Takes a game on: counts it, and shows it. */
  const adopt = useCallback((next: Game, startedAt: number) => {
    gameRef.current = next;
    setGame(next);
    cheatRef.current = next.cheat;
    setCheatState(next.cheat);
    startedRef.current = startedAt;
    const stats = next.players[HUMAN].stats;
    countedRef.current = {
      built: stats.built,
      founded: stats.founded,
      shipsBuilt: stats.shipsBuilt,
      traded: stats.traded,
    };
    const initial = speedSetting.load();
    speedRef.current = initial;
    setSpeedState(initial);
    setToolState({ type: "select" });
    toolRef.current = { type: "select" };
    setSelection({ type: "none" });
    selectionRef.current = { type: "none" };
    groupsRef.current = new Map();
    menuRef.current = false;
    setMenuOpenState(false);
    setMessages([]);
    watchRef.current = emptyWatch();
    setPhase("loading");
  }, []);

  const newGame = useCallback(
    (seed: number, size: MapSize, settings: GameSettings) => {
      soundRef.current?.resume();
      const game = createGame(seed, size, settings);
      applyFlags(game, flagsRef.current);
      if (cheatRef.current) {
        setCheat(game, true);
      }
      recordGameStarted(GAME_ID, Date.now());
      adopt(game, Date.now());
      // The hint only helps while there is no kontor yet; the guided start
      // says the same in its task window.
      if (islandsOf(game, HUMAN).length === 0 && !game.tutorial.active) {
        say(T.startHint);
      }
      invalidateStats();
    },
    [adopt, say],
  );

  const restore = useCallback(
    (saved: SavedGame | null) => {
      if (saved !== null) {
        soundRef.current?.resume();
        adopt(fromSave(saved.game), saved.startedAt);
        say(T.loaded);
      }
    },
    [adopt, say],
  );

  const continueGame = useCallback(() => restore(loadAutosave()), [restore]);
  const loadFrom = useCallback(
    (slot: number) => restore(loadSlot(slot)),
    [restore],
  );

  const saveTo = useCallback(
    (slot: number) => {
      const saved = snapshot();
      if (saved !== null && writeSlot(slot, saved)) {
        say(T.saved);
        refreshSaves();
      }
    },
    [refreshSaves, say, snapshot],
  );

  const toMenu = useCallback(() => {
    writeAuto();
    flushStats();
    viewRef.current?.dispose();
    viewRef.current = null;
    gameRef.current = null;
    setGame(null);
    refreshSaves();
    menuRef.current = false;
    setMenuOpenState(false);
    setPhase("menu");
  }, [flushStats, refreshSaves, writeAuto]);

  const toggleCheat = useCallback(() => {
    const game = gameRef.current;
    const next = !cheatRef.current;
    if (game !== null) {
      setCheat(game, next);
      setTick((value) => value + 1);
    }
    cheatRef.current = next;
    setCheatState(next);
    // The cheat's speeds end with it.
    if (!next && speedRef.current > NORMAL_TOP) {
      speedRef.current = NORMAL_TOP;
      setSpeedState(NORMAL_TOP);
    }
  }, []);

  const setSpeed = useCallback((value: number) => {
    if (value > 0) {
      lastSpeedRef.current = value;
    }
    speedRef.current = value;
    setSpeedState(value);
  }, []);

  const setTool = useCallback((next: Tool) => {
    toolRef.current = next;
    setToolState(next);
    viewRef.current?.setTool(next);
    if (next.type === "select") {
      setHint(null);
    }
  }, []);

  const select = useCallback((pick: Pick) => {
    selectionRef.current = pick;
    setSelection(pick);
    viewRef.current?.setSelection(pick);
  }, []);

  /** The map tooltip: shown after a rest, kept over a short slip. */
  const hoverAt = useCallback((hit: Hit, x: number, y: number) => {
    const tip = tipRef.current;
    window.clearTimeout(tip.timer);
    const same =
      tip.shown !== null &&
      JSON.stringify(tip.shown.hit) === JSON.stringify(hit);
    if (hit.type === "none") {
      tip.timer = window.setTimeout(() => {
        tip.shown = null;
        setHoverTip(null);
      }, TIP_GRACE);
    } else if (!same) {
      tip.shown = null;
      setHoverTip(null);
      tip.timer = window.setTimeout(() => {
        tip.shown = { hit, x, y };
        setHoverTip(tip.shown);
      }, TIP_DELAY);
    }
  }, []);

  const hideTip = useCallback(() => {
    window.clearTimeout(tipRef.current.timer);
    tipRef.current.shown = null;
    setHoverTip(null);
  }, []);

  const command = useCallback(
    (next: Command) => {
      const game = gameRef.current;
      let ok = false;
      if (game !== null) {
        const result = settle(
          game,
          applyCommand(game, { ...next, player: HUMAN }),
        );
        ok = result.ok;
        if (!result.ok) {
          say(
            next.type === "build" && result.reason === "tutorial"
              ? tutorialLockText(next.kind)
              : refusalText(result.reason),
          );
          soundRef.current?.cue("denied");
        }
        setTick((value) => value + 1);
      }
      return ok;
    },
    [say],
  );

  const focus = useCallback(
    (x: number, y: number) => viewRef.current?.focus(x, y),
    [],
  );

  const viewArea = useCallback(() => viewRef.current?.viewArea() ?? [], []);

  const groups = useCallback(
    (): ReadonlyMap<number, Units> => groupsRef.current,
    [],
  );

  const setMenuOpen = useCallback((open: boolean) => {
    menuRef.current = open;
    setMenuOpenState(open);
    viewRef.current?.setInputBlocked(open);
  }, []);

  const bindScreen = useCallback((keys: ScreenKeys | null) => {
    screenRef.current = keys;
  }, []);

  /** Right click with units selected: their orders. */
  const order = useCallback(
    (target: OrderTarget) => {
      const game = gameRef.current;
      if (game !== null) {
        const plan = planOrders(
          game,
          unitsOf(game, selectionRef.current),
          target,
        );
        let given = false;
        for (const next of plan.commands) {
          given = command(next) || given;
        }
        if (plan.refusal !== null) {
          say(plan.refusal);
          soundRef.current?.cue("denied");
        }
        if (given) {
          viewRef.current?.flash(target.x, target.y);
        }
      }
    },
    [command, say],
  );

  // Mount: sound, flags, saves.
  useEffect(() => {
    soundRef.current = createSoundPlayer();
    soundRef.current.setMuted(mutedSetting.load());
    flagsRef.current = readFlags();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- saves are only known in the browser
    refreshSaves();
    const unsubscribe = mutedSetting.subscribe(() =>
      soundRef.current?.setMuted(mutedSetting.load()),
    );
    const flags = flagsRef.current;
    if (flags.debug) {
      // Test shortcut: lets a browser test read the game and send commands.
      (window as unknown as Record<string, unknown>).imperavisDebug = {
        game: () => gameRef.current,
        command: (next: Command | PlayerCommand) =>
          gameRef.current === null
            ? null
            : settle(
                gameRef.current,
                applyCommand(gameRef.current, { player: HUMAN, ...next }),
              ),
        fps: () => viewRef.current?.fps() ?? 0,
        stats: () => viewRef.current?.stats() ?? null,
        project: (x: number, y: number) =>
          viewRef.current?.project(x, y) ?? null,
        camera: () => viewRef.current?.cameraState() ?? null,
        selection: () => selectionRef.current,
        focus: (x: number, y: number) => viewRef.current?.focus(x, y),
        run: (seconds: number) => {
          const current = gameRef.current;
          for (
            let i = 0;
            current !== null && i < Math.round(seconds / TICK);
            i += 1
          ) {
            stepGame(current);
          }
        },
        plan: (from: number, to: number) =>
          gameRef.current === null
            ? null
            : planRoad(gameRef.current, HUMAN, from, to),
        spawn: (owner: number, kind: ShipKind, x: number, y: number) =>
          gameRef.current === null
            ? null
            : createShip(gameRef.current, owner, kind, x, y).id,
        ignite: (id: number) => {
          const building = gameRef.current?.buildings.find((b) => b.id === id);
          if (gameRef.current !== null && building !== undefined) {
            ignite(gameRef.current, building);
          }
        },
        grant: (points: number) => {
          const human = gameRef.current?.players[HUMAN];
          if (human !== undefined) {
            human.research.progress += points;
          }
        },
        check: (kind: BuildingKind, x: number, y: number, rot: number) =>
          gameRef.current === null
            ? null
            : checkPlacement(gameRef.current, HUMAN, kind, x, y, rot, null),
      };
    }
    if (flags.autostart) {
      newGame(
        flags.seed ?? Math.floor(Math.random() * SEED_RANGE),
        flags.size ?? "medium",
        {
          aiCount: flags.ai ?? DEFAULT_SETTINGS.aiCount,
          peaceful: flags.peace,
          guided: flags.tutorial,
        },
      );
    }
    const unlock = () => soundRef.current?.resume();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      unsubscribe();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      soundRef.current?.dispose();
    };
    // Only once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The view: created when a game is loading and the canvas is there.
  useEffect(() => {
    let cancelled = false;
    const game = gameRef.current;
    const canvas = canvasRef.current;
    if (phase === "loading" && game !== null && canvas !== null) {
      import("@/games/imperavis/render/view")
        .then(({ createView }) => {
          if (!cancelled) {
            viewRef.current?.dispose();
            viewRef.current = createView(
              canvas,
              game,
              {
                onPick: (hit, additive) => {
                  hideTip();
                  select(clickPick(game, selectionRef.current, hit, additive));
                },
                onBox: (ships, soldiers, additive) =>
                  select(
                    boxPick(
                      game,
                      selectionRef.current,
                      { ships, soldiers },
                      additive,
                    ),
                  ),
                onOrder: (target) => order(target),
                onHover: hoverAt,
                onBuild: (kind, x, y, rot) => {
                  const built = command({ type: "build", kind, x, y, rot });
                  // The tool stays for the next one - only a kontor is
                  // placed once, after which the island is founded.
                  if (built && kind === "kontor") {
                    setTool({ type: "select" });
                  }
                },
                onRoad: (tiles) => command({ type: "road", tiles }),
                onPave: (tiles) => command({ type: "pave", tiles }),
                onDemolish: (x, y) => command({ type: "demolish", x, y }),
                onRelocate: (id, x, y, rot) => {
                  if (command({ type: "relocate", id, x, y, rot })) {
                    setTool({ type: "select" });
                  }
                },
                onSail: (ship, x, y) => {
                  if (command({ type: "moveShip", ship, x, y })) {
                    setTool({ type: "select" });
                  }
                },
                onPatrol: (ships, soldiers, x, y) => {
                  let given = false;
                  for (const ship of ships) {
                    given =
                      command({ type: "shipPatrol", ship, x, y }) || given;
                  }
                  if (soldiers.length > 0) {
                    given =
                      command({ type: "unitPatrol", soldiers, x, y }) || given;
                  }
                  if (given) {
                    setTool({ type: "select" });
                  }
                },
                onHint: (next) => setHint(next),
                onCancel: () => setTool({ type: "select" }),
                onAction: (action) => actionRef.current(action),
              },
              viewOptions(),
            );
            viewRef.current.setTool(toolRef.current);
            viewRef.current.setSelection(selectionRef.current);
            viewRef.current.setInputBlocked(menuRef.current);
            setPhase("playing");
          }
        })
        .catch(() => {
          if (!cancelled) {
            setPhase("error");
          }
        });
    }
    return () => {
      cancelled = true;
    };
  }, [command, hideTip, hoverAt, order, phase, select, setTool]);

  // The loop.
  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    let accumulator = 0;
    const loop = (now: number) => {
      const real = (now - last) / MS;
      const dt = Math.min(MAX_FRAME, real);
      last = now;
      const game = gameRef.current;
      const view = viewRef.current;
      if (game !== null && view !== null) {
        const running =
          speedRef.current > 0 && !document.hidden && !menuRef.current;
        accumulator += running ? dt * speedRef.current : 0;
        // The cheat's speeds run on a time budget instead of a step count.
        const budgeted = speedRef.current > NORMAL_TOP;
        const started = performance.now();
        let steps = 0;
        let spent = false;
        while (accumulator >= TICK && !spent) {
          stepGame(game);
          accumulator -= TICK;
          steps += 1;
          spent = budgeted
            ? performance.now() - started >= STEP_BUDGET_MS
            : steps >= MAX_STEPS;
        }
        if (spent) {
          accumulator = 0;
        }
        if (running) {
          playRef.current += dt * MS;
        }
        const events = game.events.splice(0);
        if (events.length > 0) {
          soundRef.current?.play(events.filter((event) => mine(event)));
          view.effects(events);
          if (
            events.some((event) => event.type === "shot") &&
            view.ambience().battle > NEAR_BATTLE
          ) {
            // Only cannons close to the camera are heard.
            soundRef.current?.cue("cannon");
          }
          for (const event of events) {
            const news = describe(game, event);
            if (news !== null) {
              tell(news);
            }
          }
        }
        view.frame(
          game,
          accumulator / TICK,
          Math.min(MAX_VIEW_FRAME, real),
          running ? dt * speedRef.current : 0,
        );
        const around = view.ambience();
        soundRef.current?.ambience(
          {
            night: around.night,
            rain:
              game.weather === "storm" ? 2 : game.weather === "rain" ? 1 : 0,
            closeness: around.closeness,
            city: around.city,
            harbour: around.harbour,
            building: around.building,
            battle: around.battle,
            running,
          },
          dt,
        );
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [tell]);

  // Panels, fps and old messages.
  useEffect(() => {
    const timer = window.setInterval(() => {
      const game = gameRef.current;
      if (game !== null) {
        setTick((value) => value + 1);
        setFps(viewRef.current?.fps() ?? 0);
        for (const news of watch(game, watchRef.current)) {
          tell(news);
        }
        setMessages((list) => {
          const fresh = list.filter(
            (message) => Date.now() - message.at < MESSAGE_MS[message.level],
          );
          return fresh.length === list.length ? list : fresh;
        });
      }
    }, UI_EVERY);
    return () => window.clearInterval(timer);
  }, [tell]);

  // Autosave and statistics.
  useEffect(() => {
    const save = window.setInterval(() => {
      if (gameRef.current !== null) {
        writeAuto();
        say(T.autosaved);
      }
    }, AUTOSAVE_EVERY);
    const stats = window.setInterval(flushStats, STATS_EVERY);
    const leave = () => {
      writeAuto();
      flushStats();
    };
    const hidden = () => {
      if (document.hidden) {
        leave();
      }
    };
    window.addEventListener("pagehide", leave);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.clearInterval(save);
      window.clearInterval(stats);
      window.removeEventListener("pagehide", leave);
      document.removeEventListener("visibilitychange", hidden);
      leave();
      viewRef.current?.dispose();
      viewRef.current = null;
    };
  }, [flushStats, say, writeAuto]);

  // Options from the settings page.
  useEffect(() => {
    const apply = () => viewRef.current?.setOptions(viewOptions());
    const stops = [shadowsSetting, weatherSetting, edgeScrollSetting].map(
      (setting) => setting.subscribe(apply),
    );
    return () => stops.forEach((stop) => stop());
  }, []);

  // Shortcuts, as the input of the view reports them.
  useEffect(() => {
    /** Esc in steps: tool, menu, window, selection, then the menu. */
    const escape = () => {
      if (toolRef.current.type !== "select") {
        setTool({ type: "select" });
      } else if (menuRef.current) {
        setMenuOpen(false);
      } else if (screenRef.current?.closeWindow() === true) {
        // The window is closed.
      } else if (selectionRef.current.type !== "none") {
        select({ type: "none" });
      } else {
        setMenuOpen(true);
      }
    };
    /** Plus and minus walk through pause and the speeds on offer. */
    const stepSpeed = (step: number) => {
      const steps = [
        0,
        ...(cheatRef.current ? [...SPEEDS, ...CHEAT_SPEEDS] : SPEEDS),
      ];
      const at = Math.max(0, steps.indexOf(speedRef.current));
      setSpeed(steps[Math.min(steps.length - 1, Math.max(0, at + step))]);
    };
    /** Tab: the next own unit, and the camera goes there. */
    const cycle = (game: Game, step: number) => {
      const next = nextUnit(game, selectionRef.current, step);
      if (next === null) {
        say(HUD.noUnits);
      } else {
        select(next.pick);
        viewRef.current?.focus(next.x, next.y);
      }
    };
    /** 1 to 9: a control group; with Ctrl stored, twice quickly looked at. */
    const group = (game: Game, slot: number, save: boolean) => {
      const units = unitsOf(game, selectionRef.current);
      const count = units.ships.length + units.soldiers.length;
      if (save && count === 0) {
        say(HUD.groupEmpty);
      } else if (save) {
        groupsRef.current.set(slot, units);
        say(HUD.groupSaved(slot, count));
      } else {
        const stored = alive(
          game,
          groupsRef.current.get(slot) ?? { ships: [], soldiers: [] },
        );
        const now = Date.now();
        const again =
          lastGroupRef.current.slot === slot &&
          now - lastGroupRef.current.at < DOUBLE_PRESS;
        lastGroupRef.current = { slot, at: now };
        const centre = centreOf(game, stored);
        if (centre === null) {
          say(HUD.groupMissing(slot));
        } else {
          select(pickOf(stored));
          if (again) {
            viewRef.current?.focus(centre.x, centre.y);
          }
        }
      }
    };
    actionRef.current = (action: InputAction) => {
      const game = gameRef.current;
      const current = toolRef.current;
      if (game === null || (menuRef.current && action.type !== "escape")) {
        // Under the pause menu only Esc counts.
      } else {
        switch (action.type) {
          case "escape":
            escape();
            break;
          case "pause":
            setSpeed(speedRef.current > 0 ? 0 : lastSpeedRef.current);
            break;
          case "speed":
            stepSpeed(action.step);
            break;
          case "rotate":
            if (current.type === "build" || current.type === "relocate") {
              setTool({
                ...current,
                rot:
                  (current.rot + action.step + QUARTER_TURNS) % QUARTER_TURNS,
              });
            }
            break;
          case "road": {
            const wanted = action.pave ? "pave" : "road";
            setTool(
              current.type === wanted ? { type: "select" } : { type: wanted },
            );
            break;
          }
          case "demolish":
            setTool(
              current.type === "demolish"
                ? { type: "select" }
                : { type: "demolish" },
            );
            break;
          case "buildMenu":
            screenRef.current?.toggleBuildMenu();
            break;
          case "cycle":
            cycle(game, action.step);
            break;
          default:
            group(game, action.slot, action.save);
        }
      }
    };
  }, [say, select, setMenuOpen, setSpeed, setTool]);

  return {
    phase,
    game,
    tick,
    canvasRef,
    speed,
    speeds: cheat ? [...SPEEDS, ...CHEAT_SPEEDS] : SPEEDS,
    tool,
    selection,
    hint,
    messages,
    menuOpen,
    hoverTip,
    fps,
    hasAutosave,
    slots,
    unreadable,
    cheat,
    toggleCheat,
    newGame,
    continueGame,
    loadFrom,
    saveTo,
    toMenu,
    setMenuOpen,
    setSpeed,
    setTool,
    select,
    command,
    focus,
    dismiss,
    viewArea,
    bindScreen,
    groups,
  };
}

/**
 * Brings the derived grids up to date right after a command of the human,
 * so that a site, a road or a gap appears at once - also in pause, when no
 * step follows. The next step would do the same first thing, so the game
 * goes on exactly as without it.
 */
function settle<T>(game: Game, result: T): T {
  refreshDerived(game);
  return result;
}

/** The drawing settings as they are stored. */
function viewOptions(): ViewOptions {
  return {
    shadows: shadowsSetting.load(),
    weather: weatherSetting.load(),
    edgeScroll: edgeScrollSetting.load(),
  };
}

/** Whether an event concerns the human, for sound. */
function mine(event: GameEvent): boolean {
  const player = "player" in event ? event.player : HUMAN;
  return player === HUMAN && event.type !== "shot";
}

/** The words for a refused command. */
function refusalText(reason: string): string {
  const answer = reason.startsWith("dip:")
    ? ANSWER_TEXTS[reason.slice("dip:".length) as keyof typeof ANSWER_TEXTS]
    : undefined;
  return answer ?? REFUSAL_TEXTS[reason] ?? reason;
}

/** Reads the test shortcuts from the address bar. */
function readFlags(): Flags {
  const raw = new URLSearchParams(window.location.search).get("imp") ?? "";
  const parts = raw.split(",").filter((part) => part !== "");
  const value = (name: string) =>
    parts.find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1) ??
    null;
  const size = value("size");
  const seed = value("seed");
  const ai = value("ai");
  return {
    debug: parts.includes("debug"),
    autostart: parts.includes("autostart"),
    found: parts.includes("found"),
    rich: parts.includes("rich"),
    tutorial: parts.includes("tutorial"),
    scholar: parts.includes("scholar"),
    peace: parts.includes("peace"),
    ai: ai !== null && /^[0-3]$/.test(ai) ? Number(ai) : null,
    seed: seed !== null && /^\d+$/.test(seed) ? Number(seed) : null,
    size:
      size === "small" || size === "medium" || size === "large" ? size : null,
  };
}

/** Applies the test shortcuts to a new game. */
function applyFlags(game: Game, flags: Flags): void {
  if (flags.tutorial && !game.tutorial.active) {
    startTutorial(game);
  }
  if (flags.found) {
    // Found the kontor at the free coast spot nearest the first ship.
    const ship = game.ships.find((s) => s.owner === HUMAN) ?? game.ships[0];
    const island = game.world.islands[game.world.startIsland];
    let best: { x: number; y: number; d: number } | null = null;
    for (let y = island.minY - 1; y <= island.maxY; y += 1) {
      for (let x = island.minX - 1; x <= island.maxX; x += 1) {
        const d = Math.hypot(x - ship.x, y - ship.y);
        if (
          (best === null || d < best.d) &&
          checkPlacement(game, HUMAN, "kontor", x, y, 0, null).issue === null
        ) {
          best = { x, y, d };
        }
      }
    }
    if (best !== null) {
      applyCommand(game, {
        player: HUMAN,
        type: "build",
        kind: "kontor",
        x: best.x,
        y: best.y,
        rot: 0,
      });
    }
  }
  const human = game.players[HUMAN];
  if (flags.scholar) {
    // Test shortcut: every field without a forerunner is done already.
    human.research.done = RESEARCH.filter((def) => def.needs.length === 0).map(
      (def) => def.id,
    );
  }
  if (flags.rich) {
    // Old browser scripts expect every building; only `tutorial` keeps the
    // guided start on.
    game.tutorial.active = game.tutorial.active && flags.tutorial;
    human.gold += RICH_GOLD;
    human.unlocked = BUILDINGS.filter((def) => def.research === null).map(
      (def) => def.kind,
    );
    for (const island of game.islands) {
      if (island.owner === HUMAN) {
        for (const good of GOOD_IDS) {
          island.stock[good] = Math.min(
            BUILDING.kontor.storage,
            island.stock[good] + RICH_GOODS,
          );
        }
      }
    }
  }
}
