/**
 * Türchen 22 - Die Flaschenpost: Jordi fishes at a hole in the sea ice; the
 * hook swings to and fro under the water, and one press sends it out.
 *
 * @module
 * @remarks
 * The line shoots out along the hook's swing and brings back the first thing
 * it touches. Fish {@link GOAL} message bottles before the clock runs out; an
 * old boot costs a life, a fish gives a few seconds more.
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
import { createRandom, type Random } from "../kit/random";
import {
  MINI_H,
  MINI_W,
  type MiniDraw,
  type MiniEnv,
  type MiniGame,
  type MiniGameInstance,
  type MiniStatus,
} from "../types";
import { SHEET_SRC, SPRITES, type SpriteName } from "./sprites";

/** Bottles to fish. */
const GOAL = 6;

/** Seconds on the clock. */
const TIME = 75;

/** Boots Jordi may fish up before the run is lost. */
const LIVES = 3;

/** Seconds a fish adds to the clock. */
const FISH_BONUS = 4;

/** Where the line enters the water: the middle of the ice hole, logical px. */
const PIVOT_X = 160;
const PIVOT_Y = 56;

/** The rod's tip, straight above the hole, logical px. */
const TIP_Y = 16;

/** Widest swing of the hook either side of straight down, radians. */
const SWING_MAX = 1.25;

/** Swing speed at the start and once nearly all bottles are in, radians per second. */
const SWING_SLOW = 1.7;
const SWING_FAST = 2.4;

/** Length of the line at rest under the hole, logical px. */
const REST = 10;

/** How fast the line shoots out, and comes back empty, logical px per second. */
const OUT_SPEED = 170;
const BACK_EMPTY = 230;

/** How fast each catch is reeled in, logical px per second. */
const REEL: Readonly<Record<ItemKind, number>> = {
  bottle: 110,
  boot: 80,
  fish: 140,
};

/** How close the hook must come to grab something, logical px. */
const GRAB = 8;

/** The hook comes back when it reaches this edge of the water, logical px. */
const EDGE = 4;
const FLOOR = 170;

/** Band of depths things swim in, logical px from the top. */
const DEPTH_TOP = 76;
const DEPTH_BOTTOM = 160;

/* eslint-disable @typescript-eslint/no-magic-numbers -- drift speeds of each
   kind, picked by playing */
/** Speeds sideways of each kind, slowest and fastest, logical px per second. */
const DRIFT: Readonly<Record<ItemKind, readonly [number, number]>> = {
  bottle: [8, 18],
  boot: [6, 14],
  fish: [22, 36],
};

/* eslint-enable @typescript-eslint/no-magic-numbers */

/** How many of each are in the water, and the boots once half the bottles are in. */
const COUNT: Readonly<Record<ItemKind, number>> = {
  bottle: 4,
  boot: 3,
  fish: 2,
};
const BOOTS_LATE = 4;

/** Things swim off this far past the edge before they turn up anew, logical px. */
const OFF = 16;

/** Bob of floating things: height, logical px, and speed, radians per second. */
const BOB = 2;
const BOB_RATE = 2.2;

/** Ambient bubbles rising from the sea floor at a time, and their speed. */
const BUBBLES = 10;
const BUBBLE_RISE = 14;

/** How long the letter shows after a bottle, seconds, and how high it climbs. */
const LETTER_TIME = 1.4;
const LETTER_RISE = 20;

/** Seconds between two clicks of the reel. */
const REEL_TICK = 0.33;

/** Shake on a boot, logical px. */
const SHAKE = 3;

/** Sparks of a caught bottle. */
const BOTTLE_BURST = 22;

/** Fish tail flaps per second. */
const FLAP = 6;

/** Jordi on the ice, left of the hole: feet, logical px. */
const JORDI_X = 136;
const JORDI_Y = 47;

/** The rod's top left, so its tip ends over the hole, logical px. */
const ROD_X = 140;
const ROD_Y = 14;

/** What the bottles' letters say, one picked per catch. */
const WISHES = [
  "Ein Schlitten, bitte!",
  "Viel Schnee!",
  "Ein Teddy für Pablo",
  "Frieden für alle",
  "Eine Gitarre!",
  "Mehr Kekse!",
  "Ein Hund wär toll",
  "Eine Eisenbahn",
] as const;

/* eslint-disable @typescript-eslint/no-magic-numbers -- the recipes: pitches
   in Hz, times in seconds, loudness shares */
