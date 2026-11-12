/**
 * The living arena: the animation loop, the replay of every throw, and the
 * aiming by mouse, finger and keyboard.
 *
 * @module
 * @remarks
 * The match itself is handed in from outside - the single-player hook or the
 * online room - and only ever changes there. This hook watches it: whenever a
 * new throw appears in it, the throw is flown again here, step by step, with
 * the same engine that decided it, and the life bars drop the moment it lands.
 * Only once the mess has settled and the camera is back with the next thrower
 * does the hook say so, which is what the computer waits for before throwing
 * back.
 *
 * **The camera.** The field is far wider than the picture. While aiming, the
 * camera stands by the thrower; once the thing is in the air it follows it
 * across - and up, if it flies high - stays on the landing for a moment so the
 * hit and the flinch can be seen, then swings calmly over to whoever throws
 * next. It is worked out from the match alone, so both screens of an online
 * match make the same journey.
 *
 * Aiming: the arrow from the thrower's hand follows the pointer, which sets
 * the angle. Pressing starts the strength bar, which swings up to full and
 * back down again for as long as the button is held; letting go throws with
 * whatever strength it shows. Swinging rather than stopping at the top is on
 * purpose - a bar that waits at 100 % makes every throw a full one, and timing
 * the release is the skill.
 */
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import {
  FIGHTER_X,
  HAND_AHEAD,
  HAND_HEIGHT,
  WORLD_WIDTH,
  facing,
} from "@/games/wurfduell/engine/arena";
import {
  ABILITIES,
  characterById,
  itemFor,
} from "@/games/wurfduell/engine/characters";
import {
  canUseAbility,
  flightOf,
  flightSetup,
} from "@/games/wurfduell/engine/game";
import {
  ANGLE_MAX,
  ANGLE_MIN,
  STEPS_PER_SECOND,
  previewPath,
  type Flight,
} from "@/games/wurfduell/engine/physics";
import type {
  AbilityId,
  DuelGame,
  ItemId,
  ThrowInput,
  ThrowRecord,
} from "@/games/wurfduell/engine/types";
import type { SoundPlayer } from "@/games/wurfduell/audio/sounds";
import type {
  Pose,
  PoseKind,
  Stain,
} from "@/games/wurfduell/components/draw-fighters";
import {
  createEffects,
  popup,
  spawnImpact,
  stepEffects,
  type Effects,
} from "@/games/wurfduell/components/effects";
import {
  GROUND_Y,
  VIEW_WIDTH,
  drawScene,
  groundScreenY,
  screenToWorld,
  type Camera,
  type Scene,
  type SceneAim,
} from "@/games/wurfduell/components/render";
import type { CameraMode } from "@/games/wurfduell/settings/preferences";
import { fitCanvas } from "@/lib/screen/fit-canvas";
import { WURFDUELL_TEXTS as T } from "@/games/wurfduell/i18n/texts";

/** What the arena needs from its owner. */
export type ArenaOptions = {
  readonly game: DuelGame;
  readonly names: readonly string[];
  /** The seat this screen throws for, or null to only watch. */
  readonly controlSeat: number | null;
  /** Called with a finished throw; the owner applies or sends it. */
  readonly onThrow: (input: ThrowInput) => void;
  readonly sound: SoundPlayer;
  /** Whether the camera follows the throw or shows the whole field. */
  readonly cameraMode: CameraMode;
  /** Whether the dotted start of the arc is shown while charging. */
  readonly aimDots: boolean;
  /** The picture's height in canvas units (wide or upright). */
  readonly viewHeight: number;
};

