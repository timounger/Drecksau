/**
 * Türchen 23 - Balbos Schlittenrennen: Balbo sleds down the mountain, seen
 * from above; dodge the firs, hop over logs, fly off ski jumps, pick up
 * presents and reach the finish before the clock runs out.
 *
 * @module
 * @remarks
 * The run is {@link LENGTH} logical px long and laid out from the seed in
 * rows, each with a guaranteed way through. Crashing costs time, nothing
 * else; every present adds {@link GIFT_BONUS} seconds.
 */
import {
  OBJECTS,
  type SpriteRect,
} from "@/games/weihnachtsmann/components/sprite-atlas";
import {
  drawFigure,
  drawHud,
  drawObject,
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
  type MiniStatus,
} from "../types";
import { SHEET_SRC, SPRITES, type SpriteName } from "./sprites";

/** Length of the run from start to finish, logical px. */
const LENGTH = 4600;

/** Seconds on the clock. */
const TIME = 60;

/** Seconds a present adds to the clock. */
const GIFT_BONUS = 1;

/** Where the sled is on the screen: its middle, logical px from the top. */
const SLED_Y = 52;

/** Downhill speed: cruising, tucked (down), braking (up), logical px per second. */
const SPEED = 110;
const SPEED_FAST = 140;
const SPEED_SLOW = 70;

/** How fast the speed changes, logical px per second squared. */
const ACCEL = 110;

/** Sideways speed at full steer, logical px per second, and how fast it is reached. */
const SIDE = 125;
const SIDE_EASE = 10;

/** The firs along both edges; the sled stays between them, logical px. */
const BANK = 26;

/** Half the sled's size for bumping into things, logical px. */
const SLED_HALF_W = 8;
const SLED_HALF_H = 11;

/** Seconds in the air after a hop and after a ski jump. */
const HOP = 0.6;
const JUMP = 1.2;

/** How much bigger the sled looks at the top of a hop and of a jump. */
const HOP_SCALE = 0.2;
const JUMP_SCALE = 0.45;

/** Seconds stunned after a crash, and blinking safe afterwards. */
const STUN = 0.8;
const SAFE = 1.4;

/** First row and the gap between rows, shortest and longest, logical px. */
const FIRST_ROW = 220;
const ROW_MIN = 62;
const ROW_MAX = 84;

/** No rows this close before the finish, logical px. */
const FINISH_CLEAR = 140;

/** Width of the way through a row, at the start and at the finish, logical px. */
const GAP_WIDE = 78;
const GAP_NARROW = 54;

/** How far the way through moves from row to row at most, logical px. */
const GAP_SHIFT = 70;

/** Chance a row is a line of logs to hop over, once the run has begun. */
const LOG_ROW = 0.14;

/** Chance of a ski jump, a present, and of flags at a row's way through. */
const RAMP_CHANCE = 0.14;
const GIFT_CHANCE = 0.45;
const FLAG_CHANCE = 0.3;

/** Things in a row beside its way through: fewest and most. */
const ROW_MIN_THINGS = 1;
const ROW_MAX_THINGS = 4;

/** Things in a row keep this far apart, logical px. */
const SPACING = 30;

/** Tries to place each thing of a row before giving up. */
const TRIES = 3;

/** Shares of logs and of small firs among a row's things (the rest are big firs). */
const LOG_SHARE = 0.25;
const SMALL_TREE_SHARE = 0.25;

/** Things of a row lie up to this far off its line, logical px. */
const JITTER = 10;

/** Floating texts start this far above what they belong to, logical px. */
const FLOAT_LIFT = 16;

/** Sizes for bumping: a fir's trunk, a log, a ski jump, a present, logical px. */
const TREE_HALF = 7;
const LOG_HALF_W = 14;
const LOG_HALF_H = 4;
const RAMP_HALF_W = 17;
const RAMP_HALF_H = 9;
const GIFT_HALF = 8;

/** Things are drawn while this far above or below the screen, logical px. */
const MARGIN = 60;

/** A taps this close to the sled makes it hop, logical px. */
const TAP_HOP = 30;

/** Track marks: how often one is laid, logical px of run, and how many stay. */
const TRACK_STEP = 4;
const TRACK_MAX = 120;

/** Runners' distance from the sled's middle, logical px. */
const RUNNER = 9;

/** Shake on a crash, logical px. */
const SHAKE = 3;

