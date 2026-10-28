/**
 * Türchen 25 - Die längste Nacht: the sleigh flies over a sleeping village
 * and Santa drops presents; each one must fall straight into a chimney.
 *
 * @module
 * @remarks
 * A present falls straight down while the houses glide by underneath, so it
 * has to go before its chimney is below the sleigh. {@link HOUSES_TOTAL}
 * houses pass; bring presents to {@link NEED} of them. The sack holds
 * {@link SACK} presents.
 */
import type { Recipe } from "@/games/weihnachtsmann/audio/sounds";
import {
  drawFigure,
  drawGlow,
  drawHud,
  drawObject,
  drawSnowfall,
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
  type MiniStatus,
} from "../types";
import { SHEET_SRC, SPRITES, type SpriteName } from "./sprites";

/** Houses that pass below. */
const HOUSES_TOTAL = 20;

/** Houses that must get a present. */
const NEED = 15;

/** Presents in the sack. */
const SACK = 32;

/** The houses' pictures: body width plus eaves, roof rise, logical px (as drawn by the generator). */
const HOUSES: readonly {
  readonly dark: SpriteName;
  readonly lit: SpriteName;
  readonly width: number;
  readonly rise: number;
  readonly height: number;
}[] = [
  { dark: "house0", lit: "house0Lit", width: 78, rise: 22, height: 58 },
  { dark: "house1", lit: "house1Lit", width: 64, rise: 18, height: 66 },
  { dark: "house2", lit: "house2Lit", width: 92, rise: 26, height: 56 },
  { dark: "house3", lit: "house3Lit", width: 70, rise: 20, height: 76 },
];

/** Where the houses stand, logical px from the top. */
const GROUND_Y = 170;

/** The sleigh's runners: across and height, logical px, and its gentle bob. */
const SLEIGH_X = 84;
const SLEIGH_Y = 54;
const BOB = 3;
const BOB_RATE = 1.6;

/** Where a present leaves the sleigh, from the runners, logical px. */
const DROP_DX = -2;
const DROP_DY = -4;

/** Pull on a falling present, logical px per second squared. */
const GRAVITY = 150;

/** Seconds between two presents. */
const RELOAD = 0.35;

/** Flying speed at the first house and at the last, logical px per second. */
const SPEED_START = 50;
const SPEED_END = 72;

/** Space between two houses, smallest and largest, logical px. */
const GAP_MIN = 22;
const GAP_MAX = 50;

/** The first house's left edge, logical px ahead of the screen's left. */
const FIRST_HOUSE = 300;

/** A chimney sits this far in from a house's side at least, as a share of its width. */
const CHIMNEY_IN = 0.2;
const CHIMNEY_OUT = 0.38;

/** How far a chimney sticks out above the roof, least and most, logical px. */
const CHIMNEY_UP_MIN = 6;
const CHIMNEY_UP_MAX = 14;

/**
 * How far either side of a chimney's middle a present still goes down it - more
 * than the opening, so a near miss counts too - and the picture's half width,
 * logical px.
 */
const CATCH = 16;
const CHIMNEY_HALF = 7;

/** Seconds after the last house before a run with too few presents ends. */
const OUTRO = 0.6;

/** A house counts as gone once its chimney is this far left of the sleigh, logical px. */
const GONE = 40;

/** Smoke rising from chimneys: seconds between puffs, speed, lifetime. */
const PUFF_EVERY = 0.7;
const PUFF_RISE = 10;
const PUFF_LIFE = 2.4;

/** Parallax of the far hills. */
const HILLS_PARALLAX = 0.3;

/** Shake when a present misses, logical px. */
const SHAKE = 1.5;

/** Sparks of a hit. */
const HIT_BURST = 24;

/** Floating texts start this far above the chimney, logical px. */
const FLOAT_LIFT = 10;

/** Middle of the HUD bar, logical px, its letter size and its side gap. */
const HUD_MIDDLE = 7;
const HUD_TEXT = 8;
const HUD_MARGIN = 6;

/** The sack count turns red from here on. */
const SACK_LOW = 5;

/** Pictures of the presents. */
const PRESENTS: readonly SpriteName[] = [
  "presentRed",
  "presentBlue",
  "presentGreen",
  "presentPurple",
];

/** What the children say when a present arrives. */
const THANKS = [
  "Treffer!",
  "Danke!",
  "Hurra!",
  "Super!",
  "Frohe Weihnachten!",
] as const;

