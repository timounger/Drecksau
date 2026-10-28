/**
 * Türchen 4 - Rudolfs Nachtflug: Rudolf flies through the night to the
 * North Pole, between chimneys and storm clouds, collecting stars on the way.
 *
 * @module
 * @remarks
 * Hold on for {@link FLIGHT} seconds: every bump costs a heart, with none
 * left the run is lost. Stars only count for the score. Rudolf rises and
 * sinks smoothly while a key is held - no flapping needed.
 */
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

/** Seconds of flight to the North Pole. */
const FLIGHT = 45;

/** Hearts. */
const LIVES = 3;

/** How fast the world goes by, logical px per second. */
const SPEED = 75;

/** Rudolf's place across, and how fast he climbs or sinks, logical px per second. */
const RUDOLF_X = 70;
const CLIMB = 115;

/** How quickly Rudolf reaches the wanted speed, per second. */
const EASE = 9;

/** Highest and lowest place of his feet, logical px. */
const SKY_TOP = 40;
const SKY_LOW = 168;

/** His body for bumps: middle above the feet, and radius. */
const BODY_LIFT = 16;
const BODY_R = 7;

/** Seconds between two obstacles, at the start and at the end. */
const GAP_SLOW = 1.7;
const GAP_FAST = 1.15;

/** Height of the free gap, at the start and at the end, logical px. */
const OPEN_WIDE = 78;
const OPEN_NARROW = 60;

/** The gap's middle stays between these, and moves at most this far. */
const GAP_HIGH = 58;
const GAP_LOW = 132;
const GAP_STEP = 46;

/** Half the width of a chimney and of a cloud column, logical px. */
const CHIMNEY_HALF = 10;
const CLOUD_HALF = 18;

/** Chance an obstacle has only a chimney, or only a cloud. */
const ONLY_ONE = 0.3;

/** Stop sending obstacles this long before the end, seconds. */
const CALM_END = 3;

/** Seconds Rudolf blinks after a bump. */
const SAFE = 1.3;

/** How close a star must be to be taken, logical px. */
const STAR_REACH = 11;

/** Shake on a bump, logical px. */
const SHAKE = 3;

/** How fast the far mountains and the roofs drift, as a share of the speed. */
const FAR = 0.2;
const NEAR = 0.6;

/** Where the mountains and the roofs stand, logical px from the top. */
const MOUNTAINS_Y = 98;
const ROOFS_Y = 130;

/** The top of the field under the HUD, where clouds hang from. */
const CEILING = 14;

/** Spacing of stacked cloud puffs and chimney pieces, logical px. */
const PUFF_STEP = 14;
const BRICK_STEP = 8;

/** Rudolf flaps this fast, frames per second; blinks this fast while safe. */
const FLAP_FPS = 8;
const BLINK = 14;

/** A chimney below the gap and storm clouds above it. */
type Obstacle = {
  x: number;
  /** Top and bottom of the free gap, logical px. */
  readonly top: number;
  readonly bottom: number;
  readonly chimney: boolean;
  readonly cloud: boolean;
  /** A star in the gap, until taken. */
  star: boolean;
};

/** The minigame behind gate 4. */
export const GAME: MiniGame = {
  number: 4,
  id: "rudolfs-nachtflug",
  title: "Rudolfs Nachtflug",
  instructions: [
    `Rudolf fliegt durch die Nacht zum Nordpol. Halte ${String(FLIGHT)} Sekunden durch!`,
    "Weich den Schornsteinen und Gewitterwolken aus - jeder Zusammenstoß kostet ein Herz. Sterne gibt es als Bonus.",
  ],
  controls:
    "Pfeil hoch / runter oder W / S halten - oder Maus / Finger gedrückt halten, Rudolf folgt.",
  ready: true,
  create: (env) => createRun(env.seed, env.sound),
};