/** What the arena hands back to the screen around it. */
export type Arena = {
  readonly canvasRef: RefObject<HTMLCanvasElement | null>;
  /** The aimed angle, in degrees. */
  readonly angle: number;
  /** The ability armed for the next throw, if any. */
  readonly armed: AbilityId | null;
  /** Arms an ability, or disarms it when it is armed already. */
  readonly toggleAbility: (ability: AbilityId) => void;
  /** Whether this screen may throw right now. */
  readonly canAim: boolean;
  /** Whether the strength bar is running. */
  readonly charging: boolean;
  /** Whether the thrower here has flour in the eyes this turn. */
  readonly blind: boolean;
  /** The id of the last throw whose animation has finished. */
  readonly settledId: number;
  /** Starts the strength bar (button or key pressed). */
  readonly startCharge: () => void;
  /** Throws with the strength the bar shows (button or key let go). */
  readonly release: () => void;
  readonly pointer: {
    readonly onPointerDown: (
      event: ReactPointerEvent<HTMLCanvasElement>,
    ) => void;
    readonly onPointerMove: (
      event: ReactPointerEvent<HTMLCanvasElement>,
    ) => void;
    readonly onPointerUp: () => void;
    readonly onPointerCancel: () => void;
  };
};

/** Where the angle starts before anybody has touched it. */
const START_ANGLE = 45;

/** How long the strength bar takes from empty to full, in seconds. */
export const CHARGE_RISE_SECONDS = 1.4;

/** How much of the windless arc the aiming help shows without an ability. */
const PREVIEW_SHARE = 0.3;

/** How long the arm swings before the thing leaves the hand, in seconds. */
const RELEASE_DELAY = 0.12;

/** How long the camera stays on the landing, in seconds. */
const SETTLE_SECONDS = 1.1;
/** ... and after a knockout, so the fall can be watched. */
const KNOCKOUT_SETTLE_SECONDS = 2.2;

/** How far ahead of the thrower the camera stands while aiming. */
const AIM_LEAD = 280;

/** How quickly the camera catches up: following a throw, and panning. */
const FOLLOW_RATE = 6;
const PAN_RATE = 3.2;

/** How close the camera must be to its rest to count as arrived. */
const ARRIVED = 30;

/** How much room a high throw keeps above it, in canvas units. */
const HEADROOM = 150;

/** Extra field shown beyond both fighters in the overview. */
const OVERVIEW_MARGIN = 300;

/** How far the camera may look past the field's ends. */
const EDGE_SLACK = 60;

/** How long a throw or a flinch is shown before standing again. */
const POSE_SECONDS = 0.9;

/** How long the white trail waits before it runs down, in seconds. */
const TRAIL_HOLD_SECONDS = 0.45;
/** How fast it then runs down, in life points per second. */
const TRAIL_SPEED = 70;

/** Longest frame step the effects take, so a hidden tab does not explode. */
const MAX_FRAME_SECONDS = 0.05;

/** Keyboard steps of the angle: fine and with Shift. */
const ANGLE_STEP = 1;
const ANGLE_STEP_BIG = 5;

/** Rounding of what is sent, so the wire carries short numbers. */
const ANGLE_PRECISION = 10;
const POWER_PRECISION = 1000;

/** Below this shown width, in CSS pixels, the bars and names grow. */
const HUD_REFERENCE_PX = 640;
/** ... but never more than this. */
const MAX_HUD_SCALE = 1.6;

/** Milliseconds in a second. */
const MS_PER_SECOND = 1000;

/** Degrees in half a turn. */
const HALF_TURN_DEGREES = 180;

/** The most stains that stick to one fighter. */
const MAX_STAINS = 4;

/** Where above a fighter's feet the ability names pop up. */
const POPUP_HEIGHT = 170;

/** How far a second popped-up word sits below the first. */
const POPUP_LINE = 36;

/** Colours of the words that pop up. */
const HEAL_COLOR = "#22c55e";
const BURN_COLOR = "#f97316";
const ABILITY_COLOR = "#fde047";
const FREEZE_COLOR = "#7dd3fc";

/** A throw being replayed. */
type Replay = {
  readonly record: ThrowRecord;
  readonly flight: Flight;
  /** When the thing leaves the hand, in seconds on the view's clock. */
  readonly start: number;
  /** How many impacts have been shown. */
  shown: number;
  /** Life points already shown as lost to the hit. */
  damageShown: number;
  /** Whether the burn afterwards has been shown. */
  burnShown: boolean;
  /** When the next turn may begin, once known. */
  settleAt: number | null;
};

