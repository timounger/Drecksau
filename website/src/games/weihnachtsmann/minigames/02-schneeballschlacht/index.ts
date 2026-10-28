/**
 * Türchen 2 - Schneeballschlacht: Grantelbart and Gugor pop up behind snow
 * walls; hit them with snowballs - but never Gilfi, who only wants to help.
 *
 * @module
 * @remarks
 * Hit {@link GOAL} trolls before the clock runs out. Each snowball hitting
 * Gilfi costs a life; with none left the run is lost.
 */
import type { FigureId } from "@/games/weihnachtsmann/components/sprite-atlas";
import {
  drawFigure,
  drawHud,
  drawSprite,
  drawSpriteCentred,
  loadSheet,
} from "../kit/draw";
import { createEffects } from "../kit/effects";
import { createRandom } from "../kit/random";
import {
  MINI_H,
  MINI_W,
  type MiniDraw,
  type MiniEnv,
  type MiniGame,
  type MiniGameInstance,
  type MiniInput,
  type MiniStatus,
} from "../types";
import { SHEET_SRC, SPRITES } from "./sprites";

/** Trolls to hit. */
const GOAL = 12;

/** Seconds on the clock. */
const TIME = 45;

/** Snowballs on Gilfi the player may throw before the run is lost. */
const LIVES = 3;

/** Seconds between two pop-ups, at the start and at the end. */
const POP_SLOW = 1.1;
const POP_FAST = 0.6;

/** Seconds a figure stays up, at the start and at the end. */
const STAY_LONG = 1.8;
const STAY_SHORT = 1.05;

/** Seconds to rise or duck. */
const RISE = 0.18;

/** Chance a pop-up is Gilfi. */
const GILFI_CHANCE = 0.22;

/** How fast the crosshair moves with keys, logical px per second. */
const AIM_SPEED = 180;

/** Seconds a snowball flies, and between two throws. */
const FLIGHT = 0.28;
const COOLDOWN = 0.2;

/** How high the snowball's arc goes, logical px. */
const ARC = 26;

/** Where the snowballs come from, logical px. */
const HAND = { x: MINI_W / 2, y: MINI_H } as const;

/** A figure's hit box: half its width, and from its head down to the wall. */
const HIT_HALF = 10;
const HEAD = 34;

/** How far a figure rises above its hidden place, logical px. */
const RISE_HEIGHT = 34;

/** Where a hidden figure's feet are, below the wall's foot line. */
const HIDDEN_DROP = 26;

/** The wall hides everything this far above its foot line, logical px. */
const WALL_LIP = 20;

/** Where the face is above the feet, for the splat, logical px. */
const FACE = 26;

/** Seconds the splat stays on a hit troll before it ducks. */
const SPLAT_TIME = 0.45;

/** Shake when Gilfi is hit, logical px. */
const SHAKE = 3;

/** Snowballs shrink to this share of their size on the way in. */
const FAR_SIZE = 0.5;

/** A hiding place: the wall's middle and foot line, and which row. */
type Hole = {
  readonly x: number;
  readonly y: number;
  readonly wall: "wallA" | "wallB";
};

/** The walls: three at the back, two in front. */
const HOLES: readonly Hole[] = [
  { x: 60, y: 96, wall: "wallA" },
  { x: 160, y: 96, wall: "wallB" },
  { x: 260, y: 96, wall: "wallA" },
  { x: 108, y: 146, wall: "wallB" },
  { x: 212, y: 146, wall: "wallA" },
];

/** Somebody popping up behind a wall. */
type Popper = {
  readonly hole: number;
  readonly who: FigureId;
  /** Seconds since it began to rise. */
  age: number;
  readonly stay: number;
  /** Seconds since a snowball hit it, or -1. */
  hit: number;
};

/** A snowball in the air. */
type Ball = { readonly tx: number; readonly ty: number; age: number };

/** The minigame behind gate 2. */
export const GAME: MiniGame = {
  number: 2,
  id: "schneeballschlacht",
  title: "Schneeballschlacht",
  instructions: [
    `Grantelbart und Gugor tauchen hinter den Schneewällen auf. Triff ${String(GOAL)}-mal, bevor die Zeit um ist.`,
    "Aber nicht Gilfi bewerfen - der will nur helfen! Dreimal Gilfi, und die Schlacht ist verloren.",
  ],
  controls:
    "Klicken oder tippen wirft dorthin - oder mit den Pfeilen zielen und Leertaste werfen.",
  ready: true,
  create: (env) => createRun(env.seed, env.sound),
};