/** One run. */
function createRun(seed: number, sound: MiniEnv["sound"]): MiniGameInstance {
  const random = createRandom(seed);
  const effects = createEffects(random);
  const sheet = loadSheet(SHEET_SRC);
  const obstacles: Obstacle[] = [];
  let y = MINI_H / 2;
  let vy = 0;
  let left = FLIGHT;
  let lives = LIVES;
  let stars = 0;
  let starsSeen = 0;
  let safe = 0;
  let nextIn = 1;
  let middle = MINI_H / 2;
  let scroll = 0;
  let status: MiniStatus = "running";

  const share = () => 1 - left / FLIGHT;

  const send = () => {
    middle = Math.max(
      GAP_HIGH,
      Math.min(GAP_LOW, middle + random.range(-GAP_STEP, GAP_STEP)),
    );
    const open = OPEN_WIDE + (OPEN_NARROW - OPEN_WIDE) * share();
    const single = random.chance(ONLY_ONE);
    const chimneyOnly = single && random.chance(1 / 2);
    obstacles.push({
      x: MINI_W + CLOUD_HALF,
      top: middle - open / 2,
      bottom: middle + open / 2,
      chimney: !single || chimneyOnly,
      cloud: !single || !chimneyOnly,
      star: true,
    });
    starsSeen += 1;
    nextIn = GAP_SLOW + (GAP_FAST - GAP_SLOW) * share();
  };

  const fly = (input: MiniInput, dt: number) => {
    let want = input.axisY * CLIMB;
    if (input.axisY === 0 && input.pointerDown && input.pointer !== null) {
      want = Math.max(
        -CLIMB,
        Math.min(CLIMB, ((input.pointer.y + BODY_LIFT - y) * EASE) / 2),
      );
    }
    vy += (want - vy) * Math.min(1, EASE * dt);
    y = Math.max(SKY_TOP, Math.min(SKY_LOW, y + vy * dt));
  };

  const collide = () => {
    const bx = RUDOLF_X;
    const by = y - BODY_LIFT;
    for (const ob of obstacles) {
      const inChimney =
        ob.chimney &&
        Math.abs(bx - ob.x) < CHIMNEY_HALF + BODY_R &&
        by + BODY_R > ob.bottom;
      const inCloud =
        ob.cloud &&
        Math.abs(bx - ob.x) < CLOUD_HALF + BODY_R / 2 &&
        by - BODY_R < ob.top;
      if ((inChimney || inCloud) && safe <= 0) {
        lives -= 1;
        safe = SAFE;
        sound("bump");
        effects.shake(SHAKE);
        effects.burst(bx, by, { colors: ["#ffffff", "#ff8a8a", "#ffd84a"] });
        effects.float("Uff!", bx, by - BODY_LIFT, "#ff9a9a");
      }
      if (
        ob.star &&
        Math.hypot(bx - ob.x, by - (ob.top + ob.bottom) / 2) < STAR_REACH
      ) {
        ob.star = false;
        stars += 1;
        sound("coin");
        effects.burst(ob.x, (ob.top + ob.bottom) / 2, {
          colors: ["#ffd84a", "#fff4b0", "#ffffff"],
        });
        effects.float("+1", ob.x, ob.top + BODY_LIFT);
      }
    }
  };

  return {
    step(input, dt) {
      if (status === "running") {
        left -= dt;
        safe -= dt;
        scroll += SPEED * dt;
        fly(input, dt);
        nextIn -= dt;
        if (nextIn <= 0 && left > CALM_END) {
          send();
        }
        for (const ob of obstacles) {
          ob.x -= SPEED * dt;
        }
        obstacles.splice(
          0,
          obstacles.length,
          ...obstacles.filter((ob) => ob.x > -CLOUD_HALF * 2),
        );
        collide();
        if (lives <= 0) {
          status = "lost";
        } else if (left <= 0) {
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
      drawNight(g, sheet, {
        scroll,
        obstacles,
        y,
        vy,
        left,
        blink: safe > 0 && Math.floor(g.time * BLINK) % 2 === 0,
      });
      g.ctx.restore();
      effects.draw(g);
      drawHud(g, {
        score: stars,
        scoreLabel: "Sterne",
        time: left,
        lives,
        maxLives: LIVES,
      });
      drawProgress(g, share());
    },
    summary() {
      const end =
        lives > 0
          ? "Rudolf ist am Nordpol angekommen!"
          : "Rudolf musste landen.";
      return `${end} ${String(stars)} von ${String(starsSeen)} Sternen gesammelt.`;
    },
  };
}

/** What the night needs to know. */
type NightState = {
  readonly scroll: number;
  readonly obstacles: readonly Obstacle[];
  readonly y: number;
  readonly vy: number;
  readonly left: number;
  readonly blink: boolean;
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- scene layout and
   offsets, picked by eye */
/** Sky, mountains, roofs, obstacles, the North Pole and Rudolf. */
function drawNight(g: MiniDraw, sheet: HTMLImageElement, s: NightState): void {
  const ctx = g.ctx;
  drawSprite(ctx, sheet, SPRITES.sky, 0, 0);
  tile(ctx, sheet, SPRITES.mountains, s.scroll * FAR, MOUNTAINS_Y);
  tile(ctx, sheet, SPRITES.roofs, s.scroll * NEAR, ROOFS_Y);
  for (const ob of s.obstacles) {
    if (ob.chimney) {
      for (let top = ob.bottom + 10; top < MINI_H; top += BRICK_STEP) {
        drawSprite(ctx, sheet, SPRITES.chimneyPart, ob.x - CHIMNEY_HALF, top);
      }
      drawSprite(
        ctx,
        sheet,
        SPRITES.chimneyTop,
        ob.x - CHIMNEY_HALF - 1,
        ob.bottom,
      );
    }
    if (ob.cloud) {
      for (
        let bottom = ob.top;
        bottom > CEILING - PUFF_STEP;
        bottom -= PUFF_STEP
      ) {
        const cloud =
          (Math.round(bottom) / PUFF_STEP) % 2 < 1
            ? SPRITES.cloudA
            : SPRITES.cloudB;
        drawSprite(
          ctx,
          sheet,
          cloud,
          ob.x - CLOUD_HALF - 2,
          bottom - cloud[3] + 2,
        );
      }
    }
    if (ob.star) {
      const middle = (ob.top + ob.bottom) / 2;
      drawGlow(ctx, ob.x, middle, 10, "255, 220, 90", 0.35);
      drawSpriteCentred(
        ctx,
        sheet,
        Math.floor(g.time * 6) % 2 === 0 ? SPRITES.star0 : SPRITES.star1,
        ob.x,
        middle,
      );
    }
  }
  if (s.left < CALM_END) {
    const pole = SPRITES.northPole;
    const x = MINI_W - (CALM_END - s.left) * SPEED * 0.8;
    drawSprite(ctx, sheet, pole, x, MINI_H - pole[3]);
    g.text("Nordpol", x + pole[2] / 2, MINI_H - pole[3] + 28, {
      size: 5,
      bold: true,
      align: "center",
      baseline: "middle",
      color: "#fff4dc",
    });
  }
  if (!s.blink) {
    const tilt = s.vy / CLIMB;
    const nose = { x: RUDOLF_X + 14, y: s.y - 19 + tilt * 2 };
    drawGlow(ctx, nose.x, nose.y, 22, "255, 40, 40", 0.5);
    drawFigure(
      ctx,
      g.art,
      "rudolf",
      RUDOLF_X,
      s.y,
      "fly",
      "side",
      g.time * FLAP_FPS,
    );
    drawGlow(ctx, nose.x, nose.y, 3, "255, 240, 220", 1);
  }
  drawSnowfall(ctx, g.time, 30);
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
  const start = -(offset % w);
  for (let x = start; x < MINI_W; x += w) {
    drawSprite(ctx, sheet, rect, Math.floor(x), y);
  }
}

/** A thin bar under the HUD: how far it is to the North Pole. */
function drawProgress(g: MiniDraw, share: number): void {
  const ctx = g.ctx;
  ctx.fillStyle = "rgba(20, 10, 26, 0.6)";
  ctx.fillRect(100, 16, 120, 3);
  ctx.fillStyle = "#e8b830";
  ctx.fillRect(100, 16, 120 * Math.min(1, share), 3);
  ctx.fillStyle = "#ff4040";
  ctx.fillRect(100 + 120 * Math.min(1, share) - 1, 15, 2, 5);
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