/** A plop as the line dips into the water. */
const PLOP: Recipe = {
  tones: [["sine", 700, 220, 0.12, 0, 0.6]],
  noise: [[0.1, 0, 1400, 0.4]],
};

/** The reel clicking as a catch comes up. */
const REEL_SOUND: Recipe = {
  tones: [
    ["square", 1200, 1200, 0.02, 0, 0.15],
    ["square", 1200, 1200, 0.02, 0.07, 0.15],
    ["square", 1200, 1200, 0.02, 0.14, 0.15],
  ],
};

/** A bottle uncorked. */
const CORK: Recipe = {
  tones: [
    ["sine", 400, 900, 0.06, 0, 0.7],
    ["triangle", 1047, 1047, 0.12, 0.08, 0.5],
    ["triangle", 1319, 1319, 0.2, 0.16, 0.5],
  ],
};
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** What swims or drifts under the ice. */
type ItemKind = "bottle" | "boot" | "fish";

/** One thing in the water. */
type Item = {
  readonly kind: ItemKind;
  readonly sprite: SpriteName;
  x: number;
  y: number;
  vx: number;
  readonly phase: number;
};

/** What the hook does. */
type HookState = "swing" | "out" | "back";

/** A letter rising out of the hole. */
type Letter = { age: number };

/** A bubble rising. */
type Bubble = { x: number; y: number; readonly speed: number };

/** The minigame behind gate 22. */
export const GAME: MiniGame = {
  number: 22,
  id: "flaschenpost",
  title: "Die Flaschenpost",
  instructions: [
    "Jordi angelt am Eisloch nach Flaschenpost. Der Haken pendelt unter dem Eis hin und her.",
    `Wirf die Angel im richtigen Moment aus - sie holt das Erste, was sie berührt. Fische ${String(GOAL)} Flaschen!`,
    `Alte Stiefel kosten ein Herz, ein Fisch bringt ${String(FISH_BONUS)} Sekunden mehr.`,
  ],
  controls: "Leertaste oder Enter wirft aus - oder einfach antippen.",
  ready: true,
  create: (env) => createRun(env.seed, env.sound),
};

