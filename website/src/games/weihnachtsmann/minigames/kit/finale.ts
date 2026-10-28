/**
 * The celebration after the last Advent gate: Santa's sleigh with Rudolf
 * flies across the night sky while fireworks burst over the snow.
 *
 * @module
 */
import type { Recipe } from "@/games/weihnachtsmann/audio/sounds";
import {
  FIGURES,
  OBJECTS,
} from "@/games/weihnachtsmann/components/sprite-atlas";
import { blit } from "@/games/weihnachtsmann/components/sprites";
import { MINI_H, MINI_W, type MiniDraw, type MiniInput } from "../types";
import { drawGlow, drawObject, drawSky, drawSnowfall } from "./draw";
import { FESTIVE, createEffects } from "./effects";
import type { Random } from "./random";
import type { MiniSoundId } from "./sounds";

/** The running celebration. */
export type Finale = {
  /**
   * Moves it on.
   *
   * @returns true once it is over or skipped
   */
  step(input: MiniInput, dt: number): boolean;
  /** Draws it. */
  draw(g: MiniDraw): void;
};

/** A rocket on its way up. */
type Rocket = { x: number; y: number; vy: number; readonly color: string };

/** How long it lasts, seconds, and from when it may be skipped. */
const LENGTH = 13;
const SKIPPABLE = 1.5;

/** Seconds between two rockets, shortest and longest. */
const ROCKET_MIN = 0.35;
const ROCKET_MAX = 0.8;

/** Launch speed of a rocket, logical px per second, and its pull down. */
const ROCKET_SPEED_MIN = 110;
const ROCKET_SPEED_MAX = 150;
const ROCKET_PULL = 90;

/** A rocket bursts once it slows down to this, logical px per second. */
const ROCKET_BURST = 25;

/** How big a burst is. */
const BURST_COUNT = 60;
const BURST_SPEED = 90;
const BURST_GRAVITY = 30;
const BURST_LIFE = 1.4;

/** Seconds the sleigh takes across the sky, and when it sets off. */
const SLEIGH_SECONDS = 8;
const SLEIGH_START = 0.8;

/** Height of the sleigh's flight, logical px, and how much it swings. */
const SLEIGH_Y = 58;
const SLEIGH_SWING = 12;

/* eslint-disable @typescript-eslint/no-magic-numbers -- the celebration
   scene: places, sizes and timings picked by eye */
/** Where the sleigh's runners are inside its picture, logical px. */
const SLEIGH_ANCHOR = [18, 24] as const;

/** Santa's seat and Rudolf's place, from the runners, logical px. */
const SANTA_SEAT = { x: -6, y: -9 } as const;
const RUDOLF_LEAD = { x: 34, y: -6 } as const;

/** Rudolf flaps this fast, frames per second. */
const FLAP_FPS = 8;

/** Stars in the sky. */
const STARS = 60;

/** The snowy ground's top, logical px. */
const GROUND = 150;

/** Firs on the hills: left edge and how far they sink in. */
const FIRS: readonly (readonly [number, number])[] = [
  [-10, 6],
  [30, 10],
  [250, 8],
  [290, 4],
];

/** When the texts appear, seconds. */
const TITLE_AT = 1;
const WISH_AT = 2.5;
const HINT_AT = 2;

/** The texts. */
const TEXTS = {
  title: "Alle 26 Türchen geschafft!",
  wish: "Frohe Weihnachten!",
  hint: "Weiter mit Leertaste oder Klick",
} as const;

/** Text sizes, logical px. */
const TITLE_SIZE = 16;
const WISH_SIZE = 12;
const HINT_SIZE = 6;

/** Where the texts stand, logical px from the top. */
const TITLE_Y = 112;
const WISH_Y = 132;

/** Sparkles behind the sleigh: every this many seconds. */
const TRAIL_EVERY = 0.04;

/**
 * Starts the celebration.
 *
 * @param random - random source for the fireworks
 * @param sound - plays the fanfare and the bangs
 * @returns the running finale
 */
