/**
 * Türchen 15 - Trixis Flugstunde: Trixi practises flying at dusk and swoops
 * through a course of golden star rings over the snowy forest.
 *
 * @module
 * @remarks
 * Trixi flies with momentum: the arrows push her, and she drifts on a bit
 * when let go. The rings come one by one; fly through all {@link RINGS} and
 * miss no more than {@link MISSES_ALLOWED}. From the middle of the course
 * on, some rings bob up and down.
 */
import type { Recipe } from "@/games/weihnachtsmann/audio/sounds";
import {
  drawFigure,
  drawGlow,
  drawHud,
  drawSprite,
  drawSpriteCentred,
  loadSheet,
} from "../kit/draw";
import { createEffects } from "../kit/effects";
import { createRandom } from "../kit/random";
import {
  MINI_W,
  type MiniDraw,
  type MiniEnv,
  type MiniGame,
  type MiniGameInstance,
  type MiniInput,
  type MiniStatus,
} from "../types";
import { SHEET_SRC, SPRITES } from "./sprites";

/** Rings in the course. */
const RINGS = 20;

/** Rings that may be missed; one more loses. */
const MISSES_ALLOWED = 3;

/** How fast the world goes by, logical px per second. */
const SPEED = 72;

/** Seconds between two rings, at the start and at the end. */
const GAP_SLOW = 1.75;
const GAP_FAST = 1.35;

/** Seconds before the first ring. */
const LEAD = 1.2;

/** How far up or down the next ring may be, logical px. */
const RING_STEP = 52;

/** Highest and lowest middle of a ring, logical px. */
const RING_HIGH = 40;
const RING_LOW = 140;

/** From this ring on some rings bob; how far and how fast (radians per second). */
const BOB_FROM = 8;
const BOB_CHANCE = 0.5;
const BOB_REACH = 12;
const BOB_SPEED = 2.2;

/** Trixi counts as through when her middle is this close to the ring's middle, logical px. */
const RING_REACH = 13;

/** Trixi's push, logical px per second squared, and how quickly she slows, per second. */
const PUSH = 340;
const DRAG = 2.4;

/** The box Trixi's middle stays in, logical px. */
const FLY_LEFT = 24;
const FLY_RIGHT = 210;
const FLY_TOP = 26;
const FLY_BOTTOM = 156;

/** How far the pointer must be for a full push, logical px. */
const POINTER_PULL = 24;

/** Trixi's middle above her feet, logical px. */
const BODY_LIFT = 16;

/** Where Trixi starts, logical px. */
const START = { x: 70, y: 90 } as const;

/** Parallax of the mountains, clouds and forest, share of the speed. */
const FAR = 0.15;
const MIDDLE = 0.3;
const NEAR = 0.7;

/** Where the mountains and the forest stand, logical px from the top. */
const MOUNTAINS_Y = 98;
const FOREST_Y = 135;

/** Seconds between two sparkles of Trixi's trail. */
const TRAIL_EVERY = 0.05;

/** Sparks of a passed ring. */
const RING_SPARKS = 18;

/** Shake on a missed ring, logical px. */
const SHAKE = 2;

/** Seconds the hint shows at the start. */
const HINT_TIME = 3.5;

/** From this many rings in a row the float shows the streak. */
const SERIES_FROM = 3;

/** Where the drifting clouds start and how high they float, logical px. */
const CLOUDS: readonly { readonly x: number; readonly y: number }[] = [
  { x: 0, y: 34 },
  { x: 140, y: 70 },
  { x: 250, y: 48 },
];

/** Pitches of the ring chime, Hz, climbing with the streak. */
/* eslint-disable @typescript-eslint/no-magic-numbers -- a rising scale in A major */
const CHIME_STEPS: readonly number[] = [
  659, 740, 831, 880, 988, 1109, 1245, 1319,
];
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** Trixi flaps this fast, frames per second: cruising and climbing hard. */
const FLAP_FPS = 7;
const FLAP_FAST = 12;

/** Where the hint sits, logical px from the top. */
const HINT_Y = 138;

/** One ring of the course. */
type Ring = {
  x: number;
  readonly base: number;
  readonly bob: boolean;
  readonly phase: number;
  state: "open" | "through" | "missed";
};

/** The minigame behind gate 15. */
export const GAME: MiniGame = {
  number: 15,
  id: "flugstunde",
  title: "Trixis Flugstunde",
  instructions: [
    "Trixi hat Flugstunde! Flieg mit ihr durch die goldenen Sternenringe.",
    "Trixi fliegt mit Schwung - lass rechtzeitig los, sonst saust sie am Ring vorbei.",
    `Flieg durch alle ${String(RINGS)} Ringe. ${String(MISSES_ALLOWED)} darfst du verpassen, beim nächsten ist die Stunde vorbei.`,
  ],
  controls:
    "Pfeile oder W A S D halten - oder Maus / Finger gedrückt halten, Trixi fliegt hin.",
  ready: true,
  create: (env) => createRun(env.seed, env.sound),
};

