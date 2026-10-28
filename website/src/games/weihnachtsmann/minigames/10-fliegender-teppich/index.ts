/**
 * Türchen 10 - Der fliegende Teppich: Jordi flies a magic carpet through a
 * winding ice gorge, seen from above, and threads it through gates of ice
 * crystals.
 *
 * @module
 * @remarks
 * The gorge scrolls down on its own and slowly speeds up. Fly through
 * {@link GOAL} of the {@link GATES} gates; the walls are solid, and touching
 * one costs a heart. With no hearts left, or too many gates missed to still
 * reach the goal, the run is lost.
 */
import { snap } from "@/games/weihnachtsmann/components/sprites";
import type { Recipe } from "@/games/weihnachtsmann/audio/sounds";
import {
  HUD_H,
  drawFigure,
  drawGlow,
  drawHud,
  drawSprite,
  drawSpriteCentred,
  loadSheet,
} from "../kit/draw";
import { createEffects } from "../kit/effects";
import { createRandom, type Random } from "../kit/random";
import {
  MINI_H,
  MINI_W,
  type MiniDraw,
  type MiniEnv,
  type MiniGame,
  type MiniGameInstance,
  type MiniInput,
  type MiniPoint,
  type MiniStatus,
} from "../types";
import { SHEET_SRC, SPRITES, type SpriteName } from "./sprites";

/** Gates to fly through, and gates in the gorge. */
const GOAL = 15;
const GATES = 18;

/** Hearts: touches of the walls. */
const LIVES = 3;

/** Where the first gate stands and the distance between two, world px. */
const FIRST_GATE = 240;
const GATE_STEP = 150;

/** The gorge runs on this far past the last gate, world px. */
const RUN_OUT = 160;

/** Flying speed at the start and at the end, world px per second. */
const SPEED_START = 58;
const SPEED_END = 86;

/** Half the gorge's width at the start and at the end, logical px. */
const WIDE_START = 60;
const WIDE_END = 44;

/** Half a gate's opening at the start and at the end, logical px. */
const GAP_START = 22;
const GAP_END = 17;

/** The gorge's middle: a bend every so often, how far it may move. */
const BEND_STEP = 110;
const BEND_MOVE = 55;

/** Bends at the start that run straight. */
const STRAIGHT = 3;

/** Walls keep this far from the field's edge, logical px. */
const MARGIN = 10;

/** A gate's opening keeps this far from the walls, logical px. */
const GATE_INSET = 8;

/** Where the carpet flies on the screen, logical px from the top. */
const CARPET_Y = 136;

/** Half the carpet's width, and how far its ends reach, logical px. */
const CARPET_HALF = 10;
const CARPET_NOSE = 16;
const CARPET_TAIL = 12;

/** Sideways: top speed, logical px per second, and how fast it gets there. */
const SIDE_SPEED = 130;
const SIDE_ACCEL = 10;

/** The pointer steers while it moved within this long, seconds. */
const POINTER_HOLD = 1.2;

/** Seconds the carpet cannot be hurt after touching a wall, and its bounce. */
const SAFE = 1.6;
const BOUNCE = 110;

/** The cliff face along each wall, logical px. */
const CLIFF = 6;

/** Share of firs among the things on the rim. */
const FIR_SHARE = 0.75;

/** Fir trees and rocks on the rim: one every so far, world px. */
const DECOR_STEP = 26;

/** Carpet waving frames per second, and how much it leans. */
const WAVE_RATE = 8;
const LEAN = 0.003;

/** Blink speed while safe, per second. */
const BLINK = 14;

/** Shake on a wall, logical px. */
const SHAKE = 3;

/** Bursts. */
const GATE_BURST = 18;

/** World px in a screen row: one logical px. */
const ROW = 1;

/** Plateau speckles: one row in so many gets one. */
const SPECKLE_EVERY = 5;

