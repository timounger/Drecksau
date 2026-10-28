/**
 * Türchen 26 - Das Geheimnis des Weihnachtsmanns, the finale: Gilfi sneaks
 * through the dark workshop at night, gathers three golden keys and opens
 * the golden door - while Grantelbart, Gugor and the fox keep watch.
 *
 * @module
 * @remarks
 * Every guard looks ahead with a cone of light that walls and furniture
 * stop; standing in it fills a warning, and a full warning means caught -
 * back to the start, one heart less, keys kept. Piles of presents hide
 * Gilfi completely. Creaking boards make the guards turn round, unless
 * Gilfi sneaks. Behind the golden door waits Santa's secret.
 */
import type { Recipe } from "@/games/weihnachtsmann/audio/sounds";
import { loadSheet } from "../kit/draw";
import { createEffects } from "../kit/effects";
import { createRandom } from "../kit/random";
import {
  MINI_H,
  MINI_W,
  type MiniEnv,
  type MiniGame,
  type MiniGameInstance,
  type MiniInput,
  type MiniStatus,
} from "../types";
import {
  GUARDS,
  LANTERN,
  LEVEL_H,
  LEVEL_W,
  TILE,
  clearLine,
  find,
  solidAt,
  tileAt,
} from "./level";
import {
  drawRun,
  type Guard,
  type Phase,
  type Player,
  type RunView,
  type Watcher,
} from "./scene";
import { SHEET_SRC } from "./sprites";

/** Keys to gather. */
const KEYS = 3;

/** Seconds on the clock. */
const TIME = 120;

/** Times Gilfi may be caught. */
const LIVES = 3;

/** Gilfi's speed walking and sneaking, logical px per second. */
const WALK = 58;
const SNEAK = 28;

/** A stick pushed less than this far, or a finger this close, sneaks. */
const SNEAK_AXIS = 0.6;
const SNEAK_FINGER = 26;

/** Half of Gilfi's feet for bumping into things, logical px. */
const FEET_HALF = 5;
const FEET_UP = 4;

/** How fast the warning fills while seen and empties when not, per second. */
const ALERT_RISE = 2.4;
const ALERT_FALL = 1.2;

/** Guards' pause at each corner of their round, seconds, and how far they look round. */
const PAUSE = 1.2;
const LOOK_SWEEP = 0.7;

/** How fast a guard turns, radians per second. */
const TURN = 4;

/** How far a creak carries, logical px, and how long a guard stares at it, seconds. */
const NOISE_RANGE = 120;
const HEAR_TIME = 2.6;

/** Seconds a creak echoes on screen. */
const NOISE_SHOW = 0.8;

/** How close Gilfi must come to a key, logical px. */
const PICK = 11;

/** The column where the golden door's two halves meet. */
const DOOR_COLUMN = 18;

/** The golden door: the middle of its front, logical px, and how near counts. */
const DOOR_X = DOOR_COLUMN * TILE;
const DOOR_FRONT_Y = 2 * TILE + FEET_UP + 2;
const DOOR_NEAR = 14;

/** Seconds between two reminders that keys are missing. */
const DOOR_NAG = 2.2;

/** The opening: the camera's flight from the door to Gilfi, seconds. */
const INTRO = 2.6;

/** Seconds of being caught before going back to the start. */
const CAUGHT = 1.2;

/** Seconds of the secret behind the door before the run counts as won. */
const SECRET = 6;

/** How quickly the camera follows, per second. */
const CAMERA_EASE = 5;

/** Middle of the view below the HUD bar, logical px. */
const VIEW_MIDDLE_Y = 97;

/** The camera may look this far above the workshop, so the top wall clears the HUD. */
const CAMERA_TOP = -14;

/** Walk animation, frames per logical px. */
const STRIDE = 0.14;

/** Floating texts start this far above Gilfi, logical px. */
const FLOAT_LIFT = 26;