/** One run. */
function createRun(seed: number, sound: MiniEnv["sound"]): MiniGameInstance {
  const random = createRandom(seed);
  const effects = createEffects(random);
  const sheet = loadSheet(SHEET_SRC);
  const rings: Ring[] = [];
  let x: number = START.x;
  let y: number = START.y;
  let vx = 0;
  let vy = 0;
  let clock = 0;
  let scroll = 0;
  let nextIn = LEAD;
  let lastY: number = START.y;
  let through = 0;
  let missed = 0;
  let streak = 0;
  let trail = 0;
  let status: MiniStatus = "running";

  const send = () => {
    const share = rings.length / RINGS;
    lastY = Math.max(
      RING_HIGH,
      Math.min(RING_LOW, lastY + random.range(-RING_STEP, RING_STEP)),
    );
    rings.push({
      x: MINI_W + RING_REACH,
      base: lastY,
      bob: rings.length >= BOB_FROM && random.chance(BOB_CHANCE),
      phase: random.range(0, Math.PI * 2),
      state: "open",
    });
    nextIn = GAP_SLOW + (GAP_FAST - GAP_SLOW) * share;
  };

  const fly = (input: MiniInput, dt: number) => {
    let ax = input.axisX;
    let ay = input.axisY;
    if (ax === 0 && ay === 0 && input.pointerDown && input.pointer !== null) {
      ax = clamp((input.pointer.x - x) / POINTER_PULL, -1, 1);
      ay = clamp((input.pointer.y - y) / POINTER_PULL, -1, 1);
    }
    vx = (vx + ax * PUSH * dt) * (1 - DRAG * dt);
    vy = (vy + ay * PUSH * dt) * (1 - DRAG * dt);
    x += vx * dt;
    y += vy * dt;
    if (x < FLY_LEFT || x > FLY_RIGHT) {
      x = clamp(x, FLY_LEFT, FLY_RIGHT);
      vx = 0;
    }
    if (y < FLY_TOP || y > FLY_BOTTOM) {
      y = clamp(y, FLY_TOP, FLY_BOTTOM);
      vy = 0;
    }
  };

  const judge = (ring: Ring) => {
    const middle = ringY(ring, clock);
    if (Math.abs(middle - y) < RING_REACH) {
      ring.state = "through";
      through += 1;
      streak += 1;
      sound(chime(streak));
      effects.burst(ring.x, middle, {
        count: RING_SPARKS,
        colors: ["#ffe27a", "#fff4b0", "#ff9ad0", "#ffffff"],
      });
      effects.float(
        streak >= SERIES_FROM ? `${String(streak)}er Serie!` : "+1",
        ring.x,
        middle - RING_REACH * 2,
      );
    } else {
      ring.state = "missed";
      missed += 1;
      streak = 0;
      sound("miss");
      effects.shake(SHAKE);
      effects.float("Verpasst!", ring.x, middle - RING_REACH * 2, "#ff9a9a");
    }
  };

  return {
    step(input, dt) {
      if (status === "running") {
        clock += dt;
        scroll += SPEED * dt;
        fly(input, dt);
        nextIn -= dt;
        if (nextIn <= 0 && rings.length < RINGS) {
          send();
        }
        for (const ring of rings) {
          const before = ring.x;
          ring.x -= SPEED * dt;
          if (ring.state === "open" && before >= x && ring.x < x) {
            judge(ring);
          }
        }
        trail -= dt;
        if (trail <= 0) {
          trail = TRAIL_EVERY;
          effects.burst(x - BODY_LIFT / 2, y + 2, {
            count: 1,
            speed: 12,
            gravity: 10,
            life: 0.6,
            size: 1,
            colors: ["#ff9ad0", "#ffffff", "#ffe27a"],
          });
        }
        if (missed > MISSES_ALLOWED) {
          status = "lost";
        } else if (through + missed >= RINGS) {
          status = "won";
        }
      }
      effects.update(dt);
      return status;
    },
    draw(g) {
      const shake = effects.offset();
      g.ctx.save();
      g.ctx.translate(shake.x, shake.y);
      drawSky(g, sheet, scroll);
      for (const ring of rings) {
        drawRingHalf(g.ctx, sheet, ring, clock, "back");
      }
      drawFigure(
        g.ctx,
        g.art,
        "trixi",
        x,
        y + BODY_LIFT,
        "fly",
        "side",
        g.time * (Math.abs(vy) > SPEED ? FLAP_FAST : FLAP_FPS),
      );
      for (const ring of rings) {
        drawRingHalf(g.ctx, sheet, ring, clock, "front");
      }
      g.ctx.restore();
      effects.draw(g);
      drawHud(g, {
        score: through,
        goal: RINGS,
        scoreLabel: "Ringe",
        lives: Math.max(0, MISSES_ALLOWED - missed),
        maxLives: MISSES_ALLOWED,
      });
      drawCourse(g, (through + missed) / RINGS);
      if (clock < HINT_TIME) {
        g.text("Flieg durch die Ringe!", MINI_W / 2, HINT_Y, {
          size: 8,
          bold: true,
          align: "center",
          baseline: "middle",
          color: "#fff4dc",
          outline: "#2a1430",
          alpha: Math.min(1, (HINT_TIME - clock) * 2),
        });
      }
    },
    summary() {
      return missed > MISSES_ALLOWED
        ? `${String(through)} Ringe geschafft, aber ${String(missed)} verpasst.`
        : `${String(through)} von ${String(RINGS)} Ringen - Trixi hat die Flugstunde bestanden!`;
    },
  };
}

