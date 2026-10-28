/**
 * Türchen 8 - Rudolf ist verschwunden: a hidden-picture hunt in the snowy
 * forest; Rudolf peeks out behind a bush or a drift among other reindeer -
 * only his red nose gives him away.
 *
 * @module
 * @remarks
 * Find Rudolf {@link GOAL} times before the clock runs out. Each find shuffles
 * the clearing anew with more decoys. A wrong reindeer costs
 * {@link WRONG_COST} seconds, an empty search {@link EMPTY_COST}; after a
 * while without a find Rudolf's nose starts to glow.
 */
import {
  drawFigure,
  drawGlow,
  drawHud,
  drawSprite,
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

/** Times Rudolf has to be found. */
const GOAL = 5;

/** Seconds on the clock. */
const TIME = 60;

/** Seconds lost for pointing at the wrong reindeer, and at nothing. */
const WRONG_COST = 3;
const EMPTY_COST = 1;

/** Seconds of a round after which Rudolf's nose starts to glow. */
const HINT_AFTER = 9;

/** Seconds Santa calls for Rudolf at the start of a round. */
const CALLOUT_TIME = 2.5;

/** Seconds between two searches. */
const SEARCH_GAP = 0.25;

/** Seconds Rudolf leaps for joy before the clearing changes. */
const LEAP_TIME = 1.1;

/** Seconds the heads take to rise at the start of a round. */
const RISE_TIME = 0.45;

/** How high Rudolf leaps, logical px. */
const LEAP_HEIGHT = 34;

/** The rows of hiding places: where their feet stand, logical px. */
// eslint-disable-next-line @typescript-eslint/no-magic-numbers -- the rows' foot lines on the backdrop
const ROWS: readonly number[] = [92, 128, 166];

/** Hiding places per row, their first middle and the step between. */
const PER_ROW = 5;
const FIRST_X = 36;
const STEP_X = 62;

/** How far a hiding place may stray from its slot, logical px. */
const JITTER = 9;

/** Slots in the front row left free for Santa, counted from the left. */
const SANTA_SLOTS = 1;

/** Share of slots that get a hiding place. */
const FILLED = 0.8;

/** Decoy heads in round one, and one more each round. */
const DECOYS_FIRST = 3;

/** Standing decoys in round one, and from which round a second comes. */
const STANDING_FIRST = 1;
const SECOND_STANDING_ROUND = 2;

/** Robins hopping about. */
const ROBINS = 3;

/** How deep a head sinks behind its cover in round one and last, logical px. */
const SINK_FIRST = 3;
const SINK_LAST = 5;

/** A head's hit circle: its middle above the head's foot, and its radius. */
const HEAD_MIDDLE = 13;
const HEAD_REACH = 11;

/** Heads stay this far inside their cover's edges, logical px. */
const HEAD_INSET = 14;

/** Height of a head picture, logical px. */
const HEAD_H = 27;

/** The lens: speed with keys (logical px per second) and glass middle. */
const LENS_SPEED = 150;
const GLASS = 10;

/** Chance per second that a head blinks. */
const BLINK_RATE = 0.5;

/** Seconds a blink lasts. */
const BLINK_TIME = 0.15;

/** Where Santa stands, logical px. */
const SANTA_X = 22;
const SANTA_Y = 176;

/** Bursts. */
const FOUND_BURST = 26;

/** Shake on a wrong pick, logical px. */
const SHAKE = 2;

/** Where each cover's rim really begins below its picture's top, logical px. */
const RIMS: Readonly<Partial<Record<SpriteName, number>>> = {
  bush: 5,
  holly: 5,
  drift: 7,
  rock: 4,
  log: 5,
};

/** The fur of each head, for the neck that leads down behind the cover. */
const FUR: Readonly<Partial<Record<SpriteName, string>>> = {
  rudolf: "#8a5a3a",
  deerA: "#8a5a3a",
  deerB: "#9a8470",
  deerC: "#6a4a34",
};

/** The neck: its width, how far it reaches down and up into the head. */
const NECK_W = 8;
const NECK_DOWN = 12;
const NECK_UP = 4;

/** The covers and the heads that can peek out of them. */
const COVERS: readonly SpriteName[] = ["bush", "holly", "drift", "rock", "log"];
const DECOY_HEADS: readonly (readonly [SpriteName, SpriteName])[] = [
  ["deerA", "deerABlink"],
  ["deerB", "deerBBlink"],
  ["deerC", "deerCBlink"],
];
const STANDERS: readonly (readonly [SpriteName, SpriteName])[] = [
  ["standA0", "standA1"],
  ["standB0", "standB1"],
];

/** A bush, drift, rock or log. */
type Cover = {
  readonly sprite: SpriteName;
  readonly x: number;
  readonly feet: number;
};

/** A reindeer head peeking over a cover. */
type Head = {
  readonly cover: Cover;
  readonly x: number;
  readonly sink: number;
  readonly rudolf: boolean;
  readonly frames: readonly [SpriteName, SpriteName];
  blink: number;
  /** Set when the head ducked away after a wrong pick. */
  gone: boolean;
};

/** A reindeer standing in the open. */
type Stander = {
  readonly x: number;
  readonly feet: number;
  readonly frames: readonly [SpriteName, SpriteName];
  readonly mirror: boolean;
};

/** A robin hopping on the snow. */
type Robin = { x: number; readonly feet: number; hop: number; mirror: boolean };

/** One arrangement of the clearing. */
type Clearing = {
  readonly covers: readonly Cover[];
  readonly heads: Head[];
  readonly standers: readonly Stander[];
  readonly robins: Robin[];
};

/** The minigame behind gate 8. */
export const GAME: MiniGame = {
  number: 8,
  id: "rudolf-verschwunden",
  title: "Rudolf ist verschwunden",
  instructions: [
    `Rudolf hat sich im Wald versteckt - zwischen lauter anderen Rentieren. Finde ihn ${String(GOAL)}-mal in ${String(TIME)} Sekunden.`,
    `Achte auf die rote Nase! Ein falsches Rentier kostet ${String(WRONG_COST)} Sekunden.`,
  ],
  controls:
    "Rudolf anklicken oder antippen - oder die Lupe mit den Pfeilen führen und Leertaste.",
  ready: true,
  create: (env) => createRun(env.seed, env.sound),
};

/** One run. */
function createRun(seed: number, sound: MiniEnv["sound"]): MiniGameInstance {
  const random = createRandom(seed);
  const effects = createEffects(random);
  const sheet = loadSheet(SHEET_SRC);
  let found = 0;
  let clearing = arrange(random, 0);
  let roundTime = 0;
  let leap = -1;
  let left = TIME;
  let cooldown = 0;
  let lensX = MINI_W / 2;
  let lensY = MINI_H / 2;
  let lastPointer: MiniPoint | null = null;
  let wrong = 0;
  let status: MiniStatus = "running";

  const headAt = (point: MiniPoint) =>
    // Front rows first: they stand before the back ones.
    [...clearing.heads]
      .filter((head) => !head.gone)
      .sort((a, b) => b.cover.feet - a.cover.feet)
      .find(
        (head) =>
          Math.hypot(
            point.x - head.x,
            point.y - (headFeet(head) - HEAD_MIDDLE),
          ) < HEAD_REACH,
      );

  const search = (point: MiniPoint) => {
    cooldown = SEARCH_GAP;
    const head = headAt(point);
    if (head?.rudolf === true) {
      found += 1;
      leap = 0;
      sound("coin");
      sound("jump");
      effects.burst(head.x, headFeet(head) - HEAD_MIDDLE, {
        count: FOUND_BURST,
      });
      effects.float("Gefunden!", head.x, headFeet(head) - HEAD_H - 2);
    } else if (head !== undefined) {
      head.gone = true;
      left -= WRONG_COST;
      wrong += 1;
      sound("miss");
      effects.shake(SHAKE);
      effects.float(
        `Nicht Rudolf! -${String(WRONG_COST)} s`,
        head.x,
        headFeet(head) - HEAD_H,
        "#ff9a9a",
      );
    } else {
      left -= EMPTY_COST;
      sound("bump");
      effects.burst(point.x, point.y, {
        colors: ["#ffffff", "#d2ddef"],
        count: 6,
        speed: 30,
      });
      effects.float(
        `-${String(EMPTY_COST)} s`,
        point.x,
        point.y - GLASS,
        "#c8d4f0",
      );
    }
  };

  const look = (input: MiniInput, dt: number) => {
    lensX = Math.max(
      0,
      Math.min(MINI_W, lensX + input.axisX * LENS_SPEED * dt),
    );
    lensY = Math.max(
      0,
      Math.min(MINI_H, lensY + input.axisY * LENS_SPEED * dt),
    );
    const p = input.pointer;
    if (
      p !== null &&
      (lastPointer === null || p.x !== lastPointer.x || p.y !== lastPointer.y)
    ) {
      lensX = p.x;
      lensY = p.y;
    }
    lastPointer = p;
    const tap = input.taps[input.taps.length - 1];
    if (tap !== undefined) {
      lensX = tap.x;
      lensY = tap.y;
    }
    if ((tap !== undefined || input.pressed.has("action")) && cooldown <= 0) {
      search({ x: lensX, y: lensY });
    }
  };

  return {
    step(input, dt) {
      if (status === "running") {
        left -= dt;
        cooldown -= dt;
        roundTime += dt;
        if (leap >= 0) {
          leap += dt;
          if (leap >= LEAP_TIME) {
            leap = -1;
            if (found < GOAL) {
              clearing = arrange(random, found);
              roundTime = 0;
              sound("whoosh");
            }
          }
        } else if (roundTime > RISE_TIME) {
          look(input, dt);
        }
        for (const head of clearing.heads) {
          head.blink -= dt;
          if (head.blink <= -1 && random.chance(BLINK_RATE * dt)) {
            head.blink = BLINK_TIME;
          }
        }
        for (const robin of clearing.robins) {
          robin.hop += dt;
          if (robin.hop > 1 && random.chance(dt)) {
            robin.hop = 0;
            robin.mirror = random.chance(1 / 2);
          }
          if (robin.hop < 1 / 2) {
            robin.x += (robin.mirror ? -1 : 1) * GLASS * dt;
          }
        }
        if (found >= GOAL && leap < 0) {
          status = "won";
        } else if (left <= 0) {
          left = 0;
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
        clearing,
        rise: Math.min(1, roundTime / RISE_TIME),
        leap,
        hint: roundTime > HINT_AFTER && leap < 0,
        callout: roundTime < CALLOUT_TIME && leap < 0,
      });
      effects.draw(g);
      g.ctx.restore();
      if (status === "running" && leap < 0) {
        drawSprite(g.ctx, sheet, SPRITES.lens, lensX - GLASS, lensY - GLASS);
      }
      drawHud(g, {
        score: found,
        goal: GOAL,
        scoreLabel: "Gefunden",
        time: left,
      });
    },
    summary() {
      const misses =
        wrong === 0 ? "ohne Verwechslung" : `${String(wrong)}-mal verwechselt`;
      return `Rudolf ${String(found)} von ${String(GOAL)}-mal gefunden, ${misses}.`;
    },
  };
}

/** Lays out the clearing for a round: covers, the decoys and Rudolf. */
function arrange(random: Random, round: number): Clearing {
  const covers: Cover[] = [];
  const open: { x: number; feet: number }[] = [];
  ROWS.forEach((feet, row) => {
    for (let k = 0; k < PER_ROW; k += 1) {
      const front = row === ROWS.length - 1;
      const x = FIRST_X + k * STEP_X + random.range(-JITTER, JITTER);
      if (front && k < SANTA_SLOTS) {
        // Santa stands here.
      } else if (random.chance(FILLED)) {
        covers.push({ sprite: random.pick(COVERS), x, feet });
      } else {
        open.push({ x, feet });
      }
    }
  });
  const share = round / (GOAL - 1);
  const sink = Math.round(SINK_FIRST + (SINK_LAST - SINK_FIRST) * share);
  const hiding = random.shuffle(covers).slice(0, DECOYS_FIRST + round + 1);
  const heads: Head[] = hiding.map((cover, index) => {
    const half = SPRITES[cover.sprite][2] / 2 - HEAD_INSET;
    return {
      cover,
      x: cover.x + random.range(-half, half),
      sink,
      rudolf: index === 0,
      frames:
        index === 0 ? ["rudolf", "rudolfBlink"] : random.pick(DECOY_HEADS),
      blink: -1,
      gone: false,
    };
  });
  const standers: Stander[] = random
    .shuffle(open)
    .slice(0, STANDING_FIRST + (round >= SECOND_STANDING_ROUND ? 1 : 0))
    .map((spot) => ({
      x: spot.x,
      feet: spot.feet,
      frames: random.pick(STANDERS),
      mirror: random.chance(1 / 2),
    }));
  const robins: Robin[] = Array.from({ length: ROBINS }, () => ({
    x: random.range(FIRST_X, MINI_W - FIRST_X),
    feet: random.pick(ROWS) + random.range(1, JITTER),
    hop: random.range(0, 1),
    mirror: random.chance(1 / 2),
  }));
  return { covers, heads, standers, robins };
}

/** Where a head's foot (its picture's bottom) sits, logical px. */
function headFeet(head: Head): number {
  return (
    head.cover.feet -
    SPRITES[head.cover.sprite][3] +
    (RIMS[head.cover.sprite] ?? 0) +
    head.sink
  );
}

/** What the scene needs to know. */
type SceneState = {
  readonly clearing: Clearing;
  /** How far the heads have risen, 0 to 1. */
  readonly rise: number;
  /** Seconds into Rudolf's leap, or -1. */
  readonly leap: number;
  readonly hint: boolean;
  readonly callout: boolean;
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- scene layout and
   motions, picked by eye */
/** The clearing row by row, back to front, and Santa calling. */
function drawScene(g: MiniDraw, sheet: HTMLImageElement, s: SceneState): void {
  const ctx = g.ctx;
  drawSprite(ctx, sheet, SPRITES.backdrop, 0, 0);
  for (const feet of ROWS) {
    for (const stander of s.clearing.standers.filter(
      (one) => one.feet === feet,
    )) {
      const rect =
        SPRITES[stander.frames[Math.floor(g.time * 1.2 + stander.x) % 2]];
      ctx.fillStyle = "rgba(90, 110, 160, 0.25)";
      ctx.beginPath();
      ctx.ellipse(stander.x, stander.feet - 1, 15, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      drawSprite(
        ctx,
        sheet,
        rect,
        stander.x - rect[2] / 2,
        stander.feet - rect[3],
        stander.mirror,
      );
    }
    for (const head of s.clearing.heads.filter(
      (one) =>
        one.cover.feet === feet && !one.gone && !(one.rudolf && s.leap >= 0),
    )) {
      const sprite = head.frames[head.blink > 0 ? 1 : 0];
      const rect = SPRITES[sprite];
      const lift = (1 - s.rise) * 14;
      const top = headFeet(head) - rect[3] + lift;
      ctx.fillStyle = FUR[head.frames[0]] ?? "#8a5a3a";
      ctx.fillRect(
        head.x - NECK_W / 2,
        top + rect[3] - NECK_UP,
        NECK_W,
        NECK_DOWN,
      );
      if (head.rudolf && s.hint) {
        drawGlow(
          ctx,
          head.x,
          top + 20,
          9 + Math.sin(g.time * 6) * 2,
          "255, 40, 40",
          0.6,
        );
      }
      drawSprite(ctx, sheet, rect, head.x - rect[2] / 2, top);
    }
    for (const cover of s.clearing.covers.filter((one) => one.feet === feet)) {
      const rect = SPRITES[cover.sprite];
      drawSprite(ctx, sheet, rect, cover.x - rect[2] / 2, cover.feet - rect[3]);
    }
    for (const robin of s.clearing.robins.filter(
      (one) => one.feet > feet - 30 && one.feet <= feet + 6,
    )) {
      const hop =
        robin.hop < 0.5 ? -Math.abs(Math.sin(robin.hop * Math.PI * 4)) * 3 : 0;
      drawFigure(
        ctx,
        g.art,
        "vogel",
        robin.x,
        robin.feet + hop,
        "idle",
        "side",
        g.time * 2,
        robin.mirror,
      );
    }
  }
  // Found: Rudolf leaps out of his hiding place, all of him.
  const found = s.clearing.heads.find((one) => one.rudolf);
  if (found !== undefined && s.leap >= 0) {
    const t = Math.min(1, s.leap / LEAP_TIME);
    const away = found.x < MINI_W / 2 ? 1 : -1;
    drawFigure(
      ctx,
      g.art,
      "rudolf",
      found.x + away * t * 24,
      headFeet(found) + 12 - Math.sin(t * Math.PI) * LEAP_HEIGHT,
      "fly",
      "side",
      g.time * 10,
      away < 0,
    );
  }
  drawFigure(
    ctx,
    g.art,
    "santa",
    SANTA_X,
    SANTA_Y,
    "idle",
    "side",
    g.time * 1.5,
  );
  if (s.callout) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
    ctx.beginPath();
    ctx.roundRect(4, SANTA_Y - 62, 64, 14, 3);
    ctx.moveTo(18, SANTA_Y - 48);
    ctx.lineTo(24, SANTA_Y - 43);
    ctx.lineTo(26, SANTA_Y - 48);
    ctx.fill();
    g.text("Rudolf, wo bist du?", 36, SANTA_Y - 55, {
      size: 6,
      bold: true,
      align: "center",
      baseline: "middle",
      color: "#5a2a1a",
    });
  }
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