/** Large odd numbers for hashing world rows into speckles. */
const HASH_A = 2654435761;
const HASH_B = 40503;

/** The carpet's waving frames. */
const CARPET_FRAMES: readonly SpriteName[] = ["carpet0", "carpet1", "carpet2"];

/** A bright chime for a gate. */
const CHIME: Recipe = {
  tones: [
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- pitches in Hz, seconds, loudness
    ["triangle", 1175, 1175, 0.1, 0, 0.5],
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- pitches in Hz, seconds, loudness
    ["triangle", 1568, 1568, 0.22, 0.08, 0.5],
  ],
};

/** One gate across the gorge. */
type Gate = {
  /** Where it stands, world px. */
  readonly at: number;
  /** Middle and half width of its opening, logical px. */
  readonly x: number;
  readonly half: number;
  result: "ahead" | "passed" | "missed";
};

/** A fir or a rock on the rim. */
type Decor = {
  readonly at: number;
  readonly x: number;
  readonly sprite: SpriteName;
};

/** The gorge of one run. */
type Gorge = {
  readonly bends: readonly number[];
  readonly length: number;
};

/** The minigame behind gate 10. */
export const GAME: MiniGame = {
  number: 10,
  id: "fliegender-teppich",
  title: "Der fliegende Teppich",
  instructions: [
    `Jordi fliegt auf dem Zauberteppich durch die Eisschlucht. Flieg durch ${String(GOAL)} der ${String(GATES)} Kristalltore.`,
    "Berühr die Eiswände nicht - drei Mal, und der Flug ist vorbei.",
  ],
  controls:
    "Pfeile links / rechts oder A / D - oder mit Maus und Finger führen.",
  ready: true,
  create: (env) => createRun(env.seed, env.sound),
};