/** One run. */
function createRun(seed: number, sound: MiniEnv["sound"]): MiniGameInstance {
  const random = createRandom(seed);
  const effects = createEffects(random);
  const sheet = loadSheet(SHEET_SRC);
  const items: Item[] = [];
  const letters: Letter[] = [];
  const bubbles: Bubble[] = Array.from({ length: BUBBLES }, () => ({
    x: random.range(0, MINI_W),
    y: random.range(PIVOT_Y, MINI_H),
    speed: random.range(BUBBLE_RISE / 2, BUBBLE_RISE),
  }));
  let swingPhase = 0;
  let hook: HookState = "swing";
  let length = REST;
  let angle = 0;
  let held: Item | null = null;
  let bottles = 0;
  let lives = LIVES;
  let left = TIME;
  let reelTick = 0;
  let status: MiniStatus = "running";

  const hookAt = () => ({
    x: PIVOT_X + Math.sin(angle) * length,
    y: PIVOT_Y + Math.cos(angle) * length,
  });

  const fill = () => {
    const boots = bottles >= GOAL / 2 ? BOOTS_LATE : COUNT.boot;
    const want: Record<ItemKind, number> = { ...COUNT, boot: boots };
    for (const kind of ["bottle", "boot", "fish"] as const) {
      while (items.filter((item) => item.kind === kind).length < want[kind]) {
        items.push(spawn(random, kind));
      }
    }
  };
  fill();
  // A fresh field shows its things spread over the water, not at the edges.
  for (const item of items) {
    item.x = random.range(EDGE * 2, MINI_W - EDGE * 2);
  }

  const land = (item: Item) => {
    switch (item.kind) {
      case "bottle":
        bottles += 1;
        sound(CORK);
        letters.push({ age: 0 });
        effects.burst(PIVOT_X, PIVOT_Y - GRAB, { count: BOTTLE_BURST });
        effects.float(random.pick(WISHES), PIVOT_X, TIP_Y + GRAB, "#fff4c8");
        break;
      case "boot":
        lives -= 1;
        sound("bump");
        effects.shake(SHAKE);
        effects.float("Ein alter Stiefel!", PIVOT_X, TIP_Y + GRAB, "#ff9a9a");
        break;
      default:
        left += FISH_BONUS;
        sound("pop");
        effects.float(
          `+${String(FISH_BONUS)} s`,
          PIVOT_X,
          TIP_Y + GRAB,
          "#9ae8ff",
        );
    }
    items.splice(items.indexOf(item), 1);
    fill();
  };

  const moveHook = (dt: number, throwNow: boolean) => {
    switch (hook) {
      case "swing": {
        const rate =
          SWING_SLOW + ((SWING_FAST - SWING_SLOW) * bottles) / (GOAL - 1);
        swingPhase += rate * dt;
        angle = Math.sin(swingPhase) * SWING_MAX;
        if (throwNow) {
          hook = "out";
          sound("whoosh");
        }
        break;
      }
      case "out": {
        length += OUT_SPEED * dt;
        const at = hookAt();
        const caught = items.find(
          (item) => Math.hypot(item.x - at.x, item.y - at.y) < GRAB,
        );
        if (caught !== undefined) {
          held = caught;
          hook = "back";
          sound(PLOP);
          effects.burst(at.x, at.y, {
            colors: ["#c8ecff", "#ffffff"],
            count: 8,
            speed: 30,
            gravity: -40,
          });
        } else if (at.x < EDGE || at.x > MINI_W - EDGE || at.y > FLOOR) {
          hook = "back";
          sound("miss");
        }
        break;
      }
      default: {
        length -= (held === null ? BACK_EMPTY : REEL[held.kind]) * dt;
        reelTick -= dt;
        if (held !== null && reelTick <= 0) {
          reelTick = REEL_TICK;
          sound(REEL_SOUND);
        }
        if (length <= REST) {
          length = REST;
          hook = "swing";
          if (held !== null) {
            sound(PLOP);
            effects.burst(PIVOT_X, PIVOT_Y, {
              colors: ["#c8ecff", "#ffffff", "#7ac8ff"],
              count: 10,
              speed: 40,
            });
            land(held);
            held = null;
          }
        }
      }
    }
  };

  const moveWater = (dt: number) => {
    for (const item of items) {
      if (item !== held) {
        item.x += item.vx * dt;
        if (item.x < -OFF || item.x > MINI_W + OFF) {
          Object.assign(item, spawn(random, item.kind));
        }
      }
    }
    if (held !== null) {
      const at = hookAt();
      held.x = at.x;
      held.y = at.y;
    }
    for (const bubble of bubbles) {
      bubble.y -= bubble.speed * dt;
      if (bubble.y < PIVOT_Y) {
        bubble.y = MINI_H;
        bubble.x = random.range(0, MINI_W);
      }
    }
    for (const letter of letters) {
      letter.age += dt;
    }
    letters.splice(
      0,
      letters.filter((letter) => letter.age > LETTER_TIME).length,
    );
  };

  return {
    step(input, dt) {
      if (status === "running") {
        left -= dt;
        moveHook(dt, input.pressed.has("action") || input.taps.length > 0);
        moveWater(dt);
        if (bottles >= GOAL) {
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
      drawScene(g, sheet, {
        items,
        bubbles,
        letters,
        hook: hookAt(),
        angle,
        reeling: hook === "back" && held !== null,
      });
      g.ctx.restore();
      effects.draw(g);
      drawHud(g, {
        score: bottles,
        goal: GOAL,
        scoreLabel: "Flaschen",
        time: left,
        lives,
        maxLives: LIVES,
      });
    },
    summary() {
      return `${String(bottles)} von ${String(GOAL)} Flaschen geangelt.`;
    },
  };
}

/**
 * A new thing at one edge of the water, swimming inwards.
 *
 * @param random - the run's random source
 * @param kind - what it is
 * @returns the thing
 */
function spawn(random: Random, kind: ItemKind): Item {
  const fromLeft = random.chance(1 / 2);
  const [slow, fast] = DRIFT[kind];
  const speed = random.range(slow, fast);
  return {
    kind,
    sprite: spriteOf(random, kind),
    x: fromLeft ? -OFF / 2 : MINI_W + OFF / 2,
    y: random.range(DEPTH_TOP, DEPTH_BOTTOM),
    vx: fromLeft ? speed : -speed,
    phase: random.range(0, Math.PI * 2),
  };
}

/** Which picture a new thing gets. */
function spriteOf(random: Random, kind: ItemKind): SpriteName {
  let sprite: SpriteName;
  switch (kind) {
    case "bottle":
      sprite = random.pick(["bottleGreen", "bottleBlue"] as const);
      break;
    case "boot":
      sprite = "boot";
      break;
    default:
      sprite = random.pick(["fishOrange0", "fishSilver0"] as const);
  }
  return sprite;
}

/** What the scene needs to know. */
type SceneState = {
  readonly items: readonly Item[];
  readonly bubbles: readonly Bubble[];
  readonly letters: readonly Letter[];
  readonly hook: { readonly x: number; readonly y: number };
  readonly angle: number;
  readonly reeling: boolean;
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- scene layout and
   offsets, picked by eye */
/** The sea under the ice, the things in it, Jordi with his rod and the line. */
function drawScene(g: MiniDraw, sheet: HTMLImageElement, s: SceneState): void {
  const ctx = g.ctx;
  drawSprite(ctx, sheet, SPRITES.backdrop, 0, 0);
  for (const bubble of s.bubbles) {
    drawSprite(ctx, sheet, SPRITES.bubble, bubble.x - 2, bubble.y - 2);
  }
  for (const item of s.items) {
    drawItem(g, sheet, item, s.hook);
  }
  // Jordi on the ice; he leans back a little while reeling in.
  const lean = s.reeling ? Math.sin(g.time * 30) * 0.5 : 0;
  drawFigure(
    ctx,
    g.art,
    "jordi",
    JORDI_X + lean,
    JORDI_Y,
    "idle",
    "side",
    g.time * 1.5,
  );
  drawSprite(ctx, sheet, SPRITES.rod, ROD_X + lean, ROD_Y);
  // The line: from the tip down to the hole, then out to the hook.
  ctx.strokeStyle = "rgba(240, 248, 255, 0.85)";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(PIVOT_X + lean, TIP_Y);
  ctx.lineTo(PIVOT_X, PIVOT_Y);
  ctx.lineTo(s.hook.x, s.hook.y);
  ctx.stroke();
  drawSpriteCentred(ctx, sheet, SPRITES.hook, s.hook.x, s.hook.y, 1, -s.angle);
  // A faint guide of where the hook points while it swings.
  if (!s.reeling) {
    ctx.fillStyle = "rgba(200, 236, 255, 0.35)";
    for (let k = 1; k <= 4; k += 1) {
      const d = 10 + k * 7;
      ctx.fillRect(
        s.hook.x + Math.sin(s.angle) * d - 0.5,
        s.hook.y + Math.cos(s.angle) * d - 0.5,
        1,
        1,
      );
    }
  }
  for (const letter of s.letters) {
    const t = letter.age / LETTER_TIME;
    ctx.globalAlpha = Math.min(1, (1 - t) * 3);
    drawGlow(
      ctx,
      PIVOT_X,
      PIVOT_Y - 6 - t * LETTER_RISE,
      14,
      "255, 236, 160",
      0.4,
    );
    drawSpriteCentred(
      ctx,
      sheet,
      SPRITES.letter,
      PIVOT_X,
      PIVOT_Y - 6 - t * LETTER_RISE,
      1 + t * 0.4,
      Math.sin(t * 8) * 0.15,
    );
    ctx.globalAlpha = 1;
  }
}

/** One thing in the water, bobbing; fish flap and face where they swim. */
function drawItem(
  g: MiniDraw,
  sheet: HTMLImageElement,
  item: Item,
  hook: { readonly x: number; readonly y: number },
): void {
  const hooked = item.x === hook.x && item.y === hook.y;
  const bob = hooked ? 0 : Math.sin(g.time * BOB_RATE + item.phase) * BOB;
  let sprite = item.sprite;
  if (
    item.kind === "fish" &&
    Math.floor(g.time * FLAP + item.phase) % 2 === 1
  ) {
    sprite = sprite === "fishOrange0" ? "fishOrange1" : "fishSilver1";
  }
  const rect = SPRITES[sprite];
  if (item.kind === "bottle") {
    drawGlow(g.ctx, item.x, item.y + bob, 11, "255, 240, 170", 0.22);
  }
  if (item.kind === "fish") {
    drawSprite(
      g.ctx,
      sheet,
      rect,
      item.x - rect[2] / 2,
      item.y + bob - rect[3] / 2,
      item.vx < 0,
    );
  } else {
    drawSpriteCentred(
      g.ctx,
      sheet,
      rect,
      item.x,
      item.y + bob,
      1,
      hooked ? 0 : Math.sin(g.time * 1.3 + item.phase) * 0.3,
    );
  }
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
