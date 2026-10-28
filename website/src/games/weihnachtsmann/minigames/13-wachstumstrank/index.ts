/**
 * Türchen 13 - Der Wachstumstrank: Jordi brews a growth potion for a little
 * fir tree. Pour each ingredient into the measuring glass and stop exactly
 * in the green band.
 *
 * @module
 * @remarks
 * Holding the button pours; letting go stops. Stopping inside the band adds
 * the ingredient to the cauldron and the tree grows a stage; stopping
 * outside it or letting the glass run over costs a heart and the same
 * ingredient is tried again with a new band. The band gets narrower and the
 * pouring faster with every ingredient.
 */
import type { Recipe } from "@/games/weihnachtsmann/audio/sounds";
import {
  drawEffect,
  drawFigure,
  drawGlow,
  drawHud,
  drawObject,
  drawSprite,
  drawSpriteCentred,
  loadSheet,
} from "../kit/draw";
import { createEffects } from "../kit/effects";
import { createRandom } from "../kit/random";
import type {
  MiniDraw,
  MiniEnv,
  MiniGame,
  MiniGameInstance,
  MiniInput,
  MiniStatus,
} from "../types";
import { SHEET_SRC, SPRITES, type SpriteName } from "./sprites";

/** Hearts: misses allowed. */
const LIVES = 3;

/** Seconds on the clock. */
const TIME = 90;

/** Portions of each ingredient, each measured on its own. */
const PORTIONS = 2;

/** How fast the glass fills, share of its height per second: first and last portion. */
const FILL_SLOW = 0.32;
const FILL_FAST = 0.5;

/** Height of the green band, share of the glass: first and last portion. */
const BAND_WIDE = 0.26;
const BAND_NARROW = 0.11;

/** The band's middle stays between these shares of the glass. */
const BAND_LOW = 0.3;
const BAND_HIGH = 0.88;

/** Letting go below this level only puts the bottle back, without a miss. */
const DRIBBLE = 0.04;

/** Inside this share of the band (round its middle) a pour is perfect. */
const PERFECT = 0.4;

/** Seconds the result of a pour shows, and the glass takes to empty. */
const JUDGE = 1.2;
const DRAIN = 0.6;

/** Seconds between two glugs while pouring. */
const GLUG_EVERY = 0.16;

/** Pitch of the glug at an empty and at a full glass, Hz. */
const GLUG_LOW = 220;
const GLUG_HIGH = 660;

/** How far the bottle tips when pouring, radians, and how fast, per second. */
const TIP = -2.05;
const TIP_EASE = 12;

/** Where the measuring glass stands (top left), logical px. */
const GLASS = { x: 172, y: 40 } as const;

/** The inside of the glass, relative to its top left, logical px. */
const INNER_LEFT = 5;
const INNER_RIGHT = 23;
const INNER_TOP = 7;
const INNER_BOTTOM = 118;

/** The bottle's pivot, and from there to its mouth, logical px. */
const BOTTLE = { x: 202, y: 26 } as const;
const NECK = 11;

/** Where the cauldron stands (top left), and its brew's middle, logical px. */
const CAULDRON = { x: 60, y: 118 } as const;
const BREW = { x: 92, y: 127 } as const;

/** Where the tree stands: middle of its picture, logical px. */
const TREE = { x: 270, y: 118 } as const;

/** How long the tree bounces after growing, seconds. */
const GROW_BOUNCE = 0.5;

/** Sparks when the tree grows and when a pour is good. */
const GROW_SPARKS = 24;
const POUR_SPARKS = 12;

/** Judgements float up from this far above the liquid, logical px. */
const FLOAT_LIFT = 9;

/** Shake on a miss, logical px. */
const SHAKE = 3;

/** One ingredient. */
type Ingredient = {
  readonly name: string;
  readonly bottle: SpriteName;
  readonly rgb: string;
};

/** The five ingredients, in brewing order. */
const INGREDIENTS: readonly Ingredient[] = [
  { name: "Schneeflockensirup", bottle: "bottleSnow", rgb: "190, 232, 255" },
  { name: "Sternenstaub", bottle: "bottleStar", rgb: "255, 216, 74" },
  { name: "Tannennadeltee", bottle: "bottleFir", rgb: "74, 200, 106" },
  { name: "Mondmilch", bottle: "bottleMoon", rgb: "200, 154, 255" },
  { name: "Beerenzauber", bottle: "bottleBerry", rgb: "255, 90, 122" },
];

