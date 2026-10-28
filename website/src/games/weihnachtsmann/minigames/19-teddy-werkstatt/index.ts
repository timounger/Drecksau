/**
 * Türchen 19 - Ein Bär für Pablo: teddy parts ride along the belt through
 * the Teddy-o-Mat; type the order of arrows shown above it to sew each bear
 * together before it reaches the end of the belt.
 *
 * @module
 * @remarks
 * {@link GOAL} bears to finish; the orders grow from three to six arrows and
 * the belt speeds up a little with every bear. A wrong arrow pushes the bear
 * a bit further along; a bear that reaches the end unfinished costs a heart.
 */
import type { Recipe } from "@/games/weihnachtsmann/audio/sounds";
import {
  drawFigure,
  drawGlow,
  drawHud,
  drawPanel,
  drawSprite,
  drawSpriteCentred,
  inside,
  loadSheet,
  type Box,
} from "../kit/draw";
import { createEffects } from "../kit/effects";
import { createRandom, type Random } from "../kit/random";
import {
  MINI_W,
  type MiniButton,
  type MiniDraw,
  type MiniEnv,
  type MiniGame,
  type MiniGameInstance,
  type MiniInput,
  type MiniStatus,
} from "../types";
import { SHEET_SRC, SPRITES, type SpriteName } from "./sprites";

/** Bears to finish. */
const GOAL = 10;

/** Hearts: bears that may fall off the belt unfinished. */
const LIVES = 3;

/** Arrows in the first order and in the last. */
const FIRST_LENGTH = 3;
const LAST_LENGTH = 6;

/** Seconds of belt per bear: a base plus a share per arrow. */
const BELT_BASE = 2.4;
const BELT_PER_KEY = 0.95;

/** The belt gets this much faster with every finished bear, as a share. */
const SPEED_UP = 0.025;

/** Where a bear comes in, and where the belt ends, logical px (its middle). */
const START_X = -14;
const END_X = 252;

/** How far a wrong arrow pushes the bear on, logical px. */
const PUSH = 18;

/** The belt's top edge, logical px. */
const BELT_Y = 118;

/** Seconds a finished bear flies to the sack, and the pause before the next. */
const FLIGHT = 0.6;
const PAUSE = 0.35;

/** Seconds a wrong key glows red. */
const BAD_FLASH = 0.3;

/** Seconds a touch key stays pressed down on screen. */
const PAD_FLASH = 0.12;

/** Seconds of cheering after the last bear before the result. */
const OUTRO = 1.2;

/** Bears closer to the end than this tremble, logical px. */
const DANGER = 40;

/** Size of one order key and the gap between two, logical px. */
const KEY_W = 16;
const KEY_GAP = 3;

/** Top of the order keys, logical px. */
const KEYS_Y = 23;

/** Sparks of a sewn part and of a finished bear, and how fast they fly. */
const PART_BURST = 6;
const SPARK_SPEED = 40;
const DONE_BURST = 20;

/** Where a bear's middle and top are above the belt, logical px. */
const TEDDY_MIDDLE = 14;
const TEDDY_TOP = 32;

/** Where Pablo's sack catches the bears, logical px. */
const SACK = { x: 291, y: 134 } as const;

/** Shake of a wrong arrow and of a lost bear, logical px. */
const SHAKE_SMALL = 2;
const SHAKE_BIG = 3;

/** The furs a bear can have, by sprite name. */
const FURS = ["Brown", "Honey", "Cream"] as const;

/** Stages of a bear on the sheet, 0 to 4. */
const STAGES = 4;

/** The four arrows: button, sprite name, touch key. */
const ARROWS: readonly {
  readonly button: MiniButton;
  readonly name: "Up" | "Down" | "Left" | "Right";
  readonly pad: Box;
}[] = [
  { button: "left", name: "Left", pad: { x: 114, y: 154, w: 28, h: 23 } },
  { button: "down", name: "Down", pad: { x: 146, y: 154, w: 28, h: 23 } },
  { button: "up", name: "Up", pad: { x: 146, y: 130, w: 28, h: 23 } },
  { button: "right", name: "Right", pad: { x: 178, y: 154, w: 28, h: 23 } },
];

