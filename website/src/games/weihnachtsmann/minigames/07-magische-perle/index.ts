/**
 * Türchen 7 - Die magische Perle: Jordi, turned into a penguin, dives under
 * the ice for pearls; his air runs out, so he keeps coming back to the hole.
 *
 * @module
 * @remarks
 * Collect {@link GOAL} pearls from the oysters before the clock runs out.
 * Under water the air meter drains; at the air hole it fills again. Running
 * out of air or touching a jellyfish costs a heart; with none left the run is
 * lost. An emptied oyster shuts and opens again a little later.
 */
import { SHEET_DENSITY } from "@/games/weihnachtsmann/components/sprite-atlas";
import { snap } from "@/games/weihnachtsmann/components/sprites";
import type { Recipe } from "@/games/weihnachtsmann/audio/sounds";
import {
  HUD_H,
  drawGlow,
  drawHud,
  drawPanel,
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
import { SHEET_SRC, SPRITES, type SpriteName } from "./sprites";

/** Pearls to collect. */
const GOAL = 8;

/** Seconds on the clock. */
const TIME = 90;

/** Hearts: jellyfish stings and empty lungs. */
const LIVES = 3;

/** Seconds of air in full lungs, and how fast the hole fills them (per second). */
const AIR_MAX = 9;
const AIR_REFILL = 10;

/** Air left from which the meter warns, seconds. */
const AIR_LOW = 3.5;

/** The air hole: its middle and half its width, logical px. */
const HOLE_X = 160;
const HOLE_HALF = 13;

/** Where the penguin floats with his head out of the hole, logical px. */
const SURFACE = 35;

/** How close to the surface counts as breathing, logical px. */
const BREATHE_BAND = 3;

/** The underside of the ice: the penguin stays below this elsewhere. */
const CEILING = 48;

/** The sea floor and the side walls for the penguin's middle, logical px. */
const BOTTOM = 160;
const SIDE = 10;

/** Swimming: top speed, push and water drag (per second). */
const SPEED = 62;
const PUSH = 240;
const DRAG = 2.4;

/** A pointer this close (logical px) asks for full speed. */
const POINTER_REACH = 24;

/** Gentle lift of the water, logical px per second squared. */
const LIFT = 6;

/** Distances that count as touching, logical px. */
const PEARL_REACH = 11;
const JELLY_REACH = 9;

/** Seconds a hurt penguin cannot be hurt again, and the push of a sting. */
const SAFE = 1.4;
const KNOCK = 110;

/** Seconds an emptied oyster stays shut. */
const SHUT_TIME = 9;

/** A shut oyster opens only this far from the penguin, logical px. */
const OPEN_AWAY = 70;

/** Oysters open at the start, and most open at once. */
const OPEN_FIRST = 2;
const MOST_OPEN = 2;

/** Jellyfish at the start, and from how many pearls one more comes. */
const JELLIES_FIRST = 3;
const MORE_JELLY_AT = 4;

/** Jellyfish drift: sideways speed, bob height and bob speed. */
const JELLY_DRIFT = 11;
const JELLY_BOB = 16;
const JELLY_RATE = 0.9;

/** Jellyfish stay this far from the hole column and inside this band. */
const JELLY_CLEAR = 30;
const JELLY_TOP = 72;
const JELLY_LOW = 132;

/** Flipper frames per logical px swum, and the idle beat. */
const STROKE = 0.09;
const IDLE_BEAT = 3;

/** Where a pearl sits above its oyster's foot, logical px. */
const PEARL_LIFT = 6;

/** Share of big bubbles. */
const BIG_BUBBLES = 0.34;

/** Seconds between bubbles while swimming. */
const BUBBLE_GAP = 0.35;

/** Bubbles rise this fast, logical px per second, and wobble this much. */
const BUBBLE_RISE = 28;
const BUBBLE_WOBBLE = 1.5;

/** Seconds between the warning ticks when air is low. */
const TICK_GAP = 0.6;

/** Blink speed while safe after a hurt, per second. */
const BLINK = 14;

/** Shake on a hurt, logical px. */
const SHAKE = 3;

/** Bursts. */
const PEARL_BURST = 20;
const SPLASH_BURST = 12;

/** Where the oysters may lie: the shell's middle and its foot, logical px. */
const SPOTS: readonly { readonly x: number; readonly y: number }[] = [
  { x: 22, y: 160 },
  { x: 62, y: 168 },
  { x: 104, y: 169 },
  { x: 146, y: 168 },
  { x: 196, y: 170 },
  { x: 236, y: 168 },
  { x: 276, y: 169 },
  { x: 302, y: 157 },
];

/** The flipper frames in their beat. */
const STROKE_FRAMES: readonly SpriteName[] = [
  "swim0",
  "swim1",
  "swim2",
  "swim1",
];

/** Gulp of air at the hole. */
const BREATH: Recipe = {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- pitches in Hz, seconds, loudness
  tones: [["sine", 300, 900, 0.18, 0, 0.6]],
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- seconds, Hz, loudness
  noise: [[0.12, 0, 2600, 0.35]],
};

/** One oyster on the floor. */
type Oyster = {
  readonly x: number;
  readonly y: number;
  open: boolean;
  /** Seconds until a shut oyster opens again. */
  wait: number;
};

/** One jellyfish. */
type Jelly = {
  x: number;
  readonly baseY: number;
  vx: number;
  readonly phase: number;
};

/** One rising bubble. */
type Bubble = { x: number; y: number; readonly big: boolean; age: number };

/** The minigame behind gate 7. */
export const GAME: MiniGame = {
  number: 7,
  id: "magische-perle",
  title: "Die magische Perle",
  instructions: [
    `Jordi taucht als Pinguin unter dem Eis. Sammle ${String(GOAL)} Perlen aus den offenen Muscheln.`,
    "Achte auf die Luft: Am Loch im Eis holst du neue. Weich den Quallen aus - drei Fehler, und es ist vorbei.",
  ],
  controls:
    "Pfeile oder W A S D schwimmen - oder Maus / Finger gedrückt halten, Jordi folgt.",
  ready: true,
  create: (env) => createRun(env.seed, env.sound),
};

/** One run. */
function createRun(seed: number, sound: MiniEnv["sound"]): MiniGameInstance {
  const random = createRandom(seed);
  const effects = createEffects(random);
  const sheet = loadSheet(SHEET_SRC);
  const oysters: Oyster[] = random.shuffle(SPOTS).map((spot, index) => ({
    x: spot.x,
    y: spot.y,
    open: index < OPEN_FIRST,
    wait: index < OPEN_FIRST ? 0 : random.range(2, SHUT_TIME),
  }));
  const jellies: Jelly[] = [];
  const bubbles: Bubble[] = [];
  let x = HOLE_X;
  let y = SURFACE;
  let vx = 0;
  let vy = 0;
  let facingLeft = false;
  let air = AIR_MAX;
  let breathing = true;
  let pearls = 0;
  let lives = LIVES;
  let left = TIME;
  let safe = 0;
  let stroke = 0;
  let bubbleIn = BUBBLE_GAP;
  let tickIn = 0;
  let clock = 0;
  let status: MiniStatus = "running";

  const addJelly = () => {
    const leftSide = jellies.length % 2 === 0;
    jellies.push({
      x: leftSide
        ? random.range(SIDE * 2, HOLE_X - JELLY_CLEAR)
        : random.range(HOLE_X + JELLY_CLEAR, MINI_W - SIDE * 2),
      baseY: random.range(JELLY_TOP, JELLY_LOW),
      vx: random.chance(1 / 2) ? JELLY_DRIFT : -JELLY_DRIFT,
      phase: random.range(0, Math.PI * 2),
    });
  };
  for (let k = 0; k < JELLIES_FIRST; k += 1) {
    addJelly();
  }

  const jellyY = (jelly: Jelly) =>
    jelly.baseY + Math.sin(clock * JELLY_RATE + jelly.phase) * JELLY_BOB;

  const swim = (input: MiniInput, dt: number) => {
    let ax = input.axisX;
    let ay = input.axisY;
    const p = input.pointer;
    if (ax === 0 && ay === 0 && p !== null && input.pointerDown) {
      const dx = p.x - x;
      const dy = p.y - y;
      const dist = Math.hypot(dx, dy);
      const strength = Math.min(1, dist / POINTER_REACH);
      ax = dist > 1 ? (dx / dist) * strength : 0;
      ay = dist > 1 ? (dy / dist) * strength : 0;
    }
    vx += ax * PUSH * dt;
    vy += ay * PUSH * dt - LIFT * dt;
    vx -= vx * DRAG * dt;
    vy -= vy * DRAG * dt;
    const speed = Math.hypot(vx, vy);
    if (speed > SPEED) {
      vx = (vx / speed) * SPEED;
      vy = (vy / speed) * SPEED;
    }
    if (ax !== 0) {
      facingLeft = ax < 0;
    }
    // The ice is solid: beside the hole the penguin cannot rise above it,
    // and inside the hole he cannot slip sideways under the sheet.
    let nx = Math.max(SIDE, Math.min(MINI_W - SIDE, x + vx * dt));
    if (y < CEILING && Math.abs(nx - HOLE_X) > HOLE_HALF) {
      nx = HOLE_X + Math.sign(nx - HOLE_X) * HOLE_HALF;
      vx = 0;
    }
    x = nx;
    const top = Math.abs(x - HOLE_X) <= HOLE_HALF ? SURFACE : CEILING;
    y = Math.max(top, Math.min(BOTTOM, y + vy * dt));
    if (y === top || y === BOTTOM) {
      vy = 0;
    }
    stroke += speed * dt * STROKE;
  };

  const hurt = (text: string) => {
    lives -= 1;
    safe = SAFE;
    effects.shake(SHAKE);
    effects.float(text, x, y - HUD_H, "#ff9a9a");
  };

  const breathe = (dt: number) => {
    const atHole =
      Math.abs(x - HOLE_X) <= HOLE_HALF && y <= SURFACE + BREATHE_BAND;
    if (atHole && !breathing) {
      sound(BREATH);
      effects.burst(x, SURFACE - 2, {
        colors: ["#ffffff", "#bff0ff"],
        count: SPLASH_BURST,
        speed: 40,
      });
    }
    breathing = atHole;
    if (atHole) {
      air = Math.min(AIR_MAX, air + AIR_REFILL * dt);
    } else {
      air -= dt;
      tickIn -= dt;
      if (air < AIR_LOW && tickIn <= 0) {
        tickIn = TICK_GAP;
        sound("tick");
      }
    }
    if (air <= 0) {
      hurt("Luft!");
      sound("miss");
      effects.burst(x, y, { colors: ["#ffffff", "#d8f6ff"], count: 16 });
      x = HOLE_X;
      y = SURFACE;
      vx = 0;
      vy = 0;
      air = AIR_MAX;
    }
  };

  const collect = (dt: number) => {
    for (const oyster of oysters) {
      if (oyster.open) {
        if (Math.hypot(oyster.x - x, oyster.y - PEARL_LIFT - y) < PEARL_REACH) {
          oyster.open = false;
          oyster.wait = SHUT_TIME;
          pearls += 1;
          sound("coin");
          effects.burst(oyster.x, oyster.y - PEARL_LIFT, {
            count: PEARL_BURST,
            colors: ["#ffffff", "#ffd8f0", "#ffe9a8", "#bff0ff"],
          });
          effects.float(
            `Perle ${String(pearls)}!`,
            oyster.x,
            oyster.y - HUD_H - PEARL_LIFT,
          );
          if (pearls === MORE_JELLY_AT) {
            addJelly();
          }
        }
      } else {
        oyster.wait -= dt;
        // Open again only away from the penguin, so every pearl is a trip.
        if (
          oyster.wait <= 0 &&
          oysters.filter((other) => other.open).length < MOST_OPEN &&
          Math.abs(oyster.x - x) > OPEN_AWAY
        ) {
          oyster.open = true;
          sound("pop");
          effects.burst(oyster.x, oyster.y - PEARL_LIFT, {
            count: 6,
            speed: 25,
          });
        }
      }
    }
  };

  const drift = (dt: number) => {
    for (const jelly of jellies) {
      jelly.x += jelly.vx * dt;
      const onLeft = jelly.x < HOLE_X;
      const low = onLeft ? SIDE * 2 : HOLE_X + JELLY_CLEAR;
      const high = onLeft ? HOLE_X - JELLY_CLEAR : MINI_W - SIDE * 2;
      if (jelly.x < low || jelly.x > high) {
        jelly.vx = -jelly.vx;
        jelly.x = Math.max(low, Math.min(high, jelly.x));
      }
      if (
        safe <= 0 &&
        Math.hypot(jelly.x - x, jellyY(jelly) - y) < JELLY_REACH
      ) {
        hurt("Autsch!");
        sound("hit");
        const away = Math.atan2(y - jellyY(jelly), x - jelly.x);
        vx = Math.cos(away) * KNOCK;
        vy = Math.sin(away) * KNOCK;
      }
    }
  };

  const fizz = (dt: number) => {
    bubbleIn -= dt;
    if (bubbleIn <= 0 && !breathing) {
      bubbleIn = BUBBLE_GAP * random.range(1 / 2, 1);
      bubbles.push({
        x: x + (facingLeft ? SIDE : -SIDE) / 2,
        y: y - 2,
        big: random.chance(BIG_BUBBLES),
        age: 0,
      });
    }
    for (const bubble of [...bubbles]) {
      bubble.age += dt;
      bubble.y -= BUBBLE_RISE * dt;
      const ceiling =
        Math.abs(bubble.x - HOLE_X) <= HOLE_HALF ? SURFACE : CEILING - 2;
      if (bubble.y < ceiling) {
        bubbles.splice(bubbles.indexOf(bubble), 1);
      }
    }
  };

  return {
    step(input, dt) {
      clock += dt;
      if (status === "running") {
        left -= dt;
        safe -= dt;
        swim(input, dt);
        breathe(dt);
        collect(dt);
        drift(dt);
        fizz(dt);
        if (pearls >= GOAL) {
          status = "won";
          effects.burst(x, y, { count: PEARL_BURST * 2 });
        } else if (lives <= 0 || left <= 0) {
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
        x,
        y,
        vx,
        vy,
        facingLeft,
        frame:
          STROKE_FRAMES[
            Math.floor(Math.hypot(vx, vy) > SIDE ? stroke : clock * IDLE_BEAT) %
              STROKE_FRAMES.length
          ],
        hidden: safe > 0 && Math.floor(clock * BLINK) % 2 === 0,
        oysters,
        jellies: jellies.map((jelly) => ({ x: jelly.x, y: jellyY(jelly) })),
        bubbles,
        clock,
      });
      effects.draw(g);
      g.ctx.restore();
      drawAir(g, air, breathing);
      drawHud(g, {
        score: Math.min(pearls, GOAL),
        goal: GOAL,
        scoreLabel: "Perlen",
        time: left,
        lives,
        maxLives: LIVES,
      });
    },
    summary() {
      return `${String(Math.min(pearls, GOAL))} von ${String(GOAL)} Perlen gesammelt.`;
    },
  };
}

/** What the scene needs to know. */
type SceneState = {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly facingLeft: boolean;
  readonly frame: SpriteName;
  readonly hidden: boolean;
  readonly oysters: readonly Oyster[];
  readonly jellies: readonly { readonly x: number; readonly y: number }[];
  readonly bubbles: readonly Bubble[];
  readonly clock: number;
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- scene layout,
   sways and offsets, picked by eye */
/** The sea under the ice, the oysters, jellyfish, bubbles and the penguin. */
function drawScene(g: MiniDraw, sheet: HTMLImageElement, s: SceneState): void {
  const ctx = g.ctx;
  drawSprite(ctx, sheet, SPRITES.backdrop, 0, 0);
  // A little fish crossing far back, and swaying weed.
  const fishX = ((s.clock * 14) % 380) - 30;
  drawSprite(
    ctx,
    sheet,
    SPRITES.fish,
    320 - fishX,
    112 + Math.sin(s.clock) * 4,
  );
  for (const [k, wx] of [12, 84, 128, 182, 258, 290].entries()) {
    const sway = Math.floor(s.clock * 1.5 + k) % 2 === 0;
    drawSprite(
      ctx,
      sheet,
      sway ? SPRITES.weed0 : SPRITES.weed1,
      wx,
      142 + (k % 3) * 3,
    );
  }
  for (const oyster of s.oysters) {
    const rect = oyster.open ? SPRITES.oysterOpen : SPRITES.oysterShut;
    drawSprite(ctx, sheet, rect, oyster.x - rect[2] / 2, oyster.y - rect[3]);
    if (oyster.open) {
      const pulse = 0.35 + Math.sin(s.clock * 4 + oyster.x) * 0.15;
      drawGlow(
        ctx,
        oyster.x,
        oyster.y - PEARL_LIFT,
        12,
        "255, 230, 250",
        pulse,
      );
      drawSpriteCentred(
        ctx,
        sheet,
        SPRITES.pearl,
        oyster.x,
        oyster.y - PEARL_LIFT,
      );
    }
  }
  for (const [k, jelly] of s.jellies.entries()) {
    const rect =
      Math.floor(s.clock * 2 + k) % 2 === 0 ? SPRITES.jelly0 : SPRITES.jelly1;
    drawGlow(ctx, jelly.x, jelly.y, 14, "255, 120, 220", 0.2);
    drawSprite(ctx, sheet, rect, jelly.x - rect[2] / 2, jelly.y - 7);
  }
  for (const bubble of s.bubbles) {
    const rect = bubble.big ? SPRITES.bubbleBig : SPRITES.bubbleSmall;
    drawSprite(
      ctx,
      sheet,
      rect,
      bubble.x + Math.sin(bubble.age * 6) * BUBBLE_WOBBLE - rect[2] / 2,
      bubble.y,
    );
  }
  if (!s.hidden) {
    const rect = SPRITES[s.frame];
    const tilt =
      Math.hypot(s.vx, s.vy) > 8
        ? Math.atan2(s.vy, Math.abs(s.vx)) * 0.7
        : Math.sin(s.clock * 2) * 0.08;
    drawTurned(ctx, sheet, rect, s.x, s.y, tilt, s.facingLeft);
  }
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/* eslint-disable @typescript-eslint/no-magic-numbers -- the meter's layout */
/** The air meter under the HUD: a bar of bubbles, red and blinking when low. */
function drawAir(g: MiniDraw, air: number, breathing: boolean): void {
  const ctx = g.ctx;
  const box = { x: 4, y: HUD_H + 3, w: 74, h: 11 };
  drawPanel(ctx, box, "rgba(10, 30, 60, 0.75)", "#9ad8f0");
  const share = Math.max(0, air / AIR_MAX);
  const low = air < AIR_LOW && !breathing;
  const blink = low && Math.floor(g.time * 6) % 2 === 0;
  ctx.fillStyle = low ? (blink ? "#ff5a6a" : "#ffb0b8") : "#7ad8ff";
  ctx.fillRect(box.x + 26, box.y + 3, snap(44 * share), 5);
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.fillRect(box.x + 26, box.y + 3, snap(44 * share), 1);
  g.text("Luft", box.x + 4, box.y + box.h / 2 + 0.5, {
    size: 6,
    bold: true,
    baseline: "middle",
    color: low ? "#ffb0b8" : "#d8f6ff",
  });
  if (low) {
    g.text("Zum Luftloch!", HOLE_X, CEILING + 18, {
      size: 7,
      bold: true,
      align: "center",
      baseline: "middle",
      color: "#ffe9a8",
      outline: "#0a1e4a",
      alpha: blink ? 1 : 0.6,
    });
  }
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** Draws a picture centred, turned and maybe mirrored left to right. */
function drawTurned(
  ctx: CanvasRenderingContext2D,
  sheet: HTMLImageElement,
  rect: readonly [number, number, number, number],
  x: number,
  y: number,
  angle: number,
  mirror: boolean,
): void {
  const [sx, sy, w, h] = rect;
  const k = SHEET_DENSITY;
  ctx.save();
  ctx.translate(snap(x), snap(y));
  ctx.scale(mirror ? -1 : 1, 1);
  ctx.rotate(angle);
  ctx.drawImage(sheet, sx * k, sy * k, w * k, h * k, -w / 2, -h / 2, w, h);
  ctx.restore();
}