/* eslint-disable @typescript-eslint/no-magic-numbers -- the recipes: pitches
   in Hz, times in seconds, loudness shares */
/** A present tumbling down the chimney: a low rumble and a bright chime. */
const DOWN_THE_CHIMNEY: Recipe = {
  tones: [
    ["triangle", 300, 120, 0.25, 0, 0.6],
    ["triangle", 1047, 1047, 0.12, 0.2, 0.5],
    ["triangle", 1568, 1568, 0.25, 0.3, 0.45],
  ],
  noise: [[0.2, 0, 600, 0.4]],
};

/** Sleigh bells as a present goes. */
const BELLS: Recipe = {
  tones: [
    ["sine", 2093, 2093, 0.06, 0, 0.25],
    ["sine", 2637, 2637, 0.06, 0.05, 0.2],
  ],
};
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** One house of the village. */
type House = {
  readonly kind: number;
  /** Left edge in the village, logical px. */
  readonly x: number;
  /** The chimney's middle in the village, and its top, logical px. */
  readonly chimneyX: number;
  readonly chimneyTop: number;
  served: boolean;
  puffIn: number;
};

/** A present on its way down. */
type Present = {
  readonly sprite: SpriteName;
  /** Where it falls on the screen: it keeps the sleigh's speed, logical px. */
  readonly x: number;
  y: number;
  vy: number;
  spin: number;
};

/** A puff of smoke. */
type Puff = { x: number; y: number; age: number };

/** The minigame behind gate 25. */
export const GAME: MiniGame = {
  number: 25,
  id: "laengste-nacht",
  title: "Die längste Nacht",
  instructions: [
    "Der Schlitten fliegt über die schlafende Stadt. Wirf die Geschenke so ab, dass sie in die Schornsteine fallen!",
    "Ein Geschenk fällt gerade nach unten, die Häuser ziehen weiter - lass es also los, bevor der Schornstein unter dem Schlitten ist.",
    `${String(NEED)} von ${String(HOUSES_TOTAL)} Häusern müssen ein Geschenk bekommen.`,
  ],
  controls: "Leertaste oder Enter wirft ab - oder antippen.",
  ready: true,
  create: (env) => createRun(env.seed, env.sound),
};