/** Size of the "Erwischt!" text, logical px. */
const CAUGHT_SIZE = 12;

/** Smoothstep's first factor, for the camera's flight. */
const SMOOTH_A = 3;

/** Shake when caught, logical px. */
const SHAKE = 3;

/** Sparks of a key and of the opened door. */
const KEY_BURST = 26;
const DOOR_BURST = 60;

/* eslint-disable @typescript-eslint/no-magic-numbers -- the recipes: pitches
   in Hz, times in seconds, loudness shares */
/** A floorboard creaking. */
const CREAK: Recipe = {
  tones: [
    ["sawtooth", 180, 260, 0.12, 0, 0.25],
    ["sawtooth", 240, 150, 0.16, 0.1, 0.2],
  ],
};

/** The guard's warning rising. */
const HUH: Recipe = { tones: [["triangle", 500, 800, 0.15, 0, 0.4]] };

/** Caught! */
const CAUGHT_SOUND: Recipe = {
  tones: [
    ["square", 660, 660, 0.08, 0, 0.3],
    ["square", 440, 440, 0.08, 0.1, 0.3],
    ["triangle", 220, 110, 0.4, 0.2, 0.6],
  ],
  noise: [[0.2, 0.2, 800, 0.4]],
};

/** A key turning in the golden door. */
const UNLOCK: Recipe = {
  tones: [
    ["square", 300, 300, 0.05, 0, 0.3],
    ["square", 500, 500, 0.05, 0.12, 0.3],
    ["triangle", 784, 784, 0.3, 0.3, 0.5],
    ["triangle", 1047, 1047, 0.5, 0.45, 0.5],
    ["sine", 1568, 1568, 0.8, 0.6, 0.3],
  ],
  noise: Array.from(
    { length: 8 },
    (_, k) => [0.08, 0.6 + k * 0.09, 7000, 0.35] as const,
  ),
};
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** The minigame behind gate 26. */
export const GAME: MiniGame = {
  number: 26,
  id: "geheimnis",
  title: "Das große Geheimnis",
  instructions: [
    `Schleich mit Gilfi durch die nächtliche Werkstatt: Hol die ${String(KEYS)} goldenen Schlüssel, dann ab zur goldenen Tür!`,
    "Meide die Lichtkegel der Wachen - in Geschenkstapeln bist du unsichtbar. Knarrende Dielen verraten dich, außer du schleichst.",
  ],
  controls: "Pfeile laufen, Umschalt oder R schleicht - oder Finger führt.",
  ready: true,
  create: (env) => createRun(env.seed, env.sound),
};