/** One run. */
function createRun(seed: number, sound: MiniEnv["sound"]): MiniGameInstance {
  const random = createRandom(seed);
  const effects = createEffects(random);
  const sheet = loadSheet(SHEET_SRC);
  const gorge = makeGorge(random);
  const gates = makeGates(random, gorge);
  const decor = makeDecor(random, gorge);
  let flown = 0;
  let x = MINI_W / 2;
  let vx = 0;
  let lives = LIVES;
  let safe = 0;
  let clock = 0;
  let lastPointer: MiniPoint | null = null;
  let pointerAge = POINTER_HOLD;
  let status: MiniStatus = "running";

  const passed = () => gates.filter((gate) => gate.result === "passed").length;
  const missed = () => gates.filter((gate) => gate.result === "missed").length;

  const steer = (input: MiniInput, dt: number) => {
    const p = input.pointer;
    if (
      p !== null &&
      (lastPointer === null || p.x !== lastPointer.x || input.pointerDown)
    ) {
      pointerAge = 0;
    }
    lastPointer = p;
    pointerAge += dt;
    let want = input.axisX * SIDE_SPEED;
    if (input.axisX === 0 && p !== null && pointerAge < POINTER_HOLD) {
      want = Math.max(
        -SIDE_SPEED,
        Math.min(SIDE_SPEED, ((p.x - x) * SIDE_ACCEL) / 2),
      );
    }
    vx += (want - vx) * Math.min(1, SIDE_ACCEL * dt);
    x += vx * dt;
  };

  const walls = () => {
    // The carpet is as narrow as the tightest spot along it.
    let low = 0;
    let high = MINI_W;
    for (const at of [flown - CARPET_TAIL, flown, flown + CARPET_NOSE]) {
      const middle = middleAt(gorge, at);
      const half = halfAt(gorge, at);
      low = Math.max(low, middle - half + CARPET_HALF);
      high = Math.min(high, middle + half - CARPET_HALF);
    }
    return { low, high };
  };

  const touch = () => {
    const { low, high } = walls();
    if (x < low || x > high) {
      const side = x < low ? 1 : -1;
      x = Math.max(low, Math.min(high, x));
      if (safe <= 0) {
        lives -= 1;
        safe = SAFE;
        vx = side * BOUNCE;
        sound("bump");
        effects.shake(SHAKE);
        effects.burst(x - side * CARPET_HALF, CARPET_Y, {
          colors: ["#ffffff", "#bfe8ff", "#7ab8e0"],
          count: 14,
        });
        effects.float("Autsch!", x, CARPET_Y - CARPET_NOSE - HUD_H, "#ff9a9a");
      } else {
        vx = side * Math.abs(vx);
      }
    }
  };

  const cross = (before: number) => {
    for (const gate of gates) {
      if (gate.result === "ahead" && before < gate.at && flown >= gate.at) {
        const y = CARPET_Y - CARPET_NOSE;
        if (Math.abs(x - gate.x) <= gate.half) {
          gate.result = "passed";
          sound(CHIME);
          effects.burst(gate.x, y, { count: GATE_BURST });
          effects.float(`${String(passed())}`, gate.x, y - HUD_H);
        } else {
          gate.result = "missed";
          sound("miss");
          effects.float("Verpasst!", gate.x, y - HUD_H, "#ff9a9a");
        }
      }
    }
  };

  return {
    step(input, dt) {
      clock += dt;
      if (status === "running") {
        safe -= dt;
        const share = Math.min(1, flown / gorge.length);
        const before = flown;
        flown += (SPEED_START + (SPEED_END - SPEED_START) * share) * dt;
        steer(input, dt);
        touch();
        cross(before);
        const left = gates.filter((gate) => gate.result === "ahead").length;
        if (passed() >= GOAL) {
          status = "won";
        } else if (lives <= 0 || passed() + left < GOAL) {
          status = "lost";
        }
      }
      effects.update(dt);
      return status;
    },
    draw(g) {
      const shake = effects.offset();
      g.ctx.save();
      g.ctx.translate(shake.x, shake.y);
      drawScene(g, sheet, {
        gorge,
        gates,
        decor,
        flown,
        x,
        vx,
        hidden: safe > 0 && Math.floor(clock * BLINK) % 2 === 0,
        clock,
      });
      effects.draw(g);
      g.ctx.restore();
      drawHud(g, {
        score: Math.min(passed(), GOAL),
        goal: GOAL,
        scoreLabel: "Tore",
        lives,
        maxLives: LIVES,
      });
      drawMissed(g, missed());
    },
    summary() {
      return `${String(passed())} von ${String(GOAL)} Toren durchflogen.`;
    },
  };
}

/** Lays out the bends of the gorge. */
function makeGorge(random: Random): Gorge {
  const length = FIRST_GATE + (GATES - 1) * GATE_STEP + RUN_OUT;
  const count = Math.ceil(length / BEND_STEP) + 2;
  // A straight start, so the first gate comes before the first bend.
  const bends: number[] = Array.from({ length: STRAIGHT }, () => MINI_W / 2);
  for (let k = bends.length; k < count; k += 1) {
    const share = Math.min(1, (k * BEND_STEP) / length);
    const half = WIDE_START + (WIDE_END - WIDE_START) * share;
    const lowest = half + MARGIN;
    const highest = MINI_W - half - MARGIN;
    const next = bends[k - 1] + random.range(-BEND_MOVE, BEND_MOVE);
    bends.push(Math.max(lowest, Math.min(highest, next)));
  }
  return { bends, length };
}

/** Puts the gates into the gorge, each opening somewhere across it. */
function makeGates(random: Random, gorge: Gorge): Gate[] {
  return Array.from({ length: GATES }, (_, k) => {
    const at = FIRST_GATE + k * GATE_STEP;
    const share = k / (GATES - 1);
    const half = GAP_START + (GAP_END - GAP_START) * share;
    const room = Math.max(0, halfAt(gorge, at) - half - GATE_INSET);
    return {
      at,
      x: middleAt(gorge, at) + random.range(-room, room),
      half,
      result: "ahead" as const,
    };
  });
}