/** One fighter's pose, as remembered between frames. */
type PoseMemory = { kind: PoseKind; since: number };

/** Everything the loop keeps between frames. */
type ViewState = {
  replay: Replay | null;
  poses: PoseMemory[];
  stains: Stain[][];
  effects: Effects;
  seenId: number;
  round: number;
  /** When the end of the match was first shown. */
  overSince: number | null;
  /** The white trail behind each life bar, and how long it still waits. */
  trail: number[];
  trailHold: number[];
  /** The life points each bar showed last frame. */
  lastHp: number[];
  /** The arc last worked out, and what it was for. */
  previewKey: string;
  preview: readonly number[];
  /** Where the camera is. */
  cam: { x: number; lift: number };
  /** A throw that has landed while the camera still swings back. */
  pendingSettle: number | null;
  /** Where the last piece came down, for the camera to rest on. */
  impactX: number | null;
};

/** What the loop needs from React, refreshed after every render. */
type Latest = {
  options: ArenaOptions;
  angle: number;
  armed: AbilityId | null;
  canAim: boolean;
  blind: boolean;
  chargeStart: number | null;
  clock: number;
};

/**
 * Runs the arena.
 *
 * @param options - the match and what may be done with it here
 * @returns the canvas ref, the aim and the input handlers
 */