/** One run. */
function createRun(seed: number, sound: MiniEnv["sound"]): MiniGameInstance {
  const random = createRandom(seed);
  const effects = createEffects(random);
  const sheet = loadSheet(SHEET_SRC);
  const start = find("P")[0];
  const keys = find("K").map((spot) => ({ ...spot, taken: false }));
  const piles = find("H");
  const guards: Guard[] = GUARDS.map(freshGuard);
  const lantern: Watcher = {
    x: (LANTERN.tx + 1 / 2) * TILE,
    y: (LANTERN.ty + 1 / 2) * TILE,
    angle: LANTERN.start,
    range: LANTERN.range,
    half: LANTERN.half,
    alert: 0,
  };
  const player: Player = {
    x: start.x,
    y: start.y,
    stride: 0,
    facing: "up",
    mirror: false,
    moving: false,
    sneaking: false,
    hidden: false,
  };
  const noises: { x: number; y: number; age: number }[] = [];
  const camera = { x: 0, y: 0 };
  let phase: Phase = "intro";
  let phaseTime = 0;
  let clock = 0;
  let left = TIME;
  let lives = LIVES;
  let nag = 0;
  let lastTile = "";
  let status: MiniStatus = "running";

  const aim = (x: number, y: number, ease: number) => {
    const tx = Math.max(0, Math.min(LEVEL_W - MINI_W, x - MINI_W / 2));
    const ty = Math.max(
      CAMERA_TOP,
      Math.min(LEVEL_H - MINI_H, y - VIEW_MIDDLE_Y),
    );
    camera.x += (tx - camera.x) * ease;
    camera.y += (ty - camera.y) * ease;
  };
  aim(DOOR_X, DOOR_FRONT_Y, 1);

  const walk = (input: MiniInput, dt: number) => {
    let dx = input.axisX;
    let dy = input.axisY;
    let slow = input.held.has("alt");
    if (dx !== 0 || dy !== 0) {
      slow = slow || Math.hypot(dx, dy) < SNEAK_AXIS;
    } else if (input.pointerDown && input.pointer !== null) {
      const wx = input.pointer.x + camera.x - player.x;
      const wy = input.pointer.y + camera.y - (player.y - FEET_UP * 2);
      const d = Math.hypot(wx, wy);
      if (d > FEET_HALF) {
        dx = wx / d;
        dy = wy / d;
        slow = slow || d < SNEAK_FINGER;
      }
    }
    const length = Math.hypot(dx, dy);
    player.moving = length > 0;
    player.sneaking = slow;
    if (length > 0) {
      const speed = (slow ? SNEAK : WALK) * dt;
      const sx = (dx / Math.max(1, length)) * speed;
      const sy = (dy / Math.max(1, length)) * speed;
      if (free(player.x + sx, player.y)) {
        player.x += sx;
      }
      if (free(player.x, player.y + sy)) {
        player.y += sy;
      }
      player.stride += Math.hypot(sx, sy) * STRIDE;
      if (Math.abs(dx) > Math.abs(dy)) {
        player.facing = "side";
        player.mirror = dx < 0;
      } else {
        player.facing = dy < 0 ? "up" : "down";
      }
    }
    const here = tileAt(player.x, player.y);
    const key = `${String(Math.floor(player.x / TILE))},${String(Math.floor(player.y / TILE))}`;
    player.hidden = here === "H";
    if (key !== lastTile) {
      lastTile = key;
      if (here === "n" && !slow) {
        creak();
      }
    }
  };

  const creak = () => {
    sound(CREAK);
    noises.push({ x: player.x, y: player.y, age: 0 });
    effects.float(
      "Knarz!",
      player.x - camera.x,
      player.y - camera.y - FLOAT_LIFT,
      "#ffb07a",
    );
    for (const guard of guards) {
      if (Math.hypot(guard.x - player.x, guard.y - player.y) < NOISE_RANGE) {
        guard.heard = HEAR_TIME;
        guard.heardAt = { x: player.x, y: player.y };
      }
    }
  };

  const gather = () => {
    for (const key of keys) {
      if (
        !key.taken &&
        Math.hypot(key.x - player.x, key.y - (player.y - FEET_UP)) < PICK
      ) {
        key.taken = true;
        const count = keys.filter((k) => k.taken).length;
        sound("coin");
        effects.burst(key.x - camera.x, key.y - camera.y, { count: KEY_BURST });
        effects.float(
          count === KEYS
            ? "Alle Schlüssel! Zur goldenen Tür!"
            : `Schlüssel ${String(count)} von ${String(KEYS)}`,
          player.x - camera.x,
          player.y - camera.y - FLOAT_LIFT,
        );
      }
    }
    const atDoor =
      Math.abs(player.x - DOOR_X) < DOOR_NEAR &&
      player.y < DOOR_FRONT_Y + DOOR_NEAR / 2;
    if (atDoor && keys.every((k) => k.taken)) {
      enter("secret");
      sound(UNLOCK);
    } else if (atDoor && nag <= 0) {
      nag = DOOR_NAG;
      sound("bump");
      const missing = keys.filter((k) => !k.taken).length;
      effects.float(
        `Die Tür ist zu - noch ${String(missing)} Schlüssel!`,
        player.x - camera.x,
        player.y - camera.y - FLOAT_LIFT,
        "#ffe9a8",
      );
    }
  };

  const watch = (dt: number) => {
    let caught = false;
    for (const guard of guards) {
      moveGuard(guard, dt);
      caught = look(guard, dt) || caught;
    }
    lantern.angle = LANTERN.start + LANTERN.turn * clock;
    caught = look(lantern, dt) || caught;
    if (caught) {
      enter("caught");
      lives -= 1;
      sound(CAUGHT_SOUND);
      effects.shake(SHAKE);
      effects.float(
        "Erwischt!",
        player.x - camera.x,
        player.y - camera.y - FLOAT_LIFT,
        "#ff7a7a",
        CAUGHT_SIZE,
      );
    }
  };

  const look = (watcher: Watcher, dt: number) => {
    const seen = sees(watcher, player);
    const before = watcher.alert;
    watcher.alert = seen
      ? Math.min(1, watcher.alert + ALERT_RISE * dt)
      : Math.max(0, watcher.alert - ALERT_FALL * dt);
    if (before === 0 && watcher.alert > 0) {
      sound(HUH);
    }
    return watcher.alert >= 1;
  };

  const enter = (next: Phase) => {
    phase = next;
    phaseTime = 0;
  };

  const restart = () => {
    player.x = start.x;
    player.y = start.y;
    player.facing = "up";
    lastTile = "";
    guards.forEach((guard, k) => {
      Object.assign(guard, freshGuard(GUARDS[k]));
    });
    lantern.alert = 0;
  };

  const advance = (input: MiniInput, dt: number) => {
    switch (phase) {
      case "intro": {
        const t = Math.min(1, phaseTime / INTRO);
        const ease = t * t * (SMOOTH_A - 2 * t);
        aim(
          DOOR_X + (player.x - DOOR_X) * ease,
          DOOR_FRONT_Y + (player.y - DOOR_FRONT_Y) * ease,
          1,
        );
        if (phaseTime >= INTRO || input.pressed.has("action")) {
          enter("play");
        }
        break;
      }
      case "play":
        left -= dt;
        nag -= dt;
        walk(input, dt);
        gather();
        if (phase === "play") {
          watch(dt);
        }
        aim(player.x, player.y - FEET_UP * 2, Math.min(1, CAMERA_EASE * dt));
        if (phase === "play" && left <= 0) {
          status = "lost";
        }
        break;
      case "caught":
        if (phaseTime >= CAUGHT) {
          if (lives <= 0) {
            status = "lost";
          } else {
            restart();
            enter("play");
          }
        }
        break;
      default:
        aim(DOOR_X, DOOR_FRONT_Y, Math.min(1, CAMERA_EASE * dt));
        if (phaseTime - dt < 1 && phaseTime >= 1) {
          sound("fanfare");
          effects.burst(MINI_W / 2, MINI_H / 2, {
            count: DOOR_BURST,
            speed: 110,
          });
        }
        if (phaseTime >= SECRET) {
          status = "won";
        }
    }
  };

  return {
    step(input, dt) {
      if (status === "running") {
        clock += dt;
        phaseTime += dt;
        advance(input, dt);
        for (const noise of noises) {
          noise.age += dt;
        }
        noises.splice(
          0,
          noises.filter((noise) => noise.age > NOISE_SHOW).length,
        );
      }
      effects.update(dt);
      return status;
    },
    draw(g) {
      const view: RunView = {
        player,
        guards,
        lantern,
        keys,
        piles,
        noises,
        camera,
        phase,
        phaseTime,
        keysTaken: keys.filter((k) => k.taken).length,
        keysTotal: KEYS,
        left,
        lives,
        maxLives: LIVES,
        secretLength: SECRET,
      };
      drawRun(g, sheet, effects, view);
    },
    summary() {
      const taken = keys.filter((k) => k.taken).length;
      return status === "won"
        ? "Die goldene Tür ist offen - du kennst jetzt das Geheimnis!"
        : `${String(taken)} von ${String(KEYS)} Schlüsseln gefunden.`;
    },
  };
}