/** One run. */
function createRun(seed: number, sound: MiniEnv["sound"]): MiniGameInstance {
  const random = createRandom(seed);
  const effects = createEffects(random);
  const sheet = loadSheet(SHEET_SRC);
  const poppers: Popper[] = [];
  const balls: Ball[] = [];
  let aimX = MINI_W / 2;
  let aimY = MINI_H / 2;
  let hits = 0;
  let lives = LIVES;
  let left = TIME;
  let popIn = 1 / 2;
  let cooldown = 0;
  let status: MiniStatus = "running";

  const share = () => 1 - left / TIME;

  const popUp = () => {
    const free = HOLES.map((_, index) => index).filter(
      (index) => !poppers.some((popper) => popper.hole === index),
    );
    if (free.length > 0) {
      const gilfi = random.chance(GILFI_CHANCE);
      poppers.push({
        hole: random.pick(free),
        who: gilfi ? "gilfi" : random.pick<FigureId>(["grantelbart", "gugor"]),
        age: 0,
        stay: STAY_LONG + (STAY_SHORT - STAY_LONG) * share(),
        hit: -1,
      });
    }
    popIn = POP_SLOW + (POP_FAST - POP_SLOW) * share();
  };

  const aim = (input: MiniInput, dt: number) => {
    aimX = Math.max(0, Math.min(MINI_W, aimX + input.axisX * AIM_SPEED * dt));
    aimY = Math.max(0, Math.min(MINI_H, aimY + input.axisY * AIM_SPEED * dt));
    if (input.pointer !== null && input.axisX === 0 && input.axisY === 0) {
      aimX = input.pointer.x;
      aimY = input.pointer.y;
    }
    const tap = input.taps[input.taps.length - 1];
    if (tap !== undefined) {
      aimX = tap.x;
      aimY = tap.y;
    }
    if ((input.pressed.has("action") || tap !== undefined) && cooldown <= 0) {
      balls.push({ tx: aimX, ty: aimY, age: 0 });
      cooldown = COOLDOWN;
      sound("whoosh");
    }
  };

  const strike = (ball: Ball) => {
    // Front walls first: they stand before the back ones.
    const order = [...poppers].sort(
      (a, b) => HOLES[b.hole].y - HOLES[a.hole].y,
    );
    const target = order.find((popper) => {
      const hole = HOLES[popper.hole];
      return (
        popper.hit < 0 &&
        risen(popper) > 1 / 2 &&
        Math.abs(ball.tx - hole.x) < HIT_HALF &&
        ball.ty > feetOf(popper) - HEAD &&
        ball.ty < hole.y - WALL_LIP
      );
    });
    if (target === undefined) {
      sound("splat");
      effects.burst(ball.tx, ball.ty, {
        colors: ["#ffffff", "#d2ddef"],
        speed: 40,
      });
    } else {
      target.hit = 0;
      if (target.who === "gilfi") {
        lives -= 1;
        sound("miss");
        effects.shake(SHAKE);
        effects.float(
          "Aua! Ich bin's, Gilfi!",
          HOLES[target.hole].x,
          ball.ty - HIT_HALF,
          "#ff9a9a",
        );
      } else {
        hits += 1;
        sound("hit");
        effects.burst(ball.tx, ball.ty, {
          colors: ["#ffffff", "#d2ddef", "#ffd84a"],
        });
        effects.float("Treffer!", HOLES[target.hole].x, ball.ty - HIT_HALF);
      }
    }
  };

  return {
    step(input, dt) {
      if (status === "running") {
        left -= dt;
        cooldown -= dt;
        popIn -= dt;
        if (popIn <= 0) {
          popUp();
        }
        aim(input, dt);
        for (const popper of poppers) {
          popper.age += dt;
          if (popper.hit >= 0) {
            popper.hit += dt;
          }
        }
        removeWhere(
          poppers,
          (popper) =>
            popper.age > popper.stay + RISE * 2 ||
            popper.hit > SPLAT_TIME + RISE,
        );
        for (const ball of balls) {
          ball.age += dt;
          if (ball.age >= FLIGHT) {
            strike(ball);
          }
        }
        removeWhere(balls, (ball) => ball.age >= FLIGHT);
        if (hits >= GOAL) {
          status = "won";
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
      drawField(g, sheet, poppers, balls, aimX, aimY);
      g.ctx.restore();
      effects.draw(g);
      drawHud(g, {
        score: hits,
        goal: GOAL,
        scoreLabel: "Treffer",
        time: left,
        lives,
        maxLives: LIVES,
      });
    },
    summary() {
      return `${String(hits)} von ${String(GOAL)} Trollen getroffen.`;
    },
  };
}

/**
 * How far up a figure is, 0 (hidden) to 1 (up); a hit troll ducks after the
 * splat.
 */
function risen(popper: Popper): number {
  let up = Math.min(1, popper.age / RISE);
  if (popper.hit > SPLAT_TIME) {
    up = Math.max(0, 1 - (popper.hit - SPLAT_TIME) / RISE);
  } else if (popper.hit < 0 && popper.age > popper.stay + RISE) {
    up = Math.max(0, 1 - (popper.age - popper.stay - RISE) / RISE);
  }
  return up;
}

/** Where a figure's feet are now, logical px from the top. */
function feetOf(popper: Popper): number {
  return HOLES[popper.hole].y + HIDDEN_DROP - risen(popper) * RISE_HEIGHT;
}

/* eslint-disable @typescript-eslint/no-magic-numbers -- scene layout and
   offsets, picked by eye */
/** The clearing, the walls with their figures, the snowballs and the aim. */
function drawField(
  g: MiniDraw,
  sheet: HTMLImageElement,
  poppers: readonly Popper[],
  balls: readonly Ball[],
  aimX: number,
  aimY: number,
): void {
  const ctx = g.ctx;
  drawSprite(ctx, sheet, SPRITES.backdrop, 0, 0);
  HOLES.forEach((hole, index) => {
    const popper = poppers.find((candidate) => candidate.hole === index);
    if (popper !== undefined) {
      const feet = feetOf(popper);
      ctx.save();
      ctx.beginPath();
      ctx.rect(hole.x - 30, 0, 60, hole.y - 8);
      ctx.clip();
      const wobble = popper.hit >= 0 ? Math.sin(popper.hit * 40) * 1.5 : 0;
      drawFigure(
        ctx,
        g.art,
        popper.who,
        hole.x + wobble,
        feet,
        "idle",
        "down",
        g.time * 2,
      );
      if (popper.hit >= 0) {
        const frame =
          popper.hit < 0.08
            ? SPRITES.splat0
            : popper.hit < 0.16
              ? SPRITES.splat1
              : SPRITES.splat2;
        drawSprite(
          ctx,
          sheet,
          frame,
          hole.x - frame[2] / 2,
          feet - FACE - frame[3] / 2,
        );
      }
      ctx.restore();
    }
    const wall = SPRITES[hole.wall];
    drawSprite(ctx, sheet, wall, hole.x - wall[2] / 2, hole.y - wall[3]);
  });
  drawSprite(ctx, sheet, SPRITES.pile, HAND.x - 40, MINI_H - 16);
  for (const ball of balls) {
    const t = ball.age / FLIGHT;
    const x = HAND.x + (ball.tx - HAND.x) * t;
    const y = HAND.y + (ball.ty - HAND.y) * t - Math.sin(t * Math.PI) * ARC;
    drawSpriteCentred(
      ctx,
      sheet,
      SPRITES.snowball,
      x,
      y,
      1 - (1 - FAR_SIZE) * t + 0.5 * (1 - t),
    );
  }
  const hot = poppers.some((popper) => {
    const hole = HOLES[popper.hole];
    return (
      risen(popper) > 0.5 &&
      Math.abs(aimX - hole.x) < HIT_HALF &&
      aimY < hole.y - WALL_LIP &&
      aimY > feetOf(popper) - HEAD
    );
  });
  drawSpriteCentred(
    ctx,
    sheet,
    hot ? SPRITES.crosshairHot : SPRITES.crosshair,
    aimX,
    aimY,
  );
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** Removes the entries of a list that pass a test, in place. */
function removeWhere<T>(list: T[], gone: (item: T) => boolean): void {
  const keep = list.filter((item) => !gone(item));
  list.splice(0, list.length, ...keep);
}