/** One run. */
function createRun(seed: number, sound: MiniEnv["sound"]): MiniGameInstance {
  const random = createRandom(seed);
  const effects = createEffects(random);
  const sheet = loadSheet(SHEET_SRC);
  const houses = buildVillage(random);
  const presents: Present[] = [];
  const puffs: Puff[] = [];
  let scroll = 0;
  let clock = 0;
  let reload = 0;
  let sack = SACK;
  let served = 0;
  let outro = OUTRO;
  let status: MiniStatus = "running";

  const sleighY = () => SLEIGH_Y + Math.sin(clock * BOB_RATE) * BOB;

  const speed = () => {
    const last = houses[houses.length - 1].chimneyX;
    const share = Math.min(1, scroll / last);
    return SPEED_START + (SPEED_END - SPEED_START) * share;
  };

  const drop = () => {
    if (reload <= 0 && sack > 0) {
      reload = RELOAD;
      sack -= 1;
      presents.push({
        sprite: random.pick(PRESENTS),
        x: SLEIGH_X + DROP_DX,
        y: sleighY() + DROP_DY,
        vy: 0,
        spin: 0,
      });
      sound(BELLS);
    }
  };

  const land = (present: Present, before: number) => {
    let gone = false;
    for (const house of houses) {
      const info = HOUSES[house.kind];
      const screenX = house.chimneyX - scroll;
      const left = house.x - scroll;
      const inChimney = Math.abs(present.x - screenX) <= CATCH;
      if (
        inChimney &&
        before < house.chimneyTop &&
        present.y >= house.chimneyTop
      ) {
        gone = true;
        if (!house.served) {
          house.served = true;
          served += 1;
          effects.float(
            random.pick(THANKS),
            screenX,
            house.chimneyTop - FLOAT_LIFT,
          );
        } else {
          effects.float(
            "Hier war ich schon!",
            screenX,
            house.chimneyTop - FLOAT_LIFT,
            "#c8d4ff",
          );
        }
        sound(DOWN_THE_CHIMNEY);
        effects.burst(screenX, house.chimneyTop, { count: HIT_BURST });
      } else if (
        !gone &&
        Math.abs(present.x - screenX) <= CHIMNEY_HALF + 1 &&
        present.y >= house.chimneyTop
      ) {
        gone = true;
        miss(present);
      } else if (
        !gone &&
        present.x >= left &&
        present.x <= left + info.width &&
        present.y >= roofAt(house, present.x + scroll)
      ) {
        gone = true;
        miss(present);
      }
    }
    if (!gone && present.y >= GROUND_Y) {
      gone = true;
      miss(present);
    }
    return gone;
  };

  const miss = (present: Present) => {
    sound("splat");
    effects.shake(SHAKE);
    effects.burst(present.x, present.y, {
      colors: ["#ffffff", "#d2ddef"],
      count: 8,
      speed: 35,
    });
  };

  const smoke = (dt: number) => {
    for (const house of houses) {
      const screenX = house.chimneyX - scroll;
      house.puffIn -= dt;
      if (
        house.puffIn <= 0 &&
        screenX > -CHIMNEY_HALF &&
        screenX < MINI_W + CHIMNEY_HALF
      ) {
        house.puffIn = PUFF_EVERY * random.range(1, 2);
        if (house.served) {
          puffs.push({ x: house.chimneyX, y: house.chimneyTop - 2, age: 0 });
        }
      }
    }
    for (const puff of puffs) {
      puff.age += dt;
      puff.y -= PUFF_RISE * dt;
    }
    puffs.splice(0, puffs.filter((puff) => puff.age > PUFF_LIFE).length);
  };

  return {
    step(input, dt) {
      clock += dt;
      if (status === "running") {
        scroll += speed() * dt;
        reload -= dt;
        if (input.pressed.has("action") || input.taps.length > 0) {
          drop();
        }
        for (const present of [...presents]) {
          const before = present.y;
          present.vy += GRAVITY * dt;
          present.y += present.vy * dt;
          present.spin += dt;
          if (land(present, before)) {
            presents.splice(presents.indexOf(present), 1);
          }
        }
        smoke(dt);
        const ahead = houses.filter(
          (house) => !house.served && house.chimneyX - scroll > SLEIGH_X - GONE,
        ).length;
        const reachable = served + Math.min(ahead, sack + presents.length);
        if (served >= NEED) {
          status = "won";
        } else if (reachable < NEED && presents.length === 0) {
          outro -= dt;
          if (outro <= 0) {
            status = "lost";
          }
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
        houses,
        presents,
        puffs,
        scroll,
        sleighY: sleighY(),
        sack,
      });
      g.ctx.restore();
      effects.draw(g);
      drawHud(g, { score: served, goal: NEED, scoreLabel: "Häuser" });
      g.text(`Im Sack: ${String(sack)}`, MINI_W / 2, HUD_MIDDLE, {
        size: HUD_TEXT,
        bold: true,
        align: "center",
        baseline: "middle",
        color: sack > SACK_LOW ? "#e8f0ff" : "#ff9a9a",
      });
      const left = houses.filter(
        (house) => house.chimneyX - scroll > SLEIGH_X - GONE,
      ).length;
      g.text(`Noch ${String(left)} Häuser`, MINI_W - HUD_MARGIN, HUD_MIDDLE, {
        size: HUD_TEXT,
        bold: true,
        align: "right",
        baseline: "middle",
        color: "#e8f0ff",
      });
    },
    summary() {
      return `${String(served)} von ${String(HOUSES_TOTAL)} Häusern beschenkt.`;
    },
  };
}

/**
 * Builds the village: houses of every kind in a row with gaps, each with
 * its chimney somewhere on one side of the roof.
 *
 * @param random - the run's random source
 * @returns the houses, left to right
 */
function buildVillage(random: Random): House[] {
  const houses: House[] = [];
  let x = FIRST_HOUSE;
  for (let k = 0; k < HOUSES_TOTAL; k += 1) {
    const kind = random.int(0, HOUSES.length);
    const info = HOUSES[kind];
    const share = random.range(CHIMNEY_IN, CHIMNEY_OUT);
    const chimneyX =
      x + info.width * (random.chance(1 / 2) ? share : 1 - share);
    const top = GROUND_Y - info.height;
    const house: House = {
      kind,
      x,
      chimneyX,
      chimneyTop: 0,
      served: false,
      puffIn: random.range(0, PUFF_EVERY),
    };
    const roof = roofAt({ ...house, chimneyTop: top }, chimneyX);
    houses.push({
      ...house,
      chimneyTop: roof - random.range(CHIMNEY_UP_MIN, CHIMNEY_UP_MAX),
    });
    x += info.width + random.range(GAP_MIN, GAP_MAX);
  }
  return houses;
}