/** Sparks of a present and of a landing. */
const GIFT_BURST = 14;
const LAND_BURST = 10;

/** The side bar showing how far the run has come: place and size, logical px. */
const BAR_X = 312;
const BAR_TOP = 22;
const BAR_H = 150;

/** Blink speed while safe after a crash, per second. */
const BLINK = 14;

/** For showing a share as percent. */
const PERCENT = 100;

/** Turns of Balbo's spin after a crash. */
const SPIN_TURNS = 2;

/** What lies on the slope. */
type ThingKind =
  "tree" | "smallTree" | "log" | "ramp" | "gift" | "flagRed" | "flagBlue";

/** One thing on the slope, at a place along the run. */
type Thing = {
  readonly kind: ThingKind;
  readonly x: number;
  /** Distance along the run, logical px. */
  readonly at: number;
  readonly sprite: SpriteName | null;
  taken: boolean;
};

/** A runner mark on the snow. */
type Mark = { readonly x: number; readonly at: number };

/** The minigame behind gate 23. */
export const GAME: MiniGame = {
  number: 23,
  id: "schlittenrennen",
  title: "Balbos Schlittenrennen",
  instructions: [
    `Balbo rast den Berg hinunter - komm in ${String(TIME)} Sekunden ins Ziel!`,
    "Weich den Tannen aus und spring über Baumstämme. Von einer Schanze fliegst du sogar über Bäume.",
    `Jedes Geschenk bringt ${String(GIFT_BONUS)} Sekunde mehr.`,
  ],
  controls: "Pfeile lenken, Leertaste springt - oder mit dem Finger führen.",
  ready: true,
  create: (env) => createRun(env.seed, env.sound),
};