/** Scatters firs and rocks along both rims. */
function makeDecor(random: Random, gorge: Gorge): Decor[] {
  const decor: Decor[] = [];
  for (let at = 0; at < gorge.length + MINI_H; at += DECOR_STEP) {
    const middle = middleAt(gorge, at);
    const half = halfAt(gorge, at) + CLIFF + MARGIN;
    const leftRoom = middle - half;
    const rightRoom = MINI_W - (middle + half);
    const onLeft = random.chance(leftRoom / (leftRoom + rightRoom));
    const x = onLeft
      ? random.range(0, Math.max(0, leftRoom))
      : random.range(middle + half, MINI_W);
    decor.push({
      at: at + random.range(0, DECOR_STEP),
      x,
      sprite: random.chance(FIR_SHARE) ? "fir" : "rock",
    });
  }
  return decor;
}

/** The gorge's middle at a distance, logical px. */
function middleAt(gorge: Gorge, at: number): number {
  const place = Math.max(0, at) / BEND_STEP;
  const k = Math.min(gorge.bends.length - 2, Math.floor(place));
  const t = (1 - Math.cos((place - k) * Math.PI)) / 2;
  return gorge.bends[k] + (gorge.bends[k + 1] - gorge.bends[k]) * t;
}

/** Half the gorge's width at a distance, logical px. */
function halfAt(gorge: Gorge, at: number): number {
  const share = Math.max(0, Math.min(1, at / gorge.length));
  return WIDE_START + (WIDE_END - WIDE_START) * share;
}