/**
 * Height of a house's roof at a place, logical px from the top.
 *
 * @param house - the house
 * @param x - the place in the village, logical px
 * @returns the roof's height there
 */
function roofAt(house: House, x: number): number {
  const info = HOUSES[house.kind];
  const half = info.width / 2;
  const top = GROUND_Y - info.height;
  return (
    top + (info.rise * Math.min(half, Math.abs(x - house.x - half))) / half
  );
}

/** What the scene needs to know. */
type SceneState = {
  readonly houses: readonly House[];
  readonly presents: readonly Present[];
  readonly puffs: readonly Puff[];
  readonly scroll: number;
  readonly sleighY: number;
  readonly sack: number;
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- scene layout and
   offsets, picked by eye */
/** The night sky, far hills, the village, the presents and the sleigh. */
function drawScene(g: MiniDraw, sheet: HTMLImageElement, s: SceneState): void {
  const ctx = g.ctx;
  drawSprite(ctx, sheet, SPRITES.sky, 0, 0);
  const hills = (s.scroll * HILLS_PARALLAX) % MINI_W;
  drawSprite(ctx, sheet, SPRITES.hills, -hills, 104);
  drawSprite(ctx, sheet, SPRITES.hills, MINI_W - hills, 104);
  for (const house of s.houses) {
    const info = HOUSES[house.kind];
    const x = house.x - s.scroll;
    if (x > -info.width - 10 && x < MINI_W + 10) {
      const top = GROUND_Y - info.height;
      drawSprite(
        ctx,
        sheet,
        SPRITES.chimney,
        house.chimneyX - s.scroll - CHIMNEY_HALF,
        house.chimneyTop,
      );
      if (house.served) {
        drawGlow(
          ctx,
          x + info.width / 2,
          top + info.height / 2 + 6,
          info.width * 0.7,
          "255, 200, 90",
          0.25,
        );
      }
      drawSprite(
        ctx,
        sheet,
        SPRITES[house.served ? info.lit : info.dark],
        x,
        top,
      );
    }
  }
  const ground = s.scroll % MINI_W;
  drawSprite(ctx, sheet, SPRITES.ground, -ground, GROUND_Y - 4);
  drawSprite(ctx, sheet, SPRITES.ground, MINI_W - ground, GROUND_Y - 4);
  for (const puff of s.puffs) {
    ctx.globalAlpha = Math.max(0, 0.8 * (1 - puff.age / PUFF_LIFE));
    drawSpriteCentred(
      ctx,
      sheet,
      SPRITES.smoke,
      puff.x - s.scroll + Math.sin(puff.age * 2) * 3,
      puff.y,
      1 + puff.age * 0.4,
    );
  }
  ctx.globalAlpha = 1;
  for (const present of s.presents) {
    drawSpriteCentred(
      ctx,
      sheet,
      SPRITES[present.sprite],
      present.x,
      present.y,
      1,
      Math.sin(present.spin * 9) * 0.4,
    );
  }
  drawSleigh(g, SLEIGH_X, s.sleighY, s.sack > 0);
  drawSnowfall(ctx, g.time, 24);
}

/** The sleigh with Santa and his sack, Rudolf flying ahead. */
function drawSleigh(g: MiniDraw, x: number, y: number, full: boolean): void {
  const ctx = g.ctx;
  if (full) {
    drawObject(ctx, g.art, "gifts", x - 28, y - 22);
  }
  drawFigure(ctx, g.art, "santa", x - 6, y - 9, "idle", "side");
  drawObject(ctx, g.art, "sleigh", x - 18, y - 24);
  const rx = x + 34;
  const ry = y - 6;
  drawGlow(ctx, rx + 14, ry - 19, 16, "255, 40, 40", 0.5);
  drawFigure(ctx, g.art, "rudolf", rx, ry, "fly", "side", g.time * 8);
  ctx.strokeStyle = "#e8b830";
  ctx.lineWidth = 1 / 2;
  ctx.beginPath();
  ctx.moveTo(x + 14, y - 14);
  ctx.lineTo(rx - 8, ry - 14);
  ctx.stroke();
  // A faint line of sparkles from the sack.
  ctx.fillStyle = "rgba(255, 236, 160, 0.6)";
  for (let k = 0; k < 3; k += 1) {
    const t = (g.time * 2 + k / 3) % 1;
    ctx.fillRect(
      x + DROP_DX - 6 - t * 20,
      y - 4 + Math.sin(t * 9 + k) * 2,
      1 / 2,
      1 / 2,
    );
  }
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
