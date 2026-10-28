/**
 * Türchen 11 - Trixis Sternbilder: Trixi joins the stars of the winter sky
 * in order, 1, 2, 3 ..., and a picture appears - a star, a fir, a bell, a
 * candle and a snowman.
 *
 * @module
 * @remarks
 * Five pictures, each with its own clock. Every star in the right order
 * draws a golden line; a wrong star costs {@link WRONG_COST} seconds. When a
 * picture's clock runs out the run is lost.
 */
import type { Recipe } from "@/games/weihnachtsmann/audio/sounds";
import { snap } from "@/games/weihnachtsmann/components/sprites";
import {
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
  MINI_W,
  type MiniDraw,
  type MiniEnv,
  type MiniGame,
  type MiniGameInstance,
  type MiniInput,
  type MiniPoint,
  type MiniStatus,
} from "../types";
import { SHEET_SRC, SPRITES } from "./sprites";

/** Seconds a picture's clock starts with: a base and some per star. */
const TIME_BASE = 12;
const TIME_PER_STAR = 1.6;

/** Seconds lost for a star out of turn. */
const WRONG_COST = 2;

/** Seconds a finished picture shines before the next one. */
const DONE_TIME = 1.8;

/** How fast a finished picture's name fades in, per second. */
const NAME_FADE = 4;

/** Seconds a wrong star stays red. */
const WRONG_FLASH = 0.45;

/** A tap this close to a star hits it, logical px. */
const HIT = 11;

/** How far a whole picture may move off its place, and each star, logical px. */
const SHIFT_X = 22;
const SHIFT_Y = 5;
const JITTER = 2.5;

/** Numbers sit this far out from their star, logical px. */
const LABEL_OUT = 8;

/** Places tried round a star for its number, and the room that is enough. */
const LABEL_TRIES = 12;
const LABEL_CLEAR = 16;

/** Background stars twinkling round the pictures. */
const SKY_STARS = 36;

/** The sky's band for background stars, logical px. */
const SKY_TOP = 18;
const SKY_LOW = 140;

/** How fast Trixi follows the line (share per second) and her start. */
const TRIXI_FOLLOW = 5;
const TRIXI_START: MiniPoint = { x: 40, y: 120 };

/** Trixi hovers this far below and beside the star she reached, logical px. */
const TRIXI_BELOW = 10;
const TRIXI_SIDE = 8;

/** How fast the keys move the aim, logical px per second. */
const AIM_SPEED = 120;

/** The ring snaps to a star this close to the aim, logical px. */
const SNAP = 14;

/** How strong the glow round a line is, as a share of the line. */
const GLOW_SHARE = 0.3;

/** Bursts. */
const STAR_BURST = 10;
const DONE_BURST = 22;

/** Shake on a wrong star, logical px. */
const SHAKE = 2;