/** One run. */
function createRun(seed: number, sound: MiniEnv["sound"]): MiniGameInstance {
  const random = createRandom(seed);
  const effects = createEffects(random);
  const sheet = loadSheet(SHEET_SRC);
  const things = layOut(random);
  const marks: Mark[] = [];
  let x = MINI_W / 2;
  let vx = 0;
  let distance = 0;
  let speed = 0;
  let air = 0;
  let airLength = HOP;
  let airScale = HOP_SCALE;
  let stun = 0;
  let safe = 0;
  let gifts = 0;
  let left = TIME;
  let nextMark = 0;
  let status: MiniStatus = "running";

  const steer = (input: MiniInput, dt: number) => {
    let want = input.axisX * SIDE;
    if (input.axisX === 0 && input.pointerDown && input.pointer !== null) {
      want = Math.max(-SIDE, Math.min(SIDE, (input.pointer.x - x) * SIDE_EASE));
    }
    if (stun > 0) {
      want = 0;
    }
    vx += (want - vx) * Math.min(1, SIDE_EASE * dt);
    x = Math.max(BANK, Math.min(MINI_W - BANK, x + vx * dt));
    let target = SPEED;
    if (input.axisY > 0) {
      target = SPEED_FAST;
    } else if (input.axisY < 0) {
      target = SPEED_SLOW;
    }
    if (stun > 0) {
      target = 0;
    }
    speed +=
      Math.sign(target - speed) *
      Math.min(Math.abs(target - speed), ACCEL * dt);
    const hop =
      input.pressed.has("action") ||
      input.taps.some((tap) => Math.hypot(tap.x - x, tap.y - SLED_Y) < TAP_HOP);
    if (hop && air <= 0 && stun <= 0) {
      takeOff(HOP, HOP_SCALE);
      sound("jump");
    }
  };

  const takeOff = (seconds: number, scale: number) => {
    air = seconds;
    airLength = seconds;
    airScale = scale;
  };

  const crash = () => {
    stun = STUN;
    safe = STUN + SAFE;
    speed = 0;
    vx = 0;
    sound("bump");
    effects.shake(SHAKE);
    effects.burst(x, SLED_Y, {
      colors: ["#ffffff", "#d2ddef"],
      count: 18,
      speed: 60,
    });
    effects.float("Autsch!", x, SLED_Y - FLOAT_LIFT, "#ff9a9a");
  };

  const touch = () => {
    const jumping = air > 0;
    const big = jumping && airLength === JUMP;
    for (const thing of things) {
      const dy = thing.at - distance;
      if (!thing.taken && Math.abs(dy) < MARGIN) {
        const dx = Math.abs(thing.x - x);
        switch (thing.kind) {
          case "tree":
          case "smallTree":
            if (
              !big &&
              safe <= 0 &&
              dx < TREE_HALF + SLED_HALF_W &&
              Math.abs(dy) < TREE_HALF + SLED_HALF_H
            ) {
              crash();
            }
            break;
          case "log":
            if (
              !jumping &&
              safe <= 0 &&
              dx < LOG_HALF_W + SLED_HALF_W &&
              Math.abs(dy) < LOG_HALF_H + SLED_HALF_H
            ) {
              crash();
            }
            break;
          case "ramp":
            if (
              !jumping &&
              stun <= 0 &&
              dx < RAMP_HALF_W &&
              Math.abs(dy) < RAMP_HALF_H
            ) {
              takeOff(JUMP, JUMP_SCALE);
              sound("whoosh");
              effects.float("Sprung!", x, SLED_Y - FLOAT_LIFT, "#9ae8ff");
            }
            break;
          case "gift":
            if (
              dx < GIFT_HALF + SLED_HALF_W &&
              Math.abs(dy) < GIFT_HALF + SLED_HALF_H
            ) {
              thing.taken = true;
              gifts += 1;
              left += GIFT_BONUS;
              sound("coin");
              effects.burst(thing.x, SLED_Y + dy, { count: GIFT_BURST });
              effects.float(
                `+${String(GIFT_BONUS)} s`,
                thing.x,
                SLED_Y + dy - FLOAT_LIFT,
              );
            }
            break;
          default:
            // Flags only show the way.
            break;
        }
      }
    }
  };

  const fly = (dt: number) => {
    if (air > 0) {
      air -= dt;
      if (air <= 0) {
        sound("bump");
        effects.burst(x, SLED_Y + SLED_HALF_H, {
          colors: ["#ffffff", "#d2ddef"],
          count: LAND_BURST,
          speed: 40,
        });
      }
    }
    if (air <= 0 && distance >= nextMark) {
      nextMark = distance + TRACK_STEP;
      marks.push({ x, at: distance });
      marks.splice(0, Math.max(0, marks.length - TRACK_MAX));
    }
    if (air <= 0 && Math.abs(vx) > SIDE / 2 && speed > 0) {
      effects.burst(x - Math.sign(vx) * RUNNER, SLED_Y + SLED_HALF_H, {
        colors: ["#ffffff", "#eef3fa"],
        count: 1,
        speed: 30,
        life: 0.4,
      });
    }
  };

  return {
    step(input, dt) {
      if (status === "running") {
        left -= dt;
        stun -= dt;
        safe -= dt;
        steer(input, dt);
        distance += speed * dt;
        fly(dt);
        touch();
        if (distance >= LENGTH) {
          status = "won";
          sound("fanfare");
          effects.burst(x, SLED_Y, { count: 40, speed: 90 });
        } else if (left <= 0) {
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
      const height = air > 0 ? Math.sin((1 - air / airLength) * Math.PI) : 0;
      drawScene(g, sheet, {
        things,
        marks,
        distance,
        x,
        lift: height * airScale,
        spin: stun > 0 ? (1 - stun / STUN) * Math.PI * 2 * SPIN_TURNS : 0,
        blink: safe > 0 && stun <= 0 && Math.floor(g.time * BLINK) % 2 === 0,
      });
      g.ctx.restore();
      effects.draw(g);
      drawProgress(g, distance / LENGTH);
      drawHud(g, { score: gifts, scoreLabel: "Geschenke", time: left });
    },
    summary() {
      const share = Math.min(1, distance / LENGTH);
      return share >= 1
        ? `Im Ziel mit ${String(gifts)} Geschenken!`
        : `${String(Math.round(share * PERCENT))} Prozent der Strecke geschafft.`;
    },
  };
}

/**
 * Lays out the run: rows of firs and logs, each with a way through, and in
 * the way through now and then a ski jump, a present or a pair of flags.
 *
 * @param random - the run's random source
 * @returns everything on the slope, nearest first
 */
function layOut(random: Random): Thing[] {
  const things: Thing[] = [];
  const add = (
    kind: ThingKind,
    x: number,
    at: number,
    sprite: SpriteName | null = null,
  ) => {
    things.push({ kind, x, at, sprite, taken: false });
  };
  let gap = MINI_W / 2;
  let rows = 0;
  for (
    let at = FIRST_ROW;
    at < LENGTH - FINISH_CLEAR;
    at += random.range(ROW_MIN, ROW_MAX)
  ) {
    const share = at / LENGTH;
    const width = GAP_WIDE + (GAP_NARROW - GAP_WIDE) * share;
    const low = BANK + width / 2;
    const high = MINI_W - BANK - width / 2;
    gap = Math.max(
      low,
      Math.min(high, gap + random.range(-GAP_SHIFT, GAP_SHIFT)),
    );
    rows += 1;
    if (rows > 2 && random.chance(LOG_ROW)) {
      // A line of logs right across: hop!
      for (
        let lx = BANK + LOG_HALF_W;
        lx < MINI_W - BANK;
        lx += LOG_HALF_W * 2 + 2
      ) {
        add("log", lx, at, "log");
      }
    } else {
      const count = random.int(ROW_MIN_THINGS, ROW_MAX_THINGS + 1);
      const taken: number[] = [];
      for (let k = 0; k < count * TRIES && taken.length < count; k += 1) {
        const tx = random.range(BANK, MINI_W - BANK);
        const clear = Math.abs(tx - gap) > width / 2 + TREE_HALF;
        if (clear && taken.every((other) => Math.abs(other - tx) > SPACING)) {
          taken.push(tx);
          const roll = random.next();
          let kind: ThingKind = "tree";
          if (roll < LOG_SHARE) {
            kind = "log";
          } else if (roll < LOG_SHARE + SMALL_TREE_SHARE) {
            kind = "smallTree";
          }
          add(
            kind,
            tx,
            at + random.range(-JITTER, JITTER),
            kind === "log" ? "log" : null,
          );
        }
      }
      if (random.chance(RAMP_CHANCE) && rows > 2) {
        add("ramp", gap, at, "ramp");
      } else if (random.chance(GIFT_CHANCE)) {
        add(
          "gift",
          gap,
          at,
          random.pick(["giftRed", "giftBlue", "giftGreen"] as const),
        );
      }
      if (random.chance(FLAG_CHANCE)) {
        add("flagRed", gap - width / 2, at, "flagRed");
        add("flagBlue", gap + width / 2, at, "flagBlue");
      }
    }
  }
  return things;
}

/** What the scene needs to know. */
type SceneState = {
  readonly things: readonly Thing[];
  readonly marks: readonly Mark[];
  readonly distance: number;
  readonly x: number;
  /** How much bigger the sled looks in the air, 0 on the ground. */
  readonly lift: number;
  /** Balbo's spin after a crash, radians. */
  readonly spin: number;
  readonly blink: boolean;
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- scene layout and
   offsets, picked by eye */
/** The slope, the edge firs, everything on the run and Balbo on his sled. */
function drawScene(g: MiniDraw, sheet: HTMLImageElement, s: SceneState): void {
  const ctx = g.ctx;
  const scroll = ((s.distance % MINI_H) + MINI_H) % MINI_H;
  drawSprite(ctx, sheet, SPRITES.slope, 0, -scroll);
  drawSprite(ctx, sheet, SPRITES.slope, 0, MINI_H - scroll);
  // Runner tracks.
  ctx.fillStyle = "rgba(150, 170, 210, 0.55)";
  for (const mark of s.marks) {
    const y = SLED_Y + mark.at - s.distance + 10;
    ctx.fillRect(mark.x - RUNNER, y, 1, TRACK_STEP);
    ctx.fillRect(mark.x + RUNNER - 1, y, 1, TRACK_STEP);
  }
  // The finish line.
  const finishY = SLED_Y + LENGTH - s.distance;
  if (finishY < MINI_H + 40) {
    drawSprite(ctx, sheet, SPRITES.finish, MINI_W / 2 - 150, finishY - 30);
    g.text("ZIEL", MINI_W / 2, finishY - 17, {
      size: 9,
      bold: true,
      align: "center",
      baseline: "middle",
      color: "#fff8e0",
    });
  }
  // Flat things first, then everything standing, sorted by depth.
  const visible = s.things.filter((thing) => {
    const y = SLED_Y + thing.at - s.distance;
    return y > -MARGIN && y < MINI_H + MARGIN && !thing.taken;
  });
  for (const thing of visible.filter(
    (t) => t.kind === "ramp" || t.kind === "log",
  )) {
    const rect = SPRITES[thing.sprite ?? "log"];
    drawSprite(
      ctx,
      sheet,
      rect,
      thing.x - rect[2] / 2,
      SLED_Y + thing.at - s.distance - rect[3] / 2,
    );
  }
  const standing = visible.filter((t) => t.kind !== "ramp" && t.kind !== "log");
  const sledFeet = SLED_Y + SLED_HALF_H;
  let sledDrawn = false;
  const drawSled = () => {
    if (!sledDrawn) {
      sledDrawn = true;
      drawBalbo(g, sheet, s);
    }
  };
  for (const thing of [...standing].sort((a, b) => a.at - b.at)) {
    const y = SLED_Y + thing.at - s.distance;
    if (y > sledFeet && s.lift === 0) {
      drawSled();
    }
    drawStanding(g, sheet, thing, y);
  }
  drawSled();
  // The edge forests, scrolling with the slope.
  const rowGap = 26;
  const start = Math.floor((s.distance - SLED_Y - 40) / rowGap);
  for (let k = start; k < start + Math.ceil(MINI_H / rowGap) + 4; k += 1) {
    const y = SLED_Y + k * rowGap - s.distance;
    const wobble = ((k * 37) % 7) - 3;
    drawObject(ctx, g.art, "tree", -8 + wobble, y - 40);
    drawObject(ctx, g.art, "tree", MINI_W - 24 - wobble, y - 40 + 13);
  }
}

/** One standing thing: a fir, a present or a flag, with its foot at a height. */
function drawStanding(
  g: MiniDraw,
  sheet: HTMLImageElement,
  thing: Thing,
  y: number,
): void {
  const ctx = g.ctx;
  switch (thing.kind) {
    case "tree":
    case "smallTree": {
      const rect: SpriteRect = OBJECTS[thing.kind];
      ctx.fillStyle = "rgba(90, 110, 160, 0.25)";
      ctx.beginPath();
      ctx.ellipse(thing.x + 2, y + 1, rect[2] / 3, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      drawObject(
        ctx,
        g.art,
        thing.kind,
        thing.x - rect[2] / 2,
        y - rect[3] + 3,
      );
      break;
    }
    case "gift": {
      const bob = Math.sin(g.time * 4 + thing.x) * 1.5;
      drawSpriteCentred(
        ctx,
        sheet,
        SPRITES[thing.sprite ?? "giftRed"],
        thing.x,
        y - 4 + bob,
      );
      break;
    }
    default: {
      const rect = SPRITES[thing.sprite ?? "flagRed"];
      drawSprite(ctx, sheet, rect, thing.x - 2, y - rect[3] + 2);
    }
  }
}

/** Balbo on his sled: bigger in the air with a shadow below, spinning after a crash. */
function drawBalbo(g: MiniDraw, sheet: HTMLImageElement, s: SceneState): void {
  const ctx = g.ctx;
  const scale = 1 + s.lift;
  ctx.fillStyle = "rgba(80, 100, 150, 0.3)";
  ctx.beginPath();
  ctx.ellipse(
    s.x + s.lift * 14,
    SLED_Y + 6 + s.lift * 10,
    11,
    14,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  if (!s.blink) {
    ctx.save();
    ctx.translate(s.x, SLED_Y);
    ctx.scale(scale, scale);
    ctx.rotate(s.spin);
    drawSpriteCentred(ctx, sheet, SPRITES.sledBack, 0, 0);
    drawFigure(ctx, g.art, "balbo", 0, 8, "idle", "down", g.time * 2);
    drawSpriteCentred(ctx, sheet, SPRITES.sledFront, 0, 0);
    ctx.restore();
  }
}

/** The bar at the right edge: how far down the mountain Balbo has come. */
function drawProgress(g: MiniDraw, share: number): void {
  const ctx = g.ctx;
  ctx.fillStyle = "rgba(40, 30, 60, 0.35)";
  ctx.fillRect(BAR_X, BAR_TOP, 3, BAR_H);
  ctx.fillStyle = "#e8b830";
  ctx.fillRect(BAR_X, BAR_TOP, 3, BAR_H * Math.min(1, share));
  ctx.fillStyle = "#d8283a";
  ctx.fillRect(BAR_X - 2, BAR_TOP + BAR_H * Math.min(1, share) - 1, 7, 3);
  ctx.fillStyle = "#2a2a34";
  ctx.fillRect(BAR_X - 2, BAR_TOP + BAR_H, 7, 2);
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