export function createFinale(
  random: Random,
  sound: (sound: MiniSoundId | Recipe) => void,
): Finale {
  const effects = createEffects(random);
  const rockets: Rocket[] = [];
  const stars = Array.from({ length: STARS }, () => ({
    x: random.range(0, MINI_W),
    y: random.range(0, GROUND - 20),
    phase: random.range(0, Math.PI * 2),
  }));
  let time = 0;
  let nextRocket = 0;
  let trail = 0;
  sound("fanfare");

  const sleighAt = (t: number) => {
    const u = (t - SLEIGH_START) / SLEIGH_SECONDS;
    return {
      x: -RUDOLF_LEAD.x + u * (MINI_W + RUDOLF_LEAD.x * 3),
      y: SLEIGH_Y - Math.sin(u * Math.PI * 2) * SLEIGH_SWING,
      shown: u > 0 && u < 1,
    };
  };

  return {
    step(input, dt) {
      time += dt;
      nextRocket -= dt;
      if (nextRocket <= 0) {
        nextRocket = random.range(ROCKET_MIN, ROCKET_MAX);
        rockets.push({
          x: random.range(MINI_W * 0.1, MINI_W * 0.9),
          y: GROUND,
          vy: -random.range(ROCKET_SPEED_MIN, ROCKET_SPEED_MAX),
          color: random.pick(FESTIVE),
        });
        sound("firework");
      }
      for (const rocket of rockets) {
        rocket.vy += ROCKET_PULL * dt;
        rocket.y += rocket.vy * dt;
      }
      for (const rocket of rockets.filter((r) => r.vy > -ROCKET_BURST)) {
        effects.burst(rocket.x, rocket.y, {
          count: BURST_COUNT,
          speed: BURST_SPEED,
          gravity: BURST_GRAVITY,
          life: BURST_LIFE,
          size: 2,
          colors: [rocket.color, "#ffffff", rocket.color],
        });
      }
      rockets.splice(
        0,
        rockets.length,
        ...rockets.filter((r) => r.vy <= -ROCKET_BURST),
      );
      const sleigh = sleighAt(time);
      trail -= dt;
      if (sleigh.shown && trail <= 0) {
        trail = TRAIL_EVERY;
        effects.burst(sleigh.x - SLEIGH_ANCHOR[0], sleigh.y - 2, {
          count: 2,
          speed: 10,
          gravity: 20,
          life: 1,
        });
      }
      effects.update(dt);
      const skip =
        time > SKIPPABLE &&
        (input.pressed.has("action") || input.taps.length > 0);
      return time >= LENGTH || skip;
    },
    draw(g) {
      const ctx = g.ctx;
      drawSky(ctx, "#070a24", "#26306a");
      for (const star of stars) {
        ctx.globalAlpha = 0.5 + Math.sin(time * 2 + star.phase) * 0.5;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(star.x, star.y, 1 / 2, 1 / 2);
      }
      ctx.globalAlpha = 1;
      drawGlow(ctx, 270, 30, 30, "255, 244, 200", 0.35);
      ctx.fillStyle = "#fff4c8";
      ctx.beginPath();
      ctx.arc(270, 30, 10, 0, Math.PI * 2);
      ctx.fill();
      for (const rocket of rockets) {
        ctx.fillStyle = rocket.color;
        ctx.fillRect(rocket.x, rocket.y, 1, 2);
        ctx.fillStyle = "rgba(255, 220, 160, 0.5)";
        ctx.fillRect(rocket.x, rocket.y + 2, 1 / 2, 4);
      }
      effects.draw(g);
      const sleigh = sleighAt(time);
      if (sleigh.shown) {
        drawSleigh(g, sleigh.x, sleigh.y, time);
      }
      ctx.fillStyle = "#eef3fa";
      ctx.beginPath();
      ctx.moveTo(0, GROUND);
      for (let x = 0; x <= MINI_W; x += 8) {
        ctx.lineTo(x, GROUND - Math.sin(x / 40) * 4);
      }
      ctx.lineTo(MINI_W, MINI_H);
      ctx.lineTo(0, MINI_H);
      ctx.closePath();
      ctx.fill();
      for (const [x, sink] of FIRS) {
        const tree = OBJECTS.tree;
        drawObject(ctx, g.art, "tree", x, GROUND - tree[3] + sink);
      }
      drawSnowfall(ctx, time);
      if (time > TITLE_AT) {
        g.text(TEXTS.title, MINI_W / 2, TITLE_Y, {
          size: TITLE_SIZE,
          bold: true,
          align: "center",
          baseline: "middle",
          color: "#ffe27a",
          outline: "#2a1430",
          alpha: Math.min(1, time - TITLE_AT),
        });
      }
      if (time > WISH_AT) {
        g.text(TEXTS.wish, MINI_W / 2, WISH_Y, {
          size: WISH_SIZE,
          bold: true,
          align: "center",
          baseline: "middle",
          color: "#fff4dc",
          outline: "#2a1430",
          alpha: Math.min(1, time - WISH_AT),
        });
      }
      if (time > HINT_AT) {
        g.text(TEXTS.hint, MINI_W / 2, MINI_H - 4, {
          size: HINT_SIZE,
          align: "center",
          baseline: "bottom",
          color: "#6a7aa0",
        });
      }
    },
  };
}

/** The sleigh with Santa in it and Rudolf flying ahead. */
function drawSleigh(g: MiniDraw, x: number, y: number, time: number): void {
  const santa = FIGURES.santa;
  blit(
    g.ctx,
    g.art.figures,
    santa.side.idle[0],
    x + SANTA_SEAT.x - santa.anchor[0],
    y + SANTA_SEAT.y - santa.anchor[1],
  );
  blit(
    g.ctx,
    g.art.world,
    OBJECTS.sleigh,
    x - SLEIGH_ANCHOR[0],
    y - SLEIGH_ANCHOR[1],
  );
  const rudolf = FIGURES.rudolf;
  const frames = rudolf.side.fly;
  const rx = x + RUDOLF_LEAD.x;
  const ry = y + RUDOLF_LEAD.y;
  drawGlow(g.ctx, rx + 14, ry - 19, 16, "255, 40, 40", 0.5);
  blit(
    g.ctx,
    g.art.figures,
    frames[Math.floor(time * FLAP_FPS) % frames.length],
    rx - rudolf.anchor[0],
    ry - rudolf.anchor[1],
  );
  g.ctx.strokeStyle = "#e8b830";
  g.ctx.lineWidth = 1 / 2;
  g.ctx.beginPath();
  g.ctx.moveTo(x + 14, y - 14);
  g.ctx.lineTo(rx - 8, ry - 14);
  g.ctx.stroke();
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