/**
 * Whether Gilfi's feet fit at a place without touching anything solid.
 *
 * @param x - feet, logical px
 * @param y - feet, logical px
 * @returns true when free
 */
function free(x: number, y: number): boolean {
  return (
    !solidAt(x - FEET_HALF, y - FEET_UP) &&
    !solidAt(x + FEET_HALF, y - FEET_UP) &&
    !solidAt(x - FEET_HALF, y) &&
    !solidAt(x + FEET_HALF, y)
  );
}

/** A guard at the start of its round. */
function freshGuard(spec: (typeof GUARDS)[number]): Guard {
  const [tx, ty] = spec.route[0];
  const [nx, ny] = spec.route[1];
  return {
    spec,
    x: (tx + 1 / 2) * TILE,
    y: (ty + 1 / 2) * TILE,
    leg: 1,
    angle: Math.atan2(ny - ty, nx - tx),
    facing: Math.atan2(ny - ty, nx - tx),
    range: spec.range,
    half: spec.half,
    alert: 0,
    look: 0,
    pause: 0,
    heard: 0,
    heardAt: null,
    stride: 0,
  };
}

/**
 * Moves a guard along its round: walking, looking round at the corners,
 * or staring at a creak it heard.
 *
 * @param guard - the guard
 * @param dt - seconds
 */