/** The tree's pictures, smallest first. */
const TREE_STAGES: readonly SpriteName[] = [
  "tree0",
  "tree1",
  "tree2",
  "tree3",
  "tree4",
  "tree5",
];

/** Where a pour stands. */
type Phase = "wait" | "pour" | "good" | "bad";

/** The minigame behind gate 13. */
export const GAME: MiniGame = {
  number: 13,
  id: "wachstumstrank",
  title: "Der Wachstumstrank",
  instructions: [
    "Jordi braut einen Wachstumstrank für sein Tannenbäumchen.",
    "Gedrückt halten gießt ins Messglas - lass genau im grünen Bereich los. Jede Zutat kommt zweimal hinein.",
    `Alle ${String(INGREDIENTS.length)} Zutaten, und der Baum ist groß. Daneben oder übergelaufen kostet ein Herz.`,
  ],
  controls: "Leertaste oder Maus / Finger gedrückt halten, dann loslassen.",
  ready: true,
  create: (env) => createRun(env.seed, env.sound),
};

/** One run. */
function createRun(seed: number, sound: MiniEnv["sound"]): MiniGameInstance {
  const random = createRandom(seed);
  const effects = createEffects(random);
  const sheet = loadSheet(SHEET_SRC);
  let done = 0;
  let lives = LIVES;
  let left = TIME;
  let phase: Phase = "wait";
  let phaseTime = 0;
  let level = 0;
  let band = 0;
  let glug = 0;
  let tip = 0;
  let grown = GROW_BOUNCE;
  let brew = "120, 110, 150";
  let wasHeld = true;
  let status: MiniStatus = "running";

  let portion = 0;
  const share = () =>
    (done * PORTIONS + portion) / (INGREDIENTS.length * PORTIONS - 1);
  const bandHeight = () => BAND_WIDE + (BAND_NARROW - BAND_WIDE) * share();

  const newBand = () => {
    const half = bandHeight() / 2;
    band = random.range(BAND_LOW + half, BAND_HIGH - half);
  };
  newBand();

  const enter = (next: Phase) => {
    phase = next;
    phaseTime = 0;
  };

  const judge = () => {
    const off = Math.abs(level - band);
    const half = bandHeight() / 2;
    const top = glassY(level);
    if (level < DRIBBLE) {
      level = 0;
      enter("wait");
    } else if (off <= half) {
      enter("good");
      const perfect = off <= half * PERFECT;
      sound("coin");
      effects.burst(GLASS.x + INNER_RIGHT / 2, top, {
        count: POUR_SPARKS,
        colors: [`rgb(${INGREDIENTS[done].rgb})`, "#ffffff"],
        speed: 45,
      });
      effects.float(
        perfect ? "Perfekt!" : "Gut!",
        GLASS.x + INNER_RIGHT / 2,
        top - FLOAT_LIFT,
        perfect ? "#ffe27a" : "#e8f0ff",
      );
    } else {
      enter("bad");
      lives -= 1;
      sound("miss");
      effects.shake(SHAKE);
      effects.float(
        level > band ? "Zu viel!" : "Zu wenig!",
        GLASS.x + INNER_RIGHT / 2,
        top - FLOAT_LIFT,
        "#ff9a9a",
      );
    }
  };

  const pour = (input: MiniInput, dt: number) => {
    const held = input.held.has("action") || input.pointerDown;
    if (phase === "wait" && held && !wasHeld) {
      enter("pour");
      sound("whoosh");
    }
    if (phase === "pour") {
      if (held) {
        level += (FILL_SLOW + (FILL_FAST - FILL_SLOW) * share()) * dt;
        glug -= dt;
        if (glug <= 0) {
          glug = GLUG_EVERY;
          sound(glugAt(GLUG_LOW + (GLUG_HIGH - GLUG_LOW) * level));
        }
        if (level >= 1) {
          level = 1;
          judge();
          effects.float("Übergelaufen!", GLASS.x, GLASS.y, "#ff9a9a");
          sound("splat");
        }
      } else {
        judge();
      }
    }
    wasHeld = held;
  };

  const settle = () => {
    if (phase === "good" && phaseTime >= JUDGE) {
      brew = INGREDIENTS[done].rgb;
      level = 0;
      portion += 1;
      if (portion >= PORTIONS) {
        portion = 0;
        done += 1;
        grown = 0;
        sound("pop");
        effects.burst(TREE.x, TREE.y, { count: GROW_SPARKS });
        effects.float("Wächst!", TREE.x, TREE.y - TREE.y / 2);
      }
      if (done >= INGREDIENTS.length) {
        status = "won";
      } else {
        newBand();
        enter("wait");
      }
    } else if (phase === "bad" && phaseTime >= JUDGE) {
      level = 0;
      if (lives <= 0) {
        status = "lost";
      } else {
        newBand();
        enter("wait");
      }
    }
  };

  return {
    step(input, dt) {
      if (status === "running") {
        left -= dt;
        phaseTime += dt;
        pour(input, dt);
        if (phase === "good" && phaseTime > JUDGE - DRAIN) {
          level = Math.max(0, level - dt / DRAIN);
          if (Math.floor(phaseTime * POUR_SPARKS) % 2 === 0) {
            effects.burst(BREW.x, BREW.y, {
              count: 1,
              colors: [`rgb(${INGREDIENTS[done].rgb})`],
              speed: 30,
            });
          }
        }
        settle();
        if (status === "running" && left <= 0) {
          status = "lost";
        }
      }
      tip += ((phase === "pour" ? TIP : 0) - tip) * Math.min(1, TIP_EASE * dt);
      grown += dt;
      effects.update(dt);
      return status;
    },
    draw(g) {
      const shake = effects.offset();
      g.ctx.save();
      g.ctx.translate(shake.x, shake.y);
      drawKitchen(g, sheet, {
        done,
        portion,
        phase,
        phaseTime,
        level,
        band,
        bandHeight: bandHeight(),
        tip,
        grown,
        brew,
      });
      g.ctx.restore();
      effects.draw(g);
      drawHud(g, {
        score: done,
        goal: INGREDIENTS.length,
        scoreLabel: "Zutaten",
        time: left,
        lives,
        maxLives: LIVES,
      });
    },
    summary() {
      return done >= INGREDIENTS.length
        ? "Der Trank wirkt - das Bäumchen ist ein richtiger Weihnachtsbaum!"
        : `${String(done)} von ${String(INGREDIENTS.length)} Zutaten richtig abgemessen.`;
    },
  };
}