/** What the scene needs to know. */
type SceneState = {
  readonly gorge: Gorge;
  readonly gates: readonly Gate[];
  readonly decor: readonly Decor[];
  readonly flown: number;
  readonly x: number;
  readonly vx: number;
  readonly hidden: boolean;
  readonly clock: number;
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- scene layout,
   colours and motions, picked by eye */
/** The depths, the walls row by row, the rim, the gates and the carpet. */
function drawScene(g: MiniDraw, sheet: HTMLImageElement, s: SceneState): void {
  const ctx = g.ctx;
  const atRow = (y: number) => s.flown + (CARPET_Y - y);
  // The floor far below scrolls slower: it is deep down.
  const depth = (s.flown * 0.55) % MINI_H;
  drawSprite(ctx, sheet, SPRITES.depths, 0, depth - MINI_H);
  drawSprite(ctx, sheet, SPRITES.depths, 0, depth);
  for (let y = 0; y < MINI_H; y += ROW) {
    const at = atRow(y);
    const middle = middleAt(s.gorge, at);
    const half = halfAt(s.gorge, at);
    const left = snap(middle - half);
    const right = snap(middle + half);
    // Shade cast by the left rim onto the depths.
    ctx.fillStyle = "rgba(6, 10, 30, 0.45)";
    ctx.fillRect(left, y, 7, ROW);
    // Left wall: snow, then the cliff face in its own shade.
    ctx.fillStyle = "#e6eef8";
    ctx.fillRect(0, y, left - CLIFF, ROW);
    ctx.fillStyle = "#4a88b8";
    ctx.fillRect(left - CLIFF, y, CLIFF, ROW);
    ctx.fillStyle = "#2a5a8a";
    ctx.fillRect(left - 2, y, 2, ROW);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(left - CLIFF - 1, y, 1, ROW);
    // Right wall: its face catches the light.
    ctx.fillStyle = "#a8dcf4";
    ctx.fillRect(right, y, CLIFF, ROW);
    ctx.fillStyle = "#d8f4ff";
    ctx.fillRect(right, y, 1, ROW);
    ctx.fillStyle = "#e6eef8";
    ctx.fillRect(right + CLIFF, y, MINI_W - right - CLIFF, ROW);
    ctx.fillStyle = "#c8d6ea";
    ctx.fillRect(right + CLIFF, y, 1, ROW);
    // Speckles in the snow that travel with the gorge.
    const row = Math.floor(at);
    const hash = Math.abs((row * HASH_A) % HASH_B);
    if (hash % SPECKLE_EVERY === 0) {
      ctx.fillStyle = "#c8d6ea";
      ctx.fillRect(snap((hash * 7) % Math.max(1, left - CLIFF)), y, 1, ROW);
      ctx.fillRect(
        snap(
          right + CLIFF + ((hash * 3) % Math.max(1, MINI_W - right - CLIFF)),
        ),
        y,
        1,
        ROW,
      );
    }
  }
  for (const item of s.decor) {
    const y = CARPET_Y - (item.at - s.flown);
    if (y > -20 && y < MINI_H + 20) {
      drawSpriteCentred(ctx, sheet, SPRITES[item.sprite], item.x, y);
    }
  }
  for (const gate of s.gates) {
    const y = CARPET_Y - (gate.at - s.flown) - CARPET_NOSE;
    if (y > -20 && y < MINI_H + 20) {
      drawGate(g, sheet, gate, y);
    }
  }
  if (!s.hidden) {
    const frame =
      CARPET_FRAMES[Math.floor(s.clock * WAVE_RATE) % CARPET_FRAMES.length];
    const bob = Math.sin(s.clock * 3) * 1.5;
    ctx.fillStyle = "rgba(4, 8, 24, 0.35)";
    ctx.beginPath();
    ctx.ellipse(s.x + 9, CARPET_Y + 12, 11, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    drawSpriteCentred(
      ctx,
      sheet,
      SPRITES[frame],
      s.x,
      CARPET_Y + bob,
      1,
      s.vx * LEAN,
    );
    drawFigure(
      ctx,
      g.art,
      "jordi",
      s.x + s.vx * 0.02,
      CARPET_Y + 8 + bob,
      "idle",
      "up",
      g.time,
    );
  }
}

/** One gate: two crystals and a golden garland between them. */
function drawGate(
  g: MiniDraw,
  sheet: HTMLImageElement,
  gate: Gate,
  y: number,
): void {
  const ctx = g.ctx;
  const left = gate.x - gate.half;
  const right = gate.x + gate.half;
  const dim = gate.result === "missed";
  ctx.globalAlpha = dim ? 0.45 : 1;
  if (gate.result === "ahead") {
    drawGlow(ctx, gate.x, y, gate.half + 6, "255, 220, 90", 0.18);
    for (let px = left + 4; px < right - 4; px += 1) {
      const sag = Math.sin(((px - left) / (right - left)) * Math.PI) * 3;
      const wave = Math.sin(px * 0.6 + g.time * 6) * 0.5;
      ctx.fillStyle = Math.floor(px) % 4 < 2 ? "#ffd84a" : "#ff5a6a";
      ctx.fillRect(snap(px), snap(y + sag + wave), 1, 1);
    }
  }
  drawSpriteCentred(ctx, sheet, SPRITES.crystal, left, y - 3);
  drawSpriteCentred(ctx, sheet, SPRITES.crystal, right, y - 3);
  if (gate.result === "passed") {
    drawGlow(ctx, left, y, 8, "160, 230, 255", 0.4);
    drawGlow(ctx, right, y, 8, "160, 230, 255", 0.4);
  }
  ctx.globalAlpha = 1;
}

/** How many gates were missed and how many may be, top right. */
function drawMissed(g: MiniDraw, missed: number): void {
  g.text(
    `Verpasst: ${String(missed)} / ${String(GATES - GOAL)}`,
    MINI_W - 6,
    HUD_H / 2,
    {
      size: 8,
      bold: true,
      align: "right",
      baseline: "middle",
      color: missed > 0 ? "#ffb0b8" : "#e8f0ff",
    },
  );
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