export function useArena(options: ArenaOptions): Arena {
  const { game, controlSeat, sound } = options;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentId = game.lastThrow?.id ?? 0;
  const [settledId, setSettledId] = useState(currentId);
  const [angle, setAngle] = useState(START_ANGLE);
  const [armed, setArmed] = useState<AbilityId | null>(null);
  const [charging, setCharging] = useState(false);
  const [sentFor, setSentFor] = useState<number | null>(null);
  const view = useRef<ViewState>(freshView(game, currentId));
  const latest = useRef<Latest>({
    options,
    angle,
    armed,
    canAim: false,
    blind: false,
    chargeStart: null,
    clock: 0,
  });

  const canAim =
    game.phase === "throw" &&
    controlSeat === game.turn &&
    settledId === currentId &&
    sentFor !== currentId;
  const blind =
    canAim && controlSeat !== null && game.players[controlSeat].status.blind;

  useEffect(() => {
    latest.current = {
      ...latest.current,
      options,
      angle,
      armed,
      canAim,
      blind,
    };
  });

  // A fresh turn starts with nothing armed and no bar running.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- resetting the controls when a turn begins */
    setArmed(null);
    setCharging(false);
    /* eslint-enable react-hooks/set-state-in-effect */
    latest.current.chargeStart = null;
  }, [currentId, game.round]);

  // The little "your turn" chime.
  useEffect(() => {
    if (canAim) {
      latest.current.options.sound.play("turn");
    }
  }, [canAim]);

  // A new throw, or a new match, appearing in the state.
  const record = game.lastThrow;
  useEffect(() => {
    const state = view.current;
    const now = latest.current.clock;
    if (game.round !== state.round) {
      view.current = freshView(game, currentId);
      setSettledId(currentId);
    } else if (record !== null && record.id > state.seenId) {
      state.seenId = record.id;
      state.replay = startReplay(game, record, now);
      state.poses[record.by] = { kind: "throw", since: now };
      announceThrow(state, latest.current.options, record);
    }
    // Only a new throw or a new round restarts anything here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId, game.round]);

  // The animation loop.
  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const origin = last;
    const tick = (time: number) => {
      const dt = Math.min(MAX_FRAME_SECONDS, (time - last) / MS_PER_SECOND);
      last = time;
      const clock = (time - origin) / MS_PER_SECOND;
      latest.current.clock = clock;
      const settled = advanceView(
        view.current,
        latest.current.options,
        clock,
        dt,
      );
      if (settled !== null) {
        setSettledId(settled);
      }
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d") ?? null;
      if (canvas !== null && ctx !== null) {
        const scale = fitCanvas(
          canvas,
          VIEW_WIDTH,
          latest.current.options.viewHeight,
        );
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        const hudScale = Math.min(
          MAX_HUD_SCALE,
          Math.max(1, HUD_REFERENCE_PX / Math.max(1, canvas.clientWidth)),
        );
        drawScene(ctx, {
          ...sceneOf(view.current, latest.current, clock),
          hudScale,
        });
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const startCharge = useCallback(() => {
    const now = latest.current;
    now.options.sound.resume();
    if (now.canAim && now.chargeStart === null) {
      now.chargeStart = now.clock;
      setCharging(true);
    }
  }, []);

  const release = useCallback(() => {
    const now = latest.current;
    if (now.canAim && now.chargeStart !== null) {
      const power = chargeAt(now.chargeStart, now.clock);
      now.chargeStart = null;
      setCharging(false);
      setSentFor(now.options.game.lastThrow?.id ?? 0);
      now.options.onThrow({
        angle: Math.round(now.angle * ANGLE_PRECISION) / ANGLE_PRECISION,
        power: Math.round(power * POWER_PRECISION) / POWER_PRECISION,
        ability: now.armed,
      });
    }
  }, []);

  const toggleAbility = useCallback((ability: AbilityId) => {
    const { options: current, canAim: may } = latest.current;
    const seat = current.controlSeat;
    if (may && seat !== null && canUseAbility(current.game, seat, ability)) {
      current.sound.play("pick");
      setArmed((now) => (now === ability ? null : ability));
    }
  }, []);

  const abilityAt = useCallback((index: number): AbilityId | null => {
    const { game: match, controlSeat: seat } = latest.current.options;
    const character = seat === null ? null : match.players[seat].character;
    return character === null
      ? null
      : (characterById(character).abilities[index] ?? null);
  }, []);

  useKeyboard(canAim, setAngle, abilityAt, toggleAbility, startCharge, release);

  const aimAt = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (canAim && controlSeat !== null) {
      const box = event.currentTarget.getBoundingClientRect();
      const { x, y } = screenToWorld(
        cameraOf(view.current, options),
        options.viewHeight,
        ((event.clientX - box.left) / box.width) * VIEW_WIDTH,
        ((event.clientY - box.top) / box.height) * options.viewHeight,
      );
      const size = characterById(
        game.players[controlSeat].character ?? "koch",
      ).size;
      setAngle(pointAngle(controlSeat, size, x, y));
    }
  };

  const pointer = {
    onPointerDown: (event: ReactPointerEvent<HTMLCanvasElement>) => {
      sound.resume();
      if (canAim) {
        event.currentTarget.setPointerCapture(event.pointerId);
        aimAt(event);
        startCharge();
      }
    },
    onPointerMove: aimAt,
    onPointerUp: release,
    onPointerCancel: () => {
      latest.current.chargeStart = null;
      setCharging(false);
    },
  };

  return {
    canvasRef,
    angle,
    armed,
    toggleAbility,
    canAim,
    charging,
    blind,
    settledId,
    startCharge,
    release,
    pointer,
  };
}

/**
 * The strength the bar shows after being held for a while.
 *
 * @param start - when the press began, in seconds
 * @param now - the moment asked about, in seconds
 * @returns 0 to 1, rising to full and falling back again
 */
export function chargeAt(start: number, now: number): number {
  const phase = ((now - start) / CHARGE_RISE_SECONDS) % 2;
  return phase <= 1 ? phase : 2 - phase;
}

/**
 * The angle from a fighter's hand to a point on the field.
 *
 * @param seat - the thrower
 * @param size - their size
 * @param x - the point, in world units
 * @param y - the point's height, in world units
 * @returns degrees, clamped to what a throw may have
 */
function pointAngle(seat: number, size: number, x: number, y: number): number {
  const handX = FIGHTER_X[seat] + facing(seat) * HAND_AHEAD;
  const handY = HAND_HEIGHT * size;
  const degrees =
    (Math.atan2(y - handY, (x - handX) * facing(seat)) * HALF_TURN_DEGREES) /
    Math.PI;
  return Math.min(ANGLE_MAX, Math.max(ANGLE_MIN, degrees));
}

/** The arrow keys, the space bar and the number keys. */
function useKeyboard(
  canAim: boolean,
  setAngle: (change: (angle: number) => number) => void,
  abilityAt: (index: number) => AbilityId | null,
  toggleAbility: (ability: AbilityId) => void,
  startCharge: () => void,
  release: () => void,
): void {
  useEffect(() => {
    const typing = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      return (
        target !== null &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      );
    };
    const onDown = (event: KeyboardEvent) => {
      const step = event.shiftKey ? ANGLE_STEP_BIG : ANGLE_STEP;
      let handled = canAim && !typing(event);
      if (handled) {
        switch (event.key) {
          case "ArrowUp":
            setAngle((a) => Math.min(ANGLE_MAX, a + step));
            break;
          case "ArrowDown":
            setAngle((a) => Math.max(ANGLE_MIN, a - step));
            break;
          case " ":
          case "Enter":
            if (!event.repeat) {
              startCharge();
            }
            break;
          default: {
            // The number keys arm the abilities, in button order.
            const ability = abilityAt(Number.parseInt(event.key, 10) - 1);
            handled = ability !== null;
            if (ability !== null) {
              toggleAbility(ability);
            }
          }
        }
      }
      if (handled) {
        event.preventDefault();
      }
    };
    const onUp = (event: KeyboardEvent) => {
      if ((event.key === " " || event.key === "Enter") && !typing(event)) {
        event.preventDefault();
        release();
      }
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [canAim, setAngle, abilityAt, toggleAbility, startCharge, release]);
}

/** A view with nothing in the air, matching a match as it is. */
function freshView(game: DuelGame, seenId: number): ViewState {
  const hp = game.players.map((player) => player.hp);
  return {
    cam: { x: restX(game, null), lift: 0 },
    pendingSettle: null,
    impactX: null,
    replay: null,
    poses: [
      { kind: "idle", since: 0 },
      { kind: "idle", since: 0 },
    ],
    stains: [[], []],
    effects: createEffects(),
    seenId,
    round: game.round,
    overSince: null,
    trail: [...hp],
    trailHold: [0, 0],
    lastHp: [...hp],
    previewKey: "",
    preview: [],
  };
}

/** Starts flying a throw again for the eye. */
function startReplay(game: DuelGame, record: ThrowRecord, now: number): Replay {
  return {
    record,
    flight: flightOf(game, record),
    start: now + RELEASE_DELAY,
    shown: 0,
    damageShown: 0,
    burnShown: false,
    settleAt: null,
  };
}

/** The sound and the words when a throw leaves the hand. */
function announceThrow(
  state: ViewState,
  options: ArenaOptions,
  record: ThrowRecord,
): void {
  const x = FIGHTER_X[record.by];
  options.sound.play("throw");
  if (record.input.ability !== null) {
    options.sound.play("ability");
    popup(
      state.effects,
      x,
      GROUND_Y - POPUP_HEIGHT,
      ABILITIES[record.input.ability].name,
      ABILITY_COLOR,
      false,
    );
  }
  if (record.heal > 0) {
    options.sound.play("heal");
    popup(
      state.effects,
      x,
      GROUND_Y - POPUP_HEIGHT + POPUP_LINE,
      `+${record.heal}`,
      HEAL_COLOR,
      true,
    );
  }
}

/**
 * Moves the view on by one frame.
 *
 * @returns the id of a throw that has just settled, or null
 */
function advanceView(
  state: ViewState,
  options: ArenaOptions,
  clock: number,
  dt: number,
): number | null {
  let settled: number | null = null;
  stepEffects(state.effects, dt, GROUND_Y);
  const replay = state.replay;
  if (replay !== null) {
    const step = (clock - replay.start) * STEPS_PER_SECOND;
    const impacts = replay.flight.impacts;
    while (
      replay.shown < impacts.length &&
      impacts[replay.shown].step <= step
    ) {
      showImpact(state, options, replay, impacts[replay.shown], clock);
      replay.shown += 1;
    }
    if (replay.settleAt === null && step >= replay.flight.steps) {
      finishFlight(state, options, replay, clock);
    }
    if (replay.settleAt !== null && clock >= replay.settleAt) {
      state.pendingSettle = replay.record.id;
      state.replay = null;
      if (replay.record.knockout) {
        options.sound.play("win");
      }
    }
  }
  const arrived = stepCamera(state, options, clock, dt);
  if (state.pendingSettle !== null && arrived) {
    settled = state.pendingSettle;
    state.pendingSettle = null;
  }
  if (
    options.game.phase === "over" &&
    state.replay === null &&
    state.overSince === null
  ) {
    // Given up, or opened on an already finished match.
    state.overSince = clock;
    const winner = options.game.winner ?? 0;
    state.poses[winner] = { kind: "win", since: clock };
    if (options.game.endReason === "ko") {
      state.poses[1 - winner] = { kind: "ko", since: clock };
    }
  }
  stepTrails(state, options.game, clock, dt);
  return settled;
}

/** Everything that happens once the last piece is down. */
function finishFlight(
  state: ViewState,
  options: ArenaOptions,
  replay: Replay,
  clock: number,
): void {
  const record = replay.record;
  replay.settleAt =
    clock + (record.knockout ? KNOCKOUT_SETTLE_SECONDS : SETTLE_SECONDS);
  // Whatever the replay did not pin on a piece is still lost now.
  replay.damageShown = record.damage;
  replay.burnShown = true;
  if (record.burnSeat !== null && record.burn > 0) {
    popup(
      state.effects,
      FIGHTER_X[record.burnSeat],
      GROUND_Y - POPUP_HEIGHT + POPUP_LINE,
      T.burnPopup(record.burn),
      BURN_COLOR,
      true,
    );
    options.sound.play("ouch");
  }
  if (record.frozen) {
    popup(
      state.effects,
      FIGHTER_X[1 - record.by],
      GROUND_Y - POPUP_HEIGHT,
      T.frozenPopup,
      FREEZE_COLOR,
      false,
    );
  }
  if (record.knockout) {
    const loser = 1 - (options.game.winner ?? record.by);
    state.poses[loser] = { kind: "ko", since: clock };
    state.poses[1 - loser] = { kind: "win", since: clock };
    state.overSince = clock;
    options.sound.play("ko");
  }
}

/** Shows one piece coming down: the mess, the sound, the flinch. */
function showImpact(
  state: ViewState,
  options: ArenaOptions,
  replay: Replay,
  impact: Flight["impacts"][number],
  clock: number,
): void {
  const target = 1 - replay.record.by;
  const damage = Math.min(
    replay.record.shielded ? Math.ceil(impact.damage / 2) : impact.damage,
    replay.record.damage - replay.damageShown,
  );
  replay.damageShown += damage;
  const head = impact.kind === "head";
  if (impact.kind !== "out") {
    state.impactX = impact.x;
  }
  let word: string | null = null;
  if (replay.record.shielded && damage > 0) {
    word = T.shieldHit;
  } else if (head && damage > 0) {
    word = impact.item.sticky ? T.faceHit : T.headHit;
  }
  if (impact.kind !== "out") {
    spawnImpact(state.effects, {
      x: impact.x,
      y: GROUND_Y - impact.y,
      look: impact.item.look,
      color: impact.item.color,
      kind: impact.kind,
      damage,
      word,
    });
    options.sound.play(impact.item.look);
  }
  if (head || impact.kind === "body") {
    if (damage > 0) {
      state.poses[target] = { kind: "hit", since: clock };
      options.sound.play("ouch");
    }
    if (impact.item.sticky) {
      state.stains[target] = [
        ...state.stains[target],
        {
          color: impact.item.color,
          onHead: head,
          offset: Math.random() * 2 - 1,
        },
      ].slice(-MAX_STAINS);
    }
  }
}

/** The life points each bar shows right now. */
function shownHp(state: ViewState, game: DuelGame): number[] {
  const replay = state.replay;
  return game.players.map((player, seat) => {
    let hp = player.hp;
    if (replay !== null) {
      const record = replay.record;
      if (seat !== record.by) {
        hp += record.damage - replay.damageShown;
      }
      if (record.burnSeat === seat && !replay.burnShown) {
        hp += record.burn;
      }
    }
    return hp;
  });
}

/** Lets the white trails behind the bars run down after a hit. */
function stepTrails(
  state: ViewState,
  game: DuelGame,
  clock: number,
  dt: number,
): void {
  shownHp(state, game).forEach((hp, seat) => {
    if (hp < state.lastHp[seat]) {
      state.trailHold[seat] = clock + TRAIL_HOLD_SECONDS;
    }
    if (hp >= state.trail[seat]) {
      state.trail[seat] = hp;
    } else if (clock >= state.trailHold[seat]) {
      state.trail[seat] = Math.max(hp, state.trail[seat] - TRAIL_SPEED * dt);
    }
    state.lastHp[seat] = hp;
  });
}

/** Builds the frame to draw from the view and the match. */
function sceneOf(
  state: ViewState,
  latest: Latest,
  clock: number,
): Omit<Scene, "hudScale"> {
  const { game, names } = latest.options;
  const replay = state.replay;
  const aiming = latest.canAim && replay === null && game.phase === "throw";
  const hp = shownHp(state, game);
  const fighters = game.players.map((_, seat) => {
    const memory = state.poses[seat];
    let pose: Pose = {
      kind: memory.kind,
      t: clock - memory.since,
      angle: replay?.record.input.angle ?? latest.angle,
    };
    if (aiming && seat === game.turn) {
      pose = { kind: "aim", t: 0, angle: latest.angle };
    } else if (
      (pose.kind === "throw" || pose.kind === "hit") &&
      pose.t > POSE_SECONDS
    ) {
      pose = { ...pose, kind: "idle" };
    }
    return {
      pose,
      stains: state.stains[seat],
      hp: hp[seat],
      trail: state.trail[seat],
    };
  });

  let aim: SceneAim | null = null;
  let held: ItemId | null = null;
  if (aiming) {
    const seat = game.turn;
    const thrower = characterById(game.players[seat].character ?? "koch");
    const power =
      latest.chargeStart === null ? null : chargeAt(latest.chargeStart, clock);
    let points: readonly number[] = [];
    if (power !== null && !latest.blind && latest.options.aimDots) {
      points = previewFor(state, game, seat, latest, power);
    }
    aim = { seat, angle: latest.angle, points, power };
    held = itemFor(thrower, latest.armed).id;
  }

  const flightStep =
    replay === null
      ? null
      : Math.floor((clock - replay.start) * STEPS_PER_SECOND);
  return {
    game,
    clock,
    fighters,
    flight:
      replay !== null && flightStep !== null && flightStep >= 0
        ? { flight: replay.flight, step: flightStep }
        : null,
    aim,
    held,
    wind: replay?.record.wind ?? game.wind,
    windHidden: aiming && latest.blind,
    camera: cameraOf(state, latest.options),
    viewHeight: latest.options.viewHeight,
    marked: game.phase === "throw" && replay === null ? game.turn : null,
    effects: state.effects,
    names,
  };
}

/** The aiming arc for the current strength, worked out only when it changes. */
function previewFor(
  state: ViewState,
  game: DuelGame,
  seat: number,
  latest: Latest,
  power: number,
): readonly number[] {
  const rounded = Math.round(power * POWER_PRECISION) / POWER_PRECISION;
  const key = `${seat}|${latest.angle}|${rounded}|${latest.armed}|${game.round}|${game.wind}`;
  if (key !== state.previewKey) {
    const kind =
      latest.armed === null ? undefined : ABILITIES[latest.armed].preview;
    state.previewKey = key;
    state.preview = previewPath(
      flightSetup(
        game,
        seat,
        { angle: latest.angle, power: rounded, ability: latest.armed },
        game.wind,
      ),
      kind === undefined ? PREVIEW_SHARE : 1,
      kind === "true",
    );
  }
  return state.preview;
}

/**
 * The camera as the frame should show it.
 *
 * @param state - the view, with the camera's position
 * @param options - the owner's settings
 * @returns position, lift and zoom
 */
function cameraOf(state: ViewState, options: ArenaOptions): Camera {
  return {
    x: state.cam.x,
    lift: state.cam.lift,
    zoom: zoomOf(options.cameraMode),
  };
}

/** How far the camera is zoomed in each mode. */
function zoomOf(mode: CameraMode): number {
  return mode === "overview" ? VIEW_WIDTH / (WORLD_WIDTH + OVERVIEW_MARGIN) : 1;
}

/**
 * Where the camera rests when nothing is flying.
 *
 * @param game - the match
 * @param impactX - where the last throw came down, if anywhere
 * @returns the world x to centre on
 * @remarks
 * By the thrower on turn, a little ahead of them so the arc has room; at the
 * end of the match by the landing, where the knocked-out fighter lies.
 */
function restX(game: DuelGame, impactX: number | null): number {
  let x = FIGHTER_X[game.turn] + facing(game.turn) * AIM_LEAD;
  if (game.phase === "over") {
    x = impactX ?? FIGHTER_X[1 - (game.winner ?? 0)];
  }
  return x;
}

/**
 * Moves the camera on by one frame.
 *
 * @returns whether it is at rest where the next turn wants it
 */
function stepCamera(
  state: ViewState,
  options: ArenaOptions,
  clock: number,
  dt: number,
): boolean {
  const zoom = zoomOf(options.cameraMode);
  const replay = state.replay;
  let targetX = restX(options.game, state.impactX);
  let highest = 0;
  let rate = PAN_RATE;
  if (replay !== null) {
    const step = Math.floor((clock - replay.start) * STEPS_PER_SECOND);
    const flying = inFlight(replay.flight, step);
    if (flying.length > 0) {
      targetX = flying.reduce((sum, p) => sum + p.x, 0) / flying.length;
      highest = Math.max(...flying.map((p) => p.y));
      rate = FOLLOW_RATE;
    } else if (step < 0) {
      targetX = state.cam.x;
    } else {
      targetX = state.impactX ?? targetX;
    }
  }
  if (options.cameraMode === "overview") {
    targetX = WORLD_WIDTH / 2;
  }
  const half = VIEW_WIDTH / 2 / zoom;
  targetX = Math.min(
    Math.max(targetX, half - EDGE_SLACK),
    WORLD_WIDTH - half + EDGE_SLACK,
  );
  const ground = groundScreenY(options.viewHeight, zoom);
  const targetLift = Math.max(0, highest - (ground - HEADROOM) / zoom);
  const ease = 1 - Math.exp(-rate * dt);
  state.cam.x += (targetX - state.cam.x) * ease;
  state.cam.lift += (targetLift - state.cam.lift) * ease;
  return Math.abs(state.cam.x - targetX) < ARRIVED && state.cam.lift < ARRIVED;
}

/** Where every piece still in the air is at a step, in world units. */
function inFlight(flight: Flight, step: number): { x: number; y: number }[] {
  const pieces: { x: number; y: number }[] = [];
  for (const track of flight.tracks) {
    const local = step - track.startStep;
    const last = track.points.length / 2 - 1;
    if (local >= 0 && local < last) {
      pieces.push({
        x: track.points[local * 2],
        y: track.points[local * 2 + 1],
      });
    }
  }
  return pieces;
}