/** The height on the field of a level in the glass, logical px. */
function glassY(level: number): number {
  return GLASS.y + INNER_BOTTOM - level * (INNER_BOTTOM - INNER_TOP);
}

/* eslint-disable @typescript-eslint/no-magic-numbers -- the sound: pitch
   bend, time in seconds, loudness */
/** One glug of liquid, higher the fuller the glass. */
function glugAt(pitch: number): Recipe {
  return { tones: [["sine", pitch, pitch * 1.6, 0.07, 0, 0.5]] };
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** What the kitchen needs to know. */
type KitchenState = {
  readonly done: number;
  readonly portion: number;
  readonly phase: Phase;
  readonly phaseTime: number;
  readonly level: number;
  readonly band: number;
  readonly bandHeight: number;
  readonly tip: number;
  readonly grown: number;
  readonly brew: string;
};

/** What the hint under the glass says in each phase. */
const HINTS: Readonly<Record<Phase, string>> = {
  wait: "Gedrückt halten zum Gießen",
  pour: "Loslassen im grünen Bereich!",
  good: "Ab in den Kessel!",
  bad: "Ausgießen - noch mal!",
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- scene layout and
   offsets, picked by eye */
/** The kitchen: Jordi, cauldron and fire, the glass, the bottle, the tree. */
function drawKitchen(
  g: MiniDraw,
  sheet: HTMLImageElement,
  s: KitchenState,
): void {
  const ctx = g.ctx;
  drawSprite(ctx, sheet, SPRITES.backdrop, 0, 0);
  // The tree, bouncing after it grew.
  const bounce =
    s.grown < GROW_BOUNCE ? Math.sin((s.grown / GROW_BOUNCE) * Math.PI) : 0;
  const stage = TREE_STAGES[Math.min(s.done, TREE_STAGES.length - 1)];
  drawGlow(ctx, TREE.x, TREE.y + 20, 40, "255, 240, 160", 0.1 + bounce * 0.4);
  drawSpriteCentred(
    ctx,
    sheet,
    SPRITES[stage],
    TREE.x,
    TREE.y,
    1 + bounce * 0.08,
  );
  // Fire and cauldron with the brew and its bubbles.
  const flames = ["flame0", "flame1", "flame2"] as const;
  drawGlow(ctx, BREW.x, 160, 30, "255, 150, 60", 0.35);
  drawObject(ctx, g.art, flames[Math.floor(g.time * 8) % 3], BREW.x - 10, 147);
  drawSprite(ctx, sheet, SPRITES.cauldron, CAULDRON.x, CAULDRON.y);
  ctx.fillStyle = `rgb(${s.brew})`;
  ctx.beginPath();
  ctx.ellipse(BREW.x, BREW.y, 25, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  drawGlow(ctx, BREW.x, BREW.y - 2, 26, s.brew, 0.35);
  for (let k = 0; k < 5; k += 1) {
    const phase = (g.time * 0.9 + k * 0.37) % 1;
    const bx = BREW.x - 18 + ((k * 37) % 36);
    ctx.fillStyle = `rgba(255, 255, 255, ${String(0.6 * (1 - phase))})`;
    ctx.beginPath();
    ctx.arc(bx, BREW.y - phase * 10, 1 + phase * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  if (s.phase === "good" && s.phaseTime > JUDGE - 0.25) {
    const poofs = ["poof0", "poof1", "poof2"] as const;
    const frame = Math.min(2, Math.floor((s.phaseTime - JUDGE + 0.25) * 12));
    drawEffect(ctx, g.art, poofs[frame], BREW.x, BREW.y - 10);
  }
  // Jordi stirs (and hops when a pour is good).
  const hop = s.phase === "good" ? Math.abs(Math.sin(s.phaseTime * 9)) * 5 : 0;
  drawFigure(ctx, g.art, "jordi", 36, 166 - hop, "idle", "side", g.time * 2);
  // The glass: back, liquid, band, front.
  drawSprite(ctx, sheet, SPRITES.glassBack, GLASS.x, GLASS.y);
  const left = GLASS.x + INNER_LEFT;
  const width = INNER_RIGHT - INNER_LEFT;
  const ingredient = INGREDIENTS[Math.min(s.done, INGREDIENTS.length - 1)];
  const liquid = s.phase === "bad" ? "150, 140, 150" : ingredient.rgb;
  const top = glassY(s.level);
  if (s.level > 0) {
    ctx.fillStyle = `rgb(${liquid})`;
    ctx.fillRect(left, top, width, GLASS.y + INNER_BOTTOM - top);
    ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    ctx.fillRect(left, top, width, 1);
  }
  const bandTop = glassY(s.band + s.bandHeight / 2);
  const bandBottom = glassY(s.band - s.bandHeight / 2);
  const pulse = 0.25 + 0.12 * Math.sin(g.time * 6);
  ctx.fillStyle = `rgba(90, 240, 120, ${String(pulse)})`;
  ctx.fillRect(left, bandTop, width, bandBottom - bandTop);
  ctx.fillStyle = "#5af078";
  ctx.fillRect(GLASS.x + 1, bandTop, 26, 1);
  ctx.fillRect(GLASS.x + 1, bandBottom - 1, 26, 1);
  drawSprite(ctx, sheet, SPRITES.glassFront, GLASS.x, GLASS.y);
  // The bottle, tipping over the glass, and the stream.
  const mouthX = BOTTLE.x + Math.sin(s.tip) * NECK;
  const mouthY = BOTTLE.y - Math.cos(s.tip) * NECK;
  if (s.phase === "pour" && s.tip < TIP / 2) {
    ctx.fillStyle = `rgb(${ingredient.rgb})`;
    ctx.fillRect(mouthX - 1, mouthY, 2, top - mouthY);
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillRect(mouthX - 1, mouthY, 1 / 2, top - mouthY);
  }
  if (s.phase === "wait" || s.phase === "pour") {
    drawSpriteCentred(
      ctx,
      sheet,
      SPRITES[ingredient.bottle],
      BOTTLE.x,
      BOTTLE.y + (s.phase === "wait" ? Math.sin(g.time * 3) : 0),
      1,
      s.tip,
    );
  }
  g.text(
    `Zutat ${String(Math.min(s.done + 1, INGREDIENTS.length))}: ${ingredient.name} - Portion ${String(s.portion + 1)} von ${String(PORTIONS)}`,
    100,
    22,
    {
      size: 6,
      bold: true,
      align: "center",
      baseline: "middle",
      color: `rgb(${ingredient.rgb})`,
      outline: "#1a1030",
    },
  );
  g.text(HINTS[s.phase], GLASS.x + 14, 172, {
    size: 6,
    bold: true,
    align: "center",
    baseline: "middle",
    color: s.phase === "pour" ? "#9affb0" : "#fff4dc",
    outline: "#1a1030",
  });
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