/** A number kept between two limits. */
function clamp(value: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, value));
}

/** The middle of a ring now, logical px from the top. */
function ringY(ring: Ring, clock: number): number {
  return (
    ring.base +
    (ring.bob ? Math.sin(clock * BOB_SPEED + ring.phase) * BOB_REACH : 0)
  );
}

/* eslint-disable @typescript-eslint/no-magic-numbers -- the sound: a scale
   of pitches in Hz, times in seconds, loudness shares */
/** The chime of a ring, a step higher for every ring in a row. */
function chime(streak: number): Recipe {
  const pitch = CHIME_STEPS[Math.min(streak, CHIME_STEPS.length) - 1];
  return {
    tones: [
      ["triangle", pitch, pitch, 0.18, 0, 0.6],
      ["sine", pitch * 1.5, pitch * 1.5, 0.22, 0.05, 0.35],
    ],
    noise: [[0.06, 0, 7000, 0.2]],
  };
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** The sky, mountains, drifting clouds and the forest, moved by the scroll. */
function drawSky(g: MiniDraw, sheet: HTMLImageElement, scroll: number): void {
  const ctx = g.ctx;
  drawSprite(ctx, sheet, SPRITES.sky, 0, 0);
  tile(ctx, sheet, SPRITES.mountains, scroll * FAR, MOUNTAINS_Y);
  const cloud = SPRITES.cloud;
  const span = MINI_W + cloud[2];
  CLOUDS.forEach((place) => {
    const cx = span - ((scroll * MIDDLE + place.x) % span);
    drawSprite(ctx, sheet, cloud, Math.floor(cx - cloud[2]), place.y);
  });
  tile(ctx, sheet, SPRITES.forest, scroll * NEAR, FOREST_Y);
}

/* eslint-disable @typescript-eslint/no-magic-numbers -- scene layout and
   offsets, picked by eye */
/** One half of a ring: the back before Trixi, the front after her. */
function drawRingHalf(
  ctx: CanvasRenderingContext2D,
  sheet: HTMLImageElement,
  ring: Ring,
  clock: number,
  half: "back" | "front",
): void {
  const middle = ringY(ring, clock);
  const lit = ring.state === "through";
  const rect =
    half === "back"
      ? lit
        ? SPRITES.ringBackLit
        : SPRITES.ringBack
      : lit
        ? SPRITES.ringFrontLit
        : SPRITES.ringFront;
  if (half === "back" && ring.state !== "missed") {
    drawGlow(ctx, ring.x, middle, 22, "255, 220, 120", lit ? 0.45 : 0.18);
  }
  ctx.globalAlpha = ring.state === "missed" ? 0.35 : 1;
  drawSpriteCentred(ctx, sheet, rect, ring.x, middle);
  ctx.globalAlpha = 1;
}

/** A picture repeated sideways, moved left by an offset. */
function tile(
  ctx: CanvasRenderingContext2D,
  sheet: HTMLImageElement,
  rect: readonly [number, number, number, number],
  offset: number,
  y: number,
): void {
  const w = rect[2];
  for (let x = -(offset % w); x < MINI_W; x += w) {
    drawSprite(ctx, sheet, rect, Math.floor(x), y);
  }
}

/** A thin bar under the HUD: how much of the course is flown. */
function drawCourse(g: MiniDraw, share: number): void {
  const ctx = g.ctx;
  ctx.fillStyle = "rgba(20, 10, 26, 0.6)";
  ctx.fillRect(100, 16, 120, 3);
  ctx.fillStyle = "#ff9ad0";
  ctx.fillRect(100, 16, 120 * Math.min(1, share), 3);
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