/* eslint-disable @typescript-eslint/no-magic-numbers -- the sounds: pitches
   in Hz, times in seconds, loudness shares */
/** A stitch, higher with every arrow of the order. */
function stitch(index: number): Recipe {
  const pitch = 523 * Math.pow(2, (index * 2) / 12);
  return {
    tones: [
      ["square", pitch, pitch, 0.06, 0, 0.25],
      ["triangle", pitch * 2, pitch * 2, 0.05, 0.02, 0.2],
    ],
  };
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** The bear on the belt now. */
type Bear = {
  readonly fur: (typeof FURS)[number];
  readonly order: readonly number[];
  /** Arrows of the order done. */
  done: number;
  x: number;
  /** Logical px per second. */
  readonly speed: number;
  /** Seconds since it was finished, or -1 while on the belt. */
  flying: number;
};

/** The minigame behind gate 19. */
export const GAME: MiniGame = {
  number: 19,
  id: "teddy-werkstatt",
  title: "Ein Bär für Pablo",
  instructions: [
    "Pablo wünscht sich einen Teddy - und seine ganze Klasse auch!",
    "Auf dem Band kommen Teddy-Teile. Drück die Pfeile über der Maschine der Reihe nach, dann ist der Teddy fertig genäht.",
    `Schaffe ${String(GOAL)} Teddys. Fällt ein halber Teddy vom Band, kostet das ein Herz.`,
  ],
  controls: "Pfeile oder W A S D - oder die Pfeiltasten unten antippen.",
  ready: true,
  create: (env) => createRun(env.seed, env.sound),
};

/** One run. */
function createRun(seed: number, sound: MiniEnv["sound"]): MiniGameInstance {
  const random = createRandom(seed);
  const effects = createEffects(random);
  const sheet = loadSheet(SHEET_SRC);
  const pads = ARROWS.map(() => 0);
  let made = 0;
  let lives = LIVES;
  let bear: Bear | null = null;
  let waitLeft = PAUSE;
  let badLeft = 0;
  let workLeft = 0;
  let beltShift = 0;
  let outroLeft = -1;
  let ending: MiniStatus = "running";
  let status: MiniStatus = "running";

  const press = (arrow: number) => {
    pads[arrow] = PAD_FLASH;
    if (bear !== null && bear.flying < 0) {
      if (bear.order[bear.done] === arrow) {
        sound(stitch(bear.done));
        bear.done += 1;
        workLeft = PAD_FLASH * 2;
        effects.burst(bear.x, BELT_Y - TEDDY_MIDDLE, {
          count: PART_BURST,
          speed: SPARK_SPEED,
          colors: ["#ffffff", "#ffe27a"],
        });
        if (bear.done >= bear.order.length) {
          bear.flying = 0;
          made += 1;
          sound("coin");
          effects.burst(bear.x, BELT_Y - TEDDY_MIDDLE, { count: DONE_BURST });
          effects.float("Fertig!", bear.x, BELT_Y - TEDDY_TOP);
        }
      } else {
        badLeft = BAD_FLASH;
        bear.x += PUSH;
        sound("bump");
        effects.shake(SHAKE_SMALL);
      }
    }
  };

  const listen = (input: MiniInput) => {
    ARROWS.forEach((arrow, index) => {
      if (input.pressed.has(arrow.button)) {
        press(index);
      }
    });
    for (const tap of input.taps) {
      const hit = ARROWS.findIndex((arrow) => inside(arrow.pad, tap.x, tap.y));
      if (hit >= 0) {
        press(hit);
      }
    }
  };

  const move = (dt: number) => {
    if (bear === null) {
      waitLeft -= dt;
      if (waitLeft <= 0) {
        bear = newBear(random, made);
        sound("whoosh");
      }
    } else if (bear.flying >= 0) {
      bear.flying += dt;
      if (bear.flying >= FLIGHT) {
        sound("pop");
        effects.burst(SACK.x, SACK.y, { count: PART_BURST });
        bear = null;
        waitLeft = PAUSE;
        if (made >= GOAL) {
          ending = "won";
          outroLeft = OUTRO;
          sound("fanfare");
        }
      }
    } else {
      bear.x += bear.speed * dt;
      beltShift += bear.speed * dt;
      if (bear.x >= END_X) {
        lives -= 1;
        sound("splat");
        effects.shake(SHAKE_BIG);
        effects.burst(END_X, BELT_Y - TEDDY_MIDDLE, {
          count: DONE_BURST,
          colors: ["#a8703a", "#e8c8a0", "#ffffff"],
        });
        effects.float("Auweia!", END_X, BELT_Y - TEDDY_TOP, "#ff9a9a");
        bear = null;
        waitLeft = PAUSE * 2;
        if (lives <= 0) {
          ending = "lost";
          outroLeft = OUTRO;
        }
      }
    }
  };

  return {
    step(input, dt) {
      if (status === "running") {
        if (outroLeft >= 0) {
          outroLeft -= dt;
          status = outroLeft <= 0 ? ending : status;
        } else {
          listen(input);
          move(dt);
        }
      }
      badLeft = Math.max(0, badLeft - dt);
      workLeft = Math.max(0, workLeft - dt);
      pads.forEach((left, index) => {
        pads[index] = Math.max(0, left - dt);
      });
      effects.update(dt);
      return status;
    },
    draw(g) {
      const offset = effects.offset();
      g.ctx.save();
      g.ctx.translate(offset.x, offset.y);
      drawWorkshop(g, sheet, { bear, beltShift, working: workLeft > 0, made });
      g.ctx.restore();
      drawOrder(g, sheet, bear, badLeft > 0);
      drawPads(g, sheet, pads);
      effects.draw(g);
      drawHud(g, {
        score: made,
        goal: GOAL,
        scoreLabel: "Teddys",
        lives,
        maxLives: LIVES,
      });
    },
    summary() {
      return `${String(made)} von ${String(GOAL)} Teddys genäht.`;
    },
  };
}

/**
 * The next bear: its fur, its order of arrows and its speed.
 *
 * @param random - the run's random source
 * @param made - bears finished so far
 * @returns the bear, at the start of the belt
 */
function newBear(random: Random, made: number): Bear {
  const length = Math.round(
    FIRST_LENGTH + ((LAST_LENGTH - FIRST_LENGTH) * made) / (GOAL - 1),
  );
  const order: number[] = [];
  while (order.length < length) {
    const arrow = random.int(0, ARROWS.length);
    const triple =
      order.length >= 2 &&
      order[order.length - 1] === arrow &&
      order[order.length - 2] === arrow;
    if (!triple) {
      order.push(arrow);
    }
  }
  const seconds = (BELT_BASE + BELT_PER_KEY * length) * (1 - SPEED_UP * made);
  return {
    fur: random.pick(FURS),
    order,
    done: 0,
    x: START_X,
    speed: (END_X - START_X) / seconds,
    flying: -1,
  };
}

/** The sprite of a bear built as far as it is. */
function bearSprite(bear: Bear): SpriteName {
  const stage =
    bear.flying >= 0
      ? STAGES
      : Math.min(
          STAGES - 1,
          Math.floor((bear.done / bear.order.length) * STAGES),
        );
  return `teddy${bear.fur}${String(stage)}` as SpriteName;
}

/** What the workshop needs to know. */
type WorkshopState = {
  readonly bear: Bear | null;
  readonly beltShift: number;
  readonly working: boolean;
  readonly made: number;
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- scene layout and
   animation, picked by eye */
/** The wall, Balbo at the machine, the belt, the bear and Pablo's sack. */
function drawWorkshop(
  g: MiniDraw,
  sheet: HTMLImageElement,
  s: WorkshopState,
): void {
  const ctx = g.ctx;
  drawSprite(ctx, sheet, SPRITES.backdrop, 0, 0);
  g.text("Teddy-o-Mat", 155, 66.5, {
    size: 6,
    bold: true,
    align: "center",
    baseline: "middle",
    color: "#7a3a1a",
  });
  // Lamps on the hood blink while it sews.
  for (let k = 0; k < 7; k += 1) {
    const on = s.working
      ? (k + Math.floor(g.time * 20)) % 2 === 0
      : k === Math.floor(g.time * 2) % 7;
    if (on) {
      drawGlow(ctx, 90 + k * 20, 86, 7, "255, 240, 160", 0.6);
    }
  }
  // Balbo behind the belt, busy when a part is sewn on.
  drawFigure(
    ctx,
    g.art,
    "balbo",
    46,
    120,
    s.working ? "walk" : "idle",
    "down",
    s.working ? g.time * 14 : g.time * 1.6,
  );
  // The belt.
  const frame = Math.floor(s.beltShift / 2) % 4;
  const belt = SPRITES[`belt${String(frame)}` as SpriteName];
  for (let x = 0; x < 264; x += 16) {
    drawSprite(ctx, sheet, belt, x, BELT_Y - 1);
  }
  // Pablo's sack, with his name.
  drawSprite(ctx, sheet, SPRITES.sack, SACK.x - 19, SACK.y - 6);
  g.text("Pablo", SACK.x, SACK.y + 15.5, {
    size: 5,
    bold: true,
    align: "center",
    baseline: "middle",
    color: "#7a2a2a",
  });
  if (s.bear !== null) {
    const bear = s.bear;
    const rect = SPRITES[bearSprite(bear)];
    if (bear.flying >= 0) {
      const t = Math.min(1, bear.flying / FLIGHT);
      const x = bear.x + (SACK.x - bear.x) * t;
      const y =
        BELT_Y -
        TEDDY_MIDDLE +
        (SACK.y - BELT_Y + TEDDY_MIDDLE) * t -
        Math.sin(t * Math.PI) * 40;
      drawSpriteCentred(ctx, sheet, rect, x, y, 1 - t * 0.4, t * Math.PI * 2);
    } else {
      const tremble =
        END_X - bear.x < DANGER ? Math.round(Math.sin(g.time * 50)) / 2 : 0;
      drawSprite(
        ctx,
        sheet,
        rect,
        bear.x - rect[2] / 2 + tremble,
        BELT_Y - rect[3] + 2,
      );
    }
  }
}

/** The order above the machine: one key per arrow, done ones green. */
function drawOrder(
  g: MiniDraw,
  sheet: HTMLImageElement,
  bear: Bear | null,
  bad: boolean,
): void {
  if (bear !== null && bear.flying < 0) {
    const count = bear.order.length;
    const width = count * KEY_W + (count - 1) * KEY_GAP;
    const left = MINI_W / 2 - width / 2;
    drawPanel(g.ctx, {
      x: left - 6,
      y: KEYS_Y - 5,
      w: width + 12,
      h: KEY_W + 11,
    });
    bear.order.forEach((arrow, index) => {
      const x = left + index * (KEY_W + KEY_GAP);
      const current = index === bear.done;
      const bob = current && !bad ? Math.round(Math.sin(g.time * 8)) / 2 : 0;
      let cap: SpriteName = "key";
      if (index < bear.done) {
        cap = "keyDone";
      } else if (current && bad) {
        cap = "keyBad";
      }
      if (current) {
        drawGlow(g.ctx, x + KEY_W / 2, KEYS_Y + 8, 14, "255, 226, 122", 0.45);
      }
      const y = KEYS_Y + bob;
      drawSprite(g.ctx, sheet, SPRITES[cap], x, y);
      const glyph = SPRITES[`arrow${ARROWS[arrow].name}` as SpriteName];
      const lift = cap === "key" ? 0 : 2;
      drawSprite(g.ctx, sheet, glyph, x + 3, y + 3 + lift);
    });
  }
}

/** The four touch keys in the shape of a keyboard's arrow keys. */
function drawPads(
  g: MiniDraw,
  sheet: HTMLImageElement,
  pads: readonly number[],
): void {
  ARROWS.forEach((arrow, index) => {
    const down = pads[index] > 0;
    drawSprite(
      g.ctx,
      sheet,
      down ? SPRITES.padDown : SPRITES.pad,
      arrow.pad.x,
      arrow.pad.y,
    );
    const glyph = SPRITES[`bigArrow${arrow.name}` as SpriteName];
    drawSprite(
      g.ctx,
      sheet,
      glyph,
      arrow.pad.x + 6,
      arrow.pad.y + 2 + (down ? 2 : 0),
    );
  });
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