function moveGuard(guard: Guard, dt: number): void {
  const [tx, ty] = guard.spec.route[guard.leg];
  const goalX = (tx + 1 / 2) * TILE;
  const goalY = (ty + 1 / 2) * TILE;
  let want = Math.atan2(goalY - guard.y, goalX - guard.x);
  if (guard.heard > 0 && guard.heardAt !== null) {
    guard.heard -= dt;
    want = Math.atan2(guard.heardAt.y - guard.y, guard.heardAt.x - guard.x);
    guard.look = 0;
  } else if (guard.pause > 0) {
    guard.pause -= dt;
    guard.look = Math.sin((1 - guard.pause / PAUSE) * Math.PI * 2) * LOOK_SWEEP;
  } else {
    guard.look = 0;
    const d = Math.hypot(goalX - guard.x, goalY - guard.y);
    const step = guard.spec.speed * dt;
    if (d <= step) {
      guard.x = goalX;
      guard.y = goalY;
      guard.leg = (guard.leg + 1) % guard.spec.route.length;
      guard.pause = PAUSE;
    } else {
      guard.x += ((goalX - guard.x) / d) * step;
      guard.y += ((goalY - guard.y) / d) * step;
      guard.stride += step * STRIDE;
    }
  }
  const turn = Math.atan2(
    Math.sin(want - guard.facing),
    Math.cos(want - guard.facing),
  );
  guard.facing += Math.sign(turn) * Math.min(Math.abs(turn), TURN * dt);
  guard.angle = guard.facing + guard.look;
}

/**
 * Whether a watcher's light falls on Gilfi.
 *
 * @param watcher - a guard or the lantern
 * @param player - Gilfi
 * @returns true when seen
 */
function sees(watcher: Watcher, player: Player): boolean {
  const px = player.x;
  const py = player.y - FEET_UP;
  const d = Math.hypot(px - watcher.x, py - watcher.y);
  const toward = Math.atan2(py - watcher.y, px - watcher.x);
  const off = Math.atan2(
    Math.sin(toward - watcher.angle),
    Math.cos(toward - watcher.angle),
  );
  return (
    !player.hidden &&
    d < watcher.range &&
    Math.abs(off) < watcher.half &&
    clearLine(watcher.x, watcher.y, px, py)
  );
}
