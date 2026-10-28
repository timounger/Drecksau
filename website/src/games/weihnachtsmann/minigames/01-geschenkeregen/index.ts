/**
 * Türchen 1 - Geschenkeregen: the sleigh flies over the village and drops
 * presents; Santa catches them in his sack and dodges Grantelbart's coal.
 *
 * @module
 * @remarks
 * Catch {@link GOAL} presents (a gold star counts {@link STAR_VALUE}) before
 * the clock runs out; three lumps of coal and the run is lost. Missed
 * presents cost nothing - the first gate is meant to be friendly.
 */
import { OBJECTS } from "@/games/weihnachtsmann/components/sprite-atlas";
import {
  drawFigure,
  drawGlow,
  drawHud,
  drawSnowfall,
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

/** Presents to catch. */
const GOAL = 20;

/** What a gold star counts. */
const STAR_VALUE = 3;

/** Seconds on the clock. */
const TIME = 60;

/** Lumps of coal Santa can take. */
const LIVES = 3;

/** Santa's top speed, logical px per second, and how fast he gets there. */
const SPEED = 165;
const ACCEL = 12;

/** Where Santa's feet are, logical px from the top. */
const FEET_Y = 170;

/** Keep Santa this far from the edges, logical px. */
const EDGE = 20;

/** The sack's middle above his feet, and half the width of its mouth. */
const SACK_LIFT = 44;
const SACK_HALF = 13;

/** Height of the band round the sack's mouth that catches, logical px. */
const CATCH_BAND = 9;

/** How long the sack stays squashed after a catch, seconds. */
const SQUASH = 0.15;

/** The sleigh's flight: height, how far it swings, speed in radians per second. */
const SLEIGH_Y = 40;
const SLEIGH_SWING = 130;
const SLEIGH_RATE = 0.55;

/** Seconds between drops at the start and at the end of the clock. */
const DROP_SLOW = 1.05;
const DROP_FAST = 0.5;

/** Fall speed at the start and at the end, logical px per second. */
const FALL_SLOW = 55;
const FALL_FAST = 95;

/** Chance a drop is coal, at the start and at the end. */
const COAL_FIRST = 0.12;
const COAL_LAST = 0.3;

/** Chance a drop is a gold star. */
const STAR_CHANCE = 0.07;

/** Things below this line are gone, logical px. */
const FLOOR = 176;

/** How long Santa blinks after coal, seconds. */
const HURT = 0.9;

/** The pointer steers while it moved within this long, seconds. */
const POINTER_HOLD = 1.2;

/** Santa's walk cycle, frames per logical px walked. */
const STRIDE = 0.12;

/** Blink speed while hurt, per second. */
const BLINK = 16;

/** Fall speeds differ by up to this much, logical px per second. */
const FALL_JITTER = 8;

/** Shake on a coal hit, logical px. */
const SHAKE = 3;

/** Floating texts start this far above the sack, logical px. */
const FLOAT_LIFT = 13;

/** Sparks of a caught present and of a caught star. */
const BURST_SMALL = 10;
const BURST_BIG = 24;

/** The presents to pick from. */
const GIFTS: readonly SpriteName[] = [
  "giftRed",
  "giftBlue",
  "giftGreen",
  "giftPurple",
];

/** What falls. */
type Drop = {
  readonly kind: "gift" | "coal" | "star";
  readonly sprite: SpriteName;
  x: number;
  y: number;
  readonly vy: number;
  spin: number;
};

/** The minigame behind gate 1. */
export const GAME: MiniGame = {
  number: 1,
  id: "geschenkeregen",
  title: "Geschenkeregen",
  instructions: [
    `Der Schlitten wirft Geschenke ab - fang ${String(GOAL)} Stück mit dem Sack, bevor die Zeit um ist.`,
    `Ein goldener Stern zählt ${String(STAR_VALUE)}. Weich der Kohle aus: dreimal getroffen, und es ist vorbei.`,
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
  const drops: Drop[] = [];
  let x = MINI_W / 2;
  let vx = 0;
  let stride = 0;
  let caught = 0;
  let lives = LIVES;
  let left = TIME;
  let dropIn = 1;
  let squash = 0;
  let hurt = 0;
  let clock = 0;
  let lastPointer: { x: number; y: number } | null = null;
  let pointerAge = POINTER_HOLD;
  let status: MiniStatus = "running";

  const sleighX = () =>
    MINI_W / 2 + Math.sin(clock * SLEIGH_RATE) * SLEIGH_SWING;

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
    let want = input.axisX * SPEED;
    if (input.axisX === 0 && p !== null && pointerAge < POINTER_HOLD) {
      want = Math.max(-SPEED, Math.min(SPEED, ((p.x - x) * ACCEL) / 2));
    }
    vx += (want - vx) * Math.min(1, ACCEL * dt);
    x = Math.max(EDGE, Math.min(MINI_W - EDGE, x + vx * dt));
    stride += Math.abs(vx) * dt * STRIDE;
  };

  const spawn = () => {
    const share = 1 - left / TIME;
    const roll = random.next();
    const coalChance = COAL_FIRST + (COAL_LAST - COAL_FIRST) * share;
    let kind: Drop["kind"] = "gift";
    if (roll < coalChance) {
      kind = "coal";
    } else if (roll < coalChance + STAR_CHANCE) {
      kind = "star";
    }
    const sprite: SpriteName =
      kind === "gift" ? random.pick(GIFTS) : kind === "coal" ? "coal" : "star";
    // Coal comes from anywhere above; presents from the sleigh.
    const from =
      kind === "coal" ? random.range(EDGE, MINI_W - EDGE) : sleighX();
    drops.push({
      kind,
      sprite,
      x: from,
      y: SLEIGH_Y,
      vy:
        FALL_SLOW +
        (FALL_FAST - FALL_SLOW) * share +
        random.range(-FALL_JITTER, FALL_JITTER),
      spin: random.range(-Math.PI, Math.PI),
    });
    dropIn = DROP_SLOW + (DROP_FAST - DROP_SLOW) * share;
  };

  const land = (drop: Drop) => {
    const sackY = FEET_Y - SACK_LIFT;
    const hit =
      Math.abs(drop.x - x) < SACK_HALF &&
      drop.y > sackY - CATCH_BAND &&
      drop.y < sackY + CATCH_BAND / 2;
    if (hit && drop.kind === "coal") {
      if (hurt <= 0) {
        lives -= 1;
        hurt = HURT;
        sound("bump");
        effects.shake(SHAKE);
        effects.burst(drop.x, drop.y, {
          colors: ["#3a3440", "#6a6478"],
          count: 10,
        });
        effects.float("Autsch!", x, sackY - FLOAT_LIFT, "#ff9a9a");
      }
    } else if (hit) {
      const value = drop.kind === "star" ? STAR_VALUE : 1;
      caught += value;
      squash = SQUASH;
      sound(drop.kind === "star" ? "coin" : "pop");
      effects.burst(drop.x, sackY, {
        count: drop.kind === "star" ? BURST_BIG : BURST_SMALL,
      });
      effects.float(`+${String(value)}`, drop.x, sackY - FLOAT_LIFT);
    }
    return hit;
  };

  return {
    step(input, dt) {
      clock += dt;
      if (status === "running") {
        left -= dt;
        squash -= dt;
        hurt -= dt;
        steer(input, dt);
        dropIn -= dt;
        if (dropIn <= 0) {
          spawn();
        }
        for (const drop of [...drops]) {
          drop.y += drop.vy * dt;
          drop.spin += dt;
          const gone = land(drop) || drop.y > FLOOR;
          if (gone) {
            drops.splice(drops.indexOf(drop), 1);
            if (drop.y > FLOOR && drop.kind !== "coal") {
              effects.burst(drop.x, FLOOR, {
                colors: ["#ffffff", "#d2ddef"],
                count: 5,
                speed: 30,
              });
            }
          }
        }
        if (caught >= GOAL) {
          status = "won";
        } else if (lives <= 0 || left <= 0) {
          status = "lost";
        }
      }
      effects.update(dt);
      return status;
    },
    draw(g) {
      drawScene(g, sheet, {
        x,
        vx,
        stride,
        squash: squash > 0,
        hurt: hurt > 0 && Math.floor(clock * BLINK) % 2 === 0,
        sleighX: sleighX(),
        clock,
        drops,
      });
      effects.draw(g);
      drawHud(g, {
        score: Math.min(caught, GOAL),
        goal: GOAL,
        scoreLabel: "Geschenke",
        time: left,
        lives,
        maxLives: LIVES,
      });
    },
    summary() {
      return `${String(Math.min(caught, GOAL))} von ${String(GOAL)} Geschenken gefangen.`;
    },
  };
}

/** What the scene needs to know. */
type SceneState = {
  readonly x: number;
  readonly vx: number;
  readonly stride: number;
  readonly squash: boolean;
  readonly hurt: boolean;
  readonly sleighX: number;
  readonly clock: number;
  readonly drops: readonly Drop[];
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- scene layout and
   offsets, picked by eye */
/** The village, the sleigh, Santa with his sack and what falls. */
function drawScene(g: MiniDraw, sheet: HTMLImageElement, s: SceneState): void {
  const ctx = g.ctx;
  drawSprite(ctx, sheet, SPRITES.backdrop, 0, 0);
  // The sleigh with Rudolf, swinging over the roofs.
  const dir = Math.cos(s.clock * SLEIGH_RATE) >= 0;
  const sleigh = OBJECTS.sleigh;
  const bob = Math.sin(s.clock * 3) * 2;
  drawFigure(
    ctx,
    g.art,
    "rudolf",
    s.sleighX + (dir ? 30 : -30),
    SLEIGH_Y + bob - 4,
    "fly",
    "side",
    s.clock * 8,
    !dir,
  );
  drawGlow(
    ctx,
    s.sleighX + (dir ? 44 : -44),
    SLEIGH_Y + bob - 23,
    12,
    "255, 40, 40",
    0.45,
  );
  drawSprite(
    ctx,
    g.art.world,
    sleigh,
    s.sleighX - sleigh[2] / 2,
    SLEIGH_Y + bob - sleigh[3] + 4,
    !dir,
  );
  for (const drop of s.drops) {
    const rect = SPRITES[drop.sprite];
    if (drop.kind === "star") {
      drawGlow(ctx, drop.x, drop.y, 12, "255, 220, 90", 0.4);
    }
    drawSpriteCentred(
      ctx,
      sheet,
      rect,
      drop.x,
      drop.y,
      1,
      Math.sin(drop.spin * 3) * 0.25,
    );
  }
  // Santa, the sack over his head.
  ctx.fillStyle = "rgba(70, 90, 140, 0.3)";
  ctx.beginPath();
  ctx.ellipse(s.x, FEET_Y - 1, 10, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  if (!s.hurt) {
    const moving = Math.abs(s.vx) > 12;
    drawFigure(
      ctx,
      g.art,
      "santa",
      s.x,
      FEET_Y,
      moving ? "walk" : "idle",
      "down",
      moving ? s.stride : g.time * 1.6,
    );
    const sack = s.squash ? SPRITES.sackSquash : SPRITES.sack;
    drawSprite(ctx, sheet, sack, s.x - sack[2] / 2, FEET_Y - SACK_LIFT - 8);
  }
  drawSnowfall(ctx, g.time, 30);
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