/** One picture: its German name, the stars in order, closed or not. */
type Picture = {
  readonly name: string;
  readonly points: readonly MiniPoint[];
  readonly closed: boolean;
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- the pictures, drawn
   on the field in logical px */
/** The five pictures, smallest first. */
const PICTURES: readonly Picture[] = [
  {
    name: "Der Stern",
    closed: true,
    points: [
      { x: 160, y: 30 },
      { x: 194, y: 130 },
      { x: 110, y: 66 },
      { x: 210, y: 66 },
      { x: 126, y: 130 },
    ],
  },
  {
    name: "Der Tannenbaum",
    closed: true,
    points: [
      { x: 160, y: 26 },
      { x: 198, y: 74 },
      { x: 180, y: 76 },
      { x: 216, y: 126 },
      { x: 104, y: 126 },
      { x: 140, y: 76 },
      { x: 122, y: 74 },
    ],
  },
  {
    name: "Die Glocke",
    closed: true,
    points: [
      { x: 160, y: 26 },
      { x: 186, y: 42 },
      { x: 190, y: 84 },
      { x: 216, y: 116 },
      { x: 160, y: 136 },
      { x: 104, y: 116 },
      { x: 130, y: 84 },
      { x: 134, y: 42 },
    ],
  },
  {
    name: "Die Kerze",
    closed: true,
    points: [
      { x: 160, y: 24 },
      { x: 172, y: 42 },
      { x: 168, y: 56 },
      { x: 188, y: 62 },
      { x: 186, y: 134 },
      { x: 134, y: 134 },
      { x: 132, y: 62 },
      { x: 152, y: 56 },
      { x: 148, y: 42 },
    ],
  },
  {
    name: "Der Schneemann",
    closed: true,
    points: [
      { x: 160, y: 24 },
      { x: 178, y: 36 },
      { x: 176, y: 58 },
      { x: 200, y: 74 },
      { x: 206, y: 104 },
      { x: 190, y: 134 },
      { x: 130, y: 134 },
      { x: 114, y: 104 },
      { x: 120, y: 74 },
      { x: 144, y: 58 },
      { x: 142, y: 36 },
    ],
  },
];

/** A rising scale: every star in a row sounds one step higher. */
const SCALE: readonly number[] = [
  523, 587, 659, 698, 784, 880, 988, 1047, 1175, 1319, 1397, 1568,
];
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** One star of the current picture. */
type Star = {
  readonly x: number;
  readonly y: number;
  /** Where its number sits. */
  readonly labelX: number;
  readonly labelY: number;
  lit: boolean;
  /** Seconds it still shows red after a wrong pick. */
  wrong: number;
};

/** A background star. */
type SkyStar = {
  readonly x: number;
  readonly y: number;
  readonly phase: number;
};

/** The minigame behind gate 11. */
export const GAME: MiniGame = {
  number: 11,
  id: "sternbilder",
  title: "Trixis Sternbilder",
  instructions: [
    `Verbinde die Sterne der Reihe nach - 1, 2, 3 ... - und Trixi zeichnet ein Sternbild. Schaffe alle ${String(PICTURES.length)} Bilder.`,
    `Jedes Bild hat seine eigene Zeit. Ein falscher Stern kostet ${String(WRONG_COST)} Sekunden.`,
  ],
  controls:
    "Sterne anklicken oder antippen - oder mit den Pfeilen zielen und Leertaste.",
  ready: true,
  create: (env) => createRun(env.seed, env.sound),
};

/** One run. */
function createRun(seed: number, sound: MiniEnv["sound"]): MiniGameInstance {
  const random = createRandom(seed);
  const effects = createEffects(random);
  const sheet = loadSheet(SHEET_SRC);
  const sky: SkyStar[] = Array.from({ length: SKY_STARS }, () => ({
    x: random.range(0, MINI_W),
    y: random.range(SKY_TOP, SKY_LOW),
    phase: random.range(0, Math.PI * 2),
  }));
  let picture = 0;
  let stars = layout(random, PICTURES[0]);
  let next = 0;
  let aimX = MINI_W / 2;
  let aimY = (SKY_TOP + SKY_LOW) / 2;
  let left = timeFor(PICTURES[0]);
  let done = -1;
  let trixiX = TRIXI_START.x;
  let trixiY = TRIXI_START.y;
  let trixiLeft = false;
  let lastPointer: MiniPoint | null = null;
  let wrongs = 0;
  let status: MiniStatus = "running";

  const nearest = (point: MiniPoint, reach: number) => {
    let best = -1;
    let bestDistance = reach;
    stars.forEach((star, index) => {
      const distance = Math.hypot(star.x - point.x, star.y - point.y);
      if (distance < bestDistance) {
        best = index;
        bestDistance = distance;
      }
    });
    return best;
  };

  const finish = () => {
    done = 0;
    sound("firework");
    for (const star of stars) {
      effects.burst(star.x, star.y, { count: DONE_BURST / 2, speed: 50 });
    }
    const top = Math.min(...stars.map((star) => star.y));
    effects.burst(MINI_W / 2, top, { count: DONE_BURST });
  };

  const pick = (index: number) => {
    const star = stars[index];
    if (index === next) {
      star.lit = true;
      next += 1;
      sound({
        tones: [
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- seconds and loudness of the chime
          ["triangle", SCALE[index], SCALE[index], 0.22, 0, 0.6],
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- seconds and loudness of the chime
          ["sine", SCALE[index] * 2, SCALE[index] * 2, 0.15, 0, 0.2],
        ],
      } satisfies Recipe);
      effects.burst(star.x, star.y, {
        count: STAR_BURST,
        speed: 40,
        colors: ["#ffd84a", "#fff4b0", "#ffffff"],
      });
      if (next >= stars.length) {
        finish();
      }
    } else if (!star.lit) {
      star.wrong = WRONG_FLASH;
      left -= WRONG_COST;
      wrongs += 1;
      sound("miss");
      effects.shake(SHAKE);
      effects.float(
        `-${String(WRONG_COST)} s`,
        star.x,
        star.y - LABEL_OUT,
        "#ff9a9a",
      );
    } else {
      sound("click");
    }
  };

  const play = (input: MiniInput, dt: number) => {
    aimX = Math.max(0, Math.min(MINI_W, aimX + input.axisX * AIM_SPEED * dt));
    aimY = Math.max(
      SKY_TOP,
      Math.min(SKY_LOW + HIT, aimY + input.axisY * AIM_SPEED * dt),
    );
    const p = input.pointer;
    if (
      p !== null &&
      (lastPointer === null || p.x !== lastPointer.x || p.y !== lastPointer.y)
    ) {
      aimX = p.x;
      aimY = p.y;
    }
    lastPointer = p;
    for (const tap of input.taps) {
      const hit = nearest(tap, HIT);
      if (hit >= 0 && done < 0) {
        pick(hit);
      }
    }
    const aimed = nearest({ x: aimX, y: aimY }, SNAP);
    if (input.pressed.has("action") && done < 0 && aimed >= 0) {
      pick(aimed);
    }
  };

  const fly = (dt: number) => {
    const target = next > 0 ? stars[next - 1] : TRIXI_START;
    const wantX = target.x + (trixiLeft ? TRIXI_SIDE : -TRIXI_SIDE);
    const wantY = target.y + TRIXI_BELOW;
    const share = Math.min(1, TRIXI_FOLLOW * dt);
    if (Math.abs(wantX - trixiX) > 1) {
      trixiLeft = wantX < trixiX;
    }
    trixiX += (wantX - trixiX) * share;
    trixiY += (wantY - trixiY) * share;
  };

  return {
    step(input, dt) {
      if (status === "running") {
        for (const star of stars) {
          star.wrong -= dt;
        }
        if (done >= 0) {
          done += dt;
          if (done >= DONE_TIME) {
            picture += 1;
            if (picture >= PICTURES.length) {
              status = "won";
            } else {
              stars = layout(random, PICTURES[picture]);
              next = 0;
              left = timeFor(PICTURES[picture]);
              done = -1;
              sound("whoosh");
            }
          }
        } else {
          left -= dt;
          play(input, dt);
          if (left <= 0) {
            left = 0;
            status = "lost";
          }
        }
        fly(dt);
      }
      effects.update(dt);
      return status;
    },
    draw(g) {
      const shake = effects.offset();
      g.ctx.save();
      g.ctx.translate(shake.x, shake.y);
      drawScene(g, sheet, {
        sky,
        stars,
        next,
        aim: { x: aimX, y: aimY },
        cursor: nearest({ x: aimX, y: aimY }, SNAP),
        closed: PICTURES[Math.min(picture, PICTURES.length - 1)].closed,
        done,
        trixiX,
        trixiY,
        trixiLeft,
      });
      effects.draw(g);
      g.ctx.restore();
      if (done >= 0) {
        g.text(
          PICTURES[Math.min(picture, PICTURES.length - 1)].name + "!",
          MINI_W / 2,
          SKY_LOW + LABEL_OUT * 2,
          {
            size: 12,
            bold: true,
            align: "center",
            baseline: "middle",
            color: "#ffe9a8",
            outline: "#2a1430",
            alpha: Math.min(1, done * NAME_FADE),
          },
        );
      }
      drawHud(g, {
        score: Math.min(picture, PICTURES.length),
        goal: PICTURES.length,
        scoreLabel: "Sternbilder",
        time: left,
      });
    },
    summary() {
      const misses =
        wrongs === 0
          ? "ohne falschen Stern"
          : `${String(wrongs)} falsche Sterne`;
      return `${String(Math.min(picture, PICTURES.length))} von ${String(PICTURES.length)} Sternbildern, ${misses}.`;
    },
  };
}

/** The clock for a picture, seconds. */
function timeFor(picture: Picture): number {
  return TIME_BASE + TIME_PER_STAR * picture.points.length;
}

/** Places a picture's stars, a little moved and shaken, numbers outside. */
function layout(random: Random, picture: Picture): Star[] {
  const dx = random.range(-SHIFT_X, SHIFT_X);
  // Only downwards: the top numbers must stay clear of the HUD.
  const dy = random.range(SHIFT_Y, SHIFT_Y * 2);
  const n = picture.points.length;
  const middleX = picture.points.reduce((sum, p) => sum + p.x, 0) / n + dx;
  const middleY = picture.points.reduce((sum, p) => sum + p.y, 0) / n + dy;
  const spots = picture.points.map((point) => ({
    x: point.x + dx + random.range(-JITTER, JITTER),
    y: point.y + dy + random.range(-JITTER, JITTER),
  }));
  return spots.map((spot) => {
    const label = placeLabel(spot, spots, middleX, middleY);
    return { ...spot, labelX: label.x, labelY: label.y, lit: false, wrong: 0 };
  });
}

/**
 * Finds a place for a star's number that is clearly nearer to its own star
 * than to any other, preferring the side away from the picture's middle.
 */
function placeLabel(
  star: MiniPoint,
  all: readonly MiniPoint[],
  middleX: number,
  middleY: number,
): MiniPoint {
  const away = Math.atan2(star.y - middleY, star.x - middleX);
  let best: MiniPoint = star;
  let bestScore = -Infinity;
  for (let k = 0; k < LABEL_TRIES; k += 1) {
    const angle = away + (k * Math.PI * 2) / LABEL_TRIES;
    const spot = {
      x: star.x + Math.cos(angle) * LABEL_OUT,
      y: star.y + Math.sin(angle) * LABEL_OUT,
    };
    const others = all
      .filter((other) => other !== star)
      .map((other) => Math.hypot(other.x - spot.x, other.y - spot.y));
    const clearance = Math.min(LABEL_CLEAR, ...others);
    // Clear of the others first; then the closer to "outwards" the better.
    const score = clearance - Math.abs(Math.sin((angle - away) / 2));
    if (score > bestScore) {
      best = spot;
      bestScore = score;
    }
  }
  return best;
}

/** What the scene needs to know. */
type SceneState = {
  readonly sky: readonly SkyStar[];
  readonly stars: readonly Star[];
  readonly next: number;
  /** Where the keys or the pointer aim, and the star the ring snaps to (or -1). */
  readonly aim: MiniPoint;
  readonly cursor: number;
  readonly closed: boolean;
  /** Seconds since the picture was finished, or -1. */
  readonly done: number;
  readonly trixiX: number;
  readonly trixiY: number;
  readonly trixiLeft: boolean;
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- scene layout,
   colours and motions, picked by eye */
/** The sky, the golden lines, the stars with their numbers and Trixi. */
function drawScene(g: MiniDraw, sheet: HTMLImageElement, s: SceneState): void {
  const ctx = g.ctx;
  drawSprite(ctx, sheet, SPRITES.backdrop, 0, 0);
  for (const star of s.sky) {
    const a = 0.35 + 0.35 * Math.sin(g.time * 2 + star.phase);
    ctx.fillStyle = `rgba(220, 230, 255, ${String(a)})`;
    ctx.fillRect(snap(star.x), snap(star.y), 1, 1);
  }
  // The lines drawn so far, glowing brighter once the picture is done.
  const glow = s.done >= 0 ? 0.6 + 0.4 * Math.sin(g.time * 10) : 0.85;
  for (let k = 1; k < s.next; k += 1) {
    drawLine(ctx, s.stars[k - 1], s.stars[k], glow);
  }
  if (s.closed && s.done >= 0) {
    drawLine(
      ctx,
      s.stars[s.stars.length - 1],
      s.stars[0],
      glow * Math.min(1, s.done * 3),
    );
  }
  // A faint line from the last star to where the player points.
  if (s.done < 0 && s.next > 0) {
    ctx.globalAlpha = 0.25;
    drawLine(
      ctx,
      s.stars[s.next - 1],
      s.cursor >= 0 ? s.stars[s.cursor] : s.aim,
      0.6,
    );
    ctx.globalAlpha = 1;
  }
  s.stars.forEach((star, index) => {
    if (star.lit) {
      drawGlow(ctx, star.x, star.y, 9, "255, 220, 90", 0.45);
      drawSpriteCentred(ctx, sheet, SPRITES.starLit, star.x, star.y);
    } else if (star.wrong > 0) {
      drawGlow(ctx, star.x, star.y, 9, "255, 60, 80", 0.5);
      drawSpriteCentred(
        ctx,
        sheet,
        SPRITES.starWrong,
        star.x + Math.sin(g.time * 60),
        star.y,
      );
    } else {
      const twinkle = Math.floor(g.time * 3 + index) % 4 === 0;
      drawGlow(ctx, star.x, star.y, 7, "180, 200, 255", 0.25);
      drawSpriteCentred(
        ctx,
        sheet,
        twinkle ? SPRITES.star1 : SPRITES.star0,
        star.x,
        star.y,
      );
    }
    if (!star.lit && s.done < 0) {
      g.text(String(index + 1), star.labelX, star.labelY, {
        size: 7,
        bold: true,
        align: "center",
        baseline: "middle",
        color: index === s.next ? "#ffe9a8" : "#c8d4ff",
        outline: "#05081e",
      });
    }
  });
  if (s.done < 0 && s.cursor >= 0) {
    const at = s.stars[s.cursor];
    const pulse = 1 + Math.sin(g.time * 6) * 0.08;
    drawSpriteCentred(ctx, sheet, SPRITES.ring, at.x, at.y, pulse);
  } else if (s.done < 0) {
    ctx.fillStyle = "rgba(255, 233, 168, 0.8)";
    ctx.fillRect(snap(s.aim.x) - 3, snap(s.aim.y), 2, 1 / 2);
    ctx.fillRect(snap(s.aim.x) + 1, snap(s.aim.y), 2, 1 / 2);
    ctx.fillRect(snap(s.aim.x), snap(s.aim.y) - 3, 1 / 2, 2);
    ctx.fillRect(snap(s.aim.x), snap(s.aim.y) + 1, 1 / 2, 2);
  }
  drawFigure(
    ctx,
    g.art,
    "trixi",
    s.trixiX,
    s.trixiY + Math.sin(g.time * 4) * 1.5,
    "fly",
    "side",
    g.time * 8,
    s.trixiLeft,
  );
  if (Math.floor(g.time * 8) % 2 === 0) {
    ctx.fillStyle = "#fff4b0";
    ctx.fillRect(
      snap(s.trixiX + (s.trixiLeft ? 8 : -8)),
      snap(s.trixiY - 6),
      1,
      1,
    );
  }
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** A golden line of whole pixels between two points, with a soft glow. */
function drawLine(
  ctx: CanvasRenderingContext2D,
  from: MiniPoint,
  to: MiniPoint,
  strength: number,
): void {
  const steps = Math.max(
    1,
    Math.ceil(Math.hypot(to.x - from.x, to.y - from.y)),
  );
  ctx.fillStyle = `rgba(255, 216, 74, ${String(strength * GLOW_SHARE)})`;
  for (let k = 0; k <= steps; k += 1) {
    const x = from.x + ((to.x - from.x) * k) / steps;
    const y = from.y + ((to.y - from.y) * k) / steps;
    ctx.fillRect(snap(x) - 1 / 2, snap(y) - 1 / 2, 2, 2);
  }
  ctx.fillStyle = `rgba(255, 244, 176, ${String(strength)})`;
  for (let k = 0; k <= steps; k += 1) {
    const x = from.x + ((to.x - from.x) * k) / steps;
    const y = from.y + ((to.y - from.y) * k) / steps;
    ctx.fillRect(snap(x), snap(y), 1, 1);
  }
}
